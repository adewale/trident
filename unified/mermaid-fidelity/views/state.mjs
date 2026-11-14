// Reviewed state-diagram views: see views/index.mjs for the module contract and the header
// of ../schema-views.mjs for the doctrine. Helpers from ../schema-views.mjs are used only
// inside functions (that file imports this one).
//
// What Mermaid's StateDB (pinned stateDb.ts, dataFetcher.ts, stateCommon.ts) answers, and
// how each view reaches it:
//   - getStates()/getState(id) hold the ROOT document's states only: a nested state lives
//     in its composite's `doc`, a list of parsed statements. A `[*]` becomes `<doc>_start`
//     or `<doc>_end`, where <doc> is `root`, the composite or the concurrency region that
//     holds it, and its type stays 'default' (docTranslator renames it before addState).
//   - getRelations() holds the root document's transitions; an unlabelled one has
//     relationTitle '' (addRelationObjs' default).
//   - getClasses() maps each classDef to { id, styles, textStyles }; textStyles is
//     addStyleClass' own rewrite of every style naming `color`.
//   - getData() is dataFetcher's layout data: one node per state (shape rect, rectWithTitle,
//     stateStart, stateEnd, fork, join, choice, roundedWithTitle for a composite, divider
//     for a concurrency region), a noteGroup and a note per note, and an edge per transition
//     plus a dashed `note-edge` per note. Fields Mermaid's renderer decides (look, padding,
//     corner radii, compiled class styles, colour slots, wrapping widths, edge CSS and
//     arrowheads, configuration) are unsupported. Ids Mermaid numbers by a running count
//     of transitions and notes (edge ids, note ids, DOM ids) are not claimed.
// The ports Pele, Bezel and Latias94/merman keep Mermaid's own records and are read
// directly. Every other view reads a project's own model into one neutral form (states with
// their container, transitions, notes, classDefs) and the getters are computed from that
// with Mermaid's own translation. A model that records transitions globally (a flowchart
// graph) gives a transition the document that holds both its ends; a transition between
// different documents has no recorded document, so the readings that need it are
// unsupported. Node order in getData follows the model's own order with a composite before
// its members and notes last; Mermaid's own order is its statement walk.
import { record, entriesOf, styleStrings, directionOf, deepUnset } from '../view-core.mjs'

/** A field this project's model does not carry, with the reason. */
class Absent {
  constructor(reason) { this.reason = reason }
}
const absent = reason => new Absent(reason)
const isAbsent = value => value instanceof Absent

const STATE_FIELDS = ['stmt', 'id', 'descriptions', 'type', 'doc', 'note', 'classes', 'styles', 'textStyles']
const RELATION_FIELDS = ['id1', 'id2', 'relationTitle']
const CLASS_FIELDS = ['id', 'styles', 'textStyles']
const NODE_FIELDS = ['id', 'shape', 'label', 'description', 'cssClasses', 'cssStyles', 'dir', 'type', 'isGroup', 'parentId', 'labelType', 'position', 'domId']
const EDGE_FIELDS = ['id', 'start', 'end', 'arrowhead', 'label', 'labelpos', 'labelType', 'thickness', 'classes', 'pattern']
// Layout fields Mermaid's renderer decides from its configuration and look, not from the parse.
const RENDERER = "Mermaid's renderer decides this layout field; it is not part of a parse result"
const LAYOUT_RENDERER_ONLY = {
  ...Object.fromEntries(['labelStyle', 'cssCompiledStyles', 'padding', 'rx', 'ry', 'look', 'centerLabel', 'wrappingWidth', 'minWidth', 'arrowTypeEnd', 'arrowheadStyle', 'style'].map(field => [field, RENDERER])),
  colorIndex: "Mermaid's renderer assigns container colour slots; they are not part of a parse result",
}
const CONFIG_REASON = "Mermaid's host configuration is not part of a parse result"
const COUNTED = {
  edge: 'Mermaid numbers a transition id by its position among the transitions and notes',
  note: 'Mermaid numbers a note id by its position among the transitions and notes',
  dom: 'Mermaid numbers a state DOM id by its position among the transitions and notes',
}

/** A Mermaid-shaped record: Absent values are declared absent, `lazy` keys are gaps when read. */
function build(fields, label, expected, extraAbsent, hooks, lazy = {}) {
  const object = {}, gone = { ...extraAbsent }
  for (const [key, value] of Object.entries(fields)) {
    if (isAbsent(value)) gone[key] = value.reason
    else object[key] = value
  }
  for (const [key, reason] of Object.entries(lazy)) Object.defineProperty(object, key, { get: () => hooks.unavailable(reason), enumerable: true, configurable: true })
  return record(object, label, expected, gone, hooks)
}
/** A plain object whose absent fields are enumerable getters, so a snapshot reads them too. */
function plain(fields, hooks) {
  const object = {}
  for (const [key, value] of Object.entries(fields)) {
    if (isAbsent(value)) Object.defineProperty(object, key, { get: () => hooks.unsupported(value.reason), enumerable: true })
    else object[key] = value
  }
  return object
}

/** A list missing members the model cannot carry: a single member is read as it is, the
 * list as a whole (its length, iteration, searches) is unsupported. */
function incomplete(list, reason, hooks) {
  return new Proxy(list, {
    get(target, key) {
      if (typeof key === 'string' && /^\d+$/.test(key)) return target[key]
      if (key === 'length' || key === Symbol.iterator || (typeof key === 'string' && typeof Array.prototype[key] === 'function')) return hooks.unsupported(reason)
      return target[key]
    },
  })
}

/** addStyleClass' textStyles: every attribute naming `color`, with fill -> bgFill, color -> fill. */
const textStylesOf = styles => styles.filter(style => /color/.test(style)).map(style => style.replace('fill', 'bgFill').replace('color', 'fill'))
const CSS_STATE = 'statediagram-state'

