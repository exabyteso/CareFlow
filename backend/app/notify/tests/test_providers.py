"""Reminder call provider cascade."""

from __future__ import annotations

from app.notify.providers import _reminder_provider_order, place_reminder_call


def test_en_sw_try_elevenlabs_then_pawa():
    assert _reminder_provider_order("en", "elevenlabs") == ("elevenlabs", "pawa")
    assert _reminder_provider_order("sw", "elevenlabs") == ("elevenlabs", "pawa")


def test_kikuyu_pawa_only():
    assert _reminder_provider_order("ki", "pawa") == ("pawa",)


def test_reminder_demo_logs_without_live_dial(monkeypatch):
    monkeypatch.setenv("DEMO_NOTIFY", "1")
    from app.core.config import get_settings

    get_settings.cache_clear()
    result = place_reminder_call(
        to_e164="+254711111111",
        script="Test reminder",
        locale="en",
        voice_provider="elevenlabs",
    )
    assert result["mode"] == "demo_log"
    assert result["payload"]["voice_provider"] == "elevenlabs"
    get_settings.cache_clear()
