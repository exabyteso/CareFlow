"""Staff-only dependencies for notes routes."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException

from app.auth.deps import CurrentUser, get_current_user


def require_hospital_staff(
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> CurrentUser:
    if user.role != "hospital_staff":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "forbidden",
                "message": "Hospital staff role required.",
            },
        )
    if user.facility_id is None:
        raise HTTPException(
            status_code=403,
            detail={
                "code": "forbidden",
                "message": "Staff user is not scoped to a facility.",
            },
        )
    return user