// ---------------------------------------------------------------------------------------
// Neutral model -> Mermaid getters
//
// model = {
//   name,
//   states: [{ id, kind, container, composite, region, label, descriptions, classes, styles, singleLabel, doc }]
//     kind: 'default' | 'fork' | 'join' | 'choice' | 'start' | 'end' | a native word | Absent
//     container: the composite or region id holding it, or null for the root document
//     singleLabel: every reading of the model's label has at most one description, so the
//       layout shape is 'rect' even where the descriptions themselves are ambiguous
//     idAbsent: a concurrency region the model keeps without an id (its id, its members'
//       parentId and its `<region>_start` / `<region>_end` read as unsupported)
//   transitions: [{ from, to, title, doc }]   doc: the document the model records (null = root)
//   notes: [{ target, text, position }] | Absent     position: 'left of' | 'right of' | Absent
//   classDefs: [[id, styles[] | Absent]] | Absent
//   direction: root direction | Absent; compositeDirection(nativeId) -> direction | Absent
//   accTitle, accDescr, links: value | Absent (left out: the generic projection answers)
//   doc: why a composite's statement document is not carried
// }
function stateView(model, hooks) {
  const name = model.name
  // Mermaid's identity for a start or end: `<document>_start` / `<document>_end`.
  const idOf = new Map()
  for (const state of model.states) idOf.set(state.id, state.kind === 'start' || state.kind === 'end' ? `${state.container ?? 'root'}_${state.kind}` : state.id)
  const mermaid = id => idOf.get(id) ?? id
  const states = new Map()
  for (const state of model.states) {
    const id = mermaid(state.id)
    const known = states.get(id)
    if (!known) { states.set(id, { ...state, id, native: state.id }); continue }
    // A model that keeps a composite both as a node and as a group: the group says where it is.
    if (state.composite && !known.composite) Object.assign(known, { composite: true, container: state.container, label: state.label, descriptions: state.descriptions, native: state.id })
    if (Array.isArray(known.classes) && Array.isArray(state.classes)) known.classes = [...known.classes, ...state.classes]
  }
  const containerOf = id => states.get(id)?.container ?? null
  // The id Mermaid would print, or why the model has none.
  const outId = id => {
    const state = states.get(id)
    if (state?.idAbsent) return absent(state.idAbsent)
    const holder = state && (state.kind === 'start' || state.kind === 'end') ? states.get(state.container) : undefined
    return holder?.idAbsent ? absent(holder.idAbsent) : id
  }
  const notes = isAbsent(model.notes) ? model.notes : (model.notes ?? []).map(note => ({ ...note, target: mermaid(note.target) }))
  const noteOf = id => (isAbsent(notes) ? notes : notes.filter(note => note.target === id).at(-1))
  // A transition's document: recorded by the model, or the one holding both ends.
  const transitions = model.transitions.map(t => {
    const from = mermaid(t.from), to = mermaid(t.to)
    const doc = t.doc !== undefined ? t.doc : containerOf(from) === containerOf(to) ? containerOf(from) : absent(`${name} records transitions globally; a transition between states of different documents (${from} -> ${to}) has no recorded document`)
    return { ...t, from, to, doc, touchesRoot: containerOf(from) === null || containerOf(to) === null }
  })
  // Only a transition with an end in the root document can belong to it (and make that end
  // one of its states); layout data does not depend on a transition's document.
  const crossing = transitions.find(t => isAbsent(t.doc) && t.touchesRoot)
  const startOrEnd = state => state.kind === 'start' || state.kind === 'end'

  const noteRecord = note => (note === undefined || isAbsent(note) ? note : plain({ position: note.position, text: note.text }, hooks))
  const stateRecord = state =>
    build({
      stmt: 'state',
      id: state.id,
      descriptions: startOrEnd(state) ? [] : state.descriptions,
      type: startOrEnd(state) ? 'default' : state.kind,
      doc: state.composite ? (state.doc !== undefined ? state.doc : absent(model.doc)) : undefined,
      note: noteRecord(noteOf(state.id)),
      classes: state.classes,
      styles: state.styles,
    }, 'state', STATE_FIELDS, {}, hooks)
  const rootStates = () => {
    if (crossing) return hooks.unsupported(crossing.doc.reason)
    return new Map([...states.values()].filter(state => !state.region && state.container === null).map(state => [state.id, stateRecord(state)]))
  }
  const view = {
    getStates: rootStates,
    getState: id => rootStates().get(id),
    getRelations: () => {
      if (crossing) return hooks.unsupported(crossing.doc.reason)
      return transitions.filter(t => t.doc === null).map(t => build({ id1: outId(t.from), id2: outId(t.to), relationTitle: t.title }, 'relation', RELATION_FIELDS, {}, hooks))
    },
    getClasses: () => {
      if (isAbsent(model.classDefs)) return hooks.unsupported(model.classDefs.reason)
      return new Map(model.classDefs.map(([id, styles]) => [id, build({ id, styles, textStyles: isAbsent(styles) ? styles : textStylesOf(styles) }, 'class', CLASS_FIELDS, {}, hooks)]))
    },
    getDirection: () => (isAbsent(model.direction) ? hooks.unsupported(model.direction.reason) : model.direction ?? 'TB'),
    getData: () => layoutData(),
  }
  for (const [getter, key] of [['getAccTitle', 'accTitle'], ['getAccDescription', 'accDescr'], ['getLinks', 'links']])
    if (model[key] !== undefined) view[getter] = () => (isAbsent(model[key]) ? hooks.unsupported(model[key].reason) : model[key])

  // dataFetcher's layout data.
  function layoutData() {
    const depth = id => { let d = 0; for (let c = containerOf(id); c !== null && d < 64; c = containerOf(c)) d++; return d }
    const cssClasses = state => {
      if (isAbsent(state.classes)) return state.classes
      const base = `${state.classes.join(' ')} ${CSS_STATE}`
      return state.composite || state.region ? `${base} statediagram-cluster ${depth(state.id) % 2 ? 'statediagram-cluster-alt' : ''}` : base
    }
    const shapeOf = state => {
      if (state.region) return 'divider'
      if (state.composite) return 'roundedWithTitle'
      if (state.kind === 'start') return 'stateStart'
      if (state.kind === 'end') return 'stateEnd'
      if (isAbsent(state.kind) || state.kind !== 'default') return state.kind
      if (Array.isArray(state.descriptions)) return state.descriptions.length > 1 ? 'rectWithTitle' : 'rect'
      return state.singleLabel ? 'rect' : state.descriptions
    }
    const labelOf = state => {
      if (state.region) return ''
      if (startOrEnd(state)) return outId(state.id)
      if (Array.isArray(state.descriptions)) return state.descriptions[0] ?? state.id
      return state.label
    }
    const node = (fields, lazy) => build(fields, 'layout node', NODE_FIELDS, LAYOUT_RENDERER_ONLY, hooks, { domId: COUNTED.dom, ...lazy })
    const nodes = [], emitted = new Set()
    const emit = state => {
      if (emitted.has(state.id)) return
      emitted.add(state.id)
      if (state.container !== null && states.has(state.container)) emit(states.get(state.container))
      const group = state.composite || state.region
      const fields = {
        id: outId(state.id),
        shape: shapeOf(state),
        label: labelOf(state),
        cssClasses: cssClasses(state),
        cssStyles: state.styles,
        dir: !group ? undefined : state.region || !model.compositeDirection ? 'TB' : model.compositeDirection(state.native),
        type: group ? 'group' : undefined,
        isGroup: Boolean(group),
        parentId: state.container === null ? undefined : outId(state.container),
        labelType: 'markdown',
        position: undefined,
        // extract() keeps a label list's tail as `description`; a state without one has none.
        description: state.region || startOrEnd(state) ? undefined : Array.isArray(state.descriptions) ? (state.descriptions.length ? state.descriptions.slice(1) : undefined) : state.descriptions,
      }
      nodes.push(node(fields))
    }
    for (const state of states.values()) emit(state)
    const edge = (fields, lazy) => build({ arrowhead: 'normal', labelpos: 'c', labelType: 'markdown', thickness: 'normal', classes: 'transition', pattern: undefined, ...fields }, 'layout edge', EDGE_FIELDS, LAYOUT_RENDERER_ONLY, hooks, { id: COUNTED.edge, ...lazy })
    const edges = transitions.map(t => edge({ start: outId(t.from), end: outId(t.to), label: t.title }))
    for (const note of isAbsent(notes) ? [] : notes) {
      const state = states.get(note.target), group = `${note.target}----parent`
      const groupClasses = state ? cssClasses(state) : absent(`${name} keeps this note on ${note.target}, which it has no state for`)
      // Mermaid's note group has no parent, label type or direction of its own.
      nodes.push(node({ id: group, shape: 'noteGroup', label: note.text, cssClasses: groupClasses, cssStyles: [], type: 'group', isGroup: true, position: note.position, parentId: undefined, labelType: undefined, dir: undefined, description: undefined }))
      nodes.push(node({ shape: 'note', label: note.text, labelType: 'markdown', cssClasses: 'statediagram-note', cssStyles: [], type: 'node', isGroup: false, parentId: group, position: note.position, dir: undefined, description: undefined }, { id: COUNTED.note }))
      // A left note's edge runs from the note to its state.
      const ends = isAbsent(note.position) ? [{ start: note.position, end: note.position }, {}] : note.position === 'left of' ? [{ end: note.target }, { start: COUNTED.note }] : [{ start: note.target }, { end: COUNTED.note }]
      edges.push(edge({ ...ends[0], arrowhead: 'none', label: undefined, classes: 'transition note-edge', pattern: 'dashed' }, ends[1]))
    }
    // Without notes, Mermaid's node and edge lists would hold members this model cannot give.
    const whole = isAbsent(notes) ? list => incomplete(list, `${notes.reason}, so its layout data lacks Mermaid's note nodes and note edges`, hooks) : list => list
    const data = { nodes: whole(nodes), edges: whole(edges), other: {} }
    Object.defineProperty(data, 'direction', { get: () => view.getDirection(), enumerable: true })
    Object.defineProperty(data, 'config', { get: () => hooks.unsupported(CONFIG_REASON), enumerable: true })
    return data
  }
  return view
}

