# DaveBench results

**This report contains DaveBench only.** Drawing Correctness and Mermaid Fidelity are collected separately; the current league tables are in `RESULTS.md`.

1342 documentation occurrences per format; three runs after the same 30 warm-ups. Completed counts show the minimum across the three full runs; times show their median total. The numeric run table retains every repeat. Outputs were discarded without drawing assessment. Versions were frozen at campaign preparation (2026-11-07T00:20:11.169Z).

| Benchmark | Result |
|---|---|
| DaveBench | 153 measured runs; 205,326 attempted calls. |
| Drawing Correctness | Not supplied to this DaveBench report. |
| Mermaid Fidelity | Not supplied to this DaveBench report. |

## DaveBench — SVG

**More admissible completions wins; lower median total time breaks ties between rows with the same boundary kind.** Reported totals include failed calls; a missing API duration leaves the median time unavailable. The timeout is 15 seconds per call; timeouts are included in failures. Rejected outputs returned without an error but failed mechanical admission (empty, error message, error placeholder, zero size or echoed source); they are included in failures. CLI process startup is included in CLI rows; persistent API initialization is excluded.

| Rank | Project | Completed | Failed | Rejected outputs in runs 1/2/3 | Timeouts in runs 1/2/3 | Median total seconds | Boundary |
|---:|---|---:|---:|---|---|---:|---|
| 1 | Latias94/merman 0.9.3 | 1338 | 4 | 0 / 0 / 0 | 0 / 0 / 0 | 4.309 | Chromium public SVG API |
| 2 | wevm/ondine 0.0.3 | 1306 | 36 | 0 / 0 / 0 | 0 / 0 / 0 | 0.264 | Chromium public SVG API |
| 3 | crabtalk/bezel 0.2.24 | 1306 | 36 | 0 / 0 / 0 | 0 / 0 / 0 | 0.348 | Chromium public SVG API |
| 4 | obsidianmd/pele 1.13.0 | 1306 | 36 | 0 / 0 / 0 | 0 / 0 / 0 | 0.597 | Chromium public SVG API |
| 5 | 1jehuang/mermaid-rs-renderer 0.3.1 | 1304 | 38 | 2 / 2 / 2 | 0 / 0 / 0 | 13.285 | native CLI svg; process startup included |
| 6 | mermaid-js/mermaid 12.3.0 | 1302 | 40 | 34 / 34 / 34 | 0 / 0 / 0 | 39.750 | Chromium public SVG API |
| 7 | Dicklesworthstone/frankenmermaid 0.4.0 | 1185 | 157 | 157 / 157 / 157 | 0 / 0 / 0 | 0.623 | Chromium public SVG API |
| 8 | orestesgaolin/mermaid 0.3.2 | 1114 | 228 | 0 / 0 / 0 | 0 / 0 / 0 | 0.856 | Chromium public SVG API |
| 9 | adewale/agentic-mermaid 0.5.6 | 1066 | 276 | 0 / 0 / 0 | 0 / 0 / 0 | 6.553 | Chromium public SVG API |
| 10 | emtyty/merslim 0.2.3 | 700 | 642 | 0 / 0 / 0 | 0 / 0 / 0 | 20.917 | Chromium public SVG API |
| 11 | evangwt/xmermaid 0.4.2 | 680 | 662 | 2 / 2 / 2 | 0 / 0 / 0 | 0.499 | Chromium public SVG API |
| 12 | dfadler/zombie-mermaid 5.14.4 | 637 | 705 | 16 / 16 / 16 | 0 / 0 / 0 | 1.588 | Chromium public SVG API |
| 13 | lukilabs/beautiful-mermaid 1.1.3 | 513 | 829 | 24 / 24 / 24 | 0 / 0 / 0 | 1.138 | Chromium public SVG API |
| 14 | crafter-station/mermaid 0.0.3 | 510 | 832 | 2 / 2 / 2 | 0 / 0 / 0 | 0.368 | Chromium public SVG API |
| 15 | KlangHaus/vitepress-plugin-diagram 0.3.2 | 398 | 944 | 0 / 0 / 0 | 0 / 0 / 0 | 0.100 | Chromium public SVG API |
| 16 | sandyyst/dsh-plugin-mermaid-gb-svg 0.1.5 | 384 | 958 | 956 / 956 / 956 | 0 / 0 / 0 | 0.174 | Chromium public SVG API |

