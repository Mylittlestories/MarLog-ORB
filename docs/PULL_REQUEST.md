# MarLog ORB v3.0.0 — Fleet-ready, compliance-checked Oil Record Book 🚢

This PR is the **major v3.0.0 upgrade** of MarLog ORB: from a single-vessel Annex I
recorder to a **fleet-ready, compliance-checked, audit-grade** Oil Record Book. It also
adds a **GitHub Actions deploy to GitHub Pages** (built `dist/`, not raw source) and a
**CHANGELOG**, replacing the previously-committed `node_modules`/`dist` with a clean
gitignored history (already removed from tracking).

> **Note on scope:** the code for v3.0.0 was already merged and released on `main`
> (tag [`v3.0.0`](https://github.com/Mylittlestories/MarLog-ORB/releases/tag/v3.0.0)).
> This PR carries the *release housekeeping* delta on top: `deploy-pages.yml`,
> `CHANGELOG.md`, relative asset/manifest paths for subpath hosting, and a configurable
> Vite build `base`.

---

## 🔍 Summary of the v3.0.0 release (full changelog)

### ➕ Added
- **Multi-vessel fleet** with a global vessel switcher (add/remove vessels).
- **Fleet Setup** page: vessel profile, **tank registry** (capacity, soundings, capacity
  checks), **equipment registry** (OWS/OCM/15 ppm alarm/incinerator/ODME with calibration
  reminders), and **crew roster** (signature autocomplete, rank routing).
- **Live MARPOL compliance engine** in the entry form — data-driven Annex I rule set with
  `info / warning / blocked` severities, special-area detection (Mediterranean, Baltic,
  Black, Red, Gulfs, Gulf of Aden, Antarctic, N-W European, Wider Caribbean), distance-to-land
  estimate, and checks for sludge-overboard, >15 ppm, en-route, missing position, <12 nm,
  special-area discharge, tank-capacity overrun, overdue calibration, and Master
  countersignature. Blocked rules require a logged override with a reason.
- **Audit-true correction workflow** — voids the original (kept verbatim) and creates a
  cross-referenced corrected copy, with optional Master countersignature.
- **Analytics** — monthly volumes, entries-by-operation, disposal breakdown
  (shore/incinerated/to sea), disposal efficiency %, sludge generation rate.
- **Audit Log** — every create/edit/correct/delete recorded against time & device,
  filterable by entity.
- **Rules Reference** and **Special Areas** reference pages.
- **Export & Backup** hub — PDF ORB, **CSV**, versioned **JSON** backup/restore,
  on-device **snapshots**, clear-all danger zone.
- **Robust offline storage** — IndexedDB with versioned migrations + automatic snapshots
  + localStorage fallback + automatic v2 legacy migration (snapshot first).
- **Annex II / IV / V** selection for a multi-annex register.

### 🔧 Changed
- Normalized data model & pure store (`src/domain/model.js`, `src/lib/store.js`) with
  entities, soft delete, timestamps, reducer + selectors.
- Reference data and MARPOL rules made data-driven and versionable.
- **UI reworked for clarity / no bloat**: grouped sidebar nav, global vessel switcher,
  persistent "New Record Entry" button, shared UI kit, sectioned entry form with a
  template quick-apply strip and sticky compliance panel.
- Version → **3.0.0**.

### 🐞 Fixed
- `package.json` repaired so dependencies resolve (several pinned versions, e.g.
  `clsx@^2.1.3`, did not exist) — prior `npm ci`/build/CI release failed. Lockfile regenerated.

### 🧪 Testing
- **35 Vitest tests** (store, corrections, compliance, special areas, analytics, storage
  via fake-indexeddb) plus **app render** and **navigation smoke tests**.
- `npm test`, `npm run verify` (lint + build + test) all green.

### 🎨 Branding
- App icon (1024), SVG favicon, PWA icons (192/512), `apple-touch-icon`,
  `manifest.webmanifest`, theme color, README rewritten with hero banner, badges,
  feature table and architecture overview.

### 📦 This PR's delta
- `.github/workflows/deploy-pages.yml` — build & deploy `dist/` to GitHub Pages with
  `.nojekyll` and a subpath-aware `BASE_PATH`.
- `vite.config.js` — configurable `base` (env `BASE_PATH`).
- `index.html` / `public/manifest.webmanifest` — relative asset & start-url paths so the
  app works under the `/MarLog-ORB/` Pages subpath.
- `CHANGELOG.md` — full release history.
- `docs/PULL_REQUEST.md` — this description.
- `node_modules/` and `dist/` removed from git tracking & gitignored (already done).

---

## ✅ Tasks
- [x] Deploy the built web app to GitHub Pages
- [x] Trim committed `node_modules` (already untracked + gitignored)
- [x] Full changelog + documented release

## 🖼️ Preview
Live at **https://mylittlestories.github.io/MarLog-ORB/** once the Pages deploy succeeds.
