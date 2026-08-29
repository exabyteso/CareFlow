/**
 * CareFlow investor pitch deck generator.
 *
 * Run: npm run generate  (from scripts/pitch/)
 * Out: docs/careflow-investor-pitch.pptx
 *
 * Every number on a visible slide comes from the locked claim whitelist in
 * research/ and is cited on-slide plus in speaker notes. Add no stats here
 * that are not already cited.
 */

const path = require("path");
const pptxgen = require("pptxgenjs");

const OUT = path.join(__dirname, "../../docs/careflow-investor-pitch.pptx");

// Navy / blue investor theme. Hex only, never "#", never 8 digits.
// Emergency red stays semantic (red-flag / 999), not a brand accent.
const C = {
  ink: "102a43",
  teal: "1b4f8a",
  tealDark: "123a66",
  bg: "f4f7fb",
  card: "ffffff",
  muted: "3d5270",
  line: "c5d0e0",
  emergency: "9b1c1c",
  emergencyBg: "fde8e8",
  onDark: "f4f7fb",
  onDarkMuted: "b8c7db",
};

const F = { title: "Cambria", body: "Calibri", mono: "Courier New" };

const M = { left: 0.6, contentW: 12.1 };

// pptxgenjs mutates option objects in place, so every helper returns a new one.
function shadowSoft() {
  return {
    type: "outer",
    color: C.ink,
    blur: 10,
    offset: 2,
    angle: 90,
    opacity: 0.1,
  };
}

function card(slide, x, y, w, h, fill, opts) {
  const o = opts || {};
  const shape = {
    x: x,
    y: y,
    w: w,
    h: h,
    fill: { color: fill },
    rectRadius: 0.14,
    shadow: shadowSoft(),
  };
  shape.line = o.hairline
    ? { color: C.line, width: 0.75 }
    : { type: "none" };
  slide.addShape("roundRect", shape);
}

function text(slide, content, o) {
  slide.addText(
    content,
    Object.assign(
      {
        fontFace: F.body,
        color: C.ink,
        margin: 0,
        align: "left",
        valign: "top",
      },
      o
    )
  );
}

function arrowRight(slide, x, y, w, color) {
  slide.addShape("line", {
    x: x,
    y: y,
    w: w,
    h: 0,
    line: { color: color || C.teal, width: 2, endArrowType: "triangle" },
  });
}

function arrowDown(slide, x, y, h, color) {
  slide.addShape("line", {
    x: x,
    y: y,
    w: 0,
    h: h,
    line: { color: color || C.teal, width: 2, endArrowType: "triangle" },
  });
}

function header(slide, kicker, title) {
  text(slide, kicker, {
    x: M.left,
    y: 0.5,
    w: M.contentW,
    h: 0.28,
    fontSize: 11.5,
    bold: true,
    charSpacing: 1.6,
    color: C.teal,
  });
  text(slide, title, {
    x: M.left,
    y: 0.84,
    w: M.contentW,
    h: 0.9,
    fontFace: F.title,
    fontSize: 38,
    bold: true,
    color: C.ink,
  });
}

function sourceLine(slide, s, dark) {
  text(slide, s, {
    x: M.left,
    y: 6.62,
    w: M.contentW,
    h: 0.33,
    fontSize: 10.5,
    color: dark ? C.onDarkMuted : C.muted,
  });
}

/** Big number + label + optional supporting sentence, inside a card. */
function statCard(slide, x, y, w, h, cfg) {
  card(slide, x, y, w, h, cfg.fill || C.card, { hairline: !cfg.fill });
  const pad = 0.32;
  const numColor = cfg.numColor || C.teal;
  text(slide, cfg.stat, {
    x: x + pad,
    y: y + 0.26,
    w: w - pad * 2,
    h: cfg.statH || 0.95,
    fontFace: F.title,
    fontSize: cfg.statSize || 54,
    bold: true,
    color: numColor,
  });
  text(slide, cfg.label, {
    x: x + pad,
    y: y + (cfg.labelY || 1.24),
    w: w - pad * 2,
    h: 0.6,
    fontSize: cfg.labelSize || 15,
    bold: true,
    color: cfg.textColor || C.ink,
  });
  if (cfg.body) {
    text(slide, cfg.body, {
      x: x + pad,
      y: y + (cfg.bodyY || 1.88),
      w: w - pad * 2,
      h: h - (cfg.bodyY || 1.88) - 0.2,
      fontSize: cfg.bodySize || 12.5,
      color: cfg.bodyColor || C.muted,
      lineSpacingMultiple: 1.08,
    });
  }
}

/** Numbered step card used by the flow and journey slides. */
function stepCard(slide, x, y, w, h, n, label, sub, cfg) {
  const o = cfg || {};
  const fill = o.fill || C.card;
  card(slide, x, y, w, h, fill, { hairline: !o.fill });
  const pad = 0.26;
  text(slide, String(n), {
    x: x + pad,
    y: y + 0.16,
    w: 0.6,
    h: 0.3,
    fontFace: F.title,
    fontSize: 14,
    bold: true,
    color: o.numColor || C.teal,
  });
  text(slide, label, {
    x: x + pad,
    y: y + (o.labelY || 0.5),
    w: w - pad * 2,
    h: o.labelH || 0.58,
    fontSize: o.labelSize || 14,
    bold: true,
    color: o.textColor || C.ink,
  });
  if (sub) {
    const subY = o.subY || 1.06;
    text(slide, sub, {
      x: x + pad,
      y: y + subY,
      w: w - pad * 2,
      h: o.subH || h - subY - 0.14,
      fontSize: o.subSize || 11.5,
      color: o.subColor || C.muted,
      lineSpacingMultiple: 1.05,
    });
  }
}

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3" x 7.5"
pres.author = "CareFlow";
pres.company = "CareFlow";
pres.title = "CareFlow — Kenya hospital pretriage";

