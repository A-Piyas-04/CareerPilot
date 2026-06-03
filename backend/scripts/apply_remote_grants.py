#!/usr/bin/env python3
"""Apply PostgREST table grants on a remote Supabase database.

Usage (set DATABASE_URL from Dashboard → Project Settings → Database):
  DATABASE_URL=postgresql://postgres.[ref]:[password]@[pooler-host]:6543/postgres \\
    python backend/scripts/apply_remote_grants.py
"""
from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

import asyncpg

ROOT = Path(__file__).resolve().parents[2]
SQL_PATH = ROOT / "scripts" / "apply-remote-grants.sql"


async def main() -> None:
    database_url = os.environ.get("DATABASE_URL", "").strip()
    if not database_url:
        print(
            "Set DATABASE_URL to your Supabase connection string "
            "(Dashboard → Connect → Transaction pooler).",
            file=sys.stderr,
        )
        print(
            f"Or run the SQL manually in Supabase SQL Editor:\n  {SQL_PATH}",
            file=sys.stderr,
        )
        sys.exit(1)

    sql = SQL_PATH.read_text(encoding="utf-8")
    # Strip comment-only lines for asyncpg execute (run as one batch).
    statements = [
        line
        for line in sql.splitlines()
        if line.strip() and not line.strip().startswith("--")
    ]
    batch = "\n".join(statements)

    conn = await asyncpg.connect(database_url)
    try:
        await conn.execute(batch)
    finally:
        await conn.close()

    print("Applied grants from scripts/apply-remote-grants.sql")


if __name__ == "__main__":
    asyncio.run(main())
