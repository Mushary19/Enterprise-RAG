import contextlib
from psycopg_pool import AsyncConnectionPool
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from app.config import settings


def get_checkpoint_url() -> str:
    return (
        f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}"
        f"@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
    )


class CheckpointerManager:
    def __init__(self):
        self.pool: AsyncConnectionPool | None = None
        self.checkpointer: AsyncPostgresSaver | None = None

    async def initialize(self):
        url = get_checkpoint_url()
        print(f"DEBUG: Initializing AsyncConnectionPool for URL: {url}")

        # Explicitly set open=False to prevent deprecated auto-opening in constructor
        self.pool = AsyncConnectionPool(
            conninfo=url, max_size=20, open=False, kwargs={"autocommit": True}
        )

        # Explicitly open the pool
        await self.pool.open()

        # Instantiate and set up tables
        self.checkpointer = AsyncPostgresSaver(self.pool)
        await self.checkpointer.setup()
        print("DEBUG: Checkpointer Setup Complete!")

    async def close(self):
        if self.pool:
            await self.pool.close()


checkpointer_manager = CheckpointerManager()