/* ------------------------------------------------------------------ */
/* Slide 1 — Title (DARK)                                              */
/* ------------------------------------------------------------------ */
{
  const s = pres.addSlide();
  s.background = { color: C.ink };

  text(s, "CareFlow", {
    x: 0.8,
    y: 1.55,
    w: 7.3,
    h: 1.35,
    fontFace: F.title,
    fontSize: 68,
    bold: true,
    color: C.onDark,
  });
  text(
    s,
    "Map to the right KEPH level, the shortest hospital-reported wait, and book — before the door.",
    {
      x: 0.8,
      y: 3.05,
      w: 7.3,
      h: 1.5,
      fontSize: 20,
      color: C.onDarkMuted,
      lineSpacingMultiple: 1.2,
    }
  );
  text(s, "KENYA HOSPITAL PRETRIAGE", {
    x: 0.8,
    y: 4.75,
    w: 7.3,
    h: 0.35,
    fontSize: 13,
    bold: true,
    charSpacing: 2.4,
    color: C.onDark,
  });

  const steps = [
    ["Right KEPH level", "Rules pick the level, not a hospital brand"],
    ["Shortest reported wait", "Facility-typed people waiting, then distance"],
    ["Booked before arrival", "Named incoming load, confirmed by SMS"],
  ];
  steps.forEach(function (row, i) {
    const y = 1.7 + i * 1.42;
    card(s, 8.7, y, 3.9, 1.2, C.teal);
    text(s, row[0], {
      x: 9.0,
      y: y + 0.19,
      w: 3.3,
      h: 0.33,
      fontSize: 15,
      bold: true,
      color: C.onDark,
    });
    text(s, row[1], {
      x: 9.0,
      y: y + 0.57,
      w: 3.3,
      h: 0.5,
      fontSize: 11.5,
      color: C.line,
      lineSpacingMultiple: 1.05,
    });
  });

  text(s, "Before the door — not another teleconsult app.", {
    x: 0.8,
    y: 6.3,
    w: 7.3,
    h: 0.35,
    fontSize: 13,
    italic: true,
    color: C.onDarkMuted,
  });

  s.addNotes(
    "CareFlow is pretriage routing, not diagnosis. Rules map spoken or typed symptoms to a minimum KEPH level, then rank facilities by the wait number the facility itself types, then by distance, then let the family book so the desk sees them coming.\n\n" +
      "Objection: is this just another health app? Answer: the wedge is before the door. Teleconsult apps replace a consultation; booking marketplaces sell appointments at a facility the family already chose. CareFlow changes which facility level the family walks into, and hands the hospital a named arrival it can plan for. That is load-shifting, not consultation.\n\n" +
      "No numbers on this slide, so no sources needed here."
  );
}

/* ------------------------------------------------------------------ */
/* Slide 2 — The wrong facility (LIGHT)                                */
/* ------------------------------------------------------------------ */
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  header(s, "THE WRONG FACILITY", "Families arrive at the wrong facility");

  text(s, "Up to 84.3%", {
    x: M.left,
    y: 1.95,
    w: 7.0,
    h: 1.3,
    fontFace: F.title,
    fontSize: 72,
    bold: true,
    color: C.teal,
  });
  text(s, "self-referral / primary-care bypass", {
    x: M.left,
    y: 3.28,
    w: 7.0,
    h: 0.4,
    fontSize: 18,
    bold: true,
    color: C.ink,
  });
  text(
    s,
    "Families skip the Level 2–3 facility next door and travel to a louder, higher-level hospital. The system pays twice: the nearby capacity idles, and the referral hospital absorbs demand it was never built for.",
    {
      x: M.left,
      y: 3.85,
      w: 6.9,
      h: 1.6,
      fontSize: 15,
      color: C.muted,
      lineSpacingMultiple: 1.18,
    }
  );

  card(s, 7.9, 1.9, 4.8, 3.9, C.card, { hairline: true });
  text(s, "WHAT BYPASS LOOKS LIKE", {
    x: 8.2,
    y: 2.15,
    w: 4.2,
    h: 0.3,
    fontSize: 11.5,
    bold: true,
    charSpacing: 1.4,
    color: C.teal,
  });
  const rows = [
    ["Level 2 dispensary", "walked past", C.bg, C.muted, false],
    ["Level 3 health centre", "walked past", C.bg, C.muted, false],
    ["Level 4–5 referral hospital", "where everyone goes", C.teal, C.line, true],
  ];
  rows.forEach(function (r, i) {
    const y = 2.6 + i * 1.0;
    card(s, 8.65, y, 3.75, 0.82, r[2], { hairline: r[2] === C.bg });
    text(s, r[0], {
      x: 8.9,
      y: y + 0.13,
      w: 3.3,
      h: 0.3,
      fontSize: 13.5,
      bold: true,
      color: r[4] ? C.onDark : C.ink,
    });
    text(s, r[1], {
      x: 8.9,
      y: y + 0.44,
      w: 3.3,
      h: 0.28,
      fontSize: 11,
      color: r[3],
    });
  });
  arrowDown(s, 8.3, 2.75, 2.35, C.emergency);

  sourceLine(
    s,
    "Abere, cited in Bungoma 2024 (Bungoma County Referral Hospital self-referral study)."
  );

  s.addNotes(
    "Source: up to 84.3% self-referral / primary health care bypass — Abere, cited in the 2024 Bungoma County Referral Hospital work on self-referral.\n\n" +
      "Objection: bypass is driven by commodity stockouts, not ignorance — so routing people down a level will fail. Answer: agreed, and it constrains the design. Ranking must not be KEPH-label-only. Readiness and commodity availability have to pull weight in the ranking, otherwise families will keep going up and they will be right to. That is why the next slide pairs supply with readiness rather than celebrating facility counts."
  );
}

