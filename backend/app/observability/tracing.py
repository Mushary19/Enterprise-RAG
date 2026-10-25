"""
Per-node and per-LLM-call tracing for the LangGraph agent.

Everything here writes through the request's existing `RequestLogger`
(config["configurable"]["logger"]), so every event shares the request's
trace_id and lands in the same JSONL file - one trace = one request.

Two sources of events:

- `traced_node` wraps each graph node and logs `node_complete` /
  `node_error` / `node_interrupted` with the node's wall-clock latency.
- `LLMUsageCallback` is a LangChain callback handler passed through
  config["callbacks"]. LangGraph propagates it to every `llm.ainvoke(...)`
  inside the nodes, so each model call logs `llm_call` with its token
  usage, latency and the graph node that made it - no node code changes.
"""

import inspect
import time
from typing import Any, Callable, Optional
from uuid import UUID

from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.outputs import LLMResult
from langchain_core.runnables import RunnableConfig
from langgraph.errors import GraphBubbleUp


def _get_logger(config: Optional[RunnableConfig]):
    return ((config or {}).get("configurable") or {}).get("logger")


def traced_node(name: str, fn: Callable) -> Callable:
    """
    Wraps a graph node so its latency and outcome are logged. Works for
    sync and async nodes, with or without a `config` parameter - the
    wrapper always asks LangGraph for config and forwards it only if the
    wrapped node wants it.
    """
    accepts_config = "config" in inspect.signature(fn).parameters

    async def wrapper(state, config: RunnableConfig):
        logger = _get_logger(config)
        start = time.perf_counter()

        try:
            result = fn(state, config) if accepts_config else fn(state)
            if inspect.isawaitable(result):
                result = await result
        except GraphBubbleUp:
            # interrupt() (human_review) is control flow, not a failure.
            if logger:
                logger.log("node_interrupted", node=name, latency_ms=_ms_since(start))
            raise
        except Exception as exc:
            if logger:
                logger.log(
                    "node_error",
                    node=name,
                    latency_ms=_ms_since(start),
                    error_type=type(exc).__name__,
                    error=str(exc)[:500],
                )
            raise

        if logger:
            logger.log("node_complete", node=name, latency_ms=_ms_since(start))
        return result

    wrapper.__name__ = getattr(fn, "__name__", name)
    wrapper.__doc__ = fn.__doc__
    return wrapper


def _ms_since(start: float) -> float:
    return round((time.perf_counter() - start) * 1000, 2)


class LLMUsageCallback(BaseCallbackHandler):
    """Logs one `llm_call` event per model call, with tokens and latency."""

    # Run synchronously in the event loop instead of a thread pool - the
    # handler only does a dict lookup and a log write.
    run_inline = True

    def __init__(self, logger):
        self.logger = logger
        self._starts: dict[UUID, tuple[float, Optional[str]]] = {}
        self.total_tokens = 0
        self.calls = 0

    def on_chat_model_start(self, serialized, messages, *, run_id: UUID, metadata=None, **kwargs: Any):
        self._starts[run_id] = (time.perf_counter(), (metadata or {}).get("langgraph_node"))

    def on_llm_start(self, serialized, prompts, *, run_id: UUID, metadata=None, **kwargs: Any):
        self._starts[run_id] = (time.perf_counter(), (metadata or {}).get("langgraph_node"))

    def on_llm_end(self, response: LLMResult, *, run_id: UUID, **kwargs: Any):
        start, node = self._starts.pop(run_id, (None, None))
        usage = _extract_usage(response)
        llm_output = response.llm_output or {}

        self.calls += 1
        self.total_tokens += usage["total_tokens"] or 0

        self.logger.log(
            "llm_call",
            node=node,
            model=llm_output.get("model_name"),
            latency_ms=_ms_since(start) if start else None,
            **usage,
        )

    def on_llm_error(self, error: BaseException, *, run_id: UUID, **kwargs: Any):
        start, node = self._starts.pop(run_id, (None, None))
        self.logger.log(
            "llm_error",
            node=node,
            latency_ms=_ms_since(start) if start else None,
            error_type=type(error).__name__,
            error=str(error)[:500],
        )


def _extract_usage(response: LLMResult) -> dict:
    """
    Chat models report usage on the message (`usage_metadata`); older
    integrations only put it in `llm_output["token_usage"]`. Try both.
    """
    for generations in response.generations:
        for generation in generations:
            usage = getattr(getattr(generation, "message", None), "usage_metadata", None)
            if usage:
                return {
                    "prompt_tokens": usage.get("input_tokens"),
                    "completion_tokens": usage.get("output_tokens"),
                    "total_tokens": usage.get("total_tokens"),
                }

    token_usage = (response.llm_output or {}).get("token_usage") or {}
    return {
        "prompt_tokens": token_usage.get("prompt_tokens"),
        "completion_tokens": token_usage.get("completion_tokens"),
        "total_tokens": token_usage.get("total_tokens"),
    }
