"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { LocaleToggle } from "@/components/locale-toggle";
import {
  getLocale,
  isLocale,
  LOCALE_STORAGE_KEY,
  subscribeLocale,
  t,
  type Locale,
} from "@/lib/i18n";
import { ui } from "@/lib/ui";
import {
  getVoiceConsent,
  setVoiceConsent,
  type VoiceConsent,
} from "@/lib/voice-consent";

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
    // Safari / missing implementation must not crash the landing.
  }
}

function pickUtteranceLang(
  locale: Locale,
  voices: SpeechSynthesisVoice[],
): string {
  const preferred = locale === "sw" ? "sw-KE" : "en-KE";
  const fallback = locale === "sw" ? "sw" : "en";
  if (voices.length === 0) {
    return preferred;
  }
  const langs = voices.map((voice) =>
    voice.lang.replace(/_/g, "-").toLowerCase(),
  );
  const preferredLower = preferred.toLowerCase();
  if (
    langs.some(
      (lang) => lang === preferredLower || lang.startsWith(preferredLower),
    )
  ) {
    return preferred;
  }
  const fallbackLower = fallback.toLowerCase();
  if (
    langs.some(
      (lang) => lang === fallbackLower || lang.startsWith(`${fallbackLower}-`),
    )
  ) {
    return fallback;
  }
  return preferred;
}

function hasPersistedLocale(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return isLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY));
}

function consentGreetingText(locale: Locale): string {
  return `${t("greetingTitle", locale)}. ${t("greetingSubtitle", locale)}. ${t("voiceConsentAsk", locale)}`;
}

function speakConsentQueue(
  items: { text: string; locale: Locale }[],
  voices: SpeechSynthesisVoice[],
): void {
  const synth = getSpeechSynthesis();
  if (!synth) {
    return;
  }
  try {
    for (const item of items) {
      const utterance = new SpeechSynthesisUtterance(item.text);
      utterance.lang = pickUtteranceLang(item.locale, voices);
      synth.speak(utterance);
    }
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

export function VoiceLanding() {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [consent, setConsentState] = useState<VoiceConsent>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initialLocale = getLocale();
    const initialConsent = getVoiceConsent();
    setLocaleState(initialLocale);
    setConsentState(initialConsent);
    setReady(true);

    const unsubscribe = subscribeLocale((next) => {
      setLocaleState(next);
    });

    let stopVoicesWait: (() => void) | undefined;
    if (initialConsent === null) {
      stopVoicesWait = speakWhenVoicesReady((voices) => {
        const queue = hasPersistedLocale()
          ? [
              {
                text: consentGreetingText(initialLocale),
                locale: initialLocale,
              },
            ]
          : [
              { text: consentGreetingText("sw"), locale: "sw" as const },
              { text: consentGreetingText("en"), locale: "en" as const },
            ];
        speakConsentQueue(queue, voices);
      });
    }

    return () => {
      unsubscribe();
      stopVoicesWait?.();
      cancelSpeech();
    };
  }, []);

  function chooseConsent(value: "yes" | "no") {
    cancelSpeech();
    setVoiceConsent(value);
    setConsentState(value);
  }

  const yesLabel = t("voiceConsentYes", locale);
  const yesHint = t("voiceConsentYesSwHint", locale);
  const yesAria =
    yesLabel === yesHint ? yesLabel : `${yesLabel}, ${yesHint}`;

  return (
    <AppShell width="phone">
      <div className="flex flex-col gap-6">
        <LocaleToggle />

        <header>
          <p className="text-sm font-medium tracking-wide text-cf-teal">
            {t("kenyaLabel", locale)}
          </p>
          <h1 className={`mt-1 ${ui.pageTitle}`}>{t("greetingTitle", locale)}</h1>
          <p className={`mt-2 ${ui.subtitle}`}>{t("greetingSubtitle", locale)}</p>
          <p id="pretriage-disclaimer" className={`mt-3 ${ui.subtitle}`}>
            {t("pretriageDisclaimer", locale)}
          </p>
        </header>

        {ready && consent === null ? (
          <section className={ui.card} aria-labelledby="voice-consent-ask">
            <p id="voice-consent-ask" className="text-base text-cf-ink">
              {t("voiceConsentAsk", locale)}
            </p>
            <div className="mt-4 flex flex-col gap-3">
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
        ) : null}

        {ready && consent !== null ? (
          <nav
            className="flex flex-col gap-3"
            aria-labelledby="role-picker-heading"
          >
            <h2
              id="role-picker-heading"
              className="text-sm font-medium text-cf-muted"
            >
              {t("rolePickerHeading", locale)}
            </h2>

            <Link
              href="/patient"
              aria-describedby="pretriage-disclaimer"
              className={`${ui.card} block min-h-16 hover:border-cf-teal`}
            >
              <span className="block text-lg font-semibold">
                {t("roleCareSeeker", locale)}
              </span>
              <span className={`mt-1 block ${ui.subtitle}`}>
                {t("roleCareSeekerHint", locale)}
              </span>
            </Link>

            <Link
              href="/hospital"
              className={`${ui.card} block min-h-16 hover:border-cf-teal`}
            >
              <span className="block text-lg font-semibold">
                {t("roleHospital", locale)}
              </span>
              <span className={`mt-1 block ${ui.subtitle}`}>
                {t("roleHospitalHint", locale)}
              </span>
            </Link>
          </nav>
        ) : null}
      </div>
    </AppShell>
  );
}
