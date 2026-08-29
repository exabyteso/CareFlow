"use client";

import { useCallback, useEffect, useState } from "react";

import { AppShell, BackToRolePicker } from "@/components/app-shell";
import { LocaleToggle } from "@/components/locale-toggle";
import { ApiError, isApiError } from "@/lib/api/client";
import {
  mapSymptoms,
  recommendFacilities,
  type FacilityRecommendItem,
} from "@/lib/api/patient";
import { getLocale, subscribeLocale, t, type Locale } from "@/lib/i18n";
import { ui } from "@/lib/ui";

import { RecommendList } from "./recommend-list";
import { SignInForm } from "./sign-in-form";
import { SymptomForm } from "./symptom-form";

const NAIROBI_CBD: { lat: number; lng: number } = {
  lat: -1.2921,
  lng: 36.8219,
};
const KEPH_MIN = 2;

function apiErrorMessage(err: unknown, locale: Locale): string {
  if (isApiError(err) || err instanceof ApiError) {
    if (err.code === "location_out_of_range") {
      return t("errorLocationOutOfRange", locale);
    }
    if (err.code === "unauthorized") {
      return t("errorUnauthorized", locale);
    }
    if (err.code === "user_not_provisioned") {
      return t("errorUserNotProvisioned", locale);
    }
    if (err.code === "network_error" || err.status === 0) {
      return t("errorNetwork", locale);
    }
  }
  return t("errorGeneric", locale);
}

function readGeolocation(): Promise<{ lat: number; lng: number }> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve({ ...NAIROBI_CBD });
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        resolve({ ...NAIROBI_CBD });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60_000 },
    );
  });
}

function EmergencyIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6 text-cf-emergency"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path d="M12 3 3 21h18L12 3z" />
      <path d="M12 10v5" />
      <circle cx="12" cy="17.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PatientHome() {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [symptoms, setSymptoms] = useState("");
  const [coords, setCoords] = useState(NAIROBI_CBD);
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [facilities, setFacilities] = useState<FacilityRecommendItem[] | null>(
    null,
  );
  const [recommendError, setRecommendError] = useState<unknown>(null);

  useEffect(() => {
    setLocaleState(getLocale());
    return subscribeLocale(setLocaleState);
  }, []);

  const onUseLocation = useCallback(async () => {
    setLocating(true);
    try {
      const next = await readGeolocation();
      setCoords(next);
    } finally {
      setLocating(false);
    }
  }, []);

  const onFindFacilities = useCallback(async () => {
    setSearching(true);
    setRecommendError(null);
    try {
      try {
        await mapSymptoms({ text: symptoms, lang: locale });
      } catch {
        // Mapping is best-effort and must not drive KEPH or ranking.
      }
      const result = await recommendFacilities({
        lat: coords.lat,
        lng: coords.lng,
        keph_min: KEPH_MIN,
      });
      setFacilities(result.facilities);
    } catch (err: unknown) {
      if (isApiError(err) && err.code === "location_out_of_range") {
        setFacilities(null);
      }
      setRecommendError(err);
    } finally {
      setSearching(false);
    }
  }, [coords.lat, coords.lng, locale, symptoms]);

  return (
    <AppShell width="phone">
      <div className="flex flex-col gap-3">
        <BackToRolePicker label={t("backToRolePicker", locale)} />
        <LocaleToggle />
      </div>

      <header className="mt-2">
        <p className="text-sm font-medium tracking-wide text-cf-teal">
          {t("kenyaLabel", locale)}
        </p>
        <h1 className={`mt-1 ${ui.pageTitle}`}>
          {t("careSeekerTitle", locale)}
        </h1>
        <p className="mt-2 text-base font-semibold text-cf-ink">
          {t("notADiagnosis", locale)}
        </p>
        <p className={`mt-2 ${ui.subtitle}`}>
          {t("pretriageExplanation", locale)}
        </p>
      </header>

      <section
        className={`mt-6 ${ui.emergencyCard}`}
        aria-labelledby="emergency-heading"
      >
        <div className="flex items-start gap-3">
          <EmergencyIcon />
          <div className="min-w-0 flex-1">
            <h2
              id="emergency-heading"
              className="text-base font-semibold text-cf-emergency"
            >
              {t("emergencyHeading", locale)}
            </h2>
            <p className="mt-2 text-sm text-cf-ink">
              {t("emergencyBody", locale)}
            </p>
          </div>
        </div>
        <p className="mt-4">
          <a href="tel:999" className={ui.emergencyBtn}>
            {t("call999", locale)}
          </a>
        </p>
        <p className="mt-3 text-sm font-medium text-cf-ink">
          {t("goNow", locale)}
        </p>
      </section>

      <div className="mt-8">
        <SignInForm locale={locale} />
      </div>

      <div className="mt-8">
        <SymptomForm
          locale={locale}
          value={symptoms}
          onChange={setSymptoms}
        />
      </div>

      <section className="mt-8" aria-labelledby="location-heading">
        <h2
          id="location-heading"
          className="text-lg font-semibold text-cf-ink"
        >
          {t("locationHeading", locale)}
        </h2>
        <p className={`mt-2 ${ui.subtitle}`}>
          {t("locationFallbackHint", locale)}
        </p>
        <button
          type="button"
          className={`mt-4 ${ui.primaryBtn}`}
          onClick={() => void onUseLocation()}
          disabled={locating}
        >
          {locating ? t("loading", locale) : t("useMyLocation", locale)}
        </button>
        <button
          type="button"
          className={`mt-3 ${ui.primaryBtn}`}
          onClick={() => void onFindFacilities()}
          disabled={searching}
        >
          {searching ? t("loading", locale) : t("findFacilities", locale)}
        </button>
      </section>

      <div className="mt-8">
        <RecommendList
          locale={locale}
          facilities={facilities}
          loading={searching}
          error={
            recommendError ? apiErrorMessage(recommendError, locale) : null
          }
        />
      </div>
    </AppShell>
  );
}
