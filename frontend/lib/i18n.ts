/**
 * en/sw catalog for landing (J8) and care-seeker (J1/J7). Wave 2 must not edit this file.
 *
 * Keys are flat strings (e.g. t("greetingTitle")). Persist last locale in
 * localStorage (`careflow-locale`). Default is last persisted, else "en".
 *
 * Copy always: pretriage routing, not a diagnosis / si utambuzi.
 */
export type Locale = "en" | "sw";

export const LOCALE_STORAGE_KEY = "careflow-locale";

export const MESSAGE_KEYS = [
  "greetingTitle",
  "greetingSubtitle",
  "voiceConsentAsk",
  "voiceConsentYes",
  "voiceConsentNo",
  "voiceConsentYesSwHint",
  "rolePickerHeading",
  "roleCareSeeker",
  "roleCareSeekerHint",
  "roleHospital",
  "roleHospitalHint",
  "pretriageDisclaimer",
  "kenyaLabel",
  "appName",
  "localeEn",
  "localeSw",
  "localeAria",
  "careSeekerTitle",
  "notADiagnosis",
  "pretriageExplanation",
  "emergencyHeading",
  "emergencyBody",
  "call999",
  "goNow",
  "backToRolePicker",
  "signInHeading",
  "signInEmail",
  "signInPassword",
  "signInSubmit",
  "signInGoogle",
  "signInDemoHint",
  "signInUseDemo",
  "signOut",
  "signedInAs",
  "guestRecommendHint",
  "symptomsHeading",
  "symptomsLabel",
  "symptomsPlaceholder",
  "symptomsSpeak",
  "locationHeading",
  "useMyLocation",
  "locationFallbackHint",
  "findFacilities",
  "recommendHeading",
  "recommendEmpty",
  "demoWait",
  "kephLevel",
  "distance",
  "openMap",
  "bookComingSoon",
  "bookDisabledHint",
  "errorUnauthorized",
  "errorUserNotProvisioned",
  "errorLocationOutOfRange",
  "errorGeneric",
  "errorNetwork",
  "loading",
  "signedInRolePatient",
] as const;

export type MessageKey = (typeof MESSAGE_KEYS)[number];

