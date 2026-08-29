/**
 * Patient-facing booking helpers on the local queue store.
 * Ticket codes exist only after createCareSeekerBooking returns.
 */
import {
  createAppointmentBooking,
  createInstantBooking,
  ensureFacility,
  getBookingByCode,
  getFacility,
  listAppointmentSlots,
  type QueueBooking,
} from "./queue-store";

export type { QueueBooking };

export type PatientTicket = QueueBooking & {
  facility_name: string;
  facility_kmhfr: string;
};

function last4(phone: string): string {
  const trimmed = phone.trim();
  if (/^\d{4}$/.test(trimmed)) {
    return trimmed;
  }
  const digits = trimmed.replace(/\D/g, "");
  return digits.slice(-4);
}

function toPatientTicket(booking: QueueBooking): PatientTicket {
  const facility = getFacility(booking.facility_id);
  return {
    ...booking,
    facility_name: facility?.name ?? "",
    facility_kmhfr: facility?.kmhfr_code ?? "",
  };
}

export function lookupTicket(code: string): PatientTicket | null {
  const booking = getBookingByCode(code);
  if (!booking) {
    return null;
  }
  return toPatientTicket(booking);
}

export function listBookingSlots(): string[] {
  return listAppointmentSlots();
}

export function createCareSeekerBooking(input: {
  facility: {
    id: number;
    kmhfr_code: string;
    name: string;
    keph_level: number;
    lat: number;
    lng: number;
    county: string;
    wait_count: number;
  };
  kind: "instant" | "appointment";
  slot_start?: string | null;
  given_name: string | null;
  family_name: string | null;
  phone_last4: string;
  symptom_slugs: string[];
  patient_free_text: string | null;
  red_flag_applied: boolean;
}): PatientTicket {
  const facility = ensureFacility(input.facility);
  const person = {
    facilityId: facility.id,
    given_name: input.given_name,
    family_name: input.family_name,
    phone_last4: last4(input.phone_last4),
    symptom_slugs: input.symptom_slugs,
    patient_free_text: input.patient_free_text,
    red_flag_applied: input.red_flag_applied,
  };
  if (input.kind === "appointment") {
    if (!input.slot_start) {
      throw new Error("Choose an appointment time.");
    }
    return toPatientTicket(
      createAppointmentBooking({ ...person, slot_start: input.slot_start }),
    );
  }
  return toPatientTicket(createInstantBooking(person));
}
