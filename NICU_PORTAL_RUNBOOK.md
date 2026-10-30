# NICU Portal — Local Build & Run Runbook

Branch: `feat/nicu-portal` (builds on `docs/nicu-portal-spec`).

The code is complete. Two steps could **not** run in the cloud sandbox because it
blocks Prisma's engine CDN (`binaries.prisma.sh`): generating the Prisma client and
running the migration. Both run normally on your machine. Everything else is verified
(frontend typechecks clean; backend TS transpiles clean).

## 1. Install (from repo root)

```bash
npm install          # root workspaces (backend postinstall runs `prisma generate`)
```

If install was done with `--ignore-scripts`, generate the client explicitly:

```bash
npm run db:generate -w apps/backend     # = schema:merge is NOT included here
# or, to re-merge the split schema files first:
npm run schema:generate -w apps/backend # merge schemas/*.prisma → schema.prisma, then generate
```

> The schema is split under `apps/backend/prisma/schemas/` and merged by
> `prisma/merge-schema.js`. The NICU files are already registered in the merge order.
> `schema.prisma` in the repo is already merged, but re-run `schema:merge` if you edit
> any `schemas/*.prisma`.

## 2. Database migration

Start Postgres (docker compose) and create the migration:

```bash
npm run db:up                                   # docker-compose postgres
cd apps/backend
npm run schema:merge                            # ensure merged schema is current
npx prisma migrate dev --name add_nicu_portal   # creates + applies the migration
```

This creates: `neonatal_transfers`, `nicu_kpi_daily_aggregates`, the new enums,
`beds.nicu_cot_type` / `beds.nicu_level`, `hospitals.has_nicu_service` /
`hospitals.nicu_level`, and `CaseType.NICU` / `CaseType.OB`.

## 3. Build / run

```bash
# from repo root
npm run dev            # backend + frontend concurrently
# or separately
npm run dev:backend
npm run dev:frontend
```

Portal routes (after login):
- `/portals/nicu` — NICU Pathway Portal (transfers + KPI dashboard + create)
- `/portals/nicu/capacity` — NICU Capacity Center (cot grid + destination match)

## 4. Make facilities NICU-capable (so capacity/matching has data)

For each NICU facility, set `hasNicuService = true` and `nicuLevel`, and give its
NICU `Unit` (`bedType = NICU`) some `Bed` rows with `nicuCotType` + `nicuLevel` set.
You can do this via Prisma Studio (`npm run db:studio -w apps/backend`) or a seed script.

## API surface added

| Method | Path |
|---|---|
| POST | `/neonatal-transfers` |
| GET | `/neonatal-transfers` (filters: status, acuityLevel, requiredNicuLevel, facility, dates) |
| GET | `/neonatal-transfers/:id` |
| PATCH | `/neonatal-transfers/:id` (advance status / timeline / acceptance) |
| GET | `/neonatal-transfers/kpi-summary` |
| GET | `/nicu-capacity` |
| GET | `/nicu-capacity/match?requiredNicuLevel=&requiredCotType=` |
| POST | `/nicu-capacity/:bedId/reserve` |

## Not yet included (noted follow-ups)

- `nicu-kpi-daily-aggregates` persistence module (the model exists; live KPI
  summary already powers the dashboard). Mirror `pregnancy-kpi-daily-aggregates`
  if you want persisted nightly aggregates + a scheduled recompute.
- Edit/View transfer dialogs and the full multi-step wizard (v1 ships a single
  create dialog with inline match; forms/ steps are scaffolded in the spec).
- Unit tests mirroring the Trauma `__tests__` suite.
- OSRM ETA ranking in `/nicu-capacity/match` (currently ranked by level fit →
  vacant-cot count).
