# Benchmarks: tasks, evidence and limits

Trident compares public rendering artifacts. The current workloads are
Documentation Examples (DaveBench), Mermaid Public Tests, Mermaid Feature Cases,
Terminal Rendering and optional Public Model Contracts. SVG inspection and cost measurement are shared machinery.
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

Public SVG CLIs use the same retained-output observer as browser APIs. CLI clocks
include process startup; browser API clocks do not. They have no shared speed rank.

SVG return (`public-docs-svg-return-v1`) remains a weak compatibility diagnostic.
The collector now retains each first-round SVG and separately applies
`reviewed-docs-svg-content-v1`. [Source expectations](corpus/docs-reviewed.json)
bind exact bytes, literal drawing facts and configuration-only examples. Their
absence produces unknown evidence. The frozen corpus now has 544 transcribed
drawing contracts, one configuration-only fence and three pending source
interpretations across 36 normalized diagram families. The
[source audit](docs/docs-source-expectations.md) retains every occurrence and
blocker. Independent reviewers sampled every family and audited the structural
ledger; they have not manually signed off every one of the 548 sources.
Reference agreement supplies no automatic pass. Every required source fact needs
a qualified observer bound to the actual output; unsupported facts remain unknown.

Tables show full return coverage, full-inventory content dispositions and the
exact qualified source subset separately for each format. Ranks order verified correct
counts; unknown observations keep complete accuracy unresolved.
Source transcription coverage cannot establish full DaveBench correctness. A
small qualified subset supplies a score only for that named subset. First-round
inspection does not qualify every later timed return.

A one-round coverage run makes one call per occurrence with no warmups.
The repeated return protocol uses 30 warmups and six rounds. Project order reverses
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
A reviewed image can be replayed across encodings only when canonical RGBA16
samples, dimensions and display-affecting metadata match exactly. A strict
SVG-to-PNG certificate additionally requires the exact rasterized SVG, every
source fact, frozen rasterizer/fonts and an independently reviewed reference
raster with matching decoded pixels. These are
[separate evidence paths](docs/png-correctness.md), not a general native-PNG
semantic oracle. Changed or unreviewed content stays unknown. Settings-only
sources have no nonblank-drawing requirement. New PNG clocks remain descriptive
unless every timed output and A/A calibration qualify.

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

## Mermaid Public Tests

Task: pass the unchanged public-behaviour assertions in Mermaid's own tests.
The current [qualified scope](docs/mermaid-public-conformance.md) is **22 callbacks**:
16 public parse callbacks and six public detector callbacks from the pinned
Mermaid source. It checks acceptance/rejection, suppressed errors, returned family
and configuration, and original snapshots. The original runner and substituted
public reference must both pass before a peer comparison can be scored.

```sh
bun commands.ts mermaid:public-tests --help
```

Tables stack-rank passes over the same 22 planned callbacks, with assertion
failures, unsupported operations, binding gaps and unrun work separate. A Trident
adapter exception cannot earn syntax-rejection credit. This benchmark measures
that exact API scope; it does not measure drawing accuracy, speed or all Mermaid
behaviour. The full census has 4,060 declarations in 368 files, including
parameterized/wrapped declarations. They require public-contract review and
expanded callback identities before they can become additional peer tests.

## Terminal Rendering — Project Examples

Task: correctly render a representative corpus as terminal display cells, then
measure completed rendering on the same verified work. The
[corpus](docs/terminal-corpus.md) contains 120 inputs from capped research across
18 repositories (17 contribute inputs): 116 positive drawings and four invalid
rejection controls, with separate denominators. Docs, tests, issue/PR URLs,
dates, commits, licenses, body/patch hashes and extraction changes remain attached
to every input. The 67 terminal-specific cases and 53 shared-renderer robustness
cases are development inputs, not a production-frequency sample.

Every input now declares its required source facts. The bounded
[observer](docs/terminal-correctness.md) reads actual terminal state, including
ANSI movement, erase and conceal, then checks supported node boxes, directed
routes, captions and layout; supported pie rows, five-score-cell journey rows
and timeline trees have their own required facts. Missing family observers,
unknown controls or unsupported background paint keep correctness unknown.

`bench --terminal` uses CLI, Python and Node transports. Mermaid is the mandatory
unscored source reference; Mermaid ASCII is the terminal baseline. The diagnostic
subset identifies sources with supported facts for at least one declared
representation. Its size is neither a pass count nor full-corpus qualification. Collection uses all 120
inputs once per selected renderer; `--all-inputs` is an explicit alias for that
inventory. Saved-output rechecks need no renderer or Mermaid
installation. Source capability declarations do not replace observed output.

Tables rank verified correct counts over the same declared subset, keeping
incorrect, unsupported and unknown cells visible. Full accuracy and comparative
performance remain unqualified. Cold CLI and warm Python clocks have different
boundaries. The [dated earlier results](docs/terminal-results-2026-10-31.md) keep
their original 16-drawing scope and cannot be relabelled with the new contracts.

## Public Model Contracts — optional

Task: preserve declared identities, relationships and values through public
parsing, inspection, edits and configuration changes. Reviewed bindings currently
exist for Mermaid, Pele and Agentic Mermaid. Missing Trident bindings remain
unmeasured capabilities. Compare shared case/operation contracts; serializers and
other product-specific workflows belong in their owning projects. This collector
uses only public Node models and performs no duplicate SVG rendering. A failed prerequisite prevents workflow
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
Existing owning evidence can be reused without rerunning every campaign. These
reference-runner results are separate from the qualified 22-callback public-test
comparison above.

AM owns its product invocation/MCP matrices, editor/session flows, release budgets,
stage diagnostics and private corpus. Trident provides shared measurement code
through an explicit dependency under the same rules for every project.

[Benchpocalypse](https://danluu.com/benchpocalypse/) explains why equivalent work,
workload selection and misleading aggregates deserve more attention than a precise
headline number. [Results](RESULTS.md) retain dates, interfaces, failed inputs and
owning evidence; historical records are never relabelled as fresh qualification.

See the [scope audit](docs/benchmark-scope-audit-2026-10-31.md) for which components
belong inside corpus benchmarks, which are duplicated, and which belong in AM.


## Qualification and collection

The [six-project harness profile](BASELINE.md) verifies 16 execution mechanisms
with 56 output calls and separate model operations, within a five-minute
collection budget after preparation. Its passing result is invocation evidence.
It supplies no benchmark score or timing rank. Correctness work starts with
retained bytes and independent controls; an observer fix normally needs an
offline recheck rather than another collection campaign.

Performance qualification is also an offline reduction:

```sh
bun commands.ts timing:qualify --bundle FILE --out FRESH_FILE
```

It requires a frozen matched task plan, original invocation receipts, every timed
output's complete checked facts and passing A/A samples. Missing evidence
withholds timing; a new label cannot upgrade historical return-only clocks.
[The release process](RELEASE.md) keeps transport verification, comparative
collection and packaging tied to their actual claims and affected code.
