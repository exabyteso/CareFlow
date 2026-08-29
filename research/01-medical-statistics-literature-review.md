# Medical statistics literature review for CareFlow

| Field | Value |
|-------|-------|
| Document type | Research synthesis |
| Version | 0.1 |
| Status | Draft |
| Last updated | 2026-08-28 |
| Related documents | [camlinedev/01-problem.md](../../../camlinedev/01-problem.md), [02-recommended-kpis.md](02-recommended-kpis.md) |

This document gathers peer-reviewed and official statistics relevant to **pretriage routing** — directing care-seekers to the right KEPH level and shortest wait **before** they arrive at a hospital door. It is organized by problem domain, with implications for CareFlow design and evaluation.

---

## Executive summary

| Domain | Key statistic | Source | CareFlow relevance |
|--------|---------------|--------|-------------------|
| Facility bypass | Up to **84.3%** self-referral / bypass of lower-level facilities | Abere et al., cited in Bungoma study 2024 | Core problem CareFlow addresses |
| ED overcrowding | **~200%** inpatient occupancy; **~1,000** outpatients/day | Mbagathi County Referral Hospital |
| ED wait times (Kenya) | **23.5%** seen within 30 min; **76.5%** wait longer | Aga Khan Nairobi, PLOS One 2025 |
| Low-acuity crowding | **81%** of ED patients CTAS 4–5 (non-urgent) | Aga Khan Nairobi, PLOS One 2025 |
| ED length of stay | Mean **2h 27m**, **15.4%** > 4 hours | Gatundu Level V, 2024 |
| No-show (Africa) | **~43%** average; Kenya ANC **35–42%** missed | Systematic reviews; Homabay/Kisumu |
| SMS reminders | **RR 0.78** (22% reduction) in LMIC; Africa OR **2.03** for attendance | Meta-analyses |
| Pretriage routing | **69%** ED avoidance (72h); undertriage **4.9%** | Singapore VCC, 2026 |
| In-hospital triage undertriage | ETAT sensitivity for mortality **51%** vs Smart Triage **79.6%** | Kenya public hospitals, PLOS DH 2024 |
| Facility readiness | Only **2%** offer all 16 basic services; **7%** basic outpatient readiness | Kenya Health Facility Census 2023 |

---

## 1. Waiting times at triage and emergency departments in Kenya

### 1.1 Tertiary / private hospital (Aga Khan University Hospital Nairobi)

A cross-sectional study of **941 ED patients** (March–July 2023) found:

| Wait time bucket | Share of patients |
|------------------|-------------------|
| ≤ 30 minutes | **23.5%** |
| 31–60 minutes | **51.1%** |
| > 60 minutes | **25.4%** |

- **81%** of patients were triaged CTAS level 4–5 (less urgent / non-urgent).
- Peak demand: **Monday**, **08:00–12:00**.
- **43.8%** were self-referred (walk-in without referral).
- Institute of Medicine benchmark cited: **90%** of patients should be seen within **30 minutes** — Kenya tertiary ED falls far short.

