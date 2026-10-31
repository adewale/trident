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
| Graph nodes | Independent label/body ownership, extra-node checks, flat SVGs without wrapper classes, primitive rectangle/rounded/circle/ellipse/diamond outlines | Compound/symbolic shapes and external labels without geometric ownership stay unknown |
| Graph relationships | Actual endpoint attachment, marker shape/orientation, exact multiplicity and route-owned labels; missing/reversed/detached/extra-route controls | Unbound, compound or unprojected glyphs stay unknown; physical-touch tolerances are explicit in each observation |
| Edge appearance | Solid/dotted stroke and actual marker semantics on a uniquely owned route | Parallel ambiguous pairs, thick-style baselines and animation stay unknown |
| Class members | Complete body-owned access/name/type/argument/return signatures; type/name mutations, extra duplicate-header member, hidden/covered row controls | Generic, static/abstract decorations, annotations, cardinalities and note attachment require more observers |
| ER attributes | Complete entity-owned row/column type, name, key multiset and optional comment; wrong-type/key controls | Exact crow-foot/optional/identifying glyph meaning and ambiguous table grammar stay unknown |
| Sequence messages | Chronological actual route heights, owned endpoints/captions and filled solid/dashed arrow style; order/style mutations | Other markers, lifecycles, participant kinds, note placement and fragment membership need their own evidence |
| Pie | Owned arc fractions and explicitly requested absolute legend values | Fractions do not attest unprinted absolute totals; complete legends/configuration remain separate |
| XY, quadrant and radar | Actual numeric tick/category/legend/point/curve geometry and exact inventories; value/order/extra-series/borrowed-label/visibility controls | See retained chart fixtures: unprinted numeric bounds, annotations, grid variants and unsupported configuration remain unknown |
| Accessibility metadata | Exact standalone SVG ARIA name/description references | This does not certify screen-reader behavior or visual accessibility |

Fixture provenance and immutable hashes are in
[`tests/fixtures/fidelity/README.md`](../tests/fixtures/fidelity/README.md) and
[`tests/fixtures/qualified-charts/README.md`](../tests/fixtures/qualified-charts/README.md).
Specialized observers may replace a generic unavailable projection. Conflicting
decisive observations stop the assessment; a passing observer cannot hide a
failed one.

## Required work outside those profiles

The ledger retains all independently declared facts below. Passing labels or a
subset of quantitative criteria cannot remove them or supply full-family
credit. This matrix identifies proof gaps, not project defects.

| Family | Facts still needing complete visible projections |
| --- | --- |
| Flowchart | Compound/new shapes, local layout constraints, image/icon ownership beyond decoded node-owned images, animation, configuration and authored styles |
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
| Sankey | Exact endpoint-owned quantities, complete inventory and scale; relative thickness alone cannot recover unprinted absolute totals |
| Treemap | Complete hierarchy and value inventory; sibling area fractions do not attest unprinted absolute values |
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
