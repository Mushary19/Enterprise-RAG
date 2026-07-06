from fastapi import HTTPException
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.models.user import User
from app.schemas.user import LoginRequest, LoginResponse, UserCreate
from app.services.auth_service import (
    create_access_token,
    hash_password,
    verify_password,
)


async def create_user(db: AsyncSession, data: UserCreate) -> User:

    stmt = select(User).where(User.email == data.email)
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(status_code=409, detail="Email already registered")

    new_user = User(
        id=str(uuid.uuid4()),
        email=data.email,
        hashed_password=hash_password(data.password),
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user


async def login_user(db: AsyncSession, data: LoginRequest):

    stmt = select(User).where(User.email == data.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    payload = {
        "sub": str(user.id),
        "email": user.email,
    }

    access_token = create_access_token(payload)

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }
