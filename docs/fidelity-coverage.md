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

The Agentic 0.5.7 source candidate at `e7cb05b` has reviewed views in
`unified/mermaid-fidelity/views/agentic.mjs`. They read the editable bodies returned
by its own `parseRegisteredMermaid`, rather than calling Mermaid's parser:

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
  explicit JSON property order. The editable body drops the normalized AST's
  source/header/statement spans; those are not reconstructed from input text.

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

- Three were Trident mapping defects: two explicit C4 boundary types lost to
  macro defaults, and one qualified Class namespace hierarchy omitted by the
  view. Both mappings are corrected. The namespace correction also resolves
  two previously unsupported callbacks.
- Sixty-nine are compatibility differences: model text/array/identifier
  representation, diagnostic wording, API-stage differences, or explicit native
  reader/interaction policies. They remain strict-reference assertion failures;
  this review does not turn them into passes or remove them from the denominator.
- Thirty-two reproduce native problems across four causes: rectangle border
  property syntax (25), legacy edge interpolation (4), empty GitGraph tag boxes
  (2), and hex CSS value corruption in Class/State style parsing (1).

The rectangle syntax already exists in Agentic's declared Mermaid 12.2 target,
as well as Trident's 12.3 reference. The original State reproduction uses an
empty template; tracing the shared style reader also reproduces it with actual
states and in Class styles. A `fill`-only control exercises a different property
and does not establish correctness for `background`. The GitGraph finding includes painted empty tag boxes,
not just a difference between empty-list representations.

The full 352-file rerun yields 2,638 passes, 101 assertion failures, 1,005 native
unsupported callbacks and 3,602 Trident gaps. The same corrections on the frozen
0.5.6 release yield 2,243 passes, 102 assertion failures, 1,454 unsupported
callbacks and 3,547 Trident gaps. Each run keeps all 7,346 reference-qualified
callbacks and the separate 18 upstream skips. These classifications cover the
104 reviewed assertions, not the remaining unsupported operations, coverage
gaps or independent rendered-layout findings.
