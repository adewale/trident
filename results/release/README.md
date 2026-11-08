# Current benchmark collection

These measurements use the corrected observers, artifact checks and scoring rules,
with the [7 November product freeze](../../docs/evidence/benchmark-campaign-2026-11-07/catalog.json).
The [previous collection](https://github.com/adewale/trident/tree/2e1bf0a76e026a54ef427127e6bc8f30e91d57bc/results/release)
remains at its original commit. Historical outputs and scores were not rescored.

| Measurement | Numeric evidence | Collection date |
|---|---|---|
| DaveBench, <!-- fact:davebench-inputs -->1,342<!-- /fact --> documentation occurrences per format | [Images](images.json), [terminal](terminal.json), [native PNG provenance](native-png.json), [report](report.json), [tables](report.md) | <!-- fact:davebench-collected -->7 November 2026<!-- /fact --> |
| Drawing Correctness, <!-- fact:drawing-cases -->127<!-- /fact --> cases per project/format | [Results](drawing-correctness.json) | <!-- fact:drawing-collected -->8 November 2026<!-- /fact --> |
| Mermaid Fidelity, <!-- fact:fidelity-files -->352<!-- /fact --> original test files | [Results](mermaid-fidelity.json) | <!-- fact:fidelity-collected -->8 November 2026<!-- /fact --> |

The [completion record](../../docs/evidence/benchmark-completion-2026-11-07/README.md)
explains the proofs, source identities, full DOM-free comparison and remaining
observer gaps. Timing collections ran serially without competing semantic jobs or fixture
tests. Timing collectors discarded rendered outputs; the current Drawing
collection retains them in the committed archive described below. Timings apply
to the recorded machine, resource limits and API/CLI boundaries.

Termaid's affected timing and Drawing rows were recollected after its Python
launcher gained source-only isolation and before/after installed-runtime checks.
The terminal consolidation and Drawing runtime binding record that replacement;
the other fresh observations are preserved.

## Native Flutter PNG

The pinned Flutter 3.47.8 / Dart 3.13.7 GTK release bundle passed CI build/smoke
verification and all nine production PNG admission controls on the measurement
host. The unchanged package lock selects `mermaid_flutter` and `mermaid_core`
0.3.2. The collector verified every bundle file and its source/SDK/smoke receipts
before measuring three complete runs of 1,342 inputs, with 30 warm-ups per run.

Native PNG now has **1,114/1,342 admissible completions** (the minimum
across three runs). Its median API total is **24.806 seconds**. The [raw native file](native-png.json)
retains build, library, runtime and rendering provenance alongside every run.
Its timing boundary is the release app's `renderToPng(source,pixelRatio:1)` call;
startup, warm-ups, IPC and admission are excluded. CI supplies build and smoke
evidence; the scores come from the separate measurement host. The earlier
Flutter 3.44 compatibility probe supplied no values to this collection.

## Qualification and remaining coverage

Fidelity scores the <!-- fact:fidelity-population -->7,346<!-- /fact --> callbacks
that the fresh Mermaid <!-- fact:mermaid-reference -->12.3.0<!-- /fact --> control
qualifies. It leaves <!-- fact:fidelity-unqualified -->0<!-- /fact --> callbacks
reference-unqualified and <!-- fact:fidelity-skipped -->18<!-- /fact --> skipped.
The control executes the pinned production source with its original compiler
plugins and dependencies. Earlier proxy-control scores remain at their original
commit. Candidate adapter gaps remain visible in the results and score ranges.

The complete JSDOM/Node comparison uses per-file receipts to verify the actual
environment before imports. It replaces an invalid earlier qualification made
with a runner option Vitest 4 ignored. The source-bound qualification compares
callback identities, outcomes, normalized failures and semantic audit dispositions.
All 26 candidate pairs have complete evidence; 349 files qualify for Node and
three retain JSDOM. The full automatic-selection check reproduces the baseline
with 349 actual Node environments and three actual JSDOM environments.
Original JSDOM directives and observed differences retain JSDOM. Changed source,
runner, executable or artifact identities invalidate reuse. The
[collection receipt](../../docs/evidence/benchmark-completion-2026-11-07/fidelity-collection.json)
records the full cohort, environment counts and automatic-selection verification.

Drawing leaves <!-- fact:drawing-unassessed -->145<!-- /fact --> of
<!-- fact:drawing-rows -->4,318<!-- /fact --> outputs unassessed. The SVG profile can
prove separation for flat opaque labels on qualified gradients, or verify the
complete actual glyph raster against its unchanged backdrop and canvas. The
terminal rectangle search now resolves the previous budget case without raising
the work limit. Path/image glyphs, unsupported effects and other observations
outside the qualified profiles receive no correctness credit. The
[case inventory](../../docs/evidence/benchmark-completion-2026-11-07/svg-label-review.json)
identifies every remaining SVG output. PNG remains outside Drawing Correctness's
scope.

## Reproduction

Prepare the frozen products and the pinned Mermaid package/test runtime first;
see [installation](../../README.md#quick-start),
[benchmark methods](../../docs/benchmark-results-details.md) and
[native bundle instructions](../../native-flutter/README.md).
Keep the pinned source/documentation checkout at `../mermaid` for the native
collector. `CATALOG`, `UPSTREAM`, `ORACLE` and `RUNTIME` below refer to the freeze,
that checkout, the admitted reference package and the original test runtime.
Use the same executable, installed dependencies, locale and time zone for both
Fidelity profiles. Every output directory must be fresh.

```sh
bun commands.ts prepare --catalog CATALOG --out artifacts
bun commands.ts drawing:correctness --catalog CATALOG --prepared artifacts/community-browser-prepared.json --terminal-prepared artifacts/community-prepared.json --out drawing
TRIDENT_FIDELITY_ENVIRONMENT=jsdom bun commands.ts mermaid:fidelity --upstream UPSTREAM --reference ORACLE --runtime RUNTIME --prepared artifacts/community-prepared.json --catalog CATALOG --workers 2 --out fidelity-jsdom
TRIDENT_FIDELITY_ENVIRONMENT=node bun commands.ts mermaid:fidelity --upstream UPSTREAM --reference ORACLE --runtime RUNTIME --prepared artifacts/community-prepared.json --catalog CATALOG --reuse-reference fidelity-jsdom --workers 2 --out fidelity-node
bun scripts/qualify-dom-free.ts fidelity-jsdom fidelity-node 2086904e76c692331e34a45d7cc3bc30860d040e dom-free-qualified.json
bun scripts/merge-drawing-results.ts --run drawing --out drawing-correctness.json
bun scripts/merge-fidelity-runs.ts --catalog CATALOG --out mermaid-fidelity.json fidelity-jsdom
# Run timings separately, after other benchmark and check jobs finish.
bun commands.ts davebench:native-png --host-display --bundle VERIFIED_BUNDLE --out native-png
bun commands.ts davebench --catalog CATALOG --upstream UPSTREAM --prepared artifacts/community-browser-prepared.json --out images
bun commands.ts davebench:terminal --catalog CATALOG --upstream UPSTREAM --prepared artifacts/community-prepared.json --out terminal
bun commands.ts campaign:results --images images/results.json --terminal terminal/results.json --native-png native-png/results.json --out report
# Publish the fresh numeric files, then regenerate tables and quoted facts.
bun commands.ts results:snapshot
```

## Changes from the merged collection

| Observation | Previous collection | Fresh collection |
|---|---:|---:|
| Drawing known passes | 3,082 | 3,079 |
| Drawing unassessed | 186 | 145 |
| Fidelity reference-qualified callbacks | 3,676 | 7,346 |
| Native PNG admissible completions | Unmeasured | 1,114 |

The fresh collections apply the reviewed label obligations, bounded glyph-pixel
proof and direct source control. Earlier observations remain available at the
previous commit. The earlier 1,882-probe comparison established equivalence only
for the static observer optimization; the new glyph profile has its own positive
and adversarial fixture evidence. No timing or memory gain is inferred from
semantic comparisons.


## Retained Drawing capture

The current Drawing baseline includes the portable
[capture archive](captures/drawing-capture-2026-11-08.tar.gz?raw=true) (3,963,733 bytes; SHA-256
`b20e3004fe884a7426179a72dbac51e71fe4ab92e010e2b3fae4d7250683b7fd`).
It contains the complete raw run and all 3,684 returned SVG/terminal outputs,
stored as 3,437 compressed objects. The other 634 calls returned renderer
failures. Every case verdict matches the preceding published collection.

The archive is committed with the results. Reassessment needs no producer
binaries or prepared artifact directories:

```sh
mkdir -p .cache/drawing-replay
tar -xzf results/release/captures/drawing-capture-2026-11-08.tar.gz -C .cache/drawing-replay
bun scripts/reassess-drawing-results.ts .cache/drawing-replay/drawing-retained .cache/drawing-replay/fresh-assessment
```

The [follow-up receipt](../../docs/evidence/retained-capture-and-runtime-refresh-2026-11-08.json)
records byte verification, a complete reassessment with zero verdict changes,
archive relocation and portable-runtime qualification. Collection time and
reassessment time remain separate. Historical snapshots retain their original
observations; the current baseline now supports reassessment from retained data.
