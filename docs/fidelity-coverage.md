# Fidelity coverage and remaining gaps

`fidelity:coverage` reads a completed raw Mermaid Fidelity run and reports the
same reference-qualified callback population in three fixed source-path slices.
It does not execute tests, change outcomes or remove unknowns from a score.

```sh
bun commands.ts fidelity:coverage --run RAW_FIDELITY_RUN --out FRESH_DIRECTORY
```

The `upstream-source-path-slices-v1` policy uses original upstream paths, before
looking at any candidate result:

- Parser/model: `packages/parser/tests`, diagram parser folders, and diagram
  database, AST and Diagram test files.
- Rendering/layout: layout packages, rendering folders, and Renderer, Layout,
  Sizing and svgDraw test files.
- Host/internals: all remaining source paths.

These are reproducible source slices, not assertions about every callback's
semantic purpose. The three populations partition the full qualified population.
Repeated titles retain their callback ordinals; missing callbacks are rejected.

`report.md` shows population, passed, failed, explicitly unsupported and
unassessed counts, plus assessed percentage and score bounds. The lower bound
credits verified passes only. The upper bound additionally allows every
unassessed callback to pass. Unsupported native operations are assessed
nonpasses. An empty slice has no score. `results.json` also lists remaining gaps
by file, with captured reasons and whether the file failed collection.

Unbound module exports are deferred during test-file loading so unused imports
do not block unrelated callbacks. Using an unavailable export still produces an
adapter gap. Namespace use is conservatively audited, including helper code
outside callbacks; reflection cannot turn missing native behavior into a pass.

## Reviewed Agentic source views

The Agentic 0.5.7 source candidate has reviewed views in
`unified/mermaid-fidelity/views/`. Capability selection uses its public
`parseClassDiagram`, `parseSequenceDiagram`, `parseErDiagram`,
`parseUsecaseModel` and `parseAgentflowModel` exports when available. These
parse the complete source through Agentic's own parsers. The frozen 0.5.6
package lacks these exports and retains its `parseRegisteredMermaid` binding.
A source parser rejection never falls back to the more permissive editing API.

- Agentflow: native graph identities, markers, roles, metadata, containers,
  class assignments and line/column mappings. Mermaid's computed group/collapse
  layout, diagnostic list, generated IDs and private renderer fields are not
  supplied by this parser body.
- Railroad: source-order rules, duplicate names, expression trees and unbounded
  repetition. The normalized body loses singleton sequence/choice syntax, so
  the corresponding Langium expression observation stays unsupported. The DB
  projection preserves PEG alternative order and encodes predicates, wildcard and
  EBNF exceptions in Mermaid's display-oriented records without reparsing source.
- Treeview: explicit parents, node types and annotations. Positional native
  addresses are projected to the database's one-based positional IDs; the
  artificial root is a representation wrapper. Parent depth never substitutes
  for authored indentation width, which the body discards.
- UseCase: actor/use-case/boundary/relationship records, notes, classes and
  explicit JSON property order. The public model also retains source, header
  spans and statement occurrences. Complete normalized AST tables remain
  unsupported, including comparisons of the whole AST.
- Class: structured attributes, methods, annotations, direction and inline
  styles. The editing model supplements authored labels and explicit namespace
  declarations that the render model expands. ClassDef/assignment mutation
  order is not retained; it cannot stand in for Mermaid's node-style history.
- ER: typed attributes, keys and comments, render cardinality vocabulary,
  class definitions and accessibility descriptions. The editing model retains
  group-close statement order.
- Sequence: notes, boxes, titles, activation events, actor lifecycle bindings
  and message heads. Semantic editing statements preserve their exact order;
  indexed render records are interleaved only where their order is determined.
  Cross-kind statements sharing an ambiguous boundary remain unsupported.

Failure reduction recognizes an explicit `TRIDENT_ADAPTER_GAP` exception even
when Vitest raises it during failure formatting after the callback audit closes.
The first stack frame must belong to Trident. Confirmed native faults and native
unsupported operations retain their existing precedence. A candidate exception
with a similar message does not gain adapter ownership. Unbound Diagram renderer
access is deferred explicitly, so a negative test cannot earn a pass by catching
a missing-property TypeError instead of its intended native validation error.

## Review of the 104 Agentic assertion nonpasses

The review of the same `e7cb05b` source candidate classified every original
assertion nonpass using captured callback inputs, the pinned native public API,
native verification/serialization/drawings, and selected reference renders:

- Nine were Trident mapping defects: two explicit C4 boundary types lost to
  macro defaults, and one qualified Class namespace hierarchy omitted by the
  view, plus four malformed sequence cases and two class-note cases bound to
  the editing API instead of the public source parser. All are corrected. The
  namespace correction also resolves two previously unsupported callbacks.
- Sixty-nine are compatibility differences: model text/array/identifier
  representation, diagnostic wording, API-stage differences, or explicit native
  reader/interaction policies. They remain strict-reference assertion failures;
  this review does not turn them into passes or remove them from the denominator.
- Twenty-six reproduce native problems across four causes: rectangle border
  property syntax (19), legacy edge interpolation (4), empty GitGraph tag boxes
  (2), and hex CSS value corruption in Class/State style parsing (1).

