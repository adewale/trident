# DaveBench PNG export v1: withdrawn timing comparison

> **Timing comparison withdrawn.** The v1 table measured unequal runtimes,
> output sizes and diagram content. Its nonblank gate did not establish equivalent
> work. The retained data is an export diagnostic, not a comparative performance
> result. A replacement must meet a fixed output and verified-content contract.

This extends the existing DaveBench documentation corpus to completed PNG export.
It uses the same 548 occurrences, 546 distinct trimmed sources and 34 syntax pages
from Mermaid 12.2.0, with 30 warmup attempts and five rounds. Every occurrence
remains in the coverage denominator, including unsupported syntax and examples
that intentionally contain no drawable content.

| Participant | Version | Actual measured path |
|---|---|---|
| Agentic Mermaid | 0.4.1 | Published Node `renderMermaidPNG(source,{scale:1})` |
| mermaid_flutter | 0.3.2 | Native Linux Flutter release `renderToPng(source,pixelRatio:1)` |
| Mermaid | 12.2.0 | Chromium public `render()`, SVG preparation/decode, canvas draw and PNG production |
| Pele | 1.9.0 | Chromium public `render()` and the same SVG-to-PNG conversion as Mermaid |

Mermaid registers its pinned first-party ZenUML addon 1.0.1. Node, Flutter and
Chromium run sequentially on the same cloud machine. No Flutter Web, compiled
Dart JavaScript, pure Dart runner or debug Flutter timing is used.

## Coverage and outcomes

Counts per round; every one of the five rounds has these same outcomes. Units are documentation occurrences.

| Participant / runtime | Planned | PNG bytes returned | Nonblank PNG qualified | Failed | Blocked |
|---|---:|---:|---:|---:|---:|---:|
| Agentic Mermaid 0.4.1 / Node | 548 | 335 | 335 | 213 | 0 |
| Mermaid 12.2.0 / Chromium | 548 | 547 | 547 | 1 | 0 |
| mermaid_flutter 0.3.2 / native Flutter release | 548 | 449 | 448 | 100 | 0 |
| Pele 1.9.0 / Chromium | 548 | 532 | 531 | 17 | 0 |

A qualified output is an actual PNG that decodes and contains nonuniform visible
content. This does not establish label retention, relationships, absence of
clipping or equivalent quality. "Bytes returned" overlaps qualified/failed/blocked
counts; an API can return a PNG that fails the content check.

Mermaid's single failure is `flowchart.md:674`, which requests
`https://mermaid.js.org/favicon.svg`. The network receipt records that asset as
blocked under the declared offline policy; its public SVG call cannot decode it.
This is an export constraint in this run, rather than a general renderer defect.

Pele has 16 ZenUML detection errors and one uniform PNG. Native Flutter has 99
public API errors, including unsupported families/syntax, and one uniform PNG.
Agentic Mermaid has 213 public API errors across unsupported families and syntax.
All errors and source inputs remain retained.

Both uniform PNGs come from `gantt.md:291`, which contains only `tickInterval` and
`weekday` settings and no tasks. They fail the benchmark's nonblank policy; that
does not by itself establish a library bug. DaveBench's SVG-return check admitted
Pele's returned SVG for this occurrence. The PNG extension therefore observes a
completion/content boundary that SVG return alone does not establish.

## Completed export costs

The clock starts with source text and stops after encoded PNG bytes are available
and consumed. Startup/import, transport, qualification and file writes are outside
the clock. Qualification finishes before the next timed export, including native
acknowledgement barriers. Native and Agentic PNG APIs expose opaque combined costs;
browser stage clocks are retained separately. Browser PNG production includes any
deferred rasterization/readback plus encoding, rather than isolated encoding CPU.

The original timing table is withdrawn. Its 315-input common-success cohort
used unequal runtimes, intrinsic dimensions, fonts and diagram content. The raw
samples remain in the immutable evidence archive below for diagnosis. Those
latencies must not be used to rank the libraries.

The collapsed-subgraph example `flowchart.md:1065` is a concrete counterexample:
Agentic and Flutter paint internal A/B/C nodes while Mermaid and Pele hide them.
All four passed the nonblank gate. PNG bytes and a shared source do not establish
that the same diagram was exported.

The [controlled replacement](../davebench-png/controlled/README.md) uses one
Chromium pipeline for all three browser libraries, fixed-size outputs, the same
font, source-fact review before timing and A/A calibration. Its smaller reviewed
profile must not be presented as full-corpus DaveBench performance.

## Evidence and reproduction

Protocol `public-docs-png-export-v1`; producer source
`2d99f3f38941275036c108ff1ead165bcdd8f5c2`. Measurement interval:
**2026-10-28T23:03:05.828Z to 2026-10-28T23:19:59.573Z**. The retained source and native release bundle own these
measurements; later failure-path/reporting fixes do not rewrite them.

Machine: `7971acbcad99`, Debian 13.6 x86_64, Linux 6.18.55, AMD EPYC 9V74,
five visible vCPUs, a four-CPU cgroup quota and 16 GiB memory limit. Native Flutter
3.47.8 / Dart 3.13.7 ran in release mode with Xvfb and software graphics. The
browser was Chromium 154.0.8037.57; the Node PNG API ran on Node 24.19.0. Bun 1.4.0
orchestrated collection. Exact SDK revisions, dependency locks, font hashes,
artifact hashes, launch receipts and environment details accompany the raw data.

The [reproduction guide](../davebench-png/README.md) installs pinned packages and
builds the native worker. Run the extension and reduce its retained evidence:

```sh
bun commands.ts docs:png --out /path/to/fresh-run
python3 davebench-png/report.py /path/to/fresh-run /path/to/fresh-summary
bun commands.ts results:campaign --campaign /path/to/fresh-run \
  --out /path/to/fresh-publication --copy-evidence
```

[Raw data, actual images and reproduction bundle](https://github.com/adewale/trident/releases/tag/davebench-png-evidence-2026-10-28).

The archive retains all 10,960 measured observations, 600 warmup attempts, successful
and failed PNG/SVG witnesses, sources, package/bundle identities, the measured
source snapshot, environment, setup probes, audit and tests. The preflight is
labelled separately and supplies no published timings. Earlier two-library
[standard results](native-flutter-standard-benchmarks.md) and the widget/DOM
[entrypoint results](native-flutter-comparison.md) remain separate protocols.
