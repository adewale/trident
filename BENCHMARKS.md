# Benchmarks: tasks, evidence and limits

[Measurement contracts and qualification](docs/measurement-contracts.md) define the supported questions, executable report bindings, independent controls and retained-output replay workflow. Output production, format validity, behaviour, drawing assessment and execution cost remain separate measurements within these workloads.

[Benchmark readiness](docs/measurement-readiness.md) maps the existing workloads to those questions and records executed public-release and observer-control evidence.

Trident compares public rendering artifacts. The current workloads are
DaveBench (SVG and PNG), Mermaid Behaviour Tests and Terminal Rendering.
The unchanged Mermaid Public API Tests remain an optional compatibility diagnostic. Authored harness/observer regressions are unscored diagnostics; optional
Public Model Contracts retain their separate API scope. SVG inspection and cost measurement are shared machinery.
There is no combined renderer-quality score or validated production holdout.

The [current campaign results](RESULTS.md) rank verified counts and separately
qualified timing comparisons on named inputs. The [frozen B0 report](docs/qualification-results-2026-10-31.md)
keeps its original minimum cohorts, unknowns and observer. Later campaigns and
new grading retain separate identities.

```sh
bun commands.ts bench --projects OWNER/TOOL,... --profile full --plan
bun commands.ts bench --projects OWNER/TOOL,... --suites docs --out FRESH_DIR
bun commands.ts bench --projects OWNER/TOOL,... --suites docs --docs-formats png --out FRESH_PNG_DIR
bun commands.ts bench --projects OWNER/TOOL,... --suites portable --plan
bun commands.ts bench --list
```

Default collection selects `docs`. Unscored authored regressions (`fidelity`),
expensive performance (`portable`),
legacy compatibility (`community`) and optional model (`native-fidelity`) work
require explicit selection. `full` applies to the selected inputs and sampling.
Preparation freezes artifacts once; collection performs no latest-version lookup.
[Baseline](BASELINE.md) and [report conventions](REPORTING.md) describe reuse.

## DaveBench — Documentation completion and time

Run every `mermaid` and `mermaid-example` Markdown block under Mermaid's generated
`docs/` directory, retaining duplicate occurrences. The current pinned corpus is
**1,342 occurrences across 49 files**, at commit `370c4af57f43cb0bda05f4a9fe2d99c912ba16dd`.

Report completed calls, failures and total elapsed render/export time separately
for SVG and PNG. Use the same 30-example warm-up and three complete runs. PNG time
includes conversion/encoding. Discard the outputs without saving or assessing
them. Rank each format by more completed examples first, then lower median total
time. Use the minimum completion count over three runs; blocked and incomplete
collections remain unranked. Native CLI clocks include process startup; each row
shows its execution path.

```sh
bun commands.ts davebench --out FRESH_DIRECTORY
```

The [definition](docs/davebench-definition.md) records the exact extraction and
clock rules. The [count breakdown](docs/evidence/davebench-docs-count-2026-11-02.json)
explains the difference from Dave's earlier 1,095-example syntax-only workload.

<details>
<summary>Historical retained-output drawing-assessment workflow</summary>

The following describes the earlier `bench --suites docs` assessment collector,
not the completion-and-time DaveBench command above. Its results keep their
original corpus, outputs and dates.

