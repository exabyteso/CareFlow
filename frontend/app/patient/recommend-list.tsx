"use client";

import { useId } from "react";

import { DirectionsIcon, PhoneIcon, PinIcon } from "@/components/icons";
import type { FacilityRecommendItem } from "@/lib/api/patient";
import { kephLevelCopy, t, type Locale } from "@/lib/i18n";
import { ui } from "@/lib/ui";

type RecommendListProps = {
  locale: Locale;
  facilities: FacilityRecommendItem[] | null;
  loading: boolean;
  error: string | null;
  onSelect?: (item: FacilityRecommendItem) => void;
  selectedId?: number;
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

function osmEmbedUrl(lat: number, lng: number): string {
  const d = 0.01;
  const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

function waitFillPercent(waitCount: number): number {
  if (waitCount <= 0) {
    return 0;
  }
  return Math.min(100, (waitCount / Math.max(20, waitCount)) * 100);
}

function WaitBar({
  locale,
  waitCount,
  compact,
}: {
  locale: Locale;
  waitCount: number;
  compact?: boolean;
}) {
  const pct = waitFillPercent(waitCount);
  const barH = compact ? "h-1.5" : "h-2";
  return (
    <div className="mt-3">
      <p className="text-sm text-cf-ink">
        <span className="text-cf-muted">{t("demoWait", locale)}</span>
        {": "}
        <span className="font-medium">{waitCount}</span>
      </p>
      <div
        className={`mt-1 overflow-hidden rounded-full bg-cf-surface ${barH}`}
        aria-hidden="true"
      >
        <div
          className={`rounded-full bg-cf-accent-sky ${barH}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function KephPill({ level, locale }: { level: number; locale: Locale }) {
  const tipId = useId();
  const copy = kephLevelCopy(level, locale);
  const heading = `KEPH ${level} — ${copy.name}`;

  return (
    <span className="group relative z-20 mt-2 inline-flex">
      <button
        type="button"
        className="inline-flex cursor-help rounded-full bg-cf-surface px-2.5 py-0.5 text-xs font-medium text-cf-ink underline decoration-dotted decoration-cf-muted underline-offset-2"
        aria-describedby={tipId}
        aria-label={heading}
      >
        KEPH {level}
      </button>
      <span
        id={tipId}
        role="tooltip"
        className="pointer-events-none invisible absolute left-0 top-full z-30 mt-1.5 w-72 max-w-[min(18rem,calc(100vw-2.5rem))] rounded-xl border border-cf-line bg-cf-card p-3 text-left text-xs font-normal leading-relaxed text-cf-ink shadow-[0_8px_30px_rgb(22,33,44,0.12)] group-hover:visible group-focus-within:visible"
      >
        <span className="block font-semibold text-cf-ink">{heading}</span>
        <span className="mt-1 block text-cf-muted">{copy.description}</span>
      </span>
    </span>
  );
}

function FacilityActions({
  locale,
  lat,
  lng,
  selected,
  onSelect,
}: {
  locale: Locale;
  lat: number;
  lng: number;
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <div className="mt-4 flex flex-col gap-3">
      {onSelect ? (
        <button
          type="button"
          className={selected ? ui.primaryBtnStack : ui.secondaryBtnStack}
          onClick={onSelect}
          aria-pressed={selected}
        >
          {selected ? t("selectedHospital", locale) : t("bookNow", locale)}
        </button>
      ) : null}
      <a
        href={mapUrl(lat, lng)}
        target="_blank"
        rel="noopener noreferrer"
        className={onSelect ? ui.secondaryBtnStack : ui.primaryBtnStack}
      >
        <span className="inline-flex items-center gap-2">
          <DirectionsIcon className="h-5 w-5" />
          {t("getDirection", locale)}
        </span>
      </a>
      <a href="tel:999" className={ui.secondaryBtnStack}>
        <span className="inline-flex items-center gap-2">
          <PhoneIcon className="h-5 w-5" />
          {t("callHospital", locale)}
        </span>
      </a>
    </div>
  );
}

function cardClass(selected: boolean): string {
  return selected
    ? `${ui.card} border-cf-primary ring-2 ring-cf-primary`
    : ui.card;
}

function FeaturedFacility({
  item,
  locale,
  selected,
  onSelect,
}: {
  item: FacilityRecommendItem;
  locale: Locale;
  selected: boolean;
  onSelect?: (item: FacilityRecommendItem) => void;
}) {
  return (
    <article className={cardClass(selected)}>
      <div className="flex items-start gap-3">
        <PinIcon className="h-5 w-5 shrink-0 text-cf-primary" />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-cf-ink">{item.name}</h3>
          {item.county ? (
            <p className="mt-0.5 text-sm text-cf-muted">{item.county}</p>
          ) : null}
          <KephPill level={item.keph_level} locale={locale} />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-cf-line">
        <iframe
          title={`${item.name} map`}
          src={osmEmbedUrl(item.lat, item.lng)}
          className="h-40 w-full border-0"
          sandbox="allow-scripts allow-same-origin"
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
        />
      </div>
      <p className="mt-2">
        <a
          href={mapUrl(item.lat, item.lng)}
          target="_blank"
          rel="noopener noreferrer"
          className={ui.textLink}
        >
          {t("openMap", locale)}
        </a>
      </p>

      <p className="mt-3 text-sm text-cf-muted">
        {t("distance", locale)}: {formatDistance(item.distance_m)}
      </p>

      <WaitBar locale={locale} waitCount={item.wait_count} />
      <FacilityActions
        locale={locale}
        lat={item.lat}
        lng={item.lng}
        selected={selected}
        onSelect={onSelect ? () => onSelect(item) : undefined}
      />
    </article>
  );
}

function FacilityCard({
  item,
  locale,
  selected,
  onSelect,
}: {
  item: FacilityRecommendItem;
  locale: Locale;
  selected: boolean;
  onSelect?: (item: FacilityRecommendItem) => void;
}) {
  return (
    <article className={cardClass(selected)}>
      <div className="flex items-start gap-3">
        <PinIcon className="h-5 w-5 shrink-0 text-cf-primary" />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-cf-ink">{item.name}</h3>
          {item.county ? (
            <p className="mt-0.5 text-sm text-cf-muted">{item.county}</p>
          ) : null}
          <KephPill level={item.keph_level} locale={locale} />
        </div>
      </div>

      <p className="mt-3 text-sm text-cf-ink">
        <span className="text-cf-muted">{t("distance", locale)}</span>
        {": "}
        <span className="font-medium">{formatDistance(item.distance_m)}</span>
      </p>

      <WaitBar locale={locale} waitCount={item.wait_count} compact />
      <FacilityActions
        locale={locale}
        lat={item.lat}
        lng={item.lng}
        selected={selected}
        onSelect={onSelect ? () => onSelect(item) : undefined}
      />
    </article>
  );
}

export function RecommendList({
  locale,
  facilities,
  loading,
  error,
  onSelect,
  selectedId,
}: RecommendListProps) {
  if (!loading && !error && facilities === null) {
    return null;
  }

  const featured = facilities?.[0];
  const rest = facilities?.slice(1) ?? [];

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

      {!loading && facilities && facilities.length > 0 && featured ? (
        <ul className="mt-4 grid gap-4 lg:grid-cols-2">
          <li key={featured.id} className="lg:col-span-2">
            <FeaturedFacility
              item={featured}
              locale={locale}
              selected={selectedId === featured.id}
              onSelect={onSelect}
            />
          </li>
          {rest.map((item) => (
            <li key={item.id}>
              <FacilityCard
                item={item}
                locale={locale}
                selected={selectedId === item.id}
                onSelect={onSelect}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