const catalog: Record<Locale, Record<MessageKey, string>> = {
  en: {
    greetingTitle: "Welcome to CareFlow",
    greetingSubtitle:
      "Kenya hospital pretriage — we help you find a suitable facility. This is not a diagnosis.",
    voiceConsentAsk:
      "Would you like a spoken walkthrough in English? The microphone starts only after you say yes.",
    voiceConsentYes: "Yes",
    voiceConsentNo: "No",
    voiceConsentYesSwHint: "Ndiyo",
    rolePickerHeading: "Who is using CareFlow?",
    roleCareSeeker: "I need care",
    roleCareSeekerHint: "Find a facility and book a visit",
    roleHospital: "I work at a hospital",
    roleHospitalHint: "Hospital desk — this facility only",
    pretriageDisclaimer:
      "CareFlow is pretriage routing to a suitable facility, not a diagnosis. In an emergency, call 999 or go now.",
    kenyaLabel: "Kenya",
    appName: "CareFlow",
    localeEn: "English",
    localeSw: "Kiswahili",
    localeAria: "Choose language",
    careSeekerTitle: "I need care",
    notADiagnosis: "This is not a diagnosis.",
    pretriageExplanation:
      "CareFlow is Kenya pretriage routing: we map what you describe to a hospital level and nearby facilities. We do not diagnose illness.",
    emergencyHeading: "Emergency",
    emergencyBody:
      "If this is an emergency, call 999 or go to the nearest hospital now. Do not wait for a booking.",
    call999: "Call 999",
    goNow: "Go now",
    backToRolePicker: "Back to role picker",
    signInHeading: "Sign in",
    signInEmail: "Email",
    signInPassword: "Password",
    signInSubmit: "Sign in",
    signInGoogle: "Continue with Google",
    signInDemoHint:
      "Demo email: patient@careflow.local — use the fill button, then Sign in.",
    signInUseDemo: "Use demo login",
    signOut: "Sign out",
    signedInAs: "Signed in as",
    guestRecommendHint:
      "You can see nearby facilities without signing in. Sign in to book later.",
    symptomsHeading: "Symptoms",
    symptomsLabel: "Describe how you feel",
    symptomsPlaceholder: "For example: fever and headache for two days",
    symptomsSpeak: "Speak",
    locationHeading: "Your location",
    useMyLocation: "Use my location",
    locationFallbackHint:
      "If GPS is off or unavailable, we use Nairobi CBD.",
    findFacilities: "Find facilities",
    recommendHeading: "Facilities near you",
    recommendEmpty: "No facilities found for this location and level.",
    demoWait: "Demo wait",
    kephLevel: "KEPH level",
    distance: "Distance",
    openMap: "Open map",
    bookComingSoon: "Booking coming soon",
    bookDisabledHint:
      "You can review facilities now. Booking will be available in a later update.",
    errorUnauthorized: "Please sign in again.",
    errorUserNotProvisioned:
      "We could not set up this CareFlow account. Sign out and try again.",
    errorLocationOutOfRange: "That location is outside Kenya coverage.",
    errorGeneric: "Something went wrong. Please try again.",
    errorNetwork: "Network error. Check your connection and try again.",
    loading: "Loading…",
    signedInRolePatient: "Signed in as care-seeker",
  },
  sw: {
    greetingTitle: "Karibu CareFlow",
    greetingSubtitle:
      "Uelekezaji wa hospitali nchini Kenya — tunakusaidia kupata kituo kinachofaa. Hii si utambuzi.",
    voiceConsentAsk:
      "Je, ungependa mwongozo wa sauti kwa Kiingereza? Maikrofoni itaanza tu baada ya kusema ndiyo.",
    voiceConsentYes: "Ndiyo",
    voiceConsentNo: "Hapana",
    voiceConsentYesSwHint: "Ndiyo",
    rolePickerHeading: "Nani anatumia CareFlow?",
    roleCareSeeker: "Nahitaji matibabu",
    roleCareSeekerHint: "Tafuta kituo na uhifadhi ziara",
    roleHospital: "Nafanya kazi hospitalini",
    roleHospitalHint: "Dawati la hospitali — kituo hiki tu",
    pretriageDisclaimer:
      "CareFlow ni uelekezaji wa kabla ya uchunguzi kuelekea kituo kinachofaa, si utambuzi. Dharura: piga 999 au nenda sasa.",
    kenyaLabel: "Kenya",
    appName: "CareFlow",
    localeEn: "English",
    localeSw: "Kiswahili",
    localeAria: "Chagua lugha",
    careSeekerTitle: "Nahitaji matibabu",
    notADiagnosis: "Hii si utambuzi.",
    pretriageExplanation:
      "CareFlow ni uelekezaji wa kabla ya uchunguzi nchini Kenya: tunalinganisha maelezo yako na kiwango cha hospitali na vituo vilivyo karibu. Hatutambui ugonjwa.",
    emergencyHeading: "Dharura",
    emergencyBody:
      "Ikiwa hii ni dharura, piga 999 au nenda hospitali ya karibu sasa. Usisubiri kuhifadhi.",
    call999: "Piga 999",
    goNow: "Nenda sasa",
    backToRolePicker: "Rudi kuchagua jukumu",
    signInHeading: "Ingia",
    signInEmail: "Barua pepe",
    signInPassword: "Nenosiri",
    signInSubmit: "Ingia",
    signInGoogle: "Endelea na Google",
    signInDemoHint:
      "Barua pepe ya onyesho: patient@careflow.local — tumia kitufe cha kujaza, kisha Ingia.",
    signInUseDemo: "Tumia akaunti ya onyesho",
    signOut: "Toka",
    signedInAs: "Umeingia kama",
    guestRecommendHint:
      "Unaweza kuona vituo vilivyo karibu bila kuingia. Ingia ili kuhifadhi baadaye.",
    symptomsHeading: "Dalili",
    symptomsLabel: "Eleza jinsi unavyohisi",
    symptomsPlaceholder: "Kwa mfano: homa na maumivu ya kichwa kwa siku mbili",
    symptomsSpeak: "Ongea",
    locationHeading: "Mahali ulipo",
    useMyLocation: "Tumia mahali nilipo",
    locationFallbackHint:
      "Ikiwa GPS imezimwa au haipatikani, tunatumia kituo cha Nairobi.",
    findFacilities: "Tafuta vituo",
    recommendHeading: "Vituo vilivyo karibu nawe",
    recommendEmpty: "Hakuna vituo vilivyopatikana kwa mahali na kiwango hiki.",
    demoWait: "Subira ya onyesho",
    kephLevel: "Kiwango cha KEPH",
    distance: "Umbali",
    openMap: "Fungua ramani",
    bookComingSoon: "Uhifadhi unakuja hivi karibuni",
    bookDisabledHint:
      "Unaweza kuangalia vituo sasa. Uhifadhi utapatikana katika sasisho la baadaye.",
    errorUnauthorized: "Tafadhali ingia tena.",
    errorUserNotProvisioned:
      "Hatukuweza kuandaa akaunti hii ya CareFlow. Toka na ujaribu tena.",
    errorLocationOutOfRange: "Mahali hapo ni nje ya eneo la Kenya.",
    errorGeneric: "Kuna hitilafu. Tafadhali jaribu tena.",
    errorNetwork: "Hitilafu ya mtandao. Angalia muunganisho wako na ujaribu tena.",
    loading: "Inapakia…",
    signedInRolePatient: "Umeingia kama mhitaji wa matibabu",
  },
};

const listeners = new Set<(locale: Locale) => void>();
let cachedLocale: Locale | null = null;

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "sw";
}

function readStoredLocale(): Locale {
  if (typeof window === "undefined") {
    return "en";
  }
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return isLocale(stored) ? stored : "en";
}

export function getLocale(): Locale {
  if (cachedLocale) {
    return cachedLocale;
  }
  cachedLocale = readStoredLocale();
  return cachedLocale;
}

export function setLocale(locale: Locale): void {
  cachedLocale = locale;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }
  listeners.forEach((cb) => {
    cb(locale);
  });
}

export function subscribeLocale(cb: (locale: Locale) => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function t(key: string, locale?: Locale): string {
  const loc = locale ?? getLocale();
  const table = catalog[loc];
  if (key in table) {
    return table[key as MessageKey];
  }
  const fallback = catalog.en;
  if (key in fallback) {
    return fallback[key as MessageKey];
  }
  return key;
}
