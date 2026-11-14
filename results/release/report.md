# DaveBench results

**This report contains DaveBench only.** Drawing Correctness and Mermaid Fidelity are collected separately; the current league tables are in `RESULTS.md`.

1342 documentation occurrences per format; three runs after the same 30 warm-ups. Completed counts show the minimum across the three full runs; times show their median total. The numeric run table retains every repeat. Outputs were discarded without drawing assessment. Versions were frozen at campaign preparation.

| Benchmark | Result |
|---|---|
| DaveBench | 153 measured runs; 205,326 attempted calls. |
| Drawing Correctness | Not supplied to this DaveBench report. |
| Mermaid Fidelity | Not supplied to this DaveBench report. |

## DaveBench — SVG

**More admissible completions wins; lower median total time breaks ties between rows with the same boundary kind.** Reported totals include failed calls; a missing API duration leaves the median time unavailable. The timeout is 15 seconds per call; timeouts are included in failures. Rejected outputs returned without an error but failed mechanical admission (empty, error message, error placeholder, zero size or echoed source); they are included in failures. CLI process startup is included in CLI rows; persistent API initialization is excluded.

| Rank | Project | Completed | Failed | Rejected outputs in runs 1/2/3 | Timeouts in runs 1/2/3 | Median total seconds | Boundary |
|---:|---|---:|---:|---|---|---:|---|
| 1 | Latias94/merman 0.10.0 | 1338 | 4 | 0 / 0 / 0 | 0 / 0 / 0 | 3.103 | Chromium public SVG API |
| 2 | mermaid-js/mermaid 12.3.0 | 1336 | 6 | 0 / 0 / 0 | 0 / 0 / 0 | 35.191 | Chromium public SVG API |
| 3 | wevm/ondine 0.0.3 | 1306 | 36 | 0 / 0 / 0 | 0 / 0 / 0 | 0.298 | Chromium public SVG API |
| 4 | crabtalk/bezel 0.2.26 | 1306 | 36 | 0 / 0 / 0 | 0 / 0 / 0 | 0.374 | Chromium public SVG API |
| 5 | obsidianmd/pele 1.13.0 | 1306 | 36 | 0 / 0 / 0 | 0 / 0 / 0 | 0.651 | Chromium public SVG API |
| 6 | 1jehuang/mermaid-rs-renderer 0.3.1 | 1304 | 38 | 2 / 2 / 2 | 0 / 0 / 0 | 12.911 | native CLI svg; process startup included |
| 7 | Dicklesworthstone/frankenmermaid 0.5.0 | 1181 | 161 | 161 / 161 / 161 | 0 / 0 / 0 | 1.209 | Chromium public SVG API |
| 8 | orestesgaolin/mermaid 0.3.2 | 1114 | 228 | 0 / 0 / 0 | 0 / 0 / 0 | 0.991 | Chromium public SVG API |
| 9 | adewale/agentic-mermaid 0.5.6 | 1066 | 276 | 0 / 0 / 0 | 0 / 0 / 0 | 5.985 | Chromium public SVG API |
| 10 | dfadler/zombie-mermaid 5.17.0 | 908 | 434 | 14 / 14 / 14 | 0 / 0 / 0 | 1.841 | Chromium public SVG API |
| 11 | emtyty/merslim 0.2.3 | 700 | 642 | 0 / 0 / 0 | 0 / 0 / 0 | 20.086 | Chromium public SVG API |
| 12 | evangwt/xmermaid 0.4.2 | 680 | 662 | 2 / 2 / 2 | 0 / 0 / 0 | 0.581 | Chromium public SVG API |
| 13 | lukilabs/beautiful-mermaid 1.1.3 | 513 | 829 | 24 / 24 / 24 | 0 / 0 / 0 | 1.420 | Chromium public SVG API |
| 14 | crafter-station/mermaid 0.0.3 | 510 | 832 | 2 / 2 / 2 | 0 / 0 / 0 | 0.347 | Chromium public SVG API |
| 15 | KlangHaus/vitepress-plugin-diagram 0.3.2 | 396 | 946 | 2 / 2 / 2 | 0 / 0 / 0 | 0.117 | Chromium public SVG API |
| 16 | sandyyst/dsh-plugin-mermaid-gb-svg 0.1.5 | 384 | 958 | 956 / 956 / 956 | 0 / 0 / 0 | 0.237 | Chromium public SVG API |

