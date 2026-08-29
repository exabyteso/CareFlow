"""JSON error envelope: { "error": { "code": "<stable>", "message": "<human>" } }."""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.exceptions import HTTPException as StarletteHTTPException


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorEnvelope(BaseModel):
    error: ErrorDetail


_STATUS_CODES: dict[int, str] = {
    400: "bad_request",
    401: "unauthorized",
    403: "forbidden",
    404: "not_found",
    405: "method_not_allowed",
    409: "conflict",
    422: "validation_error",
    429: "too_many_requests",
    500: "internal_error",
    502: "bad_gateway",
    503: "service_unavailable",
}


def error_envelope(code: str, message: str) -> dict[str, dict[str, str]]:
    return {"error": {"code": code, "message": message}}


def code_for_status(status_code: int) -> str:
    return _STATUS_CODES.get(status_code, f"http_{status_code}")


def _detail_message(detail: object) -> str:
    if isinstance(detail, str) and detail:
        return detail
    if isinstance(detail, dict):
        message = detail.get("message")
        if isinstance(message, str) and message:
            return message
    return "Request failed."


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        _request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        code = code_for_status(exc.status_code)
        if isinstance(exc.detail, dict) and isinstance(exc.detail.get("code"), str):
            code = exc.detail["code"]
        return JSONResponse(
            status_code=exc.status_code,
            content=error_envelope(code, _detail_message(exc.detail)),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        _request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        first = exc.errors()[0] if exc.errors() else None
        message = "Request validation failed."
        if first and isinstance(first.get("msg"), str):
            message = first["msg"]
        return JSONResponse(
            status_code=422,
            content=error_envelope("validation_error", message),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        _request: Request, _exc: Exception
    ) -> JSONResponse:
        return JSONResponse(
            status_code=500,
            content=error_envelope("internal_error", "An unexpected error occurred."),
        )
