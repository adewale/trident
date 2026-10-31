# Reading Trident results

Start with a comparison table for the question you want answered. Put projects
and versions in rows, measurements in columns, and units in the column headings.
Link each row's failures and receipt so readers can inspect what happened.
The [comparison tables](RESULTS.md#results-by-benchmark) retain current and historical collectors;
[the research notes](docs/reporting-research.md) explain the examples we learned from.

The repository's [ecosystem results](RESULTS.md) provide a single entry point.
They are generated from [results/latest.json](results/latest.json), including
the Mermaid chart values. Historical evidence keeps its original dates and
protocols; the overview retains missing projects and newer failed attempts.
See [publication instructions](results/README.md) to update or check the page.
The [initial baseline](BASELINE.md) requires its own qualified immutable
publication and manifest. Rolling imports do not complete that work, overwrite
a sealed baseline or turn pilot observations into baseline scores.

## What belongs above a table

State the benchmark and protocol, collection date, input inventory, runtime,
public interface, output format, artifact role and sampling profile. A selected
smoke workload must be labelled as such. Published releases, source candidates
and the Mermaid reference keep their identities. Node, browser and CLI results
have separate tables unless their interfaces and work have been shown equivalent.

Every benchmark description and results report must name the corpus origin next
to the results, including conversational summaries. Link the originating repository
or document and its exact commit/version, state the selected files and input count,
and describe extraction, sampling, deduplication, exclusions or edits. For authored
cases, name the originating project or author and link the committed inputs. For
generated inputs, disclose the generator and seed when known. State who defined
or reviewed the expected content, including any renderer-generated answers, and
identify output witnesses separately from inputs. Reuse the existing inventories
and receipts rather than create another provenance registry.

For a subset, identify both its parent corpus and the selection rule. Distinguish
the corpus's origin from the benchmark's inspiration and the renderer versions.
A compact caption is sufficient: **Corpus: SOURCE at PIN; SELECTED INPUTS / PARENT
TOTAL; SELECTION OR EDITS; EXPECTATIONS; inventory link.** Keep the original source
pin when rechecking retained output; record the new observer separately.

Keep metadata shared by every row in a caption. Repeat version and artifact role
in rows when they vary. A table should remain understandable without a prose
sentence interpreting each result.

## What each benchmark's table contains

| Benchmark | Row identifies | Result columns | Unit |
|---|---|---|---|
| Legacy compatibility diagnostic | Project/version, within one format and runtime | Passed, failed, unsupported, blocked and missing inputs; planned total | Inputs |
| DaveBench | Project/version on the same documentation inventory, separately for SVG and PNG | Output return separately from reviewed content; correct, incorrect, unknown, configuration-only and planned occurrences | Occurrences |
| Qualified render cost | Project/version on a fixed matched source set, output format and public boundary | Per-call checked population, median time, uncertainty and A/A qualification; missing proof withholds comparison | ms |
| Mermaid Feature Cases | Project/version on the same authored SVG cases | Correct, incorrect, unsupported and unknown diagrams; per-criterion details separately | Diagrams |
| Public Model Contracts | Project/version on the same authored sources | Correct, incorrect and unknown whole cases; raw criterion details remain in evidence | Cases |
| Terminal Rendering | Project/version on the same pinned project corpus | Correct, incorrect, unsupported, unknown, planned and measured inputs; reviewed and full populations separately | Diagrams |
| Mermaid Public API Tests — diagnostic | Project/version on the same selected unchanged original callbacks | Passed, failed, unsupported, binding gaps and planned expanded callbacks; exact public scope | Callbacks |
| Reference environment validation | Reference/version and original runner | Files, passed, failed, pending and todo callbacks; no peer-project score | Files and callbacks |
| Legacy fixed-core/adaptive cost diagnostics | Project/version, case/size and one call mode | Descriptive samples/means and original limits; no current qualified speed rank | ms |
| Render resources | Project/version, case and resource checkpoint | CPU, process RSS, JS heap, retained output; separate scopes | ms, MiB or bytes |

For timing tables, less time means less cost. More accepted inputs means broader
observed coverage, not automatically better meaning or layout. More passed
criteria cannot be turned into an overall renderer-quality score by adding
unrelated checks.

Rank verified correct counts highest first, with ties sharing a rank, even when
other cases remain unknown. Such a rank orders observed passes and does not certify
complete accuracy. A wholly unobserved content population remains unranked.
Unreviewed source expectations and unresolved observers keep full accuracy unknown.
A bounded reviewed subset must name its size and cannot supply full-inventory
correctness or qualify every timed call. Retired replay remains outside the
comparative lineup. Original-runner environment validation stays separate from
the qualified public-callback comparison.

Each comparative count table includes its difference from Mermaid on that exact
metric and population. A lower verified count is not proof that every unknown
case is incorrect. Terminal comparisons use Mermaid ASCII: Mermaid has no terminal
output and remains an unscored source reference. Timing receives no better/worse
label without equivalent work and qualification.

SVG and PNG have separate tables, output reviews, timing boundaries and import
histories. A newer PNG-only attempt cannot suppress retained SVG scores, or the
reverse. Native PNG and SVG-plus-conversion paths are identified explicitly.

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
failed model check remains visible. A time for the SVG task still requires all
its declared drawing facts on every actual timed return; calibration cannot
replace them.

Use the same criterion identities for the shared-model comparison. List serializer,
editing or other API-specific checks separately for every project that exposes
them; they cannot improve its shared score. Historical examples retain their
original API-specific counts without adding them to current shared rankings.

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
uncertainty only after the strict per-call [measurement proof](MEASUREMENT.md):
the exhaustive raw journal, exact captured clocks and independent execution
instances, owned capture-completion and cleanup receipts, every retained output and all
required facts, plus A/A controls.
A representative SVG, output-admission flag or batch mean is insufficient.
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
and keep their qualification limits visible. The first-use browser/RPC boundary
has its own table; it cannot share a speed rank with warm calls, whole-process CLI
or PNG conversion tasks. Optional API checks have their own ranking and cannot improve a project's shared-check rank.

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

## Comparisons with the reference

Each comparable count table includes a reference column. Higher and Lower compare
only its named metric on the same planned population. Unknown-only observations
are unresolved, not a lower zero. Returning more SVGs does not mean drawing more
diagrams correctly. No unqualified timing is labelled faster or slower.

Mermaid is the rendering and language reference. It has no terminal output;
terminal tables compare with Mermaid ASCII and keep Mermaid's source-reference
role unscored. A new current campaign can replace the landing-page snapshot while
linking prior immutable reports rather than accumulating diagnostic tables there.
