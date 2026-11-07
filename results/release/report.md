# DaveBench results

**This report contains DaveBench only.** Drawing Correctness and Mermaid Fidelity are collected separately; the current league tables are in `RESULTS.md`.

1342 documentation occurrences per format; three runs after the same 30 warm-ups. Completed counts show the minimum across the three full runs; times show their median total. The numeric run table retains every repeat. Outputs were discarded without drawing assessment. Versions were frozen at campaign preparation.

| Benchmark | Result |
|---|---|
| DaveBench | 150 measured runs; 201,300 timed calls. |
| Drawing Correctness | Not supplied to this DaveBench report. |
| Mermaid Fidelity | Not supplied to this DaveBench report. |

## DaveBench — SVG

**More admissible completions wins; lower median total time breaks ties between rows with the same boundary kind.** Times include failed calls. The timeout is 15 seconds per call; timeouts are included in failures. Rejected outputs returned without an error but failed mechanical admission (empty, error message, error placeholder, zero size or echoed source); they are included in failures. CLI process startup is included in CLI rows; persistent API initialization is excluded.

| Rank | Project | Completed | Failed | Rejected outputs in runs 1/2/3 | Timeouts in runs 1/2/3 | Median total seconds | Boundary |
|---:|---|---:|---:|---|---|---:|---|
| 1 | Latias94/merman 0.9.3 | 1338 | 4 | 0 / 0 / 0 | 0 / 0 / 0 | 4.340 | Chromium public SVG API |
| 2 | wevm/ondine 0.0.3 | 1306 | 36 | 0 / 0 / 0 | 0 / 0 / 0 | 0.248 | Chromium public SVG API |
| 3 | crabtalk/bezel 0.2.24 | 1306 | 36 | 0 / 0 / 0 | 0 / 0 / 0 | 0.342 | Chromium public SVG API |
| 4 | obsidianmd/pele 1.13.0 | 1306 | 36 | 0 / 0 / 0 | 0 / 0 / 0 | 0.517 | Chromium public SVG API |
| 5 | 1jehuang/mermaid-rs-renderer 0.3.1 | 1304 | 38 | 2 / 2 / 2 | 0 / 0 / 0 | 23.230 | native CLI svg; process startup included |
| 6 | mermaid-js/mermaid 12.3.0 | 1302 | 40 | 34 / 34 / 34 | 0 / 0 / 0 | 37.783 | Chromium public SVG API |
| 7 | Dicklesworthstone/frankenmermaid 0.4.0 | 1185 | 157 | 157 / 157 / 157 | 0 / 0 / 0 | 0.526 | Chromium public SVG API |
| 8 | orestesgaolin/mermaid 0.3.2 | 1114 | 228 | 0 / 0 / 0 | 0 / 0 / 0 | 0.872 | Chromium public SVG API |
| 9 | adewale/agentic-mermaid 0.5.6 | 1066 | 276 | 0 / 0 / 0 | 0 / 0 / 0 | 5.936 | Chromium public SVG API |
| 10 | emtyty/merslim 0.2.3 | 700 | 642 | 0 / 0 / 0 | 0 / 0 / 0 | 21.345 | Chromium public SVG API |
| 11 | evangwt/xmermaid 0.4.2 | 680 | 662 | 2 / 2 / 2 | 0 / 0 / 0 | 0.470 | Chromium public SVG API |
| 12 | dfadler/zombie-mermaid 5.14.4 | 637 | 705 | 16 / 16 / 16 | 0 / 0 / 0 | 1.420 | Chromium public SVG API |
| 13 | lukilabs/beautiful-mermaid 1.1.3 | 513 | 829 | 24 / 24 / 24 | 0 / 0 / 0 | 1.157 | Chromium public SVG API |
| 14 | crafter-station/mermaid 0.0.3 | 510 | 832 | 2 / 2 / 2 | 0 / 0 / 0 | 0.373 | Chromium public SVG API |
| 15 | KlangHaus/vitepress-plugin-diagram 0.3.2 | 398 | 944 | 0 / 0 / 0 | 0 / 0 / 0 | 0.098 | Chromium public SVG API |
| 16 | sandyyst/dsh-plugin-mermaid-gb-svg 0.1.5 | 384 | 958 | 956 / 956 / 956 | 0 / 0 / 0 | 0.161 | Chromium public SVG API |

