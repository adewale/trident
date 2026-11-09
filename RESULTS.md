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
| 1 | 1–4 | Bezel 0.2.24 | 124 | 124–126 | 1 | 2 |
| 1 | 1–4 | Pele 1.13.0 | 124 | 124–126 | 1 | 2 |
| 3 | 1–4 | Ondine 0.0.3 | 123 | 123–126 | 1 | 3 |
| 4 | 1–4 | Mermaid 12.3.0 | 122 | 122–125 | 2 | 3 |
| 5 | 4–6 | Agentic Mermaid 0.5.6 | 121 | 121–122 | 5 | 1 |
| 6 | 6–8 | Mermaid Dart 0.3.2 | 115 | 115–120 | 7 | 5 |
| 7 | 4–8 | Frankenmermaid 0.4.0 | 112 | 112–122 | 5 | 10 |
| 8 | 6–9 | Mermaid RS Renderer 0.3.1 | 108 | 108–119 | 8 | 11 |
| 9 | 8–10 | Zombie Mermaid 5.14.4 | 104 | 104–109 | 18 | 5 |
| 10 | 10–11 | Latias Merman 0.9.3 | 99 | 99–101 | 26 | 2 |
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

3497 reference-qualified callbacks are unassessed for every one of the 26 executed candidates; 933 of them have no matching collected callback. Additional gaps vary by candidate. These gaps receive no verified pass credit.

| Verified rank | Possible rank | Project | Passed / 7346 ↑ | Assertion/fault nonpasses | Unsupported | Unassessed (shared + additional) |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 1 | Mermaid 12.3.0 | 7346 | 0 | 0 | 0 |
| 2 | 2–27 | Pele 1.13.0 | 3243 | 130 | 394 | 3497 + 82 |
| 3 | 2–27 | Bezel 0.2.24 | 3147 | 121 | 541 | 3497 + 40 |
| 4 | 2–27 | Latias Merman 0.9.3 | 2928 | 283 | 572 | 3497 + 66 |
| 5 | 2–27 | Agentic Mermaid 0.5.6 | 2239 | 114 | 1456 | 3497 + 40 |
| 6 | 2–27 | Mermaid Dart 0.3.2 | 2128 | 534 | 1155 | 3497 + 32 |
| 6 | 2–27 | Mermaid Flutter 0.3.2 | 2128 | 534 | 1155 | 3497 + 32 |
| 8 | 2–27 | Mermaid RS Renderer 0.3.1 | 1468 | 495 | 1837 | 3497 + 49 |
| 9 | 2–27 | Frankenmermaid 0.4.0 | 1322 | 1259 | 1191 | 3497 + 77 |
| 10 | 2–27 | Termaid 0.12.0 | 1079 | 1162 | 1583 | 3497 + 25 |
| 11 | 2–27 | Zombie Mermaid 5.14.4 | 980 | 1225 | 1641 | 3497 + 3 |
| 12 | 2–27 | XMermaid 0.4.2 | 896 | 2165 | 750 | 3497 + 38 |
| 13 | 2–27 | Loom renderer 0.10.0 | 753 | 947 | 2127 | 3497 + 22 |
| 14 | 2–27 | Mermaid ASCII 1.6.1 | 722 | 964 | 2163 | 3497 + 0 |
| 15 | 2–27 | Grok renderer git-2bdd1d6a6369 | 640 | 962 | 2246 | 3497 + 1 |
| 15 | 2–27 | MermaidText git-a6b0c7657b94 | 640 | 962 | 2246 | 3497 + 1 |
| 17 | 2–27 | Figurehead v0.4.3 | 363 | 1143 | 2342 | 3497 + 1 |
| 18 | 2–27 | ASCII Mermaid 0.1.0 | 355 | 1587 | 1904 | 3497 + 3 |
| 19 | 2–27 | Merslim 0.2.3 | 320 | 1782 | 1741 | 3497 + 6 |
| 20 | 2–27 | Ondine 0.0.3 | 298 | 83 | 3450 | 3497 + 18 |
| 21 | 2–27 | Beautiful Mermaid 1.1.3 | 237 | 1666 | 1945 | 3497 + 1 |
| 22 | 2–27 | Crafter Mermaid 0.0.3 | 217 | 1684 | 1923 | 3497 + 25 |
| 23 | 2–27 | VitePress Plugin Diagram 0.3.2 | 144 | 1092 | 2605 | 3497 + 8 |
| 24 | 2–27 | DSH Mermaid GB SVG 0.1.5 | 128 | 668 | 3053 | 3497 + 0 |
| 25 | 2–27 | OpenCode Merman 2.2.5 | 96 | 1158 | 2589 | 3497 + 6 |
| 26 | 2–27 | Kitlangton Merman 0.2.1 | 59 | 298 | 3488 | 3497 + 4 |
| 27 | 2–27 | MermaidTUI 0.0.6 | 0 | 55 | 3793 | 3497 + 1 |

