"""GET /facilities/recommend — S-08 / S-01 ranking and Kenya bbox."""

_QUIET = "SEED-NBO-QUIET"
_BUSY = "SEED-NBO-BUSY"
_KANG = "SEED-NBO-KANG"
_NAIROBI = {"lat": -1.2925, "lng": 36.821, "keph_min": 4}


def test_recommend_without_auth_returns_200(client, db_reset):
    response = client.get("/facilities/recommend", params=_NAIROBI)
    assert response.status_code == 200
    payload = response.json()
    assert "facilities" in payload
    assert isinstance(payload["facilities"], list)
    assert payload["facilities"]


def test_recommend_quieter_before_busier_and_keph_filter(client, db_reset):
    response = client.get("/facilities/recommend", params=_NAIROBI)
    assert response.status_code == 200
    rows = response.json()["facilities"]
    codes = [row["kmhfr_code"] for row in rows]
    by_code = {row["kmhfr_code"]: row for row in rows}

    assert _KANG not in codes
    assert _QUIET in codes
    assert _BUSY in codes
    assert codes.index(_QUIET) < codes.index(_BUSY)

    assert by_code[_QUIET]["wait_count"] == 3
    assert by_code[_BUSY]["wait_count"] == 18
    wait_counts = [row["wait_count"] for row in rows]
    assert wait_counts == sorted(wait_counts)


def test_recommend_out_of_kenya_returns_400(client):
    response = client.get(
        "/facilities/recommend",
        params={"lat": 40.7128, "lng": -74.006, "keph_min": 4},
    )
    assert response.status_code == 400
    error = response.json()["error"]
    assert error["code"] == "location_out_of_range"
    assert "message" in error