## DaveBench — PNG

**More admissible completions wins; lower median total time breaks ties between rows with the same boundary kind.** Times include failed calls. The timeout is 15 seconds per call; timeouts are included in failures. Rejected outputs returned without an error but failed mechanical admission (empty, error message, error placeholder, zero size or echoed source); they are included in failures. CLI process startup is included in CLI rows; persistent API initialization is excluded.

| Rank | Project | Completed | Failed | Rejected outputs in runs 1/2/3 | Timeouts in runs 1/2/3 | Median total seconds | Boundary |
|---:|---|---:|---:|---|---|---:|---|
| 1 | Latias94/merman 0.9.3 | 1338 | 4 | 0 / 0 / 0 | 0 / 0 / 0 | 14.741 | Chromium SVG API + canvas PNG conversion |
| 2 | 1jehuang/mermaid-rs-renderer 0.3.1 | 1306 | 36 | 0 / 0 / 0 | 0 / 0 / 0 | 47.460 | native CLI png; process startup included |
| 2 | wevm/ondine 0.0.3 | 1306 | 36 | 0 / 0 / 0 | 0 / 0 / 0 | 6.853 | Chromium SVG API + canvas PNG conversion |
| 2 | obsidianmd/pele 1.13.0 | 1306 | 36 | 0 / 0 / 0 | 0 / 0 / 0 | 7.829 | Chromium SVG API + canvas PNG conversion |
| 2 | crabtalk/bezel 0.2.24 | 1306 | 36 | 0 / 0 / 0 | 0 / 0 / 0 | 7.954 | Chromium SVG API + canvas PNG conversion |
| 6 | mermaid-js/mermaid 12.3.0 | 1302 | 40 | 0 / 0 / 0 | 0 / 0 / 0 | 57.802 | Chromium SVG API + canvas PNG conversion |
| 7 | Dicklesworthstone/frankenmermaid 0.4.0 | 1185 | 157 | 157 / 157 / 157 | 0 / 0 / 0 | 11.251 | Chromium SVG API + canvas PNG conversion |
| 8 | orestesgaolin/mermaid 0.3.2 | 1114 | 228 | 0 / 0 / 0 | 0 / 0 / 0 | 7.494 | Chromium SVG API + canvas PNG conversion |
| 9 | adewale/agentic-mermaid 0.5.6 | 1066 | 276 | 0 / 0 / 0 | 0 / 0 / 0 | 14.557 | Chromium SVG API + canvas PNG conversion |
| 10 | emtyty/merslim 0.2.3 | 700 | 642 | 0 / 0 / 0 | 0 / 0 / 0 | 26.430 | Chromium public PNG API |
| 11 | evangwt/xmermaid 0.4.2 | 680 | 662 | 2 / 2 / 2 | 0 / 0 / 0 | 3.574 | Chromium SVG API + canvas PNG conversion |
| 12 | dfadler/zombie-mermaid 5.14.4 | 637 | 705 | 0 / 0 / 0 | 0 / 0 / 0 | 5.444 | Chromium SVG API + canvas PNG conversion |
| 13 | lukilabs/beautiful-mermaid 1.1.3 | 513 | 829 | 0 / 0 / 0 | 0 / 0 / 0 | 3.338 | Chromium SVG API + canvas PNG conversion |
| 14 | crafter-station/mermaid 0.0.3 | 510 | 832 | 2 / 2 / 2 | 0 / 0 / 0 | 4.609 | Chromium SVG API + canvas PNG conversion |
| 15 | KlangHaus/vitepress-plugin-diagram 0.3.2 | 398 | 944 | 0 / 0 / 0 | 0 / 0 / 0 | 1.735 | Chromium SVG API + canvas PNG conversion |
| 16 | sandyyst/dsh-plugin-mermaid-gb-svg 0.1.5 | 384 | 958 | 956 / 956 / 956 | 0 / 0 / 0 | 5.477 | Chromium SVG API + canvas PNG conversion |

## DaveBench — TERMINAL

