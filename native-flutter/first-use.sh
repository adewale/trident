#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
source ./env.sh
if [[ $(uname -m) != x86_64 ]]; then
 echo "native-entrypoints-v2 requires an x86_64 Linux host." >&2
 exit 2
fi
# Reject a wrong module before reserving output or building native code.
node --input-type=module -e 'import { verifyPeleModule } from "./pele.mjs"; verifyPeleModule();'
export DISPLAY=${DISPLAY:-127.0.0.1:99} LIBGL_ALWAYS_SOFTWARE=1
export BENCH_ROOT="$PWD" BENCH_PROTOCOL=native-entrypoints-v2
unset ONLY_CASE ONLY_API ONLY_PHASE CASES_FILE
mkdir -p results
if ! mkdir results/.supplemental-reservation; then
 echo "Supplemental output is already reserved; use a fresh results directory." >&2
 exit 2
fi
if compgen -G 'results/first-use-*' > /dev/null || compgen -G 'results/visible-edit-*' > /dev/null; then
 echo "Supplemental outputs already exist; use a fresh results directory." >&2
 exit 2
fi
printf '{"protocol":"native-entrypoints-v2","architecture":"x86_64"}\n' > results/.supplemental-reservation/receipt.json
run_bench() {
 local destination=$1
 shift
 python3 supervise.py --out "$destination" --timeout "${BENCH_PROCESS_TIMEOUT_SECONDS:-1800}" -- "$@"
}
for trial in 0 1 2 3 4; do
 for api in MermaidDiagram MermaidView renderToPng; do
  ONLY_CASE=core:flow5 ONLY_API="$api" ONLY_PHASE=fresh WARMUPS=0 ROUNDS=1 SAMPLES=1 run_bench "$PWD/results/first-use-flutter/$api/$trial" ./app/build/linux/x64/release/bundle/native_bench
 done
done
for trial in 0 1 2 3 4; do
 for api in render mount; do
  HEADED=1 ONLY_CASE=core:flow5 ONLY_API="$api" ONLY_PHASE=fresh WARMUPS=0 ROUNDS=1 SAMPLES=1 run_bench "$PWD/results/first-use-pele/$api/$trial" node pele.mjs
 done
done
BENCH_ROOT="$PWD/visible-edit" ROUNDS=3 SAMPLES=5 WARMUPS=2 run_bench "$PWD/results/visible-edit-flutter" ./app/build/linux/x64/release/bundle/native_bench
CASES_FILE="$PWD/visible-edit/cases.json" HEADED=1 ROUNDS=3 SAMPLES=5 WARMUPS=2 run_bench "$PWD/results/visible-edit-pele" node pele.mjs
