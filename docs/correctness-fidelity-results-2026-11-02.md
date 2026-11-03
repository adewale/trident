# Drawing Correctness and Mermaid Fidelity — 2 November 2026

Both collectors are implemented and have been run. Drawing Correctness covers 26 available projects and 50 output bindings. Fidelity has measured original pinned Vitest outcomes for 13 candidates plus Mermaid. Assessment and adapter gaps remain substantial, so these results do not establish an overall winner.

Versions reuse the existing campaign freeze at `2026-11-02T15:09:38.022Z`. Follow-up repairs were collected through 3 November 2026. DaveBench timings were not repeated. Functional controls preceded affected-only source, raster-witness, SVG coordinator and worker-recovery collection. Numeric results contain counts and case/file accounting, without rendered outputs.

## Drawing Correctness

The shared corpus has **127 unique inputs**, covering 20 families with sources from 19 projects. The 116 reviewed valid seed entries contain 115 unique inputs; pinned regressions from Mermaid, Pele and Beautiful Mermaid add 12. Repeated subgraphs, arrow direction, multiline labels, route clearance, endpoint approach and line styles are included. Four invalid-input controls are excluded. [Regression sources and review intent](../corpus/drawing-regressions.json). Selection uses recurring regressions; reaction counts were unavailable and no popularity ranking is claimed.

**Better means more whole cases satisfying every required source fact.** Every binding keeps the same denominator of 127. Tables sort by verified passes, with ties sharing a position. Unknown and unrun cases are unscored gaps; their number limits comparisons. Failed facts and render/export failures remain separate.

SVG checks observe actual labels, bodies, routes, groups, quantities and required regression geometry. Terminal checks inspect the interpreted display and its owned frames/routes. A fresh PNG qualifies through exact RGBA equivalence with an independently checked live SVG screenshot, or a bounded independent OCR/frame/route observer. The latter supports closed flowchart frames and isolated connectors; other representations remain unknown. Pixel differences from an SVG witness alone establish no drawing defect.

All common source transcriptions now qualify against the independently reviewed contracts, including the seven repaired cases. Empty drawings have dedicated pixel checks. The full existing SVG observer now supplies its physical compound-node rebinding pass. PNG witnesses are assessed after export normalization, and an exact witness can prove either correctness or a failed required fact. Generic ambiguous body-caption ownership remains an assessment gap; duplicate SVG IDs remain diagnostic. The SVG assessment deadline is 8 seconds, with bounds of 40 nodes or 80 edges. CLI/browser invocation is bounded at 15 seconds; the terminal and raster workers use 20-second bounds.

| Format | Bindings | Verified passes | Failed facts | Render/export failures | Unknown | Unrun |
|---|---:|---:|---:|---:|---:|---:|
| SVG | 16 | 744 | 241 | 169 | 878 | 0 |
| PNG | 16 | 488 | 126 | 172 | 1246 | 0 |
| Terminal text | 18 | 584 | 499 | 473 | 730 | 0 |

### SVG

| Position | Project | Pass / 127 | Failed facts | Output failures | Unknown | Unrun |
|---:|---|---:|---:|---:|---:|---:|
| 1 | mermaid-js/mermaid 12.2.0 | 89 | 5 | 1 | 32 | 0 |
| 2 | crabtalk/bezel 0.2.24 | 84 | 6 | 1 | 36 | 0 |
| 2 | obsidianmd/pele 1.13.0 | 84 | 6 | 1 | 36 | 0 |
| 4 | wevm/ondine 0.0.3 | 82 | 6 | 1 | 38 | 0 |
| 5 | Latias94/merman 0.9.3 | 63 | 7 | 1 | 56 | 0 |
| 5 | orestesgaolin/mermaid 0.3.2 | 63 | 12 | 3 | 49 | 0 |
| 7 | 1jehuang/mermaid-rs-renderer 0.3.1 | 60 | 23 | 0 | 44 | 0 |
| 8 | adewale/agentic-mermaid 0.5.6 | 52 | 5 | 3 | 67 | 0 |
| 9 | dfadler/zombie-mermaid 5.14.1 | 47 | 9 | 20 | 51 | 0 |
| 10 | lukilabs/beautiful-mermaid 1.1.3 | 40 | 11 | 29 | 47 | 0 |
| 11 | crafter-station/mermaid 0.0.3 | 35 | 27 | 30 | 35 | 0 |
| 12 | sandyyst/dsh-plugin-mermaid-gb-svg 0.1.5 | 23 | 50 | 1 | 53 | 0 |
| 13 | evangwt/xmermaid 0.4.2 | 9 | 16 | 13 | 89 | 0 |
| 14 | Dicklesworthstone/frankenmermaid 0.4.0 | 7 | 13 | 1 | 106 | 0 |
| 15 | emtyty/merslim 0.2.3 | 6 | 32 | 14 | 75 | 0 |
| 16 | KlangHaus/vitepress-plugin-diagram 0.3.2 | 0 | 13 | 50 | 64 | 0 |

