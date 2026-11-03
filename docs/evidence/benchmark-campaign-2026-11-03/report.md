# DaveBench results

**This report contains DaveBench only.** Drawing Correctness and Mermaid Fidelity are collected separately; the current league tables are in `RESULTS.md`.

1342 documentation occurrences per format; three runs after the same 30 warm-ups. Completed counts show the minimum across the three full runs; times show their median total. The numeric run table retains every repeat. Outputs were discarded without drawing assessment. Versions were frozen at campaign preparation (2026-11-02T15:09:38.022Z).

| Benchmark | Result |
|---|---|
| DaveBench | 153 measured runs; 205,326 timed calls. |
| Drawing Correctness | Not supplied to this DaveBench report. |
| Mermaid Fidelity | Not supplied to this DaveBench report. |

## DaveBench — SVG

**More admissible completions wins; lower median total time breaks ties between rows with the same boundary kind.** Times include failed calls. The timeout is 15 seconds per call; timeouts are included in failures. Rejected outputs returned without an error but failed mechanical admission (empty, error message, error placeholder, zero size or echoed source); they are included in failures. CLI process startup is included in CLI rows; persistent API initialization is excluded.

| Rank | Project | Completed | Failed | Rejected outputs in runs 1/2/3 | Timeouts in runs 1/2/3 | Median total seconds | Boundary |
|---:|---|---:|---:|---|---|---:|---|
| 1 | Dicklesworthstone/frankenmermaid 0.4.0 | 1342 | 0 | 0 / 0 / 0 | 0 / 0 / 0 | 1.709 | Chromium public SVG API |
| 2 | sandyyst/dsh-plugin-mermaid-gb-svg 0.1.5 | 1340 | 2 | 0 / 0 / 0 | 0 / 0 / 0 | 0.258 | Chromium public SVG API |
| 3 | Latias94/merman 0.9.3 | 1338 | 4 | 0 / 0 / 0 | 0 / 0 / 0 | 16.015 | native CLI svg; process startup included |
| 4 | mermaid-js/mermaid 12.2.0 | 1336 | 6 | 0 / 0 / 0 | 0 / 0 / 0 | 46.957 | Chromium public SVG API |
| 5 | 1jehuang/mermaid-rs-renderer 0.3.1 | 1306 | 36 | 0 / 0 / 0 | 0 / 0 / 0 | 17.308 | native CLI svg; process startup included |
| 5 | wevm/ondine 0.0.3 | 1306 | 36 | 0 / 0 / 0 | 0 / 0 / 0 | 0.367 | Chromium public SVG API |
| 5 | crabtalk/bezel 0.2.24 | 1306 | 36 | 0 / 0 / 0 | 0 / 0 / 0 | 0.482 | Chromium public SVG API |
| 5 | obsidianmd/pele 1.13.0 | 1306 | 36 | 0 / 0 / 0 | 0 / 0 / 0 | 0.790 | Chromium public SVG API |
| 9 | orestesgaolin/mermaid 0.3.2 | 1114 | 228 | 0 / 0 / 0 | 0 / 0 / 0 | 1.399 | Chromium public SVG API |
| 10 | adewale/agentic-mermaid 0.5.6 | 1066 | 276 | 0 / 0 / 0 | 0 / 0 / 0 | 7.379 | Chromium public SVG API |
| 11 | emtyty/merslim 0.2.3 | 700 | 642 | 0 / 0 / 0 | 0 / 0 / 0 | 20.284 | Chromium public SVG API |
| 12 | evangwt/xmermaid 0.4.2 | 682 | 660 | 0 / 0 / 0 | 0 / 0 / 0 | 0.703 | Chromium public SVG API |
| 13 | dfadler/zombie-mermaid 5.14.1 | 577 | 765 | 16 / 16 / 16 | 0 / 0 / 0 | 2.101 | Chromium public SVG API |
| 14 | lukilabs/beautiful-mermaid 1.1.3 | 513 | 829 | 24 / 24 / 24 | 0 / 0 / 0 | 1.728 | Chromium public SVG API |
| 15 | crafter-station/mermaid 0.0.3 | 512 | 830 | 0 / 0 / 0 | 0 / 0 / 0 | 0.448 | Chromium public SVG API |
| 16 | KlangHaus/vitepress-plugin-diagram 0.3.2 | 398 | 944 | 0 / 0 / 0 | 0 / 0 / 0 | 0.129 | Chromium public SVG API |

