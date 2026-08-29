"use client";

import { type FormEvent, useEffect, useState } from "react";

import { ApiError, isApiError } from "@/lib/api/client";
import { getMe, type MeResponse } from "@/lib/api/patient";
import {
  signInWithEmailPassword,
  signInWithGoogle,
  signOut,
  subscribeAuth,
} from "@/lib/auth";
import { t, type Locale } from "@/lib/i18n";
import { ui } from "@/lib/ui";

/** Labeled local-demo login (same as ONBOARDING); not a production secret. */
const DEMO_EMAIL = "patient@careflow.local";
const DEMO_PASSWORD = "CareflowDemo1!";

type SignInFormProps = {
  locale: Locale;
};

function signInErrorMessage(err: unknown, locale: Locale): string {
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

export function SignInForm({ locale }: SignInFormProps) {
  const [uid, setUid] = useState<string | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingMe, setLoadingMe] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    return subscribeAuth((nextUid) => {
      setUid(nextUid);
    });
  }, []);

  useEffect(() => {
    if (!uid) {
      setMe(null);
      setLoadingMe(false);
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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signInWithEmailPassword(email.trim(), password);
    } catch (err: unknown) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  function onUseDemo() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError(null);
  }

  async function onGoogle() {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function onSignOut() {
    setBusy(true);
    setError(null);
    try {
      await signOut();
      setMe(null);
    } catch (err: unknown) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  const signedIn = uid !== null;

  return (
    <section className={ui.card} aria-labelledby="sign-in-heading">
      <h2 id="sign-in-heading" className="text-lg font-semibold text-cf-ink">
        {t("signInHeading", locale)}
      </h2>

      {error ? (
        <p className="mt-3 text-sm font-medium text-cf-emergency" role="alert">
          {signInErrorMessage(error, locale)}
        </p>
      ) : null}

      {signedIn ? (
        <div className="mt-4 flex flex-col gap-3">
          {loadingMe ? (
            <p className="text-sm text-cf-muted">{t("loading", locale)}</p>
          ) : me ? (
            <div className="text-sm text-cf-ink">
              <p>
                {t("signedInAs", locale)}{" "}
                <span className="font-medium">{me.firebase_uid}</span>
              </p>
              <p className="mt-1">
                {me.role === "patient"
                  ? t("signedInRolePatient", locale)
                  : me.role}
              </p>
            </div>
          ) : null}

          <button
            type="button"
            className={ui.secondaryBtn}
            onClick={() => void onSignOut()}
            disabled={busy}
          >
            {t("signOut", locale)}
          </button>
        </div>
      ) : (
        <form className="mt-4 flex flex-col gap-4" onSubmit={onSubmit}>
          <p className="text-sm text-cf-muted">
            {t("guestRecommendHint", locale)}
          </p>

          <div>
            <label
              htmlFor="patient-email"
              className="mb-1 block text-sm font-medium text-cf-ink"
            >
              {t("signInEmail", locale)}
            </label>
            <input
              id="patient-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={ui.input}
            />
          </div>

          <div>
            <label
              htmlFor="patient-password"
              className="mb-1 block text-sm font-medium text-cf-ink"
            >
              {t("signInPassword", locale)}
            </label>
            <input
              id="patient-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={ui.input}
            />
          </div>

          <p className="text-sm text-cf-muted">{t("signInDemoHint", locale)}</p>

          <button
            type="button"
            className={ui.secondaryBtnCompact}
            onClick={onUseDemo}
            disabled={busy}
          >
            {t("signInUseDemo", locale)}
          </button>

          <button type="submit" className={ui.primaryBtn} disabled={busy}>
            {busy ? t("loading", locale) : t("signInSubmit", locale)}
          </button>

          <button
            type="button"
            className={ui.secondaryBtn}
            onClick={() => void onGoogle()}
            disabled={busy}
          >
            {t("signInGoogle", locale)}
          </button>
        </form>
      )}
    </section>
  );
}
