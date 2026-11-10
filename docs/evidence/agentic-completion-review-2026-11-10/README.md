# Independent completion review and corrected replay, 2026-11-10

A fresh, independent review reopened the earlier completion claim and found
four actionable boundaries: three Agentic interpolation consumers and one
Trident sequence-capability mapping. All four are repaired. The original
[comparison](../agentic-final-2026-11-10/README.md) remains historical evidence;
this receipt supersedes its final candidate/runtime identities.

## Findings and repairs

| Owner / boundary | Reproduction and resulting behavior | Owning evidence |
| --- | --- | --- |
| AgentFlow declaration-only serialization | `connector C`, an edge and `linkStyle default interpolate basis` formerly exported a new `connector linkStyle`. Temporary node declarations now exclude graph curves; the main writer emits each directive once. | Default/indexed/combined round trips retain exact connector/global identities, graph data, metadata and roles. |
| Collapsed AgentFlow projection | Removing an internal red/linear edge formerly shifted its indexed style onto a surviving blue/basis edge. Both CSS and curve indices now follow their surviving original edge. | Explicit expected paint/curve values, final positioned edges, metadata precedence and immutable editable input. |
| Swimlane positioned edges | Parsing/export retained legacy interpolation while the independent lane layout ignored it. Positioned edges now resolve explicit metadata, indexed directives and defaults in that order. | Four precedence cases, canonical reload, immutable input, and actual SVG geometry compared with equivalent explicit metadata. |
| Trident sequence capability views | Crafter's discarded boxes/lifecycles and OpenCode's absent lifecycle data were exposed as invented empty collections. They now report unsupported. Actual native parser refusals and genuine supported empty observations remain unchanged. | Two absence/presence regressions; 21 affected tests pass; exact native before/after probes and original callbacks are retained. |

AgentFlow/interpolation and Swimlane suites pass 77 and 51 tests respectively.
The review traced adjacent consumers of the new curve field and found no further
confirmed propagation defect. This is a bounded review, not a claim that every
possible input has been proved correct. The repaired sequence over-note contract
covers supported one/two-target syntax; an opaque three-target extension is not
silently promoted to supported syntax.

## Exact candidate and complete replay

Native implementation commit:
`42986d06dc66325355d630acd1eec306a531b799` (unreleased 0.5.7).
Complete package SHA-256:
`f386b4346cb827273b410532dd5d72ab91300690656a83f7194d09d501e7fe41`.
Final Agentic PR head:
`79b3b509275e80163c0dd507c2c3439f021e7218`.
The latter changes only an evidence caption outside the shipped package; all
native implementation/build inputs are identical. The receipt verifies that
file difference and its absence from the package. Published 0.5.6 remains a
separate comparison, rather than being called the latest source.

All three Agentic candidates and both peer implementations use the fully
passing Mermaid 12.3.0 source control at
`2086904e76c692331e34a45d7cc3bc30860d040e`, with fresh sealed identity
`50a16ff74e4eae1511bc111836f0e5924a69b2c1a27789cbda20661321c23434`.
Each full run retains 7,346 qualified callbacks, 18 upstream skips and 19
candidate collection-gap files.

| Agentic artifact | Passed | Strict failures | Unsupported | Trident gaps |
| --- | ---: | ---: | ---: | ---: |
| Published 0.5.6 | 2,247 | 106 | 1,449 | 3,544 |
| Original source `e7cb05b` | 2,812 | 161 | 775 | 3,598 |
| Corrected source `42986d0` | 2,842 | 131 | 775 | 3,598 |

Occurrence-aware comparison confirms exactly 30 failures become passes from
original to corrected source, with no other status change. The added consumer
repairs leave all previous `0102da4` callback statuses unchanged: these are real
cross-consumer defects that the original assertions did not exercise.

SVG, PNG and terminal completion each remains **1,332 / 1,342**, in every one
of the three repeats. Drawing labels remain **126 / 127 in each format**, with
all 254 outputs assessed and no blocked format. The remaining input is the
anonymous subgraph also rejected by Mermaid. The ten completion refusals retain
the five-source review from the earlier receipt. Every output format was
recollected from the corrected package.

