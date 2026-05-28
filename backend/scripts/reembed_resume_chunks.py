"""Resumable one-time backfill for resume chunk embeddings."""
from __future__ import annotations

import json
from pathlib import Path

from app.cv_intelligence.services.reembedding_service import fetch_chunk_batch, reembed_batch

_PROGRESS_FILE = Path(".reembed_progress.json")
_BATCH_SIZE = 50


def _load_progress() -> dict:
    if not _PROGRESS_FILE.exists():
        return {"offset": 0, "updated": 0}
    return json.loads(_PROGRESS_FILE.read_text(encoding="utf-8"))


def _save_progress(progress: dict) -> None:
    _PROGRESS_FILE.write_text(json.dumps(progress, indent=2), encoding="utf-8")


def main() -> None:
    progress = _load_progress()
    updated = int(progress.get("updated", 0))

    while True:
        rows = fetch_chunk_batch(batch_size=_BATCH_SIZE)
        if not rows:
            break
        updated_now = reembed_batch(rows)
        updated += updated_now
        _save_progress({"updated": updated})
        print(f"Processed batch_size={len(rows)}, total_updated={updated}")

    print(f"Re-embedding completed. Total updated rows: {updated}")


if __name__ == "__main__":
    main()