## DaveBench — PNG

**More admissible completions wins; lower median total time breaks ties between rows with the same boundary kind.** Times include failed calls. The timeout is 15 seconds per call; timeouts are included in failures. Rejected outputs returned without an error but failed mechanical admission (empty, error message, error placeholder, zero size or echoed source); they are included in failures. CLI process startup is included in CLI rows; persistent API initialization is excluded.

| Rank | Project | Completed | Failed | Rejected outputs in runs 1/2/3 | Timeouts in runs 1/2/3 | Median total seconds | Boundary |
|---:|---|---:|---:|---|---|---:|---|
| 1 | Dicklesworthstone/frankenmermaid 0.4.0 | 1342 | 0 | 0 / 0 / 0 | 0 / 0 / 0 | 21.419 | Chromium SVG API + canvas PNG conversion |
| 2 | sandyyst/dsh-plugin-mermaid-gb-svg 0.1.5 | 1340 | 2 | 0 / 0 / 0 | 0 / 0 / 0 | 6.655 | Chromium SVG API + canvas PNG conversion |
| 3 | mermaid-js/mermaid 12.2.0 | 1336 | 6 | 0 / 0 / 0 | 0 / 0 / 0 | 68.548 | Chromium SVG API + canvas PNG conversion |
| 4 | 1jehuang/mermaid-rs-renderer 0.3.1 | 1306 | 36 | 0 / 0 / 0 | 0 / 0 / 0 | 39.884 | native CLI png; process startup included |
| 4 | wevm/ondine 0.0.3 | 1306 | 36 | 0 / 0 / 0 | 0 / 0 / 0 | 8.785 | Chromium SVG API + canvas PNG conversion |
| 4 | crabtalk/bezel 0.2.24 | 1306 | 36 | 0 / 0 / 0 | 0 / 0 / 0 | 9.000 | Chromium SVG API + canvas PNG conversion |
| 4 | obsidianmd/pele 1.13.0 | 1306 | 36 | 0 / 0 / 0 | 0 / 0 / 0 | 9.134 | Chromium SVG API + canvas PNG conversion |
| 8 | Latias94/merman 0.9.3 | 1280 | 62 | 0 / 0 / 0 | 0 / 0 / 0 | 272.212 | native CLI png; process startup included |
| 9 | orestesgaolin/mermaid 0.3.2 | 1114 | 228 | 0 / 0 / 0 | 0 / 0 / 0 | 9.306 | Chromium SVG API + canvas PNG conversion |
| 10 | pub:mermaid_flutter 0.3.2 | 1114 | 228 | 0 / 0 / 0 | 0 / 0 / 0 | 29.264 | native Flutter renderToPng API; app startup excluded |
| 11 | adewale/agentic-mermaid 0.5.6 | 1066 | 276 | 0 / 0 / 0 | 0 / 0 / 0 | 17.907 | Chromium SVG API + canvas PNG conversion |
| 12 | emtyty/merslim 0.2.3 | 700 | 642 | 0 / 0 / 0 | 0 / 0 / 0 | 29.542 | Chromium public PNG API |
| 13 | evangwt/xmermaid 0.4.2 | 682 | 660 | 0 / 0 / 0 | 0 / 0 / 0 | 4.637 | Chromium SVG API + canvas PNG conversion |
| 14 | dfadler/zombie-mermaid 5.14.1 | 577 | 765 | 0 / 0 / 0 | 0 / 0 / 0 | 6.206 | Chromium SVG API + canvas PNG conversion |
| 15 | lukilabs/beautiful-mermaid 1.1.3 | 513 | 829 | 0 / 0 / 0 | 0 / 0 / 0 | 4.151 | Chromium SVG API + canvas PNG conversion |
| 16 | crafter-station/mermaid 0.0.3 | 512 | 830 | 0 / 0 / 0 | 0 / 0 / 0 | 4.951 | Chromium SVG API + canvas PNG conversion |
| 17 | KlangHaus/vitepress-plugin-diagram 0.3.2 | 398 | 944 | 0 / 0 / 0 | 0 / 0 / 0 | 2.342 | Chromium SVG API + canvas PNG conversion |

