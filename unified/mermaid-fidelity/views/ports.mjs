// Reviewed schema views for the three Mermaid ports: obsidianmd/pele (TypeScript),
// crabtalk/bezel (Rust) and Latias94/merman (Rust). See views/index.mjs for the module
// contract and schema-views.mjs for the doctrine every view here follows.
//
// Pele and Bezel keep Mermaid's own database state, field for field (Pele as Maps and
// Sets, Bezel as plain JSON objects and arrays), so their views answer each getter
// from the same state Mermaid's database answers it from. Latias94/merman returns a
// smaller model per family; where it keeps a concept under another name it is
// translated, and where it does not keep it the concept is declared absent.
// Rust's None arrives as null where Mermaid leaves a field undefined (deepUnset).
import { deepUnset, entriesOf, record } from '../schema-views.mjs'

const PELE = 'obsidianmd/pele', BEZEL = 'crabtalk/bezel', MERMAN = 'Latias94/merman'
const NAME = { [PELE]: 'Pele', [BEZEL]: 'Bezel', [MERMAN]: 'Latias94/merman' }
const mapOf = value => new Map(entriesOf(value).map(([key, item]) => [key, deepUnset(item)]))
const setOf = value => new Set(value instanceof Set ? value : Array.isArray(value) ? value : [])
/** One view per project for a family, keyed the way views/index.mjs reads them. */
const each = (projects, view) => Object.fromEntries(projects.map(project => [project, (raw, hooks) => view(raw, hooks, project)]))

// ── Agentflow ────────────────────────────────────────────────────────────────────
// Mermaid's AgentFlowDB at the pinned tag (diagrams/agentflow/agentflowDb.ts, shapes.ts).
const AF_SKIP = new Set(['shape', 'view', 'icon', 'img', 'form', 'pos', 'w', 'h', 'class', 'style', 'labelType'])
const AF_TOOL = new Set(['subroutine', 'subprocess', 'subproc', 'framed-rectangle', 'tool'])
const AF_ALIAS = { task: 'roundedRect', tool: 'subroutine', input: 'lean-right', decision: 'diamond', refdoc: 'lin-doc', action: 'hexagon', round: 'rect' }
const AF_REMOVED = new Set(['doc', 'stadium', 'terminal', 'circle', 'trapezoid', 'inv_trapezoid', 'inv-trapezoid', 'doublecircle', 'double-circle', 'typeDeclaration', 'procs', 'lean_left', 'lean-left', 'in-out', 'cylinder', 'ellipse', 'odd', 'tag-rect', 'tagged-rectangle', 'delay', 'half-rounded-rectangle', 'lin-rect', 'lined-rectangle', 'win-pane', 'window-pane', 'curv-trap', 'curved-trapezoid'])
const AF_ALLOWED = new Set(['roundedRect', 'subroutine', 'subprocess', 'subproc', 'framed-rectangle', 'lean-right', 'diamond', 'lin-doc', 'lined-document', 'hexagon', 'hex', 'connector', 'collapsedGroup'])
const afResolve = shape => (shape ? (AF_ALIAS[shape] ?? shape) : shape)
const afKind = (type, resolved) =>
  AF_TOOL.has(type) ? 'tool' : resolved === 'hexagon' || resolved === 'hex' ? 'action' : resolved === 'lean-right' || resolved === 'lean_right' ? 'input' : resolved === 'lin-doc' || resolved === 'lined-document' ? 'refdoc' : resolved === 'diamond' ? 'decision' : 'task'
const afMeta = metadata => {
  const kept = Object.fromEntries(Object.entries(metadata ?? {}).filter(([key]) => !AF_SKIP.has(key)))
  return Object.keys(kept).length ? kept : undefined
}
// getData()'s layout shape: getTypeFromVertex, then normaliseNodeShapes.
const afLayoutShape = type => {
  const resolved = afResolve(type)
  const shape = resolved === 'square' || resolved === undefined ? 'squareRect' : resolved === 'round' ? 'roundedRect' : resolved
  if (!shape || shape === 'squareRect' || shape === 'rect' || AF_REMOVED.has(shape) || !AF_ALLOWED.has(shape)) return 'roundedRect'
  return shape
}
const AF_RENDERER = reason => Object.fromEntries(['labelStyle', 'padding', 'cssCompiledStyles', 'look', 'wrappingWidth', 'minWidth', 'colorIndex', 'arrowheadStyle', 'curve'].map(key => [key, reason]))
const AF_NODE = ['id', 'label', 'labelType', 'parentId', 'cssStyles', 'cssClasses', 'dir', 'domId', 'link', 'linkTarget', 'tooltip', 'metadata', 'isGroup', 'shape']
const AF_EDGE = ['id', 'isUserDefinedId', 'start', 'end', 'type', 'label', 'labelType', 'labelpos', 'thickness', 'minlen', 'classes', 'arrowTypeStart', 'arrowTypeEnd', 'style', 'pattern', 'animate', 'animation', 'metadata']
// A container node carries none of a vertex's fields: Mermaid leaves them undefined.
const AF_UNSET = Object.fromEntries(AF_NODE.map(key => [key, undefined]))
const destructEdgeType = type => {
  if (['arrow_point', 'arrow_circle', 'arrow_cross', 'arrow_hierarchy'].includes(type)) return ['none', type]
  if (['double_arrow_point', 'double_arrow_circle', 'double_arrow_cross'].includes(type)) return [type.replace('double_', ''), type.replace('double_', '')]
  return ['none', 'arrow_point']
}

// Recording a diagnostic is a database mutation; a parse result offers no such call.
const EMIT = "Mermaid's AgentFlowDB.emitWarning/emitError record a diagnostic into its database; the candidate exposes a parse result, not that mutation"

/** Pele and Bezel: AgentFlowDB's own state (vertices, edges, subGraphs, connectors,
 * classes, tooltips, defaults, element mappings, diagnostics). Both ports run their
 * own equivalent of Mermaid's getData() pass while parsing, so the shape and containment
 * diagnostics Mermaid records there are already in the model (checked with an
 * unsupported shape and a two-container cycle). Mermaid's vertex DOM ids are its
 * renderer's and are not kept. */
