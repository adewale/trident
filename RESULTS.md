# Mermaid ecosystem benchmark results

Updated **2026-11-01**. Each benchmark has its own ranking; there is no overall project rank.

[DaveBench SVG](#davebench-svg) · [DaveBench PNG](#davebench-png) · [Terminal rendering](#terminal-rendering) · [Behaviour tests](#mermaid-behaviour-tests) · [Rendering time](#rendering-time)

Rank counts verified correct results, highest first; ties share a rank. **Unresolved results can change the accuracy order.** “Better” or “Worse” means the correctness bounds do not overlap. “Uncertain” means they do. Unassessed projects receive no rank.

Failed includes incorrect drawings, invalid output, proven unsupported input and renderer errors. Unresolved includes missing assessments, unrun work and Trident failures. Invalid-source and configuration-only controls are in the details.

[Methods and corpus provenance](BENCHMARKS.md) · [Machine-readable results](results/latest.json) · [Supported projects](CATALOG.md)

## DaveBench SVG

**Corpus:** [Mermaid syntax documentation at 1fb7869](https://github.com/mermaid-js/mermaid/tree/1fb7869866dd619168d840291c9c54b4f129758b/packages/mermaid/src/docs/syntax). **Population:** 546 drawings per project. **Date:** 2026-11-01.

The full inventory has 548 documentation occurrences; invalid-source and configuration-only controls are reported separately from drawings.

| Rank | Project | Version | Correct | Failed | Unresolved | vs Mermaid |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Mermaid | 12.2.0 | 331 | 54 | 161 | Reference |
| 2 | Latias Merman | 0.9.2 | 240 | 55 | 251 | Uncertain |
| 3 | Bezel | 0.2.21 | 238 | 49 | 259 | Uncertain |
| 3 | Pele | 1.9.0 | 238 | 49 | 259 | Uncertain |
| 5 | Ondine | 0.0.3 | 236 | 48 | 262 | Uncertain |
| 6 | Mermaid Dart | 0.3.2 | 146 | 116 | 284 | Uncertain |
| 7 | Frankenmermaid | 0.4.0 | 110 | 189 | 247 | Uncertain |
| 8 | Agentic Mermaid | 0.4.1 | 91 | 83 | 372 | Uncertain |
| 9 | Zombie Mermaid | 5.10.2 | 72 | 61 | 413 | Uncertain |
| 10 | Mermaid RS Renderer | 0.3.1 | 55 | 270 | 221 | Worse |
| 11 | XMermaid | 0.4.2 | 34 | 86 | 426 | Uncertain |
| 12 | Beautiful Mermaid | 1.1.3 | 29 | 155 | 362 | Uncertain |
| 13 | Crafter Mermaid | 0.0.3 | 26 | 157 | 363 | Uncertain |
| 14 | Merslim | 0.2.3 | 16 | 200 | 330 | Uncertain |
| 15 | DSH Mermaid GB SVG | 0.1.4 | 15 | 457 | 74 | Worse |
| 16 | VitePress Plugin Diagram | 0.3.2 | 0 | 147 | 399 | Uncertain |

[Full outcomes, correctness bounds and collection details](results/tables/docs-1.md#run-c69b61e4228a0b2c9388923a) · [Source evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/1/report.json)

## DaveBench PNG

**Corpus:** [Mermaid syntax documentation at 1fb7869](https://github.com/mermaid-js/mermaid/tree/1fb7869866dd619168d840291c9c54b4f129758b/packages/mermaid/src/docs/syntax); PNG images are assessed separately. **Population:** 546 drawings per project. **Date:** 2026-11-01.

| Rank | Project | Version | Correct | Failed | Unresolved | vs Mermaid |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Mermaid | 12.2.0 | 431 | 43 | 72 | Reference |
| 2 | Mermaid Flutter | 0.3.2 | 297 | 138 | 111 | Worse |
| 3 | Latias Merman | 0.9.2 | 94 | 10 | 442 | Uncertain |
| 4 | Crafter Mermaid | 0.0.3 | 0 | 15 | 531 | Uncertain |
| 4 | Frankenmermaid | 0.4.0 | 0 | 2 | 544 | Uncertain |
| 4 | Mermaid RS Renderer | 0.3.1 | 0 | 5 | 541 | Uncertain |
| 4 | Merslim | 0.2.3 | 0 | 79 | 467 | Uncertain |
| 4 | VitePress Plugin Diagram | 0.3.2 | 0 | 1 | 545 | Uncertain |
| — | Agentic Mermaid | 0.4.1 | — | — | 546 | Not assessed |
| — | Beautiful Mermaid | 1.1.3 | — | — | 546 | Not assessed |
| — | Bezel | 0.2.21 | — | — | 546 | Not assessed |
| — | DSH Mermaid GB SVG | 0.1.4 | — | — | 546 | Not assessed |
| — | Mermaid Dart | 0.3.2 | — | — | 546 | Not assessed |
| — | Ondine | 0.0.3 | — | — | 546 | Not assessed |
| — | Pele | 1.9.0 | — | — | 546 | Not assessed |
| — | XMermaid | 0.4.2 | — | — | 546 | Not assessed |
| — | Zombie Mermaid | 5.10.2 | — | — | 546 | Not assessed |

[Full outcomes, correctness bounds and collection details](results/tables/docs-1.md#run-0ed76179c115bf2cd81ed5c5) · [Source evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/2/report.json)

## Terminal rendering

**Corpus:** [Pinned terminal-project docs, tests, issues and PRs, with explicit adaptations](BENCHMARKS.md#terminal-rendering--project-examples). **Population:** 116 drawings per project. **Date:** 2026-11-01.

| Rank | Project | Version | Correct | Failed | Unresolved | vs Mermaid ASCII |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Termaid | 0.10.0 | 65 | 33 | 18 | Uncertain |
| 2 | Zombie Mermaid | 5.10.2 | 60 | 12 | 44 | Uncertain |
| 3 | Agentic Mermaid | 0.4.1 | 58 | 16 | 42 | Uncertain |
| 4 | Loom renderer | 0.10.0 | 43 | 27 | 46 | Uncertain |
| 5 | Mermaid ASCII | 1.6.1 | 42 | 24 | 50 | Reference |
| 6 | MermaidText | git-a6b0c7657b94 | 40 | 24 | 52 | Uncertain |
| 7 | Beautiful Mermaid | 1.1.3 | 35 | 23 | 58 | Uncertain |
| 8 | Ondine | 0.0.3 | 31 | 26 | 59 | Uncertain |
| 9 | ASCII Mermaid | 0.1.0 | 28 | 38 | 50 | Uncertain |
| 10 | OpenCode Merman | 2.0.26 | 20 | 33 | 63 | Uncertain |
| 11 | Figurehead | v0.4.3 | 18 | 28 | 70 | Uncertain |
| 12 | Kitlangton Merman | 0.2.1 | 17 | 32 | 67 | Uncertain |
| 13 | Merslim | 0.2.3 | 16 | 48 | 52 | Uncertain |
| 14 | MermaidTUI | 0.0.6 | 7 | 6 | 103 | Uncertain |
| 15 | Frankenmermaid | 0.4.0 | 0 | 1 | 115 | Uncertain |
| 15 | Grok renderer | git-2bdd1d6a6369 | 0 | 24 | 92 | Uncertain |
| — | Crafter Mermaid | 0.0.3 | — | — | 116 | Not assessed |
| — | Latias Merman | 0.9.2 | — | — | 116 | Not assessed |

[Full outcomes, correctness bounds and collection details](results/tables/community-1.md#run-f713bed5d1748b27fd042e31) · [Source evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/3/report.json)

## Mermaid Behaviour Tests

**Corpus:** [Adapted Mermaid upstream tests](BENCHMARKS.md#mermaid-behaviour-tests), covering syntax-family detection and SVG accessible names/descriptions at [1fb7869](https://github.com/mermaid-js/mermaid/tree/1fb7869866dd619168d840291c9c54b4f129758b). **Population:** 49 whole behaviour cases per project. **Date:** 2026-11-01.

A case passes only when all its assertions pass. Unavailable includes missing public bindings and unrun cases. These are selected behaviours, not the entire Mermaid test suite.

| Rank | Project | Version | Passed | Failed | Unavailable | vs Mermaid |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Mermaid | 12.2.0 | 49 | 0 | 0 | Reference |
| 1 | Pele | 1.9.0 | 49 | 0 | 0 | Tie |
| 3 | Agentic Mermaid | 0.4.1 | 29 | 0 | 20 | Uncertain |
| 4 | Frankenmermaid | 0.4.0 | 27 | 3 | 19 | Uncertain |
| 5 | XMermaid | 0.4.2 | 26 | 4 | 19 | Uncertain |
| 6 | Merslim | 0.2.3 | 25 | 16 | 8 | Uncertain |
| 7 | Bezel | 0.2.21 | 19 | 0 | 30 | Uncertain |
| 7 | Ondine | 0.0.3 | 19 | 0 | 30 | Uncertain |
| 9 | Latias Merman | 0.9.2 | 18 | 0 | 31 | Uncertain |
| 10 | VitePress Plugin Diagram | 0.3.2 | 8 | 2 | 39 | Uncertain |
| 11 | Kitlangton Merman | 0.2.1 | 6 | 0 | 43 | Uncertain |
| 12 | DSH Mermaid GB SVG | 0.1.4 | 0 | 17 | 32 | Uncertain |
| 12 | Mermaid Dart | 0.3.2 | 0 | 16 | 33 | Uncertain |
| 12 | Mermaid RS Renderer | 0.3.1 | 0 | 19 | 30 | Uncertain |
| — | ASCII Mermaid | 0.1.0 | — | — | 49 | Not assessed |
| — | Beautiful Mermaid | 1.1.3 | — | — | 49 | Not assessed |
| — | Crafter Mermaid | 0.0.3 | — | — | 49 | Not assessed |
| — | Figurehead | v0.4.3 | — | — | 49 | Not assessed |
| — | Grok renderer | git-2bdd1d6a6369 | — | — | 49 | Not assessed |
| — | Loom renderer | 0.10.0 | — | — | 49 | Not assessed |
| — | Mermaid ASCII | 1.6.1 | — | — | 49 | Not assessed |
| — | Mermaid Flutter | 0.3.2 | — | — | 49 | Not assessed |
| — | MermaidText | git-a6b0c7657b94 | — | — | 49 | Not assessed |
| — | MermaidTUI | 0.0.6 | — | — | 49 | Not assessed |
| — | OpenCode Merman | 2.0.26 | — | — | 49 | Not assessed |
| — | Termaid | 0.10.0 | — | — | 49 | Not assessed |
| — | Zombie Mermaid | 5.10.2 | — | — | 49 | Not assessed |

[Full outcomes, correctness bounds and collection details](results/tables/mermaid-behaviour-1.md#run-d633d9462dda6970cc8b462b) · [Source evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/4/report.json)

## Rendering time

Lower ratios are faster. The latest attempt for each project pair and format is shown; older workloads remain in the details. Each table compares one fixed workload against its own reference in the same run. Workload times are median replica-round totals; ratios are medians of paired round ratios. Times include the stated public-call boundary and do not describe the full DaveBench corpus. Only runs with correct sampled outputs and sufficiently stable repeated reference measurements receive a rank.

### SVG

**Mermaid / Ondine** · 6 examples · 6 rounds · 2026-11-01

Corpus and selection: Mermaid syntax documentation at 1fb7869866dd619168d840291c9c54b4f129758b; 6 unchanged examples. Exact source IDs and hashes are in the owning plan.

| Rank | Project | Workload (ms) | Ratio to reference | Ratio interval |
| --- | --- | --- | --- | --- |
| 1 | Ondine | 125.1 | 0.085 | 0.069–0.101 |
| 2 | Mermaid | 1458.2 | 1.000 | reference |

**Clock:** Host page.evaluate request through returned SVG string, including RPC serialization, shared public adapter and render cleanup; package initialization/import, browser/context startup and correctness grading excluded

[Exact artifacts, samples and timing method](results/tables/portable-1.md#run-fbd4eb61273053c68183839c)

**Mermaid / Bezel** · 6 examples · 6 rounds · 2026-11-01

Corpus and selection: Mermaid syntax documentation at 1fb7869866dd619168d840291c9c54b4f129758b; 6 unchanged examples. Exact source IDs and hashes are in the owning plan.

| Rank | Project | Workload (ms) | Ratio to reference | Ratio interval |
| --- | --- | --- | --- | --- |
| 1 | Bezel | 229.6 | 0.160 | 0.144–0.193 |
| 2 | Mermaid | 1434.4 | 1.000 | reference |

**Clock:** Host page.evaluate request through returned SVG string, including RPC serialization, shared public adapter and render cleanup; package initialization/import, browser/context startup and correctness grading excluded

[Exact artifacts, samples and timing method](results/tables/portable-1.md#run-3a7bff74601aaf7979d96677)

| Unranked pair | Reason | Details |
| --- | --- | --- |
| Mermaid / Pele | Reference measurements too noisy | [Run details](results/tables/portable-1.md#run-8a3895883b28ce34ed78c1aa) |

### PNG

No paired run qualified. No speed ranking is available.

| Unranked pair | Reason | Details |
| --- | --- | --- |
| Mermaid / Mermaid Flutter | Reference measurements too noisy | [Run details](results/tables/portable-1.md#run-169f88905fdbc95c9ea7a07d) |

### TERMINAL

No paired run qualified. No speed ranking is available.

| Unranked pair | Reason | Details |
| --- | --- | --- |
| Mermaid ASCII / Termaid | Reference measurements too noisy | [Run details](results/tables/portable-1.md#run-912eed771955188d1b8f65da) |

## Evidence and previous runs

Detailed pages retain return-rate diagnostics, invalid-input controls, every outcome category and superseded attempts. Original measurements and the frozen B0 baseline are unchanged.

- [Terminal Rendering details](results/tables/community.md)
- [DaveBench — Documentation Rendering details](results/tables/docs.md)
- [Rendering time by workload details](results/tables/portable.md)
- [Mermaid Behaviour Tests details](results/tables/mermaid-behaviour.md)

<details>
<summary>Historical and maintenance diagnostics</summary>

- [Harness and Observer Regressions (unscored)](results/tables/fidelity.md)
- [Public Model Regressions (unscored)](results/tables/native-fidelity.md)
- [Mermaid Public API Tests (diagnostic)](results/tables/public-conformance.md)

</details>

- [Illustrated results: correct, incorrect and unassessed PNG outputs](docs/results-examples-2026-11-01.md)
- [1 November: fresh 27-project campaign — ranked tables](https://github.com/adewale/trident/blob/evidence/full-campaign-2026-11-01/RESULTS.md)
- [1 November raw archive: prepared; asset upload pending](https://github.com/adewale/trident/pull/74)
- [1 November: qualified time and excluded timing bindings](https://github.com/adewale/trident/blob/2c464366c5f05c01b29e41993a64e1eddb77be58/TIMING.md)
- [Frozen B0 qualification — original minimum cohorts and observer](docs/qualification-results-2026-10-31.md)
- [31 October campaign: raw archive and checksums](https://github.com/adewale/trident/releases/tag/ecosystem-evidence-2026-10-31)
- [31 October campaign: sources, reviewed images and repair receipts](https://github.com/adewale/trident/tree/9a74e093893f45d5b1316912711c5314267acd69)
- [Previous ecosystem overview and dated diagnostic studies](https://github.com/adewale/trident/blob/b555992271eef91a5b57ab7c584ac4b0b6552554/RESULTS.md)

The raw benchmark evidence archive preserves captured outputs and the reports generated at collection time. Checking its hashes and rebuilding its tables verifies preservation and reproducibility; it does not validate every drawing or grading decision.