## DaveBench — PNG

**More admissible completions wins; lower median total time breaks ties between rows with the same boundary kind.** Reported totals include failed calls; a missing API duration leaves the median time unavailable. The timeout is 15 seconds per call; timeouts are included in failures. Rejected outputs returned without an error but failed mechanical admission (empty, error message, error placeholder, zero size or echoed source); they are included in failures. CLI process startup is included in CLI rows; persistent API initialization is excluded.

| Rank | Project | Completed | Failed | Rejected outputs in runs 1/2/3 | Timeouts in runs 1/2/3 | Median total seconds | Boundary |
|---:|---|---:|---:|---|---|---:|---|
| 1 | Latias94/merman 0.9.3 | 1338 | 4 | 0 / 0 / 0 | 0 / 0 / 0 | 16.987 | Chromium SVG API + canvas PNG conversion |
| 2 | 1jehuang/mermaid-rs-renderer 0.3.1 | 1306 | 36 | 0 / 0 / 0 | 0 / 0 / 0 | 38.014 | native CLI png; process startup included |
| 2 | wevm/ondine 0.0.3 | 1306 | 36 | 0 / 0 / 0 | 0 / 0 / 0 | 7.363 | Chromium SVG API + canvas PNG conversion |
| 2 | obsidianmd/pele 1.13.0 | 1306 | 36 | 0 / 0 / 0 | 0 / 0 / 0 | 8.230 | Chromium SVG API + canvas PNG conversion |
| 2 | crabtalk/bezel 0.2.24 | 1306 | 36 | 0 / 0 / 0 | 0 / 0 / 0 | 8.467 | Chromium SVG API + canvas PNG conversion |
| 6 | mermaid-js/mermaid 12.3.0 | 1302 | 40 | 0 / 0 / 0 | 0 / 0 / 0 | 65.629 | Chromium SVG API + canvas PNG conversion |
| 7 | Dicklesworthstone/frankenmermaid 0.4.0 | 1185 | 157 | 157 / 157 / 157 | 0 / 0 / 0 | 12.982 | Chromium SVG API + canvas PNG conversion |
| 8 | orestesgaolin/mermaid 0.3.2 | 1114 | 228 | 0 / 0 / 0 | 0 / 0 / 0 | 8.101 | Chromium SVG API + canvas PNG conversion |
| 9 | pub:mermaid_flutter 0.3.2 | 1114 | 228 | 0 / 0 / 0 | 0 / 0 / 0 | 25.455 | native Flutter renderToPng API; app startup excluded |
| 10 | adewale/agentic-mermaid 0.5.6 | 1066 | 276 | 0 / 0 / 0 | 0 / 0 / 0 | 15.451 | Chromium SVG API + canvas PNG conversion |
| 11 | emtyty/merslim 0.2.3 | 700 | 642 | 0 / 0 / 0 | 0 / 0 / 0 | 27.391 | Chromium public PNG API |
| 12 | evangwt/xmermaid 0.4.2 | 680 | 662 | 2 / 2 / 2 | 0 / 0 / 0 | 3.871 | Chromium SVG API + canvas PNG conversion |
| 13 | dfadler/zombie-mermaid 5.14.4 | 637 | 705 | 0 / 0 / 0 | 0 / 0 / 0 | 6.204 | Chromium SVG API + canvas PNG conversion |
| 14 | lukilabs/beautiful-mermaid 1.1.3 | 513 | 829 | 0 / 0 / 0 | 0 / 0 / 0 | 3.897 | Chromium SVG API + canvas PNG conversion |
| 15 | crafter-station/mermaid 0.0.3 | 510 | 832 | 2 / 2 / 2 | 0 / 0 / 0 | 5.046 | Chromium SVG API + canvas PNG conversion |
| 16 | KlangHaus/vitepress-plugin-diagram 0.3.2 | 398 | 944 | 0 / 0 / 0 | 0 / 0 / 0 | 2.042 | Chromium SVG API + canvas PNG conversion |
| 17 | sandyyst/dsh-plugin-mermaid-gb-svg 0.1.5 | 384 | 958 | 956 / 956 / 956 | 0 / 0 / 0 | 5.833 | Chromium SVG API + canvas PNG conversion |

