#!/usr/bin/env bash
# Builds, installs and launches the app on the connected Android phone.
# Output goes to logs/ so the build and runtime can be inspected afterwards.
set -o pipefail
cd "$(dirname "$0")/.."
mkdir -p logs
ADB="${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools/adb"
command -v adb >/dev/null 2>&1 && ADB=adb

echo "== Connected devices" | tee logs/build-android.log
"$ADB" devices -l 2>&1 | tee -a logs/build-android.log

echo "== Building & installing (first build can take 5–10 min)" | tee -a logs/build-android.log
npx react-native run-android 2>&1 | tee -a logs/build-android.log
STATUS=$?
echo "== run-android exit code: $STATUS" | tee -a logs/build-android.log

if [ $STATUS -eq 0 ]; then
  "$ADB" reverse tcp:8081 tcp:8081 >/dev/null 2>&1
  echo "== Streaming app logs to logs/device.log (Ctrl+C to stop)"
  "$ADB" logcat -c
  "$ADB" logcat -v time ReactNativeJS:V ReactNative:V ExoPlayerImpl:V ExoPlayer:V AndroidRuntime:E '*:S' | tee logs/device.log
fi
