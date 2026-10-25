"""
Revenue tool-calling path: select a tool + args -> execute it -> phrase
the result in natural language.

Split into three small nodes (rather than one "do everything" node) so the
graph visualization and the logs make each step visible on its own -
useful both for debugging and for demoing the flow.
"""

import json
from datetime import date
from typing import Any, Dict, Literal, Optional

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig
from pydantic import BaseModel, Field

from app.graphs.rag_graph import GraphState, llm
from app.services.revenue_tools import get_revenue_tool, request_refund_tool

TOOL_SELECTION_SYSTEM_PROMPT = """You select and fill in the arguments for exactly one revenue tool.

Available tools:
- get_revenue(start_date, end_date, branch_id?): read-only revenue lookup.
- request_refund(refund_amount, customer_reference, reason?): prepares a
  refund for human approval - use this whenever the user asks to refund,
  return, or reimburse money to a customer.

Resolve relative dates ("last month", "this January") using today's date,
given below. Use YYYY-MM-DD format. Only fill in fields relevant to the
tool you choose; leave the rest empty.

Today's date: {today}
"""


class RevenueToolSelection(BaseModel):
    tool_name: Literal["get_revenue", "request_refund"]
    start_date: Optional[str] = Field(None, description="YYYY-MM-DD, for get_revenue")
    end_date: Optional[str] = Field(None, description="YYYY-MM-DD, for get_revenue")
    branch_id: Optional[str] = Field(None, description="e.g. 'colombo', for get_revenue")
    refund_amount: Optional[float] = Field(None, description="For request_refund")
    customer_reference: Optional[str] = Field(None, description="For request_refund")
    reason: Optional[str] = Field(None, description="For request_refund")


async def select_revenue_tool_node(state: GraphState, config: RunnableConfig) -> Dict[str, Any]:
    """
    Structured-output "tool selection" step. Validates the LLM's proposed
    arguments before anything is allowed to touch a tool - the LLM never
    constructs SQL or talks to a tool directly, it only fills in this
    typed, validated schema.
    """
    logger = config["configurable"].get("logger")

    selector_llm = llm.with_structured_output(RevenueToolSelection)
    selection: RevenueToolSelection = await selector_llm.ainvoke(
        [
            SystemMessage(
                content=TOOL_SELECTION_SYSTEM_PROMPT.format(today=date.today().isoformat())
            ),
            HumanMessage(content=state["user_query"]),
        ]
    )

    if logger:
        logger.log("tool_selected", tool_name=selection.tool_name)

    tool_args: Dict[str, Any] = {}
    validation_error: Optional[str] = None

    if selection.tool_name == "get_revenue":
        try:
            start = date.fromisoformat(selection.start_date)
            end = date.fromisoformat(selection.end_date)
            if end < start:
                raise ValueError("end_date is before start_date")
            tool_args = {
                "start_date": selection.start_date,
                "end_date": selection.end_date,
                "branch_id": selection.branch_id,
            }
        except (TypeError, ValueError):
            validation_error = (
                "I couldn't determine a valid date range from your question. "
                "Could you specify the period you mean (e.g. 'January 2026')?"
            )
    else:  # request_refund
        if not selection.refund_amount or selection.refund_amount <= 0:
            validation_error = "I need a valid refund amount greater than zero."
        elif not selection.customer_reference:
            validation_error = "I need a customer reference to prepare a refund."
        else:
            tool_args = {
                "refund_amount": selection.refund_amount,
                "customer_reference": selection.customer_reference,
                "reason": selection.reason,
            }

    if logger:
        logger.log("tool_args", valid=validation_error is None, **tool_args)

    if validation_error:
        return {
            "tool_name": None,
            "tool_args": None,
            "tool_result": {"error": validation_error},
        }

    return {"tool_name": selection.tool_name, "tool_args": tool_args}


async def execute_revenue_tool_node(state: GraphState, config: RunnableConfig) -> Dict[str, Any]:
    """Executes the selected tool. Skips execution if selection already failed validation."""
    logger = config["configurable"].get("logger")
    tool_name = state.get("tool_name")

    if not tool_name:
        return {}  # tool_result already holds the validation error

    if tool_name == "get_revenue":
        result = await get_revenue_tool.ainvoke(state["tool_args"], config=config)
    else:
        result = await request_refund_tool.ainvoke(state["tool_args"], config=config)

    if logger:
        logger.log("tool_result", tool_name=tool_name, **{k: v for k, v in result.items() if k != "by_branch"})

    return {"tool_result": result}


async def generate_revenue_response_node(state: GraphState) -> Dict[str, Any]:
    """Phrases tool_result in natural language. Never invents figures not present in tool_result."""
    tool_result = state.get("tool_result") or {}

    system_prompt = SystemMessage(
        content=(
            "You are an enterprise revenue assistant. Answer using ONLY the "
            "numbers present in TOOL RESULT below - never invent, estimate, "
            "or round a figure that isn't there. If TOOL RESULT has "
            "\"authorized\": false, politely explain the user lacks "
            "permission for this and do not reveal any figures. If it has "
            "an \"error\" field, ask the clarifying question it describes "
            "instead of guessing. If it describes a pending refund, tell "
            "the user it's been submitted for approval.\n\n"
            f"TOOL RESULT:\n{json.dumps(tool_result, default=str)}"
        )
    )

    response = await llm.ainvoke([system_prompt] + state["messages"])

    return {
        "generation": response.content,
        "messages": AIMessage(content=response.content),
    }
