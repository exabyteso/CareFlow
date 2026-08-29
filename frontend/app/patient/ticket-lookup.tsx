"use client";

import { type FormEvent, useState } from "react";

import {
  lookupTicket,
  type PatientTicket,
} from "@/lib/api/bookings";
import { t, type Locale } from "@/lib/i18n";
import { ui } from "@/lib/ui";

import { formatNairobiSlot } from "./journey-utils";

type TicketLookupProps = {
  locale: Locale;
  initialCode?: string;
  initialTicket?: PatientTicket | null;
  onBack: () => void;
};

function kindLabel(kind: PatientTicket["booking_kind"], locale: Locale): string {
  return kind === "appointment"
    ? t("bookKindAppointment", locale)
    : t("bookKindInstant", locale);
}

function symptomsText(ticket: PatientTicket): string {
  const free = ticket.patient_free_text?.trim();
  if (free) {
    return free;
  }
  if (ticket.symptom_slugs.length > 0) {
    return ticket.symptom_slugs.join(", ");
  }
  return "—";
}

export function TicketLookup({
  locale,
  initialCode = "",
  initialTicket = null,
  onBack,
}: TicketLookupProps) {
  const [code, setCode] = useState(initialCode);
  const [ticket, setTicket] = useState<PatientTicket | null>(initialTicket);
  const [lookedUp, setLookedUp] = useState(initialTicket !== null || initialCode !== "");

  function runLookup(raw: string): void {
    const found = lookupTicket(raw);
    setTicket(found);
    setLookedUp(true);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runLookup(code);
  }

  return (
    <section className="mt-6" aria-labelledby="lookup-heading">
      <h2 id="lookup-heading" className="text-lg font-semibold text-cf-ink">
        {t("lookupHeading", locale)}
      </h2>

      <form className="mt-4 flex flex-col gap-3" onSubmit={onSubmit}>
        <div>
          <label
            htmlFor="ticket-code"
            className="mb-1 block text-sm font-medium text-cf-ink"
          >
            {t("lookupLabel", locale)}
          </label>
          <input
            id="ticket-code"
            name="ticket-code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setLookedUp(false);
            }}
            placeholder={t("lookupPlaceholder", locale)}
            className={`${ui.input} font-mono uppercase`}
            autoCapitalize="characters"
            autoComplete="off"
          />
        </div>
        <button type="submit" className={ui.primaryBtn}>
          {t("lookupSubmit", locale)}
        </button>
      </form>

      {lookedUp && !ticket ? (
        <p className="mt-4 text-sm font-medium text-cf-emergency" role="alert">
          {t("lookupNotFound", locale)}
        </p>
      ) : null}

      {ticket ? (
        <article className={`mt-6 ${ui.card}`}>
          <p className="font-mono text-2xl font-semibold tracking-wide text-cf-ink">
            {ticket.code}
          </p>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-cf-muted">{t("lookupFacility", locale)}</dt>
              <dd className="font-medium text-cf-ink">{ticket.facility_name}</dd>
            </div>
            <div>
              <dt className="text-cf-muted">{t("lookupStatus", locale)}</dt>
              <dd className="font-medium capitalize text-cf-ink">{ticket.status}</dd>
            </div>
            <div>
              <dt className="text-cf-muted">{t("summaryKind", locale)}</dt>
              <dd className="font-medium text-cf-ink">
                {kindLabel(ticket.booking_kind, locale)}
              </dd>
            </div>
            {ticket.slot_start ? (
              <div>
                <dt className="text-cf-muted">{t("lookupWhen", locale)}</dt>
                <dd className="font-medium text-cf-ink">
                  {formatNairobiSlot(ticket.slot_start, locale)}
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="text-cf-muted">{t("summarySymptoms", locale)}</dt>
              <dd className="font-medium text-cf-ink">{symptomsText(ticket)}</dd>
            </div>
          </dl>
        </article>
      ) : null}

      <div className="mt-6">
        <button type="button" className={ui.secondaryBtn} onClick={onBack}>
          {t("backCta", locale)}
        </button>
      </div>
    </section>
  );
}
