# Benchmark results

[RESULTS.md](../RESULTS.md) is the league-table page for **DaveBench**, **Drawing
Correctness** and **Mermaid Fidelity**, plus their equal-weight synthesis. It contains tables and a link to the
[methods and coverage details](../docs/benchmark-results-details.md). Project names
and versions always form one display label.

The page and every generated number in the docs read these numeric results
(`currentBenchmarkResultFiles` in `unified/three-benchmark-report.ts`):

- [DaveBench](../docs/evidence/benchmark-campaign-2026-11-04/report.json)
- [Drawing Correctness](drawing-correctness-2026-11-04.json)
- [Mermaid Fidelity](mermaid-fidelity-2026-11-04.json)
- [Frozen catalog](../docs/evidence/benchmark-campaign-2026-11-02/catalog.json)

Regenerate or check them without executing a benchmark:

```sh
bun commands.ts results:snapshot
bun commands.ts results:snapshot --check
```

Superseded collections and the legacy results snapshot remain in Git history.
