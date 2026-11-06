# Release campaign

One fresh collection of all three benchmarks, on one machine, against the releases
frozen by `versions` on 6 November
([`catalog.json`](../../docs/evidence/benchmark-campaign-2026-11-06/catalog.json),
[`versions.json`](../../docs/evidence/benchmark-campaign-2026-11-06/versions.json)). File
names carry no dates; the dates below come from the timestamps each file records. No
rendered output is retained.

| Step | File | Collected |
|---|---|---|
| DaveBench SVG and PNG (alone on the machine) | [`images.json`](images.json) | <!-- fact:davebench-collected -->6 November 2026<!-- /fact --> |
| DaveBench terminal text | [`terminal.json`](terminal.json) | same day, after images |
| Mermaid Flutter native PNG (its three runs are also in `images.json`) | [`flutter.json`](flutter.json) | same day, after terminal |
| DaveBench rankings, built by `campaign:results` | [`report.json`](report.json), [`report.md`](report.md) | — |
| Drawing Correctness, <!-- fact:drawing-cases -->127<!-- /fact --> cases | [`drawing-correctness.json`](drawing-correctness.json) | <!-- fact:drawing-collected -->6 November 2026<!-- /fact --> |
| Mermaid Fidelity, four groups against one fresh Mermaid control | [`mermaid-fidelity.json`](mermaid-fidelity.json) | <!-- fact:fidelity-collected -->6 November 2026<!-- /fact --> |

## How it was collected

A checkpointed script ran the steps in order, so a restart resumes rather than repeats:

```sh
bun commands.ts versions --since docs/evidence/benchmark-campaign-2026-11-02/catalog.json --out versions
bun commands.ts prepare --catalog versions/catalog.json --out artifacts
bun commands.ts davebench --catalog CATALOG --prepared artifacts/community-browser-prepared.json --out images
bun commands.ts davebench:terminal --catalog CATALOG --prepared artifacts/community-prepared.json --out terminal
bun commands.ts davebench:native-png --host-display --bundle native-flutter/app/build/linux/x64/release/bundle --out flutter
bun commands.ts drawing:correctness --prepared artifacts/community-browser-prepared.json --terminal-prepared artifacts/community-prepared.json --catalog CATALOG --out drawing
bun commands.ts mermaid:fidelity ... --projects GROUP_1 --workers 4 --out fidelity-g1
bun commands.ts mermaid:fidelity ... --projects GROUP_N --reuse-reference fidelity-g1 --workers 4 --out fidelity-gN   # N = 2..4
bun commands.ts campaign:results --images images/results.json --terminal terminal/results.json --native-png flutter/results.json --out report
bun scripts/merge-drawing-results.ts --run drawing --out drawing-correctness.json
bun scripts/merge-fidelity-runs.ts --out mermaid-fidelity.json --catalog CATALOG fidelity-g1 fidelity-g2 fidelity-g3 fidelity-g4
```

No result was edited by hand: `campaign:results --native-png` merged the Mermaid Flutter
runs that the 0.2.0 collection had merged manually.

## What changed since the 0.2.0 collection

Four projects released since the 2 November freeze; each is measured at its new release:
Zombie Mermaid 5.14.4, Termaid 0.12.0, Latias Merman 0.9.3 (its npm packages caught up
with its CLI), and a new OpenCode source commit. Mermaid 12.3.0 is published, but
Mermaid's row is the pinned oracle install and stays at 12.2.0.

Four differences need a note:

- **Pele and Bezel Fidelity.** Reviewed views now assess 11 tests that were Trident gaps
  (event modeling relations, XY charts, requirement edges, Bezel's empty sequence
  accessibility description). All 11 pass. Unassessed tests across all candidates fell
  from 94 to <!-- fact:fidelity-gaps -->83<!-- /fact -->.
- **Frankenmermaid is measured at its v0.4.0 tag.** Its default branch now carries an
  untagged 0.5.0, and the 0.2.0 collection measured a default-branch build (`3d338ff`)
  that also called itself 0.4.0. `versions` now takes the distribution from the CLI's
  release tag (`d5ade10`) when the versions disagree, so every output measures the same
  release. DaveBench counts are unchanged; on the tagged release 14 fewer Fidelity tests
  pass (1,299 instead of 1,313).
- **Latias Merman's SVG and PNG changed measurement path.** In 0.2.0 its npm browser SDK
  (0.9.2) was older than its CLI (0.9.3), so DaveBench measured the CLI, with process
  startup in every call. Both are now 0.9.3, and DaveBench measures the browser API
  whenever it is as new as the CLI. Through the browser it completes 1,338 SVGs and 1,338
  PNGs; the CLI completed 1,338 SVGs and 1,280 PNGs, with resource-limit errors on PNG.
  Its times are not comparable with 0.2.0's. Terminal text still comes from the CLI.
- **The collection was restarted once.** The first attempt froze Frankenmermaid at the
  untagged 0.5.0 for SVG, PNG and Fidelity while its terminal output came from the v0.4.0
  CLI. The synthesis refused the mixed versions, `versions` was fixed as above, and every
  step was collected again from a new freeze. OpenCode's pin is the commit current at
  that second freeze.

## Environment

Node 26.3.0, Bun 1.4.4, Chromium 153.0.8010.12, Linux x64. Absolute DaveBench times
compare only with other rows of this collection.
