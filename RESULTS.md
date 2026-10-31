# Mermaid ecosystem benchmark results

Last recorded measurement/update: **2026-10-31**. 108 imported project/benchmark attempts; 10 retained result tables.

**Historical** marks retained measurements collected before the current reporting work. **Source candidates** are unreleased builds, ranked only within their own comparison tables; they do not replace release scores in the overview. This page is a rolling view across dated runs, not one matched ecosystem experiment. Regenerating it runs no benchmarks. Dates, versions, interfaces and qualification belong to each table.

[Machine-readable results](results/latest.json) · [Benchmark methods](BENCHMARKS.md) · [Reading the tables](REPORTING.md) · [Update this page](results/README.md)

[31 October campaign: raw archive and checksums](https://github.com/adewale/trident/releases/tag/ecosystem-evidence-2026-10-31)

[31 October campaign: sources, reviewed images and repair receipts](https://github.com/adewale/trident/tree/9a74e093893f45d5b1316912711c5314267acd69)

[Previous ecosystem overview and dated diagnostic studies](https://github.com/adewale/trident/blob/b555992271eef91a5b57ab7c584ac4b0b6552554/RESULTS.md)

## Ecosystem overview

27 eligible projects are listed below. 62 catalog entries outside core comparison scope are listed separately. Results are never inherited through lineage.

Each cell links its latest recorded attempt, or a dated retained table. New failed, blocked and partial attempts take precedence over earlier tables. Different suites have different units; there is no combined score. “Unmeasured” is missing evidence; “N/A” follows the declared output or reference scope, not a measured failure.

Overview order: DaveBench: Documentation Examples, highest Correct / Planned reviewed first (2026-10-31). Ties share a rank. Projects with no result for this measure, or a newer superseding attempt, remain unranked below. Each benchmark has its own ranking. The overview’s ranked benchmark cell uses this same table and population.

| Project | Overview rank | Terminal Rendering | DaveBench SVG | DaveBench PNG | Mermaid Feature Cases | Public Model Contracts |
|---|---|---|---|---|---|---|
| Mermaid | 1 | N/A | [16/16 · 2026-10-31](#run-22a4e4549a96ba57423ed301) | [16/16 · 2026-10-31](#run-87c7d06be3ec5a0cad582f61) | [62/100 · 2026-10-31](#run-cf2b690854ce0dd0739b1e75) | [90/100 · 2026-10-31](#run-40cc1a5ead121ae9df015930) |
| Bezel | 2 | N/A | [15/16 · 2026-10-31](#run-22a4e4549a96ba57423ed301) | [16/16 · 2026-10-31](#run-87c7d06be3ec5a0cad582f61) | [57/100 · 2026-10-31](#run-cf2b690854ce0dd0739b1e75) | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-9f327ddcc19156fba3ba33c5) |
| Latias Merman | 2 | [10/16 · 2026-10-31](#run-a6fa463f6d3455d15e79a2d5) | [15/16 · 2026-10-31](#run-22a4e4549a96ba57423ed301) | [16/16 · 2026-10-31](#run-87c7d06be3ec5a0cad582f61) | [40/100 · 2026-10-31](#run-cf2b690854ce0dd0739b1e75) | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-7a10e33a040fd6e8af1c4b3c) |
| Ondine | 2 | [3/16 · 2026-10-31](#run-a6fa463f6d3455d15e79a2d5) | [15/16 · 2026-10-31](#run-22a4e4549a96ba57423ed301) | [16/16 · 2026-10-31](#run-87c7d06be3ec5a0cad582f61) | [57/100 · 2026-10-31](#run-cf2b690854ce0dd0739b1e75) | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-59ac78754e258eadbd1259af) |
| Pele | 2 | N/A | [15/16 · 2026-10-31](#run-22a4e4549a96ba57423ed301) | [16/16 · 2026-10-31](#run-87c7d06be3ec5a0cad582f61) | [62/100 · 2026-10-31](#run-cf2b690854ce0dd0739b1e75) | [94/100 · 2026-10-31](#run-40cc1a5ead121ae9df015930) |
| Mermaid Dart | 6 | N/A | [13/16 · 2026-10-31](#run-22a4e4549a96ba57423ed301) | [15/16 · 2026-10-31](#run-87c7d06be3ec5a0cad582f61) | [29/100 · 2026-10-31](#run-cf2b690854ce0dd0739b1e75) | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-a4b188db5e6b02f0865d0b2a) |
| Frankenmermaid | 7 | [Terminal source/display/drawing evidence is incomplete · 2026-10-31](#run-a6fa463f6d3455d15e79a2d5) | [12/16 · 2026-10-31](#run-22a4e4549a96ba57423ed301) | [13/16 · 2026-10-31](#run-87c7d06be3ec5a0cad582f61) | [45/100 · 2026-10-31](#run-cf2b690854ce0dd0739b1e75) | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-e2276dfc9ed8fbbf893c2675) |
| Agentic Mermaid | 8 | [11/16 · 2026-10-31](#run-a6fa463f6d3455d15e79a2d5) | [11/16 · 2026-10-31](#run-22a4e4549a96ba57423ed301) | [11/16 · 2026-10-31](#run-87c7d06be3ec5a0cad582f61) | [38/100 · 2026-10-31](#run-cf2b690854ce0dd0739b1e75) | [59/100 · 2026-10-31](#run-40cc1a5ead121ae9df015930) |
| Zombie Mermaid | 9 | [11/16 · 2026-10-31](#run-a6fa463f6d3455d15e79a2d5) | [10/16 · 2026-10-31](#run-22a4e4549a96ba57423ed301) | [11/16 · 2026-10-31](#run-87c7d06be3ec5a0cad582f61) | [13/100 · 2026-10-31](#run-cf2b690854ce0dd0739b1e75) | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-e92381022b2e0b57671545fb) |
| Beautiful Mermaid | 10 | [9/16 · 2026-10-31](#run-a6fa463f6d3455d15e79a2d5) | [7/16 · 2026-10-31](#run-22a4e4549a96ba57423ed301) | [7/16 · 2026-10-31](#run-87c7d06be3ec5a0cad582f61) | [8/100 · 2026-10-31](#run-cf2b690854ce0dd0739b1e75) | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-c9cc899e27c54f849e34ad9f) |
| Crafter Mermaid | 10 | [Terminal source/display/drawing evidence is incomplete · 2026-10-31](#run-a6fa463f6d3455d15e79a2d5) | [7/16 · 2026-10-31](#run-22a4e4549a96ba57423ed301) | [6/16 · 2026-10-31](#run-87c7d06be3ec5a0cad582f61) | [7/100 · 2026-10-31](#run-cf2b690854ce0dd0739b1e75) | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-f16015a46f36e5ae28eecefe) |
| XMermaid | 12 | N/A | [3/16 · 2026-10-31](#run-22a4e4549a96ba57423ed301) | [9/16 · 2026-10-31](#run-87c7d06be3ec5a0cad582f61) | [11/100 · 2026-10-31](#run-cf2b690854ce0dd0739b1e75) | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-044d0f555cf3c5ab40bd628d) |
| DSH Mermaid GB SVG | 13 | N/A | [2/16 · 2026-10-31](#run-22a4e4549a96ba57423ed301) | [4/16 · 2026-10-31](#run-87c7d06be3ec5a0cad582f61) | [0/100 · 2026-10-31](#run-cf2b690854ce0dd0739b1e75) | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-b4c107b6627f5a5ccd01e223) |
| Mermaid RS Renderer | 14 | N/A | [0/16 · 2026-10-31](#run-22a4e4549a96ba57423ed301) | [11/16 · 2026-10-31](#run-87c7d06be3ec5a0cad582f61) | [19/100 · 2026-10-31](#run-cf2b690854ce0dd0739b1e75) | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-016de9af9b4f74ad3eb22810) |
| Merslim | 14 | [Terminal source/display/drawing evidence is incomplete · 2026-10-31](#run-a6fa463f6d3455d15e79a2d5) | [0/16 · 2026-10-31](#run-22a4e4549a96ba57423ed301) | [8/16 · 2026-10-31](#run-87c7d06be3ec5a0cad582f61) | [6/100 · 2026-10-31](#run-cf2b690854ce0dd0739b1e75) | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-ed449b04289130cced66dcf6) |
| VitePress Plugin Diagram | 14 | N/A | [0/16 · 2026-10-31](#run-22a4e4549a96ba57423ed301) | [1/16 · 2026-10-31](#run-87c7d06be3ec5a0cad582f61) | [0/100 · 2026-10-31](#run-cf2b690854ce0dd0739b1e75) | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-a823e4d074433abbd789ad70) |
| ASCII Mermaid | — | [11/16 · 2026-10-31](#run-a6fa463f6d3455d15e79a2d5) | N/A | N/A | N/A | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-4125b8c197717d32309d6bd8) |
| Figurehead | — | [5/16 · 2026-10-31](#run-a6fa463f6d3455d15e79a2d5) | N/A | N/A | N/A | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-5e0af5a369d49dd95407706e) |
| Grok renderer | — | [Terminal source/display/drawing evidence is incomplete · 2026-10-31](#run-a6fa463f6d3455d15e79a2d5) | N/A | N/A | N/A | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-f5187dc05f4ad78f543a369c) |
| Kitlangton Merman | — | [4/16 · 2026-10-31](#run-a6fa463f6d3455d15e79a2d5) | N/A | N/A | N/A | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-a6e38219c2ad77c4359b1bf8) |
| Loom renderer | — | [9/16 · 2026-10-31](#run-a6fa463f6d3455d15e79a2d5) | N/A | N/A | N/A | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-bf0e083c34d4b31f6004da9b) |
| Mermaid ASCII | — | [11/16 · 2026-10-31](#run-a6fa463f6d3455d15e79a2d5) | N/A | N/A | N/A | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-cd51ae7565e28fb5df2edd2d) |
| Mermaid Flutter | — | N/A | N/A | [15/16 · 2026-10-31](#run-87c7d06be3ec5a0cad582f61) | N/A | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-0d01a0cbb3308948bd8913c1) |
| MermaidText | — | [10/16 · 2026-10-31](#run-a6fa463f6d3455d15e79a2d5) | N/A | N/A | N/A | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-4220435f2c077b0a18796f86) |
| MermaidTUI | — | [3/16 · 2026-10-31](#run-a6fa463f6d3455d15e79a2d5) | N/A | N/A | N/A | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-b970cdb7d3726135f6edd82b) |
| OpenCode Merman | — | [9/16 · 2026-10-31](#run-a6fa463f6d3455d15e79a2d5) | N/A | N/A | N/A | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-52080b201381ae53f6da6574) |
| Termaid | — | [12/16 · 2026-10-31](#run-a6fa463f6d3455d15e79a2d5) | N/A | N/A | N/A | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-857417fea8907047551b5b64) |

## Results by benchmark

Tables retain the full recorded populations. Charts show one named measure from the adjacent table; blocked, unavailable and failed checks remain visible in that table. Linked publications provide raw downloads; each table’s receipt identifies its owning evidence.

### Terminal Rendering

[All 2 ranked tables and recorded attempts](results/tables/community.md)

<a id="run-a6fa463f6d3455d15e79a2d5"></a>

**run-a6fa463f6d3455d15e79a2d5** · 2026-10-31 · unit: terminal input cases · [evidence](https://github.com/adewale/trident/blob/9a74e093893f45d5b1316912711c5314267acd69/evidence/1/report.json)

Independently reviewed drawing subset, ranked by verified correct count only. Unknown outcomes leave complete accuracy unresolved; this count rank cannot establish full-corpus correctness. Corpus: 120 selected inputs from pinned terminal-project documentation, issues and PRs, without selection on renderer outcomes. Source/review hashes and all origins remain in the owning receipt. Full-inventory accuracy ranks are withheld for unknown work; reviewed-subset ranks order only verified counts. Mermaid source reference is unscored; no speed or aesthetics score.

Ranked by **Correct**, highest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

Comparisons use **Correct** counts. “More verified” and “Fewer verified” mean accuracy is unresolved because either project has unknown outcomes. Mermaid has no terminal output; Mermaid ASCII is the terminal baseline.

| Project | Rank | Version | Correct | Incorrect | Unsupported | Unknown | Planned | Measured | vs Mermaid ASCII | Ranking note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Termaid | 1 | 0.10.0 | 12 | 1 | 0 | 3 | 16 | 2026-10-31T09:28:24.742Z | More verified (+1); accuracy unresolved |  |
| Agentic Mermaid | 2 | 0.4.1 | 11 | 0 | 0 | 5 | 16 | 2026-10-31T09:28:24.742Z | Same verified count; accuracy unresolved |  |
| ASCII Mermaid | 2 | 0.1.0 | 11 | 2 | 0 | 3 | 16 | 2026-10-31T09:28:24.742Z | Same verified count; accuracy unresolved |  |
| Mermaid ASCII | 2 | 1.6.1 | 11 | 3 | 0 | 2 | 16 | 2026-10-31T09:28:24.742Z | Baseline |  |
| Zombie Mermaid | 2 | 5.10.2 | 11 | 0 | 0 | 5 | 16 | 2026-10-31T09:28:24.742Z | Same verified count; accuracy unresolved |  |
| Latias Merman | 6 | 0.9.2 | 10 | 4 | 0 | 2 | 16 | Unknown; recovered text, see receipt | Fewer verified (-1); accuracy unresolved |  |
| MermaidText | 6 | git-a6b0c7657b94 | 10 | 0 | 0 | 6 | 16 | 2026-10-31T09:28:24.742Z | Fewer verified (-1); accuracy unresolved |  |
| Beautiful Mermaid | 8 | 1.1.3 | 9 | 2 | 0 | 5 | 16 | 2026-10-31T09:28:24.742Z | Fewer verified (-2); accuracy unresolved |  |
| Loom renderer | 8 | 0.10.0 | 9 | 0 | 0 | 7 | 16 | 2026-10-31T09:28:24.742Z | Fewer verified (-2); accuracy unresolved |  |
| OpenCode Merman | 8 | 2.0.26 | 9 | 2 | 0 | 5 | 16 | 2026-10-31T09:28:24.742Z | Fewer verified (-2); accuracy unresolved |  |
| Figurehead | 11 | v0.4.3 | 5 | 5 | 0 | 6 | 16 | 2026-10-31T09:28:24.742Z | Fewer verified (-6); accuracy unresolved |  |
| Kitlangton Merman | 12 | 0.2.1 | 4 | 2 | 0 | 10 | 16 | 2026-10-31T09:28:24.742Z | Fewer verified (-7); accuracy unresolved |  |
| MermaidTUI | 13 | 0.0.6 | 3 | 11 | 0 | 2 | 16 | 2026-10-31T09:28:24.742Z | Fewer verified (-8); accuracy unresolved |  |
| Ondine | 13 | 0.0.3 | 3 | 0 | 0 | 13 | 16 | Unknown; recovered text, see receipt | Fewer verified (-8); accuracy unresolved |  |
| Crafter Mermaid | — | 0.0.3 | 0 | 0 | 0 | 16 | 16 | Unknown; recovered text, see receipt | Unresolved | Terminal source/display/drawing evidence is incomplete |
| Frankenmermaid | — | 0.4.0 | 0 | 0 | 0 | 16 | 16 | 2026-10-31T09:28:24.742Z | Unresolved | Terminal source/display/drawing evidence is incomplete |
| Grok renderer | — | git-2bdd1d6a6369 | 0 | 0 | 0 | 16 | 16 | 2026-10-31T09:28:24.742Z | Unresolved | Terminal source/display/drawing evidence is incomplete |
| Merslim | — | 0.2.3 | 0 | 0 | 0 | 16 | 16 | 2026-10-31T09:28:24.742Z | Unresolved | Terminal source/display/drawing evidence is incomplete |

### DaveBench: Documentation Examples

[All 6 ranked tables and recorded attempts](results/tables/docs.md)

<a id="run-22a4e4549a96ba57423ed301"></a>

**run-22a4e4549a96ba57423ed301** · 2026-10-31 · unit: reviewed documentation occurrences · [evidence](https://github.com/adewale/trident/blob/9a74e093893f45d5b1316912711c5314267acd69/evidence/1/report.json)

Corpus: reviewed 16-occurrence subset of 548 Mermaid documentation occurrences, bound to exact source hashes; SVG lane. This development-exposed profile ranks verified correct counts and keeps unresolved observations explicit. It supplies no full DaveBench accuracy, holdout or speed claim.

Ranked by **Correct / Planned reviewed**, highest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

Comparisons use **Correct** counts. “More verified” and “Fewer verified” mean accuracy is unresolved because either project has unknown outcomes. This is a comparison of the named metric, not overall project quality.

| Project | Rank | Version | Correct | Incorrect | Unknown | Planned reviewed | Measured | vs Mermaid |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mermaid | 1 | 12.2.0 | 16 | 0 | 0 | 16 | 2026-10-31T08:46:07.611Z | Baseline |
| Bezel | 2 | 0.2.21 | 15 | 0 | 1 | 16 | 2026-10-31T08:46:18.869Z | Fewer verified (-1); accuracy unresolved |
| Latias Merman | 2 | 0.9.2 | 15 | 1 | 0 | 16 | 2026-10-31T08:45:34.623Z | Lower (-1) |
| Ondine | 2 | 0.0.3 | 15 | 0 | 1 | 16 | 2026-10-31T08:41:13.074Z | Fewer verified (-1); accuracy unresolved |
| Pele | 2 | 1.9.0 | 15 | 0 | 1 | 16 | 2026-10-31T08:45:41.483Z | Fewer verified (-1); accuracy unresolved |
| Mermaid Dart | 6 | 0.3.2 | 13 | 1 | 2 | 16 | 2026-10-31T08:41:15.946Z | Fewer verified (-3); accuracy unresolved |
| Frankenmermaid | 7 | 0.4.0 | 12 | 3 | 1 | 16 | 2026-10-31T08:41:10.316Z | Fewer verified (-4); accuracy unresolved |
| Agentic Mermaid | 8 | 0.4.1 | 11 | 3 | 2 | 16 | 2026-10-31T08:41:23.617Z | Fewer verified (-5); accuracy unresolved |
| Zombie Mermaid | 9 | 5.10.2 | 10 | 3 | 3 | 16 | 2026-10-31T08:41:27.995Z | Fewer verified (-6); accuracy unresolved |
| Beautiful Mermaid | 10 | 1.1.3 | 7 | 5 | 4 | 16 | 2026-10-31T08:45:38.577Z | Fewer verified (-9); accuracy unresolved |
| Crafter Mermaid | 10 | 0.0.3 | 7 | 6 | 3 | 16 | 2026-10-31T08:41:37.803Z | Fewer verified (-9); accuracy unresolved |
| XMermaid | 12 | 0.4.2 | 3 | 1 | 12 | 16 | 2026-10-31T08:45:26.846Z | Fewer verified (-13); accuracy unresolved |
| DSH Mermaid GB SVG | 13 | 0.1.4 | 2 | 14 | 0 | 16 | 2026-10-31T08:45:43.786Z | Lower (-14) |
| Mermaid RS Renderer | 14 | 0.3.1 | 0 | 4 | 12 | 16 | 2026-10-31T08:41:33.205Z | Fewer verified (-16); accuracy unresolved |
| Merslim | 14 | 0.2.3 | 0 | 3 | 13 | 16 | 2026-10-31T09:56:18.944Z | Fewer verified (-16); accuracy unresolved |
| VitePress Plugin Diagram | 14 | 0.3.2 | 0 | 7 | 9 | 16 | 2026-10-31T08:45:28.688Z | Fewer verified (-16); accuracy unresolved |

<a id="run-87c7d06be3ec5a0cad582f61"></a>

**run-87c7d06be3ec5a0cad582f61** · 2026-10-31 · unit: reviewed documentation occurrences · [evidence](https://github.com/adewale/trident/blob/9a74e093893f45d5b1316912711c5314267acd69/evidence/1/report.json)

Corpus: reviewed 16-occurrence subset of 548 Mermaid documentation occurrences, bound to exact source hashes; PNG lane. This development-exposed profile ranks verified correct counts and keeps unresolved observations explicit. It supplies no full DaveBench accuracy, holdout or speed claim.

Ranked by **Correct / Planned reviewed**, highest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

Comparisons use **Correct** counts. “More verified” and “Fewer verified” mean accuracy is unresolved because either project has unknown outcomes. This is a comparison of the named metric, not overall project quality.

| Project | Rank | Version | Correct | Incorrect | Unknown | Planned reviewed | Measured | vs Mermaid |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bezel | 1 | 0.2.21 | 16 | 0 | 0 | 16 | 2026-10-31T08:49:07.186Z | Tie |
| Latias Merman | 1 | 0.9.2 | 16 | 0 | 0 | 16 | 2026-10-31T09:40:45.358Z | Tie |
| Mermaid | 1 | 12.2.0 | 16 | 0 | 0 | 16 | 2026-10-31T08:56:33.867Z | Baseline |
| Ondine | 1 | 0.0.3 | 16 | 0 | 0 | 16 | 2026-10-31T09:03:05.667Z | Tie |
| Pele | 1 | 1.9.0 | 16 | 0 | 0 | 16 | 2026-10-31T08:58:05.465Z | Tie |
| Mermaid Dart | 6 | 0.3.2 | 15 | 1 | 0 | 16 | 2026-10-31T08:59:37.784Z | Lower (-1) |
| Mermaid Flutter | 6 | 0.3.2 | 15 | 1 | 0 | 16 | 2026-10-31T09:01:36.559Z | Lower (-1) |
| Frankenmermaid | 8 | 0.4.0 | 13 | 3 | 0 | 16 | 2026-10-31T08:52:02.823Z | Lower (-3) |
| Agentic Mermaid | 9 | 0.4.1 | 11 | 3 | 2 | 16 | 2026-10-31T08:48:12.663Z | Fewer verified (-5); accuracy unresolved |
| Mermaid RS Renderer | 9 | 0.3.1 | 11 | 5 | 0 | 16 | 2026-10-31T08:47:02.466Z | Lower (-5) |
| Zombie Mermaid | 9 | 5.10.2 | 11 | 1 | 4 | 16 | 2026-10-31T08:50:12.754Z | Fewer verified (-5); accuracy unresolved |
| XMermaid | 12 | 0.4.2 | 9 | 2 | 5 | 16 | 2026-10-31T08:54:07.922Z | Fewer verified (-7); accuracy unresolved |
| Merslim | 13 | 0.2.3 | 8 | 5 | 3 | 16 | 2026-10-31T08:53:21.531Z | Fewer verified (-8); accuracy unresolved |
| Beautiful Mermaid | 14 | 1.1.3 | 7 | 4 | 5 | 16 | 2026-10-31T08:54:45.143Z | Fewer verified (-9); accuracy unresolved |
| Crafter Mermaid | 15 | 0.0.3 | 6 | 7 | 3 | 16 | 2026-10-31T08:49:40.606Z | Fewer verified (-10); accuracy unresolved |
| DSH Mermaid GB SVG | 16 | 0.1.4 | 4 | 12 | 0 | 16 | 2026-10-31T09:02:06.668Z | Lower (-12) |
| VitePress Plugin Diagram | 17 | 0.3.2 | 1 | 7 | 8 | 16 | 2026-10-31T08:54:29.717Z | Fewer verified (-15); accuracy unresolved |

### Mermaid Feature Cases

[All 1 ranked tables and recorded attempts](results/tables/fidelity.md)

<a id="run-cf2b690854ce0dd0739b1e75"></a>

**run-cf2b690854ce0dd0739b1e75** · 2026-10-31 · unit: authored diagrams · [evidence](https://github.com/adewale/trident/blob/9a74e093893f45d5b1316912711c5314267acd69/evidence/1/report.json)

Whole-diagram outcomes for the same authored case inventory and planned SVG checks. Public-model APIs confer no drawing credit. Ranks count verified correct diagrams; unknown observations leave complete accuracy unresolved. Raw criterion evidence remains in the owning report.

Ranked by **Correct**, highest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

Comparisons use **Correct** counts. “More verified” and “Fewer verified” mean accuracy is unresolved because either project has unknown outcomes. This is a comparison of the named metric, not overall project quality.

| Project | Rank | Version | Correct | Incorrect | Unsupported | Unknown | Planned | Measured | vs Mermaid |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mermaid | 1 | 12.2.0 | 62 | 6 | 0 | 32 | 100 | 2026-10-31T09:08:18.381Z | Baseline |
| Pele | 1 | 1.9.0 | 62 | 5 | 5 | 28 | 100 | 2026-10-31T09:07:54.583Z | Same verified count; accuracy unresolved |
| Bezel | 3 | 0.2.21 | 57 | 5 | 0 | 38 | 100 | 2026-10-31T09:08:26.640Z | Fewer verified (-5); accuracy unresolved |
| Ondine | 3 | 0.0.3 | 57 | 5 | 0 | 38 | 100 | 2026-10-31T09:03:51.945Z | Fewer verified (-5); accuracy unresolved |
| Frankenmermaid | 5 | 0.4.0 | 45 | 9 | 0 | 46 | 100 | 2026-10-31T09:03:43.264Z | Fewer verified (-17); accuracy unresolved |
| Latias Merman | 6 | 0.9.2 | 40 | 31 | 0 | 29 | 100 | 2026-10-31T09:07:41.590Z | Fewer verified (-22); accuracy unresolved |
| Agentic Mermaid | 7 | 0.4.1 | 38 | 5 | 0 | 57 | 100 | 2026-10-31T09:04:09.631Z | Fewer verified (-24); accuracy unresolved |
| Mermaid Dart | 8 | 0.3.2 | 29 | 14 | 0 | 57 | 100 | 2026-10-31T09:04:00.316Z | Fewer verified (-33); accuracy unresolved |
| Mermaid RS Renderer | 9 | 0.3.1 | 19 | 14 | 0 | 67 | 100 | 2026-10-31T09:04:24.304Z | Fewer verified (-43); accuracy unresolved |
| Zombie Mermaid | 10 | 5.10.2 | 13 | 6 | 0 | 81 | 100 | 2026-10-31T09:04:15.951Z | Fewer verified (-49); accuracy unresolved |
| XMermaid | 11 | 0.4.2 | 11 | 29 | 0 | 60 | 100 | 2026-10-31T09:07:27.517Z | Fewer verified (-51); accuracy unresolved |
| Beautiful Mermaid | 12 | 1.1.3 | 8 | 5 | 0 | 87 | 100 | 2026-10-31T09:07:46.020Z | Fewer verified (-54); accuracy unresolved |
| Crafter Mermaid | 13 | 0.0.3 | 7 | 85 | 0 | 8 | 100 | 2026-10-31T09:04:28.670Z | Fewer verified (-55); accuracy unresolved |
| Merslim | 14 | 0.2.3 | 6 | 26 | 0 | 68 | 100 | 2026-10-31T09:07:19.800Z | Fewer verified (-56); accuracy unresolved |
| DSH Mermaid GB SVG | 15 | 0.1.4 | 0 | 94 | 0 | 6 | 100 | 2026-10-31T09:08:01.704Z | Fewer verified (-62); accuracy unresolved |
| VitePress Plugin Diagram | 15 | 0.3.2 | 0 | 15 | 82 | 3 | 100 | 2026-10-31T09:07:30.915Z | Fewer verified (-62); accuracy unresolved |

### Public Model Contracts

[All 1 ranked tables and recorded attempts](results/tables/native-fidelity.md)

<a id="run-40cc1a5ead121ae9df015930"></a>

**run-40cc1a5ead121ae9df015930** · 2026-10-31 · unit: public-model cases · [evidence](https://github.com/adewale/trident/blob/9a74e093893f45d5b1316912711c5314267acd69/evidence/1/report.json)

Corpus: the same AM/Trident-authored feature cases, evaluated through public Node models. One correct case requires every declared native criterion. Missing projections remain unknown. These are optional model contracts, not drawing accuracy, editor integration or an overall renderer score.

Ranked by **Correct**, highest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

Comparisons use **Correct** counts. “More verified” and “Fewer verified” mean accuracy is unresolved because either project has unknown outcomes. This is a comparison of the named metric, not overall project quality.

| Project | Rank | Version | Correct | Incorrect | Unknown | Planned | Measured | vs Mermaid |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Pele | 1 | 1.9.0 | 94 | 0 | 6 | 100 | 2026-10-31T09:31:40.068Z | More verified (+4); accuracy unresolved |
| Mermaid | 2 | 12.2.0 | 90 | 0 | 10 | 100 | 2026-10-31T09:31:49.523Z | Baseline |
| Agentic Mermaid | 3 | 0.4.1 | 59 | 0 | 41 | 100 | 2026-10-31T09:31:33.634Z | Fewer verified (-31); accuracy unresolved |

## Campaign attempts

Latest attempts remain visible even when collection or qualification fails. Counts below are recorded observations, not inferred whole-diagram passes. Original inventories, protocols, timing qualification and failures remain in the owning evidence.

Per-project attempts, original failures and observation counts appear on each benchmark’s linked detail pages.

## Excluded catalog entries

These entries are omitted from normal ecosystem comparisons under the [lineage policy](LINEAGE.md). No parent score is substituted.

| Project | Reason |
| --- | --- |
| 01colyncelestine-stack/beautiful-mermaid | no-distinct-branding, zero-ahead-version |
| 2233admin/beautiful-mermaid | no-distinct-branding, zero-ahead-version |
| aj-archipelago/merval | catalog-only |
| akashacms/mermaid-wasm-renderer | no-distinct-branding, shared-engine-runtime-binding |
| app-creative/mermaid-ascii | no-distinct-branding, zero-ahead-version |
| Aurelian-Shuttleworth/mermaid-ascii | no-distinct-branding, zero-ahead-version |
| blackst0ne/mermaid | no-distinct-branding |
| CaptainCrouton89/mermaid-ascii | no-distinct-branding |
| catdevman/mermaid-ascii | no-distinct-branding, zero-ahead-version |
| chenyanchen/mermaid-formatter | catalog-only |
| Chronostasys/mermaid-ascii | no-distinct-branding |
| ColtWindy/mermaid-ascii | no-distinct-branding, zero-ahead-version |
| D3FEND Mermaid | zero-ahead-version |
| drunkhacker/mermaid-ascii | no-distinct-branding |
| dydoc/mermaid-ascii | no-distinct-branding, zero-ahead-version |
| excalidraw/mermaid-to-excalidraw | catalog-only |
| fdotu/beautiful-mermaid | no-distinct-branding, zero-ahead-version |
| gmh5225/beautiful-mermaid | no-distinct-branding, zero-ahead-version |
| gotoailab/modern_mermaid | application-workflow |
| HealthSamurai/beautiful-mermaid | no-distinct-branding, zero-ahead-version |
| inkeep/visimer | catalog-only |
| jacob-lcs/mermaid | no-distinct-branding |
| jeis4wpi/mermaid-ascii | no-distinct-branding, zero-ahead-version |
| jgraph/mermaid | no-distinct-branding |
| justsml/rusty-mermaid | non-renderer |
| kingsword09/mermansi | catalog-only |
| ktrysmt/beautiful-mermaid | no-distinct-branding |
| ktrysmt/mermaid-ascii | no-distinct-branding |
| leonj1/mermaid-ascii | no-distinct-branding, zero-ahead-version |
| lishid/mermaid | no-distinct-branding, zero-ahead-version |
| Lovely Mermaid | catalog-only |
| lyngai/mermaid | no-distinct-branding, zero-ahead-version |
| mbostock/mermaid | no-distinct-branding, zero-ahead-version |
| mdv | catalog-only |
| Mermaid-Chart/mermaid-develop | no-distinct-branding, zero-ahead-version |
| mermaid-js/mermaid-live-editor | application-workflow |
| Merman | zero-ahead-version |
| mopi1402/termaid | no-distinct-branding, zero-ahead-version |
| mopi1402/termaid-ts | no-distinct-branding |
| neongreen/mermaid-ast | catalog-only |
| NicolasNewman/mermaid | no-distinct-branding |
| OpenCode Merman | catalog-only |
| Orbiter/beautiful-mermaid-py | no-distinct-branding |
| pgavlin/mermaid-ascii | no-distinct-branding |
| Pi Mermaid TUI | shared-engine-runtime-binding |
| probelabs/maid | catalog-only |
| rohitg00/beautiful-mermaid | no-distinct-branding |
| sgryjp/mermaid-ascii | no-distinct-branding, zero-ahead-version |
| songshaodong/mermaid | no-distinct-branding, zero-ahead-version |
| Stars1233/beautiful-mermaid | no-distinct-branding, zero-ahead-version |
| taoche/mermaid-reactflow-render | catalog-only |
| theletterf/beautiful-mermaid | no-distinct-branding |
| thepanax/beautiful-mermaid | no-distinct-branding, zero-ahead-version |
| toeverything/mermaid-rs-renderer | no-distinct-branding |
| tomoyukim/vscode-mermaid-editor | application-workflow |
| TUI Mermaid | catalog-only |
| vercel-labs/beautiful-mermaid | no-distinct-branding |
| woxQAQ/mermaid-rs-render-js | no-distinct-branding, shared-engine-runtime-binding |
| xen3r0/mermaid | no-distinct-branding |
| xeolabs/mermaid | no-distinct-branding, zero-ahead-version |
| ysknsid25/beautiful-mermaid | no-distinct-branding |
| zakaria-forks/mermaid | no-distinct-branding, zero-ahead-version |

GitHub renders the Mermaid blocks. Tables carry the exact values and remain readable without charts. Chart syntax can be checked against GitHub’s installed Mermaid version using a `mermaid` block containing `info`.
