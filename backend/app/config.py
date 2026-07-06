import os


class Settings:
    PROJECT_NAME: str = "AI RAG Backend Engine"

    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = 60

    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY")

    CHROMA_HOST: str = os.getenv("CHROMA_SERVER_HOST", "chroma_vector_db")
    CHROMA_PORT: int = int(os.getenv("CHROMA_SERVER_HTTP_PORT", 8010))
    CHROMA_DB_DIR: str = os.getenv("CHROMA_DB_DIR", "/rag/data")

    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "securepassword")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "rag_enterprise")
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "postgres_db")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")

    @property
    def ASYNC_DATABASE_URL(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def SYNC_DATABASE_URL(self) -> str:
        return (
            f"postgresql+psycopg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


settings = Settings()
