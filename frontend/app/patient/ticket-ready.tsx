"use client";

import type { PatientTicket } from "@/lib/api/bookings";
import { t, type Locale } from "@/lib/i18n";
import { ui } from "@/lib/ui";

type TicketReadyProps = {
  locale: Locale;
  ticket: PatientTicket;
  onStartOver: () => void;
  onLookup: () => void;
};

export function TicketReady({
  locale,
  ticket,
  onStartOver,
  onLookup,
}: TicketReadyProps) {
  return (
    <section className="mt-6" aria-labelledby="ticket-ready-heading">
      <h2
        id="ticket-ready-heading"
        className="text-lg font-semibold text-cf-ink"
      >
        {t("ticketReadyHeading", locale)}
      </h2>
      <p className={`mt-2 ${ui.subtitle}`}>{t("ticketReadyBody", locale)}</p>

      <article className={`mt-6 text-center ${ui.card}`}>
        <p className="text-sm font-medium text-cf-muted">
          {t("ticketCodeLabel", locale)}
        </p>
        <p className="mt-3 font-mono text-4xl font-semibold tracking-widest text-cf-ink sm:text-5xl">
          {ticket.code}
        </p>
        <p className="mt-4 text-base font-medium text-cf-ink">
          {t("ticketShowStaff", locale)}
        </p>
        <p className="mt-4 text-sm text-cf-muted">
          {t("summaryFacility", locale)}:{" "}
          <span className="font-medium text-cf-ink">{ticket.facility_name}</span>
        </p>
        <p className="mt-1 text-sm text-cf-muted">
          {t("summaryKind", locale)}:{" "}
          <span className="font-medium text-cf-ink">
            {ticket.booking_kind === "appointment"
              ? t("bookKindAppointment", locale)
              : t("bookKindInstant", locale)}
          </span>
        </p>
      </article>

      <div className="mt-6 flex flex-col gap-3">
        <button type="button" className={ui.primaryBtn} onClick={onLookup}>
          {t("lookupThisTicket", locale)}
        </button>
        <button type="button" className={ui.secondaryBtn} onClick={onStartOver}>
          {t("startOverCta", locale)}
        </button>
      </div>
    </section>
  );
}
