"""CareFlow FastAPI entrypoint (Kenya pretriage)."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.router import router as auth_router
from app.core.config import get_settings
from app.core.errors import register_exception_handlers
from app.core.health import router as health_router
from app.core.openapi import OPENAPI_TAGS, custom_openapi
from app.facilities.router import router as facilities_router

settings = get_settings()

app = FastAPI(
    title="CareFlow",
    version="0.1.0",
    description=(
        "Kenya pretriage API. There is no `/v1` prefix. "
        "Three live routes only: `GET /health`, `GET /me`, and `GET /facilities/recommend`."
    ),
    servers=[{"url": "http://localhost:8000"}],
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=OPENAPI_TAGS,
)
app.openapi = lambda: custom_openapi(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin] if settings.frontend_origin else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(facilities_router)

register_exception_handlers(app)
