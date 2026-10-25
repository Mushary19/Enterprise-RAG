"""
LangChain @tool-wrapped revenue actions.

SECURITY NOTE - read this before touching this file:
The LLM never sees a permission model and can never bypass one. Each tool
below receives the authenticated user and DB session through `config`
(a RunnableConfig LangChain injects automatically at call time - it is
NOT part of the tool's declared arg schema, so the LLM never sees it or
influences it) and checks `current_user.role` BEFORE calling the
"enterprise API" layer. This check happens in plain Python, not as an
instruction to the model. This is the actual security boundary:

    LLM (proposes args) -> tool (checks role) -> enterprise API -> DB

If the LLM "decides" to ask for revenue data on behalf of an unauthorized
user, the tool simply refuses and returns a structured denial - there is
no code path where a request reaches the database without this check.
"""

from datetime import date
from typing import Optional

from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool

from app.services import enterprise_revenue_api

REVENUE_READ_ROLES = {"manager", "admin"}
FINANCIAL_WRITE_ROLES = {"admin"}


@tool
async def get_revenue_tool(
    start_date: str,
    end_date: str,
    branch_id: Optional[str] = None,
    config: RunnableConfig = None,
) -> dict:
    """Fetch total revenue for a date range (YYYY-MM-DD), optionally filtered by branch_id."""
    user = config["configurable"]["current_user"]
    logger = config["configurable"].get("logger")

    if user.role not in REVENUE_READ_ROLES:
        if logger:
            logger.log("tool_authorization_denied", tool="get_revenue", user_role=user.role)
        return {
            "authorized": False,
            "reason": f"Role '{user.role}' is not permitted to view revenue data.",
        }

    db = config["configurable"]["db_session"]

    result = await enterprise_revenue_api.fetch_revenue(
        db,
        start_date=date.fromisoformat(start_date),
        end_date=date.fromisoformat(end_date),
        branch_id=branch_id,
    )
    result["authorized"] = True
    return result


@tool
async def request_refund_tool(
    refund_amount: float,
    customer_reference: str,
    reason: Optional[str] = None,
    config: RunnableConfig = None,
) -> dict:
    """
    Prepare a refund for human approval. Does NOT move money - this only
    ever creates a pending audit record; execution requires HITL approval.
    """
    user = config["configurable"]["current_user"]
    logger = config["configurable"].get("logger")

    if user.role not in FINANCIAL_WRITE_ROLES:
        if logger:
            logger.log("tool_authorization_denied", tool="request_refund", user_role=user.role)
        return {
            "authorized": False,
            "reason": f"Role '{user.role}' is not permitted to request refunds.",
        }

    db = config["configurable"]["db_session"]
    thread_id = config["configurable"]["thread_id"]

    action = await enterprise_revenue_api.create_pending_refund(
        db,
        amount=refund_amount,
        customer_reference=customer_reference,
        reason=reason,
        requested_by_user_id=user.id,
        thread_id=str(thread_id),
    )

    return {
        "authorized": True,
        "action_id": action.id,
        "status": action.status,
        "amount": action.amount,
        "currency": action.currency,
        "customer_reference": action.customer_reference,
    }
