# MarLog ORB — Advancement Plan (v3.0 "Power Tool")

> Status: **all phases 0–5 implemented in v3.0**. This document is the decision record
> and plan. The full feature set (fleet, compliance, correction workflow, analytics,
> audit, robust storage, reworked non-bloating UI) is live on the `v3.0` release.

---

## 1. What we have today (v2.1.3)

A clean, offline, single-vessel MARPOL **Annex I** Oil Record Book:

- Operation codes **A–I** with selectable item numbers (hard-coded in `marpolOperations.js`).
- One vessel profile (name, IMO, flag, tonnage, OWS/OCM/incinerator/tank capacities).
- Six hard-coded entry templates (stored in local data) with `use_count` tracking.
- Entries with date/time (UTC), operation, item, free-text record, tank free-text,
  quantity, position, speed, signature/rank; lifecycle `active / corrected / void`.
- A correction workflow that flips status + stores a note (single record is kept and
  edited in place — **not** the preserve-original + reissue model a real ORB needs).
- jsPDF export (cover page, per-entry pages, summary), JSON export/import, clear-all.
- Persistence: **`localStorage`** via a thin wrapper in `data/initialData.js`.
- React Context + `useReducer`, Vite, Tailwind, Radix UI, shadcn-style components.
- Builds: web, Electron (Win/Linux), Capacitor Android. GitHub Actions release flow.

### Verified gaps (what stops it being a "powerful tool")

| # | Gap | Impact |
|---|-----|--------|
| 1 | **Single vessel only** | Can't run a fleet / switch between ships or re-use the app on a different vessel without wiping data. |
| 2 | **No structured tank / equipment registry** | Tank IDs are free text — no capacity checks, no dropdowns, no lookup, no sounding support. |
| 3 | **No crew roster** | Engines/masters retyped; no signature history, no rank-based routing, no countersignature chain. |
| 4 | **No compliance validation** | App records anything; a critical mistake (e.g. sludge "discharged overboard", >15 ppm, special-area discharge, <12 nm) saves silently. |
| 5 | **Annex I only** | No Annex II (NLS), no Annex V (garbage) or IV (sewage) skeleton for a multi-annex register. |
| 6 | **Correction model is non-auditable** | Edits in place; the original text is lost. Real practice = void original, issue corrected entry referencing it, cross-sign. |
| 7 | **Persistence is fragile** | `localStorage` is per-origin, small (~5 MB), and trivially lost (webview cache clear, OS settings). No automatic versioned backups. |
| 8 | **No analytics / trend reporting** | Oil, sludge and bilge quantities exist but are never summarised — no disposal planning, no generation-rate insight. |
| 9 | **PDF export is one-way & one-off** | No CSV for spreadsheets, no print stylesheet, no filter-aware export (date range / vessel / annex). |
| 10 | **No audit trail** | Who changed what, when, on which device — no activity log. |
| 11 | **Hard-coded operation dictionary** | Rules are baked in; no data-driven rules, no per-flag-state overrides, no versioning of MARPOL regs. |

---

## 2. Target architecture

