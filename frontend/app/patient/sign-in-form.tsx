"use client";

import Image from "next/image";
import { type FormEvent, useEffect, useState } from "react";

import { ApiError, isApiError } from "@/lib/api/client";
import { getMe, type MeResponse } from "@/lib/api/patient";
import {
  DEMO_PATIENT,
  DEMO_STAFF,
  signInWithEmailPassword,
  signInWithGoogle,
  signOut,
} from "@/lib/auth";
import { t, type Locale } from "@/lib/i18n";
import { ui } from "@/lib/ui";
import { useAuth } from "@/lib/use-auth";

export type SignInVariant = "patient" | "hospital";

type SignInFormProps = {
  locale: Locale;
  variant?: SignInVariant;
  hideHeading?: boolean;
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

function roleLabel(role: MeResponse["role"] | undefined, locale: Locale): string {
  if (role === "hospital_staff") {
    return t("signedInRoleStaff", locale);
  }
  if (role === "patient") {
    return t("signedInRolePatient", locale);
  }
  return "";
}

export function SignedInChip({
  locale,
  compact = false,
}: {
  locale: Locale;
  compact?: boolean;
}) {
  const { uid, ready } = useAuth();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!uid) {
      setMe(null);
      return;
    }
    let cancelled = false;
    getMe()
      .then((profile) => {
        if (!cancelled) {
          setMe(profile);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMe(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  if (!ready || !uid) {
    return null;
  }

  async function onSignOut() {
    setBusy(true);
    try {
      await signOut();
    } finally {
      setBusy(false);
    }
  }

  const wrap = compact
    ? "flex max-w-[min(100%,18rem)] items-center gap-2"
    : "flex flex-wrap items-center gap-2 rounded-xl border border-cf-line bg-cf-card px-3 py-2 shadow-[0_8px_30px_rgb(22,33,44,0.06)]";

  return (
    <div className={wrap} aria-label={t("accountHeading", locale)}>
      <Image
        src="/avatars/care-seeker-placeholder.png"
        alt={t("profilePhotoAlt", locale)}
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-cf-line"
      />
      <div className="min-w-0">
        <p className="truncate text-sm text-cf-ink">
          {me ? roleLabel(me.role, locale) : t("signedInAs", locale)}
        </p>
        <button
          type="button"
          className="-ml-1 min-h-9 rounded-lg px-2 text-left text-sm font-semibold text-cf-primary hover:bg-cf-primary/10"
          onClick={() => void onSignOut()}
          disabled={busy}
        >
          {t("signOut", locale)}
        </button>
      </div>
    </div>
  );
}

export function SignInForm({ locale, variant = "patient", hideHeading = false }: SignInFormProps) {
  const { uid, ready } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const demo = variant === "hospital" ? DEMO_STAFF : DEMO_PATIENT;
  const headingId = variant === "hospital" ? "hospital-sign-in-heading" : "sign-in-heading";
  const headingText =
    variant === "hospital"
      ? t("hospitalSignInHeading", locale)
      : t("signInHeading", locale);

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

  async function onUseDemo() {
    setEmail(demo.email);
    setPassword(demo.password);
    setError(null);
    setBusy(true);
    try {
      await signInWithEmailPassword(demo.email, demo.password);
    } catch (err: unknown) {
      setError(err);
    } finally {
      setBusy(false);
    }
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

  if (!ready) {
    return (
      <p className="text-sm text-cf-muted" role="status">
        {t("authChecking", locale)}
      </p>
    );
  }

  if (uid) {
    return null;
  }

  return (
    <section className={ui.card} aria-labelledby={hideHeading ? undefined : headingId} aria-label={hideHeading ? headingText : undefined}>
      {hideHeading ? null : (
        <h2 id={headingId} className="text-lg font-semibold text-cf-ink">
          {headingText}
        </h2>
      )}

      {error ? (
        <p className="mt-3 text-sm font-medium text-cf-emergency" role="alert">
          {signInErrorMessage(error, locale)}
        </p>
      ) : null}

      <form className="mt-4 flex flex-col gap-4" onSubmit={onSubmit}>
        <p className="text-sm text-cf-muted">
          {variant === "hospital"
            ? t("hospitalSignInHint", locale)
            : t("guestBookHint", locale)}
        </p>

        <div className="grid gap-4 lg:max-w-md">
          <div>
            <label
              htmlFor={`${variant}-email`}
              className="mb-1 block text-sm font-medium text-cf-ink"
            >
              {t("signInEmail", locale)}
            </label>
            <input
              id={`${variant}-email`}
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
              htmlFor={`${variant}-password`}
              className="mb-1 block text-sm font-medium text-cf-ink"
            >
              {t("signInPassword", locale)}
            </label>
            <input
              id={`${variant}-password`}
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={ui.input}
            />
          </div>
        </div>

        <p className="text-sm text-cf-muted">
          {variant === "hospital"
            ? t("hospitalSignInDemoHint", locale)
            : t("signInDemoHint", locale)}
        </p>

        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
          <button
            type="button"
            className={ui.secondaryBtnCompact}
            onClick={() => void onUseDemo()}
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
        </div>
      </form>
    </section>
  );
}
