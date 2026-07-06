# Enterprise Knowledge RAG Engine

An elite, high-performance Retrieval-Augmented Generation (RAG) conversational pipeline built using **FastAPI**, **Asynchronous PostgreSQL**, and **ChromaDB**. 

The architecture features a advanced **Two-Step Ingestion & Retrieval Strategy** augmented with an **Approximate Nearest Neighbor (HNSW) Vector Index** and an intelligent **Cross-Encoder Reranking** layer to provide incredibly accurate contextual grounds for Large Language Models.

---

## 🏗️ System Architecture & Data Flow

The application isolates concerns between relational data persistence, high-dimensional geometric vector tracking, and semantic reranking pipelines:

1. **Document Ingestion:** Raw files (PDFs, texts) are parsed into a single string entity and split into large, informative **Parent Chunks** and smaller, atomic **Child Chunks**.
2. **Dual-Database Storage:** Parent chunks are saved to **PostgreSQL** to maintain transactional integrity. Child chunks are embedded using `all-MiniLM-L6-v2` (384 dimensions) and indexed inside **ChromaDB** using an **HNSW (Hierarchical Navigable Small World)** network graph.
3. **Retrieval Lifecycle:**
   * A user query passes through the ChromaDB HNSW layer to fetch the top `N` candidate child vectors.
   * A **Cross-Encoder Reranker** evaluates deep semantic alignments, re-scoring and filtering the candidates down to the absolute top `K` items.
   * The system extracts the matching `parent_ptr` UUID identifiers from metadata, issues an async SQL query to load the full contextual text blocks from PostgreSQL, and pipes the combined ground truth directly into the LLM context.

---

## 🛠️ Tech Stack

* **Framework:** FastAPI (Python 3.11+)
* **Relational Database:** PostgreSQL (via `asyncpg` and `SQLAlchemy 2.0` Async ORM)
* **Vector Database:** ChromaDB (Local ONNX execution of `all-MiniLM-L6-v2`)
* **Database Migrations:** Alembic (Asynchronous environment configuration)
* **LLM Provider:** Groq Client Cloud API
* **Deployment/Orchestration:** Docker & Docker Compose

---