function agentflowState(raw, hooks, project) {
  const name = NAME[project]
  const vertexAbsent = { domId: `a vertex's DOM id is Mermaid's renderer state; ${name} keeps none` }
  const vertex = item => record({ ...item }, 'agentflow vertex', ['id', 'text', 'labelType', 'styles', 'classes'], vertexAbsent, hooks)
  const vertices = () => keyedMap(raw.nodes, hooks, name + ' agentflow vertices', item => vertex(deepUnset(item)))
  const edgeList = () => entriesOf(raw.edges).map(([, item]) => ({ interpolate: undefined, ...deepUnset(item) }))
  const subGraphs = () => entriesOf(raw.subgraphs).map(([, item]) => ({ dir: undefined, ...deepUnset(item) }))
  const connectors = () => orderedEntries(raw.connectors, hooks, name + ' agentflow connectors').map(([, item]) => vertex(deepUnset(item)))
  const tooltips = mapOf(raw.tooltips)
  const mappings = () => entriesOf(raw.mappings).map(([, item]) => deepUnset(item))
  const edges = () => {
    const list = edgeList()
    if (raw.defaultInterpolate != null) list.defaultInterpolate = raw.defaultInterpolate
    if (raw.defaultEdgeStyle != null) list.defaultStyle = deepUnset(raw.defaultEdgeStyle)
    return list
  }
  const isToolDefinition = item => AF_TOOL.has(item?.type)

  // Mermaid's getData(): structural fields only; its palette slots, compiled styles,
  // padding, look, curve and host configuration are its renderer's.
  const renderer = AF_RENDERER("Mermaid's agentflow renderer decides this layout field; it is not part of a parse result")
  const getData = () => {
    const sgs = subGraphs(), all = vertices(), lookup = new Map(sgs.map(sg => [sg.id, sg]))
    for (const [id, sg] of entriesOf(raw.subgraphLookup)) lookup.set(id, deepUnset(sg))
    const parentOf = new Map(), groups = new Set(), hidden = new Set(), collapsedTo = new Map()
    const collect = (id, ancestor, seen = new Set()) => {
      if (seen.has(id)) return
      seen.add(id)
      for (const child of lookup.get(id)?.nodes ?? []) {
        if (child === ancestor || seen.has(child)) continue
        hidden.add(child)
        collapsedTo.set(child, ancestor)
        collect(child, ancestor, seen)
      }
    }
    for (const sg of sgs) if (sg.metadata?.view === 'collapsed' && !hidden.has(sg.id)) collect(sg.id, sg.id)
    const closesCycle = (child, parent) => {
      const seen = new Set()
      for (let current = parent; current !== undefined && !seen.has(current); current = parentOf.get(current)) {
        if (current === child) return true
        seen.add(current)
      }
      return false
    }
    for (let i = sgs.length - 1; i >= 0; i--) {
      const sg = sgs[i]
      if (hidden.has(sg.id)) continue
      if (sg.nodes.length) groups.add(sg.id)
      for (const id of sg.nodes) if (!closesCycle(id, sg.id)) parentOf.set(id, sg.id)
    }
    const nodes = []
    for (let i = sgs.length - 1; i >= 0; i--) {
      const sg = sgs[i]
      if (hidden.has(sg.id)) continue
      const collapsed = sg.metadata?.view === 'collapsed'
      nodes.push({ ...AF_UNSET, id: sg.id, label: sg.title, labelType: sg.labelType, parentId: parentOf.get(sg.id), cssClasses: (sg.classes ?? []).join(' '), shape: collapsed ? 'collapsedGroup' : 'flowGroup', dir: sg.dir, isGroup: !collapsed, metadata: collapsed ? { ...sg.metadata, containerType: sg.type } : sg.metadata })
    }
    for (const [id, item] of all) {
      if (hidden.has(id)) continue
      const existing = nodes.find(node => node.id === id)
      if (existing) {
        existing.cssStyles = item.styles
        existing.cssClasses = item.classes.join(' ')
        continue
      }
      const isGroup = groups.has(id)
      const base = { id, label: item.text, labelType: item.labelType, parentId: parentOf.get(id), cssStyles: item.styles, cssClasses: 'default ' + item.classes.join(' '), dir: item.dir, link: item.link, linkTarget: item.linkTarget, tooltip: tooltips.get(id), metadata: item.metadata }
      nodes.push(isGroup ? { ...base, isGroup: true, shape: 'rect' } : { ...base, isGroup: false, shape: afLayoutShape(item.type) })
    }
    const defaultStyle = deepUnset(raw.defaultEdgeStyle) ?? []
    const layoutEdges = []
    for (const edge of edgeList()) {
      const start = collapsedTo.get(edge.start) ?? edge.start, end = collapsedTo.get(edge.end) ?? edge.end
      if (start === end && edge.start !== edge.end) continue
      const [arrowStart, arrowEnd] = destructEdgeType(edge.type)
      const plain = edge.stroke === 'invisible' || edge.type === 'arrow_open'
      layoutEdges.push({ id: edge.id, isUserDefinedId: edge.isUserDefinedId, start, end, type: edge.type ?? 'normal', label: edge.text, labelType: edge.labelType, labelpos: 'c', thickness: edge.stroke, minlen: edge.length, classes: edge.stroke === 'invisible' ? '' : 'edge-thickness-normal edge-pattern-solid flowchart-link', arrowTypeStart: plain ? 'none' : arrowStart, arrowTypeEnd: plain ? 'none' : arrowEnd, style: [...defaultStyle, ...(edge.style ?? [])], pattern: edge.stroke, animate: edge.animate, animation: edge.animation, metadata: edge.metadata })
    }
    return record({
      nodes: nodes.map(node => record(node, 'agentflow layout node', AF_NODE, { ...renderer, ...vertexAbsent }, hooks)),
      edges: layoutEdges.map(edge => record(edge, 'agentflow layout edge', AF_EDGE, renderer, hooks)),
      other: {},
      connectors: connectors(),
    }, 'agentflow layout data', ['nodes', 'edges', 'other', 'connectors', 'config'], { config: "Mermaid's host configuration is not part of a parse result" }, hooks)
  }

  const getSemanticModel = () => {
    const sgs = subGraphs(), ids = new Set(sgs.map(sg => sg.id)), model = { vertices: [], edges: [], subGraphs: [], connectors: [], diagnostics: deepUnset(entriesOf(raw.diagnostics).map(([, d]) => d)) }
    for (const [id, item] of vertices()) {
      if (ids.has(id)) continue
      const metadata = item.metadata && Object.keys(item.metadata).length ? afMeta(item.metadata) : undefined
      if (item.isConnector) {
        model.connectors.push({ id, ...(item.text !== undefined && item.text !== id ? { title: item.text } : {}), ...(metadata ? { metadata } : {}) })
        continue
      }
      const resolved = afResolve(item.type)
      model.vertices.push({ id, ...(item.text !== undefined ? { label: item.text } : {}), ...(resolved !== undefined ? { shape: resolved } : {}), vertexKind: afKind(item.type, resolved), ...(metadata ? { metadata } : {}) })
    }
    model.edges = edgeList().map(e => ({ start: e.start, end: e.end, ...(e.id !== undefined ? { id: e.id } : {}), ...(typeof e.text === 'string' && e.text.length ? { label: e.text } : {}), ...(e.type !== undefined ? { type: e.type } : {}), ...(e.stroke !== undefined ? { stroke: e.stroke } : {}), ...(e.edgeSemantic !== undefined ? { edgeSemantic: e.edgeSemantic } : {}), ...(e.length !== undefined ? { length: e.length } : {}), ...(e.metadata && Object.keys(e.metadata).length ? { metadata: { ...e.metadata } } : {}) }))
    model.subGraphs = sgs.map(sg => {
      const metadata = sg.metadata && Object.keys(sg.metadata).length ? afMeta(sg.metadata) : undefined
      return { id: sg.id, nodes: [...sg.nodes], ...(sg.type !== undefined ? { type: sg.type } : {}), ...(sg.title !== undefined ? { title: sg.title } : {}), ...(sg.dir !== undefined ? { direction: sg.dir } : {}), ...(metadata ? { metadata } : {}) }
    })
    if (raw.direction != null) model.direction = raw.direction
    return model
  }

  return {
    getDirection: () => raw.direction?.trim(),
    getVertices: vertices,
    getEdges: edges,
    getSubGraphs: subGraphs,
    getConnectors: connectors,
    getClasses: () => mapOf(raw.classes),
    getTooltip: id => tooltips.get(id),
    isToolDefinition,
    getTools: () => [...vertices().values()].filter(isToolDefinition),
    getDiagnostics: () => entriesOf(raw.diagnostics).map(([, item]) => deepUnset(item)),
    getElementMappings: mappings,
    getElementById: id => mappings().find(m => m.id === id),
    getElementsOnLine: line => mappings().filter(m => line >= m.position.startLine && line <= m.position.endLine),
    getElementAtPosition: (line, column) => {
      const hits = mappings().filter(({ position: p }) => !(line < p.startLine || line > p.endLine || (line === p.startLine && column < p.startColumn) || (line === p.endLine && column > p.endColumn)))
      const span = ({ position: p }) => [p.endLine - p.startLine, p.endColumn - p.startColumn]
      return hits.length ? hits.reduce((small, cur) => { const [sl, sc] = span(small), [cl, cc] = span(cur); return cl !== sl ? (cl < sl ? cur : small) : cc < sc ? cur : small }) : undefined
    },
    getMappingStats: () => {
      const list = mappings(), count = type => list.filter(m => m.type === type).length
      return { vertices: count('vertex'), edges: count('edge'), subgraphs: count('subgraph'), connectors: count('connector'), attachments: count('attachment'), totalElements: list.length }
    },
    getData,
    getSemanticModel,
    // Pele's model object offers its own emitWarning/emitError; Bezel's JSON does not.
    ...(project === BEZEL ? { emitWarning: () => hooks.unsupported(EMIT), emitError: () => hooks.unsupported(EMIT) } : {}),
  }
}

