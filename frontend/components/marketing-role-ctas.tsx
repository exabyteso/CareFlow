import Link from "next/link";

import { t, type Locale } from "@/lib/i18n";
import { ui } from "@/lib/ui";

type RoleCtasProps = {
  locale: Locale;
  size: "nav" | "hero" | "footer";
};

const FOOTER_LINKS = [
  {
    href: "/patient",
    label: "roleCareSeeker",
    hint: "roleCareSeekerHint",
  },
  {
    href: "/hospital",
    label: "roleHospital",
    hint: "roleHospitalHint",
  },
] as const;

export function RoleCtas({ locale, size }: RoleCtasProps) {
  if (size === "footer") {
    return (
      <ul className="flex flex-col gap-4">
        {FOOTER_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-base font-semibold text-cf-ink underline-offset-4 hover:text-cf-primary hover:underline"
            >
              {t(link.label, locale)}
            </Link>
            <p className="mt-1 text-sm text-cf-muted">{t(link.hint, locale)}</p>
          </li>
        ))}
      </ul>
    );
  }

  const stacked = size === "hero";
  const seekerClass = stacked
    ? ui.primaryBtn
    : `${ui.primaryBtnCompact} w-full sm:w-auto`;
  const hospitalClass = stacked
    ? ui.secondaryBtn
    : `${ui.secondaryBtnCompact} w-full sm:w-auto`;

  return (
    <div
      className={
        stacked
          ? "flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap"
          : "flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center"
      }
    >
      <Link href="/patient" className={seekerClass}>
        {t("roleCareSeeker", locale)}
      </Link>
      <Link href="/hospital" className={hospitalClass}>
        {t("roleHospital", locale)}
      </Link>
    </div>
  );
}
