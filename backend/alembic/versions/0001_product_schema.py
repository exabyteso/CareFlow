"""CareFlow product schema (Postgres 16 + pgvector).

Revision ID: 0001
Revises:
Create Date: 2026-08-28

Applies plans/product-schema.md §4 DDL (extensions, enums, tables, indexes,
triggers, functions, RLS ENABLE+FORCE, policies, views). Grants table/sequence/
view rights to app role careflow when that role exists (compose init).
Staging Render uses a single owner connection and has no careflow role —
GRANTs are skipped so alembic upgrade head can boot.
"""

from __future__ import annotations

from pathlib import Path

from alembic import op
from sqlalchemy import text

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

_SQL_PATH = Path(__file__).with_name("0001_product_schema.sql")

_GRANTS = """
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'careflow') THEN
    GRANT USAGE ON SCHEMA public TO careflow;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO careflow;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO careflow;
    GRANT SELECT ON v_instant_queue_positions TO careflow;
    GRANT SELECT ON v_queue_patient_display TO careflow;
  END IF;
END $$;
"""


def _split_sql_statements(script: str) -> list[str]:
    """Split a Postgres script on ';' outside quotes, comments, and $tag$ bodies."""
    statements: list[str] = []
    buf: list[str] = []
    i = 0
    n = len(script)
    in_single = False
    in_line_comment = False
    in_block_comment = False
    dollar_tag: str | None = None

    while i < n:
        c = script[i]
        nxt = script[i + 1] if i + 1 < n else ""

        if in_line_comment:
            buf.append(c)
            if c == "\n":
                in_line_comment = False
            i += 1
            continue

        if in_block_comment:
            buf.append(c)
            if c == "*" and nxt == "/":
                buf.append("/")
                in_block_comment = False
                i += 2
                continue
            i += 1
            continue

        if dollar_tag is not None:
            if script.startswith(dollar_tag, i):
                buf.append(dollar_tag)
                i += len(dollar_tag)
                dollar_tag = None
                continue
            buf.append(c)
            i += 1
            continue

        if in_single:
            buf.append(c)
            if c == "'" and nxt == "'":
                buf.append("'")
                i += 2
                continue
            if c == "'":
                in_single = False
            i += 1
            continue

        if c == "-" and nxt == "-":
            buf.append("--")
            in_line_comment = True
            i += 2
            continue
        if c == "/" and nxt == "*":
            buf.append("/*")
            in_block_comment = True
            i += 2
            continue
        if c == "'":
            in_single = True
            buf.append(c)
            i += 1
            continue
        if c == "$":
            j = i + 1
            while j < n and (script[j].isalnum() or script[j] == "_"):
                j += 1
            if j < n and script[j] == "$":
                dollar_tag = script[i : j + 1]
                buf.append(dollar_tag)
                i = j + 1
                continue
            buf.append(c)
            i += 1
            continue
        if c == ";":
            stmt = "".join(buf).strip()
            if stmt:
                statements.append(stmt)
            buf = []
            i += 1
            continue

        buf.append(c)
        i += 1

    tail = "".join(buf).strip()
    if tail:
        statements.append(tail)
    return statements


def upgrade() -> None:
    ddl = _SQL_PATH.read_text(encoding="utf-8")
    # Escape ':' so SQLAlchemy text() does not treat Postgres ::casts as binds.
    for stmt in _split_sql_statements(ddl):
        op.execute(text(stmt.replace(":", r"\:")))
    for stmt in _split_sql_statements(_GRANTS):
        op.execute(text(stmt))


def downgrade() -> None:
    raise NotImplementedError("Revision 0001 is not reversible")