// ---------------------------------------------------------------------------------------
// Ports that keep Mermaid's own StateDB records (Pele and Bezel: states, relations,
// classes, links, rootDoc and their own layout graph; Latias94/merman: states, relations,
// styleClasses, links and Mermaid's getData nodes and edges). Rust's None arrives as null
// where Mermaid leaves a field undefined; a port's own layout record is read as it is,
// except for the fields Mermaid's renderer decides.
const asMap = value => (value instanceof Map ? new Map(value) : new Map(entriesOf(value)))
function portView(project, raw, hooks) {
  const latias = project === 'Latias94/merman'
  const unsetDeep = value => (latias ? deepUnset(value) : value)
  const states = () => new Map(entriesOf(raw.states).map(([id, state]) => [id, unsetDeep(state)]))
  const view = {
    getStates: states,
    getState: id => states().get(id),
    // Latias' None is Mermaid's '' for an unlabelled transition (addRelationObjs' default).
    getRelations: () => raw.relations.map(rel => (latias ? { ...unsetDeep(rel), relationTitle: rel.relationTitle ?? '' } : rel)),
    getClasses: () => asMap(latias ? raw.styleClasses : raw.classes),
    getLinks: () => asMap(raw.links ?? {}),
    // An unset accessibility title or description is Mermaid's '' (commonDb's default).
    getAccTitle: () => raw.accTitle ?? '',
    getAccDescription: () => raw.accDescr ?? '',
    // Mermaid's getDirection reads the root document's direction statement, default 'TB'.
    getDirection: () => (latias ? raw.direction ?? 'TB' : raw.rootDoc?.find(stmt => stmt?.stmt === 'dir')?.value ?? 'TB'),
  }
  const graph = latias ? { nodes: raw.nodes, edges: raw.edges } : raw.graph
  if (graph?.nodes) {
    // Latias' edge records predate Mermaid's `pattern` field; Pele and Bezel set it on note edges.
    const edgeAbsent = latias ? { ...LAYOUT_RENDERER_ONLY, pattern: "Latias94/merman's layout edges keep no stroke pattern (they predate Mermaid's `pattern` field)" } : LAYOUT_RENDERER_ONLY
    // A port leaves out a key Mermaid itself leaves undefined (a root node's parentId, a
    // leaf's dir and type, a non-note's position, a note edge's label).
    const unsetNode = { parentId: undefined, dir: undefined, type: undefined, position: undefined, description: undefined }
    const unsetEdge = { label: undefined, ...(latias ? {} : { pattern: undefined }) }
    view.getData = () => {
      const strip = object => Object.fromEntries(Object.entries(unsetDeep(object)).filter(([key]) => !(key in LAYOUT_RENDERER_ONLY)))
      const nodes = graph.nodes.map(node => record({ ...unsetNode, ...strip(node) }, 'layout node', NODE_FIELDS, LAYOUT_RENDERER_ONLY, hooks))
      const edges = graph.edges.map(edge => record({ ...unsetEdge, ...strip(edge) }, 'layout edge', EDGE_FIELDS, edgeAbsent, hooks))
      const data = { nodes, edges, other: {}, direction: view.getDirection() }
      Object.defineProperty(data, 'config', { get: () => hooks.unsupported(CONFIG_REASON), enumerable: true })
      return data
    }
  }
  return view
}

// ---------------------------------------------------------------------------------------
// Flowchart-graph models.

