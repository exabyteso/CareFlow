import { ApiError, isApiError } from "@/lib/api/client";
import { t, type Locale } from "@/lib/i18n";

export const NAIROBI_CBD: { lat: number; lng: number } = {
  lat: -1.2921,
  lng: 36.8219,
};

export const JOURNEY_STEPS = 5;

export function apiErrorMessage(err: unknown, locale: Locale): string {
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

export function readGeolocation(): Promise<{ lat: number; lng: number }> {
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

export function phoneHasLast4(phone: string): boolean {
  const trimmed = phone.trim();
  if (/^\d{4}$/.test(trimmed)) {
    return true;
  }
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 4;
}

function nairobiYmd(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addOneCalendarDay(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + 1));
  const yy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(utc.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function formatNairobiSlot(iso: string, locale: Locale): string {
  const date = new Date(iso);
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Nairobi",
  }).format(date);
  const slotDay = nairobiYmd(date);
  const today = nairobiYmd(new Date());
  const tomorrow = addOneCalendarDay(today);

  if (slotDay === today) {
    return locale === "sw" ? `Leo ${time}` : `Today ${time}`;
  }
  if (slotDay === tomorrow) {
    return locale === "sw" ? `Kesho ${time}` : `Tomorrow ${time}`;
  }

  const weekday = new Intl.DateTimeFormat(locale === "sw" ? "sw-KE" : "en-KE", {
    weekday: "short",
    timeZone: "Africa/Nairobi",
  }).format(date);
  return `${weekday} ${time}`;
}

export function stepOfLabel(n: number, total: number, locale: Locale): string {
  return t("stepOf", locale)
    .replace("{n}", String(n))
    .replace("{total}", String(total));
}
