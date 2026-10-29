# Initial controlled DaveBench PNG campaign

The [later fixed-PNG follow-up](isolated-png-results.md) has a separately calibrated
20-case Pele/native pair and retains the wider uncalibrated results. This page
records the initial campaign; do not pool its measurements with the follow-up.

The v1 timing comparison is withdrawn because its runtimes, output sizes and
painted content differed. This replacement measures one application task:
export a reviewed diagram as a 1200×900 opaque white PNG, without scaling or
clipping. It does not establish speed inside each renderer or isolated encoder speed.

Mermaid 12.2.0, Pele 1.9.0 and Agentic Mermaid 0.4.1 use their published SVG APIs in
the same Chromium process and one shared SVG-to-PNG pipeline. Native Linux
mermaid_flutter 0.3.2 uses actual Flutter release `renderToPng()`. Its intrinsic PNG
must be decoded, padded and encoded again to meet the fixed-output task; that
adapter cost is included in its total. SVG-return and native PNG-return stage
times represent different work and are not compared.

## Qualification

The manifest has 20 candidates across six families plus one collapsed-subgraph
negative control, selected from the pinned DaveBench documentation corpus before
v2 timing. This is a small structural profile, not the full 548-occurrence suite
or an unseen test set. Every source, exclusion and actual qualification image is
retained. Sources are not rewritten to make implementations pass.

An independent reviewer inspected all 84 qualification PNGs for labels, arrows,
relationships, group membership, required symbols and legibility. The common
timing cohort has **18 cases**: five flowcharts, four sequences, three class
diagrams, three state diagrams, two ER diagrams and one mindmap.

| Participant | Candidate passes / 20 | Semantic failures |
|---|---:|---|
| Mermaid | 20 | None in this profile |
| Pele | 20 | None in this profile |
| Agentic Mermaid | 18 | `flowchart.md:970` and `:998` paint c1 and a2 outside their required groups |
| mermaid_flutter | 20 | None in this profile |

The negative control is excluded for all four. Agentic and Flutter paint internal
A/B/C despite the collapsed-group request; Mermaid and Pele hide them.

All request the supplied Inter font at base size 14 through public options.
Per-role defaults remain: native class text 10 px, Pele messages/member text often
12 px, Agentic members 11 px and mindmap text 13 px. Palettes and geometry also differ.
The contract permits these legible defaults; it does not promise identical
typography, natural bounds or ink coverage. The same final pixel count alone
would not justify a comparison without the source-fact review.

Fontconfig is isolated to the supplied Inter file with hinting disabled. Browser
and Flutter probe widths agree exactly at 86.92578125 px. This checks the requested
face, not every diagram role. Mermaid's supported global `htmlLabels: false`
avoids labels lost during SVG image export; public `handDrawnSeed: 42` removes
random shape-path variation. Four affected outputs received fresh visual review;
the other 80 are decoded-pixel-identical to the original reviewed outputs.

## Measurement

The completed run has **3,600 measured calls and 288 warmups**, with no output
mismatches. **Calibration failed, so comparative ratios and a winner are withheld.**
The following numbers are observed latencies for this run, not a calibrated ranking.

| Participant / runtime | Median input median (ms) | A/A geometric ratio | 95% case-bootstrap interval | Gate |
|---|---:|---:|---:|---|
| Agentic Mermaid 0.4.1 / Chromium | 29.75 | 0.977 | 0.903–1.054 | Pass |
| Mermaid 12.2.0 / Chromium | 52.07 | 1.028 | 0.986–1.079 | Pass |
| mermaid_flutter 0.3.2 / native release | 65.91 | 1.107 | 1.094–1.121 | Fail |
| Pele 1.9.0 / Chromium | 11.90 | 0.938 | 0.891–0.986 | Fail |

Each input contributes its median across 50 calls, then the table takes the median
across 18 inputs. A/A uses separate 25-call medians for each replica. Native's
normalization stage differs consistently across replicas; its cause is unresolved.
Pele's interval also crosses the declared lower limit. A comparison array remains
empty in the machine-readable summary, rather than publishing speedups.

A prospectively recorded placement attempt requested CPU 2 and one software
rasterizer worker. Actual thread-affinity inspection found Chromium raster
threads on CPU 0 and Flutter disk threads on CPUs 0–4, overriding inherited masks.
That setup was stopped and all partial timings excluded. Its receipts and plan
remain in the archive; there were no further retries. It does not establish that
placement caused or fixed the original gap.

The clock starts before the public rendering call and stops once final encoded
PNG bytes are available and consumed. Browser totals include DOM insertion,
font readiness, SVG preparation/decode, drawing, deferred rasterization/readback
and PNG production. Native totals include its opaque PNG API plus fixed-canvas
normalization. The APIs do not expose every internal raster/readback/encoding
boundary; those costs are not presented as isolated encoder measurements.
Startup, evidence writes, transport and output validation are outside the timer.