/** A vertex Map whose membership or order the native model only partly keeps: lookups
 * of ids it keeps are answered; the rest, and enumeration when it is incomplete, are
 * the candidate's unsupported operation. */
class PartialMap extends Map {
  constructor(entries, { hooks, refuse, incomplete }) {
    super(entries)
    this.hooks = hooks
    this.refuse = refuse
    this.incomplete = incomplete
  }
  get(key) { return this.refuse.has(key) ? this.hooks.unsupported(this.refuse.get(key)) : super.get(key) }
  has(key) { return this.refuse.has(key) ? this.hooks.unsupported(this.refuse.get(key)) : super.has(key) }
  get size() { return this.incomplete ? this.hooks.unsupported(this.incomplete) : super.size }
  keys() { return this.incomplete ? this.hooks.unsupported(this.incomplete) : super.keys() }
  values() { return this.incomplete ? this.hooks.unsupported(this.incomplete) : super.values() }
  entries() { return this.incomplete ? this.hooks.unsupported(this.incomplete) : super.entries() }
  forEach(fn, self) { return this.incomplete ? this.hooks.unsupported(this.incomplete) : super.forEach(fn, self) }
  [Symbol.iterator]() { return this.entries() }
}

/** Latias94/merman returns AgentFlowDB.getSemanticModel() itself: vertices (label,
 * resolved shape, vertex kind, metadata without presentation keys), connectors, edges,
 * containers and diagnostics. Presentation (styles, classes, label types, link styles,
 * a container's view hint), element positions and the layout pass are not kept. */
