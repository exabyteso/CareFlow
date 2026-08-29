"""Hash embedding unit tests (no database)."""

from app.symptoms.embeddings import (
    EMBEDDING_DIM,
    embed_phrase,
    vector_literal,
)


def test_identical_phrases_match():
    left = embed_phrase("chest pain")
    right = embed_phrase("  Chest Pain  ")
    assert len(left) == EMBEDDING_DIM
    assert left == right
    assert abs(sum(item * item for item in left) - 1.0) < 1e-6


def test_different_phrases_are_not_identical():
    assert embed_phrase("chest pain") != embed_phrase("fever")


def test_vector_literal_shape():
    literal = vector_literal(embed_phrase("homa"))
    assert literal.startswith("[")
    assert literal.endswith("]")
    assert literal.count(",") == EMBEDDING_DIM - 1
