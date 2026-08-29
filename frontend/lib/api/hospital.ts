/**
 * Hospital desk API (J4 / J5).
 * Same shapes as docs/api/hospital.md, plus station serving for the PWA desk.
 */
import {
  assignBookingDepartment,
  callNextAtStation,
  getCalledLog,
  getFacility,
  getServingMap,
  listBookingsForFacility,
  listDepartments,
  markBookingTerminal,
  patchFacilityWait,
  sortStationQueue,
  subscribeQueue,
  transferBooking,
  type CalledEntry,
  type DeskDepartment,
  type QueueBooking as StoreBooking,
} from "./queue-store";

export type BookingStatus = StoreBooking["status"];
export type BookingKind = StoreBooking["booking_kind"];
export type QueueBooking = StoreBooking;
export type { CalledEntry, DeskDepartment };

export type FacilityWait = {
  id: number;
  name: string;
  kmhfr_code: string;
  wait_count: number;
};

export type HospitalQueueResponse = {
  facility: FacilityWait;
  bookings: QueueBooking[];
  departments: DeskDepartment[];
  serving: Record<string, number | null>;
  called_log: CalledEntry[];
};

export type WaitCountResponse = {
  facility_id: number;
  wait_count: number;
};

export type BookingStatusResponse = {
  booking: QueueBooking;
  wait_count: number;
};

/** Seeded Kenyatta National Hospital — this desk session. */
const STAFF_FACILITY_ID = 1;

export { subscribeQueue, listDepartments, sortStationQueue };

const SYMPTOM_LABELS: Record<string, string> = {
  fever: "Fever",
  cough: "Cough",
  headache: "Headache",
  wound: "Cut or wound",
  malaria_suspect: "Fever and chills",
  pregnancy_check: "Pregnancy check",
  chest_pain: "Chest pain",
  severe_bleeding: "Severe bleeding",
  trouble_breathing: "Trouble breathing",
  stroke_signs: "Face or arm weakness, or slurred speech",
};

export function labelForSlug(slug: string): string {
  return SYMPTOM_LABELS[slug] ?? slug;
}

export async function getHospitalQueue(): Promise<HospitalQueueResponse> {
  const facility = getFacility(STAFF_FACILITY_ID);
  if (!facility) {
    throw new Error("No facility is bound to this staff session.");
  }
  return {
    facility: {
      id: facility.id,
      name: facility.name,
      kmhfr_code: facility.kmhfr_code,
      wait_count: facility.wait_count,
    },
    bookings: listBookingsForFacility(STAFF_FACILITY_ID),
    departments: listDepartments(),
    serving: getServingMap(),
    called_log: getCalledLog(),
  };
}

export async function patchWaitCount(
  waitCount: number,
): Promise<WaitCountResponse> {
  const next = patchFacilityWait(STAFF_FACILITY_ID, waitCount);
  return { facility_id: STAFF_FACILITY_ID, wait_count: next };
}

export async function markArrived(
  bookingId: number,
): Promise<BookingStatusResponse> {
  return markBookingTerminal(bookingId, STAFF_FACILITY_ID, "arrived");
}

export async function markNoShow(
  bookingId: number,
): Promise<BookingStatusResponse> {
  return markBookingTerminal(bookingId, STAFF_FACILITY_ID, "no_show");
}

export async function assignDepartment(
  bookingId: number,
  departmentId: number | null,
): Promise<QueueBooking> {
  return assignBookingDepartment(bookingId, STAFF_FACILITY_ID, departmentId);
}

export async function callNext(
  departmentId: number,
  stationId: string,
): Promise<QueueBooking | null> {
  return callNextAtStation(STAFF_FACILITY_ID, departmentId, stationId);
}

export async function sendOnwards(
  bookingId: number,
  departmentId: number,
  stationId: string | null,
): Promise<{ booking: QueueBooking; placed: "queue" | "station" }> {
  return transferBooking(bookingId, STAFF_FACILITY_ID, {
    departmentId,
    stationId,
  });
}
