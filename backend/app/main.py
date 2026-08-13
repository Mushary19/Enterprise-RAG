from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent.parent / ".env.local")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import knowledge, chat, auth
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.database.checkpointer import checkpointer_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Postgres checkpointer tables and pool
    await checkpointer_manager.initialize()
    yield
    # Shutdown: Close database connection pool
    await checkpointer_manager.close()


app = FastAPI(title=settings.PROJECT_NAME, version="1.0.0", lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(knowledge.router)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": settings.PROJECT_NAME}
