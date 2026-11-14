// Reviewed native schema views for out-of-process parser bridges.
//
// Each view reads one project's own parser model, field by field, and answers the
// Mermaid database getters the original tests call. Every mapping below was checked
// against the project's own type definitions or parser source at the pinned version.
// A view never parses source text, never re-splits a display string into fields and
// never fills in a value the native model does not carry:
//   - a field the model carries under another name or encoding is translated, including
//     an encoding by omission that the project's own types or parser document (OpenCode
//     omits a note's 'over' placement; zombie-mermaid omits the marker of a plain
//     arrowhead), and a structural root the model expresses by having no parent
//     (Mermaid's C4 'global' boundary, a state document's 'root');
//   - the one exception: where the model leaves a value unset because the source did not
//     write it, and Mermaid's own parser stores a documented default for that same
//     unwritten value, the view reads Mermaid's default (direction 'TB', a sequence box's
//     'transparent' fill, an untyped C4 Boundary's 'system', a commit's NORMAL type, a
//     state's 'default' type, '' for unwritten text). The native model must establish that
//     the value was unwritten: a model that keeps no such field at all gets no default;
//   - a concept the model does not carry at all is declared absent with its reason,
//     and reading it is that project's unsupported operation (unassessed in scoring,
//     scoring.ts);
//   - anything else the tests read stays a Trident gap.


const entriesOf = value => value instanceof Map ? [...value] : value && typeof value === 'object' ? Object.entries(value) : []

/** A Mermaid-shaped record. Reading a declared-absent field is unsupported; reading a
 * field the tests expect but the view has not mapped is a Trident gap. */
function record(object, label, expected, absent, hooks, always = []) {
  const missing = key => {
    if (typeof key !== 'string' || key in object) return false
    if (absent[key]) return hooks.unsupported(absent[key])
    if (expected.includes(key)) return hooks.unavailable(label + '.' + key)
    return false
  }
  // A declared-absent field that Mermaid's record always has (C4 wrap) is listed among the
  // record's keys, so inspecting the whole record (toEqual, a snapshot) reads it and is
  // unsupported, rather than failing on a key count.
  const listed = always.filter(key => absent[key] && !(key in object))
  return new Proxy(object, {
    get(target, key) { if (!(key in target)) missing(key); return target[key] },
    has(target, key) { if (!(key in target)) missing(key); return key in target },
    getOwnPropertyDescriptor(target, key) { if (!(key in target)) missing(key); return Object.getOwnPropertyDescriptor(target, key) },
    ...(listed.length ? { ownKeys: target => [...Reflect.ownKeys(target), ...listed] } : {}),
  })
}

const VERTEX_FIELDS = ['type', 'styles', 'classes', 'labelType', 'props', 'link', 'linkTarget', 'haveCallback', 'tooltip', 'domId']
const EDGE_FIELDS = ['type', 'stroke', 'length', 'interpolate', 'style', 'classes', 'labelType', 'id', 'animate', 'animation', 'isUserDefinedId']
const SUBGRAPH_FIELDS = ['id', 'nodes', 'title', 'classes', 'dir', 'labelType']

// Mermaid's own vocabularies, keyed by each native spelling (folded to lower case).
const SHAPE = {
  rect: 'square', rectangle: 'square', shaperect: 'square',
  round: 'round', rounded: 'round', roundrect: 'round', roundedrect: 'round', shaperound: 'round',
  diamond: 'diamond', shapediamond: 'diamond',
  stadium: 'stadium', subroutine: 'subroutine', cylinder: 'cylinder', circle: 'circle',
  doublecircle: 'doublecircle', double_circle: 'doublecircle', hexagon: 'hexagon',
  asymmetric: 'odd', parallelogram: 'lean_right', parallelogram_alt: 'lean_left', parallelogramalt: 'lean_left',
  leanright: 'lean_right', leanleft: 'lean_left', trapezoid: 'trapezoid', trapezoid_alt: 'inv_trapezoid',
  trapezoidalt: 'inv_trapezoid', invtrapezoid: 'inv_trapezoid', ellipse: 'ellipse',
}
const shapeOf = shape => (typeof shape === 'string' ? SHAPE[shape.toLowerCase()] : undefined)
const HEAD = { arrow: 'point', point: 'point', none: 'none', circle: 'circle', cross: 'cross' }
const headOf = head => (typeof head === 'string' ? HEAD[head.toLowerCase().replace(/^head/, '')] : undefined)
const STROKE = { solid: 'normal', normal: 'normal', dotted: 'dotted', dashed: 'dotted', thick: 'thick', invisible: 'invisible' }
const strokeOf = line => (typeof line === 'string' ? STROKE[line.toLowerCase().replace(/^line/, '')] : undefined)
const DIRECTION = { down: 'TB', topdown: 'TB', tb: 'TB', td: 'TB', up: 'BT', bottomtop: 'BT', bottomup: 'BT', bt: 'BT', right: 'LR', leftright: 'LR', lr: 'LR', left: 'RL', rightleft: 'RL', rl: 'RL' }
const directionOf = dir => (typeof dir === 'string' ? DIRECTION[dir.toLowerCase().replace(/^dir/, '')] : undefined)
/** Mermaid's edge type from the two native end markers; a start-only or mixed pair has none. */
function edgeType(from, to) {
  if (!from || !to) return undefined
  if (from === 'none') return { point: 'arrow_point', circle: 'arrow_circle', cross: 'arrow_cross', none: 'arrow_open' }[to]
  return from === to ? { point: 'double_arrow_point', circle: 'double_arrow_circle', cross: 'double_arrow_cross' }[to] : undefined
}
const styleStrings = styles => entriesOf(styles).filter(([, value]) => value !== null && value !== undefined).map(([key, value]) => `${key}:${value}`)

/** A vertex may name fields absent for that vertex alone. */
const VERTEX_ABSENT = Symbol('absent for this vertex')
/** One flowchart view from a project-specific reading of nodes, edges and groups. */
function flowchartView(model, hooks) {
  const { nodes, edges, subgraphs, direction, absent } = model
  const vertex = (id, fields) => { const { [VERTEX_ABSENT]: only, ...rest } = fields; return record({ id, labelType: 'text', ...rest }, 'vertex', VERTEX_FIELDS, { ...(absent.vertex ?? {}), ...(only ?? {}) }, hooks) }
  const view = {}
  view.getVertices = () => new Map(nodes().map(([id, fields]) => [id, vertex(id, fields)]))
  view.getEdges = () =>
    edges().map(fields => {
      // An edge may name fields absent for that edge alone (VERTEX_ABSENT).
      const { [VERTEX_ABSENT]: only, ...rest } = fields
      if (rest.type === undefined && !(absent.edge ?? {}).type && !(only ?? {}).type) return hooks.unavailable('Unmapped native flowchart edge markers')
      return record({ text: '', labelType: 'text', ...rest }, 'edge', EDGE_FIELDS, { ...(absent.edge ?? {}), ...(only ?? {}) }, hooks)
    })
  if (subgraphs) view.getSubGraphs = () => subgraphs().map(fields => record(fields, 'subgraph', SUBGRAPH_FIELDS, absent.subgraph ?? {}, hooks))
  else if (absent.getSubGraphs) view.getSubGraphs = () => hooks.unsupported(absent.getSubGraphs)
  if (direction !== undefined) view.getDirection = () => direction
  return view
}

/** Grok's mermaid.rs, its Go port MermaidText and Loom keep a graph of index-addressed
 * nodes with an id -> index table, end markers per edge and group indexes per node. */
function indexGraph(graph, project, hooks) {
  const ids = []
  for (const [id, index] of entriesOf(graph.index)) if (ids[index] === undefined) ids[index] = id
  if (graph.nodes.some((_node, index) => ids[index] === undefined)) return hooks.unavailable('Native node without an identity in the index table')
  const groupOf = graph.node_group ?? graph.nodeGroup ?? []
  const loom = project === 'Yassimba/loom'
  const name = { 'xai-org/grok-build': 'Grok', 'spacedock-dev/mermaidtext': 'MermaidText', 'Yassimba/loom': 'Loom' }[project]
  return {
    nodes: () => graph.nodes.map((node, index) => [ids[index], { text: node.label, ...(shapeOf(node.shape) ? { type: shapeOf(node.shape) } : {}), ...(loom ? { classes: node.classes ?? [] } : {}) }]),
    edges: () =>
      graph.edges.map(edge => ({
        start: ids[edge.from],
        end: ids[edge.to],
        text: edge.label ?? '',
        type: edgeType(headOf(edge.head_from ?? edge.headFrom), headOf(edge.head_to ?? edge.headTo)),
        stroke: strokeOf(edge.line),
      })),
    subgraphs: () =>
      graph.groups.map((group, index) => ({
        id: group.id,
        title: group.label,
        nodes: [...ids.filter((_id, node) => groupOf[node] === index), ...graph.groups.filter(child => child.parent === index).map(child => child.id)],
      })),
    direction: directionOf(graph.dir),
    absent: {
      vertex: {
        styles: `${name}'s graph model keeps no per-node styles`,
        ...(loom ? {} : { classes: `${name}'s graph model keeps no node classes` }),
        link: `${name}'s graph model keeps no click links`,
        tooltip: `${name}'s graph model keeps no tooltips`,
      },
      edge: { length: `${name}'s edge model has no link length`, style: `${name}'s edge model keeps no link styles`, interpolate: `${name}'s edge model keeps no curve` },
      subgraph: { dir: `${name}'s group model has no direction`, classes: `${name}'s group model has no classes` },
    },
  }
}

// mermaid-rs-renderer: crates' ir.rs NodeShape/EdgeStyle/EdgeDecoration enums.
function mmdrGraph(graph, hooks) {
  const ends = (arrow, decoration) => (decoration ? headOf(decoration) : arrow ? 'point' : 'none')
  return {
    nodes: () => entriesOf(graph.nodes).sort((a, b) => (graph.node_order?.[a[0]] ?? 0) - (graph.node_order?.[b[0]] ?? 0)).map(([id, node]) => [id, { text: node.label, ...(shapeOf(node.shape) ? { type: shapeOf(node.shape) } : {}), classes: graph.node_classes?.[id] ?? [] }]),
    edges: () => graph.edges.map(edge => ({ start: edge.from, end: edge.to, text: edge.label ?? '', type: edgeType(ends(edge.arrow_start, edge.start_decoration), ends(edge.arrow_end, edge.end_decoration)), stroke: strokeOf(edge.style) })),
    subgraphs: () => graph.subgraphs.map(group => ({ id: group.id, title: group.label, nodes: group.nodes })),
    direction: directionOf(graph.direction),
    absent: { edge: { length: "mermaid-rs-renderer's edge model has no link length" } },
  }
}

// mermaid_core 0.3.2 (Mermaid Dart and Mermaid Flutter): FlowNodeShape, ArrowHead, EdgeStroke.
function dartGraph(graph) {
  return {
    nodes: () => entriesOf(graph.nodes).map(([id, node]) => [id, { text: node.label, ...(node.shape === 'plain' ? { type: undefined } : shapeOf(node.shape) ? { type: shapeOf(node.shape) } : {}), classes: node.classes ?? [], styles: styleStrings(node.styles), link: node.link ?? undefined, tooltip: node.tooltip ?? undefined }]),
    edges: () => graph.edges.map(edge => ({ start: edge.from, end: edge.to, text: edge.label ?? '', type: edgeType(headOf(edge.headFrom), headOf(edge.headTo)), stroke: strokeOf(edge.stroke), length: edge.minLen, ...(edge.interpolate ? { interpolate: edge.interpolate } : {}), style: styleStrings(edge.styles) })),
    subgraphs: () => graph.subgraphs.map(group => ({ id: group.id, title: group.title, nodes: group.nodeIds, dir: group.direction ? group.direction.toUpperCase() : undefined })),
    direction: directionOf(graph.direction),
    absent: {},
  }
}

// figurehead: plugins/flowchart EdgeType and NodeShape (its own tests document `--o` as OpenArrow).
const FIGUREHEAD_EDGE = { Arrow: ['arrow_point', 'normal'], Line: ['arrow_open', 'normal'], DottedArrow: ['arrow_point', 'dotted'], DottedLine: ['arrow_open', 'dotted'], ThickArrow: ['arrow_point', 'thick'], ThickLine: ['arrow_open', 'thick'], Invisible: ['arrow_open', 'invisible'], OpenArrow: ['arrow_circle', 'normal'], CrossArrow: ['arrow_cross', 'normal'] }
function figureheadGraph(graph) {
  return {
    nodes: () => entriesOf(graph.nodes).map(([id, node]) => [id, { text: node.label, ...(shapeOf(node.shape) ? { type: shapeOf(node.shape) } : {}), classes: node.classes ?? [] }]),
    edges: () => graph.edges.map(edge => ({ start: edge.from, end: edge.to, text: edge.label ?? '', type: FIGUREHEAD_EDGE[edge.edge_type]?.[0], stroke: FIGUREHEAD_EDGE[edge.edge_type]?.[1] })),
    subgraphs: () => (graph.subgraphs ?? []).map(group => ({ id: group.id, title: group.label ?? group.title ?? group.id, nodes: group.nodes ?? group.node_ids ?? [] })),
    direction: directionOf(graph.direction),
    absent: { edge: { length: "figurehead's edge model has no link length" } },
  }
}

// termaid: graph/model.py NodeShape, EdgeStyle and ArrowType; one style class per node.
function termaidGraph(graph) {
  const end = (has, kind) => (has ? headOf(kind) : 'none')
  return {
    nodes: () => entriesOf(graph.nodes).map(([id, node]) => [id, { text: node.label, ...(shapeOf(node.shape) ? { type: shapeOf(node.shape) } : {}), classes: node.style_class ? [node.style_class] : [], styles: styleStrings(graph.node_styles?.[id]) }]),
    edges: () => graph.edges.map(edge => ({ start: edge.source, end: edge.target, text: edge.label ?? '', type: edgeType(end(edge.has_arrow_start, edge.arrow_type_start), end(edge.has_arrow_end, edge.arrow_type_end)), stroke: strokeOf(edge.style), length: edge.min_length })),
    subgraphs: () => (graph.subgraphs ?? []).map(group => ({ id: group.id, title: group.label, nodes: [...(group.node_ids ?? []), ...(group.children ?? []).map(child => child.id ?? child)] })),
    direction: directionOf(graph.direction),
    absent: {},
  }
}

// Latias94/merman mirrors Mermaid's own field names; Rust's None arrives as null where
// Mermaid leaves the field undefined, and a plain node carries shape null.
const unset = object => Object.fromEntries(Object.entries(object).map(([key, value]) => [key, value === null ? undefined : value]))
function latiasGraph(graph) {
  return {
    nodes: () => graph.nodes.map(node => [node.id, { ...unset(node), text: node.label, type: node.shape ?? undefined }]),
    edges: () => graph.edges.map(edge => ({ ...unset(edge), start: edge.from, end: edge.to, text: edge.label ?? '' })),
    subgraphs: () => graph.subgraphs.map(group => unset(group)),
    direction: graph.direction,
    absent: {},
  }
}

// mermaid-ascii pkg/graph: nodeSpecs for nodes, an adjacency map for edges; it parses no
// node shapes (a shape bracket becomes part of the node name).
function asciiGraph(graph, _project, hooks) {
  return {
    nodes: () =>
      entriesOf(graph.nodeSpecs).map(([id, spec]) => {
        if (spec.label.lines.length !== 1) return hooks.unavailable('Multi-line mermaid-ascii label')
        return [id, { text: spec.label.lines[0], classes: spec.styleClass ? [spec.styleClass] : [] }]
      }),
    edges: () => entriesOf(graph.data).flatMap(([, list]) => list.map(edge => ({ start: edge.parent.name, end: edge.child.name, text: edge.label ?? '', type: edgeType(edge.isBidirectional ? headOf(edge.head) : 'none', headOf(edge.head)), stroke: strokeOf(String(edge.stroke).replace(/^stroke/, '')) }))),
    subgraphs: () => (graph.subgraphs ?? []).map(group => ({ id: group.id, title: group.name, nodes: [...(group.nodes ?? []), ...(group.children ?? []).map(child => child.id ?? child)] })),
    direction: directionOf(graph.graphDirection),
    absent: { vertex: { type: 'mermaid-ascii parses no node shapes', styles: 'mermaid-ascii keeps no per-node styles' }, edge: { length: "mermaid-ascii's edge model has no link length" } },
  }
}

