#!/usr/bin/env bash
# Usage: scripts/screenshot.sh home   -> saves screenshots/home.png from the phone
cd "$(dirname "$0")/.."
mkdir -p screenshots
ADB="${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools/adb"
command -v adb >/dev/null 2>&1 && ADB=adb
"$ADB" exec-out screencap -p > "screenshots/${1:-screen}.png" && echo "saved screenshots/${1:-screen}.png"
