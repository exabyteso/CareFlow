/**
 * In-memory + localStorage queue for the hospital desk.
 */
export type BookingStatus = "booked" | "arrived" | "no_show" | "cancelled";
export type BookingKind = "instant" | "appointment";
export type QueueKind = "arrival" | "red_flag_first";

export type FacilityRecord = {
  id: number;
  kmhfr_code: string;
  name: string;
  keph_level: number;
  lat: number;
  lng: number;
  county: string;
  wait_count: number;
};

export type DeskStation = {
  id: string;
  name: string;
};

export type DeskDepartment = {
  id: number;
  slug: string;
  name: string;
  queue_kind: QueueKind;
  stations: DeskStation[];
};

export type CalledEntry = {
  booking_id: number;
  code: string;
  station_id: string;
  called_at: string;
  outcome: "called" | "arrived" | "no_show" | "transferred";
};

export type QueueBooking = {
  id: number;
  facility_id: number;
  code: string;
  status: BookingStatus;
  booking_kind: BookingKind;
  queue_position: number | null;
  created_at: string;
  given_name: string | null;
  family_name: string | null;
  phone_last4: string;
  symptom_slugs: string[];
  patient_free_text: string | null;
  red_flag_applied: boolean;
  department_id: number | null;
  /** When they joined the current desk queue. Transfers join the back. */
  desk_queued_at: string;
};

/** Kenyatta National Hospital desks — one facility, no wings. */
export const KNH_DEPARTMENTS: DeskDepartment[] = [
  {
    id: 10,
    slug: "triage",
    name: "Triage",
    queue_kind: "red_flag_first",
    stations: [
      { id: "triage-1", name: "Bay 1" },
      { id: "triage-2", name: "Bay 2" },
    ],
  },
  {
    id: 11,
    slug: "outpatient",
    name: "Outpatient consult",
    queue_kind: "arrival",
    stations: [
      { id: "opd-1", name: "Room 1" },
      { id: "opd-2", name: "Room 2" },
    ],
  },
  {
    id: 12,
    slug: "emergency",
    name: "Emergency",
    queue_kind: "red_flag_first",
    stations: [{ id: "er-1", name: "Bay 1" }],
  },
  {
    id: 13,
    slug: "maternity",
    name: "Maternity",
    queue_kind: "arrival",
    stations: [{ id: "mat-1", name: "Room 1" }],
  },
  {
    id: 14,
    slug: "pharmacy",
    name: "Pharmacy",
    queue_kind: "arrival",
    stations: [{ id: "pharm-1", name: "Counter 1" }],
  },
];

export function listDepartments(): DeskDepartment[] {
  return KNH_DEPARTMENTS.map((row) => ({
    ...row,
    stations: row.stations.map((station) => ({ ...station })),
  }));
}

export function getDepartment(departmentId: number): DeskDepartment | null {
  const row = KNH_DEPARTMENTS.find((item) => item.id === departmentId);
  return row
    ? { ...row, stations: row.stations.map((station) => ({ ...station })) }
    : null;
}

const STORAGE_KEY = "careflow-queue-v2";

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function seedFacilities(): FacilityRecord[] {
  return [
    {
      id: 1,
      kmhfr_code: "SEED-NBO-KNH",
      name: "Kenyatta National Hospital",
      keph_level: 5,
      lat: -1.3008,
      lng: 36.8074,
      county: "Nairobi",
      wait_count: 10,
    },
    {
      id: 2,
      kmhfr_code: "SEED-NBO-QUIET",
      name: "Upper Hill Health Centre",
      keph_level: 4,
      lat: -1.2925,
      lng: 36.821,
      county: "Nairobi",
      wait_count: 3,
    },
    {
      id: 3,
      kmhfr_code: "SEED-NBO-BUSY",
      name: "Upper Hill County Hospital",
      keph_level: 4,
      lat: -1.2942,
      lng: 36.8222,
      county: "Nairobi",
      wait_count: 18,
    },
    {
      id: 4,
      kmhfr_code: "SEED-NBO-KANG",
      name: "Kangemi Health Centre",
      keph_level: 3,
      lat: -1.2655,
      lng: 36.7448,
      county: "Nairobi",
      wait_count: 1,
    },
    {
      id: 5,
      kmhfr_code: "SEED-NBO-MLK",
      name: "Mama Lucy Kibaki Hospital",
      keph_level: 4,
      lat: -1.2732,
      lng: 36.8965,
      county: "Nairobi",
      wait_count: 9,
    },
    {
      id: 6,
      kmhfr_code: "SEED-NBO-MBAG",
      name: "Mbagathi County Hospital",
      keph_level: 4,
      lat: -1.3082,
      lng: 36.8035,
      county: "Nairobi",
      wait_count: 6,
    },
  ];
}

