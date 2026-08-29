"""Hospital desk tests mount the hospital router — they do not import app.main (P1 hub)."""

from __future__ import annotations

import sys
from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import text

_BACKEND_ROOT = Path(__file__).resolve().parents[3]
_backend = str(_BACKEND_ROOT)
if _backend not in sys.path:
    sys.path.insert(0, _backend)

from app.auth.seed import ensure_demo_users  # noqa: E402
from app.core.db import SessionLocal  # noqa: E402
from app.core.errors import register_exception_handlers  # noqa: E402
from app.hospital.router import router as hospital_router  # noqa: E402


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    app = FastAPI()
    app.include_router(hospital_router)
    register_exception_handlers(app)
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def mock_firebase_uid(monkeypatch: pytest.MonkeyPatch):
    def _set(uid: str) -> None:
        monkeypatch.setattr(
            "app.auth.firebase.verify_id_token",
            lambda token: {"uid": uid},
        )

    return _set


@pytest.fixture
def staff_facility_id() -> int:
    session = SessionLocal()
    try:
        ensure_demo_users(session)
        session.commit()
        row = session.execute(
            text(
                """
                SELECT facility_id FROM users
                WHERE firebase_uid = 'demo-staff'
                """
            )
        ).first()
        assert row is not None and row.facility_id is not None
        return int(row.facility_id)
    finally:
        session.close()
