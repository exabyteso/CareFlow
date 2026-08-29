"use client";

import { useCallback, useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { EmergencyIcon } from "@/components/icons";
import { VoiceConsentCard } from "@/components/voice-consent-card";
import {
  createCareSeekerBooking,
  listBookingSlots,
  lookupTicket,
  type PatientTicket,
} from "@/lib/api/bookings";
import {
  getMe,
  mapSymptoms,
  recommendFacilities,
  type FacilityRecommendItem,
  type MapSymptomsResult,
} from "@/lib/api/patient";
import { getLocale, subscribeLocale, t, type Locale } from "@/lib/i18n";
import { ui } from "@/lib/ui";
import { useAuth } from "@/lib/use-auth";
import {
  getVoiceConsent,
  type VoiceConsent,
} from "@/lib/voice-consent";

import { BookKindStep, type BookKind } from "./book-kind";
import { BookingSummary } from "./booking-summary";
import { JourneyEntry } from "./journey-entry";
import {
  JOURNEY_STEPS,
  NAIROBI_CBD,
  apiErrorMessage,
  phoneHasLast4,
  readGeolocation,
  stepOfLabel,
} from "./journey-utils";
import { RecommendList } from "./recommend-list";
import { SymptomForm } from "./symptom-form";
import { TicketLookup } from "./ticket-lookup";
import { TicketReady } from "./ticket-ready";

type Screen = "entry" | "lookup" | "journey";
type JourneyStep = 1 | 2 | 3 | 4 | 5;

const STEP_TITLE: Record<1 | 2 | 3 | 4, string> = {
  1: "stepSymptoms",
  2: "stepHospital",
  3: "stepBook",
  4: "stepSummary",
};

function recommendParams(mapped: MapSymptomsResult | null): {
  keph_min: number;
  red_flag: boolean;
} {
  if (!mapped || mapped.degraded) {
    return { keph_min: 2, red_flag: false };
  }
  return {
    keph_min: mapped.keph_min ?? 2,
    red_flag: mapped.red_flag,
  };
}

export function PatientHome() {
  const { uid } = useAuth();
  const [locale, setLocaleState] = useState<Locale>("en");
  const [consent, setConsent] = useState<VoiceConsent>(null);
  const [consentReady, setConsentReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("entry");
  const [step, setStep] = useState<JourneyStep>(1);
  const [facilitiesTick, setFacilitiesTick] = useState(0);

  const [symptoms, setSymptoms] = useState("");
  const [mapped, setMapped] = useState<MapSymptomsResult | null>(null);
  const [coords, setCoords] = useState(NAIROBI_CBD);
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [facilities, setFacilities] = useState<FacilityRecommendItem[] | null>(
    null,
  );
  const [selected, setSelected] = useState<FacilityRecommendItem | null>(null);
  const [recommendError, setRecommendError] = useState<unknown>(null);

  const [kind, setKind] = useState<BookKind | null>(null);
  const [slotStart, setSlotStart] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);

  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<unknown>(null);

  const [ticket, setTicket] = useState<PatientTicket | null>(null);
  const [lookupCode, setLookupCode] = useState("");
  const [lookupResult, setLookupResult] = useState<PatientTicket | null>(null);

  useEffect(() => {
    setLocaleState(getLocale());
    setConsent(getVoiceConsent());
    setConsentReady(true);
    return subscribeLocale(setLocaleState);
  }, []);

  useEffect(() => {
    if (!uid) {
      return;
    }
    let cancelled = false;
    getMe()
      .then((me) => {
        if (cancelled) {
          return;
        }
        setPhone((prev) => (prev.trim() ? prev : me.phone_e164 || ""));
      })
      .catch(() => {
        /* optional prefill */
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const jumpToHospitalIfActive = useCallback(() => {
    if (screen !== "journey" || step < 2 || step > 4) {
      return;
    }
    setStep(2);
    setFacilitiesTick((n) => n + 1);
  }, [screen, step]);

  useEffect(() => {
    if (screen !== "journey" || step !== 2 || facilitiesTick === 0) {
      return;
    }
    document
      .getElementById("facilities")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [screen, step, facilitiesTick]);

  useEffect(() => {
    function onHash() {
      if (window.location.hash === "#facilities") {
        jumpToHospitalIfActive();
      }
    }
    function onFacilities() {
      jumpToHospitalIfActive();
    }
    window.addEventListener("hashchange", onHash);
    window.addEventListener("careflow:facilities", onFacilities);
    onHash();
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("careflow:facilities", onFacilities);
    };
  }, [jumpToHospitalIfActive]);

  const resetJourney = useCallback(() => {
    setScreen("entry");
    setStep(1);
    setSymptoms("");
    setMapped(null);
    setCoords(NAIROBI_CBD);
    setFacilities(null);
    setSelected(null);
    setRecommendError(null);
    setKind(null);
    setSlotStart(null);
    setSlots([]);
    setGivenName("");
    setFamilyName("");
    setPhone("");
    setConfirmError(null);
    setTicket(null);
    setLookupCode("");
    setLookupResult(null);
  }, []);

  const onUseLocation = useCallback(async () => {
    setLocating(true);
    try {
      const next = await readGeolocation();
      setCoords(next);
      if (!mapped) {
        return;
      }
      setSearching(true);
      setRecommendError(null);
      try {
        const params = recommendParams(mapped);
        const result = await recommendFacilities({
          lat: next.lat,
          lng: next.lng,
          keph_min: params.keph_min,
          red_flag: params.red_flag,
        });
        setFacilities(result.facilities);
        setSelected((prev) =>
          prev && result.facilities.some((row) => row.id === prev.id)
            ? result.facilities.find((row) => row.id === prev.id) ?? prev
            : null,
        );
      } catch (err: unknown) {
        setRecommendError(err);
        setFacilities(null);
        setSelected(null);
      } finally {
        setSearching(false);
      }
    } finally {
      setLocating(false);
    }
  }, [mapped]);

  async function onContinueSymptoms() {
    const text = symptoms.trim();
    if (!text) {
      return;
    }
    setSearching(true);
    setRecommendError(null);
    try {
      const mappedResult = await mapSymptoms({ text, lang: locale });
      const params = recommendParams(mappedResult);
      const result = await recommendFacilities({
        lat: coords.lat,
        lng: coords.lng,
        keph_min: params.keph_min,
        red_flag: params.red_flag,
      });
      setMapped(mappedResult);
      setFacilities(result.facilities);
      setSelected(null);
      setStep(2);
    } catch (err: unknown) {
      setRecommendError(err);
    } finally {
      setSearching(false);
    }
  }

  function onSelectFacility(item: FacilityRecommendItem) {
    setSelected(item);
  }

  function onKind(next: BookKind) {
    setKind(next);
    if (next === "instant") {
      setSlotStart(null);
      return;
    }
    setSlots(listBookingSlots());
  }

  function goBookKind() {
    setSlots(listBookingSlots());
    setStep(3);
  }

  async function onConfirm() {
    if (!selected || !kind) {
      return;
    }
    if (!givenName.trim() || !phoneHasLast4(phone)) {
      return;
    }
    if (kind === "appointment" && !slotStart) {
      return;
    }
    setConfirming(true);
    setConfirmError(null);
    try {
      const created = createCareSeekerBooking({
        facility: selected,
        kind,
        slot_start: kind === "appointment" ? slotStart : null,
        given_name: givenName.trim(),
        family_name: familyName.trim() || null,
        phone_last4: phone,
        symptom_slugs: mapped?.symptoms.map((row) => row.symptom_id) ?? [],
        patient_free_text: symptoms.trim(),
        red_flag_applied: Boolean(mapped && !mapped.degraded && mapped.red_flag),
      });
      setTicket(created);
      setStep(5);
    } catch (err: unknown) {
      setConfirmError(err);
    } finally {
      setConfirming(false);
    }
  }

  function onLookupThisTicket() {
    if (!ticket) {
      return;
    }
    const found = lookupTicket(ticket.code);
    setLookupCode(ticket.code);
    setLookupResult(found);
    setScreen("lookup");
  }

  const showRedFlag = Boolean(mapped && !mapped.degraded && mapped.red_flag);
  const canContinueHospital = selected !== null;
  const canContinueBook =
    kind === "instant" || (kind === "appointment" && Boolean(slotStart));
  const canConfirm =
    Boolean(selected && kind && givenName.trim() && phoneHasLast4(phone)) &&
    (kind !== "appointment" || Boolean(slotStart));

  if (!consentReady) {
    return (
      <AppShell width="phone" showPatientTabs showTopBar>
        <p className={ui.subtitle}>{t("loading", locale)}</p>
      </AppShell>
    );
  }

  if (consent === null) {
    return (
      <AppShell width="phone" showPatientTabs showTopBar>
        <header>
          <h1 className={ui.pageTitle}>{t("careSeekerTitle", locale)}</h1>
          <p className={`mt-2 ${ui.subtitle}`}>
            {t("pretriageExplanation", locale)}
          </p>
        </header>
        <div className="mt-6">
          <VoiceConsentCard locale={locale} onConsent={setConsent} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell width="phone" showPatientTabs showTopBar>
      <header>
        <h1 className={ui.pageTitle}>{t("careSeekerTitle", locale)}</h1>
        <p className={`mt-2 ${ui.subtitle}`}>
          {t("pretriageExplanation", locale)}
        </p>
        <p className="mt-2 text-base font-semibold text-cf-ink">
          {t("notADiagnosis", locale)}
        </p>
      </header>

      <section
        id="emergency"
        className={`mt-4 scroll-mt-4 ${ui.emergencyBanner}`}
        aria-labelledby="emergency-heading"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <EmergencyIcon className="h-4 w-4 shrink-0 text-cf-emergency" />
          <h2
            id="emergency-heading"
            className="min-w-0 text-sm font-medium leading-snug text-cf-emergency"
          >
            {t("emergencyCta", locale)}
          </h2>
        </div>
        <a href="tel:999" className={ui.emergencyBtnCompact}>
          {t("call999", locale)}
        </a>
      </section>

      {screen === "journey" ? (
        <p className="mt-5 text-sm font-medium text-cf-muted">
          {stepOfLabel(step, JOURNEY_STEPS, locale)}
          {step <= 4 ? (
            <span className="mt-1 block text-base font-semibold text-cf-ink">
              {t(STEP_TITLE[step as 1 | 2 | 3 | 4], locale)}
            </span>
          ) : null}
        </p>
      ) : null}

      {screen === "journey" && showRedFlag && step >= 2 && step <= 4 ? (
        <p
          className={`mt-4 ${ui.emergencyCard} text-sm font-medium text-cf-emergency`}
          role="alert"
        >
          {t("redFlagBanner", locale)}
        </p>
      ) : null}

      {screen === "entry" ? (
        <JourneyEntry
          locale={locale}
          onGetTicket={() => {
            setScreen("journey");
            setStep(1);
          }}
          onLookup={() => {
            setLookupCode("");
            setLookupResult(null);
            setScreen("lookup");
          }}
        />
      ) : null}

      {screen === "lookup" ? (
        <TicketLookup
          key={`${lookupCode}:${lookupResult?.code ?? ""}`}
          locale={locale}
          initialCode={lookupCode}
          initialTicket={lookupResult}
          onBack={() => {
            setScreen("entry");
            setLookupCode("");
            setLookupResult(null);
          }}
        />
      ) : null}

      {screen === "journey" && step === 1 ? (
        <div className="mt-6">
          <div id="symptoms">
            <SymptomForm
              locale={locale}
              value={symptoms}
              onChange={setSymptoms}
              showSearch={false}
            />
          </div>
          {recommendError ? (
            <p className="mt-3 text-sm font-medium text-cf-emergency" role="alert">
              {apiErrorMessage(recommendError, locale)}
            </p>
          ) : null}
          <StepNav
            locale={locale}
            onBack={resetJourney}
            onContinue={() => void onContinueSymptoms()}
            continueDisabled={!symptoms.trim() || searching}
            continueLabel={
              searching ? t("loading", locale) : t("continueCta", locale)
            }
          />
        </div>
      ) : null}

      {screen === "journey" && step === 2 ? (
        <div className="mt-6">
          <section
            id="location"
            className="scroll-mt-4"
            aria-labelledby="location-heading"
          >
            <h2
              id="location-heading"
              className="text-lg font-semibold text-cf-ink"
            >
              {t("locationHeading", locale)}
            </h2>
            <p className={`mt-2 ${ui.subtitle}`}>
              {t("locationFallbackHint", locale)}
            </p>
            <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap">
              <button
                type="button"
                className={ui.primaryBtn}
                onClick={() => void onUseLocation()}
                disabled={locating || searching}
              >
                {locating ? t("loading", locale) : t("useMyLocation", locale)}
              </button>
            </div>
          </section>

          <div id="facilities" className="mt-8 scroll-mt-4">
            <RecommendList
              locale={locale}
              facilities={facilities}
              loading={searching}
              error={
                recommendError ? apiErrorMessage(recommendError, locale) : null
              }
              selectedId={selected?.id}
              onSelect={onSelectFacility}
            />
          </div>
          <StepNav
            locale={locale}
            onBack={() => setStep(1)}
            onContinue={goBookKind}
            continueDisabled={!canContinueHospital}
            continueLabel={t("continueCta", locale)}
          />
        </div>
      ) : null}

      {screen === "journey" && step === 3 ? (
        <div>
          <BookKindStep
            locale={locale}
            kind={kind}
            slotStart={slotStart}
            slots={slots}
            onKind={onKind}
            onSlot={setSlotStart}
          />
          <StepNav
            locale={locale}
            onBack={() => setStep(2)}
            onContinue={() => setStep(4)}
            continueDisabled={!canContinueBook}
            continueLabel={t("continueCta", locale)}
          />
        </div>
      ) : null}

      {screen === "journey" && step === 4 && selected && kind ? (
        <div>
          <BookingSummary
            locale={locale}
            facility={selected}
            kind={kind}
            slotStart={slotStart}
            symptoms={symptoms}
            givenName={givenName}
            familyName={familyName}
            phone={phone}
            onGivenName={setGivenName}
            onFamilyName={setFamilyName}
            onPhone={setPhone}
          />
          {confirmError ? (
            <p className="mt-3 text-sm font-medium text-cf-emergency" role="alert">
              {apiErrorMessage(confirmError, locale)}
            </p>
          ) : null}
          <StepNav
            locale={locale}
            onBack={() => setStep(3)}
            onContinue={() => void onConfirm()}
            continueDisabled={!canConfirm || confirming}
            continueLabel={
              confirming ? t("loading", locale) : t("confirmBookCta", locale)
            }
          />
        </div>
      ) : null}

      {screen === "journey" && step === 5 && ticket ? (
        <TicketReady
          locale={locale}
          ticket={ticket}
          onStartOver={resetJourney}
          onLookup={onLookupThisTicket}
        />
      ) : null}
    </AppShell>
  );
}

function StepNav({
  locale,
  onBack,
  onContinue,
  continueDisabled,
  continueLabel,
}: {
  locale: Locale;
  onBack: () => void;
  onContinue: () => void;
  continueDisabled: boolean;
  continueLabel: string;
}) {
  return (
    <div className="sticky bottom-20 z-30 mt-6 -mx-4 border-t border-cf-line bg-cf-card/95 px-4 py-3 backdrop-blur-md lg:bottom-8 lg:mx-0 lg:rounded-2xl lg:border">
      <div className="flex flex-col gap-3 lg:flex-row-reverse lg:justify-start">
        <button
          type="button"
          className={ui.primaryBtn}
          onClick={onContinue}
          disabled={continueDisabled}
        >
          {continueLabel}
        </button>
        <button type="button" className={ui.secondaryBtn} onClick={onBack}>
          {t("backCta", locale)}
        </button>
      </div>
    </div>
  );
}
