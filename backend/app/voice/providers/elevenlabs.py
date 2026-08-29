"""ElevenLabs STT/TTS (English and Kiswahili first)."""

from __future__ import annotations

import os
from typing import Any

import httpx

from app.voice.providers.base import (
    VoiceConfigurationError,
    VoiceEmptyResultError,
    VoiceUpstreamError,
)

_ELEVENLABS_BASE = "https://api.elevenlabs.io/v1"
_DEFAULT_TIMEOUT = 30.0
# Premade "Daniel - Steady Broadcaster". Product TTS voice — keep this default.
DANIEL_STEADY_BROADCASTER_VOICE_ID = "onwK4e9ZLuTAKqWW03F9"


def _api_key() -> str:
    key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not key:
        raise VoiceConfigurationError("elevenlabs", "ELEVENLABS_API_KEY is not configured.")
    return key


def _tts_voice_id() -> str:
    """Daniel unless ELEVENLABS_VOICE_ID is a non-empty override."""
    override = os.environ.get("ELEVENLABS_VOICE_ID", "").strip()
    return override or DANIEL_STEADY_BROADCASTER_VOICE_ID


def _lang_to_elevenlabs(lang: str) -> str:
    mapping = {
        "en": "en",
        "sw": "sw",
        "ki": "sw",
        "luo": "sw",
        "kam": "sw",
        "mer": "sw",
        "kln": "sw",
    }
    return mapping.get(lang.lower(), "en")


class ElevenLabsProvider:
    """Thin REST wrapper for ElevenLabs speech endpoints."""

    def __init__(self, client: httpx.Client | None = None) -> None:
        self._client = client

    def _http(self) -> httpx.Client:
        if self._client is not None:
            return self._client
        return httpx.Client(timeout=_DEFAULT_TIMEOUT)

    def speech_to_text(self, audio_bytes: bytes, lang: str, *, filename: str = "audio.webm") -> str:
        key = _api_key()
        headers = {"xi-api-key": key}
        data = {"model_id": "scribe_v1", "language_code": _lang_to_elevenlabs(lang)}
        files = {"file": (filename, audio_bytes, "application/octet-stream")}

        with self._http() as client:
            response = client.post(
                f"{_ELEVENLABS_BASE}/speech-to-text",
                headers=headers,
                data=data,
                files=files,
            )

        if response.status_code >= 400:
            raise VoiceUpstreamError(
                "elevenlabs",
                f"ElevenLabs STT failed with status {response.status_code}.",
            )

        payload: dict[str, Any] = response.json()
        text = payload.get("text") or payload.get("transcript")
        if not isinstance(text, str) or not text.strip():
            raise VoiceEmptyResultError("elevenlabs", "ElevenLabs STT returned an empty transcript.")
        return text.strip()

    def text_to_speech(self, text: str, lang: str) -> bytes:
        key = _api_key()
        voice_id = _tts_voice_id()
        headers = {
            "xi-api-key": key,
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
        }
        body = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "language_code": _lang_to_elevenlabs(lang),
        }

        with self._http() as client:
            response = client.post(
                f"{_ELEVENLABS_BASE}/text-to-speech/{voice_id}",
                headers=headers,
                json=body,
            )

        if response.status_code >= 400:
            raise VoiceUpstreamError(
                "elevenlabs",
                f"ElevenLabs TTS failed with status {response.status_code}.",
            )

        if not response.content:
            raise VoiceEmptyResultError("elevenlabs", "ElevenLabs TTS returned empty audio.")
        return response.content