Each library has independent A/B replicas using identical artifacts. After two
warmup passes of every admitted case per replica, five rounds each make five
calls per case/replica: 50 measured exports per library/input. Cases and replicas
are randomly interleaved with seed 20261029. All calls execute sequentially on
one machine, with builds, tests and reviewers stopped during collection.

Each output must match that library's reviewed decoded RGBA pixels exactly. The
predeclared A/A gate requires the 95% case-bootstrap interval for the geometric
mean of per-case A-median/B-median ratios to lie wholly inside 0.90–1.10.
There are 10,000 draws with seed 20261029. These intervals describe sensitivity to
this fixed case mix; repeated calls are not independent cases and the manifest
is not a random sample of Mermaid programs. Relative claims are withheld if any
library fails calibration.

## Environment, artifacts and reproduction

Measured source: `219535c3575dffd79d1e028636cedf7ab2583006`.
Native build source: `200bfdf8ef99363edc58159c58ef9d88d52d0026`; the subsequent
change fixes only Mermaid's public shape seed. Campaign interval:
2026-10-29T00:37:59.281Z–00:48:19.798Z.

| Environment | Exact value |
|---|---|
| Host |7971acbcad99; AMD EPYC 9V74; five visible CPUs, four-CPU quota; 16 GiB limit |
| OS | Debian 13.6, Linux 6.18.55 |
| Chromium |154.0.8037.57; Playwright 1.58.2; headless |
| Orchestrator | Node 24.19.0 |
| Native | Flutter 3.47.8 release; Dart 3.13.7; Linux x64; Xvfb 1200×900×24; software GL requested |
| Flutter framework |737ba8f885dc774b53b442759999a312c9461e4e |
| Flutter engine |cf636b1dfb818dd6a3ff16e390e93b1a036969c8 |
| Inter-Regular.ttf SHA256 |1b08e7fc267a5c7e1d614100f604b83e7e8a0be241f0f288faa2b3ac93a683ba |

[Immutable evidence index and archive downloads](https://github.com/adewale/trident/blob/40329f742dc47fc253b47a3946c06e70e5be2901/README.md)
include all raw calls, errors, qualification images, browser distributions,
native bundle, source snapshots and build/environment receipts.
Archive SHA256: `a12bb9936e92c4016df7091ba831c696fdd709a8a12361e8444b69449dbea78a`.

- [Raw samples, including warmups](https://raw.githubusercontent.com/adewale/trident/40329f742dc47fc253b47a3946c06e70e5be2901/samples.jsonl)
- [Machine-readable summary and failed calibration](https://github.com/adewale/trident/blob/40329f742dc47fc253b47a3946c06e70e5be2901/summary.json)
- [Every source-fact review and exclusion](https://github.com/adewale/trident/blob/40329f742dc47fc253b47a3946c06e70e5be2901/review.json)
- [Exact environment and sealed artifacts](https://github.com/adewale/trident/blob/40329f742dc47fc253b47a3946c06e70e5be2901/context.json)
- [Independent result audit](https://github.com/adewale/trident/blob/40329f742dc47fc253b47a3946c06e70e5be2901/result-audit.json)

![Actual five-node decision-loop PNGs from Mermaid, Pele, Agentic and native Flutter; whitespace cropped without scaling](https://raw.githubusercontent.com/adewale/trident/40329f742dc47fc253b47a3946c06e70e5be2901/representative/decision-contact.png)

All five nodes, both branch labels and the return loop pass review. Open at 1×;
these contacts crop whitespace without resizing. Full unedited 1200×900 PNGs are
retained beside the contacts.

![Collapsed-group negative control: Mermaid and Pele hide A/B/C; Agentic and native Flutter paint them](https://raw.githubusercontent.com/adewale/trident/40329f742dc47fc253b47a3946c06e70e5be2901/representative/collapsed-control-contact.png)

Inspect the internal A/B/C nodes. This is why nonblank output cannot establish
equivalent diagram content. The control contributes no common-profile timing.

An independent Python reduction reproduces all sample counts, per-input medians,
A/A estimates, bootstrap interval endpoints and gate verdicts with no differences
in 24,693 checks. Independent Pillow 12.3.0 decoding reconciles actual pixel hashes
and byte lengths for all 3,888 successful-run outputs. These checks validate the
reported observations; they do not turn a failed calibration into a pass.

The native build receipt binds worker/platform sources, dependency locks,
release target/flags and Flutter engine/compiler revisions to bundle hashes.
The review binds source/configuration hashes, runtime settings, font, browser
artifacts and native bundle. Collection verifies those identities and every
output, then revalidates artifact and producer identities before marking complete.

See the [controlled profile guide](../davebench-png/controlled/README.md) for exact
build, qualification, collection and reduction commands. Earlier full-corpus
[v1 diagnostics](davebench-png-results.md) preserve unsupported inputs and errors;
their withdrawn timing table supplies no comparative evidence. This warm PNG
profile adds no fresh-process, source-update, widget-frame or DOM-mount results.
