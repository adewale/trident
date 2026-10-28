# Worked benchmark tables

**Historical examples, not a current leaderboard.** These tables use recorded 27–28 October 2026 runs. The 27 October observers and portable protocol v3 predate PR #21. Versions, inputs and units stay attached to each table; the values are not relabelled as current-protocol results. No benchmarks were rerun to make these tables.

The [ecosystem results](../RESULTS.md) collect these retained tables alongside
every eligible project and subsequently imported campaign attempts.

Rows are stack-ranked by the named measure, best first; ties retain name order. Timing order describes historical samples with their qualification limits. `0` means an observed zero. `Blocked` means a recorded check could not be completed; missing rows remain unavailable, not zero. Each table links to the [source receipt](evidence/benchmark-examples.json). The [reporting guide](../REPORTING.md) defines the columns used for future campaigns.

## Mermaid Compatibility

28 October 2026 · selected community smoke campaign · one round · 33 feature inputs per SVG interface. These are recorded output-admission outcomes, not diagram-meaning scores. The six core inputs are a separate population.

### Node SVG

Ranking: Passed inputs / Planned inputs, highest first.

| Project | Version | Passed inputs | Failed | Unsupported | Blocked | Planned inputs |
|---|---|---:|---:|---:|---:|---:|
| Pele | 1.9.0 | 32 | 0 | 1 | 0 | 33 |
| Agentic Mermaid | 0.4.1 | 14 | 1 | 18 | 0 | 33 |

### Browser SVG

Ranking: Passed inputs / Planned inputs, highest first.

| Project | Version | Passed inputs | Failed | Unsupported | Blocked | Planned inputs |
|---|---|---:|---:|---:|---:|---:|
| Mermaid.js | 12.2.0 | 33 | 0 | 0 | 0 | 33 |
| Pele | 1.9.0 | 32 | 0 | 1 | 0 | 33 |
| Agentic Mermaid | 0.4.1 | 14 | 1 | 18 | 0 | 33 |

Mermaid.js supplies the browser reference row; it has no Node SVG row in this campaign. Each listed surface also passed its six core inputs. The 33-input feature sample is not the entire frozen corpus.

## DaveBench: Documentation Examples

27 October 2026 · browser SVG · 548 documentation occurrences, 546 distinct sources, 34 pages · five rounds. Coverage below is per round; these counts repeated in all five rounds.

Ranking: SVG returned / Planned occurrences, highest first.

| Project | Version | SVG returned | Failed | Planned occurrences | SVG return rate (%) |
|---|---|---:|---:|---:|---:|
| Frankenmermaid | 0.4.0 | 548 | 0 | 548 | 100.0% |
| Mermaid.js | 12.2.0 | 547 | 1 | 548 | 99.8% |
| Pele | 1.9.0 | 532 | 16 | 548 | 97.1% |
| Mermaid Dart | 0.3.2 | 449 | 99 | 548 | 81.9% |
| Agentic Mermaid | 0.4.1 | 340 | 208 | 548 | 62.0% |
| Zombie Mermaid | 5.10.2 | 245 | 303 | 548 | 44.7% |
| Beautiful Mermaid | 1.1.3 | 231 | 317 | 548 | 42.2% |

Mermaid.js is the reference. Mermaid ASCII is excluded from this SVG table because it is a terminal renderer. An SVG return is not a painted-meaning pass.

### One shared documentation input: render time

Input `packages/mermaid/src/docs/syntax/flowchart.md:23` · median of five public browser calls, one per round after warmup · lower time is less call cost. This table illustrates per-input timing; it is not a whole-docs speed comparison.

Ranking: Median call time (ms), lowest first.

| Project | Version | Median call time (ms) | Successful calls | Comparison qualification |
|---|---|---:|---:|---|
| Frankenmermaid | 0.4.0 | 0.4 | 5/5 | Not calibrated |
| Pele | 1.9.0 | 0.6 | 5/5 | Not calibrated |
| Mermaid Dart | 0.3.2 | 3 | 5/5 | Not calibrated |
| Agentic Mermaid | 0.4.1 | 20.2 | 5/5 | Not calibrated |
| Mermaid.js | 12.2.0 | 78.3 | 5/5 | Not calibrated |
| Beautiful Mermaid | 1.1.3 | Withheld | 0/5 | SVG return failed |
| Zombie Mermaid | 5.10.2 | Withheld | 0/5 | SVG return failed |

## Diagram Meaning

27 October 2026 · actual browser SVG · 1,180 planned SVG criteria per project. Native-model criteria are excluded from this table. A passed criterion is one check, not one diagram or an overall visual-quality score.

Ranking: Passed criteria / Planned criteria, highest first.

| Project | Version | Passed criteria | Failed | Unsupported | Blocked | Planned criteria |
|---|---|---:|---:|---:|---:|---:|
| Pele | 1.9.0 | 1118 | 5 | 14 | 43 | 1180 |
| Frankenmermaid | 0.4.0 | 1112 | 6 | 0 | 62 | 1180 |
| Mermaid.js | 12.2.0 | 1068 | 16 | 0 | 96 | 1180 |
| Mermaid Dart | 0.3.2 | 1025 | 45 | 0 | 110 | 1180 |
| Agentic Mermaid | 0.4.1 | 716 | 13 | 0 | 451 | 1180 |
| Zombie Mermaid | 5.10.2 | 477 | 13 | 0 | 690 | 1180 |
| Beautiful Mermaid | 1.1.3 | 356 | 18 | 0 | 806 | 1180 |

