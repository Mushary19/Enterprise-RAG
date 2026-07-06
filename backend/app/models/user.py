from sqlalchemy.orm import relationship
from sqlalchemy import Column, String
import uuid

from app.models.base import Base


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=False)
    sessions = relationship(
        "ChatSession", back_populates="user", cascade="all, delete-orphan"
    )
