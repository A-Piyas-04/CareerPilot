"""Tests for embedding_service — vector generation with all-MiniLM-L6-v2."""
import pytest

from app.cv_intelligence.services.embedding_service import (
    EMBEDDING_DIM,
    embed_batch,
    embed_text,
)

# These tests load the sentence-transformer model on first run (~100MB download
# on a fresh machine). Subsequent runs are fast because the model is cached.
# The model singleton is shared across all tests in this session.


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

    def test_similar_texts_produce_similar_vectors(self):
        """Cosine similarity between semantically close texts should be high."""
        import numpy as np

        v1 = np.array(embed_text("Python software engineer"))
        v2 = np.array(embed_text("Python developer"))
        cos_sim = float(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2)))
        assert cos_sim > 0.8, f"Expected high similarity, got {cos_sim:.3f}"

    def test_dissimilar_texts_lower_similarity(self):
        """Cosine similarity between unrelated texts should be lower."""
        import numpy as np

        v1 = np.array(embed_text("Python backend developer"))
        v2 = np.array(embed_text("Professional pastry chef with baking expertise"))
        cos_sim = float(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2)))
        assert cos_sim < 0.85, f"Expected lower similarity for unrelated texts, got {cos_sim:.3f}"


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
        """Batch and single-text embeddings must produce identical vectors."""
        texts = ["Python developer", "FastAPI backend"]
        batch_result = embed_batch(texts)
        for i, text in enumerate(texts):
            single = embed_text(text)
            assert batch_result[i] == single, (
                f"Batch embedding[{i}] differs from embed_text result"
            )

    def test_order_preserved(self):
        """Embeddings must be returned in the same order as input texts."""
        texts = ["alpha text", "beta text", "gamma text"]
        batch = embed_batch(texts)
        singles = [embed_text(t) for t in texts]
        assert batch == singles
