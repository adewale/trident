# Mermaid ecosystem benchmark results

Last recorded measurement/update: **2026-11-01**. 92 imported project/benchmark attempts; 16 retained result tables.

**Historical** marks retained measurements collected before the current reporting work. **Source candidates** are unreleased builds, ranked only within their own comparison tables; they do not replace release scores in the overview. This page is a rolling view across dated runs, not one matched ecosystem experiment. Regenerating it runs no benchmarks and does not qualify old outputs against newer source contracts or observers. Dates, versions, interfaces and qualification belong to each table.

[Machine-readable results](results/latest.json) · [Benchmark methods](BENCHMARKS.md) · [Reading the tables](REPORTING.md) · [Update this page](results/README.md)

[Complete raw archive and checksums](https://github.com/adewale/trident/releases/tag/ecosystem-evidence-2026-11-01)

[Source versions, report receipts and scoped timing](https://github.com/adewale/trident/tree/2c464366c5f05c01b29e41993a64e1eddb77be58)

## Ecosystem overview

27 eligible projects are listed below. 62 catalog entries outside core comparison scope are listed separately. Results are never inherited through lineage.

Each cell links its latest recorded attempt, or a dated retained table. New failed, blocked and partial attempts take precedence over earlier tables. Different suites have different units; there is no combined score. “Unmeasured” is missing evidence; “N/A” follows the declared output or reference scope, not a measured failure.

Overview order: verified-count rank, DaveBench — Documentation Rendering, highest Correct first (2026-11-01). Ties share a rank. Projects with no result for this measure, or a newer superseding attempt, remain unranked below. Each benchmark has its own ranking. The overview’s ranked benchmark cell uses this same table and population.

| Project | Overview rank | Terminal Rendering | DaveBench SVG | DaveBench PNG | Rendering time by workload | Mermaid Behaviour Tests |
|---|---|---|---|---|---|---|
| Mermaid | 1 | N/A | [331/546 verified; bounds 331–492/546 · 2026-11-01](#run-c69b61e4228a0b2c9388923a) | [431/546 verified; bounds 431–503/546 · 2026-11-01](#run-0ed76179c115bf2cd81ed5c5) | [blocked · 2026-11-01](results/tables/portable-1.md#attempt-517654031336cc946c6ca0a3) | [49/49 · 2026-11-01](#run-d633d9462dda6970cc8b462b) |
| Latias Merman | 2 | [No verified terminal drawing observations · 2026-11-01](#run-f713bed5d1748b27fd042e31) | [240/546 verified; bounds 240–491/546 · 2026-11-01](#run-c69b61e4228a0b2c9388923a) | [94/546 verified; bounds 94–536/546 · 2026-11-01](#run-0ed76179c115bf2cd81ed5c5) | Unmeasured | [18/49 · 2026-11-01](#run-d633d9462dda6970cc8b462b) |
| Bezel | 3 | N/A | [238/546 verified; bounds 238–497/546 · 2026-11-01](#run-c69b61e4228a0b2c9388923a) | [No verified drawing-content observations · 2026-11-01](#run-0ed76179c115bf2cd81ed5c5) | [recorded · 2026-11-01](results/tables/portable-1.md#attempt-44d698f5558cb61eca8063a5) | [19/49 · 2026-11-01](#run-d633d9462dda6970cc8b462b) |
| Pele | 3 | N/A | [238/546 verified; bounds 238–497/546 · 2026-11-01](#run-c69b61e4228a0b2c9388923a) | [No verified drawing-content observations · 2026-11-01](#run-0ed76179c115bf2cd81ed5c5) | [blocked · 2026-11-01](results/tables/portable-1.md#attempt-38637b67d8e4c91e1f92f785) | [49/49 · 2026-11-01](#run-d633d9462dda6970cc8b462b) |
| Ondine | 5 | [31/116 verified; bounds 31–90/116 · 2026-11-01](#run-f713bed5d1748b27fd042e31) | [236/546 verified; bounds 236–498/546 · 2026-11-01](#run-c69b61e4228a0b2c9388923a) | [No verified drawing-content observations · 2026-11-01](#run-0ed76179c115bf2cd81ed5c5) | [recorded · 2026-11-01](results/tables/portable-1.md#attempt-b44b53c14f5a46ae83565cde) | [19/49 · 2026-11-01](#run-d633d9462dda6970cc8b462b) |
| Mermaid Dart | 6 | N/A | [146/546 verified; bounds 146–430/546 · 2026-11-01](#run-c69b61e4228a0b2c9388923a) | [No verified drawing-content observations · 2026-11-01](#run-0ed76179c115bf2cd81ed5c5) | Unmeasured: binding gap | [0/49 · 2026-11-01](#run-d633d9462dda6970cc8b462b) |
| Frankenmermaid | 7 | [0/116 verified; bounds 0–115/116 · 2026-11-01](#run-f713bed5d1748b27fd042e31) | [110/546 verified; bounds 110–357/546 · 2026-11-01](#run-c69b61e4228a0b2c9388923a) | [0/546 verified; bounds 0–544/546 · 2026-11-01](#run-0ed76179c115bf2cd81ed5c5) | Unmeasured: binding gap | [27/49 · 2026-11-01](#run-d633d9462dda6970cc8b462b) |
| Agentic Mermaid | 8 | [58/116 verified; bounds 58–100/116 · 2026-11-01](#run-f713bed5d1748b27fd042e31) | [91/546 verified; bounds 91–463/546 · 2026-11-01](#run-c69b61e4228a0b2c9388923a) | [No verified drawing-content observations · 2026-11-01](#run-0ed76179c115bf2cd81ed5c5) | Unmeasured | [29/49 · 2026-11-01](#run-d633d9462dda6970cc8b462b) |
| Zombie Mermaid | 9 | [60/116 verified; bounds 60–104/116 · 2026-11-01](#run-f713bed5d1748b27fd042e31) | [72/546 verified; bounds 72–485/546 · 2026-11-01](#run-c69b61e4228a0b2c9388923a) | [No verified drawing-content observations · 2026-11-01](#run-0ed76179c115bf2cd81ed5c5) | Unmeasured | [No verified observable behaviour outcomes · 2026-11-01](#run-d633d9462dda6970cc8b462b) |
| Mermaid RS Renderer | 10 | N/A | [55/546 verified; bounds 55–276/546 · 2026-11-01](#run-c69b61e4228a0b2c9388923a) | [0/546 verified; bounds 0–541/546 · 2026-11-01](#run-0ed76179c115bf2cd81ed5c5) | Unmeasured: binding gap | [0/49 · 2026-11-01](#run-d633d9462dda6970cc8b462b) |
| XMermaid | 11 | N/A | [34/546 verified; bounds 34–460/546 · 2026-11-01](#run-c69b61e4228a0b2c9388923a) | [No verified drawing-content observations · 2026-11-01](#run-0ed76179c115bf2cd81ed5c5) | Unmeasured: binding gap | [26/49 · 2026-11-01](#run-d633d9462dda6970cc8b462b) |
| Beautiful Mermaid | 12 | [35/116 verified; bounds 35–93/116 · 2026-11-01](#run-f713bed5d1748b27fd042e31) | [29/546 verified; bounds 29–391/546 · 2026-11-01](#run-c69b61e4228a0b2c9388923a) | [No verified drawing-content observations · 2026-11-01](#run-0ed76179c115bf2cd81ed5c5) | Unmeasured | [No verified observable behaviour outcomes · 2026-11-01](#run-d633d9462dda6970cc8b462b) |
| Crafter Mermaid | 13 | [No verified terminal drawing observations · 2026-11-01](#run-f713bed5d1748b27fd042e31) | [26/546 verified; bounds 26–389/546 · 2026-11-01](#run-c69b61e4228a0b2c9388923a) | [0/546 verified; bounds 0–531/546 · 2026-11-01](#run-0ed76179c115bf2cd81ed5c5) | Unmeasured | [No verified observable behaviour outcomes · 2026-11-01](#run-d633d9462dda6970cc8b462b) |
| Merslim | 14 | [16/116 verified; bounds 16–68/116 · 2026-11-01](#run-f713bed5d1748b27fd042e31) | [16/546 verified; bounds 16–346/546 · 2026-11-01](#run-c69b61e4228a0b2c9388923a) | [0/546 verified; bounds 0–467/546 · 2026-11-01](#run-0ed76179c115bf2cd81ed5c5) | Unmeasured | [25/49 · 2026-11-01](#run-d633d9462dda6970cc8b462b) |
| DSH Mermaid GB SVG | 15 | N/A | [15/546 verified; bounds 15–89/546 · 2026-11-01](#run-c69b61e4228a0b2c9388923a) | [No verified drawing-content observations · 2026-11-01](#run-0ed76179c115bf2cd81ed5c5) | Unmeasured | [0/49 · 2026-11-01](#run-d633d9462dda6970cc8b462b) |
| VitePress Plugin Diagram | 16 | N/A | [0/546 verified; bounds 0–399/546 · 2026-11-01](#run-c69b61e4228a0b2c9388923a) | [0/546 verified; bounds 0–545/546 · 2026-11-01](#run-0ed76179c115bf2cd81ed5c5) | Unmeasured | [8/49 · 2026-11-01](#run-d633d9462dda6970cc8b462b) |
| ASCII Mermaid | — | [28/116 verified; bounds 28–78/116 · 2026-11-01](#run-f713bed5d1748b27fd042e31) | N/A | N/A | N/A | [No verified observable behaviour outcomes · 2026-11-01](#run-d633d9462dda6970cc8b462b) |
| Figurehead | — | [18/116 verified; bounds 18–88/116 · 2026-11-01](#run-f713bed5d1748b27fd042e31) | N/A | N/A | N/A | [No verified observable behaviour outcomes · 2026-11-01](#run-d633d9462dda6970cc8b462b) |
| Grok renderer | — | [0/116 verified; bounds 0–92/116 · 2026-11-01](#run-f713bed5d1748b27fd042e31) | N/A | N/A | N/A | [No verified observable behaviour outcomes · 2026-11-01](#run-d633d9462dda6970cc8b462b) |
| Kitlangton Merman | — | [17/116 verified; bounds 17–84/116 · 2026-11-01](#run-f713bed5d1748b27fd042e31) | N/A | N/A | N/A | [6/49 · 2026-11-01](#run-d633d9462dda6970cc8b462b) |
| Loom renderer | — | [43/116 verified; bounds 43–89/116 · 2026-11-01](#run-f713bed5d1748b27fd042e31) | N/A | N/A | N/A | [No verified observable behaviour outcomes · 2026-11-01](#run-d633d9462dda6970cc8b462b) |
| Mermaid ASCII | — | [42/116 verified; bounds 42–92/116 · 2026-11-01](#run-f713bed5d1748b27fd042e31) | N/A | N/A | [blocked · 2026-11-01](results/tables/portable-1.md#attempt-1220a0791e428358bf377224) | [No verified observable behaviour outcomes · 2026-11-01](#run-d633d9462dda6970cc8b462b) |
| Mermaid Flutter | — | N/A | N/A | [297/546 verified; bounds 297–408/546 · 2026-11-01](#run-0ed76179c115bf2cd81ed5c5) | [blocked · 2026-11-01](results/tables/portable-1.md#attempt-3754d608a3c1c3f54319de52) | [No verified observable behaviour outcomes · 2026-11-01](#run-d633d9462dda6970cc8b462b) |
| MermaidText | — | [40/116 verified; bounds 40–92/116 · 2026-11-01](#run-f713bed5d1748b27fd042e31) | N/A | N/A | N/A | [No verified observable behaviour outcomes · 2026-11-01](#run-d633d9462dda6970cc8b462b) |
| MermaidTUI | — | [7/116 verified; bounds 7–110/116 · 2026-11-01](#run-f713bed5d1748b27fd042e31) | N/A | N/A | N/A | [No verified observable behaviour outcomes · 2026-11-01](#run-d633d9462dda6970cc8b462b) |
| OpenCode Merman | — | [20/116 verified; bounds 20–83/116 · 2026-11-01](#run-f713bed5d1748b27fd042e31) | N/A | N/A | N/A | [No verified observable behaviour outcomes · 2026-11-01](#run-d633d9462dda6970cc8b462b) |
| Termaid | — | [65/116 verified; bounds 65–83/116 · 2026-11-01](#run-f713bed5d1748b27fd042e31) | N/A | N/A | [blocked · 2026-11-01](results/tables/portable-1.md#attempt-7f218d23ccdd4e1120a8feeb) | [No verified observable behaviour outcomes · 2026-11-01](#run-d633d9462dda6970cc8b462b) |

## Results by benchmark

Tables retain the full recorded populations. Charts show one named measure from the adjacent table; blocked, unavailable and failed checks remain visible in that table. Linked publications provide raw downloads; each table’s receipt identifies its owning evidence.

### Terminal Rendering

[All 2 tables and recorded attempts](results/tables/community.md)

<a id="run-f713bed5d1748b27fd042e31"></a>

**run-f713bed5d1748b27fd042e31** · 2026-11-01 · unit: terminal input cases · [evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/3/report.json)

Full planned terminal drawing corpus, retaining unmeasured and unreviewed inputs. Corpus: 116 drawings from 120 selected source inputs in pinned terminal-project research, without selection on renderer outcomes. Any authored adaptations have separate content identities and independent source review. 1 source diagnostics are retained separately and receive no drawing score. Invalid-source controls are separate from drawing accuracy. Source/review hashes and all origins remain in the owning receipt. Ranks order verified correct counts only; unknown work prevents a complete accuracy claim. Mermaid source reference is unscored; no speed or aesthetics score.

Ranked by **Correct**, highest first. Equal values share a rank; unavailable values are unranked.

Ranks order verified correct counts once an outcome is resolved; observed zero remains ranked and fully unresolved rows are unranked. Observer coverage counts drawing and format verdicts. Correctness bounds include unresolved cases; overlapping bounds establish no accuracy winner. Unsupported inputs and proven renderer failures remain explicit non-successes on this corpus.

Comparisons claim superiority only when correctness bounds are disjoint; otherwise they describe verified-count differences. Mermaid has no terminal output; Mermaid ASCII is the terminal baseline.

| Project | Verified-count rank | Version | Correct | Incorrect drawing | Invalid format | Unsupported | Renderer failure | Unassessed | Unrun | Harness failure | Planned | Observer coverage (%) | Correctness lower (%) | Correctness upper (%) | Measured | vs Mermaid ASCII | Ranking note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Termaid | 1 | 0.10.0 | 65 | 33 | 0 | 0 | 0 | 18 | 0 | 0 | 116 | 84.5 | 56.0 | 71.6 | 2026-11-01T14:29:58.883195Z | More verified (+23); bounds overlap |  |
| Zombie Mermaid | 2 | 5.10.2 | 60 | 12 | 0 | 0 | 0 | 44 | 0 | 0 | 116 | 62.1 | 51.7 | 89.7 | 2026-11-01T14:29:19.193Z | More verified (+18); bounds overlap |  |
| Agentic Mermaid | 3 | 0.4.1 | 58 | 16 | 0 | 0 | 0 | 42 | 0 | 0 | 116 | 63.8 | 50.0 | 86.2 | 2026-11-01T14:29:14.153Z | More verified (+16); bounds overlap |  |
| Loom renderer | 4 | 0.10.0 | 43 | 27 | 0 | 0 | 0 | 46 | 0 | 0 | 116 | 60.3 | 37.1 | 76.7 | 2026-11-01T14:32:15.801Z | More verified (+1); bounds overlap |  |
| Mermaid ASCII | 5 | 1.6.1 | 42 | 24 | 0 | 0 | 0 | 50 | 0 | 0 | 116 | 56.9 | 36.2 | 79.3 | 2026-11-01T14:29:35.499Z | Baseline |  |
| MermaidText | 6 | git-a6b0c7657b94 | 40 | 24 | 0 | 0 | 0 | 52 | 0 | 0 | 116 | 55.2 | 34.5 | 79.3 | 2026-11-01T14:32:40.995Z | Fewer verified (-2); bounds overlap |  |
| Beautiful Mermaid | 7 | 1.1.3 | 35 | 23 | 0 | 0 | 0 | 58 | 0 | 0 | 116 | 50.0 | 30.2 | 80.2 | 2026-11-01T14:30:04.267Z | Fewer verified (-7); bounds overlap |  |
| Ondine | 8 | 0.0.3 | 31 | 26 | 0 | 0 | 0 | 59 | 0 | 0 | 116 | 49.1 | 26.7 | 77.6 | 2026-11-01T14:29:05.470Z | Fewer verified (-11); bounds overlap |  |
| ASCII Mermaid | 9 | 0.1.0 | 28 | 38 | 0 | 0 | 0 | 50 | 0 | 0 | 116 | 56.9 | 24.1 | 67.2 | 2026-11-01T14:32:20.022Z | Fewer verified (-14); bounds overlap |  |
| OpenCode Merman | 10 | 2.0.26 | 20 | 33 | 0 | 0 | 0 | 63 | 0 | 0 | 116 | 45.7 | 17.2 | 71.6 | 2026-11-01T14:29:46.058Z | Fewer verified (-22); bounds overlap |  |
| Figurehead | 11 | v0.4.3 | 18 | 28 | 0 | 0 | 0 | 70 | 0 | 0 | 116 | 39.7 | 15.5 | 75.9 | 2026-11-01T14:31:52.214Z | Fewer verified (-24); bounds overlap |  |
| Kitlangton Merman | 12 | 0.2.1 | 17 | 32 | 0 | 0 | 0 | 67 | 0 | 0 | 116 | 42.2 | 14.7 | 72.4 | 2026-11-01T14:30:01.505Z | Fewer verified (-25); bounds overlap |  |
| Merslim | 13 | 0.2.3 | 16 | 48 | 0 | 0 | 0 | 52 | 0 | 0 | 116 | 55.2 | 13.8 | 58.6 | 2026-11-01T14:29:52.222Z | Fewer verified (-26); bounds overlap |  |
| MermaidTUI | 14 | 0.0.6 | 7 | 6 | 0 | 0 | 0 | 103 | 0 | 0 | 116 | 11.2 | 6.0 | 94.8 | 2026-11-01T14:31:56.373Z | Fewer verified (-35); bounds overlap |  |
| Frankenmermaid | 15 | 0.4.0 | 0 | 1 | 0 | 0 | 0 | 115 | 0 | 0 | 116 | 0.9 | 0.0 | 99.1 | 2026-11-01T14:28:13.951Z | Fewer verified (-42); bounds overlap |  |
| Grok renderer | 15 | git-2bdd1d6a6369 | 0 | 24 | 0 | 0 | 0 | 92 | 0 | 0 | 116 | 20.7 | 0.0 | 79.3 | 2026-11-01T14:32:11.278Z | Fewer verified (-42); bounds overlap |  |
| Crafter Mermaid | — | 0.0.3 | 0 | 0 | 0 | 0 | 0 | 116 | 0 | 0 | 116 | 0.0 | 0.0 | 100.0 | Unknown; recovered text, see receipt | Fewer verified (-42); bounds overlap | No verified terminal drawing observations |
| Latias Merman | — | 0.9.2 | 0 | 0 | 0 | 0 | 0 | 116 | 0 | 0 | 116 | 0.0 | 0.0 | 100.0 | Unknown; recovered text, see receipt | Fewer verified (-42); bounds overlap | No verified terminal drawing observations |

### DaveBench — Documentation Rendering

[All 6 tables and recorded attempts](results/tables/docs.md)

<a id="run-0ed76179c115bf2cd81ed5c5"></a>

**run-0ed76179c115bf2cd81ed5c5** · 2026-11-01 · unit: documentation drawings · [evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/2/report.json)

Corpus: the same pinned Mermaid documentation inventory. First-round actual PNG witnesses checked against source expectations. PNG content reviews bind actual image, source and expected-fact hashes; SVG and nonblank checks supply no raster correctness credit. Rank counts verified correct drawings out of 546; 1 configuration example(s) and 1 independently invalid-source control(s) are separate. Unassessed sources/observers, unrun work and typed failures remain separate. Bounds span unresolved cases only; observer coverage counts actual drawing or format verdicts. Overlapping bounds establish no accuracy winner. Complete accuracy requires zero unresolved cases; speed requires its own qualified timing evidence.

Ranked by **Correct**, highest first. Equal values share a rank; unavailable values are unranked.

Ranks order verified correct counts once an outcome is resolved; observed zero remains ranked and fully unresolved rows are unranked. Observer coverage counts drawing and format verdicts. Correctness bounds include unresolved cases; overlapping bounds establish no accuracy winner. Unsupported inputs and proven renderer failures remain explicit non-successes on this corpus.

Comparisons claim superiority only when correctness bounds are disjoint; otherwise they describe verified-count differences. This is a comparison of the named metric, not overall project quality.

| Project | Verified-count rank | Version | Correct | Incorrect drawing | Invalid format | Unsupported | Renderer failure | Unassessed | Unrun | Harness failure | Planned drawings | Observer coverage (%) | Correctness lower (%) | Correctness upper (%) | Measured | vs Mermaid | Ranking note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mermaid | 1 | 12.2.0 | 431 | 43 | 0 | 0 | 0 | 72 | 0 | 0 | 546 | 86.8 | 78.9 | 92.1 | 2026-11-01T16:11:48.486Z | Baseline |  |
| Mermaid Flutter | 2 | 0.3.2 | 297 | 138 | 0 | 0 | 0 | 111 | 0 | 0 | 546 | 79.7 | 54.4 | 74.7 | 2026-11-01T17:36:05.583027Z | Lower on this corpus (-134 verified); disjoint bounds |  |
| Latias Merman | 3 | 0.9.2 | 94 | 10 | 0 | 0 | 0 | 442 | 0 | 0 | 546 | 19.0 | 17.2 | 98.2 | 2026-11-01T13:17:40.908Z | Fewer verified (-337); bounds overlap |  |
| Crafter Mermaid | 4 | 0.0.3 | 0 | 15 | 0 | 0 | 0 | 531 | 0 | 0 | 546 | 2.7 | 0.0 | 97.3 | 2026-11-01T12:43:07.981Z | Fewer verified (-431); bounds overlap |  |
| Frankenmermaid | 4 | 0.4.0 | 0 | 2 | 0 | 0 | 0 | 544 | 0 | 0 | 546 | 0.4 | 0.0 | 99.6 | 2026-11-01T12:52:22.568Z | Fewer verified (-431); bounds overlap |  |
| Mermaid RS Renderer | 4 | 0.3.1 | 0 | 5 | 0 | 0 | 0 | 541 | 0 | 0 | 546 | 0.9 | 0.0 | 99.1 | 2026-11-01T12:34:21.308Z | Fewer verified (-431); bounds overlap |  |
| Merslim | 4 | 0.2.3 | 0 | 79 | 0 | 0 | 0 | 467 | 0 | 0 | 546 | 14.5 | 0.0 | 85.5 | 2026-11-01T12:56:59.533Z | Fewer verified (-431); bounds overlap |  |
| VitePress Plugin Diagram | 4 | 0.3.2 | 0 | 1 | 0 | 0 | 0 | 545 | 0 | 0 | 546 | 0.2 | 0.0 | 99.8 | 2026-11-01T13:07:57.827Z | Fewer verified (-431); bounds overlap |  |
| Agentic Mermaid | — | 0.4.1 | 0 | 0 | 0 | 0 | 0 | 546 | 0 | 0 | 546 | 0.0 | 0.0 | 100.0 | 2026-11-01T12:37:57.996Z | Fewer verified (-431); bounds overlap | No verified drawing-content observations |
| Beautiful Mermaid | — | 1.1.3 | 0 | 0 | 0 | 0 | 0 | 546 | 0 | 0 | 546 | 0.0 | 0.0 | 100.0 | 2026-11-01T13:26:04.258Z | Fewer verified (-431); bounds overlap | No verified drawing-content observations |
| Bezel | — | 0.2.21 | 0 | 0 | 0 | 0 | 0 | 546 | 0 | 0 | 546 | 0.0 | 0.0 | 100.0 | 2026-11-01T12:41:35.690Z | Fewer verified (-431); bounds overlap | No verified drawing-content observations |
| DSH Mermaid GB SVG | — | 0.1.4 | 0 | 0 | 0 | 0 | 0 | 546 | 0 | 0 | 546 | 0.0 | 0.0 | 100.0 | 2026-11-01T14:13:18.612Z | Fewer verified (-431); bounds overlap | No verified drawing-content observations |
| Mermaid Dart | — | 0.3.2 | 0 | 0 | 0 | 0 | 0 | 546 | 0 | 0 | 546 | 0.0 | 0.0 | 100.0 | 2026-11-01T14:00:31.418Z | Fewer verified (-431); bounds overlap | No verified drawing-content observations |
| Ondine | — | 0.0.3 | 0 | 0 | 0 | 0 | 0 | 546 | 0 | 0 | 546 | 0.0 | 0.0 | 100.0 | 2026-11-01T14:27:38.234Z | Fewer verified (-431); bounds overlap | No verified drawing-content observations |
| Pele | — | 1.9.0 | 0 | 0 | 0 | 0 | 0 | 546 | 0 | 0 | 546 | 0.0 | 0.0 | 100.0 | 2026-11-01T13:48:39.518Z | Fewer verified (-431); bounds overlap | No verified drawing-content observations |
| XMermaid | — | 0.4.2 | 0 | 0 | 0 | 0 | 0 | 546 | 0 | 0 | 546 | 0.0 | 0.0 | 100.0 | 2026-11-01T13:02:12.471Z | Fewer verified (-431); bounds overlap | No verified drawing-content observations |
| Zombie Mermaid | — | 5.10.2 | 0 | 0 | 0 | 0 | 0 | 546 | 0 | 0 | 546 | 0.0 | 0.0 | 100.0 | 2026-11-01T12:46:01.801Z | Fewer verified (-431); bounds overlap | No verified drawing-content observations |

<a id="run-c69b61e4228a0b2c9388923a"></a>

**run-c69b61e4228a0b2c9388923a** · 2026-11-01 · unit: documentation drawings · [evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/1/report.json)

Corpus: the same pinned Mermaid documentation inventory. First-round actual SVG witnesses checked against source expectations. Shared SVG paint/meaning observer. Rank counts verified correct drawings out of 546; 1 configuration example(s) and 1 independently invalid-source control(s) are separate. Unassessed sources/observers, unrun work and typed failures remain separate. Bounds span unresolved cases only; observer coverage counts actual drawing or format verdicts. Overlapping bounds establish no accuracy winner. Complete accuracy requires zero unresolved cases; speed requires its own qualified timing evidence.

Ranked by **Correct**, highest first. Equal values share a rank; unavailable values are unranked.

Ranks order verified correct counts once an outcome is resolved; observed zero remains ranked and fully unresolved rows are unranked. Observer coverage counts drawing and format verdicts. Correctness bounds include unresolved cases; overlapping bounds establish no accuracy winner. Unsupported inputs and proven renderer failures remain explicit non-successes on this corpus.

Comparisons claim superiority only when correctness bounds are disjoint; otherwise they describe verified-count differences. This is a comparison of the named metric, not overall project quality.

| Project | Verified-count rank | Version | Correct | Incorrect drawing | Invalid format | Unsupported | Renderer failure | Unassessed | Unrun | Harness failure | Planned drawings | Observer coverage (%) | Correctness lower (%) | Correctness upper (%) | Measured | vs Mermaid |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mermaid | 1 | 12.2.0 | 331 | 54 | 0 | 0 | 0 | 161 | 0 | 0 | 546 | 70.5 | 60.6 | 90.1 | 2026-11-01T12:24:33.018Z | Baseline |
| Latias Merman | 2 | 0.9.2 | 240 | 55 | 0 | 0 | 0 | 251 | 0 | 0 | 546 | 54.0 | 44.0 | 89.9 | 2026-11-01T11:58:59.589Z | Fewer verified (-91); bounds overlap |
| Bezel | 3 | 0.2.21 | 238 | 49 | 0 | 0 | 0 | 259 | 0 | 0 | 546 | 52.6 | 43.6 | 91.0 | 2026-11-01T12:32:25.974Z | Fewer verified (-93); bounds overlap |
| Pele | 3 | 1.9.0 | 238 | 49 | 0 | 0 | 0 | 259 | 0 | 0 | 546 | 52.6 | 43.6 | 91.0 | 2026-11-01T12:10:16.658Z | Fewer verified (-93); bounds overlap |
| Ondine | 5 | 0.0.3 | 236 | 48 | 0 | 0 | 0 | 262 | 0 | 0 | 546 | 52.0 | 43.2 | 91.2 | 2026-11-01T11:30:42.973Z | Fewer verified (-95); bounds overlap |
| Mermaid Dart | 6 | 0.3.2 | 146 | 116 | 0 | 0 | 0 | 284 | 0 | 0 | 546 | 48.0 | 26.7 | 78.8 | 2026-11-01T11:33:32.002Z | Fewer verified (-185); bounds overlap |
| Frankenmermaid | 7 | 0.4.0 | 110 | 189 | 0 | 0 | 0 | 244 | 0 | 3 | 546 | 54.8 | 20.1 | 65.4 | 2026-11-01T11:27:18.840Z | Fewer verified (-221); bounds overlap |
| Agentic Mermaid | 8 | 0.4.1 | 91 | 83 | 0 | 0 | 0 | 372 | 0 | 0 | 546 | 31.9 | 16.7 | 84.8 | 2026-11-01T11:35:32.452Z | Fewer verified (-240); bounds overlap |
| Zombie Mermaid | 9 | 5.10.2 | 72 | 61 | 0 | 0 | 0 | 413 | 0 | 0 | 546 | 24.4 | 13.2 | 88.8 | 2026-11-01T11:38:06.717Z | Fewer verified (-259); bounds overlap |
| Mermaid RS Renderer | 10 | 0.3.1 | 55 | 270 | 0 | 0 | 0 | 221 | 0 | 0 | 546 | 59.5 | 10.1 | 50.5 | 2026-11-01T11:40:49.082Z | Lower on this corpus (-276 verified); disjoint bounds |
| XMermaid | 11 | 0.4.2 | 34 | 86 | 0 | 0 | 0 | 426 | 0 | 0 | 546 | 22.0 | 6.2 | 84.2 | 2026-11-01T11:48:42.561Z | Fewer verified (-297); bounds overlap |
| Beautiful Mermaid | 12 | 1.1.3 | 29 | 155 | 0 | 0 | 0 | 362 | 0 | 0 | 546 | 33.7 | 5.3 | 71.6 | 2026-11-01T12:03:14.712Z | Fewer verified (-302); bounds overlap |
| Crafter Mermaid | 13 | 0.0.3 | 26 | 157 | 0 | 0 | 0 | 363 | 0 | 0 | 546 | 33.5 | 4.8 | 71.2 | 2026-11-01T11:42:47.418Z | Fewer verified (-305); bounds overlap |
| Merslim | 14 | 0.2.3 | 16 | 200 | 0 | 0 | 0 | 330 | 0 | 0 | 546 | 39.6 | 2.9 | 63.4 | 2026-11-01T11:45:50.321Z | Fewer verified (-315); bounds overlap |
| DSH Mermaid GB SVG | 15 | 0.1.4 | 15 | 457 | 0 | 0 | 0 | 72 | 0 | 2 | 546 | 86.4 | 2.7 | 16.3 | 2026-11-01T12:15:06.214Z | Lower on this corpus (-316 verified); disjoint bounds |
| VitePress Plugin Diagram | 16 | 0.3.2 | 0 | 147 | 0 | 0 | 0 | 399 | 0 | 0 | 546 | 26.9 | 0.0 | 73.1 | 2026-11-01T11:51:34.319Z | Fewer verified (-331); bounds overlap |

### Rendering time by workload

[All 7 tables and recorded attempts](results/tables/portable.md)

<a id="run-169f88905fdbc95c9ea7a07d"></a>

**run-169f88905fdbc95c9ea7a07d** · 2026-11-01 · unit: paired normalized workload time · [evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/11/timing-bundle-32ddd35546775875c757119c.json)

PNG; first-use; 3 examples; 6 balanced A0/A1/B rounds; 1 sample(s) per example and replica-round. Host source request through fresh owned fork RPC, cold engine/process startup and complete public PNG export bytes returned through RPC; Mermaid includes public SVG render plus XML serialization, Image.decode, white canvas draw and PNG encoding; native uses public renderToPng(source,pixelRatio:1) plus its durable byte bridge. Includes required in-call source/job and returned-byte bridge, hash/receipt writes, common IPC transport. Common worker module initialization, artifact verification, engine teardown, controller retention and full grading excluded. OS/filesystem caches uncontrolled; no warm renderer; display service already running. Corpus: Mermaid syntax documentation at 1fb7869866dd619168d840291c9c54b4f129758b; 3 unchanged examples. Exact source IDs and hashes are in the owning plan. Ranks use the paired normalized ratio, with the reference at 1. Median replica-round time sums actual calls, including all declared samples; control medians include both A replicas. Every planned timed return, A/A control and current complete source contract must qualify; otherwise all speed values and ranks are withheld. Grading remains bound to the recorded observer; importing runs no renderer or new output observer. Intervals describe this fixed exposed workload, not ecosystem-wide speed.

Ranked by **Ratio to reference**, lowest first. Equal values share a rank; unavailable values are unranked.

| Project | Rank | Version | Examples | Rounds | Retained samples | Planned samples | Median replica-round ms | Ratio to reference | Ratio interval | Qualification | Measured | Ranking note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mermaid | — | artifact a8a6a6f805b074a8 | 3 | 6 | 36 | 36 | withheld | withheld | withheld | unqualified | 2026-11-01T18:00:24.828Z | Timing qualification is unresolved: Observed A/A control spread exceeds the declared noise ceiling |
| Mermaid Flutter | — | artifact 3872a782c80a471e | 3 | 6 | 18 | 18 | withheld | withheld | withheld | unqualified | 2026-11-01T18:00:17.481Z | Timing qualification is unresolved: Observed A/A control spread exceeds the declared noise ceiling |

<a id="run-744d612fecba1618ebc01fcd"></a>

**run-744d612fecba1618ebc01fcd** · 2026-11-01 · unit: paired normalized workload time · [evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/10/timing-bundle-3da055b522db8e2f59400966.json)

PNG; first-use; 3 examples; 6 balanced A0/A1/B rounds; 1 sample(s) per example and replica-round. Host source request through fresh owned fork RPC, cold engine/process startup and complete public PNG export bytes returned through RPC; Mermaid includes public SVG render plus XML serialization, Image.decode, white canvas draw and PNG encoding; native uses public renderToPng(source,pixelRatio:1) plus its durable byte bridge. Includes required in-call source/job and returned-byte bridge, hash/receipt writes, common IPC transport. Common worker module initialization, artifact verification, engine teardown, controller retention and full grading excluded. OS/filesystem caches uncontrolled; no warm renderer; display service already running. Corpus: Mermaid syntax documentation at 1fb7869866dd619168d840291c9c54b4f129758b; 3 unchanged examples. Exact source IDs and hashes are in the owning plan. Ranks use the paired normalized ratio, with the reference at 1. Median replica-round time sums actual calls, including all declared samples; control medians include both A replicas. Every planned timed return, A/A control and current complete source contract must qualify; otherwise all speed values and ranks are withheld. Grading remains bound to the recorded observer; importing runs no renderer or new output observer. Intervals describe this fixed exposed workload, not ecosystem-wide speed.

Ranked by **Ratio to reference**, lowest first. Equal values share a rank; unavailable values are unranked.

| Project | Rank | Version | Examples | Rounds | Retained samples | Planned samples | Median replica-round ms | Ratio to reference | Ratio interval | Qualification | Measured | Ranking note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mermaid | — | artifact a8a6a6f805b074a8 | 3 | 6 | 11 | 36 | withheld | withheld | withheld | unqualified | 2026-11-01T17:51:57.244Z | Timing qualification is unresolved: Raw journal includes missing, duplicated, extra or interrupted attempts; The fixed case/replica/round/sample population is incomplete; Every replica/round needs the declared finite positive sample count; Raw timing capture did not complete its full fixed schedule; Capture public-call-or-retention: Error: Error: Native PNG export exited or timed out:  (com.example.native_bench:1493110): Gtk-WARNING **: 17:52:00.874: cannot open display: :99 ; Raw calls differ from the captured protocol, controller or predeclared order |
| Mermaid Flutter | — | artifact 3872a782c80a471e | 3 | 6 | 5 | 18 | withheld | withheld | withheld | unqualified | 2026-11-01T17:51:52.629Z | Timing qualification is unresolved: Raw journal includes missing, duplicated, extra or interrupted attempts; The fixed case/replica/round/sample population is incomplete; Every replica/round needs the declared finite positive sample count; Raw timing capture did not complete its full fixed schedule; Capture public-call-or-retention: Error: Error: Native PNG export exited or timed out:  (com.example.native_bench:1493110): Gtk-WARNING **: 17:52:00.874: cannot open display: :99 ; Raw calls differ from the captured protocol, controller or predeclared order |

<a id="run-1901fc7bcccc9a1d3adfcbe5"></a>

**run-1901fc7bcccc9a1d3adfcbe5** · 2026-11-01 · unit: paired normalized workload time · [evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/9/timing-bundle-7cbd1f1caf1e2401450023cf.json)

PNG; first-use; 3 examples; 6 balanced A0/A1/B rounds; 1 sample(s) per example and replica-round. Host source request through fresh owned fork RPC, cold engine/process startup and complete public PNG export bytes returned through RPC; Mermaid includes public SVG render plus XML serialization, Image.decode, white canvas draw and PNG encoding; native uses public renderToPng(source,pixelRatio:1) plus its durable byte bridge. Includes required in-call source/job and returned-byte bridge, hash/receipt writes, common IPC transport. Common worker module initialization, artifact verification, engine teardown, controller retention and full grading excluded. OS/filesystem caches uncontrolled; no warm renderer; display service already running. Corpus: Mermaid syntax documentation at 1fb7869866dd619168d840291c9c54b4f129758b; 3 unchanged examples. Exact source IDs and hashes are in the owning plan. Ranks use the paired normalized ratio, with the reference at 1. Median replica-round time sums actual calls, including all declared samples; control medians include both A replicas. Every planned timed return, A/A control and current complete source contract must qualify; otherwise all speed values and ranks are withheld. Grading remains bound to the recorded observer; importing runs no renderer or new output observer. Intervals describe this fixed exposed workload, not ecosystem-wide speed.

Ranked by **Ratio to reference**, lowest first. Equal values share a rank; unavailable values are unranked.

| Project | Rank | Version | Examples | Rounds | Retained samples | Planned samples | Median replica-round ms | Ratio to reference | Ratio interval | Qualification | Measured | Ranking note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mermaid | — | artifact a8a6a6f805b074a8 | 3 | 6 | 19 | 36 | withheld | withheld | withheld | unqualified | 2026-11-01T17:44:32.351Z | Timing qualification is unresolved: Raw journal includes missing, duplicated, extra or interrupted attempts; The fixed case/replica/round/sample population is incomplete; Every replica/round needs the declared finite positive sample count; Raw timing capture did not complete its full fixed schedule; Capture public-call-or-retention: Error: Error: Native PNG export exited or timed out:  (com.example.native_bench:1490752): Gtk-WARNING **: 17:44:35.967: cannot open display: :99 ; Raw calls differ from the captured protocol, controller or predeclared order |
| Mermaid Flutter | — | artifact 3872a782c80a471e | 3 | 6 | 9 | 18 | withheld | withheld | withheld | unqualified | 2026-11-01T17:44:26.083Z | Timing qualification is unresolved: Raw journal includes missing, duplicated, extra or interrupted attempts; The fixed case/replica/round/sample population is incomplete; Every replica/round needs the declared finite positive sample count; Raw timing capture did not complete its full fixed schedule; Capture public-call-or-retention: Error: Error: Native PNG export exited or timed out:  (com.example.native_bench:1490752): Gtk-WARNING **: 17:44:35.967: cannot open display: :99 ; Raw calls differ from the captured protocol, controller or predeclared order |

<a id="run-912eed771955188d1b8f65da"></a>

**run-912eed771955188d1b8f65da** · 2026-11-01 · unit: paired normalized workload time · [evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/8/timing-bundle-f9a2724cdb046cd29a26887a.json)

TERMINAL; first-use; 6 examples; 6 balanced A0/A1/B rounds; 1 sample(s) per example and replica-round. Host request through fresh owned Node-worker RPC, cold public CLI process startup/import/render, complete drained stdout bytes and RPC return; worker initialization, artifact verification, retention and full output grading excluded. Filesystem/OS caches uncontrolled; frozen package bytecode caches retained; no warm renderer. Corpus: Terminal project documentation and regression fixtures: tariqshams/mermaidtui@ca59dd9115c290be846c2bd62925b8bd44331d51; crafter-station/mermaid@1bac24116826233c3b0ad8da589d7223d77a451a; dfadler/zombie-mermaid@8cc982128bed11d976fb38164c4cdb47be7bd34d; spacedock-dev/mermaidtext@a6b0c7657b947cbd8361ca3b8f0be4302bb5dc12; kais-radwan/ascii-mermaid@a91a0c7baec6392212c59221bc67389bb617feb7; 6 exact inputs matched to the committed corpus. Per-file origins and any authored adaptations are retained in the source inventory and terminal-inputs.json; exact source IDs and hashes are in the plan. Ranks use the paired normalized ratio, with the reference at 1. Median replica-round time sums actual calls, including all declared samples; control medians include both A replicas. Every planned timed return, A/A control and current complete source contract must qualify; otherwise all speed values and ranks are withheld. Grading remains bound to the recorded observer; importing runs no renderer or new output observer. Intervals describe this fixed exposed workload, not ecosystem-wide speed.

Ranked by **Ratio to reference**, lowest first. Equal values share a rank; unavailable values are unranked.

| Project | Rank | Version | Examples | Rounds | Retained samples | Planned samples | Median replica-round ms | Ratio to reference | Ratio interval | Qualification | Measured | Ranking note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mermaid ASCII | — | artifact d790ceca22095b6a | 6 | 6 | 72 | 72 | withheld | withheld | withheld | unqualified | 2026-11-01T17:05:55.241Z | Timing qualification is unresolved: Observed A/A control spread exceeds the declared noise ceiling |
| Termaid | — | artifact 88d0998d656a0a9f | 6 | 6 | 36 | 36 | withheld | withheld | withheld | unqualified | 2026-11-01T17:05:55.115Z | Timing qualification is unresolved: Observed A/A control spread exceeds the declared noise ceiling |

<a id="run-3a7bff74601aaf7979d96677"></a>

**run-3a7bff74601aaf7979d96677** · 2026-11-01 · unit: paired normalized workload time · [evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/7/timing-bundle-faef08653bc195e68bbc8c90.json)

SVG; first-use; 6 examples; 6 balanced A0/A1/B rounds; 1 sample(s) per example and replica-round. Host page.evaluate request through returned SVG string, including RPC serialization, shared public adapter and render cleanup; package initialization/import, browser/context startup and correctness grading excluded Corpus: Mermaid syntax documentation at 1fb7869866dd619168d840291c9c54b4f129758b; 6 unchanged examples. Exact source IDs and hashes are in the owning plan. Ranks use the paired normalized ratio, with the reference at 1. Median replica-round time sums actual calls, including all declared samples; control medians include both A replicas. Every planned timed return, A/A control and current complete source contract must qualify; otherwise all speed values and ranks are withheld. Grading remains bound to the recorded observer; importing runs no renderer or new output observer. Intervals describe this fixed exposed workload, not ecosystem-wide speed.

Ranked by **Ratio to reference**, lowest first. Equal values share a rank; unavailable values are unranked.

| Project | Rank | Version | Examples | Rounds | Retained samples | Planned samples | Median replica-round ms | Ratio to reference | Ratio interval | Qualification | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bezel | 1 | artifact 4c4d1a36b9325205 | 6 | 6 | 36 | 36 | 229.5774005 | 0.1595717049481109 | 0.14437694393278214–0.1930668527748263 | qualified | 2026-11-01T16:25:41.724Z |
| Mermaid | 2 | artifact a8a6a6f805b074a8 | 6 | 6 | 72 | 72 | 1434.3678225 | 1 | reference | qualified | 2026-11-01T16:25:44.614Z |

<a id="run-8a3895883b28ce34ed78c1aa"></a>

**run-8a3895883b28ce34ed78c1aa** · 2026-11-01 · unit: paired normalized workload time · [evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/6/timing-bundle-2818be639c8a16f60e39c81e.json)

SVG; first-use; 6 examples; 6 balanced A0/A1/B rounds; 1 sample(s) per example and replica-round. Host page.evaluate request through returned SVG string, including RPC serialization, shared public adapter and render cleanup; package initialization/import, browser/context startup and correctness grading excluded Corpus: Mermaid syntax documentation at 1fb7869866dd619168d840291c9c54b4f129758b; 6 unchanged examples. Exact source IDs and hashes are in the owning plan. Ranks use the paired normalized ratio, with the reference at 1. Median replica-round time sums actual calls, including all declared samples; control medians include both A replicas. Every planned timed return, A/A control and current complete source contract must qualify; otherwise all speed values and ranks are withheld. Grading remains bound to the recorded observer; importing runs no renderer or new output observer. Intervals describe this fixed exposed workload, not ecosystem-wide speed.

Ranked by **Ratio to reference**, lowest first. Equal values share a rank; unavailable values are unranked.

| Project | Rank | Version | Examples | Rounds | Retained samples | Planned samples | Median replica-round ms | Ratio to reference | Ratio interval | Qualification | Measured | Ranking note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mermaid | — | artifact a8a6a6f805b074a8 | 6 | 6 | 72 | 72 | withheld | withheld | withheld | unqualified | 2026-11-01T16:20:47.248Z | Timing qualification is unresolved: Observed A/A control spread exceeds the declared noise ceiling |
| Pele | — | artifact 323c16de7844d4b6 | 6 | 6 | 36 | 36 | withheld | withheld | withheld | unqualified | 2026-11-01T16:20:44.396Z | Timing qualification is unresolved: Observed A/A control spread exceeds the declared noise ceiling |

<a id="run-fbd4eb61273053c68183839c"></a>

**run-fbd4eb61273053c68183839c** · 2026-11-01 · unit: paired normalized workload time · [evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/5/timing-bundle-61c17619018ebfe1fd24cfd3.json)

SVG; first-use; 6 examples; 6 balanced A0/A1/B rounds; 1 sample(s) per example and replica-round. Host page.evaluate request through returned SVG string, including RPC serialization, shared public adapter and render cleanup; package initialization/import, browser/context startup and correctness grading excluded Corpus: Mermaid syntax documentation at 1fb7869866dd619168d840291c9c54b4f129758b; 6 unchanged examples. Exact source IDs and hashes are in the owning plan. Ranks use the paired normalized ratio, with the reference at 1. Median replica-round time sums actual calls, including all declared samples; control medians include both A replicas. Every planned timed return, A/A control and current complete source contract must qualify; otherwise all speed values and ranks are withheld. Grading remains bound to the recorded observer; importing runs no renderer or new output observer. Intervals describe this fixed exposed workload, not ecosystem-wide speed.

Ranked by **Ratio to reference**, lowest first. Equal values share a rank; unavailable values are unranked.

| Project | Rank | Version | Examples | Rounds | Retained samples | Planned samples | Median replica-round ms | Ratio to reference | Ratio interval | Qualification | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | artifact 0fd3420d1cc8f9e0 | 6 | 6 | 36 | 36 | 125.054671 | 0.08523873550987235 | 0.06921566547108297–0.10070715129587977 | qualified | 2026-11-01T16:15:54.597Z |
| Mermaid | 2 | artifact a8a6a6f805b074a8 | 6 | 6 | 72 | 72 | 1458.243882 | 1 | reference | qualified | 2026-11-01T16:15:57.281Z |

### Mermaid Behaviour Tests

[All 1 tables and recorded attempts](results/tables/mermaid-behaviour.md)

<a id="run-d633d9462dda6970cc8b462b"></a>

**run-d633d9462dda6970cc8b462b** · 2026-11-01 · unit: whole observable behaviour cases · [evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/4/report.json)

Corpus: 49 whole source-derived observable behaviours from pinned Mermaid 1fb7869866dd619168d840291c9c54b4f129758b. Every ordered stimulus and declared check in a case must pass; detail checks are not extra votes. Source adaptations compare explicit diagram-family aliases and static SVG accessible naming through native public returns, without private model/API-shape requirements. Unavailable and unrun observations remain unresolved, not unsupported or failed. Actual Mermaid reference qualification: qualified; its actual artifact and raw checks remain in the owning evidence, and no reference target row is invented. Dates use the retained owning public-call collection or native invocation journal; targets without recorded calls keep an unknown clock. If no call clock exists, the table date is explicitly the assessment publication date. Assessment publication: 2026-11-01T15:19:30.283Z. This finite corpus supplies no whole-library conformance, drawing-accuracy or timing claim.

Ranked by **Passed**, highest first. Equal values share a rank; unavailable values are unranked.

Comparisons use whole-case verified pass counts. Unavailable or unrun cases leave outcomes unresolved; a count lead is not an overall quality claim. This is a comparison of the named metric, not overall project quality.

| Project | Verified-count rank | Version | Passed | Failed | Unavailable | Unrun | Planned | Measured | vs Mermaid | Ranking note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mermaid | 1 | 12.2.0 | 49 | 0 | 0 | 0 | 49 | 2026-11-01T14:52:50.280Z | Baseline |  |
| Pele | 1 | 1.9.0 | 49 | 0 | 0 | 0 | 49 | 2026-11-01T14:49:40.478Z | Tie on these behaviours |  |
| Agentic Mermaid | 3 | 0.4.1 | 29 | 0 | 20 | 0 | 49 | 2026-11-01T14:38:36.097Z | Fewer verified (-20); outcome unresolved |  |
| Frankenmermaid | 4 | 0.4.0 | 27 | 3 | 19 | 0 | 49 | 2026-11-01T15:19:27.825Z | Fewer verified (-22); outcome unresolved |  |
| XMermaid | 5 | 0.4.2 | 26 | 4 | 19 | 0 | 49 | 2026-11-01T14:43:35.503Z | Fewer verified (-23); outcome unresolved |  |
| Merslim | 6 | 0.2.3 | 25 | 16 | 8 | 0 | 49 | 2026-11-01T14:42:13.155Z | Fewer verified (-24); outcome unresolved |  |
| Bezel | 7 | 0.2.21 | 19 | 0 | 30 | 0 | 49 | 2026-11-01T14:53:44.211Z | Fewer verified (-30); outcome unresolved |  |
| Ondine | 7 | 0.0.3 | 19 | 0 | 30 | 0 | 49 | 2026-11-01T14:35:59.282Z | Fewer verified (-30); outcome unresolved |  |
| Latias Merman | 9 | 0.9.2 | 18 | 0 | 31 | 0 | 49 | 2026-11-01T14:46:59.333Z | Fewer verified (-31); outcome unresolved |  |
| VitePress Plugin Diagram | 10 | 0.3.2 | 8 | 2 | 39 | 0 | 49 | 2026-11-01T14:46:02.693Z | Fewer verified (-41); outcome unresolved |  |
| Kitlangton Merman | 11 | 0.2.1 | 6 | 0 | 43 | 0 | 49 | 2026-11-01T14:44:24.949Z | Fewer verified (-43); outcome unresolved |  |
| DSH Mermaid GB SVG | 12 | 0.1.4 | 0 | 17 | 32 | 0 | 49 | 2026-11-01T14:50:16.699Z | Fewer verified (-49); outcome unresolved |  |
| Mermaid Dart | 12 | 0.3.2 | 0 | 16 | 33 | 0 | 49 | 2026-11-01T14:36:45.880Z | Fewer verified (-49); outcome unresolved |  |
| Mermaid RS Renderer | 12 | 0.3.1 | 0 | 19 | 30 | 0 | 49 | 2026-11-01T14:39:47.360Z | Fewer verified (-49); outcome unresolved |  |
| ASCII Mermaid | — | 0.1.0 | 0 | 0 | 49 | 0 | 49 | Unknown; no recorded public call | Fewer verified (-49); outcome unresolved | No verified observable behaviour outcomes |
| Beautiful Mermaid | — | 1.1.3 | 0 | 0 | 49 | 0 | 49 | 2026-11-01T14:47:46.578Z | Fewer verified (-49); outcome unresolved | No verified observable behaviour outcomes |
| Crafter Mermaid | — | 0.0.3 | 0 | 0 | 49 | 0 | 49 | 2026-11-01T14:40:35.723Z | Fewer verified (-49); outcome unresolved | No verified observable behaviour outcomes |
| Figurehead | — | v0.4.3 | 0 | 0 | 49 | 0 | 49 | Unknown; no recorded public call | Fewer verified (-49); outcome unresolved | No verified observable behaviour outcomes |
| Grok renderer | — | git-2bdd1d6a6369 | 0 | 0 | 49 | 0 | 49 | Unknown; no recorded public call | Fewer verified (-49); outcome unresolved | No verified observable behaviour outcomes |
| Loom renderer | — | 0.10.0 | 0 | 0 | 49 | 0 | 49 | Unknown; no recorded public call | Fewer verified (-49); outcome unresolved | No verified observable behaviour outcomes |
| Mermaid ASCII | — | 1.6.1 | 0 | 0 | 49 | 0 | 49 | Unknown; no recorded public call | Fewer verified (-49); outcome unresolved | No verified observable behaviour outcomes |
| Mermaid Flutter | — | 0.3.2 | 0 | 0 | 49 | 0 | 49 | Unknown; no recorded public call | Fewer verified (-49); outcome unresolved | No verified observable behaviour outcomes |
| MermaidText | — | git-a6b0c7657b94 | 0 | 0 | 49 | 0 | 49 | Unknown; no recorded public call | Fewer verified (-49); outcome unresolved | No verified observable behaviour outcomes |
| MermaidTUI | — | 0.0.6 | 0 | 0 | 49 | 0 | 49 | Unknown; no recorded public call | Fewer verified (-49); outcome unresolved | No verified observable behaviour outcomes |
| OpenCode Merman | — | 2.0.26 | 0 | 0 | 49 | 0 | 49 | Unknown; no recorded public call | Fewer verified (-49); outcome unresolved | No verified observable behaviour outcomes |
| Termaid | — | 0.10.0 | 0 | 0 | 49 | 0 | 49 | Unknown; no recorded public call | Fewer verified (-49); outcome unresolved | No verified observable behaviour outcomes |
| Zombie Mermaid | — | 5.10.2 | 0 | 0 | 49 | 0 | 49 | 2026-11-01T14:39:27.744Z | Fewer verified (-49); outcome unresolved | No verified observable behaviour outcomes |

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