// XMermaid parse_dsl flowchart: a node's label is null when the source gave none (Mermaid's
// text is then the id, and a bare node has no shape: XMermaid reports it as 'rect');
// each edge has a stroke-and-arrow style word ('arrow' is a solid line ending in an
// arrowhead) with optional start/end markers; linkStyle rules are kept by edge index;
// subgraphs nest. Its resolved per-node style merges classDef and style statements.
// Mermaid has no start-only edge type: such an edge keeps its own spelling.
const XMERMAID_STROKE = { arrow: 'normal', line: 'normal', dotted: 'dotted', thick: 'thick', invisible: 'invisible' }
function xmermaidGraph(graph, _project, hooks) {
  const flat = []
  const walk = group => {
    for (const child of group.subgraphs ?? []) walk(child)
    flat.push({ id: group.id, title: group.title ?? group.id, nodes: [...(group.nodes ?? []), ...(group.subgraphs ?? []).map(child => child.id)] })
  }
  for (const group of graph.subgraphs ?? []) walk(group)
  const linkStyles = graph.link_styles ?? []
  return {
    nodes: () => graph.nodes.map(node => [node.id, { text: node.label ?? node.id, ...(node.label == null && node.shape === 'rect' ? { type: undefined } : shapeOf(node.shape) ? { type: shapeOf(node.shape) } : {}), classes: node.classes ?? [] }]),
    edges: () =>
      graph.edges.map((edge, index) => {
        const end = edge.end_marker ? headOf(edge.end_marker) : edge.style === 'arrow' ? 'point' : 'none'
        const start = edge.start_marker ? headOf(edge.start_marker) : 'none'
        const rules = linkStyles.filter(rule => rule.targets_default || rule.indices?.includes(index))
        if (rules.some(rule => rule.targets_default)) return hooks.unavailable('XMermaid linkStyle default rule')
        return { start: edge.from, end: edge.to, text: edge.label ?? '', type: edgeType(start, end) ?? (end === 'none' && start ? 'xmermaid:start-only-' + start : undefined), stroke: XMERMAID_STROKE[edge.style], length: edge.min_length, style: rules.length ? rules.flatMap(rule => styleStrings(rule.style)) : undefined }
      }),
    subgraphs: () => flat,
    direction: directionOf(graph.direction),
    absent: {
      vertex: { styles: "XMermaid keeps one resolved node style that merges classDef and style statements", link: "XMermaid's flowchart model keeps no click links", tooltip: "XMermaid's flowchart model keeps no tooltips" },
      edge: { id: "XMermaid's edge model keeps no edge ids", interpolate: "XMermaid's edge model keeps no curve", animate: "XMermaid's edge model keeps no animation" },
      subgraph: { dir: "XMermaid's subgraph model keeps no direction", classes: "XMermaid's subgraph model keeps no classes" },
    },
  }
}

// Frankenmermaid 0.4.0 flowchart IR: nodes with a label index (none for a bare node, whose
// shape is still 'Rect'), a NodeShape word and classes ('has-link' marks a node with a
// click link); edges with one ArrowType word naming the line and both ends; subgraphs in
// graph.subgraphs with their source key, children and members (nested members included);
// style statements kept per target in style_refs. Edges keep no length or id.
const FRANKEN_SHAPE = { Rect: 'square', Rounded: 'round', Stadium: 'stadium', Subroutine: 'subroutine', Cylinder: 'cylinder', Circle: 'circle', DoubleCircle: 'doublecircle', Diamond: 'diamond', Hexagon: 'hexagon', Parallelogram: 'lean_right', InvParallelogram: 'lean_left', Trapezoid: 'trapezoid', InvTrapezoid: 'inv_trapezoid', Asymmetric: 'odd' }
function frankenArrow(word) {
  const match = /^(Double)?(Dotted|Thick)?(Arrow|Line|Circle|Cross)(Both)?$/.exec(word ?? '')
  if (word === 'Invisible') return ['arrow_open', 'invisible']
  if (!match) return []
  const [, double, line, end, both] = match
  const head = { Arrow: 'point', Circle: 'circle', Cross: 'cross', Line: 'none' }[end]
  return [edgeType(double || both ? head : 'none', head), { Dotted: 'dotted', Thick: 'thick' }[line] ?? 'normal']
}
const styleList = (hooks, style) => (/[()]/.test(style) ? hooks.unavailable('Frankenmermaid style text with a parenthesized value') : style.split(',').map(part => part.trim()).filter(Boolean))
function frankenGraph(ir, _project, hooks) {
  const label = index => (typeof index === 'number' ? ir.labels[index]?.text : undefined)
  const ids = ir.nodes.map(node => node.id)
  const refs = target => (ir.style_refs ?? []).filter(ref => typeof ref.target === 'object' && ref.target && Object.keys(ref.target)[0] === target)
  const groups = ir.graph?.subgraphs ?? []
  const ordered = []
  const walk = group => { for (const child of group.children ?? []) walk(groups[child]); ordered.push(group) }
  for (const group of groups) if (group.parent == null) walk(group)
  return {
    nodes: () => {
      const nodeRefs = refs('Node')
      return ir.nodes.map((node, index) => {
        const text = label(node.label)
        const styles = nodeRefs.filter(ref => ref.target.Node === index).flatMap(ref => styleList(hooks, ref.style))
        return [node.id, { text: text ?? node.id, ...(text === undefined && node.shape === 'Rect' ? { type: undefined } : FRANKEN_SHAPE[node.shape] ? { type: FRANKEN_SHAPE[node.shape] } : {}), classes: (node.classes ?? []).filter(name => !(name === 'has-link' && node.interaction?.href)), styles, link: node.interaction?.href ?? undefined, tooltip: node.interaction?.tooltip ?? undefined }]
      })
    },
    edges: () => {
      if ((ir.style_refs ?? []).some(ref => ref.target === 'LinkDefault')) return hooks.unavailable('Frankenmermaid linkStyle default')
      const linkRefs = refs('Link')
      return ir.edges.map((edge, index) => {
        if (typeof edge.from?.Node !== 'number' || typeof edge.to?.Node !== 'number') return hooks.unavailable('Frankenmermaid edge endpoint that is not a node')
        const [type, stroke] = frankenArrow(edge.arrow)
        const style = linkRefs.filter(ref => ref.target.Link === index).flatMap(ref => styleList(hooks, ref.style))
        return { start: ids[edge.from?.Node], end: ids[edge.to?.Node], text: label(edge.label) ?? '', type, stroke, style: style.length ? style : undefined }
      })
    },
    subgraphs: () =>
      ordered.map(group => {
        const nested = new Set((group.children ?? []).flatMap(child => groups[child].members ?? []))
        return { id: group.key, title: label(group.title) ?? group.key, nodes: [...(group.members ?? []).filter(member => !nested.has(member)).map(member => ids[member]), ...(group.children ?? []).map(child => groups[child].key)], dir: group.direction ?? undefined }
      }),
    direction: directionOf(ir.direction),
    absent: {
      edge: { length: "Frankenmermaid's edge model keeps no link length", id: "Frankenmermaid's edge model keeps no edge ids", interpolate: "Frankenmermaid's edge model keeps no curve", animate: "Frankenmermaid's edge model keeps no animation" },
      subgraph: { classes: "Frankenmermaid's subgraph model keeps no classes" },
    },
  }
}

// zombie-mermaid 5.14.1 MermaidGraph (shared with beautiful-mermaid 1.1.3 and
// ascii-mermaid 0.1.0, which keep fewer of its maps): a node's label is its id when none
// was written, so a bare node and `A[A]` are the same rectangle; edges have a line style
// and arrow flags with optional start/end markers and no length; class assignments, node
// styles (from style statements), link styles and click interactions are separate maps.
// Mermaid has no start-only edge type: such an edge keeps its own spelling, which no
// Mermaid edge type equals.
// `edgeIds`: the model's MermaidEdge also keeps a written edge id (`A e1@--> B`) and a
// written `e1@{ animate: true }` (zombie-mermaid 5.16.0 and 5.17.0, core
// dist/shared/index.d.ts MermaidEdge.id and .animate, and parses of both). A written id
// is Mermaid's user-defined id; without one Mermaid generates `L_<start>_<end>_<n>`, which
// the model does not keep (absent for that edge), and records isUserDefinedId false. An
// unwritten animate is undefined in both.
function mermaidGraphView(name, { edgeIds = false } = {}) {
  return (graph, _project, hooks) => {
    const get = (map, key) => (map instanceof Map ? map.get(key) : undefined)
    const flat = []
    const walk = group => {
      const children = (group.children ?? []).map(child => (typeof child === 'string' ? undefined : child)).filter(Boolean)
      for (const child of children) walk(child)
      flat.push({ id: group.id, title: group.label ?? group.id, nodes: [...(group.nodeIds ?? []), ...(group.children ?? []).map(child => (typeof child === 'string' ? child : child.id))], dir: group.direction ?? undefined })
    }
    for (const group of graph.subgraphs ?? []) walk(group)
    const ambiguous = `${name} records a bare node and a rectangle labelled with its own id as the same 'rectangle'`
    return {
      nodes: () =>
        entriesOf(graph.nodes).map(([id, node]) => {
          const assigned = get(graph.classAssignments, id)
          if (typeof assigned === 'string' && /\s|,/.test(assigned)) return hooks.unavailable(`${name} class assignment of several classes`)
          const bare = node.shape === 'rectangle' && node.label === id
          return [id, {
            text: node.label,
            ...(bare ? { [VERTEX_ABSENT]: { type: ambiguous } } : shapeOf(node.shape) ? { type: shapeOf(node.shape) } : {}),
            ...(graph.classAssignments instanceof Map ? { classes: assigned ? [assigned] : [] } : {}),
            ...(graph.nodeStyles instanceof Map ? { styles: styleStrings(get(graph.nodeStyles, id)) } : {}),
            ...(graph.interactions instanceof Map ? { link: get(graph.interactions, id)?.href ?? undefined, tooltip: get(graph.interactions, id)?.tooltip ?? undefined } : {}),
          }]
        }),
      edges: () =>
        graph.edges.map((edge, index) => {
          const start = edge.hasArrowStart ? headOf(edge.startMarker ?? 'arrow') : 'none', end = edge.hasArrowEnd ? headOf(edge.endMarker ?? 'arrow') : 'none'
          const type = edgeType(start, end) ?? (end === 'none' && start ? `${name}:start-only-${start}` : undefined)
          const style = graph.linkStyles instanceof Map ? styleStrings(get(graph.linkStyles, index)) : undefined
          const ids = !edgeIds ? {} : typeof edge.id === 'string' ? { id: edge.id, isUserDefinedId: true } : { isUserDefinedId: false, [VERTEX_ABSENT]: { id: `${name} keeps no generated edge id (Mermaid generates L_<start>_<end>_<n> for an edge written without one)` } }
          return { start: edge.source, end: edge.target, text: edge.label ?? '', type, stroke: strokeOf(edge.style), ...(graph.linkStyles instanceof Map ? { style: style.length ? style : undefined } : {}), ...ids, ...(edgeIds ? { animate: typeof edge.animate === 'boolean' ? edge.animate : undefined } : {}) }
        }),
      subgraphs: () => flat,
      direction: directionOf(graph.direction),
      absent: {
        vertex: {
          ...(graph.classAssignments instanceof Map ? {} : { classes: `${name}'s graph keeps no class assignments` }),
          ...(graph.interactions instanceof Map ? {} : { link: `${name}'s graph keeps no click links`, tooltip: `${name}'s graph keeps no tooltips` }),
        },
        edge: { length: `${name}'s edge model keeps no link length`, ...(edgeIds ? {} : { id: `${name}'s edge model keeps no edge ids`, animate: `${name}'s edge model keeps no animation` }), ...(graph.linkStyles instanceof Map ? {} : { style: `${name}'s graph keeps no link styles` }), interpolate: `${name}'s edge model keeps no curve` },
        subgraph: { classes: `${name}'s subgraph model keeps no classes` },
      },
    }
  }
}

// merslim 0.2.3 parseToIR flowchart (captured parser output): nodes keep a label and one
// semantic kind ('process' for [..] and the slanted [/..] and [\..] shapes, 'service' for
// (..) and ([..]), 'decision' for {..}, 'user' for ((..)), 'database' for [(..)], 'queue'
// for [[..]], 'plain' for a bare node and for >..]); edges keep one line kind (solid,
// dashed, thick, invisible) and a label but no arrowheads (A --> B and A --- B are the
// same solid edge, and edges with circle, cross or two-way ends are not kept); subgraphs
// keep an id and a title, not their members. classDef, class, style, linkStyle, click,
// direction-in-subgraph and accessibility lines are not kept.
const MERSLIM_KIND = { decision: 'diamond', user: 'circle', database: 'cylinder', queue: 'subroutine' }
const MERSLIM_STROKE = { solid: 'normal', dashed: 'dotted', thick: 'thick', invisible: 'invisible' }
function merslimGraph(graph) {
  const skipped = what => `merslim's flowchart parser keeps no ${what}`
  return {
    nodes: () => graph.nodes.map(node => [node.id, { text: node.label, ...(MERSLIM_KIND[node.kind] ? { type: MERSLIM_KIND[node.kind] } : { [VERTEX_ABSENT]: { type: `merslim records several Mermaid shapes as the same '${node.kind}' kind` } }) }]),
    edges: () => graph.edges.map(edge => ({ start: edge.source, end: edge.target, text: edge.label ?? '', stroke: MERSLIM_STROKE[edge.kind] ?? edge.kind })),
    subgraphs: () => (graph.subgraphs ?? []).map(group => ({ id: group.id, title: group.label ?? group.id })),
    direction: directionOf(graph.direction),
    absent: {
      vertex: { styles: skipped('style statements'), classes: skipped('class assignments'), link: skipped('click statements'), tooltip: skipped('click statements') },
      edge: { type: "merslim keeps an edge's line, not its arrowheads: A --> B and A --- B are the same solid edge", length: skipped('link lengths'), style: skipped('linkStyle statements'), interpolate: skipped('linkStyle statements'), id: skipped('edge ids'), animate: skipped('edge animation'), classes: skipped('edge classes') },
      subgraph: { nodes: "merslim keeps a subgraph's id and title, not its members", dir: skipped('subgraph directions'), classes: skipped('subgraph classes'), labelType: "merslim keeps a subgraph title's text without recording whether it was written as markdown" },
    },
  }
}

