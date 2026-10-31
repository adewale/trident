# SVG observation coverage

An SVG return is admission, not drawing correctness. A new verdict needs the
exact source, independently authored expectations, retained SVG bytes and
observer identity. Every required observation carries all four hashes. A
different source, changed expectation, mixed output or mixed observer cannot
reuse old passed rows. Missing criteria remain unknown.

Source review and output review answer different questions. The source review
must account for the whole input before an output can receive full-source
credit. A passing authored feature profile does not prove that its expectations
exhaust every visible property of the input. The documentation source reviews
record completeness and unresolved syntax separately.

All 100 authored cases also enroll through the independent literal source
transcriber. Its additional direction, shape, participant, ordering, styling
and family-content obligations enter the SVG ledger. `profileExpected` retains
the original native API assertions; SVG enrichment cannot silently change
those contracts. Compatible source aliases are explicit: authored commit names
replace transcriber-local commit indices, and native parent-to-child mindmap
hierarchy remains separate from its undirected visible connectors. A source
or expectation conflict stays unresolved. Missing/stale source completeness
metadata cannot produce a whole-source certificate even when every bounded
profile observation passed.

The observer uses browser text, actual outlines, measured endpoints, marker
geometry, containment, numeric axes and legend ownership. Native model output,
generated IDs, renderer names and agreement with Mermaid supply no visible
fact. Arbitrary renaming controls and unchanged public SVG fixtures cover
Mermaid, Pele, Mermaid RS Renderer and Merslim. No renderer needs to run for
these observer tests.

## Qualified profiles

These are bounded profiles, not a claim that every output representation or
family is qualified. The tests retain the original public outputs and alter
their physical contents while preserving convenient labels.

| Profile | Evidence and controls | Remaining boundary |
| --- | --- | --- |
| Labels and titles | Actual browser paint, canvas bounds, clipping, opaque covers, separate title occurrence, exact flat-background camouflage and negligible alpha | Complex masks, filters, partial occlusion and general contrast need further projection; this is not an accessibility/aesthetics score |
| Graph nodes | Independent label/body ownership, extra-node checks, flat SVGs without wrapper classes, primitive rectangle-family/circle/ellipse/diamond outlines; ordinary/rounded boxes preserve a measured source distinction across cosmetic skins | Compound/symbolic shapes and external labels without geometric ownership stay unknown |
| Explicit label breaks | Source-owned node/participant, route/message, group and title rows measured from actual character rectangles; sibling text and tspans share one physical text-block contract; collapsed, hidden and borrowed-line controls | Note/fragment/box ownership, empty-line spacing and ambiguous glyph layouts remain unknown; this does not claim general typography correctness |
| Flowchart text inventory | Every actual visible text block has its unique authored node/group/route/title role; extra captions, annotations and repeated headers fail; a title cannot borrow a route caption | Unsupported text-bearing node attributes and ambiguous ownership remain unknown; other families need their own complete inventories |
| Graph relationships | Actual endpoint attachment, marker shape/orientation, exact multiplicity and route-owned labels; missing/reversed/detached/extra-route controls | Unbound, compound or unprojected glyphs stay unknown; physical-touch tolerances are explicit in each observation |
| Edge appearance | Solid/dotted stroke and actual marker semantics on a uniquely owned route | Parallel ambiguous pairs, thick-style baselines and animation stay unknown |
| Authored styles | Source class/default/inline node and link styles compile to owned fill/stroke RGBA, width and dash requests; actual Mermaid/Pele colors and renamed-prefix controls | Unsupported properties, unbound selectors, unresolved source style rules and ambiguous parallel routes retain unknown obligations |
| Class members | Complete body-owned access/name/type/argument/return signatures; type/name mutations, extra duplicate-header member, hidden/covered row controls | Generic, static/abstract decorations, annotations, cardinalities and note attachment require more observers |
| ER attributes | Complete entity-owned row/column type, name, key multiset and optional comment; wrong-type/key controls | Exact crow-foot/optional/identifying glyph meaning and ambiguous table grammar stay unknown |
| Sequence messages | Chronological actual route heights, owned endpoints/captions and filled solid/dashed or unheaded solid/dotted line style; order/style mutations | Other markers, lifecycles, participant kinds, note placement and fragment membership need their own evidence |
| Pie | Owned arc fractions and explicitly requested absolute legend values | Fractions do not attest unprinted absolute totals; complete legends/configuration remain separate |
| Sankey | Complete endpoint-owned flow proportions, adjacent node/value labels and requested value-printing behavior; wrong/borrowed numbers fail independently of geometry | Other label layouts, compound ribbons and unsupported appearance settings remain unknown |
| Treemap | Exact immediate rectangle containment, independently reconstructed sibling area partitions and separately owned printed safe integers | Nonuniform/unqualified tilings and other numeric formats remain unknown |
| XY, quadrant and radar | Actual numeric tick/category/legend/point/curve geometry and exact inventories; value/order/extra-series/borrowed-label/visibility controls | See retained chart fixtures: unprinted numeric bounds, annotations, grid variants and unsupported configuration remain unknown |
| Accessibility metadata | Exact standalone SVG ARIA name/description references | This does not certify screen-reader behavior or visual accessibility |

