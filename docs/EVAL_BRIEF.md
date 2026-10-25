# Observability & RAG Metrics: A Beginner's Brief

A short guide to what was added and why. For full details, see
[EVALUATION_AND_OBSERVABILITY.md](EVALUATION_AND_OBSERVABILITY.md).

## The big picture

A RAG chatbot answers in two steps:

1. **Retrieve**: find chunks of your documents that look related to the question.
2. **Generate**: the LLM writes an answer using those chunks.

Either step can go wrong, and you need two things to catch it:

- **Observability** tells you **what happened** on a request.
- **Metrics** tell you **how good** the answer was.

---

## 1. Observability: "What happened?"

**Idea:** every request gets an ID (`trace_id`). Each step writes a small
log line (an *event*) tagged with that ID. To debug one request, you gather
all the lines with its ID and read them in order.

What gets logged (in `backend/logs/rag_trace.jsonl`):

| Event | Tells you |
|---|---|
| `router_decision` | Which path the bot chose (knowledge / revenue / general) |
| `retrieval_complete` | Which chunks were found, their scores, and which were kept |
| `grade_decision` | Whether the found text was judged relevant (if not, the bot falls back) |
| `llm_call` | Tokens used and time taken for each LLM call |
| `node_complete` | How long each step took |
| `request_complete` | Total time the user waited |

**How it's done:** each step in the graph is wrapped in a small timer
(`traced_node`). A callback (`LLMUsageCallback`) listens to every LLM call
and records its tokens. The node code itself didn't have to change.

**Where to look:**
- `GET /observability/summary`: averages such as slowest steps, token cost and fallback rate (admin only)
- `GET /observability/traces/{trace_id}`: every event for one request
- `uv run python -m app.observability.summary`: the same summary in your terminal

> Example: a user says the bot "didn't know" something. Open their trace and
> check `retrieval_complete`. If the right chunk has `kept: false`, retrieval
> found it but the score threshold dropped it. That's a retrieval problem,
> not an LLM problem.

---

## 2. Faithfulness: "Did the bot make things up?"

**Question:** Is everything in the **answer** backed by the **retrieved text**?

**How it's measured:**
1. Split the answer into small facts ("claims").
2. Ask a judge LLM, for each claim: "Is this stated in the retrieved text?"
3. `faithfulness = supported claims / total claims`

**Example**
- Retrieved text: *"Implementation costs LKR 200,000. Monthly fee is LKR 8,500."*
- Answer: *"Implementation is LKR 200,000, the monthly fee is LKR 8,500, and there's a 12-month contract."*
- Claims: 3. Supported: 2. The 12-month contract isn't in the text.
- **Faithfulness = 2/3 ≈ 0.67**

**Low score = hallucination.** Fix the generation prompt or the model.

> A claim can be true in real life and still count as unsupported. What
> matters is whether it's *in the retrieved text*.

---

## 3. Context precision: "Did we retrieve the right stuff?"

**Question:** Of the chunks we retrieved, how many were actually useful,
and were the useful ones ranked **first**?

**How it's measured:** the judge marks each retrieved chunk relevant or
not. Then precision is calculated at each position where a relevant chunk
appears, and those values are averaged. A useful chunk at the top counts
more than one lower down.

**Example**
- `[relevant, relevant, junk]` → **1.0**
- `[junk, relevant, relevant]` → (1/2 + 2/3) / 2 ≈ **0.58**

Both lists contain the same chunks. The second scores lower because the
junk came first.

**Low score = noisy retrieval.** Tune the reranker threshold or fetch fewer chunks.

> In this project retrieval currently keeps only **1** chunk, so precision
> is either 0 ("wrong chunk") or 1 ("right chunk").

---

## 4. Context recall: "Did we retrieve *everything* needed?"

**Question:** Does the retrieved text contain all the facts in the
**expected answer** from `test_queries.csv`?

`recall = facts found in retrieved text / facts in expected answer`

Example: *"What are the total costs?"* needs both the implementation fee and
the monthly fee. If only the implementation chunk was retrieved, **recall = 0.5**.

This one needs a known correct answer, so it only runs in offline tests.

---

## Reading the scores together

| Faithfulness | Recall | Meaning |
|---|---|---|
| High | High | Working well |
| High | Low | Honest but incomplete. **Retrieval** missed something |
| Low | High | Had the facts but made things up. **Generation** problem |
| Low | Low | Missing facts, and the model filled gaps by guessing |

---

## Try it

```bash
cd backend
uv run python -m app.evaluation.run --limit 3   # quick test on 3 questions
uv run python -m app.evaluation.run             # all questions in test_queries.csv
```

Results are saved in `backend/eval_results/<timestamp>/`:

- `results.csv`: one row per question with its scores
- `results.json`: the same, plus the judge's reason for every verdict. Read this to learn *why* something scored low.
- `summary.json`: averages

To score a share of real user answers, set `EVAL_ONLINE_SAMPLE_RATE=0.1`
in `.env.local`. That scores 10% of answers in the background, with no
delay for users.

## Key terms

- **Trace:** all the log events for one request, linked by `trace_id`.
- **Chunk:** a piece of a document stored in the vector database.
- **Reranker:** a second model that reorders retrieved chunks by relevance.
- **LLM-as-judge:** using an LLM to grade another LLM's output. It's fast and flexible but not perfect, so spot-check its reasons.
- **Hallucination:** the model stating something its sources don't support.
