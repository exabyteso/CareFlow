"""Notes request/response models."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NoteImageInput(BaseModel):
    image_url: str = Field(min_length=1)
    ocr_text: str | None = None
    sort_order: int = 0


class CreateNoteRequest(BaseModel):
    body_text: str | None = None
    audio_transcript: str | None = None
    ocr_text: str | None = None
    images: list[NoteImageInput] = Field(default_factory=list)


class NoteImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    image_url: str
    ocr_text: str | None
    sort_order: int


class NoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    booking_id: int
    author_user_id: int
    body_text: str | None
    audio_transcript: str | None
    ocr_text: str | None
    created_at: datetime
    images: list[NoteImageResponse]


class NoteListResponse(BaseModel):
    notes: list[NoteResponse]