function seedBookings(): QueueBooking[] {
  const open: Array<{
    given_name: string;
    family_name: string;
    phone_last4: string;
    symptom_slugs: string[];
    patient_free_text: string | null;
    red_flag_applied: boolean;
    department_id: number | null;
    hours_ago: number;
  }> = [
    {
      given_name: "Wanjiku",
      family_name: "Mwangi",
      phone_last4: "4412",
      symptom_slugs: ["fever", "cough"],
      patient_free_text: null,
      red_flag_applied: false,
      department_id: 11,
      hours_ago: 2.4,
    },
    {
      given_name: "Brian",
      family_name: "Odhiambo",
      phone_last4: "9033",
      symptom_slugs: ["malaria_suspect"],
      patient_free_text: "Chills overnight",
      red_flag_applied: false,
      department_id: 10,
      hours_ago: 1.9,
    },
    {
      given_name: "Grace",
      family_name: "Chebet",
      phone_last4: "1178",
      symptom_slugs: ["headache"],
      patient_free_text: null,
      red_flag_applied: false,
      department_id: null,
      hours_ago: 0.4,
    },
    {
      given_name: "Samuel",
      family_name: "Mutua",
      phone_last4: "6621",
      symptom_slugs: ["wound"],
      patient_free_text: "Cut on the left hand",
      red_flag_applied: false,
      department_id: 14,
      hours_ago: 1.1,
    },
    {
      given_name: "Naomi",
      family_name: "Achieng",
      phone_last4: "2204",
      symptom_slugs: ["pregnancy_check"],
      patient_free_text: null,
      red_flag_applied: false,
      department_id: 13,
      hours_ago: 0.9,
    },
    {
      given_name: "Peter",
      family_name: "Kamau",
      phone_last4: "7780",
      symptom_slugs: ["chest_pain"],
      patient_free_text: "Pain started this morning",
      red_flag_applied: true,
      department_id: 12,
      hours_ago: 0.6,
    },
    {
      given_name: "Halima",
      family_name: "Yusuf",
      phone_last4: "3340",
      symptom_slugs: ["trouble_breathing"],
      patient_free_text: null,
      red_flag_applied: true,
      department_id: 12,
      hours_ago: 0.25,
    },
    {
      given_name: "Kevin",
      family_name: "Njoroge",
      phone_last4: "5589",
      symptom_slugs: ["cough"],
      patient_free_text: null,
      red_flag_applied: false,
      department_id: 10,
      hours_ago: 1.6,
    },
    {
      given_name: "Lucy",
      family_name: "Wambui",
      phone_last4: "0912",
      symptom_slugs: ["fever"],
      patient_free_text: null,
      red_flag_applied: false,
      department_id: 11,
      hours_ago: 2.0,
    },
    {
      given_name: "David",
      family_name: "Kipchoge",
      phone_last4: "8477",
      symptom_slugs: ["headache"],
      patient_free_text: null,
      red_flag_applied: false,
      department_id: 11,
      hours_ago: 0.7,
    },
  ];

  const booked = open.map((row, index) => {
    const id = 105 + index;
    return {
      id,
      facility_id: 1,
      code: `CF-${String(id).padStart(3, "0")}`,
      status: "booked" as const,
      booking_kind: "instant" as const,
      queue_position: null,
      created_at: hoursAgo(row.hours_ago),
      desk_queued_at: hoursAgo(row.hours_ago),
      given_name: row.given_name,
      family_name: row.family_name,
      phone_last4: row.phone_last4,
      symptom_slugs: row.symptom_slugs,
      patient_free_text: row.patient_free_text,
      red_flag_applied: row.red_flag_applied,
      department_id: row.department_id,
    };
  });

  return [
    ...booked,
    {
      id: 91,
      facility_id: 1,
      code: "CF-091",
      status: "arrived",
      booking_kind: "instant",
      queue_position: null,
      created_at: hoursAgo(4),
      desk_queued_at: hoursAgo(4),
      given_name: "Mercy",
      family_name: "Wanjiku",
      phone_last4: "1155",
      symptom_slugs: ["malaria_suspect"],
      patient_free_text: null,
      red_flag_applied: false,
      department_id: 11,
    },
    {
      id: 92,
      facility_id: 1,
      code: "CF-092",
      status: "no_show",
      booking_kind: "instant",
      queue_position: null,
      created_at: hoursAgo(5),
      desk_queued_at: hoursAgo(5),
      given_name: "Daniel",
      family_name: "Omondi",
      phone_last4: "6633",
      symptom_slugs: ["wound"],
      patient_free_text: null,
      red_flag_applied: false,
      department_id: 14,
    },
  ];
}