// merman's flowchart model (kitlangton/merman 0.x, and the copy OpenCode bundles; captured
// parser output): nodes keep a label and a shape word ('box' for a bare node and for [..],
// whose label is then the id or the bracket text; 'rounded' for both (..) and ([..]);
// 'decision', 'database', 'subroutine'); edges keep from, to, a label and an optional
// style ('dashed', 'thick'), OpenCode also a two-way flag (sourceArrowhead) and ~~~
// (orderOnly). Its parser accepts no other edge forms (---, --o, --x are rejected), so an
// edge without those flags is A --> B. Subgraphs keep id, label, member ids, a direction
// and a parent id, in declaration order (Mermaid lists a subgraph when it closes, inner
// ones first). classDef, class, :::, style and linkStyle lines are accepted and dropped;
// click and accessibility lines are rejected.
const MERMAN_SHAPE = { decision: 'diamond', database: 'cylinder', subroutine: 'subroutine' }
function mermanGraph(graph) {
  const name = 'merman'
  const groups = graph.subgraphs ?? []
  const ordered = []
  const walk = group => {
    for (const child of groups.filter(other => other.parentId === group.id)) walk(child)
    ordered.push(group)
  }
  for (const group of groups) if (!group.parentId || !groups.some(other => other.id === group.parentId)) walk(group)
  const type = node => {
    if (node.shape === 'box') return node.label === node.id ? { [VERTEX_ABSENT]: { type: `${name} records a bare node and a rectangle labelled with its own id as the same 'box'` } } : { type: 'square' }
    if (node.shape === 'rounded') return { [VERTEX_ABSENT]: { type: `${name} records (..) and ([..]) as the same 'rounded' shape` } }
    return MERMAN_SHAPE[node.shape] ? { type: MERMAN_SHAPE[node.shape] } : { type: `merman:${node.shape}` }
  }
  const dropped = what => `${name} accepts ${what} and keeps nothing of them`
  return {
    nodes: () => graph.nodes.map(node => [node.id, { text: node.label, ...type(node) }]),
    edges: () => graph.edges.map(edge => ({ start: edge.from, end: edge.to, text: edge.label ?? '', type: edge.orderOnly ? 'arrow_open' : edge.sourceArrowhead ? 'double_arrow_point' : 'arrow_point', stroke: edge.orderOnly ? 'invisible' : edge.style === 'dashed' ? 'dotted' : edge.style === 'thick' ? 'thick' : edge.style == null ? 'normal' : edge.style })),
    subgraphs: () => ordered.map(group => ({ id: group.id, title: group.label ?? group.id, nodes: [...(group.nodeIds ?? []), ...groups.filter(other => other.parentId === group.id).map(other => other.id)], ...(group.direction ? { dir: group.direction } : {}) })),
    direction: directionOf(graph.direction),
    absent: {
      vertex: { styles: dropped('style statements'), classes: dropped('class statements and ::: shorthands'), link: `${name}'s flowchart parser rejects click statements`, tooltip: `${name}'s flowchart parser rejects click statements` },
      edge: { length: `${name}'s edge model keeps no link length`, style: dropped('linkStyle statements'), interpolate: dropped('linkStyle statements'), id: `${name}'s edge model keeps no edge ids`, animate: `${name}'s edge model keeps no animation`, classes: `${name}'s edge model keeps no classes` },
      subgraph: { dir: `${name} records no direction for this subgraph`, classes: dropped('class statements'), labelType: `${name} keeps a subgraph title's text without recording whether it was written as markdown` },
    },
  }
}

const FLOWCHART = {
  'kitlangton/merman': mermanGraph,
  'anomalyco/opencode': mermanGraph,
  'emtyty/merslim': merslimGraph,
  'AlexanderGrooff/mermaid-ascii': asciiGraph,
  'xai-org/grok-build': indexGraph,
  'spacedock-dev/mermaidtext': indexGraph,
  'Yassimba/loom': indexGraph,
  '1jehuang/mermaid-rs-renderer': mmdrGraph,
  'orestesgaolin/mermaid': dartGraph,
  'pub:mermaid_flutter': dartGraph,
  'Mootikins/figurehead-rs': figureheadGraph,
  'fasouto/termaid': termaidGraph,
  'Latias94/merman': latiasGraph,
  'evangwt/xmermaid': xmermaidGraph,
  'Dicklesworthstone/frankenmermaid': frankenGraph,
  'dfadler/zombie-mermaid': mermaidGraphView('zombie-mermaid', { edgeIds: true }),
  'lukilabs/beautiful-mermaid': mermaidGraphView('beautiful-mermaid'),
  'kais-radwan/ascii-mermaid': mermaidGraphView('ascii-mermaid'),
}

// Class diagrams. Mermaid's ClassDB codes a relation end as AGGREGATION 0, EXTENSION 1,
// COMPOSITION 2, DEPENDENCY 3, LOLLIPOP 4 or 'none', and a line as LINE 0 or DOTTED_LINE 1;
// type1 is the marker at id1, the relation's left-hand class.
// A view marks a relation whose native model carries no line style with this key and its reason.
const LINE_ABSENT = Symbol('line style absent')
const RELATION_TYPE = { AGGREGATION: 0, EXTENSION: 1, COMPOSITION: 2, DEPENDENCY: 3, LOLLIPOP: 4 }
const LINE_TYPE = { LINE: 0, DOTTED_LINE: 1 }
const END = { extension: 1, triangle: 1, '<|': 1, '|>': 1, composition: 2, diamondfill: 2, '*': 2, aggregation: 0, diamondopen: 0, o: 0, dependency: 3, arrow: 3, '<': 3, '>': 3, lollipop: 4, '()': 4, none: 'none', '': 'none' }
const endOf = marker => (typeof marker === 'string' ? END[marker.toLowerCase().replace(/^head/, '')] : undefined)
const CLASS_FIELDS = ['id', 'type', 'label', 'text', 'cssClasses', 'methods', 'members', 'annotations', 'domId', 'styles', 'parent', 'link', 'linkTarget', 'haveCallback', 'tooltip']
// classDb.addClass creates every class with these keys set (type '', cssClasses 'default',
// empty member, method, annotation and style lists, a counted domId), so a whole-class
// comparison or snapshot reads them.
const CLASS_ALWAYS = ['id', 'type', 'label', 'text', 'cssClasses', 'methods', 'members', 'annotations', 'domId', 'styles']
const MEMBER_FIELDS = ['id', 'memberType', 'visibility', 'classifier', 'parameters', 'returnType', 'text', 'cssStyle', 'getDisplayDetails']
const RELATION_FIELDS = ['id1', 'id2', 'relation', 'relationTitle1', 'relationTitle2', 'title']
function classView(model, hooks) {
  const { classes, relations, absent } = model
  // Members are counted; their Mermaid ClassMember fields are not claimed.
  const member = () => record({}, 'class member', MEMBER_FIELDS, {}, hooks)
  const node = (id, fields) => record({ id, ...fields, ...(fields.members ? { members: fields.members.map(member) } : {}), ...(fields.methods ? { methods: fields.methods.map(member) } : {}) }, 'class', CLASS_FIELDS, absent.class ?? {}, hooks, CLASS_ALWAYS)
  const map = () => new Map(classes().map(([id, fields]) => [id, node(id, fields)]))
  const view = { getClasses: map, getClass: id => map().get(id), relationType: RELATION_TYPE, lineType: LINE_TYPE }
  // A model that does not record the written left-hand class lacks the concept: unsupported.
  if (model.relationsGap) view.getRelations = () => hooks.unsupported(model.relationsGap)
  else if (relations)
    view.getRelations = () =>
      relations().map(fields => {
        const relation = fields.relation
        if (relation) {
          if (relation.type1 === undefined || relation.type2 === undefined) return hooks.unavailable('Unmapped native class relation marker')
          const lineAbsent = relation[LINE_ABSENT]
          if (relation.lineType === undefined && !lineAbsent) return hooks.unavailable('Unmapped native class relation line')
          // The grammar's relation object always has a lineType (classDiagram.jison relationType).
          if (lineAbsent) fields = { ...fields, relation: record({ type1: relation.type1, type2: relation.type2 }, 'relation', ['type1', 'type2', 'lineType'], { lineType: lineAbsent }, hooks, ['lineType']) }
        }
        // Mermaid's relation has no title key without a label, so reading it is undefined.
        // classDiagram.jison's relationStatement always sets id1, id2, relation and both
        // relation titles ('none' when unwritten); title only with a label.
        return record({ ...(absent.relation?.title ? {} : { title: undefined }), ...fields }, 'relation', RELATION_FIELDS, absent.relation ?? {}, hooks, ['id1', 'id2', 'relation', 'relationTitle1', 'relationTitle2'])
      })
  return view
}
const relation = (id1, id2, from, to, dotted, extra) => ({ id1, id2, relation: { type1: endOf(from), type2: endOf(to), lineType: dotted === undefined ? undefined : dotted ? 1 : 0 }, ...extra })
const card = value => (value == null || value === '' ? 'none' : value)
const CLASS = {
  // mermaid_core 0.3.2: attributes/methods as display rows, endFrom/endTo words, cardinalities.
  'orestesgaolin/mermaid': raw => dartClasses(raw),
  'pub:mermaid_flutter': raw => dartClasses(raw),
  // termaid: one member list with is_method, marker symbols per end, one annotation.
  'fasouto/termaid': raw => ({
    classes: () => entriesOf(raw.classes).map(([id, item]) => [id, { label: item.name, annotations: item.annotation ? [item.annotation] : [], members: item.members.filter(m => !m.is_method), methods: item.members.filter(m => m.is_method) }]),
    relations: () => raw.relationships.map(rel => relation(rel.source, rel.target, rel.source_marker, rel.target_marker, rel.line_style === 'dashed' || rel.line_style === 'dotted' ? true : rel.line_style === 'solid' ? false : undefined, { relationTitle1: card(rel.source_card), relationTitle2: card(rel.target_card), ...(rel.label ? { title: rel.label } : {}) })),
    absent: { class: { type: "termaid's class model keeps no generic type" } },
  }),
  // Grok and MermaidText: [graph, per-node details]; cardinalities fold into the edge label.
  'xai-org/grok-build': raw => graphClasses(raw, 'Grok'),
  'spacedock-dev/mermaidtext': raw => graphClasses(raw, 'MermaidText'),
  // Loom: sections [header rows, attribute rows, method rows]; cardinalities kept per end.
  'Yassimba/loom': raw => ({
    classes: () => indexNames(raw).map(([id, node]) => [id, { label: node.label, members: node.sections?.[1] ?? [], methods: node.sections?.[2] ?? [] }]),
    relations: () => { const names = indexNames(raw); return raw.edges.map(edge => relation(names[edge.from][0], names[edge.to][0], edge.headFrom, edge.headTo, edge.line === 'dotted' ? true : edge.line === 'solid' ? false : undefined, { relationTitle1: card(edge.cardFrom), relationTitle2: card(edge.cardTo), ...(edge.label ? { title: edge.label } : {}) })) },
    absent: {},
  }),
}
// zombie-mermaid ClassRelationship: type and markerAt ('from' | 'to' | 'both'). Realization
// (..|>) and dependency (..>) are dotted by definition; the model has no line style for the
// other types, and 'association' covers both a plain link (--) and an arrow (-->).
const ZOMBIE_RELATION = { inheritance: [1, 0], realization: [1, 1], composition: [2], aggregation: [0], dependency: [3, 1], lollipop: [4] }
CLASS['dfadler/zombie-mermaid'] = raw => ({
  classes: () => raw.classes.map(item => [item.id, { label: item.label, annotations: item.annotation ? [item.annotation] : item.annotations ?? [], members: item.attributes ?? [], methods: item.methods ?? [] }]),
  relations: () =>
    raw.relationships.map(rel => {
      const [code, line] = ZOMBIE_RELATION[rel.type] ?? []
      const extra = { relationTitle1: card(rel.fromCardinality), relationTitle2: card(rel.toCardinality), ...(rel.label ? { title: rel.label } : {}) }
      if (code === undefined) return { id1: rel.from, id2: rel.to, ...extra }
      const relation = { type1: rel.markerAt === 'to' ? 'none' : code, type2: rel.markerAt === 'from' ? 'none' : code, ...(line !== undefined ? { lineType: line } : {}) }
      if (line === undefined) Object.defineProperty(relation, LINE_ABSENT, { value: "zombie-mermaid's class relation has no line style for this type" })
      return { id1: rel.from, id2: rel.to, relation, ...extra }
    }),
  absent: { relation: { relation: "zombie-mermaid records a plain link (--) and an arrow (-->) as the same 'association'" } },
})
// beautiful-mermaid 1.1.3 class/types.ts: the same ClassRelationship vocabulary (markerAt
// 'from' | 'to', no lollipop) and no class notes.
CLASS['lukilabs/beautiful-mermaid'] = raw => CLASS['dfadler/zombie-mermaid'](raw)
CLASS['kais-radwan/ascii-mermaid'] = raw => CLASS['dfadler/zombie-mermaid'](raw)
// XMermaid class: members are one display list and relations are normalized child -> parent.
CLASS['evangwt/xmermaid'] = raw => ({
  classes: () => raw.classes.map(item => [item.id, { label: item.label }]),
  relationsGap: 'XMermaid normalizes class relations child -> parent, so the left-hand class (id1) is not recorded',
  absent: { class: { members: "XMermaid keeps class members and methods as one display list", methods: "XMermaid keeps class members and methods as one display list" } },
})
// Frankenmermaid class IR: class_meta attributes/methods, a stereotype enum and generics;
// relation kinds name the marker and its side (Inheritance = <|--, InheritanceReverse =
// --|>). A dotted realization (..|>) is also InheritanceReverse, so no line style is
// claimed for inheritance, composition or aggregation.
const FRANKEN_RELATION = { Inheritance: [1, 'from'], InheritanceReverse: [1, 'to'], Composition: [2, 'from'], CompositionReverse: [2, 'to'], Aggregation: [0, 'from'], AggregationReverse: [0, 'to'], Arrow: [3, 'to', 0], DottedArrow: [3, 'to', 1], Line: ['none', 'none', 0], DottedLine: ['none', 'none', 1] }
CLASS['Dicklesworthstone/frankenmermaid'] = ir => ({
  classes: () => ir.nodes.map(node => [node.id, { label: node.id, annotations: node.class_meta?.stereotype ? [String(node.class_meta.stereotype).toLowerCase()] : [], members: node.class_meta?.attributes ?? [], methods: node.class_meta?.methods ?? [], ...(node.class_meta?.generics?.length ? { type: node.class_meta.generics.join(',') } : {}) }]),
  relations: () => {
    const nodes = frankenNodes(ir)
    return ir.edges.map(edge => {
      const [code, side, line] = FRANKEN_RELATION[edge.arrow] ?? []
      const title = frankenLabel(ir, edge.label)
      const extra = { relationTitle1: card(edge.extras?.source_cardinality), relationTitle2: card(edge.extras?.target_cardinality), ...(title ? { title } : {}) }
      const ids = { id1: nodes[edge.from?.Node], id2: nodes[edge.to?.Node] }
      if (code === undefined) return { ...ids, ...extra }
      const relation = side === 'none' ? { type1: 'none', type2: 'none', lineType: line } : { type1: side === 'from' ? code : 'none', type2: side === 'to' ? code : 'none', ...(line !== undefined ? { lineType: line } : {}) }
      if (line === undefined) Object.defineProperty(relation, LINE_ABSENT, { value: "Frankenmermaid's relation kind does not record the line style for this marker" })
      return { ...ids, relation, ...extra }
    })
  },
  absent: {},
})
// agentic-mermaid 0.5.6 class body: relations as written (from = left-hand class) with
// markerAt 'from' | 'to' | 'both' | 'none', a kind per end when they differ, and an
// explicit lineStyle only where it departs from the kind's own line (dependency,
// realization and link-dashed are dotted). A lollipop end is its own interface<n> class,
// as in Mermaid. Members are display rows that still include <<annotation>> rows.
const AGENTIC_KIND = { inheritance: [1, 0], realization: [1, 1], composition: [2, 0], aggregation: [0, 0], dependency: [3, 1], association: [3, 0], lollipop: [4, 0], 'link-solid': ['none', 0], 'link-dashed': ['none', 1] }
CLASS['adewale/agentic-mermaid'] = raw => ({
  classes: () => raw.classes.map(item => [item.id, { label: item.label ?? item.id, ...(item.generic ? { type: item.generic } : {}) }]),
  relations: () =>
    (raw.nativeParser === 'parseClassDiagram' ? raw.relationships.map(rel => ({ ...rel, kind: rel.type, fromKind: rel.fromType, toKind: rel.toType })) : raw.relations).map(rel => {
      const at = rel.markerAt, code = kind => AGENTIC_KIND[kind]?.[0]
      const line = rel.lineStyle === 'dashed' ? 1 : rel.lineStyle === 'solid' ? 0 : AGENTIC_KIND[rel.kind]?.[1]
      const relation = { type1: at === 'from' || at === 'both' ? code(rel.fromKind ?? rel.kind) : 'none', type2: at === 'to' || at === 'both' ? code(rel.toKind ?? rel.kind) : 'none', lineType: line }
      return { id1: rel.from, id2: rel.to, relation, relationTitle1: card(rel.fromCardinality), relationTitle2: card(rel.toCardinality), ...(rel.label ? { title: rel.label } : {}) }
    }),
  absent: {},
})
// vitepress-plugin-mermaid-diagram 0.3.2: members split by isMethod, one annotation, and
// relations from the left-hand class with a type word but no record of the marker's side
// (A --|> B and A <|-- B are both 'inheritance').
CLASS['KlangHaus/vitepress-plugin-diagram'] = raw => ({
  classes: () => entriesOf(raw.classes).map(([id, item]) => [id, { label: item.label ?? id, annotations: item.annotation ? [item.annotation] : [], members: item.members.filter(m => !m.isMethod), methods: item.members.filter(m => m.isMethod) }]),
  relations: () => raw.relationships.map(rel => ({ id1: rel.from, id2: rel.to, relationTitle1: card(rel.fromCardinality), relationTitle2: card(rel.toCardinality), ...(rel.label ? { title: rel.label } : {}) })),
  absent: { relation: { relation: "vitepress-plugin-mermaid-diagram's class relation keeps no record of which end carries the marker" } },
})
// merslim 0.2.3 parseToIR class: members with kind 'attribute' | 'method'; relations are
// source -> target with inheritance normalized child -> parent, so the written left-hand
// class (id1) is not recoverable from the model.
CLASS['emtyty/merslim'] = raw => ({
  classes: () => raw.classes.map(item => [item.id, { label: item.label ?? item.id, members: item.members.filter(m => m.kind !== 'method'), methods: item.members.filter(m => m.kind === 'method') }]),
  relationsGap: "Merslim normalizes inheritance child -> parent, so the left-hand class (id1) is not recorded",
  absent: {},
})
function dartClasses(raw) {
  return {
    classes: () => entriesOf(raw.classes).map(([id, item]) => [id, { label: item.label, annotations: item.annotations ?? [], members: item.attributes ?? [], methods: item.methods ?? [], styles: styleStrings(item.styles), ...(item.link ? { link: item.link } : {}) }]),
    relations: () => raw.relations.map(rel => relation(rel.from, rel.to, rel.endFrom, rel.endTo, rel.dotted, { relationTitle1: card(rel.cardFrom), relationTitle2: card(rel.cardTo), ...(rel.label ? { title: rel.label } : {}) })),
    absent: {},
  }
}
function graphClasses(raw, name) {
  const [graph, details] = raw
  return {
    classes: () => indexNames(graph).map(([id, node], index) => [id, { label: node.label, annotations: details?.[index]?.annotation ? [details[index].annotation] : [], members: details?.[index]?.attrs ?? [], methods: details?.[index]?.methods ?? [] }]),
    relations: () => { const names = indexNames(graph); return graph.edges.map(edge => relation(names[edge.from][0], names[edge.to][0], edge.head_from ?? edge.headFrom, edge.head_to ?? edge.headTo, ['Dotted', 'lineDotted'].includes(edge.line) ? true : ['Solid', 'lineSolid'].includes(edge.line) ? false : undefined, {})) },
    absent: {
      class: { type: `${name} keeps a generic class's type parameter only in its display label`, link: `${name}'s class model keeps no links`, tooltip: `${name}'s class model keeps no tooltips` },
      relation: { title: `${name} folds the relation label and cardinalities into one display label`, relationTitle1: `${name} folds relation cardinalities into its display label`, relationTitle2: `${name} folds relation cardinalities into its display label` },
    },
  }
}

