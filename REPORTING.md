# Reading Trident results

[RESULTS.md](RESULTS.md) contains league tables for DaveBench, Drawing Correctness
and Mermaid Fidelity. DaveBench and Drawing Correctness have separate SVG, PNG
and terminal-text tables. Project name and version form one display label; there
is no separate Version column.

Method, corpus, qualification rules, blockers and limitations belong in
[the details](docs/benchmark-results-details.md). The landing page contains only
headings, tables and that details link. Unassessed work stays distinct from
observed failure and never becomes a zero score. The equal-weight synthesis shows component and overall score bounds, ordered by
verified minimum. Exact overall scores remain withheld while required measurements
are unresolved.

The page reads the current numeric results directly. Regenerate or check it with
`bun commands.ts results:snapshot` or `bun commands.ts results:snapshot --check`.
Neither command runs renderers or rebuilds historical evidence. See
[results instructions](results/README.md) for the input files.

## Raw benchmark evidence archive

The 1 November archive contains captured project outputs, source inventories,
versions, public-call journals, timing samples, grading decisions and failed
attempts. Trident's TypeScript publication scripts assembled it; Python wrote the
file manifest and replaced identical copies with internal hard links. GNU `tar`
and `pigz` packed it. No Mermaid implementation created the archive: the measured
projects each produced their own captured outputs, including Mermaid.js 12.2.0
as the SVG/PNG reference. Mermaid ASCII is the terminal comparator.

Archive verification checked every member's size and SHA-256, extracted the
actual compressed file and reconstructed the numeric tables through the normal
readers. That proves preservation and repeatability of the recorded reduction;
it does not establish that every drawing or grading judgment is correct.

Keep raw captures immutable and regenerate the small public report separately.
The archive retains the reports generated at collection time; later presentation
changes can reuse its numeric evidence without repacking or rerunning renderers.
The one-off campaign assembly copied intermediate trees before deduplication.
Future packaging should use the existing publication command with one owned raw
capture per run and separately retained assessments, avoiding that duplication.

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
| Terminal Rendering | Project/version on the same pinned project corpus | Correct, incorrect, unsupported, unknown, planned and measured inputs; reviewed and full populations separately | Diagrams |
| Mermaid Behaviour Tests | Project/version on the same explicitly adapted upstream cases | Passed, failed, unavailable and unrun whole cases; ordered assertions and adaptation links in evidence | Cases |
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

Each comparative table names its reference: Mermaid for SVG/PNG and behaviour,
Mermaid ASCII for terminal output. Alongside verified counts, show correctness
bounds over the full planned population and observer coverage. The lower bound
is verified correct / planned. The upper bound also includes unresolved outputs,
unrun work and harness failures; proven unsupported, invalid or incorrect outcomes
do not earn potential credit. These are logical bounds, not confidence intervals.

A project's lower bound exceeding the reference's upper bound establishes more
correct outcomes on that exact workload; the reverse establishes fewer. When
bounds overlap, compare verified counts and label accuracy unresolved. Sort
verified counts best first even then, without describing that order as a proven
accuracy league. Missing values remain unranked; an observed zero is a result.
Timing receives no better/worse label without matched work and qualification.

SVG and PNG have separate tables, output reviews, timing boundaries and import
histories. A newer PNG-only attempt cannot suppress retained SVG scores, or the
reverse. Native PNG and SVG-plus-conversion paths are identified explicitly.

## Keep the full population visible

New drawing tables use one disjoint outcome ledger:

| Outcome | Meaning |
|---|---|
| Correct | Every required fact is verified on the actual output. |
| Incorrect drawing | A qualified observation contradicts required visible meaning. |
| Invalid format | Returned bytes violate the declared output-format contract. |
| Unsupported input | Public evidence establishes unsupported work for that input. |
| Renderer failure | A supported invocation fails to return output; attribution is explicit. |
| Unassessed output | Output exists, but required facts or evidence remain unresolved. |
| Unrun | No recorded attempt exists for the planned input. |
| Harness failure | Identified Trident preparation, invocation or observation failure. |

The eight counts sum to the planned population. Invalid-source controls and
configuration-only inputs have separate denominators. Generic errors with
uncertain attribution remain unresolved rather than being guessed into a product
failure. Preserve the original raw status alongside the normalized outcome.
Historical tables retain their original categories and protocol.

Observer coverage is the share with a resolved drawing/format judgement, not
the rate of correct drawings. Resolution coverage additionally includes proven
unsupported inputs and renderer failures. Neither substitutes for correctness.
Not-applicable formats stay outside their inapplicable table; missing numeric
values, blocked work and withheld timing never become zero.

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
