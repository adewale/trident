# DaveBench source expectations

The corpus contains all **548 occurrences (546 distinct diagrams)** from Mermaid's syntax documentation at [`1fb7869866dd619168d840291c9c54b4f129758b`](https://github.com/mermaid-js/mermaid/tree/1fb7869866dd619168d840291c9c54b4f129758b/packages/mermaid/src/docs/syntax). The 34 syntax pages yield 36 normalized diagram families: the examples page mixes families, and railroad's four dialects remain distinct. Duplicate fences keep their own source locations and acceptance denominator. The frozen literal inputs are in `corpus/docs-source-inventory.json.gz`; `corpus/docs-reviewed.json` binds each contract to the exact source SHA-256. Upstream's MIT license is retained in `corpus/docs-assets/MERMAID-LICENSE`.

Expectations come from an independent literal-source transcriber, not SVGs, candidate parsers or agreement with Mermaid's rendering. Each family records domain facts: topology and markers, hierarchy and grouping, ordered messages or tasks, exact quantities and axes, grammar trees, styles, visibility, metadata and authored configuration. Unknown constructs remain named per source and receive no accuracy credit. A complete transcription does not mean that Trident has a qualified observer for every fact: the SVG/PNG proof must verify every listed obligation against the actual retained output. Unsupported observers leave accuracy unknown.

Regenerate with `bun scripts/review-docs-sources.ts /path/to/pinned/mermaid-source`. Use `--check` to verify that committed source and expectations match those Git objects. The command reads source only; it does not render or benchmark anything. Independent reviewers sampled all 36 family handlers and reviewed the dialect adapters, grammar and ZenUML contracts more deeply; structural invariants cover every occurrence. This is not a manual sign-off of all 548 individual sources or output qualification. Source-specific mutation and regression controls live in `tests/docs-source-review.test.ts`.

| Family | Occurrences | Transcribed drawing contracts | Pending source facts | Configuration only |
|---|---:|---:|---:|---:|
| agentflow | 12 | 12 | 0 | 0 |
| architecture | 6 | 6 | 0 | 0 |
| block | 30 | 29 | 1 | 0 |
| c4 | 6 | 6 | 0 | 0 |
| class | 38 | 38 | 0 | 0 |
| cynefin | 3 | 3 | 0 | 0 |
| er | 25 | 25 | 0 | 0 |
| eventmodeling | 13 | 13 | 0 | 0 |
| flowchart | 116 | 115 | 1 | 0 |
| gantt | 11 | 9 | 1 | 1 |
| gitgraph | 36 | 36 | 0 | 0 |
| ishikawa | 1 | 1 | 0 | 0 |
| journey | 1 | 1 | 0 | 0 |
| kanban | 3 | 3 | 0 | 0 |
| mindmap | 15 | 15 | 0 | 0 |
| packet | 4 | 4 | 0 | 0 |
| pie | 4 | 4 | 0 | 0 |
| quadrant | 3 | 3 | 0 | 0 |
| radar | 3 | 3 | 0 | 0 |
| railroad | 1 | 1 | 0 | 0 |
| railroad-abnf | 2 | 2 | 0 | 0 |
| railroad-ebnf | 9 | 9 | 0 | 0 |
| railroad-peg | 2 | 2 | 0 | 0 |
| requirement | 9 | 9 | 0 | 0 |
| sankey | 8 | 8 | 0 | 0 |
| sequence | 42 | 42 | 0 | 0 |
| state | 22 | 22 | 0 | 0 |
| swimlane | 13 | 13 | 0 | 0 |
| timeline | 14 | 14 | 0 | 0 |
| treemap | 8 | 8 | 0 | 0 |
| treeview | 13 | 13 | 0 | 0 |
| usecase | 24 | 24 | 0 | 0 |
| venn | 8 | 8 | 0 | 0 |
| wardley | 19 | 19 | 0 | 0 |
| xychart | 8 | 8 | 0 | 0 |
| zenuml | 16 | 16 | 0 | 0 |

## Pending source interpretation

- **packages/mermaid/src/docs/syntax/block.md:488**: Style declaration has no property/value separator: fill#969
- **packages/mermaid/src/docs/syntax/flowchart.md:844**: Style declaration has no property/value separator: 5
- **packages/mermaid/src/docs/syntax/gantt.md:519**: Frontmatter syntax requires review: YAMLParseError: Missing closing "quote at line 12, column 73:              text[id^=workaround] { fill: red; y: 100%; font-size: 15px;}                                                                         ^ 

## Resource prerequisite

The documentation's `https://mermaid.js.org/favicon.svg` reference is frozen from the same source pin in `corpus/docs-assets.json`, with bytes and license hashes. Rendering must route this exact URL to those bytes before timing. Icon packs and authored font requirements remain explicit source facts; a missing required resource is a setup gap, not a renderer defect. Navigation links and callbacks are outside this static drawing task and are listed separately in each contract.
