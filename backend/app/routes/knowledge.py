from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.chroma_manager import bulk_insert_rag_data
from app.database.session import get_db
from app.schemas.knowledge import KnowledgeResponse
from app.services.document_parser import process_document
from app.services.text_splitter import chunk_text_by_parent_child

router = APIRouter(prefix="/knowledge")


@router.post("/upload", response_model=KnowledgeResponse)
async def upload_and_process_knowledge_base(
    db: AsyncSession = Depends(get_db),
    file: UploadFile = File(...),
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    try:
        # import pdb

        # pdb.set_trace()
        file_bytes = await file.read()
        raw_text, audit_log = process_document(file_bytes)
        print("raw", raw_text)

        if not raw_text.strip():
            raise HTTPException(
                status_code=422, detail="Document appears completely empty."
            )

        parents, children = chunk_text_by_parent_child(raw_text)
        await bulk_insert_rag_data(db, parents, children)

        return {
            "status": "success",
            "filename": file.filename,
            "parent_chunks_generated": len(parents),
            "child_chunks_generated": len(children),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion Fault: {str(e)}")
