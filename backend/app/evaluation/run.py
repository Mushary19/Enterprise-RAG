"""
Offline RAG evaluation against a labelled question set.

    cd backend
    uv run python -m app.evaluation.run                   # all of test_queries.csv
    uv run python -m app.evaluation.run --limit 5          # quick smoke run
    uv run python -m app.evaluation.run --dataset my.csv --delay 2

For every question it runs the real knowledge path (rewrite_query ->
retrieve -> grade_documents -> generate/fallback, same node code as
production) and scores it on faithfulness, context precision and context
recall. It also asks the live router what it would have done with the
question, so misroutes show up as a column rather than silently skipping
the knowledge path in production.

Output (under eval_results/<timestamp>/):
    results.csv    one row per question - scores, latency, tokens, flags
    results.json   same, plus per-claim / per-chunk judge verdicts
    summary.json   means overall and by query_type / difficulty
    trace.jsonl    full node/LLM trace for the run (separate from prod logs)

Dataset columns: query, expected_answer_summary (the reference answer),
plus optional query_type, difficulty, expected_chunk_ids, notes.
"""

from pathlib import Path

from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parents[3]
BACKEND_ROOT = Path(__file__).resolve().parents[2]

# Must run before any app.* import: app.config reads env vars at import time.
load_dotenv(dotenv_path=REPO_ROOT / ".env.local")

import argparse  # noqa: E402
import asyncio  # noqa: E402
import csv  # noqa: E402
import json  # noqa: E402
import time  # noqa: E402
from collections import defaultdict  # noqa: E402
from datetime import datetime  # noqa: E402
from statistics import mean  # noqa: E402
from typing import Optional  # noqa: E402

from langchain_core.messages import HumanMessage  # noqa: E402

from app.database.session import AsyncSessionLocal  # noqa: E402
from app.evaluation.metrics import context_precision, context_recall, faithfulness  # noqa: E402
from app.graphs.router_node import route_intent_node  # noqa: E402
from app.logging_utils import RequestLogger  # noqa: E402
from app.observability import LLMUsageCallback  # noqa: E402
from app.rag.graph import build_knowledge_graph  # noqa: E402

METRICS = ("faithfulness", "context_precision", "context_recall")


def load_dataset(path: Path, limit: Optional[int]) -> list[dict]:
    with open(path, newline="", encoding="utf-8") as f:
        rows = [r for r in csv.DictReader(f) if (r.get("query") or "").strip()]
    return rows[:limit] if limit else rows


async def evaluate_row(graph, row: dict, trace_path: Path) -> dict:
    question = row["query"].strip()
    reference = (row.get("expected_answer_summary") or "").strip()

    logger = RequestLogger(log_path=trace_path)
    usage = LLMUsageCallback(logger)
    logger.log("eval_query", query=question)

    record = {
        "query": question,
        "query_type": row.get("query_type", ""),
        "difficulty": row.get("difficulty", ""),
        "reference": reference,
        "trace_id": logger.trace_id,
        "error": None,
    }

    async with AsyncSessionLocal() as db:
        config = {
            "configurable": {"db_session": db, "logger": logger},
            "callbacks": [usage],
            "metadata": {"trace_id": logger.trace_id, "eval": True},
            "run_name": "offline_eval",
        }
        state = {"user_query": question, "messages": [HumanMessage(content=question)]}

        try:
            routed = await route_intent_node(state, config)
            start = time.perf_counter()
            result = await graph.ainvoke(state, config=config)
            pipeline_ms = round((time.perf_counter() - start) * 1000, 2)
        except Exception as exc:
            record["error"] = f"pipeline: {type(exc).__name__}: {exc}"
            return record

    contexts = result.get("retrieved_contexts") or []
    answered = bool(result.get("is_context_relevant"))
    answer = result.get("generation", "")

    record.update(
        {
            "routed_intent": routed["intent"],
            "search_query": result.get("search_query", ""),
            "contexts_retrieved": len(contexts),
            "answered": answered,
            "answer": answer,
            "latency_ms": pipeline_ms,
            "pipeline_llm_calls": usage.calls,
            "pipeline_tokens": usage.total_tokens,
        }
    )

    # Faithfulness is judged against what the generator was actually shown.
    # A fallback answer was generated with no context and makes no claims,
    # so it is "not applicable" rather than "unfaithful".
    try:
        faith = await faithfulness(question, answer, contexts) if answered else None
        precision = await context_precision(question, contexts, reference=reference or None)
        recall = await context_recall(question, contexts, reference) if reference else None
    except Exception as exc:
        record["error"] = f"judge: {type(exc).__name__}: {exc}"
        return record

    for name, metric in zip(METRICS, (faith, precision, recall)):
        record[name] = metric.score if metric else None
        record[f"{name}_details"] = metric.details if metric else []

    logger.log(
        "eval_scores",
        **{name: record[name] for name in METRICS},
        answered=answered,
        routed_intent=routed["intent"],
    )
    return record


