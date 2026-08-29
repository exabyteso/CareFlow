"""Catalog JSON validation. No database and no FastAPI."""

from app.symptoms.catalog import CatalogError, load_catalog, parse_catalog
from app.triage.rules import rules_from_symptoms

_J2 = (
    "chest-pain",
    "difficulty-breathing",
    "stroke-signs",
    "severe-bleeding",
)


def test_committed_catalog_loads():
    rows = load_catalog()
    assert 40 <= len(rows) <= 80
    slugs = {row.slug for row in rows}
    for slug in _J2:
        assert slug in slugs
    by_slug = {row.slug: row for row in rows}
    for slug in _J2:
        assert by_slug[slug].red_flag is True
        assert by_slug[slug].keph_min >= 4


def test_every_row_has_en_and_sw():
    for row in load_catalog():
        langs = {item.lang for item in row.synonyms}
        assert "en" in langs
        assert "sw" in langs


def test_starter_has_some_kenyan_local_langs():
    langs = {item.lang for row in load_catalog() for item in row.synonyms}
    assert {"ki", "luo", "kln", "kam"} <= langs


def test_red_flag_rules_lift_floor():
    rows = load_catalog()
    chest = next(row for row in rows if row.slug == "chest-pain")
    fever = next(row for row in rows if row.slug == "fever")
    keph_min, red_flag = rules_from_symptoms((fever, chest))
    assert red_flag is True
    assert keph_min == 4


def test_routine_rules_use_max_keph():
    rows = load_catalog()
    fever = next(row for row in rows if row.slug == "fever")
    malaria = next(row for row in rows if row.slug == "malaria-like-fever")
    keph_min, red_flag = rules_from_symptoms((fever, malaria))
    assert red_flag is False
    assert keph_min == 3


def test_parse_rejects_red_flag_below_keph_four():
    try:
        parse_catalog(
            [
                {
                    "slug": "bad-flag",
                    "keph_min": 2,
                    "red_flag": True,
                    "icd11_uri": None,
                    "ciel_concept_id": None,
                    "synonyms": [
                        {"lang": "en", "phrase": "bad"},
                        {"lang": "sw", "phrase": "mbaya"},
                    ],
                }
            ]
        )
    except CatalogError as exc:
        assert "keph_min" in str(exc)
    else:
        raise AssertionError("expected CatalogError")
