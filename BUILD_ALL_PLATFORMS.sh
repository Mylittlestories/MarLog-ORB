#!/bin/bash
# ============================================================
# MarLog ORB — Build All Platforms
# ============================================================
# This script builds all platform binaries.
#
# Requirements:
#   - Android: Java 21, Android SDK (Android SDK cmdline-tools)
#   - Windows: Node.js (Electron Builder, no Wine needed)
#   - iOS: macOS with Xcode (run on Mac hardware)
# ============================================================

set -e

echo "============================================"
echo "MarLog ORB — Cross-Platform Build Script"
echo "============================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Web App Build (required for all platforms)
echo -e "${YELLOW}Step 1: Building Web App...${NC}"
npm install
npm run build
echo -e "${GREEN}✓ Web app built${NC}"

# 2. Android APK
if [ -d "$ANDROID_HOME" ] || [ -d "$HOME/android-sdk" ]; then
    echo -e "${YELLOW}Step 2: Building Android APK...${NC}"
    export ANDROID_HOME="${ANDROID_HOME:-$HOME/android-sdk}"
    export JAVA_HOME="${JAVA_HOME:-$HOME/java21}"
    export PATH="$JAVA_HOME/bin:$PATH"
    
    npm install @capacitor/core @capacitor/cli @capacitor/android
    npx cap add android
    npx cap sync android
    cd android && ./gradlew assembleDebug
    cp app/build/outputs/apk/debug/app-debug.apk ../release/MarLog_ORB_Android.apk
    cd ..
    echo -e "${GREEN}✓ Android APK built → release/MarLog_ORB_Android.apk${NC}"
else
    echo -e "${YELLOW}⚠ Android SDK not found. Install Android SDK first.${NC}"
fi

# 3. Windows EXE
if command -v npx &> /dev/null; then
    echo -e "${YELLOW}Step 3: Building Windows EXE...${NC}"
    npm install electron electron-builder --save-dev
    npx electron-builder --win --dir
    cp release/win-unpacked/*.exe release/MarLog_ORB_Windows.exe 2>/dev/null || true
    cd release && zip -qr MarLog_ORB_Windows_Portable.zip win-unpacked/
    cd ..
    echo -e "${GREEN}✓ Windows EXE built → release/MarLog_ORB_Windows_Portable.zip${NC}"
else
    echo -e "${YELLOW}⚠ Node.js not found. Install Node.js first.${NC}"
fi

# 4. iOS (requires macOS + Xcode)
if [ "$(uname)" = "Darwin" ]; then
    echo -e "${YELLOW}Step 4: Building iOS App...${NC}"
    npm install @capacitor/core @capacitor/cli @capacitor/ios
    npx cap add ios
    npx cap sync ios
    
    # Edit ExportOptions.plist with your Team ID before running
    xcodebuild -workspace ios/App/App.xcworkspace \
        -scheme App \
        -configuration Release \
        -archivePath build/App.xcarchive \
        archive
    
    xcodebuild -exportArchive \
        -archivePath build/App.xcarchive \
        -exportOptionsPlist ios/App/App/ExportOptions.plist \
        -exportPath output
    
    echo -e "${GREEN}✓ iOS App built → ios/App/output/*.ipa${NC}"
else
    echo -e "${YELLOW}⚠ iOS build requires macOS. Use GitHub Actions or build on a Mac.${NC}"
    echo "  Push to GitHub and the CI workflow will build iOS automatically."
fi

echo ""
echo "============================================"
echo -e "${GREEN}Build complete!${NC}"
echo "Output files in: ./release/"
echo "============================================"
