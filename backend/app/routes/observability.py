from fastapi import APIRouter, Depends, HTTPException, Query

from app.dependencies import get_current_user
from app.models.user import User
from app.observability.summary import events_for_trace, load_events, summarize

router = APIRouter(prefix="/observability")


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    # Traces contain users' raw queries - not something every employee should read.
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Observability data is restricted to admins.")
    return current_user


@router.get("/summary")
async def get_summary(
    last: int = Query(500, ge=1, le=100_000, description="Only the most recent N traces."),
    _: User = Depends(require_admin),
):
    return summarize(load_events(), last_n_traces=last)


@router.get("/traces/{trace_id}")
async def get_trace(trace_id: str, _: User = Depends(require_admin)):
    events = events_for_trace(trace_id)
    if not events:
        raise HTTPException(status_code=404, detail="No events found for this trace_id.")
    return events
