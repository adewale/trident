# Benchmark league tables

[Methods, scoring and coverage details](docs/benchmark-results-details.md)

## DaveBench

### SVG rendering

| Rank | Project | Completed / 1342 ↑ | Median seconds ↓ | Timing boundary |
| --- | --- | --- | --- | --- |
| 1 | Latias Merman 0.9.3 | 1338 | 4.309 | API; initialization excluded |
| 2 | Ondine 0.0.3 | 1306 | 0.264 | API; initialization excluded |
| 3 | Bezel 0.2.24 | 1306 | 0.348 | API; initialization excluded |
| 4 | Pele 1.13.0 | 1306 | 0.597 | API; initialization excluded |
| 5 | Mermaid RS Renderer 0.3.1 | 1304 | 13.285 | CLI; startup included |
| 6 | Mermaid 12.3.0 | 1302 | 39.750 | API; initialization excluded |
| 7 | Frankenmermaid 0.4.0 | 1185 | 0.623 | API; initialization excluded |
| 8 | Mermaid Dart 0.3.2 | 1114 | 0.856 | API; initialization excluded |
| 9 | Agentic Mermaid 0.5.6 | 1066 | 6.553 | API; initialization excluded |
| 10 | Merslim 0.2.3 | 700 | 20.917 | API; initialization excluded |
| 11 | XMermaid 0.4.2 | 680 | 0.499 | API; initialization excluded |
| 12 | Zombie Mermaid 5.14.4 | 637 | 1.588 | API; initialization excluded |
| 13 | Beautiful Mermaid 1.1.3 | 513 | 1.138 | API; initialization excluded |
| 14 | Crafter Mermaid 0.0.3 | 510 | 0.368 | API; initialization excluded |
| 15 | VitePress Plugin Diagram 0.3.2 | 398 | 0.100 | API; initialization excluded |
| 16 | DSH Mermaid GB SVG 0.1.5 | 384 | 0.174 | API; initialization excluded |

### PNG rendering

| Rank | Project | Completed / 1342 ↑ | Median seconds ↓ | Timing boundary |
| --- | --- | --- | --- | --- |
| 1 | Latias Merman 0.9.3 | 1338 | 16.987 | API; initialization excluded |
| 2 | Bezel 0.2.24 | 1306 | 8.467 | API; initialization excluded |
| 2 | Mermaid RS Renderer 0.3.1 | 1306 | 38.014 | CLI; startup included |
| 2 | Ondine 0.0.3 | 1306 | 7.363 | API; initialization excluded |
| 2 | Pele 1.13.0 | 1306 | 8.230 | API; initialization excluded |
| 6 | Mermaid 12.3.0 | 1302 | 65.629 | API; initialization excluded |
| 7 | Frankenmermaid 0.4.0 | 1185 | 12.982 | API; initialization excluded |
| 8 | Mermaid Dart 0.3.2 | 1114 | 8.101 | API; initialization excluded |
| 9 | Mermaid Flutter 0.3.2 | 1114 | 25.455 | API; initialization excluded |
| 10 | Agentic Mermaid 0.5.6 | 1066 | 15.451 | API; initialization excluded |
| 11 | Merslim 0.2.3 | 700 | 27.391 | API; initialization excluded |
| 12 | XMermaid 0.4.2 | 680 | 3.871 | API; initialization excluded |
| 13 | Zombie Mermaid 5.14.4 | 637 | 6.204 | API; initialization excluded |
| 14 | Beautiful Mermaid 1.1.3 | 513 | 3.897 | API; initialization excluded |
| 15 | Crafter Mermaid 0.0.3 | 510 | 5.046 | API; initialization excluded |
| 16 | VitePress Plugin Diagram 0.3.2 | 398 | 2.042 | API; initialization excluded |
| 17 | DSH Mermaid GB SVG 0.1.5 | 384 | 5.833 | API; initialization excluded |

### Terminal rendering