// zombie-mermaid 5.14.1 (@zombie-mermaid/mermaid-parser parseMermaid -> Ht), beautiful-mermaid
// 1.1.3 and ascii-mermaid 0.1.0 (src/parser.ts parseStateDiagram) build a MermaidGraph:
// a state is a 'rounded' node whose label is its last (zombie) or first (beautiful,
// ascii-mermaid) description, or its id when none was registered, so a bare state and
// `A : A` are the same node; [*] becomes a 'state-start' / 'state-end' node `_start<n>` /
// `_end<n>`; a composite is a subgraph (label = its description or id) and zombie's
// concurrency regions are `<id>__region<n>` subgraphs flagged `region`. Only zombie reads
// fork, join and choice (one 'fork-join' shape for both, and it clears their label),
// classDef / class / `:::` (one class per state), style statements and notes (a 'note' node
// `<state>----note-<n>` joined by a dotted edge, with the side dropped by its regex).
// None of the three reads accTitle / accDescr (their description pattern takes those lines
// for states) or click statements.
function mermaidGraphState(name, zombie) {
  return graph => {
    const nodes = graph.nodes instanceof Map ? graph.nodes : new Map(entriesOf(graph.nodes))
    const container = new Map(), composites = [], regions = []
    const walk = (group, parent) => {
      if (group.region) regions.push({ group, parent })
      else composites.push({ group, parent })
      for (const id of group.nodeIds ?? []) container.set(id, container.has(id) ? absent(`${name} lists state ${id} in two composites`) : group.id)
      for (const child of group.children ?? []) if (typeof child === 'object') walk(child, group.id)
    }
    for (const group of graph.subgraphs ?? []) walk(group, null)
    const notesAbsent = `${name}'s state parser reads no notes`
    const noteIds = new Set([...nodes].filter(([, node]) => zombie && node.shape === 'note').map(([id]) => id))
    const label = (id, text) => (text !== id ? [text] : absent(`${name} records a bare state and one described by its own id as the same node`))
    const classesOf = id => (zombie ? (graph.classAssignments?.get(id) ? [graph.classAssignments.get(id)] : []) : absent(`${name}'s state parser reads no class statements`))
    const stylesOf = id => (zombie ? styleStrings(graph.nodeStyles?.get(id)) : absent(`${name}'s state parser reads no style statements`))
    const KIND = { rounded: 'default', 'state-start': 'start', 'state-end': 'end', diamond: 'choice' }
    const states = []
    for (const [id, node] of nodes) {
      if (noteIds.has(id)) continue
      const where = container.get(id) ?? null
      const kind = node.shape === 'fork-join' ? absent(`${name} records fork and join states as the same 'fork-join' node`) : KIND[node.shape] ?? node.shape
      const cleared = zombie && (node.shape === 'fork-join' || node.shape === 'diamond')
      const text = cleared ? absent(`${name} clears the label of a fork, join or choice state`) : node.label
      states.push({ id, kind, container: isAbsent(where) ? null : where, label: text, descriptions: cleared ? text : label(id, node.label), classes: classesOf(id), styles: stylesOf(id), singleLabel: true, ambiguous: isAbsent(where) ? where : undefined })
    }
    // The graph keeps no position for a composite among its nodes: composites follow them.
    for (const { group, parent } of composites) states.push({ id: group.id, kind: 'default', container: parent, composite: true, label: group.label, descriptions: label(group.id, group.label), classes: classesOf(group.id), styles: stylesOf(group.id), singleLabel: true })
    for (const { group, parent } of regions) states.push({ id: group.id, kind: 'default', container: parent, region: true, classes: [], styles: [] })
    const ambiguous = states.find(state => state.ambiguous)
    if (ambiguous) states.length = 0
    // zombie-mermaid 5.14 joins every note as state -> note; 5.16 joins a left-of note as
    // note -> state. Either way the edge is the note's attachment, never a transition. The
    // edge direction is not read as the side: in 5.14 it carries none.
    const touchesNote = edge => noteIds.has(edge.target) || noteIds.has(edge.source)
    const noteEdges = graph.edges.filter(touchesNote)
    return {
      name,
      states,
      ambiguous: ambiguous?.ambiguous,
      transitions: graph.edges.filter(edge => !touchesNote(edge)).map(edge => ({ from: edge.source, to: edge.target, title: edge.label ?? '' })),
      notes: zombie ? noteEdges.map(edge => { const note = noteIds.has(edge.target) ? edge.target : edge.source; return { target: note === edge.target ? edge.source : edge.target, text: nodes.get(note).label, position: absent(`${name}'s note parser drops the side (left of / right of)`) } }) : absent(notesAbsent),
      classDefs: zombie ? entriesOf(graph.classDefs).map(([id, props]) => [id, styleStrings(props)]) : absent(`${name}'s state parser reads no classDef statements`),
      direction: directionOf(graph.direction),
      compositeDirection: id => directionOf(composites.find(({ group }) => group.id === id)?.group.direction ?? 'TB'),
      accTitle: absent(`${name}'s state parser reads no accTitle statement`),
      accDescr: absent(`${name}'s state parser reads no accDescr statement`),
      links: absent(`${name}'s state parser reads no click statements`),
      doc: `${name} keeps a composite's members as a node list, not Mermaid's statement document`,
    }
  }
}

