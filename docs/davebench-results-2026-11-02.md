# DaveBench: documentation rendering, 2 November 2026

A [later campaign](benchmark-campaign-results-2026-11-02.md) adds terminal text, updates versions, measures Dart and corrects the Merman PNG invocation. This earlier report retains its original measurements.

**1,342 examples per format per run. Three runs, with the same 30-example warm-up before each.** Counts were identical across all three repeats. Times below are medians of the total render/export call time, including failures. Outputs were discarded without assessment.

Inputs: all standalone `mermaid` and `mermaid-example` Markdown fences under generated `docs/`, including duplicate occurrences, at Mermaid commit [`370c4af57f43cb0bda05f4a9fe2d99c912ba16dd`](https://github.com/mermaid-js/mermaid/tree/370c4af57f43cb0bda05f4a9fe2d99c912ba16dd/docs), across 49 files.

## Ranking rule

**Completion first; time breaks ties.** More completed examples is better because the renderer handles more of this fixed documentation workload. For equal counts, less total time is better because the same full attempted workload takes less time at that completion count.

Use the minimum completed count across three complete runs, followed by median total time. Exact ties share a rank. Blocked or incomplete collections remain unranked. Ranking uses unrounded measurements. SVG and PNG are ranked separately, with no combined score.

The stack ranks compare the declared public execution paths. The native CLI includes per-example process startup; browser API rows use initialized runtimes. The path is explicit in each row.

## SVG ranking

| Rank | Project | Version | Completed / 1,342 | Failed | Median total seconds | Path |
|---:|---|---|---:|---:|---:|---|
| 1 | Frankenmermaid | 0.4.0 | 1,342 | 0 | 0.531 | Browser API |
| 2 | DSH Mermaid GB SVG | 0.1.4 | 1,340 | 2 | 0.169 | Browser API |
| 3 | Latias Merman | 0.9.2 | 1,338 | 4 | 4.168 | Browser API |
| 4 | Mermaid | 12.2.0 | 1,336 | 6 | 39.375 | Browser API |
| 5 | Ondine | 0.0.3 | 1,306 | 36 | 0.242 | Browser API |
| 6 | Bezel | 0.2.23 | 1,306 | 36 | 0.367 | Browser API |
| 7 | Pele | 1.9.0 | 1,306 | 36 | 0.527 | Browser API |
| 8 | Mermaid RS Renderer | 0.3.1 | 1,306 | 36 | 11.594 | Native CLI |
| 9 | Agentic Mermaid | 0.4.1 | 823 | 519 | 9.257 | Browser API |
| 10 | Merslim | 0.2.3 | 700 | 642 | 21.822 | Browser API |
| 11 | XMermaid | 0.4.2 | 682 | 660 | 0.512 | Browser API |
| 12 | Zombie Mermaid | 5.14.1 | 593 | 749 | 1.402 | Browser API |
| 13 | Beautiful Mermaid | 1.1.3 | 537 | 805 | 1.081 | Browser API |
| 14 | Crafter Mermaid | 0.0.3 | 512 | 830 | 0.353 | Browser API |
| 15 | VitePress Plugin Diagram | 0.3.2 | 398 | 944 | 0.092 | Browser API |

## PNG ranking

| Rank | Project | Version | Completed / 1,342 | Failed | Median total seconds | Path |
|---:|---|---|---:|---:|---:|---|
| 1 | Frankenmermaid | 0.4.0 | 1,342 | 0 | 12.022 | Browser API |
| 2 | DSH Mermaid GB SVG | 0.1.4 | 1,340 | 2 | 5.242 | Browser API |
| 3 | Latias Merman | 0.9.2 | 1,338 | 4 | 15.231 | Browser API |
| 4 | Mermaid | 12.2.0 | 1,336 | 6 | 59.897 | Browser API |
| 5 | Bezel | 0.2.23 | 1,306 | 36 | 7.226 | Browser API |
| 6 | Pele | 1.9.0 | 1,306 | 36 | 7.801 | Browser API |
| 7 | Ondine | 0.0.3 | 1,306 | 36 | 8.066 | Browser API |
| 8 | Mermaid RS Renderer | 0.3.1 | 1,306 | 36 | 35.650 | Native CLI |
| 9 | Agentic Mermaid | 0.4.1 | 813 | 529 | 15.154 | Browser API |
| 10 | Merslim | 0.2.3 | 700 | 642 | 27.163 | Browser API |
| 11 | XMermaid | 0.4.2 | 682 | 660 | 3.686 | Browser API |
| 12 | Zombie Mermaid | 5.14.1 | 577 | 765 | 4.619 | Browser API |
| 13 | Beautiful Mermaid | 1.1.3 | 513 | 829 | 3.313 | Browser API |
| 14 | Crafter Mermaid | 0.0.3 | 512 | 830 | 4.161 | Browser API |
| 15 | VitePress Plugin Diagram | 0.3.2 | 398 | 944 | 1.640 | Browser API |

## Blocked projects

| Project | Applicable formats | Reason |
|---|---|---|
| Mermaid Dart | SVG, PNG | Dart SDK absent; SDK distribution host storage.googleapis.com denied by the environment network policy. No reusable published binary was available. |
| Mermaid Flutter | PNG | Native Flutter release bundle and SDK absent; SDK distribution host storage.googleapis.com denied by the environment network policy. No reusable published binary was available. |

## Method and numeric data

- A completion is a render/export call that reports success. Returned drawing contents are not inspected. No SVG or PNG payloads, output hashes or output-size measurements were saved.
- SVG clocks stop at the awaited public SVG return. PNG clocks include rendering, rasterization and PNG encoding. Browser PNG uses the shared Chromium converter, except Merslim uses its prepared public PNG API. The native CLI encodes PNG to `/dev/null`.
- Initialization, warm-up, report writing and cleanup are outside the clock. The timeout is 15 seconds per call. There were 0 timeouts in the measured runs.
- Renderers ran sequentially. Mermaid uses its public first-party ZenUML addon 1.0.1. Other renderers use the prepared public adapters and their defaults. Installed package versions are reported above.
- Transport corrections: initial classic-script initialization failures for Agentic Mermaid/Pele and the native Rust PNG stdout-socket failure were replaced by fresh three-run collections after fixing those transports. Failed setup attempts supply no final renderer score.
- The SVG/PNG-unavailable terminal-only projects are outside this workload. Of 17 applicable catalogue projects, 15 ran in both formats and two remain blocked by unavailable toolchains.

[All 90 numeric run rows (CSV)](evidence/davebench-simple-2026-11-02/runs.csv) · [Numeric report (JSON)](evidence/davebench-simple-2026-11-02/results.json) · [Benchmark definition](davebench-definition.md)

Environment: Chromium 154.0.8037.57; Bun 1.4.2; Linux x86_64.

The previous drawing-assessment tables and baseline retain their original methods and values. This campaign supplies completion and time measurements only.
