"use client";

import { useEffect, useRef } from "react";

import { t, type Locale } from "@/lib/i18n";
import { ui } from "@/lib/ui";
import { setVoiceConsent } from "@/lib/voice-consent";

function getSpeechSynthesis(): SpeechSynthesis | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const synth = window.speechSynthesis;
    if (!synth || typeof synth.speak !== "function") {
      return null;
    }
    if (typeof SpeechSynthesisUtterance === "undefined") {
      return null;
    }
    return synth;
  } catch {
    return null;
  }
}

function cancelSpeech(): void {
  const synth = getSpeechSynthesis();
  if (!synth) {
    return;
  }
  try {
    synth.cancel();
  } catch {
    // Safari / missing implementation must not crash the care-seeker flow.
  }
}

function isEnglishVoiceLang(lang: string): boolean {
  const normalized = lang.replace(/_/g, "-").toLowerCase();
  return normalized === "en" || normalized.startsWith("en-");
}

/** Prefer the product English voice (Daniel), else an en-* voice. */
function pickEnglishVoice(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  const english = voices.filter((voice) => isEnglishVoiceLang(voice.lang));
  const pool = english.length > 0 ? english : voices;
  if (pool.length === 0) {
    return null;
  }
  const daniel = pool.find((voice) =>
    voice.name.toLowerCase().includes("daniel"),
  );
  if (daniel) {
    return daniel;
  }
  const rank = (voice: SpeechSynthesisVoice): number => {
    const lang = voice.lang.replace(/_/g, "-").toLowerCase();
    if (lang === "en-ke" || lang.startsWith("en-ke")) {
      return 0;
    }
    if (lang === "en-gb" || lang.startsWith("en-gb")) {
      return 1;
    }
    if (lang === "en-us" || lang.startsWith("en-us")) {
      return 2;
    }
    if (lang === "en" || lang.startsWith("en")) {
      return 3;
    }
    return 4;
  };
  return [...pool].sort((a, b) => rank(a) - rank(b))[0] ?? null;
}

function englishWalkthroughText(): string {
  return [
    t("greetingTitle", "en"),
    t("pretriageDisclaimer", "en"),
    t("careSeekerTitle", "en"),
    t("pretriageExplanation", "en"),
  ].join(" ");
}

function speakEnglishWalkthrough(voices: SpeechSynthesisVoice[]): void {
  const synth = getSpeechSynthesis();
  if (!synth) {
    return;
  }
  try {
    const utterance = new SpeechSynthesisUtterance(englishWalkthroughText());
    const voice = pickEnglishVoice(voices);
    utterance.lang = voice?.lang || "en-KE";
    if (voice) {
      utterance.voice = voice;
    }
    synth.speak(utterance);
  } catch {
    // Feature-detect already ran; still fail closed to visual UI.
  }
}

/** Wait for voices (Chrome) then speak. Returns a cancel function. */
function speakWhenVoicesReady(
  run: (voices: SpeechSynthesisVoice[]) => void,
): () => void {
  const synth = getSpeechSynthesis();
  if (!synth) {
    return () => {};
  }

  let cancelled = false;

  const finish = () => {
    if (cancelled) {
      return;
    }
    run(synth.getVoices());
  };

  if (synth.getVoices().length > 0) {
    finish();
    return () => {
      cancelled = true;
    };
  }

  const onVoicesChanged = () => {
    synth.removeEventListener("voiceschanged", onVoicesChanged);
    window.clearTimeout(timeoutId);
    finish();
  };

  const timeoutId = window.setTimeout(() => {
    synth.removeEventListener("voiceschanged", onVoicesChanged);
    finish();
  }, 400);

  synth.addEventListener("voiceschanged", onVoicesChanged);

  return () => {
    cancelled = true;
    synth.removeEventListener("voiceschanged", onVoicesChanged);
    window.clearTimeout(timeoutId);
  };
}

type VoiceConsentCardProps = {
  locale: Locale;
  onConsent: (value: "yes" | "no") => void;
};

export function VoiceConsentCard({ locale, onConsent }: VoiceConsentCardProps) {
  const stopWalkthroughRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    return () => {
      stopWalkthroughRef.current?.();
      cancelSpeech();
    };
  }, []);

  function chooseConsent(value: "yes" | "no") {
    cancelSpeech();
    stopWalkthroughRef.current?.();
    stopWalkthroughRef.current = undefined;
    setVoiceConsent(value);
    onConsent(value);
    if (value !== "yes") {
      return;
    }
    stopWalkthroughRef.current = speakWhenVoicesReady((voices) => {
      speakEnglishWalkthrough(voices);
    });
  }

  const yesLabel = t("voiceConsentYes", locale);
  const yesHint = t("voiceConsentYesSwHint", locale);
  const yesAria = yesLabel === yesHint ? yesLabel : `${yesLabel}, ${yesHint}`;

  return (
    <section className={`${ui.card} max-w-xl`} aria-labelledby="voice-consent-ask">
      <p id="voice-consent-ask" className="text-base text-cf-ink">
        {t("voiceConsentAsk", locale)}
      </p>
      <div className="mt-4 flex flex-col gap-3 lg:flex-row">
        <button
          type="button"
          className={ui.primaryBtn}
          aria-label={yesAria}
          aria-describedby="voice-consent-ask"
          onClick={() => chooseConsent("yes")}
        >
          {yesLabel}
          {yesLabel !== yesHint ? (
            <span className="ml-2 font-medium opacity-90">({yesHint})</span>
          ) : null}
        </button>
        <button
          type="button"
          className={ui.secondaryBtn}
          aria-describedby="voice-consent-ask"
          onClick={() => chooseConsent("no")}
        >
          {t("voiceConsentNo", locale)}
        </button>
      </div>
    </section>
  );
}
