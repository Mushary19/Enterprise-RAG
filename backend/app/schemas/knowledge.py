from pydantic import BaseModel


class KnowledgeResponse(BaseModel):
    status: str
    filename: str
    parent_chunks_generated: int
    child_chunks_generated: int
