#!/bin/sh
set -e

# API boot: migrate as owner (DATABASE_ADMIN_URL), seed as app role, then serve.
# WORKDIR is /app (backend root). Alembic reads DATABASE_ADMIN_URL via alembic/env.py.

max_attempts=30
sleep_secs=2
attempt=1

until alembic upgrade head; do
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "error: alembic upgrade head failed after ${max_attempts} attempts; DATABASE_ADMIN_URL is not reachable. Giving up." >&2
    exit 1
  fi
  echo "alembic: database not ready (attempt ${attempt}/${max_attempts}); retrying in ${sleep_secs}s..." >&2
  attempt=$((attempt + 1))
  sleep "$sleep_secs"
done

python -m app.seed

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
