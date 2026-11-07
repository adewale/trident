#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
source ./env.sh
sdk=$(mktemp)
trap 'rm -f "$sdk"' EXIT
flutter --disable-analytics
flutter config --enable-linux-desktop
flutter --version --machine > "$sdk"
python3 bundle.py check-sdk "$sdk"
cd app
flutter pub get --enforce-lockfile
git diff --exit-code -- pubspec.lock
flutter build linux --release --target lib/davebench_worker.dart
cd ..
python3 bundle.py seal "$sdk" app/build/linux/x64/release/bundle
python3 smoke.py app/build/linux/x64/release/bundle