// termaid 0.10.0 parser/statediagram.py: states are ROUNDED nodes labelled with their
// `state "…" as id` text or their id (it reads no `id : description` lines), [*] becomes a
// CIRCLE node `[*]_start_<n>` / `[*]_end_<n>`, `<<choice>>` a DIAMOND and `<<fork>>` /
// `<<join>>` one FORK_JOIN shape. `state X {` opens a subgraph whose id is its label; a
// transition to a composite drops the composite's node for the subgraph. Notes are kept
// only in the one-line `note left of|right of X : text` form. It reads no classDef, class,
// style, accTitle, accDescr or click statement, no concurrency regions, and a `direction`
// line anywhere sets the root direction (subgraphs keep none).
function termaidState(raw) {
  const name = 'termaid'
  const container = new Map(), composites = []
  const walk = (group, parent) => {
    composites.push({ group, parent })
    for (const id of group.node_ids ?? []) container.set(id, group.id)
    for (const child of group.children ?? []) if (typeof child === 'object') walk(child, group.id)
  }
  for (const group of raw.subgraphs ?? []) walk(group, null)
  const order = raw.node_order ?? Object.keys(raw.nodes)
  const KIND = { ROUNDED: 'default', DIAMOND: 'choice' }
  const kindOf = (id, node) => {
    if (node.shape === 'CIRCLE' && /^\[\*\]_start_\d+$/.test(id)) return 'start'
    if (node.shape === 'CIRCLE' && /^\[\*\]_end_\d+$/.test(id)) return 'end'
    if (node.shape === 'FORK_JOIN') return absent("termaid records fork and join states as the same FORK_JOIN shape")
    return KIND[node.shape] ?? node.shape
  }
  const noClass = absent("termaid's state parser reads no class statements"), noStyle = absent("termaid's state parser reads no style statements")
  const states = [
    // termaid's composite comes only from `state X {` (no description form), so its label is its id.
    ...composites.map(({ group, parent }) => ({ id: group.id, kind: 'default', container: parent, composite: true, label: group.label, descriptions: group.label === group.id ? [] : [group.label], classes: noClass, styles: noStyle, singleLabel: true })),
    ...order.filter(id => raw.nodes[id]).map(id => {
      const node = raw.nodes[id]
      return { id, kind: kindOf(id, node), container: container.get(id) ?? null, label: node.label, descriptions: node.label !== id ? [node.label] : absent("termaid records a bare state and `state \"X\" as X` with the same label"), classes: noClass, styles: noStyle, singleLabel: true }
    }),
  ]
  const POSITION = { leftof: 'left of', rightof: 'right of' }
  return {
    name,
    states,
    transitions: raw.edges.map(edge => ({ from: edge.source, to: edge.target, title: edge.label ?? '' })),
    notes: (raw.notes ?? []).map(note => ({ target: note.target, text: note.text, position: POSITION[note.position] ?? note.position })),
    classDefs: absent("termaid's state parser reads no classDef statements"),
    direction: directionOf(raw.direction),
    compositeDirection: () => absent("termaid's subgraphs keep no direction; a nested direction line sets the root direction"),
    accTitle: absent("termaid's state parser reads no accTitle statement"),
    accDescr: absent("termaid's state parser reads no accDescr statement"),
    links: absent("termaid's state parser reads no click statements"),
    doc: "termaid keeps a composite's members as a node list, not Mermaid's statement document",
  }
}

// figurehead plugins/state (parser.rs, database.rs): it reads only `state "…" as id`
// declarations and transitions, line by line, into one flat list of Rectangle states and
// Terminal `[*]_start` / `[*]_end` states; every other line is skipped. Its model has one
// document, no composites, and no descriptions, classes, styles, notes, classDefs,
// direction, accessibility text or links.
function figureheadState(raw) {
  const name = 'figurehead'
  const skipped = what => absent(`figurehead's state parser reads only state declarations and transitions; it keeps no ${what}`)
  return {
    name,
    states: raw.states.map(state => {
      const kind = state.shape === 'Terminal' && state.id === '[*]_start' ? 'start' : state.shape === 'Terminal' && state.id === '[*]_end' ? 'end' : state.shape === 'Rectangle' ? 'default' : state.shape
      return { id: state.id, kind, container: null, label: state.label, descriptions: state.label !== state.id ? [state.label] : absent('figurehead records a bare state and `state "X" as X` with the same label'), classes: skipped('classes'), styles: skipped('styles'), singleLabel: true }
    }),
    transitions: raw.transitions.map(t => ({ from: t.from, to: t.to, title: t.label ?? '' })),
    notes: skipped('notes'),
    classDefs: skipped('classDef statements'),
    direction: skipped('direction'),
    accTitle: skipped('accTitle'),
    accDescr: skipped('accDescr'),
    links: skipped('click links'),
    doc: 'figurehead keeps no composite states',
  }
}

// Grok's mermaid.rs parse_state and its Go port MermaidText (parse_state.go) read a state
// diagram into their flowchart graph: one flat document (`state X {`, `}` and `--` are
// read as a declaration of X or skipped), Round nodes for states and for `<<fork>>` /
// `<<join>>` alike, Diamond for `<<choice>>`, one `[*]start` and one `[*]end` node, a label
// that is the last `state "…" as id` / `id : …` text or the id. classDef, class, style,
// notes, accTitle, accDescr and click lines are skipped or read as states.
// Loom (diagrams/state.ts) builds the same graph with composites: groups (with parents),
// `--` regions as unlabelled `region <n>` groups, `[*]start` / `[*]end` scoped per group
// (` g<n>`), node classes from `:::` and class statements, classDefs, and repeated
// descriptions joined into one label with spaces; it drops style, note and click lines.
function indexGraphState(name, loom) {
  return graph => {
    const ids = []
    for (const [id, index] of entriesOf(graph.index)) if (ids[index] === undefined) ids[index] = id
    const groups = graph.groups ?? [], groupOf = graph.nodeGroup ?? graph.node_group ?? []
    const isRegion = group => loom && /^region \d+$/.test(group.id) && group.label === ''
    const at = index => (typeof index === 'number' && index >= 0 && groups[index] ? groups[index].id : null)
    const skipped = what => absent(`${name}'s state parser skips ${what}`)
    const collapse = absent(`${name} records a <<fork>> or <<join>> state as a plain round node`)
    const states = ids.map((id, index) => {
      const node = graph.nodes[index]
      const marker = /^\[\*\](start|end)(?: g\d+)?$/.exec(id)
      const shape = String(node.shape).replace(/^shape/, '').toLowerCase()
      const kind = marker ? marker[1] : shape === 'diamond' ? 'choice' : shape === 'round' ? collapse : node.shape
      const descriptions = node.label === id ? absent(`${name} records a bare state and one described by its own id with the same label`) : loom ? absent('Loom joins repeated descriptions into one label') : [node.label]
      return { id, kind, container: at(groupOf[index]), label: loom && node.label !== id ? descriptions : node.label, descriptions, classes: loom ? node.classes ?? [] : skipped('class statements'), styles: skipped('style statements'), singleLabel: !loom || node.label === id }
    })
    for (const group of groups) states.push(isRegion(group) ? { id: group.id, kind: 'default', container: at(group.parent), region: true, classes: [], styles: [] } : { id: group.id, kind: 'default', container: at(group.parent), composite: true, label: group.label, descriptions: group.label === group.id ? absent(`${name} records \`state X {\` and \`state "X" as X {\` with the same label`) : [group.label], classes: loom ? [] : skipped('class statements'), styles: skipped('style statements'), singleLabel: true })
    return {
      name,
      states,
      transitions: graph.edges.map(edge => ({ from: ids[edge.from], to: ids[edge.to], title: edge.label ?? '' })),
      notes: skipped('notes'),
      classDefs: loom ? entriesOf(graph.classDefs).map(([id, props]) => [id, styleStrings(props)]) : skipped('classDef statements'),
      direction: directionOf(graph.dir),
      compositeDirection: () => absent(`${name} keeps one diagram direction; a nested direction line sets it`),
      accTitle: skipped('accTitle'),
      accDescr: skipped('accDescr'),
      links: skipped('click statements'),
      doc: loom ? "Loom keeps a composite's members as a node list, not Mermaid's statement document" : `${name} keeps no composite states`,
    }
  }
}

