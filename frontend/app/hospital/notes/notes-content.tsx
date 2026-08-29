"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

import {
  createBookingNote,
  listBookingNotes,
  type Note,
} from "@/lib/api/notes";
import { getIdToken } from "@/lib/auth";
import { ui } from "@/lib/ui";

import { HospitalChrome } from "../hospital-ui";

export function HospitalNotesContent() {
  const searchParams = useSearchParams();
  const bookingIdParam =
    searchParams.get("bookingId") ?? searchParams.get("booking_id");
  const bookingId = bookingIdParam ? Number(bookingIdParam) : NaN;

  const [notes, setNotes] = useState<Note[]>([]);
  const [bodyText, setBodyText] = useState("");
  const [audioTranscript, setAudioTranscript] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadNotes = useCallback(async () => {
    if (!Number.isFinite(bookingId)) return;
    const token = await getIdToken();
    if (!token) {
      setStatus("Sign in as hospital staff to view notes.");
      return;
    }
    const data = await listBookingNotes(bookingId, token);
    setNotes(data.notes);
  }, [bookingId]);

  useEffect(() => {
    loadNotes().catch((err: unknown) => {
      setStatus(err instanceof Error ? err.message : "Could not load notes.");
    });
  }, [loadNotes]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!Number.isFinite(bookingId)) {
      setStatus("Add ?bookingId= to the URL from the hospital desk.");
      return;
    }
    const token = await getIdToken();
    if (!token) {
      setStatus("Sign in as hospital staff to add notes.");
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      await createBookingNote(bookingId, token, {
        body_text: bodyText || null,
        audio_transcript: audioTranscript || null,
        images: imageUrl
          ? [{ image_url: imageUrl, sort_order: 0 }]
          : undefined,
      });
      setBodyText("");
      setAudioTranscript("");
      setImageUrl("");
      await loadNotes();
      setStatus("Note saved.");
    } catch (err: unknown) {
      setStatus(err instanceof Error ? err.message : "Could not save note.");
    } finally {
      setLoading(false);
    }
  }

  const subtitle = Number.isFinite(bookingId)
    ? `Staff-only notes · booking #${bookingId}`
    : "Staff-only notes · patients cannot read these";

  return (
    <HospitalChrome title="CareFlow — Notes" subtitle={subtitle}>
      <div className="p-4 md:p-5">
        <p>
          <Link href="/hospital" className={ui.textLink}>
            Back to hospital desk
          </Link>
        </p>

        {!Number.isFinite(bookingId) ? (
          <p className="mt-6 text-sm text-cf-muted" role="status">
            Open this page with <code>?bookingId=</code> from a booking on the
            desk.
          </p>
        ) : (
          <>
            <form className="mt-8 space-y-4" onSubmit={onSubmit}>
              <div>
                <label htmlFor="body-text" className="block text-sm font-medium">
                  Text note
                </label>
                <textarea
                  id="body-text"
                  className={`${ui.textarea} mt-1`}
                  rows={4}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="audio-transcript"
                  className="block text-sm font-medium"
                >
                  Voice transcript
                </label>
                <textarea
                  id="audio-transcript"
                  className={`${ui.textarea} mt-1`}
                  rows={3}
                  value={audioTranscript}
                  onChange={(e) => setAudioTranscript(e.target.value)}
                  placeholder="Browser speech-to-text or dictated summary"
                />
              </div>

              <div>
                <label htmlFor="image-url" className="block text-sm font-medium">
                  Photo URL
                </label>
                <input
                  id="image-url"
                  type="url"
                  className={`${ui.input} mt-1`}
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://…"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`${ui.primaryBtn} disabled:opacity-60`}
              >
                {loading ? "Saving…" : "Save note"}
              </button>
            </form>

            <section className="mt-10" aria-labelledby="notes-list-heading">
              <h2 id="notes-list-heading" className="text-base font-semibold">
                Notes for booking #{bookingId}
              </h2>
              {notes.length === 0 ? (
                <p className="mt-2 text-sm text-cf-muted">No notes yet.</p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {notes.map((note) => (
                    <li key={note.id} className={ui.card}>
                      {note.body_text && <p>{note.body_text}</p>}
                      {note.audio_transcript && (
                        <p className="mt-2 text-cf-muted">
                          Voice: {note.audio_transcript}
                        </p>
                      )}
                      {note.images.length > 0 && (
                        <ul className="mt-2 list-disc pl-5">
                          {note.images.map((img) => (
                            <li key={img.id}>
                              <a href={img.image_url} className={ui.textLink}>
                                Photo
                              </a>
                              {img.ocr_text ? ` — ${img.ocr_text}` : null}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        {status && (
          <p className="mt-6 text-sm" role="status">
            {status}
          </p>
        )}
      </div>
    </HospitalChrome>
  );
}
