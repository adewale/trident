# Benchmark campaign results — 2 November 2026

**DaveBench was collected. Drawing Correctness and Mermaid Fidelity remain unimplemented at their newly agreed scope, so no overall winner can be established.** The earlier 116-case terminal and 49/154-case compatibility selections are not substituted for those benchmarks.

1342 documentation occurrences per format; three runs after the same 30 warm-ups. Completed counts show the minimum across the three full runs; times show their median total. The numeric run table retains every repeat. Outputs were discarded without drawing assessment. Versions were frozen at campaign preparation (2026-11-02T15:09:38.022Z).

| Benchmark | Result |
|---|---|
| DaveBench | 150 measured runs; 201,300 timed calls. |
| Drawing Correctness | Not run: the expanded issue/test corpus and cross-format assessment campaign are not implemented. |
| Mermaid Fidelity | Not run: the shared full pinned-upstream-suite runner and project adapters are not implemented. |

## DaveBench — SVG

**More completions wins; lower median total time breaks ties.** Times include failed calls. The timeout is 15 seconds per call; timeouts are included in failures. CLI process startup is included in CLI rows; persistent API initialization is excluded.

| Rank | Project | Version | Completed | Failed | Timeouts in runs 1/2/3 | Median total seconds | Boundary |
|---:|---|---|---:|---:|---|---:|---|
| 1 | Dicklesworthstone/frankenmermaid | 0.4.0 | 1342 | 0 | 0 / 0 / 0 | 1.369 | Chromium public SVG API |
| 2 | sandyyst/dsh-plugin-mermaid-gb-svg | 0.1.5 | 1340 | 2 | 0 / 0 / 0 | 0.192 | Chromium public SVG API |
| 3 | Latias94/merman | 0.9.3 | 1338 | 4 | 0 / 0 / 0 | 10.763 | native CLI svg; process startup included |
| 4 | mermaid-js/mermaid | 12.2.0 | 1336 | 6 | 0 / 0 / 0 | 46.532 | Chromium public SVG API |
| 5 | wevm/ondine | 0.0.3 | 1306 | 36 | 0 / 0 / 0 | 0.291 | Chromium public SVG API |
| 6 | crabtalk/bezel | 0.2.24 | 1306 | 36 | 0 / 0 / 0 | 0.413 | Chromium public SVG API |
| 7 | obsidianmd/pele | 1.13.0 | 1306 | 36 | 0 / 0 / 0 | 0.699 | Chromium public SVG API |
| 8 | 1jehuang/mermaid-rs-renderer | 0.3.1 | 1306 | 36 | 0 / 0 / 0 | 14.047 | native CLI svg; process startup included |
| 9 | orestesgaolin/mermaid | 0.3.2 | 1114 | 228 | 0 / 0 / 0 | 0.994 | Chromium public SVG API |
| 10 | adewale/agentic-mermaid | 0.5.6 | 1066 | 276 | 0 / 0 / 0 | 7.091 | Chromium public SVG API |
| 11 | emtyty/merslim | 0.2.3 | 700 | 642 | 0 / 0 / 0 | 20.511 | Chromium public SVG API |
| 12 | evangwt/xmermaid | 0.4.2 | 682 | 660 | 0 / 0 / 0 | 0.709 | Chromium public SVG API |
| 13 | dfadler/zombie-mermaid | 5.14.1 | 593 | 749 | 0 / 0 / 0 | 2.395 | Chromium public SVG API |
| 14 | lukilabs/beautiful-mermaid | 1.1.3 | 537 | 805 | 0 / 0 / 0 | 1.390 | Chromium public SVG API |
| 15 | crafter-station/mermaid | 0.0.3 | 512 | 830 | 0 / 0 / 0 | 0.371 | Chromium public SVG API |
| 16 | KlangHaus/vitepress-plugin-diagram | 0.3.2 | 398 | 944 | 0 / 0 / 0 | 0.116 | Chromium public SVG API |

## DaveBench — PNG

