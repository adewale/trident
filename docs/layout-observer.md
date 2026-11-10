# Flowchart SVG layout observer

`layout:observe` measures layout geometry from retained Drawing SVG outputs.
It does not invoke renderers or alter Drawing Correctness, Mermaid Fidelity,
DaveBench or the published overall scores. It needs Bun, the locked dependencies
and Chromium; no Mermaid reference installation is required.

```sh
# Use an existing completed raw Drawing run with results.json and outputs/.
bun commands.ts layout:observe --run RAW_DRAWING_DIRECTORY --out FRESH_DIRECTORY

# Compare a selected set of renderers on their shared assessed cases.
bun commands.ts layout:observe --run RAW_DRAWING_DIRECTORY --out FRESH_DIRECTORY \
  --projects mermaid-js/mermaid,obsidianmd/pele

# The published capture is also a raw run. Extract it before observing it.
mkdir retained-drawings
tar -xzf results/release/captures/drawing-capture-2026-11-09.tar.gz -C retained-drawings
bun commands.ts layout:observe --run retained-drawings/drawing-retained --out layout-observations
```

The output directory must be new. `results.json` contains per-case geometry,
findings with object identities and locations, coverage, observer policy and
source hashes, original source/output hashes, input run hash, viewport and browser
identity. `observations.md` is a readable comparison. The original capture and
its collection time remain unchanged. The observer validates the capture against
the current Drawing source contract and verifies retained bytes before reading
them; tampered bindings abort the run.

## Measurements

| Metric | Unit and scope |
| --- | --- |
| `crossings` | Distinct transverse contacts between different sampled edge centerlines; repeated sample contacts at one location count once per pair |
| `sharedPaths` | Edge pairs sharing a collinear centerline section longer than the contact tolerance |
| `crowdedParallelPaths` | Edge pairs with nearby parallel straight sections; findings retain the measured gap and projected span |
| `nodeOverlaps` | Pairs of measured node interiors that overlap |
| `edgeNodeIntersections` | Edge–node pairs where a centerline enters an unrelated node interior |
| `edgeEndpointNodeIntersections` | Edge–node pairs where a route enters its own source/target interior beyond a bounded terminal allowance |
| `labelOverlaps` | Pairs of measured text layout bounds that overlap |
| `edgeLabelIntersections` | Edge–label pairs where a centerline enters another object's caption bounds |
| `labelNodeOverlaps` | Caption–node pairs where caption bounds overlap an unrelated node interior |
| `edgeGroupTitleIntersections` | Edge–group pairs where a route enters the measured title bounds |
| `labelGroupBorderIntersections` | Caption–group pairs where a frame cuts through caption bounds |
| `nodeGroupBorderIntersections` | Node–group pairs where a frame cuts through a node interior |
| `labelMarkerOverlaps` | Caption–marker pairs where caption bounds overlap a measured filled marker contour, including a caption's own arrowhead |

Policy `flowchart-svg-layout-v2` adds these clearance observations. Version 1
reports remain historical observations and are not directly interchangeable.

The endpoint-node metric exempts only the first/last eight CSS pixels **along the
route** at the corresponding endpoint. Later re-entry near the same port remains
observable. Foreign-node intersections have no endpoint exemption. An edge's own
caption remains excluded from the edge/label metric, but its actual marker can
still overlap that caption. Crossings exclude terminal contacts, T junctions
and tangencies. Nonplanar graphs can require crossings, and shared paths can be
intentional. Label bounds include font space and are a conservative geometric
observation, not proof of pixel occlusion. Counts are diagnostic measurements,
not automatic correctness failures or an overall quality score.

Crowded parallel sections need at least eight pixels of projected overlap, a
separation above the 0.5-pixel contact tolerance and below seven pixels, and a
direction difference with sine at most 0.01. Directions need not be horizontal
or vertical. First/last straight sections sharing the same source or target node
are exempt as legitimate terminal fans; later rails receive no exemption.
Group containment and ordinary route crossings of a group frame are allowed.
Group title checks use actual measured title bounds, not an invented title band.

## Observation and coverage

