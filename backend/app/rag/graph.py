from langgraph.graph import END, StateGraph

from app.database.checkpointer import checkpointer_manager
from app.graphs.rag_graph import (
    GraphState,
    decide_to_generate,
    fallback_node,
    generate_node,
    grade_documents_node,
    retrieve_node,
    rewrite_query_node,
)
from app.graphs.risk_hitl_nodes import (
    approve_action_node,
    edit_action_node,
    human_review_node,
    reject_action_node,
    risk_check_node,
    route_after_human_review,
    route_after_risk_check,
)
from app.graphs.router_node import general_node, route_after_intent, route_intent_node
from app.graphs.revenue_nodes import (
    execute_revenue_tool_node,
    generate_revenue_response_node,
    select_revenue_tool_node,
)
from app.observability import traced_node


def _add_node(workflow: StateGraph, name: str, fn) -> None:
    """Every node is wrapped so its latency/outcome is logged (app/observability/tracing.py)."""
    workflow.add_node(name, traced_node(name, fn))


def _add_knowledge_path(workflow: StateGraph) -> None:
    """
    rewrite_query -> retrieve -> grade_documents -> (generate | fallback).
    Shared by the full agent graph and the knowledge-only graph that the
    offline evaluation runs, so both exercise exactly the same wiring.
    """
    _add_node(workflow, "rewrite_query", rewrite_query_node)
    _add_node(workflow, "retrieve", retrieve_node)
    _add_node(workflow, "grade_documents", grade_documents_node)
    _add_node(workflow, "generate", generate_node)
    _add_node(workflow, "fallback", fallback_node)

    workflow.add_edge("rewrite_query", "retrieve")
    workflow.add_edge("retrieve", "grade_documents")
    workflow.add_conditional_edges(
        "grade_documents",
        decide_to_generate,
        {"generate": "generate", "fallback": "fallback"},
    )


def build_agentic_graph():
    """
    Wires the agentic graph. Node bodies live in app/graphs/ - this
    function only defines the shape:

        route_intent
          --knowledge--> rewrite_query -> retrieve -> grade_documents -> (generate|fallback)
          --revenue-->   select_revenue_tool -> execute_revenue_tool -> generate_revenue_response
          --general-->   general_node

        (generate | fallback | generate_revenue_response | general_node) --> risk_check
          --low-->  END
          --high--> human_review --(approve|edit|reject)--> END

    The knowledge sub-path (rewrite_query -> retrieve -> grade_documents ->
    generate/fallback) is wired exactly as it was before this feature -
    only its entry point changed, from "always run" to "run when the
    router says knowledge".
    """
    workflow = StateGraph(GraphState)

    # Router
    _add_node(workflow, "route_intent", route_intent_node)
    _add_node(workflow, "general_response", general_node)

    # Knowledge RAG (unchanged internal wiring)
    _add_knowledge_path(workflow)

    # Revenue tool-calling path
    _add_node(workflow, "select_revenue_tool", select_revenue_tool_node)
    _add_node(workflow, "execute_revenue_tool", execute_revenue_tool_node)
    _add_node(workflow, "generate_revenue_response", generate_revenue_response_node)

    # Risk / HITL
    _add_node(workflow, "risk_check", risk_check_node)
    _add_node(workflow, "human_review", human_review_node)
    _add_node(workflow, "approve_action", approve_action_node)
    _add_node(workflow, "edit_action", edit_action_node)
    _add_node(workflow, "reject_action", reject_action_node)

    workflow.set_entry_point("route_intent")
    workflow.add_conditional_edges(
        "route_intent",
        route_after_intent,
        {
            "knowledge": "rewrite_query",
            "revenue": "select_revenue_tool",
            "general": "general_response",
        },
    )

    # Revenue sub-path
    workflow.add_edge("select_revenue_tool", "execute_revenue_tool")
    workflow.add_edge("execute_revenue_tool", "generate_revenue_response")

    # Every response path converges on the risk gate
    workflow.add_edge("generate", "risk_check")
    workflow.add_edge("fallback", "risk_check")
    workflow.add_edge("generate_revenue_response", "risk_check")
    workflow.add_edge("general_response", "risk_check")

    workflow.add_conditional_edges(
        "risk_check",
        route_after_risk_check,
        {"low": END, "high": "human_review"},
    )
    workflow.add_conditional_edges(
        "human_review",
        route_after_human_review,
        {"approve": "approve_action", "edit": "edit_action", "reject": "reject_action"},
    )
    workflow.add_edge("approve_action", END)
    workflow.add_edge("edit_action", END)
    workflow.add_edge("reject_action", END)

    return workflow


def build_knowledge_graph():
    """
    Knowledge path only, ending at generate/fallback. Used by the offline
    evaluation (app/evaluation/run.py) so retrieval and generation quality
    are measured without the router or risk gate in the way.
    """
    workflow = StateGraph(GraphState)
    _add_knowledge_path(workflow)
    workflow.set_entry_point("rewrite_query")
    workflow.add_edge("generate", END)
    workflow.add_edge("fallback", END)
    return workflow


def get_agent_app():
    workflow = build_agentic_graph()
    return workflow.compile(checkpointer=checkpointer_manager.checkpointer)
