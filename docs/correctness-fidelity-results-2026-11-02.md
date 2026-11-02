# Drawing Correctness and Mermaid Fidelity — 2 November 2026

Both collectors are implemented and have been run. Drawing Correctness covers 26 available projects and 50 output bindings. Fidelity executes original pinned Vitest tests for three candidate adapters plus Mermaid. Assessment and adapter gaps remain substantial, so these results do not establish an overall winner.

Versions reuse the existing campaign freeze at `2026-11-02T15:09:38.022Z`. DaveBench timings were not repeated. Functional checks preceded collection; corrections recollected only 90 terminal regression observations and 43 affected PNG observations. Numeric results contain counts and case/file accounting, without rendered outputs.

## Drawing Correctness

The shared corpus has **127 unique inputs**, covering 20 families with sources from 19 projects. The 116 reviewed valid seed entries contain 115 unique inputs; pinned regressions from Mermaid, Pele and Beautiful Mermaid add 12. Repeated subgraphs, arrow direction, multiline labels, route clearance, endpoint approach and line styles are included. Four invalid-input controls are excluded. [Regression sources and review intent](../corpus/drawing-regressions.json). Selection uses recurring regressions; reaction counts were unavailable and no popularity ranking is claimed.

**Better means more whole cases satisfying every required source fact.** Every binding keeps the same denominator of 127. Tables sort by verified passes, with ties sharing a position. Unknown and unrun cases are unscored gaps; their number limits comparisons. Failed facts and render/export failures remain separate.

SVG checks observe actual labels, bodies, routes, groups, quantities and required regression geometry. Terminal checks inspect the interpreted display and its owned frames/routes. A fresh PNG qualifies through exact RGBA equivalence with an independently checked live SVG screenshot, or a bounded independent OCR/frame/route observer. The latter supports closed flowchart frames and isolated connectors; other representations remain unknown. Pixel differences from an SVG witness alone establish no drawing defect.

Seven cases have incomplete common transcription or empty-drawing assessment. Generic ambiguous body-caption ownership is an assessment gap. Duplicate SVG IDs remain a diagnostic. The SVG observer has an 8-second assessment deadline; cases above 40 nodes or 80 edges remain rendered but unassessed. Output invocation is bounded at 15 seconds.

| Format | Bindings | Verified passes | Failed facts | Render/export failures | Unknown | Unrun |
|---|---:|---:|---:|---:|---:|---:|
| SVG | 16 | 683 | 221 | 169 | 959 | 0 |
| PNG | 16 | 297 | 0 | 4 | 1563 | 168 |
| Terminal text | 18 | 573 | 492 | 453 | 720 | 48 |

### SVG

| Position | Project | Version | Pass / 127 | Failed facts | Output failures | Unknown | Unrun |
|---:|---|---|---:|---:|---:|---:|---:|
| 1 | mermaid-js/mermaid | 12.2.0 | 81 | 5 | 1 | 40 | 0 |
| 2 | crabtalk/bezel | 0.2.24 | 76 | 6 | 1 | 44 | 0 |
| 2 | obsidianmd/pele | 1.13.0 | 76 | 6 | 1 | 44 | 0 |
| 4 | wevm/ondine | 0.0.3 | 74 | 6 | 1 | 46 | 0 |
| 5 | orestesgaolin/mermaid | 0.3.2 | 61 | 12 | 3 | 51 | 0 |
| 6 | Latias94/merman | 0.9.3 | 59 | 7 | 1 | 60 | 0 |
| 7 | 1jehuang/mermaid-rs-renderer | 0.3.1 | 57 | 19 | 0 | 51 | 0 |
| 8 | adewale/agentic-mermaid | 0.5.6 | 50 | 5 | 3 | 69 | 0 |
| 9 | dfadler/zombie-mermaid | 5.14.1 | 47 | 8 | 20 | 52 | 0 |
| 10 | lukilabs/beautiful-mermaid | 1.1.3 | 40 | 10 | 29 | 48 | 0 |
| 11 | crafter-station/mermaid | 0.0.3 | 35 | 24 | 30 | 38 | 0 |
| 12 | evangwt/xmermaid | 0.4.2 | 9 | 16 | 13 | 89 | 0 |
| 13 | Dicklesworthstone/frankenmermaid | 0.4.0 | 6 | 13 | 1 | 107 | 0 |
| 13 | emtyty/merslim | 0.2.3 | 6 | 27 | 14 | 80 | 0 |
| 13 | sandyyst/dsh-plugin-mermaid-gb-svg | 0.1.5 | 6 | 44 | 1 | 76 | 0 |
| 16 | KlangHaus/vitepress-plugin-diagram | 0.3.2 | 0 | 13 | 50 | 64 | 0 |

