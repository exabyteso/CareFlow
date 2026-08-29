"""Provider order for voice cascade."""

from app.voice.cascade import stt_provider_order, tts_provider_order


def test_stt_en_prefers_elevenlabs():
    assert stt_provider_order("en") == ("elevenlabs", "pawa")


def test_stt_sw_prefers_elevenlabs():
    assert stt_provider_order("sw") == ("elevenlabs", "pawa")


def test_stt_kikuyu_prefers_pawa():
    assert stt_provider_order("ki") == ("pawa", "elevenlabs")


def test_stt_luo_prefers_pawa():
    assert stt_provider_order("luo") == ("pawa", "elevenlabs")


def test_tts_meru_prefers_pawa():
    assert tts_provider_order("mer") == ("pawa", "elevenlabs")


def test_stt_normalizes_case():
    assert stt_provider_order(" EN ") == ("elevenlabs", "pawa")
