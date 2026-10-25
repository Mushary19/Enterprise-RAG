"""
Aggregates the JSONL trace file into operational metrics: latency per
node, LLM token spend, router intent mix, retrieval/fallback rates, errors
and the online (sampled) faithfulness / context precision scores.

Used by GET /observability/summary, and runnable directly:

    uv run python -m app.observability.summary --last 200
"""

import argparse
import json
import math
from collections import Counter, defaultdict
from pathlib import Path
from statistics import mean
from typing import Iterable, Optional

from app.logging_utils import LOG_FILE_PATH


def load_events(path: Path = LOG_FILE_PATH) -> list[dict]:
    if not path.exists():
        return []

    events = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                events.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return events


def events_for_trace(trace_id: str, path: Path = LOG_FILE_PATH) -> list[dict]:
    return [e for e in load_events(path) if e.get("trace_id") == trace_id]


def _percentile(values: list[float], pct: float) -> Optional[float]:
    """Nearest-rank percentile - good enough for dashboards, no numpy needed."""
    if not values:
        return None
    ordered = sorted(values)
    index = max(0, min(len(ordered) - 1, math.ceil(pct / 100 * len(ordered)) - 1))
    return round(ordered[index], 2)


def _latency_stats(values: list[float]) -> dict:
    return {
        "count": len(values),
        "p50_ms": _percentile(values, 50),
        "p95_ms": _percentile(values, 95),
        "max_ms": round(max(values), 2) if values else None,
    }


def _mean(values: Iterable[Optional[float]]) -> Optional[float]:
    present = [v for v in values if v is not None]
    return round(mean(present), 4) if present else None


def summarize(events: list[dict], last_n_traces: Optional[int] = None) -> dict:
    # Keep only the most recent N traces, in file (chronological) order.
    trace_order = list(dict.fromkeys(e["trace_id"] for e in events if "trace_id" in e))
    if last_n_traces:
        keep = set(trace_order[-last_n_traces:])
        events = [e for e in events if e.get("trace_id") in keep]
        trace_order = trace_order[-last_n_traces:]

    by_event: dict[str, list[dict]] = defaultdict(list)
    for e in events:
        by_event[e.get("event", "")].append(e)

    # --- Latency -----------------------------------------------------------
    node_latencies: dict[str, list[float]] = defaultdict(list)
    for e in by_event["node_complete"]:
        node_latencies[e["node"]].append(e["latency_ms"])

    request_latencies = [e["elapsed_ms"] for e in by_event["request_complete"]]

    # --- LLM usage ---------------------------------------------------------
    tokens_by_node: dict[str, int] = Counter()
    llm_latencies = []
    for e in by_event["llm_call"]:
        tokens_by_node[e.get("node") or "unknown"] += e.get("total_tokens") or 0
        if e.get("latency_ms") is not None:
            llm_latencies.append(e["latency_ms"])

    llm_calls = by_event["llm_call"]
    total_tokens = sum(e.get("total_tokens") or 0 for e in llm_calls)

    # --- Knowledge path ----------------------------------------------------
    retrievals = by_event["retrieval_complete"]
    grades = by_event["grade_decision"]
    empty_retrievals = sum(1 for e in retrievals if not e.get("contexts_returned"))
    grader_rejections = sum(1 for e in grades if not e.get("relevant"))

    # --- Online evaluation (sampled live traffic) --------------------------
    online = by_event["online_eval"]

    # --- Errors ------------------------------------------------------------
    errors = Counter()
    for event_type in ("node_error", "llm_error", "online_eval_error"):
        for e in by_event[event_type]:
            errors[f"{event_type}:{e.get('node') or e.get('error_type', '')}"] += 1

    return {
        "traces": len(trace_order),
        "requests": len(by_event["query_received"]),
        "intent_distribution": dict(Counter(e.get("intent") for e in by_event["router_decision"])),
        "latency": {
            "end_to_end": _latency_stats(request_latencies),
            "by_node": {node: _latency_stats(v) for node, v in sorted(node_latencies.items())},
            "llm_call": _latency_stats(llm_latencies),
        },
        "llm": {
            "calls": len(llm_calls),
            "total_tokens": total_tokens,
            "avg_tokens_per_request": (
                round(total_tokens / len(request_latencies), 1) if request_latencies else None
            ),
            "tokens_by_node": dict(tokens_by_node.most_common()),
        },
        "retrieval": {
            "retrievals": len(retrievals),
            "empty_retrieval_rate": round(empty_retrievals / len(retrievals), 4) if retrievals else None,
            "avg_top_rerank_score": _mean(e.get("top_rerank_score") for e in retrievals),
            "fallback_rate": round(grader_rejections / len(grades), 4) if grades else None,
        },
        "online_eval": {
            "evaluated_turns": len(online),
            "avg_faithfulness": _mean(e.get("faithfulness") for e in online),
            "avg_context_precision": _mean(e.get("context_precision") for e in online),
            "low_faithfulness_traces": [
                e["trace_id"] for e in online
                if e.get("faithfulness") is not None and e["faithfulness"] < 0.7
            ][-20:],
        },
        "hitl": {
            "pending": len(by_event["hitl_pending"]),
            "resolved": dict(Counter(e.get("action") for e in by_event["hitl_resumed"])),
        },
        "errors": dict(errors),
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Summarize the RAG trace log.")
    parser.add_argument("--last", type=int, default=None, help="Only the most recent N traces.")
    parser.add_argument("--file", type=Path, default=LOG_FILE_PATH)
    args = parser.parse_args()
    print(json.dumps(summarize(load_events(args.file), args.last), indent=2))