## DaveBench — TERMINAL

**More admissible completions wins; lower median total time breaks ties between rows with the same boundary kind.** Reported totals include failed calls; a missing API duration leaves the median time unavailable. The timeout is 15 seconds per call; timeouts are included in failures. Rejected outputs returned without an error but failed mechanical admission (empty, error message, error placeholder, zero size or echoed source); they are included in failures. CLI process startup is included in CLI rows; persistent API initialization is excluded.

| Rank | Project | Completed | Failed | Rejected outputs in runs 1/2/3 | Timeouts in runs 1/2/3 | Median total seconds | Boundary |
|---:|---|---:|---:|---|---|---:|---|
| 1 | Dicklesworthstone/frankenmermaid 0.4.0 | 1342 | 0 | 0 / 0 / 0 | 0 / 0 / 0 | 3.213 | public CLI terminal; process startup included |
| 2 | wevm/ondine 0.0.3 | 1304 | 38 | 2 / 2 / 2 | 0 / 0 / 0 | 234.173 | public CLI terminal; process startup included |
| 3 | fasouto/termaid 0.12.0 | 1286 | 56 | 56 / 56 / 56 | 0 / 0 / 0 | 1.914 | persistent Python public terminal API |
| 4 | adewale/agentic-mermaid 0.5.6 | 1068 | 274 | 0 / 0 / 0 | 0 / 0 / 0 | 6.248 | persistent Node public terminal API |
| 5 | Yassimba/loom 0.10.0 | 745 | 597 | 0 / 0 / 0 | 0 / 0 / 0 | 0.387 | persistent Bun public terminal API |
| 6 | Latias94/merman 0.9.3 | 726 | 616 | 68 / 68 / 68 | 0 / 0 / 0 | 10.011 | public CLI terminal; process startup included |
| 7 | dfadler/zombie-mermaid 5.14.4 | 637 | 705 | 16 / 16 / 16 | 0 / 0 / 0 | 2.698 | persistent Node public terminal API |
| 8 | kais-radwan/ascii-mermaid 0.1.0 | 555 | 787 | 26 / 26 / 26 | 0 / 0 / 0 | 0.165 | persistent Node public terminal API |
| 9 | emtyty/merslim 0.2.3 | 538 | 804 | 162 / 162 / 162 | 0 / 0 / 0 | 0.662 | persistent Node public terminal API |
| 10 | crafter-station/mermaid 0.0.3 | 534 | 808 | 46 / 46 / 46 | 0 / 0 / 0 | 0.189 | persistent Node public terminal API |
| 11 | lukilabs/beautiful-mermaid 1.1.3 | 509 | 833 | 24 / 24 / 24 | 0 / 0 / 0 | 0.205 | persistent Node public terminal API |
| 12 | xai-org/grok-build git-2bdd1d6a6369 | 475 | 867 | 867 / 867 / 867 | 0 / 0 / 0 | 1.937 | public CLI terminal; process startup included |
| 13 | spacedock-dev/mermaidtext git-a6b0c7657b94 | 475 | 867 | 867 / 867 / 867 | 0 / 0 / 0 | 3.167 | public CLI terminal; process startup included |
| 14 | Mootikins/figurehead-rs v0.4.3 | 408 | 934 | 10 / 10 / 10 | 0 / 0 / 0 | 40.191 | public CLI terminal; process startup included |
| 15 | AlexanderGrooff/mermaid-ascii 1.6.1 | 401 | 941 | 0 / 0 / 0 | 0 / 0 / 0 | 19.202 | public CLI terminal; process startup included |
| 16 | anomalyco/opencode 2.2.5 | 254 | 1088 | 0 / 0 / 0 | 0 / 0 / 0 | 0.684 | persistent Bun public terminal API |
| 17 | kitlangton/merman 0.2.1 | 181 | 1161 | 0 / 0 / 0 | 0 / 0 / 0 | 0.142 | persistent Bun public terminal API |
| 18 | tariqshams/mermaidtui 0.0.6 | 23 | 1319 | 0 / 0 / 0 | 0 / 0 / 0 | 0.022 | persistent Node public parseMermaid → computeLayout → renderGraph; errors propagate |


## Blocked or incomplete execution


DaveBench measures completion and time. Drawing Correctness and Mermaid Fidelity have separate result files.
