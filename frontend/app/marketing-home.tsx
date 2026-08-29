"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { BrandMark } from "@/components/brand-mark";
import { EmergencyIcon } from "@/components/icons";
import { LocaleToggle } from "@/components/locale-toggle";
import { RoleCtas } from "@/components/marketing-role-ctas";
import { getLocale, subscribeLocale, t, type Locale } from "@/lib/i18n";
import { ui } from "@/lib/ui";
import { useAuth } from "@/lib/use-auth";

import { SignedInChip } from "./patient/sign-in-form";

const HOW_STEPS = [
  { title: "howStep1Title", body: "howStep1Body" },
  { title: "howStep2Title", body: "howStep2Body" },
  { title: "howStep3Title", body: "howStep3Body" },
  { title: "howStep4Title", body: "howStep4Body" },
] as const;

export function MarketingHome() {
  const { uid, ready: authReady } = useAuth();
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    setLocaleState(getLocale());
    return subscribeLocale(setLocaleState);
  }, []);

  const signedIn = authReady && uid;

  return (
    <div className="min-h-dvh w-full text-cf-ink">
      <header className="sticky top-0 z-50 border-b border-cf-line bg-cf-card/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/"
              className="flex min-h-11 items-center gap-2"
              aria-label={t("appName", locale)}
            >
              <BrandMark size={40} />
              <span className="text-lg font-semibold tracking-tight">
                {t("appName", locale)}
              </span>
            </Link>
            <div className="flex items-center gap-2 lg:hidden">
              <LocaleToggle menuPlacement="down" variant="chrome" />
              {signedIn ? <SignedInChip locale={locale} compact /> : null}
            </div>
          </div>
          <nav
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end"
            aria-label={t("marketingNavAria", locale)}
          >
            <div className="hidden items-center gap-3 lg:flex">
              <LocaleToggle menuPlacement="down" variant="chrome" />
              {signedIn ? <SignedInChip locale={locale} compact /> : null}
            </div>
            <RoleCtas locale={locale} size="nav" />
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-10 lg:py-16">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-cf-ink lg:text-5xl lg:leading-tight">
              {t("marketingHeroTitle", locale)}
            </h1>
            <p className={`mt-4 max-w-xl ${ui.subtitle}`}>
              {t("marketingHeroSubtitle", locale)}
            </p>
            <div className="mt-6">
              <RoleCtas locale={locale} size="hero" />
            </div>
            <p id="pretriage-disclaimer" className={`mt-5 max-w-xl ${ui.subtitle}`}>
              {t("pretriageDisclaimer", locale)}
            </p>
          </div>
          <div className="overflow-hidden rounded-3xl bg-[#111] shadow-[0_18px_50px_rgb(22,33,44,0.18)]">
            <Image
              src="/illustrations/hero.png"
              alt={t("marketingHeroImageAlt", locale)}
              width={1400}
              height={979}
              priority
              className="h-auto w-full"
              unoptimized
            />
          </div>
        </section>

        <section
          className="border-y border-cf-line bg-cf-card"
          aria-labelledby="how-it-works-heading"
        >
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-10">
            <h2
              id="how-it-works-heading"
              className="text-2xl font-semibold tracking-tight"
            >
              {t("howItWorksHeading", locale)}
            </h2>
            <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {HOW_STEPS.map((step, index) => (
                <li key={step.title} className={ui.card}>
                  <p className="text-sm font-semibold text-cf-primary">
                    {index + 1}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">
                    {t(step.title, locale)}
                  </h3>
                  <p className={`mt-2 ${ui.subtitle}`}>{t(step.body, locale)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-10 lg:py-16"
          aria-labelledby="get-started-heading"
        >
          <h2
            id="get-started-heading"
            className="text-2xl font-semibold tracking-tight"
          >
            {t("marketingGetStartedHeading", locale)}
          </h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <article className={`${ui.card} flex flex-col overflow-hidden p-0`}>
              <Image
                src="/illustrations/care-seeker.png"
                alt={t("marketingSeekerImageAlt", locale)}
                width={1600}
                height={800}
                className="h-56 w-full object-cover object-center sm:h-64"
                unoptimized
              />
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-xl font-semibold">
                  {t("marketingSeekerTitle", locale)}
                </h3>
                <p className={`mt-2 flex-1 ${ui.subtitle}`}>
                  {t("marketingSeekerBody", locale)}
                </p>
                <Link href="/patient" className={`${ui.primaryBtn} mt-5`}>
                  {t("roleCareSeeker", locale)}
                </Link>
              </div>
            </article>

            <article className={`${ui.card} flex flex-col overflow-hidden p-0`}>
              <Image
                src="/illustrations/hospital.png"
                alt={t("marketingHospitalImageAlt", locale)}
                width={1400}
                height={1102}
                className="h-56 w-full object-cover object-center sm:h-64"
                unoptimized
              />
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-xl font-semibold">
                  {t("marketingHospitalTitle", locale)}
                </h3>
                <p className={`mt-2 flex-1 ${ui.subtitle}`}>
                  {t("marketingHospitalBody", locale)}
                </p>
                <Link href="/hospital" className={`${ui.secondaryBtn} mt-5`}>
                  {t("roleHospital", locale)}
                </Link>
              </div>
            </article>
          </div>
        </section>

        <section
          className={ui.emergencyBannerBleed}
          aria-labelledby="marketing-emergency-heading"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-6 sm:py-6 lg:px-10">
            <div className="flex min-w-0 items-start gap-3 sm:items-center">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white">
                <EmergencyIcon className="h-6 w-6 text-cf-emergency" />
              </div>
              <div className="min-w-0">
                <h2
                  id="marketing-emergency-heading"
                  className="text-lg font-semibold tracking-tight text-cf-emergency"
                >
                  {t("emergencyHeading", locale)}
                </h2>
                <p className="mt-1 text-sm leading-snug text-cf-ink sm:text-base">
                  {t("emergencyBody", locale)}
                </p>
              </div>
            </div>
            <a href="tel:999" className={`${ui.emergencyBtn} sm:w-auto sm:shrink-0`}>
              {t("call999", locale)}
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-cf-line bg-cf-card">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
            <div>
              <Link href="/" className="flex items-center gap-2">
                <BrandMark size={32} />
                <span className="text-base font-semibold">
                  {t("appName", locale)}
                </span>
              </Link>
              <p className="mt-2 text-sm font-medium text-cf-primary">
                {t("kenyaLabel", locale)}
              </p>
            </div>
            <nav aria-label={t("footerNavAria", locale)}>
              <p className="text-sm font-semibold text-cf-ink">
                {t("marketingGetStartedHeading", locale)}
              </p>
              <div className="mt-4">
                <RoleCtas locale={locale} size="footer" />
              </div>
            </nav>
            <div>
              <p className="text-sm font-semibold text-cf-ink">
                {t("footerLanguageHeading", locale)}
              </p>
              <div className="mt-4">
                <LocaleToggle menuPlacement="up" variant="chrome" />
              </div>
            </div>
          </div>
          <p className="mt-10 border-t border-cf-line pt-6 text-sm text-cf-muted">
            {t("pretriageDisclaimer", locale)}
          </p>
        </div>
      </footer>
    </div>
  );
}