// Class notes are what the generic view cannot reach (Mermaid keys them note<n>).
const NO_CLASS_NOTES = {
  'xai-org/grok-build': "Grok's class model keeps no notes",
  'spacedock-dev/mermaidtext': "MermaidText's class model keeps no notes",
  'Yassimba/loom': "Loom's class model keeps no notes",
  '1jehuang/mermaid-rs-renderer': "mermaid-rs-renderer's class model keeps no notes",
  'crafter-station/mermaid': "Crafter's class model keeps no notes",
  'lukilabs/beautiful-mermaid': "beautiful-mermaid's class model keeps no notes",
  'kais-radwan/ascii-mermaid': "ascii-mermaid's class model keeps no notes",
  'KlangHaus/vitepress-plugin-diagram': "vitepress-plugin-mermaid-diagram's class model keeps no notes",
  'emtyty/merslim': "Merslim's class model keeps no notes",
  'evangwt/xmermaid': "XMermaid's class model keeps no notes",
}
function classNotes(project, raw, hooks) {
  if (project === 'Dicklesworthstone/frankenmermaid') raw = { notes: raw.state_notes ?? [] }
  if (NO_CLASS_NOTES[project]) {
    const reason = NO_CLASS_NOTES[project]
    return { getNote: () => hooks.unsupported(reason), getNotes: () => hooks.unsupported(reason) }
  }
  const native = raw.notes instanceof Map ? [...raw.notes.values()] : Array.isArray(raw.notes) ? raw.notes : raw.notes && typeof raw.notes === 'object' ? Object.values(raw.notes) : undefined
  if (!native) return {}
  const notes = new Map(
    native.map((note, index) => {
      const id = typeof note.id === 'string' ? note.id : 'note' + index
      const target = note.class ?? note.forClass ?? note.for ?? (note.target === '' ? null : note.target)
      return [id, { id, class: target ?? undefined, text: note.text, index }]
    }),
  )
  return { getNote: id => notes.get(typeof id === 'number' ? 'note' + id : id), getNotes: () => new Map(notes) }
}

// Entity-relationship diagrams. Mermaid records cardA from the right-hand marker and
// cardB from the left-hand one, with IDENTIFYING for a solid line.
const CARD_WORD = { exactlyone: 'ONLY_ONE', onlyone: 'ONLY_ONE', zeroorone: 'ZERO_OR_ONE', oneormore: 'ONE_OR_MORE', zeroormore: 'ZERO_OR_MORE', mdparent: 'MD_PARENT' }
const cardWord = value => (typeof value === 'string' ? CARD_WORD[value.toLowerCase().replace(/[_\s-]/g, '')] : undefined)
const CARD_SYMBOL = { '||': 'ONLY_ONE', '|o': 'ZERO_OR_ONE', 'o|': 'ZERO_OR_ONE', '}|': 'ONE_OR_MORE', '|{': 'ONE_OR_MORE', '}o': 'ZERO_OR_MORE', 'o{': 'ZERO_OR_MORE' }
const LOOM_CARD = { 1: 'ONLY_ONE', '0..1': 'ZERO_OR_ONE', '1..*': 'ONE_OR_MORE', '*': 'ZERO_OR_MORE' }
const MMDR_CARD = { CrowsFootOne: 'ONLY_ONE', CrowsFootZeroOne: 'ZERO_OR_ONE', CrowsFootMany: 'ONE_OR_MORE', CrowsFootZeroMany: 'ZERO_OR_MORE' }
const ENTITY_FIELDS = ['id', 'label', 'alias', 'attributes', 'cssClasses', 'cssStyles', 'shape']
// erDb.addEntity creates every entity with alias ('' by default), attributes [], cssClasses
// 'default' and cssStyles [], so a whole-entity comparison reads them.
const ENTITY_ALWAYS = ['alias', 'attributes', 'cssClasses', 'cssStyles']
const ATTRIBUTE_FIELDS = ['type', 'name', 'keys', 'comment']
const RELATIONSHIP_FIELDS = ['entityA', 'roleA', 'entityB', 'relSpec']

function erView(model, hooks) {
  const { entities, relationships, absent } = model
  const attribute = fields => record(fields, 'attribute', ATTRIBUTE_FIELDS, absent.attribute ?? {}, hooks)
  // An entity may name fields absent for that entity alone (VERTEX_ABSENT).
  const entity = (name, fields) => {
    const { [VERTEX_ABSENT]: only, ...rest } = fields
    return record({ ...rest, ...(rest.attributes ? { attributes: rest.attributes.map(attribute) } : {}) }, 'entity', ENTITY_FIELDS, { ...(absent.entity ?? {}), ...(only ?? {}) }, hooks, ENTITY_ALWAYS)
  }
  const map = () => new Map(entities().map(([name, fields]) => [name, entity(name, fields)]))
  const view = { getEntities: map, getEntity: name => map().get(name) }
  if (relationships)
    view.getRelationships = () =>
      relationships().map(fields => {
        const spec = fields.relSpec
        if (spec && Object.values(spec).some(value => value === undefined)) return hooks.unavailable('Unmapped native ER cardinality or line')
        return record(fields, 'relationship', RELATIONSHIP_FIELDS, absent.relationship ?? {}, hooks)
      })
  return view
}
const identifying = solid => (solid === undefined ? undefined : solid ? 'IDENTIFYING' : 'NON_IDENTIFYING')

const ER = {
  // mermaid-ascii pkg/er: Entities, Relationships with LeftCard/RightCard words.
  'AlexanderGrooff/mermaid-ascii': raw => ({
    entities: () => raw.Entities.map(entity => [entity.Name, { label: entity.Display, alias: entity.Display === entity.Name ? '' : entity.Display, attributes: entity.Attributes.map(a => ({ type: a.Type, name: a.Name, keys: a.Keys ?? [], comment: a.Comment ?? '' })) }]),
    relationships: () => raw.Relationships.map(rel => ({ entityA: rel.Left, entityB: rel.Right, roleA: rel.Label, relSpec: { cardA: cardWord(rel.RightCard), cardB: cardWord(rel.LeftCard), relType: identifying(rel.Identifying) } })),
    absent: {},
  }),
  // termaid: crow's-foot symbols and line_style per relationship.
  'fasouto/termaid': raw => ({
    entities: () => entriesOf(raw.entities).map(([name, entity]) => [name, { label: name, alias: entity.alias ?? '', attributes: entity.attributes.map(a => ({ type: a.type, name: a.name, keys: a.keys ?? [], comment: a.comment ?? '' })) }]),
    relationships: () => raw.relationships.map(rel => ({ entityA: rel.entity1, entityB: rel.entity2, roleA: rel.label, relSpec: { cardA: CARD_SYMBOL[rel.card2], cardB: CARD_SYMBOL[rel.card1], relType: identifying(rel.line_style === 'solid' ? true : rel.line_style === 'dashed' ? false : undefined) } })),
    absent: {},
  }),
  // mermaid_core 0.3.2: cardFrom/cardTo words and an identifying flag.
  'orestesgaolin/mermaid': raw => dartEr(raw),
  'pub:mermaid_flutter': raw => dartEr(raw),
  // Loom: '0..1', '1', '1..*', '*' per end; attributes are display rows, comments dropped.
  'Yassimba/loom': raw => ({
    entities: () => indexNames(raw).map(([name, node]) => [name, { label: node.label, attributes: (node.sections?.[1] ?? []).map(() => ({})) }]),
    relationships: () => { const names = indexNames(raw); return raw.edges.map(edge => ({ entityA: names[edge.from][0], entityB: names[edge.to][0], roleA: edge.label ?? '', relSpec: { cardA: LOOM_CARD[edge.cardTo], cardB: LOOM_CARD[edge.cardFrom], relType: identifying(edge.line === 'solid' ? true : edge.line === 'dotted' ? false : undefined) } })) },
    absent: { attribute: Object.fromEntries(ATTRIBUTE_FIELDS.map(field => [field, "Loom keeps ER attributes as display rows, not typed fields"])), entity: { alias: "Loom's ER model keeps no entity alias" } },
  }),
  // Grok and MermaidText render ER as a graph: cardinalities are folded into the edge
  // label text and attributes are display rows.
  'xai-org/grok-build': raw => graphEr(raw, 'Grok'),
  'spacedock-dev/mermaidtext': raw => graphEr(raw, 'MermaidText'),
  // mermaid-rs-renderer: crow's-foot decorations; attributes folded into the node label.
  '1jehuang/mermaid-rs-renderer': raw => ({
    entities: () => entriesOf(raw.nodes).map(([name]) => [name, { label: name }]),
    relationships: () => raw.edges.map(edge => ({ entityA: edge.from, entityB: edge.to, roleA: edge.label ?? '', relSpec: { cardA: MMDR_CARD[edge.end_decoration], cardB: MMDR_CARD[edge.start_decoration], relType: identifying(edge.style === 'Solid' ? true : edge.style === 'Dotted' ? false : undefined) } })),
    absent: { entity: { attributes: "mermaid-rs-renderer folds ER attributes into the node's display label", alias: "mermaid-rs-renderer's ER model keeps no entity alias" } },
  }),
}
// zombie-mermaid: Cardinality 'one' | 'zero-one' | 'many' | 'zero-many' (crow's foot ||, |o, }|, }o).
const ZOMBIE_CARD = { one: 'ONLY_ONE', 'zero-one': 'ZERO_OR_ONE', many: 'ONE_OR_MORE', 'zero-many': 'ZERO_OR_MORE' }
ER['dfadler/zombie-mermaid'] = raw => ({
  entities: () => raw.entities.map(entity => [entity.id, { label: entity.label, attributes: entity.attributes.map(a => ({ type: a.type, name: a.name, keys: a.keys ?? [], comment: a.comment ?? '' })) }]),
  relationships: () => raw.relationships.map(rel => ({ entityA: rel.entity1, entityB: rel.entity2, roleA: rel.label ?? '', relSpec: { cardA: ZOMBIE_CARD[rel.cardinality2], cardB: ZOMBIE_CARD[rel.cardinality1], relType: identifying(rel.identifying) } })),
  absent: { entity: { alias: "zombie-mermaid's ER entity model keeps no alias" } },
})
// beautiful-mermaid 1.1.3 shares these ER types with its fork zombie-mermaid (er/types.ts).
// kais-radwan/ascii-mermaid's er/types.ts and class/types.ts are the same as beautiful-mermaid's.
ER['kais-radwan/ascii-mermaid'] = raw => ({ ...ER['dfadler/zombie-mermaid'](raw), absent: { entity: { alias: "ascii-mermaid's ER entity model keeps no alias" } } })
ER['lukilabs/beautiful-mermaid'] = raw => ({ ...ER['dfadler/zombie-mermaid'](raw), absent: { entity: { alias: "beautiful-mermaid's ER entity model keeps no alias" } } })
// XMermaid parse_dsl: from/to cardinality words and a non_identifying flag.
ER['evangwt/xmermaid'] = raw => ({
  entities: () => raw.entities.map(entity => [entity.name, { label: entity.name, attributes: (entity.attributes ?? []).map(a => ({ type: a.kind, name: a.name, keys: a.keys ?? [], comment: a.comment ?? '' })) }]),
  relationships: () => raw.relationships.map(rel => ({ entityA: rel.from, entityB: rel.to, roleA: rel.label ?? '', relSpec: { cardA: cardWord(rel.to_cardinality), cardB: cardWord(rel.from_cardinality), relType: identifying(rel.non_identifying === undefined ? undefined : !rel.non_identifying) } })),
  absent: { entity: { alias: "XMermaid's ER entity model keeps no alias" } },
})
// Frankenmermaid 0.4.0 IR (Rust/WASM parse()): entity members carry data_type, name, keys
// (Pk/Fk/Uk) and comment; each relationship keeps its normalized crow's-foot notation
// (er_notation, e.g. "||--o{") and a label index.
const frankenNodes = ir => ir.nodes.map(node => node.id)
const frankenLabel = (ir, index) => (typeof index === 'number' ? ir.labels[index]?.text : undefined)
ER['Dicklesworthstone/frankenmermaid'] = ir => ({
  entities: () => ir.nodes.map(node => [node.id, { label: node.id, attributes: (node.members ?? []).map(m => ({ type: m.data_type, name: m.name, keys: (m.keys ?? []).map(key => String(key).toUpperCase()), comment: m.comment ?? '' })) }]),
  relationships: () => {
    const nodes = frankenNodes(ir)
    return ir.edges.map(edge => {
      const notation = edge.extras?.er_notation ?? ''
      const line = notation.slice(2, 4)
      return { entityA: nodes[edge.from?.Node], entityB: nodes[edge.to?.Node], roleA: frankenLabel(ir, edge.label) ?? '', relSpec: { cardA: CARD_SYMBOL[notation.slice(4, 6)], cardB: CARD_SYMBOL[notation.slice(0, 2)], relType: identifying(line === '--' ? true : line === '..' ? false : undefined) } }
    })
  },
  absent: {},
})
// merslim 0.2.3 parseToIR er: a table schema. Columns carry name, type and PK/FK/UK flags;
// a relation keeps its label (as fromCol and toCol) and one nullable flag, not the two
// cardinalities or the line, and comments and entity aliases are not kept.
ER['emtyty/merslim'] = raw => ({
  entities: () => raw.schema.tables.map(table => [table.name, { label: table.name, attributes: table.columns.map(c => ({ type: c.type, name: c.name, keys: [...(c.isPK ? ['PK'] : []), ...(c.isFK ? ['FK'] : []), ...(c.isUnique ? ['UK'] : [])] })) }]),
  relationships: () => raw.schema.relations.map(rel => ({ entityA: rel.fromTable, entityB: rel.toTable, roleA: rel.fromCol })),
  absent: {
    entity: { alias: "Merslim's ER table model keeps no alias" },
    attribute: { comment: "Merslim's ER column model keeps no comments" },
    relationship: { relSpec: "Merslim keeps one nullable flag per relationship, not its two cardinalities or line style" },
  },
})
function dartEr(raw) {
  return {
    entities: () => entriesOf(raw.entities).map(([name, entity]) => [name, { label: entity.label, attributes: entity.attributes.map(a => ({ type: a.type, name: a.name, keys: a.keys ?? [], comment: a.comment ?? '' })), cssStyles: entity.cssStyles, cssClasses: entity.cssClasses }]),
    relationships: () => raw.relationships.map(rel => ({ entityA: rel.from, entityB: rel.to, roleA: rel.label, relSpec: { cardA: cardWord(rel.cardTo), cardB: cardWord(rel.cardFrom), relType: identifying(rel.identifying) } })),
    absent: { entity: { alias: "mermaid_core's ER entity model keeps no alias" } },
  }
}
function indexNames(graph) {
  const ids = []
  for (const [id, index] of entriesOf(graph.index)) if (ids[index] === undefined) ids[index] = id
  return graph.nodes.map((node, index) => [ids[index], node])
}
function graphEr(raw, name) {
  const [graph, details] = raw
  return {
    entities: () => indexNames(graph).map(([id, node], index) => [id, { label: node.label, attributes: (details?.[index]?.attrs ?? []).map(() => ({})) }]),
    relationships: () => { const names = indexNames(graph); return graph.edges.map(edge => ({ entityA: names[edge.from][0], entityB: names[edge.to][0] })) },
    absent: {
      attribute: Object.fromEntries(ATTRIBUTE_FIELDS.map(field => [field, `${name} keeps ER attributes as display rows, not typed fields`])),
      entity: { alias: `${name}'s ER model keeps no entity alias` },
      relationship: { roleA: `${name} folds the relationship role and cardinalities into one display label`, relSpec: `${name} folds the relationship cardinalities into its display label` },
    },
  }
}