def _avg(records: list[dict], key: str) -> Optional[float]:
    values = [r[key] for r in records if r.get(key) is not None]
    return round(mean(values), 4) if values else None


def _group_summary(records: list[dict]) -> dict:
    ok = [r for r in records if not r["error"]]
    return {
        "n": len(records),
        "errors": len(records) - len(ok),
        **{metric: _avg(ok, metric) for metric in METRICS},
        "answer_rate": round(sum(r["answered"] for r in ok) / len(ok), 4) if ok else None,
        "router_knowledge_rate": (
            round(sum(r["routed_intent"] == "knowledge" for r in ok) / len(ok), 4) if ok else None
        ),
        "avg_latency_ms": _avg(ok, "latency_ms"),
        "avg_pipeline_tokens": _avg(ok, "pipeline_tokens"),
    }


def summarize(records: list[dict]) -> dict:
    summary = {"overall": _group_summary(records)}
    for dimension in ("query_type", "difficulty"):
        groups = defaultdict(list)
        for r in records:
            groups[r.get(dimension) or "unlabelled"].append(r)
        summary[f"by_{dimension}"] = {k: _group_summary(v) for k, v in sorted(groups.items())}
    return summary


def write_outputs(out_dir: Path, records: list[dict], summary: dict) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)

    with open(out_dir / "results.json", "w") as f:
        json.dump(records, f, indent=2, default=str)

    with open(out_dir / "summary.json", "w") as f:
        json.dump(summary, f, indent=2)

    flat_fields = [
        "query", "query_type", "difficulty", "routed_intent", "answered",
        *METRICS, "contexts_retrieved", "latency_ms", "pipeline_tokens",
        "search_query", "answer", "reference", "trace_id", "error",
    ]
    with open(out_dir / "results.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=flat_fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(records)


def print_report(records: list[dict], summary: dict) -> None:
    def fmt(v):
        return "  n/a" if v is None else f"{v:5.2f}"

    print("\n" + "=" * 96)
    print(f"{'query':<52} {'faith':>6} {'prec':>6} {'recall':>6}  answered  route")
    print("-" * 96)
    for r in records:
        if r["error"]:
            print(f"{r['query'][:52]:<52}  ERROR: {r['error'][:36]}")
            continue
        print(
            f"{r['query'][:52]:<52} {fmt(r['faithfulness']):>6} {fmt(r['context_precision']):>6} "
            f"{fmt(r['context_recall']):>6}  {str(r['answered']):<8}  {r['routed_intent']}"
        )

    print("=" * 96)
    print("OVERALL")
    for key, value in summary["overall"].items():
        print(f"  {key:<24} {value}")
    print("\nBY QUERY TYPE")
    for group, stats in summary["by_query_type"].items():
        print(
            f"  {group:<14} n={stats['n']:<3} faith={fmt(stats['faithfulness'])} "
            f"prec={fmt(stats['context_precision'])} recall={fmt(stats['context_recall'])}"
        )


async def main() -> None:
    parser = argparse.ArgumentParser(description="Offline RAG evaluation.")
    parser.add_argument("--dataset", type=Path, default=REPO_ROOT / "test_queries.csv")
    parser.add_argument("--limit", type=int, default=None, help="Only the first N questions.")
    parser.add_argument("--delay", type=float, default=0.0, help="Seconds between questions (rate limits).")
    parser.add_argument("--out", type=Path, default=None, help="Output directory.")
    args = parser.parse_args()

    out_dir = args.out or BACKEND_ROOT / "eval_results" / datetime.now().strftime("%Y%m%d-%H%M%S")
    rows = load_dataset(args.dataset, args.limit)
    print(f"Evaluating {len(rows)} questions from {args.dataset} -> {out_dir}")

    graph = build_knowledge_graph().compile()
    records = []
    for i, row in enumerate(rows, start=1):
        print(f"[{i}/{len(rows)}] {row['query']}")
        records.append(await evaluate_row(graph, row, out_dir / "trace.jsonl"))
        if args.delay and i < len(rows):
            await asyncio.sleep(args.delay)

    summary = summarize(records)
    write_outputs(out_dir, records, summary)
    print_report(records, summary)
    print(f"\nWrote {out_dir}")


if __name__ == "__main__":
    asyncio.run(main())
