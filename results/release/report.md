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
| 1 | Latias94/merman 0.10.0 | 1338 | 0 | 0 / 0 / 0 | 0 / 0 / 0 | 2.869 | Chromium public SVG API |
| 2 | mermaid-js/mermaid 12.3.0 | 1338 | 0 | 0 / 0 / 0 | 0 / 0 / 0 | 30.744 | Chromium public SVG API |
| 3 | wevm/ondine 0.0.3 | 1306 | 32 | 0 / 0 / 0 | 0 / 0 / 0 | 0.287 | Chromium public SVG API |
| 4 | crabtalk/bezel 0.2.26 | 1306 | 32 | 0 / 0 / 0 | 0 / 0 / 0 | 0.399 | Chromium public SVG API |
| 5 | obsidianmd/pele 1.13.0 | 1306 | 32 | 0 / 0 / 0 | 0 / 0 / 0 | 0.648 | Chromium public SVG API |
| 6 | 1jehuang/mermaid-rs-renderer 0.3.1 | 1304 | 34 | 2 / 2 / 2 | 0 / 0 / 0 | 12.648 | native CLI svg; process startup included |
| 7 | Dicklesworthstone/frankenmermaid 0.5.0 | 1177 | 161 | 161 / 161 / 161 | 0 / 0 / 0 | 1.221 | Chromium public SVG API |
| 8 | orestesgaolin/mermaid 0.3.2 | 1114 | 224 | 0 / 0 / 0 | 0 / 0 / 0 | 0.964 | Chromium public SVG API |
| 9 | adewale/agentic-mermaid 0.5.6 | 1066 | 272 | 0 / 0 / 0 | 0 / 0 / 0 | 5.879 | Chromium public SVG API |
| 10 | dfadler/zombie-mermaid 5.17.0 | 906 | 432 | 14 / 14 / 14 | 0 / 0 / 0 | 1.960 | Chromium public SVG API |
| 11 | emtyty/merslim 0.2.3 | 698 | 640 | 0 / 0 / 0 | 0 / 0 / 0 | 20.616 | Chromium public SVG API |
| 12 | evangwt/xmermaid 0.4.2 | 680 | 658 | 2 / 2 / 2 | 0 / 0 / 0 | 0.596 | Chromium public SVG API |
| 13 | lukilabs/beautiful-mermaid 1.1.3 | 511 | 827 | 24 / 24 / 24 | 0 / 0 / 0 | 1.343 | Chromium public SVG API |
| 14 | crafter-station/mermaid 0.0.3 | 508 | 830 | 2 / 2 / 2 | 0 / 0 / 0 | 0.384 | Chromium public SVG API |
| 15 | KlangHaus/vitepress-plugin-diagram 0.3.2 | 396 | 942 | 2 / 2 / 2 | 0 / 0 / 0 | 0.118 | Chromium public SVG API |
| 16 | sandyyst/dsh-plugin-mermaid-gb-svg 0.1.5 | 382 | 956 | 956 / 956 / 956 | 0 / 0 / 0 | 0.243 | Chromium public SVG API |

## DaveBench — PNG

**More admissible completions wins; lower median total time breaks ties between rows with the same boundary kind.** Reported totals include failed calls; a missing API duration leaves the median time unavailable. The timeout is 15 seconds per call; timeouts are included in failures. Rejected outputs returned without an error but failed mechanical admission (empty, error message, error placeholder, zero size or echoed source); they are included in failures. CLI process startup is included in CLI rows; persistent API initialization is excluded.

| Rank | Project | Completed | Failed | Rejected outputs in runs 1/2/3 | Timeouts in runs 1/2/3 | Median total seconds | Boundary |
|---:|---|---:|---:|---|---|---:|---|
| 1 | Latias94/merman 0.10.0 | 1338 | 0 | 0 / 0 / 0 | 0 / 0 / 0 | 14.002 | Chromium SVG API + canvas PNG conversion |
| 2 | mermaid-js/mermaid 12.3.0 | 1338 | 0 | 0 / 0 / 0 | 0 / 0 / 0 | 49.353 | Chromium SVG API + canvas PNG conversion |
| 3 | 1jehuang/mermaid-rs-renderer 0.3.1 | 1306 | 32 | 0 / 0 / 0 | 0 / 0 / 0 | 26.908 | native CLI png; process startup included |
| 3 | obsidianmd/pele 1.13.0 | 1306 | 32 | 0 / 0 / 0 | 0 / 0 / 0 | 7.447 | Chromium SVG API + canvas PNG conversion |
| 3 | wevm/ondine 0.0.3 | 1306 | 32 | 0 / 0 / 0 | 0 / 0 / 0 | 7.869 | Chromium SVG API + canvas PNG conversion |
| 3 | crabtalk/bezel 0.2.26 | 1306 | 32 | 0 / 0 / 0 | 0 / 0 / 0 | 7.884 | Chromium SVG API + canvas PNG conversion |
| 7 | Dicklesworthstone/frankenmermaid 0.5.0 | 1177 | 161 | 161 / 161 / 161 | 0 / 0 / 0 | 16.156 | Chromium SVG API + canvas PNG conversion |
| 8 | orestesgaolin/mermaid 0.3.2 | 1114 | 224 | 0 / 0 / 0 | 0 / 0 / 0 | 8.090 | Chromium SVG API + canvas PNG conversion |
| 9 | pub:mermaid_flutter 0.3.2 | 1114 | 224 | 0 / 0 / 0 | 0 / 0 / 0 | 22.836 | native Flutter renderToPng API; app startup excluded |
| 10 | adewale/agentic-mermaid 0.5.6 | 1066 | 272 | 0 / 0 / 0 | 0 / 0 / 0 | 13.366 | Chromium SVG API + canvas PNG conversion |
| 11 | dfadler/zombie-mermaid 5.17.0 | 906 | 432 | 0 / 0 / 0 | 0 / 0 / 0 | 8.745 | Chromium SVG API + canvas PNG conversion |
| 12 | emtyty/merslim 0.2.3 | 698 | 640 | 0 / 0 / 0 | 0 / 0 / 0 | 26.793 | Chromium public PNG API |
| 13 | evangwt/xmermaid 0.4.2 | 680 | 658 | 2 / 2 / 2 | 0 / 0 / 0 | 3.983 | Chromium SVG API + canvas PNG conversion |
| 14 | lukilabs/beautiful-mermaid 1.1.3 | 511 | 827 | 0 / 0 / 0 | 0 / 0 / 0 | 3.680 | Chromium SVG API + canvas PNG conversion |
| 15 | crafter-station/mermaid 0.0.3 | 508 | 830 | 2 / 2 / 2 | 0 / 0 / 0 | 4.108 | Chromium SVG API + canvas PNG conversion |
| 16 | KlangHaus/vitepress-plugin-diagram 0.3.2 | 396 | 942 | 2 / 2 / 2 | 0 / 0 / 0 | 2.113 | Chromium SVG API + canvas PNG conversion |
| 17 | sandyyst/dsh-plugin-mermaid-gb-svg 0.1.5 | 382 | 956 | 956 / 956 / 956 | 0 / 0 / 0 | 5.519 | Chromium SVG API + canvas PNG conversion |

