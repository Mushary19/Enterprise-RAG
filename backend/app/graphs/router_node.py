"""
Top-level intent router for the agentic graph.

ARCHITECTURE NOTE (the core idea of this whole feature):
The LLM's ONLY job here is to fill in a small, typed decision object
(`RouterDecision`) via structured output - it classifies what KIND of
request this is. It does not, and cannot, call any function itself.

`route_after_intent` (a plain Python function, no LLM involved) is the
ONLY thing that decides which node runs next, based on the `intent`
value the LLM produced. This separation is what keeps the system safe
and predictable: the LLM proposes, LangGraph's graph structure disposes.
"""

from typing import Any, Dict, Literal

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig
from pydantic import BaseModel, Field

from app.graphs.rag_graph import GraphState, llm

ROUTER_SYSTEM_PROMPT = """You are a routing classifier for an enterprise assistant.
Classify the user's message into exactly one intent:

- "knowledge": questions about people, policies, documentation, or anything
  that should be answered from the uploaded knowledge base
  (e.g. "Who is Mushary?", "What is our employee code of conduct?").
- "revenue": questions about revenue, sales figures, branch performance,
  or requests to take a financial action such as issuing a refund
  (e.g. "What was revenue last month?", "Refund LKR 500,000 to customer X").
- "general": greetings, small talk, or anything that isn't a knowledge
  lookup or a revenue/financial request (e.g. "Hello", "Thanks!").

Set requires_tool=true only for "revenue" - knowledge and general requests
never need a tool call.
"""


class RouterDecision(BaseModel):
    intent: Literal["knowledge", "revenue", "general"] = Field(
        description="The single best-matching category for the user's request."
    )
    requires_tool: bool = Field(
        description="True only when answering requires calling a tool (revenue intent)."
    )


async def route_intent_node(state: GraphState, config: RunnableConfig) -> Dict[str, Any]:
    """Classifies the incoming request. Writes intent/requires_tool to state."""
    router_llm = llm.with_structured_output(RouterDecision)

    decision: RouterDecision = await router_llm.ainvoke(
        [
            SystemMessage(content=ROUTER_SYSTEM_PROMPT),
            HumanMessage(content=state["user_query"]),
        ]
    )

    logger = config["configurable"].get("logger")
    if logger:
        logger.log("router_decision", intent=decision.intent, requires_tool=decision.requires_tool)

    return {
        "intent": decision.intent,
        "requires_tool": decision.requires_tool,
    }


def route_after_intent(state: GraphState) -> str:
    """Conditional edge: the graph structure enforces what the router can trigger."""
    return state["intent"]


async def general_node(state: GraphState) -> Dict[str, Any]:
    """
    Handles chit-chat / greetings. Deliberately separate from `fallback_node`
    (app/graphs/rag_graph.py) - "Hello" and "I couldn't find that in the
    knowledge base" are different situations and shouldn't share copy.
    """
    system_prompt = SystemMessage(
        content=(
            "You are a friendly enterprise assistant. Respond briefly and "
            "naturally to greetings or small talk. If the user seems to want "
            "something substantive, invite them to ask a knowledge-base or "
            "revenue question."
        )
    )

    response = await llm.ainvoke([system_prompt] + state["messages"])

    return {
        "generation": response.content,
        "messages": AIMessage(content=response.content),
    }
