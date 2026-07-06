from datetime import datetime

from sqlalchemy import Column, DateTime, String

from app.models.base import Base


class ParentChunk(Base):
    __tablename__ = "parent_chunks"
    id = Column(String, primary_key=True, index=True)
    text_content = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