/* ------------------------------------------------------------------ */
/* Slide 3 — The wrong queue (LIGHT)                                   */
/* ------------------------------------------------------------------ */
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  header(s, "THE WRONG QUEUE", "Then they land in the wrong queue");

  const stats = [
    {
      stat: "81%",
      label: "of ED patients are CTAS 4–5",
      body: "Low-acuity cases sitting in an emergency department.",
    },
    {
      stat: "76.5%",
      label: "wait longer than 30 minutes",
      body: "Only 23.5% are seen within 30 minutes of arrival.",
    },
    {
      stat: "~200%",
      label: "occupancy at Mbagathi",
      body: "~1,000 outpatients through the door every day.",
    },
  ];
  stats.forEach(function (cfg, i) {
    statCard(s, M.left + i * 4.17, 2.05, 3.77, 2.6, {
      stat: cfg.stat,
      label: cfg.label,
      body: cfg.body,
    });
  });

  text(
    s,
    "Referral hospitals absorb mild demand a nearer Level 2–3 facility could have handled — so the people who need a referral hospital queue behind the people who do not.",
    {
      x: M.left,
      y: 5.0,
      w: 11.6,
      h: 0.9,
      fontSize: 16,
      color: C.ink,
      lineSpacingMultiple: 1.15,
    }
  );

  sourceLine(
    s,
    "AKUHN emergency department, PLOS One 2025 (n=941); Mbagathi County Referral Hospital operational statistics."
  );

  s.addNotes(
    "Sources: 81% of emergency department patients CTAS 4–5 and 76.5% waiting longer than 30 minutes (23.5% seen within 30 minutes) — Mwaura et al., Aga Khan University Hospital Nairobi, PLOS One 2025, n=941. Mbagathi County Referral Hospital: approximately 200% occupancy and about 1,000 outpatients per day, operational statistics. Supporting figure held in reserve: 43.8% of that AKUHN cohort was self-referred.\n\n" +
      "Objection: AKUHN is a private tertiary hospital, so this is not the public system. Answer: that is the point — even a well-resourced ED is dominated by low-acuity presentations, so the crowding is a routing failure rather than a resourcing failure. Mbagathi is the public referral counterpart and shows the same demand landing on a facility already over capacity."
  );
}

/* ------------------------------------------------------------------ */
/* Slide 4 — Capacity is already there (LIGHT)                         */
/* ------------------------------------------------------------------ */
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  header(s, "SUPPLY VS DEMAND", "The capacity is already one level down");

  const mix = [
    ["71%", "Level 2", "Dispensary"],
    ["~20%", "Level 3", "Health centre"],
    ["~7%", "Level 4", "Primary hospital"],
  ];
  mix.forEach(function (m, i) {
    const x = M.left + i * 2.53;
    card(s, x, 2.0, 2.23, 2.05, C.card, { hairline: true });
    text(s, m[0], {
      x: x + 0.28,
      y: 2.24,
      w: 1.7,
      h: 0.8,
      fontFace: F.title,
      fontSize: 44,
      bold: true,
      color: C.teal,
    });
    text(s, m[1], {
      x: x + 0.28,
      y: 3.12,
      w: 1.7,
      h: 0.32,
      fontSize: 15,
      bold: true,
      color: C.ink,
    });
    text(s, m[2], {
      x: x + 0.28,
      y: 3.48,
      w: 1.7,
      h: 0.55,
      fontSize: 12,
      color: C.muted,
    });
  });

  text(
    s,
    "Supply sits at Level 2–3. Demand skips it. Nothing has to be built for CareFlow to route people to capacity that already exists.",
    {
      x: M.left,
      y: 4.35,
      w: 7.3,
      h: 1.1,
      fontSize: 16,
      color: C.ink,
      lineSpacingMultiple: 1.15,
    }
  );

  card(s, 8.4, 2.0, 4.3, 3.4, C.emergencyBg);
  text(s, "READINESS WARNING", {
    x: 8.7,
    y: 2.24,
    w: 3.7,
    h: 0.3,
    fontSize: 11.5,
    bold: true,
    charSpacing: 1.4,
    color: C.emergency,
  });
  text(s, "7%", {
    x: 8.7,
    y: 2.6,
    w: 3.7,
    h: 0.9,
    fontFace: F.title,
    fontSize: 54,
    bold: true,
    color: C.emergency,
  });
  text(s, "have basic outpatient service readiness", {
    x: 8.7,
    y: 3.52,
    w: 3.7,
    h: 0.55,
    fontSize: 14,
    bold: true,
    color: C.ink,
  });
  text(
    s,
    "A KEPH label is not capability. Only 2% offer all 16 basic services. Routing that ignores readiness sends a family to an empty building — and teaches them to bypass again.",
    {
      x: 8.7,
      y: 4.15,
      w: 3.7,
      h: 1.1,
      fontSize: 12,
      color: C.muted,
      lineSpacingMultiple: 1.06,
    }
  );

  sourceLine(s, "Kenya Health Facility Census 2023 (n=12,384).");

  s.addNotes(
    "Sources: Kenya Health Facility Census 2023, n=12,384 — 71% of facilities are Level 2 dispensaries, roughly 20% Level 3 and 7% Level 4; only 7% have basic outpatient service readiness; only 2% offer all 16 basic services. Ownership split in the same census: 47% public, 46% private, 8% faith-based.\n\n" +
      "Objection: you are routing families to empty buildings. Answer: correct risk, and it is why readiness is a first-class input rather than a footnote. CareFlow must never treat a KEPH level as a capability claim; the ranking has to degrade a facility that cannot deliver the service, and the desk-typed wait number is the first honest signal we can get from the facility itself."
  );
}

