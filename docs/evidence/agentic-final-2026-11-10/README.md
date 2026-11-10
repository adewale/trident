# Agentic Mermaid: completed repair comparison, 2026-11-10

The benchmark candidate is unreleased Agentic Mermaid 0.5.7 source at
`0102da4a3395fb18ec30c40a4642e042b6f6b78f`, packed after the complete build with
npm 11.9.0. Its tarball SHA-256 is
`b5c1a51f07538cfbb019f356286f639e2534d539cc4a028595220085fb62131f`.
The live main branch was `e7cb05baa7f68154942a9ce9c6e9aaaee163dc94`;
`npm view agentic-mermaid version` still returned **0.5.6** on this date.
Release and source results remain distinct.

## Complete workloads

| Workload | Final source result | Scope |
| --- | --- | --- |
| SVG completion | 1,332 / 1,342 | Every documentation occurrence, three identical-count repeats |
| PNG completion | 1,332 / 1,342 | Same occurrences, three identical-count repeats |
| Terminal completion | 1,332 / 1,342 | Same occurrences, three identical-count repeats |
| SVG drawing labels | 126 / 127 | All retained public-renderer outputs |
| Terminal drawing labels | 126 / 127 | All retained public-renderer outputs |
| Fidelity | 2,842 passed; 131 failed; 775 unsupported; 3,598 Trident gaps | All 7,346 reference-qualified callbacks; 18 upstream skips; 19 candidate collection-gap files |

The ten completion refusals are five sources, each occurring twice: an unfinished
`g-->` edge and a header placeholder `...` also fail the public reference parser;
`excludes weekdays`, journey scores above five, and raw `themeCSS` encounter
explicit native input policies. The bare-year Gantt example now succeeds, as
does the grouped diamond example previously rejected by layout certification.
The one drawing failure in each format is an anonymous subgraph rejected by
both Agentic and Mermaid. No invalid input is removed from a denominator.

The nine repaired native causes are rectangle border properties, legacy edge
interpolation, empty GitGraph tag boxes, Class/State hex CSS values, unauthored
hyphens during emergency wrapping, quadrant caption/point collisions, terminal
multi-participant note bounds, grouped fan-out containment, and bare-year Gantt
task dates. Visual receipts and production outputs for the immutable base/head
are in [Agentic PR #609's final CI evidence](https://github.com/adewale/agentic-mermaid/actions/runs/42727769180/artifacts/13722558982).

## Same-runtime Fidelity comparison

| Candidate | Passed | Strict assertion failed | Native unsupported | Trident gaps |
| --- | ---: | ---: | ---: | ---: |
| Published 0.5.6 | 2,247 | 106 | 1,449 | 3,544 |
| Original source `e7cb05b` | 2,812 | 161 | 775 | 3,598 |
| Repaired source `0102da4` | 2,842 | 131 | 775 | 3,598 |

All three use the same fully passing Mermaid 12.3.0 source control at
`2086904e76c692331e34a45d7cc3bc30860d040e`, control identity
`e73ed8e13a0efd2e67974fff5f937690d6eead23bdc394af59074c8c229555cb`.
Exactly **30 failures become passes** between the original and repaired source;
no other callback changes status. Comparisons use `(file, name, occurrence)`:
parameterized callbacks can have identical names, so a name-keyed dictionary
would silently discard distinct tests and invent regressions.

Relative to the previous reviewed runtime's repaired-source result, Trident now
assesses two more callbacks as passes (actual decimal sequence SVG rendering and
C4 `+`-joined tags) and corrects one failed AgentFlow source-location assertion.
The renderer invokes the real native public API. Mutable renderer bounds and
Mermaid inline-DOM mounting remain explicit gaps. Native error wording is
preserved. Three new SVG label controls distinguish line wrapping from missing
letters and inserted hyphens; visibility and canvas safeguards still apply.

The 131 strict assertion failures retain their original outcomes and captured
reasons in the audit. They include exact diagnostic sentences, cooked text versus
HTML, private generated identifiers/member ordering, syntax-only versus validated
GitGraph APIs, safe-link policies, and documented generous reads. The existing
[104-case responsibility review](../../fidelity-coverage.md#review-of-the-104-agentic-assertion-nonpasses)
and [public-parser audit](../agentic-public-parsers-2026-11-09/README.md) retain the
underlying native/reference evidence. These differences do not become product
bugs merely because the reference assertions fail; confirmed native meaning
losses have reproductions and repairs.

## Rendered edges, arrows and layout

The `drawing-structure-v2` replay qualifies **33 independent controls**, including
complete, damaged and ambiguous caption-at-bend terminal drawings. Counts below
are passed / failed / unassessed / not applicable.

| Format | Topology | Layout constraints |
| --- | --- | --- |
| SVG | 43 / 1 / 71 / 12 | 90 / 1 / 35 / 1 |
| Terminal | 65 / 1 / 49 / 12 | 29 / 1 / 96 / 1 |

The known failures are the refused anonymous-subgraph input. Unsupported families,
ambiguous ownership and geometric representations stay unassessed. In particular,
the authentication example has an ambiguous terminal junction/cycle; the retry
example leaves unassigned ink. A bounded bend-caption bridge fixes the observer's
false disconnected-stem diagnosis, but those drawings do not receive invented
passes. Layout checks cover named constraints, not general aesthetics or all
edge/node crossings. These diagnostic axes have weight zero in the overall score.

Fidelity coverage remains 92.55% assessed for parser/model (2,564 passes, 116
failures, 564 unsupported, 261 gaps), 1.07% for rendering/layout (17 unsupported,
1,569 gaps), and 21.60% for host/internals (278 passes, 15 failures, 194 unsupported,
1,768 gaps). Many original tests call private Mermaid renderer/layout/host APIs;
a successful standalone SVG does not implement those protocols. The independent
rendered-output profile addresses part of that limit without inventing those APIs.

## Evidence and reproduction

[audit.json.gz](audit.json.gz) retains all three complete callback lists, exact
occurrence-aware transitions, every completion repeat, drawing output hashes and
verdicts, structural controls/checks, source/reference identities, and the five
remaining completion sources with actual reference outcomes. Historical published
results and rankings are unchanged. Timing collections shared a host with tests;
this receipt makes no performance-ranking claim.

Build and npm-pack the exact Agentic commit, prepare it with Trident's candidate
package support, then run `davebench`, `davebench:terminal`, `drawing:correctness`,
`drawing:structure`, `mermaid:fidelity` and `fidelity:coverage` with that frozen
catalog and artifact. The CLI help documents the prepared/catalog paths.
`--reuse-reference` permits the original-source/release runs only with the
identical qualified control. Drawing reassessment reuses retained output bytes
without invoking a renderer. The collection used Bun 1.4.4, Node 24.22.1,
Chromium, and `TZ=UTC`.
