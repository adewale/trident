#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
source ./env.sh
export DISPLAY=${DISPLAY:-127.0.0.1:99} LIBGL_ALWAYS_SOFTWARE=1
export BENCH_ROOT="$PWD"
mkdir -p results
if [[ -d results/first-use-flutter || -d results/first-use-pele || -d results/visible-edit-flutter || -d results/visible-edit-pele ]]; then
 echo "Supplemental outputs already exist; use a fresh results directory." >&2
 exit 2
fi
for trial in 0 1 2 3 4; do
 for api in MermaidDiagram MermaidView renderToPng; do
  OUT="$PWD/results/first-use-flutter/$api/$trial" ONLY_CASE=core:flow5 ONLY_API="$api" ONLY_PHASE=fresh WARMUPS=0 ROUNDS=1 SAMPLES=1 ./app/build/linux/x64/release/bundle/native_bench > "results/first-use-flutter-${api}-${trial}.log" 2>&1
 done
done
for trial in 0 1 2 3 4; do
 for api in render mount; do
  HEADED=1 OUT="$PWD/results/first-use-pele/$api/$trial" ONLY_CASE=core:flow5 ONLY_API="$api" ONLY_PHASE=fresh WARMUPS=0 ROUNDS=1 SAMPLES=1 node pele.mjs > "results/first-use-pele-${api}-${trial}.log" 2>&1
 done
done
BENCH_ROOT="$PWD/visible-edit" OUT="$PWD/results/visible-edit-flutter" ROUNDS=3 SAMPLES=5 ./app/build/linux/x64/release/bundle/native_bench > results/visible-edit-flutter.log 2>&1
CASES_FILE="$PWD/visible-edit/cases.json" HEADED=1 OUT="$PWD/results/visible-edit-pele" ROUNDS=3 SAMPLES=5 node pele.mjs > results/visible-edit-pele.log 2>&1
