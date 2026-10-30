# NICU Pathway Portal — Design Specification

**Product:** MASAR — Critical Pathway Resource Control (RCC platform)
**Module:** NICU (Neonatal) Pathway Portal
**Scope:** Neonatal transfer coordination **+** NICU cot/capacity command center (combined)
**Status:** Draft v0.1 — for review before implementation
**Author:** Dr. Mohammed Alnami (Clinical AI Lead) · drafted with Claude
**Date:** 2026-10-30

---

## 1. Purpose & scope

The NICU Portal coordinates **neonatal referrals and inter-facility transfers** to an appropriate NICU cot, and gives the RCC a **live, network-wide view of NICU capacity** stratified by care level and cot type. It is the neonatal counterpart to the existing OB Maternal Transfer Portal and closes the loop the maternal KPI model already anticipates (`PregnancyKpiDailyAggregate.nicuRate`).

Two linked jobs, one portal:

1. **Transfer coordination** — a referring facility raises a neonatal transfer; the RCC matches it to a destination with the right NICU **level** and an available **cot type**, dispatches the neonatal retrieval team, and tracks the case through to handover.
2. **Capacity command center** — real-time NICU cot availability across all facilities (Level I/II/III; incubator / open warmer / ventilated), surfaced as the matching engine behind (1) and as a standalone situational dashboard.

**In scope:** ex-utero (baby already born) neonatal transfers; in-utero continuation linked to an OB Maternal transfer; NICU capacity visibility and destination matching; neonatal KPIs.
**Out of scope (phase 1):** direct device/monitor integration; automated cot-status telemetry (cot status is updated by the destination unit, as beds are today).

---

## 2. Architecture alignment (reuse, don't reinvent)

NICU mirrors the existing per-portal recipe exactly, so it inherits RBAC, ticketing, EMS dispatch, timeline, and audit wiring:

| Layer | Existing reference | NICU equivalent |
|---|---|---|
| Prisma schema | `ob-maternal-transfer.prisma` | `neonatal-transfer.prisma` (+ enums block) |
| Transfer module | `modules/ob-maternal-transfers/` | `modules/neonatal-transfers/` |
| Capacity model | `Unit` + `Bed` with `BedType.NICU` *(already exists)* | **reused**, extended with level + cot type |
| KPI aggregates | `modules/pregnancy-kpi-daily-aggregates/` + `pregnancy-kpi-daily-aggregate.prisma` | `modules/nicu-kpi-daily-aggregates/` + `nicu-kpi-daily-aggregate.prisma` |
| Capacity endpoints | `modules/beds/` | **reused**, + NICU-scoped availability/matching query |
| Frontend page | `pages/ObMaternal/` | `pages/Nicu/` |
| Frontend service | `services/obMaternalTransferService.ts` | `services/neonatalTransferService.ts` + `services/nicuCapacityService.ts` |
| Route + nav | `App.tsx` `/portals/ob-maternal`, `Sidebar.tsx` | `/portals/nicu`, `/portals/nicu/capacity` |

**Capacity reuse — important.** NICU cots are already modelled: a `Unit` with `bedType = NICU` holds `Bed` rows whose `status` is `VACANT/OCCUPIED/CLEANING/BLOCKED/RESERVED`. `Hospital.nicuBeds`/`nicuBedsAvailable` are already marked `@deprecated` in favour of this. So capacity = query NICU beds grouped by hospital × status. The **only gaps** are (a) NICU **care level** (I/II/III) and (b) **cot type** (incubator / open warmer / ventilated), neither of which is modelled yet.

---

## 3. Data model

### 3.1 New model — `NeonatalTransfer`

Mirrors `ObMaternalTransfer` structure (ticket/patient/created-by/status/timeline + clinical fields + referring/destination + acceptance + transport), with neonatal clinical fields replacing obstetric ones.

