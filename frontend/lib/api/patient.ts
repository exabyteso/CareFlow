/**
 * Care-seeker API helpers: /me, /facilities/recommend, /symptoms/map.
 * mapSymptoms degrades on 404/network/unimplemented — no client-side diagnosis.
 */
import { apiFetch, isApiError } from "./client";

export type UserRole = "patient" | "hospital_staff";

/** Matches docs/api/me.md `MeResponse`. */
export type MeResponse = {
  firebase_uid: string;
  role: UserRole;
  facility_id: number | null;
  locale: string;
  phone_e164: string;
};

/** Matches docs/api/facilities.md `FacilityRecommendItem`. */
export type FacilityRecommendItem = {
  id: number;
  kmhfr_code: string;
  name: string;
  keph_level: number;
  lat: number;
  lng: number;
  county: string;
  wait_count: number;
  distance_m: number;
};

export type FacilityRecommendResponse = {
  facilities: FacilityRecommendItem[];
};

export type MappedSymptom = {
  symptom_id: string;
  score: number | null;
};

export type MapSymptomsResult = {
  symptoms: MappedSymptom[];
  degraded: boolean;
};

export async function getMe(): Promise<MeResponse> {
  return apiFetch<MeResponse>("/me");
}

export async function recommendFacilities(params: {
  lat: number;
  lng: number;
  keph_min?: number;
}): Promise<FacilityRecommendResponse> {
  const query = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    keph_min: String(params.keph_min ?? 2),
  });
  return apiFetch<FacilityRecommendResponse>(
    `/facilities/recommend?${query.toString()}`,
  );
}

function shouldDegradeMapSymptoms(err: unknown): boolean {
  if (isApiError(err)) {
    if (err.status === 0 || err.code === "network_error") {
      return true;
    }
    if (err.status === 404 || err.code === "not_found") {
      return true;
    }
    if (err.status === 501 || err.status === 405) {
      return true;
    }
  }
  return false;
}

function normalizeMapSymptoms(body: unknown): MapSymptomsResult {
  if (!body || typeof body !== "object") {
    return { symptoms: [], degraded: false };
  }
  const rec = body as Record<string, unknown>;

  if (Array.isArray(rec.symptoms)) {
    const symptoms: MappedSymptom[] = [];
    for (const item of rec.symptoms) {
      if (typeof item === "string") {
        symptoms.push({ symptom_id: item, score: null });
        continue;
      }
      if (item && typeof item === "object") {
        const row = item as Record<string, unknown>;
        const id =
          typeof row.symptom_id === "string"
            ? row.symptom_id
            : typeof row.id === "string"
              ? row.id
              : null;
        if (id) {
          symptoms.push({
            symptom_id: id,
            score: typeof row.score === "number" ? row.score : null,
          });
        }
      }
    }
    return { symptoms, degraded: false };
  }

  if (Array.isArray(rec.symptom_ids)) {
    return {
      symptoms: rec.symptom_ids
        .filter((id): id is string => typeof id === "string")
        .map((symptom_id) => ({ symptom_id, score: null })),
      degraded: false,
    };
  }

  return { symptoms: [], degraded: false };
}

/**
 * POST /symptoms/map. Route is not live in Wave 1.
 * On 404, network failure, or unimplemented, returns `{ symptoms: [], degraded: true }`.
 * Does not invent a client-side diagnosis or KEPH engine.
 */
export async function mapSymptoms(params: {
  text: string;
  lang: string;
}): Promise<MapSymptomsResult> {
  try {
    const body = await apiFetch<unknown>("/symptoms/map", {
      method: "POST",
      body: JSON.stringify({ text: params.text, lang: params.lang }),
    });
    return normalizeMapSymptoms(body);
  } catch (err) {
    if (shouldDegradeMapSymptoms(err)) {
      return { symptoms: [], degraded: true };
    }
    throw err;
  }
}

export { ApiError, isApiError } from "./client";
