"""ElevenLabs TTS stays on Daniel - Steady Broadcaster unless overridden."""

from app.voice.providers.elevenlabs import (
    DANIEL_STEADY_BROADCASTER_VOICE_ID,
    _tts_voice_id,
)


def test_tts_defaults_to_daniel_steady_broadcaster(monkeypatch):
    monkeypatch.delenv("ELEVENLABS_VOICE_ID", raising=False)
    assert _tts_voice_id() == DANIEL_STEADY_BROADCASTER_VOICE_ID
    assert DANIEL_STEADY_BROADCASTER_VOICE_ID == "onwK4e9ZLuTAKqWW03F9"


def test_tts_empty_env_still_uses_daniel(monkeypatch):
    monkeypatch.setenv("ELEVENLABS_VOICE_ID", "   ")
    assert _tts_voice_id() == DANIEL_STEADY_BROADCASTER_VOICE_ID


def test_tts_honors_nonempty_voice_override(monkeypatch):
    monkeypatch.setenv("ELEVENLABS_VOICE_ID", "JBFqnCBsd6RMkjVDRZzb")
    assert _tts_voice_id() == "JBFqnCBsd6RMkjVDRZzb"
