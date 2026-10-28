# Native Flutter and Pele: standard benchmarks, 28 October 2026

Trident ran the standard Mermaid Compatibility collector through native Flutter
`renderToPng()` and Pele's Chromium SVG API on the same cloud machine. It also ran
the official-docs SVG-return collector and Diagram Meaning for Pele. These give
broader compatibility evidence than the earlier 31-input entrypoint campaign.
Their output contracts do not support a native Flutter versus Chromium speed ratio.

## Mermaid Compatibility

Protocol `community-fixed-core-feature-once-v2`; full profile, five core rounds,
one feature pass. The generated, reference-enriched inventory contains 1,087
unique inputs: 730 declared render inputs and 357 parse-only inputs. The pinned
reference rejects six of the render inputs, leaving **724 eligible render inputs**
(6 core plus 718 features). Each table counts distinct input IDs; repeated core
measurements and family probes do not increase that denominator.

Native Linux Flutter release, encoded PNG return at pixel ratio 1:

| Project / version / public interface | Eligible inputs | PNG qualification passes | Failed | Observer blocked | Unsupported/skipped | Outside render scope |
|---|---:|---:|---:|---:|---:|---:|
| mermaid_flutter 0.3.2 / renderToPng | 724 | 613 | 44 | 4 | 63 | 363 |

PNG passes establish successful decoding, with nonuniform visible content required
where authored labels are declared. Eight passed native inputs have no label
expectations. These checks do not establish label retention, topology or complete
painted meaning. Unsupported canonical
family probes cause 63 inputs to be skipped: treeview, swimlane, agentflow,
usecase and ZenUML. Those are not 63 individually executed rejections.

The 44 failures comprise 30 parser rejections, ten blank/uniform-content findings
and four public API dimension-limit errors. The latter occur on the large
requirement, tree, timeline and journey fixtures: `renderToPng()` refuses an image
with a dimension above 16,384 pixels at the requested pixel ratio. The four blocked
inputs successfully returned PNGs but exceeded **Trident's 16-megapixel decoded
qualification budget**: flowchart subgraphs, the 300-message sequence, 200-commit
gitgraph and 40-service C4. Their PNGs and timings remain retained.

Chromium, returned SVG:

| Project / version / public interface | Eligible inputs | SVG qualification passes | Failed | Observer blocked | Unsupported/skipped | Outside render scope |
|---|---:|---:|---:|---:|---:|---:|
| Pele 1.9.0 / render | 724 | 716 | 7 | 0 | 1 | 363 |

Of the 716 passes, 697 check XML/canvas plus authored labels; 19 have no declared
label oracle and check XML/canvas only. All seven failures returned SVG but failed
label retention: five treemap inputs, one dense xychart and one Venn title. Label
culling and literal quote normalization can cause these findings, so this table
does not diagnose seven product defects. ZenUML is unsupported under the canonical
probe. The native and browser pass columns have different qualification strength;
subtracting them would not measure a fidelity advantage.

Both tables retain the same 363 out-of-scope inputs: 357 parse-only fixtures and
six reference-rejected render fixtures. Their raw transport rows may say Node even
though no Node renderer ran. Those rows describe scope exclusion, not execution.

## Official documentation SVG return (DaveBench)

Protocol `public-docs-svg-return-v1`; **548 occurrences, 546 distinct trimmed
sources, 34 syntax pages**, pinned upstream Mermaid 12.2.0 source. Each round makes
30 warmup attempts, followed by one public call per occurrence. This current
collector differs from historical AM Davebench.

| Project / version / runtime / output | Rounds | Returned SVG per round | Failed per round | Admission |
|---|---:|---:|---:|---|
| Pele 1.9.0 / Chromium / SVG | 5 | 532 / 548 | 16 / 548 | SVG-looking string return only |

All 16 failing occurrences are ZenUML detection errors, stable across all five
rounds. Deduplicating by trimmed source gives 530/546 returned sources. SVG return
does not establish nonblank paint or diagram meaning. mermaid_flutter's advertised
native entrypoints return widgets or PNG, so this SVG contract is **not applicable**;
there were no native docs invocations and no 548-failure native result.

## Diagram Meaning

Suite `mermaid-fidelity`, community-fidelity lane, mode
`independent-authored-criteria`; 100 authored cases and 95 successful main SVG
admissions. Counts below are **criterion observations**, not diagrams or repeated
latency samples. Every row belongs to Pele 1.9.0.

| Project / interface / runtime | Passed criteria | Failed | Unavailable/blocked | Unsupported | Planned criteria |
|---|---:|---:|---:|---:|---:|
| Pele 1.9.0 / public SVG / Chromium | 258 | 0 | 0 | 11 | 269 |
| Pele 1.9.0 / owned paint / Chromium | 906 | 2 | 67 | 60 | 1,035 |
| Pele 1.9.0 / public-model criteria / adapter unavailable | 0 | 0 | 623 | 0 | 623 |

The failed paint checks are `features:architecture:ports-groups-branching` /
`painted-relationships` and `features:flowchart:controlled-image` /
`embedded-images`. The architecture SVG retains both edge groups, but the observer
geometrically binds only one relationship; a claim that the renderer omitted an
edge would overstate this evidence. The controlled-image SVG emits no image; the
receipt records no blocked external requests. Exact SVGs, sources and diagnostics
are retained with the observations.

