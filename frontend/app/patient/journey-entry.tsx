"use client";

import { t, type Locale } from "@/lib/i18n";
import { ui } from "@/lib/ui";

type JourneyEntryProps = {
  locale: Locale;
  onGetTicket: () => void;
  onLookup: () => void;
};

export function JourneyEntry({
  locale,
  onGetTicket,
  onLookup,
}: JourneyEntryProps) {
  return (
    <div className="mt-6 grid gap-4">
      <button
        type="button"
        className={`${ui.card} w-full min-h-12 text-left transition hover:border-cf-primary`}
        onClick={onGetTicket}
      >
        <h2 className="text-xl font-semibold text-cf-ink">
          {t("journeyGetTicket", locale)}
        </h2>
        <p className={`mt-2 ${ui.subtitle}`}>
          {t("journeyGetTicketHint", locale)}
        </p>
      </button>

      <button
        type="button"
        className={`${ui.card} w-full min-h-12 text-left transition hover:border-cf-primary`}
        onClick={onLookup}
      >
        <h2 className="text-xl font-semibold text-cf-ink">
          {t("journeyLookupTicket", locale)}
        </h2>
        <p className={`mt-2 ${ui.subtitle}`}>
          {t("journeyLookupTicketHint", locale)}
        </p>
      </button>
    </div>
  );
}
