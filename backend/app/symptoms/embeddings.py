"""Deterministic 384-dim embeddings for Wave 1 (no sentence-transformers).

Phrase match is exact-string (same hash). Semantic paraphrase waits for
Phase 4 e5-small. Query and stored rows must use the same model id.
"""

from __future__ import annotations

import hashlib
import math

EMBEDDING_DIM = 384
EMBEDDING_MODEL = "careflow-hash-v1"
CONFIDENCE_FLOOR = 0.55


def embed_phrase(phrase: str) -> list[float]:
    """L2-normalized vector; identical folded phrases get cosine 1.0."""
    seed = hashlib.sha256(phrase.strip().casefold().encode("utf-8")).digest()
    values: list[float] = []
    block_index = 0
    while len(values) < EMBEDDING_DIM:
        block = hashlib.sha256(seed + block_index.to_bytes(4, "big")).digest()
        for offset in range(0, 32, 4):
            if len(values) >= EMBEDDING_DIM:
                break
            raw = int.from_bytes(block[offset : offset + 4], "big")
            values.append((raw / 2**32) * 2.0 - 1.0)
        block_index += 1
    norm = math.sqrt(sum(item * item for item in values)) or 1.0
    return [item / norm for item in values]


def vector_literal(values: list[float]) -> str:
    return "[" + ",".join(f"{item:.8f}" for item in values) + "]"
