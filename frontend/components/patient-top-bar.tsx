"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { SignedInChip } from "@/app/patient/sign-in-form";
import { BrandMark } from "@/components/brand-mark";
import { getLocale, subscribeLocale, t, type Locale } from "@/lib/i18n";
import { useAuth } from "@/lib/use-auth";

export function PatientTopBar() {
  const { uid, ready } = useAuth();
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    setLocaleState(getLocale());
    return subscribeLocale(setLocaleState);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-cf-line bg-cf-card/95 pt-[env(safe-area-inset-top)] shadow-[0_8px_30px_rgb(22,33,44,0.04)] backdrop-blur-md">
      <div className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-10">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 no-underline"
          aria-label={t("appName", locale)}
        >
          <BrandMark size={32} className="rounded-lg" />
          <span className="truncate text-base font-semibold tracking-tight text-cf-ink">
            {t("appName", locale)}
          </span>
        </Link>
        <div className="ml-auto flex shrink-0 items-center justify-end">
          {ready && uid ? <SignedInChip locale={locale} compact /> : null}
        </div>
      </div>
    </header>
  );
}