## DaveBench — TERMINAL

**More admissible completions wins; lower median total time breaks ties between rows with the same boundary kind.** Reported totals include failed calls; a missing API duration leaves the median time unavailable. The timeout is 15 seconds per call; timeouts are included in failures. Rejected outputs returned without an error but failed mechanical admission (empty, error message, error placeholder, zero size or echoed source); they are included in failures. CLI process startup is included in CLI rows; persistent API initialization is excluded.

| Rank | Project | Completed | Failed | Rejected outputs in runs 1/2/3 | Timeouts in runs 1/2/3 | Median total seconds | Boundary |
|---:|---|---:|---:|---|---|---:|---|
| 1 | Dicklesworthstone/frankenmermaid 0.5.0 | 1334 | 4 | 4 / 4 / 4 | 0 / 0 / 0 | 2.992 | public CLI terminal; process startup included |
| 2 | wevm/ondine 0.0.3 | 1306 | 32 | 0 / 0 / 0 | 0 / 0 / 0 | 216.867 | public CLI terminal; process startup included |
| 3 | fasouto/termaid 0.12.0 | 1240 | 98 | 100 / 100 / 100 | 0 / 0 / 0 | 1.718 | persistent Python public terminal API |
| 4 | adewale/agentic-mermaid 0.5.6 | 1068 | 270 | 0 / 0 / 0 | 0 / 0 / 0 | 6.069 | persistent Node public terminal API |
| 5 | dfadler/zombie-mermaid 5.17.0 | 906 | 432 | 14 / 14 / 14 | 0 / 0 / 0 | 1.954 | persistent Node public terminal API |
| 6 | Yassimba/loom 0.10.0 | 743 | 595 | 0 / 0 / 0 | 0 / 0 / 0 | 0.549 | persistent Bun public terminal API |
| 7 | Latias94/merman 0.10.0 | 730 | 608 | 68 / 68 / 68 | 0 / 0 / 0 | 6.207 | public CLI terminal; process startup included |
| 8 | kais-radwan/ascii-mermaid 0.1.0 | 555 | 783 | 24 / 24 / 24 | 0 / 0 / 0 | 0.166 | persistent Node public terminal API |
| 9 | emtyty/merslim 0.2.3 | 538 | 800 | 160 / 160 / 160 | 0 / 0 / 0 | 0.549 | persistent Node public terminal API |
| 10 | crafter-station/mermaid 0.0.3 | 534 | 804 | 44 / 44 / 44 | 0 / 0 / 0 | 0.248 | persistent Node public terminal API |
| 11 | lukilabs/beautiful-mermaid 1.1.3 | 507 | 831 | 24 / 24 / 24 | 0 / 0 / 0 | 0.225 | persistent Node public terminal API |
| 12 | spacedock-dev/mermaidtext git-a6b0c7657b94 | 473 | 865 | 867 / 867 / 867 | 0 / 0 / 0 | 2.012 | public CLI terminal; process startup included |
| 13 | xai-org/grok-build git-2bdd1d6a6369 | 473 | 865 | 867 / 867 / 867 | 0 / 0 / 0 | 2.789 | public CLI terminal; process startup included |
| 14 | Mootikins/figurehead-rs v0.4.3 | 406 | 932 | 10 / 10 / 10 | 0 / 0 / 0 | 21.334 | public CLI terminal; process startup included |
| 15 | AlexanderGrooff/mermaid-ascii 1.6.1 | 399 | 939 | 0 / 0 / 0 | 0 / 0 / 0 | 11.899 | public CLI terminal; process startup included |
| 16 | anomalyco/opencode 2.3.0 | 252 | 1086 | 0 / 0 / 0 | 0 / 0 / 0 | 0.858 | persistent Bun public terminal API |
| 17 | kitlangton/merman 0.2.1 | 181 | 1157 | 0 / 0 / 0 | 0 / 0 / 0 | 0.142 | persistent Bun public terminal API |
| 18 | tariqshams/mermaidtui 0.0.6 | 23 | 1315 | 0 / 0 / 0 | 0 / 0 / 0 | 0.024 | persistent Node public parseMermaid → computeLayout → renderGraph; errors propagate |


## Blocked or incomplete execution


DaveBench measures completion and time. Drawing Correctness and Mermaid Fidelity have separate result files.
