# MarLog ORB — MARPOL Compliant Oil Record Book

**A precise, MARPOL 73/78 Annex I compliant Oil Record Book for marine engineers.**

Manage daily operations, record all 9 MARPOL operation codes (A–I), handle entry amendments, export PDFs, and stay compliant — all from a single application available on **Android**, **iOS**, **Windows**, **macOS**, and **Linux**.

---

## 📥 Download Binaries

> **Latest built files are in the `release/` folder.**

| Platform | File | Size |
|----------|------|------|
| **Android** (APK) | `release/MarLog_ORB_Android.apk` | ~4.4 MB |
| **Windows** (Portable ZIP) | `release/MarLog_ORB_Windows_Portable.zip` | ~137 MB |
| **Windows** (Unpacked EXE) | `release/win-unpacked/MarLog ORB.exe` | ~213 MB |
| **iOS** (IPA) | Build on macOS or use GitHub Actions |

### To install Android APK:
1. Download `MarLog_ORB_Android.apk`
2. Enable "Install from unknown sources" on your Android device
3. Open the APK file and install

### To run Windows:
1. Download `MarLog_ORB_Windows_Portable.zip`
2. Extract anywhere (no installation needed)
3. Run `MarLog ORB.exe`

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

## Quick Start (Web / Dev)

```bash
npm install
npm run dev
```
Open http://localhost:5173

```bash
npm run build    # Production build → dist/
```

---

## Build All Platforms from Source

### Prerequisites

| Platform | Requirements |
|----------|-------------|
| Android | Java 21+, Android SDK, Node.js |
| Windows | Node.js, electron-builder |
| iOS | macOS, Xcode, Node.js |
| Linux | Node.js, electron-builder |

### Run the build script

```bash
./BUILD_ALL_PLATFORMS.sh
```

### Or build individually

**Android:**
```bash
# Set JAVA_HOME and ANDROID_HOME, then:
npm run build
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap add android
npx cap sync android
cd android && ./gradlew assembleDebug
```

**Windows:**
```bash
npm run build
npm install electron electron-builder
npx electron-builder --win
```

**iOS** (requires macOS):
```bash
npm run build
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap add ios
npx cap sync ios
# Open ios/App/App.xcworkspace in Xcode
# Select your team for code signing
# Build → Product → Archive → Export
```

---

## GitHub CI/CD (Automatic Builds)

Push a version tag to automatically build all platforms:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The `.github/workflows/build.yml` workflow will:
- Build and upload the **Android APK**
- Build and upload the **Windows EXE + ZIP**
- Build and upload the **iOS IPA** (on macOS runner)

Downloads appear in the GitHub Release draft.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 6, Tailwind CSS |
| UI | Radix UI primitives, shadcn/ui-style components |
| Mobile | Capacitor 8 (Android + iOS) |
| Desktop | Electron 41 |
| PDF | jsPDF |
| Storage | Browser localStorage |
| Build | electron-builder, Gradle, CocoaPods |

---

## MARPOL Compliance

This app implements:
- **MARPOL 73/78, Annex I, Regulation 17** (Oil Record Book)
- **MEPC.106(49)** — Guidelines for the Oil Record Book
- **INTERTANKO / OCIMF** recommended entry formats

All operation codes and item numbers follow the official MARPOL format. Entry corrections are handled per regulation — original entries remain legible with a signed correction note.

---

## License

MIT License