function agentflowSemantic(raw, hooks) {
  const model = deepUnset(raw)
  const containers = new Set((model.subGraphs ?? []).map(sg => sg.id))
  const PRESENTATION = "Latias94/merman's agentflow model is the semantic model, which drops presentation-only metadata (shape, view, icon, img, form, pos, w, h, class, style, labelType)"
  // Metadata keeps every authored key except the presentation ones; with no metadata
  // left, an authored block that held only presentation keys cannot be told apart.
  const metadata = value => (value ? record({ ...value }, 'agentflow metadata', [], Object.fromEntries([...AF_SKIP].map(key => [key, PRESENTATION])), hooks) : hooks.unsupported(PRESENTATION))
  const lazyMetadata = (fields, value) => Object.defineProperty(fields, 'metadata', { get: () => metadata(value), enumerable: true, configurable: true })
  const absent = {
    labelType: "Latias94/merman's semantic model keeps no label type",
    styles: "Latias94/merman's semantic model keeps no node styles",
    classes: "Latias94/merman's semantic model keeps no node classes",
    props: "Latias94/merman's semantic model keeps no node props",
    domId: "a vertex's DOM id is Mermaid's renderer state; Latias94/merman keeps none",
    link: "Latias94/merman's semantic model keeps no click links",
    linkTarget: "Latias94/merman's semantic model keeps no click links",
    dir: "Latias94/merman's semantic model keeps no node direction",
  }
  // The semantic shape is the vertex type with Mermaid's aliases resolved; only `rect`
  // has two sources (the `(text)` form, type `round`, and an authored `rect`).
  const vertex = item => {
    const fields = lazyMetadata({ id: item.id, text: item.label }, item.metadata)
    if (item.shape === 'rect') Object.defineProperty(fields, 'type', { get: () => hooks.unsupported("Latias94/merman's semantic shape `rect` is both a `(text)` node (type round) and an authored rect"), enumerable: true })
    else fields.type = item.shape
    return record(fields, 'agentflow vertex', ['id', 'text', 'type'], absent, hooks)
  }
  const connector = item => record(lazyMetadata({ id: item.id, text: item.title ?? item.id, isConnector: true }, item.metadata), 'agentflow connector', ['id', 'text', 'isConnector'], absent, hooks)
  const vertices = () => {
    const kept = (model.vertices ?? []).map(item => [item.id, vertex(item)])
    const linked = (model.connectors ?? []).map(item => [item.id, connector(item)])
    const refuse = new Map([...containers].map(id => [id, "Latias94/merman's semantic model folds a container's vertex record into the container"]))
    const incomplete = containers.size
      ? "Latias94/merman's semantic model drops the vertex records Mermaid keeps for container ids"
      : kept.length && linked.length ? "Latias94/merman's semantic model lists connectors apart from vertices, without their declaration order" : undefined
    return new PartialMap([...kept, ...linked], { hooks, refuse, incomplete })
  }
  const edgeAbsent = {
    labelType: "Latias94/merman's semantic model keeps no edge label type",
    classes: "Latias94/merman's semantic model keeps no edge classes",
    isUserDefinedId: "Latias94/merman's semantic model does not record whether an edge id was authored",
    interpolate: "Latias94/merman's semantic model keeps no edge curve",
    style: "Latias94/merman's semantic model keeps no link styles",
    animate: "Latias94/merman's semantic model keeps no edge animation",
    animation: "Latias94/merman's semantic model keeps no edge animation",
  }
  const edge = item => record({ start: item.start, end: item.end, type: item.type, text: item.label ?? '', stroke: item.stroke, length: item.length, edgeSemantic: item.edgeSemantic, id: item.id, metadata: item.metadata }, 'agentflow edge', ['start', 'end', 'type', 'text', 'stroke', 'length', 'id'], edgeAbsent, hooks)
  const subGraph = item => record(lazyMetadata({ id: item.id, nodes: item.nodes, title: item.title, type: item.type, dir: item.direction }, item.metadata), 'agentflow subgraph', ['id', 'nodes', 'title', 'type', 'dir'], { classes: "Latias94/merman's semantic model keeps no container classes", labelType: "Latias94/merman's semantic model keeps no container label type" }, hooks)
  const isToolDefinition = item => AF_TOOL.has(item?.type)
  const noPositions = () => hooks.unsupported("Latias94/merman's agentflow model keeps no element source positions")
  // getData(): containers are laid out by their view hint (collapsed or not), which the
  // semantic model drops, and connectors lose their place among the vertices; without
  // either, the layout nodes are the vertices in order. getTypeFromVertex then
  // normaliseNodeShapes take a `(text)` node (round) and an authored rect alike to
  // roundedRect, so the semantic shape fixes the layout shape.
  const getData = () => {
    if (containers.size) return hooks.unsupported("Latias94/merman's semantic model drops a container's view hint (collapsed or expanded), which Mermaid's getData layout is built from")
    if ((model.connectors ?? []).length && (model.vertices ?? []).length) return hooks.unsupported("Latias94/merman's semantic model lists connectors apart from vertices, without the declaration order Mermaid's getData layout nodes follow")
    const renderer = AF_RENDERER("Mermaid's agentflow renderer decides this layout field; it is not part of a parse result")
    const nodeAbsent = { labelType: absent.labelType, cssStyles: absent.styles, cssClasses: absent.classes, link: absent.link, linkTarget: absent.link, dir: absent.dir, domId: absent.domId, tooltip: "Latias94/merman's semantic model keeps no tooltips" }
    const vertexNodes = (model.vertices ?? []).map(item => record(lazyMetadata({ id: item.id, label: item.label, parentId: undefined, isGroup: false, shape: afLayoutShape(item.shape) }, item.metadata), 'agentflow layout node', AF_NODE, { ...renderer, ...nodeAbsent }, hooks))
    const connectorNodes = (model.connectors ?? []).map(item => record(lazyMetadata({ id: item.id, label: item.title ?? item.id, parentId: undefined, isGroup: false, shape: afLayoutShape(undefined) }, item.metadata), 'agentflow layout node', AF_NODE, { ...renderer, ...nodeAbsent }, hooks))
    const edgeFields = { labelType: edgeAbsent.labelType, isUserDefinedId: edgeAbsent.isUserDefinedId, style: edgeAbsent.style, animate: edgeAbsent.animate, animation: edgeAbsent.animation }
    const edges = (model.edges ?? []).map(item => {
      const [arrowStart, arrowEnd] = destructEdgeType(item.type)
      const plain = item.stroke === 'invisible' || item.type === 'arrow_open'
      return record({ id: item.id, start: item.start, end: item.end, type: item.type ?? 'normal', label: item.label ?? '', labelpos: 'c', thickness: item.stroke, minlen: item.length, classes: item.stroke === 'invisible' ? '' : 'edge-thickness-normal edge-pattern-solid flowchart-link', arrowTypeStart: plain ? 'none' : arrowStart, arrowTypeEnd: plain ? 'none' : arrowEnd, pattern: item.stroke, metadata: item.metadata }, 'agentflow layout edge', AF_EDGE, { ...renderer, ...edgeFields }, hooks)
    })
    return record({ nodes: [...vertexNodes, ...connectorNodes], edges, other: {}, connectors: (model.connectors ?? []).map(connector) }, 'agentflow layout data', ['nodes', 'edges', 'other', 'connectors', 'config'], { config: "Mermaid's host configuration is not part of a parse result" }, hooks)
  }
  return {
    getDirection: () => model.direction,
    getVertices: vertices,
    getEdges: () => (model.edges ?? []).map(edge),
    getSubGraphs: () => (model.subGraphs ?? []).map(subGraph),
    getConnectors: () => (model.connectors ?? []).map(connector),
    getClasses: () => hooks.unsupported("Latias94/merman's semantic model keeps no classDef styles"),
    getTooltip: () => hooks.unsupported("Latias94/merman's semantic model keeps no tooltips"),
    isToolDefinition,
    getTools: () => (model.vertices ?? []).filter(item => AF_TOOL.has(item.shape)).map(vertex),
    getDiagnostics: () => model.diagnostics ?? [],
    getElementMappings: noPositions,
    getElementById: noPositions,
    getElementsOnLine: noPositions,
    getElementAtPosition: noPositions,
    getMappingStats: noPositions,
    emitWarning: () => hooks.unsupported(EMIT),
    emitError: () => hooks.unsupported(EMIT),
    getData,
    getSemanticModel: () => ({ vertices: model.vertices ?? [], edges: model.edges ?? [], subGraphs: model.subGraphs ?? [], connectors: model.connectors ?? [], diagnostics: model.diagnostics ?? [], ...(model.direction !== undefined ? { direction: model.direction } : {}) }),
  }
}

