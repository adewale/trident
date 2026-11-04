import { publicDatabaseView } from './upstream-test-assertions.mjs'
import { mermaidConstants, nativeSchemaView } from './mermaid-fidelity/schema-views.mjs'

const entries = value => value instanceof Map ? [...value] : Array.isArray(value) ? value.map(item => [String(item.id ?? item.name), item]) : value && typeof value === 'object' ? Object.entries(value) : []
const clone = (value, seen = new Map()) => {
  if (!value || typeof value !== 'object') return value
  if (seen.has(value)) return seen.get(value)
  if (value instanceof Date) return new Date(value)
  const out = value instanceof Map ? new Map() : value instanceof Set ? new Set() : Array.isArray(value) ? [] : Object.create(Object.getPrototypeOf(value))
  seen.set(value, out)
  if (value instanceof Map) for (const [key, item] of value) out.set(clone(key, seen), clone(item, seen))
  else if (value instanceof Set) for (const item of value) out.add(clone(item, seen))
  else for (const [key, item] of Object.entries(value)) out[key] = clone(item, seen)
  return out
}

/** Snapshot real getter returns immediately: several Mermaid diagram DBs are
 * shared singletons, and preparing a second source must not overwrite the first.
 * Mutation/internal helpers are never synthesized from original expectations. */
/** @returns {Record<string, (...args: any[]) => any>} */
export function snapshotMermaidDatabase(db) {
  const getters = {}, names = new Set()
  for (let object = db; object && object !== Object.prototype; object = Object.getPrototypeOf(object)) for (const name of Object.getOwnPropertyNames(object)) names.add(name)
  for (const name of names) {
    if (!/^get[A-Z]/.test(name) || typeof db[name] !== 'function' || db[name].length) continue
    try { const observed = clone(db[name]()); getters[name] = () => clone(observed) } catch { /* Not a zero-argument public observation. */ }
  }
  if (getters.getClasses) getters.getClass = id => { const values = getters.getClasses(); return values instanceof Map ? values.get(id) : values[id] }
  return getters
}

/** Translate actual observed public field names, retaining representation gaps.
 * These projections do not promise Mermaid's private renderer/database API. */
