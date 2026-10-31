# Benchmarks: tasks, evidence and limits

Trident compares public rendering artifacts. The current workloads are
Documentation Examples (DaveBench), Mermaid Feature Cases, Terminal Rendering
and optional Model and Editing Contracts. SVG inspection and cost measurement are shared machinery.
There is no combined renderer-quality score or validated production holdout.

```sh
bun commands.ts bench --projects OWNER/TOOL,... --profile full --plan
bun commands.ts bench --projects OWNER/TOOL,... --suites docs,fidelity --out FRESH_DIR
bun commands.ts bench --projects OWNER/TOOL,... --suites docs --docs-formats png --out FRESH_PNG_DIR
bun commands.ts bench --projects OWNER/TOOL,... --suites portable --plan
bun commands.ts bench --list
```

Default collection selects `docs,fidelity`. Expensive performance (`portable`),
legacy compatibility (`community`) and optional model (`native-fidelity`) work
require explicit selection. `full` applies to the selected inputs and sampling.
Preparation freezes artifacts once; collection performs no latest-version lookup.
[Baseline](BASELINE.md) and [report conventions](REPORTING.md) describe reuse.

## Documentation Examples — DaveBench

Task: accurately render the examples in the pinned Mermaid syntax documentation
as SVG and PNG, and measure completed rendering on matched verified work. Both
formats use one literal source inventory. The
inventory has 548 occurrences, 546 distinct sources and 34 pages. Repeated
occurrences remain in the inventory. [Dave Kiss's documentation benchmark](https://x.com/davekiss/status/2111512440106078554)
inspired this workload; its AM predecessor used a different wrapper and vendored
page set and cannot supply interchangeable input counts or clocks.

SVG return (`public-docs-svg-return-v1`) remains a weak compatibility diagnostic.
The collector now retains each first-round SVG and separately applies
`reviewed-docs-svg-content-v1`. [Source expectations](corpus/docs-reviewed.json)
bind exact bytes, literal drawing facts and configuration-only examples. Their
absence produces unknown evidence. Reference agreement supplies no automatic pass.
A review may explicitly retain source facts that the observer cannot yet verify.

Tables show full return coverage, full-inventory content dispositions and the
fixed reviewed subset separately for each format. Ranks order verified correct
counts; unknown observations keep complete accuracy unresolved.
A small reviewed subset cannot establish full DaveBench correctness. First-round
inspection does not qualify every later timed return.

The full return protocol uses 30 warmups and six rounds. Project order reverses
after each round, then rotates after each pair; positions balance over 2N rounds
for N participants. Public-call clocks stop at SVG return, before validation and
cleanup. These clocks lack A/A and per-call semantic qualification, so there is
no qualified overall speed score. The [bounded repair campaign](docs/benchmark-repair-2026-10-30.md)
uses one pass to improve the checks rather than repeat performance collection.

`--docs-formats svg,png` is the default; either format can run alone. PNG collection
uses frozen public Node/native/CLI PNG transports or a declared public SVG call
followed by shared rasterization and PNG encoding. PNG-only artifacts require no
SVG API, SVG preparation or Chromium conversion. Runtime and clock boundaries
remain explicit; API-return, CLI startup and conversion costs are not interchangeable.

Actual PNG bytes are retained. Decoding and nonblank checks establish mechanical
output only. `--docs-png-review FILE` supplies complete content reviews bound to
source, expectation and actual PNG hashes, with reviewer identity and notes.
An unreviewed or changed image stays unknown; SVG checks cannot supply PNG content
credit. Settings-only sources have no nonblank-drawing requirement. New PNG clocks
are descriptive, without A/A or per-timed-output correctness qualification.

The replaced v1 standalone PNG exporter and old studies retain their own protocols;
their counts and timings are not silently imported into the new output lanes.

## Mermaid Feature Cases

Task: preserve independently declared diagram facts through a public rendering
interface. Existing collectors retain their IDs:

| Collector | Checks | What a result establishes |
|---|---|---|
| `community` | Output format, authored text, invalid-input controls and interface behaviour. | Input/output admission within the named format and runtime. |
| `fidelity` | Visible labels, owned nodes/routes, arrow direction, grouping, declared values and hidden content. | Completion of the same planned SVG checks, with failed and unknown criteria retained. |
| `portable` | Public Node SVG calls across families, sizes, repeated/new sources and edits. | Qualified cost for a named task and call mode; output and optional model scope remain visible. |

The 718-positive-input compatibility cohort originated in AM testing and remains
a labelled legacy regression workload. The separately pinned external repository
examples have unequal contributions despite equal file caps. They require
per-repository breakdowns and have no defined balanced overall score. Neither
corpus is a neutral production sample. See [comparison contracts](FAIRNESS.md).

Drawing verdicts use the authored planned ledger: correct, incorrect, unsupported
or unknown. Missing observers cannot reduce the denominator. Public-model APIs
and capability-specific checks supply no SVG credit. Criterion counts are useful
failure details, not votes in an overall fidelity score. Group checks inspect
actual enclosure; explicit hidden-content checks reject painted collapsed members.
Bounded filter support does not admit arbitrary masks, filters or paint servers.

Portable protocol v7 retains six rounds, 31 warm sample means and five fresh
processes per replica/round/positive case. Invalid controls receive no speed
credit. Unknown option mappings and failed output admission withhold their clocks.
First use, repeated source, changed source, edits and resource checkpoints have
separate tables. Comment-varied sources are cache diagnostics. A/A calibration
cannot supply missing correctness evidence. No single-call p95/p99 or production
forecast follows from batch means. CPU, RSS, JS heap and native/WASM memory keep
their separate scopes. [Measurement rules](MEASUREMENT.md) give the clock details.

## Terminal Rendering — Project Examples

Task: preserve independently declared graph facts through public terminal output.
[The corpus](docs/terminal-corpus.md) contains 120 real inputs from capped research
across 18 repositories (17 contribute inputs), covering 20 diagram families plus
invalid sources. It distinguishes 67 terminal-specific examples/regressions from
53 shared-renderer robustness cases; these are not production-frequency samples.
Issue/PR URLs, dates, body/patch hashes, repository commits and extraction changes
remain attached to every input.

`bench --terminal` uses existing CLI/Python transports. Mermaid is the mandatory
unscored source reference, Mermaid ASCII the mandatory terminal participant.
The default qualification invokes only the 16 reviewed drawings once each and retains all
other cells as unknown. `--all-inputs` explicitly collects the full inventory.
Saved-output rechecks require no renderer or Mermaid installation.

Reviewed-subset ranks order verified correct counts only. Full accuracy remains
unknown; the [dated results](docs/terminal-results-2026-10-31.md) retain observer
gaps and failures. Cold ASCII CLI and warm Python API clocks have no shared speed
rank. The old four authored graphs test the observer and supply no corpus score.
Legacy general terminal admission still establishes format/text only. Native PNG
decoding/nonblank checks likewise supply no label or topology evidence.

## Model and Editing Contracts — optional

Task: preserve declared identities, relationships and values through public
parsing, inspection, edits and configuration changes. Reviewed bindings currently
exist for Mermaid, Pele and Agentic Mermaid. Missing Trident bindings remain
unmeasured capabilities. Compare shared case/operation contracts; serializers and
other API-specific checks stay separate. A failed prerequisite prevents workflow
credit for later postconditions. Model results do not establish painted meaning.

## Fixed PNG export profiles

A finished image is a distinct application task. The [reviewed seven-implementation
study](docs/davebench-png-seven-results.md) retained all 548 coverage attempts and
timed 13 common reviewed inputs. Its clocks include delivery and required PNG
conversion/normalization; source-fact review and checked pixels bound its claim.
Versions, case mix, typography, failures and launch-round uncertainty remain
attached to that dated study. It is not all-input or isolated renderer speed.
Reuse its content-review lessons rather than repeat that campaign automatically.

The original `docs:png` v1 exporter is retired. Its nonblank gate admitted incorrect
content and rejected a legitimate empty Gantt example; its unequal-work timing
comparison was withdrawn. [Retained v1 evidence](docs/davebench-png-results.md)
remains readable. The earlier [controlled](docs/controlled-png-results.md) and
[isolated](docs/isolated-png-results.md) studies retain their own scopes and dates.

## Retired comparisons and reference validation

Mermaid Assertion Replay (`upstream-fidelity`) is retired from new comparative
campaigns. Its private-API/import/projection compatibility does not measure drawn
correctness. Historical declaration, callback and matcher observations remain
separate, readable evidence. Useful public-behaviour cases belong in the feature
or model workloads with explicit expectations.

Mermaid's own original tests (`--suites upstream-original`) validate the pinned
reference environment. Run them explicitly when that pin/runtime changes, with
read-only snapshots and the actual runner. They provide no peer-project score.
Existing owning evidence can be reused without rerunning every campaign.

AM owns its product invocation/MCP matrices, editor/session flows, release budgets,
stage diagnostics and private corpus. Trident provides shared measurement code
through an explicit dependency under the same rules for every project.

[Benchpocalypse](https://danluu.com/benchpocalypse/) explains why equivalent work,
workload selection and misleading aggregates deserve more attention than a precise
headline number. [Results](RESULTS.md) retain dates, interfaces, failed inputs and
owning evidence; historical records are never relabelled as fresh qualification.

See the [scope audit](docs/benchmark-scope-audit-2026-10-31.md) for which components
belong inside corpus benchmarks, which are duplicated, and which belong in AM.