```prisma
// Neonatal transfer model for NICU pathway management
model NeonatalTransfer {
  id                    String                 @id @default(uuid())
  ticketId              String                 @map("ticket_id")
  patientId             String                 @map("patient_id")
  obMaternalTransferId  String?                @map("ob_maternal_transfer_id") // in-utero → ex-utero link
  createdById           String                 @map("created_by_id")
  createdAt             DateTime               @default(now()) @map("created_at")
  updatedAt             DateTime               @updatedAt @map("updated_at")
  status                NeonatalTransferStatus @default(CREATED)

  // Neonate identity
  gestationalAgeWeeks   Int                    @map("gestational_age_weeks")   // at birth
  gestationalAgeDays    Int?                   @map("gestational_age_days")
  birthWeightGrams      Int?                   @map("birth_weight_grams")
  ageHours              Int?                   @map("age_hours")               // hours of life
  apgar1                Int?                   @map("apgar_1")
  apgar5                Int?                   @map("apgar_5")
  apgar10               Int?                   @map("apgar_10")
  antenatalSteroids     Boolean?               @map("antenatal_steroids")

  // Vitals
  hr                    Int?
  rr                    Int?
  temp                  Float?                 // °C — drives normothermia KPI
  spo2                  Int?
  preDuctalSpo2         Int?                   @map("pre_ductal_spo2")
  postDuctalSpo2        Int?                   @map("post_ductal_spo2")
  bloodGlucose          Float?                 @map("blood_glucose")

  // Respiratory / support
  respiratorySupport    NeonatalRespiratorySupport? @map("respiratory_support")
  fiO2                  Int?                   @map("fio2")                    // %
  surfactantGiven       Boolean?               @map("surfactant_given")
  inotropes             Boolean?
  therapeuticHypothermia Boolean?              @map("therapeutic_hypothermia") // HIE cooling
  seizure               Boolean?

  // Problems (JSON array of enum/string)
  suspectedConditions   Json?                  @map("suspected_conditions")    // SEPSIS, NEC, RDS, HIE, DUCT_DEPENDENT, SURGICAL_ABDO, CONGENITAL_ANOMALY...
  stabilizationDone      Json?                 @map("stabilization_done")

  // Acuity scoring
  acuityLevel           NeonatalAcuityLevel    @map("acuity_level")            // RED / ORANGE / YELLOW
  tripsScore            Int?                   @map("trips_score")
  cribIIScore           Int?                   @map("crib_ii_score")

  // Capacity requirement (drives matching)
  requiredNicuLevel     NicuLevel              @map("required_nicu_level")     // LEVEL_I/II/III
  requiredCotType       NicuCotType            @map("required_cot_type")       // INCUBATOR/OPEN_WARMER/VENTILATED

  // Referring
  referringFacilityId   String                 @map("referring_facility_id")
  referringContactName  String?                @map("referring_contact_name")
  referringContactPhone String?                @map("referring_contact_phone")

  // Destination + acceptance
  destinationHospitalId String?                @map("destination_hospital_id")
  assignedBedId         String?                @map("assigned_bed_id")         // the NICU cot reserved
  acceptanceStatus      NeonatalAcceptanceStatus @default(PENDING) @map("acceptance_status")

  // Transport
  transportTeam         NeonatalTransportTeam  @map("transport_team")          // NEONATAL_RETRIEVAL / ALS / BLS / AIR
  transportIncubator    Boolean?               @map("transport_incubator")

  // Timeline (mirror OB: activation → connected → decision → dispatch → depart → arrive → close)
  activatedAt           DateTime?              @map("activated_at")
  neonatologistConnectedAt DateTime?           @map("neonatologist_connected_at")
  decisionAt            DateTime?              @map("decision_at")
  dispatchedAt          DateTime?              @map("dispatched_at")
  departedAt            DateTime?              @map("departed_at")
  arrivedAt             DateTime?              @map("arrived_at")
  closedAt              DateTime?              @map("closed_at")

  // Relations
  ticket                Ticket                 @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  patient               Patient                @relation(fields: [patientId], references: [id], onDelete: Cascade)
  obMaternalTransfer    ObMaternalTransfer?    @relation(fields: [obMaternalTransferId], references: [id], onDelete: SetNull)
  createdBy             User                   @relation("NeonatalTransferCreator", fields: [createdById], references: [id])
  referringFacility     Hospital               @relation("NeonatalReferringHospital", fields: [referringFacilityId], references: [id])
  destinationHospital   Hospital?              @relation("NeonatalDestinationHospital", fields: [destinationHospitalId], references: [id])
  assignedBed           Bed?                   @relation(fields: [assignedBedId], references: [id], onDelete: SetNull)

  @@map("neonatal_transfers")
  @@index([ticketId]) @@index([patientId]) @@index([status]) @@index([createdAt])
  @@index([referringFacilityId]) @@index([destinationHospitalId])
  @@index([requiredNicuLevel]) @@index([obMaternalTransferId])
}
```

