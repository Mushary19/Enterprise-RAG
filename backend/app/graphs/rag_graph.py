from typing import Any, TypedDict, List, Dict, Annotated
import json
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage, AIMessage
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_core.runnables import RunnableConfig
from app.config import Settings
from app.database.chroma_manager import query_parent_context


class GraphState(TypedDict):
    user_query: str
    search_query: str
    messages: Annotated[List[BaseMessage], add_messages]
    retrieved_context: str
    is_context_relevant: bool
    generation: str


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
    context = await query_parent_context(db=db_session, user_query=search_query)

    return {
        "retrieved_context": context,
    }


async def grade_documents_node(state: GraphState) -> Dict[str, bool]:
    user_query = state["user_query"]
    context = state["retrieved_context"]

    if not context:
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