// ── Use case ─────────────────────────────────────────────────────────────────────
// Mermaid's usecaseDb.ts publishes Maps of actors, use cases, boundaries, notes, JSON
// nodes and class definitions, the relationship list, the direction and a normalized
// AST (GraphAST in usecaseTypes.ts).
const byId = (list, map = item => item) => new Map((list ?? []).map(item => [item.id, map(item)]))
// usecaseDb getData(): the published records converted for the renderer without
// re-parsing (shapes, CSS classes, relationship visuals, note edges). Colour slots, padding,
// compiled styles, look, wrapping and minimum widths, port spreading, the JSON table's
// flattened display rows and every config-derived value are decided for the renderer.
const USECASE_RENDERER = Object.fromEntries(['padding', 'look', 'colorIndex', 'cssCompiledStyles', 'wrappingWidth', 'minWidth', 'spreadPorts', 'jsonRows', 'config', 'layoutAlgorithm', 'nodeSpacing', 'rankSpacing', 'actorFontSize', 'actorFontFamily', 'actorFontWeight', 'usecaseFontSize', 'usecaseFontFamily', 'usecaseFontWeight', 'diagramPadding', 'useMaxWidth'].map(key => [key, "Mermaid's usecase renderer decides this layout field; it is not part of a parse result"]))
const UC_ACTOR_SHAPE = { hollow: 'usecaseActorHollow', awesome: 'usecaseActorAwesome', icon: 'usecaseActorIcon', normal: 'usecaseActor' }
const UC_MARKERS = { 0: ['none', 'arrow_point'], 1: ['arrow_point', 'none'], 3: ['none', 'arrow_circle'], 4: ['none', 'arrow_cross'], 5: ['arrow_circle', 'none'], 6: ['arrow_cross', 'none'], 2: ['none', 'none'] }
const ucClasses = (...names) => names.filter(Boolean).join(' ')
function usecaseData(view, hooks) {
  const actors = view.getActors(), useCases = view.getUseCases(), notes = view.getNotes(), json = view.getJsonNodes()
  const endpoint = id => actors.get(id)?.label ?? useCases.get(id)?.label ?? json.get(id)?.id ?? notes.get(id)?.label ?? id
  const node = fields => record(fields, 'usecase layout node', ['id', 'label', 'labelType', 'shape', 'isGroup', 'cssClasses', 'cssStyles'], USECASE_RENDERER, hooks)
  const nodes = [
    ...[...actors.values()].map(a => node({ id: a.id, label: a.label, labelType: a.labelType, shape: UC_ACTOR_SHAPE[a.type] ?? a.type, isGroup: false, cssClasses: ucClasses('default', 'usecase-actor', `usecase-actor-${a.type}`, a.business && 'usecase-business', ...a.classes), cssStyles: [...a.styles], actorType: a.type, business: a.business, ...(a.icon ? { icon: a.icon } : {}), ...(a.stereotype ? { stereotype: a.stereotype } : {}), ...(a.parentId ? { parentId: a.parentId } : {}) })),
    ...[...useCases.values()].map(u => node({ id: u.id, label: u.label, labelType: u.labelType, shape: u.shape === 'ellipse' ? (u.business ? 'usecaseBusiness' : 'usecaseEllipse') : u.shape, isGroup: false, cssClasses: ucClasses('default', 'usecase-element', `usecase-${u.shape}`, u.business && 'usecase-business', ...u.classes), cssStyles: [...u.styles], business: u.business, ...(u.stereotype ? { stereotype: u.stereotype } : {}), ...(u.parentId ? { parentId: u.parentId } : {}) })),
    ...[...notes.values()].map(n => node({ id: n.id, label: n.label, labelType: n.labelType, shape: 'note', isGroup: false, cssClasses: 'default usecase-note', cssStyles: [], noteTarget: n.target, noteTargetLabel: actors.get(n.target)?.label ?? useCases.get(n.target)?.label ?? json.get(n.target)?.id ?? n.target })),
    ...[...json.values()].map(j => node({ id: j.id, label: j.id, labelType: 'text', shape: 'usecaseJsonTable', isGroup: false, cssClasses: ucClasses('default', 'usecase-json-table', ...j.classes), cssStyles: [...j.styles] })),
    ...[...view.getSystemBoundaries().values()].map(b => node({ id: b.id, label: b.label, labelType: b.labelType, shape: 'usecaseSystemBoundary', isGroup: true, cssClasses: ucClasses('default', 'system-boundary', `system-boundary-${b.type}`, ...b.classes), cssStyles: [...b.styles], boundaryType: b.type })),
  ]
  const edge = fields => record(fields, 'usecase layout edge', ['id', 'start', 'end', 'type', 'relationshipType', 'pattern', 'arrowTypeStart', 'arrowTypeEnd', 'classes'], USECASE_RENDERER, hooks)
  const visuals = r => {
    if (r.type === 'include' || r.type === 'extend') return { arrowTypeStart: 'none', arrowTypeEnd: 'arrow_point', pattern: 'dotted', label: r.type, labelType: 'text' }
    if (r.type === 'generalization') return { arrowTypeStart: 'none', arrowTypeEnd: 'extension', pattern: 'solid' }
    if (r.type !== 'association' || !UC_MARKERS[r.arrowType]) return hooks.unavailable(`Unmapped usecase relationship ${r.type}/${r.arrowType}`)
    return { arrowTypeStart: UC_MARKERS[r.arrowType][0], arrowTypeEnd: UC_MARKERS[r.arrowType][1], pattern: 'solid', ...(r.label ? { label: r.label } : {}), ...(r.labelType ? { labelType: r.labelType } : {}) }
  }
  const edges = [
    ...view.getRelationships().map(r => edge({ id: r.id, start: r.source, end: r.target, source: r.source, target: r.target, sourceLabel: endpoint(r.source), targetLabel: endpoint(r.target), type: 'edge', relationshipType: r.type, internal: false, ...visuals(r), labelpos: 'c', classes: ucClasses('default', 'relationship', `relationship-${r.type}`, ...r.classes, ...(r.animate || r.animation ? [`edge-animation-${r.animation ?? 'fast'}`] : [])), style: [...r.styles], animate: r.animate, ...(r.animation ? { animation: r.animation } : {}), thickness: 'normal', minlen: r.minlen, isUserDefinedId: r.explicitId })),
    ...[...notes.values()].map(n => edge({ id: `${n.id}-edge`, start: n.id, end: n.target, source: n.id, target: n.target, type: 'edge', relationshipType: 'note', sourceLabel: endpoint(n.id), targetLabel: endpoint(n.target), internal: true, pattern: 'dotted', arrowTypeStart: 'none', arrowTypeEnd: 'none', labelpos: 'c', classes: 'default relationship relationship-note', style: [], animate: false, thickness: 'normal', minlen: 1, isUserDefinedId: false })),
  ]
  return record({ nodes, edges, type: 'usecase', direction: view.getDirection(), markers: ['point', 'circle', 'cross', 'extension'] }, 'usecase layout data', ['nodes', 'edges', 'type', 'direction', 'markers'], USECASE_RENDERER, hooks)
}
const lookups = (view, hooks) => ({
  ...view,
  getData: () => usecaseData(view, hooks),
  getActor: id => view.getActors().get(id),
  getUseCase: id => view.getUseCases().get(id),
  getSystemBoundary: id => view.getSystemBoundaries().get(id),
  getNote: id => view.getNotes().get(id),
  getJsonNode: id => view.getJsonNodes().get(id),
  getClassDef: id => view.getClassDefs().get(id),
})
const plainOrder = order => Object.fromEntries(entriesOf(order).map(([key, item]) => [key, [...item]]))

/** Pele and Bezel keep the published state and, of the AST, its source text, header
 * span, accessibility text and statement occurrences; the AST's node, edge, group and
 * class tables are not kept. Pele's accDescr is the published description and its
 * accDescription the AST's verbatim block (checked against an accDescr {...} block). */
