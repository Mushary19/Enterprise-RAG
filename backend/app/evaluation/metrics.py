"""
RAG quality metrics, scored by an LLM judge (RAGAS-style, implemented
directly so it runs on the same Groq model with no extra dependencies).

    faithfulness       - Is every claim in the ANSWER supported by the
                         retrieved context? (catches hallucination)
    context_precision  - Are the retrieved CHUNKS relevant, and are the
                         relevant ones ranked first? (catches noisy retrieval)
    context_recall     - Does the retrieved context contain everything
                         the REFERENCE answer needs? (catches missed chunks)

faithfulness and context_precision need no ground truth, so they also run
on sampled live traffic (app/evaluation/online.py). context_recall needs a
reference answer, so it only runs offline (app/evaluation/run.py).

Every metric returns a `MetricResult` with the per-claim / per-chunk
verdicts alongside the score, so a low score can be explained, not just
reported. See docs/EVALUATION_AND_OBSERVABILITY.md for the formulas.
"""

from dataclasses import dataclass, field
from typing import Optional

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from pydantic import BaseModel, Field

from app.config import Settings

judge_llm = ChatGroq(
    groq_api_key=Settings.GROQ_API_KEY,
    model_name=Settings.EVAL_JUDGE_MODEL,
    temperature=0.0,
    # Evaluation fires many calls back-to-back; ride out Groq 429s.
    max_retries=6,
)

JUDGE_SYSTEM_PROMPT = (
    "You are a strict, impartial evaluator of a retrieval-augmented question "
    "answering system. Judge only against the text you are given - never use "
    "outside knowledge to decide that something is supported."
)


@dataclass
class MetricResult:
    # None means "not applicable" (e.g. faithfulness of an answer that makes
    # no factual claims), which is different from a score of 0.
    score: Optional[float]
    details: list[dict] = field(default_factory=list)


def _format_contexts(contexts: list[str]) -> str:
    return "\n\n".join(f"[Context {i + 1}]\n{c}" for i, c in enumerate(contexts))


async def _judge(schema: type[BaseModel], prompt: str) -> BaseModel:
    structured = judge_llm.with_structured_output(schema)
    return await structured.ainvoke(
        [SystemMessage(content=JUDGE_SYSTEM_PROMPT), HumanMessage(content=prompt)]
    )


# --- Faithfulness ----------------------------------------------------------


class Claims(BaseModel):
    claims: list[str] = Field(
        description="Atomic, self-contained factual claims made by the answer."
    )


class ClaimVerdict(BaseModel):
    claim: str
    supported: bool = Field(description="True only if the context states or directly entails the claim.")
    reason: str = Field(description="One short sentence citing the context, or what is missing.")


class ClaimVerdicts(BaseModel):
    verdicts: list[ClaimVerdict]


async def faithfulness(question: str, answer: str, contexts: list[str]) -> MetricResult:
    """
    supported_claims / total_claims.

    Step 1 breaks the answer into atomic claims; step 2 checks each claim
    against the context. Two calls instead of one because asking a model
    to both decompose and verify in one pass lets it quietly skip the
    claims it can't verify.
    """
    if not answer.strip():
        return MetricResult(score=None)

    extracted: Claims = await _judge(
        Claims,
        f"""Break the ANSWER into atomic factual claims - one fact per claim,
each understandable on its own (replace pronouns with what they refer to).

Do NOT include: greetings, offers to help, statements that information is
unavailable or not found, or questions back to the user.
If the answer makes no factual claims, return an empty list.

QUESTION:
{question}

ANSWER:
{answer}""",
    )

    if not extracted.claims:
        return MetricResult(score=None)

    if not contexts:
        details = [{"claim": c, "supported": False, "reason": "No context was retrieved."} for c in extracted.claims]
        return MetricResult(score=0.0, details=details)

    numbered = "\n".join(f"{i + 1}. {c}" for i, c in enumerate(extracted.claims))
    verified: ClaimVerdicts = await _judge(
        ClaimVerdicts,
        f"""For each CLAIM, decide whether it is supported by the CONTEXT.

A claim is supported only if the context states it or it follows directly
from what the context states. Numbers, currencies, dates and names must
match exactly. If the context is silent on it, it is NOT supported - even
if it is true in the real world.

Return exactly one verdict per claim, in the same order.

CONTEXT:
{_format_contexts(contexts)}

CLAIMS:
{numbered}""",
    )

    verdicts = verified.verdicts
    if not verdicts:
        return MetricResult(score=None)

    supported = sum(1 for v in verdicts if v.supported)
    return MetricResult(
        score=round(supported / len(verdicts), 4),
        details=[v.model_dump() for v in verdicts],
    )