/* ------------------------------------------------------------------ */
/* Slide 5 — Incumbents stop at the door (LIGHT)                       */
/* ------------------------------------------------------------------ */
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  header(s, "CATEGORY", "Everything else starts at the door");

  const gap = [
    ["Smart Triage / ETAT", "In-ED", "Acuity scoring once the patient has arrived", false],
    ["Referral enforcement", "At the door", "Reactive redirect after the journey is spent", false],
    ["CareFlow", "Before the door", "Wait-rank, book, SMS — while the family is still home", true],
  ];
  gap.forEach(function (row, i) {
    const y = 1.95 + i * 1.05;
    card(s, M.left, y, 7.6, 0.95, row[3] ? C.teal : C.card, {
      hairline: !row[3],
    });
    text(s, row[0], {
      x: M.left + 0.3,
      y: y + 0.3,
      w: 2.5,
      h: 0.36,
      fontSize: 15,
      bold: true,
      color: row[3] ? C.onDark : C.ink,
    });
    text(s, row[1], {
      x: M.left + 2.9,
      y: y + 0.31,
      w: 1.6,
      h: 0.34,
      fontSize: 13,
      bold: true,
      color: row[3] ? C.line : C.teal,
    });
    text(s, row[2], {
      x: M.left + 4.6,
      y: y + 0.24,
      w: 2.7,
      h: 0.48,
      fontSize: 12,
      color: row[3] ? C.line : C.muted,
      lineSpacingMultiple: 1.05,
    });
  });

  text(
    s,
    "Adjacent, but not the wedge: AfyaKE/AfyaLink, Vezeeta/Ponea, teleconsult apps. None of them sits before the door with KEPH level, wait, booking and arrived/no-show in one loop. [Likely]",
    {
      x: M.left,
      y: 5.3,
      w: 7.6,
      h: 0.95,
      fontSize: 11.5,
      color: C.muted,
      lineSpacingMultiple: 1.1,
    }
  );

  card(s, 8.5, 1.95, 4.2, 3.05, C.ink);
  text(s, "ANALOG — NOT A KENYA TRIAL", {
    x: 8.8,
    y: 2.18,
    w: 3.6,
    h: 0.3,
    fontSize: 11,
    bold: true,
    charSpacing: 1.2,
    color: C.onDarkMuted,
  });
  text(s, "69%", {
    x: 8.8,
    y: 2.55,
    w: 3.6,
    h: 0.8,
    fontFace: F.title,
    fontSize: 48,
    bold: true,
    color: C.onDark,
  });
  text(s, "of cases avoided an ED visit within 72 hours", {
    x: 8.8,
    y: 3.38,
    w: 3.6,
    h: 0.55,
    fontSize: 12.5,
    color: C.onDarkMuted,
  });
  text(s, "4.9% undertriage", {
    x: 8.8,
    y: 4.02,
    w: 3.6,
    h: 0.34,
    fontSize: 16,
    bold: true,
    color: C.onDark,
  });
  text(s, "Singapore virtual care centre — an analog, not a Kenya RCT", {
    x: 8.8,
    y: 4.4,
    w: 3.6,
    h: 0.5,
    fontSize: 11,
    color: C.line,
    lineSpacingMultiple: 1.05,
  });

  sourceLine(
    s,
    "Singapore virtual care centre: JMIR Formative Research 2026 — analog evidence, not a Kenya randomised trial."
  );

  s.addNotes(
    "Sources: Singapore virtual care centre — 69% avoidance of an emergency department visit within 72 hours and 4.9% undertriage, JMIR Formative Research 2026. Label it out loud as an analog, not a Kenya randomised controlled trial. In-ED comparators: ETAT and Smart Triage (see the safety slide). Referral enforcement at Kenyatta National Hospital reduced direct Level 2–3 referrals, but reactively, at the door.\n\n" +
      "Landscape whitespace [Likely]: no public product we can find combines community-entered symptoms, a KEPH minimum level, wait plus distance ranking, a booking, and an arrived/no-show close. Adjacent products worth naming in the room if asked, each as not-the-wedge: AfyaKE/AfyaLink (national rails), KNH referral enforcement, Smart Triage and ETAT (in-ED), Vezeeta/Ponea (booking marketplaces), and teleconsult apps.\n\n" +
      "Objection: health tech in Kenya is crowded. Answer: it is, and we are not claiming there are no competitors. We are claiming none of those products occupies the before-the-door position. Marketplaces book the facility the family already picked; teleconsult replaces the visit; the rails move claims and records. None of them changes which KEPH level the family walks into or closes the loop with the desk."
  );
}

