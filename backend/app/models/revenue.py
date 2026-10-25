from datetime import datetime

from sqlalchemy import Column, Date, DateTime, Float, String
import uuid

from app.models.base import Base


class Revenue(Base):
    """
    A small, realistic revenue dataset (branch, date, revenue) standing in
    for the enterprise's real financial system. Read exclusively through
    app/services/enterprise_revenue_api.py - never queried directly by a
    graph node or exposed to the LLM.
    """

    __tablename__ = "revenue"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    branch_id = Column(String, nullable=False, index=True)
    branch_name = Column(String, nullable=False)
    date = Column(Date, nullable=False, index=True)
    revenue = Column(Float, nullable=False)
    currency = Column(String, default="LKR")


class FinancialAction(Base):
    """
    Audit trail for high-impact financial write actions (e.g. refunds).
    A row is created "pending" when the agent prepares an action, and
    updated to "approved"/"rejected"/"executed" only after a human
    reviews it through the HITL flow - the graph never writes this table
    to a terminal status on its own.
    """

    __tablename__ = "financial_actions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    action_type = Column(String, nullable=False)  # e.g. "refund"
    amount = Column(Float, nullable=False)
    currency = Column(String, default="LKR")
    customer_reference = Column(String, nullable=True)
    reason = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending|approved|rejected|executed
    requested_by_user_id = Column(String, nullable=True)
    decided_by_user_id = Column(String, nullable=True)
    thread_id = Column(String, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    decided_at = Column(DateTime, nullable=True)