type StoreState = {
  nextId: number;
  facilities: FacilityRecord[];
  bookings: QueueBooking[];
  serving: Record<string, number | null>;
  called_log: CalledEntry[];
};

function seedState(): StoreState {
  return {
    nextId: 115,
    facilities: seedFacilities(),
    bookings: seedBookings(),
    serving: {},
    called_log: [
      {
        booking_id: 91,
        code: "CF-091",
        station_id: "opd-1",
        called_at: hoursAgo(3.6),
        outcome: "arrived",
      },
    ],
  };
}

function normalizeBooking(row: QueueBooking): QueueBooking {
  return {
    ...row,
    department_id: row.department_id ?? null,
    desk_queued_at: row.desk_queued_at ?? row.created_at,
    symptom_slugs: [...row.symptom_slugs],
  };
}

function normalizeState(parsed: StoreState): StoreState | null {
  if (!parsed?.facilities?.length || !Array.isArray(parsed.bookings)) {
    return null;
  }
  return {
    nextId: parsed.nextId,
    facilities: parsed.facilities,
    bookings: parsed.bookings.map(normalizeBooking),
    serving: parsed.serving ?? {},
    called_log: parsed.called_log ?? [],
  };
}

let memory: StoreState | null = null;
const listeners = new Set<() => void>();

function readStorage(): StoreState | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return normalizeState(JSON.parse(raw) as StoreState);
  } catch {
    return null;
  }
}

function writeStorage(state: StoreState): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getState(): StoreState {
  if (memory) {
    return memory;
  }
  memory = readStorage() ?? seedState();
  return memory;
}

function setState(next: StoreState): void {
  memory = next;
  writeStorage(next);
  listeners.forEach((listener) => listener());
}

function snapshotBooking(booking: QueueBooking): QueueBooking {
  return normalizeBooking(booking);
}

function clearServingForBooking(
  serving: Record<string, number | null>,
  bookingId: number,
): Record<string, number | null> {
  const next = { ...serving };
  for (const [stationId, id] of Object.entries(next)) {
    if (id === bookingId) {
      next[stationId] = null;
    }
  }
  return next;
}

function sortDeptQueue(
  rows: QueueBooking[],
  queueKind: QueueKind,
): QueueBooking[] {
  return [...rows].sort((a, b) => {
    if (queueKind === "red_flag_first") {
      if (a.red_flag_applied !== b.red_flag_applied) {
        return a.red_flag_applied ? -1 : 1;
      }
    }
    const aQueued = a.desk_queued_at ?? a.created_at;
    const bQueued = b.desk_queued_at ?? b.created_at;
    return aQueued.localeCompare(bQueued) || a.id - b.id;
  });
}

