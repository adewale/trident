# Current benchmark collection

DaveBench and Drawing outputs were collected for Trident 0.3.0 against the
[7 November product freeze](../../docs/evidence/benchmark-campaign-2026-11-07/catalog.json)
and Mermaid 12.3.0. SVG labels have since been reassessed from those retained
outputs, and Fidelity recollected after fixing unused imports that prevented test
collection. The [follow-up evidence](../../docs/evidence/observation-qualification-2026-11-09/README.md)
records the changes and qualification. The
[0.3.0 collection receipt](https://github.com/adewale/trident/blob/v0.3.0/docs/evidence/release-0.3.0/collection.json)
records the original collection windows, admission and numeric-file hashes;
those original results remain at the release tag. DaveBench timings are unchanged.

| Measurement | Numeric evidence | Completed |
|---|---|---|
| DaveBench, <!-- fact:davebench-inputs -->1,342<!-- /fact --> documentation occurrences per format | [Images](images.json), [terminal](terminal.json), [native PNG provenance](native-png.json), [report](report.json), [tables](report.md) | <!-- fact:davebench-collected -->9 November 2026<!-- /fact --> |
| Drawing Correctness, <!-- fact:drawing-cases -->127<!-- /fact --> cases per project/format | [Results](drawing-correctness.json) | <!-- fact:drawing-collected -->9 November 2026<!-- /fact --> |
| Mermaid Fidelity, <!-- fact:fidelity-files -->352<!-- /fact --> original test files | [Results](mermaid-fidelity.json) | <!-- fact:fidelity-collected -->9 November 2026<!-- /fact --> |

Timing collectors ran serially before Drawing and Fidelity, without local fixture
or semantic jobs competing for CPU. Every format has three complete repeats;
153 runs account for 205,326 measured calls, with no blocked lanes or missing API
durations. Timings apply to the recorded machine, resource limits and API/CLI
boundaries. Timing collectors discard rendered outputs; Drawing retains every
returned SVG and terminal output in the archive below.

## Native Flutter PNG

The pinned Flutter 3.47.8 / Dart 3.13.7 GTK release bundle passed CI build/smoke
verification and all nine production PNG admission controls on the measurement
host. The unchanged package lock selects `mermaid_flutter` and `mermaid_core`
0.3.2. The collector verified every bundle file and its source/SDK/smoke receipts
before measuring three complete runs of 1,342 inputs, with 30 warm-ups per run.

Native PNG has **1,114/1,342 admissible completions** (the minimum across
three runs). Its median API total is **25.455 seconds**. The
[raw native file](native-png.json) retains build, library, runtime and rendering
provenance alongside every run. Its timing boundary is the release app's
`renderToPng(source,pixelRatio:1)` call; startup, warm-ups, IPC and admission are
excluded. CI supplies build and smoke evidence; scores come from the separate
measurement host.

## Qualification and remaining coverage

The current published Fidelity figures and 321-file common qualification below
belong to the complete collection at `e88030a`. A later boundary fix is verified
in CI, but its measurement refresh is [incomplete](../../docs/evidence/observation-qualification-2026-11-09/boundary-review-pending.json)
because the host exhausted its process budget. The changed worker falls back to
JSDOM until fresh paired qualification is complete.

Fidelity scores the <!-- fact:fidelity-population -->7,346<!-- /fact --> callbacks
that the fresh Mermaid <!-- fact:mermaid-reference -->12.3.0<!-- /fact --> control
qualifies. It leaves <!-- fact:fidelity-unqualified -->0<!-- /fact --> callbacks
reference-unqualified and <!-- fact:fidelity-skipped -->18<!-- /fact --> skipped.
The control executes pinned production source with its original compiler plugins
and locked dependencies. The collector now requires sealed runtime admission,
including actual Canvas/JSDOM pixel readback, before creating an output directory.
A stale preparation missing a required locked operand was rejected. Candidate
adapter gaps remain visible in results and score ranges.

All 26 candidates have fresh paired JSDOM/Node executions of all 352 files.
Per-file startup receipts attest the actual environment before imports. The
comparison checks callback identities, outcomes, normalized failures and semantic
audit dispositions. 321 files qualify for Node in common, with candidate-specific
additions recorded separately; original JSDOM directives and observed differences
retain JSDOM. A full automatic Merslim run used 321 actual Node environments
and 31 actual JSDOM environments and reproduced all 7,364 baseline callback
dispositions. Changing only Trident's version from 0.2.1 to 0.3.0 preserves this
fresh execution identity and qualification. Changed executing source, installed
bytes, runtime or candidate artifacts still invalidate reuse.

Drawing leaves <!-- fact:drawing-unassessed -->120<!-- /fact --> of
<!-- fact:drawing-rows -->4,318<!-- /fact --> observations unassessed. Path/image
glyphs, unsupported effects and other representations outside the qualified SVG
profiles receive no correctness credit. The replay resolved 25 formerly unknown
Latias SVGs: 24 have clipped label ink and one passes. Every remaining unknown
records its unavailable criteria and glyph-proof stage and reason; none resulted
from an observer fault. Each case's evidence is in the retained raw run. PNG
remains outside Drawing Correctness's scope. The
[earlier SVG inventory](../../docs/evidence/benchmark-completion-2026-11-07/svg-label-review.json)
describes the preceding collection; its output hashes are historical.

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
# With other benchmark and check jobs stopped, collect timings serially.
bun commands.ts davebench:native-png --host-display --bundle VERIFIED_BUNDLE --out native-png
bun commands.ts davebench --catalog CATALOG --upstream UPSTREAM --prepared artifacts/community-browser-prepared.json --out images
bun commands.ts davebench:terminal --catalog CATALOG --upstream UPSTREAM --prepared artifacts/community-prepared.json --out terminal
# After all timings finish, collect drawing and parser evidence.
bun commands.ts drawing:correctness --catalog CATALOG --prepared artifacts/community-browser-prepared.json --terminal-prepared artifacts/community-prepared.json --out drawing
TRIDENT_FIDELITY_ENVIRONMENT=jsdom bun commands.ts mermaid:fidelity --upstream UPSTREAM --reference ORACLE --runtime RUNTIME --prepared artifacts/community-prepared.json --catalog CATALOG --workers 2 --out fidelity-jsdom
TRIDENT_FIDELITY_ENVIRONMENT=node bun commands.ts mermaid:fidelity --upstream UPSTREAM --reference ORACLE --runtime RUNTIME --prepared artifacts/community-prepared.json --catalog CATALOG --reuse-reference fidelity-jsdom --workers 2 --out fidelity-node
bun scripts/qualify-dom-free.ts fidelity-jsdom fidelity-node 2086904e76c692331e34a45d7cc3bc30860d040e dom-free-qualified.json
cp dom-free-qualified.json unified/mermaid-fidelity/dom-free-files.json
bun commands.ts mermaid:fidelity --upstream UPSTREAM --reference ORACLE --runtime RUNTIME --prepared artifacts/community-prepared.json --catalog CATALOG --reuse-reference fidelity-jsdom --projects emtyty/merslim --workers 2 --out fidelity-auto
bun scripts/merge-drawing-results.ts --run drawing --out drawing-correctness.json
bun scripts/merge-fidelity-runs.ts --catalog CATALOG --out mermaid-fidelity.json fidelity-jsdom
bun commands.ts campaign:results --images images/results.json --terminal terminal/results.json --native-png native-png/results.json --out report
# Publish the fresh numeric files, then regenerate tables and quoted facts.
bun commands.ts results:snapshot
```

## Retained Drawing capture

The current [capture archive](captures/drawing-capture-2026-11-09.tar.gz?raw=true) is
4,091,382 bytes, with SHA-256 `d60962ce8b5d4ea1aedf8de60d0b7169a6d5cb24110f74b15a89c60f72a8fe24`.
It contains the complete raw run and all 3,684 returned SVG/terminal outputs,
stored as 3,437 compressed objects. The other 634 calls returned renderer
failures. The output bytes are identical to the 0.3.0 capture. The SVG replay
changes 25 verdicts; all other SVG verdicts and all 2,286 terminal verdicts are
preserved. The raw run retains both collection and reassessment times.

Reassessment needs no producer binaries or prepared artifact directories:

```sh
mkdir -p .cache/drawing-replay
tar -xzf results/release/captures/drawing-capture-2026-11-09.tar.gz -C .cache/drawing-replay
bun scripts/reassess-drawing-results.ts .cache/drawing-replay/drawing-retained .cache/drawing-replay/fresh-assessment
```

The committed archive and numeric results are checked together: every returned
output has a unique owning project/case/format, source and content checksums,
and a matching published disposition. Collection time and reassessment time
remain separate. Earlier archives remain in Git history.
