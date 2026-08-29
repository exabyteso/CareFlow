"""Enqueue and dispatch notify_jobs (J1 SMS, J3 no-show, J9 reminder)."""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.notify.providers import place_reminder_call, send_sms
from app.notify.templates import booking_confirm_message, no_show_message, reminder_message

_LOCALE_VOICE = frozenset({"ki", "luo", "kam", "mer", "kln"})


def _delivery_mode() -> str:
    return "demo_log" if get_settings().demo_notify else "live"


def _load_booking_context(session: Session, booking_id: int) -> dict[str, Any] | None:
    return session.execute(
        text(
            """
            SELECT
                b.id,
                b.notify_locale::text AS notify_locale,
                u.phone_e164,
                s.name AS facility_name
            FROM bookings b
            JOIN users u ON u.id = b.patient_user_id
            JOIN booking_facility_snapshots s ON s.booking_id = b.id
            WHERE b.id = :booking_id
            """
        ),
        {"booking_id": booking_id},
    ).mappings().first()


def _insert_job(
    session: Session,
    *,
    booking_id: int,
    channel: str,
    template: str,
    locale: str,
    voice_provider: str | None,
) -> int:
    row = session.execute(
        text(
            """
            INSERT INTO notify_jobs (
                booking_id, channel, template, locale,
                voice_provider, delivery_mode, status
            )
            VALUES (
                :booking_id,
                CAST(:channel AS notify_channel),
                CAST(:template AS notify_template),
                CAST(:locale AS notify_locale),
                CAST(:voice_provider AS voice_provider),
                CAST(:delivery_mode AS notify_delivery_mode),
                'pending'
            )
            RETURNING id
            """
        ),
        {
            "booking_id": booking_id,
            "channel": channel,
            "template": template,
            "locale": locale,
            "voice_provider": voice_provider,
            "delivery_mode": _delivery_mode(),
        },
    ).one()
    return int(row[0])


def _finalize_job(
    session: Session,
    job_id: int,
    *,
    status: str,
    vendor_payload: dict[str, Any],
) -> None:
    session.execute(
        text(
            """
            UPDATE notify_jobs
            SET status = CAST(:status AS notify_job_status),
                vendor_payload = CAST(:payload AS jsonb),
                sent_at = CASE WHEN :status IN ('sent', 'demo_logged') THEN now() ELSE sent_at END,
                attempt_count = attempt_count + 1
            WHERE id = :job_id
            """
        ),
        {
            "job_id": job_id,
            "status": status,
            "payload": json.dumps(vendor_payload),
        },
    )


def enqueue_booking_confirm(session: Session, booking_id: int) -> int | None:
    """J1 — SMS after booking. Called by P2 after POST /bookings."""
    ctx = _load_booking_context(session, booking_id)
    if ctx is None:
        return None

    locale = str(ctx["notify_locale"])
    message = booking_confirm_message(facility_name=str(ctx["facility_name"]), locale=locale)
    job_id = _insert_job(
        session,
        booking_id=booking_id,
        channel="sms",
        template="booking_confirm",
        locale=locale,
        voice_provider=None,
    )
    result = send_sms(to_e164=str(ctx["phone_e164"]), body=message.sms_body)
    status = "demo_logged" if result.get("mode") == "demo_log" else "sent"
    _finalize_job(session, job_id, status=status, vendor_payload=result)
    return job_id


def enqueue_no_show(session: Session, booking_id: int) -> int | None:
    """J3 — SMS when clinician marks did not come. Called by P4."""
    ctx = _load_booking_context(session, booking_id)
    if ctx is None:
        return None

    locale = str(ctx["notify_locale"])
    message = no_show_message(locale=locale)
    job_id = _insert_job(
        session,
        booking_id=booking_id,
        channel="sms",
        template="no_show",
        locale=locale,
        voice_provider=None,
    )
    result = send_sms(to_e164=str(ctx["phone_e164"]), body=message.sms_body)
    status = "demo_logged" if result.get("mode") == "demo_log" else "sent"
    _finalize_job(session, job_id, status=status, vendor_payload=result)
    return job_id


def _reminder_voice_provider(locale: str) -> tuple[str, str]:
    """Return (channel, voice_provider) for J9."""
    if locale in _LOCALE_VOICE:
        return "twilio_play_pawa_audio", "pawa"
    return "elevenlabs_call", "elevenlabs"


def enqueue_reminder(
    session: Session,
    booking_id: int,
    *,
    scheduled_for: datetime | None = None,
) -> int | None:
    """J9 — SMS + optional reminder call (demo-log in CI)."""
    ctx = _load_booking_context(session, booking_id)
    if ctx is None:
        return None

    locale = str(ctx["notify_locale"])
    message = reminder_message(facility_name=str(ctx["facility_name"]), locale=locale)

    sms_job_id = _insert_job(
        session,
        booking_id=booking_id,
        channel="sms",
        template="reminder",
        locale=locale,
        voice_provider=None,
    )
    sms_result = send_sms(to_e164=str(ctx["phone_e164"]), body=message.sms_body)
    sms_status = "demo_logged" if sms_result.get("mode") == "demo_log" else "sent"
    _finalize_job(session, sms_job_id, status=sms_status, vendor_payload=sms_result)

    if not message.call_script:
        return sms_job_id

    channel, voice_provider = _reminder_voice_provider(locale)
    call_job_id = _insert_job(
        session,
        booking_id=booking_id,
        channel=channel,
        template="reminder",
        locale=locale,
        voice_provider=voice_provider,
    )
    if scheduled_for is not None:
        session.execute(
            text("UPDATE notify_jobs SET scheduled_for = :when WHERE id = :id"),
            {"when": scheduled_for, "id": call_job_id},
        )

    call_result = place_reminder_call(
        to_e164=str(ctx["phone_e164"]),
        script=message.call_script,
        locale=locale,
        voice_provider=voice_provider,
    )
    mode = call_result.get("mode")
    if mode == "demo_log":
        call_status = "demo_logged"
    elif mode == "failed":
        call_status = "failed"
    else:
        call_status = "sent"
    _finalize_job(session, call_job_id, status=call_status, vendor_payload=call_result)
    return call_job_id