The 33 independent structural controls qualify again. Counts are
passed / failed / unassessed / not applicable:

| Format | Topology | Layout constraints |
| --- | --- | --- |
| SVG | 43 / 1 / 71 / 12 | 90 / 1 / 35 / 1 |
| Terminal | 65 / 1 / 49 / 12 | 29 / 1 / 96 / 1 |

Known failures are the refused anonymous-subgraph input. Broader geometry,
unsupported families and ambiguous ownership remain explicit observation gaps;
these diagnostic axes have zero overall-score weight. Source-path Fidelity
coverage remains 92.55% assessed for parser/model, 1.07% for rendering/layout and
21.60% for host/internals. Private Mermaid protocols are not invented from
standalone SVG success.

## Crafter and OpenCode fairness

Both complete 352-file selections were replayed, not just their sequence tests.

| Project | Full passes | Full failures | Unsupported | Trident gaps |
| --- | ---: | ---: | ---: | ---: |
| OpenCode | 126 | 1,123 | 2,591 | 3,506 |
| Crafter | 230 | 1,666 | 1,940 | 3,510 |

For the main sequence file, all 157 expanded callbacks qualify in the reference:

| Project | Passed | Failed | Unsupported | Trident gaps |
| --- | ---: | ---: | ---: | ---: |
| OpenCode | 41 | 74 | 10 | 32 |
| Crafter | 21 | 85 | 17 | 34 |

Exactly three Crafter lifecycle callbacks move from failed to unsupported due to
this correction. Both native parsers still reject the three tested box inputs;
OpenCode still rejects all three lifecycle inputs before any getter is read.
All original references to the changed getters are covered by the retained
12 native before/after observations. Other differences from the early campaign
also include earlier renderer/bounds deferral changes and are not attributed to
this one correction.

## Why ten GitGraph assertion errors remain strict failures

A focused review of all ten `packages/parser/tests/gitGraph.test.ts` failures
invoked both final packed public APIs: the editing parser and root `parseGitGraph`.
Both reject the exact inputs. The public root parser performs validated history
replay; it does not offer a separate recovering syntax-only mode.

| Underlying native refusal | Callbacks |
| --- | ---: |
| Unknown attributes | 2 |
| Merge target absent | 3 |
| Checkout target absent | 2 |
| Cherry-pick source absent | 1 |
| Unsegmented same-line statements | 1 |
| Cherry-pick already reachable after merge | 1 |

Each callback records one actual native call and one native rejection. The
syntax-test adapter returns `parserErrors: [error]` and `value: undefined` after
that rejection. The original test ignores parser errors and reads
`value.statements`, causing the displayed assertion-side `TypeError`; it is not
a native JavaScript crash. Accepted controls return genuine native statements
and project correctly. Relabelling these refusals as an unavailable AST would
hide an actual validation-versus-syntax difference. The remaining strict failures
retain their original outcomes and are not presented as a product-bug count.

## Retained evidence and reproduction

[audit.json.gz](audit.json.gz) contains the three complete Agentic callback lists,
both complete peer runs, exact callback-occurrence transitions, all completion
repeats, drawing output hashes/verdicts, structural qualification/checks, coverage
slices, the 12 sequence capability probes, and all ten GitGraph public-API probes
plus accepted controls. Raw result hashes bind the retained receipt to the runs.
Historical published rankings and snapshots are unchanged. Collection shared a
host with correctness work; this report makes no performance-ranking claim.

Build/package the native commit above and use Trident candidate preparation.
Run `davebench`, `davebench:terminal`, `drawing:correctness`, `drawing:structure`,
`mermaid:fidelity` and `fidelity:coverage` with the frozen artifact/catalog.
The original-source, release and peer full runs use `--reuse-reference` with the
identical complete qualified control. The existing CLI help specifies paths.
Production before/after exports, SVG/PNG and layout witnesses are generated by
`scripts/pr-assets/meaning-preservation-evidence.ts` at immutable commits, with
fixtures `reviewed-agentflow-curve-export`, `reviewed-agentflow-collapsed-curves`
and `reviewed-swimlane-legacy-curves`. Final CI evidence is retained with
[Agentic run 42735844610](https://github.com/adewale/agentic-mermaid/actions/runs/42735844610).
