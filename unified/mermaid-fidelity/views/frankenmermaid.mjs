// Reviewed schema views for Frankenmermaid 0.4.0 (Dicklesworthstone/frankenmermaid).
//
// Its Rust/WASM parse() returns one IR for every family: `diagram_type` names the family
// the parser recognised, `nodes` (id, label index into `labels`, NodeShape word, classes),
// `edges` (`from`/`to` as { Node: i }, an arrow word, a label index, family `extras`),
// `graph.subgraphs`, `clusters`, `style_refs`, `meta` (title, acc_title, acc_descr) and a
// family block (`sequence_meta`, ...). Each view below first checks `diagram_type`: a view
// reads only the IR of its own family and answers nothing for another one. The exception
// is a family Frankenmermaid does not recognise at all (agentflow, usecase, railroad,
// cynefin): its sources come back as a Flowchart or Sequence IR, and reading one is the
// candidate's unsupported operation rather than a translation of that fallback reading.
//
// See views/index.mjs for the module contract and schema-views.mjs for the doctrine. Every
// mapping was checked against captured parse() output and against Mermaid's database at
// the pinned tag (packages/mermaid/src/diagrams/<family>/).
import { MERMAID_CONSTANTS, PLACEMENT, SEQ_ABSENT, c4View, record, sequenceView } from '../view-core.mjs'
import { stateView, absent as stateAbsent } from './state.mjs'

const PROJECT = 'Dicklesworthstone/frankenmermaid'
const NAME = 'Frankenmermaid'
const labelOf = (ir, index) => (typeof index === 'number' ? ir.labels?.[index]?.text : undefined)
const nodeIds = ir => (ir.nodes ?? []).map(node => node.id)
const endpoint = (ir, end, hooks) => (typeof end?.Node === 'number' && ir.nodes[end.Node] ? ir.nodes[end.Node].id : hooks.unavailable(`${NAME} edge endpoint that is not a node`))
const isType = (ir, type) => ir && typeof ir === 'object' && ir.diagram_type === type
// Mermaid's commonDb title and accessibility getters return '' when none was written.
const commonText = ir => ({ getDiagramTitle: () => ir.meta?.title ?? '', getAccTitle: () => ir.meta?.acc_title ?? '', getAccDescription: () => ir.meta?.acc_descr ?? '' })

// ---------------------------------------------------------------------------------------
// Sequence (sequenceDb.ts). Participants are the nodes in declaration order; a participant
// type is the class `sequence-participant-<type>` (none for a plain or implicit
// participant); `link` / `links` statements become menu_links. Messages are edges with an
// ArrowType word; sequence_meta keeps notes, fragments (post-order, with child indexes),
// boxes (participant_groups), create/destroy events and a timeline of Message / Note /
// Open / Else / Close in source order, from which Mermaid's flat message list is rebuilt.
const SEQUENCE_ARROW = {
  Line: 'SOLID_OPEN', DottedLine: 'DOTTED_OPEN', Arrow: 'SOLID', DottedArrow: 'DOTTED', Cross: 'SOLID_CROSS', DottedCross: 'DOTTED_CROSS',
  OpenArrow: 'SOLID_POINT', DottedOpenArrow: 'DOTTED_POINT', DoubleArrow: 'BIDIRECTIONAL_SOLID', DoubleDottedArrow: 'BIDIRECTIONAL_DOTTED',
  HalfArrowTop: 'SOLID_TOP', HalfArrowBottom: 'SOLID_BOTTOM', StickArrowTop: 'STICK_TOP', StickArrowBottom: 'STICK_BOTTOM',
  HalfArrowTopReverse: 'SOLID_ARROW_TOP_REVERSE', HalfArrowBottomReverse: 'SOLID_ARROW_BOTTOM_REVERSE', StickArrowTopReverse: 'STICK_ARROW_TOP_REVERSE', StickArrowBottomReverse: 'STICK_ARROW_BOTTOM_REVERSE',
  HalfArrowTopDotted: 'SOLID_TOP_DOTTED', HalfArrowBottomDotted: 'SOLID_BOTTOM_DOTTED', StickArrowTopDotted: 'STICK_TOP_DOTTED', StickArrowBottomDotted: 'STICK_BOTTOM_DOTTED',
  HalfArrowTopReverseDotted: 'SOLID_ARROW_TOP_REVERSE_DOTTED', HalfArrowBottomReverseDotted: 'SOLID_ARROW_BOTTOM_REVERSE_DOTTED', StickArrowTopReverseDotted: 'STICK_ARROW_TOP_REVERSE_DOTTED', StickArrowBottomReverseDotted: 'STICK_ARROW_BOTTOM_REVERSE_DOTTED',
}
// Fragment kind -> Mermaid [start, section, end] line type names.
const SEQUENCE_BLOCK = { Loop: ['LOOP_START', undefined, 'LOOP_END'], Alt: ['ALT_START', 'ALT_ELSE', 'ALT_END'], Opt: ['OPT_START', undefined, 'OPT_END'], Par: ['PAR_START', 'PAR_AND', 'PAR_END'], Critical: ['CRITICAL_START', 'CRITICAL_OPTION', 'CRITICAL_END'], Break: ['BREAK_START', undefined, 'BREAK_END'], Rect: ['RECT_START', undefined, 'RECT_END'] }
const NOTE_PLACEMENT = { LeftOf: 'leftof', RightOf: 'rightof', Over: 'over' }
const ACTOR_FIELDS = ['name', 'description', 'type', 'wrap', 'links', 'properties', 'prevActor', 'nextActor', 'box', 'actorCnt']
const BOX_FIELDS = ['name', 'wrap', 'fill', 'actorKeys']
const NO_WRAP = `${NAME} keeps no text-wrapping flag; a wrap: or nowrap: prefix stays part of the text`

