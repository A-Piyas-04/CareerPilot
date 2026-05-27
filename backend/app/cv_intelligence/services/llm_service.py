"""LLM-grounded CV answer generation using Google Gemini.

The system prompt strictly grounds the answer in retrieved CV chunks so the
model cannot hallucinate background that isn't in the user's resume.

Model cascade (quota exhaustion triggers the next model in sequence):
  gemini-2.5-pro → gemini-2.5-flash → gemini-2.0-flash → gemini-1.5-flash → graceful message

If GEMINI_API_KEY is not set or the google-generativeai package is missing,
returns a graceful fallback message rather than crashing the endpoint.
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
    "Set GEMINI_API_KEY in your environment to enable this feature."
)

_NO_CHUNKS_MSG = (
    "No relevant sections were found in your CV for that question. "
    "Try rephrasing or upload a more detailed resume."
)

# Ordered cascade — tried left to right; moves to next on quota exhaustion.
_MODEL_CASCADE: list[str] = [
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
]

_MAX_CHUNK_CHARS = 600   # per chunk — keeps prompts within context limits
_MAX_TOTAL_CHARS = 6000  # hard cap on total context passed to Gemini


def _is_quota_error(exc: Exception) -> bool:
    """Return True when the exception signals a rate-limit / quota exhaustion."""
    name = type(exc).__name__
    msg  = str(exc).lower()
    return (
        "ResourceExhausted" in name
        or "429" in msg
        or "quota" in msg
        or "rate" in msg
        or "exhausted" in msg
    )


def _call_model(genai: Any, model_name: str, prompt: str) -> str:
    """Call a single Gemini model and return the response text."""
    model    = genai.GenerativeModel(model_name)
    response = model.generate_content(prompt)
    return response.text.strip()


def answer_from_chunks(question: str, chunks: list[dict[str, Any]]) -> str:
    """
    Build a prompt from retrieved CV chunks and ask Gemini to answer the
    question. Walks _MODEL_CASCADE left-to-right; moves to the next model
    on quota exhaustion. Returns a plain-text answer string.
    """
    if not chunks:
        return _NO_CHUNKS_MSG

    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or api_key.startswith("your-"):
        logger.warning("GEMINI_API_KEY not configured; returning fallback message.")
        return _NO_KEY_MSG

    try:
        import google.generativeai as genai  # noqa: PLC0415
    except ImportError:
        logger.error("google-generativeai not installed; run: pip install google-generativeai")
        return _NO_KEY_MSG

    context_parts: list[str] = []
    total_chars = 0
    for i, chunk in enumerate(chunks, 1):
        section = chunk.get("section_name") or "General"
        text    = (chunk.get("chunk_text") or "").strip()
        text    = text[:_MAX_CHUNK_CHARS]
        part    = f"[Excerpt {i} — {section}]\n{text}"
        if total_chars + len(part) > _MAX_TOTAL_CHARS:
            break
        context_parts.append(part)
        total_chars += len(part)

    full_prompt = (
        f"{_SYSTEM_PROMPT}\n\n"
        "CV Excerpts:\n\n" + "\n\n".join(context_parts) + f"\n\nQuestion: {question}"
    )

    genai.configure(api_key=api_key)

    for idx, model_name in enumerate(_MODEL_CASCADE):
        is_last = idx == len(_MODEL_CASCADE) - 1
        try:
            result = _call_model(genai, model_name, full_prompt)
            logger.info("Gemini answered via %s", model_name)
            return result
        except Exception as exc:
            if _is_quota_error(exc):
                if is_last:
                    logger.error("All models in cascade exhausted quota.")
                else:
                    next_model = _MODEL_CASCADE[idx + 1]
                    logger.warning(
                        "%s quota exhausted; trying next model: %s.",
                        model_name, next_model,
                    )
            else:
                logger.exception("Gemini %s call failed: %s", model_name, exc)
                return "AI answer unavailable at the moment. Please try again later."

    return "AI answer unavailable at the moment. Please try again later."
