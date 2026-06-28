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