### PNG

| Position | Project | Pass / 127 | Failed facts | Output failures | Unknown | Unrun |
|---:|---|---:|---:|---:|---:|---:|
| 1 | wevm/ondine 0.0.3 | 69 | 4 | 1 | 53 | 0 |
| 2 | crabtalk/bezel 0.2.24 | 63 | 3 | 1 | 60 | 0 |
| 2 | obsidianmd/pele 1.13.0 | 63 | 3 | 1 | 60 | 0 |
| 4 | mermaid-js/mermaid 12.2.0 | 51 | 1 | 1 | 74 | 0 |
| 5 | orestesgaolin/mermaid 0.3.2 | 48 | 9 | 3 | 67 | 0 |
| 6 | adewale/agentic-mermaid 0.5.6 | 45 | 1 | 3 | 78 | 0 |
| 7 | dfadler/zombie-mermaid 5.14.1 | 41 | 8 | 20 | 58 | 0 |
| 8 | lukilabs/beautiful-mermaid 1.1.3 | 38 | 6 | 29 | 54 | 0 |
| 9 | crafter-station/mermaid 0.0.3 | 29 | 22 | 30 | 46 | 0 |
| 10 | sandyyst/dsh-plugin-mermaid-gb-svg 0.1.5 | 22 | 47 | 1 | 57 | 0 |
| 11 | evangwt/xmermaid 0.4.2 | 9 | 7 | 13 | 98 | 0 |
| 12 | Latias94/merman 0.9.3 | 7 | 0 | 2 | 118 | 0 |
| 13 | Dicklesworthstone/frankenmermaid 0.4.0 | 3 | 6 | 1 | 117 | 0 |
| 14 | 1jehuang/mermaid-rs-renderer 0.3.1 | 0 | 0 | 1 | 126 | 0 |
| 14 | KlangHaus/vitepress-plugin-diagram 0.3.2 | 0 | 9 | 50 | 68 | 0 |
| 14 | emtyty/merslim 0.2.3 | 0 | 0 | 15 | 112 | 0 |

### Terminal text

