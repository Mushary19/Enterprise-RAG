from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.auth_manager import create_user, login_user
from app.database.session import get_db
from app.schemas.user import LoginRequest, LoginResponse, UserCreate
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth")


@router.post("/register")
async def register_user(data: UserCreate, db: AsyncSession = Depends(get_db)):

    user = await create_user(db, data)

    return {"status": "User created successfully", "id": user.id}


@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):

    result = await login_user(db, data)
    return LoginResponse(**result)


@router.get("/me")
async def fetch_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
    }
