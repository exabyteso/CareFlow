"""Contract tests for the live OpenAPI schema and committed YAML export."""

from pathlib import Path

import yaml

from app.main import app

_BACKEND_ROOT = Path(__file__).resolve().parents[1]
_COMMITTED_YAML = _BACKEND_ROOT / "openapi" / "openapi.yaml"

_EXPECTED_PATHS = {"/health", "/me", "/facilities/recommend"}
_EXPECTED_OPERATION_IDS = {
    "/health": "getHealth",
    "/me": "getMe",
    "/facilities/recommend": "recommendFacilities",
}


def test_openapi_json_returns_200(client):
    response = client.get("/openapi.json")
    assert response.status_code == 200


def test_openapi_paths_and_operation_ids(client):
    schema = client.get("/openapi.json").json()
    paths = schema["paths"]
    assert set(paths.keys()) == _EXPECTED_PATHS
    for path, operation_id in _EXPECTED_OPERATION_IDS.items():
        assert paths[path]["get"]["operationId"] == operation_id


def test_public_routes_have_no_security(client):
    schema = client.get("/openapi.json").json()
    assert "security" not in schema
    for path in ("/health", "/facilities/recommend"):
        assert not schema["paths"][path]["get"].get("security")


def test_me_lists_bearer_security(client):
    schema = client.get("/openapi.json").json()
    security = schema["paths"]["/me"]["get"]["security"]
    assert security

    schemes = schema["components"]["securitySchemes"]
    referenced = [name for requirement in security for name in requirement]
    assert referenced
    for name in referenced:
        scheme = schemes[name]
        assert scheme["type"] == "http"
        assert scheme["scheme"].lower() == "bearer"


def test_error_envelope_in_schemas(client):
    schema = client.get("/openapi.json").json()
    assert "ErrorEnvelope" in schema["components"]["schemas"]


def test_committed_yaml_matches_live_schema():
    committed = yaml.safe_load(_COMMITTED_YAML.read_text(encoding="utf-8"))
    assert committed == app.openapi()
