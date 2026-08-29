"""Unit tests for recommend KEPH floor (no database)."""

from app.facilities.ranking import keph_floor


def test_keph_floor_routine_uses_keph_min():
    assert keph_floor(red_flag=False, keph_min=2) == 2
    assert keph_floor(red_flag=False, keph_min=5) == 5


def test_keph_floor_red_flag_is_at_least_four():
    assert keph_floor(red_flag=True, keph_min=2) == 4
    assert keph_floor(red_flag=True, keph_min=4) == 4
    assert keph_floor(red_flag=True, keph_min=5) == 5
