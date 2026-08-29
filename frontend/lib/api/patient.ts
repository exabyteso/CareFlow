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
  keph_min: number | null;
  red_flag: boolean;
  degraded: boolean;
};

export async function getMe(): Promise<MeResponse> {
  return apiFetch<MeResponse>("/me");
}

export async function recommendFacilities(params: {
  lat: number;
  lng: number;
  keph_min?: number;
  red_flag?: boolean;
}): Promise<FacilityRecommendResponse> {
  const query = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    keph_min: String(params.keph_min ?? 2),
    red_flag: params.red_flag ? "true" : "false",
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

function readMappedSymptom(item: unknown): MappedSymptom | null {
  if (typeof item === "string") {
    return { symptom_id: item, score: null };
  }
  if (!item || typeof item !== "object") {
    return null;
  }
  const row = item as Record<string, unknown>;
  const id =
    typeof row.symptom_id === "string"
      ? row.symptom_id
      : typeof row.id === "string"
        ? row.id
        : null;
  if (!id) {
    return null;
  }
  return {
    symptom_id: id,
    score: typeof row.score === "number" ? row.score : null,
  };
}

function flagsFrom(
  rec: Record<string, unknown>,
  rows: unknown[],
): { keph_min: number | null; red_flag: boolean } {
  const topKeph = typeof rec.keph_min === "number" ? rec.keph_min : null;
  const hasTopFlag = typeof rec.red_flag === "boolean";
  let keph_min = topKeph;
  let red_flag = hasTopFlag ? rec.red_flag === true : false;
  if (topKeph == null || !hasTopFlag) {
    for (const item of rows) {
      if (!item || typeof item !== "object") {
        continue;
      }
      const row = item as Record<string, unknown>;
      if (topKeph == null && typeof row.keph_min === "number") {
        keph_min =
          keph_min == null ? row.keph_min : Math.max(keph_min, row.keph_min);
      }
      if (!hasTopFlag && row.red_flag === true) {
        red_flag = true;
      }
    }
  }
  return { keph_min, red_flag };
}

function normalizeMapSymptoms(body: unknown): MapSymptomsResult {
  const empty: MapSymptomsResult = {
    symptoms: [],
    keph_min: null,
    red_flag: false,
    degraded: false,
  };
  if (!body || typeof body !== "object") {
    return empty;
  }
  const rec = body as Record<string, unknown>;

  if (Array.isArray(rec.matches)) {
    const symptoms: MappedSymptom[] = [];
    for (const item of rec.matches) {
      const mapped = readMappedSymptom(item);
      if (mapped) {
        symptoms.push(mapped);
      }
    }
    return { symptoms, ...flagsFrom(rec, rec.matches), degraded: false };
  }

  if (Array.isArray(rec.symptoms)) {
    const symptoms: MappedSymptom[] = [];
    for (const item of rec.symptoms) {
      const mapped = readMappedSymptom(item);
      if (mapped) {
        symptoms.push(mapped);
      }
    }
    return { symptoms, ...flagsFrom(rec, rec.symptoms), degraded: false };
  }

  if (Array.isArray(rec.symptom_ids)) {
    const symptoms = rec.symptom_ids
      .filter((id): id is string => typeof id === "string")
      .map((symptom_id) => ({ symptom_id, score: null }));
    return { symptoms, ...flagsFrom(rec, []), degraded: false };
  }

  return { ...empty, ...flagsFrom(rec, []) };
}

/**
 * POST /symptoms/map. Route is not live in Wave 1.
 * On 404, network failure, or unimplemented, returns
 * `{ symptoms: [], keph_min: null, red_flag: false, degraded: true }`.
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
      return { symptoms: [], keph_min: null, red_flag: false, degraded: true };
    }
    throw err;
  }
}

export { ApiError, isApiError } from "./client";
