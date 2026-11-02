# Equal-weight overall score

Requested on 2 November 2026: give DaveBench, Drawing Correctness and Mermaid
Fidelity equal weight. The three original result tables remain visible.

| Component | Score from 0 to 100 |
|---|---|
| DaveBench | Convert each format's completion-first rank to a percentile: 100 for first, 0 for last, with equal ranks sharing a score. Average the predeclared applicable formats. |
| Drawing Correctness | 100 × fully correct cases / the fixed drawing-corpus size. |
| Mermaid Fidelity | 100 × fully passed upstream test cases / the fixed scored test population. |

**Overall = (DaveBench + Drawing Correctness + Mermaid Fidelity) / 3.**
Exact ties share a rank. Raw counts, times, output formats, versions and cohort
sizes stay visible. DaveBench's score is relative to its measured participant
cohort, not an absolute speed multiplier. A format the project does not provide
is outside its format average; an applicable but unmeasured format is unknown.

A Trident collection/assessment gap is not a zero or an omitted benchmark.
Unresolved cases preserve a lower/upper score interval. An overall point score
and rank require measurements for all three benchmarks. Even then, a claimed
unique overall winner requires its score to exceed every other project's
possible score; unresolved rivals cannot simply disappear from the comparison.

The newly defined broad Drawing Correctness and Mermaid Fidelity campaigns do
not yet exist. Their old terminal-only and 49/154-test selections cannot be
substituted into this formula. The current campaign therefore reports the
measured DaveBench component and leaves overall scores unranked.

Implementation: `unified/overall-score.ts`. The results writer is
`bun commands.ts campaign:results --images IMAGE_RESULTS --terminal TERMINAL_RESULTS --versions VERSION_DIRECTORY --out FRESH_DIRECTORY`.