## DaveBench — PNG

**More admissible completions wins; lower median total time breaks ties between rows with the same boundary kind.** Reported totals include failed calls; a missing API duration leaves the median time unavailable. The timeout is 15 seconds per call; timeouts are included in failures. Rejected outputs returned without an error but failed mechanical admission (empty, error message, error placeholder, zero size or echoed source); they are included in failures. CLI process startup is included in CLI rows; persistent API initialization is excluded.

| Rank | Project | Completed | Failed | Rejected outputs in runs 1/2/3 | Timeouts in runs 1/2/3 | Median total seconds | Boundary |
|---:|---|---:|---:|---|---|---:|---|
| 1 | Latias94/merman 0.10.0 | 1338 | 4 | 0 / 0 / 0 | 0 / 0 / 0 | 16.255 | Chromium SVG API + canvas PNG conversion |
| 2 | mermaid-js/mermaid 12.3.0 | 1336 | 6 | 0 / 0 / 0 | 0 / 0 / 0 | 53.963 | Chromium SVG API + canvas PNG conversion |
| 3 | 1jehuang/mermaid-rs-renderer 0.3.1 | 1306 | 36 | 0 / 0 / 0 | 0 / 0 / 0 | 29.528 | native CLI png; process startup included |
| 3 | wevm/ondine 0.0.3 | 1306 | 36 | 0 / 0 / 0 | 0 / 0 / 0 | 7.537 | Chromium SVG API + canvas PNG conversion |
| 3 | crabtalk/bezel 0.2.26 | 1306 | 36 | 0 / 0 / 0 | 0 / 0 / 0 | 7.855 | Chromium SVG API + canvas PNG conversion |
| 3 | obsidianmd/pele 1.13.0 | 1306 | 36 | 0 / 0 / 0 | 0 / 0 / 0 | 8.250 | Chromium SVG API + canvas PNG conversion |
| 7 | Dicklesworthstone/frankenmermaid 0.5.0 | 1181 | 161 | 161 / 161 / 161 | 0 / 0 / 0 | 19.088 | Chromium SVG API + canvas PNG conversion |
| 8 | orestesgaolin/mermaid 0.3.2 | 1114 | 228 | 0 / 0 / 0 | 0 / 0 / 0 | 7.719 | Chromium SVG API + canvas PNG conversion |
| 9 | pub:mermaid_flutter 0.3.2 | 1114 | 228 | 0 / 0 / 0 | 0 / 0 / 0 | 23.725 | native Flutter renderToPng API; app startup excluded |
| 10 | adewale/agentic-mermaid 0.5.6 | 1066 | 276 | 0 / 0 / 0 | 0 / 0 / 0 | 15.131 | Chromium SVG API + canvas PNG conversion |
| 11 | dfadler/zombie-mermaid 5.17.0 | 908 | 434 | 0 / 0 / 0 | 0 / 0 / 0 | 8.882 | Chromium SVG API + canvas PNG conversion |
| 12 | emtyty/merslim 0.2.3 | 700 | 642 | 0 / 0 / 0 | 0 / 0 / 0 | 27.082 | Chromium public PNG API |
| 13 | evangwt/xmermaid 0.4.2 | 680 | 662 | 2 / 2 / 2 | 0 / 0 / 0 | 4.122 | Chromium SVG API + canvas PNG conversion |
| 14 | lukilabs/beautiful-mermaid 1.1.3 | 513 | 829 | 0 / 0 / 0 | 0 / 0 / 0 | 3.587 | Chromium SVG API + canvas PNG conversion |
| 15 | crafter-station/mermaid 0.0.3 | 510 | 832 | 2 / 2 / 2 | 0 / 0 / 0 | 4.079 | Chromium SVG API + canvas PNG conversion |
| 16 | KlangHaus/vitepress-plugin-diagram 0.3.2 | 396 | 946 | 2 / 2 / 2 | 0 / 0 / 0 | 2.164 | Chromium SVG API + canvas PNG conversion |
| 17 | sandyyst/dsh-plugin-mermaid-gb-svg 0.1.5 | 384 | 958 | 956 / 956 / 956 | 0 / 0 / 0 | 5.624 | Chromium SVG API + canvas PNG conversion |

