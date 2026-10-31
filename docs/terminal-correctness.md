# Terminal Rendering

Terminal Rendering uses [120 real project inputs](terminal-corpus.md), selected
from documentation, regression fixtures, issues and PRs. Research covers 18 pinned
repositories; 17 contribute selected inputs. The corpus covers 20 diagram families
plus invalid sources. It is a coverage sample, not production-frequency evidence.
[Origin roles](../corpus/terminal-origin-classification.json) distinguish 67 inputs
with terminal-specific evidence from 53 shared-renderer robustness inputs. Those
shared cases do not establish terminal user demand for their diagram families.

[Source contracts](../corpus/terminal-project-reviews.json) now bind all 120
sources to literal source bytes. They retain the complete source-fact ledger, including: node and relationship identities, group membership, captions,
direction, chart values, dates, hierarchy, cardinality and other family semantics.
Global and subgraph direction hints stay visible as unknown advisories. Only
simple directed chains establish required node-order constraints; branches, cross
edges, cycles and compact grouping do not imply a universal per-edge ordering.
The transcription reads source tokens; candidate output and renderer ASTs never
define expected facts. [The regeneration check](../scripts/review-terminal-contracts.ts)
reproduces the ledger without a renderer. Independent conformance review is still
required to qualify this transcription and its observers.

The v2 profile separates **116 positive drawing inputs** from **four invalid-source
controls**. Every positive input keeps its full obligations, including those with
no implemented output observer. Sixty-seven sources use facts for which an observer
exists in at least one bounded display representation. This diagnostic subset is
not a claim that 67 outputs pass, or a replacement for the 116-input denominator.

