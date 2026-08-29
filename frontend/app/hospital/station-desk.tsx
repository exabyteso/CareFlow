"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  assignDepartment,
  callNext,
  facilityName,
  getHospitalQueue,
  labelForSlug,
  listScheduledBookings,
  lookupDeskTicket,
  markArrived,
  markNoShow,
  sendOnwards,
  sortStationQueue,
  subscribeQueue,
  type DeskDepartment,
  type HospitalQueueResponse,
  type QueueBooking,
} from "@/lib/api/hospital";

import {
  Btn,
  Card,
  HospitalChrome,
  KindPill,
  Pill,
  SectionLabel,
  errorMessage,
} from "./hospital-ui";

type StationPick = { departmentId: number; stationId: string };

const NEW_TICKET_WINDOW_MS = 15 * 60_000;

function displayName(booking: QueueBooking): string {
  const given = booking.given_name?.trim() ?? "";
  const family = booking.family_name?.trim() ?? "";
  const full = `${given} ${family}`.trim();
  if (full) {
    return full;
  }
  return booking.phone_last4 ? `Phone ···${booking.phone_last4}` : "Care-seeker";
}

function symptomSummary(booking: QueueBooking): string {
  const labels = booking.symptom_slugs.map(labelForSlug).join(", ");
  if (labels && booking.patient_free_text) {
    return `${labels} — ${booking.patient_free_text}`;
  }
  return labels || booking.patient_free_text || "No symptom summary";
}

function minutesWaiting(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.max(0, ms / 60_000);
  return `${minutes.toFixed(0)}m`;
}

function isRecentTicket(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) {
    return false;
  }
  return Date.now() - created <= NEW_TICKET_WINDOW_MS;
}

