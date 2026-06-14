"""Semantic chunk retrieval — pgvector RPC with numpy cosine fallback."""
from __future__ import annotations

import logging
from typing import Any, Optional

from fastapi import HTTPException, status
from supabase import Client

from app.core.config import settings
from app.core.supabase_errors import run_supabase
from app.cv_intelligence.services._helpers import _rows
from app.cv_intelligence.services.embedding_service import embed_query_batch, embed_query_text

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
    query_embedding = embed_query_text(query)
    expected_dim = settings.embedding_vector_dim
    if len(query_embedding) != expected_dim:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                f"Query embedding dimension {len(query_embedding)} does not match "
                f"configured EMBEDDING_VECTOR_DIM={expected_dim}."
            ),
        )

    active_column = settings.embedding_active_column.strip() or "embedding"

    # --- Attempt pgvector RPC first (only when using canonical embedding column) ---
    if active_column == "embedding":
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
                filtered = [r for r in results if r["similarity"] >= min_similarity]
                logger.info(
                    "Retrieval strategy=rpc function=%s column=%s dim=%s results=%s",
                    rpc_name,
                    active_column,
                    expected_dim,
                    len(filtered),
                )
                return filtered
        except Exception as exc:
            logger.warning(
                "pgvector RPC %s unavailable, using numpy fallback: %s",
                rpc_name,
                exc,
            )

    # --- Python / numpy fallback ---
    logger.info(
        "Retrieval strategy=numpy_fallback column=%s dim=%s",
        active_column,
        expected_dim,
    )
    return _python_cosine_search(
        user_id=user_id,
        query_embedding=query_embedding,
        supabase=supabase,
        resume_id=resume_id,
        top_k=top_k,
        min_similarity=min_similarity,
    )


def search_chunks_batch(
    user_id: str,
    queries: list[str],
    supabase: Client,
    resume_id: Optional[str] = None,
    top_k: int = 5,
    min_similarity: float = MIN_SIMILARITY,
) -> list[list[dict]]:
    """
    Retrieve top-k chunks for multiple queries efficiently.

    Embeds all queries in parallel, fetches resume chunks once, and ranks
    with numpy — avoids N sequential embedding + DB round trips.
    """
    if not queries:
        return []
    if len(queries) == 1:
        return [
            search_chunks(
                user_id=user_id,
                query=queries[0],
                supabase=supabase,
                resume_id=resume_id,
                top_k=top_k,
                min_similarity=min_similarity,
            )
        ]

    query_embeddings = embed_query_batch(queries)
    expected_dim = settings.embedding_vector_dim
    for index, query_embedding in enumerate(query_embeddings):
        if len(query_embedding) != expected_dim:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    f"Query embedding dimension {len(query_embedding)} does not match "
                    f"configured EMBEDDING_VECTOR_DIM={expected_dim} (query index {index})."
                ),
            )

    logger.info(
        "Retrieval strategy=batch_numpy queries=%s top_k=%s",
        len(queries),
        top_k,
    )
    return _python_cosine_search_batch(
        user_id=user_id,
        query_embeddings=query_embeddings,
        supabase=supabase,
        resume_id=resume_id,
        top_k=top_k,
        min_similarity=min_similarity,
    )


def _fetch_user_chunk_rows(
    user_id: str,
    supabase: Client,
    resume_id: Optional[str],
) -> list[dict]:
    embedding_column = settings.embedding_active_column.strip() or "embedding"
    query_select = (
        supabase.table("resume_chunks")
        .select(f"id, resume_id, section_name, chunk_text, {embedding_column}")
        .eq("user_id", user_id)
    )
    if resume_id:
        query_select = query_select.eq("resume_id", resume_id)
    response = run_supabase("fetch resume chunks for search", query_select.execute)
    return _rows(response)


def _python_cosine_search_batch(
    user_id: str,
    query_embeddings: list[list[float]],
    supabase: Client,
    resume_id: Optional[str],
    top_k: int,
    min_similarity: float,
) -> list[list[dict]]:
    """Fetch chunks once and rank each query embedding against them."""
    try:
        import numpy as np  # noqa: PLC0415
    except ImportError as exc:
        raise RuntimeError("numpy is not installed. Run: pip install numpy") from exc

    rows = _fetch_user_chunk_rows(user_id, supabase, resume_id)
    if not rows:
        return [[] for _ in query_embeddings]

    embedding_column = settings.embedding_active_column.strip() or "embedding"
    chunk_meta: list[dict] = []
    chunk_vectors: list[list[float]] = []

    for row in rows:
        raw_emb = row.get(embedding_column)
        if not raw_emb:
            continue
        emb = _parse_embedding(raw_emb)
        if not emb:
            continue
        if len(emb) != len(query_embeddings[0]):
            if settings.retrieval_require_dim_match:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=(
                        "Retrieval temporarily unavailable during embedding migration. "
                        "Please retry after re-embedding completes."
                    ),
                )
            continue
        chunk_meta.append(row)
        chunk_vectors.append(emb)

    if not chunk_vectors:
        return [[] for _ in query_embeddings]

    matrix = np.array(chunk_vectors, dtype=np.float32)
    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    matrix = matrix / norms

    results: list[list[dict]] = []
    for query_embedding in query_embeddings:
        q_vec = np.array(query_embedding, dtype=np.float32)
        q_norm = np.linalg.norm(q_vec)
        if q_norm == 0:
            results.append([])
            continue
        q_vec = q_vec / q_norm
        similarities = matrix @ q_vec
        scored: list[tuple[float, dict]] = []
        for index, sim in enumerate(similarities):
            similarity = float(sim)
            if similarity >= min_similarity:
                scored.append((similarity, chunk_meta[index]))
        scored.sort(key=lambda item: item[0], reverse=True)
        top = scored[:top_k]
        results.append([
            {
                "chunk_id": row["id"],
                "resume_id": row["resume_id"],
                "section_name": row.get("section_name"),
                "chunk_text": row["chunk_text"],
                "similarity": round(sim, 6),
            }
            for sim, row in top
        ])

    return results


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

    embedding_column = settings.embedding_active_column.strip() or "embedding"
    rows = _fetch_user_chunk_rows(user_id, supabase, resume_id)

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
        raw_emb = row.get(embedding_column)
        if not raw_emb:
            continue
        emb = _parse_embedding(raw_emb)
        if len(emb) == 0:
            continue
        c_vec = np.array(emb, dtype=np.float32)
        if c_vec.shape[0] != q_vec.shape[0]:
            message = (
                "Embedding dimension mismatch during retrieval: "
                f"chunk={row.get('id')} chunk_dim={c_vec.shape[0]} "
                f"query_dim={q_vec.shape[0]} column={embedding_column}"
            )
            if settings.retrieval_require_dim_match:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=(
                        "Retrieval temporarily unavailable during embedding migration. "
                        "Please retry after re-embedding completes."
                    ),
                ) from ValueError(message)
            logger.warning("%s", message)
            continue
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
