"""Red-flag (J2) ranking vs routine wait-then-distance (J7)."""

_QUIET = "SEED-NBO-QUIET"
_BUSY = "SEED-NBO-BUSY"
_KANG = "SEED-NBO-KANG"
# On top of the busy KEPH-4 hospital: wait ranking still prefers Quiet (wait 3).
_AT_BUSY = {"lat": -1.2942, "lng": 36.8222, "keph_min": 4}


def test_red_flag_ranks_nearest_not_quietest(client):
    routine = client.get("/facilities/recommend", params=_AT_BUSY)
    flagged = client.get(
        "/facilities/recommend",
        params={**_AT_BUSY, "red_flag": True},
    )
    assert routine.status_code == 200
    assert flagged.status_code == 200

    routine_codes = [row["kmhfr_code"] for row in routine.json()["facilities"]]
    flagged_codes = [row["kmhfr_code"] for row in flagged.json()["facilities"]]

    assert _KANG not in routine_codes
    assert _KANG not in flagged_codes
    assert routine_codes.index(_QUIET) < routine_codes.index(_BUSY)
    assert flagged_codes.index(_BUSY) < flagged_codes.index(_QUIET)


def test_red_flag_excludes_keph_below_four(client):
    response = client.get(
        "/facilities/recommend",
        params={"lat": -1.2655, "lng": 36.7448, "red_flag": True},
    )
    assert response.status_code == 200
    codes = [row["kmhfr_code"] for row in response.json()["facilities"]]
    assert _KANG not in codes
    assert all(row["keph_level"] >= 4 for row in response.json()["facilities"])