Fixture provenance and immutable hashes are in
[`tests/fixtures/fidelity/README.md`](../tests/fixtures/fidelity/README.md) and
[`tests/fixtures/qualified-charts/README.md`](../tests/fixtures/qualified-charts/README.md).
Specialized observers may replace a generic unavailable projection. Conflicting
decisive observations stop the assessment; a passing observer cannot hide a
failed one.

## Quantities in a drawing

The visual contract distinguishes encoded proportions from printed quantities.
Doubling every unprinted pie slice or Sankey flow leaves the same drawing and
receives the same geometric result. Treemap sibling areas include independently
derived subtree aggregates. The source inventory retains the original numbers;
the projection records which visible encoding is required.

Printed numbers remain separate checks. Pie needs them when `showData` is
requested. Sankey and treemap default to `showValues: true`; explicitly disabling
that option removes the absolute-value display obligation. Sankey prints each
node's maximum incoming/outgoing total rounded to two decimals, with the
requested prefix/suffix. Treemap currently qualifies default comma-formatted
safe integers, including derived group totals. Unsupported formatting remains
unknown. Configuration already represented by these checks does not create a
second source-text equality requirement.

Global direction also needs an explicit projection. A connected simple
flowchart chain without groups/local overrides has a defensible node-order
check. Branches, cycles and other families retain the literal enum in
`advisoryFacts`; it does not manufacture per-edge precedence or affect the
correctness denominator. The original native profile can still check its
parser's direction enum. Advisory observations are reported separately as
unknown until a qualified layout constraint exists.

The pinned defaults are public source, not inferred SVG behavior: Mermaid
[`config.schema.yaml`](https://github.com/mermaid-js/mermaid/blob/1fb7869866dd619168d840291c9c54b4f129758b/packages/mermaid/src/schemas/config.schema.yaml#L2701),
[`sankeyRenderer.ts`](https://github.com/mermaid-js/mermaid/blob/1fb7869866dd619168d840291c9c54b4f129758b/packages/mermaid/src/diagrams/sankey/sankeyRenderer.ts#L174),
and the treemap documentation's configuration table at the same source pin.

## Required work outside those profiles

The ledger retains all independently declared facts below. Passing labels or a
subset of quantitative criteria cannot remove them or supply full-family
credit. This matrix identifies proof gaps, not project defects.

| Family | Facts still needing complete visible projections |
| --- | --- |
| Flowchart | Compound/new shapes, explicit local layout constraints, image/icon ownership beyond decoded node-owned images, animation, configuration and authored styles; broad global direction remains advisory |
| Agentflow | Dialect shapes/kinds, role attributes, scope, configuration and layout |
| Use case | Actor/business/icon variants, relationship conventions, note attachment, configuration and layout |
| Swimlane | Exact lane order/membership, dialect kinds and lane-specific layout |
| Class | Generic/abstract/static/annotation semantics, exact cardinality label ownership, notes and namespace/style variants |
| ER | Exact cardinality/identification decorations, entity classes and constrained layouts |
| Sequence | Participant kinds/order, lifecycle markers, other arrow styles, complete notes and nested fragment/branch membership |
| State | Start/end/choice/fork/history glyphs, composite/parallel regions, state kinds, notes and local directions |
| Block | Full grid order, columns, row/column spans, anonymous groups and block arrows |
| C4 | Complete element properties and relation properties, person/container/component variants |
| Architecture | Exact side ports, junctions, icon identity and alignments |
| Requirement | Complete typed requirement/element definitions and relation variants |
| Event modeling | Complete frame order/content and data definitions |
| ZenUML | Complete event order, calls/returns, control regions, participant kinds and comments |
| Mindmap, tree view | Full ordered hierarchy, connector ownership, decorations and Markdown |
| Ishikawa | Full cause hierarchy and branch ownership |
| Git graph | Commit parents/types/tags, branches, operation order and layout direction |
| Timeline | Complete section/period/event grouping and chronology |
| Journey | Complete section/task/actor/absolute-score ownership; relative score order alone is insufficient |
| Gantt | Absolute calendar positions, exclusions, dependencies, milestones, status tags, sections and display mode; duration ratios alone are insufficient |
| Sankey | Unqualified ribbon/label representations, alternate appearance settings and value formats beyond the explicit printed-total profile |
| Treemap | Nonuniform partitions, unsupported numeric formatting and layouts without independently owned node rectangles |
| Packet | Absolute bit offsets, field spans and wrapped rows; relative cell widths alone are insufficient |
| Kanban | Column order/membership and complete card metadata |
| Pie | Full source styles/configuration and unsupported legend variants |
| XY chart | Numeric category axes, full range endpoints, annotations, configuration and unqualified series representations |
| Quadrant | Point appearance, region configuration and unqualified region/axis representations |
| Radar | Numeric range/ticks, noncircular grids, graticules and configuration |
| Venn | Exact sets/intersections, region text and configuration |
| Cynefin | Exact domain entries, domain transitions and ownership |
| Wardley | Component positions, evolution stages, links, pipelines, notes, annotation ownership and sizing |
| Railroad, ABNF, EBNF, PEG | Grammar alternatives/sequence/repetition/optionality, references and rule ownership |

Common visual configuration is a required fact wherever authored. Preserving
the YAML or CSS source does not demonstrate its visible effect. Unsupported
configuration must retain an unknown obligation until a checked projection
proves the corresponding output behavior.
