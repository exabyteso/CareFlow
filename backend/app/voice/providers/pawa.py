"""Pawa AI STT/TTS fallback for Kenyan local languages."""

from __future__ import annotations

import base64
import os
from typing import Any

import httpx

from app.voice.providers.base import (
    VoiceConfigurationError,
    VoiceEmptyResultError,
    VoiceUpstreamError,
)

_PAWA_BASE = "https://api.pawa-ai.com/v1"
_DEFAULT_TIMEOUT = 30.0
_STT_MODEL = "pawa-stt-v1-20240701"
_TTS_MODEL = "pawa-tts-v1-20250704"


def _api_key() -> str:
    key = os.environ.get("PAWA_AI_API_KEY", "").strip()
    if not key:
        raise VoiceConfigurationError("pawa", "PAWA_AI_API_KEY is not configured.")
    return key


def _lang_to_pawa(lang: str) -> str:
    mapping = {
        "en": "english",
        "sw": "swahili",
        "ki": "kikuyu",
        "luo": "luo",
        "kam": "kamba",
        "mer": "meru",
        "kln": "kalenjin",
    }
    return mapping.get(lang.lower(), "swahili")


class PawaProvider:
    """Thin REST wrapper for Pawa speech endpoints."""

    def __init__(self, client: httpx.Client | None = None) -> None:
        self._client = client

    def _http(self) -> httpx.Client:
        if self._client is not None:
            return self._client
        return httpx.Client(timeout=_DEFAULT_TIMEOUT)

    def speech_to_text(self, audio_bytes: bytes, lang: str) -> str:
        key = _api_key()
        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        }
        body = {
            "model": _STT_MODEL,
            "language": _lang_to_pawa(lang),
            "audio": base64.b64encode(audio_bytes).decode("ascii"),
        }

        with self._http() as client:
            response = client.post(
                f"{_PAWA_BASE}/voice/speech-to-text",
                headers=headers,
                json=body,
            )

        if response.status_code >= 400:
            raise VoiceUpstreamError(
                "pawa",
                f"Pawa STT failed with status {response.status_code}.",
            )

        payload: dict[str, Any] = response.json()
        text = payload.get("text") or payload.get("transcript")
        if not isinstance(text, str) or not text.strip():
            raise VoiceEmptyResultError("pawa", "Pawa STT returned an empty transcript.")
        return text.strip()

    def text_to_speech(self, text: str, lang: str) -> bytes:
        key = _api_key()
        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        }
        body = {
            "model": _TTS_MODEL,
            "language": _lang_to_pawa(lang),
            "voice": os.environ.get("PAWA_TTS_VOICE", "ame"),
            "text": text,
        }

        with self._http() as client:
            response = client.post(
                f"{_PAWA_BASE}/voice/text-to-speech",
                headers=headers,
                json=body,
            )

        if response.status_code >= 400:
            raise VoiceUpstreamError(
                "pawa",
                f"Pawa TTS failed with status {response.status_code}.",
            )

        content_type = response.headers.get("content-type", "")
        if "application/json" in content_type:
            payload: dict[str, Any] = response.json()
            audio_b64 = payload.get("audio") or payload.get("audio_base64")
            if isinstance(audio_b64, str) and audio_b64:
                return base64.b64decode(audio_b64)
            raise VoiceEmptyResultError("pawa", "Pawa TTS JSON response had no audio field.")

        if not response.content:
            raise VoiceEmptyResultError("pawa", "Pawa TTS returned empty audio.")
        return response.content
