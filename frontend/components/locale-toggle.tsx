"use client";

import { useEffect, useState } from "react";

import {
  getLocale,
  setLocale,
  subscribeLocale,
  t,
  type Locale,
} from "@/lib/i18n";
import { ui } from "@/lib/ui";

function applyDocumentLang(locale: Locale) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale;
  }
}

export function LocaleToggle() {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const initial = getLocale();
    setLocaleState(initial);
    applyDocumentLang(initial);
    return subscribeLocale((next) => {
      setLocaleState(next);
    });
  }, []);

  function select(next: Locale) {
    setLocale(next);
  }

  return (
    <div
      role="group"
      aria-label={t("localeAria", locale)}
      className="flex gap-2"
    >
      <button
        type="button"
        lang="en"
        aria-pressed={locale === "en"}
        className={`flex-1 ${locale === "en" ? ui.primaryBtnCompact : ui.secondaryBtnCompact}`}
        onClick={() => select("en")}
      >
        {t("localeEn", locale)}
      </button>
      <button
        type="button"
        lang="sw"
        aria-pressed={locale === "sw"}
        className={`flex-1 ${locale === "sw" ? ui.primaryBtnCompact : ui.secondaryBtnCompact}`}
        onClick={() => select("sw")}
      >
        {t("localeSw", locale)}
      </button>
    </div>
  );
}
