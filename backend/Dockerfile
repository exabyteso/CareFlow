FROM python:3.12-slim-bookworm

WORKDIR /app

COPY pyproject.toml /app/
COPY . /app

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -e . \
    && adduser --disabled-password --gecos "" --uid 1000 appuser \
    && chown -R appuser:appuser /app \
    && chmod +x /app/docker/entrypoint.sh

USER appuser

EXPOSE 8000

ENTRYPOINT ["/app/docker/entrypoint.sh"]
