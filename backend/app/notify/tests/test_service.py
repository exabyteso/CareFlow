"""Notify enqueue — demo_log mode, no live dial."""

from __future__ import annotations

from collections.abc import Callable
from contextlib import AbstractContextManager

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.notify.service import (
    enqueue_booking_confirm,
    enqueue_no_show,
    enqueue_reminder,
)


def test_booking_confirm_demo_logged(
    sample_booking_id,
    monkeypatch,
    owner_session_factory: Callable[[], AbstractContextManager[Session]],
):
    monkeypatch.setenv("DEMO_NOTIFY", "1")
    from app.core.config import get_settings

    get_settings.cache_clear()

    try:
        with owner_session_factory() as session:
            job_id = enqueue_booking_confirm(session, sample_booking_id)
            session.flush()
            assert job_id is not None
            row = session.execute(
                text(
                    "SELECT template, channel, status, delivery_mode::text "
                    "FROM notify_jobs WHERE id = :id"
                ),
                {"id": job_id},
            ).mappings().one()
            assert row["template"] == "booking_confirm"
            assert row["channel"] == "sms"
            assert row["status"] == "demo_logged"
            assert row["delivery_mode"] == "demo_log"
    finally:
        get_settings.cache_clear()


def test_no_show_sms(
    sample_booking_id,
    monkeypatch,
    owner_session_factory: Callable[[], AbstractContextManager[Session]],
):
    monkeypatch.setenv("DEMO_NOTIFY", "1")
    from app.core.config import get_settings

    get_settings.cache_clear()

    try:
        with owner_session_factory() as session:
            job_id = enqueue_no_show(session, sample_booking_id)
            session.flush()
            assert job_id is not None
            row = session.execute(
                text("SELECT template, status FROM notify_jobs WHERE id = :id"),
                {"id": job_id},
            ).mappings().one()
            assert row["template"] == "no_show"
            assert row["status"] == "demo_logged"
    finally:
        get_settings.cache_clear()


def test_reminder_creates_sms_and_call_jobs(
    sample_booking_id,
    monkeypatch,
    owner_session_factory: Callable[[], AbstractContextManager[Session]],
):
    monkeypatch.setenv("DEMO_NOTIFY", "1")
    from app.core.config import get_settings

    get_settings.cache_clear()

    try:
        with owner_session_factory() as session:
            enqueue_reminder(session, sample_booking_id)
            session.flush()
            rows = session.execute(
                text(
                    """
                    SELECT channel, template, status
                    FROM notify_jobs
                    WHERE booking_id = :booking_id
                    ORDER BY id
                    """
                ),
                {"booking_id": sample_booking_id},
            ).mappings().all()
            assert len(rows) == 2
            assert rows[0]["channel"] == "sms"
            assert rows[1]["channel"] == "elevenlabs_call"
            assert all(r["status"] == "demo_logged" for r in rows)
    finally:
        get_settings.cache_clear()
