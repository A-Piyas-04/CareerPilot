"""Schema migration safety checks for Career Assistant features."""
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
MIGRATIONS = ROOT / "supabase" / "migrations"
DOCKER_MIGRATIONS = Path("/supabase/migrations")


def migration_text() -> str:
    migrations = MIGRATIONS if MIGRATIONS.exists() else DOCKER_MIGRATIONS
    return "\n".join(
        path.read_text(encoding="utf-8").lower() for path in migrations.glob("*.sql")
    )


def test_grants_exist_for_feature_tables():
    sql = migration_text()

    for table in [
        "applications",
        "goals",
        "tasks",
        "calendar_events",
        "assistant_conversations",
        "assistant_messages",
        "roadmaps",
        "roadmap_items",
        "cover_letters",
    ]:
        assert f"public.{table}" in sql


def test_roadmap_schema_compatibility_migration_exists():
    sql = migration_text()

    assert "alter table public.roadmaps" in sql
    assert "resume_id uuid references public.resumes" in sql
    assert "alter table public.roadmap_items" in sql
    assert "updated_at timestamptz" in sql
    assert "update_roadmap_items_updated_at" in sql


def test_cover_letter_management_migration_exists():
    sql = migration_text()

    for column in ["job_title", "company_name", "job_description", "tone", "extra_notes"]:
        assert f"add column if not exists {column}" in sql
    assert "grant select, insert, update, delete on public.cover_letters" in sql