**More completions wins; lower median total time breaks ties.** Times include failed calls. The timeout is 15 seconds per call; timeouts are included in failures. CLI process startup is included in CLI rows; persistent API initialization is excluded.

| Rank | Project | Version | Completed | Failed | Timeouts in runs 1/2/3 | Median total seconds | Boundary |
|---:|---|---|---:|---:|---|---:|---|
| 1 | Dicklesworthstone/frankenmermaid | 0.4.0 | 1342 | 0 | 0 / 0 / 0 | 18.750 | Chromium SVG API + canvas PNG conversion |
| 2 | sandyyst/dsh-plugin-mermaid-gb-svg | 0.1.5 | 1340 | 2 | 0 / 0 / 0 | 6.951 | Chromium SVG API + canvas PNG conversion |
| 3 | mermaid-js/mermaid | 12.2.0 | 1336 | 6 | 0 / 0 / 0 | 68.114 | Chromium SVG API + canvas PNG conversion |
| 4 | crabtalk/bezel | 0.2.24 | 1306 | 36 | 0 / 0 / 0 | 8.924 | Chromium SVG API + canvas PNG conversion |
| 5 | obsidianmd/pele | 1.13.0 | 1306 | 36 | 0 / 0 / 0 | 9.703 | Chromium SVG API + canvas PNG conversion |
| 6 | wevm/ondine | 0.0.3 | 1306 | 36 | 0 / 0 / 0 | 9.885 | Chromium SVG API + canvas PNG conversion |
| 7 | 1jehuang/mermaid-rs-renderer | 0.3.1 | 1306 | 36 | 0 / 0 / 0 | 40.221 | native CLI png; process startup included |
| 8 | Latias94/merman | 0.9.3 | 1280 | 62 | 0 / 0 / 0 | 323.216 | native CLI png; process startup included |
| 9 | orestesgaolin/mermaid | 0.3.2 | 1114 | 228 | 0 / 0 / 0 | 9.115 | Chromium SVG API + canvas PNG conversion |
| 10 | adewale/agentic-mermaid | 0.5.6 | 1066 | 276 | 0 / 0 / 0 | 17.627 | Chromium SVG API + canvas PNG conversion |
| 11 | emtyty/merslim | 0.2.3 | 700 | 642 | 0 / 0 / 0 | 28.901 | Chromium public PNG API |
| 12 | evangwt/xmermaid | 0.4.2 | 682 | 660 | 0 / 0 / 0 | 5.027 | Chromium SVG API + canvas PNG conversion |
| 13 | dfadler/zombie-mermaid | 5.14.1 | 577 | 765 | 0 / 0 / 0 | 6.622 | Chromium SVG API + canvas PNG conversion |
| 14 | lukilabs/beautiful-mermaid | 1.1.3 | 513 | 829 | 0 / 0 / 0 | 4.002 | Chromium SVG API + canvas PNG conversion |
| 15 | crafter-station/mermaid | 0.0.3 | 512 | 830 | 0 / 0 / 0 | 5.707 | Chromium SVG API + canvas PNG conversion |
| 16 | KlangHaus/vitepress-plugin-diagram | 0.3.2 | 398 | 944 | 0 / 0 / 0 | 2.237 | Chromium SVG API + canvas PNG conversion |

## DaveBench — TERMINAL

**More completions wins; lower median total time breaks ties.** Times include failed calls. The timeout is 15 seconds per call; timeouts are included in failures. CLI process startup is included in CLI rows; persistent API initialization is excluded.

