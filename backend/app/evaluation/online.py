"""
Online evaluation: scores a sample of live knowledge-path answers for
faithfulness and context precision after the response has been sent.

Runs as a FastAPI background task, so it never adds latency to the user's
request. Results are logged as `online_eval` events under the request's
trace_id, which is how /observability/summary reports average scores and
links low-faithfulness answers back to the full trace.

Context recall is NOT computed here - it needs a reference answer, which
live traffic doesn't have. That's what the offline suite is for.
"""

import random

from app.config import Settings
from app.evaluation.metrics import context_precision, faithfulness
from app.logging_utils import RequestLogger


def should_evaluate(result: dict) -> bool:
    """Only grounded knowledge answers are scored; fallbacks have no claims to check."""
    if Settings.EVAL_ONLINE_SAMPLE_RATE <= 0:
        return False
    if result.get("intent") != "knowledge" or not result.get("is_context_relevant"):
        return False
    return random.random() < Settings.EVAL_ONLINE_SAMPLE_RATE


async def evaluate_live_turn(
    logger: RequestLogger, question: str, answer: str, contexts: list[str]
) -> None:
    try:
        faith = await faithfulness(question, answer, contexts)
        precision = await context_precision(question, contexts)
    except Exception as exc:
        logger.log("online_eval_error", error_type=type(exc).__name__, error=str(exc)[:500])
        return

    logger.log(
        "online_eval",
        faithfulness=faith.score,
        context_precision=precision.score,
        claims_total=len(faith.details),
        unsupported_claims=[d["claim"] for d in faith.details if not d.get("supported")],
    )