function usecaseState(raw, hooks, project) {
  const name = NAME[project]
  const astAbsent = reason => Object.fromEntries(['version', 'diagramType', 'nodes', 'edges', 'groups', 'classDefs'].map(key => [key, reason]))
  const getAST = () =>
    record({
      source: raw.source,
      header: record({ span: raw.headerSpan }, 'usecase AST header', ['span', 'keyword', 'direction'], { keyword: `${name} keeps the header's span, not its keyword`, direction: `${name} keeps the header's span, not its own direction` }, hooks),
      accTitle: raw.accTitle || undefined,
      accDescr: raw.accDescription || undefined,
      statements: deepUnset(raw.statements),
    }, 'usecase AST', ['source', 'header', 'statements'], astAbsent(`${name} keeps the usecase AST's source and statement occurrences, not its node, edge, group and class tables`), hooks)
  const ordered = (value, label) => keyedMap(value, hooks, `${name} usecase ${label}`)
  return lookups({
    getActors: () => ordered(raw.actors, 'actors'),
    getUseCases: () => ordered(raw.useCases, 'use cases'),
    getSystemBoundaries: () => ordered(raw.systemBoundaries, 'boundaries'),
    getRelationships: () => entriesOf(raw.relationships).map(([, item]) => deepUnset(item)),
    getNotes: () => mapOf(raw.notes),
    getJsonNodes: () => keyedMap(raw.jsonNodes, hooks, `${name} usecase JSON nodes`, item => ({ ...deepUnset(item), propertyOrder: plainOrder(item.propertyOrder) })),
    getClassDefs: () => ordered(raw.classDefs, 'class definitions'),
    getDirection: () => raw.direction,
    getAST: () => (raw.source === undefined ? undefined : getAST()),
  }, hooks)
}

/** Latias94/merman lists actors and use cases as one node list told apart by kind
 * (actor, useCaseEllipse, useCaseRect), names an actor's type actorType and a
 * relationship's type relationshipType, and marks a package boundary with a flag. It
 * keeps no AST. */
const MERMAN_SHAPE = { useCaseEllipse: 'ellipse', useCaseRect: 'rect' }
function usecaseMerman(raw, hooks) {
  const model = deepUnset(raw)
  const nodes = model.nodes ?? []
  const unknown = nodes.find(node => node.kind !== 'actor' && !MERMAN_SHAPE[node.kind])
  const checked = view => (unknown ? () => hooks.unavailable('Unmapped Latias94/merman usecase node kind ' + unknown.kind) : view)
  const actor = node => ({ id: node.id, label: node.label, labelType: node.labelType, type: node.actorType, ...(node.icon !== undefined ? { icon: node.icon } : {}), business: node.business, ...(node.stereotype !== undefined ? { stereotype: node.stereotype } : {}), ...(node.parentId !== undefined ? { parentId: node.parentId } : {}), classes: node.classes, styles: node.styles })
  const useCase = node => ({ id: node.id, label: node.label, labelType: node.labelType, shape: MERMAN_SHAPE[node.kind], business: node.business, ...(node.stereotype !== undefined ? { stereotype: node.stereotype } : {}), ...(node.parentId !== undefined ? { parentId: node.parentId } : {}), classes: node.classes, styles: node.styles })
  const boundary = item => ({ id: item.id, label: item.label, labelType: item.labelType, type: item.package ? 'package' : 'rect', members: item.members, classes: item.classes, styles: item.styles })
  const relationship = item => ({ id: item.id, explicitId: item.explicitId, source: item.source, target: item.target, type: item.relationshipType, arrowType: item.arrowType, ...(item.label !== undefined ? { label: item.label } : {}), ...(item.labelType !== undefined ? { labelType: item.labelType } : {}), minlen: item.minlen, classes: item.classes, styles: item.styles, animate: item.animate, ...(item.animation !== undefined ? { animation: item.animation } : {}) })
  return lookups({
    getActors: checked(() => byId(nodes.filter(node => node.kind === 'actor'), actor)),
    getUseCases: checked(() => byId(nodes.filter(node => MERMAN_SHAPE[node.kind]), useCase)),
    getSystemBoundaries: () => byId(model.boundaries, boundary),
    getRelationships: () => (model.relationships ?? []).map(relationship),
    getNotes: () => byId(model.notes),
    getJsonNodes: () => byId(model.jsonNodes),
    getClassDefs: () => byId(model.classDefs),
    getDirection: () => model.direction,
    getAST: () => hooks.unsupported("Latias94/merman's usecase model keeps no normalized AST (statement spans and source)"),
  }, hooks)
}

// ── Railroad (railroad, EBNF, ABNF, PEG) ─────────────────────────────────────────
// Mermaid's railroadDb.ts keeps the rule list (later definitions of a name overwrite it
// in the lookup) and a title. All three ports keep the same rule and node records; an
// unbounded repetition's max is Infinity in Mermaid, which JSON (Bezel's and
// Latias94/merman's bridges, and Rust's None) carries as null.
function railroadNode(node) {
  if (Array.isArray(node)) return node.map(railroadNode)
  if (!node || typeof node !== 'object') return node
  const out = {}
  for (const [key, value] of Object.entries(node)) out[key] = key === 'max' && node.type === 'repetition' && value === null ? Infinity : value === null ? undefined : railroadNode(value)
  return out
}
function railroadView(raw) {
  const rules = () => (raw.rules ?? []).map(rule => railroadNode(rule))
  return {
    getRules: rules,
    getRule: name => new Map(rules().map(rule => [rule.name, rule])).get(name),
    getTitle: () => raw.title ?? '',
  }
}

// ── Wardley, Venn, Cynefin ───────────────────────────────────────────────────────
// Each port returns the record Mermaid's database builds: WardleyBuilder.build()
// (wardleyBuilder.ts), vennDB.ts's subset, text and style lists, cynefinDb.ts's domain
// Map and transition list.
const WARDLEY = ['nodes', 'links', 'trends', 'pipelines', 'annotations', 'notes', 'accelerators', 'deaccelerators', 'annotationsBox', 'axes', 'size']
const wardleyView = raw => ({ getWardleyData: () => deepUnset(Object.fromEntries(WARDLEY.map(key => [key, raw[key]]))) })

// A subset's or text node's label is a key Mermaid always sets (undefined when unlabelled).
const vennView = (raw, hooks, project) => ({
  getSubsetData: () => (raw.subsets ?? []).map(item => ({ label: undefined, ...deepUnset(item) })),
  getTextData: () => (raw.textNodes ?? []).map(item => ({ label: undefined, ...deepUnset(item) })),
  getStyleData: () => (raw.styles ?? raw.styleEntries ?? []).map(item => ({ targets: [...item.targets], styles: Object.fromEntries(entriesOf(item.styles)) })),
  ...(project === MERMAN
    ? { getCurrentSets: () => hooks.unsupported("Latias94/merman's venn model keeps no parser cursor (the current set list)"), getIndentMode: () => hooks.unsupported("Latias94/merman's venn model keeps no parser indentation mode") }
    : { getCurrentSets: () => deepUnset(raw.current), getIndentMode: () => raw.indent }),
})

const cynefinView = raw => ({
  getDomains: () => new Map((Array.isArray(raw.domains) ? raw.domains.map(domain => [domain.name, domain]) : entriesOf(raw.domains)).map(([name, domain]) => [name, deepUnset(domain)])),
  getTransitions: () => (raw.transitions ?? []).map(item => ({ label: undefined, ...deepUnset(item) })),
})

