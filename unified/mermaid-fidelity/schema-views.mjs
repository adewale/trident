// Reviewed native schema views for out-of-process parser bridges.
//
// Each view reads one project's own parser model, field by field, and answers the
// Mermaid database getters the original tests call. Every mapping below was checked
// against the project's own type definitions or parser source at the pinned version.
// A view never parses source text, never re-splits a display string into fields and
// never fills in a value the native model does not carry:
//   - a field the model carries under another name or encoding is translated;
//   - a concept the model does not carry at all is declared absent with its reason,
//     and reading it is that project's unsupported operation (a known nonpass);
//   - anything else the tests read stays a Trident gap.

const entriesOf = value => value instanceof Map ? [...value] : value && typeof value === 'object' ? Object.entries(value) : []

/** A Mermaid-shaped record. Reading a declared-absent field is unsupported; reading a
 * field the tests expect but the view has not mapped is a Trident gap. */
function record(object, label, expected, absent, hooks) {
  const missing = key => {
    if (typeof key !== 'string' || key in object) return false
    if (absent[key]) return hooks.unsupported(absent[key])
    if (expected.includes(key)) return hooks.unavailable(label + '.' + key)
    return false
  }
  return new Proxy(object, {
    get(target, key) { if (!(key in target)) missing(key); return target[key] },
    has(target, key) { if (!(key in target)) missing(key); return key in target },
    getOwnPropertyDescriptor(target, key) { if (!(key in target)) missing(key); return Object.getOwnPropertyDescriptor(target, key) },
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

/** One flowchart view from a project-specific reading of nodes, edges and groups. */
function flowchartView(model, hooks) {
  const { nodes, edges, subgraphs, direction, absent } = model
  const vertex = (id, fields) => record({ id, labelType: 'text', ...fields }, 'vertex', VERTEX_FIELDS, absent.vertex ?? {}, hooks)
  const view = {}
  view.getVertices = () => new Map(nodes().map(([id, fields]) => [id, vertex(id, fields)]))
  view.getEdges = () =>
    edges().map(fields => {
      if (fields.type === undefined && !(absent.edge ?? {}).type) return hooks.unavailable('Unmapped native flowchart edge markers')
      return record({ text: '', labelType: 'text', ...fields }, 'edge', EDGE_FIELDS, absent.edge ?? {}, hooks)
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
    nodes: () => entriesOf(graph.nodes).map(([id, node]) => [id, { text: node.label, ...(node.shape === 'plain' ? { type: undefined } : shapeOf(node.shape) ? { type: shapeOf(node.shape) } : {}), classes: node.classes ?? [], styles: styleStrings(node.styles), ...(node.link ? { link: node.link } : {}), ...(node.tooltip ? { tooltip: node.tooltip } : {}) }]),
    edges: () => graph.edges.map(edge => ({ start: edge.from, end: edge.to, text: edge.label ?? '', type: edgeType(headOf(edge.headFrom), headOf(edge.headTo)), stroke: strokeOf(edge.stroke), length: edge.minLen, ...(edge.interpolate ? { interpolate: edge.interpolate } : {}), style: styleStrings(edge.styles) })),
    subgraphs: () => graph.subgraphs.map(group => ({ id: group.id, title: group.title, nodes: group.nodeIds, ...(group.direction ? { dir: group.direction.toUpperCase() } : {}) })),
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
function asciiGraph(graph, hooks) {
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

const FLOWCHART = {
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
}

// Class diagrams. Mermaid's ClassDB codes a relation end as AGGREGATION 0, EXTENSION 1,
// COMPOSITION 2, DEPENDENCY 3, LOLLIPOP 4 or 'none', and a line as LINE 0 or DOTTED_LINE 1;
// type1 is the marker at id1, the relation's left-hand class.
const RELATION_TYPE = { AGGREGATION: 0, EXTENSION: 1, COMPOSITION: 2, DEPENDENCY: 3, LOLLIPOP: 4 }
const LINE_TYPE = { LINE: 0, DOTTED_LINE: 1 }
const END = { extension: 1, triangle: 1, '<|': 1, '|>': 1, composition: 2, diamondfill: 2, '*': 2, aggregation: 0, diamondopen: 0, o: 0, dependency: 3, arrow: 3, '<': 3, '>': 3, lollipop: 4, '()': 4, none: 'none', '': 'none' }
const endOf = marker => (typeof marker === 'string' ? END[marker.toLowerCase().replace(/^head/, '')] : undefined)
const CLASS_FIELDS = ['id', 'type', 'label', 'text', 'cssClasses', 'methods', 'members', 'annotations', 'domId', 'styles', 'parent', 'link', 'linkTarget', 'haveCallback', 'tooltip']
const MEMBER_FIELDS = ['id', 'memberType', 'visibility', 'classifier', 'parameters', 'returnType', 'text', 'cssStyle', 'getDisplayDetails']
const RELATION_FIELDS = ['id1', 'id2', 'relation', 'relationTitle1', 'relationTitle2', 'title']
function classView(model, hooks) {
  const { classes, relations, absent } = model
  // Members are counted; their Mermaid ClassMember fields are not claimed.
  const member = () => record({}, 'class member', MEMBER_FIELDS, {}, hooks)
  const node = (id, fields) => record({ id, ...fields, ...(fields.members ? { members: fields.members.map(member) } : {}), ...(fields.methods ? { methods: fields.methods.map(member) } : {}) }, 'class', CLASS_FIELDS, absent.class ?? {}, hooks)
  const map = () => new Map(classes().map(([id, fields]) => [id, node(id, fields)]))
  const view = { getClasses: map, getClass: id => map().get(id), relationType: RELATION_TYPE, lineType: LINE_TYPE }
  if (relations)
    view.getRelations = () =>
      relations().map(fields => {
        const { type1, type2, lineType } = fields.relation
        if (type1 === undefined || type2 === undefined || lineType === undefined) return hooks.unavailable('Unmapped native class relation marker')
        return record(fields, 'relation', RELATION_FIELDS, absent.relation ?? {}, hooks)
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
    relations: () => raw.edges.map(edge => relation(indexNames(raw)[edge.from][0], indexNames(raw)[edge.to][0], edge.headFrom, edge.headTo, edge.line === 'dotted' ? true : edge.line === 'solid' ? false : undefined, { relationTitle1: card(edge.cardFrom), relationTitle2: card(edge.cardTo), ...(edge.label ? { title: edge.label } : {}) })),
    absent: {},
  }),
}
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
    relations: () => graph.edges.map(edge => relation(indexNames(graph)[edge.from][0], indexNames(graph)[edge.to][0], edge.head_from ?? edge.headFrom, edge.head_to ?? edge.headTo, ['Dotted', 'lineDotted'].includes(edge.line) ? true : ['Solid', 'lineSolid'].includes(edge.line) ? false : undefined, {})),
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
}
function classNotes(project, raw, hooks) {
  if (NO_CLASS_NOTES[project]) {
    const reason = NO_CLASS_NOTES[project]
    return { getNote: () => hooks.unsupported(reason), getNotes: () => hooks.unsupported(reason) }
  }
  const native = raw.notes instanceof Map ? [...raw.notes.values()] : Array.isArray(raw.notes) ? raw.notes : raw.notes && typeof raw.notes === 'object' ? Object.values(raw.notes) : undefined
  if (!native) return {}
  const notes = new Map(
    native.map((note, index) => {
      const id = typeof note.id === 'string' ? note.id : 'note' + index
      const target = note.class ?? note.forClass ?? (note.target === '' ? null : note.target)
      return [id, { id, class: target ?? undefined, text: note.text, index }]
    }),
  )
  return { getNote: id => notes.get(typeof id === 'number' ? 'note' + id : id), getNotes: () => new Map(notes) }
}

// Entity-relationship diagrams. Mermaid records cardA from the right-hand marker and
// cardB from the left-hand one, with IDENTIFYING for a solid line.
const CARD_WORD = { onlyone: 'ONLY_ONE', zeroorone: 'ZERO_OR_ONE', oneormore: 'ONE_OR_MORE', zeroormore: 'ZERO_OR_MORE', mdparent: 'MD_PARENT' }
const cardWord = value => (typeof value === 'string' ? CARD_WORD[value.toLowerCase().replace(/[_\s-]/g, '')] : undefined)
const CARD_SYMBOL = { '||': 'ONLY_ONE', '|o': 'ZERO_OR_ONE', 'o|': 'ZERO_OR_ONE', '}|': 'ONE_OR_MORE', '|{': 'ONE_OR_MORE', '}o': 'ZERO_OR_MORE', 'o{': 'ZERO_OR_MORE' }
const LOOM_CARD = { 1: 'ONLY_ONE', '0..1': 'ZERO_OR_ONE', '1..*': 'ONE_OR_MORE', '*': 'ZERO_OR_MORE' }
const MMDR_CARD = { CrowsFootOne: 'ONLY_ONE', CrowsFootZeroOne: 'ZERO_OR_ONE', CrowsFootMany: 'ONE_OR_MORE', CrowsFootZeroMany: 'ZERO_OR_MORE' }
const ENTITY_FIELDS = ['id', 'label', 'alias', 'attributes', 'cssClasses', 'cssStyles', 'shape']
const ATTRIBUTE_FIELDS = ['type', 'name', 'keys', 'comment']
const RELATIONSHIP_FIELDS = ['entityA', 'roleA', 'entityB', 'relSpec']

function erView(model, hooks) {
  const { entities, relationships, absent } = model
  const attribute = fields => record(fields, 'attribute', ATTRIBUTE_FIELDS, absent.attribute ?? {}, hooks)
  const entity = (name, fields) => record({ ...fields, ...(fields.attributes ? { attributes: fields.attributes.map(attribute) } : {}) }, 'entity', ENTITY_FIELDS, absent.entity ?? {}, hooks)
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
    relationships: () => raw.edges.map(edge => ({ entityA: indexNames(raw)[edge.from][0], entityB: indexNames(raw)[edge.to][0], roleA: edge.label ?? '', relSpec: { cardA: LOOM_CARD[edge.cardTo], cardB: LOOM_CARD[edge.cardFrom], relType: identifying(edge.line === 'solid' ? true : edge.line === 'dotted' ? false : undefined) } })),
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
    relationships: () => graph.edges.map(edge => ({ entityA: indexNames(graph)[edge.from][0], entityB: indexNames(graph)[edge.to][0] })),
    absent: {
      attribute: Object.fromEntries(ATTRIBUTE_FIELDS.map(field => [field, `${name} keeps ER attributes as display rows, not typed fields`])),
      entity: { alias: `${name}'s ER model keeps no entity alias` },
      relationship: { roleA: `${name} folds the relationship role and cardinalities into one display label`, relSpec: `${name} folds the relationship cardinalities into its display label` },
    },
  }
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
    getCommitsArray: () => [...entriesOf(raw.commits).map(([, commit]) => commit)].sort((a, b) => a.seq - b.seq),
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

/** Mermaid database getters from one bridged project's native model, or undefined
 * when this project and family have no reviewed view. */
export function nativeSchemaView(project, family, raw, hooks) {
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
  return undefined
}

// Langium AST views. The parser-package tests read the AST a Langium grammar returns.
// Bezel and Latias94/merman return Mermaid's resolved radar database instead: option
// defaults are merged in and an axis or curve label defaults to its name, so options
// and a label equal to its name cannot be told apart from what was written. Only the
// unambiguous parts are claimed; reading the rest is a Trident gap.
const AST_FIELDS = { Radar: ['title', 'accTitle', 'accDescr', 'axes', 'curves', 'options'], Axis: ['name', 'label'], Curve: ['name', 'label', 'entries'], Entry: ['axis', 'value'] }
function astNode(type, fields, hooks) {
  return record({ $type: type, ...fields }, type, AST_FIELDS[type] ?? [], {}, hooks)
}
const named = (item, hooks, type, extra = {}) => astNode(type, { name: item.name, ...(item.label !== item.name ? { label: item.label } : {}), ...extra }, hooks)
const DATABASE_AST = {
  Radar: (raw, hooks) =>
    astNode('Radar', {
      ...(raw.title != null ? { title: raw.title } : { title: undefined }),
      ...(raw.accTitle != null ? { accTitle: raw.accTitle } : { accTitle: undefined }),
      ...(raw.accDescr != null ? { accDescr: raw.accDescr } : { accDescr: undefined }),
      axes: raw.axes.map(axis => named(axis, hooks, 'Axis')),
      curves: raw.curves.map(curve => named(curve, hooks, 'Curve', { entries: curve.entries.map(value => astNode('Entry', { value }, hooks)) })),
    }, hooks),
  Info: (_raw, hooks) => astNode('Info', {}, hooks),
}
const AST_VIEWS = { 'crabtalk/bezel': DATABASE_AST, 'Latias94/merman': DATABASE_AST }

/** The Langium AST value for an accepted native parse, or undefined without a view. */
export function nativeAstView(project, astFamily, raw, hooks) {
  const view = AST_VIEWS[project]?.[astFamily]
  return view && raw && typeof raw === 'object' ? view(raw, hooks) : undefined
}
