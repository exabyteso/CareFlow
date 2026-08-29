"""Auth package tests — path insert only (no app.main, no DB)."""

from __future__ import annotations

import sys
from pathlib import Path

_BACKEND_ROOT = Path(__file__).resolve().parents[3]
_backend = str(_BACKEND_ROOT)
if _backend not in sys.path:
    sys.path.insert(0, _backend)
