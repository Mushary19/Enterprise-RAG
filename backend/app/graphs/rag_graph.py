from typing import Any, TypedDict, List, Dict, Annotated, Optional
import json
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage, AIMessage
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_core.runnables import RunnableConfig
from app.config import Settings
from app.database.chroma_manager import retrieve_parent_chunks


class GraphState(TypedDict):
    user_query: str
    search_query: str
    messages: Annotated[List[BaseMessage], add_messages]
    retrieved_context: str
    # One entry per parent chunk handed to the generator. Kept separately
    # from the joined `retrieved_context` string so evaluators can score
    # each chunk (context precision) - see app/evaluation/metrics.py.
    retrieved_contexts: List[str]
    is_context_relevant: bool
    generation: str
    risk_level: str
    risk_reason: Optional[str]
    human_action: Optional[str]
    revised_generation: Optional[str]

    # --- Agentic routing/tool-calling fields ---
    # The LLM only ever fills these in as typed data (via structured output).
    # LangGraph's conditional edges are what actually decide which node runs
    # next - the LLM never calls a function directly. See app/graphs/router_node.py.
    intent: str  # "knowledge" | "revenue" | "general"
    requires_tool: bool
    tool_name: Optional[str]  # "get_revenue" | "request_refund"
    tool_args: Optional[Dict[str, Any]]
    tool_result: Optional[Dict[str, Any]]


llm = ChatGroq(
    groq_api_key=Settings.GROQ_API_KEY,
    model_name="llama-3.3-70b-versatile",
    temperature=0.0,
)


async def rewrite_query_node(state: GraphState) -> Dict[str, Any]:
    """
    Converts the user's conversational query into a standalone
    search query that can be used by the retrieval system.
    """

    user_query = state["user_query"]
    messages = state["messages"]

    prompt = f"""
        You are a search query rewriting assistant for a RAG system.

        Your job is to rewrite the user's latest question into a standalone
        search query that can be understood without the conversation history.

        Rules:
        - Resolve pronouns such as "he", "she", "it", "they", "this", etc.
        using the conversation history.
        - Preserve the user's original intent.
        - Do not answer the question.
        - Do not add information that isn't supported by the conversation.
        - If the question is already standalone, return it unchanged.
        - Return ONLY the rewritten search query.

        Conversation:
        {messages}

        Latest user question:
        {user_query}

        Standalone search query:
        """

    response = await llm.ainvoke([HumanMessage(content=prompt)])

    search_query = response.content.strip()

    return {"search_query": search_query}


async def retrieve_node(state: GraphState, config: RunnableConfig) -> Dict[str, Any]:
    db_session = config["configurable"]["db_session"]

    search_query = state["search_query"]
    retrieval = await retrieve_parent_chunks(db=db_session, user_query=search_query)

    logger = config["configurable"].get("logger")
    if logger:
        logger.log(
            "retrieval_complete",
            search_query=search_query,
            contexts_returned=len(retrieval.contexts),
            parent_ids=retrieval.parent_ids,
            top_rerank_score=max(
                (c["rerank_score"] for c in retrieval.candidates), default=None
            ),
            candidates=retrieval.candidates,
        )

    return {
        "retrieved_context": retrieval.joined,
        "retrieved_contexts": retrieval.contexts,
    }


async def grade_documents_node(state: GraphState, config: RunnableConfig) -> Dict[str, bool]:
    user_query = state["user_query"]
    context = state["retrieved_context"]
    logger = config["configurable"].get("logger")

    if not context:
        if logger:
            logger.log("grade_decision", relevant=False, reason="empty_context")
        return {"is_context_relevant": False}

    prompt = f"""You are a strict quality evaluator. Determine if the following retrieved context is relevant to answering the user query.

    RETRIEVED CONTEXT:
    {context}
    
    USER QUERY:
    {user_query}
    
    Respond strictly in JSON with a single boolean field "relevant": true or false. Do not include markdown formatting.
    """

    response = await llm.ainvoke([HumanMessage(content=prompt)])

    try:
        clean_content = (
            response.content.strip().replace("```json", "").replace("```", "")
        )
        parsed = json.loads(clean_content)
        is_relevant = parsed.get("relevant", False)
    except Exception:
        is_relevant = "true" in response.content.lower()

    if logger:
        logger.log("grade_decision", relevant=bool(is_relevant), reason="llm_grader")

    return {"is_context_relevant": is_relevant}


async def generate_node(state: GraphState) -> Dict[str, Any]:
    """
    Node 3a: Generates a grounded answer using the validated retrieved parent context.
    """
    context = state["retrieved_context"]
    messages = state["messages"]

    system_prompt = SystemMessage(
        content=(
            "You are an elite corporate technical assistant. Answer the user's query factually "
            "and strictly using the provided context. If a detail is not supported by the context, "
            "do not make it up.\n\n"
            f"CRITICAL KNOWLEDGE BASE GROUND TRUTH:\n{context}"
        )
    )

    full_messages = [system_prompt] + messages

    response = await llm.ainvoke(full_messages)

    return {
        "generation": response.content,
        "messages": AIMessage(content=response.content),
    }


async def fallback_node(state: GraphState) -> Dict[str, Any]:
    """
    Node 3b: Triggered when context is irrelevant or missing.
    Politely informs the user that the information isn't available in the enterprise knowledge base.
    """
    messages = state["messages"]

    system_prompt = SystemMessage(
        content=(
            "You are an elite corporate technical assistant. The knowledge base does not contain "
            "sufficient factual context to answer the user's specific request. "
            "Politely inform the user that you cannot find relevant information in the uploaded enterprise documents, "
            "and ask them to rephrase or upload the relevant documentation."
        )
    )

    full_messages = [system_prompt] + messages
    response = await llm.ainvoke(full_messages)

    return {
        "generation": response.content,
        "messages": AIMessage(content=response.content),
    }


def decide_to_generate(state: GraphState) -> str:
    """
    Conditional Edge Decision: Inspects state and routes to 'generate' or 'fallback'.
    """
    if state["is_context_relevant"]:
        return "generate"
    else:
        return "fallback"
