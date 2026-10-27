# All benchmark scorecards

Assembled 27 October 2026 from retained reports. This is a report index, not a new full benchmark run. Dates, exact builds and different machine cohorts stay separate. **No numeric score is available for every suite.** The ledger at the end includes every documented entry and shows missing, blocked and failed evidence.

[How to run every entry](../BENCHMARKS.md) · [Benchmark inventory](../INVENTORY.md) · [Measurement rules](../MEASUREMENT.md)

## Davebench: official Mermaid docs

Measured **25 October 2026**, 18:35:37–18:37:42 UTC, Chromium 154, three counterbalanced rounds and 30 warm-up attempts per engine/round; ELK cache disabled. **1,095 fence occurrences, 546 distinct examples, 34 pages**. Same docs denominator for every engine. Candidate Agentic Mermaid 0.4.2 source `f8a2437b19e67a850145b786f72baf719da52837`, archive `6ee46d4915028a25dd97dcbe4b834b1e3c5686537e2857dedf582b876eadd275`. This is not the 27 October main artifact.

| Project | Version | Returns SVG in every round | Acceptance | Complete browser bundle gzip |
|---|---|---:|---:|---:|
| Agentic Mermaid | 0.4.2 | 823/1,095 | 75.2% | 1,166.0 KiB |
| Pele | 1.9.0 | 1,063/1,095 | 97.1% | 257.1 KiB |
| Mermaid | 12.2.0 | 1,061/1,095 | 96.9% | 1,534.1 KiB |

Agentic Mermaid / Pele render-call cost is **21.43×** on their 823 shared-success occurrences (per-round ratios 11.55, 21.43, 22.29). Agentic Mermaid / Mermaid cost is **0.143497×** on their 821 shared-success occurrences. These pairwise cohorts differ; do not infer a single transitive speed ranking. Lower cost ratios mean less render-call time. Import, validation and paint are outside these clocks. Failures remain in acceptance; fast rejection cannot improve matched timing. Three rounds are advisory, not calibrated release qualification.

Agentic Mermaid misses 270 unsupported-family occurrences plus two Gantt examples rejected by its default raw-`themeCSS` policy. Event Modeling accounts for 26 and ZenUML for 32 of those occurrences. Successful SVG returns do not establish faithful meaning or drawing. Older Dave reports with **Pele 1.6.0** remain separate; Beautiful Mermaid, Zombie Mermaid and Frankenmermaid have community scores, but no Davebench score is published for them.

