"""Batch re-embedding utilities for migration backfills."""
from __future__ import annotations

from app.core.database import get_supabase_client
from app.cv_intelligence.services.embedding_service import embed_document_batch


def fetch_chunk_batch(batch_size: int) -> list[dict]:
    """Fetch ordered chunk rows for re-embedding."""
    supabase = get_supabase_client()
    response = (
        supabase.table("resume_chunks")
        .select("id,chunk_text,embedding_new")
        .is_("embedding_new", "null")
        .order("created_at")
        .limit(batch_size)
        .execute()
    )
    return getattr(response, "data", None) or []


def reembed_batch(rows: list[dict], target_column: str = "embedding_new") -> int:
    """Recompute embeddings for a chunk batch and write them back."""
    if not rows:
        return 0

    supabase = get_supabase_client()
    pending_rows = [r for r in rows if r.get(target_column) is None]
    if not pending_rows:
        return 0

    texts = [str(r.get("chunk_text", "")) for r in pending_rows]
    vectors = embed_document_batch(texts)

    updated = 0
    for row, vector in zip(pending_rows, vectors):
        chunk_id = row.get("id")
        if not chunk_id:
            continue
        (
            supabase.table("resume_chunks")
            .update({target_column: vector})
            .eq("id", chunk_id)
            .execute()
        )
        updated += 1
    return updated


def get_reembedding_status() -> dict:
    """
    Return lightweight migration progress counts.
    If embedding_new does not exist yet, reports unavailable status.
    """
    supabase = get_supabase_client()
    try:
        pending_resp = (
            supabase.table("resume_chunks")
            .select("id", count="exact")
            .is_("embedding_new", "null")
            .execute()
        )
        ready_resp = (
            supabase.table("resume_chunks")
            .select("id", count="exact")
            .not_.is_("embedding_new", "null")
            .execute()
        )
    except Exception:
        return {"available": False}

    pending = getattr(pending_resp, "count", 0) or 0
    ready = getattr(ready_resp, "count", 0) or 0
    total = pending + ready
    return {
        "available": True,
        "backfilled": ready,
        "pending": pending,
        "total": total,
        "completion_ratio": (ready / total) if total else 1.0,
    }

