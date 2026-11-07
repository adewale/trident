# Current benchmark collection

These measurements use the corrected observers, artifact checks and scoring rules,
with the [7 November product freeze](../../docs/evidence/benchmark-campaign-2026-11-07/catalog.json).
The [previous collection](https://github.com/adewale/trident/tree/2e1bf0a76e026a54ef427127e6bc8f30e91d57bc/results/release)
remains at its original commit. Historical outputs and scores were not rescored.

| Measurement | Numeric evidence | Collection date |
|---|---|---|
| DaveBench, <!-- fact:davebench-inputs -->1,342<!-- /fact --> documentation occurrences per format | [Images](images.json), [terminal](terminal.json), [native PNG provenance](native-png.json), [report](report.json), [tables](report.md) | <!-- fact:davebench-collected -->7 November 2026<!-- /fact --> |
| Drawing Correctness, <!-- fact:drawing-cases -->127<!-- /fact --> cases per project/format | [Results](drawing-correctness.json) | <!-- fact:drawing-collected -->7 November 2026<!-- /fact --> |
| Mermaid Fidelity, <!-- fact:fidelity-files -->352<!-- /fact --> original test files | [Results](mermaid-fidelity.json) | <!-- fact:fidelity-collected -->7 November 2026<!-- /fact --> |

The [completion record](../../docs/evidence/benchmark-completion-2026-11-07/README.md)
explains the proofs, source identities, full DOM-free comparison and remaining
observer gaps. Timing collections ran serially after semantic jobs and fixture
tests finished. Rendered outputs were discarded. Timings apply to the recorded
machine, resource limits and API/CLI boundaries.

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

Fidelity scores the <!-- fact:fidelity-population -->3,661<!-- /fact --> callbacks
that the fresh Mermaid <!-- fact:mermaid-reference -->12.3.0<!-- /fact --> control
qualifies. It leaves <!-- fact:fidelity-unqualified -->2,694<!-- /fact --> callbacks
reference-unqualified and <!-- fact:fidelity-skipped -->84<!-- /fact --> skipped.
Fifteen old use-case credits were withdrawn because missing lexer/parser
operations had been caught by negative assertions. Candidate adapter gaps remain
visible in the results and score ranges.

All 352 selected files were compared under explicit JSDOM and Node profiles for
all 26 frozen candidates. **325 files** qualify for automatic Node
execution with those exact bindings. The receipt compares callback identities,
outcomes, normalized failures and semantic audit dispositions, including faults.
The control and every unqualified candidate file retain JSDOM. Changed source,
runner, executable or artifact identities invalidate reuse. This is qualification
of the recorded cohort, not a claim that every test is independent of the DOM.

Drawing leaves <!-- fact:drawing-unassessed -->150<!-- /fact --> of
<!-- fact:drawing-rows -->4,318<!-- /fact --> outputs unassessed: 149 SVG outputs and
one terminal rectangle-work-budget limit. The SVG profile proves separation for
flat opaque labels on qualified opaque gradients. Glyph/image labels, complex
occlusion, unresolved pattern/CSS-shadow paint and other unsupported profiles
still receive no correctness credit. The [case inventory](../../docs/evidence/benchmark-completion-2026-11-07/svg-label-review.json)
identifies every remaining SVG output and its unavailable checks. PNG remains
outside Drawing Correctness's scope.

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
| Drawing known passes | 3,082 | 3,074 |
| Drawing unassessed | 186 | 150 |
| Fidelity reference-qualified callbacks | 3,676 | 3,661 |
| Native PNG admissible completions | Unmeasured | 1,114 |

Stronger label obligations revoke 41 old passes and leave 11 others unassessed;
44 previously unassessed outputs now pass and three now fail. The SVG observer's
static fast path agreed with its previous implementation on 1,882 captured label
probes; no timing or memory reduction is inferred from that finite comparison.