| Position | Project | Pass / 127 | Failed facts | Output failures | Unknown | Unrun |
|---:|---|---:|---:|---:|---:|---:|
| 1 | adewale/agentic-mermaid 0.5.6 | 72 | 12 | 3 | 40 | 0 |
| 2 | fasouto/termaid 0.10.0 | 69 | 35 | 0 | 23 | 0 |
| 3 | dfadler/zombie-mermaid 5.14.1 | 60 | 11 | 20 | 36 | 0 |
| 4 | Yassimba/loom 0.10.0 | 48 | 27 | 17 | 35 | 0 |
| 5 | AlexanderGrooff/mermaid-ascii 1.6.1 | 47 | 25 | 43 | 12 | 0 |
| 6 | Latias94/merman 0.9.3 | 45 | 17 | 23 | 42 | 0 |
| 6 | spacedock-dev/mermaidtext git-a6b0c7657b94 | 45 | 37 | 0 | 45 | 0 |
| 8 | lukilabs/beautiful-mermaid 1.1.3 | 41 | 21 | 29 | 36 | 0 |
| 9 | wevm/ondine 0.0.3 | 34 | 29 | 1 | 63 | 0 |
| 10 | kais-radwan/ascii-mermaid 0.1.0 | 30 | 40 | 24 | 33 | 0 |
| 11 | anomalyco/opencode 2.2.5 | 23 | 34 | 46 | 24 | 0 |
| 12 | Mootikins/figurehead-rs v0.4.3 | 21 | 29 | 58 | 19 | 0 |
| 13 | kitlangton/merman 0.2.1 | 20 | 33 | 56 | 18 | 0 |
| 14 | emtyty/merslim 0.2.3 | 18 | 50 | 13 | 46 | 0 |
| 15 | tariqshams/mermaidtui 0.0.6 | 6 | 5 | 114 | 2 | 0 |
| 16 | crafter-station/mermaid 0.0.3 | 5 | 56 | 25 | 41 | 0 |
| 17 | Dicklesworthstone/frankenmermaid 0.4.0 | 0 | 1 | 1 | 125 | 0 |
| 17 | xai-org/grok-build git-2bdd1d6a6369 | 0 | 37 | 0 | 90 | 0 |

All 6,350 available case/format slots are accounted for, with zero unrun rows. OpenCode's remaining 48 terminal inputs were invoked with worker recovery; its original timed-out input was not retried. Thirteen previously skipped independent Merslim PNG calls were invoked. For 154 other PNG rows, frozen bindings confirm a shared SVG-to-PNG workflow with no independent PNG API: the actual failed SVG stage establishes a workflow failure, rather than an unrun PNG call. Native PNG bindings remain independent. Flutter's unavailable native bundle remains an isolated setup blocker; no SDK setup was retried.

A shared flowchart-group discovery bug is also repaired. External stems and markers are distinguished from physical node artwork, and a bounded source-qualified endpoint-contact rule preserves legitimate ports without allowing opaque covers. Independent missing/reversed/detached arrows, oversized carriers and hidden-contour controls remain negative or unassessed. Only the 62 eligible multi-node flowcharts for each of the two affected projects were recollected. DSH Mermaid GB SVG 0.1.5 now has 23 SVG and 22 PNG passes; VitePress Plugin Diagram 0.3.2 remains unqualified on its unresolved representations.

[Numeric drawing results and case outcomes](../results/drawing-correctness-2026-11-02.json). Remaining unknowns concern representation/assessment support, including unqualified SVG body/route ownership, nonmatching native rasterization, and cardinality observations. Completing invocations has not made these unassessed drawings correct or incorrect.

## Mermaid Fidelity

