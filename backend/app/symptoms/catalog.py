"""Load and validate the committed Kenya symptom catalog (no embeddings)."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

SYNONYM_LANGS = frozenset({"en", "sw", "ki", "luo", "kln", "kam"})
_SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")

# app/symptoms/catalog.py → parents[2] is backend/ locally and /app in Docker.
CATALOG_PATH = Path(__file__).resolve().parents[2] / "data" / "kenya-symptoms.json"


class CatalogError(ValueError):
    """Committed catalog JSON failed validation."""


@dataclass(frozen=True, slots=True)
class Synonym:
    lang: str
    phrase: str


@dataclass(frozen=True, slots=True)
class Symptom:
    slug: str
    keph_min: int
    red_flag: bool
    icd11_uri: str | None
    ciel_concept_id: str | None
    synonyms: tuple[Synonym, ...]


def _optional_text(value: object, *, field: str, slug: str) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise CatalogError(f"{slug}: {field} must be a string or null")
    text = value.strip()
    return text or None


def _parse_synonyms(raw: object, *, slug: str) -> tuple[Synonym, ...]:
    if not isinstance(raw, list) or not raw:
        raise CatalogError(f"{slug}: synonyms must be a non-empty list")
    seen: set[tuple[str, str]] = set()
    langs: set[str] = set()
    items: list[Synonym] = []
    for entry in raw:
        if not isinstance(entry, dict):
            raise CatalogError(f"{slug}: each synonym must be an object")
        lang = entry.get("lang")
        phrase = entry.get("phrase")
        if not isinstance(lang, str) or lang not in SYNONYM_LANGS:
            raise CatalogError(f"{slug}: synonym lang must be one of {sorted(SYNONYM_LANGS)}")
        if not isinstance(phrase, str) or not phrase.strip():
            raise CatalogError(f"{slug}: synonym phrase must be non-empty")
        cleaned = phrase.strip()
        key = (lang, cleaned.casefold())
        if key in seen:
            raise CatalogError(f"{slug}: duplicate synonym {lang!r} {cleaned!r}")
        seen.add(key)
        langs.add(lang)
        items.append(Synonym(lang=lang, phrase=cleaned))
    if "en" not in langs or "sw" not in langs:
        raise CatalogError(f"{slug}: synonyms must include both en and sw")
    return tuple(items)


def _parse_symptom(raw: object) -> Symptom:
    if not isinstance(raw, dict):
        raise CatalogError("each catalog row must be an object")
    slug = raw.get("slug")
    if not isinstance(slug, str) or not _SLUG_RE.fullmatch(slug):
        raise CatalogError(f"invalid slug: {slug!r}")
    keph = raw.get("keph_min")
    if not isinstance(keph, int) or isinstance(keph, bool) or not (2 <= keph <= 6):
        raise CatalogError(f"{slug}: keph_min must be an integer 2-6")
    red_flag = raw.get("red_flag")
    if not isinstance(red_flag, bool):
        raise CatalogError(f"{slug}: red_flag must be a boolean")
    if red_flag and keph < 4:
        raise CatalogError(f"{slug}: red_flag requires keph_min >= 4")
    synonyms = _parse_synonyms(raw.get("synonyms"), slug=slug)
    return Symptom(
        slug=slug,
        keph_min=keph,
        red_flag=red_flag,
        icd11_uri=_optional_text(raw.get("icd11_uri"), field="icd11_uri", slug=slug),
        ciel_concept_id=_optional_text(
            raw.get("ciel_concept_id"), field="ciel_concept_id", slug=slug
        ),
        synonyms=synonyms,
    )


def parse_catalog(payload: Any) -> tuple[Symptom, ...]:
    if not isinstance(payload, list) or not payload:
        raise CatalogError("catalog must be a non-empty JSON array")
    symptoms: list[Symptom] = []
    slugs: set[str] = set()
    for raw in payload:
        row = _parse_symptom(raw)
        if row.slug in slugs:
            raise CatalogError(f"duplicate slug: {row.slug}")
        slugs.add(row.slug)
        symptoms.append(row)
    return tuple(symptoms)


def load_catalog(path: Path | None = None) -> tuple[Symptom, ...]:
    target = path or CATALOG_PATH
    payload = json.loads(target.read_text(encoding="utf-8"))
    return parse_catalog(payload)
