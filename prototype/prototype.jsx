import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Siren, Baby, Activity, Accessibility, User, Monitor, Smartphone,
  Settings, QrCode, Clock, ChevronRight, Check, RotateCcw, ArrowRight,
  MapPin, Layers, AlertTriangle, X, PhoneCall, Radio
} from "lucide-react";

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const T = {
  bg: "#0D1418",
  panel: "#141C21",
  panelAlt: "#1B252B",
  border: "#26323A",
  borderLight: "#324049",
  text: "#E7ECEC",
  textDim: "#8FA1A8",
  textFaint: "#5A6B72",
  amber: "#E0A63D",
  teal: "#3FA9A0",
  red: "#D6455B",
  redDim: "#5A2530",
  slate: "#6B7D86",
};

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');`;

const SIM_SECONDS_PER_MINUTE = 4; // 1 simulated minute = 4 real seconds, so aging is visible

// ---------------------------------------------------------------------------
// Default facility configuration (what an "agnostic" system loads per-tenant)
// ---------------------------------------------------------------------------
const DEFAULT_CLASSES = [
  { code: "EMERGENCY", label: "Emergency / Ambulance", icon: Siren, baseWeight: 999, agingRate: 0, bypass: true, color: T.red },
  { code: "PREGNANT", label: "Pregnancy (labor / high-risk)", icon: Baby, baseWeight: 130, agingRate: 3, bypass: false, color: T.amber },
  { code: "INJURY", label: "Injury / trauma", icon: Activity, baseWeight: 110, agingRate: 3, bypass: false, color: T.amber },
  { code: "ELDERLY", label: "Elderly / disability", icon: Accessibility, baseWeight: 60, agingRate: 3, bypass: false, color: T.teal },
  { code: "STANDARD", label: "Standard", icon: User, baseWeight: 10, agingRate: 4, bypass: false, color: T.slate },
];

function stationsFor(deptId, n, label = "Counter") {
  return Array.from({ length: n }, (_, i) => ({ id: `${deptId}-s${i + 1}`, name: `${label} ${i + 1}` }));
}

// Every wing offers the same set of station types — capacity/throughput can differ per wing,
// but availability doesn't. This is what "hospital-agnostic" means at the config layer.
const DEPARTMENT_TEMPLATES = [
  { key: "reg", name: "Registration", queueType: "fifo", avgServiceMin: 3, stationLabel: "Counter" },
  { key: "triage", name: "Triage", queueType: "biased", avgServiceMin: 5, stationLabel: "Bay" },
  { key: "consult", name: "Outpatient Consult", queueType: "biased", avgServiceMin: 9, stationLabel: "Room" },
  { key: "pharmacy", name: "Pharmacy", queueType: "fifo", avgServiceMin: 4, stationLabel: "Counter" },
  { key: "billing", name: "Billing", queueType: "fifo", avgServiceMin: 5, stationLabel: "Counter" },
  { key: "icu", name: "ICU", queueType: "biased", avgServiceMin: 45, stationLabel: "Bay" },
  { key: "surgery", name: "Surgery (OR)", queueType: "biased", avgServiceMin: 90, stationLabel: "OR" },
  { key: "ward", name: "Ward", queueType: "fifo", avgServiceMin: 20, stationLabel: "Bed block" },
];

function buildWing(wingId, name, { stationCounts, capacities }) {
  return {
    id: wingId,
    name,
    departments: DEPARTMENT_TEMPLATES.map((t) => {
      const id = `${wingId}-${t.key}`;
      return {
        id,
        name: t.name,
        queueType: t.queueType,
        avgServiceMin: t.avgServiceMin,
        windowCapacity: capacities[t.key],
        stations: stationsFor(id, stationCounts[t.key], t.stationLabel),
      };
    }),
  };
}

const DEFAULT_WINGS = [
  buildWing("public", "Public Wing", {
    stationCounts: { reg: 3, triage: 2, consult: 3, pharmacy: 2, billing: 2, icu: 3, surgery: 2, ward: 4 },
    capacities: { reg: 14, triage: 10, consult: 9, pharmacy: 16, billing: 8, icu: 4, surgery: 3, ward: 6 },
  }),
  buildWing("private", "Private Wing", {
    stationCounts: { reg: 1, triage: 1, consult: 2, pharmacy: 1, billing: 1, icu: 2, surgery: 1, ward: 2 },
    capacities: { reg: 8, triage: 6, consult: 6, pharmacy: 8, billing: 6, icu: 3, surgery: 2, ward: 4 },
  }),
];

const EMERGENCY_CATEGORIES = ["Cardiac arrest", "Major trauma", "Stroke", "Obstetric emergency", "Respiratory distress", "Other critical"];

function genCode(n) {
  return `T-${String(n).padStart(3, "0")}`;
}

