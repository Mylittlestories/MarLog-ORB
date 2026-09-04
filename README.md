# MarLog ORB — MARPOL Compliant Oil Record Book

A polished offline Oil Record Book for shipboard engineers, focused on MARPOL 73/78 Annex I records, vessel particulars, entry templates, audit-friendly corrections, PDF export, and JSON backup/restore.

## Download

Release binaries are published on the GitHub Releases page whenever a `v*` tag is pushed.

| Platform | Artifact | Notes |
|---|---|---|
| Android | `MarLog_ORB_Android.apk` | Direct APK install for Android devices |
| Windows | `MarLog ORB_2.1.3_Windows_x64.exe` | Electron NSIS installer |
| Windows portable | `MarLog_ORB_Windows_Portable.zip` | Unzip and run the executable |

## Features

- All MARPOL operation codes A–I with selectable item numbers.
- Vessel profile: IMO, flag, tonnage, vessel type, OWS/OCM and tank capacities.
- Entry templates for common engineering operations.
- Offline-first local persistence.
- PDF Oil Record Book export and JSON backup/restore.
- Correction workflow preserving original entries for audit traceability.
- Production desktop and Android build pipelines.

## Power Tool upgrade (v3 roadmap + prototype on `power-tool` branch)

The advancement plan is in [`docs/ADVANCEMENT.md`](docs/ADVANCEMENT.md). A non-breaking
proof-of-concept is already merged in and verified:

- **Live MARPOL compliance panel** on the entry form — data-driven rule engine
  (`src/lib/compliance/`) with severity badges and IMO rule references. Flags e.g.
  sludge-discharge-overboard, >15 ppm, special-area discharges, <12 nm from land,
  and tank-capacity overruns.
- **Special-area & distance resolver** — polygon approximations for all Annex I
  special areas plus a distance-to-land estimate (crude; exact coastline is a later phase).
- **Unified persistence layer** (`src/lib/storage/`) — typed IndexedDB store with
  versioned migrations, a localStorage fallback, and versioned backups. A "Backups"
  panel on the Export page lets you snapshot your data.
- **Multi-vessel data model + legacy migration** (`src/domain/model.js`) — normalises
  the current single-vessel shape into a fleet-ready, non-destructive store.
- **Analytics engine** (`src/lib/analytics/`) — monthly quantities, disposal summary,
  sludge generation rate and disposal efficiency (pure, testable functions).

Run the suite:

```bash
npm test
npm run test:watch
```

Note: `package.json` was repaired so dependencies resolve (several previously pinned
versions did not exist, e.g. `clsx@^2.1.3`).

## Build from source

### Prerequisites

- Node.js 22.12+ and npm 10+
- Java 21 and Android SDK for APK builds
- Windows runner/host for Windows `.exe` builds

### Commands

```bash
npm ci
npm run verify      # lint + production web build
npm run dev         # local Vite server
npm run build       # production web build

# Android APK, requires Java 21 + Android SDK
npm run build:android

# Windows installer, run on Windows
npm run build:electron:win
```

## Release process

1. Commit the desired changes.
2. Tag the release, for example `v2.1.3`.
3. Push the tag.
4. GitHub Actions builds the web app, APK, Windows installer, portable zip, and publishes the release assets.

```bash
git tag v2.1.3
git push origin v2.1.3
```

## Compliance note

MarLog ORB assists with MARPOL Annex I recordkeeping. Final responsibility for correctness, required signatures/countersignatures, flag-state requirements, company SMS procedures, and official acceptance remains with the vessel/operator.

## License

MIT License.
