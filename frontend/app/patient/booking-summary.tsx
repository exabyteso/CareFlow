"use client";

import type { FacilityRecommendItem } from "@/lib/api/patient";
import { t, type Locale } from "@/lib/i18n";
import { ui } from "@/lib/ui";
import { useAuth } from "@/lib/use-auth";

import type { BookKind } from "./book-kind";
import { formatNairobiSlot } from "./journey-utils";
import { SignInForm } from "./sign-in-form";

type BookingSummaryProps = {
  locale: Locale;
  facility: FacilityRecommendItem;
  kind: BookKind;
  slotStart: string | null;
  symptoms: string;
  givenName: string;
  familyName: string;
  phone: string;
  onGivenName: (value: string) => void;
  onFamilyName: (value: string) => void;
  onPhone: (value: string) => void;
};

export function BookingSummary({
  locale,
  facility,
  kind,
  slotStart,
  symptoms,
  givenName,
  familyName,
  phone,
  onGivenName,
  onFamilyName,
  onPhone,
}: BookingSummaryProps) {
  const { uid, ready } = useAuth();

  return (
    <section className="mt-6" aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="text-lg font-semibold text-cf-ink">
        {t("summaryHeading", locale)}
      </h2>

      <dl className={`mt-4 grid gap-3 ${ui.card} text-sm`}>
        <div>
          <dt className="text-cf-muted">{t("summaryFacility", locale)}</dt>
          <dd className="font-medium text-cf-ink">{facility.name}</dd>
        </div>
        <div>
          <dt className="text-cf-muted">{t("summaryKind", locale)}</dt>
          <dd className="font-medium text-cf-ink">
            {kind === "appointment"
              ? t("bookKindAppointment", locale)
              : t("bookKindInstant", locale)}
          </dd>
        </div>
        {kind === "appointment" && slotStart ? (
          <div>
            <dt className="text-cf-muted">{t("summarySlot", locale)}</dt>
            <dd className="font-medium text-cf-ink">
              {formatNairobiSlot(slotStart, locale)}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-cf-muted">{t("summarySymptoms", locale)}</dt>
          <dd className="font-medium text-cf-ink">{symptoms}</dd>
        </div>
      </dl>

      <div className="mt-6 grid gap-4">
        <div>
          <label
            htmlFor="given-name"
            className="mb-1 block text-sm font-medium text-cf-ink"
          >
            {t("givenNameLabel", locale)}
          </label>
          <input
            id="given-name"
            name="given-name"
            autoComplete="given-name"
            value={givenName}
            onChange={(e) => onGivenName(e.target.value)}
            className={ui.input}
          />
        </div>
        <div>
          <label
            htmlFor="family-name"
            className="mb-1 block text-sm font-medium text-cf-ink"
          >
            {t("familyNameLabel", locale)}
          </label>
          <input
            id="family-name"
            name="family-name"
            autoComplete="family-name"
            value={familyName}
            onChange={(e) => onFamilyName(e.target.value)}
            className={ui.input}
          />
        </div>
        <div>
          <label
            htmlFor="phone"
            className="mb-1 block text-sm font-medium text-cf-ink"
          >
            {t("phoneLabel", locale)}
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => onPhone(e.target.value)}
            className={ui.input}
          />
          <p className={`mt-1 ${ui.subtitle}`}>{t("phoneHint", locale)}</p>
        </div>
      </div>

      <p className={`mt-4 ${ui.subtitle}`}>{t("guestBookHint", locale)}</p>

      {ready && !uid ? (
        <div className="mt-6">
          <SignInForm locale={locale} />
        </div>
      ) : null}
    </section>
  );
}
