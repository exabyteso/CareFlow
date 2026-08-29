"""Provider selection for STT/TTS (ElevenLabs first, Pawa fallback)."""

from __future__ import annotations

from typing import Literal

VoiceProviderName = Literal["elevenlabs", "pawa"]

# Kenyan local langs → Pawa first per kenya-pretriage.md voice routing table.
PAWA_PRIMARY_LANGS = frozenset({"ki", "luo", "kam", "mer", "kln"})
ELEVENLABS_PRIMARY_LANGS = frozenset({"en", "sw"})


def normalize_lang(lang: str) -> str:
    return lang.strip().lower()


def stt_provider_order(lang: str) -> tuple[VoiceProviderName, ...]:
    """Return provider try-order for speech-to-text."""
    code = normalize_lang(lang)
    if code in PAWA_PRIMARY_LANGS:
        return ("pawa", "elevenlabs")
    if code in ELEVENLABS_PRIMARY_LANGS:
        return ("elevenlabs", "pawa")
    # Unknown code: prefer ElevenLabs then Pawa (en/sw bias).
    return ("elevenlabs", "pawa")


def tts_provider_order(lang: str) -> tuple[VoiceProviderName, ...]:
    """Return provider try-order for text-to-speech."""
    code = normalize_lang(lang)
    if code in PAWA_PRIMARY_LANGS:
        return ("pawa", "elevenlabs")
    if code in ELEVENLABS_PRIMARY_LANGS:
        return ("elevenlabs", "pawa")
    return ("elevenlabs", "pawa")
