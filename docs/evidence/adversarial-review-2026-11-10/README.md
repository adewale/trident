# Adversarial review of both repair PRs, 2026-11-10

Two independent reviewers examined both PRs under separate semantic-ownership
and rendered-geometry hypotheses. A third review checked admission and API
boundaries and reconciled their changes. Expected behavior came from actual
public models, independently drawn SVGs, visible terminal stems and pinned syntax
acceptance rather than existing assertions. Six confirmed P2 findings were fixed.

| Owner / finding | Minimal reproduction | Correction and evidence |
| --- | --- | --- |
| AM: bordered rectangle label reinterpreted as another shape | `A[\|borders:lt\|/Lean/]` became a lean shape labelled `Lean`, then lost its borders on export. | Once the border prefix declares a rectangle, quoted/unquoted dispatch retains that identity. Slash/backslash variants, canonical reload and SVG/terminal glyph/border retention pass. This regression was introduced by the earlier border repair. |
| AM: odd-spacing note placed the last lifeline on its wall | A alias `ABCDEFGHIJK`, participant B and `Note over A,B: x`. | Correct discrete box-centering contains actual stems strictly inside both walls. Reversed endpoints, odd/even aliases and both terminal modes pass. This closes an incomplete parity case of the earlier repair. |
| Trident: source whitespace and formatting could masquerade as word wrapping | Expected `Small rectangle`; one-row SVG text `Small rectangl` + raw newline + `e`, or a font/superscript/backward-row change. | Only measured forward baseline/reset flow supplies a joinable boundary. Raw whitespace and backward rows remain non-joinable; font 16/20/30 with backward shifts of 2/9 pixels are covered. This false-pass path was introduced by the earlier observer extension. |
| Trident: entity-spelled authored diagnostics falsely rejected | A real node label `syntax#32;error` was counted as an error report. Numeric XML entities could also hide actual error reports. | Supported Mermaid/HTML entity and whitespace spellings normalize only for comparison; renderer input remains untouched. SVG error text decodes once, so escaped literal entities are not reinterpreted. Node SVG/terminal and browser SVG/PNG controls pass. The pre-existing helper was also used by the new Fidelity renderer binding. |
| Trident: multiple native classes became one class identity | Repeated `class A foo` and `class A bar` retain native `foo bar`, but the view returned `['foo bar']`. Authored edge classes were also unavailable. | Native strings split into ordered identities; actual arrays are copied. Missing edge assignments remain absent; explicit empty assignments remain empty. This fixes a pre-existing reviewed-view omission. |
| Trident: default edge styles dropped | Native `linkStyles.get('default')` from `linkStyle default stroke:red` disappeared from `getEdges().defaultStyle`. | Default styles use the native style translation independently of indexed styles; genuine absence remains absent. This fixes a pre-existing reviewed-view omission. |

All confirmed findings are repaired. The source and input grammar are unchanged
outside these owning boundaries. No new family, dependency, private Mermaid API,
synthetic candidate result or scoring formula is introduced. The review is
bounded; it does not claim exhaustive proof over every possible layout.

## Validation

- Native parser/outline and adjacent terminal suites: **271 passed**, zero failed,
  across five files. The two owning geometry suites separately pass 71 tests.
- Trident admission/browser/terminal/Fidelity-renderer suites: **28 passed**;
  semantic view/source/sequence suites: **23 passed**;
  label/structure/paint suites: **48 passed**, all zero failed.
- The production SVG-label qualification now has **13 controls**, with true
  left/center/right downward wrapping retained and the new damaged cases rejected.
  Its profile is `svg-label-paint-v6`. Structural qualification remains 33 controls.
- Each finding has an owning red→green reproduction. In particular, the backward
  row fix was checked independently of font-height thresholds, avoiding a
  platform-dependent false pass.
- Canonical lint/typecheck and diff checks pass in both repositories. Regression
  protection lives in current semantic tests, not in PR screenshots or manifests.

Native production evidence adds `reviewed-bordered-literal-shape` and
`reviewed-terminal-note-parity` to the existing generator. The actual prior-head
baseline `79b3b509275e80163c0dd507c2c3439f021e7218` exposes the slash loss and odd
note wall; the final output retains the literal label and both stem interiors.
The existing CI generator also retains the original main baseline and full-SHA
receipts. Terminal span evidence is in `terminal-review.html`; the rectangle uses
production SVG/PNG and its layout sidecar.

