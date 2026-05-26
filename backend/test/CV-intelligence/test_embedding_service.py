"""Tests for embedding_service — HashingVectorizer 384-dim vectors."""
import pytest

from app.cv_intelligence.services.embedding_service import (
    EMBEDDING_DIM,
    embed_batch,
    embed_text,
)


class TestEmbedText:
    def test_returns_list(self):
        result = embed_text("Python developer with FastAPI experience.")
        assert isinstance(result, list)

    def test_correct_dimension(self):
        result = embed_text("Machine learning engineer.")
        assert len(result) == EMBEDDING_DIM, (
            f"Expected {EMBEDDING_DIM} dims, got {len(result)}"
        )

    def test_all_floats(self):
        result = embed_text("Software engineer.")
        assert all(isinstance(v, float) for v in result)

    def test_non_zero_vector(self):
        result = embed_text("Python, React, Docker.")
        assert any(v != 0.0 for v in result)

    def test_different_texts_produce_different_vectors(self):
        v1 = embed_text("Python developer")
        v2 = embed_text("Accountant with Excel skills")
        assert v1 != v2

    def test_overlapping_texts_higher_similarity_than_unrelated(self):
        """Texts with shared tokens should be more similar than unrelated pairs."""
        import numpy as np

        def cosine(a: list[float], b: list[float]) -> float:
            va, vb = np.array(a), np.array(b)
            return float(np.dot(va, vb) / (np.linalg.norm(va) * np.linalg.norm(vb)))

        v_python_eng = embed_text("Python software engineer")
        v_python_dev = embed_text("Python developer")
        v_chef = embed_text("Professional pastry chef with baking expertise")

        overlap_sim = cosine(v_python_eng, v_python_dev)
        unrelated_sim = cosine(v_python_eng, v_chef)
        assert overlap_sim > unrelated_sim

    def test_identical_texts_unit_cosine_similarity(self):
        import numpy as np

        text = "Python backend developer"
        v1 = np.array(embed_text(text))
        v2 = np.array(embed_text(text))
        cos_sim = float(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2)))
        assert cos_sim == pytest.approx(1.0, rel=1e-5)


class TestEmbedBatch:
    def test_empty_list_returns_empty(self):
        assert embed_batch([]) == []

    def test_single_item(self):
        result = embed_batch(["Python developer"])
        assert len(result) == 1
        assert len(result[0]) == EMBEDDING_DIM

    def test_multiple_items_correct_count(self):
        texts = ["Python", "React", "Docker", "PostgreSQL", "AWS"]
        result = embed_batch(texts)
        assert len(result) == len(texts)

    def test_all_vectors_correct_dimension(self):
        texts = ["skill one", "skill two", "skill three"]
        result = embed_batch(texts)
        for vec in result:
            assert len(vec) == EMBEDDING_DIM

    def test_batch_matches_individual_embeddings(self):
        texts = ["Python developer", "FastAPI backend"]
        batch_result = embed_batch(texts)
        for i, text in enumerate(texts):
            single = embed_text(text)
            assert batch_result[i] == single

    def test_order_preserved(self):
        texts = ["alpha text", "beta text", "gamma text"]
        batch = embed_batch(texts)
        singles = [embed_text(t) for t in texts]
        assert batch == singles
