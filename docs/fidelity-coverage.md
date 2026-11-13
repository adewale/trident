# Fidelity coverage and remaining gaps

`fidelity:coverage` reads a completed raw Mermaid Fidelity run and reports the
same reference-qualified callback population in three fixed source-path slices.
It does not execute tests, change outcomes or remove unknowns from a score.
It is an optional diagnostic, not a benchmark, and never changes a score, a rank
or the synthesis; the README lists it with the other
[diagnostics](../README.md#diagnostics).

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

## Reviewed Agentic views

Agentic Mermaid has reviewed views in `unified/mermaid-fidelity/views/`.
Capability selection uses its public `parseClassDiagram`, `parseSequenceDiagram`,
`parseErDiagram`, `parseUsecaseModel` and `parseAgentflowModel` exports when the
measured package has them. These
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

Agentic-specific reviews, repair comparisons and their receipts live in the
[Agentic Mermaid repository](https://github.com/adewale/agentic-mermaid), not here.
