/**
 * J8 voice-consent persistence only. Never calls getUserMedia or SpeechRecognition.
 * Microphone start belongs to the care-seeker UI on `/patient` after consent === "yes".
 */
export const VOICE_CONSENT_KEY = "careflow-voice-consent";

export type VoiceConsent = "yes" | "no" | null;

export function getVoiceConsent(): VoiceConsent {
  if (typeof window === "undefined") {
    return null;
  }
  const value = window.localStorage.getItem(VOICE_CONSENT_KEY);
  if (value === "yes" || value === "no") {
    return value;
  }
  return null;
}

export function setVoiceConsent(value: "yes" | "no"): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(VOICE_CONSENT_KEY, value);
}
