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
mkdir -p results
if ! mkdir results/.campaign-reservation; then
 echo "Campaign output is already reserved; use a fresh results directory." >&2
 exit 2
fi
# Reserve before preparation/build and reject all earlier evidence, including supplements.
if compgen -G 'results/*' > /dev/null; then
 echo "Move the existing results directory aside before rerunning." >&2
 exit 2
fi
printf '{"protocol":"native-entrypoints-v2","architecture":"x86_64"}\n' > results/.campaign-reservation/receipt.json
export BENCH_ROOT="$PWD" BENCH_PROTOCOL=native-entrypoints-v2
unset ONLY_CASE ONLY_API ONLY_PHASE CASES_FILE
export ROUNDS=3 SAMPLES=5 WARMUPS=2
python3 prepare.py
# Xvfb must be running at DISPLAY; see README for installation and setup.
export DISPLAY=${DISPLAY:-127.0.0.1:99} LIBGL_ALWAYS_SOFTWARE=1
(cd app && python3 ../supervise.py --out ../results/build --timeout "${BENCH_BUILD_TIMEOUT_SECONDS:-1800}" -- bash -c 'flutter pub get && flutter build linux --release')
python3 supervise.py --out "$PWD/results/flutter" --timeout "${BENCH_PROCESS_TIMEOUT_SECONDS:-1800}" -- ./app/build/linux/x64/release/bundle/native_bench
HEADED=1 python3 supervise.py --out "$PWD/results/pele" --timeout "${BENCH_PROCESS_TIMEOUT_SECONDS:-1800}" -- node pele.mjs
./first-use.sh
python3 analyze.py
python3 validate.py
python3 images.py
