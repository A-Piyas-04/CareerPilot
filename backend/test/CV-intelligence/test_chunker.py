"""Tests for chunker — sliding-window character chunking."""
import pytest

from app.cv_intelligence.services.chunker import (
    CHUNK_SIZE,
    OVERLAP,
    _chunk_text,
    chunk_sections,
)


# ---------------------------------------------------------------------------
# _chunk_text
# ---------------------------------------------------------------------------

class TestChunkText:
    def test_short_text_produces_one_chunk(self):
        text = "Python developer with 5 years experience."
        chunks = _chunk_text(text, "skills", 0)
        assert len(chunks) == 1
        assert chunks[0]["chunk_text"] == text

    def test_empty_text_produces_no_chunks(self):
        assert _chunk_text("", "skills", 0) == []
        assert _chunk_text("   ", "skills", 0) == []

    def test_chunk_keys_present(self):
        chunks = _chunk_text("Some content here.", "summary", 0)
        assert len(chunks) >= 1
        for c in chunks:
            assert "section_name" in c
            assert "chunk_text" in c
            assert "chunk_index" in c
            assert "token_count" in c

    def test_section_name_preserved(self):
        chunks = _chunk_text("Any text.", "experience", 0)
        for c in chunks:
            assert c["section_name"] == "experience"

    def test_chunk_index_starts_at_start_index(self):
        chunks = _chunk_text("Some text.", "skills", 5)
        assert chunks[0]["chunk_index"] == 5

    def test_chunk_index_increments(self):
        long_text = "x" * (CHUNK_SIZE * 3)
        chunks = _chunk_text(long_text, "skills", 0)
        indices = [c["chunk_index"] for c in chunks]
        assert indices == list(range(len(chunks)))

    def test_long_text_produces_multiple_chunks(self):
        long_text = "word " * 300  # ~1500 chars
        chunks = _chunk_text(long_text, "experience", 0)
        assert len(chunks) > 1

    def test_chunk_size_respected(self):
        long_text = "a" * 2000
        chunks = _chunk_text(long_text, "general", 0)
        for c in chunks:
            assert len(c["chunk_text"]) <= CHUNK_SIZE

    def test_overlap_creates_shared_content(self):
        """Consecutive chunks must share some content due to the overlap window."""
        long_text = "abcdefghij" * 100  # 1000 chars
        chunks = _chunk_text(long_text, "general", 0)
        assert len(chunks) >= 2
        # End of chunk[0] should appear in start of chunk[1]
        tail = chunks[0]["chunk_text"][-(OVERLAP):]
        head = chunks[1]["chunk_text"][:OVERLAP]
        assert tail == head, "Expected overlap between consecutive chunks"

    def test_token_count_is_positive(self):
        chunks = _chunk_text("Some text here.", "skills", 0)
        for c in chunks:
            assert c["token_count"] >= 1

    def test_token_count_approx_chars_div_4(self):
        text = "a" * 400
        chunks = _chunk_text(text, "general", 0)
        assert chunks[0]["token_count"] == 100  # 400 // 4


# ---------------------------------------------------------------------------
# chunk_sections
# ---------------------------------------------------------------------------

class TestChunkSections:
    def test_empty_sections_returns_empty(self):
        assert chunk_sections([]) == []

    def test_global_index_is_continuous(self):
        sections = [
            {"section_name": "summary", "content": "I am a developer."},
            {"section_name": "skills", "content": "Python, FastAPI, Docker"},
            {"section_name": "experience", "content": "Software Engineer at Acme"},
        ]
        chunks = chunk_sections(sections)
        indices = [c["chunk_index"] for c in chunks]
        assert indices == list(range(len(chunks))), "chunk_index must be 0-based and contiguous"

    def test_section_names_preserved_across_sections(self):
        sections = [
            {"section_name": "summary", "content": "Senior engineer."},
            {"section_name": "skills", "content": "Python React Node"},
        ]
        chunks = chunk_sections(sections)
        names = {c["section_name"] for c in chunks}
        assert "summary" in names
        assert "skills" in names

    def test_long_resume_produces_many_chunks(self):
        sections = [
            {"section_name": "experience", "content": "Engineer role. " * 100},
            {"section_name": "education", "content": "BSc CS. " * 50},
        ]
        chunks = chunk_sections(sections)
        assert len(chunks) > 2

    def test_section_with_empty_content_skipped(self):
        sections = [
            {"section_name": "summary", "content": ""},
            {"section_name": "skills", "content": "Python"},
        ]
        chunks = chunk_sections(sections)
        names = [c["section_name"] for c in chunks]
        assert "summary" not in names
        assert "skills" in names
