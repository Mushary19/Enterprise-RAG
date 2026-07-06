import tiktoken
import uuid


def chunk_text_by_parent_child(
    raw_text: str,
    parent_size: int = 1000,
    child_size: int = 200,
    child_overlap: int = 50,
) -> tuple[list[dict], list[dict]]:

    tokenizer = tiktoken.get_encoding("cl100k_base")
    tokens = tokenizer.encode(raw_text)

    parent_payload = []
    child_payload = []

    for p_idx, p_start in enumerate(range(0, len(tokens), parent_size)):
        p_end = min(p_start + parent_size, len(tokens))
        parent_tokens = tokens[p_start:p_end]
        parent_text = tokenizer.decode(parent_tokens)
        print(parent_text)

        parent_id = str(uuid.uuid4())

        parent_payload.append(
            {
                "parent_id": parent_id,
                "text": parent_text,
                "metadata": {
                    "chunk_index": p_idx,
                    "token_count": len(parent_tokens),
                },
            }
        )

        c_start = 0

        while c_start < len(parent_tokens):
            c_end = min(c_start + child_size, len(parent_tokens))
            child_tokens = parent_tokens[c_start:c_end]
            child_text = tokenizer.decode(child_tokens)

            child_id = str(uuid.uuid4())

            child_payload.append(
                {
                    "child_id": child_id,
                    "parent_ptr": parent_id,
                    "text": child_text,
                    "metadata": {
                        "parent_chunk_index": p_idx,
                        "token_count": len(child_tokens),
                    },
                }
            )

            if c_end == len(parent_tokens):
                break

            c_start += child_size - child_overlap

    return parent_payload, child_payload