**More admissible completions wins; lower median total time breaks ties between rows with the same boundary kind.** Times include failed calls. The timeout is 15 seconds per call; timeouts are included in failures. Rejected outputs returned without an error but failed mechanical admission (empty, error message, error placeholder, zero size or echoed source); they are included in failures. CLI process startup is included in CLI rows; persistent API initialization is excluded.

| Rank | Project | Completed | Failed | Rejected outputs in runs 1/2/3 | Timeouts in runs 1/2/3 | Median total seconds | Boundary |
|---:|---|---:|---:|---|---|---:|---|
| 1 | Dicklesworthstone/frankenmermaid 0.4.0 | 1342 | 0 | 0 / 0 / 0 | 0 / 0 / 0 | 3.446 | public CLI terminal; process startup included |
| 2 | wevm/ondine 0.0.3 | 1304 | 38 | 2 / 2 / 2 | 0 / 0 / 0 | 219.536 | public CLI terminal; process startup included |
| 3 | fasouto/termaid 0.12.0 | 1286 | 56 | 56 / 56 / 56 | 0 / 0 / 0 | 1.825 | persistent Python public terminal API |
| 4 | adewale/agentic-mermaid 0.5.6 | 1068 | 274 | 0 / 0 / 0 | 0 / 0 / 0 | 5.971 | persistent Node public terminal API |
| 5 | Yassimba/loom 0.10.0 | 745 | 597 | 0 / 0 / 0 | 0 / 0 / 0 | 0.397 | persistent Bun public terminal API |
| 6 | Latias94/merman 0.9.3 | 726 | 616 | 68 / 68 / 68 | 0 / 0 / 0 | 8.472 | public CLI terminal; process startup included |
| 7 | dfadler/zombie-mermaid 5.14.4 | 637 | 705 | 16 / 16 / 16 | 0 / 0 / 0 | 2.606 | persistent Node public terminal API |
| 8 | kais-radwan/ascii-mermaid 0.1.0 | 555 | 787 | 26 / 26 / 26 | 0 / 0 / 0 | 0.138 | persistent Node public terminal API |
| 9 | emtyty/merslim 0.2.3 | 538 | 804 | 162 / 162 / 162 | 0 / 0 / 0 | 0.771 | persistent Node public terminal API |
| 10 | crafter-station/mermaid 0.0.3 | 534 | 808 | 46 / 46 / 46 | 0 / 0 / 0 | 0.172 | persistent Node public terminal API |
| 11 | lukilabs/beautiful-mermaid 1.1.3 | 509 | 833 | 24 / 24 / 24 | 0 / 0 / 0 | 0.198 | persistent Node public terminal API |
| 12 | xai-org/grok-build git-2bdd1d6a6369 | 475 | 867 | 867 / 867 / 867 | 0 / 0 / 0 | 2.300 | public CLI terminal; process startup included |
| 13 | spacedock-dev/mermaidtext git-a6b0c7657b94 | 475 | 867 | 867 / 867 / 867 | 0 / 0 / 0 | 2.570 | public CLI terminal; process startup included |
| 14 | Mootikins/figurehead-rs v0.4.3 | 408 | 934 | 10 / 10 / 10 | 0 / 0 / 0 | 27.795 | public CLI terminal; process startup included |
| 15 | AlexanderGrooff/mermaid-ascii 1.6.1 | 401 | 941 | 0 / 0 / 0 | 0 / 0 / 0 | 11.909 | public CLI terminal; process startup included |
| 16 | anomalyco/opencode 2.2.5 | 254 | 1088 | 0 / 0 / 0 | 0 / 0 / 0 | 0.638 | persistent Bun public terminal API |
| 17 | kitlangton/merman 0.2.1 | 181 | 1161 | 0 / 0 / 0 | 0 / 0 / 0 | 0.120 | persistent Bun public terminal API |
| 18 | tariqshams/mermaidtui 0.0.6 | 23 | 1319 | 0 / 0 / 0 | 0 / 0 / 0 | 0.034 | persistent Node public parseMermaid → computeLayout → renderGraph; errors propagate |


## Blocked or incomplete execution

- **pub:mermaid_flutter:** Error: Native Flutter has no prepared artifact: DaveBench measures it with davebench:native-png from a release bundle (see native-flutter/README.md).

DaveBench measures completion and time. Drawing Correctness and Mermaid Fidelity have separate result files.