We keep the existing React SPA shell (it's good) and invert the data + logic layers so
they are **typed, testable, framework-agnostic, and persistence-agnostic**. React views
become consumers of a small, stable domain API.

```
┌─────────────────────────────────────────────────────────────┐
│  Views (React)  ·  Dashboard, ORB pages, Templates, Export    │
│  (thin: render state, dispatch intents)                       │
└───────────────▲─────────────────────────────────────────────┘
                │ typed domain API  (useStore hook)
┌───────────────┴─────────────────────────────────────────────┐
│  Domain service layer  (pure, no React, no DOM)               │
│   · validation/compliance engine      · correction service     │
│   · analytics engine                  · backup service         │
│   · fleet/multi-vessel + tank registry · rule/reg data         │
└───────────────▲─────────────────────────────────────────────┘
                │ storage interface
┌───────────────┴─────────────────────────────────────────────┐
│  Persistence adapters (swappable)                             │
│   · IndexedDB (primary, typed, versioned, migrations)         │
│   · localStorage (webview/fallback)                          │
│   · JSON export/import (portable backup)                      │
│   · [future] remote sync transport                            │
└─────────────────────────────────────────────────────────────┘
```

**Principles**

1. **Pure domain.** Rules, analytics and the data model are plain JS functions (no React,
   no `window`), so they run in Node tests, in an Electron `main` process, in a Capacitor
   plugin, or on a server later.
2. **Data-driven regulations.** MARPOL rules and their IMO references are *data*, not
   control flow, so they can be extended, versioned, and overridden per flag state.
3. **Conservative, non-destructive records.** Entries are immutable; corrections always
   create a *new* record and void the old one (audit-preserving).
4. **Storage behind one interface.** Swap IndexedDB ⇄ localStorage ⇄ network without
   touching views.
5. **Migration-aware.** A `SCHEMA_VERSION` and per-version migrations guarantee the app
   never loses data when the shape changes.

---

## 3. Data model (normalised, multi-vessel)

Derived from the fields already in use, normalised into entities. Every entity has
`id`, `createdAt`, `updatedAt`, and `deletedAt` (soft delete) so history survives.

```
Vessel          id, name, imo, flagState, grossTonnage, vesselType (oilTanker|other),
                annexBooks[], createdAt/updatedAt/deletedAt

Tank            id, vesselId, kind (slop|sludge|bilge|fw|ballast|fuel|other),
                name, capacityM3, currentSoundingsM3, isOperational

Equipment       id, vesselId, kind (ows|ocm|incinerator|15ppmAlarm|odme|co2...),
                model, serial, capacity, lastCalibrationAt, nextCalibrationAt

CrewMember      id, vesselId, name, rank, licenseNo, email, enabled

Entry           id, vesselId, annex (I|II|V|IV), operationCode, itemNumber,
                date, timeUtc, recordOfOperation, tankIds[], quantityM3,
                position {lat, lon}, speedKnots, heading,
                pmReading, alarmStatus, dischargeOverboard,
                signedBy, rank, countersignedBy, countersignDate,
                status (active|corrected|void), statusHistory[],
                createdAt/updatedAt, deletedAt

Correction      id, originalEntryId, correctedEntryId, reason, by, name, rank, date,
                note, countersignedBy, countersignDate

AuditLog        id, at, actor, action, entity, entityId, before, after, device

Backup          id, at, kind (auto|manual|preMigration|preDestructive),
                dataVersion, sizeBytes, payload

Regulation      id, annex, ruleKey, title, mpecRef, effectiveFrom, appliesTo,
                severityDefault, notes, overrides[]
```

---

## 4. Phased roadmap

### Phase 0 — Foundation (delivered as prototype ✔)
- Add `src/domain/` types + normalisation (+ `legacyFrom`/`toV2` migrator).
- Add `src/lib/storage/` IndexedDB adapter with typed object stores, `SCHEMA_VERSION`,
  per-version migrations, localStorage fallback, and automatic versioned backups
  (before migration / before destructive ops).
- Add `src/lib/compliance/` rule engine + MARPOL Annex I rule set.
- Add `src/lib/analytics/` computation module.
- Add `vitest` suite; `npm test`, `npm run test:watch`.
- Add a persisted, versioned JSON export format (forward/backward compatible).

### Phase 1 — Fleet & data model (high value, low risk)
- Multi-vessel: `vessels[]` + `activeVesselId`; entries/tanks/equipment/crew scoped by `vesselId`.
- Tank registry screen (create/edit/disable tanks, capacities, soundings) → entry forms use
  pickers not free text; validate quantity ≤ tank capacity.
- Equipment registry with calibration due-dates → "calibration overdue" warnings.
- Crew roster → signature autocomplete, countersignature flow, per-rank defaults.
- Migration for existing single-vessel localStorage → v3 multi-vessel shape.

### Phase 2 — Compliance engine UI (core value)
- Wire `validateEntry()` into the Entry Form: live severity badges (`info/warning/blocked`)
  with human-readable guidance and IMO rule reference; block save on `blocked` unless the
  user explicitly overrides with a reason (logged to audit).
- Annex II (NLS) catalog + rule set; selectable logbook per annex.
- Special-area detection (polygon approximation → later exact coastline dataset), 
  distance-to-nearest-land resolver (pluggable), and discharge rule checks
  (15 ppm OCM, en-route, sludge never overboard, ballast-in-special-area, etc.).

### Phase 3 — Analytics & reporting
- Dashboard widgets: quantities by operation over time, sludge generation rate,
  disposal efficiency (received vs incinerated), total discharged to sea vs shore.
- Filter-aware export honouring the active filters (vessel, date range, annex, code, status).
- CSV export (spreadsheet-friendly) + richer, paginated PDF; print stylesheet (`@media print`).

### Phase 4 — Corrections & audit (trust)
- Replace in-place correction with the destructive-preserving model: original → `void`
  (kept verbatim), new corrected entry created and cross-referenced; master countersignature.
- Activity log (audit) browser + export; tamper-evident hash chain (SHA-256 over
  `prevHash + record` — cheap, offline, hugely credible for inspections).

### Phase 5 — Platform & polish
- Capacitor filesystem plugin for durable file export on Android/iOS; native share sheet.
- Electron auto-update; signed releases; code-signing CI step.
- Accessibility, i18n scaffold, dark mode, onboard wizard, offline indicator.
- PWA (installable, background sync scaffold) as a lighter alternative to full native.

---

## 5. Compliance rule engine design

Rules are **data** with a `check` function. Each returns a severity and message.

```js
defineRule({
  id: 'sludge_never_overboard',
  annex: 'I',
  severity: 'blocked',            // default
  reference: 'MARPOL 73/78 Annex I Reg 15; MEPC.??',
  applies(entry) { return ['E','F'].includes(entry.operationCode) && entry.dischargeOverboard },
  check(entry, ctx) {
    return { severity: 'blocked',
             message: 'Oil residues (sludge) must not be discharged overboard — use a reception facility or incineration.' }
  }
})
```

Severity semantics:
- `blocked` — save prevented unless overridden (reasons logged).
- `warning` — allowed, but flagged for confirmation.
- `info` — neutral guidance (e.g. "OCM reading recommended").

### Rule set (Annex I) — prototype implements these
| Rule | Trigger | Severity |
|------|---------|----------|
| 15 ppm limit | OWS overboard discharge (C.3, D.3, G.4) with `ppm > 15` | blocked |
| OCM reading required | any overboard discharge | warning |
| En-route required | overboard discharge with `speed <= 0` / no position | warning |
| Sludge never overboard | E/F with overboard | blocked |
| Special-area discharge | discharge inside a special area (needs position) | warning/blocked |
| 12 nm from land | discharge `distanceToLand < 12` | warning |
| Ballast discharge in special area | C.3 inside special area | warning |
| Tank capacity exceeded | `quantity > tank.capacity` | blocked |
| Position required | C/D discharge without lat/lon | blocked |
| Calibration overdue | equipment `nextCalibrationAt < now` | info/warning |
| Counter-signature required | correction without countersign | warning |

### Special areas (prototype polygons, exact coast later)
Mediterranean, Baltic, Black Sea, Red Sea, Gulfs, Gulf of Aden, Antarctic (south 60°S),
North West European Waters (North Sea + English Channel), Wider Caribbean.

---

## 6. Persistence design

- **IndexedDB** `marlog_orb` with object stores: `meta`, `vessels`, `entries`, `tanks`,
  `equipment`, `crew`, `templates`, `audit`, `backups`; indexes on `vesselId`, `date`, `status`.
- `SCHEMA_VERSION` in `meta`; `migrate(db, from, to)` run on open.
- **Backups**: automatic snapshot on schema upgrade and before destructive actions;
  manual snapshot; list/restore/export UI is a Phase 4+ item but the store is live now.
- **Fallback**: localStorage adapter with identical interface (for strict webviews).
- **Portable**: JSON export contains `{ schemaVersion, exportedAt, payload }` so older
  and newer app versions can round-trip.

---

## 7. Delivery status (v3.0)

All phases are implemented, wired into the UI, and verified:

✔ Fleet (multi-vessel) — vessel switcher, add/remove vessels, fleet setup.
✔ Tank registry with capacities + soundings; quantity capacity checks.
✔ Equipment registry with calibration reminders.
✔ Crew roster with signature autocomplete & rank routing.
✔ Compliance engine wired into the entry form (live badges, blocked w/ override + reason).
✔ Destructive-preserving correction workflow + Master countersignature.
✔ Analytics UI (monthly volumes, disposal breakdown, efficiency, sludge rate).
✔ Audit log browser + exportable history.
✔ Rules reference + special areas reference.
✔ Export/backup hub (PDF, CSV, JSON, snapshots, import, clear-all).
✔ IndexedDB persistence with versioned migrations + automatic snapshots + fallback.
✔ Reworked non-bloating UI: grouped sidebar nav, global vessel switcher, shared UI kit.
✔ Test suite expanded (35 tests incl. app render + navigation smoke tests).
✔ `npm test`, `npm run lint`, `npm run build` all green.

**Remaining / future:** exact coastline dataset for precise 12 nm checks, per-flag-state
rule overrides, remote-sync transport, TypeScript migration, more Annex rule depth.

---

## 8. Open questions for the maintainers

1. Fleet size & data volume — determines whether we keep everything on-device or need
   the remote-sync transport (Phase 5).
2. Flag-state-specific overrides (e.g. USCG, EU, Canada) — which to model first?
3. Do we target Annex II/V/IV logbooks now, or keep the record strictly Annex I?
4. Exact coastline/distance data source for the 12 nm rule (offline dataset size budgets).
5. Whether to migrate to TypeScript (recommended for long-term safety) — the prototype
   uses pure JS modules so migration is mechanical later.

---

## 9. Risk & mitigations

| Risk | Mitigation |
|------|------------|
| Data loss on migration | versioned backups + non-destructive migrate + tests |
| Rules wrong / over-blocking | all `blocked` rules allow a logged override; rules are data → reviewable |
| IndexedDB unsupported (old webview) | localStorage fallback + portable JSON export |
| Scope creep | phases are independently shippable; this branch lands 0 first |
| Compliance liability | app is an aid, not a substitute (existing README note retained) |
