# Public-artifact comparisons: 27–28 October 2026

This dated collection compares public documentation rendering, shipped browser-global size, authored paint criteria and entry costs. It is not a new complete ecosystem run. Measurements retain their original dates, artifacts and Trident producers; none describes current project main branches.

The four additional tables live in [RESULTS.md](../RESULTS.md), generated from the canonical numeric store. Each table ranks its own metric best first. They retain the historical selection, including descendants that current comparison policy skips. Aliases are attributed observations, not independent implementation wins. No composite rank combines coverage, size, time and paint.

| Comparison | Canonical table | Boundary and limits |
|---|---|---|
| DaveBench documentation coverage | [1,095 occurrences](../results/tables/docs-1.md#ecosystem-docs-1095-2026-10-27) | All occurrences across six rounds; returning SVG does not establish diagram meaning. |
| Documentation call cost | [847 shared successful occurrences](../results/tables/docs-1.md#ecosystem-docs-call-cost-2026-10-27) | Same successful inputs for all three tools; SVG return excludes inspection and paint. Descriptive, without A/A speedup qualification. |
| Browser-global size | [Shipped gzip bytes](../results/tables/docs-1.md#ecosystem-browser-gzip-2026-10-27) | Complete browser globals, level-9 gzip; excludes fonts, focused/lazy entries and wire overhead. |
| Diagram Meaning | [920 reference-qualified paint criteria](../results/tables/fidelity-1.md#ecosystem-paint-920-2026-10-27) | 100 authored cases across 25 families and 43 historical implementation rows. Missing observations retain the denominator; models and browser admission stay separate. |

The documentation collection used Mermaid 12.2.0, Pele 1.9.0 and an explicitly frozen Agentic Mermaid 0.4.2 candidate. Mermaid and Pele lacked the selected ZenUML binding; that is a collection limitation, not a Mermaid language limitation. The paint evidence retains a separate 150 reference-unqualified criteria across surfaces.

The [entry-cost projection](evidence/campaign-2026-10-28/startup.json) retains exact operation, entry, runtime, producer and resource boundaries. Node spawn-through-consumption costs differ from a render call. Whole child-lifetime RSS includes runtime, import, output consumption and GC; document heap excludes native/GPU/process memory. Different operations are separate diagnostics, with no invented equivalent baseline or monetary cost.

## Limited case requalification

The generic `--cases ID,ID` option validates case IDs before preparation, preserves corpus order and writes explicit subsets to a separate `portable-svg-subset` record lane. A one-case repair cannot replace a full-portfolio record. Family counts report exercised positive families; canonical family representatives remain separately counted.

The [configuration-reset receipt](evidence/campaign-2026-10-28/configuration-reset.json) records one repaired observer case on three frozen public artifacts, with original producer `4036abeed0f0772dd63f62c15ba242252cdd7d98`. The successful retry used one preparation slot after the eight-slot attempt hit host EAGAIN. These observations form a separate cohort. They do not establish a renderer speed improvement, a whole-portfolio score or complete semantic qualification.

## Ownership and reproduction

The legacy AM report writer and chart generator, AM-specific PR matrices, strict backend-receipt experiments and source-suite failure attribution now belong in [Agentic Mermaid’s campaign report](https://github.com/adewale/agentic-mermaid/blob/main/docs/benchmarks/campaign-2026-10-28.md). They are not prerequisites for this runner change or a Trident release. Whole-editor experiments are outside [core scope](../SCOPE.md).

The [evidence manifest](evidence/campaign-2026-10-28/manifest.json) records the bounded projections and original publication. Raw workers, package archives and dependency trees remain external. Historical validation receipts retain their original limitations; current-head code checks are reported in the PR.

Regenerate the six retained public-artifact figures without invoking a benchmark:

```sh
python3 docs/evidence/campaign-2026-10-28/render.py --out /fresh/charts
```

Use a new output directory. The script copies and checks the three existing Dave figures and rebuilds the paint, Node startup and RSS figures. Publish raw evidence before importing a new campaign, as described in [results/README.md](../results/README.md); preserve failed attempts and incompatible cohorts.