# --- Context precision -----------------------------------------------------


class ContextVerdict(BaseModel):
    index: int = Field(description="1-based context number.")
    relevant: bool = Field(description="True if this context contains information needed to answer the question.")
    reason: str


class ContextVerdicts(BaseModel):
    verdicts: list[ContextVerdict]


async def context_precision(
    question: str, contexts: list[str], reference: Optional[str] = None
) -> MetricResult:
    """
    Rank-aware precision (average precision over the retrieved list):

        sum_k( precision@k * rel_k ) / (number of relevant chunks)

    A relevant chunk at rank 1 counts more than one at rank 3, so this
    rewards the reranker for putting the useful chunk first - not just
    for retrieving it somewhere.

    With a reference answer, relevance means "useful for producing the
    reference"; without one (live traffic), "useful for answering".
    """
    if not contexts:
        return MetricResult(score=None)

    reference_block = f"\nREFERENCE ANSWER:\n{reference}\n" if reference else ""
    judged: ContextVerdicts = await _judge(
        ContextVerdicts,
        f"""For each numbered CONTEXT, decide whether it contains information
that is needed to answer the QUESTION{" (i.e. to produce the REFERENCE ANSWER)" if reference else ""}.
A context that is on the same general topic but lacks the specific
information asked for is NOT relevant.

Return exactly one verdict per context, using its number as `index`.

QUESTION:
{question}
{reference_block}
{_format_contexts(contexts)}""",
    )

    relevance = {v.index: v.relevant for v in judged.verdicts}
    flags = [bool(relevance.get(i + 1, False)) for i in range(len(contexts))]

    hits = 0
    weighted = 0.0
    for k, is_relevant in enumerate(flags, start=1):
        if is_relevant:
            hits += 1
            weighted += hits / k

    return MetricResult(
        score=round(weighted / hits, 4) if hits else 0.0,
        details=[v.model_dump() for v in judged.verdicts],
    )


# --- Context recall --------------------------------------------------------


class StatementAttribution(BaseModel):
    statement: str
    attributed: bool = Field(description="True if the context contains this statement's information.")
    reason: str


class RecallVerdicts(BaseModel):
    statements: list[StatementAttribution]


async def context_recall(question: str, contexts: list[str], reference: str) -> MetricResult:
    """
    attributed_reference_statements / total_reference_statements.

    Recall is measured against the REFERENCE answer, not the generated
    one: "of the facts a correct answer needs, how many did retrieval
    actually bring back?" A low score means the generator never had a
    chance, regardless of how good the prompt is.
    """
    if not reference.strip():
        return MetricResult(score=None)

    if not contexts:
        return MetricResult(
            score=0.0,
            details=[{"statement": reference, "attributed": False, "reason": "No context was retrieved."}],
        )

    judged: RecallVerdicts = await _judge(
        RecallVerdicts,
        f"""Break the REFERENCE ANSWER into its individual factual statements.
For each statement, decide whether the information in it can be found in
the CONTEXT (stated directly or clearly implied). Numbers, currencies,
dates and names must match.

QUESTION:
{question}

REFERENCE ANSWER:
{reference}

{_format_contexts(contexts)}""",
    )

    statements = judged.statements
    if not statements:
        return MetricResult(score=None)

    attributed = sum(1 for s in statements if s.attributed)
    return MetricResult(
        score=round(attributed / len(statements), 4),
        details=[s.model_dump() for s in statements],
    )
