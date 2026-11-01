# Benchmark repair: 30 October 2026

This campaign improves the checks behind Trident's results. It uses five existing
frozen SVG artifacts: Mermaid 12.2.0, Pele 1.12.0, Agentic Mermaid 0.5.1, Beautiful
Mermaid 1.1.3 and DSH Mermaid GB SVG 0.1.4. Mermaid participates throughout.
The cohort was selected for different observable failures, not expected winners.

## Work performed

- Evaluate 30 authored cases once per project: one representative for each of 25
  families, plus five named flowchart controls. Retain all planned checks.
- Run one documentation pass per project: 548 occurrences, retaining each returned
  SVG for future inspection. No six-round timing campaign or artifact acquisition.
- Fix valid drop-shadow handling and group-container ownership; reject explicitly
  painted hidden source content. Controls fail against the old checker.
- Fix public option mapping. A method named `renderMermaidSVG` does not establish
  support for `fontSize`. Reuse the existing reviewed AM/Pele mappings; unknown
  mappings stay harness gaps. Rerun only the two-size configuration workflow.
- Recheck stored SVGs after observer fixes. Reuse the earlier controlled-PNG source
  contracts for group membership and collapsed content; render nothing again.

The three SVG collection windows took approximately **112 seconds combined**,
excluding implementation, source review, tests and observer-only rechecks. There
were 150 initial authored-case evaluations, ten configuration follow-up evaluations
and 2,740 documentation occurrences, plus the collector's 150 documentation warmups.
No new comparative timing or scaling campaign was launched.

## Reviewed documentation content

Sixteen source occurrences have drawing expectations, and one settings-only Gantt
example is classified as configuration-only. Source hashes and expectations are
[committed](../corpus/docs-reviewed.json). This is a development-exposed profile
across four families. It is not full DaveBench correctness or a holdout.

Ranks use correct / 16. Unknown observations withhold a rank.

| Rank | Project | Correct | Incorrect | Unknown | Planned drawings |
|---:|---|---:|---:|---:|---:|
| 1 | Mermaid 12.2.0 | 16 | 0 | 0 | 16 |
| 2 | Agentic Mermaid 0.5.1 | 15 | 1 | 0 | 16 |
| 3 | DSH Mermaid GB SVG 0.1.4 | 2 | 14 | 0 | 16 |
| — | Beautiful Mermaid 1.1.3 | 7 | 5 | 4 | 16 |
| — | Pele 1.12.0 | 15 | 0 | 1 | 16 |

DSH returns SVG for all 548 examples but fails 14 of these 16 content checks.
AM exposes internal labels in the collapsed-group example (`flowchart.md:1065`).
Pele's collapsed output has no observed hidden-label violation, but its collapsed
container needs an ownership projection; it stays unknown. These are findings for
the pinned versions and declared checks, not current-release or aesthetic verdicts.

**Another 531 occurrences have no reviewed source expectation.** Their SVG-return
results remain separate compatibility evidence. They receive no correctness pass,
and no full-inventory correctness rank is published.

## Authored feature profile

Every project has the same 30 planned diagrams. Counts below are ordered by
verified passes for inspection; all project correctness ranks are withheld because
unknown diagrams remain. Public-model APIs supply no SVG credit.

| Rank | Project | Correct | Incorrect | Unsupported | Unknown | Planned |
|---:|---|---:|---:|---:|---:|---:|
| — | Agentic Mermaid 0.5.1 | 23 | 1 | 0 | 6 | 30 |
| — | Pele 1.12.0 | 23 | 1 | 1 | 5 | 30 |
| — | Mermaid 12.2.0 | 21 | 2 | 0 | 7 | 30 |
| — | Beautiful Mermaid 1.1.3 | 6 | 3 | 0 | 21 | 30 |
| — | DSH Mermaid GB SVG 0.1.4 | 0 | 28 | 0 | 2 | 30 |

The raw case ledger identifies each failed check and missing projection. An
incorrect case can also contain unknown subchecks; one established violation is
sufficient to reject a complete pass. Unknown cases have no established failure.
The corrected configuration follow-up verifies 14px and 24px node text for Mermaid,
Pele and AM. Beautiful and DSH have no reviewed mapping for this option and receive
unknown outcomes without a public render call for the unmapped request.

## Performance and retired work

Only one reviewed documentation source passes the declared checks for all five
projects. That is too narrow for an overall speed claim, and substantial observer
gaps remain. No new timing qualification was attempted. Existing descriptive
return clocks are not promoted into speed rankings. The earlier [seven-project
fixed-PNG study](davebench-png-seven-results.md) retains its own reviewed profile,
versions, clocks and uncertainty; it was not rerun.

Ordinary campaigns now select `docs,fidelity`. Performance and optional model
collection require explicit selection. Assertion Replay and the nonblank-only PNG
exporter are retired from new comparative collection. Mermaid's own tests remain
an explicit reference check. Historical numerical results and raw observations
are unchanged. New SVG reports reduce whole-diagram outcomes to one table rather
than publishing a separate comparative table for every criterion.

The [terminal prototype](terminal-correctness.md) applies these lessons to Mermaid
ASCII and Termaid, with Mermaid as a source reference. It tests actual connectivity,
keeps unsupported layouts unknown and rechecks stored output after checker fixes.

## Evidence and remaining work

The [receipt](evidence/benchmark-repair-2026-10-30/receipt.json) identifies original
rendering, the configuration follow-up and later observer-only rechecks separately.
It links the raw download, selected sources, retained output and reproducible
positive/negative controls. Original timestamps and collector identities are kept;
a changed observer does not become a new renderer measurement.

The blockers to a broad correctness headline are concrete: unreviewed documentation
expectations, the remaining SVG ownership/value projections, and terminal shared-stem
and display-cell handling. Review the retained output and improve those checks
before expanding the project cohort or repeating an ecosystem campaign.
