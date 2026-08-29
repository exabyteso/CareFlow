"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { LocaleToggle } from "@/components/locale-toggle";
import { getLocale, subscribeLocale, t, type Locale } from "@/lib/i18n";

import { CareIcon, FacilitiesIcon, HomeIcon } from "./icons";

export type PatientTabBarLabels = {
  home: string;
  care: string;
  facilities: string;
};

type PatientTabBarProps = {
  labels?: Partial<PatientTabBarLabels>;
};

export function PatientTabBar({ labels }: PatientTabBarProps) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    setLocaleState(getLocale());
    return subscribeLocale(setLocaleState);
  }, []);

  const text: PatientTabBarLabels = {
    home: t("tabHome", locale),
    care: t("tabCare", locale),
    facilities: t("tabFacilities", locale),
    ...labels,
  };

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    window.addEventListener("popstate", syncHash);
    return () => {
      window.removeEventListener("hashchange", syncHash);
      window.removeEventListener("popstate", syncHash);
    };
  }, [pathname]);

  const homeActive = pathname === "/";
  const onPatient = pathname === "/patient";
  const facilitiesActive = onPatient && hash === "#facilities";
  const careActive = onPatient && hash !== "#facilities";

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] md:bottom-5 md:px-4"
      aria-label="Care-seeker"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 items-stretch border-t border-cf-line bg-cf-card/95 shadow-[0_-8px_30px_rgb(22,33,44,0.06)] backdrop-blur-md lg:max-w-7xl md:rounded-2xl md:border md:shadow-[0_12px_40px_rgb(22,33,44,0.12)]">
        <TabLink
          href="/"
          label={text.home}
          icon={HomeIcon}
          active={homeActive}
        />
        <TabLink
          href="/patient"
          label={text.care}
          icon={CareIcon}
          active={careActive}
          onClick={() => {
            setHash("");
            if (pathname === "/patient" && window.location.hash) {
              history.replaceState(null, "", "/patient");
            }
            window.dispatchEvent(new Event("careflow:care"));
          }}
        />
        <TabLink
          href="/patient#facilities"
          label={text.facilities}
          icon={FacilitiesIcon}
          active={facilitiesActive}
          onClick={() => {
            setHash("#facilities");
            window.dispatchEvent(new Event("careflow:facilities"));
          }}
        />
        <LocaleToggle />
      </div>
    </nav>
  );
}

function TabLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: typeof HomeIcon;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-12 min-w-0 w-full flex-col items-center justify-center gap-0.5 px-1 text-center text-xs font-medium leading-tight ${
        active ? "text-cf-primary" : "text-cf-muted"
      }`}
    >
      <span className="flex h-5 w-5 items-center justify-center">
        <Icon className="h-5 w-5" />
      </span>
      <span className="w-full truncate">{label}</span>
    </Link>
  );
}