## Complete final workloads

Native source and final Agentic PR head:
`cf1f224724c2ac7df5281c7cc12ba97e0957f832` (unreleased 0.5.7).
Complete package SHA-256:
`41c30e4a1f1983072f4f6934dd932529cc63a6950b7067a029990cff1ded6452`.
The prior native implementation and published 0.5.6 remain separate comparisons.

The full Mermaid 12.3.0 source control at
`2086904e76c692331e34a45d7cc3bc30860d040e` passes all 7,346 qualified callbacks,
with 18 upstream skips separate. All full runs reuse the fresh, identical control
identity `16bee43c9ff7fb1883bc143a5d8974b2e3493e803849e43ee6d17819d4499e89`.
Nineteen candidate collection-gap files remain explicit for each candidate.

| Agentic artifact | Passed | Strict failures | Unsupported | Trident gaps |
| --- | ---: | ---: | ---: | ---: |
| Published 0.5.6 | 2,247 | 106 | 1,449 | 3,544 |
| Original source `e7cb05b` | 2,812 | 161 | 775 | 3,598 |
| Adversarially repaired source `cf1f224` | 2,842 | 131 | 775 | 3,598 |

The original-source comparison still has exactly 30 failure→pass transitions and
no other changes. All previous `79b3b50` callback statuses remain unchanged.
The added reproductions expose contracts that the original callbacks did not
exercise; unchanged headline scores do not make those defects harmless.

SVG, PNG and terminal completion each remains **1,332/1,342** in all three repeats.
Drawing labels remain **126/127 per format**, with 254 assessed rows and no blocked
format. The sole drawing refusal is the anonymous subgraph Mermaid also rejects.
The existing five-source review still accounts for ten completion refusals;
strict compatibility assertions are retained rather than relabelled product bugs.

| Format | Topology P/F/U/NA | Layout constraints P/F/U/NA |
| --- | --- | --- |
| SVG | 43/1/71/12 | 90/1/35/1 |
| Terminal | 65/1/49/12 | 29/1/96/1 |

Known structural failures are the same refused input. Broader geometry and
unqualified representations stay explicit gaps; these axes have zero overall
score weight. Parser/model, rendering/layout and host/internal assessed coverage
remains 92.55%, 1.07% and 21.60%. Missing private protocols are not fabricated.

The full peer replays retain OpenCode 126 P / 1,123 F / 2,591 unsupported / 3,506 gaps and
Crafter 230 P / 1,666 F / 1,940 unsupported / 3,510 gaps. Native refusals are unchanged.

## Collateral observer replay

The final observer reassesses all **2,032 retained SVG rows** from the frozen
26-project Drawing campaign without invoking a renderer. No previously correct
row loses its pass. Six formerly unknown rows and one formerly incorrect row
become correct. These seven changes include earlier observer repairs in the same
PR and are not attributed solely to this adversarial round. Original terminal
rows and historical published rankings/snapshots remain unchanged.

## Retained evidence

[audit.json.gz](audit.json.gz) contains complete callback lists and occurrence-aware
transitions; all completion repeats; drawing hashes, verdicts and structural
checks; coverage slices; both full peer runs; the complete collateral label
reassessment and its seven changes; semantic native/reference probes; source,
package and control identities; and the six finding dispositions. Raw-result
hashes bind the receipt to the completed runs. Earlier [completion-review](
../agentic-completion-review-2026-11-10/README.md) and [original final-comparison](
../agentic-final-2026-11-10/README.md) receipts remain historical evidence.

Build/package the pinned native commit and use Trident's candidate preparation;
run `mermaid:fidelity`, `fidelity:coverage`, `davebench`, `davebench:terminal`,
`drawing:correctness` and `drawing:structure` with frozen prepared/catalog files.
`--reuse-reference` requires an identical qualified control. The existing
`reassess-drawing-results.ts` script reuses captured bytes for observer checks.
Collection shared a host with correctness work; no performance-ranking claim is
made. Final production evidence is retained with [Agentic CI 42770363402](
https://github.com/adewale/agentic-mermaid/actions/runs/42770363402).
