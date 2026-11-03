# Benchmark results

[RESULTS.md](../RESULTS.md) is the league-table page for **DaveBench**, **Drawing
Correctness** and **Mermaid Fidelity**, plus their equal-weight synthesis. It contains tables and a link to the
[methods and coverage details](../docs/benchmark-results-details.md). Project names
and versions always form one display label.

The current page reads the existing numeric measurements:

- [DaveBench](../docs/evidence/benchmark-campaign-2026-11-02/report.json)
- [Drawing Correctness](drawing-correctness-2026-11-02.json)
- [Mermaid Fidelity](mermaid-fidelity-2026-11-02.json)

Regenerate or check it without executing a benchmark:

```sh
bun commands.ts results:snapshot
bun commands.ts results:snapshot --check
```

`latest.json`, `baseline.json` and `tables/` retain historical measurements. They do
not supply the current landing page. Explicit historical campaign imports require
a separate `--out` directory. Current presentation changes do not regenerate
historical archives or change measured values.
