# Benchmark results: methods and coverage

[League tables](../RESULTS.md) contain the three current benchmarks. Every project
is displayed as one name-and-version label, such as **Pele 1.13.0**. The measurements
reuse the version freeze from 2 November 2026; changing presentation runs no renderers.

## Reading the tables

| Benchmark | Population | Ordering | Missing results |
|---|---|---|---|
| DaveBench | 1,342 documentation occurrences, separately for SVG, PNG and terminal text | More admissible completions first; lower median total seconds breaks ties between rows with the same boundary kind | Blocked projects have no completion or timing score |
| Drawing Correctness | The same 127 cases per applicable format | More verified whole-case passes; equal counts share a rank. **Possible rank** shows the positions still reachable | Unassessed combines unknown verdicts and unrun cases |
| Mermaid Fidelity | The expanded upstream callbacks that pinned Mermaid itself passes | More passed callbacks; equal counts share a rank. **Possible rank** shows the positions still reachable | Candidate adapter gaps remain unassessed |

For DaveBench, completions are the minimum across three runs and seconds are the
median total time. A completion needs an output that passes [mechanical
admission](davebench-definition.md#output-admission): a sized SVG, a valid PNG, or
terminal text that is not empty, an error message or the source printed back. It
measures output production and time, without judging drawing meaning. CLI rows
include process startup; persistent API rows exclude initialization, so time
orders equal completion counts only within one boundary kind.

For Drawing Correctness, Failed combines contradicted drawing facts, invalid output
and render/export failures. For Fidelity, Failed combines assertion nonpasses and
native unsupported results; Unassessed is candidate adapter gaps. A Fidelity pass
needs the original assertions to pass for the candidate and for the pinned Mermaid
control, so callbacks the control cannot pass are unpassable for everyone. They are
reported beside the table as reference-adapter coverage work instead of being
counted as everyone's unknowns, which had capped Mermaid at 54.6% of its own tests.
Upstream skips are outside the population.

**Verified rank** orders observed passes. **Possible rank** is the best and worst
position a project can still reach when its unassessed cases resolve either way:
best = 1 + projects whose passes exceed this project's passes plus gaps; worst = 1 +
projects whose passes plus gaps exceed this project's passes. A wide range means the
order is not established yet. Detailed tables separate these categories. A wholly
unassessed project has neither a score nor a rank. An observed zero with known
failures remains a measured result. Ranks order observed passes; unresolved cases
can change that order. They do not establish an overall winner. The [equal-weight synthesis](overall-scoring.md)
combines score bounds and shows each project's possible rank; it never treats
unknown measurements as zero, for scoring or for ordering.

## Why terminal output appears in two benchmarks

The format is shared; the questions and input corpora differ:

- **DaveBench — Terminal rendering:** render all 1,342 documentation examples to
  native terminal text. Count completed operations and measure total time. No
  drawing assessment or conversion to PNG takes place.
- **Drawing Correctness — Terminal correctness:** render the 127 reviewed drawing
  cases to native terminal text. Check their labels, objects, connections, direction
  and other required facts. Timing does not contribute to this rank.

The same distinction applies to SVG and PNG. A fast renderer may fail correctness
checks, and a correct renderer may be slow; both questions have useful answers.

## Why coverage is incomplete

These gaps mostly describe unfinished Trident implementation, rather than demonstrated
limitations of the projects being benchmarked.

**Fidelity originally stopped at a small adapter list.** The earlier runner selected
Mermaid and three candidates, and incorrectly blocked Zombie because an expected
source file was absent. The bundled native parser was present. Generic native
bindings, a guarded Bun/async parser bridge, native model schema views and the
Frankenmermaid WASM binding now give measured original-test outcomes to **14 projects**.
The 43 affected original files were collected only after functional checks.

The other **13 projects remain unassessed**: their original-test operation bindings
have not been collected. Their rows say **Not run**, not failed or zero. Newly
admitted projects also retain unassessed callbacks outside the collected files.
A produced drawing that could not be judged says **Not assessed**. No result is
inferred from a project's identity or relationship to another renderer.

The pinned tests frequently import Mermaid's parser and mutable diagram database,
including getters and host configuration. A working renderer does not automatically
provide those operations. The bridge invokes actual candidate parsers and preserves
native data; it does not run Mermaid on their behalf or invent missing methods.
Unavailable operations, unknown schemas and import/transport errors remain explicit
per-test gaps. The missing root/helper bindings in the reference API tests remain
unrepaired as well.

Even the reference path is incomplete: 5,445 callbacks expanded, but 2,408 were
reference-unqualified and 143 were upstream-skipped. Twenty-five selected files did
not expand; 52 files remain outside the core Vitest runner. The qualified population
is therefore 2,894 of the 5,302 expanded, unskipped callbacks. The landing table
retains the other 2,408 as unassessed for every participant. Unexpanded and
outside-runner files remain listed separately; their expanded case counts are unknown.

**Drawing observers remain bounded.** The expanded corpus is shared across formats,
but recognition still depends on the representation. SVG body/route/cardinality
ownership is sometimes unqualified. PNG checks either require an exact raster match
to an independently assessed SVG, or the narrow OCR/frame/route profile. Other images
remain unknown. All common source transcriptions now qualify, including the seven repaired cases.
Empty drawings have dedicated pixel checks, normalized PNG witnesses receive fresh
assessment, and the full SVG compound-body observer is reused. OpenCode worker
recovery and independent native PNG invocations remove the formerly unrun rows.
The 6,350 available slots now have zero unrun rows, but 2,854 remain unassessed
because the actual representation is outside a qualified observer profile. Large
stress cases also exceed the observer bound. These are Trident assessment limits,
not proof that those drawings are wrong. Flutter remains an isolated setup blocker.

The follow-up removes source/transport omissions and expands measured Fidelity
participation from four to fourteen projects. Broad assessment and original-test
operation coverage are still incomplete; calling the whole benchmark effort finished
would be premature. The remaining work is to extend and validate the observers, bind
candidate operations, and run the unexpanded/outside-runner tests. The combined table displays score bounds; an exact overall score remains unavailable
while required measurements are missing.

## Detailed results and numeric inputs

- [DaveBench method and detailed results](benchmark-campaign-results-2026-11-02.md)
- [Drawing Correctness and Fidelity method and detailed results](correctness-fidelity-results-2026-11-02.md)
- [DaveBench numeric results](evidence/benchmark-campaign-2026-11-02/report.json)
- [Drawing Correctness numeric results](../results/drawing-correctness-2026-11-02.json)
- [Mermaid Fidelity numeric results](../results/mermaid-fidelity-2026-11-02.json)

`RESULTS.md` previously remained attached to the 1 November legacy snapshot while
new results were published elsewhere. `results:snapshot` now reads the three current
numeric results for the landing page. Historical snapshots and their detailed pages
retain their original measurements and are no longer the landing page's source.

## Current project participation

| Benchmark | Projects with scored results | Projects with no Trident gaps in the reported population |
|---|---:|---:|
| DaveBench | 26: 16 SVG, 16 PNG, 18 terminal | 26 |
| Drawing Correctness | 26: 16 SVG, 16 PNG, 18 terminal | 0 |
| Mermaid Fidelity | 14, including Mermaid 12.2.0 | 0 |

A scored result can include failures. It does not mean every input passed, every
output was assessable, or that the project has complete benchmark coverage.
Drawing's 2,854 unknown assessments and Fidelity's missing operations/reference
bindings remain unfinished Trident work. The synthetic table combines the measured
components now; no project has enough coverage for an exact overall score.
