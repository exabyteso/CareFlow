"""Auth routes. Parent includes this router — do not include from main.py here."""

from typing import Annotated, Literal, cast

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict

from app.auth.deps import CurrentUser, get_current_user
from app.core.errors import ErrorEnvelope

router = APIRouter(tags=["auth"])


class MeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    firebase_uid: str
    role: Literal["patient", "hospital_staff"]
    facility_id: int | None
    locale: str
    phone_e164: str


@router.get(
    "/me",
    response_model=MeResponse,
    operation_id="getMe",
    summary="Get authenticated CareFlow identity",
    description=(
        "Return the CareFlow user for the Bearer Firebase ID token. "
        "Unknown UIDs are inserted as care-seekers (role=patient, facility_id null). "
        "Hospital staff remain invite-only. "
        "404 user_not_provisioned only if that insert fails."
    ),
    responses={
        401: {
            "model": ErrorEnvelope,
            "description": "Missing or invalid Firebase ID token.",
            "content": {
                "application/json": {
                    "example": {
                        "error": {
                            "code": "unauthorized",
                            "message": "Missing or invalid Firebase ID token.",
                        }
                    }
                }
            },
        },
        404: {
            "model": ErrorEnvelope,
            "description": (
                "Care-seeker insert failed for this Firebase account "
                "(user_not_provisioned). First-time Google users are provisioned."
            ),
            "content": {
                "application/json": {
                    "example": {
                        "error": {
                            "code": "user_not_provisioned",
                            "message": "No CareFlow user is provisioned for this Firebase account.",
                        }
                    }
                }
            },
        },
        422: {
            "model": ErrorEnvelope,
            "description": "Invalid request (not expected for this route).",
            "content": {
                "application/json": {
                    "example": {
                        "error": {
                            "code": "validation_error",
                            "message": "Request validation failed.",
                        }
                    }
                }
            },
        },
    },
)
def get_me(user: Annotated[CurrentUser, Depends(get_current_user)]) -> MeResponse:
    return MeResponse(
        firebase_uid=user.firebase_uid,
        role=cast(Literal["patient", "hospital_staff"], user.role),
        facility_id=user.facility_id,
        locale=user.ui_locale,
        phone_e164=user.phone_e164,
    )
