"use client";

import type { FacilityRecommendItem } from "@/lib/api/patient";
import { t, type Locale } from "@/lib/i18n";
import { ui } from "@/lib/ui";

type RecommendListProps = {
  locale: Locale;
  facilities: FacilityRecommendItem[] | null;
  loading: boolean;
  error: string | null;
};

function formatDistance(metres: number): string {
  if (metres >= 1000) {
    return `${(metres / 1000).toFixed(1)} km`;
  }
  return `${Math.round(metres)} m`;
}

function mapUrl(lat: number, lng: number): string {
  return `https://maps.google.com/?q=${lat},${lng}`;
}

function PinIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 text-cf-teal"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.25" />
    </svg>
  );
}

export function RecommendList({
  locale,
  facilities,
  loading,
  error,
}: RecommendListProps) {
  if (!loading && !error && facilities === null) {
    return null;
  }

  return (
    <section aria-labelledby="recommend-heading" aria-busy={loading}>
      <h2
        id="recommend-heading"
        className="text-lg font-semibold text-cf-ink"
      >
        {t("recommendHeading", locale)}
      </h2>

      {error ? (
        <p className="mt-3 text-sm font-medium text-cf-emergency" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-3 text-sm text-cf-muted">{t("loading", locale)}</p>
      ) : null}

      {!loading && facilities && facilities.length === 0 && !error ? (
        <p className="mt-3 text-sm text-cf-muted">
          {t("recommendEmpty", locale)}
        </p>
      ) : null}

      {!loading && facilities && facilities.length > 0 ? (
        <>
          <p
            id="book-disabled-hint"
            className="mt-2 text-sm text-cf-muted"
          >
            {t("bookDisabledHint", locale)}
          </p>
          <ul className="mt-4 flex flex-col gap-4">
            {facilities.map((item) => (
              <li key={item.id}>
                <article className={ui.card}>
                  <div className="flex items-start gap-3">
                    <PinIcon />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-cf-ink">
                        {item.name}
                      </h3>
                      {item.county ? (
                        <p className="mt-0.5 text-sm text-cf-muted">
                          {item.county}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-1 gap-2 text-sm text-cf-ink">
                    <div>
                      <dt className="text-cf-muted">{t("kephLevel", locale)}</dt>
                      <dd className="font-medium">{item.keph_level}</dd>
                    </div>
                    <div>
                      <dt className="text-cf-muted">{t("demoWait", locale)}</dt>
                      <dd className="font-medium">{item.wait_count}</dd>
                    </div>
                    <div>
                      <dt className="text-cf-muted">{t("distance", locale)}</dt>
                      <dd className="font-medium">
                        {formatDistance(item.distance_m)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex flex-col gap-3">
                    <a
                      href={mapUrl(item.lat, item.lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={ui.secondaryBtn}
                    >
                      {t("openMap", locale)}
                    </a>
                    <button
                      type="button"
                      disabled
                      className={`${ui.primaryBtn} cursor-not-allowed opacity-50`}
                      aria-describedby="book-disabled-hint"
                    >
                      {t("bookComingSoon", locale)}
                    </button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
