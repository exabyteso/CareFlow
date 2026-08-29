"""Compose / Docker boot seed: Nairobi facilities + demo users (idempotent).

Runnable as ``python -m app.seed``. Uses the app-role ``DATABASE_URL`` only.
Lazy seed on first ``GET /me`` and ``GET /facilities/recommend`` stays in place;
this path is additive so a fresh volume has rows before the first request.
"""

from __future__ import annotations

import logging

from app.auth.firebase import upsert_demo_auth_users
from app.auth.seed import ensure_demo_users
from app.core.db import SessionLocal
from app.facilities.seed import ensure_nairobi_seed

logger = logging.getLogger(__name__)


def run_boot_seed() -> None:
    """Idempotent Postgres seed, then best-effort Firebase Auth upsert.

    Postgres is the API source of truth: Auth upsert failures are logged and
    do not raise. Missing Firebase credentials skip Auth and still leave rows.
    """
    session = SessionLocal()
    try:
        ensure_nairobi_seed(session)
        ensure_demo_users(session)
        session.commit()
        logger.info("Boot seed committed Nairobi facilities and demo users.")
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

    try:
        upsert_demo_auth_users()
    except Exception as exc:
        logger.warning(
            "Firebase demo Auth upsert failed (%s); Postgres seed already committed.",
            type(exc).__name__,
        )


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    run_boot_seed()


if __name__ == "__main__":
    main()
