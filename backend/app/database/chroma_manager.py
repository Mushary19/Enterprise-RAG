from dataclasses import dataclass, field

import chromadb
from app.config import settings
from app.models.knowledge import ParentChunk
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from flashrank import Ranker, RerankRequest

chroma_client = chromadb.HttpClient(
    host=settings.CHROMA_HOST,
    port=settings.CHROMA_PORT,
)

child_collection = chroma_client.get_or_create_collection(
    name="kb_child_chunks",
    metadata={"hnsw:space": "cosine"},
)

ranker = Ranker()


async def bulk_insert_rag_data(
    db: AsyncSession, parents: list[dict], children: list[dict]
) -> None:

    for parent in parents:
        db_parent = ParentChunk(
            id=parent["parent_id"],
            text_content=parent["text"],
        )
        db.add(db_parent)

    await db.commit()

    child_ids = []
    child_texts = []
    child_metadatas = []

    for child in children:
        child_ids.append(child["child_id"])
        child_texts.append(child["text"])

        metadata = child["metadata"]
        metadata["parent_ptr"] = child["parent_ptr"]
        child_metadatas.append(metadata)

    if child_ids:
        child_collection.upsert(
            ids=child_ids,
            documents=child_texts,
            metadatas=child_metadatas,
        )


@dataclass
class RetrievalResult:
    """
    What retrieval actually did, not just the text it produced. `contexts`
    is what the generator sees (one entry per parent chunk); `candidates`
    is every child chunk the vector search returned, with its vector
    distance, rerank score and whether it cleared the threshold - this is
    what gets logged for observability and scored by the evaluators.
    """

    contexts: list[str] = field(default_factory=list)
    parent_ids: list[str] = field(default_factory=list)
    candidates: list[dict] = field(default_factory=list)

    @property
    def joined(self) -> str:
        return "\n--CONTEXT BREAK--\n".join(self.contexts)


async def retrieve_parent_chunks(
    db: AsyncSession, user_query: str, n_results: int = 2, top_k: int = 1
) -> RetrievalResult:

    retrieval = RetrievalResult()

    results = child_collection.query(
        query_texts=[user_query],
        n_results=n_results,
        include=["documents", "metadatas", "distances"],
    )

    if not results or not results["metadatas"] or len(results["metadatas"][0]) == 0:
        return retrieval

    distances = (results.get("distances") or [[None] * len(results["ids"][0])])[0]

    passages_for_rerank = []
    for doc_id, text, metadata, distance in zip(
        results["ids"][0], results["documents"][0], results["metadatas"][0], distances
    ):
        passages_for_rerank.append(
            {
                "id": doc_id,
                "text": text,
                "metadata": metadata,
                "distance": distance,
            }
        )

    rerank_request = RerankRequest(user_query, passages_for_rerank)

    ranked_results = ranker.rerank(rerank_request)

    seen_parent_ids = []
    for rank, item in enumerate(ranked_results):
        score = float(item.get("score", 0))
        parent_ptr = item.get("metadata", {}).get("parent_ptr")
        kept = rank < top_k and score >= settings.RAG_RELEVANCE_THRESHOLD

        retrieval.candidates.append(
            {
                "child_id": item.get("id"),
                "parent_id": parent_ptr,
                "vector_distance": item.get("distance"),
                "rerank_score": round(score, 4),
                "kept": kept,
            }
        )

        if kept and parent_ptr and parent_ptr not in seen_parent_ids:
            seen_parent_ids.append(parent_ptr)

    for parent_id in seen_parent_ids:
        stmt = select(ParentChunk).where(ParentChunk.id == parent_id)
        result = await db.execute(stmt)
        parent_chunk = result.scalar_one_or_none()

        if parent_chunk:
            retrieval.contexts.append(parent_chunk.text_content)
            retrieval.parent_ids.append(parent_id)

    return retrieval


async def query_parent_context(
    db: AsyncSession, user_query: str, n_results: int = 2
) -> str:
    retrieval = await retrieve_parent_chunks(db=db, user_query=user_query, n_results=n_results)
    return retrieval.joined
