"""
Risk gate + human-in-the-loop.

Every response path (knowledge, revenue, general) converges on
`risk_check_node` before reaching END - a single choke point for
guardrails regardless of how the request was handled.

Risk assessment is deliberately a plain rule, not an LLM call: cheap,
fast, and fully auditable. The only thing that currently makes a
request "high risk" is a financial write action (a refund) - read-only
lookups and knowledge/general answers are always "low" and go straight
through. This is easy to extend later (amount thresholds, anomaly
scoring, per-user risk profiles) without touching the graph shape.

NOTE ON LANGGRAPH INTERRUPTS: a node that calls `interrupt()` re-runs
from the top when the graph is resumed (that's how LangGraph replays up
to the interrupt point). Anything with a side effect (logging, writes)
must go either before the graph reaches this node, or in the nodes
*after* the human decision - never between the top of this node and the
`interrupt()` call itself, or it would fire twice.
"""

from typing import Any, Dict

from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableConfig
from langgraph.types import interrupt

from app.graphs.rag_graph import GraphState
from app.services import enterprise_revenue_api

HIGH_RISK_TOOLS = {"request_refund"}


def risk_check_node(state: GraphState, config: RunnableConfig) -> Dict[str, Any]:
    logger = config["configurable"].get("logger")

    if state.get("tool_name") in HIGH_RISK_TOOLS:
        risk_level, risk_reason = (
            "high",
            "Financial write action (refund) requires human approval before execution.",
        )
    else:
        risk_level, risk_reason = "low", None

    if logger:
        logger.log("risk_assessed", level=risk_level, reason=risk_reason)
    if risk_level == "high" and logger:
        logger.log("hitl_pending")

    return {"risk_level": risk_level, "risk_reason": risk_reason}


def route_after_risk_check(state: GraphState) -> str:
    return "high" if state["risk_level"] == "high" else "low"


async def human_review_node(state: GraphState) -> Dict[str, Any]:
    """
    Pauses the graph. LangGraph persists the paused state via the existing
    Postgres checkpointer - no new persistence mechanism. Execution resumes
    exactly here when the API calls `app.ainvoke(Command(resume={...}))`
    with the same thread_id.
    """
    decision = interrupt(
        {
            "message": "This action requires human approval before it proceeds.",
            "risk_reason": state.get("risk_reason"),
            "proposed_response": state.get("generation"),
            "tool_result": state.get("tool_result"),
        }
    )

    return {
        "human_action": decision.get("action"),
        "revised_generation": decision.get("edited_content"),
    }


def route_after_human_review(state: GraphState) -> str:
    return state.get("human_action") or "reject"


async def _finalize_action(state: GraphState, config: RunnableConfig, decision: str) -> None:
    db = config["configurable"]["db_session"]
    user = config["configurable"]["current_user"]
    tool_result = state.get("tool_result") or {}
    action_id = tool_result.get("action_id")
    if action_id:
        await enterprise_revenue_api.finalize_financial_action(
            db, action_id=action_id, decision=decision, decided_by_user_id=user.id
        )


async def approve_action_node(state: GraphState, config: RunnableConfig) -> Dict[str, Any]:
    logger = config["configurable"].get("logger")
    await _finalize_action(state, config, decision="approved")
    if logger:
        logger.log("hitl_resumed", action="approve")

    generation = state.get("generation", "")
    return {"generation": generation, "messages": AIMessage(content=generation)}


async def reject_action_node(state: GraphState, config: RunnableConfig) -> Dict[str, Any]:
    logger = config["configurable"].get("logger")
    await _finalize_action(state, config, decision="rejected")
    if logger:
        logger.log("hitl_resumed", action="reject")

    message = "This action was reviewed and rejected. No changes were made."
    return {"revised_generation": message, "messages": AIMessage(content=message)}


async def edit_action_node(state: GraphState, config: RunnableConfig) -> Dict[str, Any]:
    """
    "Edit" replaces the outgoing response text with the reviewer's own
    wording; the underlying action is still approved/executed exactly as
    originally validated. Letting a reviewer also change the transaction
    amount would need a full re-validation pass - intentionally out of
    scope for this demo.
    """
    logger = config["configurable"].get("logger")
    await _finalize_action(state, config, decision="approved")
    if logger:
        logger.log("hitl_resumed", action="edit")

    edited = state.get("revised_generation") or state.get("generation", "")
    return {"revised_generation": edited, "messages": AIMessage(content=edited)}