function sequence(ir, hooks) {
  if (!isType(ir, 'Sequence')) return undefined
  const LINE = MERMAID_CONSTANTS.sequence.LINETYPE
  const meta = ir.sequence_meta ?? {}
  const ids = nodeIds(ir)
  const groups = meta.participant_groups ?? []
  // Mermaid's box: name undefined without a title, fill 'transparent' without a colour.
  const boxes = groups.map(group => record({ name: group.label ? group.label : undefined, fill: group.color ?? 'transparent', actorKeys: (group.participants ?? []).map(index => ids[index]) }, 'box', BOX_FIELDS, { wrap: NO_WRAP }, hooks))
  const boxOf = index => boxes[groups.findIndex(group => (group.participants ?? []).includes(index))]
  const typeOf = node => {
    const word = (node.classes ?? []).find(name => name.startsWith('sequence-participant-'))?.slice('sequence-participant-'.length)
    return word === undefined ? 'participant' : word
  }
  const actorAbsent = {
    wrap: NO_WRAP,
    properties: `${NAME} does not keep participant properties statements`,
    actorCnt: "Mermaid's renderer assigns actorCnt; it is not part of a parse result",
  }
  const actors = () =>
    new Map(ir.nodes.map((node, index) => [node.id, record({
      name: node.id,
      description: labelOf(ir, node.label) ?? node.id,
      type: typeOf(node),
      links: Object.fromEntries((node.menu_links ?? []).map(link => [link.label, link.url])),
      prevActor: ids[index - 1],
      nextActor: ids[index + 1],
      box: boxOf(index),
    }, 'actor', ACTOR_FIELDS, actorAbsent, hooks)]))

  // Where a statement that leaves no timeline entry (create, destroy) was written is only
  // known when the message it announces directly follows another message or opens the list.
  const flat = () => {
    const timeline = meta.timeline ?? ir.edges.map(() => 'Message')
    const notes = meta.notes ?? []
    const fragments = meta.fragments ?? []
    if (timeline.filter(kind => kind === 'Message').length !== ir.edges.length || timeline.filter(kind => kind === 'Note').length !== notes.length || timeline.filter(kind => kind === 'Open').length !== fragments.length)
      return hooks.unavailable(`${NAME} sequence timeline that does not match its messages, notes and fragments`)
    // Fragments are listed as they close; the timeline opens them in source (pre-)order.
    const nested = new Set(fragments.flatMap(fragment => fragment.children ?? []))
    const opened = []
    const visit = index => { opened.push(fragments[index]); for (const child of fragments[index].children ?? []) visit(child) }
    fragments.forEach((_fragment, index) => { if (!nested.has(index)) visit(index) })
    const entries = [], edgeEntry = [], stack = []
    let edge = 0, note = 0, open = 0
    for (const kind of timeline) {
      if (kind === 'Message') {
        const item = ir.edges[edge]
        const type = LINE[SEQUENCE_ARROW[item.arrow]]
        if (type === undefined) return hooks.unavailable(`${NAME} sequence arrow ${item.arrow}`)
        edgeEntry[edge++] = entries.length
        entries.push({ from: endpoint(ir, item.from, hooks), to: endpoint(ir, item.to, hooks), message: labelOf(ir, item.label) ?? '', type, activate: false })
      } else if (kind === 'Note') {
        const item = notes[note++]
        if (!(item.position in NOTE_PLACEMENT)) return hooks.unavailable(`${NAME} sequence note position ${item.position}`)
        const ends = (item.participants ?? []).map(index => ids[index])
        entries.push({ from: ends[0], to: ends.length > 1 ? ends[1] : ends[0], message: item.text ?? '', type: LINE.NOTE, placement: PLACEMENT[NOTE_PLACEMENT[item.position]] })
      } else if (kind === 'Open') {
        const fragment = opened[open++]
        const block = SEQUENCE_BLOCK[fragment.kind]
        if (!block) return hooks.unavailable(`${NAME} sequence fragment ${fragment.kind}`)
        stack.push({ block, alternatives: [...(fragment.alternatives ?? [])] })
        // par and par_over are both kept as a Par fragment.
        const type = fragment.kind === 'Par' ? { [SEQ_ABSENT]: { type: `${NAME} records par and par_over as the same Par fragment` } } : { type: LINE[block[0]] }
        entries.push({ from: undefined, to: undefined, message: fragment.kind === 'Rect' ? fragment.color ?? '' : fragment.label ?? '', activate: false, ...type })
      } else if (kind === 'Else') {
        const current = stack.at(-1)
        const alternative = current?.alternatives.shift()
        if (!current?.block[1] || !alternative) return hooks.unavailable(`${NAME} sequence section outside a sectioned fragment`)
        entries.push({ from: undefined, to: undefined, message: alternative.label ?? '', type: LINE[current.block[1]], activate: false })
      } else if (kind === 'Close') {
        const current = stack.pop()
        if (!current) return hooks.unavailable(`${NAME} sequence fragment close without an open`)
        entries.push({ from: undefined, to: undefined, message: '', type: LINE[current.block[2]], activate: false })
      } else return hooks.unavailable(`${NAME} sequence timeline entry ${kind}`)
    }
    return { entries, edgeEntry, timeline }
  }
  // Activations and autonumber statements are list entries whose place is not recorded.
  const placed = () => {
    if (meta.activations?.length) return hooks.unsupported(`${NAME} keeps activations as edge ranges: it records neither where an activate / deactivate line or a +/- marker was written nor deactivations by a - marker`)
    if (meta.autonumber_ranges?.length || meta.autonumber) return hooks.unsupported(`${NAME} keeps autonumber as numbering ranges over messages, not where each autonumber statement was written or whether its start and step were given`)
    return flat()
  }
  const statementIndex = (at, kind, { edgeEntry, timeline }) => {
    const position = edgeEntry[at]
    if (position === undefined) return hooks.unavailable(`${NAME} ${kind} event at a message that does not exist`)
    let messages = 0, previous
    for (const entry of timeline) { if (entry === 'Message' && messages++ === at) break; previous = entry }
    if (previous !== undefined && previous !== 'Message') return hooks.unsupported(`${NAME} anchors ${kind} statements to the next message, so whether one was written before or after the note or block line preceding that message is not recorded`)
    return position
  }
  const lifecycle = kind => () => { let list; return new Map((meta.lifecycle_events ?? []).filter(event => event.kind === kind).map(event => [ids[event.participant], statementIndex(event.at_edge, kind.toLowerCase(), list ??= placed())])) }
  const entries = () => placed().entries
  const view = sequenceView(entries, { wrap: NO_WRAP, centralConnection: `${NAME} does not keep central-connection markers on messages` }, hooks)
  return {
    ...view,
    ...commonText(ir),
    LINETYPE: LINE,
    ARROWTYPE: MERMAID_CONSTANTS.sequence.ARROWTYPE,
    PLACEMENT: MERMAID_CONSTANTS.sequence.PLACEMENT,
    getActors: actors,
    getActor: id => actors().get(id),
    getActorKeys: () => [...ids],
    getBoxes: () => boxes,
    getCreatedActors: lifecycle('Create'),
    getDestroyedActors: lifecycle('Destroy'),
  }
}

