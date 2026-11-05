# Release campaign

One fresh collection of all three benchmarks, on one machine, against the frozen
2 November catalog and artifact versions
([`catalog.json`](../../docs/evidence/benchmark-campaign-2026-11-02/catalog.json)). File
names carry no dates; the dates below come from the timestamps each file records. No
rendered output is retained.

| Step | File | Collected |
|---|---|---|
| DaveBench SVG and PNG (alone on the machine) | [`images.json`](images.json) | <!-- fact:davebench-collected -->5 November 2026<!-- /fact --> |
| DaveBench terminal text | [`terminal.json`](terminal.json) | same day, after images |
| Mermaid Flutter native PNG (its three runs are also appended to `images.json`) | [`flutter.json`](flutter.json) | same day, after terminal |
| DaveBench rankings, built by `campaign:results` | [`report.json`](report.json), [`report.md`](report.md) | — |
| Drawing Correctness, <!-- fact:drawing-cases -->127<!-- /fact --> cases | [`drawing-correctness.json`](drawing-correctness.json) | <!-- fact:drawing-collected -->5 November 2026<!-- /fact --> |
| Mermaid Fidelity, four groups against one fresh Mermaid control | [`mermaid-fidelity.json`](mermaid-fidelity.json) | <!-- fact:fidelity-collected -->5 November 2026<!-- /fact --> |

## How it was collected

`release.sh` in the campaign workspace ran the steps in order and skipped any step whose
results were already complete, so a container restart resumes rather than repeats:

```sh
bun commands.ts davebench --catalog CATALOG --prepared BROWSER_PREPARED --out images
bun commands.ts davebench:terminal --catalog CATALOG --prepared TERMINAL_PREPARED --out terminal
bun commands.ts davebench:native-png --host-display --bundle native-flutter/app/build/linux/x64/release/bundle --out flutter
bun commands.ts drawing:correctness --prepared IMAGE_PREPARED --terminal-prepared TERMINAL_PREPARED --catalog CATALOG --out drawing
bun commands.ts mermaid:fidelity ... --projects GROUP_1 --workers 4 --out fidelity-g1
bun commands.ts mermaid:fidelity ... --projects GROUP_N --reuse-reference fidelity-g1 --workers 4 --out fidelity-gN   # N = 2..4
bun scripts/merge-fidelity-runs.ts --out mermaid-fidelity.json --catalog CATALOG fidelity-g1 fidelity-g2 fidelity-g3 fidelity-g4
bun scripts/merge-drawing-results.ts --run drawing --out drawing-correctness.json --collected-at TIME
```

Three things happened during the collection, and each is recorded here:

- **DaveBench was restarted twice.** The first image collection showed that the new
  fallback check rejected six renders by Mermaid itself (event-modeling payloads drawn
  as written), and the second showed it rejected Agentic Mermaid's quadrant legend. The
  rule was corrected each time (`key: value` lines are data, not statements) and every
  DaveBench step was collected again from the start. Each run now records which inputs
  were rejected and why (`rejected`).
- **Fidelity was collected three times; the third is published.** The first collection
  showed nine radar tests counted as Trident gaps when the test file fails on the
  candidate's own unsupported operation (now unsupported), and one test that observes
  nothing qualifying in the control because its setup's `setGen('gen-2')` counted as an
  operation. Reading `setGen` before a parse also marked whole tests unsupported for
  candidates that reject a header-only flowchart (Grok, MermaidText, Loom). After those
  fixes all four groups were collected again on one commit; the second attempt was
  stopped because its runtime changed mid-run. `rescore-fidelity.ts` can apply a later
  outcome rule to recorded reports without running any test.
- **Drawing was collected twice.** The first collection recorded one OpenCode terminal case
  as unrun because Trident's worker pipe had broken. After the fix (restart the worker,
  call the case again), Drawing was collected again in full. That run predates the
  timestamps Drawing now records, so its date is the time its `results.json` was last
  written, passed explicitly with `--collected-at`.

## Environment

Node 26.3.0, Bun 1.4.4, Chromium 153.0.8010.12, Linux x64. Absolute DaveBench times
compare only with other rows of this collection.