// mermaid_core 0.3.2 (Mermaid Dart and Mermaid Flutter) state_parser.dart: states keyed by
// id with a kind (normal, composite, start, end, fork, join, choice, history), a parent,
// cssClasses (every class statement appends) and a style map; `[*]` is `__start_<scope>` /
// `__end_<scope>`; a composite keeps its `--` regions as member lists without ids. The
// label is the `state "…"` text or the descriptions, repeated ones joined by newlines, and
// `<br>` also becomes a newline. Notes keep their side; classDefs are property maps. It
// keeps one diagram direction (a nested direction line sets it) and ignores accTitle,
// accDescr and click lines.
function dartState(raw) {
  const name = 'mermaid_core'
  const nodes = entriesOf(raw.states).map(([, node]) => node)
  const regionOf = new Map(), regions = []
  for (const node of nodes)
    (node.regions ?? []).forEach((members, index) => {
      const id = `${node.id}\u0000region${index}`
      regions.push({ id, kind: 'default', container: node.id, region: true, classes: [], styles: [], idAbsent: "mermaid_core keeps a composite's concurrency regions without ids" })
      for (const member of members) regionOf.set(member, id)
    })
  const KIND = { normal: 'default', composite: 'default', start: 'start', end: 'end', fork: 'fork', join: 'join', choice: 'choice' }
  const descriptionsOf = node => (node.label === node.id ? absent('mermaid_core records a bare state and one described by its own id with the same label') : node.label.includes('\n') ? absent('mermaid_core joins repeated descriptions (and a <br>) into one label with newlines') : [node.label])
  const states = [
    ...nodes.map(node => { const descriptions = descriptionsOf(node); return { id: node.id, kind: KIND[node.kind] ?? node.kind, container: regionOf.get(node.id) ?? node.parent ?? null, composite: node.kind === 'composite', label: descriptions, descriptions, classes: node.cssClasses ?? [], styles: styleStrings(node.styles), singleLabel: node.label === node.id } }),
    ...regions,
  ]
  // Mermaid's layout label is the first description, or the id when there is none: an id
  // label reads the same either way.
  for (const state of states) if (!state.region) state.label = Array.isArray(state.descriptions) ? state.descriptions[0] : state.singleLabel ? state.id : state.descriptions
  const POSITION = { leftOf: 'left of', rightOf: 'right of' }
  return {
    name,
    states,
    transitions: raw.transitions.map(t => ({ from: t.from, to: t.to, title: t.label ?? '' })),
    notes: raw.notes.map(note => ({ target: note.target, text: note.text, position: POSITION[note.position] ?? note.position })),
    classDefs: entriesOf(raw.classDefs).map(([id, props]) => [id, styleStrings(props)]),
    direction: directionOf(raw.direction),
    compositeDirection: () => absent('mermaid_core keeps one diagram direction; a nested direction line sets it'),
    accTitle: absent("mermaid_core's state parser ignores accTitle lines"),
    accDescr: absent("mermaid_core's state parser ignores accDescr lines"),
    links: absent("mermaid_core's state parser ignores click lines"),
    doc: "mermaid_core keeps a composite's children as an id list, not Mermaid's statement document",
  }
}

// merslim 0.2.3 parseStateDiagram: states with kind state | composite | start | end and a
// parent; `[*]` is `__start` / `__end`, or `__start_<parent>` inside a composite; the label is
// the last `id : …` text or the id (it reads no `state "…" as id`); transitions record their
// composite. It reads no fork, join, choice, classDef, class, style, note, direction,
// accTitle, accDescr or click statement (`--` becomes a state named `--`).
function merslimState(raw) {
  const reads = what => absent(`merslim's state parser reads no ${what}`)
  const KIND = { state: 'default', composite: 'default', start: 'start', end: 'end' }
  return {
    name: 'merslim',
    states: raw.states.map(state => ({ id: state.id, kind: KIND[state.kind] ?? state.kind, container: state.parent ?? null, composite: state.kind === 'composite', label: state.label, descriptions: state.label === state.id ? absent('merslim records a bare state and one described by its own id with the same label') : [state.label], classes: reads('class statements'), styles: reads('style statements'), singleLabel: true })),
    transitions: raw.transitions.map(t => ({ from: t.source, to: t.target, title: t.label ?? '', doc: t.parent ?? null })),
    notes: reads('notes'),
    classDefs: reads('classDef statements'),
    direction: reads('direction statements'),
    accTitle: reads('accTitle statement'),
    accDescr: reads('accDescr statement'),
    links: reads('click statements'),
    doc: "merslim keeps a composite's members as states with a parent, not Mermaid's statement document",
  }
}