// C4 diagrams. Mermaid's C4 database keeps shapes, boundaries (led by its own 'global'
// boundary) and relations as records whose text fields are { text }. A shape's techn
// exists only for containers and components (and a boundary's descr only for deployment
// nodes); sprite, tags and link exist only when given.
// Each element's wrap flag is Mermaid's text-wrapping configuration, which none of these
// models keeps per element.
const C4_SHAPE_FIELDS = ['alias', 'label', 'descr', 'typeC4Shape', 'parentBoundary', 'wrap', 'sprite', 'tags', 'link']
const C4_BOUNDARY_FIELDS = ['alias', 'label', 'type', 'parentBoundary', 'wrap', 'tags', 'link']
const C4_REL_FIELDS = ['type', 'from', 'to', 'label', 'techn', 'descr', 'wrap', 'sprite', 'tags', 'link']
const GLOBAL_BOUNDARY = { alias: 'global', label: { text: 'global' }, type: { text: 'global' }, tags: null, link: null, parentBoundary: '' }
const text = value => ({ text: value ?? '' })
const optional = (fields, value) => Object.fromEntries(Object.entries(value).map(([key, item]) => [key, item == null || item === '' ? undefined : item]).concat(fields.filter(key => !(key in value)).map(key => [key, undefined])))
const usesTechn = type => /container|component/.test(type)
// Mermaid's C4 macros and the typeC4Shape / rel type each one records.
const C4_MACRO = {
  Person: 'person', Person_Ext: 'external_person', System: 'system', SystemDb: 'system_db', SystemQueue: 'system_queue', System_Ext: 'external_system', SystemDb_Ext: 'external_system_db', SystemQueue_Ext: 'external_system_queue',
  Container: 'container', ContainerDb: 'container_db', ContainerQueue: 'container_queue', Container_Ext: 'external_container', ContainerDb_Ext: 'external_container_db', ContainerQueue_Ext: 'external_container_queue',
  Component: 'component', ComponentDb: 'component_db', ComponentQueue: 'component_queue', Component_Ext: 'external_component', ComponentDb_Ext: 'external_component_db', ComponentQueue_Ext: 'external_component_queue',
}
const C4_REL_MACRO = { Rel: 'rel', BiRel: 'birel', Rel_U: 'rel_u', Rel_Up: 'rel_u', Rel_D: 'rel_d', Rel_Down: 'rel_d', Rel_L: 'rel_l', Rel_Left: 'rel_l', Rel_R: 'rel_r', Rel_Right: 'rel_r', Rel_Back: 'rel_b', RelIndex: 'rel' }
const C4_BOUNDARY_MACRO = { Enterprise_Boundary: 'ENTERPRISE', System_Boundary: 'SYSTEM', Container_Boundary: 'CONTAINER' }
const snake = name => name.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()

function c4View(model, hooks) {
  const { absent } = model
  const shape = fields => record(fields, 'C4 shape', C4_SHAPE_FIELDS, absent.shape ?? {}, hooks, ['wrap'])
  const boundary = fields => record(fields, 'C4 boundary', C4_BOUNDARY_FIELDS, absent.boundary ?? {}, hooks, ['wrap'])
  const rel = fields => record(fields, 'C4 relation', C4_REL_FIELDS, absent.rel ?? {}, hooks, ['wrap'])
  // Each record is built once per parse, so the same element is the same object through
  // every getter, as in Mermaid's database (a test compares them with toBe).
  const once = build => { let made; return () => (made ??= build()) }
  const shapes = once(() => model.shapes().map(shape))
  const boundaries = model.boundaries ? once(() => [GLOBAL_BOUNDARY, ...model.boundaries()].map(boundary)) : undefined
  const byParent = (list, parent) => (parent == null ? list : list.filter(item => item.parentBoundary === parent))
  const view = {
    getC4ShapeArray: parent => byParent(shapes(), parent),
    // Relations may target a boundary as well as a shape, so Mermaid falls back to boundaries.
    getC4Shape: alias => shapes().find(item => item.alias === alias) ?? (boundaries ? boundaries().find(item => item.alias === alias) : absent.getBoundaries ? hooks.unsupported(absent.getBoundaries) : undefined),
    // Mermaid returns Object.keys of the shape array: its indexes, as strings.
    getC4ShapeKeys: parent => Object.keys(byParent(shapes(), parent)),
    getRels: once(() => model.rels().map(rel)),
    ...(model.type ? { getC4Type: () => model.type } : {}),
  }
  if (boundaries) {
    view.getBoundaries = parent => byParent(boundaries(), parent)
    view.getBoundary = alias => boundaries().find(item => item.alias === alias)
  } else if (absent.getBoundaries) view.getBoundaries = view.getBoundary = () => hooks.unsupported(absent.getBoundaries)
  return view
}
const WRAP = name => ({ wrap: `${name} keeps text wrapping as a renderer setting, not per C4 element` })
const C4 = {
  // mermaid-rs-renderer ir.rs C4Shape/C4Boundary/C4Rel: kind enums whose as_str is Mermaid's
  // own vocabulary. For people and systems the third positional argument is its type_label
  // (drawn as "[type]"), not the description. Named-argument values keep their quotes.
  '1jehuang/mermaid-rs-renderer': raw => {
    const c4 = raw.c4, unquote = value => (typeof value === 'string' && /^".*"$/s.test(value) ? value.slice(1, -1) : value)
    return {
      type: c4.c4_type,
      shapes: () => c4.shapes.map(item => { const type = snake(item.kind); return { alias: item.id, label: text(item.label), descr: text(unquote(item.descr)), ...(usesTechn(type) ? { techn: text(unquote(item.techn)) } : {}), typeC4Shape: { text: type }, parentBoundary: item.parent_boundary, ...optional(['sprite', 'tags', 'link'], { sprite: unquote(item.sprite), tags: unquote(item.tags), link: unquote(item.link) }) } }),
      boundaries: () => c4.boundaries.filter(item => item.id !== 'global').map(item => ({ alias: item.id, label: text(item.label), parentBoundary: item.parent_boundary, ...optional(['tags', 'link'], { tags: unquote(item.tags), link: unquote(item.link) }) })),
      rels: () => c4.rels.map(item => ({ type: { Rel: 'rel', BiRel: 'birel', RelUp: 'rel_u', RelDown: 'rel_d', RelLeft: 'rel_l', RelRight: 'rel_r', RelBack: 'rel_b' }[item.kind], from: item.from, to: item.to, label: text(item.label), techn: text(unquote(item.techn)), descr: text(unquote(item.descr)), ...optional(['sprite', 'tags', 'link'], { sprite: unquote(item.sprite), tags: unquote(item.tags), link: unquote(item.link) }) })),
      absent: { shape: WRAP('mermaid-rs-renderer'), boundary: { ...WRAP('mermaid-rs-renderer'), type: "mermaid-rs-renderer records System_Boundary and an untyped Boundary as the same 'system' type" }, rel: WRAP('mermaid-rs-renderer') },
    }
  },
  // zombie-mermaid C4Diagram (shared/index.d.ts): element kind + shape + external, nested
  // boundaries listing their direct element aliases, relationships with bidirectional,
  // reversed (Rel_Back) and a layout hint (Rel_U/D/L/R). No sprites, tags or links.
  'dfadler/zombie-mermaid': raw => {
    const parentOf = {}, flat = []
    const walk = (group, parent) => {
      // zombie-mermaid records every boundary's type, already in Mermaid's spelling.
      flat.push({ alias: group.alias, label: text(group.label), type: { text: group.type }, parentBoundary: parent })
      for (const alias of group.elementAliases ?? []) parentOf[alias] = group.alias
      for (const child of group.children ?? []) walk(child, group.alias)
    }
    for (const group of raw.boundaries ?? []) walk(group, 'global')
    const none = "zombie-mermaid's C4 model keeps no sprites, tags or links"
    return {
      type: 'C4' + raw.variant[0].toUpperCase() + raw.variant.slice(1),
      shapes: () => raw.elements.map(item => { const type = (item.external ? 'external_' : '') + item.kind + (item.shape === 'default' ? '' : '_' + item.shape); return { alias: item.alias, label: text(item.label), descr: text(item.description), ...(usesTechn(type) ? { techn: text(item.technology) } : {}), typeC4Shape: { text: type }, parentBoundary: parentOf[item.alias] ?? 'global' } }),
      boundaries: raw.variant === 'deployment' ? undefined : () => flat,
      rels: () => raw.relationships.map(item => ({ type: item.bidirectional ? 'birel' : item.reversed ? 'rel_b' : item.layout ? { up: 'rel_u', down: 'rel_d', left: 'rel_l', right: 'rel_r' }[item.layout] : 'rel', from: item.from, to: item.to, label: text(item.label), techn: text(item.technology), descr: text('') })),
      absent: { shape: { ...WRAP('zombie-mermaid'), sprite: none, tags: none, link: none }, boundary: { ...WRAP('zombie-mermaid'), tags: none, link: none }, rel: { ...WRAP('zombie-mermaid'), sprite: none, tags: none, link: none, descr: "zombie-mermaid's C4 relationship keeps no description" } },
    }
  },
  // agentic-mermaid 0.5.6 c4 body: each element, boundary and relationship keeps the macro
  // that declared it, its parentId, a tags list, sprite and link.
  'adewale/agentic-mermaid': (raw, hooks) => {
    // c4/parser.ts splits native tags at '+', preserving their list order.
    const tags = list => (list.length ? list.join('+') : undefined)
    return {
      type: raw.variant,
      shapes: () => raw.elements.map(item => { const type = C4_MACRO[item.macro]; if (!type) return hooks.unavailable('agentic-mermaid C4 macro ' + item.macro); return { alias: item.id, label: text(item.label), descr: text(item.description), ...(usesTechn(type) ? { techn: text(item.technology) } : {}), typeC4Shape: { text: type }, parentBoundary: item.parentId ?? 'global', ...optional(['sprite', 'tags', 'link'], { sprite: item.sprite, tags: tags(item.tags ?? []), link: item.link }) } }),
      boundaries: () => raw.boundaries.map(item => { if (!(item.macro in C4_BOUNDARY_MACRO) && item.macro !== 'Boundary') return hooks.unavailable('agentic-mermaid C4 boundary macro ' + item.macro); return { alias: item.id, label: text(item.label), type: { text: item.type ?? C4_BOUNDARY_MACRO[item.macro] ?? 'system' }, parentBoundary: item.parentId ?? 'global', ...optional(['tags', 'link'], { tags: tags(item.tags ?? []), link: item.link }) } }),
      rels: () => raw.relationships.map(item => ({ type: C4_REL_MACRO[item.macro] ?? hooks.unavailable('agentic-mermaid C4 relation macro ' + item.macro), from: item.from, to: item.to, label: text(item.label), techn: text(item.technology), descr: text(item.description), ...optional(['sprite', 'tags', 'link'], { sprite: item.sprite, tags: tags(item.tags ?? []), link: item.link }) })),
      absent: { shape: WRAP('agentic-mermaid'), boundary: WRAP('agentic-mermaid'), rel: WRAP('agentic-mermaid') },
    }
  },
}
// mermaid_core 0.3.2 (Mermaid Dart and Flutter): each node's styleKey is Mermaid's own
// shape type; boundary types are the macro word (Enterprise, System, Container) or the
// written type; a relation records bidirectional and backwards (Rel_Back) but not the
// Rel_U/D/L/R direction. No sprites, tags or links.
const dartC4 = raw => {
  const none = "mermaid_core's C4 model keeps no sprites, tags or links"
  const boundaryType = type => ({ Enterprise: 'ENTERPRISE', System: 'SYSTEM', Container: 'CONTAINER' })[type] ?? (type || 'system')
  return {
    type: raw.subtype ? 'C4' + raw.subtype[0].toUpperCase() + raw.subtype.slice(1) : undefined,
    shapes: () => entriesOf(raw.nodes).map(([id, item]) => ({ alias: id, label: text(item.label), descr: text(item.description), ...(usesTechn(item.styleKey) ? { techn: text(item.technology) } : {}), typeC4Shape: { text: item.styleKey }, parentBoundary: item.boundary ?? 'global' })),
    boundaries: raw.boundaries.some(item => item.isNode) ? undefined : () => raw.boundaries.map(item => ({ alias: item.id, label: text(item.label), type: { text: boundaryType(item.type) }, parentBoundary: item.parent ?? 'global' })),
    rels: () => raw.rels.map(item => ({ ...(item.bidirectional ? { type: 'birel' } : item.backwards ? { type: 'rel_b' } : {}), from: item.from, to: item.to, label: text(item.label), techn: text(item.technology), descr: text('') })),
    absent: { shape: { ...WRAP('mermaid_core'), sprite: none, tags: none, link: none }, boundary: { ...WRAP('mermaid_core'), tags: none, link: none }, rel: { ...WRAP('mermaid_core'), type: "mermaid_core's C4 relation keeps no Rel_U/D/L/R direction", sprite: none, tags: none, link: none, descr: "mermaid_core's C4 relation keeps no description" } },
  }
}
// Pele and Bezel keep Mermaid's own C4 records with plain strings where Mermaid wraps text
// in { text }, each element's parent boundary as an object, and the boundary type already
// in Mermaid's spelling. Text wrapping is Mermaid's renderer configuration.
const portC4 = name => raw => ({
  type: raw.c4Type,
  shapes: () => raw.shapes.map(item => ({ alias: item.alias, label: text(item.label), descr: text(item.descr), ...(usesTechn(item.kind) ? { techn: text(item.techn) } : {}), typeC4Shape: { text: item.kind }, parentBoundary: item.parent?.alias ?? 'global', ...optional(['sprite', 'tags', 'link'], { sprite: item.sprite, tags: item.tags, link: item.link }) })),
  boundaries: () => raw.boundaries.filter(item => item.alias !== 'global').map(item => ({ alias: item.alias, label: text(item.label), type: { text: item.type }, parentBoundary: item.parent?.alias ?? 'global', link: item.link ?? undefined, tags: item.tags ?? undefined })),
  rels: () => raw.rels.map(item => ({ type: item.type, from: item.from, to: item.to, label: text(item.label), techn: text(item.techn), descr: text(item.descr), ...optional(['sprite', 'tags', 'link'], { sprite: item.sprite, tags: item.tags, link: item.link }) })),
  absent: { shape: WRAP(name), boundary: WRAP(name), rel: WRAP(name) },
})
C4['obsidianmd/pele'] = portC4('Pele')
C4['crabtalk/bezel'] = portC4('Bezel')
C4['orestesgaolin/mermaid'] = dartC4
C4['pub:mermaid_flutter'] = dartC4
// merslim 0.2.3 parseToIR c4: elements with a hyphenated kind ('system-external',
// 'container-db', 'system-boundary'); boundaries are elements too (a plain boundary keeps
// its written type as description), and children name their parent. Relations keep no
// macro, so their direction is not recorded. The third positional argument of a person
// or system is kept as technology.
C4['emtyty/merslim'] = raw => {
  const isBoundary = item => /(^|-)boundary$/.test(item.kind)
  const typeOf = kind => { const parts = kind.split('-'), external = parts.includes('external'); return (external ? 'external_' : '') + parts.filter(part => part !== 'external').join('_') }
  const none = "Merslim's C4 model keeps no sprites, tags or links"
  return {
    type: raw.variant ? 'C4' + raw.variant[0].toUpperCase() + raw.variant.slice(1) : undefined,
    shapes: () => raw.elements.filter(item => !isBoundary(item)).map(item => { const type = typeOf(item.kind); return { alias: item.id, label: text(item.label), descr: text(item.description), ...(usesTechn(type) ? { techn: text(item.technology) } : {}), typeC4Shape: { text: type }, parentBoundary: item.parent ?? 'global' } }),
    boundaries: () => raw.elements.filter(isBoundary).map(item => ({ alias: item.id, label: text(item.label), type: { text: { 'enterprise-boundary': 'ENTERPRISE', 'system-boundary': 'SYSTEM', 'container-boundary': 'CONTAINER' }[item.kind] ?? item.description ?? 'system' }, parentBoundary: item.parent ?? 'global' })),
    rels: () => (raw.relations ?? []).map(item => ({ from: item.source, to: item.target, label: text(item.label), techn: text(item.technology), descr: text('') })),
    absent: { shape: { ...WRAP('Merslim'), sprite: none, tags: none, link: none }, boundary: { ...WRAP('Merslim'), tags: none, link: none }, rel: { ...WRAP('Merslim'), type: "Merslim's C4 relation keeps no macro, so its direction is not recorded", sprite: none, tags: none, link: none, descr: "Merslim's C4 relation keeps no description" } },
  }
}

