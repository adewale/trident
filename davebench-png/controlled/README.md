# Controlled PNG export profile

This replaces the withdrawn v1 timing comparison. It measures warm repeated
exports of a reviewed subset of DaveBench sources. It does not measure the full
DaveBench corpus, first use, widget frames, source updates or isolated PNG encoding.

Every final output is a 1200×900 opaque white PNG at scale 1, with a 30px margin.
There is no resizing or clipping. All use the same supplied Inter-Regular.ttf
and public base-font-size 14 options. Some per-role defaults ignore that size: native
class labels use10px; Pele messages/members often12 px; Agentic members 11 px and
mindmaps13px. These defaults must remain legible and are reported alongside the
outputs. Palette defaults also differ. This is not typography-identical throughput.
Layouts can differ if the source facts remain
visible and legible. The 21-case manifest includes six families and a collapsed
subgraph negative control. Cases failing any implementation's source-fact review
stay in the qualification report and are excluded from comparative timing.

Mermaid 12.2.0, Pele 1.9.0 and Agentic Mermaid 0.4.1 run in the same Chromium process,
in isolated contexts, through their published SVG APIs. One shared function inserts
the SVG, waits for fonts, decodes it, draws onto the fixed white canvas and consumes
encoded PNG bytes. Native mermaid_flutter 0.3.2 runs in a persistent Linux Flutter
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

Browser PNG serialization uses synchronous `canvas.toDataURL('image/png')`,
followed by Base64 decoding into binary bytes before the timer stops. Base64
production and decoding are charged to export. The browser main thread blocks;
this is a headless export task, not a UI responsiveness measurement. Transport
reuses the Base64 string after the clock, avoiding per-byte protocol objects.
Earlier asynchronous `toBlob()` campaigns and array transport remain separate.

## Reproduce

Use Node 24+, Bun 1.4+, Chromium, Flutter 3.47.8 with Linux desktop dependencies, Xvfb/xauth and
Fontconfig. The retained environment receipt records exact binaries, SDK revisions,
CPU quota, OS, font hash and bundle hashes. System fonts are isolated per run;
unhinted Inter produces identical probe widths in Chromium and Flutter. No network
assets are allowed by the browser adapter.

```sh
bun install --frozen-lockfile
npm ci --prefix davebench-png --ignore-scripts
cd native-flutter/app
flutter pub get
cd ../..
node davebench-png/controlled/build-native.mjs
node davebench-png/controlled/contract.test.mjs
python3 davebench-png/controlled/run-container.py --preflight --participants pele,flutter --out /workspace/png-qualification
```

The commands select the original Pele/native Flutter pair. Omit
`--participants pele,flutter` for the four-library campaign. Freeze participant
selection before collection; it is part of review ownership. A candidate enters
timing only if every selected participant passes its source-fact checks. The
negative control remains excluded. Keep campaigns with different participant sets
and admitted case sets separate.

Before timing, inspect each actual PNG against the source facts in `cases.json`.
Record every implementation's pass/failure and reason in `review.json`, including
the manifest/font SHA256 and decoded pixel hash for each output. The retained run's
review is a template. A nonblank image alone cannot pass. The negative control
cannot enter timing. Bind a new review to the fresh qualification's
`renderIdentity`, manifest/font hashes and actual pixel hashes. A new build receipt
changes that identity even if pixels are identical. Reuse earlier semantic
observations only after verifying exact decoded pixel matches; inspect changed
outputs again. Copying the retained review alone cannot admit a fresh build.

The build script binds worker and dependency hashes, target/flags and SDK revisions
to the resulting native bundle. Qualification and collection validate that receipt.
Review binds the exact producer/configuration and binaries as well as pixels.

Commit all measurement producers before qualification or timing, then use fresh
output directories. The wrapper requires access to the local Docker daemon and
a host exposing CPU2. It creates a private PID namespace with enforced CPU2
affinity, a one-CPU quota, 16 GiB memory limit and no external network.
Every live thread is checked after actor startup, after warmup and at completion.
`LIBGL_ALWAYS_SOFTWARE=1` and `LP_NUM_THREADS=1` are set for the run.

The tiny imported image supplies directory/configuration structure. Readonly
mounts supply the host's installed `/usr`, `/opt`, loader cache and Chromium
configuration; `/workspace` holds the checkout, SDK, packages and artifacts.
The rootfs hash identifies that structure, not the complete mounted userland.
The wrapper preserves Docker proxy configuration and mounts the system CA bundle.
No dependency installation occurs inside the timed container.

Place the checkout, dependencies, SDK and output under `/workspace`. If using a
non-system SDK/sysroot, use the selectors in `native-flutter/env.sh`. The exact
runtime configuration and container identity are retained beside each run.

```sh
python3 davebench-png/controlled/run-container.py \
  --participants pele,flutter --out /workspace/png-controlled --review /workspace/png-qualification/review.json \
  --rounds 5 --repetitions 5
node davebench-png/controlled/reduce.mjs /workspace/png-controlled
```

Independent A/B replicas use identical library bytes. Each gets two complete
warmup passes, then five rounds of five calls per admitted source, randomly
interleaved with seed 20261029. Every output must match that implementation's
pre-reviewed decoded pixels. Any mismatch aborts comparison and retains evidence.

Before warmup, every reference PNG is decoded, checked for geometry and matched
to the reviewed pixel hash. Every returned PNG is hashed. An exact encoded-byte
match reuses that prior decoding; each new byte stream is decoded and checked.
The expected pixel hash is enforced for the current input and participant on
every call. This reduces untimed overhead, which changes inter-call cadence;
campaigns using the earlier decoder-per-call method must remain separate.

Stage clocks retain native decode, picture recording, raster-image creation and
combined PNG readback/encoding. Browser clocks retain SVG preparation/decode,
drawing calls, combined raster/readback/PNG production and encoded-byte reading.
These wall intervals include queue/callback waits. Deferred drawing can land in
the PNG stage; the intervals do not isolate encoder CPU costs.

Before seeing timings, the A/A gate is a 95% case-bootstrap interval for the
geometric mean of per-case A-median/B-median ratios, wholly inside 0.90–1.10.
There are 10,000 draws with seed 20261029. Relative comparisons are withheld if any
library fails. Calls within a case are not treated as independent cases. The
interval describes sensitivity to this fixed profile's case mix, not a random
sample of all Mermaid programs.

`rows.jsonl` retains every call, including warmups and failures; `context.json`
owns the contract and sealed inputs. `png/` and `svg/` retain actual artifacts;
`actors.json` and native logs attest runtimes. `completed.json` is written only
after successful completion and artifact revalidation. `summary.json` is a
reduction, never a substitute for raw samples and the qualification exclusions.

The initial retained campaign failed its A/A gate for Flutter and Pele; use
those timings only as observations. A later placement attempt was stopped because
engine/raster threads overrode inherited CPU masks. The context's CPU-affinity
field records the controller mask; it does not attest every descendant thread.
The container campaign adds kernel enforcement and actual live-thread checks.
The failed calibration and excluded setup remain retained; do not pool campaigns
or infer that a changed outcome identifies the original discrepancy's cause.