| Rank | Project | Completed / 1342 ↑ | Median seconds ↓ | Timing boundary |
| --- | --- | --- | --- | --- |
| 1 | Frankenmermaid 0.4.0 | 1342 | 3.213 | CLI; startup included |
| 2 | Ondine 0.0.3 | 1304 | 234.173 | CLI; startup included |
| 3 | Termaid 0.12.0 | 1286 | 1.914 | API; initialization excluded |
| 4 | Agentic Mermaid 0.5.6 | 1068 | 6.248 | API; initialization excluded |
| 5 | Loom renderer 0.10.0 | 745 | 0.387 | API; initialization excluded |
| 6 | Latias Merman 0.9.3 | 726 | 10.011 | CLI; startup included |
| 7 | Zombie Mermaid 5.14.4 | 637 | 2.698 | API; initialization excluded |
| 8 | ASCII Mermaid 0.1.0 | 555 | 0.165 | API; initialization excluded |
| 9 | Merslim 0.2.3 | 538 | 0.662 | API; initialization excluded |
| 10 | Crafter Mermaid 0.0.3 | 534 | 0.189 | API; initialization excluded |
| 11 | Beautiful Mermaid 1.1.3 | 509 | 0.205 | API; initialization excluded |
| 12 | Grok renderer git-2bdd1d6a6369 | 475 | 1.937 | CLI; startup included |
| 13 | MermaidText git-a6b0c7657b94 | 475 | 3.167 | CLI; startup included |
| 14 | Figurehead v0.4.3 | 408 | 40.191 | CLI; startup included |
| 15 | Mermaid ASCII 1.6.1 | 401 | 19.202 | CLI; startup included |
| 16 | OpenCode Merman 2.2.5 | 254 | 0.684 | API; initialization excluded |
| 17 | Kitlangton Merman 0.2.1 | 181 | 0.142 | API; initialization excluded |
| 18 | MermaidTUI 0.0.6 | 23 | 0.022 | API; initialization excluded |

## Drawing Correctness

Required labels must be visible without leaked source syntax. Edges, arrow direction, layout and styling are outside this benchmark; PNG is not assessed.

### SVG correctness

| Verified rank | Possible rank | Project | Passed / 127 ↑ | Pass bounds | Failed | Unassessed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 1–3 | Bezel 0.2.24 | 125 | 125–126 | 1 | 1 |
| 1 | 1–3 | Pele 1.13.0 | 125 | 125–126 | 1 | 1 |
| 3 | 1–4 | Ondine 0.0.3 | 124 | 124–126 | 1 | 2 |
| 4 | 1–4 | Mermaid 12.3.0 | 123 | 123–125 | 2 | 2 |
| 5 | 4–5 | Agentic Mermaid 0.5.6 | 122 | 122–123 | 4 | 1 |
| 6 | 6–8 | Mermaid Dart 0.3.2 | 116 | 116–120 | 7 | 4 |
| 7 | 5–8 | Frankenmermaid 0.4.0 | 112 | 112–122 | 5 | 10 |
| 8 | 6–9 | Mermaid RS Renderer 0.3.1 | 108 | 108–119 | 8 | 11 |
| 9 | 8–10 | Zombie Mermaid 5.14.4 | 105 | 105–109 | 18 | 4 |
| 10 | 10–11 | Latias Merman 0.9.3 | 100 | 100–101 | 26 | 1 |
| 11 | 9–11 | XMermaid 0.4.2 | 98 | 98–106 | 21 | 8 |
| 12 | 12 | Beautiful Mermaid 1.1.3 | 92 | 92 | 35 | 0 |
| 13 | 13–14 | Merslim 0.2.3 | 76 | 76–88 | 39 | 12 |
| 14 | 13–15 | Crafter Mermaid 0.0.3 | 66 | 66–83 | 44 | 17 |
| 15 | 14–16 | DSH Mermaid GB SVG 0.1.5 | 57 | 57–72 | 55 | 15 |
| 16 | 15–16 | VitePress Plugin Diagram 0.3.2 | 41 | 41–65 | 62 | 24 |

### Terminal correctness