// ---------------------------------------------------------------------------------------
// State (stateDb.ts, version 2). Mermaid's getStates() and getRelations() are the root
// document's: nested states and transitions live in each composite state's doc. The IR
// keeps every state as a node, composites as graph.subgraphs (key = state id, members =
// nested nodes, concurrency regions as `__state_region_<n>` children), start and end
// pseudo-states as `__state_start` / `__state_end` (suffixed `__state_<composite>` inside
// a composite: Mermaid's `root_start` / `<composite>_start`), classDef and style text in
// style_refs and notes in state_notes. A state's description lines are joined into one
// display label, and fork and join are the same HorizontalBar shape.
const STATE_TYPE = { FilledCircle: 'start', DoubleCircle: 'end', Diamond: 'choice', Rect: 'default', Rounded: 'default' }
const STATE_FIELDS = ['stmt', 'id', 'descriptions', 'type', 'doc', 'note', 'classes', 'styles', 'textStyles']
const STATE_PSEUDO = /^__state_(start|end)(?:__state_(.+))?$/
function state(ir, hooks) {
  if (!isType(ir, 'State')) return undefined
  const groups = ir.graph?.subgraphs ?? []
  const composite = new Set(groups.filter(group => !/^__state_region_\d+$/.test(group.key)).map(group => group.key))
  const nested = new Set(groups.flatMap(group => group.members ?? []))
  // Mermaid's id for a pseudo-state is its document ('root' or the composite) + _start/_end.
  const idOf = index => {
    const id = ir.nodes[index].id, pseudo = STATE_PSEUDO.exec(id)
    return pseudo ? `${pseudo[2] ?? 'root'}_${pseudo[1]}` : id
  }
  const refs = target => (ir.style_refs ?? []).filter(ref => ref.target && typeof ref.target === 'object' && Object.keys(ref.target)[0] === target)
  // Mermaid splits style text on ',' and drops a trailing ';' (stateDb addStyleClass, handleStyleDef).
  const styleParts = text => String(text).split(',').map(part => part.replace(/([^;]*);/, '$1').trim())
  const textStyle = part => part.replace('fill', 'bgFill').replace('color', 'fill')
  const POSITION = { left: 'left of', right: 'right of' }
  const noteOf = id => {
    const note = (ir.state_notes ?? []).find(item => item.target === id)
    return note ? { position: POSITION[note.position] ?? note.position, text: note.text } : undefined
  }
  const stateRecord = index => {
    const node = ir.nodes[index], id = idOf(index)
    const type = node.shape === 'HorizontalBar' ? undefined : STATE_TYPE[node.shape] ?? node.shape
    const absent = {
      descriptions: `${NAME} joins a state's description lines into one display label`,
      ...(type === undefined ? { type: `${NAME} draws fork and join states as the same HorizontalBar shape` } : {}),
      ...(composite.has(node.id) ? { doc: `${NAME} keeps a composite state's members, not its statement document` } : {}),
    }
    return record({
      stmt: 'state', id, ...(type !== undefined ? { type } : {}),
      ...(composite.has(node.id) ? {} : { doc: undefined }),
      note: noteOf(node.id),
      classes: [...(node.classes ?? [])],
      styles: refs('Node').filter(ref => ref.target.Node === index).flatMap(ref => String(ref.style).split(',').map(part => part.replace(/;/g, '').trim())),
      // No state statement sets textStyles in Mermaid's grammar; they are always empty.
      textStyles: [],
    }, 'state', STATE_FIELDS, absent, hooks)
  }
  // A transition between two ordinary states of the same composite may have been written
  // inside it or at the root (where Mermaid records it, and both states, in the root
  // document); the IR records only membership.
  const rootDocument = () => {
    const sameComposite = ir.edges.find(edge => {
      const ends = [edge.from?.Node, edge.to?.Node]
      return ends.every(index => nested.has(index) && !STATE_PSEUDO.test(ir.nodes[index]?.id ?? '')) && groups.some(group => ends.every(index => (group.members ?? []).includes(index)))
    })
    if (sameComposite) return hooks.unsupported(`${NAME} records a transition between two states of one composite state without the document it was written in`)
    const edges = ir.edges.filter(edge => !(nested.has(edge.from?.Node) && nested.has(edge.to?.Node)))
    const order = []
    for (const index of ir.nodes.keys()) if (!nested.has(index)) order.push(index)
    for (const edge of edges) for (const end of [edge.from?.Node, edge.to?.Node]) if (typeof end === 'number' && !order.includes(end)) order.push(end)
    return { edges, order }
  }
  const states = () => new Map(rootDocument().order.map(index => [idOf(index), stateRecord(index)]))
  const classes = () => {
    const map = new Map()
    for (const ref of refs('Class')) {
      const name = ref.target.Class
      if (!map.has(name)) map.set(name, { id: name, styles: [], textStyles: [] })
      for (const part of styleParts(ref.style)) {
        if (/color/.test(part)) map.get(name).textStyles.push(textStyle(part))
        map.get(name).styles.push(part)
      }
    }
    return map
  }
  return {
    ...commonText(ir),
    getData: () => stateView(stateModel(ir, { refs, styleParts }), hooks).getData(),
    getStates: states,
    getState: id => states().get(id),
    getRelations: () => rootDocument().edges.map(edge => {
      if (typeof edge.from?.Node !== 'number' || typeof edge.to?.Node !== 'number') return hooks.unavailable(`${NAME} state transition endpoint that is not a node`)
      return record({ id1: idOf(edge.from.Node), id2: idOf(edge.to.Node), relationTitle: labelOf(ir, edge.label) ?? '' }, 'relation', ['id1', 'id2', 'relationTitle'], {}, hooks)
    }),
    getClasses: classes,
    getDirection: () => ir.direction,
    getLinks: () => hooks.unsupported(`${NAME}'s state model keeps no click links`),
  }
}

// The neutral state model of views/state.mjs, whose getData() is dataFetcher's layout data.
// A state's container is the innermost group listing it (a region inside a composite); a
// composite's is the group its own group hangs from. A concurrency region has no Mermaid id
// in the IR. A state's label is its one description, or its description lines joined with
// newlines (which are not split back), or absent for a bare state; a composite's label is
// its title, its id when none was written.
function stateModel(ir, { refs, styleParts }) {
  const groups = ir.graph?.subgraphs ?? []
  const region = group => /^__state_region_\d+$/.test(group.key)
  const innermost = index => groups.filter(group => (group.members ?? []).includes(index)).find(group => !(group.children ?? []).some(child => (groups[child]?.members ?? []).includes(index)))
  const parentKey = group => (typeof group.parent === 'number' ? groups[group.parent]?.key ?? null : groups.find(other => (other.children ?? []).includes(group.id))?.key ?? null)
  const composite = new Map(groups.filter(group => !region(group)).map(group => [group.key, group]))
  const descriptionsOf = (node, label) => {
    if (composite.has(node.id)) return label === undefined || label === node.id ? [] : [label]
    if (label === undefined) return []
    return label.includes('\n') ? stateAbsent(`${NAME} joins a state's description lines into one display label`) : [label]
  }
  const nodeRefs = refs('Node')
  const states = ir.nodes.map((node, index) => {
    const label = labelOf(ir, node.label), pseudo = STATE_PSEUDO.exec(node.id)
    const group = composite.get(node.id)
    const descriptions = descriptionsOf(node, label)
    return {
      id: node.id,
      kind: pseudo ? pseudo[1] : node.shape === 'HorizontalBar' ? stateAbsent(`${NAME} draws fork and join states as the same HorizontalBar shape`) : STATE_TYPE[node.shape] ?? node.shape,
      container: group ? parentKey(group) : innermost(index)?.key ?? null,
      composite: Boolean(group),
      label: Array.isArray(descriptions) ? descriptions[0] ?? node.id : descriptions,
      descriptions,
      classes: [...(node.classes ?? [])],
      styles: nodeRefs.filter(ref => ref.target.Node === index).flatMap(ref => String(ref.style).split(',').map(part => part.replace(/;/g, '').trim())),
      singleLabel: !Array.isArray(descriptions),
    }
  })
  for (const group of groups.filter(region)) states.push({ id: group.key, kind: 'default', container: parentKey(group), region: true, classes: [], styles: [], idAbsent: `${NAME} keeps a concurrency region without Mermaid's id for it` })
  const classDefs = new Map()
  for (const ref of refs('Class')) classDefs.set(ref.target.Class, [...(classDefs.get(ref.target.Class) ?? []), ...styleParts(ref.style)])
  return {
    name: NAME,
    states,
    transitions: ir.edges.map(edge => ({ from: ir.nodes[edge.from?.Node]?.id, to: ir.nodes[edge.to?.Node]?.id, title: labelOf(ir, edge.label) ?? '' })),
    notes: (ir.state_notes ?? []).map(note => ({ target: note.target, position: { left: 'left of', right: 'right of' }[note.position] ?? note.position, text: note.text })),
    classDefs: [...classDefs],
    direction: ir.direction,
    compositeDirection: id => composite.get(id)?.direction ?? 'TB',
    doc: `${NAME} keeps a composite state's members, not its statement document`,
  }
}