### 3.2 Enums (new)

```prisma
enum NeonatalTransferStatus {
  CREATED
  ACTIVATED
  NEONATOLOGIST_CONNECTED
  DECISION_MADE
  DISPATCHED
  DEPARTED
  ARRIVED
  CLOSED
}
enum NeonatalAcuityLevel { RED ORANGE YELLOW }          // RED = unstable/ventilated
enum NicuLevel { LEVEL_I LEVEL_II LEVEL_III }           // confirm against MoH definitions
enum NicuCotType { INCUBATOR OPEN_WARMER VENTILATED }
enum NeonatalRespiratorySupport { ROOM_AIR LOW_FLOW HIGH_FLOW CPAP NIPPV INVASIVE_VENT HFOV }
enum NeonatalAcceptanceStatus { PENDING ACCEPTED DECLINED }
enum NeonatalTransportTeam { NEONATAL_RETRIEVAL ALS BLS AIR }
```

### 3.3 Capacity model — extend existing (do not duplicate)

- **`BedType.NICU`** already exists — reuse it as the NICU unit/cot type.
- **Add NICU care level + cot capability.** Two clean options (pick one in review):
  - **(A) On `Bed`** — add nullable `nicuCotType NicuCotType?` and `nicuLevel NicuLevel?` (level can also live on `Hospital`/`Unit`). Fine-grained per-cot capability; best for matching.
  - **(B) On `Hospital`/`Unit`** — add `hasNicuService Boolean`, `nicuLevel NicuLevel?` at facility level; cot type tracked via `Bed.notes`/`location`. Lighter, less precise.
  - **Recommendation:** **(A) + facility-level `hasNicuService`/`nicuLevel` on `Hospital`** (consistent with `hasStemiService` etc.), so matching can filter facility-by-level and reserve a specific cot-by-type.
- **Deprecate** `Hospital.nicuBeds` / `nicuBedsAvailable` further (already `@deprecated`) — computed from `Bed` at the service layer.
- **`CaseType`** enum is currently `GENERAL/STEMI/STROKE/TRAUMA`. Add `NICU` (and `OB` for parity) so a reserved cot's `caseType` can be stamped.

### 3.4 New model — `NicuKpiDailyAggregate`

Mirrors `PregnancyKpiDailyAggregate` (unique `[date, region]`, upsert-based):

```prisma
model NicuKpiDailyAggregate {
  id                       String   @id @default(uuid())
  date                     DateTime @db.Date @map("date")
  region                   String

  totalTransfers           Int      @default(0) @map("total_transfers")
  redCount                 Int      @default(0) @map("red_count")
  orangeCount              Int      @default(0) @map("orange_count")

  avgActivationToNeonatologist Float? @map("avg_activation_to_neonatologist")
  avgActivationToDispatch  Float?   @map("avg_activation_to_dispatch")
  avgDispatchToArrival     Float?   @map("avg_dispatch_to_arrival")
  avgReferralToAcceptance  Float?   @map("avg_referral_to_acceptance")

  cotMatchRate             Float?   @map("cot_match_rate")           // % placed at required level first attempt
  normothermiaOnArrival    Float?   @map("normothermia_on_arrival")  // % 36.5–37.5°C on arrival
  timeToSurfactantAvg      Float?   @map("time_to_surfactant_avg")
  declinedForCapacityRate  Float?   @map("declined_for_capacity_rate")
  inUteroVsExUteroRatio    Float?   @map("in_utero_vs_ex_utero_ratio")

  createdAt                DateTime @default(now()) @map("created_at")
  updatedAt                DateTime @updatedAt @map("updated_at")

  @@unique([date, region])
  @@map("nicu_kpi_daily_aggregates")
  @@index([date]) @@index([region]) @@index([date, region])
}
```

