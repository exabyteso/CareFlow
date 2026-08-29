"""Map an utterance onto catalog symptoms via pgvector cosine search."""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import bindparam, text
from sqlalchemy.orm import Session

from app.symptoms.catalog import SYNONYM_LANGS
from app.symptoms.embeddings import (
    CONFIDENCE_FLOOR,
    EMBEDDING_MODEL,
    embed_phrase,
    vector_literal,
)
from app.symptoms.seed import ensure_synonym_embeddings
from app.triage.rules import rules_from_symptoms

_MAP_SQL = text(
    """
    SELECT s.id,
           s.slug,
           s.keph_min,
           s.red_flag,
           1.0 - (sy.embedding <=> CAST(:query AS vector)) AS score
    FROM symptom_synonyms sy
    JOIN symptoms s ON s.id = sy.symptom_id
    WHERE s.active
      AND sy.embedding_model = :model
      AND sy.lang IN :langs
    ORDER BY sy.embedding <=> CAST(:query AS vector)
    LIMIT 40
    """
).bindparams(bindparam("langs", expanding=True))


class EmbeddingModelMismatch(RuntimeError):
    """Stored synonym vectors are not the model this API search uses."""


@dataclass(frozen=True, slots=True)
class SymptomMatch:
    id: int
    symptom_id: str
    score: float
    keph_min: int
    red_flag: bool


@dataclass(frozen=True, slots=True)
class MapResult:
    matches: tuple[SymptomMatch, ...]
    keph_min: int | None
    red_flag: bool


def _search_langs(lang: str) -> tuple[str, ...]:
    if lang in ("en", "sw"):
        return ("en", "sw")
    return (lang, "en", "sw")


def map_utterance(session: Session, *, text_value: str, lang: str) -> MapResult:
    if lang not in SYNONYM_LANGS:
        raise ValueError(f"unsupported lang: {lang}")
    ensure_synonym_embeddings(session)

    models = {
        str(row)
        for row in session.execute(
            text("SELECT DISTINCT embedding_model FROM symptom_synonyms")
        ).scalars()
    }
    if models and models != {EMBEDDING_MODEL}:
        raise EmbeddingModelMismatch(
            "synonym embeddings do not match the API embedding model"
        )

    query = vector_literal(embed_phrase(text_value))
    rows = session.execute(
        _MAP_SQL,
        {
            "query": query,
            "model": EMBEDDING_MODEL,
            "langs": list(_search_langs(lang)),
        },
    ).mappings()

    best: dict[str, SymptomMatch] = {}
    for row in rows:
        score = float(row["score"])
        if score < CONFIDENCE_FLOOR:
            continue
        slug = str(row["slug"])
        current = best.get(slug)
        if current is None or score > current.score:
            best[slug] = SymptomMatch(
                id=int(row["id"]),
                symptom_id=slug,
                score=round(score, 4),
                keph_min=int(row["keph_min"]),
                red_flag=bool(row["red_flag"]),
            )

    ordered = tuple(sorted(best.values(), key=lambda item: item.score, reverse=True))
    if not ordered:
        return MapResult(matches=(), keph_min=None, red_flag=False)

    keph_min, red_flag = rules_from_symptoms(ordered)
    return MapResult(matches=ordered, keph_min=keph_min, red_flag=red_flag)