The four invalid controls are `terminal:321aee6efed4a803` (unquoted pie label),
`terminal:955cacf9438d691d` (unquoted Unicode Git branch references), and
`terminal:486d9d241d7bf98f` / `terminal:c8082a89c0a3e258` (no diagram family).
The source policy is pinned Mermaid syntax: pie sections require a quoted
[STRING label](https://github.com/mermaid-js/mermaid/blob/1fb7869866dd619168d840291c9c54b4f129758b/packages/parser/src/language/pie/pie.langium),
and bare Git
[references](https://github.com/mermaid-js/mermaid/blob/1fb7869866dd619168d840291c9c54b4f129758b/packages/parser/src/language/gitGraph/reference.langium)
use an ASCII `\w` grammar. This controls source compatibility, not the usefulness
of a renderer's language extensions. Accepting these controls cannot establish a
correct drawing; rejecting them requires typed public source evidence. A generic
process exit, missing dependency or unsupported family stays unknown.

## Run a small qualification

Mermaid ASCII is mandatory; the default second implementation is Termaid. Mermaid
checks source acquisition independently of the authored contracts.
It is an unscored source reference, never a fictional terminal renderer.

```sh
bun commands.ts bench --terminal --plan
bun commands.ts bench --terminal --community-prepared FROZEN.json --out FRESH_DIR
```

The default collects all 120 source inputs once per terminal renderer.
`--all-inputs` is an explicit alias for that inventory. Preparation must already contain the selected artifacts:
this profile performs no acquisition, build, warmup or repeated timing campaign.
Source-reference refusal does not automatically turn a dialect input into an
independently established invalid-source test.

An explicit `--projects ID,...` selection collects a targeted extension without
repeating the default cohort. Default and `--all-projects` runs include Mermaid
ASCII; every collection retains Mermaid as its unscored source reference. Keep a
repair's earlier evidence alongside the new attempt. Preparation freezes declared
installed package CLIs and authenticated release CLIs as separate transports;
their process boundaries do not imply speed equivalence with warm module APIs.

After fixing an observer, reuse the retained text:

```sh
bun commands.ts bench --terminal --saved-terminal SAVED_DIR --out NEW_DIR
```

Saved mode authenticates source identities, research origins, witnesses and the
recorded reference role. It requires neither Mermaid nor a terminal renderer and
can run in CI. Original collection clocks and producers stay separate from the
current observer. Add `--refresh-source-reference` for 120 parser-only reference
checks: old reference rows remain in history, and the result reports the new call
count separately from its zero renderer invocations. Saved v1 evidence may be
regraded into v2 only when the exact 120 source identities match. Its original
profile and collection clocks remain recorded. Results use the existing campaign
publication and snapshot path.

## What correctness establishes

The observer finds actual boxes and labels, traces continuous routes backward
from arrowheads and checks the exact directed-edge multiset. A shared stem needs
one unambiguous drawn source. Expected edges cannot choose a source at a junction.
Captions must belong to their traced routes, whether inline or adjacent. Declared
node-order constraints check LR/RL/TB/TD/BT orientation independently of connectivity.

[Tests](../tests/terminal-meaning.test.ts) perturb real retained output to reverse
arrows, break stems, change topology and detach captions. These are observer
controls, outside the real corpus score. The original four authored demonstration
graphs survive only as historical controls and fixtures.

The terminal interpreter observes cursor movement, carriage returns, erasure,
saved positions, concealment, foreground/background contrast and owned alternate
screens. It counts graphemes, combining text, emoji and wide characters in display
cells. Nondefault background painting, unsupported and ambiguous controls stay unknown; stripping escape codes
cannot recover text that is no longer visible. The canonical `expected-empty-drawing` feature comes from a source contract with
no nodes, relationships or other visible facts. It requires a real returned string
with no visible ink. Zero-node diagrams with a title retain that title; group ink
does not become an empty-source failure. Missing output and invalid UTF-8 stay
unknown. Byte evidence binds the original bytes before any text decoding.

| Source obligations | Qualified output representation | Remaining gaps |
|---|---|---|
| Basic flowchart node identities, exact directed relationships, captions and direction | Rectangular boxes; continuous orthogonal routes; uniquely owned captions; at most 32 nodes, 512 columns and 256 rows | Undirected or styled links, ambiguous junctions and larger drawings; broad direction hints remain separate advisories |
| Grouping and containment | Closed labelled frames, direct leaf membership and nested group parentage; real group endpoints and perpendicular wall crossings | Overlapping non-nested frames, ambiguous shared ports and unfamiliar border/label representations |
| Explicit node primitives and line breaks | Unique closed containers; unambiguous matching diamond/circle markers at corners or border midpoints; rounded/stadium boundaries; each authored line owns contiguous display rows | Arbitrary shape decorations, unfamiliar silhouettes and ambiguous repeated labels; blank authored lines need a padding projection |
| Pie labels and numeric weights | Owned label/bar/percentage rows, complete slice set, percentage precision and explicit displayed-quantum rounding | Circular/other chart representations and unassigned output ink |
| Journey tasks, scores, actors and sections | Ordered section/task rows with five explicit score cells and an owned actor row | Other representations and unassigned summary graphics |
| Timeline periods, events and sections | Ordered section headings, period bullets and owned event-tree rows | Other representations |
| Sequence participants, ordered messages, notes and fragment spans | Header boxes with continuous lifelines; straight solid/dashed message stems with filled triangle heads; owned adjacent captions; framed branch regions; exact multiline notes with actor span and chronology | Self-calls, diagonal or wrapped messages, nested fragments and other unqualified representations |
| Kanban column and card hierarchy | Column containers with a header/divider and independently enclosed cards; exact membership and order | Deeper nesting, repeated labels and other board representations |
| Isolated empty class bodies | Exact rectangular class containers with no members or relationships | Member compartments, generics and class relation markers |
| C4, ER, Gitgraph, mindmap, quadrant, treemap, Gantt, state, block, architecture, XY, ZenUML and packet obligations | Source facts are explicit | Output observers have not been qualified; text/number presence cannot pass these facts |
| Invalid source controls | Typed outcome API binds project, case, source hash, public boundary and observer identity | Python SyntaxError and Dart MermaidParseException retain typed public evidence; generic errors, UnsupportedError and CLI exits get no rejection credit |

[Sequence observer controls](../tests/terminal-sequence.test.ts) authenticate retained
outputs from three invocation boundaries and perturb endpoints, stroke, chronology,
branch membership, note ownership, extra content, lifeline continuity and ANSI state.
Their [provenance](../tests/fixtures/terminal/sequence-provenance.json) preserves
source, artifact, output and original receipt identities. These are checker tests,
not a new timing campaign.

[Group ownership controls](../tests/terminal-groups.test.ts) check actual
Mermaid ASCII, Termaid and Agentic Mermaid enclosure walls. A crossed wall cannot
supply source identity; a group endpoint needs its own drawn port. Nested parents
and overlapping frames have separate controls.

The [primitive and line-break controls](../tests/terminal-primitives.test.ts) use
authenticated Mermaid ASCII, Termaid and Agentic Mermaid output. They change
shape markers, merge authored lines, break port stems and reverse boundary
arrowheads. Symbolic shape annotations measure explicit shape meaning; they do
not establish a geometrically faithful silhouette or aesthetic quality.

Every required core fact receives passed, failed or unknown evidence. Unqualified
layout/style advisories remain unknown in a separate `advisories` field and
contribute no core correctness credit. A positive case
passes only when all of its obligations pass. Evidence binds the exact source,
expectations, terminal bytes and observer. A decisive observed failure can make a
case incorrect while other obligations remain unknown. Missing observers never
shrink the population.

Terminal Rendering is **not yet a qualified overall benchmark**. The dated
[qualification results](terminal-results-2026-10-31.md) describe their original
v1 scope and remain historical. Current v2 reports keep the positive and rejection
populations separate; diagnostic ranks order verified correct counts only.
Complete accuracy and comparable performance remain blocked by the missing
observers and unlike public invocation boundaries. This profile does not judge
typography, spacing, beauty or overall renderer quality.