## DaveBench — TERMINAL

**More admissible completions wins; lower median total time breaks ties between rows with the same boundary kind.** Reported totals include failed calls; a missing API duration leaves the median time unavailable. The timeout is 15 seconds per call; timeouts are included in failures. Rejected outputs returned without an error but failed mechanical admission (empty, error message, error placeholder, zero size or echoed source); they are included in failures. CLI process startup is included in CLI rows; persistent API initialization is excluded.

| Rank | Project | Completed | Failed | Rejected outputs in runs 1/2/3 | Timeouts in runs 1/2/3 | Median total seconds | Boundary |
|---:|---|---:|---:|---|---|---:|---|
| 1 | Dicklesworthstone/frankenmermaid 0.5.0 | 1338 | 4 | 4 / 4 / 4 | 0 / 0 / 0 | 3.722 | public CLI terminal; process startup included |
| 2 | wevm/ondine 0.0.3 | 1306 | 36 | 0 / 0 / 0 | 0 / 0 / 0 | 234.019 | public CLI terminal; process startup included |
| 3 | fasouto/termaid 0.12.0 | 1288 | 54 | 54 / 54 / 54 | 0 / 0 / 0 | 2.138 | persistent Python public terminal API |
| 4 | adewale/agentic-mermaid 0.5.6 | 1068 | 274 | 0 / 0 / 0 | 0 / 0 / 0 | 6.649 | persistent Node public terminal API |
| 5 | dfadler/zombie-mermaid 5.17.0 | 908 | 434 | 14 / 14 / 14 | 0 / 0 / 0 | 2.296 | persistent Node public terminal API |
| 6 | Yassimba/loom 0.10.0 | 745 | 597 | 0 / 0 / 0 | 0 / 0 / 0 | 0.453 | persistent Bun public terminal API |
| 7 | Latias94/merman 0.10.0 | 730 | 612 | 68 / 68 / 68 | 0 / 0 / 0 | 7.809 | public CLI terminal; process startup included |
| 8 | kais-radwan/ascii-mermaid 0.1.0 | 557 | 785 | 24 / 24 / 24 | 0 / 0 / 0 | 0.196 | persistent Node public terminal API |
| 9 | emtyty/merslim 0.2.3 | 540 | 802 | 160 / 160 / 160 | 0 / 0 / 0 | 0.702 | persistent Node public terminal API |
| 10 | crafter-station/mermaid 0.0.3 | 536 | 806 | 44 / 44 / 44 | 0 / 0 / 0 | 0.332 | persistent Node public terminal API |
| 11 | lukilabs/beautiful-mermaid 1.1.3 | 509 | 833 | 24 / 24 / 24 | 0 / 0 / 0 | 0.281 | persistent Node public terminal API |
| 12 | xai-org/grok-build git-2bdd1d6a6369 | 475 | 867 | 867 / 867 / 867 | 0 / 0 / 0 | 2.566 | public CLI terminal; process startup included |
| 13 | spacedock-dev/mermaidtext git-a6b0c7657b94 | 475 | 867 | 867 / 867 / 867 | 0 / 0 / 0 | 2.728 | public CLI terminal; process startup included |
| 14 | Mootikins/figurehead-rs v0.4.3 | 408 | 934 | 10 / 10 / 10 | 0 / 0 / 0 | 24.635 | public CLI terminal; process startup included |
| 15 | AlexanderGrooff/mermaid-ascii 1.6.1 | 401 | 941 | 0 / 0 / 0 | 0 / 0 / 0 | 13.676 | public CLI terminal; process startup included |
| 16 | anomalyco/opencode 2.3.0 | 254 | 1088 | 0 / 0 / 0 | 0 / 0 / 0 | 0.890 | persistent Bun public terminal API |
| 17 | kitlangton/merman 0.2.1 | 181 | 1161 | 0 / 0 / 0 | 0 / 0 / 0 | 0.162 | persistent Bun public terminal API |
| 18 | tariqshams/mermaidtui 0.0.6 | 23 | 1319 | 0 / 0 / 0 | 0 / 0 / 0 | 0.037 | persistent Node public parseMermaid → computeLayout → renderGraph; errors propagate |


## Blocked or incomplete execution


DaveBench measures completion and time. Drawing Correctness and Mermaid Fidelity have separate result files.
