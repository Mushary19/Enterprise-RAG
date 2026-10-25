"""add revenue table, financial_actions table, users.role

Revision ID: d96d3bdf31da
Revises: ccacc6c696af
Create Date: 2026-08-23 00:00:00.000000

"""
import uuid
from datetime import date
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd96d3bdf31da'
down_revision: Union[str, Sequence[str], None] = 'ccacc6c696af'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'users',
        sa.Column('role', sa.String(), nullable=False, server_default='employee'),
    )

    revenue_table = op.create_table(
        'revenue',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('branch_id', sa.String(), nullable=False),
        sa.Column('branch_name', sa.String(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('revenue', sa.Float(), nullable=False),
        sa.Column('currency', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_revenue_branch_id'), 'revenue', ['branch_id'], unique=False)
    op.create_index(op.f('ix_revenue_date'), 'revenue', ['date'], unique=False)

    op.create_table(
        'financial_actions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('action_type', sa.String(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('currency', sa.String(), nullable=True),
        sa.Column('customer_reference', sa.String(), nullable=True),
        sa.Column('reason', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('requested_by_user_id', sa.String(), nullable=True),
        sa.Column('decided_by_user_id', sa.String(), nullable=True),
        sa.Column('thread_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('decided_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_financial_actions_thread_id'), 'financial_actions', ['thread_id'], unique=False
    )

    # Small, realistic seed dataset: 3 branches x 6 months.
    branches = [
        ("colombo", "Colombo"),
        ("kandy", "Kandy"),
        ("galle", "Galle"),
    ]
    # (year, month, base revenue per branch multiplier)
    months = [
        (2026, 2, 1.00),
        (2026, 3, 1.05),
        (2026, 4, 0.95),
        (2026, 5, 1.10),
        (2026, 6, 1.15),
        (2026, 7, 1.20),
    ]
    base_revenue = {
        "colombo": 2_400_000.0,
        "kandy": 1_150_000.0,
        "galle": 860_000.0,
    }

    rows = []
    for branch_id, branch_name in branches:
        for year, month, multiplier in months:
            rows.append(
                {
                    "id": str(uuid.uuid4()),
                    "branch_id": branch_id,
                    "branch_name": branch_name,
                    "date": date(year, month, 1),
                    "revenue": round(base_revenue[branch_id] * multiplier, 2),
                    "currency": "LKR",
                }
            )

    op.bulk_insert(revenue_table, rows)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_financial_actions_thread_id'), table_name='financial_actions')
    op.drop_table('financial_actions')
    op.drop_index(op.f('ix_revenue_date'), table_name='revenue')
    op.drop_index(op.f('ix_revenue_branch_id'), table_name='revenue')
    op.drop_table('revenue')
    op.drop_column('users', 'role')
