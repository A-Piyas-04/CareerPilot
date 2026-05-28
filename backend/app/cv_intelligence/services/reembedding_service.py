"""Batch re-embedding utilities for migration backfills."""
from __future__ import annotations

from app.core.database import get_supabase_client
from app.cv_intelligence.services.embedding_service import embed_batch


def fetch_chunk_batch(offset: int, batch_size: int) -> list[dict]:
    """Fetch ordered chunk rows for re-embedding."""
    supabase = get_supabase_client()
    response = (
        supabase.table("resume_chunks")
        .select("id,chunk_text")
        .order("created_at")
        .range(offset, offset + batch_size - 1)
        .execute()
    )
    return getattr(response, "data", None) or []


def reembed_batch(rows: list[dict]) -> int:
    """Recompute embeddings for a chunk batch and write them back."""
    if not rows:
        return 0

    supabase = get_supabase_client()
    texts = [str(r.get("chunk_text", "")) for r in rows]
    vectors = embed_batch(texts)

    updated = 0
    for row, vector in zip(rows, vectors):
        chunk_id = row.get("id")
        if not chunk_id:
            continue
        (
            supabase.table("resume_chunks")
            .update({"embedding": vector})
            .eq("id", chunk_id)
            .execute()
        )
        updated += 1
    return updated