// ---------------------------------------------------------------------------------------
// C4 (c4Db.ts). Nodes carry c4_meta.element_type (Mermaid's own typeC4Shape words),
// technology and description; boundaries are graph.subgraphs (key, title, parent) whose
// clusters carry c4_boundary_type (Mermaid's ENTERPRISE / SYSTEM / CONTAINER, the written
// type, or 'system'). Sprites, tags and links are not kept for any element. A relation
// keeps its endpoints and arrow (DoubleArrow for BiRel, extras.c4_direction for
// Rel_U/D/L/R) and its technology; Rel_Back is stored as a plain arrow with its endpoints
// swapped, and a relation's description is folded into its display label.
const C4_DIRECTION = { Up: 'rel_u', Down: 'rel_d', Left: 'rel_l', Right: 'rel_r' }
function c4(ir, hooks) {
  if (!ir || typeof ir !== 'object' || !/^C4(Context|Container|Component|Dynamic|Deployment)$/.test(ir.diagram_type ?? '')) return undefined
  const groups = ir.graph?.subgraphs ?? []
  const depth = group => (group.parent == null ? 0 : 1 + depth(groups[group.parent]))
  // A node's boundary is the innermost subgraph listing it among its members.
  const parentOf = index => {
    const owners = groups.filter(group => (group.members ?? []).includes(index))
    return owners.length ? owners.reduce((a, b) => (depth(b) > depth(a) ? b : a)).key : 'global'
  }
  const none = `${NAME}'s C4 model keeps no sprites, tags or links`
  const swapped = `${NAME} stores Rel_Back as a plain relation with its endpoints swapped, so a plain arrow's written direction and macro are not recorded`
  const folded = `${NAME} folds a C4 relation's description into its display label`
  const text = value => ({ text: value ?? '' })
  const usesTechn = type => /container|component/.test(type)
  const view = {
    type: ir.diagram_type,
    // Every declared element carries c4_meta; a node without it is only a relation endpoint
    // the parser added (a boundary alias or an undeclared name), which Mermaid's addRel does
    // not record as a shape.
    shapes: () =>
      ir.nodes.flatMap((node, index) => {
        if (!node.c4_meta) return []
        const meta = node.c4_meta, type = meta.element_type
        if (typeof type !== 'string') return hooks.unavailable(`${NAME} C4 node without an element type`)
        return [{ alias: node.id, label: text(labelOf(ir, node.label)), descr: text(meta.description), ...(usesTechn(type) ? { techn: text(meta.technology) } : {}), typeC4Shape: { text: type }, parentBoundary: parentOf(index) }]
      }),
    boundaries: () => groups.map(group => ({ alias: group.key, label: text(labelOf(ir, group.title)), type: { text: ir.clusters?.[group.cluster]?.c4_boundary_type ?? hooks.unavailable(`${NAME} C4 boundary without a boundary type`) }, parentBoundary: group.parent == null ? 'global' : groups[group.parent].key })),
    rels: () =>
      ir.edges.map(edge => {
        const ends = { from: endpoint(ir, edge.from, hooks), to: endpoint(ir, edge.to, hooks) }
        const type = edge.arrow === 'DoubleArrow' ? 'birel' : C4_DIRECTION[edge.extras?.c4_direction]
        if (edge.arrow !== 'Arrow' && edge.arrow !== 'DoubleArrow') return hooks.unavailable(`${NAME} C4 relation arrow ${edge.arrow}`)
        return { ...(type ? { type, ...ends } : {}), techn: text(edge.extras?.technology) }
      }),
    absent: {
      shape: { wrap: `${NAME} keeps text wrapping as a renderer setting, not per C4 element`, sprite: none, tags: none, link: none },
      boundary: { wrap: `${NAME} keeps text wrapping as a renderer setting, not per C4 element`, tags: none, link: none },
      rel: { wrap: `${NAME} keeps text wrapping as a renderer setting, not per C4 element`, sprite: none, tags: none, link: none, type: swapped, from: swapped, to: swapped, label: folded, descr: folded },
    },
  }
  return { ...c4View(view, hooks), getTitle: () => ir.meta?.title ?? '' }
}

// ---------------------------------------------------------------------------------------
// Pie (pieDb.ts): sections is a Map label -> value in which the first slice of a label wins.
function pie(ir) {
  if (!isType(ir, 'Pie')) return undefined
  const meta = ir.pie_meta ?? {}
  return {
    ...commonText(ir),
    getDiagramTitle: () => meta.title ?? ir.meta?.title ?? '',
    getSections: () => {
      const sections = new Map()
      for (const slice of meta.slices ?? []) if (!sections.has(slice.label)) sections.set(slice.label, slice.value)
      return sections
    },
    getShowData: () => meta.show_data === true,
  }
}

// ---------------------------------------------------------------------------------------
// Git graph (gitGraphAst.ts). Commits are nodes in commit order (an unnamed commit is
// named commit_<n>), each on the lane git_graph_meta.commit_lanes gives it, a lane being
// an index into git_graph_meta.branches (listed in lane order, not declaration order).
// A parent link is a Line edge; a merge adds a DottedArrow edge from the merged branch's
// head. HIGHLIGHT and REVERSE are classes. A commit's id, message and tags are folded into
// one display label ("id msg [tags]"), present only when a message or tag was written; a
// cherry-pick keeps only the label "cherry-pick <id>" (no source parent, no type, its tags
// dropped). Checkouts are not recorded, so neither is the current branch or HEAD, nor a
// branch's head before its first commit.
function gitgraph(ir, hooks) {
  if (!isType(ir, 'GitGraph')) return undefined
  const TYPE = MERMAID_CONSTANTS.gitgraph.commitType
  const meta = ir.git_graph_meta ?? {}
  const branches = meta.branches ?? []
  const laneOf = index => meta.commit_lanes?.[index] ?? meta.commit_lanes?.[String(index)]
  const folded = `${NAME} folds a commit's id, message and tags into one display label`
  const pick = `${NAME} keeps a cherry-pick only as a display label, so a labelled commit without a type class may be a cherry-pick (type CHERRY_PICK, a second parent)`
  const commit = index => {
    const node = ir.nodes[index]
    const into = ir.edges.filter(edge => edge.to?.Node === index)
    const merged = into.filter(edge => edge.arrow === 'DottedArrow'), line = into.filter(edge => edge.arrow !== 'DottedArrow')
    const classType = (node.classes ?? []).includes('git-commit-highlight') ? TYPE.HIGHLIGHT : (node.classes ?? []).includes('git-commit-reverse') ? TYPE.REVERSE : undefined
    const labelled = labelOf(ir, node.label) !== undefined
    const branch = branches[laneOf(index)]
    const fields = { id: node.id, seq: index, ...(branch !== undefined ? { branch } : {}) }
    const absent = { customId: `${NAME} names an unnamed commit commit_<n>, which a written id can equal`, ...(labelled ? { message: folded, tags: folded } : {}) }
    const parents = [...line, ...merged].map(edge => endpoint(ir, edge.from, hooks))
    if (merged.length) {
      Object.assign(fields, { type: TYPE.MERGE, parents, ...(labelled ? {} : { tags: [] }) })
      Object.assign(absent, { message: `Mermaid words a merge commit's message from its branches; ${NAME} keeps no message for it`, customType: `${NAME} does not keep a merge's type: override` })
    } else if (classType !== undefined || !labelled) Object.assign(fields, { type: classType ?? TYPE.NORMAL, parents, ...(labelled ? {} : { message: '', tags: [] }) })
    else Object.assign(absent, { type: pick, parents: pick })
    return record(fields, 'commit', ['id', 'message', 'seq', 'type', 'tags', 'parents', 'branch', 'customType', 'customId'], absent, hooks)
  }
  const commits = () => new Map(ir.nodes.map((node, index) => [node.id, commit(index)]))
  // A branch's head is its last commit; with no commits of its own it is the head of the
  // branch it was created from at that time, which is recorded only when no commit exists.
  const headOf = name => {
    const lane = branches.indexOf(name)
    const own = ir.nodes.map((node, index) => [node.id, laneOf(index)]).filter(([, at]) => at === lane)
    if (own.length) return own.at(-1)[0]
    if (!ir.nodes.length) return null
    return hooks.unsupported(`${NAME} does not record where a branch without commits was created`)
  }
  const unordered = () => hooks.unsupported(`${NAME} lists branches in lane order, not in the order they were declared`)
  class Branches extends Map {
    get(name) { return this.has(name) ? headOf(name) : undefined }
    keys() { return branches.length > 1 ? unordered() : super.keys() }
    values() { return branches.length > 1 ? unordered() : [...super.keys()].map(headOf)[Symbol.iterator]() }
    entries() { return branches.length > 1 ? unordered() : [...super.keys()].map(name => [name, headOf(name)])[Symbol.iterator]() }
    forEach(callback, self) { if (branches.length > 1) return unordered(); for (const name of super.keys()) callback.call(self, headOf(name), name, this) }
    [Symbol.iterator]() { return this.entries() }
  }
  const noCheckout = `${NAME} does not record checkouts, so the current branch and HEAD are not kept`
  return {
    ...commonText(ir),
    commitType: TYPE,
    getCommits: commits,
    getCommitsArray: () => [...commits().values()],
    getBranches: () => new Branches(branches.map(name => [name, undefined])),
    getBranchesAsObjArray: () => branches.map(name => ({ name })),
    getCurrentBranch: () => hooks.unsupported(noCheckout),
    getHead: () => hooks.unsupported(noCheckout),
    getDirection: () => ir.direction,
  }
}

