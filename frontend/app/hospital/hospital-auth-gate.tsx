"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { BrandMark } from "@/components/brand-mark";
import { ApiError, isApiError } from "@/lib/api/client";
import { getMe, type MeResponse } from "@/lib/api/patient";
import { signOut } from "@/lib/auth";
import { getLocale, subscribeLocale, t, type Locale } from "@/lib/i18n";
import { ui } from "@/lib/ui";
import { useAuth } from "@/lib/use-auth";

import { SignInForm } from "../patient/sign-in-form";

function profileErrorMessage(err: unknown, locale: Locale): string {
  if (isApiError(err) || err instanceof ApiError) {
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

function GateFrame({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <AppShell width="desk" showPatientTabs>
      <header className="flex items-start gap-3">
        <BrandMark size={48} className="mt-1" />
        <div className="min-w-0">
          <p className="text-sm font-medium tracking-wide text-cf-primary">
            {t("kenyaLabel", locale)}
          </p>
          <h1 className={`mt-1 ${ui.pageTitle}`}>
            {t("roleHospital", locale)}
          </h1>
        </div>
      </header>
      <div className="mt-8 max-w-xl">{children}</div>
    </AppShell>
  );
}

export function HospitalAuthGate({ children }: { children: ReactNode }) {
  const { uid, ready } = useAuth();
  const [locale, setLocaleState] = useState<Locale>("en");
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loadingMe, setLoadingMe] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setLocaleState(getLocale());
    return subscribeLocale(setLocaleState);
  }, []);

  useEffect(() => {
    if (!uid) {
      setMe(null);
      setLoadingMe(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoadingMe(true);
    setError(null);

    getMe()
      .then((profile) => {
        if (!cancelled) {
          setMe(profile);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setMe(null);
          setError(err);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingMe(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [uid]);

  async function onSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  if (!ready || (uid && loadingMe && !me && !error)) {
    return (
      <GateFrame locale={locale}>
        <p className="text-sm text-cf-muted" role="status">
          {t("authChecking", locale)}
        </p>
      </GateFrame>
    );
  }

  if (!uid) {
    return (
      <GateFrame locale={locale}>
        <SignInForm locale={locale} variant="hospital" hideHeading />
      </GateFrame>
    );
  }

  if (error) {
    return (
      <GateFrame locale={locale}>
        <section className={ui.card}>
          <p className="text-sm font-medium text-cf-emergency" role="alert">
            {profileErrorMessage(error, locale)}
          </p>
          <button
            type="button"
            className={`mt-4 ${ui.secondaryBtn}`}
            onClick={() => void onSignOut()}
            disabled={signingOut}
          >
            {t("signOut", locale)}
          </button>
        </section>
      </GateFrame>
    );
  }

  if (me && me.role !== "hospital_staff") {
    return (
      <GateFrame locale={locale}>
        <section className={ui.card}>
          <p className="text-sm text-cf-ink">{t("hospitalStaffRequired", locale)}</p>
          <div className="mt-4 flex flex-col gap-3 lg:flex-row">
            <button
              type="button"
              className={ui.secondaryBtn}
              onClick={() => void onSignOut()}
              disabled={signingOut}
            >
              {t("signOut", locale)}
            </button>
            <Link href="/patient" className={ui.primaryBtn}>
              {t("hospitalGoToCare", locale)}
            </Link>
          </div>
        </section>
      </GateFrame>
    );
  }

  if (!me) {
    return (
      <GateFrame locale={locale}>
        <p className="text-sm text-cf-muted" role="status">
          {t("authChecking", locale)}
        </p>
      </GateFrame>
    );
  }

  return children;
}