| Rank | Project | Version | Completed | Failed | Timeouts in runs 1/2/3 | Median total seconds | Boundary |
|---:|---|---|---:|---:|---|---:|---|
| 1 | spacedock-dev/mermaidtext | git-a6b0c7657b94 | 1342 | 0 | 0 / 0 / 0 | 1.699 | public CLI terminal; process startup included |
| 2 | xai-org/grok-build | git-2bdd1d6a6369 | 1342 | 0 | 0 / 0 / 0 | 1.748 | public CLI terminal; process startup included |
| 3 | Dicklesworthstone/frankenmermaid | 0.4.0 | 1342 | 0 | 0 / 0 / 0 | 2.885 | public CLI terminal; process startup included |
| 4 | fasouto/termaid | 0.10.0 | 1340 | 2 | 0 / 0 / 0 | 2.791 | persistent Python public terminal API |
| 5 | wevm/ondine | 0.0.3 | 1306 | 36 | 0 / 0 / 0 | 238.982 | public CLI terminal; process startup included |
| 6 | adewale/agentic-mermaid | 0.5.6 | 1068 | 274 | 0 / 0 / 0 | 6.602 | persistent Node public terminal API |
| 7 | Latias94/merman | 0.9.3 | 794 | 548 | 0 / 0 / 0 | 10.584 | public CLI terminal; process startup included |
| 8 | Yassimba/loom | 0.10.0 | 745 | 597 | 0 / 0 / 0 | 0.403 | persistent Bun public terminal API |
| 9 | emtyty/merslim | 0.2.3 | 700 | 642 | 0 / 0 / 0 | 0.755 | persistent Node public terminal API |
| 10 | dfadler/zombie-mermaid | 5.14.1 | 593 | 749 | 0 / 0 / 0 | 2.378 | persistent Node public terminal API |
| 11 | kais-radwan/ascii-mermaid | 0.1.0 | 581 | 761 | 0 / 0 / 0 | 0.153 | persistent Node public terminal API |
| 12 | crafter-station/mermaid | 0.0.3 | 580 | 762 | 0 / 0 / 0 | 0.218 | persistent Node public terminal API |
| 13 | lukilabs/beautiful-mermaid | 1.1.3 | 533 | 809 | 0 / 0 / 0 | 0.223 | persistent Node public terminal API |
| 14 | Mootikins/figurehead-rs | v0.4.3 | 418 | 924 | 8 / 0 / 0 | 200.909 | public CLI terminal; process startup included |
| 15 | AlexanderGrooff/mermaid-ascii | 1.6.1 | 401 | 941 | 0 / 0 / 0 | 12.626 | public CLI terminal; process startup included |
| 16 | anomalyco/opencode | 2.2.5 | 254 | 1088 | 0 / 0 / 0 | 0.919 | persistent Bun public terminal API |
| 17 | kitlangton/merman | 0.2.1 | 181 | 1161 | 0 / 0 / 0 | 0.142 | persistent Bun public terminal API |
| 18 | tariqshams/mermaidtui | 0.0.6 | 23 | 1319 | 0 / 0 / 0 | 0.021 | persistent Node public parseMermaid → computeLayout → renderGraph; errors propagate |

## Requested equal-weight synthesis

**Weights: DaveBench ⅓, Drawing Correctness ⅓, Mermaid Fidelity ⅓.** DaveBench is normalized to a rank percentile within each format and averaged across applicable formats. The other two components have no new measurements. Missing results are not scored as zero and are not dropped from the average.

Rows below are ordered by the measured DaveBench component, not by an overall rank. An overall score requires all three benchmarks.