Task: accurately render the examples in the pinned Mermaid syntax documentation
as SVG and PNG, and measure completed rendering on matched verified work. Both
formats use one literal source inventory. The
inventory has 548 occurrences across 34 pages: 546 sources after trimming boundary
whitespace, or 547 exact source bodies. Every occurrence retains its original bytes. Repeated
occurrences remain in the inventory. [Dave Kiss's documentation benchmark](https://x.com/davekiss/status/2111512440106078554)
inspired this workload; its AM predecessor used a different wrapper and vendored
page set and cannot supply interchangeable input counts or clocks.

Public SVG CLIs use the same retained-output observer as browser APIs. CLI clocks
include process startup; browser API clocks do not. They have no shared speed rank.

SVG return (`public-docs-svg-return-v1`) remains a weak compatibility diagnostic.
The collector now retains each first-round SVG and separately applies
`reviewed-docs-svg-content-v1`. [Source expectations](corpus/docs-reviewed.json)
bind exact bytes, literal drawing facts and configuration-only examples. Their
absence produces unknown evidence. The [source census](docs/docs-source-expectations.md)
lists each drawing contract, configuration-only input and unresolved interpretation
across 36 normalized families: 547 source contracts are complete and one duplicate
Boston commit-ID interpretation remains held. All 546 drawing occurrences stay
planned; one invalid-source and one configuration-only occurrence are separate.
It retains review scope and per-source blockers;
source transcription and source review remain separate from output qualification.
Reference agreement supplies no automatic pass. Every required source fact needs
a qualified observer bound to the actual output; unsupported facts remain unknown.

Tables show full return coverage, full-inventory content dispositions and the
exact qualified source subset separately for each format. Ranks order verified correct
counts; unknown observations keep complete accuracy unresolved.
Source transcription coverage cannot establish full DaveBench correctness. A
small qualified subset supplies a score only for that named subset. First-round
inspection does not qualify every later timed return.

Coverage makes one call per selected occurrence and format, with no warmups.
`--rounds 1` is required, including full-profile coverage. Repeated return-only
diagnostics are retired; use a qualified timing collector for repetitions. Public-call clocks stop at SVG return, before validation and
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
semantic oracle. PNG and SVG are graded directly; ordinary scoring never transfers PNG review
credit into SVG. Historical transfer records retain their original protocol.
Content without an admissible current review stays unknown. Settings-only
sources have no nonblank-drawing requirement. New PNG clocks remain descriptive
unless every timed output and A/A calibration qualify. The PNG lane contains actual SVG conversions and native Flutter returns.
The [current tables](RESULTS.md) retain their output and pipeline boundaries;
the [raw archive](https://github.com/adewale/trident/releases/tag/ecosystem-evidence-2026-11-01)
contains every grade and its owning output. [Original image-review histories](docs/evidence/png-full-corpus-2026-10-31/README.md)
remain available. A viewing count supplies no correctness credit.

The replaced v1 standalone PNG exporter and old studies retain their own protocols;
their counts and timings are not silently imported into the new output lanes.


</details>

## Harness and observer regressions — unscored

The 100 AM/Trident-authored feature/edit cases test the harness and its observers.
They retain useful compact geometry controls, session/configuration isolation,
font-size replacement and controlled-image checks. They are not a comparative
benchmark: the same families are already represented in DaveBench, while reset
and rename variants repeat development fixtures. They do not supply renderer
ranks, overview scores or comparative timings. Collection is explicit with
`--suites fidelity`; sources, old raw outputs and historical reports remain readable.
Discarded or unproved preludes cannot earn workflow credit.

The collectors and legacy diagnostics retain their IDs:

| Collector | Checks | What a result establishes |
|---|---|---|
| `community` — legacy diagnostic | Output format, authored text, invalid-input controls and interface behaviour. | Input/output admission within the named format and runtime; no complete drawing or qualified speed claim. |
| `fidelity` — unscored regression | Visible labels, owned nodes/routes, arrow direction, grouping, declared values and hidden content. | Harness/observer diagnostics only; counts retain failed and unknown criteria without ranking projects. |
| `portable` — legacy adaptive diagnostic | Public Node SVG calls across families, sizes, repeated/new sources and edits. | Descriptive process/sample means with original output/model scope; no strict per-call timing qualification. |

The 718-positive-input compatibility cohort originated in AM testing and remains
a labelled legacy regression workload. The separately pinned external repository
examples have unequal contributions despite equal file caps. They require
per-repository breakdowns and have no defined balanced overall score. Neither
corpus is a neutral production sample. See [comparison contracts](FAIRNESS.md).

Regression verdicts use the authored planned ledger: correct, incorrect, unsupported
or unknown. Missing observers cannot reduce the denominator. Public-model APIs
and capability-specific checks supply no SVG credit. Criterion counts are useful
failure details, not votes in an overall fidelity score. Group checks inspect
actual enclosure; explicit hidden-content checks reject painted collapsed members.
Bounded filter support does not admit arbitrary masks, filters or paint servers.

The legacy portable process protocol v7 retains six rounds, 31 warm adaptive
sample means and five fresh processes per replica/round/positive case. These
records are descriptive diagnostics; they lack the exhaustive strict per-call
proof required for a current comparative timing rank. Invalid controls receive no speed
credit. Unknown option mappings and failed output admission withhold their clocks.
First use, repeated source, changed source, edits and resource checkpoints have
separate tables. Comment-varied sources are cache diagnostics. A/A calibration
cannot supply missing correctness evidence. No single-call p95/p99 or production
forecast follows from batch means. CPU, RSS, JS heap and native/WASM memory keep
their separate scopes. [Measurement rules](MEASUREMENT.md) give the clock details.

## Mermaid Behaviour Tests

Task: pass portable, observable behaviours adapted from Mermaid's tests. The
[committed selection](corpus/mermaid-behaviour-tests.json) contains **49 whole
cases, 56 ordered source stimuli and 75 individual checks**: 30 family/keyword
precedence cases and 19 structural SVG accessible-name/description cases. A case
passes only when every required check passes. The original test files and callback
hashes come from Mermaid commit `1fb7869866dd619168d840291c9c54b4f129758b`.
All 154 parent callbacks have an explicit selected/excluded disposition.

These are adaptations, not unchanged upstream tests. Family aliases remove
backend names such as `flowchart-v2`. SVG naming accepts qualified native
`title`/`desc` and ARIA references without Mermaid's generated IDs, role-description
strings or jsdom geometry mocks. Active content, hidden or unfamiliar naming
representations remain unassessed. Structural naming is not a complete
accessibility audit or a drawing-quality score. The excluded parse/configuration
snapshots remain in the exact API diagnostic; generic SVG-return work is already
covered by DaveBench.

```sh
bun commands.ts mermaid:behaviour --plan
bun commands.ts mermaid:behaviour --replay-public QUALIFIED154_DIR --out FRESH_DIR
bun commands.ts mermaid:behaviour --adapter ADAPTER.json --reference MERMAID_BEHAVIOUR_DIR --out FRESH_DIR
bun commands.ts mermaid:behaviour --replay-capture NATIVE_CAPTURE_DIR --reference MERMAID_BEHAVIOUR_DIR --out FRESH_DIR
```

The reference must pass all 49 cases from its actual retained Mermaid returns;
a saved pass flag or project name cannot qualify it. A native adapter receives
only the operation and literal source, then returns its actual public family or
SVG. The included Node bridge calls configured public functions. Collection
retains stdout, stderr and outcomes before grading and verifies declared
executable, adapter, configuration and artifact bytes. It makes one process call
per supported stimulus, with no warmups, retries or speed claim. Generic bridges
must declare their execution inputs; the manifest does not prove an undeclared
runtime dependency closure. No source checkout, Vitest or model API is required
for new peers.

Tables stack-rank passed whole cases over the same 49; failed, unavailable and
unrun cases remain visible. Missing capabilities earn no pass and no invented
failure. Retained replay re-evaluates actual values rather than copying the old
154-callback diagnostic's verdicts.

## Mermaid Public API Tests — diagnostic

Task: pass the unchanged public-behaviour assertions in Mermaid's own tests.
The current independently checked [expanded diagnostic scope](docs/mermaid-public-conformance.md)
is **154 unchanged callbacks from 37 original declarations** at Mermaid commit
`1fb7869866dd619168d840291c9c54b4f129758b`: 102 parse, 32 detection, 19 structural
accessibility and one generic SVG-return callback over 24 canonical use-case
examples. The historical 41-callback scope remains separately selectable.
The retained `expanded-154-bundle-v2` combines disjoint 153- and one-callback
parents; normal publication revalidates both raw parents and every invocation.
It does not pool historical 41-callback scores with expanded scores. It checks acceptance/rejection, suppressed errors, returned family
and configuration, original snapshots and caller-ID/ARIA conventions. The
accessibility scope retains Mermaid's exact API conventions and original jsdom
geometry mocks; it is not a drawing-accuracy check. The original runner and substituted
public reference must both pass before a peer comparison can be scored.

The retained `expanded-154-bundle-v2` regrades both raw parents without new API
calls. Its corpus is the unchanged 154-callback selection above; native original
and public-reference controls qualify all selected callbacks. Expected answers
remain the upstream assertions. This table reports **passed callbacks / 154**,
not drawing quality or whole-suite conformance; unmeasured projects get no zero.
The [manifest and source audit](qualification/source-audits/public-expanded-scope.json)
retain parameter, source and fixture hashes and the two parent collection paths.

| Project | Version | Passed / 154 | Failed | Unsupported | Binding/evidence gaps |
|---|---|---:|---:|---:|---:|
| Mermaid | 12.2.0 | 154 | 0 | 0 | 0 |
| Agentic Mermaid | 0.4.1 | 59 | 27 | 63 | 5 |

```sh
bun commands.ts mermaid:public-tests --help
```

Tables stack-rank passes over the same selected 154 (or historical 41) planned
callbacks, with assertion
failures, unsupported operations, binding gaps and unrun work separate. A Trident
adapter exception cannot earn syntax-rejection credit. This diagnostic measures
that exact API scope; it does not measure drawing accuracy, speed or all Mermaid
behaviour. The full census has 4,060 declarations in 368 files, including
parameterized/wrapped declarations. They require public-contract review and
expanded callback identities before they can become additional peer tests.
Retained standalone results can enter the normal results snapshot; collection is
explicit through `mermaid:public-tests` until source/runtime/binding prerequisites
are frozen for campaign scheduling.

## Terminal Rendering — Project Examples

Task: correctly render the named source corpus as terminal display cells, then
measure completed rendering on the same verified work. The unchanged [original
corpus](docs/terminal-corpus.md) has 120 literal inputs from 18 pinned repositories
(17 contribute inputs), with 67 terminal-specific and 53 shared-renderer
robustness origins. Docs, tests, issue/PR URLs, dates, commits, licenses and
body/patch hashes remain attached. These are development inputs, not a
production-frequency sample.

Ordinary `bench --terminal` selects [active v3](corpus/terminal-active-profile.json):
115 unchanged original drawings, one independently reviewed authored alias
adaptation and all four original invalid controls. Its 116 drawings and four
rejection controls have separate denominators. The ambiguous original nested-state
source remains diagnostic with exact bytes and provenance, so the research
inventory retains 121 entries. The manifest binds every input/review hash and
explicit membership; no original-source score transfers to the fresh identity.

Every active input declares independently reviewed source facts. Family
observers cover all 116 active drawing profiles and read actual display cells,
ANSI movement, erase and conceal, owned geometry, routes, group containment,
styles, quantities and ordered family structures. Independent positives and
meaningful wrong-output mutations qualify those bounded representations. An
uninspectable representation, unknown control, required paint or missing output
still leaves the corresponding fact unknown; unsupported representations are
not renderer defects.

`bench --terminal` uses CLI, Python and Node transports. Mermaid is the mandatory
unscored source reference; Mermaid ASCII is the terminal baseline. The diagnostic
subset identifies sources with supported facts for at least one declared
representation. Its size is neither a pass count nor full-corpus qualification. Collection uses all 120
inputs once per selected renderer; `--all-inputs` is an explicit alias for that
inventory. `--corpus original` names the unchanged historical population. Saved
v1/v2 runs select it automatically; saved v3 runs require their active manifest
and membership identities. Saved-output rechecks need no renderer or Mermaid
installation. The [ordinary-profile controls](docs/evidence/terminal-active-profile-2026-10-31/README.md)
verify planning, regrading and separate diagnostic/control tables without SUT
calls. Source capability declarations do not replace observed output.

Tables rank verified correct counts over the full declared drawing population, keeping
incorrect, unsupported and unknown cells visible. Full accuracy and comparative
performance remain unqualified. A diagnostic subset is shown only when its exact
source IDs differ; active v3 therefore has one 116-drawing table. Cold CLI and warm Python clocks have different
boundaries. The [18-project retained regrade](docs/evidence/terminal-state-adaptation-2026-10-31/README.md)
keeps original and active populations separate, including the three fresh
adaptation calls and 15 uncollected project coordinates. The [dated earlier
results](docs/terminal-results-2026-10-31.md) retain their original 16-drawing
scope and cannot be relabelled with the new contracts.

## Public Model Contracts — maintenance diagnostic

Task: preserve declared identities, relationships and values through public
parsing, inspection, edits and configuration changes. Reviewed bindings currently
exist for Mermaid, Pele and Agentic Mermaid. Missing Trident bindings remain
unmeasured capabilities. Compare shared case/operation contracts; serializers and
other product-specific workflows belong in their owning projects. This collector
uses only public Node models and performs no duplicate SVG rendering. A failed prerequisite prevents workflow
credit for later postconditions. Model results do not establish painted meaning.

## Historical fixed PNG export profiles

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
separate, readable evidence. Useful public-behaviour cases belong in the unscored regression
or model workloads with explicit expectations.

Mermaid's own original tests (`--suites upstream-original`) validate the pinned
reference environment. Run them explicitly when that pin/runtime changes, with
read-only snapshots and the actual runner. They provide no peer-project score.
Existing owning evidence can be reused without rerunning every campaign. These
reference-runner results are separate from the qualified public-callback
diagnostic above.

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

For a new first-use browser SVG comparison, select two artifacts from an existing
sealed browser preparation. Acquisition and builds precede this step:

```sh
bun commands.ts timing:browser --prepared /evidence/preparation/community-browser-prepared.json \
  --baseline mermaid-js/mermaid --candidate OWNER/TOOL \
  --cases meaning:family:flowchart --rounds 6 --samples 1 \
  --executable /path/to/chromium --budget-minutes 5 --out FRESH_DIRECTORY
```

Chromium, Playwright and fontconfig (`fc-list`, `fc-conflist`) must be installed.
The command seals artifact/dependency bytes, actual font files and configuration,
resources, source contracts and observer identity before public calls. A fresh
browser context makes one call after initialization. Its clock includes the
controller/page RPC, public render and returned SVG consumption; imports, context
startup, source review and output grading are outside that clock. The `--cases`
list accepts authored inputs from [fidelity/cases.ts](fidelity/cases.ts) or exact
`packages/mermaid/src/docs/...:LINE` occurrence IDs from the pinned DaveBench
inventory. The example measures one flowchart case in fresh contexts; the
[current comparison](docs/evidence/qualified-docs-timing-2026-11-01/README.md)
uses six documentation families. Six-round blocks balance the
baseline A/A and candidate order.
Every raw return is retained before grading; budget expiry keeps incomplete
work visible and withholds the comparison.

Two other public drivers use the same collector and offline qualifier:

```sh
bun commands.ts timing:terminal --help
bun commands.ts timing:png --help
```

Terminal timing requires sealed artifacts with actual public CLI bindings and
source-bound correct prerequisite outputs. It includes fresh process startup,
imports, rendering and complete stdout. The [six-example comparison](docs/evidence/terminal-cli-first-use-2026-11-01/README.md)
states the project-source corpus and excludes warm API claims.

PNG timing currently compares the frozen Mermaid browser exporter and native
Flutter `renderToPng` interface. Its configuration names the preparation,
native launch, complete image reviews, literal case IDs, display executable and
runtime libraries. It measures cold complete export, including required byte
transport. The [three-example comparison](docs/evidence/qualified-png-timing-2026-11-01/README.md)
covers flowchart edge styles. It is not a diverse-family PNG speed score.

These sealed-artifact timing workflows do not require an additional Mermaid
oracle installation. Their own frozen targets and reviewed source/output evidence
supply the declared prerequisites.

Use each workflow's own equivalent boundary and correct tasks. These three
interfaces supply separate times, not a combined renderer rank.

Performance qualification reduces retained evidence offline:

```sh
bun commands.ts timing:qualify --bundle FILE --out FRESH_FILE
```

It requires the frozen plan and complete capture receipts, every timed output's
complete checked facts and passing A/A samples. A source-contract or observer
repair may derive fresh checks from the same raw outputs, preserving the original
plan, source IDs, invocation UUIDs, clocks and old checks. It may recover a durable
return omitted by a crashed observer; it cannot invent a missing call or select
away a failure. Missing evidence withholds timing. Historical return-only clocks
remain unqualified.
[The release process](RELEASE.md) keeps transport verification, comparative
collection and packaging tied to their actual claims and affected code.
