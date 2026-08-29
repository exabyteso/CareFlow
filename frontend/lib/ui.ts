/**
 * Tailwind class recipes. Tokens match DESIGN.md (primary blue, ink, card;
 * pink/sky accents for viz only).
 */
export const card =
  "rounded-2xl border border-cf-line bg-cf-card p-5 shadow-[0_8px_30px_rgb(22,33,44,0.06)]";

const btnCore =
  "inline-flex w-full min-h-12 items-center justify-center rounded-xl px-4 text-base font-semibold";
const btnLgInline = "lg:w-auto lg:min-w-44 lg:px-6";

export const primaryBtn =
  `${btnCore} bg-cf-primary text-white hover:bg-cf-primary-hover ${btnLgInline}`;

export const secondaryBtn =
  `${btnCore} border border-cf-primary bg-transparent text-cf-primary hover:bg-cf-primary/10 ${btnLgInline}`;

/** Full-width at every breakpoint — use in stacked (column) action rows. */
export const primaryBtnStack =
  `${btnCore} bg-cf-primary text-white hover:bg-cf-primary-hover`;

export const secondaryBtnStack =
  `${btnCore} border border-cf-primary bg-transparent text-cf-primary hover:bg-cf-primary/10`;

export const emergencyBtn =
  "inline-flex w-full min-h-12 items-center justify-center rounded-xl bg-cf-emergency px-4 text-base font-semibold text-white hover:brightness-110 lg:w-auto lg:min-w-44 lg:px-6";

/** Compact 999 control for the thin emergency CTA strip. */
export const emergencyBtnCompact =
  "inline-flex min-h-8 shrink-0 items-center justify-center rounded-md bg-cf-emergency px-2.5 text-sm font-semibold text-white hover:brightness-110";

/** Search-bar treatment from DESIGN.md: large radius, min-h-12, hairline border. */
export const input =
  "w-full min-h-12 rounded-xl border border-cf-line bg-cf-card px-4 text-base text-cf-ink placeholder:text-cf-muted";

export const textarea =
  "w-full min-h-32 rounded-xl border border-cf-line bg-cf-card px-4 py-3 text-base text-cf-ink placeholder:text-cf-muted";

export const pageTitle = "text-2xl font-semibold tracking-tight text-cf-ink";

export const subtitle = "text-base text-cf-muted";

export const emergencyCard =
  "rounded-2xl border border-cf-emergency bg-cf-emergency-bg p-4 shadow-md";

/** Single-row emergency CTA — sits under the diagnosis disclaimer. */
export const emergencyBanner =
  "flex items-center justify-between gap-3 rounded-md border border-cf-emergency bg-cf-emergency-bg px-2.5 py-1.5";

/** Full-bleed marketing emergency strip — edge to edge of the viewport. */
export const emergencyBannerBleed =
  "border-y border-cf-emergency bg-cf-emergency-bg";

export const textLink =
  "inline-flex min-h-11 items-center text-sm font-medium text-cf-primary underline-offset-4 hover:underline";

/** Compact (min-h-11, not full-width) — locale toggle and similar chips. */
export const primaryBtnCompact =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-cf-primary px-3 text-sm font-semibold text-white hover:bg-cf-primary-hover";

export const secondaryBtnCompact =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-cf-primary bg-transparent px-3 text-sm font-semibold text-cf-primary hover:bg-cf-primary/10";

export const ui = {
  card,
  primaryBtn,
  secondaryBtn,
  primaryBtnStack,
  secondaryBtnStack,
  emergencyBtn,
  emergencyBtnCompact,
  input,
  textarea,
  pageTitle,
  subtitle,
  emergencyCard,
  emergencyBanner,
  emergencyBannerBleed,
  textLink,
  primaryBtnCompact,
  secondaryBtnCompact,
} as const;