/* ------------------------------------------------------------------ */
/* Slide 6 — Solution (LIGHT)                                          */
/* ------------------------------------------------------------------ */
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  header(s, "SOLUTION", "Pretriage before the door");

  const flow = [
    ["Symptoms", "Spoken or typed, English or Kiswahili"],
    ["Rules + red flags", "Catalog match, no free-text diagnosis"],
    ["KEPH minimum", "The lowest level that can safely cope"],
    ["Filter facilities", "Only levels at or above the minimum"],
    ["Rank", "Lowest reported wait, then nearest"],
    ["Book", "A named slot the desk can see"],
    ["SMS / voice", "The plan reaches the family phone"],
    ["Arrived / no-show", "Desk closes the loop"],
  ];
  flow.forEach(function (f, i) {
    const row = Math.floor(i / 4);
    const col = i % 4;
    const x = M.left + col * 3.15;
    const y = 1.82 + row * 1.48;
    stepCard(s, x, y, 2.6, 1.15, i + 1, f[0], f[1], {
      labelY: 0.42,
      labelH: 0.32,
      labelSize: 13.5,
      subY: 0.74,
      subH: 0.36,
      subSize: 10.5,
    });
    if (col < 3) arrowRight(s, x + 2.68, y + 0.575, 0.39);
  });
  // Row wrap is numbered 1–8; a down-arrow off step 4 would read as 4→8.

  card(s, M.left, 4.7, 7.3, 1.3, C.card, { hairline: true });
  text(s, "RANKING RULE", {
    x: M.left + 0.3,
    y: 4.9,
    w: 6.7,
    h: 0.3,
    fontSize: 11.5,
    bold: true,
    charSpacing: 1.4,
    color: C.teal,
  });
  text(s, "keph_level >= keph_min   →   lowest wait_count   →   nearest", {
    x: M.left + 0.3,
    y: 5.24,
    w: 6.7,
    h: 0.32,
    fontFace: F.mono,
    fontSize: 12,
    bold: true,
    color: C.ink,
  });
  text(
    s,
    "Wait first, distance second — or everyone piles into the nearest rumour.",
    {
      x: M.left + 0.3,
      y: 5.6,
      w: 6.7,
      h: 0.32,
      fontSize: 12,
      color: C.muted,
    }
  );

  card(s, 8.4, 4.7, 4.3, 1.3, C.emergencyBg);
  text(s, "RED FLAG", {
    x: 8.7,
    y: 4.9,
    w: 3.7,
    h: 0.3,
    fontSize: 11.5,
    bold: true,
    charSpacing: 1.4,
    color: C.emergency,
  });
  text(s, "Nearest KEPH 4+, ignore wait.", {
    x: 8.7,
    y: 5.22,
    w: 3.7,
    h: 0.34,
    fontSize: 15,
    bold: true,
    color: C.ink,
  });
  text(s, "Booking still allowed; the desk sees them.", {
    x: 8.7,
    y: 5.6,
    w: 3.7,
    h: 0.34,
    fontSize: 11.5,
    color: C.muted,
  });

  sourceLine(s, "Loop and invariants: docs/product-map/03-end-to-end.md.");

  s.addNotes(
    "Reference: docs/product-map/03-end-to-end.md and 05-invariants.md. No external statistics on this slide.\n\n" +
      "Objection: why force a booking — is that not friction? Answer: the booking is the join. Without it the hospital cannot tell a CareFlow arrival from a stranger, the desk has no reason to keep the wait number honest, and the wait numbers rot within days. Booking is what turns a recommendation into named incoming load, and the arrived/no-show close is what makes the next family's ranking true.\n\n" +
      "Second objection: does the red-flag path not defeat wait-ranking? Answer: yes, deliberately. A red flag stops ranking entirely and sends the family to the nearest KEPH 4+ facility regardless of queue."
  );
}

