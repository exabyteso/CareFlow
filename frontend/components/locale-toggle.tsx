"use client";

import { useEffect, useId, useRef, useState } from "react";

import { ChevronUpIcon, GlobeIcon } from "@/components/icons";
import {
  getLocale,
  setLocale,
  subscribeLocale,
  t,
  type Locale,
} from "@/lib/i18n";

function applyDocumentLang(locale: Locale) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale;
  }
}

const OPTIONS: { value: Locale; lang: string }[] = [
  { value: "en", lang: "en" },
  { value: "sw", lang: "sw" },
];

type LocaleToggleProps = {
  /** Tab bar opens up; marketing chrome can open down. */
  menuPlacement?: "up" | "down";
  /** `tab` fills a tab-bar cell; `chrome` is a compact header/footer control. */
  variant?: "tab" | "chrome";
};

/** Language menu. Default matches the care-seeker bottom tab bar. */
export function LocaleToggle({
  menuPlacement = "up",
  variant = "tab",
}: LocaleToggleProps) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const opensDown = menuPlacement === "down";

  useEffect(() => {
    const initial = getLocale();
    setLocaleState(initial);
    applyDocumentLang(initial);
    return subscribeLocale((next) => {
      setLocaleState(next);
    });
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function select(next: Locale) {
    setLocale(next);
    setOpen(false);
  }

  const currentLabel = locale === "en" ? t("localeEn", locale) : t("localeSw", locale);
  const menuPosition = opensDown
    ? "top-full right-0 mt-2"
    : "bottom-full right-0 mb-2";
  const chevronRotate = open !== opensDown ? "rotate-180" : "";

  return (
    <div
      ref={rootRef}
      className={
        variant === "chrome"
          ? "relative inline-flex items-stretch"
          : "relative flex min-w-0 w-full items-stretch"
      }
    >
      {open ? (
        <div
          id={menuId}
          role="listbox"
          aria-label={t("localeAria", locale)}
          className={`absolute z-50 min-w-[11.5rem] overflow-hidden rounded-xl border border-cf-line bg-cf-card py-1 shadow-[0_12px_40px_rgb(22,33,44,0.14)] ${menuPosition}`}
        >
          {OPTIONS.map((option) => {
            const selected = locale === option.value;
            const label =
              option.value === "en" ? t("localeEn", locale) : t("localeSw", locale);
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                lang={option.lang}
                aria-selected={selected}
                className={`flex w-full min-h-11 items-center px-3 text-left text-sm font-medium ${
                  selected
                    ? "bg-cf-surface text-cf-primary"
                    : "text-cf-ink hover:bg-cf-surface"
                }`}
                onClick={() => select(option.value)}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : null}

      <button
        type="button"
        className={
          variant === "chrome"
            ? "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-cf-primary bg-transparent px-3 text-sm font-semibold text-cf-primary hover:bg-cf-primary/10"
            : "flex min-h-12 min-w-0 w-full flex-col items-center justify-center gap-0.5 px-1 text-center text-xs font-medium leading-tight text-cf-muted hover:text-cf-ink"
        }
        aria-label={t("localeAria", locale)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="flex h-5 w-5 items-center justify-center">
          <GlobeIcon className="h-5 w-5" />
        </span>
        <span className="inline-flex max-w-full items-center justify-center gap-0.5">
          <span className="truncate">{currentLabel}</span>
          <ChevronUpIcon
            className={`h-3.5 w-3.5 shrink-0 transition-transform ${chevronRotate}`}
          />
        </span>
      </button>
    </div>
  );
}
