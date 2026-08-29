"""SQLAlchemy 2 engine and session factory.

Engine is lazy: import and GET /health do not connect. Request sessions use
DATABASE_URL (app role) only — never DATABASE_ADMIN_URL.
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

_engine: Engine | None = None
_session_factory: sessionmaker[Session] | None = None


def get_engine() -> Engine:
    """Create (once) an engine from DATABASE_URL. Does not run at import."""
    global _engine
    if _engine is None:
        url = get_settings().sqlalchemy_database_url
        if not url:
            raise RuntimeError("DATABASE_URL is not set")
        _engine = create_engine(url, pool_pre_ping=True)
    return _engine


def SessionLocal() -> Session:
    """Open a new session bound to the app-role engine."""
    global _session_factory
    if _session_factory is None:
        _session_factory = sessionmaker(
            bind=get_engine(),
            autoflush=False,
            autocommit=False,
            expire_on_commit=False,
            class_=Session,
        )
    return _session_factory()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: yield a session, commit on success, rollback on error."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