// ---------------------------------------------------------------------------------------
// Kanban (kanbanDb.ts). Columns are graph.subgraphs keyed `kanban-col-<section id>` with
// a title label; cards are nodes (an id written bare is keyed `kanban-card-<id>`) listed
// as column members. A card keeps no ticket, and its priority and assignee only as
// lower-cased CSS class names (`kanban-priority-very high`, `kanban-assigned-john-doe`);
// `::icon(...)` and `:::class` decorations are not parsed, and indentation is not kept.
const KANBAN_RENDERER = {
  look: "Mermaid's kanban look is its renderer's configuration",
  rx: "a kanban item's corner radius is Mermaid's renderer setting",
  ry: "a kanban item's corner radius is Mermaid's renderer setting",
  cssStyles: "a kanban item's text alignment style is Mermaid's renderer setting",
  width: "a kanban section's width is Mermaid's renderer setting",
  padding: "a kanban section's padding is Mermaid's renderer setting",
}
function kanban(ir, hooks) {
  if (!isType(ir, 'Kanban')) return undefined
  const columns = ir.graph?.subgraphs ?? []
  const unprefix = (value, prefix) => (typeof value === 'string' && value.startsWith(prefix) ? value.slice(prefix.length) : value)
  const absent = {
    ...KANBAN_RENDERER,
    level: `${NAME} keeps kanban columns and cards, not their indentation level`,
    ticket: `${NAME} does not keep a kanban card's ticket`,
    priority: `${NAME} keeps a kanban card's priority only as a lower-cased CSS class name`,
    assigned: `${NAME} keeps a kanban card's assignee only as a lower-cased, hyphenated CSS class name`,
    icon: `${NAME} does not parse kanban ::icon() decorations`,
    cssClasses: `${NAME} does not parse kanban ::: class decorations`,
  }
  const section = column => ({ id: unprefix(column.key, 'kanban-col-'), label: labelOf(ir, column.title) ?? '', isGroup: false })
  const card = (index, parent) => {
    const node = ir.nodes[index]
    return { id: unprefix(node.id, 'kanban-card-'), parentId: parent, label: labelOf(ir, node.label) ?? node.id, isGroup: false }
  }
  const FIELDS = ['id', 'label', 'labelType', 'isGroup', 'shape', 'level', 'look', 'parentId', 'ticket', 'priority', 'assigned', 'icon', 'cssClasses']
  return {
    ...commonText(ir),
    getSections: () => columns.map(column => record(section(column), 'kanban section', ['id', 'label', 'level', 'width', 'padding', 'isGroup', 'icon', 'cssClasses', 'ticket', 'priority', 'assigned'], absent, hooks)),
    getData: () => ({
      nodes: columns.flatMap(column => {
        const head = section(column)
        return [
          record({ ...head, parentId: undefined, labelType: 'markdown', isGroup: true, shape: 'kanbanSection' }, 'kanban node', FIELDS, absent, hooks),
          ...(column.members ?? []).map(index => record({ ...card(index, head.id), labelType: 'markdown', shape: 'kanbanItem' }, 'kanban node', FIELDS, absent, hooks)),
        ]
      }),
      edges: [],
      other: {},
      get config() { return hooks.unsupported("Mermaid's kanban getData config is its renderer's configuration") },
    }),
  }
}

// ---------------------------------------------------------------------------------------
// Mindmap (mindmapDb.ts). Nodes in source order joined by parent -> child edges, the root
// classed mindmap-root; a node's label is absent when its text is its id. The node type
// is its shape (a borderless node is classed mindmap-no-border); its icon is
// interaction.icon and its ::: classes sit among Frankenmermaid's own mindmap-* classes.
// Indentation is not kept.
const MINDMAP_TYPE = { Rect: 2, Rounded: 1, Circle: 3, Cloud: 4, Bang: 5, Hexagon: 6 }
function mindmap(ir, hooks) {
  if (!isType(ir, 'Mindmap')) return undefined
  const root = ir.nodes.findIndex(node => (node.classes ?? []).includes('mindmap-root'))
  const children = index => ir.edges.filter(edge => edge.from?.Node === index).map(edge => edge.to.Node)
  const absent = {
    level: `${NAME} keeps mindmap depth, not indentation level`,
    width: "a mindmap node's width is Mermaid's renderer setting",
    padding: "a mindmap node's padding is Mermaid's renderer setting",
  }
  const node = index => {
    const item = ir.nodes[index]
    const own = (item.classes ?? []).filter(name => !name.startsWith('mindmap-'))
    const type = (item.classes ?? []).includes('mindmap-no-border') ? 0 : MINDMAP_TYPE[item.shape]
    if (type === undefined) return hooks.unavailable(`${NAME} mindmap shape ${item.shape}`)
    return record({ id: index, nodeId: item.id, descr: labelOf(ir, item.label) ?? item.id, type, isRoot: index === root, children: children(index).map(node), icon: item.interaction?.icon ?? undefined, class: own.length ? own.join(' ') : undefined }, 'mindmap node', ['id', 'nodeId', 'level', 'descr', 'type', 'children', 'width', 'padding', 'isRoot', 'icon', 'class'], absent, hooks)
  }
  return {
    ...commonText(ir),
    nodeType: { DEFAULT: 0, NO_BORDER: 0, ROUNDED_RECT: 1, RECT: 2, CIRCLE: 3, CLOUD: 4, BANG: 5, HEXAGON: 6 },
    getMindmap: () => (root < 0 ? (ir.nodes.length ? hooks.unavailable(`${NAME} mindmap without a root`) : null) : node(root)),
  }
}

// ---------------------------------------------------------------------------------------
// Gantt (ganttDb.js). gantt_meta keeps the date format, excludes ('Weekends' or a list of
// dates, normalised to ISO) and each task's start/end specification; Mermaid's task
// records carry dates its database computes, which are not mapped here.
const WEEKDAY = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
function gantt(ir, hooks) {
  if (!isType(ir, 'Gantt')) return undefined
  const meta = ir.gantt_meta ?? {}
  return {
    ...commonText(ir),
    // Captured from the pinned parser: each task binds its IR node, section,
    // written task_id and four independent flags. Absolute/AfterTask and
    // DurationDays are specifications, not the renderer's computed Dates.
    getTasks: () => (meta.tasks ?? []).map(item => record({
      id: item.task_id, task: labelOf(ir, ir.nodes[item.node]?.label),
      section: meta.sections?.[item.section_idx]?.name,
      active: item.flags.active, done: item.flags.done, crit: item.flags.crit, milestone: item.flags.milestone,
    }, 'gantt task', ['id', 'task', 'section', 'startTime', 'endTime', 'active', 'done', 'crit', 'milestone'], {
      startTime: `${NAME} keeps a task's start specification, not its computed Date`,
      endTime: `${NAME} keeps a task's end specification, not its computed Date`,
    }, hooks)),
    getDiagramTitle: () => meta.title ?? ir.meta?.title ?? '',
    getDateFormat: () => meta.date_format ?? '',
    // gantt_meta.weekday_start is the weekday statement's day as an index from Sunday (0);
    // Mermaid keeps the word, 'sunday' when none was written (ganttDb.setWeekday). A gantt
    // without tasks has no gantt_meta at all, so its weekday statement is not kept.
    getWeekday: () => {
      if (ir.gantt_meta == null) return hooks.unsupported(`${NAME} keeps no gantt_meta for a gantt without tasks, so its weekday statement is not kept`)
      return meta.weekday_start == null ? 'sunday' : WEEKDAY[meta.weekday_start] ?? hooks.unavailable(`${NAME} gantt weekday_start ${meta.weekday_start}`)
    },
    // Mermaid keeps each excludes token lower-cased; a date keeps the IR's ISO spelling.
    getExcludes: () => (meta.excludes ?? []).flatMap(item => (typeof item === 'string' ? [item.toLowerCase()] : Array.isArray(item?.Dates) ? item.Dates : hooks.unavailable(`${NAME} gantt excludes entry ${JSON.stringify(item)}`))),
  }
}

