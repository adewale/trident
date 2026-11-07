# Release campaign

This retained campaign predates the collector validation fixes described in the
unreleased changelog. Its numbers have not been re-scored: stricter SVG visibility,
PNG decoding and candidate-fault handling require fresh collection. Regenerating
the tables only reprints these historical observations.

One fresh collection of all three benchmarks, on one machine, against the releases
frozen by `versions` on 7 November
([`catalog.json`](../../docs/evidence/benchmark-campaign-2026-11-07/catalog.json),
[`versions.json`](../../docs/evidence/benchmark-campaign-2026-11-07/versions.json)), with
Mermaid <!-- fact:mermaid-reference -->12.3.0<!-- /fact --> as the reference. File names carry no dates; the dates below come
from the timestamps each file records. No rendered output is retained.

| Step | File | Collected |
|---|---|---|
| DaveBench SVG and PNG (alone on the machine) | [`images.json`](images.json) | <!-- fact:davebench-collected -->7 November 2026<!-- /fact --> |
| DaveBench terminal text | [`terminal.json`](terminal.json) | same day, after images |
| Mermaid Flutter native PNG (its three runs are also in `images.json`) | [`flutter.json`](flutter.json) | same day, after terminal |
| DaveBench rankings, built by `campaign:results` | [`report.json`](report.json), [`report.md`](report.md) | — |
| Drawing Correctness, <!-- fact:drawing-cases -->127<!-- /fact --> cases | [`drawing-correctness.json`](drawing-correctness.json) | <!-- fact:drawing-collected -->7 November 2026<!-- /fact --> |
| Mermaid Fidelity, four groups against one fresh Mermaid control | [`mermaid-fidelity.json`](mermaid-fidelity.json) | <!-- fact:fidelity-collected -->7 November 2026<!-- /fact --> |

## How it was collected

A checkpointed script ran the steps in order, so a restart resumes rather than repeats:

```sh
bun commands.ts versions --since docs/evidence/benchmark-campaign-2026-11-06/catalog.json --out versions
bun commands.ts prepare --catalog versions/catalog.json --out artifacts
bun commands.ts davebench --catalog CATALOG --prepared artifacts/community-browser-prepared.json --out images
bun commands.ts davebench:terminal --catalog CATALOG --prepared artifacts/community-prepared.json --out terminal
bun commands.ts davebench:native-png --host-display --bundle native-flutter/app/build/linux/x64/release/bundle --out flutter
bun commands.ts drawing:correctness --prepared artifacts/community-browser-prepared.json --terminal-prepared artifacts/community-prepared.json --catalog CATALOG --out drawing
bun commands.ts mermaid:fidelity --upstream MERMAID_12_3_0 ... --projects GROUP_1 --workers 4 --out fidelity-g1
bun commands.ts mermaid:fidelity ... --projects GROUP_N --reuse-reference fidelity-g1 --workers 4 --out fidelity-gN   # N = 2..4
bun commands.ts campaign:results --images images/results.json --terminal terminal/results.json --native-png flutter/results.json --out report
bun scripts/merge-drawing-results.ts --run drawing --out drawing-correctness.json
bun scripts/merge-fidelity-runs.ts --out mermaid-fidelity.json --catalog CATALOG fidelity-g1 fidelity-g2 fidelity-g3 fidelity-g4
```

No result was edited by hand.

## What changed since the 6 November collection

- **Mermaid 12.3.0 is the reference.** The oracle, Mermaid's row in every benchmark and
  the Fidelity test suite moved from 12.2.0 to 12.3.0. Mermaid Fidelity now runs
  <!-- fact:fidelity-files -->352<!-- /fact --> test files, and Mermaid passes <!-- fact:fidelity-population -->3,676<!-- /fact --> of its own tests (at 12.2.0: 316 files and 3,618
  tests). The new test files mostly cover Mermaid's own layout and site code,
  which candidates are not scored on. The 119 documentation examples that Drawing
  Correctness imports for the newer families are byte-identical at both tags. Mermaid
  12.3.0 completes the same 1,336 DaveBench examples as 12.2.0 and the same 125 Drawing
  Correctness SVG cases.
- **An audit removed Trident's own errors from the failure counts.** Failures whose
  received value was `undefined` were checked by hand. Several were translation errors
  in Trident's views: bridged requirement models read as plain objects instead of
  Maps, `linkStyle default` dropped from flowchart edge lists, Kanban section icons
  dropped, tree-view directory slashes not restored, a jison parser's `true` return
  missing, and generic fallbacks that returned nothing for some mindmaps. Those are
  fixed, so the affected tests are now assessed, or marked unassessed where the
  project's model cannot answer (Pele's uncomputed Gantt times, Latias94/merman's
  layout-only mindmap). Pele's failures fell from 142 to 116, Bezel's from 139 to 109
  and Latias94/merman's from 298 to 269.
- **More tests are unassessed, by design.** Unassessed Fidelity tests rose from 83 to
  <!-- fact:fidelity-gaps -->274<!-- /fact -->. Most moved out of the failure column in the audit. Three new 12.3.0 tests per
  candidate read Mermaid's host configuration and assert on layout fields it copies from
  that configuration, so they are unassessed for every project and change no ranking.
- **One new release:** a new OpenCode commit.

## Environment

Node 26.3.0, Bun 1.4.4, Chromium 153.0.8010.12, Linux x64. The Fidelity runtime for the
12.3.0 suite was built with npm 11 (see `docs/upstream-original-runtime.md`). Absolute
DaveBench times compare only with other rows of this collection.
