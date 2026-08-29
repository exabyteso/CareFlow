"""Run STT/TTS with provider cascade (switch once on failure)."""

from __future__ import annotations

from app.voice.cascade import normalize_lang, stt_provider_order, tts_provider_order
from app.voice.providers.base import VoiceProviderError
from app.voice.providers.elevenlabs import ElevenLabsProvider
from app.voice.providers.pawa import PawaProvider
from app.voice.schemas import VoiceProviderName

_elevenlabs = ElevenLabsProvider()
_pawa = PawaProvider()


def _provider(name: VoiceProviderName) -> ElevenLabsProvider | PawaProvider:
    if name == "elevenlabs":
        return _elevenlabs
    return _pawa


def transcribe(audio_bytes: bytes, lang: str, *, filename: str = "audio.webm") -> tuple[str, VoiceProviderName]:
    """Return transcript and winning provider. Tries each provider at most once."""
    normalized = normalize_lang(lang)
    errors: list[str] = []

    for provider_name in stt_provider_order(normalized):
        provider = _provider(provider_name)
        try:
            if provider_name == "elevenlabs":
                text = provider.speech_to_text(audio_bytes, normalized, filename=filename)
            else:
                text = provider.speech_to_text(audio_bytes, normalized)
            return text, provider_name
        except VoiceProviderError as exc:
            errors.append(f"{provider_name}: {exc}")

    detail = "; ".join(errors) if errors else "No STT providers configured."
    raise VoiceProviderError("cascade", f"Speech-to-text failed. {detail}")


def synthesize(text: str, lang: str) -> tuple[bytes, VoiceProviderName]:
    """Return MPEG audio bytes and winning provider."""
    normalized = normalize_lang(lang)
    errors: list[str] = []

    for provider_name in tts_provider_order(normalized):
        provider = _provider(provider_name)
        try:
            audio = provider.text_to_speech(text, normalized)
            return audio, provider_name
        except VoiceProviderError as exc:
            errors.append(f"{provider_name}: {exc}")

    detail = "; ".join(errors) if errors else "No TTS providers configured."
    raise VoiceProviderError("cascade", f"Text-to-speech failed. {detail}")