The rectangle syntax already exists in Agentic's declared Mermaid 12.2 target,
as well as Trident's 12.3 reference. The original State reproduction uses an
empty template; tracing the shared style reader also reproduces it with actual
states and in Class styles. A `fill`-only control exercises a different property
and does not establish correctness for `background`. The GitGraph finding includes painted empty tag boxes,
not just a difference between empty-list representations.

The final curve view assesses five formerly unsupported callbacks: one already
passes in the original package and four expose the same interpolation gap.
The full 352-file rerun on the original `e7cb05b` source yields 2,639 passes,
105 assertion failures, 1,000 native unsupported callbacks and 3,602 Trident gaps.
The frozen 0.5.6 release yields 2,244 passes, 106 assertion failures, 1,449
unsupported callbacks and 3,547 Trident gaps. Each run keeps all 7,346 reference-qualified
callbacks and the separate 18 upstream skips. These classifications cover the
104 reviewed assertions, not the remaining unsupported operations, coverage
gaps or independent rendered-layout findings.

An initial file-level tally incorrectly assigned all 25 `flow-text` failures to
rectangle properties. Exact-case review separates 19 rectangle cases from one
newline representation difference and five documented generous label reads
that emit `flowchart_label_delimiter`. The classification above incorporates
that correction without changing any raw benchmark outcome.

An earlier review classified the original 104 as 3 mapping defects, 75
compatibility differences and 26 native problems. Inspection of the public
source APIs moved six of those compatibility cases into the mapping category;
the corrected classification above is 9 / 69 / 26. API-stage differences were
not an established product limitation.

At the earlier Trident head `81b939b`, the repaired Agentic candidate at
`9543330` yielded 2,669 passes and 75 assertion failures, with unsupported and
Trident-gap counts unchanged. Thirty native failures became passes: the
original 26 plus the four newly assessed interpolation callbacks. The public
source follow-up below measures that same unchanged package more completely.

## Public source parser follow-up

The same `9543330` package now yields **2,839 passes, 132 strict assertion
failures, 775 unsupported callbacks and 3,600 Trident gaps**. No previously
passing callback regresses. This fixes six more unfair failures and assesses
226 formerly unsupported callbacks; 163 pass and 63 expose diagnostic,
representation or documented reader-policy differences. The original 7,346
qualified callbacks, 18 skips and 19 candidate collection-gap files remain.

Trident also corrects cross-family parser imports, UseCase's asynchronous
rejection protocol and stale publication after rejection. Complete AST
comparisons cannot pass or fail as a partial native AST when its tables are
declared absent. See the [run receipt and complete opaque audit](
evidence/agentic-public-parsers-2026-11-09/README.md).

This follow-up improves model coverage. It does not supply Mermaid's private
renderer APIs or add rendered-layout coverage to the source-path Fidelity slice.

Under the same final runtime and sealed reference, original Agentic `e7cb05b`
yields 2,809 passes and 162 assertion failures; the repaired package turns
exactly 30 failures into passes with no other status changes. Frozen 0.5.6
retains its earlier 2,244 / 106 / 1,449 / 3,547 totals.

## Final rendering and mapping follow-up, 2026-11-10

The final Agentic source at `0102da4` produces **2,842 passes, 131 strict assertion
failures, 775 unsupported callbacks and 3,598 Trident gaps**. The same runtime
measures original `e7cb05b` at 2,812 / 161 / 775 / 3,598 and published 0.5.6 at
2,247 / 106 / 1,449 / 3,544. Exactly 30 source failures become passes with no
other callback-status changes. Two real native operations close former gaps;
one source-coordinate mapping corrects a former failure. Exact error wording,
private mutable bounds and DOM mounting are preserved as distinct capabilities.

Full SVG, PNG and terminal completion now each reaches 1,332 / 1,342 in all
three repeats; drawing labels reach 126 / 127 in both formats. Reviewed rendered
repairs include wrapping, quadrant clearance, terminal notes and grouped-node
containment. The [complete receipt](evidence/agentic-final-2026-11-10/README.md)
records remaining refusals, strict assertions, coverage gaps and the 33-control
rendered-structure replay. These final measurements supersede the earlier
follow-up counts above without rewriting historical campaign results.

## Independent completion review

The [subsequent completion review](evidence/agentic-completion-review-2026-11-10/README.md)
found and repaired three additional Agentic interpolation consumers and one
sequence-capability mapping. Crafter's three unavailable lifecycle observations
now remain unsupported; OpenCode's real native refusals remain failures. Complete
Crafter/OpenCode runs and all Agentic workloads were replayed with a fresh sealed
reference. Corrected Agentic `42986d0` retains 2,842 passes / 131 strict failures /
775 unsupported / 3,598 gaps; the added native defects were outside the original
assertions. Both public GitGraph APIs were checked against the ten syntax-only
failures: those outcomes reflect actual native rejections, not missing AST fields
or native JavaScript crashes. The new receipt retains exact inputs and observations.

## Adversarial review of both PRs

The [adversarial review](evidence/adversarial-review-2026-11-10/README.md) repairs
border-label ownership and terminal note parity in Agentic, plus geometric SVG
word-wrap qualification, entity-aware admission, class collections and default
link styles in Trident. All six have concrete reproductions and owning regressions.
Complete replays on native `cf1f224` retain 2,842 passes / 131 strict failures /
775 unsupported /3,598 gaps under a fresh fully qualified control. All 2,032 peer
SVG rows were reassessed; no passing row lost a pass. Original source/release
comparisons and diagnostic coverage limits remain explicit in the new receipt.
