# Reading Trident results

Start with a comparison table for the question you want answered. Put projects
and versions in rows, measurements in columns, and units in the column headings.
Link each row's failures and receipt so readers can inspect what happened.
The [worked tables](docs/benchmark-examples.md) cover all seven benchmarks;
[the research notes](docs/reporting-research.md) explain the examples we learned from.

The repository's [ecosystem results](RESULTS.md) provide a single entry point.
They are generated from [results/latest.json](results/latest.json), including
the Mermaid chart values. Historical evidence keeps its original dates and
protocols; the overview retains missing projects and newer failed attempts.
See [publication instructions](results/README.md) to update or check the page.

## What belongs above a table

State the benchmark and protocol, collection date, input inventory, runtime,
public interface, output format, artifact role and sampling profile. A selected
smoke workload must be labelled as such. Published releases, source candidates
and the Mermaid reference keep their identities. Node, browser and CLI results
have separate tables unless their interfaces and work have been shown equivalent.

Keep metadata shared by every row in a caption. Repeat version and artifact role
in rows when they vary. A table should remain understandable without a prose
sentence interpreting each result.

## What each benchmark's table contains

| Benchmark | Row identifies | Result columns | Unit |
|---|---|---|---|
| Mermaid Compatibility | Project/version, within one format and runtime | Passed, failed, unsupported, blocked and missing inputs; planned total | Inputs |
| DaveBench | Project/version on the complete documentation inventory | SVG returned, failed, unexecuted, planned occurrences, return rate | Occurrences and % |
| DaveBench timing | Project/version on one named input or an explicitly matched input set | Call time, sample count, qualification; failed output withholds time | ms |
| Diagram Meaning | Project/version on the same SVG criteria | Passed, failed, unsupported, blocked and missing criteria; planned total | Criteria |
| Model and Editing Contracts | Project/version on shared criterion identities | Same criterion counts; API-specific checks in a separate table | Criteria |
| Mermaid Assertion Replay | Project/version on the same source inventory | Declaration dispositions; expanded callback dispositions in a separate table | Declarations or callbacks |
| Mermaid Reference Tests | Reference/version and original runner | Files, passed, failed, pending and todo callbacks | Files and callbacks |
| Render Cost and Scaling | Project/version, case/size and one call mode | Median latency, samples, uncertainty, output checks and calibration | ms |
| Render resources | Project/version, case and resource checkpoint | CPU, process RSS, JS heap, retained output; separate scopes | ms, MiB or bytes |

For timing tables, less time means less cost. More accepted inputs means broader
observed coverage, not automatically better meaning or layout. More passed
criteria cannot be turned into an overall renderer-quality score by adding
unrelated checks.

## Keep the full population visible

| Display | Meaning |
|---|---|
| Passed | The declared input or criterion passed its check. |
| Failed | The operation ran and violated a declared requirement. |
| Unsupported | The tested interface rejected this family or operation. |
| Blocked | Setup, execution or observation could not complete; retain the reason. |
| Unavailable / missing | No usable observation exists for a planned cell. |
| Not applicable | This table requests work the project does not declare, such as SVG from a terminal-only tool. |
| Withheld | A measurement exists or was attempted, but prerequisites do not permit the displayed comparison. |
| 0 | An observed numeric zero, never a substitute for missing data. |

Counts must reconcile with the planned inventory. If a rate cannot be established
because inventory or intent is unknown, show it as unavailable. A missing adapter
is a Trident support gap. It does not prove a project lacks the capability.

Do not hide failed renders when showing timing. Put full output coverage next to
the timing table, identify the common successful inputs, and retain failed rows
with their time withheld. A median over a different successful subset for each
project is not a matched comparison. Keep diagram families and sizes available
as a breakdown so a pooled value cannot conceal different workload shapes.

## Keep different checks separate

SVG admission, public-model facts and painted meaning have separate columns or
tables. An unavailable model projection does not erase a valid SVG result. A
failed model check remains visible even if output-only timing is calibrated.

Use the same criterion identities for the shared-model comparison. List serializer,
editing or other API-specific checks separately for every project that exposes
them; they cannot improve its shared score. The worked example separates 118
Agentic Mermaid serializer/readback checks from the 561 shared model checks.

Replay declarations, expanded callbacks and assertion/matcher observations are
different units. Raw matcher counters can include callbacks later classified as
unavailable or outside target attribution. They are diagnostic details, not a
standalone compatibility pass percentage. The original reference runner is yet
another boundary; it reports callback counts rather than invented expect() totals.

## Timing, resources and qualification

Keep first calls, repeated-source calls, new-source calls and edits separate.
Report their exact clock boundaries and samples. A p95 of batch means is not a
single-call tail latency. CPU, whole-process RSS, JavaScript heap and browser
native/WASM memory have different scopes; missing counters remain unavailable.

Relative-time columns name the baseline and direction. Populate ratios and
uncertainty only after the required output/semantic checks and A/A controls pass.
Insufficient rounds, incomplete qualification or noisy controls withhold the
comparison. Descriptive historical samples may be shown with that status in the
table, but are not relabelled as current qualified results. Use sensible numeric
precision; exact samples remain in the evidence.

Stack-rank results within each comparable group, best first, by the named metric.
Coverage and passed-check rates sort highest first; time and resource costs sort
lowest first. State the sorting metric above the table and keep charts in the
same order. Equal values share a rank (1, 1, 3); names only order tied rows.
Missing, blocked and withheld measurements stay visible below measured rows
without a numeric rank. Historical timing ranks describe the retained samples
and keep their qualification limits visible. Optional API checks have their own
ranking and cannot improve a project's shared-check rank.

The ecosystem overview uses its named DaveBench measure for ordering; other
benchmarks have independent ranks. A newer superseding attempt removes the old
overview rank until a comparable result is published. There is no cross-suite league
score combining coverage, correctness and cost. The [support assessment](SUPPORT-QUALITY.md)
measures Trident's integration evidence, not renderer speed.

## Evidence and publication

A published table links its input inventory, artifact receipt, raw observations,
failed outputs and observer protocol. Metadata or catalog declarations never
supply measured passes. Preserve the original collection date when regenerating
a table from retained data; name any changed reduction or selected population.

The publication commands retain their existing suite artifacts and observation
tables. These conventions describe how to present and interpret those results;
the worked examples are documentation, not a new measurement campaign or a change
to the suite collectors.

```sh
bun commands.ts results:campaign --campaign /evidence/campaign \
  --out /evidence/publication --copy-evidence
```

Read the dated campaign index, the comparable table and its failed cases, then
the raw evidence. [BENCHMARKS.md](BENCHMARKS.md) explains each method;
[FAIRNESS.md](FAIRNESS.md) defines comparison prerequisites. Public docs and
repository examples are development-exposed; no production holdout is claimed.
