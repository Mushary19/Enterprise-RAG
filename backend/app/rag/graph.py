from langgraph.graph import END, StateGraph
from langgraph.checkpoint.memory import MemorySaver
from app.graphs.rag_graph import (
    GraphState,
    decide_to_generate,
    fallback_node,
    generate_node,
    grade_documents_node,
    retrieve_node,
    rewrite_query_node,
)
from app.database.checkpointer import checkpointer_manager


def build_rag_graph():
    workflow = StateGraph(GraphState)

    workflow.add_node("rewrite_query", rewrite_query_node)
    workflow.add_node("retrieve", retrieve_node)
    workflow.add_node("grade_documents", grade_documents_node)
    workflow.add_node("generate", generate_node)
    workflow.add_node("fallback", fallback_node)

    # Build edges
    workflow.set_entry_point("rewrite_query")
    workflow.add_edge("rewrite_query", "retrieve")
    workflow.add_edge("retrieve", "grade_documents")

    # Conditional edge after grading
    workflow.add_conditional_edges(
        "grade_documents",
        decide_to_generate,
        {"generate": "generate", "fallback": "fallback"},
    )

    # Both paths end the workflow
    workflow.add_edge("generate", END)
    workflow.add_edge("fallback", END)

    return workflow


def get_rag_app():
    workflow = build_rag_graph()

    print(
        f"DEBUG: Compiling app with checkpointer: {checkpointer_manager.checkpointer}"
    )

    if checkpointer_manager.checkpointer is None:
        print("CRITICAL ERROR: Checkpointer is None!")

    return workflow.compile(checkpointer=checkpointer_manager.checkpointer)
