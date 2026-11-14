# Equal-weight overall synthesis

The [combined table](../RESULTS.md#equal-weight-synthesis) reads all three current
numeric results. Each benchmark receives one third of the overall score. Applicable
output formats are averaged within DaveBench and Drawing Correctness first.

| Component | Score on a 0–100 scale |
|---|---|
| DaveBench | `100 × completed / planned` occurrences, averaged across the formats the project produces through its own interfaces. PNG made by Trident's Chromium conversion of the project's SVG (`pngPath: 'trident-conversion'`) repeats the SVG measurement and is left out; a project's own PNG interface (`pngPath: 'native'`) counts. Completions are the minimum across the three runs and require an [admissible output](davebench-definition.md#output-admission). |
| Drawing Correctness | `100 × passed / 127`, averaged across the project's SVG and terminal formats. Not applicable to a project with neither (Mermaid Flutter) |
| Mermaid Fidelity | `100 × passed / scored population`: the expanded upstream callbacks that pinned Mermaid itself passes, in files under `packages/mermaid/src/diagrams/` or `packages/parser/`. The control's other passing callbacks are inventory and not scored. Not applicable to a project without a public parse interface (Grok's renderer component, MermaidText and Loom's renderer component) |
| Overall | Arithmetic mean of the applicable components |

## Why these components

**DaveBench is an absolute completion rate.** An earlier version used each
project's rank percentile in the DaveBench tables. That made a project's score
move whenever another participant was added or removed, and imported the
DaveBench speed tiebreak, which can compare a fresh-process CLI clock against a
persistent API clock. The completion rate depends only on the project's own
measurements. Speed remains in the DaveBench tables, where boundaries are shown.

**Fidelity uses the qualified population.** A Fidelity pass needs the original
assertions to pass for the candidate *and* for the pinned Mermaid control. A
callback the control cannot pass is unpassable for everyone, including Mermaid.
Keeping those callbacks in the denominator capped every project, Mermaid
included, at the qualified share (2,894 of 5,302 when this was changed) and showed
Mermaid's own tests as only 54.6% passed. Those callbacks are reference-adapter
coverage work, reported beside the table, not shared unknowns.

Of the qualified callbacks, only those in Mermaid's diagram and parser tests
(`packages/mermaid/src/diagrams/`, `packages/parser/`) are scored. The others test
rendering utilities, Mermaid's website and its top-level modules, which no
reimplementation's parser can reach; `fidelity:coverage` lists them as inventory.
Result files scored this way declare `scoring.protocol:
'fidelity-scored-population-v2'`. A result file without that declaration, collected
before this rule, is read under the rules it was published with: every
qualified callback is scored and an unsupported operation is a known nonpass
(`fidelityScoring` in [unified/mermaid-fidelity/scoring.ts](../unified/mermaid-fidelity/scoring.ts)).

## Unknown results are ranges

For a case benchmark, the lower endpoint counts only verified passes; the upper
endpoint also allows every unassessed case to pass. A missing applicable format
or whole benchmark contributes **0–100**, not a zero point score and not an
omitted component. Render failures, contradicted facts and Fidelity assertion
failures and candidate faults are known nonpasses and cannot raise the upper
endpoint. A Fidelity operation the candidate's side reports as unsupported is
unassessed, for every candidate, and falls inside the range, because no
per-assertion review has separated each candidate's real limits from Trident
binding gaps. Result files keep the raw `unsupported`
disposition. Lower and upper endpoints are averaged separately using the same
equal weights.

## Possible rank, not rank by minimum

The table shows each project's **possible rank**: the best and worst position it
can still reach once its unresolved work is measured.

- Best rank = 1 + the number of projects whose verified minimum exceeds this project's maximum.
- Worst rank = 1 + the number of projects whose maximum exceeds this project's verified minimum.

An earlier version sorted and ranked by the verified minimum. That treats every
unmeasured case as a failure for ordering purposes: a project whose whole
Fidelity third was not run lost up to 33 points of rank position because of
Trident's coverage gap rather than its own results. Possible ranks make no such
assumption. Rows are listed by worst reachable rank, then best reachable rank;
the displayed range, not the row order, is the claim.

When every component of every project is measured, best and worst ranks
coincide and the table becomes an ordinary ranking. Until then, overlapping
ranges are unresolved, not ties. The intervals describe unresolved work; they are
not statistical confidence intervals.

A benchmark that cannot apply to any of a project's outputs is left out of that
project's mean and shown as `n/a`. That differs from unmeasured work, which stays a
0–100 range: Drawing Correctness assesses only SVG and terminal text, so a PNG-only
renderer has no Drawing component at all, whereas a missing Fidelity binding could
still be written. Likewise, a project whose parser is reachable only through
private code has no Fidelity component, because Trident compares public
interfaces only ([scope](../SCOPE.md)).

While Fidelity and SVG observation coverage remain incomplete, **most projects
do not have an exact overall score**. A position is decided only where a project's
possible rank is a single number. The
scores cover the reported populations: unexpanded and outside-runner upstream
files still prevent a claim of full Mermaid-suite fidelity.

Implementation: `overallScore`, `fidelityPopulation`, `possibleRanks` and
`synthesiseBenchmarks` in [unified/overall-score.ts](../unified/overall-score.ts).
No benchmark is run to build the table.
