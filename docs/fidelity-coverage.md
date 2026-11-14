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

Separately from the slices, each project's counts are split into the **scored
population** (qualified callbacks in files under `packages/mermaid/src/diagrams/`
or `packages/parser/`, the callbacks Mermaid Fidelity scores) and **inventory**
(the other qualified callbacks: rendering utilities, Mermaid's website and
top-level modules). Inventory is executed and shown here but not scored;
`report.md` states both sizes and `results.json` marks each gap file that is
inventory.

`report.md` shows population, passed, failed, explicitly unsupported and
unassessed counts, plus assessed percentage and score bounds, for the scored
population, the inventory and each slice. The lower bound credits verified passes
only. The upper bound additionally allows every unassessed or unsupported callback
to pass: as in Fidelity scoring, an operation the candidate's side reports as
unsupported is unassessed, not a known nonpass, and the assessed percentage
excludes it. An empty slice has no score. `results.json` also lists remaining gaps
by file, unsupported callbacks included with an `Unsupported:` reason prefix, with
captured reasons and whether the file failed collection. Projects whose Fidelity
is not applicable are listed under `notApplicable`.

Unbound module exports are deferred during test-file loading so unused imports
do not block unrelated callbacks. Using an unavailable export still produces an
adapter gap. Namespace use is conservatively audited, including helper code
outside callbacks; reflection cannot turn missing native behavior into a pass.

## Reviewed view versions

A reviewed schema view reads one project's own model field by field, so it holds
only for the model shape it was checked against.
`unified/mermaid-fidelity/views/reviewed-versions.mjs` lists, per project with
reviewed views, the native versions the views were reviewed against, each with a
note saying what was checked. An entry is either a note, which covers any build of
that version, or `{ note, revisions: { <source revision>: note } }` for a project
whose artifact records a source revision and can be rebuilt under the same version.
When a candidate's frozen version is not listed, or its artifact's revision is not
listed for an entry that names revisions, `unreviewedViewGap` makes every qualified
callback a Trident gap with the reason `view not reviewed for <project> <version>`
(or `… at revision <revision>`), whatever the run observed. Result rows record the
artifact's `revision`, and `scripts/rescore-fidelity.ts` applies the same check
when rescoring. Projects with no entry have no reviewed view; they use the generic
field-name projection and the check does not apply.

To add a reviewed version, compare the model fields the project's views read in a
reviewed version and the new one: the type definitions or parser source, and the
native models the two versions produce for the same corpus sources
(`scripts/fidelity-probe.ts` prints the model a view receives). Update the views
where a field the views read was renamed, removed or re-encoded, then add the
version (and, for a source distribution, the revision) with a note recording what
was compared and what changed.

The views' default rule is stated in the header of
`unified/mermaid-fidelity/view-core.mjs`: a view supplies Mermaid's default only
where the native model shows the source left a value unwritten and Mermaid's own
parser stores a documented default for that unwritten value; a model that keeps no
such field gets no default.

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
