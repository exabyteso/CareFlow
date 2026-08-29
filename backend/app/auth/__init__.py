"""Firebase ID-token auth and GET /me (care-seeker / hospital staff)."""

from app.auth.firebase import verify_id_token
from app.auth.router import router

__all__ = ["router", "verify_id_token"]
