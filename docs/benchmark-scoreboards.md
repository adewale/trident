# Benchmark scoreboards

**Historical subset results.** The current portfolio is DaveBench, Drawing Correctness and Mermaid Fidelity (see `docs/benchmark-portfolio.md`). These tables retain their original populations; they are not scores for the expanded drawing corpus or the full upstream Fidelity benchmark.

Each benchmark has one task, one score direction and its own stack rank. Equal scores share a rank. Entirely unresolved results stay unranked. No speed tie-break is invented for case tests.

Case ranks order recorded passes on the fixed planned cases. Unresolved assessments remain visible. Timing ranks apply only within each qualified paired workload. This report runs no renderers or output graders.

**Breadth policy:** Retire a standalone benchmark if a reviewed eligibility census establishes that at most two projects can meaningfully participate and no Trident collection, binding or assessment gap explains the limit. Missing evidence does not establish ineligibility. Known failures count as measured results.

API compatibility, terminal invalid-input rejection and matched-workload timing are coverage-repair diagnostics. Their small recorded cohorts have documented Trident gaps; they are not established broad ecosystem benchmarks.

## Terminal Drawing Facts

**Task:** Render the fixed 116 terminal drawing examples and satisfy every required fact in each whole case.

**Better:** Verified whole-case passes, highest first. More of the fixed examples satisfy their specified drawing checks.

**Ties:** Equal pass counts share a rank. No comparable time tie-break was recorded.

**Source measurements:** 2026-11-01; 116 planned cases per project. No new collection.

**Participation:** 18 recorded; 16 with rankable outcomes; 14 with at least one pass; 2 unranked.

| Rank | Project | Version | Passed | Nonpasses | Unresolved |
|---:|---|---|---:|---:|---:|
| 1 | Termaid | 0.10.0 | 65 | 33 | 18 |
| 2 | Zombie Mermaid | 5.10.2 | 60 | 12 | 44 |
| 3 | Agentic Mermaid | 0.4.1 | 58 | 16 | 42 |
| 4 | Loom renderer | 0.10.0 | 43 | 27 | 46 |
| 5 | Mermaid ASCII | 1.6.1 | 42 | 24 | 50 |
| 6 | MermaidText | git-a6b0c7657b94 | 40 | 24 | 52 |
| 7 | Beautiful Mermaid | 1.1.3 | 35 | 23 | 58 |
| 8 | Ondine | 0.0.3 | 31 | 26 | 59 |
| 9 | ASCII Mermaid | 0.1.0 | 28 | 38 | 50 |
| 10 | OpenCode Merman | 2.0.26 | 20 | 33 | 63 |
| 11 | Figurehead | v0.4.3 | 18 | 28 | 70 |
| 12 | Kitlangton Merman | 0.2.1 | 17 | 32 | 67 |
| 13 | Merslim | 0.2.3 | 16 | 48 | 52 |
| 14 | MermaidTUI | 0.0.6 | 7 | 6 | 103 |
| 15 | Frankenmermaid | 0.4.0 | 0 | 1 | 115 |
| 15 | Grok renderer | git-2bdd1d6a6369 | 0 | 24 | 92 |

**Unranked:** Crafter Mermaid, Latias Merman. No verified terminal drawing observations

Source table: `run-f713bed5d1748b27fd042e31` · [Owning evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/3/report.json).

## Mermaid Behaviour Tests

**Task:** Pass all assertions in each of 49 selected public family-detection and SVG naming cases.

**Better:** Passed whole cases, highest first. More of the selected observable Mermaid behaviours work through the public interface.

**Ties:** Equal pass counts share a rank. Individual assertions are not extra votes.

**Source measurements:** 2026-11-01; 49 planned cases per project. No new collection.

**Participation:** 27 recorded; 14 with rankable outcomes; 11 with at least one pass; 13 unranked.

| Rank | Project | Version | Passed | Nonpasses | Unresolved |
|---:|---|---|---:|---:|---:|
| 1 | Mermaid | 12.2.0 | 49 | 0 | 0 |
| 1 | Pele | 1.9.0 | 49 | 0 | 0 |
| 3 | Agentic Mermaid | 0.4.1 | 29 | 0 | 20 |
| 4 | Frankenmermaid | 0.4.0 | 27 | 3 | 19 |
| 5 | XMermaid | 0.4.2 | 26 | 4 | 19 |
| 6 | Merslim | 0.2.3 | 25 | 16 | 8 |
| 7 | Bezel | 0.2.21 | 19 | 0 | 30 |
| 7 | Ondine | 0.0.3 | 19 | 0 | 30 |
| 9 | Latias Merman | 0.9.2 | 18 | 0 | 31 |
| 10 | VitePress Plugin Diagram | 0.3.2 | 8 | 2 | 39 |
| 11 | Kitlangton Merman | 0.2.1 | 6 | 0 | 43 |
| 12 | DSH Mermaid GB SVG | 0.1.4 | 0 | 17 | 32 |
| 12 | Mermaid Dart | 0.3.2 | 0 | 16 | 33 |
| 12 | Mermaid RS Renderer | 0.3.1 | 0 | 19 | 30 |

**Unranked:** ASCII Mermaid, Beautiful Mermaid, Crafter Mermaid, Figurehead, Grok renderer, Loom renderer, Mermaid ASCII, Mermaid Flutter, MermaidText, MermaidTUI, OpenCode Merman, Termaid, Zombie Mermaid. No resolved case outcomes.

Source table: `run-d633d9462dda6970cc8b462b` · [Owning evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/4/report.json).

