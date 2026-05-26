"""Semantic chunk retrieval — pgvector RPC with numpy cosine fallback."""
from __future__ import annotations

import logging
from typing import Any, Optional

from fastapi import HTTPException, status
from supabase import Client

from app.core.supabase_errors import run_supabase
from app.cv_intelligence.services._helpers import _rows
from app.cv_intelligence.services.embedding_service import embed_text

logger = logging.getLogger(__name__)

# Chunks with similarity below this threshold are excluded from results.
MIN_SIMILARITY: float = 0.05


def search_chunks(
    user_id: str,
    query: str,
    supabase: Client,
    resume_id: Optional[str] = None,
    top_k: int = 5,
    min_similarity: float = MIN_SIMILARITY,
) -> list[dict]:
    """
    Embed the query and return the top-k most similar resume chunks for user_id.

    Strategy:
    1. Try the Supabase RPC `match_resume_chunks` (pgvector IVFFlat cosine search).
    2. If the RPC doesn't exist or returns empty, fall back to fetching all
       relevant chunks and ranking with numpy cosine similarity in Python.

    Chunks with similarity < min_similarity are filtered out.

    Each returned dict has keys:
        chunk_id, resume_id, section_name, chunk_text, similarity
    """
    query_embedding = embed_text(query)

    # --- Attempt pgvector RPC first ---
    rpc_name = "match_resume_chunks_with_resume" if resume_id else "match_resume_chunks"
    try:
        params: dict[str, Any] = {
            "query_embedding": query_embedding,
            "match_user_id": user_id,
            "match_count": top_k,
        }
        if resume_id:
            params["match_resume_id"] = resume_id

        response = supabase.rpc(rpc_name, params).execute()
        rows = _rows(response)
        if rows:
            results = [_format_rpc_row(r) for r in rows]
            return [r for r in results if r["similarity"] >= min_similarity]
    except Exception as exc:
        logger.warning(
            "pgvector RPC %s unavailable, using numpy fallback: %s",
            rpc_name,
            exc,
        )

    # --- Python / numpy fallback ---
    return _python_cosine_search(
        user_id=user_id,
        query_embedding=query_embedding,
        supabase=supabase,
        resume_id=resume_id,
        top_k=top_k,
        min_similarity=min_similarity,
    )


def _python_cosine_search(
    user_id: str,
    query_embedding: list[float],
    supabase: Client,
    resume_id: Optional[str],
    top_k: int,
    min_similarity: float,
) -> list[dict]:
    """Fetch chunks for the user and rank by cosine similarity using numpy."""
    try:
        import numpy as np  # noqa: PLC0415
    except ImportError as exc:
        raise RuntimeError("numpy is not installed. Run: pip install numpy") from exc

    query_select = (
        supabase.table("resume_chunks")
        .select("id, resume_id, section_name, chunk_text, embedding")
        .eq("user_id", user_id)
    )
    if resume_id:
        query_select = query_select.eq("resume_id", resume_id)

    response = run_supabase("fetch resume chunks for search", query_select.execute)
    rows = _rows(response)

    if not rows:
        return []

    q_vec = np.array(query_embedding, dtype=np.float32)
    q_norm = np.linalg.norm(q_vec)
    if q_norm == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Query embedding is a zero vector.",
        )
    q_vec = q_vec / q_norm

    scored: list[tuple[float, dict]] = []
    for row in rows:
        raw_emb = row.get("embedding")
        if not raw_emb:
            continue
        emb = _parse_embedding(raw_emb)
        if len(emb) == 0:
            continue
        c_vec = np.array(emb, dtype=np.float32)
        c_norm = np.linalg.norm(c_vec)
        if c_norm == 0:
            continue
        similarity = float(np.dot(q_vec, c_vec / c_norm))
        if similarity >= min_similarity:
            scored.append((similarity, row))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[:top_k]

    return [
        {
            "chunk_id": row["id"],
            "resume_id": row["resume_id"],
            "section_name": row.get("section_name"),
            "chunk_text": row["chunk_text"],
            "similarity": round(sim, 6),
        }
        for sim, row in top
    ]


def _parse_embedding(raw: Any) -> list[float]:
    """Parse the embedding field regardless of how Supabase returns it."""
    if isinstance(raw, list):
        return [float(x) for x in raw]
    if isinstance(raw, str):
        # pgvector may return a string like "[0.1,0.2,...]"
        raw = raw.strip("[]")
        if not raw:
            return []
        return [float(x) for x in raw.split(",")]
    return []


def _format_rpc_row(row: dict) -> dict:
    return {
        "chunk_id": row.get("id") or row.get("chunk_id"),
        "resume_id": row.get("resume_id"),
        "section_name": row.get("section_name"),
        "chunk_text": row.get("chunk_text"),
        "similarity": round(float(row.get("similarity", 0.0)), 6),
    }
