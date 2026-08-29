/**
 * Auth helpers for the CareFlow PWA. P4/P5 import these — keep names stable.
 *
 * Demo (local/staging; not a committed secret file):
 *   patient@careflow.local / CareflowDemo1!  → Bearer careflow-demo-patient
 *   staff@careflow.local / CareflowDemo1!    → Bearer careflow-demo-staff
 *
 * Those two accounts skip the Firebase client SDK so missing Auth users do
 * not surface INVALID_LOGIN_CREDENTIALS. Google and any other email still
 * use getFirebaseAuth() (project careflow-kenya). Client-only; SSR-safe so a
 * future Server Component import does not call getAuth().
 */
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";

import { getFirebaseAuth } from "./firebase";

const DEMO_STORAGE_KEY = "careflow.demoUid";

export const DEMO_PATIENT = {
  email: "patient@careflow.local",
  password: "CareflowDemo1!",
  uid: "demo-patient",
  token: "careflow-demo-patient",
} as const;

export const DEMO_STAFF = {
  email: "staff@careflow.local",
  password: "CareflowDemo1!",
  uid: "demo-staff",
  token: "careflow-demo-staff",
} as const;

const DEMO_BY_EMAIL: Record<
  string,
  { uid: string; token: string; password: string }
> = {
  [DEMO_PATIENT.email]: DEMO_PATIENT,
  [DEMO_STAFF.email]: DEMO_STAFF,
};

const DEMO_BY_UID: Record<string, { uid: string; token: string }> = {
  [DEMO_PATIENT.uid]: DEMO_PATIENT,
  [DEMO_STAFF.uid]: DEMO_STAFF,
};

type AuthListener = (uid: string | null) => void;

const authListeners = new Set<AuthListener>();
let storageBound = false;
/** In-memory copy so demo login still works if localStorage is blocked. */
let memoryDemoUid: string | null | undefined;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function requireClientAuth() {
  if (!isBrowser()) {
    throw new Error("Firebase Auth is client-only");
  }
  return getFirebaseAuth();
}

function uidFromStorageValue(raw: string | null): string | null {
  return raw && raw in DEMO_BY_UID ? raw : null;
}

function readDemoUid(): string | null {
  if (!isBrowser()) {
    return null;
  }
  if (memoryDemoUid !== undefined) {
    return memoryDemoUid;
  }
  try {
    memoryDemoUid = uidFromStorageValue(
      window.localStorage.getItem(DEMO_STORAGE_KEY),
    );
  } catch {
    memoryDemoUid = null;
  }
  return memoryDemoUid;
}

function persistDemoUid(uid: string | null): void {
  const next = uid && uid in DEMO_BY_UID ? uid : null;
  memoryDemoUid = next;
  if (!isBrowser()) {
    return;
  }
  try {
    if (next) {
      window.localStorage.setItem(DEMO_STORAGE_KEY, next);
    } else {
      window.localStorage.removeItem(DEMO_STORAGE_KEY);
    }
  } catch {
    // Private mode / blocked storage — in-memory session still works this tab.
  }
}

function resolveUid(): string | null {
  const demoUid = readDemoUid();
  if (demoUid) {
    return demoUid;
  }
  if (!isBrowser()) {
    return null;
  }
  return getFirebaseAuth().currentUser?.uid ?? null;
}

function emitAuth(): void {
  const uid = resolveUid();
  for (const cb of authListeners) {
    cb(uid);
  }
}

function bindStorageListener(): void {
  if (!isBrowser() || storageBound) {
    return;
  }
  storageBound = true;
  window.addEventListener("storage", (event) => {
    if (event.key === DEMO_STORAGE_KEY) {
      memoryDemoUid = uidFromStorageValue(event.newValue);
      emitAuth();
    }
  });
}

function demoAccountForEmail(email: string) {
  return DEMO_BY_EMAIL[email.trim().toLowerCase()] ?? null;
}

/** Current user's API Bearer token, or null if signed out / SSR. */
export async function getIdToken(): Promise<string | null> {
  if (!isBrowser()) {
    return null;
  }
  const demoUid = readDemoUid();
  if (demoUid) {
    return DEMO_BY_UID[demoUid].token;
  }
  const user = getFirebaseAuth().currentUser;
  if (!user) {
    return null;
  }
  return user.getIdToken();
}

export async function signInWithEmailPassword(
  email: string,
  password: string,
): Promise<void> {
  const demo = demoAccountForEmail(email);
  if (demo) {
    if (password !== demo.password) {
      throw new Error("INVALID_DEMO_CREDENTIALS");
    }
    persistDemoUid(demo.uid);
    emitAuth();
    try {
      await firebaseSignOut(requireClientAuth());
    } catch {
      // Not signed into Firebase — demo session is enough.
    }
    return;
  }

  persistDemoUid(null);
  emitAuth();
  await signInWithEmailAndPassword(requireClientAuth(), email, password);
}

export async function signInWithGoogle(): Promise<void> {
  persistDemoUid(null);
  emitAuth();
  const provider = new GoogleAuthProvider();
  await signInWithPopup(requireClientAuth(), provider);
}

export async function signOut(): Promise<void> {
  persistDemoUid(null);
  emitAuth();
  try {
    await firebaseSignOut(requireClientAuth());
  } catch {
    // Demo-only session has no Firebase user.
  }
}

/** Subscribe to auth uid changes. Returns unsubscribe. No-op on the server. */
export function subscribeAuth(cb: (uid: string | null) => void): () => void {
  if (!isBrowser()) {
    return () => {};
  }
  bindStorageListener();
  authListeners.add(cb);
  const unsubFirebase = onAuthStateChanged(getFirebaseAuth(), () => {
    emitAuth();
  });
  if (readDemoUid()) {
    cb(readDemoUid());
  }
  return () => {
    authListeners.delete(cb);
    unsubFirebase();
  };
}
