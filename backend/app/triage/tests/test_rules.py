"""KEPH / red-flag rules. No database and no FastAPI."""

from dataclasses import dataclass

from app.triage.rules import RED_FLAG_KEPH_MIN, rules_from_symptoms


@dataclass(frozen=True)
class _Row:
    keph_min: int
    red_flag: bool


def test_empty_input_is_an_error():
    try:
        rules_from_symptoms(())
    except ValueError as exc:
        assert "at least one" in str(exc)
    else:
        raise AssertionError("expected ValueError")


def test_routine_uses_max_keph():
    keph_min, red_flag = rules_from_symptoms((_Row(2, False), _Row(3, False)))
    assert red_flag is False
    assert keph_min == 3


def test_red_flag_lifts_floor_to_four():
    keph_min, red_flag = rules_from_symptoms((_Row(2, False), _Row(2, True)))
    assert red_flag is True
    assert keph_min == RED_FLAG_KEPH_MIN


def test_red_flag_does_not_lower_a_higher_floor():
    keph_min, red_flag = rules_from_symptoms((_Row(5, True),))
    assert red_flag is True
    assert keph_min == 5
