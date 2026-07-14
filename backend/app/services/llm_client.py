from typing import AsyncIterator

from groq import AsyncGroq
from app.config import settings

client = AsyncGroq(api_key=settings.GROQ_API_KEY)


async def call_llm_api(message_array: list[dict]) -> str:

    completion = await client.chat.completions.create(
        messages=message_array,
        model="llama-3.3-70b-versatile",
        temperature=0.2,
        max_tokens=1024,
    )

    return completion.choices[0].message.content


async def stream_llm_api(message_array: list[dict]) -> AsyncIterator[str]:

    stream = await client.chat.completions.create(
        messages=message_array,
        model="llama-3.3-70b-versatile",
        temperature=0.2,
        max_tokens=1024,
        stream=True,
    )

    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
