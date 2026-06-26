# MarLog ORB — MARPOL Compliant Oil Record Book

**A precise, MARPOL 73/78 Annex I compliant Oil Record Book for marine engineers.**

Manage daily operations, record all 9 MARPOL operation codes (A–I), handle entry amendments, export PDFs, and stay compliant — all from a single application.

---

## 📥 Download the App

| Platform | File | Install |
|----------|------|---------|
| **Android** | `MarLog_ORB_Android.apk` | Install APK directly on Android device |
| **Windows** | `MarLog_ORB_Windows_Portable.zip` | Extract and run `.exe` — no installation needed |
| **iOS** | `MarLog_ORB_iOS.ipa` | Sideload via Finder, Xcode, or 3uTools |

> 📦 **Download binaries from the [Releases page](https://github.com/Mylittlestories/MarLog-ORB/releases)**

---

## Features

- ✅ **All 9 MARPOL Operation Codes** — A (COW), B (Ballasting), C (Discharge ballast), D (Slop discharge), E (Sludge disposal), F (Transfers), G (Bilge water), H (Corrections), I (Equipment status)
- ✅ **Vessel Profile Management** — IMO number, flag state, OWS specs
- ✅ **Entry Templates** — 6 pre-built templates + custom creation
- ✅ **MARPOL Corrections** — Audit-compliant correction workflow
- ✅ **PDF Export** — Full formatted Oil Record Book document
- ✅ **JSON Backup/Restore** — Export/import all data
- ✅ **Offline-First** — Works completely offline, data stored locally

---

## Tech Stack

- **Frontend:** React 18, Vite 6, Tailwind CSS
- **UI:** Radix UI primitives, shadcn/ui-style components
- **Mobile:** Capacitor 8 (Android + iOS)
- **Desktop:** Electron 41
- **PDF:** jsPDF

---

## Build from Source

### Prerequisites

| Platform | Requirements |
|----------|-------------|
| Android | Java 21, Node.js, Android SDK |
| Windows | Node.js |
| iOS | macOS, Xcode, Node.js |

### Commands

```bash
npm install
npm run dev          # Development server
npm run build        # Production web build

# Build all platforms
./BUILD_ALL_PLATFORMS.sh

# Android only
npx cap add android && npx cap sync android
cd android && ./gradlew assembleDebug

# Windows only
npm install electron electron-builder
npx electron-builder --win
```

---

## MARPOL Compliance

This app implements:
- **MARPOL 73/78, Annex I, Regulation 17** (Oil Record Book)
- **MEPC.106(49)** — Guidelines for the Oil Record Book
- **INTERTANKO / OCIMF** recommended entry formats

---

## 📁 Project Structure

```
marlog-orb/
├── src/                    # React source code (29 files)
├── pages/                  # App pages (Dashboard, Entries, etc.)
├── components/             # UI components
├── android/                # Capacitor Android project
├── ios/                    # Capacitor iOS project
├── electron/               # Electron desktop app
├── src-tauri/              # Tauri (alternative desktop)
├── .github/workflows/      # CI/CD for all platforms
├── release/                # Built binaries (APK, EXE, IPA)
└── BUILD_ALL_PLATFORMS.sh  # One-command cross-platform build
```

---

## License

MIT License — Free to use, modify, and distribute.
