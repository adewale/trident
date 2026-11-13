# Retained drawing structure diagnostics

`drawing:structure` measures topology and explicit layout constraints on actual
retained SVG and terminal drawings. It invokes no renderer and collects no new
timings. The current profile, `drawing-structure-v2`, qualifies flowchart, class,
state, ER and sequence topology in SVG and terminal output, plus SVG quadrant
point/caption box clearance. Other families and unsupported representations remain unassessed.
`drawing:structure` is an optional diagnostic, not a benchmark. It never changes a
Drawing Correctness, DaveBench or Mermaid Fidelity score, a rank or the
equal-weight synthesis. The README lists it with the other
[diagnostics](../README.md#diagnostics).

```sh
bun commands.ts drawing:structure --run RETAINED_DRAWING_RUN --out FRESH_DIRECTORY
# Optional: --projects owner/project,owner/other --case ID_FRAGMENT
```

The input is a completed raw Drawing Correctness directory with `results.json`
and `outputs/`. The command verifies each selected source and returned output's
hash and the complete reviewed corpus contract. It writes `results.json` with
per-case checks, observer source identities and qualification receipts, plus
`report.md` with counts per project/version/format. Capture time and assessment
time remain separate. Each axis reports passed, failed, unassessed and not
applicable; unsupported observation does not earn a pass or become a failure.
Renderer failures and invalid outputs remain known nonpasses on applicable axes.

## Topology

SVG evidence requires visible node ownership, connected endpoints, exact edge
multiplicity, declared arrow/circle/cross marker semantics and caption ownership.
Node and route ink must independently qualify as visible; labels above a hidden
or occluded connector cannot establish a topology pass. Non-flowchart graph
families also require the planned family-specific structural facts, including
participant/message order and declared cardinalities where applicable.
Declared groups require painted containment. The observers read actual mounted
ink and independently authored expectations; renderer models and generated IDs
cannot establish a correct drawing. Terminal evidence uses closed containers,
traced routes and the source-owned relationship contract. Ambiguous junctions,
encoded drawings without qualified decoding, and unfamiliar glyph profiles stay
unassessed.

Production qualification uses independent pictures for a complete graph,
reversed edges, missing heads, hidden stems, duplicate edges and wrong source
order. Terminal controls include a complete graph, a reversed arrow and labels
without a drawing. The original Mermaid test bodies and the 127 Drawing source
cases are unchanged.
Each additional graph family has independent SVG and terminal positive and
damaged controls. Terminal bend-caption controls independently distinguish a
complete route, a broken stem and ambiguous wire contacts. The current
production qualification runs 33 controls. Quadrant controls separate a clear layout from a point marker
overlapping a section caption.

A closed wire loop containing only stroke glyphs is an ambiguity control, not
evidence of an invented labelled node. Extra-node negatives require independent
literal caption evidence; unresolved symbolic captions remain unassessed.
Conflicting direct group-membership lists in older SVG source contracts also
remain unassessed pending a reviewed ownership policy.
State identifiers referenced in multiple lexical scopes similarly require a
reviewed source-ownership policy. A class cardinality token outside the bounded
endpoint ownership radius stays unknown when it could satisfy the required
value; a uniquely owned wrong value or a required value absent from the whole
outside-node inventory remains a failure.

## Layout constraints

SVG checks cover visible labels, canvas containment, clipping, overlap of
uniquely owned leaf-node boxes, and explicitly required acyclic source order.
Node boxes may intersect by at most one CSS pixel on both axes. Declared
containers are excluded from leaf-node overlap. Cyclic or contradictory orders
remain unassessed; a direction hint alone does not impose a total node order.
Terminal layout currently checks only explicit source order.

Quadrant SVG clearance first requires independently visible labels and a complete
actual point inventory at the source coordinates. Each point/caption must then
own one distinct plain SVG text box. Point/caption text boxes and visible point
marker boxes may not intersect by more than one CSS pixel on both axes. This is
a named box-clearance constraint, not a claim of pixel occlusion. Ambiguous names,
HTML labels, unsupported paint effects and unqualified point positions remain
unassessed.

These are named geometric constraints, not an aesthetic ranking. Other charts,
edge/node clearance, arbitrary graph families and
terminal overlap still need qualified profiles. The report retains this missing
work instead of presenting a partial profile as complete visual correctness.
