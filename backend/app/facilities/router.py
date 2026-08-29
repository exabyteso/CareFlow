"""GET /facilities/recommend — routine (J7) and red-flag (J2) ranking.

Auth is optional: this router stays open.

wait_count in the response is a desk-typed demo ranking input (INV-16, X-08).
It is not a live HMIS feed and is not queue position.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.errors import ErrorEnvelope
from app.facilities.ranking import keph_floor
from app.facilities.seed import ensure_nairobi_seed, in_kenya_bbox

router = APIRouter(prefix="/facilities", tags=["facilities"])

_SELECT = """
    SELECT id, kmhfr_code, name, keph_level, lat, lng, county, wait_count,
           earth_distance(ll_to_earth(lat, lng), ll_to_earth(:lat, :lng)) AS distance_m
    FROM facilities
    WHERE operational AND keph_level >= :keph_floor
"""

_RECOMMEND_SQL_ROUTINE = text(
    _SELECT
    + """
    ORDER BY wait_count ASC,
             earth_distance(ll_to_earth(lat, lng), ll_to_earth(:lat, :lng)) ASC
    """
)

_RECOMMEND_SQL_RED_FLAG = text(
    _SELECT
    + """
    ORDER BY earth_distance(ll_to_earth(lat, lng), ll_to_earth(:lat, :lng)) ASC
    """
)


class FacilityRecommendItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    kmhfr_code: str
    name: str
    keph_level: int
    lat: float
    lng: float
    county: str
    wait_count: int = Field(
        description=(
            "Desk-typed demo ranking input (INV-16, X-08). "
            "Not a live HMIS feed; not queue position."
        ),
    )
    distance_m: float


class FacilityRecommendResponse(BaseModel):
    facilities: list[FacilityRecommendItem]


_LOCATION_OUT_OF_RANGE_EXAMPLE = {
    "error": {
        "code": "location_out_of_range",
        "message": "lat and lng must be inside Kenya.",
    }
}

_VALIDATION_ERROR_EXAMPLE = {
    "error": {
        "code": "validation_error",
        "message": "Field required",
    }
}


@router.get(
    "/recommend",
    response_model=FacilityRecommendResponse,
    operation_id="recommendFacilities",
    summary="Rank facilities for routine (J7) or red-flag (J2) pretriage",
    description=(
        "Returns operational facilities at or above a KEPH floor for a point "
        "inside Kenya. Routine ranking is desk wait_count then distance. "
        "When red_flag is true, wait is ignored and the floor is at least KEPH 4."
    ),
    responses={
        400: {
            "model": ErrorEnvelope,
            "description": "lat and lng lie outside the Kenya bounding box.",
            "content": {
                "application/json": {
                    "schema": {"$ref": "#/components/schemas/ErrorEnvelope"},
                    "example": _LOCATION_OUT_OF_RANGE_EXAMPLE,
                }
            },
        },
        422: {
            "model": ErrorEnvelope,
            "description": "Invalid or missing query parameters.",
            "content": {
                "application/json": {
                    "schema": {"$ref": "#/components/schemas/ErrorEnvelope"},
                    "example": _VALIDATION_ERROR_EXAMPLE,
                }
            },
        },
    },
)
def recommend_facilities(
    lat: Annotated[
        float,
        Query(
            openapi_examples={
                "nairobi": {"summary": "Nairobi", "value": -1.2921},
            },
        ),
    ],
    lng: Annotated[
        float,
        Query(
            openapi_examples={
                "nairobi": {"summary": "Nairobi", "value": 36.8219},
            },
        ),
    ],
    keph_min: Annotated[
        int,
        Query(
            ge=2,
            le=6,
            openapi_examples={
                "nairobi": {"summary": "Nairobi", "value": 2},
            },
        ),
    ] = 2,
    red_flag: Annotated[
        bool,
        Query(
            description=(
                "When true, ignore wait_count and require KEPH 4 or above "
                "(or keph_min if higher). J2."
            ),
            openapi_examples={
                "routine": {"summary": "Routine", "value": False},
                "red_flag": {"summary": "Red flag", "value": True},
            },
        ),
    ] = False,
    session: Session = Depends(get_db),
) -> FacilityRecommendResponse:
    if not in_kenya_bbox(lat, lng):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "location_out_of_range",
                "message": "lat and lng must be inside Kenya.",
            },
        )

    ensure_nairobi_seed(session)

    floor = keph_floor(red_flag=red_flag, keph_min=keph_min)
    sql = _RECOMMEND_SQL_RED_FLAG if red_flag else _RECOMMEND_SQL_ROUTINE
    result = session.execute(
        sql,
        {"lat": lat, "lng": lng, "keph_floor": floor},
    )
    items = [
        FacilityRecommendItem(
            id=int(row.id),
            kmhfr_code=row.kmhfr_code,
            name=row.name,
            keph_level=int(row.keph_level),
            lat=float(row.lat),
            lng=float(row.lng),
            county=row.county,
            wait_count=int(row.wait_count),
            distance_m=round(float(row.distance_m), 1),
        )
        for row in result
    ]
    return FacilityRecommendResponse(facilities=items)