// The Langium Railroad AST (packages/parser railroad.langium) from the database record.
// Mermaid's railroadParser.ts collapses a one-element sequence(...) or choice(...) into
// its element, and the ports keep that collapsed record, so no rule definition's written
// expression type can be told from it; title, accessibility text and the rule names can.
function railroadAst(raw, hooks, project) {
  const COLLAPSED = `${NAME[project]} keeps Mermaid's railroad database record, which folds a one-element sequence or choice into its element, so a rule's written expression is not kept`
  const rule = item => record({ $type: 'RailroadRule', name: item.name }, 'RailroadRule', ['name'], { definition: COLLAPSED }, hooks)
  return record({ $type: 'Railroad', title: raw.title || undefined, accTitle: raw.accTitle || undefined, accDescr: raw.accDescr || undefined, rules: (raw.rules ?? []).map(rule) }, 'Railroad', ['title', 'accTitle', 'accDescr', 'rules'], {}, hooks)
}

// ── Git graph ────────────────────────────────────────────────────────────────────
// getBranchesAsObjArray (gitGraphAst.ts) orders branches by their `order`, an unordered
// branch taking 0.<declaration index>. Pele's and Bezel's `lanes` are that ordering
// (Pele's git db computes it with the same expression), and Latias94/merman's branch
// list is kept in it (checked with orders 3, 1 and none: main, d, c, b).
const gitBranches = (raw, _hooks, project) => ({
  getBranchesAsObjArray: () => (project === MERMAN ? (raw.branches ?? []).map(branch => ({ name: branch.name })) : (raw.lanes ?? []).map(name => ({ name }))),
})
// The Langium GitGraph AST lists statements (commit, branch, checkout, merge,
// cherry-pick) as written. The ports keep the resolved commit graph (generated ids,
// implicit checkouts folded into branch heads), not the statement list.
function gitGraphAst(raw, hooks, project) {
  return record({ $type: 'GitGraph', title: raw.title || undefined, accTitle: raw.accTitle || undefined, accDescr: raw.accDescr || undefined }, 'GitGraph', ['title', 'accTitle', 'accDescr'], { statements: `${NAME[project]} keeps the resolved git graph (commits, branch heads), not the statements as written` }, hooks)
}

// ── Packet, block, Ishikawa, architecture ────────────────────────────────────────
// packet/db.ts getPacket(): the rows of words (Pele and Bezel: rows; Latias94/merman:
// packet). blockDB.ts getBlock(id): the block record by id, including the composite's
// colour slot the database assigns (Pele and Bezel: byId plus root; Latias94/merman:
// blocksFlat). ishikawaDb.ts getRoot(): the cause tree.
const packetView = raw => ({ getPacket: () => deepUnset(raw.rows ?? raw.packet ?? []) })
const blockView = (raw, _hooks, project) => ({
  getBlock: id => {
    const found = project === MERMAN ? (raw.blocksFlat ?? []).find(item => item.id === id) : id === 'root' ? raw.root : mapOf(raw.byId).get(id)
    return found == null ? undefined : deepUnset(found)
  },
})
const ishikawaView = raw => ({ getRoot: () => (raw.root == null ? undefined : deepUnset(raw.root)) })

/** A JSON object loses the insertion order of integer-like keys (JavaScript lists them
 * first, ascending), so Bezel's object-shaped maps keep their order only without them.
 * Such a map still answers lookups and its size; enumerating it is a Trident gap. */
const orderLost = value => {
  if (value instanceof Map || Array.isArray(value)) return false
  const keys = Object.keys(value ?? {})
  return keys.length > 1 && keys.some(key => /^(?:0|[1-9]\d*)$/.test(key))
}
function orderedEntries(value, hooks, label) {
  if (orderLost(value)) return hooks.unavailable(`${label}: a JSON object from the bridge loses the declaration order of integer-like ids`)
  return entriesOf(value)
}
class OrderLostMap extends Map {
  constructor(entries, refuse) {
    super(entries)
    this.refuse = refuse
  }
  keys() { return this.refuse() }
  values() { return this.refuse() }
  entries() { return this.refuse() }
  forEach() { return this.refuse() }
  [Symbol.iterator]() { return this.refuse() }
}
/** A Map keyed like the native map, its items translated by `map`. */
function keyedMap(value, hooks, label, map = item => deepUnset(item)) {
  const entries = entriesOf(value).map(([key, item]) => [key, map(item, key)])
  return orderLost(value) ? new OrderLostMap(entries, () => hooks.unavailable(`${label}: a JSON object from the bridge loses the declaration order of integer-like ids`)) : new Map(entries)
}

// architectureDb.ts: nodes (services and junctions, in declaration order) each list the
// edges that touch them; groups; edges; align hints. Pele and Bezel keep the nodes
// without their edge lists, which addEdge fills from the edge list (both ends, so a
// self-edge twice). Langium's `?=` port flags are false when not written; Latias94/merman
// carries an unwritten flag as None. getDataStructures() is the layout pass's adjacency
// and spatial maps, computed for the renderer.
const ARCH_FLAGS = ['lhsInto', 'lhsGroup', 'rhsInto', 'rhsGroup']
const archEdge = edge => {
  const out = deepUnset(edge)
  for (const flag of ARCH_FLAGS) if (edge[flag] === null) out[flag] = false
  return out
}
function architectureView(raw, hooks, project) {
  const edges = () => (raw.edges ?? []).map(archEdge)
  const nodes = () => {
    const list = edges()
    const touching = id => list.flatMap(edge => (edge.lhsId === id && edge.rhsId === id ? [edge, edge] : edge.lhsId === id || edge.rhsId === id ? [edge] : []))
    return orderedEntries(raw.nodes, hooks, NAME[project] + ' architecture nodes').map(([, node]) =>
      project === MERMAN ? { ...deepUnset(node), edges: (node.edges ?? []).map(archEdge) } : { ...(node.type === 'service' ? { icon: undefined, iconText: undefined, title: undefined } : {}), in: undefined, ...deepUnset(node), edges: touching(node.id) })
  }
  return {
    getNodes: nodes,
    getNode: id => nodes().find(node => node.id === id) ?? null,
    getServices: () => nodes().filter(node => node.type === 'service'),
    getJunctions: () => nodes().filter(node => node.type === 'junction'),
    getGroups: () => orderedEntries(raw.groups, hooks, NAME[project] + ' architecture groups').map(([, group]) => ({ in: undefined, ...deepUnset(group) })),
    getEdges: edges,
    getLayoutHints: () => deepUnset(raw.layoutHints ?? []),
    getDataStructures: () => hooks.unsupported("Mermaid's architecture adjacency list, spatial map and group alignments are its layout pass's data structures, computed for the renderer"),
  }
}

// ── State, requirement, ER, Gantt, sequence: getters the generic projection lacks ──
const orderedMap = (value, hooks, label) => keyedMap(value, hooks, label)
const plainRecord = value => Object.fromEntries(entriesOf(value).map(([key, item]) => [key, deepUnset(item)]))

