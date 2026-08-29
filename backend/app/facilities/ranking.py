"""KEPH floor and ranking mode for facility recommend (J7 routine, J2 red flag)."""

from __future__ import annotations

RED_FLAG_KEPH_MIN = 4


def keph_floor(*, red_flag: bool, keph_min: int) -> int:
    """Inclusive KEPH floor for recommend.

    Routine: the caller's ``keph_min``. Red flag: at least Level 4, and never
    below the caller's floor if rules already picked 5 or 6.
    """
    if red_flag:
        return max(RED_FLAG_KEPH_MIN, keph_min)
    return keph_min