/* ------------------------------------------------------------------ */
/* Slide 7 — Application: care-seeker (LIGHT)                          */
/* ------------------------------------------------------------------ */
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  header(s, "APPLICATION — CARE-SEEKER", "From symptoms to a booked slot");

  const journey = [
    ["Disclaimer + 999", "Emergencies leave the app immediately", true],
    ["Speak or type", "Voice first; typing is the fallback", false],
    ["Ranked options", "Right level, shortest reported wait", false],
    ["Book", "One tap, one named slot", false],
    ["SMS", "The plan lands on the family phone", false],
  ];
  journey.forEach(function (j, i) {
    const x = M.left + i * 2.48;
    stepCard(s, x, 2.0, 2.2, 1.95, i + 1, j[0], j[1], {
      fill: j[2] ? C.emergencyBg : C.card,
      numColor: j[2] ? C.emergency : C.teal,
      subY: 1.12,
    });
    if (i < 4) arrowRight(s, x + 2.26, 2.97, 0.2);
  });

  card(s, M.left, 4.25, 5.9, 1.75, C.card, { hairline: true });
  text(s, "Voice-first, English and Kiswahili", {
    x: M.left + 0.32,
    y: 4.5,
    w: 5.26,
    h: 0.36,
    fontSize: 16,
    bold: true,
    color: C.ink,
  });
  text(
    s,
    "Consent before the microphone opens. A family with low literacy or low vision still gets a path that is not typing, and the ranked list is read back aloud.",
    {
      x: M.left + 0.32,
      y: 4.92,
      w: 5.26,
      h: 0.95,
      fontSize: 13,
      color: C.muted,
      lineSpacingMultiple: 1.1,
    }
  );

  card(s, 6.9, 4.25, 5.8, 1.75, C.teal);
  text(s, "It never names a disease", {
    x: 7.22,
    y: 4.5,
    w: 5.16,
    h: 0.36,
    fontSize: 16,
    bold: true,
    color: C.onDark,
  });
  text(
    s,
    "CareFlow maps symptoms to a minimum care level and a queue. There is no diagnosis, no prescription, and no claim to be a medical device — the output is a facility and a time.",
    {
      x: 7.22,
      y: 4.92,
      w: 5.16,
      h: 0.95,
      fontSize: 13,
      color: C.line,
      lineSpacingMultiple: 1.1,
    }
  );

  sourceLine(
    s,
    "PWA journey for /patient — docs/product-map/01-language.md, 06-scenarios.md. Diagram, not a product screenshot."
  );

  s.addNotes(
    "Reference: docs/product-map/01-language.md and 06-scenarios.md. One PWA; the role is chosen after consent, so a phone can be a care-seeker device today and a desk device tomorrow. No external statistics on this slide.\n\n" +
      "Objection: most of the households you are describing are on feature phones. Answer: the SMS step is the answer, not an afterthought. Whoever holds the smartphone runs the pretriage, and the SMS carries the facility, the level and the slot to the family member who will actually travel. Voice-first input keeps the app usable for someone who will not type a symptom list."
  );
}

/* ------------------------------------------------------------------ */
/* Slide 8 — Application: hospital (LIGHT)                             */
/* ------------------------------------------------------------------ */
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  header(s, "APPLICATION — HOSPITAL DESK", "The hospital side is not optional");

  card(s, M.left, 1.95, 4.3, 2.7, C.card, { hairline: true });
  text(s, "Care-seeker", {
    x: M.left + 0.32,
    y: 2.2,
    w: 3.66,
    h: 0.38,
    fontSize: 18,
    bold: true,
    color: C.ink,
  });
  text(
    s,
    [
      {
        text: "Sees the ranked options",
        options: { bullet: { indent: 16 }, breakLine: true },
      },
      {
        text: "Books one named slot",
        options: { bullet: { indent: 16 }, breakLine: true },
      },
      {
        text: "Travels with the plan by SMS",
        options: { bullet: { indent: 16 } },
      },
    ],
    {
      x: M.left + 0.32,
      y: 2.68,
      w: 3.66,
      h: 1.4,
      fontSize: 13.5,
      color: C.muted,
      margin: 0,
      paraSpaceAfter: 12,
    }
  );

  card(s, 5.35, 2.55, 2.6, 1.5, C.teal);
  text(s, "BOOKING", {
    x: 5.6,
    y: 2.77,
    w: 2.1,
    h: 0.3,
    fontSize: 11.5,
    bold: true,
    charSpacing: 1.4,
    color: C.line,
  });
  text(s, "The join", {
    x: 5.6,
    y: 3.11,
    w: 2.1,
    h: 0.34,
    fontSize: 18,
    bold: true,
    color: C.onDark,
  });
  text(s, "One row both sides can see", {
    x: 5.6,
    y: 3.49,
    w: 2.1,
    h: 0.5,
    fontSize: 11,
    color: C.line,
    lineSpacingMultiple: 1.05,
  });
  arrowRight(s, 4.98, 3.3, 0.3);
  arrowRight(s, 8.03, 3.3, 0.3);

  card(s, 8.4, 1.95, 4.3, 2.7, C.card, { hairline: true });
  text(s, "Hospital desk", {
    x: 8.72,
    y: 2.2,
    w: 3.66,
    h: 0.38,
    fontSize: 18,
    bold: true,
    color: C.ink,
  });
  text(
    s,
    [
      {
        text: "Types people waiting (wait_count)",
        options: { bullet: { indent: 16 }, breakLine: true },
      },
      {
        text: "Sees today's bookings",
        options: { bullet: { indent: 16 }, breakLine: true },
      },
      {
        text: "Marks arrived or no-show",
        options: { bullet: { indent: 16 } },
      },
    ],
    {
      x: 8.72,
      y: 2.68,
      w: 3.66,
      h: 1.4,
      fontSize: 13.5,
      color: C.muted,
      margin: 0,
      paraSpaceAfter: 12,
    }
  );
  text(s, "No chat — the booking row is the channel.", {
    x: 8.72,
    y: 4.2,
    w: 3.66,
    h: 0.34,
    fontSize: 11.5,
    italic: true,
    color: C.teal,
  });

  card(s, M.left, 5.0, 12.1, 1.15, C.ink);
  text(
    s,
    "If only the care-seeker side exists, the wait numbers are fiction. The desk update is the product, not a chore.",
    {
      x: M.left + 0.4,
      y: 5.25,
      w: 11.3,
      h: 0.7,
      fontSize: 15.5,
      bold: true,
      color: C.onDark,
      lineSpacingMultiple: 1.1,
    }
  );

  sourceLine(
    s,
    "PWA journey for /hospital — docs/product-map/02-two-sides.md, 04-queue-and-bookings.md. Diagram, not a product screenshot."
  );

  s.addNotes(
    "Reference: docs/product-map/02-two-sides.md and 04-queue-and-bookings.md. The wait figure is a number hospital staff type, not a live feed from a hospital information system. No external statistics on this slide.\n\n" +
      "Objection: busy desk staff will never keep typing a wait number. Answer: if they do not, the ranking is fiction and we should know that in a pilot rather than after a launch. That is why the desk gets something it wants in return — a named list of who is coming today, and a one-tap arrived/no-show that closes the row. Walk-ins are the majority today and they are invisible to any ranking unless a human tells us the queue length."
  );
}