These older observer results include geometry findings that need fresh qualification under the corrected observer. In the recorded controlled-image case, Pele omitted the required embedded image. The total alone cannot explain a failure; the owning criterion and actual output remain the diagnostic evidence.

## Model and Editing Contracts

27 October 2026 · reviewed public models · the same 561 shared criterion identities for all three bound projects. Additional API checks are listed separately and cannot improve a shared-criteria score.

Ranking: Passed criteria / Planned shared criteria, highest first.

| Project | Version | Passed criteria | Failed | Unsupported | Blocked | Planned shared criteria |
|---|---|---:|---:|---:|---:|---:|
| Mermaid.js | 12.2.0 | 555 | 0 | 6 | 0 | 561 |
| Pele | 1.9.0 | 555 | 0 | 6 | 0 | 561 |
| Agentic Mermaid | 0.4.1 | 374 | 7 | 179 | 1 | 561 |

Beautiful Mermaid, Frankenmermaid, Mermaid Dart and Zombie Mermaid had no reviewed Trident model binding in this run. They receive no model score here; that is separate from their SVG evidence.

### Additional API checks

Ranking: Passed criteria / API-specific criteria, highest first.

| Project | Version | Passed criteria | Failed | Unsupported | Blocked | API-specific criteria |
|---|---|---:|---:|---:|---:|---:|
| Agentic Mermaid | 0.4.1 | 117 | 0 | 0 | 1 | 118 |

These 118 Agentic Mermaid checks exercise serializer/readback capabilities. They are not part of the 561 shared checks and confer no comparison bonus.

## Mermaid Assertion Replay

27 October 2026 · pinned Mermaid source · 3,995 inventoried declarations in 368 files; 85 files selected for the public-parser projection. Declarations and expanded callbacks have separate tables because parameterized tests expand into multiple callbacks.

Ranking: Passed / Planned declarations, highest first.

| Project | Version | Passed | Failed | Unavailable | Outside projection | Skipped | Unregistered | Planned declarations |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Mermaid.js | 12.2.0 | 477 | 0 | 1047 | 2453 | 15 | 3 | 3995 |
| Pele | 1.9.0 | 381 | 16 | 1127 | 2453 | 15 | 3 | 3995 |
| Agentic Mermaid | 0.4.1 | 160 | 151 | 1213 | 2453 | 15 | 3 | 3995 |

### Expanded callbacks

Ranking: Passed callbacks / Recorded callbacks, highest first.

| Project | Version | Passed callbacks | Failed | Unavailable | Skipped | Recorded callbacks |
|---|---|---:|---:|---:|---:|---:|
| Mermaid.js | 12.2.0 | 1555 | 0 | 1133 | 12 | 2700 |
| Pele | 1.9.0 | 1452 | 16 | 1220 | 12 | 2700 |
| Agentic Mermaid | 0.4.1 | 694 | 586 | 1408 | 12 | 2700 |

Mermaid.js is the projection reference, not its original-runner result. Raw matcher counters include callbacks later classified as unavailable: the reference has zero failed callbacks despite a gap between its raw matcher totals. Those counters remain diagnostic evidence, not a headline assertion success rate.

## Mermaid Reference Tests

28 October 2026 · original core Vitest runner · sealed npm environment · Mermaid reference only. Docs-site and browser/e2e runners are outside this table.

Ranking: Passed callbacks / Total callbacks, highest first.

| Reference | Version | Files | Passed callbacks | Failed | Pending | Todo | Total callbacks |
|---|---|---:|---:|---:|---:|---:|---:|
| Mermaid.js | 12.2.0 | 331 | 6677 | 0 | 16 | 2 | 6695 |

## Render Cost and Scaling

27 October 2026 · `portable-svg-processes-v3` · authored `family:flowchart` · public Node SVG calls · five rounds. **Descriptive historical timings: no current qualified speed comparison.** First calls exclude import; repeated and new-source calls use different cache workloads.

Ranking: Repeat median (ms), lowest first.

| Project | Version | First call median (ms) | Repeat median (ms) | New-source median (ms) | Declared flowchart checks | Campaign qualification |
|---|---|---:|---:|---:|---|---|
| Pele | 1.9.0 | 17.1 | 0.35 | 0.11 | Complete | Uncalibrated |
| Beautiful Mermaid | 1.1.3 | 206 | 7.46 | 4.78 | Incomplete | Failed |
| Zombie Mermaid | 5.10.2 | 326 | 8.96 | 5.72 | Incomplete | Failed |
| Agentic Mermaid | 0.4.1 | 330 | 30.5 | 20.3 | Incomplete | Failed |

Each first-call median uses 100 calls; each warm median uses 155 batch means. No relative-speed or confidence column is populated: these old campaigns failed or remained uncalibrated overall. The three call modes are not interchangeable.

### Resource checkpoint

Same Pele flowchart · round 1 · actual return checkpoint. Process RSS and JavaScript heap are separate scopes. CPU was not available in this resource record.

Ranking: Process RSS (MiB), lowest first.

| Project | Version | Checkpoint | Process RSS (MiB) | JS heap used (MiB) | CPU (ms) |
|---|---|---|---:|---:|---:|
| Pele | 1.9.0 | At API return | 67.61 | 11.48 | Unavailable |

## Evidence and methods

The [receipt](evidence/benchmark-examples.json) contains the numeric table data, exact raw-file digests and the shared-model criterion-set digest. Raw artifacts remain outside the source repository; the [results snapshot](../results/latest.json) retains the small comparative tables.

[Benchmark methods](../BENCHMARKS.md) · [table conventions](../REPORTING.md) · [description edits](benchmark-description-review.md) · [comparative benchmark research](reporting-research.md).
