/**
 * Tailwind class recipes for Wave 2 UI. Tokens map DESIGN.md → existing cf-*
 * (Primary Blue → cf-teal; emergency → cf-emergency). Do not invent radii/colors.
 * No bottom-tab or Health Score styles.
 */
export const card =
  "rounded-2xl border border-cf-line bg-cf-card p-5 shadow-md";

export const primaryBtn =
  "inline-flex w-full min-h-12 items-center justify-center rounded-xl bg-cf-teal px-4 text-base font-semibold text-white hover:bg-cf-teal-hover";

export const secondaryBtn =
  "inline-flex w-full min-h-12 items-center justify-center rounded-xl border border-cf-teal bg-transparent px-4 text-base font-semibold text-cf-teal hover:bg-cf-teal/10";

export const emergencyBtn =
  "inline-flex w-full min-h-12 items-center justify-center rounded-xl bg-cf-emergency px-4 text-base font-semibold text-white hover:brightness-110";

/** Search-bar treatment from DESIGN.md: large radius, min-h-12, hairline border. */
export const input =
  "w-full min-h-12 rounded-xl border border-cf-line bg-cf-card px-4 text-base text-cf-ink placeholder:text-cf-muted";

export const textarea =
  "w-full min-h-32 rounded-xl border border-cf-line bg-cf-card px-4 py-3 text-base text-cf-ink placeholder:text-cf-muted";

export const pageTitle = "text-2xl font-semibold tracking-tight text-cf-ink";

export const subtitle = "text-base text-cf-muted";

export const emergencyCard =
  "rounded-2xl border border-cf-emergency bg-cf-emergency-bg p-4 shadow-md";

export const textLink =
  "inline-flex min-h-11 items-center text-sm font-medium text-cf-teal underline-offset-4 hover:underline";

/** Compact (min-h-11, not full-width) — locale toggle and similar chips. */
export const primaryBtnCompact =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-cf-teal px-3 text-sm font-semibold text-white hover:bg-cf-teal-hover";

export const secondaryBtnCompact =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-cf-teal bg-transparent px-3 text-sm font-semibold text-cf-teal hover:bg-cf-teal/10";

export const ui = {
  card,
  primaryBtn,
  secondaryBtn,
  emergencyBtn,
  input,
  textarea,
  pageTitle,
  subtitle,
  emergencyCard,
  textLink,
  primaryBtnCompact,
  secondaryBtnCompact,
} as const;
