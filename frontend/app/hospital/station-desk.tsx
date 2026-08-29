"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  assignDepartment,
  callNext,
  getHospitalQueue,
  labelForSlug,
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
  HospitalHeader,
  HospitalNav,
  Pill,
  SectionLabel,
  errorMessage,
} from "./hospital-ui";

type StationPick = { departmentId: number; stationId: string };

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

function queueKindLabel(kind: DeskDepartment["queue_kind"]): string {
  return kind === "red_flag_first" ? "Red flag first" : "Arrival order";
}

function queueKindColor(kind: DeskDepartment["queue_kind"]): string {
  return kind === "red_flag_first" ? "#0f8a7e" : "#5b6b79";
}

export function StationDesk() {
  const [queue, setQueue] = useState<HospitalQueueResponse | null>(null);
  const [selected, setSelected] = useState<StationPick | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [meetOpen, setMeetOpen] = useState(false);
  const [sendDeptId, setSendDeptId] = useState<number | null>(null);
  const [sendStationId, setSendStationId] = useState<string | null>(null);

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
    <div className="min-h-dvh">
      <HospitalHeader
        title="CareFlow — Station"
        subtitle={`${queue?.facility.name ?? "Hospital desk"} · this facility only`}
        right={<HospitalNav />}
      />

      {error ? (
        <p
          role="alert"
          className="mx-5 mt-3 rounded-lg border border-[#c63a4d] bg-[#fbeaec] px-4 py-2.5 text-sm text-[#7a2430]"
        >
          {error}
        </p>
      ) : null}

      {busy === "load" && !queue ? (
        <p className="px-5 py-10 text-sm text-[#8fa0af]">Loading station…</p>
      ) : null}

      {queue ? (
        <div className="flex gap-5 overflow-x-auto p-5">
          <aside className="w-64 shrink-0">
            <SectionLabel>Stations — select one to open its screen</SectionLabel>

            {unassigned.length > 0 ? (
              <div className="mb-4 rounded-xl border border-[#dce4ec] bg-[#eaf1f8] px-3 py-2.5">
                <p className="text-xs font-medium text-[#16212c]">
                  Unassigned · {unassigned.length}
                </p>
                <p className="mt-0.5 text-xs text-[#8fa0af]">
                  Assign a department before calling.
                </p>
              </div>
            ) : null}

            <div className="overflow-y-auto pr-1" style={{ maxHeight: "72vh" }}>
              {queue.departments.map((dept) => {
                const waiting = sortStationQueue(queue.bookings, dept.id);
                return (
                  <div key={dept.id} className="mb-4">
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className="text-xs text-[#8fa0af]">{dept.name}</span>
                      <Pill color={queueKindColor(dept.queue_kind)}>
                        {queueKindLabel(dept.queue_kind)}
                      </Pill>
                      <span className="text-xs text-[#8fa0af]">
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
                                ? "border-[#1e63b8] bg-[#1e63b8]/10 text-[#16212c]"
                                : "border-[#dce4ec] bg-[#eaf1f8] text-[#57697a]"
                            }`}
                          >
                            <span>{station.name}</span>
                            {servingCode ? (
                              <span className="font-mono text-[#1e63b8]">
                                {servingCode}
                              </span>
                            ) : (
                              <span className="text-[#8fa0af]">idle</span>
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
            {!selectedStation ? (
              <div className="flex h-full items-center justify-center py-24 text-sm text-[#8fa0af]">
                Select a station on the left to open its queue screen.
              </div>
            ) : (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#8fa0af]">
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

                <Card className="mb-4 bg-[#eaf1f8]">
                  <p className="mb-1.5 text-xs text-[#57697a]">
                    Currently serving
                  </p>
                  {servingBooking ? (
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xl">
                          {servingBooking.code}
                        </span>
                        {servingBooking.red_flag_applied ? (
                          <Pill color="#c63a4d">Red flag</Pill>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm font-medium">
                        {displayName(servingBooking)}
                      </p>
                      <p className="mt-0.5 text-sm text-[#57697a]">
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
                            className="border-[#c63a4d] text-[#c63a4d]"
                          >
                            Did not come
                          </Btn>
                          <Link
                            href={`/hospital/notes?booking_id=${servingBooking.id}`}
                            className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-[#1e63b8]"
                          >
                            Notes
                          </Link>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-xl border border-[#dce4ec] bg-white p-3">
                          <p className="text-sm font-medium">After this stop</p>
                          <p className="mt-1 text-xs text-[#57697a]">
                            Send them to the next desk, or close the ticket when
                            the visit is finished.
                          </p>
                          <p className="mt-3 text-xs text-[#57697a]">
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
                                      ? "border-[#1e63b8] bg-[#1e63b8]/10 text-[#16212c]"
                                      : "border-[#dce4ec] bg-[#eaf1f8] text-[#57697a]"
                                  }`}
                                >
                                  {dept.name}
                                </button>
                              );
                            })}
                          </div>
                          {sendDeptId != null ? (
                            <>
                              <p className="mt-3 text-xs text-[#57697a]">
                                Room or queue
                              </p>
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSendStationId(null)}
                                  className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                                    sendStationId == null
                                      ? "border-[#1e63b8] bg-[#1e63b8]/10 text-[#16212c]"
                                      : "border-[#dce4ec] bg-[#eaf1f8] text-[#57697a]"
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
                                            ? "border-[#1e63b8] bg-[#1e63b8]/10 text-[#16212c]"
                                            : "border-[#dce4ec] bg-[#eaf1f8] text-[#57697a]"
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
                    <p className="text-sm text-[#8fa0af]">Station idle</p>
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
                  {selectedDept?.name} queue — {deptQueue.length} waiting
                </SectionLabel>
                {deptQueue.length === 0 ? (
                  <p className="py-6 text-center text-xs text-[#8fa0af]">
                    Queue empty
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {deptQueue.slice(0, 10).map((booking, index) => (
                      <div
                        key={booking.id}
                        className="flex items-center gap-2 rounded-lg border border-[#dce4ec] bg-white px-3 py-2"
                      >
                        <span className="w-5 text-xs text-[#8fa0af]">
                          {index + 1}
                        </span>
                        <span className="w-14 font-mono text-xs">
                          {booking.code}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {displayName(booking)}
                          </p>
                          <p className="truncate text-xs text-[#8fa0af]">
                            {symptomSummary(booking)}
                          </p>
                        </div>
                        {booking.red_flag_applied ? (
                          <Pill color="#c63a4d">Red flag</Pill>
                        ) : null}
                        <span className="w-10 text-right text-xs text-[#8fa0af]">
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
                      <span className="text-xs text-[#8fa0af]">
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

            {unassigned.length > 0 ? (
              <section className="mt-8">
                <SectionLabel>Unassigned — set department</SectionLabel>
                <ul className="flex flex-col gap-2">
                  {unassigned.map((booking) => (
                    <li key={booking.id}>
                      <Card>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-mono text-sm text-[#1e63b8]">
                              {booking.code}
                            </p>
                            <p className="mt-0.5 font-medium">
                              {displayName(booking)}
                            </p>
                            <p className="text-sm text-[#57697a]">
                              ···{booking.phone_last4} ·{" "}
                              {symptomSummary(booking)}
                            </p>
                          </div>
                          {booking.red_flag_applied ? (
                            <Pill color="#c63a4d">Red flag</Pill>
                          ) : null}
                        </div>
                        <label className="mt-3 block text-xs text-[#57697a]">
                          Department
                          <select
                            className="mt-1 block min-h-11 w-full rounded-lg border border-[#dce4ec] bg-[#eaf1f8] px-3 text-sm"
                            defaultValue=""
                            disabled={Boolean(busy)}
                            onChange={(event) => {
                              const value = Number(event.target.value);
                              if (!Number.isFinite(value) || value < 1) {
                                return;
                              }
                              void onAssign(booking.id, value);
                            }}
                          >
                            <option value="" disabled>
                              Assign department
                            </option>
                            {queue.departments.map((dept) => (
                              <option key={dept.id} value={dept.id}>
                                {dept.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      </Card>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </main>
        </div>
      ) : null}
    </div>
  );
}
