"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import {
  getHospitalQueue,
  patchWaitCount,
  subscribeQueue,
  type HospitalQueueResponse,
} from "@/lib/api/hospital";

import {
  Btn,
  Card,
  HospitalChrome,
  Pill,
  SectionLabel,
  errorMessage,
} from "./hospital-ui";

function queueKindLabel(kind: "arrival" | "red_flag_first"): string {
  return kind === "red_flag_first" ? "Red flag first" : "Arrival order";
}

export function FacilityConfig() {
  const [queue, setQueue] = useState<HospitalQueueResponse | null>(null);
  const [waitDraft, setWaitDraft] = useState("0");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDesk = useCallback(async () => {
    const next = await getHospitalQueue();
    setQueue(next);
    setWaitDraft(String(next.facility.wait_count));
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

  async function onSaveWait(event: FormEvent) {
    event.preventDefault();
    const parsed = Number.parseInt(waitDraft, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("People waiting must be zero or more.");
      return;
    }
    setError(null);
    setBusy("wait");
    try {
      const next = await patchWaitCount(parsed);
      setQueue((current) =>
        current
          ? {
              ...current,
              facility: { ...current.facility, wait_count: next.wait_count },
            }
          : current,
      );
      setWaitDraft(String(next.wait_count));
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <HospitalChrome
      title="CareFlow — Facility config"
      subtitle={`${queue?.facility.name ?? "Hospital desk"} · people waiting and station roster`}
    >
      {error ? (
        <p
          role="alert"
          className="mx-4 mt-3 rounded-lg border border-cf-emergency bg-cf-emergency-bg px-4 py-2.5 text-sm text-cf-emergency md:mx-5"
        >
          {error}
        </p>
      ) : null}

      {busy === "load" && !queue ? (
        <p className="px-4 py-10 text-sm text-cf-muted md:px-5">Loading config…</p>
      ) : null}

      {queue ? (
        <div className="grid grid-cols-1 gap-6 p-4 md:p-5 lg:grid-cols-2">
          <section>
            <SectionLabel>People waiting — ranking input</SectionLabel>
            <Card>
              <p className="text-xs text-cf-muted">{queue.facility.kmhfr_code}</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">
                {queue.facility.wait_count}
              </p>
              <p className="mt-1 text-sm text-cf-muted">
                Include walk-ins. This number can differ from the CareFlow
                station list.
              </p>
              <form
                className="mt-4 flex flex-wrap items-end gap-3"
                onSubmit={onSaveWait}
              >
                <div>
                  <label className="text-sm font-medium" htmlFor="wait-count">
                    Update wait
                  </label>
                  <input
                    id="wait-count"
                    type="number"
                    min={0}
                    step={1}
                    value={waitDraft}
                    onChange={(event) => setWaitDraft(event.target.value)}
                    className="mt-1 block min-h-11 w-28 rounded-lg border border-cf-line bg-cf-surface px-3 text-base tabular-nums"
                  />
                </div>
                <Btn type="submit" disabled={busy === "wait"}>
                  {busy === "wait" ? "Saving…" : "Save wait"}
                </Btn>
              </form>
            </Card>
          </section>

          <section>
            <SectionLabel>Departments — this facility</SectionLabel>
            <div className="flex flex-col gap-2">
              {queue.departments.map((dept) => (
                <Card key={dept.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{dept.name}</p>
                    <p className="text-xs text-cf-muted">
                      {dept.stations.map((station) => station.name).join(" · ")}
                    </p>
                  </div>
                  <Pill
                    color={
                      dept.queue_kind === "red_flag_first" ? "#0f8a7e" : "#5b6b79"
                    }
                  >
                    {queueKindLabel(dept.queue_kind)}
                  </Pill>
                </Card>
              ))}
            </div>
            <p className="mt-3 text-xs text-cf-muted">
              Emergency and triage call red-flag tickets first, then by arrival.
              Other desks call by arrival. Staff assign unassigned tickets on
              Station. Department is not chosen by the care-seeker.
            </p>
          </section>
        </div>
      ) : null}
    </HospitalChrome>
  );
}
