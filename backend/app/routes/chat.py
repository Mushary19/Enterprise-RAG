import json
import uuid

from sqlalchemy.future import select
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.chroma_manager import query_parent_context
from app.database.session import get_db
from app.dependencies import get_current_user
from app.models.session import ChatMessage, ChatSession
from app.models.user import User
from app.schemas.chat import (
    ChatMessageSchema,
    ChatPayload,
    ChatSessionSchema,
)

from app.services.llm_client import stream_llm_api

router = APIRouter(prefix="/chat")


@router.post("/message")
async def execute_rag_chat_turn(
    payload: ChatPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):

    session_id = payload.session_id
    user_message = payload.user_message

    session_stmt = select(ChatSession).where(ChatSession.id == session_id)
    result = await db.execute(session_stmt)
    session = result.scalar_one_or_none()

    if not session:
        session = ChatSession(
            id=session_id,
            user_id=current_user.id,
        )

        db.add(session)
        await db.commit()
        await db.refresh(session)
    else:
        if session.user_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Unauthorized access to this chat session.",
            )

    llm_messages = [
        {
            "role": "system",
            "content": "You are an elite corporate technical assistant. Use the provided context to answer factually.",
        },
    ]

    for message in session.messages:
        llm_messages.append(
            {
                "role": message.role,
                "content": message.content,
            }
        )

    llm_messages.append({"role": "user", "content": user_message})

    new_user_msg = ChatMessage(
        id=str(uuid.uuid4()),
        session_id=session.id,
        role="user",
        content=user_message,
    )

    session.messages.append(new_user_msg)
    await db.commit()

    retrieved_context = await query_parent_context(db, user_message)

    active_turn_messages = list(llm_messages)
    if retrieved_context:
        active_turn_messages.append(
            {
                "role": "system",
                "content": f"CRITICAL KNOWLEDGE BASE GROUND TRUTH:\n{retrieved_context}",
            }
        )

    async def event_stream():
        full_response = ""
        try:
            async for delta in stream_llm_api(active_turn_messages):
                full_response += delta
                yield f"data: {json.dumps({'type': 'token', 'content': delta})}\n\n"
        except Exception as exc:
            yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"
            return

        new_llm_message = ChatMessage(
            id=str(uuid.uuid4()),
            session_id=session.id,
            role="assistant",
            content=full_response,
        )

        session.messages.append(new_llm_message)
        await db.commit()
        await db.refresh(new_llm_message)

        done_payload = {
            "type": "done",
            "message_id": new_llm_message.id,
            "user_message_id": new_user_msg.id,
            "created_at": new_llm_message.created_at.isoformat(),
        }
        yield f"data: {json.dumps(done_payload)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
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
