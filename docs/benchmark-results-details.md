# Benchmark results: methods and coverage

[League tables](../RESULTS.md) contain the three current benchmarks. Every project
is displayed as one name-and-version label, such as **Pele 1.13.0**. The measurements
reuse the version freeze from 2 November 2026; changing presentation runs no renderers.

## Reading the tables

| Benchmark | Population | Ordering | Missing results |
|---|---|---|---|
| DaveBench | 1,342 documentation occurrences, separately for SVG, PNG and terminal text (3 November collection) | More admissible completions first; lower median total seconds breaks ties between rows with the same boundary kind | Blocked projects have no completion or timing score |
| Drawing Correctness | The same 127 cases, separately for SVG and terminal text | More whole cases with every expected label shown and no raw syntax; equal counts share a rank. **Possible rank** shows the positions still reachable | Unassessed: cases with no label to check, or unrun |
| Mermaid Fidelity | The expanded upstream callbacks that pinned Mermaid itself passes | More passed callbacks; equal counts share a rank. **Possible rank** shows the positions still reachable | Candidate adapter gaps remain unassessed |

For DaveBench, completions are the minimum across three runs and seconds are the
median total time. A completion needs an output that passes [mechanical
admission](davebench-definition.md#output-admission): a sized SVG, a valid PNG, or
terminal text that is not empty, an error message or the source printed back. It
measures output production and time, without judging drawing meaning. CLI rows
include process startup; persistent API rows exclude initialization, so time
orders equal completion counts only within one boundary kind.

For Drawing Correctness, Failed combines missing labels, raw syntax shown, invalid
output and render failures. For Fidelity, Failed combines assertion nonpasses and
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
  cases to native terminal text and check that every expected label is shown without
  raw syntax. Timing does not contribute to this rank.

The same distinction applies to SVG. PNG appears only in DaveBench. A fast renderer may fail correctness
checks, and a correct renderer may be slow; both questions have useful answers.

## Why coverage is incomplete

These gaps mostly describe unfinished Trident implementation, rather than demonstrated
limitations of the projects being benchmarked.

**Fidelity runs every bindable candidate on the whole selected suite.** Generic
native bindings, a guarded Bun/async parser bridge, native model schema views and the
Frankenmermaid WASM binding give measured original-test outcomes to **13 candidates
plus Mermaid**. On 3 November every one of them attempted all 316 selected core-package
files against one shared Mermaid 12.2.0 control run. Ten of them had previously been
run on only 42 files, so most of their earlier unassessed callbacks were tests Trident
had not run rather than missing bindings. Full-suite runs raised Pele from 2,157 to
2,204 passes, Agentic Mermaid from 1,186 to 1,202 and Merslim from 113 to 157.

The other **13 projects remain unassessed**, each with a stated reason in the
numeric results. Seven are native Rust, Go, Python or Dart/Flutter packages with no
JavaScript parser/model operation for the original Vitest tests to call. Mermaid
Dart and Bezel are browser bundles that expose rendering only. Ondine, Crafter
Mermaid and Loom were attempted on every file, but no original test reached a
candidate operation because their public modules expose no parser. Latias Merman's
frozen JavaScript package is 0.9.2 while its measured CLI is 0.9.3, and one version
per project prevents combining them. Their rows say **Not run**, not failed or zero.
A produced drawing that could not be judged says **Not assessed**. No result is
inferred from a project's identity or relationship to another renderer.

The pinned tests frequently import Mermaid's parser and mutable diagram database,
including getters and host configuration. A working renderer does not automatically
provide those operations. The bridge invokes actual candidate parsers and preserves
native data; it does not run Mermaid on their behalf or invent missing methods.
Unavailable operations, unknown schemas and import/transport errors remain explicit
per-test gaps.

**The reference path defines the scored population.** 5,459 callbacks expanded;
2,422 were reference-unqualified and 143 upstream-skipped. Installing the
`ajv` and `csstree-validator` test dependencies in the runtime let two more files
expand (23 of the 316 selected files still do not); 52 files remain outside the core
Vitest runner. Mermaid passes **2,894** callbacks through the reference adapter, and
those are the scored population. The 2,422 it cannot pass mostly import Mermaid
internals the public package does not expose (rendering helpers, theme internals,
internal diagram registries). Nobody can pass them, so they are reported as
reference-adapter coverage work instead of being counted as every participant's
unknowns, which had capped Mermaid itself at 54.6% of its own tests.

**Drawing Correctness checks labels.** A case passes when every label named by its
reviewed source facts appears in the output and no raw Mermaid syntax is shown. SVG
text is read from the document without a browser, and terminal text directly. Empty,
error, echoed or zero-size outputs are nonpasses; the one case whose correct drawing
is empty passes only without text. Edges, arrow direction, layout and styling are
not checked. The earlier geometry checkers left 2,805 of 6,350 results unassessed;
the label check leaves 20 of 4,318: the one corpus chart that names no labels,
wherever a renderer draws it. On the same outputs it agrees with every result the geometry
checkers had confirmed correct.

PNG is not part of Drawing Correctness. OCR found every label in only 43 of 127
Mermaid PNGs whose source SVGs pass 124, so a PNG score would mostly measure the
OCR. Mermaid Flutter, which only outputs PNG, has no Drawing result.

Broad assessment and original-test operation coverage are still incomplete; calling
the whole benchmark effort finished would be premature. The remaining work is to
write parser/model bindings for the
unbound projects, reach more Mermaid internals through the reference adapter, and
run the unexpanded and outside-runner tests. The combined table displays score
ranges; an exact overall score remains unavailable while required measurements are
missing.

## Evidence and verification

Results are verified by re-running them, not by archiving rendered outputs. Each
published result is backed by four small, committed things:

1. **The frozen version list:** the exact release or source revision of every
   project, resolved once per campaign (`docs/evidence/benchmark-campaign-2026-11-02/versions.json`
   and `catalog.json`).
2. **The pinned inputs:** the Mermaid documentation commit for DaveBench, the 127-case
   Drawing corpus in the repository, and the Mermaid test-suite commit for Fidelity.
3. **The code commit** that collected and scored the result.
4. **The numeric results:** per-run counts and times for DaveBench, and per-case or
   per-file outcomes for Drawing Correctness and Mermaid Fidelity.

Anyone can check a result by preparing the same frozen versions and running the same
commands. On 3 November that reproduced every count the changes did not touch: every
DaveBench completion count and Fidelity's 2,894 qualified tests. Re-running is also
how a scoring change is applied; the full label-based Drawing collection takes a few
minutes.

Rendered SVGs, PNGs and terminal text are not kept. The 605 MB raw archive of the
1 November campaign was discarded rather than published. That campaign measured the
superseded benchmark set; its tables and report receipts remain on the
[`evidence/full-campaign-2026-11-01`](https://github.com/adewale/trident/tree/evidence/full-campaign-2026-11-01)
branch as a historical record.

## Detailed results and numeric inputs

- [DaveBench method and detailed results](benchmark-campaign-results-2026-11-03.md)
- [Drawing Correctness and Fidelity method and earlier detailed results](correctness-fidelity-results-2026-11-02.md)
- [DaveBench numeric results](evidence/benchmark-campaign-2026-11-03/report.json)
- [Drawing Correctness numeric results](../results/drawing-correctness-2026-11-03.json)
- [Mermaid Fidelity numeric results](../results/mermaid-fidelity-2026-11-03.json) and [unmeasured-project reasons](evidence/benchmark-campaign-2026-11-03/fidelity-unmeasured.json)
- Superseded 2 November results: [DaveBench](evidence/benchmark-campaign-2026-11-02/report.json), [Drawing](../results/drawing-correctness-2026-11-02.json), [Fidelity](../results/mermaid-fidelity-2026-11-02.json)

`RESULTS.md` previously remained attached to the 1 November legacy snapshot while
new results were published elsewhere. `results:snapshot` now reads the three current
numeric results for the landing page. Historical snapshots and their detailed pages
retain their original measurements and are no longer the landing page's source.

## Current project participation

| Benchmark | Projects with scored results | Projects with no Trident gaps in the reported population |
|---|---:|---:|
| DaveBench | 27: 16 SVG, 17 PNG, 18 terminal | 27 |
| Drawing Correctness | 26: 16 SVG, 18 terminal (Mermaid Flutter outputs only PNG, which Drawing does not assess) | 0 |
| Mermaid Fidelity | 14, including Mermaid 12.2.0 | 1 (Mermaid) |

A scored result can include failures. It does not mean every input passed, every
output was assessable, or that the project has complete benchmark coverage.
Drawing's 20 unassessed results and Fidelity's missing operations/reference
bindings remain unfinished Trident work. The synthetic table combines the measured
components now; no project has enough coverage for an exact overall score.