Suite pin: [`1fb7869866dd619168d840291c9c54b4f129758b`](https://github.com/mermaid-js/mermaid/tree/1fb7869866dd619168d840291c9c54b4f129758b), with native Mermaid **12.2.0** as control. The inventory contains **368 files and 3,995 static declarations**. Vitest attempted all **316 core-package files**, expanding original loops and parameter tables to **5,445 callbacks**. Twenty-five selected files did not expand; another 52 files are explicitly outside this core runner, including browser/application suites. Static declarations are not treated as expanded test counts.

Original bodies, inputs and assertions execute unchanged; production imports are redirected to real candidate parsers and native model views. Mermaid does no candidate parsing. Missing getters, host behavior and unbound imports cannot earn a pass through a caught negative assertion. Duplicate parameter titles retain distinct task indexes. Setup parsing supplies no test credit.

**Better means more qualified original tests passed on the same population.** The control qualifies **2,894 callbacks**. Another **2,408 are reference-unqualified** and **143 are upstream-skipped**; these counts apply equally to every participant. The table is ordered by observed qualified passes. Adapter gaps prevent a complete whole-suite score.

| Project | Qualified passes / 2,894 | Assertion nonpasses | Native unsupported | Trident adapter gaps |
|---|---:|---:|---:|---:|
| mermaid-js/mermaid 12.2.0 | 2894 | 0 | 0 | 0 |
| obsidianmd/pele 1.13.0 | 2157 | 127 | 0 | 610 |
| adewale/agentic-mermaid 0.5.6 | 1186 | 423 | 197 | 1088 |
| Dicklesworthstone/frankenmermaid 0.4.0 | 308 | 368 | 0 | 2218 |
| dfadler/zombie-mermaid 5.14.1 | 236 | 526 | 0 | 2132 |
| kais-radwan/ascii-mermaid 0.1.0 | 174 | 1415 | 0 | 1305 |
| lukilabs/beautiful-mermaid 1.1.3 | 133 | 1536 | 0 | 1225 |
| emtyty/merslim 0.2.3 | 113 | 960 | 1 | 1820 |
| sandyyst/dsh-plugin-mermaid-gb-svg 0.1.5 | 113 | 583 | 0 | 2198 |
| KlangHaus/vitepress-plugin-diagram 0.3.2 | 67 | 922 | 0 | 1905 |
| anomalyco/opencode 2.2.5 | 23 | 900 | 0 | 1971 |
| kitlangton/merman 0.2.1 | 22 | 99 | 1992 | 781 |
| evangwt/xmermaid 0.4.2 | 16 | 804 | 0 | 2074 |
| tariqshams/mermaidtui 0.0.6 | 0 | 2 | 829 | 2063 |

Mermaid is the reference row. Assertion nonpasses are observed through schema adapters and require implementation/adapter triage; they are not diagnoses of drawing defects. The remaining **13 projects have no collected original-test operation binding** and receive no zero score. Ten previously excluded projects now have genuine parser results. Zombie’s bundled parser was present despite the missing source file; the earlier artifact-level block was wrong. Async and Bun-only parsers use a guarded Bun subprocess bridge, and Frankenmermaid uses its installed WASM parser. Native observations are preserved; transport, schema and missing-method failures remain adapter gaps. The prepared Latias 0.9.2 JS module was not used because the frozen native version is 0.9.3. Per-file outcomes, unexpanded files, outside-runner files and all blocked project names are in the [numeric Fidelity results](../results/mermaid-fidelity-2026-11-02.json).

The original full captures and earlier five-file repair were reused. A further **43 affected original files** were recollected across 14 participants after functional checks. Existing participants retain all unaffected observations. Newly admitted projects have measurements for those files; other original callbacks remain explicitly unassessed. Beautiful Mermaid’s class/sequence/ER argument shapes are corrected, native getter views are extended, and proven unmapped formatter calls remain gaps. No test bodies or expected answers were rewritten.

## Run and validate

Commands are `bun commands.ts drawing:correctness --help` and `bun commands.ts mermaid:fidelity --help`. Drawing requires Chromium; its optional independent raster observer uses Python, [pinned NumPy/Pillow dependencies](../fidelity/drawing/requirements.txt) and Tesseract. A missing raster dependency yields an assessment gap. Fidelity takes a clean pinned Mermaid checkout, the installed Mermaid 12.2.0 reference, and a runtime directory containing Vitest 3.2.4 and jsdom 26.1.0. Installed public artifacts and the frozen catalog are reused.

Validation: affected drawing, graph-observer, native-parser transport/schema, original-suite accounting and reporting tests pass, including independently authored positive drawings, missing/wrong labels, missing/reversed/wrong-headed connectors, unrelated raster ink, alpha changes, HTML-label PNG export, source-gap handling, parameter-case identity and CLI policy. Typecheck, focused lint and Python syntax checks pass. CI installs the raster fixture dependencies.

The remaining benchmark work is concrete: qualify missing source/empty-drawing profiles and more SVG/PNG representations; bind native operations for the remaining Fidelity candidates; expand the 25 uncollected files and the 52 outside-runner files. Existing [DaveBench results](benchmark-campaign-results-2026-11-02.md) remain unchanged. The [equal-weight synthesis](../RESULTS.md#equal-weight-synthesis) combines current score bounds; exact overall scores remain unavailable while these gaps persist.
