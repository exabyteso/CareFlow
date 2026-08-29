"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { AppShell, BackToRolePicker } from "@/components/app-shell";
import { getFirebaseAuth } from "@/lib/firebase";
import {
  createBookingNote,
  listBookingNotes,
  type Note,
} from "@/lib/api/notes";

export function HospitalNotesContent() {
  const searchParams = useSearchParams();
  const bookingIdParam = searchParams.get("bookingId");
  const bookingId = bookingIdParam ? Number(bookingIdParam) : NaN;

  const [notes, setNotes] = useState<Note[]>([]);
  const [bodyText, setBodyText] = useState("");
  const [audioTranscript, setAudioTranscript] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadNotes = useCallback(async () => {
    if (!Number.isFinite(bookingId)) return;
    const user = getFirebaseAuth().currentUser;
    if (!user) {
      setStatus("Sign in as hospital staff to view notes.");
      return;
    }
    const token = await user.getIdToken();
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
    const user = getFirebaseAuth().currentUser;
    if (!user) {
      setStatus("Sign in as hospital staff to add notes.");
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const token = await user.getIdToken();
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

  return (
    <AppShell width="desk">
      <BackToRolePicker />

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Clinical notes
        </h1>
        <p className="mt-3 text-base text-cf-muted">
          Staff at this facility only. Patients cannot read these notes.
        </p>
        <p className="mt-2 text-sm">
          <Link href="/hospital" className="text-cf-teal underline-offset-4 hover:underline">
            Back to hospital desk
          </Link>
        </p>
      </header>

      {!Number.isFinite(bookingId) ? (
        <p className="mt-6 text-sm text-cf-muted" role="status">
          Open this page with <code>?bookingId=</code> from a booking on the desk.
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
                className="mt-1 w-full rounded-lg border border-cf-line bg-cf-card px-3 py-2 text-sm"
                rows={4}
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="audio-transcript" className="block text-sm font-medium">
                Voice transcript
              </label>
              <textarea
                id="audio-transcript"
                className="mt-1 w-full rounded-lg border border-cf-line bg-cf-card px-3 py-2 text-sm"
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
                className="mt-1 w-full rounded-lg border border-cf-line bg-cf-card px-3 py-2 text-sm"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-cf-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
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
                  <li
                    key={note.id}
                    className="rounded-xl border border-cf-line bg-cf-card px-4 py-3 text-sm"
                  >
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
                            <a href={img.image_url} className="text-cf-teal underline">
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
    </AppShell>
  );
}
