# Controlled PNG export profile

This replaces the withdrawn v1 timing comparison. It measures warm repeated
exports of a reviewed subset of DaveBench sources. It does not measure the full
DaveBench corpus, first use, widget frames, source updates or isolated PNG encoding.

Every final output is a 1200×900 opaque white PNG at scale1, with a 30px margin.
There is no resizing or clipping. All use the same supplied Inter-Regular.ttf
and public base-font-size14 options. Some per-role defaults ignore that size: native
class labels use10px; Pele messages/members often12px; Agentic members11px and
mindmaps13px. These defaults must remain legible and are reported alongside the
outputs. Palette defaults also differ. This is not typography-identical throughput.
Layouts can differ if the source facts remain
visible and legible. The 21-case manifest includes six families and a collapsed
subgraph negative control. Cases failing any implementation's source-fact review
stay in the qualification report and are excluded from comparative timing.

Mermaid12.2.0, Pele1.9.0 and Agentic Mermaid0.4.1 run in the same Chromium process,
in isolated contexts, through their published SVG APIs. One shared function inserts
the SVG, waits for fonts, decodes it, draws onto the fixed white canvas and consumes
encoded PNG bytes. Native mermaid_flutter0.3.2 runs in a persistent Linux Flutter
**release** process through public `renderToPng()`. Its API produces an intrinsic
PNG; decoding, padding and re-encoding to the required output are inside its total
clock. This extra encoding is part of this application task's adapter cost.
The total compares completed fixed-PNG exports, not renderer kernels or encoders.

API time and adapter time are retained separately. A browser SVG-return time and
a native PNG-return time represent different work and must never be ranked against
each other. Canvas PNG production includes any deferred rasterization/readback
and encoding; this harness does not pretend to isolate those opaque costs.
Startup, qualification, pixel hashing, transport and evidence writes are outside
each timer. All exports, including validation, execute sequentially on one machine.

## Reproduce

Use Node24+, Chromium, Flutter3.47.8 with Linux desktop dependencies, Xvfb and
Fontconfig. The retained environment receipt records exact binaries, SDK revisions,
CPU quota, OS, font hash and bundle hashes. System fonts are isolated per run;
unhinted Inter produces identical probe widths in Chromium and Flutter. No network
assets are allowed by the browser adapter.

```sh
npm ci --prefix davebench-png --ignore-scripts
cd native-flutter/app
flutter pub get
cd ../..
node davebench-png/controlled/build-native.mjs
node davebench-png/controlled/contract.test.mjs
xvfb-run -a node davebench-png/controlled/run.mjs --preflight --out /tmp/png-qualification
```

Before timing, inspect each actual PNG against the source facts in `cases.json`.
Record every implementation's pass/failure and reason in `review.json`, including
the manifest/font SHA256 and decoded pixel hash for each output. The retained run's
review is an example. A nonblank image alone cannot pass. The negative control
cannot enter timing. To reproduce the recorded timing, use its review file: a
different environment that changes pixels must be reviewed again.

The build script binds worker and dependency hashes, target/flags and SDK revisions
to the resulting native bundle. Qualification and collection validate that receipt.
Review binds the exact producer/configuration and binaries as well as pixels.

Commit all measurement producers before collecting timing, then run with fresh
output directories. On a headless system set `LIBGL_ALWAYS_SOFTWARE=1` consistently
for qualification and timing. If using a non-system SDK/sysroot, source
`native-flutter/env.sh` with its selectors first.

```sh
xvfb-run -a node davebench-png/controlled/run.mjs \
  --out /tmp/png-controlled --review /tmp/png-qualification/review.json \
  --rounds 5 --repetitions 5
node davebench-png/controlled/reduce.mjs /tmp/png-controlled
```

Independent A/B replicas use identical library bytes. Each gets two complete
warmup passes, then five rounds of five calls per admitted source, randomly
interleaved with seed20261029. Every output must match that implementation's
pre-reviewed decoded pixels. Any mismatch aborts comparison and retains evidence.

Before seeing timings, the A/A gate is a 95% case-bootstrap interval for the
geometric mean of per-case A-median/B-median ratios, wholly inside0.90..1.10.
There are10000 draws with seed20261029. Relative comparisons are withheld if any
library fails. Calls within a case are not treated as independent cases. The
interval describes sensitivity to this fixed profile's case mix, not a random
sample of all Mermaid programs.

`rows.jsonl` retains every call, including warmups and failures; `context.json`
owns the contract and sealed inputs. `png/` and `svg/` retain actual artifacts;
`actors.json` and native logs attest runtimes. `completed.json` is written only
after successful completion and artifact revalidation. `summary.json` is a
reduction, never a substitute for raw samples and the qualification exclusions.
