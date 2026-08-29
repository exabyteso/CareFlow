"use client";

import { useEffect, useRef, useState } from "react";

import { t, type Locale } from "@/lib/i18n";
import { ui } from "@/lib/ui";
import { getVoiceConsent } from "@/lib/voice-consent";

type SymptomFormProps = {
  locale: Locale;
  value: string;
  onChange: (value: string) => void;
};

type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((ev: RecognitionResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

type RecognitionResultEvent = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

function getRecognitionConstructor(): (new () => RecognitionLike) | null {
  if (typeof window === "undefined") {
    return null;
  }
  const w = window as unknown as {
    SpeechRecognition?: new () => RecognitionLike;
    webkitSpeechRecognition?: new () => RecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function MicIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0" />
      <path d="M12 17v4" />
    </svg>
  );
}

export function SymptomForm({ locale, value, onChange }: SymptomFormProps) {
  const [canSpeak, setCanSpeak] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    const consented = getVoiceConsent() === "yes";
    const Ctor = getRecognitionConstructor();
    setCanSpeak(consented && Ctor !== null);

    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  function stopListening() {
    recognitionRef.current?.stop();
  }

  function startListening() {
    const Ctor = getRecognitionConstructor();
    if (!Ctor) {
      return;
    }
    recognitionRef.current?.abort();
    const rec = new Ctor();
    rec.lang = locale === "sw" ? "sw-KE" : "en-KE";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (ev) => {
      let spoken = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const row = ev.results[i];
        if (row.isFinal) {
          spoken += row[0].transcript;
        }
      }
      const next = spoken.trim();
      if (!next) {
        return;
      }
      const prev = valueRef.current.trim();
      onChange(prev ? `${prev} ${next}` : next);
    };
    rec.onerror = () => {
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
      recognitionRef.current = null;
    }
  }

  function onSpeakClick() {
    if (listening) {
      stopListening();
      return;
    }
    startListening();
  }

  return (
    <section aria-labelledby="symptoms-heading">
      <h2
        id="symptoms-heading"
        className="text-lg font-semibold text-cf-ink"
      >
        {t("symptomsHeading", locale)}
      </h2>

      <div className="mt-4">
        <label
          htmlFor="patient-symptoms"
          className="mb-1 block text-sm font-medium text-cf-ink"
        >
          {t("symptomsLabel", locale)}
        </label>
        <textarea
          id="patient-symptoms"
          name="symptoms"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("symptomsPlaceholder", locale)}
          className={ui.textarea}
          rows={5}
        />
      </div>

      {canSpeak ? (
        <button
          type="button"
          className={`mt-3 ${ui.secondaryBtn}`}
          onClick={onSpeakClick}
          aria-pressed={listening}
          aria-label={t("symptomsSpeak", locale)}
        >
          <span className="inline-flex items-center gap-2">
            <MicIcon />
            {t("symptomsSpeak", locale)}
          </span>
        </button>
      ) : null}
    </section>
  );
}