---

## 4. Backend module — `neonatal-transfers`

Files (mirror `ob-maternal-transfers/`): `.module.ts`, `.controller.ts`, `.service.ts`, `dto/create-neonatal-transfer.dto.ts`, `dto/update-neonatal-transfer.dto.ts`. Register in `app.module.ts`.

**Endpoints** (mirror OB controller + capacity/matching):

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/neonatal-transfers` | Create transfer (auto-creates ticket, like OB) |
| `GET` | `/neonatal-transfers` | List with filters (status, acuity, level, facility, date) |
| `GET` | `/neonatal-transfers/:id` | Detail |
| `PATCH` | `/neonatal-transfers/:id` | Update / advance status / set acceptance |
| `GET` | `/neonatal-transfers/kpi-summary` | Live KPI summary (mirror OB) |
| `GET` | `/nicu-capacity` | NICU cot availability by hospital × level × cot type |
| `GET` | `/nicu-capacity/match?level=&cotType=` | Ranked destination suggestions |
| `PUT` | `/nicu-kpi-daily-aggregates/upsert` | Daily aggregate upsert |

**DTO validation** — `class-validator` as in OB DTOs: required `gestationalAgeWeeks`, `acuityLevel`, `requiredNicuLevel`, `requiredCotType`, `referringFacilityId`, `transportTeam`; numeric ranges (GA 22–44 wks, FiO₂ 21–100, temp 30–42).

**Matching logic (the "both" link).** `nicu-capacity/match` returns destinations where `Hospital.hasNicuService && nicuLevel >= requiredNicuLevel` AND at least one `Bed{unit.bedType=NICU, status=VACANT, nicuCotType=requiredCotType}`, ranked by (level fit → distance/ETA via existing OSRM service → vacant-cot count). Reserving sets the `Bed.status=RESERVED`, stamps `assignedBedId` + `caseType=NICU`.

> **Aggregation note:** the OB aggregate is upsert-driven (no cron found). Recommend a scheduled nightly recompute (`@nestjs/schedule`) for NICU — flagged as an improvement, not a blocker.

---

## 5. Frontend — `pages/Nicu/`

```
pages/Nicu/
  NicuPortalPage.tsx              # transfer board (cases list + KPI header)
  NicuCapacityPage.tsx            # capacity command center (cot grid by hospital × level)
  components/
    CreateNeonatalTransferDialog.tsx
    EditNeonatalTransferDialog.tsx
    ViewNeonatalTransferDialog.tsx
    NeonatalCasesList.tsx
    NicuKpiDashboard.tsx
    NicuCapacityGrid.tsx
    DestinationMatchPanel.tsx     # shows ranked matches from /nicu-capacity/match
    forms/                        # multi-step wizard (mirror Trauma's step pattern)
      NeonateInfoStep.tsx         # GA, birth weight, APGAR, hours of life
      VitalsRespiratoryStep.tsx   # vitals, FiO2, support level, SpO2 pre/post-ductal
      ClinicalProblemsStep.tsx    # suspected conditions, cooling, surfactant, scores
      CapacityRequirementStep.tsx # required level + cot type → live match preview
      ReferralTransportStep.tsx   # referring facility, transport team/incubator
      ReviewStep.tsx
  constants/nicuConstants.ts      # option sets, bilingual labels
  types/nicuTypes.ts
  hooks/useNeonatalData.ts, useNicuKPICards.tsx, useNicuTimeline.ts
  services/nicuExportService.ts
  __tests__/                      # case + timeline validation (mirror Trauma tests)
