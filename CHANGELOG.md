# Changelog

All notable changes to MarLog ORB are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project follows
[Semantic Versioning](https://semver.org/).

## [3.0.0] - 2026-09-04

### 🚀 Major upgrade — the "Power Tool" release

MarLog ORB grew from a single-vessel Annex I recorder into a fleet-ready,
compliance-checked, audit-grade Oil Record Book.

#### Added
- **Multi-vessel fleet** — add/remove vessels and a global vessel switcher in the sidebar.
- **Fleet Setup** page with three tabs:
  - **Vessel** profile (name, IMO with check-digit validation, flag, tonnage, type).
  - **Tanks** registry (kind, capacity, soundings, operational toggle) with capacity checks.
  - **Equipment** registry (OWS, OCM, 15 ppm alarm, incinerator, ODME) with calibration
    due-date reminders.
  - **Crew** roster with signature autocomplete and rank routing.
- **Live MARPOL compliance engine** wired into the entry form:
  - Data-driven Annex I rule set with `info / warning / blocked` severities.
  - Special-area detection (Mediterranean, Baltic, Black, Red, Gulfs, Gulf of Aden,
    Antarctic, N-W European, Wider Caribbean) and a distance-to-land estimate.
  - Checks for sludge-overboard, >15 ppm OCM, en-route requirement, missing position,
    <12 nm from land, special-area discharges, tank-capacity overruns, overdue
    calibrations, and missing Master countersignature.
  - Blocked rules require an explicit override with a reason (logged to the audit trail).
- **Audit-true correction workflow** — correcting an entry voids the original (kept
  verbatim with reason/author/date) and creates a cross-referenced corrected copy, with
  an optional Master countersignature.
- **Analytics page** — monthly oil/sludge/bilge volumes, entries-by-operation, disposal
  breakdown (shore / incinerated / to sea), disposal efficiency %, and sludge generation rate.
- **Audit Log** page — every create / edit / correct / delete recorded against time and
  device, filterable by entity.
- **Rules Reference** and **Special Areas** reference pages.
- **Export & Backup** hub — formatted PDF Oil Record Book, spreadsheet-friendly **CSV**,
  portable **JSON** backup/restore, on-device **snapshots**, and a clear-all danger zone.
- **Robust offline-first storage** — typed **IndexedDB** store with versioned migrations
  and automatic pre-migration/pre-destructive snapshots, plus a **localStorage** fallback
  and automatic migration of existing v2 legacy data (snapshot taken first).
- **Annex II / IV / V** selection for a multi-annex register (Annex I fully modelled).

#### Changed
- Reworked **UI for clarity and to avoid bloat**:
  - Grouped sidebar navigation (Overview / Record Book / Fleet / Compliance / Insights / Data).
  - Global vessel switcher and a persistent "New Record Entry" button.
  - Shared UI kit (PageHeader, StatCard, EmptyState, ConfirmDialog, form fields) so every
    screen is consistent, compact and scannable.
  - Entry form split into clear sections with a template quick-apply strip and a sticky
    compliance panel.
- **XML → normalized data model** (`src/domain/model.js`, `src/lib/store.js`): entities
  (`vessel`, `tank`, `equipment`, `crew`, `entry`, `template`, `audit`, `backup`) with soft
  delete, timestamps and a pure reducer + selectors.
- Reference data (MARPOL codes/items, ranks, annexes) moved to a data catalog
  (`src/data/catalog.js`) and rules to `src/lib/compliance/regulations.js` so they are
  extensible and versionable.
- Persistence and PDF/CSV export moved behind pure, testable modules.
- Version bumped to **3.0.0**.

#### Fixed
- Repaired `package.json` so dependencies resolve (several previously pinned versions,
  e.g. `clsx@^2.1.3`, did not exist) — prior `npm ci` / build / CI release failed.
- Regenerated the lockfile.

#### Added (tooling & docs)
- **Vitest** test suite (35 tests): store reducer, correction workflow, fleet ops,
  compliance engine, special areas, analytics, storage (fake-indexeddb), plus full
  **app render** and **navigation smoke tests**.
- `npm test`, `npm run test:watch`, and `npm run verify` (lint + build + test).
- Docs: `docs/ADVANCEMENT.md` roadmap & decision record.

#### Branding
- App icon (1024 px), favicon (SVG), PWA icons (192/512), `apple-touch-icon`,
  `manifest.webmanifest`, theme color, and a rewritten README with a hero banner,
  badges, feature table, and architecture overview.

## [2.1.3] - 2026-08-31 (baseline before upgrade)

- Single-vessel MARPOL Annex I Oil Record Book.
- Operation codes A–I with selectable item numbers.
- Vessel profile, entry templates, jsPDF export, JSON backup/restore, correction workflow.
- Offline-first localStorage persistence; Android (Capacitor) + Windows/Linux (Electron) builds.

[3.0.0]: https://github.com/Mylittlestories/MarLog-ORB/releases/tag/v3.0.0
