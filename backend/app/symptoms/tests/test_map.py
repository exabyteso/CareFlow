"""POST /symptoms/map against a package-local app (main.py is a P1 hub)."""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.core.db import SessionLocal
from app.core.errors import register_exception_handlers
from app.symptoms.catalog import SYNONYM_LANGS, load_catalog
from app.symptoms.router import router
from app.symptoms.seed import ensure_symptom_catalog, ensure_synonym_embeddings
from app.symptoms.tests.db_support import wipe_symptom_rows

_map_app = FastAPI()
_map_app.include_router(router)
register_exception_handlers(_map_app)


def _language_cases() -> list[tuple[str, str, str]]:
    cases: list[tuple[str, str, str]] = []
    remaining = set(SYNONYM_LANGS)
    for symptom in load_catalog():
        for synonym in symptom.synonyms:
            if synonym.lang in remaining:
                cases.append((synonym.lang, synonym.phrase, symptom.slug))
                remaining.remove(synonym.lang)
    assert not remaining, f"catalog has no phrases for: {sorted(remaining)}"
    return cases


@pytest.fixture(autouse=True)
def clean_symptom_tables():
    wipe_symptom_rows()
    yield
    wipe_symptom_rows()


def test_map_exact_english_phrase_returns_chest_pain_and_red_flag():
    session = SessionLocal()
    try:
        ensure_symptom_catalog(session)
        ensure_synonym_embeddings(session)
        session.commit()
    finally:
        session.close()

    client = TestClient(_map_app)
    response = client.post(
        "/symptoms/map",
        json={"text": "chest pain", "lang": "en"},
    )
    assert response.status_code == 200
    payload = response.json()
    slugs = [row["symptom_id"] for row in payload["matches"]]
    assert "chest-pain" in slugs
    assert payload["red_flag"] is True
    assert payload["keph_min"] == 4
    chest = next(row for row in payload["matches"] if row["symptom_id"] == "chest-pain")
    assert chest["score"] >= 0.55


def test_map_unknown_utterance_returns_empty_matches():
    session = SessionLocal()
    try:
        ensure_symptom_catalog(session)
        ensure_synonym_embeddings(session)
        session.commit()
    finally:
        session.close()

    client = TestClient(_map_app)
    response = client.post(
        "/symptoms/map",
        json={"text": "xyzzy-not-a-symptom-qqq", "lang": "en"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["matches"] == []
    assert payload["keph_min"] is None
    assert payload["red_flag"] is False


@pytest.mark.parametrize(
    ("lang", "phrase", "expected_slug"),
    _language_cases(),
)
def test_map_supports_each_catalog_language(lang, phrase, expected_slug):
    session = SessionLocal()
    try:
        ensure_symptom_catalog(session)
        ensure_synonym_embeddings(session)
        session.commit()
    finally:
        session.close()

    response = TestClient(_map_app).post(
        "/symptoms/map",
        json={"text": phrase, "lang": lang},
    )

    assert response.status_code == 200, response.text
    assert expected_slug in {
        match["symptom_id"] for match in response.json()["matches"]
    }


def test_map_aggregates_rules_from_database_rows():
    session = SessionLocal()
    try:
        ensure_symptom_catalog(session)
        ensure_synonym_embeddings(session)
        session.execute(
            text(
                """
                UPDATE symptoms
                SET keph_min = 5, red_flag = FALSE
                WHERE slug = 'chest-pain'
                """
            )
        )
        session.commit()
    finally:
        session.close()

    response = TestClient(_map_app).post(
        "/symptoms/map",
        json={"text": "chest pain", "lang": "en"},
    )

    assert response.status_code == 200, response.text
    payload = response.json()
    chest = next(
        match for match in payload["matches"] if match["symptom_id"] == "chest-pain"
    )
    assert chest["keph_min"] == 5
    assert chest["red_flag"] is False
    assert payload["keph_min"] == 5
    assert payload["red_flag"] is False


def test_map_rejects_mixed_embedding_models():
    session = SessionLocal()
    try:
        ensure_symptom_catalog(session)
        ensure_synonym_embeddings(session)
        session.execute(
            text(
                """
                UPDATE symptom_synonyms
                SET embedding_model = 'other-model'
                WHERE id = (SELECT MIN(id) FROM symptom_synonyms)
                """
            )
        )
        session.commit()
    finally:
        session.close()

    response = TestClient(_map_app).post(
        "/symptoms/map",
        json={"text": "chest pain", "lang": "en"},
    )
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "embedding_model_mismatch"


def test_map_rejects_unknown_lang():
    client = TestClient(_map_app)
    response = client.post(
        "/symptoms/map",
        json={"text": "homa", "lang": "fr"},
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"