function formatSlotStart(iso: string | null): string {
  if (!iso) {
    return "Time TBC";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function queueKindLabel(kind: DeskDepartment["queue_kind"]): string {
  return kind === "red_flag_first" ? "Red flag first" : "Arrival order";
}

function queueKindColor(kind: DeskDepartment["queue_kind"]): string {
  return kind === "red_flag_first" ? "#0f8a7e" : "#5b6b79";
}

function walkInPosition(booking: QueueBooking): string | null {
  if (booking.booking_kind !== "instant" || booking.queue_position == null) {
    return null;
  }
  return `#${booking.queue_position} in walk-in`;
}

function TicketMeta({ booking }: { booking: QueueBooking }) {
  return (
    <>
      <p className="font-mono text-xl tracking-wide text-cf-ink">{booking.code}</p>
      <p className="mt-1 text-sm font-medium text-cf-ink">
        {facilityName(booking)}
      </p>
      <div className="mt-1.5">
        <BookingFlags booking={booking} />
      </div>
    </>
  );
}

function BookingFlags({ booking }: { booking: QueueBooking }) {
  const recent = isRecentTicket(booking.created_at);
  const position = walkInPosition(booking);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {recent ? <Pill color="#0f8a7e">New</Pill> : null}
      <KindPill kind={booking.booking_kind} />
      {booking.red_flag_applied ? <Pill color="#c63a4d">Red flag</Pill> : null}
      {position ? (
        <span className="text-xs text-cf-muted">{position}</span>
      ) : null}
    </div>
  );
}

function DepartmentSelect({
  booking,
  departments,
  disabled,
  onAssign,
}: {
  booking: QueueBooking;
  departments: DeskDepartment[];
  disabled: boolean;
  onAssign: (bookingId: number, departmentId: number) => void;
}) {
  return (
    <label className="mt-3 block text-xs text-cf-muted">
      Department
      <select
        className="mt-1 block min-h-11 w-full rounded-lg border border-cf-line bg-cf-surface px-3 text-sm"
        key={`${booking.id}-${booking.department_id ?? "none"}`}
        defaultValue={booking.department_id ?? ""}
        disabled={disabled}
        onChange={(event) => {
          const value = Number(event.target.value);
          if (!Number.isFinite(value) || value < 1) {
            return;
          }
          onAssign(booking.id, value);
        }}
      >
        <option value="" disabled>
          Assign department
        </option>
        {departments.map((dept) => (
          <option key={dept.id} value={dept.id}>
            {dept.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function StationDesk() {
  const [queue, setQueue] = useState<HospitalQueueResponse | null>(null);
  const [selected, setSelected] = useState<StationPick | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [meetOpen, setMeetOpen] = useState(false);
  const [sendDeptId, setSendDeptId] = useState<number | null>(null);
  const [sendStationId, setSendStationId] = useState<string | null>(null);
  const [lookupCode, setLookupCode] = useState("");
  const [lookupHit, setLookupHit] = useState<QueueBooking | null>(null);
  const [lookupMiss, setLookupMiss] = useState(false);

  const loadDesk = useCallback(async () => {
    const next = await getHospitalQueue();
    setQueue(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setBusy("load");
    loadDesk()
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(errorMessage(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setBusy(null);
        }
      });
    const unsub = subscribeQueue(() => {
      void loadDesk();
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [loadDesk]);

  const selectedDept = useMemo(
    () =>
      queue?.departments.find((row) => row.id === selected?.departmentId) ??
      null,
    [queue, selected],
  );
  const selectedStation = useMemo(
    () =>
      selectedDept?.stations.find((row) => row.id === selected?.stationId) ??
      null,
    [selectedDept, selected],
  );

  const unassigned = useMemo(
    () => (queue ? sortStationQueue(queue.bookings, null) : []),
    [queue],
  );

  const scheduled = useMemo(
    () => (queue ? listScheduledBookings(queue.bookings) : []),
    [queue],
  );

  const recentUnassignedCount = useMemo(
    () => unassigned.filter((row) => isRecentTicket(row.created_at)).length,
    [unassigned],
  );

  const deptQueue = useMemo(() => {
    if (!queue || selected?.departmentId == null) {
      return [];
    }
    const servingIds = new Set(
      Object.values(queue.serving).filter((id): id is number => id != null),
    );
    return sortStationQueue(queue.bookings, selected.departmentId).filter(
      (row) => !servingIds.has(row.id),
    );
  }, [queue, selected]);

  const servingBooking = useMemo(() => {
    if (!queue || !selectedStation) {
      return null;
    }
    const id = queue.serving[selectedStation.id];
    if (id == null) {
      return null;
    }
    return queue.bookings.find((row) => row.id === id) ?? null;
  }, [queue, selectedStation]);

  useEffect(() => {
    setMeetOpen(false);
    setSendDeptId(null);
    setSendStationId(null);
  }, [servingBooking?.id]);

  const recentCalls = useMemo(() => {
    if (!queue || !selectedStation) {
      return [];
    }
    return queue.called_log.filter(
      (row) => row.station_id === selectedStation.id,
    );
  }, [queue, selectedStation]);

  async function onCallNext() {
    if (!selected) {
      return;
    }
    setError(null);
    setBusy("call");
    try {
      const next = await callNext(selected.departmentId, selected.stationId);
      if (!next) {
        setError("No one is waiting in this department.");
      }
      await loadDesk();
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function onMark(action: "arrived" | "no-show") {
    if (!servingBooking) {
      return;
    }
    setError(null);
    setBusy(action);
    try {
      if (action === "arrived") {
        await markArrived(servingBooking.id);
      } else {
        await markNoShow(servingBooking.id);
      }
      setMeetOpen(false);
      await loadDesk();
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function onSendOnwards() {
    if (!servingBooking || sendDeptId == null) {
      return;
    }
    setError(null);
    setBusy("send");
    try {
      await sendOnwards(
        servingBooking.id,
        sendDeptId,
        sendStationId,
      );
      setMeetOpen(false);
      await loadDesk();
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function onAssign(bookingId: number, departmentId: number) {
    setError(null);
    setBusy(`assign-${bookingId}`);
    try {
      await assignDepartment(bookingId, departmentId);
      await loadDesk();
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  function stationServingCode(stationId: string): string | null {
    const id = queue?.serving[stationId];
    if (id == null) {
      return null;
    }
    return queue?.bookings.find((row) => row.id === id)?.code ?? null;
  }

  return (
    <HospitalChrome
      title="CareFlow — Station"
      subtitle={`${queue?.facility.name ?? "Hospital desk"} · all care-seeker tickets (any hospital they booked)`}
    >
      {error ? (
        <p
          role="alert"
          className="mx-5 mt-3 rounded-lg border border-cf-emergency bg-cf-emergency-bg px-4 py-2.5 text-sm text-cf-emergency"
        >
          {error}
        </p>
      ) : null}

      {busy === "load" && !queue ? (
        <p className="px-5 py-10 text-sm text-cf-muted">Loading station…</p>
      ) : null}

      {queue ? (
        <div className="flex gap-5 overflow-x-auto p-5">
          <aside className="w-64 shrink-0">
            <SectionLabel>Stations — select one to open its screen</SectionLabel>

            <div
              className={`mb-4 rounded-xl border px-3 py-2.5 ${
                recentUnassignedCount > 0
                  ? "border-cf-primary bg-cf-primary/10"
                  : "border-cf-line bg-cf-surface"
              }`}
            >
              <p className="text-xs font-medium text-cf-ink">
                New tickets · {unassigned.length}
              </p>
              <p className="mt-0.5 text-xs text-cf-muted">
                {unassigned.length === 0
                  ? "Walk-ins land here after booking."
                  : "Assign a department before calling."}
              </p>
            </div>

            <div className="overflow-y-auto pr-1" style={{ maxHeight: "72vh" }}>
              {queue.departments.map((dept) => {
                const waiting = sortStationQueue(queue.bookings, dept.id);
                return (
                  <div key={dept.id} className="mb-4">
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className="text-xs text-cf-muted">{dept.name}</span>
                      <Pill color={queueKindColor(dept.queue_kind)}>
                        {queueKindLabel(dept.queue_kind)}
                      </Pill>
                      <span className="text-xs text-cf-muted">
                        {waiting.length}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {dept.stations.map((station) => {
                        const servingCode = stationServingCode(station.id);
                        const isSel =
                          selected?.stationId === station.id &&
                          selected.departmentId === dept.id;
                        return (
                          <button
                            key={station.id}
                            type="button"
                            onClick={() =>
                              setSelected({
                                departmentId: dept.id,
                                stationId: station.id,
                              })
                            }
                            className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-left text-xs ${
                              isSel
                                ? "border-cf-primary bg-cf-primary/10 text-cf-ink"
                                : "border-cf-line bg-cf-surface text-cf-muted"
                            }`}
                          >
                            <span>{station.name}</span>
                            {servingCode ? (
                              <span className="font-mono text-cf-primary">
                                {servingCode}
                              </span>
                            ) : (
                              <span className="text-cf-muted">idle</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          <main className="min-w-0 flex-1">
            <form
              className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end"
              onSubmit={(event) => {
                event.preventDefault();
                const found = lookupDeskTicket(lookupCode);
                setLookupHit(found);
                setLookupMiss(!found);
              }}
            >
              <label className="min-w-0 flex-1 text-xs text-cf-muted">
                Find ticket
                <input
                  value={lookupCode}
                  onChange={(event) => {
                    setLookupCode(event.target.value);
                    setLookupMiss(false);
                  }}
                  placeholder="e.g. CF-119"
                  className="mt-1 block min-h-11 w-full rounded-lg border border-cf-line bg-cf-surface px-3 font-mono text-sm uppercase"
                  autoCapitalize="characters"
                  autoComplete="off"
                />
              </label>
              <Btn type="submit" disabled={!lookupCode.trim()}>
                Look up
              </Btn>
            </form>
            {lookupMiss ? (
              <p className="mb-6 text-sm text-cf-emergency" role="alert">
                No ticket matches that code.
              </p>
            ) : null}
            {lookupHit ? (
              <Card className="mb-6 ring-1 ring-cf-primary">
                <TicketMeta booking={lookupHit} />
                <p className="mt-1.5 font-medium">{displayName(lookupHit)}</p>
                <p className="text-sm text-cf-muted">
                  ···{lookupHit.phone_last4} · {symptomSummary(lookupHit)}
                </p>
                {lookupHit.status !== "booked" ? (
                  <p className="mt-2 text-xs capitalize text-cf-muted">
                    Status: {lookupHit.status.replace("_", " ")}
                  </p>
                ) : null}
              </Card>
            ) : null}

            <section className="mb-6">
              <SectionLabel>
                New tickets — unassigned walk-ins · {unassigned.length}
              </SectionLabel>
              {unassigned.length === 0 ? (
                <p className="rounded-xl border border-dashed border-cf-line bg-cf-surface px-4 py-3 text-sm text-cf-muted">
                  New care-seeker walk-ins appear here after they confirm
                  booking.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {unassigned.map((booking) => (
                    <li key={booking.id}>
                      <Card
                        className={
                          isRecentTicket(booking.created_at)
                            ? "bg-cf-primary/5 ring-1 ring-cf-primary"
                            : ""
                        }
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <TicketMeta booking={booking} />
                            <p className="mt-1.5 font-medium">
                              {displayName(booking)}
                            </p>
                            <p className="text-sm text-cf-muted">
                              ···{booking.phone_last4} ·{" "}
                              {symptomSummary(booking)}
                            </p>
                          </div>
                        </div>
                        <DepartmentSelect
                          booking={booking}
                          departments={queue.departments}
                          disabled={Boolean(busy)}
                          onAssign={(id, deptId) => void onAssign(id, deptId)}
                        />
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="mb-6">
              <SectionLabel>
                Scheduled appointments · {scheduled.length}
              </SectionLabel>
              <p className="mb-2 text-xs text-cf-muted">
                Scheduled visits — not the walk-in queue. Call next only pulls
                assigned walk-ins.
              </p>
              {scheduled.length === 0 ? (
                <p className="rounded-xl border border-dashed border-cf-line bg-cf-surface px-4 py-3 text-sm text-cf-muted">
                  No upcoming booked appointments.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {scheduled.map((booking) => (
                    <li key={booking.id}>
                      <Card>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <TicketMeta booking={booking} />
                            <p className="mt-1.5 font-medium">
                              {displayName(booking)}
                            </p>
                            <p className="text-sm text-cf-muted">
                              ···{booking.phone_last4} ·{" "}
                              {formatSlotStart(booking.slot_start)}
                            </p>
                            <p className="mt-0.5 text-sm text-cf-muted">
                              {symptomSummary(booking)}
                            </p>
                          </div>
                        </div>
                        <DepartmentSelect
                          booking={booking}
                          departments={queue.departments}
                          disabled={Boolean(busy)}
                          onAssign={(id, deptId) => void onAssign(id, deptId)}
                        />
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {!selectedStation ? (
              <p className="rounded-xl border border-cf-line bg-cf-surface px-4 py-3 text-sm text-cf-muted">
                Select a station on the left to open Call next, mark met, and
                the walk-in queue.
              </p>
            ) : (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-cf-muted">
                      {queue.facility.name} · {selectedDept?.name}
                    </p>
                    <h1 className="text-xl font-semibold tracking-tight">
                      {selectedStation.name}
                    </h1>
                  </div>
                  {selectedDept ? (
                    <Pill color={queueKindColor(selectedDept.queue_kind)}>
                      {queueKindLabel(selectedDept.queue_kind)}
                    </Pill>
                  ) : null}
                </div>

                <Card className="mb-4 bg-cf-surface">
                  <p className="mb-1.5 text-xs text-cf-muted">
                    Currently serving
                  </p>
                  {servingBooking ? (
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xl">
                          {servingBooking.code}
                        </span>
                        <BookingFlags booking={servingBooking} />
                      </div>
                      <p className="mt-1 text-sm font-medium">
                        {displayName(servingBooking)}
                      </p>
                      <p className="mt-0.5 text-sm text-cf-muted">
                        ···{servingBooking.phone_last4} ·{" "}
                        {symptomSummary(servingBooking)}
                      </p>
                      {!meetOpen ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Btn
                            disabled={Boolean(busy)}
                            onClick={() => setMeetOpen(true)}
                          >
                            Mark as met
                          </Btn>
                          <Btn
                            variant="ghost"
                            disabled={Boolean(busy)}
                            onClick={() => void onMark("no-show")}
                            className="border-cf-emergency text-cf-emergency"
                          >
                            Did not come
                          </Btn>
                          <Link
                            href={`/hospital/notes?bookingId=${servingBooking.id}`}
                            className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-cf-primary"
                          >
                            Notes
                          </Link>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-xl border border-cf-line bg-white p-3">
                          <p className="text-sm font-medium">After this stop</p>
                          <p className="mt-1 text-xs text-cf-muted">
                            Send them to the next desk, or close the ticket when
                            the visit is finished.
                          </p>
                          <p className="mt-3 text-xs text-cf-muted">
                            Next desk
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {queue.departments.map((dept) => {
                              const active = sendDeptId === dept.id;
                              return (
                                <button
                                  key={dept.id}
                                  type="button"
                                  onClick={() => {
                                    setSendDeptId(dept.id);
                                    setSendStationId(null);
                                  }}
                                  className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                                    active
                                      ? "border-cf-primary bg-cf-primary/10 text-cf-ink"
                                      : "border-cf-line bg-cf-surface text-cf-muted"
                                  }`}
                                >
                                  {dept.name}
                                </button>
                              );
                            })}
                          </div>
                          {sendDeptId != null ? (
                            <>
                              <p className="mt-3 text-xs text-cf-muted">
                                Room or queue
                              </p>
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSendStationId(null)}
                                  className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                                    sendStationId == null
                                      ? "border-cf-primary bg-cf-primary/10 text-cf-ink"
                                      : "border-cf-line bg-cf-surface text-cf-muted"
                                  }`}
                                >
                                  Join queue
                                </button>
                                {queue.departments
                                  .find((dept) => dept.id === sendDeptId)
                                  ?.stations.map((station) => {
                                    const occupied =
                                      queue.serving[station.id] != null &&
                                      queue.serving[station.id] !==
                                        servingBooking.id;
                                    const active =
                                      sendStationId === station.id;
                                    return (
                                      <button
                                        key={station.id}
                                        type="button"
                                        onClick={() =>
                                          setSendStationId(station.id)
                                        }
                                        className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                                          active
                                            ? "border-cf-primary bg-cf-primary/10 text-cf-ink"
                                            : "border-cf-line bg-cf-surface text-cf-muted"
                                        }`}
                                      >
                                        {station.name}
                                        {occupied ? " · busy" : ""}
                                      </button>
                                    );
                                  })}
                              </div>
                            </>
                          ) : null}
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Btn
                              disabled={Boolean(busy) || sendDeptId == null}
                              onClick={() => void onSendOnwards()}
                            >
                              Send onwards
                            </Btn>
                            <Btn
                              variant="ghost"
                              disabled={Boolean(busy)}
                              onClick={() => void onMark("arrived")}
                            >
                              Visit complete
                            </Btn>
                            <Btn
                              variant="ghost"
                              disabled={Boolean(busy)}
                              onClick={() => {
                                setMeetOpen(false);
                                setSendDeptId(null);
                                setSendStationId(null);
                              }}
                            >
                              Back
                            </Btn>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-cf-muted">Station idle</p>
                  )}
                </Card>

                <Btn
                  className="mb-5"
                  disabled={Boolean(busy) || Boolean(servingBooking) || deptQueue.length === 0}
                  onClick={() => void onCallNext()}
                >
                  Call next
                </Btn>

                <SectionLabel>
                  {selectedDept?.name} walk-in queue — {deptQueue.length} waiting
                </SectionLabel>
                {deptQueue.length === 0 ? (
                  <p className="py-6 text-center text-xs text-cf-muted">
                    Queue empty
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {deptQueue.slice(0, 10).map((booking, index) => (
                      <div
                        key={booking.id}
                        className="flex items-center gap-2 rounded-lg border border-cf-line bg-white px-3 py-2"
                      >
                        <span className="w-5 text-xs text-cf-muted">
                          {index + 1}
                        </span>
                        <span className="w-14 font-mono text-xs">
                          {booking.code}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {displayName(booking)}
                          </p>
                          <p className="truncate text-xs text-cf-muted">
                            {symptomSummary(booking)}
                          </p>
                        </div>
                        <BookingFlags booking={booking} />
                        <span className="w-10 text-right text-xs text-cf-muted">
                          {minutesWaiting(booking.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6">
                  <SectionLabel>This station&apos;s recent calls</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {recentCalls.length === 0 ? (
                      <span className="text-xs text-cf-muted">
                        Nothing called yet.
                      </span>
                    ) : (
                      recentCalls.map((row) => (
                        <Pill
                          key={`${row.booking_id}-${row.called_at}`}
                          color={
                            row.outcome === "no_show"
                              ? "#c63a4d"
                              : row.outcome === "arrived"
                                ? "#0f8a7e"
                                : row.outcome === "transferred"
                                  ? "#b8790a"
                                  : "#1e63b8"
                          }
                        >
                          {row.code}
                        </Pill>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      ) : null}
    </HospitalChrome>
  );
}
