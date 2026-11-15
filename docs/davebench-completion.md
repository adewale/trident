# DaveBench completion on reference-accepted inputs

The Mermaid reference rejects 4 of the 1342 documentation inputs with its own parser or diagram-detection error, so every project's completion is counted over the 1338 accepted inputs. Rendering a reference-rejected input earns no completion credit; the last column counts them and is not a success. Counts come from each project's run with the fewest accepted completions.

Failures on accepted inputs, by kind: **execution** (the render threw, exited nonzero or timed out), **admission** (an output came back but was rejected: error placeholder or text, fallback render, draws nothing, malformed, zero size) and **conversion** (Trident's PNG conversion failed after an admissible SVG). Completed + execution + admission + conversion = accepted.

| Reference-rejected input | Mermaid error |
|---|---|
| docs/config/8.6.0_docs.md:82 | Parse error on line 10: |
| docs/config/8.6.0_docs.md:94 | Parse error on line 10: |
| docs/config/directives.md:100 | No diagram type detected matching given configuration for text: |
| docs/config/directives.md:106 | No diagram type detected matching given configuration for text: |

## SVG

| Project | Completed of 1338 accepted ↑ | Current count of 1342 | Execution failures | Admission failures | Conversion failures | Reference-rejected inputs rendered |
|---|---:|---:|---:|---:|---:|---:|
| Latias Merman 0.10.0 | 1338 | 1338 | 0 | 0 | — | 0 |
| Mermaid 12.3.0 | 1338 | 1338 | 0 | 0 | — | 0 |
| Bezel 0.2.26 | 1306 | 1306 | 32 | 0 | — | 0 |
| Pele 1.13.0 | 1306 | 1306 | 32 | 0 | — | 0 |
| Ondine 0.0.3 | 1306 | 1306 | 32 | 0 | — | 0 |
| Mermaid RS Renderer 0.3.1 | 1304 | 1304 | 32 | 2 | — | 0 |
| Frankenmermaid 0.5.0 | 1177 | 1181 | 0 | 161 | — | 4 |
| Mermaid Dart 0.3.2 | 1114 | 1114 | 224 | 0 | — | 0 |
| Agentic Mermaid 0.5.6 | 1066 | 1066 | 272 | 0 | — | 0 |
| Zombie Mermaid 5.17.0 | 906 | 908 | 418 | 14 | — | 2 |
| Merslim 0.2.3 | 698 | 700 | 640 | 0 | — | 2 |
| XMermaid 0.4.2 | 680 | 680 | 656 | 2 | — | 0 |
| Beautiful Mermaid 1.1.3 | 511 | 513 | 803 | 24 | — | 2 |
| Crafter Mermaid 0.0.3 | 508 | 510 | 828 | 2 | — | 2 |
| VitePress Plugin Diagram 0.3.2 | 396 | 396 | 940 | 2 | — | 0 |
| DSH Mermaid GB SVG 0.1.5 | 382 | 384 | 0 | 956 | — | 2 |

## PNG

| Project | Completed of 1338 accepted ↑ | Current count of 1342 | Execution failures | Admission failures | Conversion failures | Reference-rejected inputs rendered |
|---|---:|---:|---:|---:|---:|---:|
| Latias Merman 0.10.0 | 1338 | 1338 | 0 | 0 | 0 | 0 |
| Mermaid 12.3.0 | 1338 | 1338 | 0 | 0 | 0 | 0 |
| Mermaid RS Renderer 0.3.1 | 1306 | 1306 | 32 | 0 | — | 0 |
| Bezel 0.2.26 | 1306 | 1306 | 32 | 0 | 0 | 0 |
| Pele 1.13.0 | 1306 | 1306 | 32 | 0 | 0 | 0 |
| Ondine 0.0.3 | 1306 | 1306 | 32 | 0 | 0 | 0 |
| Frankenmermaid 0.5.0 | 1177 | 1181 | 0 | 161 | 0 | 4 |
| Mermaid Dart 0.3.2 | 1114 | 1114 | 224 | 0 | 0 | 0 |
| Mermaid Flutter 0.3.2 | 1114 | 1114 | 224 | 0 | — | 0 |
| Agentic Mermaid 0.5.6 | 1066 | 1066 | 272 | 0 | 0 | 0 |
| Zombie Mermaid 5.17.0 | 906 | 908 | 418 | 14 | 0 | 2 |
| Merslim 0.2.3 | 698 | 700 | 640 | 0 | — | 2 |
| XMermaid 0.4.2 | 680 | 680 | 656 | 2 | 0 | 0 |
| Beautiful Mermaid 1.1.3 | 511 | 513 | 803 | 24 | 0 | 2 |
| Crafter Mermaid 0.0.3 | 508 | 510 | 828 | 2 | 0 | 2 |
| VitePress Plugin Diagram 0.3.2 | 396 | 396 | 940 | 2 | 0 | 0 |
| DSH Mermaid GB SVG 0.1.5 | 382 | 384 | 0 | 956 | 0 | 2 |

## Terminal text

| Project | Completed of 1338 accepted ↑ | Current count of 1342 | Execution failures | Admission failures | Conversion failures | Reference-rejected inputs rendered |
|---|---:|---:|---:|---:|---:|---:|
| Frankenmermaid 0.5.0 | 1334 | 1338 | 0 | 4 | — | 4 |
| Ondine 0.0.3 | 1306 | 1306 | 32 | 0 | — | 0 |
| Termaid 0.12.0 | 1240 | 1242 | 0 | 98 | — | 2 |
| Agentic Mermaid 0.5.6 | 1068 | 1068 | 270 | 0 | — | 0 |
| Zombie Mermaid 5.17.0 | 906 | 908 | 418 | 14 | — | 2 |
| Loom renderer 0.10.0 | 743 | 745 | 595 | 0 | — | 2 |
| Latias Merman 0.10.0 | 730 | 730 | 540 | 68 | — | 0 |
| ASCII Mermaid 0.1.0 | 555 | 557 | 759 | 24 | — | 2 |
| Merslim 0.2.3 | 538 | 540 | 640 | 160 | — | 2 |
| Crafter Mermaid 0.0.3 | 534 | 536 | 760 | 44 | — | 2 |
| Beautiful Mermaid 1.1.3 | 507 | 509 | 807 | 24 | — | 2 |
| MermaidText git-a6b0c7657b94 | 473 | 475 | 0 | 865 | — | 2 |
| Grok renderer git-2bdd1d6a6369 | 473 | 475 | 0 | 865 | — | 2 |
| Figurehead v0.4.3 | 406 | 408 | 922 | 10 | — | 2 |
| Mermaid ASCII 1.6.1 | 399 | 401 | 939 | 0 | — | 2 |
| OpenCode Merman 2.3.0 | 252 | 254 | 1086 | 0 | — | 2 |
| Kitlangton Merman 0.2.1 | 181 | 181 | 1157 | 0 | — | 0 |
| MermaidTUI 0.0.6 | 23 | 23 | 1315 | 0 | — | 0 |

