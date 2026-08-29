"""Insert canonical catalog rows when the symptoms table is empty."""

from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

import pytest
from sqlalchemy import text

from app.core.db import SessionLocal
from app.symptoms.catalog import load_catalog
from app.symptoms.seed import ensure_symptom_catalog, ensure_synonym_embeddings
from app.symptoms.tests.db_support import wipe_symptom_rows


@pytest.fixture(autouse=True)
def clean_symptom_tables():
    wipe_symptom_rows()
    yield
    wipe_symptom_rows()


def test_ensure_symptom_catalog_inserts_once():
    session = SessionLocal()
    try:
        ensure_symptom_catalog(session)
        session.commit()
        ensure_symptom_catalog(session)
        session.commit()
        count = session.execute(text("SELECT COUNT(*) FROM symptoms")).scalar_one()
        expected = len(load_catalog())
        assert count == expected
        chest = session.execute(
            text("SELECT red_flag, keph_min FROM symptoms WHERE slug = 'chest-pain'")
        ).one()
        assert chest.red_flag is True
        assert int(chest.keph_min) == 4
        synonym_count = session.execute(
            text("SELECT COUNT(*) FROM symptom_synonyms")
        ).scalar_one()
        assert synonym_count == 0
    finally:
        session.close()


def test_ensure_symptom_catalog_repairs_partial_seed():
    session = SessionLocal()
    try:
        ensure_symptom_catalog(session)
        session.commit()
        session.execute(text("DELETE FROM symptoms WHERE slug = 'fever'"))
        session.commit()

        ensure_symptom_catalog(session)
        session.commit()

        count = int(session.execute(text("SELECT COUNT(*) FROM symptoms")).scalar_one())
        assert count == len(load_catalog())
        assert (
            session.execute(
                text("SELECT COUNT(*) FROM symptoms WHERE slug = 'fever'")
            ).scalar_one()
            == 1
        )
    finally:
        session.close()


def test_ensure_synonym_embeddings_inserts_once():
    session = SessionLocal()
    try:
        ensure_symptom_catalog(session)
        ensure_synonym_embeddings(session)
        session.commit()
        ensure_synonym_embeddings(session)
        session.commit()
        expected = sum(len(row.synonyms) for row in load_catalog())
        count = session.execute(text("SELECT COUNT(*) FROM symptom_synonyms")).scalar_one()
        assert count == expected
    finally:
        session.close()


def test_ensure_synonym_embeddings_repairs_partial_seed():
    session = SessionLocal()
    try:
        ensure_symptom_catalog(session)
        ensure_synonym_embeddings(session)
        session.commit()
        session.execute(
            text(
                """
                DELETE FROM symptom_synonyms
                WHERE id = (SELECT MIN(id) FROM symptom_synonyms)
                """
            )
        )
        session.commit()

        ensure_synonym_embeddings(session)
        session.commit()

        expected = sum(len(row.synonyms) for row in load_catalog())
        count = int(
            session.execute(text("SELECT COUNT(*) FROM symptom_synonyms")).scalar_one()
        )
        assert count == expected
    finally:
        session.close()


def test_concurrent_seed_initialization_is_conflict_safe():
    barrier = Barrier(2)

    def seed() -> None:
        session = SessionLocal()
        try:
            session.execute(text("SET LOCAL lock_timeout = '5s'"))
            session.execute(text("SET LOCAL statement_timeout = '15s'"))
            barrier.wait(timeout=5)
            ensure_symptom_catalog(session)
            ensure_synonym_embeddings(session)
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = [executor.submit(seed) for _ in range(2)]
        for future in futures:
            future.result(timeout=30)

    session = SessionLocal()
    try:
        symptom_count = int(
            session.execute(text("SELECT COUNT(*) FROM symptoms")).scalar_one()
        )
        synonym_count = int(
            session.execute(text("SELECT COUNT(*) FROM symptom_synonyms")).scalar_one()
        )
    finally:
        session.close()
    assert symptom_count == len(load_catalog())
    assert synonym_count == sum(len(row.synonyms) for row in load_catalog())
