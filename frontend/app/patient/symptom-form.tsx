"use client";

import { useEffect, useRef, useState } from "react";

import { MicIcon, SearchIcon } from "@/components/icons";
import { t, type Locale } from "@/lib/i18n";
import { ui } from "@/lib/ui";
import { getVoiceConsent } from "@/lib/voice-consent";

type SymptomFormProps = {
  locale: Locale;
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
  showSearch?: boolean;
  searching?: boolean;
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

export function SymptomForm({
  locale,
  value,
  onChange,
  onSearch,
  showSearch = false,
  searching = false,
}: SymptomFormProps) {
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
        <div className="flex min-h-12 items-start gap-2 rounded-2xl border border-cf-line bg-cf-card px-3 py-2 shadow-md">
          <SearchIcon className="mt-2.5 h-5 w-5 shrink-0 text-cf-muted" />
          <textarea
            id="patient-symptoms"
            name="symptoms"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t("symptomsPlaceholder", locale)}
            className="min-h-32 w-full resize-y border-0 bg-transparent py-2 text-base text-cf-ink placeholder:text-cf-muted focus:outline-none"
            rows={5}
          />
          {canSpeak ? (
            <button
              type="button"
              className="inline-flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-xl text-cf-primary hover:bg-cf-primary/10"
              onClick={onSpeakClick}
              aria-pressed={listening}
              aria-label={t("symptomsSpeak", locale)}
            >
              <MicIcon className="h-5 w-5" />
            </button>
          ) : null}
        </div>
        {showSearch && onSearch ? (
          <div className="mt-3">
            <button
              type="button"
              className={ui.primaryBtn}
              onClick={onSearch}
              disabled={searching}
            >
              {searching ? t("loading", locale) : t("findFacilities", locale)}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