### PNG

| Position | Project | Version | Pass / 127 | Failed facts | Output failures | Unknown | Unrun |
|---:|---|---|---:|---:|---:|---:|---:|
| 1 | wevm/ondine | 0.0.3 | 63 | 0 | 0 | 63 | 1 |
| 2 | crabtalk/bezel | 0.2.24 | 58 | 0 | 0 | 68 | 1 |
| 2 | obsidianmd/pele | 1.13.0 | 58 | 0 | 0 | 68 | 1 |
| 4 | orestesgaolin/mermaid | 0.3.2 | 42 | 0 | 0 | 82 | 3 |
| 5 | mermaid-js/mermaid | 12.2.0 | 41 | 0 | 0 | 85 | 1 |
| 6 | evangwt/xmermaid | 0.4.2 | 9 | 0 | 0 | 105 | 13 |
| 6 | sandyyst/dsh-plugin-mermaid-gb-svg | 0.1.5 | 9 | 0 | 0 | 117 | 1 |
| 8 | Latias94/merman | 0.9.3 | 6 | 0 | 2 | 119 | 0 |
| 9 | adewale/agentic-mermaid | 0.5.6 | 5 | 0 | 0 | 119 | 3 |
| 10 | crafter-station/mermaid | 0.0.3 | 3 | 0 | 0 | 94 | 30 |
| 11 | Dicklesworthstone/frankenmermaid | 0.4.0 | 1 | 0 | 0 | 125 | 1 |
| 11 | dfadler/zombie-mermaid | 5.14.1 | 1 | 0 | 0 | 106 | 20 |
| 11 | lukilabs/beautiful-mermaid | 1.1.3 | 1 | 0 | 0 | 97 | 29 |
| 14 | 1jehuang/mermaid-rs-renderer | 0.3.1 | 0 | 0 | 1 | 126 | 0 |
| 14 | KlangHaus/vitepress-plugin-diagram | 0.3.2 | 0 | 0 | 0 | 77 | 50 |
| 14 | emtyty/merslim | 0.2.3 | 0 | 0 | 1 | 112 | 14 |

### Terminal text

| Position | Project | Version | Pass / 127 | Failed facts | Output failures | Unknown | Unrun |
|---:|---|---|---:|---:|---:|---:|---:|
| 1 | adewale/agentic-mermaid | 0.5.6 | 72 | 12 | 3 | 40 | 0 |
| 2 | fasouto/termaid | 0.10.0 | 69 | 35 | 0 | 23 | 0 |
| 3 | dfadler/zombie-mermaid | 5.14.1 | 60 | 11 | 20 | 36 | 0 |
| 4 | Yassimba/loom | 0.10.0 | 48 | 27 | 17 | 35 | 0 |
| 5 | AlexanderGrooff/mermaid-ascii | 1.6.1 | 47 | 25 | 43 | 12 | 0 |
| 6 | Latias94/merman | 0.9.3 | 45 | 17 | 23 | 42 | 0 |
| 6 | spacedock-dev/mermaidtext | git-a6b0c7657b94 | 45 | 37 | 0 | 45 | 0 |
| 8 | lukilabs/beautiful-mermaid | 1.1.3 | 41 | 21 | 29 | 36 | 0 |
| 9 | wevm/ondine | 0.0.3 | 34 | 29 | 1 | 63 | 0 |
| 10 | kais-radwan/ascii-mermaid | 0.1.0 | 30 | 40 | 24 | 33 | 0 |
| 11 | Mootikins/figurehead-rs | v0.4.3 | 21 | 29 | 58 | 19 | 0 |
| 12 | kitlangton/merman | 0.2.1 | 20 | 33 | 56 | 18 | 0 |
| 13 | emtyty/merslim | 0.2.3 | 18 | 50 | 13 | 46 | 0 |
| 14 | anomalyco/opencode | 2.2.5 | 12 | 27 | 26 | 14 | 48 |
| 15 | tariqshams/mermaidtui | 0.0.6 | 6 | 5 | 114 | 2 | 0 |
| 16 | crafter-station/mermaid | 0.0.3 | 5 | 56 | 25 | 41 | 0 |
| 17 | Dicklesworthstone/frankenmermaid | 0.4.0 | 0 | 1 | 1 | 125 | 0 |
| 17 | xai-org/grok-build | git-2bdd1d6a6369 | 0 | 37 | 0 | 90 | 0 |

