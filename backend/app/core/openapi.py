"""OpenAPI tags, HTTP Bearer scheme, and custom schema for Swagger."""

from typing import Any

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from fastapi.security import HTTPBearer

# Scheme object for components.securitySchemes only — never Depends(bearer_scheme).
bearer_scheme = HTTPBearer(auto_error=False)

OPENAPI_TAGS: list[dict[str, str]] = [
    {"name": "health", "description": "Liveness probe"},
    {"name": "auth", "description": "Authenticated identity (`GET /me`)"},
    {
        "name": "facilities",
        "description": "Nairobi facility recommendation (routine ranking)",
    },
]


def custom_openapi(app: FastAPI) -> dict[str, Any]:
    if app.openapi_schema:
        return app.openapi_schema

    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
        servers=app.servers,
        tags=app.openapi_tags,
    )

    components = schema.setdefault("components", {})
    security_schemes = components.setdefault("securitySchemes", {})
    security_schemes[bearer_scheme.scheme_name] = bearer_scheme.model.model_dump(
        by_alias=True,
        exclude_none=True,
        mode="json",
    )

    me_get = schema.get("paths", {}).get("/me", {}).get("get")
    if isinstance(me_get, dict):
        me_get["security"] = [{bearer_scheme.scheme_name: []}]
        # Drop the raw Authorization Header() param so Swagger shows one Bearer lock.
        params = me_get.get("parameters")
        if isinstance(params, list):
            me_get["parameters"] = [
                param
                for param in params
                if not (
                    isinstance(param, dict)
                    and str(param.get("name", "")).lower() == "authorization"
                )
            ]

    app.openapi_schema = schema
    return schema
