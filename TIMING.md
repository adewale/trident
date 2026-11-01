# Qualified rendering time

Fresh paired runs use frozen artifacts and fixed source selections. Every clocked output must pass its current correctness contract, and the Mermaid or Mermaid ASCII A/A controls must qualify. Lower ratios are faster. Separate paired runs share a baseline and workload; their control distributions and intervals remain separate. Overlapping uncertainty intervals do not establish a speed winner. Initialization boundaries differ by format; compare rows within a format only.

The current selection per project is shown below. All earlier selection events and failed captures remain in `timing/execution.json`.

## SVG: six documentation examples

Corpus: unchanged Mermaid syntax-documentation examples at `1fb7869866dd619168d840291c9c54b4f129758b`. SVG uses the fixed six-family selection; PNG uses solid, dotted and thick flowchart edges. These exposed subsets supply scoped first-use comparisons, with no usage-frequency claim.

Projects are stack-ranked by normalized ratio, including the control at 1.000. Control durations belong to each pair; no pooled control time is invented. The complete two-project rankings follow below.

| Rank | Project | Candidate workload (ms) | Paired control workload (ms) | Ratio to control | Ratio interval | Checked pair returns | Evidence |
|---:|---|---:|---:|---:|---|---:|---|
| 1 | Ondine | 125.055 | 1458.244 | 0.085 | 0.069–0.101 | 108/108 | [bundle](evidence/5/timing-bundle-61c17619018ebfe1fd24cfd3.json) |
| 2 | Bezel | 229.577 | 1434.368 | 0.160 | 0.144–0.193 | 108/108 | [bundle](evidence/7/timing-bundle-faef08653bc195e68bbc8c90.json) |
| 3 | Mermaid | pair-specific | pair-specific | 1.000 | reference | see pairs | see pairs |

**Ondine versus Mermaid**

| Rank | Project | Median workload (ms) | Ratio |
|---:|---|---:|---:|
| 1 | Ondine | 125.055 | 0.085 |
| 2 | Mermaid | 1458.244 | 1.000 |

Clock: Host page.evaluate request through returned SVG string, including RPC serialization, shared public adapter and render cleanup; package initialization/import, browser/context startup and correctness grading excluded

Measured: 2026-11-01T16:13:39.825Z to 2026-11-01T16:15:57.281Z.


**Bezel versus Mermaid**

| Rank | Project | Median workload (ms) | Ratio |
|---:|---|---:|---:|
| 1 | Bezel | 229.577 | 0.160 |
| 2 | Mermaid | 1434.368 | 1.000 |

Clock: Host page.evaluate request through returned SVG string, including RPC serialization, shared public adapter and render cleanup; package initialization/import, browser/context startup and correctness grading excluded

Measured: 2026-11-01T16:23:00.073Z to 2026-11-01T16:25:44.614Z.


| Unranked project | Status | Reason |
|---|---|---|
| Agentic Mermaid | unqualified | Fresh correctness does not pass all six fixed documentation cases; no timing calls. |
| ASCII Mermaid | not-applicable | No declared SVG output in the eligible project configuration. |
| Beautiful Mermaid | unqualified | Fresh correctness does not pass all six fixed documentation cases; no timing calls. |
| Crafter Mermaid | unqualified | Fresh correctness does not pass all six fixed documentation cases; no timing calls. |
| DSH Mermaid GB SVG | unqualified | Fresh correctness does not pass all six fixed documentation cases; no timing calls. |
| Figurehead | not-applicable | No declared SVG output in the eligible project configuration. |
| Frankenmermaid | unqualified | Fresh correctness does not pass all six fixed documentation cases; no timing calls. |
| Grok renderer | not-applicable | No declared SVG output in the eligible project configuration. |
| Kitlangton Merman | not-applicable | No declared SVG output in the eligible project configuration. |
| Latias Merman | unqualified | Fresh correctness does not pass all six fixed documentation cases; no timing calls. |
| Loom renderer | not-applicable | No declared SVG output in the eligible project configuration. |
| Mermaid ASCII | not-applicable | No declared SVG output in the eligible project configuration. |
| Mermaid Dart | unqualified | Fresh correctness does not pass all six fixed documentation cases; no timing calls. |
| Mermaid Flutter | not-applicable | No declared SVG output in the eligible project configuration. |
| Mermaid RS Renderer | unavailable | No frozen browser SVG timing binding; unlike CLI/native boundaries are separate. |
| MermaidText | not-applicable | No declared SVG output in the eligible project configuration. |
| MermaidTUI | not-applicable | No declared SVG output in the eligible project configuration. |
| Merslim | unqualified | Fresh correctness does not pass all six fixed documentation cases; no timing calls. |
| OpenCode Merman | not-applicable | No declared SVG output in the eligible project configuration. |
| Pele | unqualified | Observed A/A control spread exceeds the declared noise ceiling |
| Termaid | not-applicable | No declared SVG output in the eligible project configuration. |
| VitePress Plugin Diagram | unqualified | Fresh correctness does not pass all six fixed documentation cases; no timing calls. |
| XMermaid | unqualified | Fresh correctness does not pass all six fixed documentation cases; no timing calls. |
| Zombie Mermaid | unqualified | Fresh correctness does not pass all six fixed documentation cases; no timing calls. |

The current selection per project is shown below. All earlier selection events and failed captures remain in `timing/execution.json`.