function recomputePositions(state: StoreState): StoreState {
  const openByFacility = new Map<number, QueueBooking[]>();
  for (const row of state.bookings) {
    if (row.status !== "booked" || row.booking_kind !== "instant") {
      continue;
    }
    const list = openByFacility.get(row.facility_id) ?? [];
    list.push(row);
    openByFacility.set(row.facility_id, list);
  }
  const order = new Map<number, number>();
  for (const list of openByFacility.values()) {
    list.sort(
      (a, b) => a.created_at.localeCompare(b.created_at) || a.id - b.id,
    );
    list.forEach((row, index) => order.set(row.id, index + 1));
  }
  return {
    ...state,
    bookings: state.bookings.map((row) => ({
      ...row,
      queue_position: order.get(row.id) ?? null,
    })),
  };
}

export function subscribeQueue(listener: () => void): () => void {
  listeners.add(listener);
  if (typeof window !== "undefined") {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) {
        return;
      }
      memory = readStorage() ?? seedState();
      listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }
  return () => {
    listeners.delete(listener);
  };
}

export function listFacilities(): FacilityRecord[] {
  return getState().facilities.map((row) => ({ ...row }));
}

export function getFacility(facilityId: number): FacilityRecord | null {
  const row = getState().facilities.find((item) => item.id === facilityId);
  return row ? { ...row } : null;
}

export function listBookingsForFacility(facilityId: number): QueueBooking[] {
  const state = recomputePositions(getState());
  memory = state;
  return state.bookings
    .filter((row) => row.facility_id === facilityId)
    .sort((a, b) => {
      const aOpen = a.status === "booked" ? 0 : 1;
      const bOpen = b.status === "booked" ? 0 : 1;
      if (aOpen !== bOpen) {
        return aOpen - bOpen;
      }
      return a.created_at.localeCompare(b.created_at) || a.id - b.id;
    })
    .map(snapshotBooking);
}

export function getBookingByCode(code: string): QueueBooking | null {
  const needle = code.trim().toUpperCase();
  const state = recomputePositions(getState());
  memory = state;
  const row = state.bookings.find((item) => item.code.toUpperCase() === needle);
  return row ? snapshotBooking(row) : null;
}

export function patchFacilityWait(facilityId: number, waitCount: number): number {
  if (!Number.isInteger(waitCount) || waitCount < 0) {
    throw new Error("People waiting must be zero or more.");
  }
  const state = getState();
  const facilities = state.facilities.map((row) =>
    row.id === facilityId ? { ...row, wait_count: waitCount } : row,
  );
  if (!facilities.some((row) => row.id === facilityId)) {
    throw new Error("No facility is bound to this staff session.");
  }
  setState({ ...state, facilities });
  return waitCount;
}