/* ------------------------------------------------------------------ */
/* Slide 9 — Safety is the moat (LIGHT)                                */
/* ------------------------------------------------------------------ */
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  header(s, "SAFETY", "Safety is the moat");

  card(s, M.left, 1.9, 5.5, 2.35, C.emergencyBg);
  text(s, "RED-FLAG PATH", {
    x: M.left + 0.32,
    y: 2.14,
    w: 4.86,
    h: 0.3,
    fontSize: 11.5,
    bold: true,
    charSpacing: 1.4,
    color: C.emergency,
  });
  text(s, "Nearest KEPH 4+ — ignore wait.", {
    x: M.left + 0.32,
    y: 2.52,
    w: 4.86,
    h: 0.42,
    fontFace: F.title,
    fontSize: 21,
    bold: true,
    color: C.ink,
  });
  text(
    s,
    "A red flag stops ranking. We would rather over-route a family to a higher level than let a queue length hold back the one case that cannot wait.",
    {
      x: M.left + 0.32,
      y: 3.06,
      w: 4.86,
      h: 1.0,
      fontSize: 13,
      color: C.muted,
      lineSpacingMultiple: 1.1,
    }
  );

  statCard(s, 6.5, 1.9, 2.95, 2.35, {
    stat: "51%",
    statSize: 50,
    label: "ETAT mortality sensitivity",
    labelSize: 13.5,
    body: "In-facility guideline",
    bodyY: 1.86,
    numColor: C.muted,
    labelY: 1.2,
  });
  statCard(s, 9.75, 1.9, 2.95, 2.35, {
    stat: "79.6%",
    statSize: 50,
    label: "Smart Triage mortality sensitivity",
    labelSize: 13.5,
    body: "Data-driven model",
    bodyY: 1.86,
    labelY: 1.2,
  });

  card(s, M.left, 4.5, 5.5, 1.75, C.card, { hairline: true });
  text(s, "Conservative rules, not a device", {
    x: M.left + 0.32,
    y: 4.74,
    w: 4.86,
    h: 0.36,
    fontSize: 16,
    bold: true,
    color: C.ink,
  });
  text(
    s,
    "CareFlow is deliberately simpler than ETAT or Smart Triage. It refuses diagnosis, and it will not use a wait number to justify a lower level of care.",
    {
      x: M.left + 0.32,
      y: 5.16,
      w: 4.86,
      h: 0.95,
      fontSize: 13,
      color: C.muted,
      lineSpacingMultiple: 1.1,
    }
  );

  card(s, 6.5, 4.5, 6.2, 1.75, C.teal);
  text(s, "We do not claim to beat Smart Triage", {
    x: 6.82,
    y: 4.74,
    w: 5.56,
    h: 0.36,
    fontSize: 16,
    bold: true,
    color: C.onDark,
  });
  text(
    s,
    "Undertriage is documented in Kenyan public hospitals. That is exactly why the red-flag rule ignores wait and pushes upward: the failure mode we design against is a missed emergency, not an inefficient queue.",
    {
      x: 6.82,
      y: 5.16,
      w: 5.56,
      h: 0.95,
      fontSize: 13,
      color: C.line,
      lineSpacingMultiple: 1.1,
    }
  );

  sourceLine(
    s,
    "PLOS Digital Health 2024 — two Kenyan public hospitals, n=5,618 children under 15."
  );

  s.addNotes(
    "Sources: ETAT mortality sensitivity 51% versus Smart Triage 79.6% — Kamau et al., PLOS Digital Health 2024, n=5,618 children under 15 at two Kenyan public hospitals. Cite it as evidence that in-facility triage already misses cases, not as a benchmark CareFlow claims to clear.\n\n" +
      "Objection: your rules will undertriage people. Answer: we do not claim to outperform Smart Triage and we do not run a model that could quietly downgrade a case. CareFlow refuses diagnosis, uses a conservative red-flag rule set, and on any red flag sends the family to the nearest KEPH 4+ facility with wait ignored. The cost of that choice is over-routing, which is a measurable pilot metric rather than a hidden risk."
  );
}

