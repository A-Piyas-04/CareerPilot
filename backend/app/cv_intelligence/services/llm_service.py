"""LLM-grounded CV answer generation using Anthropic Claude.

The system prompt strictly grounds the answer in retrieved CV chunks so the
model cannot hallucinate background that isn't in the user's resume.

If ANTHROPIC_API_KEY is not set or the anthropic package is missing, returns a
graceful fallback message rather than crashing the endpoint.
"""
from __future__ import annotations

import logging
import os
from typing import Any

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """\
You are CareerPilot, an AI career assistant. You have been given excerpts from
the user's CV (resume). Your job is to answer the user's question using ONLY
the information present in those excerpts.

Rules:
- Never invent work experience, skills, education, or achievements not found in
  the excerpts.
- If the answer is not in the excerpts, say so honestly: "I couldn't find that
  in your CV."
- Be concise, professional, and helpful.
- Refer to the user in the second person ("you", "your").
"""

_NO_KEY_MSG = (
    "AI answers are not configured yet. "
    "Set ANTHROPIC_API_KEY in your environment to enable this feature."
)

_NO_CHUNKS_MSG = (
    "No relevant sections were found in your CV for that question. "
    "Try rephrasing or upload a more detailed resume."
)

_MAX_CHUNK_CHARS = 600   # per chunk — keeps prompts within context limits
_MAX_TOTAL_CHARS = 6000  # hard cap on total context passed to Claude


def answer_from_chunks(question: str, chunks: list[dict[str, Any]]) -> str:
    """
    Build a prompt from retrieved CV chunks and ask Claude to answer the
    question.  Returns a plain-text answer string.
    """
    if not chunks:
        return _NO_CHUNKS_MSG

    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if not api_key or api_key.startswith("your-"):
        logger.warning("ANTHROPIC_API_KEY not configured; returning fallback message.")
        return _NO_KEY_MSG

    try:
        import anthropic  # noqa: PLC0415
    except ImportError:
        logger.error("anthropic package not installed; run: pip install anthropic")
        return _NO_KEY_MSG

    context_parts: list[str] = []
    total_chars = 0
    for i, chunk in enumerate(chunks, 1):
        section = chunk.get("section_name") or "General"
        text = (chunk.get("chunk_text") or "").strip()
        text = text[:_MAX_CHUNK_CHARS]
        part = f"[Excerpt {i} — {section}]\n{text}"
        if total_chars + len(part) > _MAX_TOTAL_CHARS:
            break
        context_parts.append(part)
        total_chars += len(part)

    context_block = "\n\n".join(context_parts)
    user_message = (
        f"CV Excerpts:\n\n{context_block}\n\n"
        f"Question: {question}"
    )

    try:
        client = anthropic.Anthropic(api_key=api_key)
        message = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=512,
            system=_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        return message.content[0].text.strip()
    except Exception as exc:
        logger.exception("Claude API call failed: %s", exc)
        return f"AI answer unavailable at the moment. Please try again later."
