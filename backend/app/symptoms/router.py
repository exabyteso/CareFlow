"""POST /symptoms/map — utterance to catalog ids (J1 / J8 text path).

Auth is optional: this router stays open in Wave 1 (D-P2-04).
Embeddings never pick KEPH; rules on matched catalog rows do.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.errors import ErrorEnvelope
from app.symptoms.catalog import SYNONYM_LANGS
from app.symptoms.mapper import EmbeddingModelMismatch, map_utterance

router = APIRouter(prefix="/symptoms", tags=["symptoms"])


class MapSymptomsRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2000)
    lang: str = Field(min_length=1, max_length=8)


class SymptomMatchItem(BaseModel):
    id: int
    symptom_id: str
    score: float
    keph_min: int
    red_flag: bool


class MapSymptomsResponse(BaseModel):
    matches: list[SymptomMatchItem]
    keph_min: int | None
    red_flag: bool


_VALIDATION_ERROR_EXAMPLE = {
    "error": {
        "code": "validation_error",
        "message": "Field required",
    }
}

_MODEL_MISMATCH_EXAMPLE = {
    "error": {
        "code": "embedding_model_mismatch",
        "message": "synonym embeddings do not match the API embedding model",
    }
}


@router.post(
    "/map",
    response_model=MapSymptomsResponse,
    operation_id="mapSymptoms",
    summary="Map an utterance to catalog symptoms",
    description=(
        "Embeds text with the Wave 1 hash model, finds catalog synonyms above "
        "the confidence floor, then rules pick keph_min and red_flag. "
        "Vectors never pick the hospital."
    ),
    responses={
        422: {
            "model": ErrorEnvelope,
            "description": "Invalid body (empty text or unknown lang).",
            "content": {
                "application/json": {
                    "schema": {"$ref": "#/components/schemas/ErrorEnvelope"},
                    "example": _VALIDATION_ERROR_EXAMPLE,
                }
            },
        },
        503: {
            "model": ErrorEnvelope,
            "description": "Stored embedding model does not match the API.",
            "content": {
                "application/json": {
                    "schema": {"$ref": "#/components/schemas/ErrorEnvelope"},
                    "example": _MODEL_MISMATCH_EXAMPLE,
                }
            },
        },
    },
)
def map_symptoms(
    body: MapSymptomsRequest,
    session: Session = Depends(get_db),
) -> MapSymptomsResponse:
    lang = body.lang.strip()
    if lang not in SYNONYM_LANGS:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "validation_error",
                "message": f"lang must be one of {sorted(SYNONYM_LANGS)}.",
            },
        )
    text_value = body.text.strip()
    if not text_value:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "validation_error",
                "message": "text must be non-empty.",
            },
        )
    try:
        result = map_utterance(session, text_value=text_value, lang=lang)
    except EmbeddingModelMismatch as exc:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "embedding_model_mismatch",
                "message": str(exc),
            },
        ) from exc

    return MapSymptomsResponse(
        matches=[
            SymptomMatchItem(
                id=item.id,
                symptom_id=item.symptom_id,
                score=item.score,
                keph_min=item.keph_min,
                red_flag=item.red_flag,
            )
            for item in result.matches
        ],
        keph_min=result.keph_min,
        red_flag=result.red_flag,
    )