// mermaid-rs-renderer 0.3.1 parse_state_diagram (parser.rs): states are graph nodes; a
// composite is a subgraph whose node list holds every state inside it (nested ones too),
// and a composite split by `--` adds one `__region_<n>__` subgraph per region; `[*]` is
// `__start_<scope>__` (Circle) / `__end_<scope>__` (DoubleCircle), and a nested start or end
// with several transitions becomes a ForkJoin bar, the same shape as `<<fork>>` and
// `<<join>>`. A label is the `state "…"` text or the id, followed by `\n---\n` and the
// descriptions when there are any. Classes are kept per node; classDefs and styles only as
// the typed properties it renders. Notes keep their side. It keeps one diagram direction
// and reads no accTitle, accDescr or click statement (they become states).
// Nesting is read from the node lists: a state's container is the smallest subgraph that
// lists it (a composite before a region of the same size, then the later one), a
// composite's the smallest other subgraph listing all its states.
function mmdrState(raw) {
  const name = 'mermaid-rs-renderer'
  const groups = (raw.subgraphs ?? []).map((group, index) => ({ ...group, index, region: /^__region_\d+__$/.test(group.id ?? ''), set: new Set(group.nodes ?? []) }))
  const smallest = list => list.sort((a, b) => a.set.size - b.set.size || Number(a.region) - Number(b.region) || b.index - a.index)[0]
  const containerOf = id => smallest(groups.filter(group => group.set.has(id)))?.id ?? null
  const ambiguous = groups.find(group => group.id == null || group.set.size === 0)
  const parentOf = group => smallest(groups.filter(other => other !== group && !(other.region && !group.region && other.set.size === group.set.size) && [...group.set].every(id => other.set.has(id)) && (other.set.size > group.set.size || other.index < group.index)))?.id ?? null
  const order = entriesOf(raw.nodes).sort((a, b) => (raw.node_order?.[a[0]] ?? 0) - (raw.node_order?.[b[0]] ?? 0))
  const subgraphIds = new Set(groups.map(group => group.id))
  const displayLabel = absent('mermaid-rs-renderer joins the state text and its descriptions into one display label')
  const kindOf = (id, node) => {
    if (node.shape === 'Circle' && /^__start_.+__$/.test(id)) return 'start'
    if (node.shape === 'DoubleCircle' && /^__end_.+__$/.test(id)) return 'end'
    if (node.shape === 'ForkJoin') return absent('mermaid-rs-renderer records fork, join and a nested start or end with several transitions as the same ForkJoin bar')
    return { RoundRect: 'default', Diamond: 'choice' }[node.shape] ?? node.shape
  }
  const styles = absent('mermaid-rs-renderer keeps a style statement only as the typed properties it renders')
  const states = [
    ...order.filter(([id]) => !subgraphIds.has(id)).map(([id, node]) => {
      const same = node.label === id
      return { id, kind: kindOf(id, node), container: containerOf(id), label: same ? id : displayLabel, descriptions: same ? absent('mermaid-rs-renderer records a bare state and `state "X" as X` with the same label') : displayLabel, classes: raw.node_classes?.[id] ?? [], styles, singleLabel: same }
    }),
    ...groups.map(group => (group.region
      ? { id: group.id, kind: 'default', container: smallest(groups.filter(other => !other.region && other !== group && [...group.set].every(id => other.set.has(id))))?.id ?? null, region: true, classes: [], styles: [] }
      : { id: group.id, kind: 'default', container: parentOf(group), composite: true, label: group.label, descriptions: group.label === group.id ? absent('mermaid-rs-renderer records `state X {` and `state "X" as X {` with the same label') : [group.label], classes: raw.node_classes?.[group.id] ?? [], styles, singleLabel: true })),
  ]
  const POSITION = { LeftOf: 'left of', RightOf: 'right of' }
  return {
    name,
    states,
    ambiguous: ambiguous ? absent('mermaid-rs-renderer keeps an empty or unnamed composite, whose place in the nesting its node lists do not record') : undefined,
    transitions: raw.edges.map(edge => ({ from: edge.from, to: edge.to, title: edge.label ?? '' })),
    notes: (raw.state_notes ?? []).map(note => ({ target: note.target, text: note.label, position: POSITION[note.position] ?? note.position })),
    classDefs: entriesOf(raw.class_defs).map(([id]) => [id, absent('mermaid-rs-renderer keeps a classDef only as the typed properties it renders, not the declarations as written')]),
    direction: directionOf(raw.direction),
    compositeDirection: () => absent('mermaid-rs-renderer keeps one diagram direction; a nested direction line sets it'),
    accTitle: absent("mermaid-rs-renderer's state parser reads no accTitle statement"),
    accDescr: absent("mermaid-rs-renderer's state parser reads no accDescr statement"),
    links: absent("mermaid-rs-renderer's state parser reads no click statements"),
    doc: "mermaid-rs-renderer keeps a composite's states as a node list, not Mermaid's statement document",
  }
}

// agentic-mermaid 0.5.6 state body (its StateNode / StateBody types): nested documents, each
// with its own states and transitions; a composite holds `states` / `transitions`, or
// `regions` (without ids) when split by `--`; `[*]` stays '[*]' in a transition, with its
// class in fromClass / toClass. A label is present only when written (`state "…" as id` /
// `id : …`, repeated descriptions joined by newlines); className lists every assigned class,
// space-separated; style is the state's style map; notes keep their side; classDefs are
// property maps; direction is kept per composite. Its accessibility title and description
// are kept outside the body this bridge passes, so they are not read here.
function agenticState(raw) {
  const name = 'agentic-mermaid'
  const states = [], transitions = []
  const descriptionsOf = state => (state.label === undefined ? [] : state.label.includes('\n') ? absent('agentic-mermaid joins repeated descriptions into one label with newlines') : [state.label])
  const walk = (list, moves, doc) => {
    for (const state of list ?? []) {
      const composite = Boolean(state.states || state.transitions || state.regions)
      const descriptions = descriptionsOf(state)
      states.push({ id: state.id, kind: state.stereotype ?? 'default', container: doc, composite, label: Array.isArray(descriptions) ? descriptions[0] ?? state.id : descriptions, descriptions, classes: state.className ? state.className.split(' ') : [], styles: styleStrings(state.style), direction: state.direction })
      if (state.regions)
        state.regions.forEach((region, index) => {
          const id = `${state.id}\u0000region${index}`
          states.push({ id, kind: 'default', container: state.id, region: true, classes: [], styles: [], idAbsent: "agentic-mermaid keeps a composite's concurrency regions without ids" })
          walk(region.states, region.transitions, id)
        })
      else if (composite) walk(state.states, state.transitions, state.id)
    }
    // Mermaid names a `[*]` by the document it is written in and its side of the arrow.
    const marker = (side, cls) => {
      const id = `[*]${side}\u0000${doc ?? ''}`
      let state = states.find(item => item.id === id)
      if (!state) states.push(state = { id, kind: side, container: doc, classes: [], styles: [] })
      if (cls) state.classes.push(cls)
      return id
    }
    for (const t of moves ?? []) transitions.push({ from: t.from === '[*]' ? marker('start', t.fromClass) : t.from, to: t.to === '[*]' ? marker('end', t.toClass) : t.to, title: t.label ?? '', doc })
  }
  walk(raw.states, raw.transitions, null)
  const SIDE = { left: 'left of', right: 'right of' }
  return {
    name,
    states,
    transitions,
    notes: (raw.notes ?? []).map(note => ({ target: note.target, text: note.text, position: SIDE[note.side] ?? note.side })),
    classDefs: entriesOf(raw.classDefs).map(([id, props]) => [id, styleStrings(props)]),
    direction: raw.direction === undefined ? 'TB' : directionOf(raw.direction),
    compositeDirection: id => directionOf(states.find(state => state.id === id)?.direction ?? 'TB'),
    doc: "agentic-mermaid keeps a composite's states and transitions as separate lists, not Mermaid's statement document",
    // Its model's own accessibility fields (probed); Mermaid reads '' when none was written.
    accTitle: raw.accessibilityTitle ?? '',
    accDescr: raw.accessibilityDescription ?? '',
  }
}