OpenCode’s terminal worker stopped; 48 cases remain unrun after the affected regression cases were collected separately. Shared SVG-to-PNG paths require a successful SVG render; 168 PNG cases remain unrun at that prerequisite. Native PNG bindings were invoked independently on the two cases where their SVG call failed. Flutter remains an isolated setup blocker: its native release bundle was unavailable. No Flutter SDK setup was retried.

[Numeric drawing results and case outcomes](../results/drawing-correctness-2026-11-02.json). These are bounded correctness observations. In particular, zero proven PNG fact failures accompanies extensive unassessed PNG coverage.

## Mermaid Fidelity

Suite pin: [`1fb7869866dd619168d840291c9c54b4f129758b`](https://github.com/mermaid-js/mermaid/tree/1fb7869866dd619168d840291c9c54b4f129758b), with native Mermaid **12.2.0** as control. The inventory contains **368 files and 3,995 static declarations**. Vitest attempted all **316 core-package files**, expanding original loops and parameter tables to **5,445 callbacks**. Twenty-five selected files did not expand; another 52 files are explicitly outside this core runner, including browser/application suites. Static declarations are not treated as expanded test counts.

Original bodies, inputs and assertions execute unchanged; production imports are redirected to real candidate parsers and native model views. Mermaid does no candidate parsing. Missing getters, host behavior and unbound imports cannot earn a pass through a caught negative assertion. Duplicate parameter titles retain distinct task indexes. Setup parsing supplies no test credit.

**Better means more qualified original tests passed on the same population.** The control qualifies **2,894 callbacks**. Another **2,408 are reference-unqualified** and **143 are upstream-skipped**; these counts apply equally to every participant. The table is ordered by observed qualified passes. Adapter gaps prevent a complete whole-suite score.

| Project | Version | Qualified passes / 2,894 | Assertion nonpasses | Native unsupported | Trident adapter gaps |
|---|---|---:|---:|---:|---:|
| mermaid-js/mermaid | 12.2.0 | 2894 | 0 | 0 | 0 |
| obsidianmd/pele | 1.13.0 | 1772 | 49 | 0 | 1073 |
| adewale/agentic-mermaid | 0.5.6 | 999 | 596 | 197 | 1102 |
| lukilabs/beautiful-mermaid | 1.1.3 | 105 | 1544 | 0 | 1245 |

Mermaid is the reference row. Assertion nonpasses are observed through schema adapters and require implementation/adapter triage; they are not diagnoses of drawing defects. The other **23 projects have explicit native adapter/artifact gaps**, including Zombie’s unavailable installed parser/database binding. They receive no zero score. Per-file outcomes, unexpanded files, outside-runner files and all blocked project names are in the [numeric Fidelity results](../results/mermaid-fidelity-2026-11-02.json).

The full captures were reused after fixes. Only five affected original test files were recollected; ambiguous earlier setup/host observations were conservatively withheld. No tests or expected answers were rewritten to increase pass counts.

## Run and validate

Commands are `bun commands.ts drawing:correctness --help` and `bun commands.ts mermaid:fidelity --help`. Drawing requires Chromium; its optional independent raster observer uses Python, [pinned NumPy/Pillow dependencies](../fidelity/drawing/requirements.txt) and Tesseract. A missing raster dependency yields an assessment gap. Fidelity takes a clean pinned Mermaid checkout, the installed Mermaid 12.2.0 reference, and a runtime directory containing Vitest 3.2.4 and jsdom 26.1.0. Installed public artifacts and the frozen catalog are reused.

Validation: 26 affected tests pass, including independently authored positive drawings, missing/wrong labels, missing/reversed/wrong-headed connectors, unrelated raster ink, alpha changes, HTML-label PNG export, source-gap handling, parameter-case identity and CLI policy. Typecheck, focused lint and Python syntax checks pass. CI installs the raster fixture dependencies.

The remaining benchmark work is concrete: qualify missing source/empty-drawing profiles and more SVG/PNG representations; bind native operations for the remaining Fidelity candidates; expand the 25 uncollected files and the 52 outside-runner files. Existing [DaveBench results](benchmark-campaign-results-2026-11-02.md) remain unchanged. Equal-weight overall scoring stays withheld while these gaps prevent complete scores.