export function markBookingTerminal(
  bookingId: number,
  facilityId: number,
  status: "arrived" | "no_show",
): { booking: QueueBooking; wait_count: number } {
  const state = getState();
  const booking = state.bookings.find(
    (row) => row.id === bookingId && row.facility_id === facilityId,
  );
  if (!booking) {
    throw new Error("No booking at this facility matches that id.");
  }
  const facility = state.facilities.find((row) => row.id === facilityId);
  if (!facility) {
    throw new Error("No facility is bound to this staff session.");
  }
  if (booking.status === status) {
    const positioned = recomputePositions(state);
    memory = positioned;
    const current = positioned.bookings.find((row) => row.id === bookingId);
    return {
      booking: snapshotBooking(current ?? booking),
      wait_count: facility.wait_count,
    };
  }
  if (booking.status !== "booked") {
    throw new Error(
      `Booking is already ${booking.status}; it cannot be marked ${status}.`,
    );
  }
  const nextWait =
    booking.booking_kind === "instant" && facility.wait_count > 0
      ? facility.wait_count - 1
      : facility.wait_count;
  const next: StoreState = {
    ...state,
    serving: clearServingForBooking(state.serving, bookingId),
    called_log: [
      {
        booking_id: bookingId,
        code: booking.code,
        station_id:
          Object.entries(state.serving).find(([, id]) => id === bookingId)?.[0] ??
          "desk",
        called_at: new Date().toISOString(),
        outcome: status,
      },
      ...state.called_log,
    ].slice(0, 30),
    facilities: state.facilities.map((row) =>
      row.id === facilityId ? { ...row, wait_count: nextWait } : row,
    ),
    bookings: state.bookings.map((row) =>
      row.id === bookingId
        ? { ...row, status, queue_position: null }
        : row,
    ),
  };
  const positioned = recomputePositions(next);
  setState(positioned);
  const updated = positioned.bookings.find((row) => row.id === bookingId);
  return {
    booking: snapshotBooking(updated ?? booking),
    wait_count: nextWait,
  };
}

export function getServingMap(): Record<string, number | null> {
  return { ...getState().serving };
}

export function getCalledLog(): CalledEntry[] {
  return getState().called_log.map((row) => ({ ...row }));
}

export function assignBookingDepartment(
  bookingId: number,
  facilityId: number,
  departmentId: number | null,
): QueueBooking {
  if (departmentId != null && !getDepartment(departmentId)) {
    throw new Error("That department is not on this desk.");
  }
  const state = getState();
  const booking = state.bookings.find(
    (row) => row.id === bookingId && row.facility_id === facilityId,
  );
  if (!booking) {
    throw new Error("No booking at this facility matches that id.");
  }
  if (booking.status !== "booked") {
    throw new Error("Only open bookings can be assigned a department.");
  }
  const queuedAt = new Date().toISOString();
  const next: StoreState = {
    ...state,
    serving: clearServingForBooking(state.serving, bookingId),
    bookings: state.bookings.map((row) =>
      row.id === bookingId
        ? {
            ...row,
            department_id: departmentId,
            desk_queued_at:
              departmentId !== booking.department_id
                ? queuedAt
                : row.desk_queued_at,
          }
        : row,
    ),
  };
  const positioned = recomputePositions(next);
  setState(positioned);
  const updated = positioned.bookings.find((row) => row.id === bookingId);
  return snapshotBooking(updated ?? { ...booking, department_id: departmentId });
}

export function transferBooking(
  bookingId: number,
  facilityId: number,
  input: { departmentId: number; stationId: string | null },
): { booking: QueueBooking; placed: "queue" | "station" } {
  const dept = getDepartment(input.departmentId);
  if (!dept) {
    throw new Error("That department is not on this desk.");
  }
  if (
    input.stationId &&
    !dept.stations.some((station) => station.id === input.stationId)
  ) {
    throw new Error("That room is not in the chosen department.");
  }
  const state = getState();
  const booking = state.bookings.find(
    (row) => row.id === bookingId && row.facility_id === facilityId,
  );
  if (!booking) {
    throw new Error("No booking at this facility matches that id.");
  }
  if (booking.status !== "booked") {
    throw new Error("Only an open ticket can be sent onwards.");
  }
  const fromStation =
    Object.entries(state.serving).find(([, id]) => id === bookingId)?.[0] ??
    "desk";
  if (input.stationId && input.stationId === fromStation) {
    throw new Error("They are already at that room.");
  }
  const now = new Date().toISOString();
  const stationFree =
    input.stationId != null &&
    (state.serving[input.stationId] == null ||
      state.serving[input.stationId] === bookingId);
  const placed: "queue" | "station" = stationFree ? "station" : "queue";
  let serving = clearServingForBooking(state.serving, bookingId);
  if (placed === "station" && input.stationId) {
    serving = { ...serving, [input.stationId]: bookingId };
  }
  const next: StoreState = {
    ...state,
    serving,
    called_log: [
      {
        booking_id: bookingId,
        code: booking.code,
        station_id: fromStation,
        called_at: now,
        outcome: "transferred",
      },
      ...state.called_log,
    ].slice(0, 30),
    bookings: state.bookings.map((row) =>
      row.id === bookingId
        ? {
            ...row,
            department_id: input.departmentId,
            desk_queued_at: now,
          }
        : row,
    ),
  };
  const positioned = recomputePositions(next);
  setState(positioned);
  const updated = positioned.bookings.find((row) => row.id === bookingId);
  return {
    booking: snapshotBooking(
      updated ?? { ...booking, department_id: input.departmentId, desk_queued_at: now },
    ),
    placed,
  };
}