| Verified rank | Possible rank | Project | Passed / 127 ↑ | Failed | Unassessed |
| --- | --- | --- | --- | --- | --- |
| 1 | 1 | Agentic Mermaid 0.5.6 | 124 | 3 | 0 |
| 2 | 2 | Ondine 0.0.3 | 116 | 11 | 0 |
| 3 | 3 | Termaid 0.12.0 | 108 | 19 | 0 |
| 4 | 4 | Zombie Mermaid 5.14.4 | 106 | 21 | 0 |
| 5 | 5 | Frankenmermaid 0.4.0 | 103 | 24 | 0 |
| 5 | 5 | Loom renderer 0.10.0 | 103 | 24 | 0 |
| 7 | 7 | Latias Merman 0.9.3 | 99 | 28 | 0 |
| 8 | 8 | Grok renderer git-2bdd1d6a6369 | 88 | 39 | 0 |
| 8 | 8 | MermaidText git-a6b0c7657b94 | 88 | 39 | 0 |
| 10 | 10 | Beautiful Mermaid 1.1.3 | 83 | 44 | 0 |
| 11 | 11 | OpenCode Merman 2.2.5 | 81 | 46 | 0 |
| 12 | 12 | Mermaid ASCII 1.6.1 | 77 | 50 | 0 |
| 13 | 13 | ASCII Mermaid 0.1.0 | 76 | 51 | 0 |
| 14 | 14 | Kitlangton Merman 0.2.1 | 64 | 63 | 0 |
| 15 | 15 | Merslim 0.2.3 | 63 | 64 | 0 |
| 16 | 16 | Crafter Mermaid 0.0.3 | 59 | 68 | 0 |
| 17 | 17 | Figurehead v0.4.3 | 47 | 80 | 0 |
| 18 | 18 | MermaidTUI 0.0.6 | 13 | 114 | 0 |

## Mermaid Fidelity

3499 reference-qualified callbacks are unassessed for every one of the 26 executed candidates; 942 of them have no matching collected callback. Additional gaps vary by candidate. These gaps receive no verified pass credit.

| Verified rank | Possible rank | Project | Passed / 7346 ↑ | Assertion/fault nonpasses | Unsupported | Unassessed (shared + additional) |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 1 | Mermaid 12.3.0 | 7346 | 0 | 0 | 0 |
| 2 | 2–27 | Pele 1.13.0 | 3263 | 97 | 375 | 3499 + 112 |
| 3 | 2–27 | Bezel 0.2.24 | 3173 | 91 | 515 | 3499 + 68 |
| 4 | 2–27 | Latias Merman 0.9.3 | 2935 | 274 | 544 | 3499 + 94 |
| 5 | 2–27 | Agentic Mermaid 0.5.6 | 2247 | 106 | 1427 | 3499 + 67 |
| 6 | 2–27 | Mermaid Dart 0.3.2 | 2127 | 525 | 1132 | 3499 + 63 |
| 6 | 2–27 | Mermaid Flutter 0.3.2 | 2127 | 525 | 1132 | 3499 + 63 |
| 8 | 2–27 | Mermaid RS Renderer 0.3.1 | 1481 | 496 | 1815 | 3499 + 55 |
| 9 | 2–27 | Frankenmermaid 0.4.0 | 1326 | 1250 | 1169 | 3499 + 102 |
| 10 | 2–27 | Termaid 0.12.0 | 1078 | 1153 | 1581 | 3499 + 35 |
| 11 | 2–27 | Zombie Mermaid 5.14.4 | 979 | 1216 | 1638 | 3499 + 14 |
| 12 | 2–27 | XMermaid 0.4.2 | 894 | 2083 | 724 | 3499 + 146 |
| 13 | 2–27 | Loom renderer 0.10.0 | 752 | 938 | 2125 | 3499 + 32 |
| 14 | 2–27 | Mermaid ASCII 1.6.1 | 722 | 956 | 2161 | 3499 + 8 |
| 15 | 2–27 | Grok renderer git-2bdd1d6a6369 | 639 | 953 | 2244 | 3499 + 11 |
| 15 | 2–27 | MermaidText git-a6b0c7657b94 | 639 | 953 | 2244 | 3499 + 11 |
| 17 | 2–27 | Figurehead v0.4.3 | 362 | 1134 | 2339 | 3499 + 12 |
| 18 | 2–27 | ASCII Mermaid 0.1.0 | 354 | 1578 | 1901 | 3499 + 14 |
| 19 | 2–27 | Merslim 0.2.3 | 319 | 1773 | 1739 | 3499 + 16 |
| 20 | 2–27 | Ondine 0.0.3 | 305 | 55 | 3457 | 3499 + 30 |
| 21 | 2–27 | Beautiful Mermaid 1.1.3 | 236 | 1657 | 1942 | 3499 + 12 |
| 22 | 2–27 | Crafter Mermaid 0.0.3 | 230 | 1666 | 1938 | 3499 + 13 |
| 23 | 2–27 | VitePress Plugin Diagram 0.3.2 | 144 | 1090 | 2602 | 3499 + 11 |
| 24 | 2–27 | DSH Mermaid GB SVG 0.1.5 | 128 | 668 | 3051 | 3499 + 0 |
| 25 | 2–27 | OpenCode Merman 2.2.5 | 126 | 1123 | 2589 | 3499 + 9 |
| 26 | 2–27 | Kitlangton Merman 0.2.1 | 59 | 292 | 3485 | 3499 + 11 |
| 27 | 2–27 | MermaidTUI 0.0.6 | 0 | 55 | 3791 | 3499 + 1 |

