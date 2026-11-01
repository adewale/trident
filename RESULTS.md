# Mermaid ecosystem benchmark results

Last recorded measurement/update: **2026-11-01**. 184 imported project/benchmark attempts; 26 retained result tables.

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

Overview order: verified-count rank, DaveBench — Documentation Rendering, highest Correct first (2026-10-31). Ties share a rank. Projects with no result for this measure, or a newer superseding attempt, remain unranked below. Each benchmark has its own ranking. The overview’s ranked benchmark cell uses this same table and population.

| Project | Overview rank | Terminal Rendering | DaveBench SVG | DaveBench PNG | Rendering time by workload | Mermaid Public API Tests (diagnostic) | Mermaid Behaviour Tests |
|---|---|---|---|---|---|---|---|
| Mermaid | 1 | N/A | [330/546 verified; bounds 330–492/546 · 2026-10-31](#run-254dfd3bc1261d7b8e4edfc8) | [497/546 verified; bounds 497–502/546 · 2026-10-31](#run-4c98b569db43bffecf6f3193) | [b0-cost-png: recorded · 2026-11-01](results/tables/portable-1.md#b0-attempt-01e68c756a1e2e77e1726282); [b0-cost-svg: recorded · 2026-11-01](results/tables/portable-1.md#b0-attempt-788d08f017a088a5b6324051) | [recorded · 2026-11-01](results/tables/public-conformance-1.md#b0-attempt-2c24a046b6dffeecef27b80c) | [recorded · 2026-11-01](results/tables/mermaid-behaviour-1.md#attempt-9a2d3e780cf72b714690c46e) |
| Mermaid Flutter | 2 | N/A | N/A | [297/546 verified; bounds 297–309/546 · 2026-10-31](#run-4c98b569db43bffecf6f3193) | [recorded · 2026-11-01](results/tables/portable-1.md#b0-attempt-fb1efc2bf380563732294726) | Unmeasured: binding gap | Unmeasured: binding gap |
| Agentic Mermaid | — | [58/116 verified; bounds 58–100/116 · 2026-10-31](#run-3ffc7bedce92721e135091b1) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-25e1fa18a0d19eaed328aa46) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-25e1fa18a0d19eaed328aa46) | Unmeasured | [recorded · 2026-11-01](results/tables/public-conformance-1.md#b0-attempt-6e54b8ae6d480df0c61eb2dc) | [blocked · 2026-11-01](results/tables/mermaid-behaviour-1.md#attempt-9c8af2a2834cf9ee4b5c70f0) |
| ASCII Mermaid | — | [28/116 verified; bounds 28–79/116 · 2026-10-31](#run-3ffc7bedce92721e135091b1) | N/A | N/A | N/A | Unmeasured: binding gap | Unmeasured: binding gap |
| Beautiful Mermaid | — | [35/116 verified; bounds 35–94/116 · 2026-10-31](#run-3ffc7bedce92721e135091b1) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-9a96366653e648f12e77acbc) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-9a96366653e648f12e77acbc) | Unmeasured | Unmeasured: binding gap | Unmeasured: binding gap |
| Bezel | — | N/A | [failed · 2026-10-31](results/tables/docs-1.md#attempt-a6748232ce76288c20c61b31) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-a6748232ce76288c20c61b31) | Unmeasured: binding gap | Unmeasured: binding gap | Unmeasured: binding gap |
| Crafter Mermaid | — | [No verified terminal drawing observations · 2026-10-31](#run-3ffc7bedce92721e135091b1) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-e5ca8c8ca57bc72dd2071a6f) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-e5ca8c8ca57bc72dd2071a6f) | Unmeasured | Unmeasured: binding gap | Unmeasured: binding gap |
| DSH Mermaid GB SVG | — | N/A | [failed · 2026-10-31](results/tables/docs-1.md#attempt-469dcf8bd485eea7a5d83cff) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-469dcf8bd485eea7a5d83cff) | Unmeasured | Unmeasured: binding gap | Unmeasured: binding gap |
| Figurehead | — | [18/116 verified; bounds 18–89/116 · 2026-10-31](#run-3ffc7bedce92721e135091b1) | N/A | N/A | N/A | Unmeasured: binding gap | Unmeasured: binding gap |
| Frankenmermaid | — | [0/116 verified; bounds 0–115/116 · 2026-10-31](#run-3ffc7bedce92721e135091b1) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-61a0031e58fd695b92b4e474) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-61a0031e58fd695b92b4e474) | Unmeasured: binding gap | Unmeasured: binding gap | Unmeasured: binding gap |
| Grok renderer | — | [0/116 verified; bounds 0–93/116 · 2026-10-31](#run-3ffc7bedce92721e135091b1) | N/A | N/A | N/A | Unmeasured: binding gap | Unmeasured: binding gap |
| Kitlangton Merman | — | [16/116 verified; bounds 16–85/116 · 2026-10-31](#run-3ffc7bedce92721e135091b1) | N/A | N/A | N/A | Unmeasured: binding gap | Unmeasured: binding gap |
| Latias Merman | — | [No verified terminal drawing observations · 2026-10-31](#run-3ffc7bedce92721e135091b1) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-e18e34ca3933153fc166c7a1) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-e18e34ca3933153fc166c7a1) | Unmeasured | Unmeasured: binding gap | Unmeasured: binding gap |
| Loom renderer | — | [43/116 verified; bounds 43–90/116 · 2026-10-31](#run-3ffc7bedce92721e135091b1) | N/A | N/A | N/A | Unmeasured: binding gap | Unmeasured: binding gap |
| Mermaid ASCII | — | [42/116 verified; bounds 42–54/116 · 2026-10-31](#run-3ffc7bedce92721e135091b1) | N/A | N/A | [recorded · 2026-11-01](results/tables/portable-1.md#b0-attempt-ba629e0813ae752105d3059e) | Unmeasured: binding gap | Unmeasured: binding gap |
| Mermaid Dart | — | N/A | [failed · 2026-10-31](results/tables/docs-1.md#attempt-963caf565e2c5c904b69fcbd) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-963caf565e2c5c904b69fcbd) | Unmeasured: binding gap | Unmeasured: binding gap | Unmeasured: binding gap |
| Mermaid RS Renderer | — | N/A | [failed · 2026-10-31](results/tables/docs-1.md#attempt-c6c0f683ffdcb14ca3264a32) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-c6c0f683ffdcb14ca3264a32) | Unmeasured: binding gap | Unmeasured: binding gap | Unmeasured: binding gap |
| MermaidText | — | [40/116 verified; bounds 40–93/116 · 2026-10-31](#run-3ffc7bedce92721e135091b1) | N/A | N/A | N/A | Unmeasured: binding gap | Unmeasured: binding gap |
| MermaidTUI | — | [7/116 verified; bounds 7–110/116 · 2026-10-31](#run-3ffc7bedce92721e135091b1) | N/A | N/A | N/A | Unmeasured: binding gap | Unmeasured: binding gap |
| Merslim | — | [16/116 verified; bounds 16–69/116 · 2026-10-31](#run-3ffc7bedce92721e135091b1) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-3adecc711b1ff1bcba322613) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-3adecc711b1ff1bcba322613) | Unmeasured | Unmeasured: binding gap | Unmeasured: binding gap |
| Ondine | — | [No verified terminal drawing observations · 2026-10-31](#run-3ffc7bedce92721e135091b1) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-3cdb20cdfb3f304ac86acdc1) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-3cdb20cdfb3f304ac86acdc1) | Unmeasured | Unmeasured: binding gap | Unmeasured: binding gap |
| OpenCode Merman | — | [20/116 verified; bounds 20–84/116 · 2026-10-31](#run-3ffc7bedce92721e135091b1) | N/A | N/A | N/A | Unmeasured: binding gap | Unmeasured: binding gap |
| Pele | — | N/A | [failed · 2026-10-31](results/tables/docs-1.md#attempt-afe4ad86129eda1dd1b8dd92) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-afe4ad86129eda1dd1b8dd92) | [recorded · 2026-11-01](results/tables/portable-1.md#b0-attempt-8a5058429ae6e2615a186285) | Unmeasured: binding gap | Unmeasured: binding gap |
| Termaid | — | [65/116 verified; bounds 65–83/116 · 2026-10-31](#run-3ffc7bedce92721e135091b1) | N/A | N/A | [recorded · 2026-11-01](results/tables/portable-1.md#b0-attempt-ad0d55e6d45d3ff2ec2d82f4) | Unmeasured: binding gap | Unmeasured: binding gap |
| VitePress Plugin Diagram | — | N/A | [failed · 2026-10-31](results/tables/docs-1.md#attempt-8a387c1da46c6e082029ed61) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-8a387c1da46c6e082029ed61) | Unmeasured | Unmeasured: binding gap | Unmeasured: binding gap |
| XMermaid | — | N/A | [failed · 2026-10-31](results/tables/docs-1.md#attempt-3f636dcf3091a07bf7bbeeac) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-3f636dcf3091a07bf7bbeeac) | Unmeasured: binding gap | Unmeasured: binding gap | Unmeasured: binding gap |
| Zombie Mermaid | — | [60/116 verified; bounds 60–104/116 · 2026-10-31](#run-3ffc7bedce92721e135091b1) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-a5952a391fdae5adc7488a69) | [failed · 2026-10-31](results/tables/docs-1.md#attempt-a5952a391fdae5adc7488a69) | Unmeasured | Unmeasured: binding gap | Unmeasured: binding gap |

## Results by benchmark

Tables retain the full recorded populations. Charts show one named measure from the adjacent table; blocked, unavailable and failed checks remain visible in that table. Linked publications provide raw downloads; each table’s receipt identifies its owning evidence.

### Terminal Rendering

[All 5 tables and recorded attempts](results/tables/community.md)

<a id="run-3ffc7bedce92721e135091b1"></a>

**run-3ffc7bedce92721e135091b1** · 2026-10-31 · unit: terminal input cases · [evidence](results/current-outcomes-2026-11-01/receipt.json)

Current retained-evidence outcome reduction. Only the explicitly listed saved-output corrections use new observers/contracts; all other rows retain their original per-case epochs in the attached normal results. No new renderer/API calls. Full planned terminal drawing corpus, retaining unmeasured and unreviewed inputs. Corpus: 116 drawings from 120 selected source inputs in pinned terminal-project research, without selection on renderer outcomes. Any authored adaptations have separate content identities and independent source review. 1 source diagnostics are retained separately and receive no drawing score. Invalid-source controls are separate from drawing accuracy. Source/review hashes and all origins remain in the owning receipt. Ranks order verified correct counts only; unknown work prevents a complete accuracy claim. Mermaid source reference is unscored; no speed or aesthetics score.

Ranked by **Correct**, highest first. Equal values share a rank; unavailable values are unranked.

Ranks order verified correct counts once an outcome is resolved; observed zero remains ranked and fully unresolved rows are unranked. Observer coverage counts drawing and format verdicts. Correctness bounds include unresolved cases; overlapping bounds establish no accuracy winner. Unsupported inputs and proven renderer failures remain explicit non-successes on this corpus.

Comparisons claim superiority only when correctness bounds are disjoint; otherwise they describe verified-count differences. Mermaid has no terminal output; Mermaid ASCII is the terminal baseline.

| Project | Verified-count rank | Version | Correct | Incorrect drawing | Invalid format | Unsupported | Renderer failure | Unassessed | Unrun | Harness failure | Planned | Observer coverage (%) | Correctness lower (%) | Correctness upper (%) | Measured | vs Mermaid ASCII | Ranking note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Termaid | 1 | 0.10.0 | 65 | 33 | 0 | 0 | 0 | 18 | 0 | 0 | 116 | 84.5 | 56.0 | 71.6 | 2026-10-31T19:49:40.725094Z | Higher on this corpus (+23 verified); disjoint bounds |  |
| Zombie Mermaid | 2 | 5.10.2 | 60 | 12 | 0 | 0 | 0 | 44 | 0 | 0 | 116 | 62.1 | 51.7 | 89.7 | Unknown; recovered text, see receipt | Higher on this corpus (+18 verified); disjoint bounds |  |
| Agentic Mermaid | 3 | 0.4.1 | 58 | 16 | 0 | 0 | 0 | 42 | 0 | 0 | 116 | 63.8 | 50.0 | 86.2 | 2026-10-31T19:49:41.622Z | Higher on this corpus (+16 verified); disjoint bounds |  |
| Loom renderer | 4 | 0.10.0 | 43 | 26 | 0 | 0 | 0 | 47 | 0 | 0 | 116 | 59.5 | 37.1 | 77.6 | Unknown; recovered text, see receipt | More verified (+1); bounds overlap |  |
| Mermaid ASCII | 5 | 1.6.1 | 42 | 24 | 0 | 38 | 0 | 12 | 0 | 0 | 116 | 56.9 | 36.2 | 46.6 | 2026-10-31T19:49:40.519Z | Baseline |  |
| MermaidText | 6 | git-a6b0c7657b94 | 40 | 23 | 0 | 0 | 0 | 53 | 0 | 0 | 116 | 54.3 | 34.5 | 80.2 | Unknown; recovered text, see receipt | Fewer verified (-2); bounds overlap |  |
| Beautiful Mermaid | 7 | 1.1.3 | 35 | 22 | 0 | 0 | 0 | 59 | 0 | 0 | 116 | 49.1 | 30.2 | 81.0 | Unknown; recovered text, see receipt | Fewer verified (-7); bounds overlap |  |
| ASCII Mermaid | 8 | 0.1.0 | 28 | 37 | 0 | 0 | 0 | 51 | 0 | 0 | 116 | 56.0 | 24.1 | 68.1 | Unknown; recovered text, see receipt | Fewer verified (-14); bounds overlap |  |
| OpenCode Merman | 9 | 2.0.26 | 20 | 32 | 0 | 0 | 0 | 64 | 0 | 0 | 116 | 44.8 | 17.2 | 72.4 | Unknown; recovered text, see receipt | Fewer verified (-22); bounds overlap |  |
| Figurehead | 10 | v0.4.3 | 18 | 27 | 0 | 0 | 0 | 71 | 0 | 0 | 116 | 38.8 | 15.5 | 76.7 | Unknown; recovered text, see receipt | Fewer verified (-24); bounds overlap |  |
| Kitlangton Merman | 11 | 0.2.1 | 16 | 31 | 0 | 0 | 0 | 69 | 0 | 0 | 116 | 40.5 | 13.8 | 73.3 | Unknown; recovered text, see receipt | Fewer verified (-26); bounds overlap |  |
| Merslim | 11 | 0.2.3 | 16 | 47 | 0 | 0 | 0 | 53 | 0 | 0 | 116 | 54.3 | 13.8 | 59.5 | Unknown; recovered text, see receipt | Fewer verified (-26); bounds overlap |  |
| MermaidTUI | 13 | 0.0.6 | 7 | 6 | 0 | 0 | 0 | 103 | 0 | 0 | 116 | 11.2 | 6.0 | 94.8 | Unknown; recovered text, see receipt | Fewer verified (-35); bounds overlap |  |
| Frankenmermaid | 14 | 0.4.0 | 0 | 1 | 0 | 0 | 0 | 115 | 0 | 0 | 116 | 0.9 | 0.0 | 99.1 | Unknown; recovered text, see receipt | Fewer verified (-42); bounds overlap |  |
| Grok renderer | 14 | git-2bdd1d6a6369 | 0 | 23 | 0 | 0 | 0 | 93 | 0 | 0 | 116 | 19.8 | 0.0 | 80.2 | Unknown; recovered text, see receipt | Fewer verified (-42); bounds overlap |  |
| Crafter Mermaid | — | 0.0.3 | 0 | 0 | 0 | 0 | 0 | 116 | 0 | 0 | 116 | 0.0 | 0.0 | 100.0 | Unknown; recovered text, see receipt | Fewer verified (-42); bounds overlap | No verified terminal drawing observations |
| Latias Merman | — | 0.9.2 | 0 | 0 | 0 | 0 | 0 | 116 | 0 | 0 | 116 | 0.0 | 0.0 | 100.0 | Unknown; recovered text, see receipt | Fewer verified (-42); bounds overlap | No verified terminal drawing observations |
| Ondine | — | 0.0.3 | 0 | 0 | 0 | 0 | 0 | 116 | 0 | 0 | 116 | 0.0 | 0.0 | 100.0 | Unknown; recovered text, see receipt | Fewer verified (-42); bounds overlap | No verified terminal drawing observations |

### DaveBench — Documentation Rendering

[All 14 tables and recorded attempts](results/tables/docs.md)

<a id="run-254dfd3bc1261d7b8e4edfc8"></a>

**run-254dfd3bc1261d7b8e4edfc8** · 2026-10-31 · unit: documentation drawings · [evidence](results/current-outcomes-2026-11-01/receipt.json)

Current retained-evidence outcome reduction. Only the explicitly listed saved-output corrections use new observers/contracts; all other rows retain their original per-case epochs in the attached normal results. No new renderer/API calls. Corpus: the same pinned Mermaid documentation inventory. First-round actual SVG witnesses checked against source expectations. Shared SVG paint/meaning observer. Rank counts verified correct drawings out of 546; 1 configuration example(s) and 1 independently invalid-source control(s) are separate. Unassessed sources/observers, unrun work and typed failures remain separate. Bounds span unresolved cases only; observer coverage counts actual drawing or format verdicts. Overlapping bounds establish no accuracy winner. Complete accuracy requires zero unresolved cases; speed requires its own qualified timing evidence. Dates use the owning PNG-export calls; these companion SVGs have no independent SVG clock. Observer publication/recheck time is separate in campaignUpdatedAt.

Ranked by **Correct**, highest first. Equal values share a rank; unavailable values are unranked.

Ranks order verified correct counts once an outcome is resolved; observed zero remains ranked and fully unresolved rows are unranked. Observer coverage counts drawing and format verdicts. Correctness bounds include unresolved cases; overlapping bounds establish no accuracy winner. Unsupported inputs and proven renderer failures remain explicit non-successes on this corpus.

Comparisons claim superiority only when correctness bounds are disjoint; otherwise they describe verified-count differences. This is a comparison of the named metric, not overall project quality.

| Project | Verified-count rank | Version | Correct | Incorrect drawing | Invalid format | Unsupported | Renderer failure | Unassessed | Unrun | Harness failure | Planned drawings | Observer coverage (%) | Correctness lower (%) | Correctness upper (%) | Measured | vs Mermaid |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mermaid | 1 | 12.2.0 | 330 | 28 | 26 | 0 | 0 | 162 | 0 | 0 | 546 | 70.3 | 60.4 | 90.1 | 2026-10-31T20:31:37.517Z | Baseline |

<a id="run-4c98b569db43bffecf6f3193"></a>

**run-4c98b569db43bffecf6f3193** · 2026-10-31 · unit: documentation drawings · [evidence](results/current-outcomes-2026-11-01/receipt.json)

Current retained-evidence outcome reduction. Only the explicitly listed saved-output corrections use new observers/contracts; all other rows retain their original per-case epochs in the attached normal results. No new renderer/API calls. Corpus: the same pinned Mermaid documentation inventory. First-round actual PNG witnesses checked against source expectations. PNG content reviews bind actual image, source and expected-fact hashes; SVG and nonblank checks supply no raster correctness credit. Rank counts verified correct drawings out of 546; 1 configuration example(s) and 1 independently invalid-source control(s) are separate. Unassessed sources/observers, unrun work and typed failures remain separate. Bounds span unresolved cases only; observer coverage counts actual drawing or format verdicts. Overlapping bounds establish no accuracy winner. Complete accuracy requires zero unresolved cases; speed requires its own qualified timing evidence.

Ranked by **Correct**, highest first. Equal values share a rank; unavailable values are unranked.

Ranks order verified correct counts once an outcome is resolved; observed zero remains ranked and fully unresolved rows are unranked. Observer coverage counts drawing and format verdicts. Correctness bounds include unresolved cases; overlapping bounds establish no accuracy winner. Unsupported inputs and proven renderer failures remain explicit non-successes on this corpus.

Comparisons claim superiority only when correctness bounds are disjoint; otherwise they describe verified-count differences. This is a comparison of the named metric, not overall project quality.

| Project | Verified-count rank | Version | Correct | Incorrect drawing | Invalid format | Unsupported | Renderer failure | Unassessed | Unrun | Harness failure | Planned drawings | Observer coverage (%) | Correctness lower (%) | Correctness upper (%) | Measured | vs Mermaid |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mermaid | 1 | 12.2.0 | 497 | 44 | 0 | 0 | 0 | 5 | 0 | 0 | 546 | 99.1 | 91.0 | 91.9 | 2026-10-31T20:31:37.517Z | Baseline |
| Mermaid Flutter | 2 | 0.3.2 | 297 | 138 | 0 | 78 | 21 | 12 | 0 | 0 | 546 | 79.7 | 54.4 | 56.6 | 2026-10-31T09:01:40.231Z | Lower on this corpus (-200 verified); disjoint bounds |

### Harness and Observer Regressions (unscored)

[All 1 tables and recorded attempts](results/tables/fidelity.md)

### Public Model Regressions (unscored)

[All 1 tables and recorded attempts](results/tables/native-fidelity.md)

### Rendering time by workload

[All 3 tables and recorded attempts](results/tables/portable.md)

### Mermaid Public API Tests (diagnostic)

[All 1 tables and recorded attempts](results/tables/public-conformance.md)

### Mermaid Behaviour Tests

[All 1 tables and recorded attempts](results/tables/mermaid-behaviour.md)

<a id="run-31502e3c9d8f57f2c2ee6d1e"></a>

**run-31502e3c9d8f57f2c2ee6d1e** · 2026-10-31 · unit: whole observable behaviour cases · [evidence](results/mermaid-behaviour-2026-11-01/receipt.json)

Corpus: 49 whole source-derived observable behaviours from pinned Mermaid 1fb7869866dd619168d840291c9c54b4f129758b. Every ordered stimulus and declared check in a case must pass; detail checks are not extra votes. Source adaptations compare explicit diagram-family aliases and static SVG accessible naming through native public returns, without private model/API-shape requirements. Unavailable and unrun observations remain unresolved, not unsupported or failed. Actual Mermaid reference qualification: qualified; its actual artifact and raw checks remain in the owning evidence, and no reference target row is invented. Dates use the retained owning public-call collection or native invocation journal; targets without recorded calls keep an unknown clock. If no call clock exists, the table date is explicitly the assessment publication date. Assessment publication: 2026-11-01T08:42:38.604Z. This finite corpus supplies no whole-library conformance, drawing-accuracy or timing claim.

Ranked by **Passed**, highest first. Equal values share a rank; unavailable values are unranked.

Comparisons use whole-case verified pass counts. Unavailable or unrun cases leave outcomes unresolved; a count lead is not an overall quality claim. This is a comparison of the named metric, not overall project quality.

| Project | Verified-count rank | Version | Passed | Failed | Unavailable | Unrun | Planned | Measured | vs Mermaid |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mermaid | 1 | 12.2.0 | 49 | 0 | 0 | 0 | 49 | 2026-10-31T19:15:43.111Z | Baseline |
| Agentic Mermaid | 2 | 0.4.1 | 29 | 0 | 20 | 0 | 49 | 2026-10-31T19:15:43.111Z | Fewer verified (-20); outcome unresolved |

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
