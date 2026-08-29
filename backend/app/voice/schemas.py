"""Request/response models for POST /voice/stt and POST /voice/tts."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


VoiceProviderName = Literal["elevenlabs", "pawa"]


class SpeechToTextRequest(BaseModel):
    audio_base64: str = Field(min_length=1, description="Base64-encoded audio bytes.")
    lang: str = Field(
        default="en",
        description="Language code: en, sw, ki, luo, kam, mer, kln.",
    )
    filename: str = Field(default="audio.webm", description="Original filename hint for vendors.")


class SpeechToTextResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    text: str = Field(description="Transcribed utterance.")
    provider: VoiceProviderName = Field(description="Provider that produced the transcript.")
    lang: str = Field(description="Language code from the request (en, sw, ki, luo, kam, mer, kln).")


class TextToSpeechRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    lang: str = Field(
        default="en",
        description="Target language (en, sw, ki, luo, kam, mer, kln).",
    )


class TextToSpeechResponse(BaseModel):
    """JSON metadata when audio is returned as binary (see router Content-Type)."""

    model_config = ConfigDict(from_attributes=True)

    provider: VoiceProviderName
    lang: str
    content_type: str = "audio/mpeg"
