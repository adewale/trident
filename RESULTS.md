# Mermaid ecosystem benchmark results

Last recorded measurement/update: **2026-11-01**. 161 imported project/benchmark attempts; 22 retained result tables.

**Historical** marks retained measurements collected before the current reporting work. **Source candidates** are unreleased builds, ranked only within their own comparison tables; they do not replace release scores in the overview. This page is a rolling view across dated runs, not one matched ecosystem experiment. Regenerating it runs no benchmarks and does not qualify old outputs against newer source contracts or observers. Dates, versions, interfaces and qualification belong to each table.

[Machine-readable results](results/latest.json) · [Benchmark methods](BENCHMARKS.md) · [Reading the tables](REPORTING.md) · [Update this page](results/README.md)

[Frozen reference baseline](results/baseline.json) · input and outcome hashes are checked with these results.

[Current minimum-cohort verified counts — 31 October qualification; no repeated 27-project campaign](docs/qualification-results-2026-10-31.md)

[31 October campaign: raw archive and checksums](https://github.com/adewale/trident/releases/tag/ecosystem-evidence-2026-10-31)

[31 October campaign: sources, reviewed images and repair receipts](https://github.com/adewale/trident/tree/9a74e093893f45d5b1316912711c5314267acd69)

[Previous ecosystem overview and dated diagnostic studies](https://github.com/adewale/trident/blob/b555992271eef91a5b57ab7c584ac4b0b6552554/RESULTS.md)

## Ecosystem overview

27 eligible projects are listed below. 62 catalog entries outside core comparison scope are listed separately. Results are never inherited through lineage.

Each cell links its latest recorded attempt, or a dated retained table. New failed, blocked and partial attempts take precedence over earlier tables. Different suites have different units; there is no combined score. “Unmeasured” is missing evidence; “N/A” follows the declared output or reference scope, not a measured failure.

Overview order: DaveBench: Documentation Examples, highest Correct first (2026-10-31). Ties share a rank. Projects with no result for this measure, or a newer superseding attempt, remain unranked below. Each benchmark has its own ranking. The overview’s ranked benchmark cell uses this same table and population.

| Project | Overview rank | Terminal Rendering | DaveBench SVG | DaveBench PNG | Public Model Contracts | Render Cost and Scaling | Mermaid Public API Tests (diagnostic) |
|---|---|---|---|---|---|---|---|
| Mermaid | 1 | N/A | [59.9% · 2026-10-31](#run-655e65f422c8fd4dfc06c98e) | [91.0% · 2026-10-31](#run-0f56c6cfd1a4a911414d4c95) | [90/100 · 2026-10-31](#run-40cc1a5ead121ae9df015930) | [b0-cost-png: recorded · 2026-11-01](results/tables/portable-1.md#b0-attempt-01e68c756a1e2e77e1726282); [b0-cost-svg: recorded · 2026-11-01](results/tables/portable-1.md#b0-attempt-788d08f017a088a5b6324051) | [154/154 public callbacks passed · 2026-10-31](#public-tests-c3939522719cf814e30c57c5) |
| Mermaid Flutter | 2 | N/A | N/A | [54.6% · 2026-10-31](#run-0f56c6cfd1a4a911414d4c95) | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-0d01a0cbb3308948bd8913c1) | [recorded · 2026-11-01](results/tables/portable-1.md#b0-attempt-fb1efc2bf380563732294726) | Unmeasured: binding gap |
| Agentic Mermaid | — | [58/116 · 2026-10-31](#run-b752c2d303f711b51ca464f0) | [62.0% · 2026-10-31](results/tables/docs-1.md#run-8d55a6fb4a81c18aed400c58) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-25e1fa18a0d19eaed328aa46) | [59/100 · 2026-10-31](#run-40cc1a5ead121ae9df015930) | Unmeasured | [59/154 public callbacks passed · 2026-10-31](#public-tests-c3939522719cf814e30c57c5) |
| ASCII Mermaid | — | [28/116 · 2026-10-31](#run-b752c2d303f711b51ca464f0) | N/A | N/A | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-4125b8c197717d32309d6bd8) | N/A | Unmeasured: binding gap |
| Beautiful Mermaid | — | [35/116 · 2026-10-31](#run-b752c2d303f711b51ca464f0) | [42.2% · 2026-10-31](results/tables/docs-1.md#run-8d55a6fb4a81c18aed400c58) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-9a96366653e648f12e77acbc) | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-c9cc899e27c54f849e34ad9f) | Unmeasured | Unmeasured: binding gap |
| Bezel | — | N/A | [97.1% · 2026-10-31](results/tables/docs-1.md#run-8d55a6fb4a81c18aed400c58) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-a6748232ce76288c20c61b31) | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-9f327ddcc19156fba3ba33c5) | Unmeasured: binding gap | Unmeasured: binding gap |
| Crafter Mermaid | — | [No verified terminal drawing observations · 2026-10-31](#run-b752c2d303f711b51ca464f0) | [39.4% · 2026-10-31](results/tables/docs-1.md#run-8d55a6fb4a81c18aed400c58) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-e5ca8c8ca57bc72dd2071a6f) | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-f16015a46f36e5ae28eecefe) | Unmeasured | Unmeasured: binding gap |
| DSH Mermaid GB SVG | — | N/A | [100.0% · 2026-10-31](results/tables/docs-1.md#run-8d55a6fb4a81c18aed400c58) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-469dcf8bd485eea7a5d83cff) | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-b4c107b6627f5a5ccd01e223) | Unmeasured | Unmeasured: binding gap |
| Figurehead | — | [18/116 · 2026-10-31](#run-b752c2d303f711b51ca464f0) | N/A | N/A | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-5e0af5a369d49dd95407706e) | N/A | Unmeasured: binding gap |
| Frankenmermaid | — | [0/116 · 2026-10-31](#run-b752c2d303f711b51ca464f0) | [100.0% · 2026-10-31](results/tables/docs-1.md#run-8d55a6fb4a81c18aed400c58) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-61a0031e58fd695b92b4e474) | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-e2276dfc9ed8fbbf893c2675) | Unmeasured: binding gap | Unmeasured: binding gap |
| Grok renderer | — | [0/116 · 2026-10-31](#run-b752c2d303f711b51ca464f0) | N/A | N/A | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-f5187dc05f4ad78f543a369c) | N/A | Unmeasured: binding gap |
| Kitlangton Merman | — | [15/116 · 2026-10-31](#run-b752c2d303f711b51ca464f0) | N/A | N/A | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-a6e38219c2ad77c4359b1bf8) | N/A | Unmeasured: binding gap |
| Latias Merman | — | [No verified terminal drawing observations · 2026-10-31](#run-b752c2d303f711b51ca464f0) | [100.0% · 2026-10-31](results/tables/docs-1.md#run-8d55a6fb4a81c18aed400c58) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-e18e34ca3933153fc166c7a1) | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-7a10e33a040fd6e8af1c4b3c) | Unmeasured | Unmeasured: binding gap |
| Loom renderer | — | [43/116 · 2026-10-31](#run-b752c2d303f711b51ca464f0) | N/A | N/A | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-bf0e083c34d4b31f6004da9b) | N/A | Unmeasured: binding gap |
| Mermaid ASCII | — | [42/116 · 2026-10-31](#run-b752c2d303f711b51ca464f0) | N/A | N/A | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-cd51ae7565e28fb5df2edd2d) | [recorded · 2026-11-01](results/tables/portable-1.md#b0-attempt-ba629e0813ae752105d3059e) | Unmeasured: binding gap |
| Mermaid Dart | — | N/A | [81.9% · 2026-10-31](results/tables/docs-1.md#run-8d55a6fb4a81c18aed400c58) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-963caf565e2c5c904b69fcbd) | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-a4b188db5e6b02f0865d0b2a) | Unmeasured: binding gap | Unmeasured: binding gap |
| Mermaid RS Renderer | — | N/A | [97.6% · 2026-10-31](results/tables/docs-1.md#run-8d55a6fb4a81c18aed400c58) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-c6c0f683ffdcb14ca3264a32) | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-016de9af9b4f74ad3eb22810) | Unmeasured: binding gap | Unmeasured: binding gap |
| MermaidText | — | [40/116 · 2026-10-31](#run-b752c2d303f711b51ca464f0) | N/A | N/A | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-4220435f2c077b0a18796f86) | N/A | Unmeasured: binding gap |
| MermaidTUI | — | [7/116 · 2026-10-31](#run-b752c2d303f711b51ca464f0) | N/A | N/A | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-b970cdb7d3726135f6edd82b) | N/A | Unmeasured: binding gap |
| Merslim | — | [16/116 · 2026-10-31](#run-b752c2d303f711b51ca464f0) | [52.2% · 2026-10-31](results/tables/docs-1.md#run-8d55a6fb4a81c18aed400c58) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-3adecc711b1ff1bcba322613) | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-ed449b04289130cced66dcf6) | Unmeasured | Unmeasured: binding gap |
| Ondine | — | [No verified terminal drawing observations · 2026-10-31](#run-b752c2d303f711b51ca464f0) | [97.1% · 2026-10-31](results/tables/docs-1.md#run-8d55a6fb4a81c18aed400c58) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-3cdb20cdfb3f304ac86acdc1) | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-59ac78754e258eadbd1259af) | Unmeasured | Unmeasured: binding gap |
| OpenCode Merman | — | [19/116 · 2026-10-31](#run-b752c2d303f711b51ca464f0) | N/A | N/A | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-52080b201381ae53f6da6574) | N/A | Unmeasured: binding gap |
| Pele | — | N/A | [97.1% · 2026-10-31](results/tables/docs-1.md#run-8d55a6fb4a81c18aed400c58) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-afe4ad86129eda1dd1b8dd92) | [94/100 · 2026-10-31](#run-40cc1a5ead121ae9df015930) | [recorded · 2026-11-01](results/tables/portable-1.md#b0-attempt-8a5058429ae6e2615a186285) | Unmeasured: binding gap |
| Termaid | — | [65/116 · 2026-10-31](#run-b752c2d303f711b51ca464f0) | N/A | N/A | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-857417fea8907047551b5b64) | [recorded · 2026-11-01](results/tables/portable-1.md#b0-attempt-ad0d55e6d45d3ff2ec2d82f4) | Unmeasured: binding gap |
| VitePress Plugin Diagram | — | N/A | [33.4% · 2026-10-31](results/tables/docs-1.md#run-8d55a6fb4a81c18aed400c58) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-8a387c1da46c6e082029ed61) | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-a823e4d074433abbd789ad70) | Unmeasured | Unmeasured: binding gap |
| XMermaid | — | N/A | [48.2% · 2026-10-31](results/tables/docs-1.md#run-8d55a6fb4a81c18aed400c58) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-3f636dcf3091a07bf7bbeeac) | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-044d0f555cf3c5ab40bd628d) | Unmeasured: binding gap | Unmeasured: binding gap |
| Zombie Mermaid | — | [60/116 · 2026-10-31](#run-b752c2d303f711b51ca464f0) | [44.7% · 2026-10-31](results/tables/docs-1.md#run-8d55a6fb4a81c18aed400c58) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-a5952a391fdae5adc7488a69) | [blocked · 2026-10-31](results/tables/native-fidelity-1.md#attempt-e92381022b2e0b57671545fb) | Unmeasured | Unmeasured: binding gap |

## Results by benchmark

Tables retain the full recorded populations. Charts show one named measure from the adjacent table; blocked, unavailable and failed checks remain visible in that table. Linked publications provide raw downloads; each table’s receipt identifies its owning evidence.

### Terminal Rendering

[All 4 tables and recorded attempts](results/tables/community.md)

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

<a id="run-b752c2d303f711b51ca464f0"></a>

**run-b752c2d303f711b51ca464f0** · 2026-10-31 · unit: terminal input cases · [evidence](docs/evidence/b0/receipt.json)

Frozen B0; exact input, contract epochs and owned outcomes are in the B0 receipt. Full planned terminal drawing corpus, retaining unmeasured and unreviewed inputs. Corpus: 116 drawings from 120 selected source inputs in pinned terminal-project research, without selection on renderer outcomes. Any authored adaptations have separate content identities and independent source review. 1 source diagnostics are retained separately and receive no drawing score. Invalid-source controls are separate from drawing accuracy. Source/review hashes and all origins remain in the owning receipt. Ranks order verified correct counts only; unknown work prevents a complete accuracy claim. Mermaid source reference is unscored; no speed or aesthetics score.

Ranked by **Correct**, highest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

Comparisons use **Correct** counts. “More verified” and “Fewer verified” mean accuracy is unresolved because either project has unknown outcomes. Mermaid has no terminal output; Mermaid ASCII is the terminal baseline.

| Project | Rank | Version | Correct | Incorrect | Unsupported | Unknown | Planned | Measured | vs Mermaid ASCII | Ranking note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Termaid | 1 | 0.10.0 | 65 | 33 | 0 | 18 | 116 | 2026-10-31T19:49:40.725094Z | More verified (+23); accuracy unresolved |  |
| Zombie Mermaid | 2 | 5.10.2 | 60 | 12 | 0 | 44 | 116 | Unknown; recovered text, see receipt | More verified (+18); accuracy unresolved |  |
| Agentic Mermaid | 3 | 0.4.1 | 58 | 16 | 0 | 42 | 116 | 2026-10-31T19:49:41.622Z | More verified (+16); accuracy unresolved |  |
| Loom renderer | 4 | 0.10.0 | 43 | 26 | 0 | 47 | 116 | Unknown; recovered text, see receipt | More verified (+1); accuracy unresolved |  |
| Mermaid ASCII | 5 | 1.6.1 | 42 | 24 | 38 | 12 | 116 | 2026-10-31T19:49:40.519Z | Baseline |  |
| MermaidText | 6 | git-a6b0c7657b94 | 40 | 23 | 0 | 53 | 116 | Unknown; recovered text, see receipt | Fewer verified (-2); accuracy unresolved |  |
| Beautiful Mermaid | 7 | 1.1.3 | 35 | 22 | 0 | 59 | 116 | Unknown; recovered text, see receipt | Fewer verified (-7); accuracy unresolved |  |
| ASCII Mermaid | 8 | 0.1.0 | 28 | 37 | 0 | 51 | 116 | Unknown; recovered text, see receipt | Fewer verified (-14); accuracy unresolved |  |
| OpenCode Merman | 9 | 2.0.26 | 19 | 32 | 0 | 65 | 116 | Unknown; recovered text, see receipt | Fewer verified (-23); accuracy unresolved |  |
| Figurehead | 10 | v0.4.3 | 18 | 27 | 0 | 71 | 116 | Unknown; recovered text, see receipt | Fewer verified (-24); accuracy unresolved |  |
| Merslim | 11 | 0.2.3 | 16 | 47 | 0 | 53 | 116 | Unknown; recovered text, see receipt | Fewer verified (-26); accuracy unresolved |  |
| Kitlangton Merman | 12 | 0.2.1 | 15 | 31 | 0 | 70 | 116 | Unknown; recovered text, see receipt | Fewer verified (-27); accuracy unresolved |  |
| MermaidTUI | 13 | 0.0.6 | 7 | 6 | 0 | 103 | 116 | Unknown; recovered text, see receipt | Fewer verified (-35); accuracy unresolved |  |
| Crafter Mermaid | — | 0.0.3 | 0 | 0 | 0 | 116 | 116 | Unknown; recovered text, see receipt | Unresolved | No verified terminal drawing observations |
| Frankenmermaid | 14 | 0.4.0 | 0 | 1 | 0 | 115 | 116 | Unknown; recovered text, see receipt | Fewer verified (-42); accuracy unresolved |  |
| Grok renderer | 14 | git-2bdd1d6a6369 | 0 | 23 | 0 | 93 | 116 | Unknown; recovered text, see receipt | Fewer verified (-42); accuracy unresolved |  |
| Latias Merman | — | 0.9.2 | 0 | 0 | 0 | 116 | 116 | Unknown; recovered text, see receipt | Unresolved | No verified terminal drawing observations |
| Ondine | — | 0.0.3 | 0 | 0 | 0 | 116 | 116 | Unknown; recovered text, see receipt | Unresolved | No verified terminal drawing observations |

### DaveBench: Documentation Examples

[All 12 tables and recorded attempts](results/tables/docs.md)

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

<a id="run-655e65f422c8fd4dfc06c98e"></a>

**run-655e65f422c8fd4dfc06c98e** · 2026-10-31 · unit: documentation drawings · [evidence](docs/evidence/b0/receipt.json)

Frozen B0; exact input, contract epochs and owned outcomes are in the B0 receipt. Corpus: the same pinned Mermaid documentation inventory. First-round actual SVG witnesses checked against source expectations. Shared SVG paint/meaning observer. Rank counts verified correct drawings out of 546; 1 configuration example(s) and 1 independently invalid-source control(s) are separate. Unknown sources/observers remain visible. Complete accuracy requires zero unknowns; speed requires its own qualified timing evidence. Dates use the owning PNG-export calls; these companion SVGs have no independent SVG clock. Observer publication/recheck time is separate in campaignUpdatedAt.

Ranked by **Correct**, highest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

Comparisons use **Correct** counts. “More verified” and “Fewer verified” mean accuracy is unresolved because either project has unknown outcomes. This is a comparison of the named metric, not overall project quality.

| Project | Rank | Version | Correct | Incorrect | Unknown | Planned drawings | Measured | vs Mermaid |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mermaid | 1 | 12.2.0 | 327 | 54 | 165 | 546 | 2026-10-31T20:31:37.517Z | Baseline |

<a id="run-0f56c6cfd1a4a911414d4c95"></a>

**run-0f56c6cfd1a4a911414d4c95** · 2026-10-31 · unit: documentation drawings · [evidence](docs/evidence/b0/receipt.json)

Frozen B0; exact input, contract epochs and owned outcomes are in the B0 receipt. Corpus: the same pinned Mermaid documentation inventory. First-round actual PNG witnesses checked against source expectations. PNG content reviews bind actual image, source and expected-fact hashes; SVG and nonblank checks supply no raster correctness credit. Rank counts verified correct drawings out of 546; 1 configuration example(s) and 1 independently invalid-source control(s) are separate. Unknown sources/observers remain visible. Complete accuracy requires zero unknowns; speed requires its own qualified timing evidence.

Ranked by **Correct**, highest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

Comparisons use **Correct** counts. “More verified” and “Fewer verified” mean accuracy is unresolved because either project has unknown outcomes. This is a comparison of the named metric, not overall project quality.

| Project | Rank | Version | Correct | Incorrect | Unknown | Planned drawings | Measured | vs Mermaid |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mermaid | 1 | 12.2.0 | 497 | 44 | 5 | 546 | 2026-10-31T20:31:37.517Z | Baseline |
| Mermaid Flutter | 2 | 0.3.2 | 298 | 137 | 111 | 546 | 2026-10-31T09:01:40.231Z | Fewer verified (-199); accuracy unresolved |

### Harness and Observer Regressions (unscored)

[All 1 tables and recorded attempts](results/tables/fidelity.md)

### Public Model Contracts

[All 1 tables and recorded attempts](results/tables/native-fidelity.md)

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

### Render Cost and Scaling

[All 3 tables and recorded attempts](results/tables/portable.md)

### Mermaid Public API Tests (diagnostic)

[All 1 tables and recorded attempts](results/tables/public-conformance.md)

<a id="public-tests-c3939522719cf814e30c57c5"></a>

**public-tests-c3939522719cf814e30c57c5** · 2026-10-31 · **Diagnostic subset** · unit: original public test callbacks · [evidence](docs/evidence/b0/receipt.json)

Frozen B0; exact input, contract epochs and owned outcomes are in the B0 receipt. Diagnostic public API subset: 154 expanded callbacks from 37 eligible declarations; 4060 original declarations in 368 files. Corpus: unchanged Mermaid tests at 1fb7869866dd619168d840291c9c54b4f129758b. Original and delegated public Mermaid controls both pass every selected callback. This complete selected scope joins disjoint retained callback scopes; every parent native receipt, callback, producer and public invocation is revalidated without new API calls. Original assertions retain exact diagnostic wording, configuration expectations, accessibility roles and caller-ID conventions, including upstream jsdom geometry mocks. Public parse returns/configuration are snapshotted as JSON before assertions, with explicit loss for unserializable values; invocation events are fsynced. The uninstrumented original control retains native callback outcomes. This is strict API compatibility, not drawing accuracy, speed or whole-suite conformance. Binding gaps include unavailable public fields and incomplete invocation evidence. Unmeasured projects receive no zero.

Ranked by **Passed / Planned eligible**, highest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

“Higher” and “Lower” compare **Passed** on this population. Unknown evidence remains unresolved. This is a comparison of the named metric, not overall project quality.

| Project | Rank | Version | Passed | Failed | Unsupported | Binding gaps | Planned eligible | Public scope | Total declarations | vs Mermaid |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mermaid | 1 | 12.2.0 | 154 | 0 | 0 | 0 | 154 | 102 parse; 32 detection; 19 accessibility render; 1 generic SVG render (24 inner sources) | 4060 | Baseline |
| Agentic Mermaid | 2 | 0.4.1 | 59 | 27 | 63 | 5 | 154 | 102 parse; 32 detection; 19 accessibility render; 1 generic SVG render (24 inner sources) | 4060 | Lower (-95) |

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