The 623 unavailable public-model checks describe Pele's missing reviewed model
adapter. They are not native Flutter failures. Native Flutter has no SVG interface
in this campaign and is not applicable to this collector. No combined meaning
percentage pools these surfaces.

## Cost within each interface

The six core cases are narrow diagnostics. Each has five first-result
observations in initialized workers/pages. Native repeats supply 25 batch means;
Chromium supplies 15. Native batches target 10 ms or 256 calls; browser calibration
targets 20 ms or 256 calls. Counts, ranges and raw sample vectors are retained.
These are not matched-work cost protocols or single-call p95 estimates.

Native `renderToPng()` medians include the public API's complete PNG production;
launch, file writes and subsequent first/final PNG qualification are excluded.
A per-case acknowledgement barrier finishes parent qualification before the next
native API clock begins:

| Input | First-result median (ms), n=5 | Repeated batch-mean median (ms) |
|---|---:|---:|
| core:class80 | 349.114 | 286.357 |
| core:er40 | 437.064 | 427.734 |
| core:flow5 | 136.286 | 11.733 |
| core:seq20 | 68.741 | 65.024 |
| core:state80 | 83.993 | 78.054 |
| core:tree50 | 162.778 | 158.397 |

Pele `render()` medians stop at SVG return; they exclude later qualification,
DOM insertion, paint, rasterization, readback and PNG encoding:

| Input | First-result median (ms), n=5 | Repeated batch-mean median (ms) |
|---|---:|---:|
| core:class80 | 14.600 | 1.262 |
| core:er40 | 8.700 | 1.188 |
| core:flow5 | 22.000 | 0.252 |
| core:seq20 | 6.300 | 0.098 |
| core:state80 | 9.200 | 1.488 |
| core:tree50 | 1.500 | 0.719 |

First result is not a cold process startup measurement. Repeated calls retain
public-default caches. No A/A control or confidence interval was collected, and
fixed order limits cache/throughput inference. Source updates, widget frames and
mount/update latency were not measured by these standard contracts. The separate
[entrypoint campaign](native-flutter-comparison.md) records those boundaries and
its historical workload limitations; its numbers are not pooled here.

## Evidence, environment and reproduction

Compatibility measured **2026-10-28 20:51:22–20:55:54 UTC** at producer source
`2a3d439ecafdaab20bd7fd1d71abe35e4a7bb6ce`, selected suite `community`.
Docs and Meaning measured **2026-10-28 20:47:11–20:47:26 UTC** at
`7efe6f816c6a8f115e5208f2eb6185b72abf7826`, selected suites `docs,fidelity`. The explicit runtime catalog admits
mermaid_flutter/mermaid_core 0.3.2 as native PNG and Pele 1.9.0 as Chromium SVG;
its Node SVG binding is disabled. Executable and `libapp.so` launch hashes bind
each native worker to its sealed bundle.

Both ran sequentially on host `7971acbcad99`, Debian 13.6 x86_64, Linux 6.18.55,
AMD EPYC 9V74, five visible vCPUs with a four-CPU cgroup quota and 16 GiB memory
limit. Flutter 3.47.8 / Dart 3.13.7 ran in Linux **release** mode with Xvfb and
software graphics. Chromium was 154.0.8037.57, headless under the standard browser
collectors. The driver used Node 24.19.0 and Bun 1.4.0. The reference was Mermaid
12.2.0 at `1fb7869866dd619168d840291c9c54b4f129758b`, parser 2.0.1,
ZenUML addon 1.0.1 and jsdom 26.1.0. SDK revisions, dependency locks, fonts,
byte hashes and actual invocation receipts are retained. Software graphics on
this cloud host does not predict mobile-device performance.

[Dated evidence and raw download](https://github.com/adewale/trident/releases/tag/native-flutter-standard-evidence-2026-10-28).

The bundle includes normal `results:campaign` surface/mode/round scorecards,
per-input dispositions, community failed/blocked/unsupported cases with source,
core timings, original raw samples, representative PNGs, SVG failure witnesses, the complete native release
bundle, source snapshot, environment receipt and reproduction instructions.
Earlier attempts remain retained: an initial missing-display/helper preflight,
a completed exploratory run before sealing fixes, an interrupted attempt that
overlapped tests, and the compatibility attempt before serializing qualification.
They do not supply the scorecards above.

Follow [the standard-run instructions](../native-flutter/STANDARD.md) to build the
native target and invoke the existing standard collectors with native transport
and disposition-preservation changes. Collection completed; qualification did
not pass. The two-agent review independently checked counts
and transport validity, and its findings and resolutions accompany the raw data.

The other standard suites were not executed for this runtime pair:

| Suite | Reason |
|---|---|
| Render Cost and Scaling (`portable`) | Requires Node SVG; substituting it would violate the requested native Flutter/Chromium runtimes. |
| Native Functionality (`native-fidelity`) | No reviewed binding from these advertised interfaces to its public-model criteria in the requested runtimes. |
| Upstream Semantics (`upstream-fidelity`) | Requires reviewed model mappings; widget/PNG output and SVG strings do not supply those facts. |
| Upstream Original (`upstream-original`) | Runs the reference engine's original test harness, rather than comparable peer entrypoint work. |

No native Flutter score or relative-speed ranking is inferred from these omissions.
These public docs and development fixtures are not a validated production holdout.
