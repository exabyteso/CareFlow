"""Alembic env — migrations run as the table owner (DATABASE_ADMIN_URL).

Do not import app.core; the app role is careflow and is subject to RLS.
"""

from __future__ import annotations

import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# SQL-only revisions; no SQLAlchemy metadata yet.
target_metadata = None


def _admin_url() -> str:
    try:
        url = os.environ["DATABASE_ADMIN_URL"]
    except KeyError as exc:
        raise RuntimeError(
            "DATABASE_ADMIN_URL is unset. Alembic must connect as the table "
            "owner (BYPASSRLS / superuser). Export DATABASE_ADMIN_URL before "
            "running migrations (cd backend && DATABASE_ADMIN_URL=... "
            "alembic upgrade head)."
        ) from exc
    if not url.strip():
        raise RuntimeError(
            "DATABASE_ADMIN_URL is empty. Alembic must connect as the table "
            "owner (BYPASSRLS / superuser)."
        )
    return _normalize_database_url(url)


def _normalize_database_url(url: str) -> str:
    """SQLAlchemy 2 + psycopg3: bare postgresql:// is the psycopg2 dialect."""
    if url.startswith("postgresql+"):
        return url
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url.removeprefix("postgresql://")
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url.removeprefix("postgres://")
    return url


def run_migrations_offline() -> None:
    url = _admin_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = create_engine(_admin_url(), poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()

    connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
