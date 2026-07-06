from pydantic import BaseModel, ConfigDict
from datetime import datetime


class ChatPayload(BaseModel):
    session_id: str
    user_message: str


class ChatResponse(BaseModel):
    session_id: str
    response: str


class ChatSessionSchema(BaseModel):
    id: str
    title: str
    # type: str
    created_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class ChatMessageSchema(BaseModel):
    id: str
    content: str
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