// Sequence diagrams. Mermaid's getMessages() is one flat list in source order: messages,
// notes (type NOTE, from/to the noted participants), activations, block start / section /
// end markers whose message is the block's label, and autonumber, each with its list
// index as id. `A->>+B` records activate on the message and then an activation; a model
// that keeps only the activation cannot say which.
const SEQ = { SOLID: 0, DOTTED: 1, NOTE: 2, SOLID_CROSS: 3, DOTTED_CROSS: 4, SOLID_OPEN: 5, DOTTED_OPEN: 6, LOOP_START: 10, LOOP_END: 11, ALT_START: 12, ALT_ELSE: 13, ALT_END: 14, OPT_START: 15, OPT_END: 16, ACTIVE_START: 17, ACTIVE_END: 18, PAR_START: 19, PAR_AND: 20, PAR_END: 21, RECT_START: 22, RECT_END: 23, SOLID_POINT: 24, DOTTED_POINT: 25, AUTONUMBER: 26, CRITICAL_START: 27, CRITICAL_OPTION: 28, CRITICAL_END: 29, BREAK_START: 30, BREAK_END: 31, PAR_OVER_START: 32, BIDIRECTIONAL_SOLID: 33, BIDIRECTIONAL_DOTTED: 34 }
const PLACEMENT = { leftof: 0, rightof: 1, over: 2 }
// Block kind -> [start, section, end] line types.
const SEQ_BLOCK = { loop: [SEQ.LOOP_START, undefined, SEQ.LOOP_END], alt: [SEQ.ALT_START, SEQ.ALT_ELSE, SEQ.ALT_END], par: [SEQ.PAR_START, SEQ.PAR_AND, SEQ.PAR_END], par_over: [SEQ.PAR_OVER_START, SEQ.PAR_AND, SEQ.PAR_END], opt: [SEQ.OPT_START, undefined, SEQ.OPT_END], critical: [SEQ.CRITICAL_START, SEQ.CRITICAL_OPTION, SEQ.CRITICAL_END], break: [SEQ.BREAK_START, undefined, SEQ.BREAK_END], rect: [SEQ.RECT_START, undefined, SEQ.RECT_END] }
const MESSAGE_FIELDS = ['id', 'from', 'to', 'message', 'wrap', 'type']
const SEQ_ABSENT = Symbol('absent for this message')
// sequenceDb's addSignal and addNote always set message, wrap (autoWrap when unwritten) and
// type on every message-list entry.
const SEQ_ALWAYS = ['message', 'wrap', 'type']
function sequenceView(entries, absent, hooks) {
  // The per-message absence marker is not part of the record (it would show in toEqual).
  const plain = fields => { const { [SEQ_ABSENT]: _absent, ...rest } = fields; return rest }
  const records = () => entries().map((fields, index) => record({ id: String(index), ...plain(fields) }, 'message', MESSAGE_FIELDS, { ...absent, ...(fields[SEQ_ABSENT] ?? {}) }, hooks, SEQ_ALWAYS))
  return {
    getMessages: records,
    getNotes: () => entries().filter(item => item.type === SEQ.NOTE).map(item => record({ actor: item.from === item.to ? item.from : [item.from, item.to], placement: item.placement, message: item.message, ...('wrap' in item ? { wrap: item.wrap } : {}) }, 'note', ['actor', 'placement', 'message', 'wrap'], absent, hooks)),
    LINETYPE: SEQ,
    PLACEMENT: { LEFTOF: 0, RIGHTOF: 1, OVER: 2 },
  }
}
const noteEnds = list => [list[0], list.length > 1 ? list[1] : list[0]]
const SEQUENCE = {
  // termaid sequence model: events in order; a block nests its events and its further
  // sections; activations are their own events; autonumber is one flag.
  'fasouto/termaid': (raw, hooks) => {
    const ARROW = { solid: { arrow: SEQ.SOLID, open: SEQ.SOLID_OPEN, cross: SEQ.SOLID_CROSS, async: SEQ.SOLID_POINT, bidirectional: SEQ.BIDIRECTIONAL_SOLID }, dotted: { arrow: SEQ.DOTTED, open: SEQ.DOTTED_OPEN, cross: SEQ.DOTTED_CROSS, async: SEQ.DOTTED_POINT, bidirectional: SEQ.BIDIRECTIONAL_DOTTED } }
    const plain = { activate: false }
    const flatten = events => events.flatMap(event => {
      if ('source' in event && 'target' in event) {
        const type = ARROW[event.line_type]?.[event.arrow_type]
        if (type === undefined) return hooks.unavailable(`termaid sequence arrow ${event.line_type}/${event.arrow_type}`)
        return [{ from: event.source, to: event.target, message: event.label ?? '', type, [SEQ_ABSENT]: { activate: "termaid records A->>+B as a message followed by an activation, the same as an activate line" } }]
      }
      if ('text' in event && 'position' in event) { const [from, to] = noteEnds(event.participants); return [{ from, to, message: event.text, type: SEQ.NOTE, placement: PLACEMENT[event.position] }] }
      if ('participant' in event && 'active' in event) return [{ from: event.participant, to: undefined, message: '', type: event.active ? SEQ.ACTIVE_START : SEQ.ACTIVE_END, ...plain }]
      if ('kind' in event && Array.isArray(event.events)) {
        const block = SEQ_BLOCK[event.kind]
        if (!block || (event.sections?.length && block[1] === undefined)) return hooks.unavailable('termaid sequence block ' + event.kind)
        return [
          { from: undefined, to: undefined, message: event.label ?? '', type: block[0], ...plain },
          ...flatten(event.events),
          ...(event.sections ?? []).flatMap(section => [{ from: undefined, to: undefined, message: section.label ?? '', type: block[1], ...plain }, ...flatten(section.events)]),
          { from: undefined, to: undefined, message: '', type: block[2], ...plain },
        ]
      }
      return hooks.unavailable('termaid sequence event ' + Object.keys(event).join(','))
    })
    return {
      entries: () => (raw.autonumber ? hooks.unsupported('termaid keeps autonumber as one flag, not where it was written or its start and step') : flatten(raw.events)),
      absent: { wrap: "termaid's sequence model keeps no text wrapping per message" },
    }
  },
}
// mermaid_core 0.3.2 (Mermaid Dart and Flutter): one flat event list in which a block
// start names its kind, a { label } entry opens the next section and {} closes the block;
// messages and notes keep their own wrap flag.
const dartSequence = (raw, hooks) => {
  const ARROW = { solidArrow: SEQ.SOLID, dottedArrow: SEQ.DOTTED, solidOpen: SEQ.SOLID_OPEN, dottedOpen: SEQ.DOTTED_OPEN, solidCross: SEQ.SOLID_CROSS, dottedCross: SEQ.DOTTED_CROSS, solidPoint: SEQ.SOLID_POINT, dottedPoint: SEQ.DOTTED_POINT, bidirectionalSolid: SEQ.BIDIRECTIONAL_SOLID, bidirectionalDotted: SEQ.BIDIRECTIONAL_DOTTED }
  const KIND = { loop: 'loop', alt: 'alt', par: 'par', parOver: 'par_over', opt: 'opt', critical: 'critical', breakBlock: 'break', rect: 'rect' }
  const noWrap = { [SEQ_ABSENT]: { wrap: "mermaid_core keeps a wrap flag only on messages and notes" } }
  return {
    entries: () => {
      const stack = []
      return raw.events.map(event => {
        const keys = Object.keys(event)
        if ('from' in event && 'arrow' in event) {
          const type = ARROW[event.arrow]
          if (type === undefined) return hooks.unavailable('mermaid_core sequence arrow ' + event.arrow)
          return { from: event.from, to: event.to, message: event.text ?? '', wrap: event.wrap, type, [SEQ_ABSENT]: { activate: "mermaid_core records A->>+B as a message followed by an activation, the same as an activate line" } }
        }
        if ('placement' in event) return { from: event.target, to: event.target2 ?? event.target, message: event.text ?? '', wrap: event.wrap, type: SEQ.NOTE, placement: PLACEMENT[String(event.placement).toLowerCase()] }
        if ('active' in event && 'id' in event) return { from: event.id, to: undefined, message: '', type: event.active ? SEQ.ACTIVE_START : SEQ.ACTIVE_END, activate: false, ...noWrap }
        if ('on' in event) return { from: undefined, to: undefined, message: { start: event.start ?? undefined, step: event.step ?? undefined, visible: event.on }, wrap: false, type: SEQ.AUTONUMBER }
        if ('kind' in event) {
          const block = SEQ_BLOCK[KIND[event.kind]]
          if (!block) return hooks.unavailable('mermaid_core sequence block ' + event.kind)
          stack.push(block)
          return { from: undefined, to: undefined, message: event.kind === 'rect' ? event.color ?? '' : event.label ?? '', type: block[0], activate: false, ...noWrap }
        }
        if (keys.length === 1 && keys[0] === 'label') {
          const block = stack.at(-1)
          if (!block?.[1]) return hooks.unavailable('mermaid_core sequence section outside a sectioned block')
          return { from: undefined, to: undefined, message: event.label ?? '', type: block[1], activate: false, ...noWrap }
        }
        if (keys.length === 0) {
          const block = stack.pop()
          if (!block) return hooks.unavailable('mermaid_core sequence block end without a start')
          return { from: undefined, to: undefined, message: '', type: block[2], activate: false, ...noWrap }
        }
        return hooks.unavailable('mermaid_core sequence event ' + keys.join(','))
      })
    },
    absent: {},
  }
}
SEQUENCE['orestesgaolin/mermaid'] = dartSequence
SEQUENCE['pub:mermaid_flutter'] = dartSequence

// Sequence participants. Mermaid's getActors() is a Map in declaration order whose
// records link to their neighbours (prevActor / nextActor); description is the alias, or
// the id when none was given.
const ACTOR_FIELDS = ['name', 'description', 'type', 'wrap', 'links', 'properties', 'prevActor', 'nextActor', 'box', 'actorCnt']
function actorsView(list, absent, hooks) {
  const actors = () => new Map(list().map(([id, label], index, all) => [id, record({ name: id, description: label, prevActor: all[index - 1]?.[0], nextActor: all[index + 1]?.[0] }, 'actor', ACTOR_FIELDS, absent, hooks)]))
  return { getActors: actors, getActor: id => actors().get(id), getActorKeys: () => list().map(([id]) => id) }
}
const indexedLabels = raw => entriesOf(raw.index).sort((a, b) => a[1] - b[1]).map(([id, index]) => [id, raw.labels[index]])
const ACTORS = {
  // Grok, its Go port MermaidText and Loom: an id -> index table over one label list.
  'xai-org/grok-build': raw => ({ list: () => indexedLabels(raw), name: 'Grok' }),
  'spacedock-dev/mermaidtext': raw => ({ list: () => indexedLabels(raw), name: 'MermaidText' }),
  'Yassimba/loom': raw => ({ list: () => indexedLabels(raw), name: 'Loom' }),
  // mermaid-rs-renderer: sequence_participants in order, each a node whose shape is the
  // same ActorBox for a participant and an actor.
  '1jehuang/mermaid-rs-renderer': raw => ({ list: () => raw.sequence_participants.map(id => [id, raw.nodes[id]?.label ?? id]), name: 'mermaid-rs-renderer' }),
  // mermaid-ascii pkg/sequence: Participants with ID, Label and Index.
  'AlexanderGrooff/mermaid-ascii': raw => ({ list: () => [...raw.Participants].sort((a, b) => a.Index - b.Index).map(p => [p.ID, p.Label]), name: 'mermaid-ascii' }),
}
const actorAbsent = name => ({ type: `${name} records a participant and an actor the same way`, wrap: `${name} keeps no text wrapping per participant`, links: `${name} keeps no participant links`, properties: `${name} keeps no participant properties`, box: `${name}'s participant model keeps no boxes` })

// Pele, Bezel and Latias94/merman keep Mermaid's own treeView and kanban records.
const deepUnset = value => (Array.isArray(value) ? value.map(deepUnset) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, item === null ? undefined : deepUnset(item)])) : value)
const PORTS = ['obsidianmd/pele', 'crabtalk/bezel', 'Latias94/merman']
// Kanban getData(): one node per section followed by its items. Mermaid's look and
// config, and the item's rx, ry and cssStyles, are its renderer's settings.
const KANBAN_FIELDS = ['id', 'label', 'labelType', 'isGroup', 'shape', 'level', 'look']
const KANBAN_RENDERER = { look: "Mermaid's kanban look is its renderer's configuration", rx: "a kanban item's corner radius is Mermaid's renderer setting", ry: "a kanban item's corner radius is Mermaid's renderer setting", cssStyles: "a kanban item's text alignment style is Mermaid's renderer setting", width: "a kanban section's width is Mermaid's renderer setting", padding: "a kanban section's padding is Mermaid's renderer setting" }
function kanbanView(project, raw, hooks) {
  // Bezel and Pele nest each section's items; Latias94/merman lists getData's nodes.
  // A section's icon and CSS classes are kept on Mermaid's section record when written.
  const sections = raw.sections.map(section => ({ id: section.id, label: section.label, level: section.level, isGroup: false, ...(section.ticket !== undefined ? { ticket: section.ticket ?? undefined } : {}), ...(section.icon != null ? { icon: section.icon } : {}), ...(section.cssClasses != null ? { cssClasses: section.cssClasses } : {}) }))
  const items = section => (raw.nodes ? raw.nodes.filter(node => node.parentId === section.id) : raw.sections.find(item => item.id === section.id)?.items ?? [])
  const node = fields => record(deepUnset(fields), 'kanban node', KANBAN_FIELDS, KANBAN_RENDERER, hooks)
  return {
    getSections: () => sections.map(section => record(section, 'kanban section', ['id', 'label', 'level', 'width', 'padding', 'isGroup', 'icon', 'cssClasses'], KANBAN_RENDERER, hooks)),
    getData: () => ({
      nodes: sections.flatMap(section => [
        node({ id: section.id, label: section.label, labelType: 'markdown', isGroup: true, ticket: section.ticket, shape: 'kanbanSection', level: section.level }),
        ...items(section).map(item => node({ id: item.id, parentId: section.id, label: item.label, labelType: 'markdown', isGroup: false, ticket: item.ticket, priority: item.priority, assigned: item.assigned, icon: item.icon, shape: 'kanbanItem', level: item.level })),
      ]),
      edges: [],
      other: {},
      get config() { return hooks.unsupported("Mermaid's kanban getData config is its renderer's configuration") },
    }),
  }
}