export function sortStationQueue(
  bookings: QueueBooking[],
  departmentId: number | null,
): QueueBooking[] {
  const waiting = bookings.filter(
    (row) =>
      row.status === "booked" &&
      (departmentId == null
        ? row.department_id == null
        : row.department_id === departmentId),
  );
  const kind =
    departmentId == null
      ? "arrival"
      : (getDepartment(departmentId)?.queue_kind ?? "arrival");
  return sortDeptQueue(waiting, kind);
}

export function callNextAtStation(
  facilityId: number,
  departmentId: number,
  stationId: string,
): QueueBooking | null {
  const dept = getDepartment(departmentId);
  if (!dept || !dept.stations.some((station) => station.id === stationId)) {
    throw new Error("That station is not on this desk.");
  }
  const state = getState();
  const current = state.serving[stationId];
  if (current != null) {
    const already = state.bookings.find((row) => row.id === current);
    return already ? snapshotBooking(already) : null;
  }
  const servingIds = new Set(
    Object.values(state.serving).filter((id): id is number => id != null),
  );
  const waiting = sortStationQueue(
    state.bookings.filter((row) => row.facility_id === facilityId),
    departmentId,
  ).filter((row) => !servingIds.has(row.id));
  const next = waiting[0];
  if (!next) {
    return null;
  }
  setState({
    ...state,
    serving: { ...state.serving, [stationId]: next.id },
    called_log: [
      {
        booking_id: next.id,
        code: next.code,
        station_id: stationId,
        called_at: new Date().toISOString(),
        outcome: "called",
      },
      ...state.called_log,
    ].slice(0, 30),
  });
  return snapshotBooking(next);
}

export function createInstantBooking(input: {
  facilityId: number;
  given_name: string | null;
  family_name: string | null;
  phone_last4: string;
  symptom_slugs: string[];
  patient_free_text: string | null;
  red_flag_applied: boolean;
}): QueueBooking {
  const state = getState();
  const facility = state.facilities.find((row) => row.id === input.facilityId);
  if (!facility) {
    throw new Error("That facility is not available.");
  }
  const id = state.nextId;
  const booking: QueueBooking = {
    id,
    facility_id: input.facilityId,
    code: `CF-${String(id).padStart(3, "0")}`,
    status: "booked",
    booking_kind: "instant",
    queue_position: null,
    created_at: new Date().toISOString(),
    given_name: input.given_name,
    family_name: input.family_name,
    phone_last4: input.phone_last4,
    symptom_slugs: [...input.symptom_slugs],
    patient_free_text: input.patient_free_text,
    red_flag_applied: input.red_flag_applied,
    department_id: null,
    desk_queued_at: new Date().toISOString(),
  };
  const next: StoreState = {
    nextId: id + 1,
    serving: state.serving,
    called_log: state.called_log,
    facilities: state.facilities.map((row) =>
      row.id === input.facilityId
        ? { ...row, wait_count: row.wait_count + 1 }
        : row,
    ),
    bookings: [...state.bookings, booking],
  };
  const positioned = recomputePositions(next);
  setState(positioned);
  const stored = positioned.bookings.find((row) => row.id === id);
  return snapshotBooking(stored ?? booking);
}
