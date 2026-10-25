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
    workflow.add_node("route_intent", route_intent_node)
    workflow.add_node("general_response", general_node)

    # Knowledge RAG (unchanged internal wiring)
    workflow.add_node("rewrite_query", rewrite_query_node)
    workflow.add_node("retrieve", retrieve_node)
    workflow.add_node("grade_documents", grade_documents_node)
    workflow.add_node("generate", generate_node)
    workflow.add_node("fallback", fallback_node)

    # Revenue tool-calling path
    workflow.add_node("select_revenue_tool", select_revenue_tool_node)
    workflow.add_node("execute_revenue_tool", execute_revenue_tool_node)
    workflow.add_node("generate_revenue_response", generate_revenue_response_node)

    # Risk / HITL
    workflow.add_node("risk_check", risk_check_node)
    workflow.add_node("human_review", human_review_node)
    workflow.add_node("approve_action", approve_action_node)
    workflow.add_node("edit_action", edit_action_node)
    workflow.add_node("reject_action", reject_action_node)

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

    # Knowledge sub-path
    workflow.add_edge("rewrite_query", "retrieve")
    workflow.add_edge("retrieve", "grade_documents")
    workflow.add_conditional_edges(
        "grade_documents",
        decide_to_generate,
        {"generate": "generate", "fallback": "fallback"},
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


def get_agent_app():
    workflow = build_agentic_graph()
    return workflow.compile(checkpointer=checkpointer_manager.checkpointer)
