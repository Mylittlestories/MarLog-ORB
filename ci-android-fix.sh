#!/bin/bash
# Fix Kotlin duplicate class issue by patching android/app/build.gradle
# This prevents: Duplicate class kotlin.internal.jdk7.JDK7PlatformImplementations

GRADLE_FILE="android/app/build.gradle"

if [ ! -f "$GRADLE_FILE" ]; then
    echo "ERROR: $GRADLE_FILE not found"
    exit 1
fi

if ! grep -q "configurations.all" "$GRADLE_FILE"; then
    cat >> "$GRADLE_FILE" << 'KOTLIN_FIX'

configurations.all {
    resolutionStrategy {
        force 'org.jetbrains.kotlin:kotlin-stdlib:1.9.22'
        force 'org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.9.22'
        force 'org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.9.22'
    }
}
KOTLIN_FIX
    echo "Applied Kotlin fix to $GRADLE_FILE"
else
    echo "Kotlin fix already present in $GRADLE_FILE"
fi
