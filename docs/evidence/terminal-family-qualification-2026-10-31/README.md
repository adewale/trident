# Remaining terminal family observers

The new `terminal-family-*.ts` observers cover the 19 audited positive inputs for
C4, Gitgraph, block, architecture, Gantt, XY, mindmap, quadrant, treemap, packet and
ZenUML. They consume interpreted display cells and independently owned geometry.
No renderer, AST, source-reference agreement, model or network access is used by
the checker. Sources and required facts are unchanged.

The [receipt](receipt.json) rereads all 342 original retained outputs for these
19 inputs across the same 18 projects. It records 17 correct, 14 incorrect and
311 unknown outputs. Thirteen inputs have at least one genuine retained positive.
These counts belong to this extension, not the full 116-input drawing population.
No new renderer or performance calls were made. Original collection clocks stay
separate from missing original per-call clocks, which remain null.

[Control provenance](../../../tests/fixtures/terminal/family-provenance.json)
binds the original raw receipt, sources, artifact identities, public invocation
boundaries and bytes for all 19 retained fixtures. The
[tests](../../../tests/terminal-family-facts.test.ts) perturb roles, captions,
connectivity, chronology, branch/merge provenance, nesting, containment, port
selection, dates, numeric axes, chart geometry and bit widths. Source echoes,
empty strings, concealed ink and unassigned text cannot establish a full pass.

The qualified representations are:

- C4: closed role/label/description containers, explicit database/external markers,
  nested boundary frames, continuous directed routes and owned multiline captions.
- Gitgraph: vertical commit/branch/merge stems with owned IDs/tags and branch-head
  names; horizontal tracks with continuous branch/cherry-pick provenance. Checkout
  operations are projected through the resulting branch heads and commit parents.
- Block: dense unit rows expose column capacity; full and partial rows must align
  to the same unit boundaries, including database primitives and enclosing groups.
- Architecture: framed groups, explicit icon labels, service containers and traced
  routes whose contact walls establish both ports.
- Mindmap: explicit circle root and a continuous ordered elbow/tee tree.
- Quadrant: framed coordinate space, quadrant regions, ordered axis endpoints and
  a numeric legend that uniquely matches quantized plot dots. A legend alone fails.
- Treemap: exact label/weight rows in closed nested regions; sibling geometry and
  area proportions are checked with cell-edge quantization bounds.
- Gantt: ordered section/task/date/status rows with a common linear time-bar scale.
  Dependencies and milestone instants/durations require explicit owned annotations.
- XY: continuous bars, exact owned category ticks, orientation and independently
  calibrated numeric axes; each value retains the displayed cell-quantization interval.
- Packet: continuous field walls, owned endpoint bit labels and one proportional
  cell scale across rows.
- ZenUML: role compartments, continuous lifelines, synchronous filled heads,
  recipient activation bars and returns establish method arguments and stack depth.

Six inputs have no qualified real positive in the retained collection:

| Case | What the retained evidence establishes |
|---|---|
| `terminal:263ec71ab0c651b3` | Termaid truncates `Auth` as `Au…`; the exact label obligation fails. |
| `terminal:b1428b5b59888938` | Inspectable architecture drawings omit or break requested routes, and some omit the title or icons. |
| `terminal:d7362afef7c26051` | No genuine ZenUML drawing is retained. Termaid boxes source statements; other outputs are absent/errors or outside the qualified representation. |
| `terminal:276c8474274911fa` | Visible schedule rows omit dependency provenance and the milestone's duration/instant. Coincident dates do not establish these facts. |
| `terminal:39d5de95eb42396b` | One small block cannot expose an unused capacity of 1000 columns. The capacity obligation stays unknown. |
| `terminal:a181524246065697` | Uniformly spanned outer rows do not distinguish four columns with spans of two from two columns with spans of one. The absolute capacity obligation stays unknown. |

The three additional files ending in `-synthetic.txt` are explicitly authored
checker controls. The UML sequence and proportional treemap are standalone drawn
examples; the schedule adds visible dependency/milestone annotations to a retained
chart. They are not attributed to a renderer, have no fabricated invocation clocks
or artifact identity, and never enter the retained-output receipt or real corpus
score. Their negative controls independently alter semantic content and geometry.
