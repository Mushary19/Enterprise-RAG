from typing import Any, Literal, Optional

from pydantic import BaseModel


class AgentMessageResponse(BaseModel):
    """
    Everything needed to demo/debug the agentic flow: what the router
    decided, whether a tool ran and with what, the resulting risk
    assessment, and whether the graph is currently paused awaiting human
    approval.
    """

    content: str
    thread_id: str

    intent: str
    requires_tool: bool
    tool_name: Optional[str] = None
    tool_args: Optional[dict[str, Any]] = None
    tool_result: Optional[dict[str, Any]] = None

    risk_level: str
    risk_reason: Optional[str] = None

    requires_hitl: bool
    interrupt_payload: Optional[dict[str, Any]] = None


class ResumeRequest(BaseModel):
    thread_id: str
    action: Literal["approve", "edit", "reject"]
    edited_content: Optional[str] = None
