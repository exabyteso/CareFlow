"""KEPH floor and red-flag bit from catalog rows (rules, not embeddings)."""

from __future__ import annotations

from typing import Protocol


RED_FLAG_KEPH_MIN = 4


class RuleSymptom(Protocol):
    keph_min: int
    red_flag: bool


def rules_from_symptoms(rows: tuple[RuleSymptom, ...] | list[RuleSymptom]) -> tuple[int, bool]:
    """Return ``(keph_min, red_flag)`` for recommend.

    Floor is MAX(keph_min). Any red-flag row lifts the floor to at least 4.
    Empty input is the caller's problem; do not invent a default facility level.
    """
    if not rows:
        raise ValueError("rules_from_symptoms requires at least one catalog row")
    red_flag = any(row.red_flag for row in rows)
    keph_min = max(row.keph_min for row in rows)
    if red_flag:
        keph_min = max(RED_FLAG_KEPH_MIN, keph_min)
    return keph_min, red_flag
