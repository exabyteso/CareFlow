"""Dump the live OpenAPI schema to YAML for contract tests and API clients."""

from __future__ import annotations

from pathlib import Path

import yaml

from app.main import app

_BACKEND_ROOT = Path(__file__).resolve().parents[1]
_OUTPUT_PATH = _BACKEND_ROOT / "openapi" / "openapi.yaml"


def write_openapi_yaml(destination: Path | None = None) -> Path:
    """Write ``app.openapi()`` to YAML and return the path written."""
    path = destination or _OUTPUT_PATH
    path.parent.mkdir(parents=True, exist_ok=True)
    schema = app.openapi()
    with path.open("w", encoding="utf-8") as handle:
        yaml.dump(schema, handle, sort_keys=False, allow_unicode=True)
    return path


def main() -> None:
    written = write_openapi_yaml()
    print(written)


if __name__ == "__main__":
    main()
