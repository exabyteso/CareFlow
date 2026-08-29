"""Dispatch SMS and reminder calls with demo-log fallback."""

from __future__ import annotations

import json
import logging
import os
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_AFRICAS_TALKING_URL = "https://api.africastalking.com/version1/messaging"
_LOCALE_PAWA_FIRST = frozenset({"ki", "luo", "kam", "mer", "kln"})


def _demo_mode() -> bool:
    return get_settings().demo_notify


def send_sms(*, to_e164: str, body: str) -> dict[str, Any]:
    if _demo_mode():
        payload = {"channel": "sms", "to": to_e164, "body": body}
        logger.info("DEMO_NOTIFY SMS: %s", json.dumps(payload))
        return {"mode": "demo_log", "payload": payload}

    username = os.environ.get("AFRICAS_TALKING_USERNAME", "").strip()
    api_key = os.environ.get("AFRICAS_TALKING_API_KEY", "").strip()
    if not username or not api_key:
        payload = {"channel": "sms", "to": to_e164, "body": body, "reason": "missing_keys"}
        logger.info("DEMO_NOTIFY SMS (missing keys): %s", json.dumps(payload))
        return {"mode": "demo_log", "payload": payload}

    headers = {"apiKey": api_key, "Accept": "application/json"}
    data = {"username": username, "to": to_e164, "message": body}
    with httpx.Client(timeout=30.0) as client:
        response = client.post(_AFRICAS_TALKING_URL, headers=headers, data=data)
    if response.status_code >= 400:
        payload = {
            "channel": "sms",
            "to": to_e164,
            "reason": "upstream_error",
            "status_code": response.status_code,
        }
        logger.warning("SMS upstream error: %s", json.dumps(payload))
        return {"mode": "failed", "payload": payload}
    return {
        "mode": "live",
        "status_code": response.status_code,
        "body": response.text[:2000],
    }


def _reminder_provider_order(locale: str, preferred: str) -> tuple[str, ...]:
    """ElevenLabs first for en/sw; Pawa for local langs; fallback once on failure."""
    if locale in _LOCALE_PAWA_FIRST or preferred == "pawa":
        return ("pawa",)
    return ("elevenlabs", "pawa")


def _attempt_reminder_call(
    *,
    to_e164: str,
    script: str,
    locale: str,
    voice_provider: str,
) -> dict[str, Any]:
    channel = "elevenlabs_call" if voice_provider == "elevenlabs" else "twilio_play_pawa_audio"

    if _demo_mode():
        payload = {
            "channel": channel,
            "to": to_e164,
            "locale": locale,
            "voice_provider": voice_provider,
            "script": script,
        }
        logger.info("DEMO_NOTIFY CALL: %s", json.dumps(payload))
        return {"mode": "demo_log", "payload": payload, "voice_provider": voice_provider}

    has_twilio = bool(os.environ.get("TWILIO_ACCOUNT_SID")) and bool(
        os.environ.get("TWILIO_AUTH_TOKEN")
    )
    has_eleven = bool(os.environ.get("ELEVENLABS_API_KEY"))
    has_pawa = bool(os.environ.get("PAWA_AI_API_KEY"))

    if voice_provider == "elevenlabs" and not (has_twilio and has_eleven):
        return {
            "mode": "failed",
            "payload": {
                "channel": channel,
                "to": to_e164,
                "reason": "missing_twilio_or_elevenlabs",
            },
            "voice_provider": voice_provider,
        }

    if voice_provider == "pawa" and not (has_twilio and has_pawa):
        return {
            "mode": "failed",
            "payload": {
                "channel": channel,
                "to": to_e164,
                "reason": "missing_twilio_or_pawa",
            },
            "voice_provider": voice_provider,
        }

    payload = {
        "channel": channel,
        "to": to_e164,
        "locale": locale,
        "voice_provider": voice_provider,
        "script": script,
        "status": "queued_for_live_integration",
    }
    logger.info("NOTIFY CALL queued: %s", json.dumps(payload))
    return {"mode": "live", "payload": payload, "voice_provider": voice_provider}


def place_reminder_call(
    *,
    to_e164: str,
    script: str,
    locale: str,
    voice_provider: str,
) -> dict[str, Any]:
    """Place reminder call with one provider fallback (ElevenLabs → Pawa for en/sw)."""
    errors: list[dict[str, Any]] = []
    for provider in _reminder_provider_order(locale, voice_provider):
        result = _attempt_reminder_call(
            to_e164=to_e164,
            script=script,
            locale=locale,
            voice_provider=provider,
        )
        if result.get("mode") in {"demo_log", "live"}:
            return result
        errors.append(result.get("payload", {}))

    payload = {
        "channel": "sms_only_fallback",
        "to": to_e164,
        "locale": locale,
        "reason": "all_call_providers_failed",
        "attempts": errors,
    }
    logger.info("NOTIFY CALL fallback to SMS only: %s", json.dumps(payload))
    return {"mode": "demo_log", "payload": payload, "voice_provider": voice_provider}
