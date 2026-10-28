# Native Flutter and Pele: audited entrypoint results

**Question:** do these measurements establish which library completes equivalent
rendering work faster?

| Project / published version | Runtime | Recorded completion | Matched-work latency comparison |
|---|---|---|---|
| mermaid_flutter 0.3.2 | Native Linux Flutter release | Widget engine raster completion or encoded PNG return | Withheld: no matching browser completion/size/font contract |
| Pele 1.9.0 | Chromium | SVG return plus DOM mutation; offscreen export measured separately | Withheld: DOM mutation is not raster completion |

The campaign ran on 28 October 2026. It exercises the actual Flutter-runtime
entrypoints tracked in [issue #30](https://github.com/adewale/trident/issues/30).
The [dated publication](https://github.com/adewale/trident/releases/tag/native-flutter-evidence-2026-10-28)
contains five interface scorecards, all raw records, rendered output, the measured
source snapshot and an adversarial audit. The [example receipt](evidence/native-flutter-example.json)
records the reductions below and their source-file hashes. These are historical
descriptive observations, not a calibrated Render Cost and Scaling result.

## Invocation coverage and observed output

Selected workload: six core/scaling fixtures, 23 registry fixtures, one malformed
flowchart and one ZenUML probe. This is a 31-input development inventory, not the
complete Mermaid corpus. Each interface has three rounds of five measured calls
per input/phase, plus two warmups per round. Negative records that fail during
preparation are separated from timed calls in the owning scorecards.

Native release interfaces; units below are **inputs**, except the final column:

| Project / version / interface | Planned | Positive inputs with nonblank output | Malformed controls rejected | Unsupported ZenUML probes | Manual findings in selected captures |
|---|---:|---:|---:|---:|---|
| mermaid_flutter 0.3.2 / MermaidDiagram | 31 | 29 | 1 | 1 | Pie corner marks; four large core fixtures clipped |
| mermaid_flutter 0.3.2 / MermaidView | 31 | 29 | 1 | 1 | Pie corner marks; four large core fixtures clipped |
| mermaid_flutter 0.3.2 / renderToPng | 31 | 29 | 1 | 1 | Pie corner marks |

Chromium interfaces; nonblank counts use an **offscreen SVG raster**. DOM
screenshots cover selected fresh/update samples, not every timed call:

| Project / version / interface | Planned | Positive inputs with nonblank SVG raster | Malformed controls rejected | Unsupported ZenUML probes | Timed-call gaps |
|---|---:|---:|---:|---:|---|
| Pele 1.9.0 / mount and update | 31 | 29 | 1 | 1 | None in the selected inventory |
| Pele 1.9.0 / render plus DOM insertion | 31 | 29 | 1 | 1 | 84 negative repeat/update records failed in preparation; fresh rejection was observed |

Nonblank output does not establish a complete or correct diagram. Native View
captures include controls. Semantic/model checks are unavailable. The observed
corner marks are not a diagnosis of whether the library or software graphics
caused them. Clipped content and unchanged pixels remain in the evidence.

## Small-flowchart costs within each public interface

Input: `core:flow5`. Historical protocol; **15 non-warmup observations per cell**.
Medians are descriptive; confidence intervals and A/A calibration are unavailable.
No relative-time column is admitted. Fixed order and capture-heavy sample pacing
limit causal cache/throughput claims.

Native widget rows stop at the **engine raster finish** derived from matched
`FrameTiming` timestamps. The viewport is 1000×700 at pixel ratio 1:

| Project / version / interface | Fresh median (ms) | Repeat median (ms) | Source-update median (ms) | Qualification |
|---|---:|---:|---:|---|
| mermaid_flutter 0.3.2 / MermaidDiagram | 16.51 | 15.37 | 16.90 | Nonblank capture; full semantic qualification unavailable |
| mermaid_flutter 0.3.2 / MermaidView | 43.50 | Withheld¹ | 44.45 | Fresh/changed View includes the fit frame; controls retained |

¹ The recorded repeat median is 44.01 ms, but the harness forced an unnecessary
second frame. It is retained as a two-frame diagnostic, not the time an unchanged
View requires to render. It is not replaced by a reconstructed first-frame value.

Native PNG rows stop when the public API returns an **encoded PNG**, using its
intrinsic scene dimensions at pixel ratio 1:

| Project / version / interface | Fresh median (ms) | Repeat median (ms) | Source-update median (ms) | Qualification |
|---|---:|---:|---:|---|
| mermaid_flutter 0.3.2 / renderToPng | 11.63 | 11.03 | 11.10 | Combined parse/layout/raster/PNG cost; internal stages opaque |

Chromium rows stop after the public call and **DOM mutation**, before proof of
compositor presentation:

| Project / version / interface | Fresh median (ms) | Repeat median (ms) | Source-update median (ms) | Qualification |
|---|---:|---:|---:|---|
| Pele 1.9.0 / mount and update | 1.90 | 1.60 | 1.80 | Call plus DOM work; SVG raster and selected DOM captures checked separately |
| Pele 1.9.0 / render plus DOM insertion | 1.40 | 1.20 | Withheld² | SVG return and insertion have separate raw stages |

² The render-update harness restored the original source before every timed
call. Each positive cell contains nine changed replacements and six unchanged
replacements, rather than 15 alternating transitions. The original 1.10 ms
median is retained in the raw results with that qualification.

## A more useful comparison from this run

Within-interface scaling keeps the public work and completion boundary explicit.
These are **fresh-call medians**, 15 observations per cell. Growing output size
is part of the measured work; different inputs are not interchangeable samples.

Native encoded PNG return:

| Project / version | flow5 median (ms) | tree50 median (ms) | class80 median (ms) | Qualification |
|---|---:|---:|---:|---|
| mermaid_flutter 0.3.2 / renderToPng | 11.63 | 143.29 | 290.74 | Intrinsic PNG sizes vary; nonblank-only qualification |

Chromium public render plus DOM mutation:

| Project / version | flow5 median (ms) | tree50 median (ms) | class80 median (ms) | Qualification |
|---|---:|---:|---:|---|
| Pele 1.9.0 / render plus DOM insertion | 1.40 | 3.30 | 6.20 | Does not include a native-equivalent raster-completion event |

These tables describe each interface's cost envelope and expose its output
limitations. They cannot answer whether a Flutter-rendered product is faster
than a browser-rendered product. The full publication keeps first use in new
processes separate, with five observations per entrypoint; its launch/import
costs are excluded.

A useful head-to-head follow-up would compare one completed product: a
fixed-size PNG or a verified composited frame. Specify the same viewport, pixel
ratio, fonts, fit/cropping policy and source transition before collecting data.
Keep stage clocks separate, counterbalance order and use A/A controls. Until
those measurements are collected, the relative-cost result remains withheld.

## Environment, audit and evidence

One Debian 13.6 cloud host, four CPU-equivalents of cgroup quota and 16 GiB memory
limit. Flutter 3.47.8, Dart 3.13.7 and Impeller software GL ran sequentially with
Chromium 154.0.8037.57 using SwiftShader. This does not predict mobile GPU costs.
Exact tool, engine, package, font and binary identities are in the publication.

The main campaign has 9,765 recorded observations, including **84 preparation
failures**; 9,681 reached their timed operation. Supplemental edits add 315
records and post-launch first use adds 25, for 10,105 campaign observations.
Three independent adversarial reviewers found the workload defects above and
runner/publication gaps. The corrected runner uses a new protocol and separate
verification records; its source fixes do not upgrade or replace old timings.

[Setup and completion boundaries](../native-flutter/README.md) ·
[Reporting conventions](../REPORTING.md) ·
[Public scorecards, raw evidence and audit](https://github.com/adewale/trident/releases/tag/native-flutter-evidence-2026-10-28)