// Event modeling. Mermaid's getState().relations holds each drawn relation as a source and
// target box, and a box's frame.name is the frame id written after tf/rf. Pele and Bezel
// keep those relations themselves, each naming its source and target box by that id, so
// only the endpoints are claimed; every other field of the state, a box or a frame stays
// unmapped. Projects that keep frames but not the relations Mermaid derives from them are
// not given relations: deriving them would be Trident applying Mermaid's own rules.
const EVENT_RELATION_PORTS = ['obsidianmd/pele', 'crabtalk/bezel']
function eventModelState(raw, hooks) {
  const box = item => record({ frame: record({ name: item.id }, 'event modeling frame', ['name', 'kind', 'entity'], {}, hooks) }, 'event modeling box', ['frame', 'x', 'y', 'width', 'height'], {}, hooks)
  const relations = raw.relations.map(relation => record({ sourceBox: box(relation.source), targetBox: box(relation.target) }, 'event modeling relation', ['sourceBox', 'targetBox'], {}, hooks))
  return record({ relations }, 'event modeling state', ['relations', 'boxes', 'swimlanes', 'notes', 'specifications', 'entities'], {}, hooks)
}

// Requirement layout data (RequirementDB.getData at the pinned tag). As for flowcharts,
// only Mermaid's translation of the parse state is reproduced: one edge per relation in
// order, with id `${src}-${dst}-${index}`, the endpoint names and the <<type>> label.
// Edge styling and arrowheads are its renderer's; nodes are not mapped.
const REQUIREMENT_DATA_PORTS = ['obsidianmd/pele']
const REQUIREMENT_EDGE_RENDERER = Object.fromEntries(['labelpos', 'thickness', 'classes', 'arrowTypeStart', 'arrowTypeEnd', 'style', 'pattern', 'look', 'labelType', 'type'].map(field => [field, "Mermaid's renderer decides this requirement edge field; it is not part of a parse result"]))
function requirementLayoutData(raw, hooks) {
  const named = id => raw.requirements?.[id]?.name ?? raw.elements?.[id]?.name
  const edges = raw.relations.map((relation, index) => record({ id: `${relation.src}-${relation.dst}-${index}`, start: named(relation.src), end: named(relation.dst), label: `&lt;&lt;${relation.type}&gt;&gt;` }, 'requirement layout edge', ['id', 'start', 'end', 'label'], REQUIREMENT_EDGE_RENDERER, hooks))
  return record({ edges, direction: raw.direction }, 'requirement layout data', ['nodes', 'edges', 'other', 'config', 'direction'], { config: "Mermaid's requirement getData config is its renderer's configuration" }, hooks)
}

// XY charts. Pele keeps Mermaid's own chart record: band or linear axes and plots of
// [category, value] pairs with their titles. A plot's stroke and fill come from Mermaid's
// theme palette at parse time, which is its renderer's colour scheme, not a parse result.
const XYCHART_PORTS = ['obsidianmd/pele']
const XYCHART_COLOUR = { strokeFill: "Mermaid assigns a plot's colour from its theme palette", strokeWidth: "Mermaid's line width is a theme setting", fill: "Mermaid assigns a plot's colour from its theme palette" }
function xyChartData(raw, hooks) {
  const axis = value => record({ ...value }, 'xychart axis', ['type', 'title', 'categories', 'min', 'max'], {}, hooks)
  const plot = value => record({ type: value.type, title: value.title ?? '', data: value.data.map(point => [...point]), ...(value.pointLabels ? { pointLabels: [...value.pointLabels] } : {}) }, 'xychart plot', ['type', 'title', 'data', 'pointLabels'], XYCHART_COLOUR, hooks)
  return record({ title: raw.title ?? '', xAxis: axis(raw.xAxis), yAxis: axis(raw.yAxis), plots: raw.plots.map(plot) }, 'xychart data', ['title', 'xAxis', 'yAxis', 'plots'], {}, hooks)
}

// Git graphs. Mermaid's getCommits() and getBranches() are Maps (commit id -> commit,
// branch name -> head commit id). Bezel mirrors both; Latias94/merman lists commits and
// branch names, without each branch's head.
class BranchNames extends Map {
  constructor(names, hooks) {
    super(names.map(name => [name, undefined]))
    this.hooks = hooks
  }
  get() { return this.hooks.unavailable("Latias94/merman's branch list carries no head commit") }
  values() { return this.get() }
  entries() { return this.get() }
  forEach() { return this.get() }
  [Symbol.iterator]() { return this.get() }
}
const unsetCommit = commit => Object.fromEntries(Object.entries(commit).map(([key, value]) => [key, value === null ? undefined : value]))
const GITGRAPH = {
  'crabtalk/bezel': raw => ({
    getCommits: () => new Map(entriesOf(raw.commits)),
    getCommitsArray: () => entriesOf(raw.commits).map(([, commit]) => commit).sort((a, b) => a.seq - b.seq),
    getBranches: () => new Map(entriesOf(raw.branches)),
    getCurrentBranch: () => raw.currentBranch,
    getDirection: () => raw.direction,
    getHead: () => raw.head,
  }),
  'Latias94/merman': (raw, hooks) => ({
    getCommits: () => new Map(raw.commits.map(commit => [commit.id, unsetCommit(commit)])),
    getCommitsArray: () => raw.commits.map(unsetCommit).sort((a, b) => a.seq - b.seq),
    getBranches: () => new BranchNames(raw.branches.map(branch => branch.name), hooks),
    getCurrentBranch: () => raw.currentBranch,
    getDirection: () => raw.direction,
  }),
}

// Mermaid's constant vocabularies at the pinned tag (requirementDb.ts, erDb.ts,
// sequenceDb.ts, gitGraphTypes.ts, classDb.ts). Tests use them to build input and to
// state expectations, so they are supplied only where values are already in Mermaid's
// vocabulary: a reviewed view that translates them, or a port that keeps Mermaid's own.
export const MERMAID_CONSTANTS = {
  requirement: {
    RequirementType: { REQUIREMENT: 'Requirement', FUNCTIONAL_REQUIREMENT: 'Functional Requirement', INTERFACE_REQUIREMENT: 'Interface Requirement', PERFORMANCE_REQUIREMENT: 'Performance Requirement', PHYSICAL_REQUIREMENT: 'Physical Requirement', DESIGN_CONSTRAINT: 'Design Constraint' },
    RiskLevel: { LOW_RISK: 'Low', MED_RISK: 'Medium', HIGH_RISK: 'High' },
    VerifyType: { VERIFY_ANALYSIS: 'Analysis', VERIFY_DEMONSTRATION: 'Demonstration', VERIFY_INSPECTION: 'Inspection', VERIFY_TEST: 'Test' },
    Relationships: { CONTAINS: 'contains', COPIES: 'copies', DERIVES: 'derives', SATISFIES: 'satisfies', VERIFIES: 'verifies', REFINES: 'refines', TRACES: 'traces' },
  },
  er: {
    Cardinality: { ZERO_OR_ONE: 'ZERO_OR_ONE', ZERO_OR_MORE: 'ZERO_OR_MORE', ONE_OR_MORE: 'ONE_OR_MORE', ONLY_ONE: 'ONLY_ONE', MD_PARENT: 'MD_PARENT' },
    Identification: { NON_IDENTIFYING: 'NON_IDENTIFYING', IDENTIFYING: 'IDENTIFYING' },
  },
  sequence: {
    LINETYPE: { SOLID: 0, DOTTED: 1, NOTE: 2, SOLID_CROSS: 3, DOTTED_CROSS: 4, SOLID_OPEN: 5, DOTTED_OPEN: 6, LOOP_START: 10, LOOP_END: 11, ALT_START: 12, ALT_ELSE: 13, ALT_END: 14, OPT_START: 15, OPT_END: 16, ACTIVE_START: 17, ACTIVE_END: 18, PAR_START: 19, PAR_AND: 20, PAR_END: 21, RECT_START: 22, RECT_END: 23, SOLID_POINT: 24, DOTTED_POINT: 25, AUTONUMBER: 26, CRITICAL_START: 27, CRITICAL_OPTION: 28, CRITICAL_END: 29, BREAK_START: 30, BREAK_END: 31, PAR_OVER_START: 32, BIDIRECTIONAL_SOLID: 33, BIDIRECTIONAL_DOTTED: 34, SOLID_TOP: 41, SOLID_BOTTOM: 42, STICK_TOP: 43, STICK_BOTTOM: 44, SOLID_ARROW_TOP_REVERSE: 45, SOLID_ARROW_BOTTOM_REVERSE: 46, STICK_ARROW_TOP_REVERSE: 47, STICK_ARROW_BOTTOM_REVERSE: 48, SOLID_TOP_DOTTED: 51, SOLID_BOTTOM_DOTTED: 52, STICK_TOP_DOTTED: 53, STICK_BOTTOM_DOTTED: 54, SOLID_ARROW_TOP_REVERSE_DOTTED: 55, SOLID_ARROW_BOTTOM_REVERSE_DOTTED: 56, STICK_ARROW_TOP_REVERSE_DOTTED: 57, STICK_ARROW_BOTTOM_REVERSE_DOTTED: 58, CENTRAL_CONNECTION: 59, CENTRAL_CONNECTION_REVERSE: 60, CENTRAL_CONNECTION_DUAL: 61 },
    ARROWTYPE: { FILLED: 0, OPEN: 1 },
    PLACEMENT: { LEFTOF: 0, RIGHTOF: 1, OVER: 2 },
  },
  gitgraph: { commitType: { NORMAL: 0, REVERSE: 1, HIGHLIGHT: 2, MERGE: 3, CHERRY_PICK: 4 } },
  class: { relationType: RELATION_TYPE, lineType: LINE_TYPE },
}
// Ports that keep Mermaid's own database field names and vocabularies (Latias94/merman
// also ships these constants in its model).
const MERMAID_VOCABULARY_PORTS = new Set(['obsidianmd/pele', 'crabtalk/bezel', 'Latias94/merman'])
/** Mermaid's constants for a family, where the target's values are in that vocabulary. */
// Requirement constants are the words a test writes into its source text (risk: High);
// a candidate's own values are still compared only through a view.
const SOURCE_VOCABULARY = new Set(['requirement'])
export function mermaidConstants(project, family, reviewed) {
  return reviewed || MERMAID_VOCABULARY_PORTS.has(project) || SOURCE_VOCABULARY.has(family) ? MERMAID_CONSTANTS[family] : undefined
}

/** Mermaid database getters from one bridged project's native model, or undefined
 * when this project and family have no reviewed view. Views in views/*.mjs add to (and
 * for the same getter, take precedence over) the views in this file. */
export function reviewedSchemaView(project, family, raw, hooks) {
  // Ondine has no parser model: render() reports acceptance or rejection only, so every
  // model observation is an operation it does not offer.
  if (project === 'wevm/ondine')
    return { whole: new Proxy({}, { get: (_target, key) => (typeof key === 'string' && /^get[A-Z]/.test(key) ? () => hooks.unsupported('Ondine exposes no parsed model; render() reports acceptance or rejection only') : undefined) }) }
  if (raw == null || typeof raw !== 'object') return undefined
  if (family === 'flowchart' && FLOWCHART[project]) return flowchartView(FLOWCHART[project](raw, project, hooks), hooks)
  // Latias94/merman names Mermaid's relation and line codes in its own constants block.
  const latiasCodes = project === 'Latias94/merman' && raw.constants?.relationType && raw.constants?.lineType
    ? { relationType: { AGGREGATION: raw.constants.relationType.aggregation, EXTENSION: raw.constants.relationType.extension, COMPOSITION: raw.constants.relationType.composition, DEPENDENCY: raw.constants.relationType.dependency, LOLLIPOP: raw.constants.relationType.lollipop }, lineType: { LINE: raw.constants.lineType.line, DOTTED_LINE: raw.constants.lineType.dottedLine } }
    : {}
  if (family === 'class' && (CLASS[project] || project in NO_CLASS_NOTES || ['Latias94/merman', 'crabtalk/bezel'].includes(project))) return { ...(CLASS[project] ? classView(CLASS[project](raw), hooks) : {}), ...latiasCodes, ...classNotes(project, raw, hooks) }
  if (family === 'er' && ER[project]) return erView(ER[project](raw), hooks)
  if (family === 'gitgraph' && GITGRAPH[project]) return GITGRAPH[project](raw, hooks)
  if (family === 'c4' && C4[project]) return c4View(C4[project](raw, hooks), hooks)
  if (family === 'treeview' && PORTS.includes(project) && raw.root) return { getRoot: () => deepUnset(raw.root), ...(typeof raw.count === 'number' ? { getCount: () => raw.count } : {}) }
  if (family === 'kanban' && PORTS.includes(project) && Array.isArray(raw.sections)) return kanbanView(project, raw, hooks)
  if (family === 'eventmodeling' && EVENT_RELATION_PORTS.includes(project) && Array.isArray(raw.relations)) return { getState: () => eventModelState(raw, hooks) }
  if (family === 'requirement' && REQUIREMENT_DATA_PORTS.includes(project) && Array.isArray(raw.relations) && typeof raw.getData !== 'function') return { getData: () => requirementLayoutData(raw, hooks) }
  if (family === 'xychart' && XYCHART_PORTS.includes(project) && Array.isArray(raw.plots) && raw.xAxis && raw.yAxis) return { getXYChartData: () => xyChartData(raw, hooks) }
  if (family === 'sequence' && (SEQUENCE[project] || ACTORS[project])) {
    const model = SEQUENCE[project]?.(raw, hooks), actors = ACTORS[project]?.(raw)
    return { ...(actors ? actorsView(actors.list, actorAbsent(actors.name), hooks) : {}), ...(model ? sequenceView(model.entries, model.absent, hooks) : {}) }
  }
  return undefined
}