// ---------------------------------------------------------------------------------------
// User journey (journeyDb.js). Steps are nodes in order, members of a section subgraph
// (title label); the score is the class journey-score-<n> and the people journey_meta.actors.
function journey(ir, hooks) {
  if (!isType(ir, 'Journey')) return undefined
  const sections = ir.graph?.subgraphs ?? []
  const tasks = () => ir.nodes.map((node, index) => {
    const section = sections.find(group => (group.members ?? []).includes(index))
    const score = (node.classes ?? []).map(name => /^journey-score-(-?\d+(?:\.\d+)?)$/.exec(name)).find(Boolean)
    const name = section ? labelOf(ir, section.title) : undefined
    return record({ section: name, type: name, people: [...(node.journey_meta?.actors ?? [])], task: labelOf(ir, node.label) ?? node.id, ...(score ? { score: Number(score[1]) } : {}) }, 'journey task', ['section', 'type', 'people', 'task', 'score'], {}, hooks)
  })
  return { ...commonText(ir), getTasks: tasks, getSections: () => sections.map(group => labelOf(ir, group.title)) }
}

// ---------------------------------------------------------------------------------------
// Ishikawa (ishikawaDb.ts): the head is classed ishikawa-head; each cause points (child ->
// parent edge) at the node it hangs from.
function ishikawa(ir, hooks) {
  if (!isType(ir, 'Ishikawa')) return undefined
  const head = ir.nodes.findIndex(node => (node.classes ?? []).includes('ishikawa-head'))
  const node = index => record({ text: labelOf(ir, ir.nodes[index].label) ?? ir.nodes[index].id, children: ir.edges.filter(edge => edge.to?.Node === index).map(edge => node(edge.from.Node)) }, 'ishikawa node', ['text', 'children'], {}, hooks)
  return { ...commonText(ir), getRoot: () => (head < 0 ? (ir.nodes.length ? hooks.unavailable(`${NAME} ishikawa diagram without a head`) : undefined) : node(head)) }
}

// ---------------------------------------------------------------------------------------
// Requirement (requirementDb.ts). Each requirement or element is a node with
// requirement_meta (requirement_type, req_id, text, risk, verify_method as written;
// element_type, doc_ref); relationships are edges whose type is kept only in the display
// label "<<type>>"; classDef and style text sit in style_refs.
const REQUIREMENT_TYPE = { requirement: 'Requirement', functionalrequirement: 'Functional Requirement', interfacerequirement: 'Interface Requirement', performancerequirement: 'Performance Requirement', physicalrequirement: 'Physical Requirement', designconstraint: 'Design Constraint' }
const RISK = { low: 'Low', medium: 'Medium', high: 'High' }
const VERIFY = { analysis: 'Analysis', demonstration: 'Demonstration', inspection: 'Inspection', test: 'Test' }
function requirement(ir, hooks) {
  if (!isType(ir, 'Requirement')) return undefined
  // Mermaid's words for each case-insensitive keyword; an unknown word keeps its spelling.
  const word = (table, value) => (typeof value === 'string' ? table[value.toLowerCase()] ?? value : '')
  const refs = target => (ir.style_refs ?? []).filter(ref => ref.target && typeof ref.target === 'object' && Object.keys(ref.target)[0] === target)
  const merged = `${NAME} keeps style and class statements apart, not the cssStyles list Mermaid merges from them in statement order`
  const styled = (node, index) => (node.classes ?? []).length || refs('Node').some(ref => ref.target.Node === index)
  const common = (node, index) => ({ name: node.id, classes: ['default', ...(node.classes ?? [])], ...(styled(node, index) ? {} : { cssStyles: [] }) })
  const of = kind => new Map(ir.nodes.flatMap((node, index) => {
    const meta = node.requirement_meta
    if (!meta || (meta.requirement_type === 'element') !== (kind === 'element')) return []
    const fields = kind === 'element'
      ? { ...common(node, index), type: meta.element_type ?? '', docRef: meta.doc_ref ?? '' }
      : { ...common(node, index), type: word(REQUIREMENT_TYPE, meta.requirement_type), requirementId: meta.req_id ?? '', text: meta.text ?? '', risk: word(RISK, meta.risk), verifyMethod: word(VERIFY, meta.verify_method) }
    return [[node.id, record(fields, kind, ['name', 'type', 'requirementId', 'text', 'risk', 'verifyMethod', 'docRef', 'cssStyles', 'classes'], { cssStyles: merged }, hooks)]]
  }))
  const classes = () => {
    const map = new Map()
    for (const ref of refs('Class')) {
      const name = ref.target.Class
      if (!map.has(name)) map.set(name, { id: name, styles: [], textStyles: [] })
      for (const part of String(ref.style).split(',').map(item => item.trim())) {
        if (/color/.test(part)) map.get(name).textStyles.push(part.replace('fill', 'bgFill'))
        map.get(name).styles.push(part)
      }
    }
    return map
  }
  return {
    ...commonText(ir),
    getRequirements: () => of('requirement'),
    getElements: () => of('element'),
    getRelationships: () => ir.edges.map(edge => record({ src: endpoint(ir, edge.from, hooks), dst: endpoint(ir, edge.to, hooks) }, 'relationship', ['type', 'src', 'dst'], { type: `${NAME} keeps a requirement relationship's type only in its display label` }, hooks)),
    getClasses: classes,
    getDirection: () => ir.direction,
  }
}

// ---------------------------------------------------------------------------------------
// Venn (vennDB.ts). venn_meta keeps sets (id, size, label node) and unions (sets, size,
// label node when labelled) in two lists; Mermaid's subset list interleaves them in
// source order, which node order records only for labelled unions. Style statements are
// merged into each set's resolved style with palette defaults.
function venn(ir, hooks) {
  if (!isType(ir, 'Venn')) return undefined
  const meta = ir.venn_meta ?? {}
  const subsets = () => {
    if ((meta.unions ?? []).some(union => typeof union.label_node !== 'number')) return hooks.unsupported(`${NAME} keeps sets and unlabelled unions in separate lists, so their written order is not recorded`)
    // A set written without a label is labelled with its id, like one labelled with its id.
    const sets = (meta.sets ?? []).map(set => {
      const label = labelOf(ir, ir.nodes[set.node]?.label)
      return { at: set.node, fields: { sets: [set.id], size: set.size, ...(label !== set.id ? { label } : {}) }, absent: label === set.id ? { label: `${NAME} labels a set written without a label with its id` } : {} }
    })
    const unions = (meta.unions ?? []).map(union => ({ at: union.label_node, fields: { sets: [...union.sets].sort(), size: union.size, label: labelOf(ir, ir.nodes[union.label_node]?.label) }, absent: {} }))
    return [...sets, ...unions].sort((a, b) => a.at - b.at).map(item => record(item.fields, 'venn subset', ['sets', 'size', 'label'], item.absent, hooks))
  }
  return {
    ...commonText(ir),
    getSubsetData: subsets,
    // A text written without a label is labelled with its id, like one labelled with its id.
    getTextData: () => (meta.texts ?? []).map(item => {
      const label = labelOf(ir, ir.nodes[item.node]?.label)
      return record({ sets: [...(item.sets ?? [])].sort(), id: item.id, ...(label !== item.id ? { label } : {}) }, 'venn text', ['sets', 'id', 'label'], label === item.id ? { label: `${NAME} labels a venn text written without a label with its id` } : {}, hooks)
    }),
    getStyleData: () => hooks.unsupported(`${NAME} merges venn style statements into each set's resolved style with palette defaults`),
  }
}

