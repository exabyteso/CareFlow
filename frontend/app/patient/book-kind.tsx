"use client";

import { t, type Locale } from "@/lib/i18n";
import { ui } from "@/lib/ui";

import { formatNairobiSlot } from "./journey-utils";

export type BookKind = "instant" | "appointment";

type BookKindStepProps = {
  locale: Locale;
  kind: BookKind | null;
  slotStart: string | null;
  slots: string[];
  onKind: (kind: BookKind) => void;
  onSlot: (iso: string) => void;
};

export function BookKindStep({
  locale,
  kind,
  slotStart,
  slots,
  onKind,
  onSlot,
}: BookKindStepProps) {
  return (
    <section className="mt-6" aria-labelledby="book-kind-heading">
      <h2 id="book-kind-heading" className="text-lg font-semibold text-cf-ink">
        {t("bookKindHeading", locale)}
      </h2>

      <div
        className="mt-4 grid gap-4"
        role="radiogroup"
        aria-labelledby="book-kind-heading"
      >
        <button
          type="button"
          role="radio"
          aria-checked={kind === "instant"}
          className={`${ui.card} w-full min-h-12 text-left transition ${
            kind === "instant" ? "border-cf-primary ring-2 ring-cf-primary" : ""
          }`}
          onClick={() => onKind("instant")}
        >
          <p className="text-base font-semibold text-cf-ink">
            {t("bookKindInstant", locale)}
          </p>
          <p className={`mt-1 ${ui.subtitle}`}>
            {t("bookKindInstantHint", locale)}
          </p>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={kind === "appointment"}
          className={`${ui.card} w-full min-h-12 text-left transition ${
            kind === "appointment"
              ? "border-cf-primary ring-2 ring-cf-primary"
              : ""
          }`}
          onClick={() => onKind("appointment")}
        >
          <p className="text-base font-semibold text-cf-ink">
            {t("bookKindAppointment", locale)}
          </p>
          <p className={`mt-1 ${ui.subtitle}`}>
            {t("bookKindAppointmentHint", locale)}
          </p>
        </button>
      </div>

      {kind === "appointment" ? (
        <div className="mt-6">
          <h3 className="text-base font-semibold text-cf-ink">
            {t("pickSlotHeading", locale)}
          </h3>
          {slots.length === 0 ? (
            <p className="mt-3 text-sm text-cf-muted">
              {t("noSlotsLeft", locale)}
            </p>
          ) : (
            <div
              className="mt-3 flex flex-col gap-2"
              role="radiogroup"
              aria-label={t("pickSlotHeading", locale)}
            >
              {slots.map((iso) => {
                const selected = slotStart === iso;
                return (
                  <button
                    key={iso}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`min-h-12 rounded-xl border px-4 text-left text-base font-medium ${
                      selected
                        ? "border-cf-primary bg-cf-primary/10 text-cf-primary"
                        : "border-cf-line bg-cf-card text-cf-ink"
                    }`}
                    onClick={() => onSlot(iso)}
                  >
                    {formatNairobiSlot(iso, locale)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
