# Current benchmark collection

These are fresh measurements with the corrected artifact, format and scoring
checks. Product versions use the [7 November freeze](../../docs/evidence/benchmark-campaign-2026-11-07/catalog.json).
The [previous campaign](https://github.com/adewale/trident/tree/49947d539cb9d04deed24608d2e9bd220810b17f/results/release)
remains at its original Git commit; its outputs and scores were not rescored.

| Measurement | Numeric evidence | Collection date |
|---|---|---|
| DaveBench, <!-- fact:davebench-inputs -->1,342<!-- /fact --> documentation examples per format | [Image runs](images.json), [terminal runs](terminal.json), [report](report.json), [tables](report.md) | <!-- fact:davebench-collected -->7 November 2026<!-- /fact --> |
| Drawing Correctness, <!-- fact:drawing-cases -->127<!-- /fact --> cases per project/format | [Results](drawing-correctness.json) | <!-- fact:drawing-collected -->7 November 2026<!-- /fact --> |
| Mermaid Fidelity, <!-- fact:fidelity-files -->352<!-- /fact --> original test files | [Results](mermaid-fidelity.json) | <!-- fact:fidelity-collected -->7 November 2026<!-- /fact --> |

The [verification record](../../docs/evidence/benchmark-validation-2026-11-07/README.md)
contains the regressions, native-engine controls and toolchain limits. The
[harness changes](https://github.com/adewale/trident/commit/5be2c137d717177574103c3ca01c07eca89ea6b7)
reuse existing observers and derive published totals from complete case results.

## Native PNG and remaining coverage

Native Flutter PNG has no fresh measurement. The worker compiled to a Linux
release AOT library with the available Flutter 3.44.0 / Dart 3.12.0 SDK, and eight
admission controls passed in its native engine. The documented Flutter 3.47.8 SDK
and complete GTK release bundle remain unverified because the environment blocks
`storage.googleapis.com`. The untracked compatibility build required three
transitive dependency changes, recorded in the verification JSON. Historical
native PNG measurements remain in the previous campaign.

Drawing leaves <!-- fact:drawing-unassessed -->184<!-- /fact --> of
<!-- fact:drawing-rows -->4,318<!-- /fact --> outputs unassessed. SVG labels require
visibility, canvas, clipping and resolved-paint evidence. Latin-1 text has measured
glyph bounds; unsupported gradient paint, outlines, embedded images, masks and
complex clipping/occlusion withhold credit. Terminal matching preserves reading
order and joins wrapping inside observed boxes. PNG is outside Drawing's scope.

Fidelity scores the <!-- fact:fidelity-population -->3,676<!-- /fact --> callbacks
that the fresh Mermaid <!-- fact:mermaid-reference -->12.3.0<!-- /fact --> control
passes. The control leaves <!-- fact:fidelity-unqualified -->2,679<!-- /fact -->
callbacks unqualified and <!-- fact:fidelity-skipped -->84<!-- /fact --> skipped.
Candidate schema/operation gaps remain visible in the result file and score ranges.

## Reproduction

The tools need the pinned Mermaid oracle, a checkout containing the pinned
Mermaid source and documentation commits, and the toolchains for the frozen
products. See [installation](../../README.md#quick-start),
[benchmark methods](../../docs/benchmark-results-details.md) and
[native build instructions](../../native-flutter/README.md).

The collection used fresh output directories. `CATALOG` below is the freeze
linked above; `UPSTREAM`, `ORACLE` and `RUNTIME` identify the admitted source,
reference package and prepared original test runtime.

```sh
bun commands.ts prepare --catalog CATALOG --out artifacts
bun commands.ts drawing:correctness --catalog CATALOG --prepared artifacts/community-browser-prepared.json --terminal-prepared artifacts/community-prepared.json --out drawing
bun commands.ts mermaid:fidelity --upstream UPSTREAM --reference ORACLE --runtime RUNTIME --prepared artifacts/community-prepared.json --catalog CATALOG --projects mermaid-js/mermaid --workers 4 --out control
bun commands.ts mermaid:fidelity --upstream UPSTREAM --reference ORACLE --runtime RUNTIME --prepared artifacts/community-prepared.json --catalog CATALOG --reuse-reference control --workers 4 --out fidelity
bun commands.ts davebench --catalog CATALOG --upstream UPSTREAM --prepared artifacts/community-browser-prepared.json --out images
bun commands.ts davebench:terminal --catalog CATALOG --upstream UPSTREAM --prepared artifacts/community-prepared.json --out terminal
bun scripts/merge-drawing-results.ts --run drawing --out drawing-correctness.json
bun scripts/merge-fidelity-runs.ts --catalog CATALOG --out mermaid-fidelity.json fidelity
bun commands.ts campaign:results --images images/results.json --terminal terminal/results.json --out report
bun commands.ts results:snapshot
```

The recorded campaign replaced its initial SVG rows with a complete SVG rerun
after the paint checks were tightened. Terminal rows were preserved by the
project/format merger. Timing collection ran separately from local correctness checks.
Outputs were discarded; the numeric files retain populations, counts, rejection
reasons and collection times. Timings apply to the recorded machine and call
boundaries. Published values are generated from these files.

## Changes from the previous campaign

| Observation | Previous | Fresh collection |
|---|---:|---:|
| Drawing known passes | 3,307 | 3,084 |
| Drawing unassessed | 0 | 184 |
| Fidelity candidate adapter-gap callbacks | 274 | 272 |
| Mermaid SVG completions | 1,336 | 1,302 |
| Mermaid SVG-to-PNG completions | 1,336 | 1,302 |

Fidelity pass counts reproduce the previous campaign. Two callbacks previously
classified as adapter gaps now record candidate invocation failures. The control
population is unchanged.

Mermaid has 34 XML admission failures: 18 outputs contain undeclared `&nbsp;`
entities and 16 omit the namespace declaration for `xlink:href`. Every rejected
case was reproduced independently. PNG conversion requires admissible source SVG,
so these outputs also lose converted-PNG completions. Other measured DaveBench
completion counts reproduce the previous campaign.