## DaveBench — TERMINAL

**More admissible completions wins; lower median total time breaks ties between rows with the same boundary kind.** Times include failed calls. The timeout is 15 seconds per call; timeouts are included in failures. Rejected outputs returned without an error but failed mechanical admission (empty, error message, error placeholder, zero size or echoed source); they are included in failures. CLI process startup is included in CLI rows; persistent API initialization is excluded.

| Rank | Project | Completed | Failed | Rejected outputs in runs 1/2/3 | Timeouts in runs 1/2/3 | Median total seconds | Boundary |
|---:|---|---:|---:|---|---|---:|---|
| 1 | Dicklesworthstone/frankenmermaid 0.4.0 | 1342 | 0 | 0 / 0 / 0 | 0 / 0 / 0 | 4.707 | public CLI terminal; process startup included |
| 2 | fasouto/termaid 0.10.0 | 1310 | 32 | 30 / 30 / 30 | 0 / 0 / 0 | 3.412 | persistent Python public terminal API |
| 3 | wevm/ondine 0.0.3 | 1304 | 38 | 2 / 2 / 2 | 0 / 0 / 0 | 280.313 | public CLI terminal; process startup included |
| 4 | adewale/agentic-mermaid 0.5.6 | 1068 | 274 | 0 / 0 / 0 | 0 / 0 / 0 | 9.356 | persistent Node public terminal API |
| 5 | Latias94/merman 0.9.3 | 794 | 548 | 0 / 0 / 0 | 0 / 0 / 0 | 12.330 | public CLI terminal; process startup included |
| 6 | Yassimba/loom 0.10.0 | 745 | 597 | 0 / 0 / 0 | 0 / 0 / 0 | 0.594 | persistent Bun public terminal API |
| 7 | dfadler/zombie-mermaid 5.14.1 | 577 | 765 | 16 / 16 / 16 | 0 / 0 / 0 | 3.227 | persistent Node public terminal API |
| 8 | kais-radwan/ascii-mermaid 0.1.0 | 555 | 787 | 26 / 26 / 26 | 0 / 0 / 0 | 0.267 | persistent Node public terminal API |
| 9 | emtyty/merslim 0.2.3 | 538 | 804 | 162 / 162 / 162 | 0 / 0 / 0 | 0.922 | persistent Node public terminal API |
| 10 | crafter-station/mermaid 0.0.3 | 536 | 806 | 44 / 44 / 44 | 0 / 0 / 0 | 0.449 | persistent Node public terminal API |
| 11 | lukilabs/beautiful-mermaid 1.1.3 | 509 | 833 | 24 / 24 / 24 | 0 / 0 / 0 | 0.355 | persistent Node public terminal API |
| 12 | spacedock-dev/mermaidtext git-a6b0c7657b94 | 481 | 861 | 861 / 861 / 861 | 0 / 0 / 0 | 2.919 | public CLI terminal; process startup included |
| 13 | xai-org/grok-build git-2bdd1d6a6369 | 481 | 861 | 861 / 861 / 861 | 0 / 0 / 0 | 3.132 | public CLI terminal; process startup included |
| 14 | Mootikins/figurehead-rs v0.4.3 | 408 | 934 | 10 / 10 / 10 | 16 / 16 / 16 | 255.441 | public CLI terminal; process startup included |
| 15 | AlexanderGrooff/mermaid-ascii 1.6.1 | 401 | 941 | 0 / 0 / 0 | 0 / 0 / 0 | 18.255 | public CLI terminal; process startup included |
| 16 | anomalyco/opencode 2.2.5 | 254 | 1088 | 0 / 0 / 0 | 0 / 0 / 0 | 1.035 | persistent Bun public terminal API |
| 17 | kitlangton/merman 0.2.1 | 181 | 1161 | 0 / 0 / 0 | 0 / 0 / 0 | 0.175 | persistent Bun public terminal API |
| 18 | tariqshams/mermaidtui 0.0.6 | 23 | 1319 | 0 / 0 / 0 | 0 / 0 / 0 | 0.025 | persistent Node public parseMermaid → computeLayout → renderGraph; errors propagate |


## Blocked or incomplete execution


DaveBench measures completion and time. Drawing Correctness and Mermaid Fidelity have separate result files.
