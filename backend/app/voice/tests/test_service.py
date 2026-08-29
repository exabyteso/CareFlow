"""Voice synthesize/transcribe cascade with mocked providers."""

from __future__ import annotations

import pytest

from app.voice.providers.base import VoiceProviderError
from app.voice.service import synthesize, transcribe


def test_transcribe_falls_back_to_pawa(monkeypatch):
    def fail_elevenlabs(*_args, **_kwargs):
        raise VoiceProviderError("elevenlabs", "down")

    def ok_pawa(_audio: bytes, _lang: str) -> str:
        return "homa na kichwa"

    monkeypatch.setattr(
        "app.voice.service._elevenlabs.speech_to_text",
        fail_elevenlabs,
    )
    monkeypatch.setattr(
        "app.voice.service._pawa.speech_to_text",
        ok_pawa,
    )

    text, provider = transcribe(b"audio", "en")
    assert text == "homa na kichwa"
    assert provider == "pawa"


def test_synthesize_raises_when_all_fail(monkeypatch):
    def fail(*_args, **_kwargs):
        raise VoiceProviderError("test", "down")

    monkeypatch.setattr("app.voice.service._elevenlabs.text_to_speech", fail)
    monkeypatch.setattr("app.voice.service._pawa.text_to_speech", fail)

    with pytest.raises(VoiceProviderError, match="Text-to-speech failed"):
        synthesize("hello", "sw")
