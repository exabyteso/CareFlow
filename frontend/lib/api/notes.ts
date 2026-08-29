/**
 * Notes API client (P5). Uses fetch + Firebase ID token.
 * When P3 lands `lib/api/client.ts`, switch imports to that wrapper.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export type NoteImageInput = {
  image_url: string;
  ocr_text?: string | null;
  sort_order?: number;
};

export type CreateNotePayload = {
  body_text?: string | null;
  audio_transcript?: string | null;
  ocr_text?: string | null;
  images?: NoteImageInput[];
};

export type NoteImage = {
  id: number;
  image_url: string;
  ocr_text: string | null;
  sort_order: number;
};

export type Note = {
  id: number;
  booking_id: number;
  author_user_id: number;
  body_text: string | null;
  audio_transcript: string | null;
  ocr_text: string | null;
  created_at: string;
  images: NoteImage[];
};

async function apiFetch<T>(
  path: string,
  idToken: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof body?.error?.message === "string"
        ? body.error.message
        : "Request failed.";
    throw new Error(message);
  }
  return body as T;
}

export async function createBookingNote(
  bookingId: number,
  idToken: string,
  payload: CreateNotePayload,
): Promise<Note> {
  return apiFetch<Note>(`/hospital/bookings/${bookingId}/notes`, idToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listBookingNotes(
  bookingId: number,
  idToken: string,
): Promise<{ notes: Note[] }> {
  return apiFetch<{ notes: Note[] }>(
    `/hospital/bookings/${bookingId}/notes`,
    idToken,
  );
}