[Davebench methods and reproduction](../docs/davebench.md) · [Retained cost/admission summary](../COMMUNITY-RANKING.md#pinned-mermaid-baseline-25-october-2026) · [Immutable detailed source](https://github.com/adewale/agentic-mermaid/blob/753be1e2fb33bba7bd8b807730d744bf1c247382/docs/community-benchmark-ranking.md#original-dave-workload)

## Community: output admission and API costs

Use the complete cards for every measured surface:

| Campaign | Project/build coverage | Cards |
|---|---|---|
| 27 Oct original host cohort | Mermaid, Pele, Mermaid Dart, Mermaid ASCII; Agentic Mermaid release plus six candidate builds | [Browser SVG, terminal, delivery and memory](review-20261027/README.md), [per-candidate reports](review-20261027/runs.json), [all 42 surface scorecards](review-20261027/lanes.md) |
| 27 Oct addition host cohort | Beautiful Mermaid 1.1.3, Zombie Mermaid 5.10.2, Frankenmermaid 0.4.0; fresh Mermaid/Pele controls | [SVG, terminal, parser and per-family cards](review-20261027/additions/README.md), owning records and failure pages linked there |
| 26 Oct historical host cohort | Five project records with the earlier 23-family mark | [Historical surface tables](README.md) |

The addition cohort uses a different machine; absolute times/ranks are not pooled. Community admission checks format and available labels, not complete native models or painted fidelity. All 27 October records retain measured failures. SVG, terminal, PNG and parser boundaries have separate cards, not one overall percentage.

## Independent meaning, paint and original tests

Measured 26 October 2026 on **91 authored cases/edits across 25 families**. Agentic Mermaid source `5d1e3f76c8e9280400652b0b862ad35d01eaf69a`. The denominator below is reference-qualified: 1,623 of 1,741 declared criteria. Mermaid has 118 additional failed/unavailable criteria, so its qualified 100% is not a perfect score on the whole authored universe.

| Project | Public SVG/API | Owned paint | Native models | Expanded original callbacks, reference-qualified |
|---|---:|---:|---:|---:|
| Mermaid | 245/245 | 823/823 | 555/555 | 1,555/1,555 |
| Pele | 243/245 | 809/823 | 555/555 | 1,440/1,555 |
| Agentic Mermaid | 241/245 | 798/823 | 542/555 | 790/1,555 |

The callback projection preserves strict original expectations; private representation/diagnostic mismatches are not automatically drawing defects. Genuine Mermaid core Vitest execution separately passed **6,677 expanded callbacks**, with 16 pending and two todo, no failures/unavailable files, and **99/99 snapshots** unchanged.

[All 43 project paint cards and qualifications](../COMMUNITY-RANKING.md#owned-paint-stack-rank) · [Portable historical comparison data](../examples/fidelity-2026-10-26/README.md) · [Fidelity documentation](../fidelity/README.md)

## Pinned baseline: distinct costs

Measured 25 October 2026; the Agentic Mermaid artifact is the same `f8a2437b…` snapshot identified in the Dave card. Lower cost ratios mean less work in the named unit, with Mermaid = 1. These scopes differ from the 27 October community API portfolio.

| Operation or resource | Agentic Mermaid / Mermaid | Pele / Mermaid |
|---|---:|---:|
| Browser SVG, 48-case reused-page batch | 0.2989 | 0.0616 |
| Fresh browser through first consumed SVG | 0.6545 | 0.4834 |
| Forced-GC document V8 heap, output held | 0.3853 | 0.1119 |
| Requested-file gzip estimate through first SVG | 0.3209 | 0.0841 |
| Fresh Node through first consumed parser result | 0.3864 | 0.1407 |
| Node whole-child peak RSS | 0.5337 | 0.3459 |

The browser renderer uses five counterbalanced rounds and same-artifact controls; startup uses 25 fresh samples per role and resources five separate passes. Node ratios are descriptive/unpaired and return shapes differ. Heap excludes native/WASM/GPU memory. Gzip is a requested-file estimate, not measured wire transfer. [Full qualifications](../COMMUNITY-RANKING.md#current-matched-costs) · [Methods](../visualizations/MERMAID-BASELINE.md).

## Fresh public-entry startup

Measured 25 October 2026 against the `f8a2437b…` Agentic Mermaid artifact, 25 fresh process observations per entry; p95 is nearest rank. RSS comes from five **separate** whole-child resource passes. These are entry startup scores, not pure API time.

| Runtime | Project / entry | Median / p95 first consumed result, ms | Median peak RSS, MiB |
|---|---|---:|---:|
| Node 24.19 | Agentic Mermaid root | 267.00 / 291.18 | 64.86 |
| Node 24.19 | Agentic Mermaid `./svg` | 210.81 / 231.53 | 61.65 |
| Node 24.19 | Pele root | 63.14 / 70.15 | 37.09 |
| Bun 1.4.2 | Agentic Mermaid root | 269.76 / 320.48 | 96.06 |
| Bun 1.4.2 | Agentic Mermaid `./svg` | 256.19 / 290.12 | 74.69 |
| Bun 1.4.2 | Pele root | 96.53 / 108.03 | 59.54 |

147 Agentic Mermaid and 76 Pele primary interfaces were enrolled in that campaign; unavailable hosted MCP remains blocked. These six rows are the retained comparable SVG-entry excerpt, not all interface scores. Full per-interface raw startup data is not bundled in Git. [Immutable retained summary](https://github.com/adewale/agentic-mermaid/blob/753be1e2fb33bba7bd8b807730d744bf1c247382/docs/community-benchmark-ranking.md#fresh-entry-startup-and-resources) · [Startup guide](../visualizations/README.md).

## Invocation and direct operation witnesses

The separate full invocation campaign on 25 October 2026 measured Agentic Mermaid source `c31d16d002adcad518b7fa9fa67f85d9be26eba6`: **62,938 passed, 3 failed, 0 blocked observations out of 62,941** on 23 representative inputs. The three watch failures remain failures. A complete declared attempt census is not every public function or language feature. The later 26 October smoke in the ledger below is a smaller, different campaign.

The historical direct packed-package family probes witnessed **44/279 advertised family–operation kinds**; 235 were unmeasured by that generic probe. Other owning tests have additional behavior checks but do not automatically close that operation map. [Immutable invocation and operation summaries](https://github.com/adewale/agentic-mermaid/blob/753be1e2fb33bba7bd8b807730d744bf1c247382/docs/community-benchmark-ranking.md#independent-latest-invocation-complete-declared-attempt-census).

## Every entry: score and evidence availability

The **24 October historical process ledger** below is preserved from the [immutable pre-cleanup report](https://github.com/adewale/agentic-mermaid/blob/753be1e2fb33bba7bd8b807730d744bf1c247382/docs/community-benchmark-ranking.md#original-suite-ledger). A historical process pass is not a numeric quality/performance score; where native metrics are not bundled, that gap remains. Original failed statuses are not overwritten by later scoped repairs. Counts are owning tests passed / failed / skipped. The separate **26 October smoke** is local evidence on target `c82fcfa7…`, not a complete campaign. Rows without a retained numeric result say so rather than receiving invented zeroes.

| Entry / documentation | 24 Oct process / owning tests | Later retained result or explicit gap |
|---|---|---|
| [`mermaid-fidelity`](../BENCHMARKS.md#meaning-and-reference-entries) | No entry in that historical ledger | 26 Oct: see independent meaning/paint/native card above. |
| [`community-fidelity`](../BENCHMARKS.md#meaning-and-reference-entries) | No entry in that historical ledger | 26 Oct: 43 project rows; [all paint scores](../COMMUNITY-RANKING.md#owned-paint-stack-rank). |
| [`upstream-fidelity`](../BENCHMARKS.md#meaning-and-reference-entries) | No entry in that historical ledger | 26 Oct: reference-qualified callbacks: Mermaid 1,555; Pele 1,440; Agentic Mermaid 790 / 1,555. |
| [`upstream-original`](../BENCHMARKS.md#meaning-and-reference-entries) | No entry in that historical ledger | 26 Oct: 6,677 pass, 16 pending, 2 todo; 99/99 snapshots. |
| [`mermaid-baseline-browser`](../BENCHMARKS.md#public-apis-and-resources-entries) | No entry in that historical ledger | 25 Oct: see matched cost card above; 51/53 Agentic Mermaid, 52/53 Pele and Mermaid checks. |
| [`mermaid-baseline-compatibility`](../BENCHMARKS.md#public-apis-and-resources-entries) | No entry in that historical ledger | 25 Oct: parser bindings 70/74 Agentic Mermaid, 73/74 Pele and Mermaid. |
| [`family`](../BENCHMARKS.md#correctness-and-output-quality-entries) | failed; native score not bundled | 26 Oct smoke: 920 passed observations; limited fixture/operation scope. |
| [`stable-support`](../BENCHMARKS.md#meaning-and-reference-entries) | No entry in that historical ledger | 25 Oct required admission: Agentic Mermaid 20/22, Pele 21/22; policy-stable subset 20/20 each. 26 Oct smoke: 23 passed, 2 failed probes with a different scope. |
| [`entry-startup`](../BENCHMARKS.md#public-apis-and-resources-entries) | No entry in that historical ledger | 25 Oct: see startup card above; hosted MCP blocked. |
| [`upstream-test-assertions`](../BENCHMARKS.md#meaning-and-reference-entries) | No entry in that historical ledger | 25 Oct: original Mindmap/GitGraph callbacks: 75/100 Agentic Mermaid, 90/100 Pele and Mermaid. |
| [`invocation`](../BENCHMARKS.md#public-apis-and-resources-entries) | failed; native score not bundled | 26 Oct smoke: 25,535 passed observations, 1 blocked runtime; incomplete. |
| [`pinned-reference-score`](../BENCHMARKS.md#meaning-and-reference-entries) | failed; native score not bundled | 25 Oct: 2,498/2,626 Agentic Mermaid; 2,620/2,626 Mermaid criteria per round; selected historical inputs. |
| [`community`](../BENCHMARKS.md#public-apis-and-resources-entries) | failed; native score not bundled | 27 Oct: [original cohort](review-20261027/README.md) and [addition cohort](review-20261027/additions/README.md); failures retained. |
| [`community-cli`](../BENCHMARKS.md#public-apis-and-resources-entries) | No entry in that historical ledger | 27 Oct: Mermaid ASCII 234/395 raw terminal admissions; [record summary](review-20261027/README.md#admission-across-families-and-outputs). |
| [`samples`](../BENCHMARKS.md#performance-diagnostics-entries) | passed; native score not bundled | 26 Oct smoke process completed; no competitive score. |
| [`dave`](../BENCHMARKS.md#public-apis-and-resources-entries) | passed; native score not bundled | 25 Oct: see Davebench card above (uniform Pele 1.9.0 cohort). |
| [`micro`](../BENCHMARKS.md#performance-diagnostics-entries) | passed; native score not bundled | No later retained numeric score published here. |
| [`experiments`](../BENCHMARKS.md#performance-diagnostics-entries) | passed; native score not bundled | No later retained numeric score published here. |
| [`pipeline`](../BENCHMARKS.md#performance-diagnostics-entries) | passed; native score not bundled | No later retained numeric score published here. |
| [`peers`](../BENCHMARKS.md#performance-diagnostics-entries) | passed; native score not bundled | No later retained numeric score published here. |
| [`release`](../BENCHMARKS.md#performance-diagnostics-entries) | failed; native score not bundled | No later retained numeric score published here. |
| [`release:browser`](../BENCHMARKS.md#performance-diagnostics-entries) | passed; native score not bundled | No later retained numeric score published here. |
| [`modern-summary`](../BENCHMARKS.md#editor-applications-entries) | No entry in that historical ledger | Report reader; no independent benchmark score. |
| [`peers:qualify`](../BENCHMARKS.md#performance-diagnostics-entries) | No entry in that historical ledger | 25 Oct: completed, uncalibrated; performanceQualified=false. |
| [`render-stages`](../BENCHMARKS.md#performance-diagnostics-entries) | passed; native score not bundled | No later retained numeric score published here. |
| [`performance-profile`](../BENCHMARKS.md#performance-diagnostics-entries) | passed; native score not bundled | No later retained numeric score published here. |
| [`endpoint-marker`](../BENCHMARKS.md#correctness-and-output-quality-entries) | No entry in that historical ledger | No retained measured score published. |
| [`output-identity`](../BENCHMARKS.md#correctness-and-output-quality-entries) | passed; native score not bundled | No later retained numeric score published here. |
| [`editor-preview`](../BENCHMARKS.md#editor-applications-entries) | passed; native score not bundled | No later retained numeric score published here. |
| [`editor-session`](../BENCHMARKS.md#editor-applications-entries) | passed; native score not bundled | No later retained numeric score published here. |
| [`editor-ownership`](../BENCHMARKS.md#editor-applications-entries) | failed; native score not bundled | No later retained numeric score published here. |
| [`renderer-profile`](../BENCHMARKS.md#performance-diagnostics-entries) | passed; native score not bundled | No later retained numeric score published here. |
| [`browser-contracts`](../BENCHMARKS.md#correctness-and-output-quality-entries) | failed; 59 / 4 / 0 | No later retained numeric score published here. |
| [`distribution-cli`](../BENCHMARKS.md#correctness-and-output-quality-entries) | passed; 52 / 0 / 0 | No later retained numeric score published here. |
| [`distribution-native`](../BENCHMARKS.md#correctness-and-output-quality-entries) | passed; 4 / 0 / 0 | No later retained numeric score published here. |
| [`distribution-dist-fuzz`](../BENCHMARKS.md#correctness-and-output-quality-entries) | failed; 4 / 1 / 0 | No later retained numeric score published here. |
| [`distribution-tarball`](../BENCHMARKS.md#correctness-and-output-quality-entries) | failed; 9 / 1 / 0 | No later retained numeric score published here. |
| [`distribution-tarball-node22`](../BENCHMARKS.md#correctness-and-output-quality-entries) | failed; 9 / 1 / 0 | No later retained numeric score published here. |
| [`browser-lazy-delivery`](../BENCHMARKS.md#correctness-and-output-quality-entries) | passed; native score not bundled | No later retained numeric score published here. |
| [`family-contracts`](../BENCHMARKS.md#correctness-and-output-quality-entries) | passed; 32 / 0 / 0 | 26 Oct smoke: 31/0/0 owning tests. |
| [`family-functionality`](../BENCHMARKS.md#correctness-and-output-quality-entries) | failed; 4386 / 2 / 1 | No later retained numeric score published here. |
| [`upstream-imported`](../BENCHMARKS.md#meaning-and-reference-entries) | passed; 996 / 0 / 11 | No later retained numeric score published here. |
| [`pinned-semantic-tests`](../BENCHMARKS.md#meaning-and-reference-entries) | passed; 48 / 0 / 0 | No later retained numeric score published here. |
| [`pinned-operation-tests`](../BENCHMARKS.md#meaning-and-reference-entries) | passed; 53 / 0 / 0 | No later retained numeric score published here. |
| [`pinned-grammar-tests`](../BENCHMARKS.md#meaning-and-reference-entries) | passed; 23 / 0 / 0 | No later retained numeric score published here. |
| [`pinned-semantic-corpus`](../BENCHMARKS.md#meaning-and-reference-entries) | passed; native score not bundled | No later retained numeric score published here. |
| [`pinned-grammar-corpus`](../BENCHMARKS.md#meaning-and-reference-entries) | passed; native score not bundled | No later retained numeric score published here. |
| [`family-portfolio`](../BENCHMARKS.md#preparation-and-agent-campaigns-entries) | passed; native score not bundled | No later retained numeric score published here. |
| [`agent-replay`](../BENCHMARKS.md#preparation-and-agent-campaigns-entries) | passed; 52 / 0 / 0 | No later retained numeric score published here. |
| [`agent-live`](../BENCHMARKS.md#preparation-and-agent-campaigns-entries) | blocked; native score not bundled | No later retained numeric score published here. |
| [`mcp-conformance`](../BENCHMARKS.md#preparation-and-agent-campaigns-entries) | passed; native score not bundled | No later retained numeric score published here. |
| [`style-audit`](../BENCHMARKS.md#correctness-and-output-quality-entries) | passed; 54 / 0 / 0 | No later retained numeric score published here. |
| [`sketch-check`](../BENCHMARKS.md#correctness-and-output-quality-entries) | passed; 102 / 0 / 0 | No later retained numeric score published here. |
| [`agent-subagent`](../BENCHMARKS.md#preparation-and-agent-campaigns-entries) | blocked; native score not bundled | No later retained numeric score published here. |
| [`layout-compare`](../BENCHMARKS.md#correctness-and-output-quality-entries) | passed; native score not bundled | No later retained numeric score published here. |
| [`route-enumeration`](../BENCHMARKS.md#correctness-and-output-quality-entries) | passed; native score not bundled | No later retained numeric score published here. |
| [`visual-rubric`](../BENCHMARKS.md#correctness-and-output-quality-entries) | passed; native score not bundled | No later retained numeric score published here. |
| [`heuristic-tracker`](../BENCHMARKS.md#correctness-and-output-quality-entries) | passed; native score not bundled | No later retained numeric score published here. |
| [`ugly-audit`](../BENCHMARKS.md#correctness-and-output-quality-entries) | passed; native score not bundled | No later retained numeric score published here. |
| [`prs`](../BENCHMARKS.md#preparation-and-agent-campaigns-entries) | skipped; native score not bundled | 27 Oct: six captured source builds in [candidate cards](review-20261027/README.md#captured-pr-heads-and-main-snapshots-browser-svg); not isolated PR causality. |
| [`portable-community`](../BENCHMARKS.md#public-apis-and-resources-entries) | No entry in that historical ledger | 27 Oct local release-kit smoke only: 207 family workers, 0 failures; 0/69 calibrated timing rows. No portable full-calibration score is bundled. |
| [`editor-delivery`](../BENCHMARKS.md#editor-applications-entries) | No entry in that historical ledger | No retained measured score published. |
| [`palette-performance`](../BENCHMARKS.md#performance-diagnostics-entries) | No entry in that historical ledger | No retained measured score published. |
| [`modern-editor`](../BENCHMARKS.md#editor-applications-entries) | No entry in that historical ledger | No retained measured score published. |

`distribution-dist-fuzz` is conditional and absent in the audited checkout; `modern-summary` is a reader. The ledger documents both instead of inflating the number of independent experiments. Standalone external evaluations and callable helpers are separately [inventoried](../INVENTORY.md#direct-entry-points-report-tools-and-external-evaluations); no live-provider, private-skill or external-judge score is implied.

## Evidence and documentation limits

The 27 October addition records and failure pages are bundled. The original 27 October community snapshot bundles aggregates and exact record identities; full raw owning records/artifacts remain external. Older Dave, startup, regression and full-suite entries are retained **published summaries**, not newly revalidated raw samples. Missing original witness/sample files prevent a fresh audit or reduction from those summaries alone. Recollect against a new artifact if a current-head or calibrated release claim is needed.

Every listed entry now has a scope, owner and runnable guide. That does not mean every entry has a standalone detailed methodology page or a complete published scorecard. Dave has its own guide; fidelity, baseline, startup, community and the unified runner have deeper existing guides. Instrumented diagnostics and product test groups use their documented owning protocol; unavailable raw metrics and external prerequisites remain explicit.
