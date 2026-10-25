"""
Stands in for "the Django enterprise application" the LLM's tool calls are
ultimately supposed to reach.

In a real deployment this module would be an HTTP client making an
authenticated call to a separate Django REST API
(e.g. `httpx.get(f"{DJANGO_API_BASE}/api/revenue", params=..., headers=auth_headers)`),
which would then be the thing that queries the actual enterprise database.

Here it's an in-process async function against the same Postgres instance,
so the demo is fully self-contained without standing up a second service -
but the *shape* of the boundary is preserved: authenticated caller -> service
layer -> structured result. Nothing above this module (graph nodes, the LLM)
ever touches Revenue/FinancialAction rows directly.
"""

from datetime import date, datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.revenue import FinancialAction, Revenue


async def fetch_revenue(
    db: AsyncSession,
    start_date: date,
    end_date: date,
    branch_id: Optional[str] = None,
) -> dict:
    stmt = select(Revenue).where(Revenue.date.between(start_date, end_date))
    if branch_id:
        stmt = stmt.where(Revenue.branch_id == branch_id)

    result = await db.execute(stmt)
    rows = result.scalars().all()

    by_branch: dict[str, float] = {}
    for row in rows:
        by_branch[row.branch_name] = by_branch.get(row.branch_name, 0.0) + row.revenue

    return {
        "total_revenue": round(sum(by_branch.values()), 2),
        "currency": "LKR",
        "period": f"{start_date.isoformat()} to {end_date.isoformat()}",
        "branch": branch_id or "all branches",
        "by_branch": {name: round(amount, 2) for name, amount in by_branch.items()},
    }


async def create_pending_refund(
    db: AsyncSession,
    *,
    amount: float,
    customer_reference: str,
    reason: Optional[str],
    requested_by_user_id: str,
    thread_id: str,
) -> FinancialAction:
    """
    Creates an audit row for a proposed refund. Does NOT move any money -
    that only happens (as a simulated status flip) once a human approves
    the action via the HITL flow. See app/graphs/risk_hitl_nodes.py.
    """
    action = FinancialAction(
        action_type="refund",
        amount=amount,
        currency="LKR",
        customer_reference=customer_reference,
        reason=reason,
        status="pending",
        requested_by_user_id=requested_by_user_id,
        thread_id=thread_id,
    )
    db.add(action)
    await db.commit()
    await db.refresh(action)
    return action


async def finalize_financial_action(
    db: AsyncSession,
    *,
    action_id: str,
    decision: str,  # "approved" | "rejected"
    decided_by_user_id: str,
) -> Optional[FinancialAction]:
    """
    Records the human decision. On approval, marks the action "executed" -
    still simulated (a status flip only), consistent with "do not
    automatically perform destructive financial operations."
    """
    stmt = select(FinancialAction).where(FinancialAction.id == action_id)
    result = await db.execute(stmt)
    action = result.scalar_one_or_none()
    if not action:
        return None

    action.decided_by_user_id = decided_by_user_id
    action.decided_at = datetime.utcnow()
    action.status = "executed" if decision == "approved" else "rejected"

    await db.commit()
    await db.refresh(action)
    return action
