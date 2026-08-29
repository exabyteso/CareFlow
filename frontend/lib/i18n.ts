/**
 * en/sw catalog for marketing `/`, J8 voice consent on `/patient`, and care-seeker (J1/J7).
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
  "marketingNavAria",
  "marketingHeroTitle",
  "marketingHeroSubtitle",
  "marketingHeroImageAlt",
  "howItWorksHeading",
  "howStep1Title",
  "howStep1Body",
  "howStep2Title",
  "howStep2Body",
  "howStep3Title",
  "howStep3Body",
  "howStep4Title",
  "howStep4Body",
  "marketingSeekerTitle",
  "marketingSeekerBody",
  "marketingSeekerImageAlt",
  "marketingHospitalTitle",
  "marketingHospitalBody",
  "marketingHospitalImageAlt",
  "marketingGetStartedHeading",
  "footerNavAria",
  "footerLanguageHeading",
  "localeEn",
  "localeSw",
  "localeAria",
  "careSeekerTitle",
  "notADiagnosis",
  "pretriageExplanation",
  "emergencyHeading",
  "emergencyBody",
  "emergencyCta",
  "call999",
  "goNow",
  "tabHome",
  "tabCare",
  "tabFacilities",
  "backToRolePicker",
  "signInHeading",
  "signInEmail",
  "signInPassword",
  "signInSubmit",
  "signInGoogle",
  "signInDemoHint",
  "signInUseDemo",
  "hospitalSignInHeading",
  "hospitalSignInHint",
  "hospitalSignInDemoHint",
  "hospitalStaffRequired",
  "hospitalGoToCare",
  "authChecking",
  "accountHeading",
  "signOut",
  "signedInAs",
  "profilePhotoAlt",
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
  "getDirection",
  "callHospital",
  "bookComingSoon",
  "bookDisabledHint",
  "bookNow",
  "journeyGetTicket",
  "journeyGetTicketHint",
  "journeyLookupTicket",
  "journeyLookupTicketHint",
  "lookupHeading",
  "lookupLabel",
  "lookupPlaceholder",
  "lookupSubmit",
  "lookupNotFound",
  "lookupStatus",
  "lookupFacility",
  "lookupWhen",
  "stepOf",
  "stepSymptoms",
  "stepHospital",
  "stepBook",
  "stepSummary",
  "continueCta",
  "backCta",
  "confirmBookCta",
  "selectHospitalCta",
  "selectedHospital",
  "bookKindHeading",
  "bookKindInstant",
  "bookKindInstantHint",
  "bookKindAppointment",
  "bookKindAppointmentHint",
  "pickSlotHeading",
  "noSlotsLeft",
  "summaryHeading",
  "summaryFacility",
  "summaryKind",
  "summarySlot",
  "summarySymptoms",
  "summaryName",
  "summaryPhone",
  "givenNameLabel",
  "familyNameLabel",
  "phoneLabel",
  "phoneHint",
  "ticketReadyHeading",
  "ticketReadyBody",
  "ticketCodeLabel",
  "ticketShowStaff",
  "startOverCta",
  "lookupThisTicket",
  "guestBookHint",
  "redFlagBanner",
  "errorUnauthorized",
  "errorUserNotProvisioned",
  "errorLocationOutOfRange",
  "errorGeneric",
  "errorNetwork",
  "loading",
  "signedInRolePatient",
  "signedInRoleStaff",
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
    marketingNavAria: "CareFlow roles",
    marketingHeroTitle: "Find the right hospital. Know the wait before you go.",
    marketingHeroSubtitle:
      "CareFlow is pretriage routing — not a diagnosis. Care-seekers book a suitable facility. Hospitals keep the wait honest.",
    marketingHeroImageAlt:
      "Illustration of a clinician at a first-aid desk with health supplies",
    howItWorksHeading: "How CareFlow works",
    howStep1Title: "Describe symptoms",
    howStep1Body: "Tell us how you feel in English or Kiswahili.",
    howStep2Title: "Right KEPH level",
    howStep2Body:
      "We map what you describe to a suitable hospital level. We do not diagnose.",
    howStep3Title: "Shortest wait, nearby",
    howStep3Body:
      "Facilities are ranked by hospital-reported wait, then distance.",
    howStep4Title: "Book and be seen",
    howStep4Body:
      "The hospital sees you coming. SMS and a voice reminder keep you informed.",
    marketingSeekerTitle: "Need care?",
    marketingSeekerBody:
      "Find a suitable facility, book a visit, and get SMS and voice reminders. This is not a diagnosis.",
    marketingSeekerImageAlt:
      "Illustration of a clinic lobby with patients and hospital staff",
    marketingHospitalTitle: "Hospital desk",
    marketingHospitalBody:
      "One facility only. Update people waiting, see today's bookings, and mark met or did not come.",
    marketingHospitalImageAlt:
      "Illustration of a hospital team reviewing care information together",
    marketingGetStartedHeading: "Get started",
    footerNavAria: "CareFlow links",
    footerLanguageHeading: "Language",
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
    emergencyCta: "Emergency? Call 999 or go now.",
    call999: "Call 999",
    goNow: "Go now",
    tabHome: "Home",
    tabCare: "Care",
    tabFacilities: "Facilities",
    backToRolePicker: "Back to role picker",
    signInHeading: "Sign in",
    signInEmail: "Email",
    signInPassword: "Password",
    signInSubmit: "Sign in",
    signInGoogle: "Continue with Google",
    signInDemoHint:
      "Demo email: patient@careflow.local — tap Use demo login (skips Firebase).",
    signInUseDemo: "Use demo login",
    hospitalSignInHeading: "Hospital staff sign in",
    hospitalSignInHint:
      "Sign in with a hospital staff account to open this facility's desk.",
    hospitalSignInDemoHint:
      "Demo email: staff@careflow.local — tap Use demo login (skips Firebase).",
    hospitalStaffRequired:
      "This CareFlow account is a care-seeker account. Sign out and sign in as hospital staff.",
    hospitalGoToCare: "Go to care",
    authChecking: "Checking sign-in…",
    accountHeading: "Your account",
    signOut: "Sign out",
    signedInAs: "Signed in as",
    profilePhotoAlt: "Profile photo",
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
    getDirection: "Get Direction",
    callHospital: "Call Hospital",
    bookComingSoon: "Book this hospital",
    bookDisabledHint:
      "Choose walk-in or an appointment time, then confirm to get your ticket.",
    bookNow: "Book this hospital",
    journeyGetTicket: "Get a ticket",
    journeyGetTicketHint: "Describe symptoms, pick a hospital, and book",
    journeyLookupTicket: "Look up a ticket",
    journeyLookupTicketHint: "Check a booking you already have",
    lookupHeading: "Look up your ticket",
    lookupLabel: "Ticket code",
    lookupPlaceholder: "e.g. CF-115",
    lookupSubmit: "Look up",
    lookupNotFound: "No ticket matches that code.",
    lookupStatus: "Status",
    lookupFacility: "Hospital",
    lookupWhen: "When",
    stepOf: "Step {n} of {total}",
    stepSymptoms: "Symptoms",
    stepHospital: "Hospital",
    stepBook: "Book",
    stepSummary: "Summary",
    continueCta: "Continue",
    backCta: "Back",
    confirmBookCta: "Confirm booking",
    selectHospitalCta: "Select this hospital",
    selectedHospital: "Selected",
    bookKindHeading: "How do you want to visit?",
    bookKindInstant: "Walk in now",
    bookKindInstantHint: "Join the queue and go when it is your turn",
    bookKindAppointment: "Book an appointment",
    bookKindAppointmentHint: "Choose a time slot and arrive then",
    pickSlotHeading: "Choose a time",
    noSlotsLeft: "No appointment slots left. Try tomorrow morning.",
    summaryHeading: "Booking summary",
    summaryFacility: "Hospital",
    summaryKind: "Visit type",
    summarySlot: "Appointment time",
    summarySymptoms: "Symptoms",
    summaryName: "Name",
    summaryPhone: "Phone",
    givenNameLabel: "Given name",
    familyNameLabel: "Family name",
    phoneLabel: "Phone number",
    phoneHint: "Kenya number or last 4 digits",
    ticketReadyHeading: "Your ticket is ready",
    ticketReadyBody: "Show this code at the hospital desk.",
    ticketCodeLabel: "Ticket code",
    ticketShowStaff: "Show this code to hospital staff",
    startOverCta: "Start over",
    lookupThisTicket: "Look up this ticket",
    guestBookHint:
      "You can book with your name and phone. Sign in is optional.",
    redFlagBanner:
      "Go to the nearest suitable hospital. Call 999 if this is an emergency. You can still book.",
    errorUnauthorized: "Please sign in again.",
    errorUserNotProvisioned:
      "We could not set up this CareFlow account. Sign out and try again.",
    errorLocationOutOfRange: "That location is outside Kenya coverage.",
    errorGeneric: "Something went wrong. Please try again.",
    errorNetwork: "Network error. Check your connection and try again.",
    loading: "Loading…",
    signedInRolePatient: "Signed in as care-seeker",
    signedInRoleStaff: "Signed in as hospital staff",
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
    marketingNavAria: "Majukumu ya CareFlow",
    marketingHeroTitle:
      "Pata hospitali inayofaa. Jua foleni kabla ya kuenda.",
    marketingHeroSubtitle:
      "CareFlow ni uelekezaji wa kabla ya uchunguzi — si utambuzi. Wahitaji wa matibabu huhifadhi kituo kinachofaa. Hospitali huweka foleni kuwa ya kweli.",
    marketingHeroImageAlt:
      "Mchoro wa daktari kwenye dawati la huduma ya kwanza na vifaa vya afya",
    howItWorksHeading: "Jinsi CareFlow inavyofanya kazi",
    howStep1Title: "Eleza dalili",
    howStep1Body: "Tuambie jinsi unavyohisi kwa Kiingereza au Kiswahili.",
    howStep2Title: "Kiwango sahihi cha KEPH",
    howStep2Body:
      "Tunaelekeza maelezo yako kwenye kiwango cha hospitali kinachofaa. Hatutambui ugonjwa.",
    howStep3Title: "Foleni fupi, karibu",
    howStep3Body:
      "Vituo hupangwa kulingana na foleni inayoripotiwa na hospitali, kisha umbali.",
    howStep4Title: "Hifadhi na uhudhuriwe",
    howStep4Body:
      "Hospitali inakuona unakuja. SMS na kumbusho la sauti vinakujulisha.",
    marketingSeekerTitle: "Unahitaji matibabu?",
    marketingSeekerBody:
      "Tafuta kituo kinachofaa, hifadhi ziara, na upate kumbusho za SMS na sauti. Hii si utambuzi.",
    marketingSeekerImageAlt:
      "Mchoro wa ukumbi wa kliniki wenye wagonjwa na wafanyakazi wa hospitali",
    marketingHospitalTitle: "Dawati la hospitali",
    marketingHospitalBody:
      "Kituo kimoja tu. Sasisha watu wanaosubiri, ona uhifadhi wa leo, na weka alama kuwa umefika au hukufika.",
    marketingHospitalImageAlt:
      "Mchoro wa timu ya hospitali ikikagua taarifa za huduma pamoja",
    marketingGetStartedHeading: "Anza",
    footerNavAria: "Viungo vya CareFlow",
    footerLanguageHeading: "Lugha",
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
    emergencyCta: "Dharura? Piga 999 au nenda sasa.",
    call999: "Piga 999",
    goNow: "Nenda sasa",
    tabHome: "Nyumbani",
    tabCare: "Huduma",
    tabFacilities: "Vituo",
    backToRolePicker: "Rudi kuchagua jukumu",
    signInHeading: "Ingia",
    signInEmail: "Barua pepe",
    signInPassword: "Nenosiri",
    signInSubmit: "Ingia",
    signInGoogle: "Endelea na Google",
    signInDemoHint:
      "Barua pepe ya onyesho: patient@careflow.local — gusa Tumia akaunti ya onyesho (bila Firebase).",
    signInUseDemo: "Tumia akaunti ya onyesho",
    hospitalSignInHeading: "Ingia kama mfanyakazi wa hospitali",
    hospitalSignInHint:
      "Ingia kwa akaunti ya wafanyakazi wa hospitali ili kufungua dawati la kituo hiki.",
    hospitalSignInDemoHint:
      "Barua pepe ya onyesho: staff@careflow.local — gusa Tumia akaunti ya onyesho (bila Firebase).",
    hospitalStaffRequired:
      "Akaunti hii ya CareFlow ni ya mhitaji wa matibabu. Toka na uingie kama mfanyakazi wa hospitali.",
    hospitalGoToCare: "Nenda kwenye huduma",
    authChecking: "Inakagua kuingia…",
    accountHeading: "Akaunti yako",
    signOut: "Toka",
    signedInAs: "Umeingia kama",
    profilePhotoAlt: "Picha ya profaili",
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
    getDirection: "Pata mwongozo",
    callHospital: "Piga hospitali",
    bookComingSoon: "Hifadhi hospitali hii",
    bookDisabledHint:
      "Chagua kuingia sasa au muda wa miadi, kisha thibitisha ili upate tiketi.",
    bookNow: "Hifadhi hospitali hii",
    journeyGetTicket: "Pata tiketi",
    journeyGetTicketHint: "Eleza dalili, chagua hospitali, na uhifadhi",
    journeyLookupTicket: "Tafuta tiketi",
    journeyLookupTicketHint: "Angalia uhifadhi ulio nao tayari",
    lookupHeading: "Tafuta tiketi yako",
    lookupLabel: "Nambari ya tiketi",
    lookupPlaceholder: "k.m. CF-115",
    lookupSubmit: "Tafuta",
    lookupNotFound: "Hakuna tiketi inayofanana na nambari hiyo.",
    lookupStatus: "Hali",
    lookupFacility: "Hospitali",
    lookupWhen: "Wakati",
    stepOf: "Hatua {n} kati ya {total}",
    stepSymptoms: "Dalili",
    stepHospital: "Hospitali",
    stepBook: "Hifadhi",
    stepSummary: "Muhtasari",
    continueCta: "Endelea",
    backCta: "Rudi",
    confirmBookCta: "Thibitisha uhifadhi",
    selectHospitalCta: "Chagua hospitali hii",
    selectedHospital: "Imechaguliwa",
    bookKindHeading: "Unataka kuhudhuria vipi?",
    bookKindInstant: "Ingia sasa",
    bookKindInstantHint: "Jiunge na foleni na uende zamu yako inapofika",
    bookKindAppointment: "Hifadhi miadi",
    bookKindAppointmentHint: "Chagua muda na ufike wakati huo",
    pickSlotHeading: "Chagua muda",
    noSlotsLeft: "Hakuna nafasi za miadi zilizobaki. Jaribu asubuhi ya kesho.",
    summaryHeading: "Muhtasari wa uhifadhi",
    summaryFacility: "Hospitali",
    summaryKind: "Aina ya ziara",
    summarySlot: "Muda wa miadi",
    summarySymptoms: "Dalili",
    summaryName: "Jina",
    summaryPhone: "Simu",
    givenNameLabel: "Jina la kwanza",
    familyNameLabel: "Jina la ukoo",
    phoneLabel: "Nambari ya simu",
    phoneHint: "Nambari ya Kenya au tarakimu 4 za mwisho",
    ticketReadyHeading: "Tiketi yako iko tayari",
    ticketReadyBody: "Onyesha nambari hii kwenye dawati la hospitali.",
    ticketCodeLabel: "Nambari ya tiketi",
    ticketShowStaff: "Onyesha nambari hii kwa wafanyakazi wa hospitali",
    startOverCta: "Anza upya",
    lookupThisTicket: "Tafuta tiketi hii",
    guestBookHint: "Unaweza kuhifadhi kwa jina na simu. Kuingia si lazima.",
    redFlagBanner:
      "Nenda hospitali ya karibu inayofaa. Piga 999 ikiwa ni dharura. Bado unaweza kuhifadhi.",
    errorUnauthorized: "Tafadhali ingia tena.",
    errorUserNotProvisioned:
      "Hatukuweza kuandaa akaunti hii ya CareFlow. Toka na ujaribu tena.",
    errorLocationOutOfRange: "Mahali hapo ni nje ya eneo la Kenya.",
    errorGeneric: "Kuna hitilafu. Tafadhali jaribu tena.",
    errorNetwork: "Hitilafu ya mtandao. Angalia muunganisho wako na ujaribu tena.",
    loading: "Inapakia…",
    signedInRolePatient: "Umeingia kama mhitaji wa matibabu",
    signedInRoleStaff: "Umeingia kama mfanyakazi wa hospitali",
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

/** Official KEPH facility ladder used in ranking (2–6). Level 1 community is out of scope. */
export const KEPH_LEVELS = [2, 3, 4, 5, 6] as const;
export type KephLevel = (typeof KEPH_LEVELS)[number];

