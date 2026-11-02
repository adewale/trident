# Benchmark results: methods and coverage

[League tables](../RESULTS.md) contain the three current benchmarks. Every project
is displayed as one name-and-version label, such as **Pele 1.13.0**. The measurements
reuse the version freeze from 2 November 2026; changing presentation runs no renderers.

## Reading the tables

| Benchmark | Population | Ordering | Missing results |
|---|---|---|---|
| DaveBench | 1,342 documentation occurrences, separately for SVG, PNG and terminal text | More completions first; lower median total seconds breaks ties | Blocked projects have no completion or timing score |
| Drawing Correctness | The same 127 cases per applicable format | More verified whole-case passes; equal counts share a rank | Unassessed combines unknown verdicts and unrun cases |
| Mermaid Fidelity | 5,302 expanded, unskipped original callbacks | More passed callbacks; equal counts share a rank | Reference and candidate adapter gaps remain unassessed |

For DaveBench, completions are the minimum across three runs and seconds are the
median total time. It measures output production and time, without judging drawings.
CLI rows include process startup; persistent API rows exclude initialization.

For Drawing Correctness, Failed combines contradicted drawing facts, invalid output
and render/export failures. For Fidelity, Failed combines assertion nonpasses and
native unsupported results. Fidelity Unassessed includes both reference-unqualified
and candidate adapter gaps, keeping the 5,302-case population fixed. The 143 upstream
skips are outside that population. Detailed tables separate these categories. A wholly
unassessed project has neither a score nor a rank. An observed zero with known
failures remains a measured result. Ranks order observed passes; unresolved cases
can change that order. They do not establish an overall winner.

## Why coverage is incomplete

These gaps mostly describe unfinished Trident implementation, rather than demonstrated
limitations of the projects being benchmarked.

**Fidelity stopped at a small adapter list.** The runner currently selects Mermaid,
Pele, Agentic Mermaid and Beautiful Mermaid explicitly. Zombie was checked but its
installed artifact had no binding usable by that adapter. The other projects were
blocked before their original tests ran because Trident has no adapter for them.
The resulting 23 project gaps are not 23 observed test-suite failures.

The pinned tests frequently import Mermaid's parser and mutable diagram database,
including getters and host configuration. Existing rendering drivers alone do not
supply those operations. Trident needs bindings to each candidate's actual available
operations, with missing operations accounted for per test. Blocking an entire
project at adapter selection also prevents any otherwise usable public-interface
tests from contributing. That is a coverage problem in the current runner.

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
remain unknown. Seven cases have common source-transcription or empty-drawing gaps;
large stress cases exceed the observer bound. These are assessment gaps, not proof
that those diagrams are wrong. OpenCode's stopped terminal worker leaves 48 unrun
cases, and Flutter's native bundle remains an isolated setup blocker.

The earlier delivery implemented and exercised the runners, but did not finish
broad assessment and adapter coverage. Describing that as finishing the benchmarks
was premature. The remaining work is to extend and validate the observers, bind
candidate operations, and run the unexpanded/outside-runner tests. No overall score
is synthesized from missing measurements.

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
