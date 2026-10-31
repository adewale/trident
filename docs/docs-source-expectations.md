# DaveBench source expectations

The corpus contains all **548 occurrences (546 distinct diagrams)** from Mermaid's syntax documentation at [`1fb7869866dd619168d840291c9c54b4f129758b`](https://github.com/mermaid-js/mermaid/tree/1fb7869866dd619168d840291c9c54b4f129758b/packages/mermaid/src/docs/syntax). The 34 syntax pages yield 36 normalized diagram families: the examples page mixes families, and railroad's four dialects remain distinct. Duplicate fences keep their own source locations and acceptance denominator. The frozen literal inputs are in `corpus/docs-source-inventory.json.gz`; `corpus/docs-reviewed.json` binds each contract to the exact source SHA-256. Upstream's MIT license is retained in `corpus/docs-assets/MERMAID-LICENSE`.

Expectations come from an independent literal-source transcriber, not SVGs, candidate parsers or agreement with Mermaid's rendering. Each family records domain facts: topology and markers, hierarchy and grouping, ordered messages or tasks, chart proportions, printed quantities and axes, grammar trees, styles, visibility, metadata and authored configuration. Unknown constructs remain named per source and receive no accuracy credit. A complete transcription does not mean that Trident has a qualified observer for every fact: the SVG/PNG proof must verify every listed obligation against the actual retained output. Unsupported observers leave accuracy unknown. Visual contracts compare ratios when absolute values are not printed; printed values remain separate obligations. The raw source keeps every literal quantity, and visualProjections records each declared interpretation. Agentflow metadata outside the documented visual-key set remains exact advisory provenance for static drawings; the complete original native contract is separately retained as profileExpected for API/profile checks.

Regenerate with `bun scripts/review-docs-sources.ts /path/to/pinned/mermaid-source`. Use `--check` to verify that committed source and expectations match those Git objects. The command reads source only; it does not render or benchmark anything. The source-audit ledgers in `qualification/source-audits` record all 548 literal-source reviews, the exact reviewed hashes, findings and reviewer independence limits. Sequence began as an author self-audit; flowcharts and the remaining families received separate readers. Structural invariants cover every occurrence. Source review is not output qualification. Source-specific mutation and regression controls live in `tests/docs-source-review.test.ts`.

| Family | Occurrences | Transcribed drawing contracts | Pending source facts | Configuration only | Invalid source controls |
|---|---:|---:|---:|---:|---:|
| agentflow | 12 | 12 | 0 | 0 | 0 |
| architecture | 6 | 6 | 0 | 0 | 0 |
| block | 30 | 30 | 0 | 0 | 0 |
| c4 | 6 | 6 | 0 | 0 | 0 |
| class | 38 | 38 | 0 | 0 | 0 |
| cynefin | 3 | 3 | 0 | 0 | 0 |
| er | 25 | 25 | 0 | 0 | 0 |
| eventmodeling | 13 | 13 | 0 | 0 | 0 |
| flowchart | 116 | 116 | 0 | 0 | 0 |
| gantt | 11 | 10 | 0 | 1 | 0 |
| gitgraph | 36 | 36 | 0 | 0 | 0 |
| ishikawa | 1 | 1 | 0 | 0 | 0 |
| journey | 1 | 1 | 0 | 0 | 0 |
| kanban | 3 | 2 | 0 | 0 | 1 |
| mindmap | 15 | 15 | 0 | 0 | 0 |
| packet | 4 | 4 | 0 | 0 | 0 |
| pie | 4 | 4 | 0 | 0 | 0 |
| quadrant | 3 | 3 | 0 | 0 | 0 |
| radar | 3 | 3 | 0 | 0 | 0 |
| railroad | 1 | 1 | 0 | 0 | 0 |
| railroad-abnf | 2 | 2 | 0 | 0 | 0 |
| railroad-ebnf | 9 | 9 | 0 | 0 | 0 |
| railroad-peg | 2 | 2 | 0 | 0 | 0 |
| requirement | 9 | 9 | 0 | 0 | 0 |
| sankey | 8 | 8 | 0 | 0 | 0 |
| sequence | 42 | 42 | 0 | 0 | 0 |
| state | 22 | 22 | 0 | 0 | 0 |
| swimlane | 13 | 13 | 0 | 0 | 0 |
| timeline | 14 | 14 | 0 | 0 | 0 |
| treemap | 8 | 8 | 0 | 0 | 0 |
| treeview | 13 | 13 | 0 | 0 | 0 |
| usecase | 24 | 24 | 0 | 0 | 0 |
| venn | 8 | 8 | 0 | 0 | 0 |
| wardley | 19 | 19 | 0 | 0 | 0 |
| xychart | 8 | 8 | 0 | 0 | 0 |
| zenuml | 16 | 16 | 0 | 0 | 0 |

## Resolved source interpretation

The four former pending examples retain their exact bytes. Block 488 discards the malformed CSS token `fill#969` and applies no authored fill override. Flowchart 844 keeps an edge class with `stroke-dasharray:9` (the odd-length CSS pattern repeats as 9,9), `stroke-dashoffset:900` and `animation:dash 25s linear infinite`; the unescaped comma creates a separate invalid declaration `5`, which is discarded rather than repaired. Gantt 519 uses the pinned `js-yaml@4.3.0` JSON schema for literal frontmatter, including its accepted multiline closing quote. Its chart title overrides the frontmatter title, and the explicitly unsupported `1decade` tick interval falls back to automatic ticks. The Kanban full example violates its own documented unique-identifier rule by repeating `id3`; it is an independently invalid source control requiring a typed native duplicate-identifier rejection. A generic exception, transport failure or accepted drawing never satisfies that control. The occurrence stays in acceptance; it supplies no drawing denominator. Provenance and independent review are retained in `qualification/source-audits/pending-four-resolution.json`.

Named theme requests compile to exact source-derived owner colors, foregrounds, opacity and border effects; raw theme/layout/htmlLabels identifiers and only the classic look identity remain advisory with complete native profiles retained. Concrete font, direction, dimensions, spacing, colors and unsupported configuration remain required. The independent palette policy imports no Mermaid module and lives in the runtime producer closure. Git commit messages remain owned nonvisual metadata distinct from displayed IDs/tags. Wardley pipeline parents encode a labelled range at shared visibility; original parent coordinates remain native/advisory and all member evolution coordinates remain required. Exact approved deltas and admission hashes are in the configuration-visual-policy, git-commit-message-metadata and wardley-pipeline-group source-audit ledgers.

## Pending source interpretation

No uninterpreted source constructs remain. The separate observer qualification ledger still determines which drawing facts can be scored.

## Resource prerequisite

The documentation's `https://mermaid.js.org/favicon.svg` reference is frozen from the same source pin in `corpus/docs-assets.json`, with bytes and license hashes. Rendering must route this exact URL to those bytes before timing. Icon packs and authored font requirements remain explicit source facts; a missing required resource is a setup gap, not a renderer defect. Navigation links and callbacks are outside this static drawing task and are listed separately in each contract.