function scoreOf(ticket, classes, now) {
  const cls = classes.find((c) => c.code === ticket.priorityCode) || classes[classes.length - 1];
  const elapsedSec = (now - ticket.issuedAt) / 1000;
  const minutesWaited = elapsedSec / SIM_SECONDS_PER_MINUTE;
  return {
    score: cls.baseWeight + cls.agingRate * minutesWaited,
    minutesWaited,
    cls,
  };
}

// ---------------------------------------------------------------------------
// Shared UI atoms
// ---------------------------------------------------------------------------
function Pill({ children, color, dim }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        color: dim ? T.textDim : color || T.text,
        background: dim ? "transparent" : `${color}22`,
        border: `1px solid ${dim ? T.border : color + "55"}`,
        fontFamily: "Inter, sans-serif",
      }}
    >
      {children}
    </span>
  );
}

function Card({ children, style, className = "" }) {
  return (
    <div
      className={`rounded-xl p-4 ${className}`}
      style={{ background: T.panel, border: `1px solid ${T.border}`, ...style }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div
      className="text-xs uppercase tracking-wider mb-2"
      style={{ color: T.textFaint, fontFamily: "Inter, sans-serif", letterSpacing: "0.08em" }}
    >
      {children}
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", disabled, className = "" }) {
  const styles = {
    primary: { background: T.teal, color: "#0D1418", border: `1px solid ${T.teal}` },
    ghost: { background: "transparent", color: T.text, border: `1px solid ${T.borderLight}` },
    danger: { background: T.red, color: "#0D1418", border: `1px solid ${T.red}` },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-opacity ${disabled ? "opacity-40 cursor-not-allowed" : "hover:opacity-80"} ${className}`}
      style={{ ...styles[variant], fontFamily: "Inter, sans-serif" }}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------
export default function HospitalTicketingPrototype() {
  const [tab, setTab] = useState("kiosk");
  const [classes, setClasses] = useState(DEFAULT_CLASSES);
  const [wings, setWings] = useState(DEFAULT_WINGS);
  const [tickets, setTickets] = useState([]);
  const [calledLog, setCalledLog] = useState([]);
  const [now, setNow] = useState(Date.now());
  const counterRef = useRef(1);
  const [alertBanner, setAlertBanner] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!alertBanner) return;
    const t = setTimeout(() => setAlertBanner(null), 4500);
    return () => clearTimeout(t);
  }, [alertBanner]);

  const allDepartments = useMemo(
    () => wings.flatMap((w) => w.departments.map((d) => ({ ...d, wingId: w.id, wingName: w.name }))),
    [wings]
  );

  function issueTicket({ wingId, deptId, priorityCode, source }) {
    const id = counterRef.current++;
    const cls = classes.find((c) => c.code === priorityCode);
    const ticket = {
      id,
      code: genCode(id),
      wingId,
      deptId,
      priorityCode,
      issuedAt: Date.now(),
      source,
      status: "waiting",
      provisional: !!cls && !cls.bypass && priorityCode !== "STANDARD",
    };
    setTickets((prev) => [...prev, ticket]);
    return ticket;
  }

  function fastTrackEmergency({ wingId, deptId, stationId, category, source, eta, notes }) {
    const id = counterRef.current++;
    const stationName = allDepartments.find((d) => d.id === deptId)?.stations.find((s) => s.id === stationId)?.name;
    const t = {
      id,
      code: genCode(id),
      wingId,
      deptId,
      priorityCode: "EMERGENCY",
      issuedAt: Date.now(),
      calledAt: Date.now(),
      source: "staff",
      status: "called",
      calledStation: stationId,
      provisional: false,
      category,
      alertSource: source,
      eta,
      notes,
    };
    setTickets((prev) => [...prev, t]);
    setCalledLog((prev) => [t, ...prev].slice(0, 8));
    setAlertBanner(
      `${t.code} — ${category || "Emergency"} paged directly to ${stationName || "station"}. Bypassed queue.${eta ? ` ETA ${eta} min.` : ""}`
    );
  }

  function callNext(deptId, stationId) {
    const dept = allDepartments.find((d) => d.id === deptId);
    const waiting = tickets.filter((t) => t.deptId === deptId && t.status === "waiting");
    if (waiting.length === 0) return;
    let sorted;
    if (dept.queueType === "fifo") {
      sorted = [...waiting].sort((a, b) => a.issuedAt - b.issuedAt);
    } else {
      sorted = [...waiting].sort((a, b) => {
        const sa = scoreOf(a, classes, now).score;
        const sb = scoreOf(b, classes, now).score;
        return sb - sa;
      });
    }
    const next = sorted[0];
    const calledAt = Date.now();
    setTickets((prev) =>
      prev.map((t) => (t.id === next.id ? { ...t, status: "called", calledStation: stationId, calledAt } : t))
    );
    setCalledLog((prev) => [{ ...next, calledStation: stationId, calledAt }, ...prev].slice(0, 8));
  }

  function updateClass(code, patch) {
    setClasses((prev) => prev.map((c) => (c.code === code ? { ...c, ...patch } : c)));
  }

  function updateDept(deptId, patch) {
    setWings((prev) =>
      prev.map((w) => ({
        ...w,
        departments: w.departments.map((d) => (d.id === deptId ? { ...d, ...patch } : d)),
      }))
    );
  }

  function resetSim() {
    setTickets([]);
    setCalledLog([]);
    counterRef.current = 1;
  }

  const TABS = [
    { id: "kiosk", label: "Kiosk", icon: MapPin },
    { id: "app", label: "Patient App", icon: Smartphone },
    { id: "display", label: "Queue Board", icon: Monitor },
    { id: "admin", label: "Facility Config", icon: Settings },
  ];

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.text, fontFamily: "Inter, sans-serif" }}>
      <style>{FONT_IMPORT}</style>

      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${T.border}` }}>
        <div>
          <div className="flex items-center gap-2">
            <Layers size={18} color={T.teal} />
            <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: 17, letterSpacing: "-0.01em" }}>
              Concourse
            </span>
          </div>
          <div className="text-xs mt-0.5" style={{ color: T.textFaint }}>
            Hospital ticketing prototype — sim time: 1 min ≈ {SIM_SECONDS_PER_MINUTE}s
          </div>
        </div>
        <Btn variant="ghost" onClick={resetSim}>
          <span className="flex items-center gap-1.5"><RotateCcw size={13} /> Reset sim</span>
        </Btn>
      </div>

      {/* Alert banner */}
      {alertBanner && (
        <div
          className="mx-5 mt-3 px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm"
          style={{ background: T.redDim, border: `1px solid ${T.red}`, color: "#FFD9DF" }}
        >
          <Siren size={15} /> {alertBanner}
        </div>
      )}

      {/* Tabs */}
      <div className="px-5 pt-4 flex gap-1">
        {TABS.map((tb) => {
          const Icon = tb.icon;
          const active = tab === tb.id;
          return (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg text-sm font-medium"
              style={{
                background: active ? T.panel : "transparent",
                color: active ? T.text : T.textDim,
                borderBottom: active ? `2px solid ${T.teal}` : "2px solid transparent",
              }}
            >
              <Icon size={14} /> {tb.label}
            </button>
          );
        })}
      </div>

      <div className="p-5" style={{ background: T.panel, minHeight: "70vh" }}>
        {tab === "kiosk" && (
          <KioskView wings={wings} classes={classes} onIssue={issueTicket} now={now} />
        )}
        {tab === "app" && (
          <AppView wings={wings} classes={classes} tickets={tickets} onIssue={issueTicket} now={now} />
        )}
        {tab === "display" && (
          <DisplayView
            wings={wings}
            classes={classes}
            tickets={tickets}
            calledLog={calledLog}
            now={now}
            onCallNext={callNext}
            onFastTrack={fastTrackEmergency}
          />
        )}
        {tab === "admin" && (
          <AdminView classes={classes} wings={wings} onUpdateClass={updateClass} onUpdateDept={updateDept} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Kiosk view
// ---------------------------------------------------------------------------
function KioskView({ wings, classes, onIssue, now }) {
  const [wingId, setWingId] = useState(wings[0].id);
  const [deptId, setDeptId] = useState(wings[0].departments[0].id);
  const [priorityCode, setPriorityCode] = useState("STANDARD");
  const [issued, setIssued] = useState(null);

  const wing = wings.find((w) => w.id === wingId);
  const selfDeclareClasses = classes.filter((c) => !c.bypass);

  function handleIssue() {
    const t = onIssue({ wingId, deptId, priorityCode, source: "kiosk" });
    setIssued(t);
  }

  if (issued) {
    const cls = classes.find((c) => c.code === issued.priorityCode);
    return (
      <div className="max-w-sm mx-auto text-center py-10">
        <div className="text-xs mb-2" style={{ color: T.textFaint }}>YOUR TICKET</div>
        <div
          className="text-5xl font-semibold mb-4"
          style={{ fontFamily: "JetBrains Mono, monospace", color: T.text }}
        >
          {issued.code}
        </div>
        <div className="flex items-center justify-center gap-2 mb-1">
          <Pill color={cls.color}>{cls.label}</Pill>
        </div>
        {issued.provisional && (
          <div className="text-xs mt-2 mb-4" style={{ color: T.amber }}>
            Priority is provisional — confirmed by triage staff
          </div>
        )}
        <Card className="mt-6 text-left" style={{ background: T.panelAlt }}>
          <div className="flex items-center gap-2 mb-1">
            <QrCode size={16} color={T.textDim} />
            <span className="text-sm" style={{ color: T.textDim }}>Scan to track from your phone — no account needed</span>
          </div>
          <div className="text-sm mt-2" style={{ color: T.textDim }}>
            Department: <span style={{ color: T.text }}>{wing.departments.find((d) => d.id === issued.deptId)?.name}</span>
          </div>
        </Card>
        <Btn variant="ghost" className="mt-5" onClick={() => setIssued(null)}>New ticket</Btn>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <SectionLabel>Walk-in kiosk</SectionLabel>
      <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 20, fontWeight: 600 }} className="mb-4">
        Where are you headed today?
      </h2>

      <div className="mb-4">
        <div className="text-xs mb-1.5" style={{ color: T.textDim }}>Wing</div>
        <div className="flex gap-2">
          {wings.map((w) => (
            <button
              key={w.id}
              onClick={() => {
                setWingId(w.id);
                setDeptId(w.departments[0].id);
              }}
              className="px-3 py-2 rounded-lg text-sm flex-1"
              style={{
                background: wingId === w.id ? `${T.teal}22` : T.panelAlt,
                border: `1px solid ${wingId === w.id ? T.teal : T.border}`,
                color: wingId === w.id ? T.text : T.textDim,
              }}
            >
              {w.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs mb-1.5" style={{ color: T.textDim }}>Department</div>
        <div className="grid grid-cols-2 gap-2">
          {wing.departments.map((d) => (
            <button
              key={d.id}
              onClick={() => setDeptId(d.id)}
              className="px-3 py-2 rounded-lg text-sm text-left"
              style={{
                background: deptId === d.id ? `${T.teal}22` : T.panelAlt,
                border: `1px solid ${deptId === d.id ? T.teal : T.border}`,
                color: deptId === d.id ? T.text : T.textDim,
              }}
            >
              {d.name}
              <div className="text-xs mt-0.5" style={{ color: T.textFaint }}>{d.queueType === "fifo" ? "First-come, first-served" : "Priority-weighted"}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="text-xs mb-1.5" style={{ color: T.textDim }}>Does any of this apply to you right now?</div>
        <div className="flex flex-col gap-2">
          {selfDeclareClasses.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.code}
                onClick={() => setPriorityCode(c.code)}
                className="px-3 py-2.5 rounded-lg text-sm flex items-center gap-2.5"
                style={{
                  background: priorityCode === c.code ? `${c.color}1f` : T.panelAlt,
                  border: `1px solid ${priorityCode === c.code ? c.color : T.border}`,
                  color: priorityCode === c.code ? T.text : T.textDim,
                }}
              >
                <Icon size={15} color={priorityCode === c.code ? c.color : T.textFaint} />
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <Btn onClick={handleIssue} className="w-full flex items-center justify-center gap-1.5">
        Issue ticket <ArrowRight size={14} />
      </Btn>
      <div className="text-xs mt-3 text-center" style={{ color: T.textFaint }}>
        Arriving by ambulance or a medical emergency in progress? Go straight to staff — do not use the kiosk.
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Patient App view
// ---------------------------------------------------------------------------
function AppView({ wings, classes, tickets, onIssue, now }) {
  const [mode, setMode] = useState("book");
  const [wingId, setWingId] = useState(wings[0].id);
  const [deptId, setDeptId] = useState(wings[0].departments[0].id);
  const [booked, setBooked] = useState(null);
  const [trackCode, setTrackCode] = useState("");

  const wing = wings.find((w) => w.id === wingId);
  const dept = wing.departments.find((d) => d.id === deptId);

  const found = tickets.find((t) => t.code.toLowerCase() === trackCode.trim().toLowerCase());

  return (
    <div className="max-w-sm mx-auto">
      <div className="flex gap-1 mb-5 p-1 rounded-lg" style={{ background: T.panelAlt }}>
        {[
          { id: "book", label: "Book" },
          { id: "track", label: "Track ticket" },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className="flex-1 py-1.5 rounded-md text-sm"
            style={{ background: mode === m.id ? T.panel : "transparent", color: mode === m.id ? T.text : T.textDim }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "book" && !booked && (
        <>
          <SectionLabel>Book an appointment</SectionLabel>
          <div className="flex gap-2 mb-4">
            {wings.map((w) => (
              <button
                key={w.id}
                onClick={() => { setWingId(w.id); setDeptId(w.departments[0].id); }}
                className="px-3 py-2 rounded-lg text-sm flex-1"
                style={{
                  background: wingId === w.id ? `${T.teal}22` : T.panelAlt,
                  border: `1px solid ${wingId === w.id ? T.teal : T.border}`,
                  color: wingId === w.id ? T.text : T.textDim,
                }}
              >
                {w.name}
              </button>
            ))}
          </div>
          <div className="mb-4 flex flex-col gap-2">
            {wing.departments.map((d) => {
              const full = d.windowCapacity <= 0;
              return (
                <button
                  key={d.id}
                  disabled={full}
                  onClick={() => setDeptId(d.id)}
                  className="px-3 py-2.5 rounded-lg text-sm flex items-center justify-between"
                  style={{
                    background: deptId === d.id ? `${T.teal}22` : T.panelAlt,
                    border: `1px solid ${deptId === d.id ? T.teal : T.border}`,
                    color: full ? T.textFaint : deptId === d.id ? T.text : T.textDim,
                    opacity: full ? 0.5 : 1,
                  }}
                >
                  <span>{d.name}</span>
                  <span className="text-xs" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                    {full ? "window full" : `${d.windowCapacity} slots left`}
                  </span>
                </button>
              );
            })}
          </div>
          <Btn
            className="w-full"
            disabled={dept.windowCapacity <= 0}
            onClick={() => {
              onIssue({ wingId, deptId, priorityCode: "STANDARD", source: "app" });
              setBooked(dept);
            }}
          >
            Confirm next available window
          </Btn>
          <div className="text-xs mt-3" style={{ color: T.textFaint }}>
            Slots reflect this department's traffic-window capacity for the current block — booking is disabled once a window fills, rather than overbooking staff.
          </div>
        </>
      )}

      {mode === "book" && booked && (
        <div className="text-center py-8">
          <Check size={28} color={T.teal} className="mx-auto mb-3" />
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 18, fontWeight: 600 }}>Window confirmed</div>
          <div className="text-sm mt-1" style={{ color: T.textDim }}>{booked.name} · {wing.name}</div>
          <div className="text-xs mt-3" style={{ color: T.textFaint }}>
            Tap "I'm on my way" 30 min before your slot to convert this into a live ticket.
          </div>
          <Btn variant="ghost" className="mt-5" onClick={() => setBooked(null)}>Book another</Btn>
        </div>
      )}

      {mode === "track" && (
        <>
          <SectionLabel>Track a ticket</SectionLabel>
          <input
            value={trackCode}
            onChange={(e) => setTrackCode(e.target.value)}
            placeholder="e.g. T-001"
            className="w-full px-3 py-2.5 rounded-lg text-sm mb-4 outline-none"
            style={{ background: T.panelAlt, border: `1px solid ${T.border}`, color: T.text, fontFamily: "JetBrains Mono, monospace" }}
          />
          {trackCode && !found && (
            <div className="text-sm" style={{ color: T.textFaint }}>No ticket found with that code.</div>
          )}
          {found && <TicketStatusCard ticket={found} wings={wings} classes={classes} tickets={tickets} now={now} />}
        </>
      )}
    </div>
  );
}

function TicketStatusCard({ ticket, wings, classes, tickets, now }) {
  const wing = wings.find((w) => w.id === ticket.wingId);
  const dept = wing.departments.find((d) => d.id === ticket.deptId);
  const waiting = tickets.filter((t) => t.deptId === ticket.deptId && t.status === "waiting");
  const sorted =
    dept.queueType === "fifo"
      ? [...waiting].sort((a, b) => a.issuedAt - b.issuedAt)
      : [...waiting].sort((a, b) => scoreOf(b, classes, now).score - scoreOf(a, classes, now).score);
  const position = sorted.findIndex((t) => t.id === ticket.id);
  const cls = classes.find((c) => c.code === ticket.priorityCode);

  return (
    <Card style={{ background: T.panelAlt }}>
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 18 }}>{ticket.code}</span>
        <Pill color={cls.color}>{cls.label}</Pill>
      </div>
      <div className="text-sm" style={{ color: T.textDim }}>{dept.name} · {wing.name}</div>
      {ticket.status === "called" ? (
        <div className="text-sm mt-3 font-medium" style={{ color: T.teal }}>
          You've been called — proceed to {dept.stations.find((s) => s.id === ticket.calledStation)?.name || "the counter"}.
        </div>
      ) : (
        <>
          <div className="text-sm mt-3" style={{ color: T.text }}>
            Position: <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{position + 1}</span> of {sorted.length}
          </div>
          <div className="text-xs mt-1" style={{ color: T.textFaint }}>
            Estimated wait ≈ {Math.max(1, position) * dept.avgServiceMin} min ({dept.queueType === "fifo" ? "FIFO" : "priority-weighted"} queue)
          </div>
        </>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Display / Queue board view (staff-facing)
// ---------------------------------------------------------------------------
function DisplayView({ wings, classes, tickets, calledLog, now, onCallNext, onFastTrack }) {
  const maxScore = Math.max(200, ...classes.map((c) => c.baseWeight));
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [selected, setSelected] = useState(null); // { wingId, deptId, stationId }

  function stationNowServing(deptId, stationId) {
    return calledLog.find((t) => t.deptId === deptId && t.calledStation === stationId);
  }

  const selectedWing = selected && wings.find((w) => w.id === selected.wingId);
  const selectedDept = selectedWing && selectedWing.departments.find((d) => d.id === selected.deptId);
  const selectedStation = selectedDept && selectedDept.stations.find((s) => s.id === selected.stationId);

  const waiting = selectedDept ? tickets.filter((t) => t.deptId === selectedDept.id && t.status === "waiting") : [];
  const sorted = selectedDept
    ? selectedDept.queueType === "fifo"
      ? [...waiting].sort((a, b) => a.issuedAt - b.issuedAt)
      : [...waiting].sort((a, b) => scoreOf(b, classes, now).score - scoreOf(a, classes, now).score)
    : [];

  return (
    <div className="flex gap-5">
      {/* Station directory */}
      <div className="w-64 flex-shrink-0">
        <SectionLabel>Stations — select one to open its screen</SectionLabel>
        <Btn variant="danger" className="w-full mb-3 flex items-center justify-center gap-1.5" onClick={() => setEmergencyOpen(true)}>
          <Siren size={14} /> Ambulance / emergency
        </Btn>
        <div className="overflow-y-auto pr-1" style={{ maxHeight: "72vh" }}>
          {wings.map((w) => (
            <div key={w.id} className="mb-4">
              <div className="text-xs font-medium mb-2" style={{ color: T.textDim }}>{w.name}</div>
              {w.departments.map((d) => (
                <div key={d.id} className="mb-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs" style={{ color: T.textFaint }}>{d.name}</span>
                    <Pill color={d.queueType === "fifo" ? T.slate : T.teal}>{d.queueType === "fifo" ? "FIFO" : "Biased"}</Pill>
                  </div>
                  <div className="flex flex-col gap-1">
                    {d.stations.map((s) => {
                      const serving = stationNowServing(d.id, s.id);
                      const isSel = selected && selected.stationId === s.id && selected.deptId === d.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSelected({ wingId: w.id, deptId: d.id, stationId: s.id })}
                          className="text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between"
                          style={{
                            background: isSel ? `${T.teal}22` : T.panelAlt,
                            border: `1px solid ${isSel ? T.teal : T.border}`,
                            color: isSel ? T.text : T.textDim,
                          }}
                        >
                          <span>{s.name}</span>
                          {serving ? (
                            <span style={{ fontFamily: "JetBrains Mono, monospace", color: T.teal }}>{serving.code}</span>
                          ) : (
                            <span style={{ color: T.textFaint }}>idle</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Selected station screen */}
      <div className="flex-1 min-w-0">
        {!selectedStation && (
          <div className="h-full flex items-center justify-center text-sm py-24" style={{ color: T.textFaint }}>
            Select a station on the left to open its own queue screen.
          </div>
        )}
        {selectedStation && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs" style={{ color: T.textFaint }}>{selectedWing.name} · {selectedDept.name}</div>
                <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 20, fontWeight: 600 }}>{selectedStation.name}</div>
              </div>
              <Pill color={selectedDept.queueType === "fifo" ? T.slate : T.teal}>
                {selectedDept.queueType === "fifo" ? "FIFO queue" : "Biased queue"}
              </Pill>
            </div>

            <Card className="mb-4" style={{ background: T.panelAlt }}>
              <div className="text-xs mb-1.5" style={{ color: T.textDim }}>Currently serving</div>
              {(() => {
                const serving = stationNowServing(selectedDept.id, selectedStation.id);
                if (!serving) return <div className="text-sm" style={{ color: T.textFaint }}>Station idle</div>;
                const cls = classes.find((c) => c.code === serving.priorityCode);
                return (
                  <div className="flex items-center gap-2">
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 20 }}>{serving.code}</span>
                    <Pill color={cls.color}>{cls.label}</Pill>
                  </div>
                );
              })()}
            </Card>

            <Btn onClick={() => onCallNext(selectedDept.id, selectedStation.id)} disabled={sorted.length === 0} className="mb-5">
              Call next
            </Btn>

            <SectionLabel>{selectedDept.name} queue — {sorted.length} waiting</SectionLabel>
            {sorted.length === 0 && (
              <div className="text-xs py-6 text-center" style={{ color: T.textFaint }}>Queue empty</div>
            )}
            <div className="flex flex-col gap-1.5">
              {sorted.slice(0, 10).map((t, i) => {
                const { score, minutesWaited, cls } = scoreOf(t, classes, now);
                const pct = Math.min(100, (score / maxScore) * 100);
                return (
                  <div key={t.id} className="flex items-center gap-2">
                    <span className="text-xs w-5" style={{ color: T.textFaint }}>{i + 1}</span>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, width: 52 }}>{t.code}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: T.panel }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cls.color }} />
                    </div>
                    <span className="text-xs w-16 text-right" style={{ color: T.textFaint }}>{minutesWaited.toFixed(1)}m</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-6">
              <SectionLabel>This station's recent calls</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {calledLog.filter((t) => t.deptId === selectedDept.id && t.calledStation === selectedStation.id).length === 0 && (
                  <span className="text-xs" style={{ color: T.textFaint }}>Nothing called yet.</span>
                )}
                {calledLog
                  .filter((t) => t.deptId === selectedDept.id && t.calledStation === selectedStation.id)
                  .map((t) => {
                    const cls = classes.find((c) => c.code === t.priorityCode);
                    return (
                      <Pill key={t.id + "-" + t.calledAt} color={cls.color}>{t.code}</Pill>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>

      {emergencyOpen && (
        <EmergencyDialog wings={wings} onClose={() => setEmergencyOpen(false)} onSubmit={onFastTrack} />
      )}
    </div>
  );
}

function EmergencyDialog({ wings, onClose, onSubmit }) {
  const [wingId, setWingId] = useState(wings[0].id);
  const wing = wings.find((w) => w.id === wingId);
  const [deptId, setDeptId] = useState(wing.departments[0].id);
  const dept = wing.departments.find((d) => d.id === deptId) || wing.departments[0];
  const [stationId, setStationId] = useState(dept.stations[0].id);
  const [source, setSource] = useState("ems"); // "ems" pre-alert vs "walkin" emergency at the door
  const [category, setCategory] = useState(EMERGENCY_CATEGORIES[0]);
  const [eta, setEta] = useState("8");
  const [notes, setNotes] = useState("");

  function pickWing(id) {
    const w = wings.find((x) => x.id === id);
    setWingId(id);
    setDeptId(w.departments[0].id);
    setStationId(w.departments[0].stations[0].id);
  }
  function pickDept(id) {
    const d = wing.departments.find((x) => x.id === id);
    setDeptId(id);
    setStationId(d.stations[0].id);
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: "rgba(6,10,12,0.7)" }}
    >
      <Card className="w-full max-w-lg" style={{ background: T.panel, border: `1px solid ${T.red}55` }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Siren size={16} color={T.red} />
            <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 16, fontWeight: 600 }}>
              Ambulance / emergency intake
            </span>
          </div>
          <button onClick={onClose} style={{ color: T.textFaint }}><X size={18} /></button>
        </div>

        <div className="text-xs mb-1.5" style={{ color: T.textDim }}>Alert source</div>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSource("ems")}
            className="flex-1 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1.5"
            style={{
              background: source === "ems" ? `${T.red}1f` : T.panelAlt,
              border: `1px solid ${source === "ems" ? T.red : T.border}`,
              color: source === "ems" ? T.text : T.textDim,
            }}
          >
            <Radio size={13} /> EMS pre-alert (inbound)
          </button>
          <button
            onClick={() => setSource("walkin")}
            className="flex-1 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1.5"
            style={{
              background: source === "walkin" ? `${T.red}1f` : T.panelAlt,
              border: `1px solid ${source === "walkin" ? T.red : T.border}`,
              color: source === "walkin" ? T.text : T.textDim,
            }}
          >
            <PhoneCall size={13} /> Already at the door
          </button>
        </div>

        {source === "ems" && (
          <div className="mb-4">
            <div className="text-xs mb-1.5" style={{ color: T.textDim }}>ETA (minutes)</div>
            <input
              type="number" min="0" value={eta} onChange={(e) => setEta(e.target.value)}
              className="w-24 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: T.panelAlt, border: `1px solid ${T.border}`, color: T.text, fontFamily: "JetBrains Mono, monospace" }}
            />
          </div>
        )}

        <div className="text-xs mb-1.5" style={{ color: T.textDim }}>Condition category</div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {EMERGENCY_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className="px-2.5 py-2 rounded-lg text-xs text-left"
              style={{
                background: category === c ? `${T.red}1f` : T.panelAlt,
                border: `1px solid ${category === c ? T.red : T.border}`,
                color: category === c ? T.text : T.textDim,
              }}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="text-xs mb-1.5" style={{ color: T.textDim }}>Route to</div>
        <div className="flex gap-2 mb-2">
          {wings.map((w) => (
            <button
              key={w.id}
              onClick={() => pickWing(w.id)}
              className="px-3 py-1.5 rounded-lg text-xs flex-1"
              style={{
                background: wingId === w.id ? `${T.teal}22` : T.panelAlt,
                border: `1px solid ${wingId === w.id ? T.teal : T.border}`,
                color: wingId === w.id ? T.text : T.textDim,
              }}
            >
              {w.name}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          {wing.departments.map((d) => (
            <button
              key={d.id}
              onClick={() => pickDept(d.id)}
              className="px-2.5 py-1.5 rounded-lg text-xs"
              style={{
                background: deptId === d.id ? `${T.teal}22` : T.panelAlt,
                border: `1px solid ${deptId === d.id ? T.teal : T.border}`,
                color: deptId === d.id ? T.text : T.textDim,
              }}
            >
              {d.name}
            </button>
          ))}
        </div>
        <div className="text-xs mb-1.5 mt-2" style={{ color: T.textDim }}>Station / bay</div>
        <div className="flex gap-2 mb-4 flex-wrap">
          {dept.stations.map((s) => (
            <button
              key={s.id}
              onClick={() => setStationId(s.id)}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{
                background: stationId === s.id ? `${T.red}1f` : T.panelAlt,
                border: `1px solid ${stationId === s.id ? T.red : T.border}`,
                color: stationId === s.id ? T.text : T.textDim,
              }}
            >
              {s.name}
            </button>
          ))}
        </div>

        <div className="text-xs mb-1.5" style={{ color: T.textDim }}>Dispatch notes (optional)</div>
        <textarea
          value={notes} onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="e.g. patient conscious, BP dropping"
          className="w-full px-3 py-2 rounded-lg text-sm outline-none mb-5 resize-none"
          style={{ background: T.panelAlt, border: `1px solid ${T.border}`, color: T.text }}
        />

        <div className="flex gap-2">
          <Btn variant="ghost" onClick={onClose} className="flex-1">Cancel</Btn>
          <Btn
            variant="danger"
            className="flex-1"
            onClick={() => {
              onSubmit({ wingId, deptId, stationId, category, source, eta: source === "ems" ? eta : null, notes });
              onClose();
            }}
          >
            <span className="flex items-center justify-center gap-1.5"><Siren size={14} /> Page & fast-track</span>
          </Btn>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Admin / facility config view
// ---------------------------------------------------------------------------
function AdminView({ classes, wings, onUpdateClass, onUpdateDept }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <SectionLabel>Priority classes — facility-tunable</SectionLabel>
        <div className="flex flex-col gap-3">
          {classes.map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.code}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={15} color={c.color} />
                  <span className="text-sm font-medium">{c.label}</span>
                  {c.bypass && <Pill color={T.red}>bypasses queue</Pill>}
                </div>
                {!c.bypass && (
                  <>
                    <div className="flex items-center justify-between text-xs mb-1" style={{ color: T.textDim }}>
                      <span>Base weight</span>
                      <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{c.baseWeight}</span>
                    </div>
                    <input
                      type="range" min={0} max={200} value={c.baseWeight}
                      onChange={(e) => onUpdateClass(c.code, { baseWeight: Number(e.target.value) })}
                      className="w-full mb-3"
                    />
                    <div className="flex items-center justify-between text-xs mb-1" style={{ color: T.textDim }}>
                      <span>Aging rate (pts / sim-minute)</span>
                      <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{c.agingRate}</span>
                    </div>
                    <input
                      type="range" min={0} max={10} value={c.agingRate}
                      onChange={(e) => onUpdateClass(c.code, { agingRate: Number(e.target.value) })}
                      className="w-full"
                    />
                  </>
                )}
              </Card>
            );
          })}
        </div>
        <div className="text-xs mt-3" style={{ color: T.textFaint }}>
          Aging rate can't be fully disabled system-wide — it's the floor that keeps a long-waiting standard patient from being permanently outranked.
        </div>
      </div>

      <div>
        <SectionLabel>Departments — per-station queue type</SectionLabel>
        <div className="flex flex-col gap-3">
          {wings.map((w) => (
            <div key={w.id}>
              <div className="text-xs mb-2" style={{ color: T.textDim }}>{w.name}</div>
              <div className="flex flex-col gap-2 mb-3">
                {w.departments.map((d) => (
                  <Card key={d.id} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm">{d.name}</div>
                      <div className="text-xs" style={{ color: T.textFaint }}>
                        avg service {d.avgServiceMin}m · window capacity {d.windowCapacity}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {["fifo", "biased"].map((qt) => (
                        <button
                          key={qt}
                          onClick={() => onUpdateDept(d.id, { queueType: qt })}
                          className="px-2.5 py-1 rounded-md text-xs"
                          style={{
                            background: d.queueType === qt ? `${T.teal}22` : "transparent",
                            border: `1px solid ${d.queueType === qt ? T.teal : T.border}`,
                            color: d.queueType === qt ? T.text : T.textDim,
                          }}
                        >
                          {qt === "fifo" ? "FIFO" : "Biased"}
                        </button>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}