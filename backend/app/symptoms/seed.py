"""Insert missing canonical symptom rows and Wave 1 hash synonym vectors."""

from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.symptoms.catalog import Symptom, load_catalog
from app.symptoms.embeddings import EMBEDDING_MODEL, embed_phrase, vector_literal

_INSERT_SYMPTOM = text(
    """
    INSERT INTO symptoms (
      slug, keph_min, red_flag, icd11_uri, ciel_concept_id, active
    ) VALUES (
      :slug, :keph_min, :red_flag, :icd11_uri, :ciel_concept_id, TRUE
    )
    ON CONFLICT (slug) DO NOTHING
    """
)

_INSERT_SYNONYM = text(
    """
    INSERT INTO symptom_synonyms (
      symptom_id, lang, phrase, embedding, embedding_model
    ) VALUES (
      :symptom_id,
      CAST(:lang AS synonym_lang),
      :phrase,
      CAST(:embedding AS vector),
      :embedding_model
    )
    ON CONFLICT (symptom_id, lang, phrase) DO NOTHING
    """
)


def _row(symptom: Symptom) -> dict[str, object]:
    return {
        "slug": symptom.slug,
        "keph_min": symptom.keph_min,
        "red_flag": symptom.red_flag,
        "icd11_uri": symptom.icd11_uri,
        "ciel_concept_id": symptom.ciel_concept_id,
    }


def ensure_symptom_catalog(session: Session) -> None:
    """Insert missing catalog rows without overwriting runtime catalog changes."""
    existing = set(session.execute(text("SELECT slug FROM symptoms")).scalars())
    rows = [_row(item) for item in load_catalog() if item.slug not in existing]
    if not rows:
        return
    session.execute(_INSERT_SYMPTOM, rows)


def ensure_synonym_embeddings(session: Session) -> None:
    """Insert missing hash vectors without replacing another embedding model."""
    ensure_symptom_catalog(session)
    existing = {
        (str(row.slug), str(row.lang), str(row.phrase))
        for row in session.execute(
            text(
                """
                SELECT s.slug, sy.lang, sy.phrase
                FROM symptom_synonyms sy
                JOIN symptoms s ON s.id = sy.symptom_id
                """
            )
        )
    }
    ids = {
        str(row.slug): int(row.id)
        for row in session.execute(text("SELECT id, slug FROM symptoms")).mappings()
    }
    rows: list[dict[str, object]] = []
    for symptom in load_catalog():
        symptom_id = ids.get(symptom.slug)
        if symptom_id is None:
            continue
        for synonym in symptom.synonyms:
            if (symptom.slug, synonym.lang, synonym.phrase) in existing:
                continue
            rows.append(
                {
                    "symptom_id": symptom_id,
                    "lang": synonym.lang,
                    "phrase": synonym.phrase,
                    "embedding": vector_literal(embed_phrase(synonym.phrase)),
                    "embedding_model": EMBEDDING_MODEL,
                }
            )
    if rows:
        session.execute(_INSERT_SYNONYM, rows)