// XMermaid parse_dsl state AST: states with an optional `state "…" as id` label, a
// pseudostate word (start, end, fork, join, choice), a composite flag and a parent; every
// `[*]` is one `__start__` or `__end__` state for the whole diagram. Notes keep their
// placement. It rejects classDef, style and direction lines, reads `:::` into the id, and
// keeps no accTitle / accDescr (it accepts and drops them) and no concurrency regions.
function xmermaidState(raw) {
  const name = 'XMermaid'
  const KIND = { start: 'start', end: 'end', fork: 'fork', join: 'join', choice: 'choice' }
  const none = what => absent(`XMermaid's state AST keeps no ${what}`)
  return {
    name,
    states: raw.states.map(state => ({ id: state.id, kind: state.pseudostate ? KIND[state.pseudostate] ?? state.pseudostate : 'default', container: state.parent ?? null, composite: Boolean(state.composite), label: state.label ?? state.id, descriptions: state.label === undefined ? [] : [state.label], classes: none('classes'), styles: none('styles'), singleLabel: true })),
    transitions: raw.transitions.map(t => ({ from: t.from, to: t.to, title: t.label ?? '' })),
    notes: (raw.notes ?? []).map(note => ({ target: note.target, text: note.text, position: { left: 'left of', right: 'right of' }[note.placement] ?? note.placement })),
    classDefs: none('classDefs'),
    direction: none('direction'),
    accTitle: none('accTitle'),
    accDescr: none('accDescr'),
    links: none('click links'),
    doc: "XMermaid keeps a composite's members as states with a parent, not Mermaid's statement document",
  }
}

// OpenCode's merman package (packages/merman/src/state/parser.ts, also published as
// @kitlangton/merman): states with kind state | start | end | choice and a parentId,
// composites listed apart; `[*]` is `__start` / `__end`, or `<composite>.__start` inside one,
// and a transition to (from) a composite that has its own start (end) is rewritten to that
// marker. A label is the `state "…" as id` text or the id. Notes keep their side and their
// text as lines. The diagram direction defaults to LR when none is written. It rejects
// classDef, class, style, `:::`, fork, join, description, accTitle and accDescr lines.
function mermanState(name) {
  return raw => {
    const composites = raw.composites ?? []
    const parentOf = new Map([...raw.states.map(state => [state.id, state.parentId ?? null]), ...composites.map(c => [c.id, c.parentId ?? null])])
    const inside = (id, composite) => { for (let p = parentOf.get(id); p != null; p = parentOf.get(p)) if (p === composite) return true; return false }
    // Undo the rewrite of a transition to (from) a composite into its own start (end) marker.
    const endpoint = (id, other, marker) => {
      const match = new RegExp(`^(.+)\\.__${marker}$`).exec(id)
      return match && composites.some(c => c.id === match[1]) && !inside(other, match[1]) ? match[1] : id
    }
    const rejects = what => absent(`${name}'s state parser rejects ${what}`)
    const KIND = { state: 'default', start: 'start', end: 'end', choice: 'choice' }
    const same = absent(`${name} records a bare state and \`state "X" as X\` with the same label`)
    return {
      name,
      states: [
        ...raw.states.map(state => ({ id: state.id, kind: KIND[state.kind] ?? state.kind, container: state.parentId ?? null, label: state.kind === 'choice' ? absent(`${name} clears a choice state's label`) : state.label, descriptions: state.kind === 'choice' ? absent(`${name} clears a choice state's label`) : state.label === state.id ? same : [state.label], classes: rejects('class statements'), styles: rejects('style statements'), singleLabel: true })),
        ...composites.map(c => ({ id: c.id, kind: 'default', container: c.parentId ?? null, composite: true, label: c.label, descriptions: c.label === c.id ? same : [c.label], classes: rejects('class statements'), styles: rejects('style statements'), singleLabel: true })),
      ],
      transitions: raw.transitions.map(t => ({ from: endpoint(t.from, t.to, 'end'), to: endpoint(t.to, t.from, 'start'), title: t.label ?? '' })),
      notes: (raw.notes ?? []).map(note => ({ target: note.target, text: note.lines.join('\n'), position: { left: 'left of', right: 'right of' }[note.position] ?? note.position })),
      classDefs: rejects('classDef statements'),
      direction: raw.direction === 'LR' ? absent(`${name} reports LR both for \`direction LR\` and for a diagram with no direction`) : directionOf(raw.direction),
      compositeDirection: () => 'TB',
      accTitle: rejects('accTitle statements'),
      accDescr: rejects('accDescr statements'),
      links: rejects('click statements'),
      doc: `${name} keeps a composite's members as states with a parent, not Mermaid's statement document`,
    }
  }
}

const STATE = {
  'xai-org/grok-build': indexGraphState('Grok', false),
  'spacedock-dev/mermaidtext': indexGraphState('MermaidText', false),
  'Yassimba/loom': indexGraphState('Loom', true),
  'orestesgaolin/mermaid': dartState,
  'pub:mermaid_flutter': dartState,
  'emtyty/merslim': merslimState,
  '1jehuang/mermaid-rs-renderer': mmdrState,
  'adewale/agentic-mermaid': agenticState,
  'evangwt/xmermaid': xmermaidState,
  'anomalyco/opencode': mermanState('OpenCode merman'),
  'kitlangton/merman': mermanState('merman'),
  'dfadler/zombie-mermaid': mermaidGraphState('zombie-mermaid', true),
  'lukilabs/beautiful-mermaid': mermaidGraphState('beautiful-mermaid', false),
  'kais-radwan/ascii-mermaid': mermaidGraphState('ascii-mermaid', false),
  'fasouto/termaid': termaidState,
  'Mootikins/figurehead-rs': figureheadState,
}

function view(project) {
  return (raw, hooks) => {
    if (['obsidianmd/pele', 'crabtalk/bezel', 'Latias94/merman'].includes(project)) return raw.states ? portView(project, raw, hooks) : undefined
    const model = STATE[project](raw)
    if (model.ambiguous) return Object.fromEntries(['getStates', 'getState', 'getRelations', 'getData'].map(getter => [getter, () => hooks.unsupported(model.ambiguous.reason)]))
    return stateView(model, hooks)
  }
}
const projects = ['obsidianmd/pele', 'crabtalk/bezel', 'Latias94/merman', ...Object.keys(STATE)]

export default { schema: { state: Object.fromEntries(projects.map(project => [project, view(project)])) }, ast: {} }
export { stateView, Absent, absent }