## Equal-weight synthesis

| Possible rank | Project | DaveBench / 100 | Drawing / 100 | Fidelity / 100 | Overall / 100 ↑ |
| --- | --- | --- | --- | --- | --- |
| 1 | Mermaid 12.3.0 | 97.02 | 96.06–98.43 | 100.00 | 97.69–98.48 |
| 2–11 | Mermaid RS Renderer 0.3.1 | 97.24 | 85.04–93.70 | 19.98–68.25 | 67.42–86.40 |
| 2–11 | Agentic Mermaid 0.5.6 | 79.48 | 96.46–96.85 | 30.48–78.63 | 68.81–84.99 |
| 2–11 | Bezel 0.2.24 | 97.32 | 97.64–99.21 | 42.84–90.99 | 79.26–95.84 |
| 2–11 | Frankenmermaid 0.4.0 | 92.20 | 84.65–88.58 | 18.00–66.65 | 64.95–82.48 |
| 2–11 | Termaid 0.12.0 | 95.83 | 85.04 | 14.69–62.63 | 65.18–81.17 |
| 2–11 | Latias Merman 0.9.3 | 84.50 | 77.95–78.74 | 39.86–88.36 | 67.44–83.87 |
| 2–11 | Pele 1.13.0 | 97.32 | 97.64–99.21 | 44.15–92.87 | 79.70–96.47 |
| 2–11 | Mermaid Dart 0.3.2 | 83.01 | 90.55–94.49 | 28.97–77.01 | 67.51–84.84 |
| 2–11 | Ondine 0.0.3 | 97.27 | 94.09–95.28 | 4.06–51.91 | 65.14–81.48 |
| 2–14 | Mermaid Flutter 0.3.2 | 83.01 | n/a | 28.97–77.01 | 55.99–80.01 |
| 11–20 | Loom renderer 0.10.0 | 55.51 | 81.10 | 10.25–58.15 | 48.96–64.92 |
| 11–21 | Zombie Mermaid 5.14.4 | 47.47 | 82.68–84.65 | 13.34–60.99 | 47.83–64.37 |
| 11–21 | XMermaid 0.4.2 | 50.67 | 77.17–83.46 | 12.20–60.32 | 46.68–64.82 |
| 12–25 | MermaidText git-a6b0c7657b94 | 35.39 | 69.29 | 8.71–56.33 | 37.80–53.67 |
| 12–25 | Grok renderer git-2bdd1d6a6369 | 35.39 | 69.29 | 8.71–56.33 | 37.80–53.67 |
| 12–26 | Mermaid ASCII 1.6.1 | 29.88 | 60.63 | 9.83–57.43 | 33.45–49.31 |
| 12–26 | Merslim 0.2.3 | 48.14 | 54.72–59.45 | 4.36–52.04 | 35.74–53.21 |
| 12–26 | ASCII Mermaid 0.1.0 | 41.36 | 59.84 | 4.83–52.48 | 35.34–51.23 |
| 12–26 | Beautiful Mermaid 1.1.3 | 38.13 | 68.90 | 3.23–50.84 | 36.75–52.62 |
| 13–26 | Crafter Mermaid 0.0.3 | 38.60 | 49.21–55.91 | 2.95–50.90 | 30.26–48.47 |
| 15–26 | OpenCode Merman 2.2.5 | 18.93 | 63.78 | 1.31–48.99 | 28.00–43.90 |
| 15–26 | VitePress Plugin Diagram 0.3.2 | 29.66 | 32.28–51.18 | 1.96–49.67 | 21.30–43.50 |
| 15–26 | Figurehead v0.4.3 | 30.40 | 37.01 | 4.94–52.56 | 24.12–39.99 |
| 15–26 | DSH Mermaid GB SVG 0.1.5 | 28.61 | 44.88–56.69 | 1.74–49.35 | 25.08–44.88 |
| 17–26 | Kitlangton Merman 0.2.1 | 13.49 | 50.39 | 0.80–48.46 | 21.56–37.45 |
| 27 | MermaidTUI 0.0.6 | 1.71 | 10.24 | 0.00–47.62 | 3.98–19.86 |
