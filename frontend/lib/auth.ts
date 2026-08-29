/**
 * Firebase Auth helpers for the CareFlow PWA. P4/P5 import these — keep names stable.
 *
 * Demo (local; not a committed secret file):
 *   patient@careflow.local / CareflowDemo1!
 *
 * Wraps getFirebaseAuth() from ./firebase (project careflow-kenya). Client-only;
 * SSR-safe so a future Server Component import does not call getAuth().
 */
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";

import { getFirebaseAuth } from "./firebase";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function requireClientAuth() {
  if (!isBrowser()) {
    throw new Error("Firebase Auth is client-only");
  }
  return getFirebaseAuth();
}

/** Current user's Firebase ID token, or null if signed out / SSR. */
export async function getIdToken(): Promise<string | null> {
  if (!isBrowser()) {
    return null;
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
  await signInWithEmailAndPassword(requireClientAuth(), email, password);
}

export async function signInWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(requireClientAuth(), provider);
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(requireClientAuth());
}

/** Subscribe to auth uid changes. Returns unsubscribe. No-op on the server. */
export function subscribeAuth(cb: (uid: string | null) => void): () => void {
  if (!isBrowser()) {
    return () => {};
  }
  return onAuthStateChanged(getFirebaseAuth(), (user) => {
    cb(user?.uid ?? null);
  });
}
