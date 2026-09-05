<div align="center">

<br/>

# 🚢 MarLog ORB

### MARPOL-compliant Oil Record Book for shipboard engineers

*Offline-first · Multi-vessel · Compliance-checked · Audit-ready*

<br/>

![banner](branding/banner.png)

<br/>

**An offline-first Oil Record Book built for marine engineers. Record MARPOL Annex I
operations, get live compliance checks, manage your whole fleet, and export official
PDFs — all without internet, all on your device.**

<br/>

[![MARPOL](https://img.shields.io/badge/MARPOL-73%2F78%20Annex%20I-0b1f3a)](#)
[![Platform](https://img.shields.io/badge/Platforms-Web%20·%20Android%20·%20Windows%20·%20Linux-0e4a8f)](#)
[![Offline-first](https://img.shields.io/badge/Offline--first-Yes-16a34a)](#)
[![License](https://img.shields.io/badge/License-MIT-f59e0b)](LICENSE)

</div>

---

## ✨ What it does

MarLog ORB is a **MARPOL Annex I Oil Record Book** that runs entirely on your device.
It replaces the paper register with a fast, searchable, compliance-checked digital
record that you can print or export at any time — on the bridge, in the engine room,
or in the office.

## 🎯 Key features

| | Feature | Description |
|---|---|---|
| 🗂️ | **Multi-vessel fleet** | Manage several ships and switch between them instantly from the sidebar. |
| 📋 | **All MARPOL codes A–I** | Operation codes and items, plus **Annex II / IV / V** selection for a multi-annex register. |
| 🛡️ | **Live compliance checks** | Data-driven MARPOL rule engine with severity badges (`info / warning / blocked`). Flags **sludge-overboard**, **>15 ppm**, **special-area discharges**, **<12 nm from land** and **tank-capacity overruns** before you save. |
| 🧪 | **Tank & equipment registry** | Real tanks with capacities and soundings, plus OWS/OCM/15 ppm alarm/incinerator/ODME equipment with **calibration reminders**. Capacity check against your quantity. |
| 👷 | **Crew roster** | Signature autocomplete, rank routing, and **Master countersignature** for corrections. |
| ✍️ | **Audit-true corrections** | Destructive-preserving correction: the original is retained as *void*, a corrected copy is created with a cross-reference and your reason logged. |
| 📊 | **Analytics** | Monthly oil/sludge/bilge volumes, disposal breakdown (shore / incinerated / to sea), **sludge generation rate**, and disposal efficiency. |
| 🕵️ | **Audit log** | Every create / edit / correct / delete recorded against time and device — exportable. |
| 💾 | **Robust storage** | IndexedDB with **versioned migrations** and automatic **snapshots** (before upgrades & destructive actions), plus a portable JSON backup/restore. |
| 🖨️ | **Export** | Formatted **PDF** Oil Record Book, **CSV** for spreadsheets, and versioned **JSON** backup. |
| 📱 | **Works anywhere** | Responsive web app; builds for **Android (Capacitor)**, **Windows/Linux (Electron)**. Installable as a PWA. |

## ⬇️ Download

Grab the ready-to-run release for your platform from the
[latest release](https://github.com/Mylittlestories/MarLog-ORB/releases).

| Platform | Artifact | How to use |
|---|---|---|
| 🖥️ **Windows** | `MarLog.ORB_x.x.x_Windows_x64.exe` | Installer — double-click to install. |
| 🪟 **Windows (single .exe)** | `MarLog_ORB_Windows_x64_Portable.exe` | **One double-click, no install.** App + bundled browser in a single file — run from anywhere, no admin needed. |
| 🪟 **Windows (portable zip)** | `MarLog_ORB_Windows_Portable.zip` | Unzip and run the `.exe` anywhere. |
| 🤖 **Android** | `MarLog_ORB_Android.apk` | Direct APK install (allow unknown sources). |
| 🌐 **Single file (any OS)** | `MarLog_ORB_Web_SingleFile.html` | **Double-click and open in a browser.** All-in-one, no server or install. Fully offline. |
| 🌐 **Web bundle** | `MarLog_ORB_Web.zip` | Static bundle — host it (Pages/Netlify/Nginx) or open via a local server. |

> The **single-file HTML** is a self-contained build with all code embedded — download it
> and just double-click to use MarLog ORB anywhere, with no install and no internet.
> (Data is stored per-browser; use **Export & Backup → Download backup** to move your
> records between devices.)

## 🖼️ Screens

| Dashboard | Entry form with compliance panel | Analytics |
|---|---|---|
| Quick glance at totals, recent entries and quick actions. | Add an operation, pick tanks and crew, and see live compliance results as you type. | Trends, disposal breakdown and generation rate. |

> Screenshots are illustrative. Open the app and explore the sidebar — everything is
> one click away and never bloated.

## 🚀 Getting started

### Prerequisites
- **Node.js 22.12+** and **npm 10+**
- **Java 21 + Android SDK** to build the Android APK
- A **Windows runner/host** for the Windows `.exe`

### Install & run

```bash
npm ci          # or: npm install
npm run dev     # local dev server (Vite)
```

### Test, lint, build

```bash
npm test            # run the test suite (35+ tests)
npm run test:watch  # interactive
npm run verify      # lint + build + test
npm run build       # production web build in dist/
```

### Build desktop / mobile

```bash
# Android APK (requires Java 21 + Android SDK)
npm run build:android

# Windows installer (run on Windows)
npm run build:electron:win

# Linux + Windows electron
npm run build:electron
```

## 🔒 Data & compliance

- **Offline-first.** All data lives on the device (IndexedDB, with a localStorage
  fallback). No account, no server, no internet needed.
- **Versioned & safe.** The schema is versioned and migrations snapshot your data first.
  Export a JSON backup any time for portability.
- **Advisory by design.** The compliance engine is *guidance*, not a substitute for
  human judgement, flag-state rules or your company's SMS. Final responsibility for
  correctness, signatures and official acceptance remains with the vessel/operator.
- **Open data.** Regulations, operation codes and items are defined as data
  (`src/data/catalog.js`, `src/lib/compliance/regulations.js`), so they're easy to
  review, extend and version per flag state.

## 🧱 Architecture

```text
Views (React)           Dashboard · Entries · Entry form · Fleet · Analytics · Rules · Audit · Data
        │ typed domain API
Domain services (pure)  compliance engine · analytics · corrections · backup · fleet model
        │ storage interface
Persistence adapters     IndexedDB (primary, migrations, snapshots) ⇄ localStorage fallback ⇄ JSON export
```

- Pure, testable domain logic (no React/DOM) — runs in Node tests, Electron, Capacitor
  plugins or a future server.
- Single unified store (`src/lib/store.js`) with a typed reducer, selectors and audit.

## 📚 Project structure

```
src/
  pages/         UI pages (Dashboard, Entries, EntryForm, Fleet, Analytics, Rules, Audit, Data)
  components/    Reusable UI (misc kit) + feature components (sidebar, compliance panel, dialogs)
  store/         AppContext provider (boot, load/migrate, persist)
  lib/           Pure logic: store, compliance, analytics, storage adapters, PDF/CSV export
  domain/        Entity model + legacy migrator
  data/          Reference catalog (operations, vessels, ranks, annexes)
tests/           Vitest suites incl. app render + navigation smoke tests
docs/            ADVANCEMENT.md roadmap & decisions
branding/        App icon + README banner
```

## 📦 Release process

1. Commit the desired changes.
2. Tag a release, e.g. `v3.0.0`.
3. Push the tag. GitHub Actions builds the web app, Android APK, Windows installer and
   portable zip, then publishes the release assets.

```bash
git tag v3.0.0
git push origin v3.0.0
```

## 📄 License

[MIT](LICENSE)

---

<div align="center">

**MarLog ORB** — made for the sea.

<br/>

[Report an issue](https://github.com/Mylittlestories/MarLog-ORB/issues) · [Read the roadmap](docs/ADVANCEMENT.md)

</div>