The existing paint observer binds actual node bodies and routes to reviewed
source objects. The layout observer re-identifies those physical elements,
measures contours and route samples with browser SVG geometry APIs, and measures
SVG text or HTML caption bounds. A renderer's IDs, internal layout model and
Mermaid's reference coordinates do not supply geometry. A source inventory
mismatch keeps dependent metrics unassessed, so dropping an edge cannot earn a
better crossing count.

Initial support is flowchart SVGs with uniquely identifiable primitive node
bodies (`rect`, `circle`, `ellipse`, `polygon`), single-subpath edge routes and
uniquely owned visible captions. Curves and diagonal routes are allowed. Compound
body paths, glyph-only labels, ambiguous ownership, clipped/filtered/animated
geometry and source gaps remain unassessed. A single source-preserving SVG
`feDropShadow` with an enclosing filter region is admitted; its shadow is not
measured. Group frames initially support uniquely identified rectangles and
simple polygons. Captions include source-owned group titles, so their presence
does not itself create a label-inventory gap. A failed group containment check
does not erase witnessed frame/node collisions.

Marker observation supports a single opaque filled primitive or closed
single-contour path referenced at the start/end of an edge. It measures the
actual marker contour with reference-point translation, automatic/fixed rotation,
`auto-start-reverse`, `markerUnits`, the marker viewBox and the edge's screen
transform. Supported viewBoxes use centered `meet` scaling. Compound, open,
clipped or internally transformed markers, unsupported viewports and inline
decorations remain unassessed. Self-crossings, marker-mid, stroke thickness,
shadows and pixel-level occlusion are outside the measurement contract.

Nodes, edges, captions, groups and markers each have their own coverage record.
A marker-only gap leaves otherwise qualified crossing counts available, and an
unsupported group does not erase available node/edge geometry. Only dependent
metrics become unassessed; missing endpoint or relationship ownership can still
leave route metrics unassessed. Orthogonality, corner connections, port directions and short terminal
approach rules are not imposed: they would need a separately selected routing
profile. The observer still supports flowcharts only.

Coordinates are CSS pixels at a fixed 1600×1200 viewport and device scale 1.
Contours are sampled at a nominal 0.5 CSS-pixel step and simplified at 0.1 pixels;
contact tolerance is 0.5 pixels. These are approximations, not certified exact
curve intersections. Differences near these thresholds are unresolved. Sampling,
elements, pairwise work and per-case time have explicit bounds; exceeding them
leaves the case unassessed rather than supplying zero. The observer blocks network
requests and disables page JavaScript and service workers.

Each metric reports its own coverage and partial observed findings. An unassessed
metric has `value: null`; its `observed` count is diagnostic and does not enter
comparison totals. For each metric, the report intersects the assessed case IDs
across every selected project and sums only that common set. It lists those IDs
and the coverage denominator. With no common assessed cases, totals read
`unassessed`. Compare identical policies, viewports and selections; these totals
do not establish quality for unobserved cases or different graphs.

## Validation and upstream candidate

`tests/layout-observer.test.ts` uses independently authored shapes and a hand-drawn
SVG with no renderer IDs or classes. Controls cover crossings, shared endpoints,
T junctions, tangencies, containment, disjoint contours with overlapping bounding
boxes, label collisions, unrelated-node penetration, curves, transforms, missing
routes, unsupported effects, source gaps and capture tampering.
`tests/layout-clearance.test.ts` adds endpoint re-entry (including targets and
self-loops), normal attachments, terminal allowances, parallel-rail separation,
legitimate terminal fans, group containment and title/frame collisions, actual
marker placement, transforms, and unsupported-marker coverage controls.

[Adapted upstream fixtures](../tests/fixtures/layout/upstream-clearance.json)
retain numeric regression vectors from Mermaid's validator tests at the commit
below, with provenance and the MIT notice in their directory. They include the
reported D→H own-node re-entry and close/separated swimlane rails. Independently
drawn SVG fixtures exercise extraction as well as the geometry kernel.

Mermaid's MIT-licensed `validateLayout` was evaluated at commit
`b7080e16a4ae2f72670c25c5883d182b1e3bf266`. It consumes Mermaid's internal
`LayoutData` and applies orthogonal-routing and port rules. This observer implements
the neutral geometry measurements independently rather than importing that full
verdict or its weighted score. It imposes no orthogonal-routing preference.
