"""Environment-backed settings. Secrets come from env (Phantom locally); never hardcode."""

from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def normalize_database_url(url: str) -> str:
    """Rewrite plain postgres URLs so SQLAlchemy uses psycopg3 (`postgresql+psycopg://`)."""
    if url.startswith("postgresql+"):
        return url
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url.removeprefix("postgresql://")
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url.removeprefix("postgres://")
    return url


class Settings(BaseSettings):
    """API settings. Extra env keys (compose, Next, vendor) are ignored."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    database_url: str = Field(
        default="",
        description="App-role Postgres URL. Used for request sessions. Required before first DB use.",
    )
    database_admin_url: str = Field(
        default="",
        description="Owner URL for Alembic/tools. Must not be used for request sessions.",
    )
    frontend_origin: str = Field(
        default="http://localhost:3000",
        description="Next.js origin allowed by CORS.",
    )
    firebase_project_id: str = Field(default="")
    firebase_client_email: str = Field(default="")
    firebase_private_key: str = Field(default="")
    demo_notify: bool = Field(
        default=True,
        description="When true, notify jobs log instead of sending SMS/calls (local/demo).",
    )
    next_public_api_url: str = Field(
        default="",
        description="Injected by compose/PWA; unused by this API (kept so settings load).",
    )

    @field_validator("firebase_private_key", mode="before")
    @classmethod
    def unescape_private_key_newlines(cls, value: object) -> object:
        if not isinstance(value, str):
            return value
        key = value.lstrip("\ufeff").strip("\r")
        if len(key) >= 2 and key[0] == key[-1] and key[0] in {'"', "'"}:
            key = key[1:-1]
        key = key.lstrip("\ufeff")
        key = key.replace("\\n", "\n").replace("\\r", "\r")
        return key.replace("\r\n", "\n").replace("\r", "\n")

    @field_validator("frontend_origin", mode="before")
    @classmethod
    def strip_trailing_slash(cls, value: object) -> object:
        if isinstance(value, str):
            return value.rstrip("/")
        return value

    @property
    def sqlalchemy_database_url(self) -> str:
        return normalize_database_url(self.database_url)


def pem_shape_diagnostics(key: str) -> str:
    """Non-secret PEM shape for logs. Never includes key material."""
    text = key if isinstance(key, str) else ""
    return (
        f"has_begin_private_key={'BEGIN PRIVATE KEY' in text} "
        f"newline_count={text.count('\n')} "
        f"length={len(text)}"
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
