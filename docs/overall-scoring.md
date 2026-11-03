# Equal-weight overall synthesis

The [combined table](../RESULTS.md#equal-weight-synthesis) now reads all three current
numeric results. Each benchmark receives one third of the overall score. Applicable
output formats are averaged within DaveBench and Drawing Correctness first.

| Component | Score on a 0–100 scale |
|---|---|
| DaveBench | Mean format rank percentile: `100 × (participants − rank) / (participants − 1)`. Its existing completion-first, time-second ranking supplies the ranks. A sole participant receives 100. |
| Drawing Correctness | `100 × passed / 127`, averaged across applicable formats |
| Mermaid Fidelity | `100 × passed / 5302` expanded, unskipped original callbacks |
| Overall | Arithmetic mean of the three components |

The DaveBench normalization reuses the previously declared campaign policy. It is
relative to the measured participants, not an absolute accuracy percentage. A changed
participant set can change that component even without new renderer measurements.

Unknown results are score intervals. For a case benchmark, the lower endpoint counts
only verified passes; the upper endpoint also allows every unassessed case to pass.
A missing applicable format or whole benchmark contributes **0–100**, not a zero
point score and not an omitted component. Render failures, contradicted facts and
actual unsupported results are known nonpasses and cannot raise the upper endpoint.

Average lower endpoints and upper endpoints separately using the same equal weights.
The table sorts by the **verified minimum overall score**, with ties sharing a rank.
This is a ranking of verified minima, not a proven final ordering: overlapping ranges
can change order when gaps are resolved. The intervals describe unresolved work;
they are not statistical confidence intervals.

All current projects have unresolved Drawing/Fidelity coverage, so **zero projects
qualify for an exact overall score**. The combined table remains useful as an explicit
summary of current observations and their limits. It does not declare an overall winner.
The scores cover the reported populations: the 25 unexpanded reference files and 52
outside-runner files still prevent a claim of full Mermaid-suite fidelity.

Implementation: `overallScore` and `synthesiseBenchmarks` in
[unified/overall-score.ts](../unified/overall-score.ts). No benchmark is run to build
the table. Versions and measured results remain unchanged.
