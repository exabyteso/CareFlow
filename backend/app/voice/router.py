"""POST /voice/stt and POST /voice/tts — patient and staff (J8)."""

from __future__ import annotations

import base64
import binascii
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from app.auth.deps import CurrentUser, get_current_user
from app.core.errors import ErrorEnvelope
from app.voice.providers.base import VoiceProviderError
from app.voice.schemas import (
    SpeechToTextRequest,
    SpeechToTextResponse,
    TextToSpeechRequest,
)
from app.voice.service import synthesize, transcribe

router = APIRouter(prefix="/voice", tags=["voice"])

_MAX_AUDIO_BYTES = 10 * 1024 * 1024


@router.post(
    "/stt",
    response_model=SpeechToTextResponse,
    operation_id="speechToText",
    summary="Transcribe audio (ElevenLabs then Pawa)",
    responses={
        401: {"model": ErrorEnvelope, "description": "Missing or invalid Firebase ID token."},
        422: {"model": ErrorEnvelope, "description": "Validation error (empty audio or lang)."},
        502: {
            "model": ErrorEnvelope,
            "description": "All configured STT providers failed.",
        },
    },
)
def speech_to_text(
    user: Annotated[CurrentUser, Depends(get_current_user)],
    body: SpeechToTextRequest,
) -> SpeechToTextResponse:
    _ = user
    try:
        raw = base64.b64decode(body.audio_base64, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise HTTPException(
            status_code=422,
            detail={"code": "validation_error", "message": "audio_base64 is not valid base64."},
        ) from exc

    if not raw:
        raise HTTPException(
            status_code=422,
            detail={"code": "validation_error", "message": "Audio payload is empty."},
        )
    if len(raw) > _MAX_AUDIO_BYTES:
        raise HTTPException(
            status_code=422,
            detail={"code": "validation_error", "message": "Audio payload exceeds 10 MB."},
        )

    try:
        text, provider = transcribe(raw, body.lang, filename=body.filename)
    except VoiceProviderError as exc:
        raise HTTPException(
            status_code=502,
            detail={
                "code": "voice_provider_unavailable",
                "message": str(exc),
            },
        ) from exc

    return SpeechToTextResponse(
        text=text,
        provider=provider,
        lang=body.lang.strip().lower(),
    )


@router.post(
    "/tts",
    operation_id="textToSpeech",
    summary="Synthesize speech (ElevenLabs then Pawa)",
    responses={
        401: {"model": ErrorEnvelope, "description": "Missing or invalid Firebase ID token."},
        422: {"model": ErrorEnvelope, "description": "Validation error."},
        502: {
            "model": ErrorEnvelope,
            "description": "All configured TTS providers failed.",
        },
    },
)
def text_to_speech(
    user: Annotated[CurrentUser, Depends(get_current_user)],
    body: TextToSpeechRequest,
) -> Response:
    _ = user
    try:
        audio, provider = synthesize(body.text, body.lang)
    except VoiceProviderError as exc:
        raise HTTPException(
            status_code=502,
            detail={
                "code": "voice_provider_unavailable",
                "message": str(exc),
            },
        ) from exc

    return Response(
        content=audio,
        media_type="audio/mpeg",
        headers={
            "X-Voice-Provider": provider,
            "X-Voice-Lang": body.lang.strip().lower(),
        },
    )
