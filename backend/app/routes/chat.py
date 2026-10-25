import uuid

from fastapi import APIRouter, Depends, HTTPException
from langchain_core.messages import HumanMessage
from langgraph.types import Command
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database.session import get_db
from app.dependencies import get_current_user
from app.logging_utils import RequestLogger
from app.models.session import ChatMessage, ChatSession
from app.models.user import User
from app.rag.graph import get_agent_app
from app.schemas.agent import AgentMessageResponse, ResumeRequest
from app.schemas.chat import ChatMessageSchema, ChatPayload, ChatSessionSchema

router = APIRouter(prefix="/chat")


def _build_config(*, thread_id: str, db: AsyncSession, current_user: User, logger: RequestLogger) -> dict:
    """
    Everything downstream graph nodes/tools need that ISN'T conversation
    state gets threaded in here (RunnableConfig["configurable"]), not
    passed through GraphState. This is the same mechanism retrieve_node
    already used for db_session, now extended to current_user (the
    authorization boundary) and logger (shared trace_id).
    """
    return {
        "configurable": {
            "thread_id": thread_id,
            "db_session": db,
            "current_user": current_user,
            "logger": logger,
        }
    }


def _read_pending_interrupt(state_snapshot):
    """Returns (requires_hitl, interrupt_payload) from a graph state snapshot."""
    if not state_snapshot.next:
        return False, None

    for task in state_snapshot.tasks:
        if task.interrupts:
            return True, task.interrupts[0].value

    return True, None


async def _finalize_turn(
    *,
    app,
    thread_id: str,
    result: dict,
    session: ChatSession,
    db: AsyncSession,
) -> AgentMessageResponse:
    """Shared response-building logic for both /message and /message/resume."""
    state_snapshot = await app.aget_state({"configurable": {"thread_id": thread_id}})
    requires_hitl, interrupt_payload = _read_pending_interrupt(state_snapshot)

    content = result.get("revised_generation") or result.get("generation") or ""

    new_llm_message = ChatMessage(
        id=str(uuid.uuid4()),
        session_id=session.id,
        role="assistant",
        content=content,
    )
    session.messages.append(new_llm_message)
    await db.commit()

    return AgentMessageResponse(
        content=content,
        thread_id=thread_id,
        intent=result.get("intent", ""),
        requires_tool=result.get("requires_tool", False),
        tool_name=result.get("tool_name"),
        tool_args=result.get("tool_args"),
        tool_result=result.get("tool_result"),
        risk_level=result.get("risk_level", "low"),
        risk_reason=result.get("risk_reason"),
        requires_hitl=requires_hitl,
        interrupt_payload=interrupt_payload,
    )


@router.post("/message", response_model=AgentMessageResponse)
async def execute_rag_chat_turn(
    payload: ChatPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session_id = payload.session_id
    user_message = payload.user_message

    logger = RequestLogger()
    logger.log("query_received", query=user_message)

    session_stmt = select(ChatSession).where(ChatSession.id == session_id)
    result = await db.execute(session_stmt)
    session = result.scalar_one_or_none()

    if not session:
        session = ChatSession(id=session_id, user_id=current_user.id)
        db.add(session)
        await db.commit()
        await db.refresh(session)
    elif session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to this chat session.")

    session.messages.append(
        ChatMessage(id=str(uuid.uuid4()), session_id=session.id, role="user", content=user_message)
    )
    await db.commit()

    app = get_agent_app()
    config = _build_config(thread_id=str(session_id), db=db, current_user=current_user, logger=logger)

    input_state = {
        "user_query": user_message,
        "messages": [HumanMessage(content=user_message)],
    }

    result = await app.ainvoke(input_state, config=config)

    return await _finalize_turn(app=app, thread_id=str(session_id), result=result, session=session, db=db)


@router.post("/message/resume", response_model=AgentMessageResponse)
async def resume_chat_turn(
    payload: ResumeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Resumes a graph paused at human_review_node (app/graphs/risk_hitl_nodes.py)."""
    session_stmt = select(ChatSession).where(ChatSession.id == payload.thread_id)
    result = await db.execute(session_stmt)
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="No conversation found for this thread_id.")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to this chat session.")

    logger = RequestLogger()
    logger.log("resume_received", thread_id=payload.thread_id, action=payload.action)

    app = get_agent_app()
    config = _build_config(
        thread_id=payload.thread_id, db=db, current_user=current_user, logger=logger
    )

    result = await app.ainvoke(
        Command(resume={"action": payload.action, "edited_content": payload.edited_content}),
        config=config,
    )

    return await _finalize_turn(
        app=app, thread_id=payload.thread_id, result=result, session=session, db=db
    )


@router.get("/sessions", response_model=list[ChatSessionSchema])
async def get_user_sessions(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    stmt = select(ChatSession).where(ChatSession.user_id == current_user.id)

    result = await db.execute(stmt)
    sessions = result.scalars().all()

    return sessions


@router.get("/{session_id}/messages", response_model=list[ChatMessageSchema])
async def get_session_messages(session_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(ChatMessage).where(ChatMessage.session_id == session_id)
    result = await db.execute(stmt)
    messages = result.scalars().all()

    return messages