// Langium AST views. The parser-package tests read the AST a Langium grammar returns.
// Bezel and Latias94/merman return Mermaid's resolved radar database instead: option
// defaults are merged in and an axis or curve label defaults to its name, so options
// and a label equal to its name cannot be told apart from what was written. Only the
// unambiguous parts are claimed; reading the rest is a Trident gap.
const AST_FIELDS = { Radar: ['title', 'accTitle', 'accDescr', 'axes', 'curves', 'options'], Axis: ['name', 'label'], Curve: ['name', 'label', 'entries'], Entry: ['axis', 'value'] }
function astNode(type, fields, hooks, absent = {}) {
  return record({ $type: type, ...fields }, type, AST_FIELDS[type] ?? [], absent, hooks)
}
// A resolved label equal to its name was either written that way or defaulted: only that
// ambiguous reading is unsupported (as for every view), not a Trident gap.
const named = (item, hooks, type, extra = {}) => astNode(type, { name: item.name, ...(item.label !== item.name ? { label: item.label } : {}), ...extra }, hooks, item.label === item.name ? { label: `the resolved ${type.toLowerCase()} records a label equal to its name the same as no label` } : {})
const DATABASE_AST = {
  Radar: (raw, hooks) =>
    astNode('Radar', {
      ...(raw.title != null ? { title: raw.title } : { title: undefined }),
      ...(raw.accTitle != null ? { accTitle: raw.accTitle } : { accTitle: undefined }),
      ...(raw.accDescr != null ? { accDescr: raw.accDescr } : { accDescr: undefined }),
      axes: raw.axes.map(axis => named(axis, hooks, 'Axis')),
      // The database lists a curve's values in axis order: whether an entry named its axis
      // ({ axis: value } rather than a bare value) is not kept.
      curves: raw.curves.map(curve => named(curve, hooks, 'Curve', { entries: curve.entries.map(value => astNode('Entry', { value }, hooks, { axis: "the resolved radar database lists a curve's values in axis order, not whether an entry named its axis" })) })),
    }, hooks, { options: 'the resolved radar database merges option defaults in, so written options cannot be told from defaults' }),
  Info: (_raw, hooks) => astNode('Info', {}, hooks),
}
// Pele, Bezel and Latias94/merman return Mermaid's database records for these families.
const PORT_AST = {
  ...DATABASE_AST,
  Architecture: (raw, hooks) => {
    const list = value => (Array.isArray(value) ? value : entriesOf(value).map(([, item]) => item))
    const services = (raw.services ?? list(raw.nodes).filter(node => node.type === 'service')).map(item => astNode('Service', { id: item.id, title: item.title ?? undefined, icon: item.icon ?? undefined, ...(item.in ? { in: item.in } : {}) }, hooks))
    const groups = list(raw.groups).map(item => astNode('Group', { id: item.id, title: item.title ?? undefined, icon: item.icon ?? undefined, ...(item.in ? { in: item.in } : {}) }, hooks))
    return astNode('Architecture', { title: raw.title ?? undefined, accTitle: raw.accTitle ?? undefined, accDescr: raw.accDescr ?? undefined, services, groups }, hooks)
  },
  // The database stores each node's indentation width as its level; the AST's indent is
  // that width, absent at the margin.
  TreeView: (raw, hooks) => {
    const nodes = []
    const walk = node => {
      for (const child of node.children ?? []) {
        // The database drops a directory's trailing slash into nodeType; the AST keeps it.
        nodes.push(astNode('TreeNode', { name: child.nodeType === 'directory' ? child.name + '/' : child.name, indent: child.level ? child.level : undefined, ...(child.cssClass ? { classAnnotation: child.cssClass } : {}), ...(child.icon === 'none' ? {} : { iconAnnotation: child.icon || undefined }), descAnnotation: child.description || undefined }, hooks))
        // icon 'none' is both an empty icon() and icon(none) in the database, so which was
        // written is not recoverable and the annotation stays unmapped.
        walk(child)
      }
    }
    if (raw.root) walk(raw.root)
    return astNode('TreeView', { nodes, title: raw.title ?? undefined, accTitle: raw.accTitle ?? undefined, accDescr: raw.accDescr ?? undefined }, hooks)
  },
  // Rows in source order are the pre-order walk of the tree, unless classDef rows are
  // interleaved: those are kept by name apart from the tree (Pele's as a Map), so their
  // position is not, and the row list is then not the database's to give. A :::class
  // selector is kept on its node; a row's indentation is kept only as tree depth.
  Treemap: (raw, hooks) => {
    const classDefs = raw.classes instanceof Map ? raw.classes.size : raw.classes && Object.keys(raw.classes).length
    const rows = []
    const walk = node => {
      // In Mermaid's AST a row is a Leaf exactly when a value was written.
      const item = astNode(node.value != null ? 'Leaf' : 'Section', { name: node.name, ...(node.value != null ? { value: node.value } : {}), classSelector: node.classSelector ?? undefined }, hooks)
      rows.push(astNode('TreemapRow', { item }, hooks, { indent: "Mermaid's treemap database keeps the tree, not each row's indentation" }))
      for (const child of node.children ?? []) walk(child)
    }
    if (!classDefs) for (const root of raw.roots ?? raw.root?.children ?? []) walk(root)
    const absent = classDefs ? { TreemapRows: "Mermaid's treemap database keeps classDefs by name, apart from the rows, so their position among the rows is not kept" } : {}
    return astNode('Treemap', { ...(classDefs ? {} : { TreemapRows: rows }), title: raw.title ?? undefined, accTitle: raw.accTitle ?? undefined, accDescr: raw.accDescr ?? undefined }, hooks, absent)
  },
}
Object.assign(AST_FIELDS, { Architecture: ['title', 'accTitle', 'accDescr', 'services', 'groups', 'junctions', 'edges'], Service: ['id', 'title', 'icon', 'iconText', 'in'], Group: ['id', 'title', 'icon', 'in'], TreeView: ['nodes', 'title', 'accTitle', 'accDescr'], TreeNode: ['name', 'indent', 'classAnnotation', 'iconAnnotation', 'descAnnotation'], Treemap: ['TreemapRows', 'title', 'accTitle', 'accDescr'], TreemapRow: ['item', 'indent'], Section: ['name', 'classSelector'], Leaf: ['name', 'value', 'classSelector'] })
// mermaid_core 0.3.2 (Mermaid Dart and Flutter): services list junctions with isJunction,
// groups carry label/parent, and treemap nodes carry label, value, children, isLeafNode.
// Its architecture model keeps no title or accessibility text.
const DART_AST = {
  Architecture: (raw, hooks) =>
    record({
      $type: 'Architecture',
      services: raw.services.filter(item => !item.isJunction).map(item => astNode('Service', { id: item.id, title: item.label || undefined, icon: item.icon ?? undefined, ...(item.group ? { in: item.group } : {}) }, hooks)),
      groups: raw.groups.map(item => astNode('Group', { id: item.id, title: item.label || undefined, icon: item.icon ?? undefined, ...(item.parent ? { in: item.parent } : {}) }, hooks)),
    }, 'Architecture', AST_FIELDS.Architecture, { title: "mermaid_core's architecture model keeps no title", accTitle: "mermaid_core's architecture model keeps no accessibility title", accDescr: "mermaid_core's architecture model keeps no accessibility description" }, hooks),
  // classDef rows are kept apart from the tree, in a map by name: their position among the
  // rows (and a repeated definition) is not kept, so with any classDef the row list is not
  // the model's to give. A row's indentation width is not kept either; a :::class selector is.
  Treemap: (raw, hooks) => {
    const classDefs = raw.classes instanceof Map ? raw.classes.size : raw.classes && Object.keys(raw.classes).length
    const absent = { accTitle: "mermaid_core's treemap parser accepts accTitle and ignores it", accDescr: "mermaid_core's treemap parser accepts accDescr and ignores it", ...(classDefs ? { TreemapRows: "mermaid_core keeps treemap classDefs in a map by name, apart from the rows, so their position among the rows is not kept" } : {}) }
    const rows = []
    const walk = node => {
      const item = astNode(node.isLeafNode ? 'Leaf' : 'Section', { name: node.label, ...(node.isLeafNode ? { value: node.value } : {}), classSelector: node.cssClass ?? undefined }, hooks)
      rows.push(astNode('TreemapRow', { item }, hooks, { indent: "mermaid_core keeps the treemap tree, not each row's indentation" }))
      for (const child of node.children ?? []) walk(child)
    }
    if (!classDefs) for (const root of raw.roots ?? []) walk(root)
    return astNode('Treemap', { ...(classDefs ? {} : { TreemapRows: rows }), title: raw.title ?? undefined }, hooks, absent)
  },
}
const AST_VIEWS = { 'crabtalk/bezel': PORT_AST, 'Latias94/merman': PORT_AST, 'obsidianmd/pele': PORT_AST, 'orestesgaolin/mermaid': DART_AST, 'pub:mermaid_flutter': DART_AST }

/** The Langium AST value for an accepted native parse. Without a reviewed view for the
 * family, an accepted parse is still an AST of that type, but every field is a gap. */
// Mermaid's layout data for flowcharts (FlowDB.getData at the pinned tag), computed from a
// candidate's own reviewed flowchart getters. Only the translation Mermaid applies to its
// parse state is reproduced: getTypeFromVertex for shapes, destructEdgeType for arrows,
// subgraph parent/group structure and getEdgeId. Values Mermaid's renderer decides itself
// (padding, look, compiled styles, colour slots, curve defaults, minimum widths, edge CSS
// and arrowhead styles, collapsed-subgraph metadata) are not the candidate's to supply, so
// reading them is unsupported.
const LAYOUT_RENDERER_ONLY = Object.fromEntries(['padding', 'look', 'cssCompiledStyles', 'labelStyle', 'colorIndex', 'minWidth', 'curve', 'arrowheadStyle', 'metadata', 'width', 'height', 'rx', 'ry', 'stepDuration', 'showStepNumber'].map(field => [field, "Mermaid's renderer decides this layout field; it is not part of a parse result"]))
const LAYOUT_NODE_FIELDS = ['id', 'label', 'labelType', 'parentId', 'cssStyles', 'cssClasses', 'dir', 'domId', 'link', 'linkTarget', 'tooltip', 'icon', 'pos', 'img', 'assetWidth', 'assetHeight', 'constraint', 'isGroup', 'shape']
// A step edge's step and stepCount (FlowDB getData: the largest positive-integer step) come
// from the written `e1@{ step: n }`; they are read only from an edge record that keeps a
// step, so a model that drops steps leaves them unmapped rather than silently absent.
const LAYOUT_EDGE_FIELDS = ['id', 'isUserDefinedId', 'start', 'end', 'type', 'label', 'labelType', 'labelpos', 'thickness', 'minlen', 'classes', 'arrowTypeStart', 'arrowTypeEnd', 'style', 'pattern', 'animate', 'animation', 'step', 'stepCount']
const isStepEdge = edge => Number.isInteger(edge.step) && edge.step > 0
// A port that keeps Mermaid's own vertex records leaves `type` out for an undeclared shape,
// exactly as Mermaid does; for any other model a missing type stays unmapped.
const layoutShape = (vertex, mermaidVocabulary) => {
  if (vertex.img) return 'imageSquare'
  if (vertex.icon) return { circle: 'iconCircle', square: 'iconSquare', rounded: 'iconRounded' }[vertex.form] ?? 'icon'
  const type = mermaidVocabulary && !('type' in vertex) ? undefined : vertex.type
  return type === 'square' || type === undefined ? 'squareRect' : type === 'round' ? 'roundedRect' : type
}
const arrowEnds = type => {
  if (['arrow_point', 'arrow_circle', 'arrow_cross'].includes(type)) return ['none', type]
  if (['double_arrow_point', 'double_arrow_circle', 'double_arrow_cross'].includes(type)) return [type.replace('double_', ''), type.replace('double_', '')]
  return ['none', 'arrow_point']
}
export function flowchartLayoutData(view, hooks, project) {
  const mermaidVocabulary = MERMAID_VOCABULARY_PORTS.has(project)
  return () => {
    const subGraphs = view.getSubGraphs ? view.getSubGraphs() : []
    const vertices = view.getVertices(), edges = view.getEdges ? view.getEdges() : []
    const parentOf = new Map(), groups = new Set(), nodes = []
    for (let i = subGraphs.length - 1; i >= 0; i--) {
      const sg = subGraphs[i]
      if (sg.nodes.length) groups.add(sg.id)
      for (const id of sg.nodes) parentOf.set(id, sg.id)
    }
    const node = fields => record(fields, 'layout node', LAYOUT_NODE_FIELDS, LAYOUT_RENDERER_ONLY, hooks)
    const lazy = (fields, getters) => {
      for (const [key, get] of Object.entries(getters)) Object.defineProperty(fields, key, { get, enumerable: true, configurable: true })
      return fields
    }
    for (let i = subGraphs.length - 1; i >= 0; i--) {
      const sg = subGraphs[i]
      nodes.push(node({ id: sg.id, label: sg.title, labelType: sg.labelType, parentId: parentOf.get(sg.id), cssClasses: (sg.classes ?? []).join(' '), shape: 'rect', dir: sg.dir, isGroup: true }))
    }
    // Vertex-derived fields are read when a test reads them, so an unmapped or absent
    // vertex field surfaces as that test's gap or unsupported verdict, not as undefined.
    const groupNodes = new Set(nodes.map(n => n.id))
    for (const [id, vertex] of vertices) {
      if (groupNodes.has(id)) continue
      groupNodes.add(id)
      const isGroup = groups.has(id)
      nodes.push(node(lazy({ id, parentId: parentOf.get(id), isGroup }, {
        label: () => vertex.text, labelType: () => vertex.labelType, cssStyles: () => vertex.styles, cssClasses: () => 'default ' + (vertex.classes ?? []).join(' '),
        dir: () => vertex.dir, domId: () => vertex.domId, link: () => vertex.link, linkTarget: () => vertex.linkTarget, icon: () => vertex.icon, pos: () => vertex.pos,
        img: () => vertex.img, assetWidth: () => vertex.assetWidth, assetHeight: () => vertex.assetHeight, constraint: () => vertex.constraint,
        shape: () => (isGroup ? 'rect' : layoutShape(vertex, mermaidVocabulary)),
      })))
    }
    const keptStep = edge => typeof edge === 'object' && edge !== null && Object.keys(edge).includes('step')
    const stepCount = () => edges.reduce((max, edge) => (keptStep(edge) && isStepEdge(edge) ? Math.max(max, edge.step) : max), 0)
    const layoutEdges = edges.map((edge, index) =>
      record(lazy({ start: edge.start, end: edge.end, labelpos: 'c' }, {
        ...(keptStep(edge) && isStepEdge(edge) ? { step: () => edge.step, stepCount } : {}),
        id: () => ('id' in edge && edge.id ? edge.id : `L_${edge.start}_${edge.end}_${index}`), isUserDefinedId: () => edge.isUserDefinedId, type: () => edge.type ?? 'normal',
        label: () => edge.text, labelType: () => edge.labelType, thickness: () => edge.stroke, minlen: () => edge.length,
        classes: () => (edge.stroke === 'invisible' ? '' : 'edge-thickness-normal edge-pattern-solid flowchart-link'),
        arrowTypeStart: () => (edge.stroke === 'invisible' || edge.type === 'arrow_open' ? 'none' : arrowEnds(edge.type)[0]),
        arrowTypeEnd: () => (edge.stroke === 'invisible' || edge.type === 'arrow_open' ? 'none' : arrowEnds(edge.type)[1]),
        style: () => edge.style ?? [], pattern: () => edge.stroke, animate: () => edge.animate, animation: () => edge.animation,
      }), 'layout edge', LAYOUT_EDGE_FIELDS, LAYOUT_RENDERER_ONLY, hooks))
    return record({ nodes, edges: layoutEdges, other: {} }, 'layout data', ['nodes', 'edges', 'other', 'config'], { config: "Mermaid's host configuration is not part of a parse result" }, hooks)
  }
}

// Pure view helpers and base mappings. This module never imports the registry.
export {
  entriesOf, record, styleList, CLASS_ALWAYS, VERTEX_FIELDS, EDGE_FIELDS, SUBGRAPH_FIELDS, shapeOf, headOf, strokeOf, directionOf, edgeType, styleStrings, VERTEX_ABSENT, flowchartView,
  unset, deepUnset, text, optional, snake, card, endOf, RELATION_TYPE, LINE_TYPE, LINE_ABSENT, classView, relation, erView, cardWord, CARD_SYMBOL, identifying,
  c4View, C4_MACRO, C4_REL_MACRO, C4_BOUNDARY_MACRO, usesTechn, WRAP, SEQ, PLACEMENT, SEQ_BLOCK, SEQ_ABSENT, SEQ_ALWAYS, sequenceView, actorsView, kanbanView, astNode,
}

export function reviewedAstView(project, family, raw, hooks) {
  const view = AST_VIEWS[project]?.[family]
  return view && raw && typeof raw === 'object' ? view(raw, hooks) : undefined
}
export function unavailableAstView(project, astFamily, hooks) {
  const benign = key => typeof key !== 'string' || ['then', 'toJSON', 'asymmetricMatch', 'nodeType', 'constructor', '$$typeof', '@@__IMMUTABLE_ITERABLE__@@', '@@__IMMUTABLE_RECORD__@@'].includes(key)
  const missing = key => hooks.unavailable(`Native ${astFamily} AST field ${String(key)} has no reviewed view for this project`)
  return new Proxy({ $type: astFamily }, {
    get(target, key) { return key in target || benign(key) ? target[key] : missing(key) },
    has(target, key) { return key in target || benign(key) ? key in target : missing(key) },
    getOwnPropertyDescriptor(target, key) { return key in target || benign(key) ? Reflect.getOwnPropertyDescriptor(target, key) : missing(key) },
  })
}