```

**Services:** `services/neonatalTransferService.ts` (string-literal union types mirroring Prisma enums, `apiClient` pattern) + `services/nicuCapacityService.ts`.

**Routing** (`App.tsx`): `/portals/nicu` and `/portals/nicu/capacity`, each wrapped in `ProtectedRoute`.
**Nav** (`Layout/Sidebar.tsx`): "NICU Pathway Portal" + "NICU Capacity Center", grouped with the other pathway portals / command centers.
**RBAC:** suggest `allowedRoles={['ADMIN','RCC','HOSPITAL_USER','ED_NURSE','DATA_COLLECTOR']}` — confirm who may update cot status vs. create transfers.

---

## 6. KPIs (definitions)

| KPI | Definition | MoH/benchmark |
|---|---|---|
| Referral → acceptance | median mins, create → `ACCEPTED` | target TBD |
| Activation → neonatologist connected | median mins | — |
| Activation → dispatch | median mins | — |
| Dispatch → arrival | median mins | — |
| **Cot match rate** | % placed at required level on first attempt | higher = better |
| **Normothermia on arrival** | % arriving 36.5–37.5 °C | quality-of-transport marker |
| Time to surfactant | median mins for RDS cases | — |
| Declined-for-capacity rate | % declined due to no cot | system-strain marker |
| In-utero vs ex-utero ratio | antenatal (linked OB) vs postnatal transfers | — |

---

## 7. Bilingual (AR/EN)

All labels, enum display values, and dialog copy in Arabic + English via `constants/nicuConstants.ts` (same approach as OB/Trauma). Clinical option sets (conditions, support levels, cot types) carry both languages.

---

## 8. Build sequence (phased, each stage testable)

1. **Confirm data model** — enums, NICU level definitions, cot-type approach (§3.3 A vs B), scoring (TRIPS vs CRIB-II). *(one-way-door — resolve first)*
2. **Prisma schema + migration** — `neonatal-transfer.prisma`, enums, `Bed`/`Hospital` extensions, `CaseType.NICU`, `nicu-kpi-daily-aggregate.prisma`.
3. **Backend transfer module + DTOs** — CRUD + status lifecycle + `kpi-summary`.
4. **Capacity endpoints + matching** — `/nicu-capacity`, `/nicu-capacity/match`, cot reservation.
5. **Frontend types + services**.
6. **Portal page + wizard + cases list + view/edit**.
7. **Capacity command center page + match panel**.
8. **KPI dashboard + daily aggregates (+ scheduled recompute)**.
9. **RBAC, routes, nav, seed data, tests**.

---

## 9. File manifest (create / modify)

**Create — backend:** `prisma/schemas/neonatal-transfer.prisma`, `prisma/schemas/nicu-kpi-daily-aggregate.prisma`, `modules/neonatal-transfers/*`, `modules/nicu-kpi-daily-aggregates/*`, 1 migration.
**Modify — backend:** `prisma/schemas/enums.prisma` (new enums + `CaseType.NICU`), `prisma/schemas/bed.prisma` + `hospital.prisma` (level/cot fields), `src/app.module.ts` (register modules), `modules/beds/*` (NICU-scoped availability).
**Create — frontend:** `pages/Nicu/*` (above), `services/neonatalTransferService.ts`, `services/nicuCapacityService.ts`.
**Modify — frontend:** `App.tsx` (routes), `components/Layout/Sidebar.tsx` (nav).

---

## 10. Open decisions (confirm before build)

1. **NICU level definitions** — adopt Saudi MoH / cluster level criteria for I/II/III? (affects matching rules)
2. **Cot capability model** — §3.3 option **A** (per-cot) vs **B** (facility-level). Recommended: A + facility `hasNicuService`/`nicuLevel`.
3. **Acuity scoring** — TRIPS, CRIB-II, both, or a simple RED/ORANGE/YELLOW triage only for v1?
4. **Cot status ownership** — who updates NICU `Bed.status` (destination unit nurse? RCC?) and how often.
5. **In-utero linkage** — mandatory link from an OB Maternal transfer when antenatal, or optional?
6. **Capacity as separate command-center route** vs a tab inside the portal page.

---

## 11. Acceptance criteria (v1)

- Create a neonatal transfer via the wizard; a ticket is auto-created and the case appears on the board.
- Required level + cot type produce a ranked destination match; accepting reserves a specific NICU cot (`Bed.status=RESERVED`).
- Status advances through the full lifecycle with timestamps; timeline renders.
- Capacity center shows live NICU cot counts by hospital × level × cot type.
- KPI dashboard renders live summary; daily aggregate upsert works.
- All screens bilingual AR/EN; RBAC enforced on routes and endpoints.
- Case + timeline validation tests pass (mirror Trauma test suite).