| Project | DaveBench / 100 | Drawing Correctness / 100 | Mermaid Fidelity / 100 | Overall / 100 |
|---|---:|---:|---:|---|
| spacedock-dev/mermaidtext | 100.0 | — | — | Unranked |
| Dicklesworthstone/frankenmermaid | 96.1 | — | — | Unranked |
| xai-org/grok-build | 94.1 | — | — | Unranked |
| sandyyst/dsh-plugin-mermaid-gb-svg | 93.3 | — | — | Unranked |
| mermaid-js/mermaid | 83.3 | — | — | Unranked |
| fasouto/termaid | 82.4 | — | — | Unranked |
| crabtalk/bezel | 73.3 | — | — | Unranked |
| wevm/ondine | 72.2 | — | — | Unranked |
| Latias94/merman | 68.2 | — | — | Unranked |
| obsidianmd/pele | 66.7 | — | — | Unranked |
| Yassimba/loom | 58.8 | — | — | Unranked |
| 1jehuang/mermaid-rs-renderer | 56.7 | — | — | Unranked |
| adewale/agentic-mermaid | 50.2 | — | — | Unranked |
| orestesgaolin/mermaid | 46.7 | — | — | Unranked |
| kais-radwan/ascii-mermaid | 41.2 | — | — | Unranked |
| emtyty/merslim | 39.9 | — | — | Unranked |
| dfadler/zombie-mermaid | 29.0 | — | — | Unranked |
| evangwt/xmermaid | 26.7 | — | — | Unranked |
| Mootikins/figurehead-rs | 23.5 | — | — | Unranked |
| lukilabs/beautiful-mermaid | 18.7 | — | — | Unranked |
| AlexanderGrooff/mermaid-ascii | 17.6 | — | — | Unranked |
| crafter-station/mermaid | 16.2 | — | — | Unranked |
| anomalyco/opencode | 11.8 | — | — | Unranked |
| kitlangton/merman | 5.9 | — | — | Unranked |
| KlangHaus/vitepress-plugin-diagram | 0.0 | — | — | Unranked |
| pub:mermaid_flutter | Unresolved | — | — | Unranked |
| tariqshams/mermaidtui | 0.0 | — | — | Unranked |

## Blocked or incomplete execution

- **pub:mermaid_flutter:** Setup blocked before rendering: the pinned Flutter 3.44.0 Linux engine download from storage.googleapis.com was denied by the environment proxy (HTTP 403). mermaid_flutter 0.3.2 dependencies resolved and the counts-only Dart worker passed static analysis, but no native release bundle could be built. Not a renderer failure or a score of zero.

The expanded benchmarks need implementation before these rows can support a best-overall comparison. No renderer correctness or full Mermaid fidelity result is inferred from returning output.

## Evidence and execution notes

[All repeat rows (CSV)](evidence/benchmark-campaign-2026-11-02/runs.csv) · [Machine-readable report](evidence/benchmark-campaign-2026-11-02/report.json) · [Frozen 37-component version ledger](evidence/benchmark-campaign-2026-11-02/versions.json) · [Method, corrections and reproduction](evidence/benchmark-campaign-2026-11-02/README.md).

All 27 comparison projects had current releases or immutable source selections resolved before preparation; 26 were measured. This includes Agentic Mermaid 0.5.6, Pele 1.13.0, Bezel 0.2.24, DSH Mermaid GB SVG 0.1.5, Merman native CLI 0.9.3 and Dart mermaid_core 0.3.2. Source-only revisions and companion packages are in the ledger.

The SVG/PNG core and terminal core ran sequentially, without concurrent dependency preparation. Supplemental Dart, corrected MermaidTUI and corrected Merman campaigns were also sequential. Merman's original PNG destination was rejected by its CLI; its documented stdout binding was corrected and all six SVG/PNG repeats replaced. MermaidTUI's convenience wrapper swallowed exceptions; all three repeats were replaced using the same public parser/layout/renderer pipeline with error propagation. Superseded numeric attempts remain in the evidence archive and are excluded from these rankings.

Execution used Chromium 154.0.8037.57, Bun 1.4.2 and Node workers 24.19.0. The 26.3.0 value in original Bun-produced environment records is Bun's Node compatibility value. Dart used SDK 3.13.7 from a pinned official SDK image. Public CLI rows include startup; initialized APIs exclude it. Those declared paths measure different integration costs.

These are counts of successful public operations, not verified correct diagrams. The full three-benchmark request remains incomplete because Trident still needs the expanded drawing assessment and full pinned-suite Fidelity campaign. Equal-weight synthesis is implemented but cannot manufacture those missing measurements.

Harness checks: **61 counter, score, version and command regression tests passed**; typecheck, lint and the historical results snapshot check passed. Rebuilding this report from the archived numeric inputs reproduced its JSON, Markdown and CSV exactly.