/* ------------------------------------------------------------------ */
/* Slide 10 — Why now / who pays (LIGHT)                               */
/* ------------------------------------------------------------------ */
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  header(s, "WHY NOW / WHO PAYS", "Why now, and who pays");

  statCard(s, M.left, 1.9, 3.77, 2.2, {
    stat: "Monday",
    statSize: 40,
    label: "08:00–12:00 peak",
    body: "Demand is predictable, so it can be shifted.",
    labelY: 1.02,
    bodyY: 1.46,
  });
  statCard(s, M.left + 4.17, 1.9, 3.77, 2.2, {
    stat: "OR 2.03",
    statSize: 40,
    label: "one-way SMS and attendance",
    body: "Meta-analysis across African settings.",
    labelY: 1.02,
    bodyY: 1.46,
  });
  statCard(s, M.left + 8.34, 1.9, 3.77, 2.2, {
    stat: "35–42%",
    statSize: 40,
    label: "Kenya ANC appointments missed",
    body: "The no-show baseline a reminder loop attacks.",
    labelY: 1.02,
    bodyY: 1.46,
  });

  card(s, M.left, 4.4, 7.3, 1.9, C.card, { hairline: true });
  text(s, "BUYER HYPOTHESIS — NOT A MODEL", {
    x: M.left + 0.32,
    y: 4.62,
    w: 6.66,
    h: 0.3,
    fontSize: 11.5,
    bold: true,
    charSpacing: 1.4,
    color: C.teal,
  });
  text(
    s,
    "Counties and facilities are the buyers we test first, because load-shifting is their problem: the right KEPH level, a shorter wait, and an SMS that actually gets the family there. How that is priced is a hypothesis for pilots to answer, not a model we are presenting.",
    {
      x: M.left + 0.32,
      y: 5.0,
      w: 6.66,
      h: 1.15,
      fontSize: 14,
      color: C.ink,
      lineSpacingMultiple: 1.12,
    }
  );

  card(s, 8.4, 4.4, 4.3, 1.9, C.ink);
  text(s, "SHA deferred", {
    x: 8.72,
    y: 4.62,
    w: 3.66,
    h: 0.36,
    fontSize: 16,
    bold: true,
    color: C.onDark,
  });
  text(
    s,
    "SHA claims, AfyaKE and HIE stay out of this pass. The wedge is shifting load before the door, not moving money after it.",
    {
      x: 8.72,
      y: 5.04,
      w: 3.66,
      h: 1.1,
      fontSize: 12.5,
      color: C.line,
      lineSpacingMultiple: 1.08,
    }
  );

  sourceLine(
    s,
    "AKUHN, PLOS One 2025 (demand peaks); PLOS One 2019 SMS meta-analysis; Homabay/Kisumu ANC studies and systematic reviews."
  );

  s.addNotes(
    "Sources: peak demand on Monday, 08:00–12:00 — Mwaura et al., AKUHN, PLOS One 2025. One-way SMS reminders and appointment attendance in Africa, odds ratio 2.03 — PLOS One 2019 meta-analysis. Kenya antenatal care missed appointments 35–42% — Homabay and Kisumu studies plus systematic reviews.\n\n" +
      "Objection: who actually pays for this? Answer: SHA is deferred. The first budget we test is county and facility, where the pain is measurable: low-acuity load arriving at the wrong level, a peak window that is predictable enough to shift, and an SMS channel with published evidence that it improves attendance. Monetisation stays labelled as a hypothesis until a pilot prices it. We are not presenting a market-size calculation."
  );
}

/* ------------------------------------------------------------------ */
/* Slide 11 — Close (DARK)                                             */
/* ------------------------------------------------------------------ */
{
  const s = pres.addSlide();
  s.background = { color: C.ink };

  text(s, "Sit before the door.", {
    x: 0.8,
    y: 1.7,
    w: 7.4,
    h: 2.15,
    fontFace: F.title,
    fontSize: 56,
    bold: true,
    color: C.onDark,
    lineSpacingMultiple: 1.05,
  });
  text(s, "Next: county pilots and a 72-hour safety KPI.", {
    x: 0.8,
    y: 4.05,
    w: 7.4,
    h: 0.6,
    fontSize: 22,
    color: C.onDarkMuted,
  });
  text(s, "CareFlow — Kenya hospital pretriage", {
    x: 0.8,
    y: 6.3,
    w: 7.4,
    h: 0.35,
    fontSize: 12.5,
    charSpacing: 1.4,
    color: C.onDarkMuted,
  });

  const asks = [
    [
      "County pilots",
      "Measure low-acuity load diverted from referral hospitals to ready Level 2–3 facilities",
    ],
    [
      "72-hour safety KPI",
      "Adverse outcomes after a routing decision — the metric the analog implies and Kenya has yet to test",
    ],
  ];
  asks.forEach(function (a, i) {
    const y = 1.85 + i * 1.95;
    card(s, 8.7, y, 3.9, 1.6, C.teal);
    text(s, a[0], {
      x: 9.0,
      y: y + 0.22,
      w: 3.3,
      h: 0.36,
      fontSize: 17,
      bold: true,
      color: C.onDark,
    });
    text(s, a[1], {
      x: 9.0,
      y: y + 0.64,
      w: 3.3,
      h: 0.8,
      fontSize: 11.5,
      color: C.line,
      lineSpacingMultiple: 1.05,
    });
  });

  s.addNotes(
    "Build status, say it plainly if asked: Specified Kenya MVP; local FastAPI + Next.js PWA slice. Not a deployed production service. No live national facility-registry sync, no bookings running in production, no production hosting.\n\n" +
      "Next evidence: county pilots that measure diverted low-acuity load, and a 72-hour adverse-outcome / safety KPI — taken from the Singapore virtual care centre analog (JMIR Formative Research 2026) and still to be measured in Kenya.\n\n" +
      "Objection: show me traction. Answer: we will not invent it. There are no users, no revenue and no deployment to quote. What we have is a locked product specification, a working local slice of the loop, and a claim set drawn entirely from published Kenyan evidence. The ask is pilots that measure two things: how much low-acuity load moves, and whether anyone is harmed within 72 hours of a routing decision."
  );
}

pres
  .writeFile({ fileName: OUT })
  .then(function (name) {
    console.log("wrote " + name);
  })
  .catch(function (err) {
    console.error(err);
    process.exit(1);
  });