## Terminal: six project examples

Corpus: six unchanged cases selected from the 120-input active terminal corpus, retaining the original repository/commit/file provenance. Mermaid ASCII is the terminal speed reference; Mermaid remains the unscored syntax reference. Selection is the previously declared six-case flowchart/ER/sequence workload.

No pair qualified; no speed ranking is published.


| Unranked project | Status | Reason |
|---|---|---|
| Agentic Mermaid | unavailable | No binding for this timing driver’s default-argument stdin CLI boundary; warm APIs and configured CLIs are not mixed. |
| ASCII Mermaid | unavailable | No binding for this timing driver’s default-argument stdin CLI boundary; warm APIs and configured CLIs are not mixed. |
| Beautiful Mermaid | unavailable | No binding for this timing driver’s default-argument stdin CLI boundary; warm APIs and configured CLIs are not mixed. |
| Crafter Mermaid | unavailable | No binding for this timing driver’s default-argument stdin CLI boundary; warm APIs and configured CLIs are not mixed. |
| Figurehead | unavailable | No binding for this timing driver’s default-argument stdin CLI boundary; warm APIs and configured CLIs are not mixed. |
| Frankenmermaid | unavailable | No binding for this timing driver’s default-argument stdin CLI boundary; warm APIs and configured CLIs are not mixed. |
| Grok renderer | unqualified | Fresh actual CLI prerequisites do not pass the full fixed six-case workload; no timing calls. |
| Kitlangton Merman | unavailable | No binding for this timing driver’s default-argument stdin CLI boundary; warm APIs and configured CLIs are not mixed. |
| Latias Merman | unavailable | No binding for this timing driver’s default-argument stdin CLI boundary; warm APIs and configured CLIs are not mixed. |
| Loom renderer | unavailable | No binding for this timing driver’s default-argument stdin CLI boundary; warm APIs and configured CLIs are not mixed. |
| MermaidText | unqualified | Fresh actual CLI prerequisites do not pass the full fixed six-case workload; no timing calls. |
| MermaidTUI | unavailable | No binding for this timing driver’s default-argument stdin CLI boundary; warm APIs and configured CLIs are not mixed. |
| Merslim | unavailable | No binding for this timing driver’s default-argument stdin CLI boundary; warm APIs and configured CLIs are not mixed. |
| Ondine | unavailable | No binding for this timing driver’s default-argument stdin CLI boundary; warm APIs and configured CLIs are not mixed. |
| OpenCode Merman | unavailable | No binding for this timing driver’s default-argument stdin CLI boundary; warm APIs and configured CLIs are not mixed. |
| Termaid | unqualified | Observed A/A control spread exceeds the declared noise ceiling |
| Zombie Mermaid | unavailable | No binding for this timing driver’s default-argument stdin CLI boundary; warm APIs and configured CLIs are not mixed. |

The current selection per project is shown below. All earlier selection events and failed captures remain in `timing/execution.json`.

## PNG: three documentation examples

Corpus: unchanged Mermaid syntax-documentation examples at `1fb7869866dd619168d840291c9c54b4f129758b`. SVG uses the fixed six-family selection; PNG uses solid, dotted and thick flowchart edges. These exposed subsets supply scoped first-use comparisons, with no usage-frequency claim.

No pair qualified; no speed ranking is published.


| Unranked project | Status | Reason |
|---|---|---|
| Agentic Mermaid | unavailable | No supported cold PNG export timing driver for this binding; coverage PNG clocks remain descriptive. |
| Beautiful Mermaid | unavailable | No supported cold PNG export timing driver for this binding; coverage PNG clocks remain descriptive. |
| Bezel | unavailable | No supported cold PNG export timing driver for this binding; coverage PNG clocks remain descriptive. |
| Crafter Mermaid | unavailable | No supported cold PNG export timing driver for this binding; coverage PNG clocks remain descriptive. |
| DSH Mermaid GB SVG | unavailable | No supported cold PNG export timing driver for this binding; coverage PNG clocks remain descriptive. |
| Frankenmermaid | unavailable | No supported cold PNG export timing driver for this binding; coverage PNG clocks remain descriptive. |
| Latias Merman | unavailable | No supported cold PNG export timing driver for this binding; coverage PNG clocks remain descriptive. |
| Mermaid Dart | unavailable | No supported cold PNG export timing driver for this binding; coverage PNG clocks remain descriptive. |
| Mermaid Flutter | unqualified | Observed A/A control spread exceeds the declared noise ceiling |
| Mermaid RS Renderer | unavailable | No supported cold PNG export timing driver for this binding; coverage PNG clocks remain descriptive. |
| Merslim | unavailable | No supported cold PNG export timing driver for this binding; coverage PNG clocks remain descriptive. |
| Ondine | unavailable | No supported cold PNG export timing driver for this binding; coverage PNG clocks remain descriptive. |
| Pele | unavailable | No supported cold PNG export timing driver for this binding; coverage PNG clocks remain descriptive. |
| VitePress Plugin Diagram | unavailable | No supported cold PNG export timing driver for this binding; coverage PNG clocks remain descriptive. |
| XMermaid | unavailable | No supported cold PNG export timing driver for this binding; coverage PNG clocks remain descriptive. |
| Zombie Mermaid | unavailable | No supported cold PNG export timing driver for this binding; coverage PNG clocks remain descriptive. |