// ---------------------------------------------------------------------------------------
// Wardley (wardleyDb.ts). The IR is a laid-out drawing: wardley_meta keeps pixel points,
// marks (Dot / Label / Caption) placed at them, stage bands and a frame, not Mermaid's
// model of components, anchors, links, pipelines and axes.
function wardley(ir, hooks) {
  if (!isType(ir, 'Wardley')) return undefined
  return { ...commonText(ir), getWardleyData: () => hooks.unsupported(`${NAME}'s Wardley IR keeps a laid-out drawing (points, marks and stage bands), not Mermaid's component, link and axis model`) }
}

// ---------------------------------------------------------------------------------------
// Packet, block and event modeling: only the title and accessibility text are reviewed;
// their element getters (getPacket's rows, getBlocks, getState) are not mapped and stay
// Trident gaps.
const titled = type => ir => (isType(ir, type) ? commonText(ir) : undefined)

// ---------------------------------------------------------------------------------------
// Families Frankenmermaid does not recognise. Their sources come back as another family's
// IR (an agentflow header becomes a Flowchart node, a usecase `actor` line a Sequence
// participant); reading that IR as the requested family would credit a fallback guess, so
// every model observation is the candidate's unsupported operation.
const OWN_TYPE = { agentflow: /^Agent ?Flow/i, usecase: /^Use ?Case/i, railroad: /^Railroad/i, cynefin: /^Cynefin/i }
const misread = family => (ir, hooks) => {
  if (!ir || typeof ir !== 'object' || typeof ir.diagram_type !== 'string' || OWN_TYPE[family].test(ir.diagram_type)) return undefined
  const reason = `${NAME} does not recognise ${family} diagrams; its parser read the source as a ${ir.diagram_type} diagram`
  return { whole: new Proxy({}, { get: (_target, key) => (typeof key === 'string' && /^get[A-Z]/.test(key) ? () => hooks.unsupported(reason) : undefined) }) }
}
const misreadAst = family => (ir, hooks) => {
  if (!ir || typeof ir !== 'object' || typeof ir.diagram_type !== 'string' || OWN_TYPE[family].test(ir.diagram_type)) return undefined
  return hooks.unsupported(`${NAME} does not recognise ${family} diagrams; its parser read the source as a ${ir.diagram_type} diagram`)
}

// ---------------------------------------------------------------------------------------
// Langium ASTs (packages/parser). An AST node reads as Mermaid's: `$type` plus the
// grammar's properties, undefined where the grammar's optional property was not written.
const astRecord = (type, fields, expected, absent, hooks) => record({ $type: type, ...fields }, type, expected, absent, hooks)

// Radar: radar_meta keeps axes (id, label when written) and curves (id, label, values).
// Only a curve of plain numbers keeps its values (a curve of `axis value` entries keeps
// none), so every kept value is an Entry without an axis reference. Graticule and
// showLegend are filled with their defaults ('circle', true), so which options were
// written - and in what order - is not recorded.
function radarAst(ir, hooks) {
  if (!isType(ir, 'Radar')) return undefined
  const meta = ir.radar_meta ?? {}
  return astRecord('Radar', {
    title: ir.meta?.title ?? undefined,
    accTitle: ir.meta?.acc_title ?? undefined,
    accDescr: ir.meta?.acc_descr ?? undefined,
    axes: (meta.axes ?? []).map(axis => astRecord('Axis', { name: axis.id, label: axis.label ?? undefined }, ['name', 'label'], {}, hooks)),
    curves: (meta.curves ?? []).map(curve => astRecord('Curve', { name: curve.id, label: curve.label ?? undefined, entries: (curve.values ?? []).map(value => astRecord('Entry', { value, axis: undefined }, ['axis', 'value'], {}, hooks)) }, ['name', 'label', 'entries'], {}, hooks)),
  }, ['title', 'accTitle', 'accDescr', 'axes', 'curves', 'options'], { options: `${NAME} fills radar graticule and showLegend defaults into its model, so which options were written, and their order, is not recorded` }, hooks)
}

// Info: the AST has no properties the tests read beyond its type.
const infoAst = (ir, hooks) => (isType(ir, 'Info') ? astRecord('Info', {}, [], {}, hooks) : undefined)
// Packet: the AST's blocks are not claimed (a `+<bits>` block is read as a start bit).
const packetAst = (ir, hooks) => (isType(ir, 'PacketBeta') ? astRecord('Packet', { title: ir.meta?.title ?? undefined, accTitle: ir.meta?.acc_title ?? undefined, accDescr: ir.meta?.acc_descr ?? undefined }, ['title', 'accTitle', 'accDescr', 'blocks'], {}, hooks) : undefined)
// GitGraph: the statement list (commits, branches, checkouts, merges, cherry-picks in
// source order) is not kept: checkouts and branch statements leave no record.
const gitgraphAst = (ir, hooks) =>
  isType(ir, 'GitGraph') ? astRecord('GitGraph', { title: ir.meta?.title ?? undefined, accTitle: ir.meta?.acc_title ?? undefined, accDescr: ir.meta?.acc_descr ?? undefined }, ['title', 'accTitle', 'accDescr', 'statements'], { statements: `${NAME} keeps commits and lanes, not the git graph's statements (checkouts and branch statements leave no record)` }, hooks) : undefined

// Architecture: services and junctions are nodes classed architecture-service /
// architecture-junction (a service's icon in interaction.icon); groups are
// graph.subgraphs (key, title, parent) and keep no icon. A service written without a
// title is labelled with its id, the same as one titled with its own id.
function architectureModel(ir, hooks) {
  const groups = ir.graph?.subgraphs ?? []
  const depth = group => (group.parent == null ? 0 : 1 + depth(groups[group.parent]))
  const inOf = index => {
    const owners = groups.filter(group => (group.members ?? []).includes(index))
    return owners.length ? owners.reduce((a, b) => (depth(b) > depth(a) ? b : a)).key : undefined
  }
  const kind = (node, name) => (node.classes ?? []).includes('architecture-' + name)
  const sameAsId = `${NAME} labels a service written without a title with its id`
  return {
    services: () => ir.nodes.flatMap((node, index) => {
      if (!kind(node, 'service')) return []
      const title = labelOf(ir, node.label)
      return [{ fields: { id: node.id, ...(title !== node.id ? { title } : {}), icon: node.interaction?.icon ?? undefined, in: inOf(index) }, absent: title === node.id ? { title: sameAsId } : {} }]
    }),
    junctions: () => ir.nodes.flatMap((node, index) => (kind(node, 'junction') ? [{ id: node.id, in: inOf(index) }] : [])),
    groups: () => groups.map(group => ({ id: group.key, title: labelOf(ir, group.title), in: group.parent == null ? undefined : groups[group.parent].key })),
    noIcon: `${NAME}'s architecture groups keep no icon`,
  }
}
function architectureAst(ir, hooks) {
  if (!isType(ir, 'ArchitectureBeta')) return undefined
  const model = architectureModel(ir, hooks)
  return astRecord('Architecture', {
    title: ir.meta?.title ?? undefined,
    accTitle: ir.meta?.acc_title ?? undefined,
    accDescr: ir.meta?.acc_descr ?? undefined,
    services: model.services().map(item => astRecord('Service', item.fields, ['id', 'title', 'icon', 'iconText', 'in'], item.absent, hooks)),
    junctions: model.junctions().map(item => astRecord('Junction', item, ['id', 'in'], {}, hooks)),
    groups: model.groups().map(item => astRecord('Group', item, ['id', 'title', 'icon', 'in'], { icon: model.noIcon }, hooks)),
  }, ['title', 'accTitle', 'accDescr', 'services', 'groups', 'junctions', 'edges'], {}, hooks)
}
function architecture(ir, hooks) {
  if (!isType(ir, 'ArchitectureBeta')) return undefined
  const model = architectureModel(ir, hooks)
  return {
    ...commonText(ir),
    getServices: () => model.services().map(item => record({ type: 'service', ...item.fields }, 'service', ['id', 'type', 'title', 'icon', 'iconText', 'in'], item.absent, hooks)),
    getJunctions: () => model.junctions().map(item => record({ type: 'junction', ...item }, 'junction', ['id', 'type', 'in'], {}, hooks)),
    getGroups: () => model.groups().map(item => record(item, 'group', ['id', 'title', 'icon', 'in'], { icon: model.noIcon }, hooks)),
  }
}

