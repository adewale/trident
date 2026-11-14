#!/usr/bin/env bash
# Build, seal and smoke-test the Drawing Correctness output target into
# app/build/drawing-bundle. A DaveBench bundle already at the shared Flutter
# output directory is moved aside for the build and restored afterwards.
set -euo pipefail
cd "$(dirname "$0")"
source ./env.sh
sdk=$(mktemp)
release=app/build/linux/x64/release
trap 'rm -f "$sdk"; if [[ -d "$release/bundle.davebench" ]]; then rm -rf "$release/bundle"; mv "$release/bundle.davebench" "$release/bundle"; fi' EXIT
flutter --disable-analytics
flutter config --enable-linux-desktop
flutter --version --machine > "$sdk"
python3 bundle.py check-sdk "$sdk"
if [[ -d "$release/bundle" ]]; then rm -rf "$release/bundle.davebench"; mv "$release/bundle" "$release/bundle.davebench"; fi
cd app
flutter pub get --enforce-lockfile
git diff --exit-code -- pubspec.lock
flutter build linux --release --target drawing/drawing_worker.dart
cd ..
rm -rf app/build/drawing-bundle
cp -a "$release/bundle" app/build/drawing-bundle
python3 bundle.py seal "$sdk" app/build/drawing-bundle drawing/drawing_worker.dart
python3 smoke.py app/build/drawing-bundle drawing/drawing_worker.dart
