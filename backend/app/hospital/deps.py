"""Staff-only guard for hospital desk routes. Role is checked here, not in auth hubs."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException

from app.auth.deps import CurrentUser, get_current_user


def require_hospital_staff(
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> CurrentUser:
    """Allow only ``hospital_staff`` with a bound ``facility_id`` (this facility)."""
    if user.role != "hospital_staff" or user.facility_id is None:
        raise HTTPException(
            status_code=403,
            detail={
                "code": "forbidden",
                "message": "Hospital desk is for hospital staff of this facility only.",
            },
        )
    return user
