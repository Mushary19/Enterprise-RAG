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


async def query_parent_context(
    db: AsyncSession, user_query: str, n_results: int = 2
) -> str:

    seen_parent_ids = set()
    extracted_context = []

    results = child_collection.query(
        query_texts=[user_query],
        n_results=n_results,
    )

    if not results or not results["metadatas"] or len(results["metadatas"][0]) == 0:
        return ""

    passages_for_rerank = []
    for doc_id, text, metadata in zip(
        results["ids"][0], results["documents"][0], results["metadatas"][0]
    ):
        passages_for_rerank.append(
            {
                "id": doc_id,
                "text": text,
                "metadata": metadata,
            }
        )

    rerank_request = RerankRequest(user_query, passages_for_rerank)

    ranked_results = ranker.rerank(rerank_request)

    top_k = 1
    for item in ranked_results[:top_k]:
        if item.get("score", 0) < settings.RAG_RELEVANCE_THRESHOLD:
            continue

        metadata = item.get("metadata", {})
        parent_ptr = metadata.get("parent_ptr")

        if parent_ptr and parent_ptr not in seen_parent_ids:
            seen_parent_ids.add(parent_ptr)

    for parent_id in seen_parent_ids:
        stmt = select(ParentChunk).where(ParentChunk.id == parent_id)
        result = await db.execute(stmt)
        parent_chunk = result.scalar_one_or_none()

        if parent_chunk:
            extracted_context.append(parent_chunk.text_content)

    return "\n--CONTEXT BREAK--\n".join(extracted_context) if extracted_context else ""
    # best_matching_metadata = results["metadatas"][0][0]

    # parent_id_ptr = best_matching_metadata.get("parent_ptr")

    # if not parent_id_ptr:
    #     return None

    # stmt = select(ParentChunk).where(ParentChunk.id == parent_id_ptr)
    # result = await db.execute(stmt)
    # parent_record = result.scalar_one_or_none()
