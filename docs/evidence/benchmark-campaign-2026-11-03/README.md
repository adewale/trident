# Campaign evidence — 3 November 2026

Numeric DaveBench measurements with output admission. No rendered SVG, PNG or
terminal output is retained. Each output was admitted mechanically after its clock
stopped and then discarded.

- `report.json`, `report.md`: consolidated rankings and every valid run row, produced by `campaign:results`.
- `images.json`, `terminal.json`, `flutter.json`: the complete SVG/PNG, terminal and native Flutter PNG collections with method, environment, admission rule and per-run rejected-output counts.
- Mermaid Fidelity counts, per-file outcomes and gap reasons for all 27 projects are in [`results/mermaid-fidelity-2026-11-03.json`](../../../results/mermaid-fidelity-2026-11-03.json); no project is left without a binding.

## What changed from 2 November

**Completion needs a usable output.** On 2 November any call that returned without
an error counted as completed. Two terminal CLIs (Grok renderer and MermaidText)
print input they cannot render back inside a box and exit 0, and several APIs return
empty strings or zero-size SVGs. Admission now rejects empty output, error messages,
error placeholders, zero-size SVGs, invalid PNGs and source printed back. The rules
are in [`davebench-definition.md`](../../davebench-definition.md#output-admission) and
[`unified/davebench-validity.ts`](../../../unified/davebench-validity.ts). A
calibration pass checked rejected samples by hand: 50 randomly sampled echo
rejections from the two CLIs were all the boxed fallback, and Mermaid's own outputs
produced no rejections.

**Time separates equal completions only within one boundary kind.** Fresh-process CLI
rows include process startup on every call; persistent API rows do not. When equal
completion counts mix those kinds, the rows share a rank.

**Mermaid Flutter is measured.** The Flutter 3.47.8 Linux engine, which the proxy
blocked on 2 November, downloaded here. The release counter was built from the
committed lockfile with `--enforce-lockfile` and run with `davebench:native-png
--host-display` under a private Xvfb display, because this machine has no Docker
daemon. Its Dart worker applies the same PNG admission.

## Workload and environment

The same 1,342 documentation occurrences at Mermaid commit
`370c4af57f43cb0bda05f4a9fe2d99c912ba16dd`, the same frozen 2 November catalog and
artifact versions, 30 warm-ups before each of three runs, and a 15-second timeout.
Collection ran alone, after all correctness work had finished. The environment
differs from 2 November (Chromium 153.0.8010.12 instead of 154.0.8037.57; Bun 1.4.4;
Node 22 workers), so absolute times are not interchangeable with the 2 November
times. Each run records its environment.

## Reproduction

Prepare artifacts from the frozen catalog, then:

```sh
bun commands.ts davebench --catalog docs/evidence/benchmark-campaign-2026-11-02/catalog.json --prepared BROWSER_PREPARED --out FRESH_IMAGES
bun commands.ts davebench:terminal --catalog docs/evidence/benchmark-campaign-2026-11-02/catalog.json --prepared TERMINAL_PREPARED --out FRESH_TERMINAL
bun commands.ts davebench:native-png --host-display --bundle native-flutter/app/build/linux/x64/release/bundle --out FRESH_FLUTTER
```

The Flutter rows are appended to the image collection before `campaign:results`
builds the report; no renderer runs during reporting.