export function projectPublicDatabase(tool, family, raw, unavailable, unsupported, project) {
  if (tool === 'mermaid') return snapshotMermaidDatabase(raw)
  // A reviewed per-project view takes precedence over the generic field-name guesses.
  const native = project && unavailable && unsupported ? nativeSchemaView(project, family, raw, { unavailable, unsupported }) : undefined
  if (native?.whole) return native.whole
  const constants = project ? mermaidConstants(project, family, Boolean(native)) : undefined
  if (native && family === 'gitgraph') return { ...constants, ...native }
  if (native) return { ...constants, ...projectPublicDatabase(tool, family, raw, unavailable), ...native }
  if (constants) return { ...constants, ...projectPublicDatabase(tool, family, raw, unavailable) }
  if (family === 'mindmap' || family === 'gitgraph') return publicDatabaseView(tool, raw, family)
  const view = { ...clone(raw) }, field = (name, property, object = raw) => { if (object && property in object) view[name] = () => clone(object[property]) }
  field('getDiagramTitle', 'title'); field('getAccTitle', raw && 'accTitle' in raw ? 'accTitle' : 'accessibilityTitle'); field('getAccDescription', raw && 'accDescr' in raw ? 'accDescr' : 'accessibilityDescription'); field('getDirection', 'direction')
  if (family === 'flowchart') {
    const graph = tool === 'agentic' ? raw.graph : raw
    const missing = detail => { if (unavailable) return unavailable('Unmapped native flowchart schema: ' + detail); return undefined }
    const shapes = { rect: 'square', rectangle: 'square', process: 'square', box: 'square', rounded: 'round', asymmetric: 'odd', 'trapezoid-alt': 'inv_trapezoid', roundrect: 'round', roundedrect: 'round', parallelogram: 'lean_right', parallelogramalt: 'lean_left', trapezoidalt: 'inv_trapezoid' }
    // Native enums often spell Mermaid's own shape names differently (DIAMOND,
    // DOUBLE_CIRCLE). Match case- and separator-insensitively; unknown names pass through.
    const vocabulary = ['square', 'round', 'stadium', 'subroutine', 'cylinder', 'circle', 'doublecircle', 'diamond', 'hexagon', 'lean_right', 'lean_left', 'trapezoid', 'inv_trapezoid', 'odd', 'ellipse', 'rect']
    const shapeName = shape => {
      if (typeof shape !== 'string') return undefined
      if (shapes[shape]) return shapes[shape]
      const folded = shape.toLowerCase(), bare = folded.replace(/[-_\s]/g, '')
      return shapes[folded] ?? shapes[bare] ?? vocabulary.find(name => name === folded || name.replace(/_/g, '') === bare)
    }
    const observe = (value, fields) => new Proxy(value, { get(target, key) { if (typeof key === 'string' && fields.includes(key) && !(key in target)) return missing(key); return target[key] } })
    if (graph?.nodes) view.getVertices = () => {
      const observed = entries(graph.nodes)
      if (observed.some(([key, node]) => !node || typeof node !== 'object' || Array.isArray(graph.nodes) && typeof node.id !== 'string' || typeof (node.id ?? key) !== 'string' || typeof (node.label ?? node.text) !== 'string')) return missing('node identities and labels')
      return new Map(observed.map(([key, node]) => {
        const id = node.id ?? key, type = shapeName(node.shape) ?? node.type ?? node.shape
        return [id, observe({ ...clone(node), id, text: node.label ?? node.text, ...(typeof type === 'string' ? { type } : {}), ...(graph.nodeStyles instanceof Map ? { styles: Object.entries(graph.nodeStyles.get(id) ?? {}).map(([key, value]) => `${key}:${value}`) } : {}) }, ['type', 'styles', 'classes', 'labelType', 'props', 'link', 'linkTarget', 'haveCallback', 'tooltip'])]
      }))
    }
    if (graph?.edges) view.getEdges = () => {
      if (!Array.isArray(graph.edges) || graph.edges.some(edge => typeof (edge.source ?? edge.from ?? edge.start) !== 'string' || typeof (edge.target ?? edge.to ?? edge.end) !== 'string' || edge.label != null && typeof edge.label !== 'string')) return missing('edge endpoints and labels')
      return graph.edges.map(edge => {
        if (!edge.type && edge.hasArrowStart === true && edge.hasArrowEnd === false) return missing('start-only marker direction has no qualified original edge view')
        const heads = { arrow: 'arrow_point', open: 'arrow_open', none: 'arrow_open', circle: 'arrow_circle', cross: 'arrow_cross' }
        const type = edge.type ?? heads[edge.arrowType] ?? (typeof edge.hasArrowEnd === 'boolean' ? (edge.hasArrowStart ? 'double_' : '') + (edge.hasArrowEnd ? 'arrow_point' : 'arrow_open') : edge.style === 'arrow' ? 'arrow_point' : undefined)
        const stroke = edge.stroke ?? ({ solid: 'normal', dotted: 'dotted', dashed: 'dotted', thick: 'thick', invisible: 'invisible' }[edge.lineStyle ?? edge.style]) ?? (typeof edge.dashed === 'boolean' ? edge.dashed ? 'dotted' : edge.thick ? 'thick' : 'normal' : undefined)
        return observe({ ...clone(edge), start: edge.source ?? edge.from ?? edge.start, end: edge.target ?? edge.to ?? edge.end, text: edge.label ?? edge.text ?? '', ...(type ? { type } : {}), ...(stroke ? { stroke } : {}), ...(edge.minLength !== undefined || edge.min_length !== undefined ? { length: edge.minLength ?? edge.min_length } : {}) }, ['type', 'stroke', 'length', 'interpolate', 'style', 'classes'])
      })
    }
    if (typeof graph?.direction === 'string') view.getDirection = () => graph.direction.toUpperCase(); field('getSubGraphs', 'subgraphs', graph); field('getClasses', graph && 'classes' in graph ? 'classes' : 'classDefs', graph)
  } else if (family === 'class') {
    if (raw.classes) view.getClasses = () => new Map(entries(raw.classes).map(([id, item]) => [id, { ...clone(item), ...(item.namespace !== undefined ? { parent: item.namespace } : {}) }]))
    if (view.getClasses) view.getClass = id => view.getClasses().get(id)
    field('getRelations', raw.relations ? 'relations' : 'relationships'); field('getNotes', 'notes'); field('getNamespaces', 'namespaces')
    if (raw.notes instanceof Map) view.getNote = id => clone(raw.notes.get(typeof id === 'number' ? 'note' + id : id))
  } else if (family === 'er') {
    if (raw.entities) view.getEntities = () => new Map(entries(raw.entities).map(([id, item]) => [id, { ...clone(item), ...(tool === 'agentic' ? { alias: item.label ?? '' } : {}) }]))
    if (raw.relationships) field('getRelationships', 'relationships')
    else if (raw.relations) view.getRelationships = () => raw.relations.map(item => ({ ...clone(item), entityA: item.from, entityB: item.to, roleA: item.label }))
    field('getSubGraphs', 'subgraphs'); field('getClasses', 'classes')
  } else if (family === 'state') {
    field('getStates', 'states'); field('getRelations', 'relations'); field('getRootDoc', 'rootDoc'); field('getClasses', 'classes')
  } else if (family === 'c4') {
    const text = value => typeof value === 'string' ? { text: value } : clone(value)
    if (raw.shapes) view.getC4ShapeArray = () => raw.shapes.map(shape => ({ ...Object.fromEntries(Object.entries(clone(shape)).filter(([key]) => !['kind', 'parent'].includes(key))), ...('label' in shape ? { label: text(shape.label) } : {}), ...('descr' in shape ? { descr: text(shape.descr) } : {}), ...('techn' in shape ? { techn: text(shape.techn) } : {}), ...('kind' in shape ? { typeC4Shape: text(shape.kind) } : {}), ...(shape.parent?.alias !== undefined ? { parentBoundary: shape.parent.alias } : {}) }))
    field('getBoundaries', 'boundaries'); field('getRels', 'rels'); field('getC4Type', 'c4Type')
  } else if (family === 'sequence') {
    const actors = raw.participants ?? raw.actors
    if (actors) view.getActors = () => new Map(entries(actors).map(([id, item]) => [id, { ...clone(item), description: item.label ?? item.description }]))
    if (actors) view.getActorKeys = () => entries(actors).map(([id]) => id)
    field('getMessages', 'messages'); field('getNotes', 'notes'); field('getBoxes', 'boxes')
  } else if (family === 'pie') {
    if (raw.sections ?? raw.slices) view.getSections = () => new Map(entries(raw.sections ?? raw.slices).map(([key, item]) => [item.label ?? key, item.value ?? item]))
    field('getShowData', 'showData')
  } else if (family === 'journey') {
    field('getTasks', 'tasks'); field('getSections', 'sections'); field('getActors', 'actors')
  } else if (family === 'gantt') {
    field('getTasks', 'tasks'); field('getSections', 'sections'); field('getDateFormat', 'dateFormat'); field('getAxisFormat', 'axisFormat'); field('getDisplayMode', 'displayMode')
  } else if (family === 'timeline') {
    field('getTasks', 'periods'); field('getSections', 'sections')
  } else if (family === 'requirement') {
    field('getRequirements', 'requirements'); field('getElements', 'elements'); field('getRelationships', 'relations')
  }
  return view
}