export function isKephLevel(level: number): level is KephLevel {
  return level === 2 || level === 3 || level === 4 || level === 5 || level === 6;
}

export type KephLevelCopy = {
  name: string;
  description: string;
};

const kephCatalog: Record<Locale, Record<KephLevel, KephLevelCopy>> = {
  en: {
    2: {
      name: "Dispensary",
      description:
        "Kenya Essential Package for Health (KEPH) level 2. A dispensary is usually the first stop for mild illness: outpatient care and basic medicines. It is not a hospital. A higher-level facility can still take this kind of case.",
    },
    3: {
      name: "Health centre",
      description:
        "Kenya Essential Package for Health (KEPH) level 3. A health centre sits above a dispensary. It typically offers outpatient care plus limited beds — often maternity and a basic laboratory — but it is not a county hospital with a full emergency department.",
    },
    4: {
      name: "Primary / county hospital",
      description:
        "Kenya Essential Package for Health (KEPH) level 4. A primary or county (sub-county) hospital handles inpatient care, surgery, and emergencies. CareFlow sends red-flag symptoms here or higher, not to a quieter dispensary.",
    },
    5: {
      name: "Regional referral hospital",
      description:
        "Kenya Essential Package for Health (KEPH) level 5. A regional referral hospital is a specialist centre covering several counties. It takes complex cases a county hospital cannot manage.",
    },
    6: {
      name: "National referral hospital",
      description:
        "Kenya Essential Package for Health (KEPH) level 6. A national referral hospital sits at the top of Kenya’s public system (for example Kenyatta National Hospital). It takes the most complex cases referred from lower levels.",
    },
  },
  sw: {
    2: {
      name: "Zahanati",
      description:
        "Kiwango cha 2 cha Kenya Essential Package for Health (KEPH). Zahanati ni kituo cha kwanza kwa ugonjwa mdogo: huduma za wagonjwa wa nje na dawa za msingi. Si hospitali. Kituo cha kiwango cha juu kinaweza pia kuhudumia kesi kama hii.",
    },
    3: {
      name: "Kituo cha afya",
      description:
        "Kiwango cha 3 cha Kenya Essential Package for Health (KEPH). Kituo cha afya kiko juu ya zahanati. Kwa kawaida hutoa huduma za wagonjwa wa nje na vitanda vichache — mara nyingi uzazi na maabara ya msingi — lakini si hospitali ya kaunti yenye idara kamili ya dharura.",
    },
    4: {
      name: "Hospitali ya kaunti",
      description:
        "Kiwango cha 4 cha Kenya Essential Package for Health (KEPH). Hospitali ya msingi au ya kaunti (kaunti ndogo) hushughulikia wagonjwa wa ndani, upasuaji, na dharura. Dalili nyekundu katika CareFlow zinaelekezwa hapa au juu, si zahanati yenye foleni fupi.",
    },
    5: {
      name: "Hospitali ya rufaa ya kanda",
      description:
        "Kiwango cha 5 cha Kenya Essential Package for Health (KEPH). Hospitali ya rufaa ya kanda ni kituo cha wataalamu kwa kundi la kaunti. Inachukua kesi ngumu ambazo hospitali ya kaunti haiwezi kushughulikia.",
    },
    6: {
      name: "Hospitali ya rufaa ya taifa",
      description:
        "Kiwango cha 6 cha Kenya Essential Package for Health (KEPH). Hospitali ya rufaa ya taifa iko kileleni mwa mfumo wa umma nchini Kenya (kwa mfano Hospitali ya Taifa ya Kenyatta). Inachukua kesi ngumu zaidi zinazotumwa kutoka viwango vya chini.",
    },
  },
};

export function kephLevelCopy(level: number, locale?: Locale): KephLevelCopy {
  const loc = locale ?? getLocale();
  if (isKephLevel(level)) {
    return kephCatalog[loc][level];
  }
  if (loc === "sw") {
    return {
      name: t("kephLevel", loc),
      description: `Kiwango cha ${level} cha Kenya Essential Package for Health (KEPH) — ngazi rasmi ya kituo nchini Kenya (2 zahanati hadi 6 taifa).`,
    };
  }
  return {
    name: t("kephLevel", loc),
    description: `Kenya Essential Package for Health (KEPH) level ${level}. KEPH is Kenya’s official facility ladder (2 dispensary through 6 national).`,
  };
}