## Equal-weight synthesis

| Possible rank | Project | DaveBench / 100 | Drawing / 100 | Fidelity / 100 | Overall / 100 ↑ |
| --- | --- | --- | --- | --- | --- |
| 1 | Mermaid 12.3.0 | 97.02 | 96.85–98.43 | 100.00 | 97.96–98.48 |
| 2–11 | Mermaid RS Renderer 0.3.1 | 97.24 | 85.04–93.70 | 20.16–68.54 | 67.48–86.49 |
| 2–11 | Agentic Mermaid 0.5.6 | 79.48 | 96.85–97.24 | 30.59–79.13 | 68.97–85.29 |
| 2–11 | Bezel 0.2.24 | 97.32 | 98.43–99.21 | 43.19–91.75 | 79.65–96.09 |
| 2–11 | Latias Merman 0.9.3 | 84.50 | 78.35–78.74 | 39.95–88.86 | 67.60–84.04 |
| 2–11 | Pele 1.13.0 | 97.32 | 98.43–99.21 | 44.42–93.57 | 80.05–96.70 |
| 2–11 | Mermaid Dart 0.3.2 | 83.01 | 91.34–94.49 | 28.95–77.44 | 67.77–84.98 |
| 2–12 | Termaid 0.12.0 | 95.83 | 85.04 | 14.67–62.78 | 65.18–81.22 |
| 2–12 | Ondine 0.0.3 | 97.27 | 94.49–95.28 | 4.15–52.19 | 65.30–81.58 |
| 2–13 | Frankenmermaid 0.4.0 | 92.20 | 84.65–88.58 | 18.05–67.07 | 64.97–82.62 |
| 2–14 | Mermaid Flutter 0.3.2 | 83.01 | n/a | 28.95–77.44 | 55.98–80.23 |
| 10–20 | Loom renderer 0.10.0 | 55.51 | 81.10 | 10.24–58.30 | 48.95–64.97 |
| 8–21 | XMermaid 0.4.2 | 50.67 | 77.17–83.46 | 12.17–61.79 | 46.67–65.31 |
| 11–21 | Zombie Mermaid 5.14.4 | 47.47 | 83.07–84.65 | 13.33–61.15 | 47.95–64.42 |
| 12–25 | MermaidText git-a6b0c7657b94 | 35.39 | 69.29 | 8.70–56.48 | 37.79–53.72 |
| 12–25 | Grok renderer git-2bdd1d6a6369 | 35.39 | 69.29 | 8.70–56.48 | 37.79–53.72 |
| 12–26 | Mermaid ASCII 1.6.1 | 29.88 | 60.63 | 9.83–57.57 | 33.45–49.36 |
| 12–26 | Merslim 0.2.3 | 48.14 | 54.72–59.45 | 4.34–52.19 | 35.73–53.26 |
| 12–26 | ASCII Mermaid 0.1.0 | 41.36 | 59.84 | 4.82–52.64 | 35.34–51.28 |
| 12–26 | Beautiful Mermaid 1.1.3 | 38.13 | 68.90 | 3.21–51.01 | 36.75–52.68 |
| 13–26 | Crafter Mermaid 0.0.3 | 38.60 | 49.21–55.91 | 3.13–50.94 | 30.31–48.48 |
| 15–26 | OpenCode Merman 2.2.5 | 18.93 | 63.78 | 1.72–49.47 | 28.14–44.06 |
| 15–26 | VitePress Plugin Diagram 0.3.2 | 29.66 | 32.28–51.18 | 1.96–49.74 | 21.30–43.53 |
| 15–26 | Figurehead v0.4.3 | 30.40 | 37.01 | 4.93–52.72 | 24.11–40.04 |
| 15–26 | DSH Mermaid GB SVG 0.1.5 | 28.61 | 44.88–56.69 | 1.74–49.37 | 25.08–44.89 |
| 17–26 | Kitlangton Merman 0.2.1 | 13.49 | 50.39 | 0.80–48.58 | 21.56–37.49 |
| 27 | MermaidTUI 0.0.6 | 1.71 | 10.24 | 0.00–47.64 | 3.98–19.87 |