## Mermaid API Compatibility

**Task:** Pass the 154 selected unchanged Mermaid public API test callbacks.

**Better:** Passed callbacks, highest first. More of these specific Mermaid API contracts can be used unchanged.

**Ties:** Equal pass counts share a rank. No comparable time tie-break was recorded.

**Source measurements:** 2026-10-31; 154 planned cases per project. No new collection.

**Participation:** 2 recorded; 2 with rankable outcomes; 2 with at least one pass; 0 unranked.

**Status:** Trident coverage-repair diagnostic (breadth reviewed 2026-11-02). Only two projects were collected. Public-test campaign bindings are not enrolled; Trident reports adapter-missing rather than measured project incapability.

**Repair:** Enroll reviewed public-operation bindings for additional projects, recording real incompatible or unsupported APIs as nonpasses. Establish eligibility before deciding whether to retire the standalone comparison.

| Rank | Project | Version | Passed | Nonpasses | Unresolved |
|---:|---|---|---:|---:|---:|
| 1 | Mermaid | 12.2.0 | 154 | 0 | 0 |
| 2 | Agentic Mermaid | 0.4.1 | 59 | 90 | 5 |

Source table: `public-tests-c3939522719cf814e30c57c5` · [Owning evidence](../docs/evidence/b0/receipt.json).

## Terminal Invalid-input Rejection

**Task:** Explicitly reject the four independently invalid terminal-source controls.

**Better:** Verified correct rejections, highest first. More known-invalid sources receive the required rejection. Generic crashes and untyped failures earn no credit.

**Ties:** Equal correct-rejection counts share a rank.

**Source measurements:** 2026-11-01; 4 planned cases per project. No new collection.

**Participation:** 18 recorded; 3 with rankable outcomes; 1 with at least one pass; 15 unranked.

**Status:** Trident coverage-repair diagnostic (breadth reviewed 2026-11-02). The corpus includes 18 projects, but 15 have no resolved rejection outcomes. Missing typed-outcome capture/classification leaves them unknown; it does not establish that they cannot participate.

**Repair:** Complete public acceptance/rejection capture for each existing terminal transport. Preserve the distinction between source rejection and crashes, transport errors or unsupported families.

| Rank | Project | Version | Passed | Nonpasses | Unresolved |
|---:|---|---|---:|---:|---:|
| 1 | Mermaid ASCII | 1.6.1 | 2 | 0 | 2 |
| 2 | Figurehead | v0.4.3 | 0 | 1 | 3 |
| 2 | Termaid | 0.10.0 | 0 | 4 | 0 |

**Unranked:** Agentic Mermaid, ASCII Mermaid, Beautiful Mermaid, Crafter Mermaid, Frankenmermaid, Grok renderer, Kitlangton Merman, Latias Merman, Loom renderer, MermaidText, MermaidTUI, Merslim, Ondine, OpenCode Merman, Zombie Mermaid. No typed source-rejection observations

Source table: `run-cfd32885f5059ffe15d60844` · [Owning evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/3/report.json).

## Matched-workload Rendering Time

**Task:** Complete the same fixed rendering workload in a paired run with qualified sampled outputs and reference measurements.

**Better:** Paired time ratio, lowest first, within each matched run. The same qualified work takes less time relative to that run’s repeated reference.

**Ties:** Equal ratios share a rank. Different pairs and workloads do not share a speed rank.

**Status:** Trident coverage-repair diagnostic. Two latest paired SVG comparisons qualify, covering three distinct projects. Reference noise and capture/runtime failures withhold other pairs; broader qualification has not been established.

**Participation:** 3 distinct qualified projects across 2 pairs; 7 distinct projects in the latest paired attempts.

**Repair:** Repair and stabilize collection on the same predeclared workload, then extend adapter/assessment coverage. DaveBench already supplies broad completion-and-time rankings; retain these stricter comparisons as diagnostics during repair.

### SVG: Bezel / Mermaid

6 examples; 6 rounds; 2026-11-01.

| Rank | Project | Workload ms | Time ratio |
|---:|---|---:|---:|
| 1 | Bezel | 229.6 | 0.160 |
| 2 | Mermaid | 1434.4 | 1.000 |

Source table: `run-3a7bff74601aaf7979d96677` · [Owning evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/7/timing-bundle-faef08653bc195e68bbc8c90.json).

### SVG: Ondine / Mermaid

6 examples; 6 rounds; 2026-11-01.

| Rank | Project | Workload ms | Time ratio |
|---:|---|---:|---:|
| 1 | Ondine | 125.1 | 0.085 |
| 2 | Mermaid | 1458.2 | 1.000 |

Source table: `run-fbd4eb61273053c68183839c` · [Owning evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/5/timing-bundle-61c17619018ebfe1fd24cfd3.json).

### Unranked timing attempts

| Format | Pair | Reason |
|---|---|---|
| png | Mermaid / Mermaid Flutter | Reference measurements too noisy. |
| terminal | Mermaid ASCII / Termaid | Reference measurements too noisy. |
| svg | Mermaid / Pele | Reference measurements too noisy. |

## Unscored maintenance checks

- **Harness and Observer Regressions:** Development checks test Trident; they do not compare renderer results.
- **Public Model Regressions:** Optional API maintenance checks have no shared renderer score.

Nonpasses include recorded failures and proven unsupported cases. They exclude unresolved assessments and binding gaps. Fully unresolved rows have no rank. The original numeric snapshot and frozen baseline are unchanged.
