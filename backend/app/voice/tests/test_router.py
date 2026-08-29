"""POST /voice/stt and /voice/tts with mocked providers."""

from __future__ import annotations

import base64

_AUTH = {"Authorization": "Bearer test-token"}


def test_stt_requires_auth(voice_client):
    response = voice_client.post(
        "/voice/stt",
        json={"audio_base64": base64.b64encode(b"abc").decode(), "lang": "en"},
    )
    assert response.status_code == 401


def test_stt_success(voice_client, db_reset, mock_firebase_uid, monkeypatch):
    mock_firebase_uid("demo-patient")

    def fake_transcribe(audio_bytes: bytes, lang: str, *, filename: str = "audio.webm"):
        assert audio_bytes == b"fake-audio"
        assert lang == "en"
        return "headache and fever", "elevenlabs"

    monkeypatch.setattr("app.voice.router.transcribe", fake_transcribe)

    response = voice_client.post(
        "/voice/stt",
        headers=_AUTH,
        json={
            "audio_base64": base64.b64encode(b"fake-audio").decode(),
            "lang": "en",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["text"] == "headache and fever"
    assert body["provider"] == "elevenlabs"
    assert body["lang"] == "en"


def test_stt_empty_audio_422(voice_client, db_reset, mock_firebase_uid):
    mock_firebase_uid("demo-patient")
    response = voice_client.post(
        "/voice/stt",
        headers=_AUTH,
        json={"audio_base64": base64.b64encode(b"").decode(), "lang": "en"},
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


def test_stt_provider_failure_502(voice_client, db_reset, mock_firebase_uid, monkeypatch):
    mock_firebase_uid("demo-staff")

    from app.voice.providers.base import VoiceProviderError

    def fail_transcribe(*_args, **_kwargs):
        raise VoiceProviderError("cascade", "all providers down")

    monkeypatch.setattr("app.voice.router.transcribe", fail_transcribe)

    response = voice_client.post(
        "/voice/stt",
        headers=_AUTH,
        json={
            "audio_base64": base64.b64encode(b"x").decode(),
            "lang": "ki",
        },
    )
    assert response.status_code == 502
    assert response.json()["error"]["code"] == "voice_provider_unavailable"


def test_tts_returns_audio(voice_client, db_reset, mock_firebase_uid, monkeypatch):
    mock_firebase_uid("demo-patient")

    def fake_synthesize(text: str, lang: str):
        assert text == "Karibu CareFlow"
        assert lang == "sw"
        return b"\xff\xfb", "pawa"

    monkeypatch.setattr("app.voice.router.synthesize", fake_synthesize)

    response = voice_client.post(
        "/voice/tts",
        headers=_AUTH,
        json={"text": "Karibu CareFlow", "lang": "sw"},
    )
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("audio/mpeg")
    assert response.headers["x-voice-provider"] == "pawa"
    assert response.content == b"\xff\xfb"