// stateDb getData(): Pele and Bezel keep the layout graph their parse produces (graph);
// Latias94/merman returns getData()'s record itself (nodes, edges, other, config). The
// structural fields are mapped; padding, corner radii, look, compiled styles, colour
// slots, wrapping and minimum widths, DOM ids and arrowhead styling are decided for
// Mermaid's renderer (the flowchart layout-data policy), and so is the host config.
const STATE_RENDERER = Object.fromEntries(['labelStyle', 'padding', 'rx', 'ry', 'look', 'cssCompiledStyles', 'colorIndex', 'wrappingWidth', 'minWidth', 'centerLabel', 'domId', 'arrowheadStyle', 'arrowhead', 'arrowTypeEnd', 'style', 'curve'].map(key => [key, "Mermaid's state renderer decides this layout field; it is not part of a parse result"]))
function stateView(raw, hooks, project) {
  const name = NAME[project]
  const layout = project === MERMAN ? raw : raw.graph
  const strip = item => Object.fromEntries(Object.entries(deepUnset(item)).filter(([key]) => !STATE_RENDERER[key]))
  return {
    getStates: () => orderedMap(raw.states, hooks, name + ' states'),
    getState: id => orderedMap(raw.states, hooks, name + ' states').get(id),
    getClasses: () => orderedMap(project === MERMAN ? raw.styleClasses : raw.classes, hooks, name + ' state classes'),
    getLinks: () => orderedMap(raw.links, hooks, name + ' state links'),
    ...(layout && Array.isArray(layout.nodes)
      ? {
          getData: () =>
            record({
              nodes: layout.nodes.map(node => record(strip(node), 'state layout node', ['id', 'shape', 'label', 'cssClasses', 'cssStyles', 'isGroup'], STATE_RENDERER, hooks)),
              edges: (layout.edges ?? []).map(edge => record(strip(edge), 'state layout edge', ['id', 'start', 'end', 'classes'], STATE_RENDERER, hooks)),
              other: {},
            }, 'state layout data', ['nodes', 'edges', 'other', 'config'], { config: "Mermaid's host configuration is not part of a parse result" }, hooks),
        }
      : {}),
  }
}

// requirementDb getClasses(): the classDef Map.
const requirementView = (raw, hooks, project) => ({ getClasses: () => orderedMap(raw.classes, hooks, NAME[project] + ' requirement classes') })
// erDb getEntity(name): one entity of the entity Map; getClasses(): the classDef Map.
const erView = (raw, hooks, project) => ({
  getEntity: name => { const found = new Map(entriesOf(raw.entities)).get(name); return found == null ? undefined : deepUnset(found) },
  getClasses: () => orderedMap(raw.classes, hooks, NAME[project] + ' ER classes'),
})
// ganttDb's settings getters; all three keep the settings under Mermaid's names.
const ganttView = raw => ({
  getWeekday: () => raw.weekday,
  getExcludes: () => deepUnset(raw.excludes),
  getIncludes: () => deepUnset(raw.includes),
  getTodayMarker: () => raw.todayMarker,
})
// sequenceDb: actors by name (an actor's links and properties are plain records in
// Mermaid; Pele keeps them as Maps), created and destroyed actors by message index.
// Latias94/merman keeps the actor order in actorOrder.
function sequenceView(raw, hooks, project) {
  const actor = item => ({ ...deepUnset(item), ...(item.links !== undefined ? { links: plainRecord(item.links) } : {}), ...(item.properties !== undefined ? { properties: plainRecord(item.properties) } : {}) })
  const actors = () => {
    if (project === MERMAN && Array.isArray(raw.actorOrder)) return new Map(raw.actorOrder.filter(id => raw.actors?.[id]).map(id => [id, actor(raw.actors[id])]))
    return keyedMap(raw.actors, hooks, NAME[project] + ' sequence actors', actor)
  }
  return {
    getActors: actors,
    getActor: id => actors().get(id),
    getActorKeys: () => [...actors().keys()],
    getCreatedActors: () => orderedMap(raw.createdActors, hooks, NAME[project] + ' created actors'),
    getDestroyedActors: () => orderedMap(raw.destroyedActors, hooks, NAME[project] + ' destroyed actors'),
  }
}

// mindmapDb.ts: node types are numbers in Mermaid's nodeType vocabulary, which all three
// ports keep ([text] 2, (text) 1, ((text)) 3, )text( 4, ))text(( 5, {{text}} 6, bare 0 —
// checked on one source per shape), so the tests' nodeType constants describe their
// values. getMindmap() is the root node: Pele and Bezel keep the node list with the root
// (its children nested) first; Latias94/merman keeps getData()'s flat layout nodes.
const MINDMAP_NODE_TYPE = { DEFAULT: 0, NO_BORDER: 0, ROUNDED_RECT: 1, RECT: 2, CIRCLE: 3, CLOUD: 4, BANG: 5, HEXAGON: 6 }
// A node's width and padding come from Mermaid's mindmap configuration (maxNodeWidth,
// padding doubled for boxed shapes): renderer settings, not parsed values.
const MINDMAP_RENDERER = { width: "a mindmap node's width is Mermaid's maxNodeWidth configuration", padding: "a mindmap node's padding is Mermaid's renderer configuration" }
function mindmapView(raw, hooks, project) {
  const node = item => record({ ...deepUnset(item), children: (item.children ?? []).map(node) }, 'mindmap node', ['id', 'nodeId', 'level', 'descr', 'type', 'children'], MINDMAP_RENDERER, hooks)
  return {
    nodeType: { ...MINDMAP_NODE_TYPE },
    ...(project === MERMAN ? {} : { getMindmap: () => (raw.nodes?.length ? node(raw.nodes[0]) : null) }),
  }
}

export default {
  schema: {
    mindmap: each([PELE, BEZEL, MERMAN], mindmapView),
    state: each([PELE, BEZEL, MERMAN], stateView),
    requirement: each([PELE, BEZEL, MERMAN], requirementView),
    er: each([PELE, BEZEL, MERMAN], erView),
    gantt: each([PELE, BEZEL, MERMAN], ganttView),
    sequence: each([PELE, BEZEL, MERMAN], sequenceView),
    packet: each([PELE, BEZEL, MERMAN], packetView),
    block: each([PELE, BEZEL, MERMAN], blockView),
    ishikawa: each([PELE, BEZEL, MERMAN], ishikawaView),
    architecture: each([PELE, BEZEL, MERMAN], architectureView),
    gitgraph: each([BEZEL, MERMAN], gitBranches),
    wardley: each([PELE, BEZEL, MERMAN], wardleyView),
    venn: each([PELE, BEZEL, MERMAN], vennView),
    cynefin: each([PELE, BEZEL, MERMAN], cynefinView),
    railroad: each([PELE, BEZEL, MERMAN], railroadView),
    usecase: { ...each([PELE, BEZEL], usecaseState), [MERMAN]: usecaseMerman },
    agentflow: { ...each([PELE, BEZEL], agentflowState), [MERMAN]: agentflowSemantic },
  },
  ast: {
    Railroad: each([PELE, BEZEL, MERMAN], railroadAst),
    GitGraph: each([PELE, BEZEL, MERMAN], gitGraphAst),
  },
}
