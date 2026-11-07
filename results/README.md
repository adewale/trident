# Benchmark results

[RESULTS.md](../RESULTS.md) is the league-table page for **DaveBench**, **Drawing
Correctness** and **Mermaid Fidelity**, plus their equal-weight synthesis. It contains tables and a link to the
[methods and coverage details](../docs/benchmark-results-details.md). Project names
and versions always form one display label.

The page and every generated number in the docs read these numeric results
(`currentBenchmarkResultFiles` in `unified/three-benchmark-report.ts`):

- [DaveBench](release/report.json), built from [images](release/images.json) and [terminal](release/terminal.json). Native Flutter PNG remains blocked in this collection; see the [campaign notes](release/README.md).
- [Drawing Correctness](release/drawing-correctness.json)
- [Mermaid Fidelity](release/mermaid-fidelity.json)
- [Frozen catalog](../docs/evidence/benchmark-campaign-2026-11-07/catalog.json)

`release/` holds one campaign under fixed names; [its README](release/README.md) describes it. File names carry no dates: published dates come from the timestamps each file records.

Regenerate or check them without executing a benchmark:

```sh
bun commands.ts results:snapshot
bun commands.ts results:snapshot --check
```

Superseded collections and the legacy results snapshot remain in Git history.