// Treemap: treemap_meta keeps the tree (label, value, classes, children, roots) in source
// order. Its rows are the pre-order walk unless classDef rows are interleaved, whose
// position is not kept; a row's indentation is not kept.
function treemapAst(ir, hooks) {
  if (!isType(ir, 'Treemap')) return undefined
  const meta = ir.treemap_meta ?? {}, nodes = meta.nodes ?? []
  const rows = []
  const walk = index => {
    // The grammar's Leaf is a row with a value; a Section is a row without one.
    const node = nodes[index], leaf = node.value !== undefined
    const item = astRecord(leaf ? 'Leaf' : 'Section', { name: node.label, ...(node.value !== undefined ? { value: node.value } : {}), classSelector: node.classes?.[0] ?? undefined }, ['name', 'value', 'classSelector'], {}, hooks)
    if ((node.classes ?? []).length > 1) return hooks.unavailable(`${NAME} treemap node with several classes`)
    rows.push(astRecord('TreemapRow', { item }, ['item', 'indent'], { indent: `${NAME} keeps a treemap row's depth, not its indentation` }, hooks))
    for (const child of node.children ?? []) walk(child)
  }
  for (const root of meta.roots ?? []) walk(root)
  const classDefs = (ir.style_refs ?? []).some(ref => ref.target && typeof ref.target === 'object' && 'Class' in ref.target)
  return astRecord('Treemap', { ...(classDefs ? {} : { TreemapRows: rows }), title: ir.meta?.title ?? undefined, accTitle: ir.meta?.acc_title ?? undefined, accDescr: ir.meta?.acc_descr ?? undefined }, ['TreemapRows', 'title', 'accTitle', 'accDescr'], classDefs ? { TreemapRows: `${NAME} does not keep where classDef rows stand among a treemap's rows` } : {}, hooks)
}

// TreeView: the tree is nodes (a synthetic root labelled '/', then entry_<n> in source
// order) joined by parent -> child edges. A node's annotations (:::class, icon(...),
// a description) and a trailing directory slash are not parsed out of its name, and
// indentation is not kept.
function treeModel(ir) {
  const children = index => ir.edges.filter(edge => edge.from?.Node === index).map(edge => edge.to.Node)
  const root = ir.nodes.findIndex(node => (node.classes ?? []).includes('tree-view-root'))
  return { root, children }
}
const TREE_ABSENT = {
  classAnnotation: `${NAME} does not parse tree node annotations; they stay part of the name`,
  iconAnnotation: `${NAME} does not parse tree node annotations; they stay part of the name`,
  descAnnotation: `${NAME} does not parse tree node annotations; they stay part of the name`,
  indent: `${NAME} keeps a tree node's depth, not its indentation`,
}
function treeviewAst(ir, hooks) {
  if (!isType(ir, 'TreeView')) return undefined
  const { root, children } = treeModel(ir)
  if (root < 0) return hooks.unavailable(`${NAME} tree view without a root`)
  const nodes = []
  const walk = index => { for (const child of children(index)) { nodes.push(astRecord('TreeNode', { name: labelOf(ir, ir.nodes[child].label) }, ['name', 'indent', 'classAnnotation', 'iconAnnotation', 'descAnnotation'], TREE_ABSENT, hooks)); walk(child) } }
  walk(root)
  return astRecord('TreeView', { nodes, title: ir.meta?.title ?? undefined, accTitle: ir.meta?.acc_title ?? undefined, accDescr: ir.meta?.acc_descr ?? undefined }, ['nodes', 'title', 'accTitle', 'accDescr'], {}, hooks)
}
function treeview(ir, hooks) {
  if (!isType(ir, 'TreeView')) return undefined
  const { root, children } = treeModel(ir)
  const absent = {
    level: `${NAME} keeps a tree node's depth, not its indentation level`,
    nodeType: `${NAME} does not tell files from directories; a trailing slash stays part of the name`,
    icon: TREE_ABSENT.iconAnnotation, cssClass: TREE_ABSENT.classAnnotation, description: TREE_ABSENT.descAnnotation,
  }
  // Nodes are numbered in source order after the root (0), as Mermaid numbers them.
  const node = index => record({ ...(root === 0 ? { id: index } : {}), name: labelOf(ir, ir.nodes[index].label), children: children(index).map(node) }, 'tree node', ['id', 'level', 'name', 'nodeType', 'icon', 'cssClass', 'description', 'children'], absent, hooks)
  return {
    ...commonText(ir),
    // Mermaid's synthetic root is level -1, a directory named '/'.
    getRoot: () => (root < 0 ? hooks.unavailable(`${NAME} tree view without a root`) : record({ id: 0, level: -1, name: labelOf(ir, ir.nodes[root].label), nodeType: 'directory', children: children(root).map(node) }, 'tree root', ['id', 'level', 'name', 'nodeType', 'children'], {}, hooks)),
    // Mermaid counts from 1 (its root) and numbers each node in source order.
    getCount: () => 1 + ir.nodes.length - (root < 0 ? 0 : 1),
  }
}

export default {
  schema: {
    sequence: { [PROJECT]: sequence },
    state: { [PROJECT]: state },
    c4: { [PROJECT]: c4 },
    pie: { [PROJECT]: pie },
    gitgraph: { [PROJECT]: gitgraph },
    architecture: { [PROJECT]: architecture },
    treeview: { [PROJECT]: treeview },
    kanban: { [PROJECT]: kanban },
    mindmap: { [PROJECT]: mindmap },
    gantt: { [PROJECT]: gantt },
    journey: { [PROJECT]: journey },
    ishikawa: { [PROJECT]: ishikawa },
    requirement: { [PROJECT]: requirement },
    venn: { [PROJECT]: venn },
    wardley: { [PROJECT]: wardley },
    packet: { [PROJECT]: titled('PacketBeta') },
    block: { [PROJECT]: titled('BlockBeta') },
    eventmodeling: { [PROJECT]: titled('EventModeling') },
    agentflow: { [PROJECT]: misread('agentflow') },
    usecase: { [PROJECT]: misread('usecase') },
    railroad: { [PROJECT]: misread('railroad') },
    cynefin: { [PROJECT]: misread('cynefin') },
  },
  ast: {
    Radar: { [PROJECT]: radarAst },
    Info: { [PROJECT]: infoAst },
    Packet: { [PROJECT]: packetAst },
    GitGraph: { [PROJECT]: gitgraphAst },
    Architecture: { [PROJECT]: architectureAst },
    Treemap: { [PROJECT]: treemapAst },
    TreeView: { [PROJECT]: treeviewAst },
    Railroad: { [PROJECT]: misreadAst('railroad') },
    Usecase: { [PROJECT]: misreadAst('usecase') },
    Cynefin: { [PROJECT]: misreadAst('cynefin') },
  },
}
