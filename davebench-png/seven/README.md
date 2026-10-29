# DaveBench PNG: seven implementations

This runner attempts all 548 diagram occurrences in the pinned Mermaid 12.2.0
documentation, retaining errors and every returned image. Its timing table uses
one common, manually reviewed profile. Full-corpus PNG success is a mechanical
coverage measure; it does not establish that all diagram facts were rendered.

| Implementation | Pin | Public path |
|---|---|---|
| Mermaid | 12.2.0 | Chromium `mermaid.render()` → shared PNG converter |
| Agentic Mermaid | 0.4.1 | Chromium `renderMermaidSVG()` → shared converter |
| Beautiful Mermaid | 1.1.3 | Chromium `renderMermaidSVG()` → shared converter |
| Zombie Mermaid | 5.10.2 | Chromium `renderMermaidSVG()` → shared converter |
| Mermaid Dart | mermaid_core 0.3.2 | Native Dart AOT `Mermaid.render()` + `renderSceneToSvg()` → shared Chromium converter |
| Mermaid Flutter | mermaid_flutter 0.3.2 | Native Linux Flutter release `renderToPng()` → fixed-canvas normalization |
| Pele | 1.9.0 | Chromium `render()` → shared converter |

Mermaid Flutter uses the Flutter engine. Mermaid Dart is a separately named native
Dart participant, with the public `ApproximateTextMeasurer`; it supplies no PNG
API. Neither substitutes for the other. Beautiful and Zombie are bundled from
their published JavaScript entries without source patches. Zombie's documented
`registerElk(ELK)` initialization runs before warmup. Mermaid registers its pinned
first-party ZenUML addon 1.0.1.

## Completed work and clocks

Every success is an opaque white 1200×900 PNG with at least 30 pixels of margin,
Inter requested at base size 14, and no resizing or clipping. Public role styles,
layouts and compression may differ. The native Flutter API returns an intrinsic
PNG, so decoding, padding and a second encoding are charged to that participant.

The primary clock starts in the Node client immediately before dispatch and ends
after that client consumes binary PNG bytes. PNG response serialization, IPC and
binary decoding are included. File writes, SVG witness retrieval and output
inspection occur afterwards. `completed.ts` returns the PNG and stage metadata;
it does not compute text observations inside the client clock.

Rows also preserve the API clock, normalization clock and rendering work total.
For native Dart, API time is measured in its AOT worker and conversion time in
Chromium; their sum is a secondary work metric. The client total includes the
necessary SVG bridge between those processes. Browser PNG clocks include
synchronous canvas raster/readback/encoding and Base64 handling. Native raster
image creation and PNG readback/encoding remain separate stages. No isolated
encoder CPU, physical frame, widget update or cold-start measurement is inferred.

## Sampling and ranking

The review and campaign plan are written before measured collection. The frozen
20 candidates and collapsed-group control are inherited from the controlled
DaveBench profile. Inputs failing a participant's source-fact review are excluded
from the common profile for all participants. The new seven-participant review
admits 13 inputs across flowcharts, sequences, classes, states and ER diagrams.
All exclusions, unsupported mindmaps and the failed control remain retained.

Twenty independent launch blocks per implementation use a predetermined rotated
and reversed order. Each block starts one implementation, performs two warmup
passes through the common profile, measures three calls per input in seeded
shuffled order, then terminates its processes before another implementation starts.
No inactive candidate engine remains alive. Native Dart's browser converter is
part of that participant's own pipeline. A kernel cgroup constrains every process
to CPU2, one CPU quota, 16 GiB and a private PID namespace with external networking
disabled. Live-thread affinity and cgroup counters are retained per block.

Each launch/input cell contributes its three-call median. The table score is
their geometric mean across inputs and launches. All participants use exactly
the same cells. Ten thousand paired launch-block bootstrap draws give pointwise
95% intervals for the fixed input profile, capturing variation between launches.
These are not population intervals across arbitrary diagrams or simultaneous
rank guarantees. The fastest reference is selected by its observed score.
Odd/even launch splits provide repeatability warnings; there is no global rule
that suppresses every ratio when one participant is noisy.

No outlier trimming occurs. A failed correctness/stability input is excluded from
all participants' final common score and remains visible. A measured timeout
invalidates the process-history assumption; the analyzer reports an incomplete
campaign rather than silently replacing the failed launch. Any failed measured-run
warmup aborts collection. Admission requires the complete participant/input review
and pixel matrix; analysis checks every expected warmup and measurement cell.
Every measured PNG
must match its participant/input's actual pre-reviewed pixels. Qualification
images are decoded independently before review; exact encoded matches may reuse
prior inspection, while newly encoded streams are decoded and checked.

## Reproduction

Use Node 24, the pinned Playwright/Chromium runtime, the Flutter/Dart SDKs and Linux
build dependencies recorded in the campaign's context and build receipt. In this
prepared cloud workspace the optional SDK/sysroot selectors are:

```sh
export FLUTTER_ROOT=/workspace/flutter BENCH_SYSROOT=/workspace/sysroot
export PUB_CACHE=/workspace/pub-cache XDG_CONFIG_HOME=/workspace/config
export XDG_CACHE_HOME=/workspace/cache
source native-flutter/env.sh
npm ci --prefix davebench-png --ignore-scripts
npm ci --prefix davebench-png/seven/packages --ignore-scripts
node davebench-png/seven/prepare.mjs /workspace/NEW-CAMPAIGN/assets
```

Acquire the exact pinned Dart dependencies before an offline build if they are
not cached. Preparation compiles the native Dart worker and a separate Flutter
release app; it preserves the earlier benchmark bundle. Run collection serially:

```sh
python3 davebench-png/seven/container.py \
  --out /workspace/NEW-CAMPAIGN/qualification-frozen \
  --assets /workspace/NEW-CAMPAIGN/assets --phase qualification
python3 davebench-png/seven/container.py \
  --out /workspace/NEW-CAMPAIGN/coverage-final \
  --assets /workspace/NEW-CAMPAIGN/assets --phase coverage
# Review actual PNGs against profile.json. Produce review.json and the prospective
# campaign plan using the schema retained with the completed campaign. The review
# binds the exact renderIdentity and participant list; never admit by timings.
python3 davebench-png/seven/container.py \
  --out /workspace/NEW-CAMPAIGN/measurement \
  --assets /workspace/NEW-CAMPAIGN/assets --phase measure \
  --review /workspace/NEW-CAMPAIGN/review.json --blocks 20 --repetitions 3
python3 davebench-png/seven/analyze.py /workspace/NEW-CAMPAIGN
```

Every output directory must be fresh. `rows.jsonl` retains calls and failures;
`context.json` seals producers, libraries, font, native binaries, runtime and the
launch schedule. Source snapshots and build commands travel with the results.
