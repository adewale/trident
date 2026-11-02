# Equal-weight overall score

**Overall = (DaveBench + Drawing Correctness + Mermaid Fidelity) / 3.**
Each benchmark uses a 0–100 score; average its applicable output formats first.
Missing or unresolved measurements leave the overall score unknown. Equal scores
tie. This implements the user's equal-weight choice without inventing results.

Drawing Correctness and Mermaid Fidelity now have measured campaigns with
explicit assessment and adapter gaps. Those unresolved measurements still
withhold an overall score. [Results and limits](correctness-fidelity-results-2026-11-02.md). The historical 2 November archive retains its original score
format; exact reproduction uses commit `344d5ab`.

Implementation: `overallScore` in `unified/overall-score.ts`. Apply it when all
three measurements exist. Benchmark definitions remain in
[the portfolio](benchmark-portfolio.md).
