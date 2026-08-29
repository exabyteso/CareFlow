/**
 * Hospital desk API (J4 / J5).
 * Same shapes as docs/api/hospital.md, plus station serving for the PWA desk.
 */
import {
  assignBookingDepartment,
  callNextAtStation,
  getBookingByCode,
  getBookingById,
  getCalledLog,
  getFacility,
  getServingMap,
  listAllBookings,
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

export function listScheduledBookings(bookings: QueueBooking[]): QueueBooking[] {
  return bookings
    .filter(
      (row) => row.status === "booked" && row.booking_kind === "appointment",
    )
    .sort((a, b) => {
      const aSlot = a.slot_start ?? "";
      const bSlot = b.slot_start ?? "";
      return aSlot.localeCompare(bSlot) || a.id - b.id;
    });
}

const SYMPTOM_LABELS: Record<string, string> = {
  fever: "Fever",
  cough: "Cough",
  headache: "Headache",
  wound: "Cut or wound",
  malaria_suspect: "Fever and chills",
  pregnancy_check: "Pregnancy check",
  chest_pain: "Chest pain",
  "chest-pain": "Chest pain",
  severe_bleeding: "Severe bleeding",
  trouble_breathing: "Trouble breathing",
  "trouble-breathing": "Trouble breathing",
  stroke_signs: "Face or arm weakness, or slurred speech",
};

export function labelForSlug(slug: string): string {
  return SYMPTOM_LABELS[slug] ?? slug;
}

export function facilityName(booking: QueueBooking): string {
  return getFacility(booking.facility_id)?.name ?? "Unknown facility";
}

function requireBooking(bookingId: number): QueueBooking {
  const booking = getBookingById(bookingId);
  if (!booking) {
    throw new Error("No booking matches that id.");
  }
  return booking;
}

export function lookupDeskTicket(code: string): QueueBooking | null {
  return getBookingByCode(code);
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
    bookings: listAllBookings(),
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
  const booking = requireBooking(bookingId);
  return markBookingTerminal(bookingId, booking.facility_id, "arrived");
}

export async function markNoShow(
  bookingId: number,
): Promise<BookingStatusResponse> {
  const booking = requireBooking(bookingId);
  return markBookingTerminal(bookingId, booking.facility_id, "no_show");
}

export async function assignDepartment(
  bookingId: number,
  departmentId: number | null,
): Promise<QueueBooking> {
  const booking = requireBooking(bookingId);
  return assignBookingDepartment(bookingId, booking.facility_id, departmentId);
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
  const booking = requireBooking(bookingId);
  return transferBooking(bookingId, booking.facility_id, {
    departmentId,
    stationId,
  });
}
