#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
source ./env.sh
if [[ -f results/flutter/samples.jsonl || -f results/pele/samples.jsonl ]]; then
 echo "Move the existing results directory aside and create a new results directory before rerunning." >&2
 exit 2
fi
mkdir -p results
export BENCH_ROOT="$PWD"
python prepare.py
# Xvfb must be running at DISPLAY; see README for installation and setup.
export DISPLAY=${DISPLAY:-127.0.0.1:99}
export LIBGL_ALWAYS_SOFTWARE=1
(cd app && flutter pub get && flutter build linux --release)
export ROUNDS=3 SAMPLES=5
OUT="$PWD/results/flutter" ./app/build/linux/x64/release/bundle/native_bench > results/flutter.log 2>&1
HEADED=1 OUT="$PWD/results/pele" node pele.mjs > results/pele.log 2>&1
./first-use.sh
python analyze.py
python validate.py
python images.py