**Source:** Mwaura et al., *PLOS One* 2025. DOI: [10.1371/journal.pone.0322015](https://doi.org/10.1371/journal.pone.0322015)

**CareFlow implication:** A large share of ED demand is low-acuity and self-referred. Routing mild cases to appropriate KEPH 2–3 facilities before arrival could reduce front-door congestion at Level 4–6 hospitals — if those lower facilities have capacity and commodities.

### 1.2 County / public hospital (Gatundu Level V, Kiambu)

Longitudinal study of **182 ED patients** (July–August 2024):

| Metric | Value |
|--------|-------|
| Mean length of stay | **2 hours 27 minutes** |
| Median length of stay | **1 hour 30 minutes** |
| Patients staying > 4 hours | **15.4%** (28/182) |
| Patients staying < 4 hours | **84.6%** |
| Dissatisfied with care quality | **27.4%** |

Length of stay correlated significantly with illness acuity (more severe → longer stay).

**Source:** *International Journal of Community Medicine and Public Health*, 2025. DOI: [10.18203/2394-6040.ijcmph20250909](https://doi.org/10.18203/2394-6040.ijcmph20250909)

### 1.3 Referral hospital overcrowding (Mbagathi County Referral Hospital, Nairobi)

Operational statistics from the hospital:

| Metric | Value |
|--------|-------|
| Daily outpatient volume | **~1,000 patients** |
| Inpatient bed occupancy | **~200%** of capacity |
| Bed capacity | 320 (official site) / 452 (news reports) |
| Role | Referral facility for Nairobi Metropolis |

**Sources:** [mbagathihospital.or.ke](https://mbagathihospital.or.ke/); Citizen Digital 2024.

**CareFlow implication:** County referral hospitals are structurally overloaded. Pretriage routing that steers appropriate cases to less crowded Level 3–4 alternatives (ranked by `wait_count` then distance) directly targets this bottleneck.

### 1.4 International benchmarks (context)

| Benchmark | Target | Origin |
|-----------|--------|--------|
| Time to provider (low-acuity) | < 60–120 min (CTAS 4–5) | Canadian Triage and Acuity Scale |
| ED total length of stay | < 4 hours for 95–98% | UK NHS (not WHO-mandated) |
| WHO IITT example targets | Red: immediate; Yellow: < 2h; Green: 4–6h | WHO Emergency Care Toolkit |
| IOM (cited in AKUHN study) | 90% seen within 30 min | US-derived, applied in LMIC discussion |

WHO does **not** set a global 4-hour or 30-minute mandate; targets are facility-determined based on local triage systems.

---

## 2. Wrong-facility visits and self-referral (the bypass problem)

### 2.1 Scale of bypass in Kenya

| Statistic | Value | Notes |
|-----------|-------|-------|
| Self-referral / bypass rate | **Up to 84.3%** | Patients skip PHC for higher-level hospitals |
| Drivers | Distance, wait time, diagnostics, perceived quality, mistrust of PHC | Health Belief Model framing |

**Source:** Abere et al. (2021), cited in Ong'ondo et al., Bungoma County Referral Hospital study, 2024. DOI: [10.51867/ajernet.6.4.66](https://doi.org/10.51867/ajernet.6.4.66)

### 2.2 Why patients bypass lower KEPH levels

Kenya Health Facility Census 2023 and county PHC implementation reviews identify systemic causes:

| Barrier at Level 2–3 | Effect |
|----------------------|--------|
| Commodity stockouts (NCD meds, essential drugs) | Patients go to Level 4 to purchase out-of-pocket |
| Staff shortages | Reduced confidence in PHC |
| No bypass-prevention mechanisms | Counties lack empaneled link facilities |
| Only **2%** of facilities offer all 16 basic services | Low readiness drives upward migration |
| Basic outpatient readiness | Only **7%** nationally |

**Sources:** Kenya Health Facility Census Report, September 2023 ([MoH PDF](https://www.health.go.ke/sites/default/files/2024-01/Kenya%20Health%20Facility%20Census%20Report%20September%202023.pdf)); Frontiers in Health Services 2025 ([10.3389/frhs.2025.1298379](https://doi.org/10.3389/frhs.2025.1298379)).

### 2.3 What happens when referral rules are enforced

Kenyatta National Hospital enforced national referral guidelines (July 2021). Orthopedic referrals study (pre-post, n=222 before / n=246 after):

| Outcome | Finding |
|---------|---------|
| Level 2–3 direct referrals to KNH | **Significantly reduced** (p=0.002) |
| Level 2 referrals post-enforcement | **90.8% less likely** vs Level 3 |
| Facilities that stopped referring to KNH | **43**; >⅔ were private |
| Walk-in share at tertiary | Majority of patients are self-referred, not formal referrals |

**Sources:** PLOS One 2023 ([10.1371/journal.pone.0290195](https://doi.org/10.1371/journal.pone.0290195)); East African Journal of Clinical Research 2024.

**CareFlow implication:** Policy enforcement at the hospital door works but is reactive and punitive. CareFlow offers **proactive** routing before arrival — complementary to referral guidelines, not a replacement. Routing must account for **real readiness** (commodities, diagnostics), not KEPH level alone, or patients will bypass CareFlow recommendations too.

---

## 3. Kenya facility landscape (KEPH / KMHFR)

### 3.1 Facility distribution (2023 Census, n=12,384 complete)

| KEPH level | Share of assessed facilities | Government-owned (approx.) |
|------------|------------------------------|----------------------------|
| Level 2 (dispensary) | **71%** | 4,172 |
| Level 3 (health centre) | ~20% | 1,217 |
| Level 4 (county/sub-county hospital) | ~7% | 376 |
| Level 5 (regional referral) | <1% | 14 |
| Level 6 (national) | Minimal | 5 (all government) |

- **47%** public, **46%** private, **8%** faith-based/NGO.
- **2,633** facilities missing from KMHFR; **63** lacked KMFL codes — data quality risk for facility cache.
- Only **40%** of facilities accredited; **57%** of Level 2 accredited.

**Source:** Kenya Health Facility Census 2023, Ministry of Health.

**CareFlow implication:** Level 2–3 facilities are abundant but underused due to bypass. CareFlow's facility cache must use KMHFR identity and tolerate list gaps. Ranking by `wait_count` then distance is sound given geographic density of Level 2–3.

### 3.2 Healthcare workforce density

- **16.5 healthcare workers per 10,000 population** (2018 data, ~78,711 workers for 47.8M people).
- Triage at facility level competes with high patient burden and staff turnover.

**Source:** BMC Nursing 2025; KHSSP MTR Statistical Report.

---

## 4. Triage accuracy and safety (in-hospital context)

CareFlow is **not** in-hospital triage, but safety statistics inform red-flag design.

### 4.1 Smart Triage vs ETAT — Kenya public hospitals (children < 15)

Study at two public hospitals, **n=5,618** children (Feb–Dec 2021):

| Metric | ETAT | Smart Triage |
|--------|------|--------------|
| Classified as emergency | **9.2%** | **20.8%** |
| Classified as non-urgent | **55.1%** | **37.4%** |
| Sensitivity for admission | **48.4%** | **74.9%** |
| Sensitivity for mortality | **51.0%** | **79.6%** |
| Admission rate | 7% | — |
| Mortality rate | 0.9% | — |

ETAT **undertriaged** roughly half of admitted and deceased children. Smart Triage improved identification but classified more patients as emergencies (potential overtriage).

**Source:** Kamau et al., *PLOS Digital Health* 2024. DOI: [10.1371/journal.pdig.0000408](https://doi.org/10.1371/journal.pdig.0000408)

**CareFlow implication:**

- Red flags must err toward **safety** (route to nearest KEPH 4+, ignore wait) — undertriage risk is documented in Kenyan settings.
- CareFlow's symptom rules are simpler than ETAT/Smart Triage; conservative red-flag lists are warranted.
- Smart Triage operates **inside** the ED; CareFlow operates **before** the door — complementary, not competing.

### 4.2 Tele-triage safety (pre-arrival analog)

Singapore Virtual Care Centre (2020–2024), **n=2,879** clinical calls:

| Metric | Value |
|--------|-------|
| Resolved remotely (no ED) | **63.7%** |
| Directed to ED | **13.8%** |
| 72-hour ED avoidance | **69.1%** |
| Undertriage (72h) | **4.9%** |
| 14-day / 30-day mortality | Low; no ICU/HD within 72h of resolution |

**Source:** JMIR Formative Research 2026. DOI: [10.2196/86556](https://doi.org/10.2196/86556)

Washington DC nurse-led 911 triage RCT (**n=6,053**):

- Ambulance dispatch: **97% → 56%**
- Non-emergent ED visits (Medicaid, 24h): **29.5% → 25.1%**
- 13 time-sensitive cases in treatment arm — all quickly triaged to ambulance

**Source:** *Nature Human Behaviour* 2024.

**CareFlow implication:** Pre-arrival routing can materially shift demand with low undertriage when red-flag pathways are conservative. CareFlow should track **72-hour adverse outcomes** in pilots where feasible.

---

## 5. Interventions that reduce ED wait times (in-hospital)

These apply **after** arrival but inform what CareFlow must achieve upstream.

### 5.1 Systematic review — triage-related interventions (33 studies, 800,000+ patients)

| Intervention | Effect on wait time / LOS | Evidence strength |
|--------------|---------------------------|-------------------|
| Fast track (low-acuity stream) | ↓ wait, ↓ LOS, ↓ left-without-being-seen | **Moderate** |
| Team triage (physician in team) | ↓ wait, ↓ LOS, ↓ LWBS | **Moderate–strong** |
| Streaming / POCT / nurse-requested x-ray | Limited or insufficient | Weak |

**Source:** Hinson et al., *Scandinavian Journal of Trauma, Resuscitation and Emergency Medicine* 2011. DOI: [10.1186/1757-7241-19-43](https://doi.org/10.1186/1757-7241-19-43)

### 5.2 Meta-analysis — ED throughput RCTs (20 trials)

| Intervention | Effect |
|--------------|--------|
| Triage liaison physician | ↓ time to disposition **28 min** (95% CI 19–37); ↓ LWBS RR **0.76** |
| Point-of-care testing | ↓ disposition time 5–96 min (heterogeneous) |

**Source:** *Academic Emergency Medicine* systematic review. DOI: [10.1111/acem.14946](https://doi.org/10.1111/acem.14946)

### 5.3 Fast-track quality trade-off

Canadian ED study (2 hospitals, 2 years):

- Fast-track routing ↓ LOS and LWBS
- But **+8.2%** 48-hour revisit rate for high-complexity patients routed to fast track
- **+2.3%** for medium-complexity

**Source:** *Operations & Service Management* 2025.

**CareFlow implication:** Routing low-acuity cases away from overcrowded Level 5–6 facilities improves system flow, but **wrong-level routing** (sending complex cases to under-equipped facilities) risks quality harm. KEPH-min filtering plus red flags mitigates this; post-visit revisit tracking is a useful safety KPI.

---

## 6. Appointment no-shows and notification effectiveness

### 6.1 No-show rates

| Context | Rate |
|---------|------|
| Africa (systematic review average) | **43.0%** |
| Europe average | 19.3% |
| Global average (105 studies) | 23% |
| Kenya ANC appointments (Homabay / Kisumu, 2019) | **42% / 35%** missed |
| Wasted health resources from missed appointments | **~22%** (Kenya ANC study) |

**Sources:** Dantas et al. 2022 (PMC8985245); Israel J Health Policy Res 2023; One Health Pan African Med J 2022.

### 6.2 SMS and phone reminders

| Intervention | Effect |
|--------------|--------|
| One-way SMS in Africa (RCT meta-analysis) | OR **2.03** for appointment attendance (95% CI 1.40–2.95) |
| SMS in LMIC (subgroup) | RR **0.78** for non-attendance (22% reduction) |
| Single SMS within 72h of appointment | RR **0.73** (strongest subgroup) |
| Phone vs SMS cost | Phone ~6.5× more expensive per patient |

**Sources:** PLOS One 2019 ([10.1371/journal.pone.0217485](https://doi.org/10.1371/journal.pone.0217485)); JCCSR 2022 meta-analysis.

**CareFlow implication:** SMS + voice reminder loop is evidence-backed for Kenya. Expect meaningful no-show rates even with reminders; desk **arrived / no-show** tracking enables measurement. Single SMS 24–72h before slot is optimal; second no-show → voice call matches demo spec.

---

## 7. Demand patterns useful for CareFlow scheduling

From AKUHN ED study and international data:

| Pattern | Finding |
|---------|---------|
| Peak day | **Monday** |
| Peak hours | **08:00–12:00** |
| Self-referral share | **43.8%** (tertiary ED) |
| Low-acuity share | **81%** CTAS 4–5 |
| Age concentration | **53.6%** aged 20–40 |

**CareFlow implication:** Push notifications and voice reminders should be strongest Sunday evening / Monday morning. Hospital desk `wait_count` updates are most critical during morning peak.

---

## 8. Gap analysis — what exists vs what CareFlow proposes

| Capability | Smart Triage (Kenya) | Referral enforcement (KNH) | CareFlow |
|------------|---------------------|------------------------------|----------|
| When | At ED arrival | At hospital door | **Before** hospital door |
| Input | Clinical observations | Referral letter | Symptoms + rules |
| Output | Urgency category | Admit / redirect | KEPH level + facility + booking |
| Wait optimization | No | No | **Yes** (wait_count rank) |
| Booking + SMS | No | No | **Yes** |
| Population | Children < 15 | All (orthopedic subset studied) | All ages (MVP TBD) |

No published product was found that combines: community symptoms → KEPH level → nearest + shortest wait → booking → arrived/no-show → multimodal notes, in Kenya. Smart Triage and ETAT address **acuity at triage**; referral enforcement addresses **appropriate tier** reactively; neither optimizes **which facility** by wait.

---

## 9. Statistical risks and limitations for CareFlow pilots

1. **Hospital-entered wait counts** are not validated against HMIS — gaming and staleness risk.
2. **KMHFR gaps** (2,633 missing facilities) may cause wrong nearest-facility recommendations.
3. **Bypass behavior** is driven by commodity gaps — routing to Level 3 with no meds will fail.
4. **Undertriage** in Kenyan ED studies is ~50% with standard tools — red flags must be conservative.
5. **No-show rates ~35–43%** in Kenya — booking alone does not guarantee arrival.
6. **Evidence base** for pretriage routing is stronger in high-income and Asian settings than in Kenya specifically.

---

## 10. References

Full BibTeX in [sources.bib](sources.bib). Key citations:

1. Mwaura JM et al. Perception of waiting times on patient satisfaction, AKUHN. *PLOS One* 2025.
2. Gatundu Level V ED length of stay study. *IJCMPH* 2025.
3. Ong'ondo et al. Self-driven referral, Bungoma. *AJERNET* 2024.
4. Kamau S et al. Smart Triage vs ETAT, Kenya. *PLOS Digital Health* 2024.
5. Kenya Health Facility Census 2023. Ministry of Health.
6. Hinson JS et al. Triage interventions systematic review. *Scand J Trauma Resusc Emerg Med* 2011.
7. PLOS One 2019. One-way SMS and healthcare outcomes in Africa.
8. Ng JYH et al. Singapore Virtual Care Centre. *JMIR Form Res* 2026.
9. PLOS One 2023. KNH referral guideline enforcement.
10. Frontiers Health Services 2025. PHC implementation, seven Kenyan counties.
