"""Liveness probe. No auth, no database ping."""

from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: Literal["ok"]


@router.get(
    "/health",
    operation_id="getHealth",
    response_model=HealthResponse,
    summary="Liveness probe",
    description=(
        "Liveness probe for the CareFlow API process. "
        "Does not ping the database. No authentication required."
    ),
)
def health() -> HealthResponse:
    return HealthResponse(status="ok")
