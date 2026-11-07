// Reviewed sequence-diagram views (module contract: views/index.mjs; doctrine:
// ../schema-views.mjs). Each view below was written against the project's own parser
// source at its pinned version and checked on parser-bridge output
// (scripts/fidelity-probe.ts).
//
// Mermaid's getMessages() is one flat list in source order (sequenceDb.ts addSignal,
// addNote, apply): a message is { from, to, message, wrap, type, activate,
// centralConnection }; `A->>+B` adds an ACTIVE_START for B right after it and `A->>-B` an
// ACTIVE_END for A; `()` on an end sets centralConnection (59 to, 60 from, 61 both) and
// adds a CENTRAL_CONNECTION (59, from = the receiver) and/or a
// CENTRAL_CONNECTION_REVERSE (60, from = the sender) entry; a note is { from, to,
// message, wrap, type: NOTE, placement }; activations, block starts, sections and ends
// are { from, to, message, wrap, type, activate: false, centralConnection: 0 } with the
// block label (a rect's colour) as message; create and destroy add no entry. Every entry's
// id is its list index. Wrap on anything a model keeps no wrap flag for is Mermaid's
// host configuration (autoWrap), so it is absent there.
//
// Many models keep only part of this. Three cases recur:
//   - a concept the model does not carry is absent (reading it is unsupported);
//   - a value two written forms share (Grok's one Arrow head for ->>, -> and -)) is
//     absent for exactly the records that carry it;
//   - a model that keeps positions as indexes (mermaid-rs-renderer, beautiful-mermaid,
//     zombie-mermaid) is interleaved back into one list, and where its indexes cannot
//     say which of two statements came first the whole list is unsupported.
// Statements a parser drops without trace cannot be seen by a view; a list that lacks
// them is that candidate's own result.
import * as views from '../schema-views.mjs'

const MESSAGE_FIELDS = ['id', 'from', 'to', 'message', 'wrap', 'type']
const NOTE_FIELDS = ['actor', 'placement', 'message', 'wrap']
const ACTOR_FIELDS = ['name', 'description', 'type', 'wrap', 'links', 'properties', 'prevActor', 'nextActor', 'box', 'actorCnt']
const BOX_FIELDS = ['name', 'wrap', 'fill', 'actorKeys']
const CENTRAL = { to: 59, from: 60, both: 61 }
const PLACE = { left: 0, leftof: 0, noteleftof: 0, right: 1, rightof: 1, noterightof: 1, over: 2, noteover: 2 }
const placementOf = word => (typeof word === 'string' ? PLACE[word.toLowerCase().replace(/[\s_-]/g, '')] : undefined)
const noteEnds = list => [list[0], list.length > 1 ? list[1] : list[0]]

/** A block marker (start, section or end): Mermaid's addSignal defaults. */
const marker = (type, message = '', from = undefined, extra = {}) => ({ from, to: undefined, message, type, activate: false, centralConnection: 0, ...extra })
const withAbsent = (entry, reasons) => ({ ...entry, [views.SEQ_ABSENT]: { ...(entry[views.SEQ_ABSENT] ?? {}), ...reasons } })
/** A block start whose label (a rect's colour) the model does not keep. */
const unlabelled = (type, reason) => {
  const { message: _dropped, ...entry } = marker(type)
  return withAbsent(entry, { message: reason })
}

/** getMessages, getNotes and Mermaid's sequence constants over a list of entries. */
function messageView(entries, absent, hooks) {
  // The per-record reasons travel on a symbol key, which must not reach the record itself
  // (toEqual and snapshots compare symbol keys too).
  // sequenceDb's addSignal and addNote always set message, wrap and type (wrap from the
  // autoWrap configuration when none was written), and a note record its wrap: a whole-
  // record comparison or snapshot reads them.
  const recordOf = ({ [views.SEQ_ABSENT]: own, ...fields }, index) => views.record({ id: String(index), ...fields }, 'message', MESSAGE_FIELDS, { ...absent, ...(own ?? {}) }, hooks, views.SEQ_ALWAYS)
  const noteOf = item => {
    const own = item[views.SEQ_ABSENT] ?? {}
    const note = { placement: item.placement, message: item.message, ...('wrap' in item ? { wrap: item.wrap } : {}) }
    if (!own.from && !own.to) note.actor = item.from === item.to ? item.from : [item.from, item.to]
    return views.record(note, 'note', NOTE_FIELDS, { ...absent, ...(own.from || own.to ? { actor: own.from ?? own.to } : {}) }, hooks, ['wrap'])
  }
  const { LINETYPE, ARROWTYPE, PLACEMENT } = views.MERMAID_CONSTANTS.sequence
  return {
    getMessages: () => entries().map(recordOf),
    getNotes: () => entries().filter(item => item.type === LINETYPE.NOTE).map(noteOf),
    LINETYPE,
    ARROWTYPE,
    PLACEMENT,
  }
}

/** getActors / getActor / getActorKeys over [{ id, description, ...fields }] in order. */
function actorView(list, absent, hooks) {
  const actors = () => {
    const all = list()
    return new Map(all.map((actor, index) => {
      const { id, ...fields } = actor
      return [id, views.record({ name: id, ...fields, prevActor: all[index - 1]?.id, nextActor: all[index + 1]?.id }, 'actor', ACTOR_FIELDS, absent, hooks)]
    }))
  }
  return { getActors: actors, getActor: id => actors().get(id), getActorKeys: () => list().map(actor => actor.id) }
}

/** Mermaid's box record; an untitled box has no name and an uncoloured one is transparent. */
const boxRecord = (fields, absent, hooks) => views.record(fields, 'box', BOX_FIELDS, absent, hooks)
const boxName = label => (label == null || label === '' ? undefined : label)

/** Getters that read a concept the model does not keep at all. */
const unsupported = (hooks, reasons) => Object.fromEntries(Object.entries(reasons).map(([getter, reason]) => [getter, () => hooks.unsupported(reason)]))

/** Section and end types for a block kind; a section Mermaid's block has no word for stays a gap. */
function blockTypes(kind, sections, hooks, name) {
  const block = views.SEQ_BLOCK[kind]
  if (!block) return hooks.unavailable(`${name} sequence block ${kind}`)
  if (sections && block[1] === undefined) return hooks.unavailable(`${name} sequence ${kind} block with sections`)
  return block
}

// Index-addressed models: messages are numbered and everything else names the slot before
// message s (s = 0 .. count). Within one slot, statements of one kind keep their list
// order; block markers follow from nesting (inner ends, then a section, then outer starts);
// statements of different kinds in one slot, an empty block next to another marker and an
// empty section have no recorded order, so the list is unsupported.
function interleave({ count, message, slotted, blocks, name }, hooks) {
  const fail = detail => hooks.unsupported(`${name} keeps positions as message indexes; ${detail}`)
  for (const block of blocks) {
    block.types = blockTypes(block.kind, block.sections.length > 0, hooks, name)
    for (const section of block.sections) if (!(section.slot > block.start && section.slot < block.end)) return fail(`an empty block section has no recorded position`)
    if (new Set(block.sections.map(section => section.slot)).size !== block.sections.length) return fail(`an empty block section has no recorded position`)
  }
  const encloses = (outer, inner) => outer !== inner && outer.start <= inner.start && inner.end <= outer.end && (outer.start < inner.start || inner.end < outer.end || outer.seq > inner.seq)
  const depth = block => blocks.filter(other => encloses(other, block)).length
  const out = [], messageAt = [], busy = []
  for (let slot = 0; slot <= count; slot++) {
    const ends = blocks.filter(b => b.end === slot && b.start !== slot).sort((a, b) => depth(b) - depth(a))
    const empties = blocks.filter(b => b.start === slot && b.end === slot)
    const starts = blocks.filter(b => b.start === slot && b.end !== slot).sort((a, b) => depth(a) - depth(b))
    const sections = blocks.flatMap(b => b.sections.filter(section => section.slot === slot).map(section => ({ b, section })))
    const markers = ends.length + empties.length + starts.length + sections.length
    const others = slotted.filter(item => item.slot === slot)
    const kinds = new Set(others.map(item => item.kind))
    if (markers) kinds.add('block marker')
    const where = slot < count ? `before message ${slot + 1}` : 'after the last message'
    // Notes that record which blocks hold them (zombie-mermaid) can be placed among the
    // block markers of their slot; nothing else can.
    const placeable = kinds.size === 2 && kinds.has('note') && others.every(item => item.inside)
    if (kinds.size > 1 && !placeable) return fail(`the order of the ${[...kinds].join(' and ')} statements ${where} is not kept`)
    if (empties.length && markers > 1) return fail(`an empty block ${where} has no recorded position next to another block`)
    if (sections.length > 1) return fail(`two block sections ${where} have no recorded order`)
    busy[slot] = others.length + markers
    const sequence = [
      ...ends.map(b => ({ b, entry: marker(b.types[2]), before: true })),
      ...sections.map(({ b, section }) => ({ b, entry: marker(b.types[1], section.label), section: true })),
      ...[...starts, ...empties].map(b => ({ b, entry: b.startEntry(b.types[0]), before: false })),
      ...empties.map(b => ({ b, entry: marker(b.types[2]), before: true })),
    ]
    // A note held by a block comes after its start and before its end; any other note
    // comes before a start and after an end. Inside a sectioned block the section is unknown.
    let last = 0
    const placed = others.map(item => {
      if (!placeable) return { item, at: 0 }
      if (sequence.some(step => step.section)) return fail(`a note next to a block section ${where} has no recorded side`)
      const after = sequence.map((step, index) => (item.inside(step.b) !== step.before ? index + 1 : 0)).reduce((a, b) => Math.max(a, b), 0)
      if (sequence.slice(after).some(step => item.inside(step.b) !== step.before) || after < last) return fail(`a note ${where} has no consistent position among the block markers`)
      last = after
      return { item, at: after }
    })
    for (let index = 0; index <= sequence.length; index++) {
      for (const { item, at } of placed) if (at === index) out.push(item.entry)
      if (index < sequence.length) out.push(sequence[index].entry)
    }
    if (slot < count) {
      messageAt[slot] = out.length
      out.push(...message(slot))
    }
  }
  return { list: out, messageAt, busy }
}
const startEntry = (label, messageAbsent) => type => (messageAbsent ? unlabelled(type, messageAbsent) : marker(type, label ?? ''))

// ---------------------------------------------------------------------------------------
// Grok's mermaid.rs, its Go port MermaidText and Loom: one item list of messages, notes and
// "dividers". A message keeps dashed and an Arrow or Cross head: ->>, -> and -) (and their
// dotted forms) share the Arrow head. A note keeps its anchor; a two-participant note keeps
// its leftmost and rightmost participant, not the order written. A block is kept only as
// divider text ("loop Every min", "else", "end"), which a view cannot split into Mermaid's
// kind and label. All three read activate, deactivate, create, destroy, title, accTitle,
// accDescr and box statements and keep nothing of them (Grok mermaid.rs parse_sequence,
// MermaidText parse_sequence.go, Loom diagrams/sequence.ts), except that Loom keeps
// activations as spans over item rows. Autonumber is folded into message text.
const GROK_NAMES = { 'xai-org/grok-build': 'Grok', 'spacedock-dev/mermaidtext': 'MermaidText', 'Yassimba/loom': 'Loom' }
function grokItem(item) {
  if (item.Message) return { kind: 'message', ...item.Message, head: String(item.Message.head).toLowerCase() }
  if (item.Note) {
    const [side, at] = Object.entries(item.Note.anchor)[0]
    return { kind: 'note', text: item.Note.text, anchor: Array.isArray(at) ? { side: side.toLowerCase(), a: at[0], b: at[1] } : { side: side.toLowerCase(), a: at, b: at } }
  }
  if (item.Divider) return { kind: 'divider', text: item.Divider.text }
  if (typeof item.kind === 'string' && item.kind.startsWith('seqItem')) {
    const kind = item.kind.slice('seqItem'.length).toLowerCase(), side = String(item.anchor?.kind ?? '').replace(/^anchor/, '').toLowerCase()
    return { kind, from: item.from, to: item.to, text: item.text, dashed: item.dashed, head: String(item.head).replace(/^seqHead/, '').toLowerCase(), anchor: { side, a: item.anchor?.a, b: side === 'over' ? item.anchor?.b : item.anchor?.a } }
  }
  if (item.kind === 'note') return { kind: 'note', text: item.text, anchor: item.anchor.kind === 'over' ? { side: 'over', a: item.anchor.from, b: item.anchor.to } : { side: item.anchor.kind, a: item.anchor.at, b: item.anchor.at } }
  return { ...item, head: typeof item.head === 'string' ? item.head.toLowerCase() : item.head }
}
function grokFamily(project) {
  return (raw, hooks) => {
    const name = GROK_NAMES[project], loom = project === 'Yassimba/loom'
    const ids = []
    for (const [id, index] of views.entriesOf(raw.index)) ids[index] = id
    const entries = () => {
      const items = raw.items.map(grokItem)
      if (items.some(item => item.kind === 'divider')) return hooks.unsupported(`${name} keeps a block only as its divider text ("loop …", "else …", "end"), not its kind and label`)
      if (loom && raw.activations?.length) return hooks.unsupported('Loom keeps activations as spans over item rows, not where each activation or +/- mark was written')
      return items.map(item => {
        if (item.kind === 'message') {
          const cross = item.head === 'cross'
          if (!cross && item.head !== 'arrow') return hooks.unavailable(`${name} sequence head ${item.head}`)
          const entry = { from: ids[item.from], to: ids[item.to], message: item.text ?? '', ...(cross ? { type: item.dashed ? views.SEQ.DOTTED_CROSS : views.SEQ.SOLID_CROSS } : {}), ...(loom ? { activate: false } : {}) }
          return withAbsent(entry, {
            ...(cross ? {} : { type: `${name} draws ->>, -> and -) (and their dotted forms) with one Arrow head` }),
            ...(loom ? {} : { activate: `${name} drops the +/- activation marks` }),
            centralConnection: `${name} has no central connections`,
          })
        }
        if (item.kind === 'note') {
          const placement = placementOf(item.anchor.side)
          if (placement === undefined) return hooks.unavailable(`${name} note anchor ${item.anchor.side}`)
          const note = { from: ids[item.anchor.a], to: ids[item.anchor.b], message: item.text ?? '', type: views.SEQ.NOTE, placement }
          if (item.anchor.a === item.anchor.b) return note
          const reason = `${name} keeps a two-participant note as its leftmost and rightmost participant, not the order written`
          return withAbsent({ message: note.message, type: note.type, placement }, { from: reason, to: reason })
        }
        return hooks.unavailable(`${name} sequence item ${item.kind}`)
      })
    }
    return {
      ...messageView(entries, { wrap: `${name}'s sequence model keeps no text wrapping` }, hooks),
      ...unsupported(hooks, {
        getDiagramTitle: `${name} reads a title statement and keeps nothing of it`,
        getAccTitle: `${name} reads accTitle and keeps nothing of it`,
        getAccDescription: `${name} reads accDescr and keeps nothing of it`,
        getBoxes: `${name} reads box blocks and keeps no box`,
        getCreatedActors: `${name} reads create statements and keeps nothing of them`,
        getDestroyedActors: `${name} reads destroy statements and keeps nothing of them`,
      }),
    }
  }
}

// ---------------------------------------------------------------------------------------
// figurehead plugins/sequence: participants { id, label } and Message items with a Solid
// or Dotted line and an Arrow (->>), None (->) or Open (-)) head. Its parser reads only
// participant/actor lines and those six arrows; every other line is skipped (parser.rs).
const FIGUREHEAD_HEAD = { Arrow: ['SOLID', 'DOTTED'], None: ['SOLID_OPEN', 'DOTTED_OPEN'], Open: ['SOLID_POINT', 'DOTTED_POINT'] }
function figurehead(raw, hooks) {
  const entries = () =>
    raw.items.map(item => {
      if (!item.Message) return hooks.unavailable('figurehead sequence item ' + Object.keys(item).join(','))
      const { from, to, label, arrow } = item.Message
      const type = views.SEQ[FIGUREHEAD_HEAD[arrow.head]?.[arrow.line === 'Dotted' ? 1 : arrow.line === 'Solid' ? 0 : -1]]
      if (type === undefined) return hooks.unavailable(`figurehead arrow ${arrow.line}/${arrow.head}`)
      return withAbsent({ from, to, message: label, type }, { activate: "figurehead's parser has no +/- activation marks", centralConnection: 'figurehead has no central connections' })
    })
  const skipped = what => `figurehead's sequence parser reads only participants and messages; it skips ${what}`
  return {
    ...messageView(entries, { wrap: "figurehead's sequence model keeps no text wrapping" }, hooks),
    ...actorView(() => raw.participants.map(p => ({ id: p.id, description: p.label })), {
      type: 'figurehead records a participant and an actor the same way', wrap: 'figurehead keeps no text wrapping per participant', links: skipped('link statements'), properties: skipped('properties statements'), box: skipped('box blocks'),
    }, hooks),
    ...unsupported(hooks, {
      getDiagramTitle: skipped('title lines'), getAccTitle: skipped('accTitle'), getAccDescription: skipped('accDescr'), getBoxes: skipped('box blocks'),
      getCreatedActors: skipped('create statements'), getDestroyedActors: skipped('destroy statements'),
    }),
  }
}

// ---------------------------------------------------------------------------------------
// merslim parseSequence (dist/index.js): steps are messages and notes. Its arrow words are
// 'sync' for ->> and ->, 'reply' for -->> and -->, 'cross' for -x and 'async' for -);
// a +/- mark is stripped; block, activate, autonumber and box lines are skipped; a title
// line is kept. accTitle, accDescr, create and destroy lines match nothing and are dropped.
function merslim(raw, hooks) {
  const plain = { activate: 'merslim strips the +/- activation marks', centralConnection: 'merslim has no central connections' }
  const entries = () =>
    raw.steps.map(step => {
      if (step.kind === 'message') {
        const type = { cross: views.SEQ.SOLID_CROSS, async: views.SEQ.SOLID_POINT }[step.arrow]
        if (type !== undefined) return withAbsent({ from: step.from, to: step.to, message: step.label, type }, plain)
        if (step.arrow === 'sync' || step.arrow === 'reply') return withAbsent({ from: step.from, to: step.to, message: step.label }, { ...plain, type:`merslim spells ${step.arrow === 'sync' ? '->> and ->' : '-->> and -->'} both '${step.arrow}'` })
        return hooks.unavailable('merslim arrow ' + step.arrow)
      }
      if (step.kind === 'note') {
        const [from, to] = noteEnds(step.participants)
        return { from, to, message: step.text, type: views.SEQ.NOTE, placement: placementOf(step.side) }
      }
      return hooks.unavailable('merslim sequence step ' + step.kind)
    })
  const dropped = what => `merslim's sequence parser drops ${what}`
  return {
    ...messageView(entries, { wrap: "merslim's sequence model keeps no text wrapping" }, hooks),
    ...actorView(() => raw.participants.map(p => ({ id: p.id, description: p.label })), {
      type: 'merslim records a participant and an actor the same way', wrap: 'merslim keeps no text wrapping per participant', links: dropped('link statements'), properties: dropped('properties statements'), box: dropped('box blocks'),
    }, hooks),
    getDiagramTitle: () => raw.title ?? '',
    ...unsupported(hooks, {
      getAccTitle: dropped('accTitle'), getAccDescription: dropped('accDescr'), getBoxes: dropped('box blocks'),
      getCreatedActors: dropped('create statements'), getDestroyedActors: dropped('destroy statements'),
    }),
  }
}

// ---------------------------------------------------------------------------------------
// mermaid-rs-renderer parse_sequence_diagram (parser.rs): messages are edges with a Solid or
// Dotted style and no arrow-head kind; notes, frames and activations name an edge index.
// A frame section's end is exclusive (edges.len() at else/end); frames are listed as they
// close. A +/- mark records an activation at its own message's index and an activate line
// at the next message's index, so activations cannot be placed. Autonumber keeps only its
// start. Title, accTitle, accDescr, create and destroy lines match nothing and are skipped.
const MMDR_FRAME = { Loop: 'loop', Alt: 'alt', Opt: 'opt', Par: 'par', Rect: 'rect', Critical: 'critical', Break: 'break' }
function mmdr(raw, hooks) {
  const name = 'mermaid-rs-renderer'
  const boxes = () => (raw.sequence_boxes ?? []).map(box => boxRecord({ name: boxName(box.label), fill: box.color ?? 'transparent', actorKeys: box.participants }, { wrap: `${name} keeps no text wrapping per box` }, hooks))
  const entries = () => {
    if (raw.sequence_activations?.length) return hooks.unsupported(`${name} records a +/- mark at its own message's index and an activate line at the next message's index, so an activation's position is not kept`)
    if (raw.sequence_autonumber != null) return hooks.unsupported(`${name} keeps autonumber as its start value only, not where it was written or its step`)
    const notes = (raw.sequence_notes ?? []).map(note => {
      const [from, to] = noteEnds(note.participants)
      return { slot: note.index, kind: 'note', entry: { from, to, message: note.label, type: views.SEQ.NOTE, placement: placementOf(note.position) } }
    })
    const blocks = (raw.sequence_frames ?? []).map((frame, seq) => ({
      kind: MMDR_FRAME[frame.kind] ?? frame.kind, start: frame.start_idx, end: frame.end_idx, seq,
      sections: frame.sections.slice(1).map(section => ({ slot: section.start_idx, label: section.label ?? '' })),
      startEntry: startEntry(frame.sections[0]?.label),
    }))
    const reason = `${name} keeps only a solid or dotted line per message, not its arrow head`
    const message = index => {
      const edge = raw.edges[index]
      return [withAbsent({ from: edge.from, to: edge.to, message: edge.label ?? '', activate: false }, { type: reason, centralConnection: `${name} has no central connections` })]
    }
    return interleave({ count: raw.edges.length, message, slotted: notes, blocks, name }, hooks).list
  }
  const boxOf = id => boxes().find(box => box.actorKeys.includes(id))
  return {
    ...messageView(entries, { wrap: `${name}'s sequence model keeps no text wrapping` }, hooks),
    ...actorView(() => raw.sequence_participants.map(id => ({ id, description: raw.nodes[id]?.label ?? id, box: boxOf(id) })), {
      type: `${name} records a participant and an actor the same way`, wrap: `${name} keeps no text wrapping per participant`, links: `${name} keeps no participant links`, properties: `${name} keeps no participant properties`,
    }, hooks),
    getBoxes: boxes,
    ...unsupported(hooks, {
      getDiagramTitle: `${name}'s sequence parser skips title lines`, getAccTitle: `${name}'s sequence parser skips accTitle`, getAccDescription: `${name}'s sequence parser skips accDescr`,
      getCreatedActors: `${name}'s sequence parser skips create statements`, getDestroyedActors: `${name}'s sequence parser skips destroy statements`,
    }),
  }
}

// ---------------------------------------------------------------------------------------
// mermaid-ascii pkg/sequence (parser.go): Events in source order (message, note, activate,
// deactivate, fragment start / divider / end, create, destroy), each message with one of
// Mermaid's ten arrow types and CentralFrom / CentralTo. A +/- mark becomes an activation
// event right after its message, the same as an activate line written there. A create
// event is inserted right before its message and a destroy event right after it. A rect's
// rgb() colour is stripped from its label; a box keeps its title and participant range but
// discards its colour; autonumber is one flag.
const ASCII_ARROW = { SolidArrow: 'SOLID', DottedArrow: 'DOTTED', SolidOpen: 'SOLID_OPEN', DottedOpen: 'DOTTED_OPEN', SolidCross: 'SOLID_CROSS', DottedCross: 'DOTTED_CROSS', SolidPoint: 'SOLID_POINT', DottedPoint: 'DOTTED_POINT', BidirectionalSolid: 'BIDIRECTIONAL_SOLID', BidirectionalDotted: 'BIDIRECTIONAL_DOTTED' }
const ASCII_FRAGMENT = { FragmentLoop: 'loop', FragmentOpt: 'opt', FragmentAlt: 'alt', FragmentPar: 'par', FragmentCritical: 'critical', FragmentBreak: 'break', FragmentRect: 'rect' }
function mermaidAscii(raw, hooks) {
  const name = 'mermaid-ascii'
  const events = raw.Events ?? []
  const flatten = () => {
    if (raw.Autonumber) return hooks.unsupported(`${name} keeps autonumber as one flag, not where it was written`)
    const out = [], before = [], stack = []
    events.forEach((event, index) => {
      before[index] = out.length
      const kind = event.Kind
      if (kind === 'EventMessage') {
        const m = event.Message, from = m.From.ID, to = m.To.ID
        const type = views.MERMAID_CONSTANTS.sequence.LINETYPE[ASCII_ARROW[m.ArrowType]]
        if (type === undefined) return hooks.unavailable(`${name} arrow ${m.ArrowType}`)
        const central = m.CentralFrom && m.CentralTo ? CENTRAL.both : m.CentralTo ? CENTRAL.to : m.CentralFrom ? CENTRAL.from : 0
        const next = events[index + 1]
        const shorthand = !m.CentralTo && next?.Kind === 'EventActivate' && next.Participant?.ID === to
        const entry = { from, to, message: m.Label, type, centralConnection: central, ...(shorthand ? {} : { activate: Boolean(m.CentralTo) }) }
        out.push(shorthand ? withAbsent(entry, { activate: `${name} records A->>+B as a message followed by an activation, the same as an activate line` }) : entry)
        if (m.CentralTo) out.push(marker(CENTRAL.to, '', to))
        if (m.CentralFrom) out.push(marker(CENTRAL.from, '', from))
      } else if (kind === 'EventNote') {
        const [from, to] = noteEnds(event.Note.Participants.map(p => p.ID))
        out.push({ from, to, message: event.Note.Text, type: views.SEQ.NOTE, placement: placementOf(event.Note.Placement) })
      } else if (kind === 'EventActivate' || kind === 'EventDeactivate') {
        out.push(marker(kind === 'EventActivate' ? views.SEQ.ACTIVE_START : views.SEQ.ACTIVE_END, '', event.Participant.ID))
      } else if (kind === 'EventFragmentStart') {
        const block = blockTypes(ASCII_FRAGMENT[event.Fragment.Type], false, hooks, name)
        stack.push(block)
        out.push(event.Fragment.Type === 'FragmentRect' ? unlabelled(block[0], `${name} strips a rect's rgb() colour from its label`) : marker(block[0], event.Fragment.Label))
      } else if (kind === 'EventFragmentDivider') {
        const block = blockTypes(ASCII_FRAGMENT[event.Fragment.Type], true, hooks, name)
        out.push(marker(block[1], event.Fragment.Label))
      } else if (kind === 'EventFragmentEnd') {
        const block = stack.pop()
        if (!block) return hooks.unavailable(`${name} fragment end without a start`)
        out.push(marker(block[2]))
      } else if (kind !== 'EventCreate' && kind !== 'EventDestroy') return hooks.unavailable(`${name} sequence event ${kind}`)
    })
    return { out, before }
  }
  // Mermaid records create/destroy at the next list index when the statement is read; the
  // model binds each to its message, so the index is that message's unless another event
  // sits between the previous message and it (which could have been written either side).
  const settled = position => position < 0 || ['EventMessage', 'EventDestroy'].includes(events[position].Kind)
  const lifeline = kind => () => {
    const { before } = flatten()
    const map = new Map()
    events.forEach((event, index) => {
      if (event.Kind !== kind) return
      let message = kind === 'EventCreate' ? index + 1 : index - 1
      if (kind === 'EventDestroy') while (message >= 0 && events[message].Kind !== 'EventMessage') message--
      let previous = message - 1
      if (previous >= 0 && events[previous].Kind === 'EventCreate') previous--
      if (message < 0 || events[message]?.Kind !== 'EventMessage' || !settled(previous)) return hooks.unsupported(`${name} binds ${kind === 'EventCreate' ? 'create' : 'destroy'} to its message; the statements between the previous message and it could have been written on either side`)
      map.set(event.Participant.ID, before[message])
    })
    return map
  }
  const participants = () => [...raw.Participants].sort((a, b) => a.Index - b.Index)
  const boxes = () => (raw.Boxes ?? []).map(box => boxRecord({ name: boxName(box.Title), actorKeys: participants().filter(p => p.Index >= box.First && p.Index <= box.Last).map(p => p.ID) }, { fill: `${name} parses a box colour and discards it`, wrap: `${name} keeps no text wrapping per box` }, hooks))
  return {
    ...messageView(() => flatten().out, { wrap: `${name}'s sequence model keeps no text wrapping` }, hooks),
    ...actorView(() => participants().map(p => ({ id: p.ID, description: p.Label, box: boxes().find(box => box.actorKeys.includes(p.ID)) })), {
      type: `${name} records a participant and an actor the same way`, wrap: `${name} keeps no text wrapping per participant`, links: `${name} keeps no participant links`, properties: `${name} keeps no participant properties`,
    }, hooks),
    getBoxes: boxes,
    getCreatedActors: lifeline('EventCreate'),
    getDestroyedActors: lifeline('EventDestroy'),
    ...unsupported(hooks, { getDiagramTitle: `${name} rejects a title statement`, getAccTitle: `${name} rejects accTitle`, getAccDescription: `${name} rejects accDescr` }),
  }
}

// ---------------------------------------------------------------------------------------
// vitepress-plugin-mermaid-diagram src/parse/sequence.ts: nested statements (message, note,
// block with branches). A message keeps lineStyle and arrowHead: 'open' is both -> and -);
// a trailing +/- on the target sets activate / deactivate. activate/deactivate lines,
// autonumber, title, accTitle, accDescr, box, create and destroy lines are skipped.
function vitepress(raw, hooks) {
  const name = 'VitePress'
  const flatten = statements =>
    statements.flatMap(statement => {
      if (statement.kind === 'message') {
        const dotted = statement.lineStyle === 'dotted'
        const type = { arrow: dotted ? views.SEQ.DOTTED : views.SEQ.SOLID, cross: dotted ? views.SEQ.DOTTED_CROSS : views.SEQ.SOLID_CROSS }[statement.arrowHead]
        if (type === undefined && statement.arrowHead !== 'open') return hooks.unavailable(`${name} arrow head ${statement.arrowHead}`)
        const entry = { from: statement.from, to: statement.to, message: statement.text, activate: Boolean(statement.activate), ...(type !== undefined ? { type } : {}) }
        return [
          withAbsent(entry, { centralConnection: `${name} has no central connections`, ...(type === undefined ? { type: `${name} spells -> and -) (and their dotted forms) both 'open'` } : {}) }),
          ...(statement.activate ? [marker(views.SEQ.ACTIVE_START, '', statement.to)] : []),
          ...(statement.deactivate ? [marker(views.SEQ.ACTIVE_END, '', statement.from)] : []),
        ]
      }
      if (statement.kind === 'note') {
        const [from, to] = noteEnds(statement.participants)
        return [{ from, to, message: statement.text, type: views.SEQ.NOTE, placement: placementOf(statement.position) }]
      }
      if (statement.kind === 'block') {
        const block = blockTypes(statement.type, statement.branches.length > 1, hooks, name)
        return [
          marker(block[0], statement.label ?? ''),
          ...statement.branches.flatMap((branch, index) => [...(index ? [marker(block[1], branch.label ?? '')] : []), ...flatten(branch.statements)]),
          marker(block[2]),
        ]
      }
      return hooks.unavailable(`${name} sequence statement ${statement.kind}`)
    })
  const skipped = what => `${name}'s sequence parser skips ${what}`
  return {
    ...messageView(() => flatten(raw.statements), { wrap: `${name}'s sequence model keeps no text wrapping` }, hooks),
    ...actorView(() => raw.participants.map(p => ({ id: p.id, description: p.alias ?? p.id, type: p.type })), {
      wrap: `${name} keeps no text wrapping per participant`, links: skipped('link statements'), properties: skipped('properties statements'), box: skipped('box blocks'),
    }, hooks),
    ...unsupported(hooks, {
      getDiagramTitle: skipped('title lines'), getAccTitle: skipped('accTitle'), getAccDescription: skipped('accDescr'), getBoxes: skipped('box blocks'),
      getCreatedActors: skipped('create statements'), getDestroyedActors: skipped('destroy statements'),
    }),
  }
}

// ---------------------------------------------------------------------------------------
// agentic-mermaid SequenceBody: statements in order (participant, message, actor-links,
// fragment, opaque-block). A message keeps its exact arrow operator, an authored wrap flag,
// centralStart / centralEnd and activate / deactivate. Notes, activate lines, critical,
// break and rect blocks, title, box, create, destroy and properties lines are kept only as
// opaque-block source lines, which a view does not read. accTitle and accDescr are fields.
const AGENTIC_ARROW = {
  '->>': 'SOLID', '-->>': 'DOTTED', '->': 'SOLID_OPEN', '-->': 'DOTTED_OPEN', '-x': 'SOLID_CROSS', '--x': 'DOTTED_CROSS', '-)': 'SOLID_POINT', '--)': 'DOTTED_POINT', '<<->>': 'BIDIRECTIONAL_SOLID', '<<-->>': 'BIDIRECTIONAL_DOTTED',
  '-|\\': 'SOLID_TOP', '-|/': 'SOLID_BOTTOM', '-\\\\': 'STICK_TOP', '-//': 'STICK_BOTTOM', '/|-': 'SOLID_ARROW_TOP_REVERSE', '\\|-': 'SOLID_ARROW_BOTTOM_REVERSE', '//-': 'STICK_ARROW_TOP_REVERSE', '\\\\-': 'STICK_ARROW_BOTTOM_REVERSE',
  '--|\\': 'SOLID_TOP_DOTTED', '--|/': 'SOLID_BOTTOM_DOTTED', '--\\\\': 'STICK_TOP_DOTTED', '--//': 'STICK_BOTTOM_DOTTED', '/|--': 'SOLID_ARROW_TOP_REVERSE_DOTTED', '\\|--': 'SOLID_ARROW_BOTTOM_REVERSE_DOTTED', '//--': 'STICK_ARROW_TOP_REVERSE_DOTTED', '\\\\--': 'STICK_ARROW_BOTTOM_REVERSE_DOTTED',
}
function agentic(raw, hooks) {
  if (raw.typedDiagram && Array.isArray(raw.parserObservations)) return agenticNative(raw, hooks)
  const name = 'agentic-mermaid', LINETYPE = views.MERMAID_CONSTANTS.sequence.LINETYPE
  const noWrap = { wrap: `${name} keeps a wrap flag only on messages; Mermaid reads its configuration here` }
  const message = m => {
    // An operator Mermaid has no word for keeps agentic-mermaid's own spelling.
    const type = m.arrow === undefined ? undefined : LINETYPE[AGENTIC_ARROW[m.arrow]] ?? m.arrow
    const central = m.centralStart && m.centralEnd ? CENTRAL.both : m.centralEnd ? CENTRAL.to : m.centralStart ? CENTRAL.from : 0
    const entry = { from: m.from, to: m.to, message: m.text, activate: Boolean(m.activate || m.centralEnd), centralConnection: central, ...(type !== undefined ? { type } : {}), ...(typeof m.wrap === 'boolean' ? { wrap: m.wrap } : {}) }
    const reasons = { ...(type === undefined ? { type: `${name} keeps only the legacy style '${m.style}' for this message` } : {}), ...(typeof m.wrap === 'boolean' ? {} : { wrap: `${name} keeps no wrap flag unless one was written; Mermaid then reads its configuration` }) }
    return [
      Object.keys(reasons).length ? withAbsent(entry, reasons) : entry,
      ...(m.activate ? [withAbsent(marker(views.SEQ.ACTIVE_START, '', m.to), noWrap)] : []),
      ...(m.deactivate ? [withAbsent(marker(views.SEQ.ACTIVE_END, '', m.from), noWrap)] : []),
      ...(m.centralEnd ? [withAbsent(marker(CENTRAL.to, '', m.to), noWrap)] : []),
      ...(m.centralStart ? [withAbsent(marker(CENTRAL.from, '', m.from), noWrap)] : []),
    ]
  }
  const entries = () =>
    raw.statements.flatMap(statement => {
      if (statement.kind === 'participant' || statement.kind === 'actor-links') return []
      if (statement.kind === 'message') return message(raw.messages[statement.ref])
      if (statement.kind === 'opaque-block') return hooks.unsupported(`${name} keeps these statements only as unparsed source lines: ${statement.lines.map(line => JSON.stringify(line)).join(', ').slice(0, 160)}`)
      if (statement.kind === 'fragment') {
        const fragment = statement.fragment
        const block = blockTypes(fragment.fragmentKind, fragment.branches.length > 1, hooks, name)
        return [
          withAbsent(marker(block[0], fragment.label ?? ''), noWrap),
          ...fragment.branches.flatMap((branch, index) => [...(index ? [withAbsent(marker(block[1], branch.label ?? ''), noWrap)] : []), ...branch.messages.flatMap(message)]),
          withAbsent(marker(block[2]), noWrap),
        ]
      }
      return hooks.unavailable(`${name} sequence statement ${statement.kind}`)
    })
  const opaque = what => `${name} keeps ${what} only as unparsed source lines`
  return {
    ...messageView(entries, {}, hooks),
    ...actorView(() => raw.participants.map(p => ({ id: p.id, description: p.label, type: p.kind, links: p.links ?? {}, ...(typeof p.wrap === 'boolean' ? { wrap: p.wrap } : {}) })), {
      wrap: `${name} keeps no wrap flag for this participant; Mermaid then reads its configuration`, properties: opaque('properties statements'), box: opaque('box blocks'),
    }, hooks),
    getAccTitle: () => raw.accessibilityTitle ?? '',
    getAccDescription: () => raw.accessibilityDescription ?? '',
    ...unsupported(hooks, { getDiagramTitle: opaque('a title line'), getBoxes: opaque('box blocks'), getCreatedActors: opaque('create statements'), getDestroyedActors: opaque('destroy statements') }),
  }
}

// The public strict SequenceDiagram retains exact endpoint semantics and actor/box
// state. Its real parser mutations retain statement order, including adjacent empty
// blocks and notes that cannot be ordered from message indexes alone. Observations
// are read as native data; their text and the editable body's opaque lines are not
// a second parser. Older statement events omit syntax, so their effective numbering
// counters cannot stand in for the authored autonumber arguments.
const AGENTIC_HEADS = {
  'none/filled': ['SOLID', 'DOTTED'], 'none/none': ['SOLID_OPEN', 'DOTTED_OPEN'],
  'none/cross': ['SOLID_CROSS', 'DOTTED_CROSS'], 'none/open': ['SOLID_POINT', 'DOTTED_POINT'],
  'filled/filled': ['BIDIRECTIONAL_SOLID', 'BIDIRECTIONAL_DOTTED'],
  'none/half-top': ['SOLID_TOP', 'SOLID_TOP_DOTTED'], 'none/half-bottom': ['SOLID_BOTTOM', 'SOLID_BOTTOM_DOTTED'],
  'none/stick-top': ['STICK_TOP', 'STICK_TOP_DOTTED'], 'none/stick-bottom': ['STICK_BOTTOM', 'STICK_BOTTOM_DOTTED'],
  'half-bottom/none': ['SOLID_ARROW_TOP_REVERSE', 'SOLID_ARROW_TOP_REVERSE_DOTTED'],
  'half-top/none': ['SOLID_ARROW_BOTTOM_REVERSE', 'SOLID_ARROW_BOTTOM_REVERSE_DOTTED'],
  'stick-bottom/none': ['STICK_ARROW_TOP_REVERSE', 'STICK_ARROW_TOP_REVERSE_DOTTED'],
  'stick-top/none': ['STICK_ARROW_BOTTOM_REVERSE', 'STICK_ARROW_BOTTOM_REVERSE_DOTTED'],
}
function agenticNative(raw, hooks) {
  const diagram = raw.typedDiagram, LINETYPE = views.MERMAID_CONSTANTS.sequence.LINETYPE
  const noWrap = { wrap: 'agentic-mermaid retains no effective wrap flag here; Mermaid reads its host configuration' }
  const wrapped = (entry, native) => typeof native?.wrap === 'boolean' ? { ...entry, wrap: native.wrap } : withAbsent(entry, noWrap)
  const message = m => {
    const type = LINETYPE[AGENTIC_HEADS[`${m.startHead}/${m.endHead}`]?.[m.lineStyle === 'solid' ? 0 : m.lineStyle === 'dashed' ? 1 : -1]]
    const central = m.centralStart && m.centralEnd ? CENTRAL.both : m.centralEnd ? CENTRAL.to : m.centralStart ? CENTRAL.from : 0
    const entry = wrapped({ from: m.from, to: m.to, message: m.label, activate: Boolean(m.activate || m.centralEnd), centralConnection: central, ...(type === undefined ? {} : { type }) }, m)
    return [
      ...(type === undefined ? [withAbsent(entry, { type: 'agentic-mermaid native message lacks a recognized exact endpoint/line-style tuple' })] : [entry]),
      ...(m.activate ? [wrapped(marker(views.SEQ.ACTIVE_START, '', m.to))] : []),
      ...(m.deactivate ? [wrapped(marker(views.SEQ.ACTIVE_END, '', m.from))] : []),
      ...(m.centralEnd ? [wrapped(marker(CENTRAL.to, '', m.to))] : []),
      ...(m.centralStart ? [wrapped(marker(CENTRAL.from, '', m.from))] : []),
    ]
  }
  const timeline = () => {
    const list = [], created = new Map(), destroyed = new Map(), blocks = new Map()
    let syntax
    for (const event of raw.parserObservations) {
      if (event.family !== 'sequence') continue
      if (event.unit === 'statement') { syntax = event.value; continue }
      if (event.unit !== 'mutation') continue
      const value = event.value
      switch (event.kind) {
        case 'participant.apply':
          if (value.kind === 'declare' && value.create) created.set(value.id, list.length)
          break
        case 'pending-destroy': destroyed.set(value, list.length); break
        case 'add-message': list.push(...message(value)); break
        case 'add-note': {
          const note = value.note, [from, to] = noteEnds(note.actorIds)
          list.push(wrapped({ from, to, message: note.text, type: views.SEQ.NOTE, placement: placementOf(note.position) }, note))
          break
        }
        case 'open-block': {
          const block = value.block, types = blockTypes(block.type, false, hooks, 'agentic-mermaid')
          blocks.set(value.id, types)
          list.push(wrapped(marker(types[0], block.type === 'rect' ? block.color ?? '' : block.label), block))
          break
        }
        case 'divide-block': {
          const types = blocks.get(value.parent)
          if (types?.[1] === undefined) return hooks.unavailable('agentic-mermaid sequence divider has no observed owning block')
          list.push(wrapped(marker(types[1], value.divider.label), value.divider))
          break
        }
        case 'close-block': {
          const types = blocks.get(value.id)
          if (!types) return hooks.unavailable('agentic-mermaid sequence end has no observed owning block')
          list.push(wrapped(marker(types[2])))
          blocks.delete(value.id)
          break
        }
        case 'activation': list.push(wrapped(marker(value.kind === 'activate' ? views.SEQ.ACTIVE_START : views.SEQ.ACTIVE_END, '', value.actorId))); break
        case 'set-autonumber': {
          const known = syntax?.kind === 'autonumber' && Object.hasOwn(syntax, 'numbering')
          const numbering = syntax?.numbering
          const payload = known ? { start: numbering?.next, step: numbering?.next === undefined ? undefined : numbering.step ?? 1, visible: numbering !== null }
            : views.record({ visible: value.visible }, 'autonumber', ['start', 'step', 'visible'], { start: 'agentic-mermaid observation omits authored autonumber start', step: 'agentic-mermaid observation omits authored autonumber step' }, hooks, ['start', 'step'])
          list.push({ from: undefined, to: undefined, message: payload, wrap: false, type: views.SEQ.AUTONUMBER })
          break
        }
      }
    }
    return { list, created, destroyed }
  }
  const boxes = () => (diagram.boxes ?? []).map(box => boxRecord({ name: boxName(box.label), fill: box.color ?? 'transparent', actorKeys: box.actorIds, ...(typeof box.wrap === 'boolean' ? { wrap: box.wrap } : {}) }, noWrap, hooks))
  return {
    ...messageView(() => timeline().list, {}, hooks),
    ...actorView(() => diagram.actors.map(actor => ({ id: actor.id, description: actor.label, type: actor.type, links: actor.links ?? {}, box: actor.box === undefined ? undefined : boxes()[actor.box], ...(typeof actor.wrap === 'boolean' ? { wrap: actor.wrap } : {}) })), {
      ...noWrap, properties: 'agentic-mermaid recognizes actor data statements but retains no properties payload',
    }, hooks),
    getBoxes: boxes,
    getCreatedActors: () => timeline().created,
    getDestroyedActors: () => timeline().destroyed,
    getDiagramTitle: () => diagram.title ?? raw.title ?? '',
    getAccTitle: () => diagram.accessibilityTitle ?? raw.accessibilityTitle ?? '',
    getAccDescription: () => diagram.accessibilityDescription ?? raw.accessibilityDescription ?? '',
  }
}

// ---------------------------------------------------------------------------------------
// beautiful-mermaid src/sequence/parser.ts (kais-radwan/ascii-mermaid ships the same parser)
// and its fork zombie-mermaid (@zombie-mermaid/mermaid-parser): messages are numbered;
// notes (and zombie's activate lines) keep afterIndex, the message they follow; blocks keep
// startIndex and endIndex = max(last message, startIndex), so a block holding one message
// and an empty block followed by a message are the same record. A message keeps a solid or
// dashed line and a 'filled' (->>, -x) or 'open' (->, -)) head; zombie adds isLost (-x) and
// bidirectional (<<->>). A +/- mark is activate / deactivate on the message. beautiful
// skips activate, title, accTitle, accDescr, autonumber, box, create and destroy lines;
// zombie keeps standalone activations, boxes, createdAt / destroyedAt (message indexes),
// seqNumber for autonumber, a rect's colour, and drops title and accessibility lines.
function beautifulFamily(project) {
  const zombie = project === 'dfadler/zombie-mermaid'
  const name = { 'lukilabs/beautiful-mermaid': 'beautiful-mermaid', 'kais-radwan/ascii-mermaid': 'ascii-mermaid', 'dfadler/zombie-mermaid': 'zombie-mermaid' }[project]
  return (raw, hooks) => {
    const count = raw.messages.length
    const typeOf = m => {
      const dashed = m.lineStyle === 'dashed'
      if (zombie && m.bidirectional) return dashed ? views.SEQ.BIDIRECTIONAL_DOTTED : views.SEQ.BIDIRECTIONAL_SOLID
      if (zombie && m.isLost) return dashed ? views.SEQ.DOTTED_CROSS : views.SEQ.SOLID_CROSS
      if (zombie && m.arrowHead === 'filled') return dashed ? views.SEQ.DOTTED : views.SEQ.SOLID
      return undefined
    }
    const headReason = zombie ? `${name} spells -> and -) (and their dashed forms) both 'open'` : `${name} spells ->> and -x both 'filled' and -> and -) both 'open'`
    const message = index => {
      const m = raw.messages[index], type = typeOf(m)
      const entry = { from: m.from, to: m.to, message: m.label, activate: Boolean(m.activate), ...(type !== undefined ? { type } : {}) }
      return [withAbsent(entry, { centralConnection: `${name} has no central connections`, ...(type === undefined ? { type: headReason } : {}) }), ...(m.activate ? [marker(views.SEQ.ACTIVE_START, '', m.to)] : []), ...(m.deactivate ? [marker(views.SEQ.ACTIVE_END, '', m.from)] : [])]
    }
    const layout = () => {
      if (zombie && raw.messages.some(m => m.seqNumber !== undefined)) return hooks.unsupported(`${name} keeps autonumber as a number on each message, not where it was written`)
      // zombie's blocks name the notes they hold (noteStartIndex .. noteEndIndex).
      const notes = raw.notes.map((note, index) => {
        const [from, to] = noteEnds(note.actorIds)
        return { slot: note.afterIndex + 1, kind: 'note', entry: { from, to, message: note.text, type: views.SEQ.NOTE, placement: placementOf(note.position) }, ...(zombie ? { inside: block => block.noteStart <= index && index < block.noteEnd } : {}) }
      })
      const activations = (zombie ? raw.activations ?? [] : []).map(a => ({ slot: a.afterIndex + 1, kind: 'activation', entry: marker(a.kind === 'start' ? views.SEQ.ACTIVE_START : views.SEQ.ACTIVE_END, '', a.actorId) }))
      const blocks = raw.blocks.map((block, seq) => {
        if (block.endIndex === block.startIndex && block.startIndex < count) return hooks.unsupported(`${name} records a block holding one message and an empty block followed by a message the same way`)
        const rect = block.type === 'rect'
        const colour = zombie ? block.color : block.label
        return {
          kind: block.type, seq, start: block.startIndex, end: block.endIndex > block.startIndex ? block.endIndex + 1 : block.startIndex, noteStart: block.noteStartIndex, noteEnd: block.noteEndIndex,
          sections: block.dividers.map(divider => ({ slot: divider.index, label: divider.label })),
          startEntry: startEntry(rect ? colour : block.label, rect && colour === undefined ? `${name} drops a rect's text when it is not a colour it recognizes` : undefined),
        }
      })
      return interleave({ count, message, slotted: [...notes, ...activations], blocks, name }, hooks)
    }
    // createdAt / destroyedAt name the message the statement binds to; Mermaid's index is
    // the next list index when the statement is read, which is that message's unless other
    // statements share its slot (they could have been written either side).
    const lifeline = field => () => {
      const { messageAt, busy } = layout()
      const map = new Map()
      for (const actor of raw.actors) {
        const index = actor[field]
        if (index === undefined) continue
        if (busy[index]) return hooks.unsupported(`${name} binds ${field === 'createdAt' ? 'create' : 'destroy'} to its message; the statements just before it could have been written on either side`)
        map.set(actor.id, messageAt[index])
      }
      return map
    }
    const skipped = what => `${name}'s sequence parser skips ${what}`
    const boxes = () => (raw.boxes ?? []).map(box => boxRecord({ name: boxName(box.label), fill: box.color ?? 'transparent', actorKeys: box.actorIds }, { wrap: `${name} keeps no text wrapping per box` }, hooks))
    const actors = () => raw.actors.map(a => ({ id: a.id, description: a.label, type: a.participantType ?? a.type, ...(zombie ? { box: boxes().find(box => box.actorKeys.includes(a.id)) } : {}) }))
    return {
      ...messageView(() => layout().list, { wrap: `${name}'s sequence model keeps no text wrapping` }, hooks),
      ...actorView(actors, { wrap: `${name} keeps no text wrapping per participant`, links: skipped('link statements'), properties: skipped('properties statements'), ...(zombie ? {} : { box: skipped('box blocks') }) }, hooks),
      ...(zombie ? { getBoxes: boxes, getCreatedActors: lifeline('createdAt'), getDestroyedActors: lifeline('destroyedAt') } : unsupported(hooks, { getBoxes: skipped('box blocks'), getCreatedActors: skipped('create statements'), getDestroyedActors: skipped('destroy statements') })),
      ...unsupported(hooks, { getDiagramTitle: skipped('title lines'), getAccTitle: skipped('accTitle'), getAccDescription: skipped('accDescr') }),
    }
  }
}

// ---------------------------------------------------------------------------------------
// termaid parser/sequence.py and model/sequence.py: events in order with nested blocks; a
// +/- mark becomes an ActivateEvent right after its message, the same as an activate line
// written there; destroy is a DestroyEvent; a `create` prefix is accepted and discarded.
// Participants keep their kind (participant, actor, database, queue, boundary, control,
// entity, collections). Title, accTitle, accDescr, box, link, links and properties lines
// are unrecognized and dropped with a warning; autonumber is one flag.
const TERMAID_ARROW = { solid: { arrow: 'SOLID', open: 'SOLID_OPEN', cross: 'SOLID_CROSS', async: 'SOLID_POINT', bidirectional: 'BIDIRECTIONAL_SOLID' }, dotted: { arrow: 'DOTTED', open: 'DOTTED_OPEN', cross: 'DOTTED_CROSS', async: 'DOTTED_POINT', bidirectional: 'BIDIRECTIONAL_DOTTED' } }
function termaid(raw, hooks) {
  const name = 'termaid'
  const flatten = (events, out, destroyed) => {
    events.forEach((event, index) => {
      if ('source' in event && 'target' in event) {
        const type = views.MERMAID_CONSTANTS.sequence.LINETYPE[TERMAID_ARROW[event.line_type]?.[event.arrow_type]]
        if (type === undefined) return hooks.unavailable(`termaid sequence arrow ${event.line_type}/${event.arrow_type}`)
        const next = events[index + 1]
        const shorthand = next && next.active === true && next.participant === event.target
        const entry = { from: event.source, to: event.target, message: event.label ?? '', type, ...(shorthand ? {} : { activate: false }) }
        out.push(withAbsent(entry, { centralConnection: 'termaid has no central connections', ...(shorthand ? { activate: 'termaid records A->>+B as a message followed by an activation, the same as an activate line' } : {}) }))
      } else if ('text' in event && 'position' in event) {
        const [from, to] = noteEnds(event.participants)
        out.push({ from, to, message: event.text, type: views.SEQ.NOTE, placement: placementOf(event.position) })
      } else if ('participant' in event && 'active' in event) out.push(marker(event.active ? views.SEQ.ACTIVE_START : views.SEQ.ACTIVE_END, '', event.participant))
      else if ('participant' in event) destroyed.set(event.participant, out.length)
      else if ('kind' in event && Array.isArray(event.events)) {
        const block = blockTypes(event.kind, event.sections?.length > 0, hooks, name)
        out.push(marker(block[0], event.label ?? ''))
        flatten(event.events, out, destroyed)
        for (const section of event.sections ?? []) {
          out.push(marker(block[1], section.label ?? ''))
          flatten(section.events, out, destroyed)
        }
        out.push(marker(block[2]))
      } else hooks.unavailable('termaid sequence event ' + Object.keys(event).join(','))
    })
    return out
  }
  const walk = () => {
    if (raw.autonumber) return hooks.unsupported('termaid keeps autonumber as one flag, not where it was written or its start and step')
    const destroyed = new Map()
    return { list: flatten(raw.events, [], destroyed), destroyed }
  }
  const dropped = what => `termaid drops ${what} as an unrecognized line`
  return {
    ...messageView(() => walk().list, { wrap: "termaid's sequence model keeps no text wrapping per message" }, hooks),
    ...actorView(() => raw.participants.map(p => ({ id: p.id, description: p.label, type: p.kind })), {
      wrap: 'termaid keeps no text wrapping per participant', links: dropped('link statements'), properties: dropped('properties statements'), box: dropped('box blocks'),
    }, hooks),
    getDestroyedActors: () => walk().destroyed,
    ...unsupported(hooks, {
      getDiagramTitle: dropped('a title line'), getAccTitle: dropped('accTitle'), getAccDescription: dropped('accDescr'), getBoxes: dropped('box blocks'),
      getCreatedActors: "termaid accepts a create prefix and discards it",
    }),
  }
}

// ---------------------------------------------------------------------------------------
// mermaid_core 0.3.2 (Mermaid Dart and Flutter) sequence_model.dart: participants keep
// isActor, boxes keep label / members / color (null without one), the title is kept;
// accTitle, accDescr, link, links and properties lines are "parsed and discarded"
// (sequence_parser.dart). Events are one flat list of SeqEvent kinds, each named by the
// bridge's $class: a block start names its kind, a divider opens the next section and a
// block end closes it; SeqCreate and SeqDestroy add no Mermaid entry, and Mermaid's
// created/destroyed index is the length of the message list where the statement stands;
// a +/- mark becomes a SeqActivation right after its message, the same as an activate line there.
const DART_ARROW = { solidArrow: 'SOLID', dottedArrow: 'DOTTED', solidOpen: 'SOLID_OPEN', dottedOpen: 'DOTTED_OPEN', solidCross: 'SOLID_CROSS', dottedCross: 'DOTTED_CROSS', solidPoint: 'SOLID_POINT', dottedPoint: 'DOTTED_POINT', bidirectionalSolid: 'BIDIRECTIONAL_SOLID', bidirectionalDotted: 'BIDIRECTIONAL_DOTTED' }
const DART_KIND = { loop: 'loop', alt: 'alt', par: 'par', parOver: 'par_over', opt: 'opt', critical: 'critical', breakBlock: 'break', rect: 'rect' }
function dartEvents(raw, hooks) {
  const name = 'mermaid_core'
  const noWrap = { wrap: `${name} keeps a wrap flag only on messages and notes` }
  return () => {
    const stack = [], out = [], created = new Map(), destroyed = new Map()
    raw.events.forEach((event, index) => {
      switch (event.$class) {
        case 'SeqMessage': {
          const type = views.MERMAID_CONSTANTS.sequence.LINETYPE[DART_ARROW[event.arrow]]
          if (type === undefined) return hooks.unavailable(`${name} sequence arrow ${event.arrow}`)
          const next = raw.events[index + 1]
          const shorthand = next && next.$class === 'SeqActivation' && next.active === true && next.id === event.to
          const entry = { from: event.from, to: event.to, message: event.text ?? '', wrap: event.wrap, type, ...(shorthand ? {} : { activate: false }) }
          return out.push(withAbsent(entry, { centralConnection: `${name} has no central connections`, ...(shorthand ? { activate: `${name} records A->>+B as a message followed by an activation, the same as an activate line` } : {}) }))
        }
        case 'SeqNote': return out.push({ from: event.target, to: event.target2 ?? event.target, message: event.text ?? '', wrap: event.wrap, type: views.SEQ.NOTE, placement: placementOf(event.placement) })
        case 'SeqActivation': return out.push(withAbsent(marker(event.active ? views.SEQ.ACTIVE_START : views.SEQ.ACTIVE_END, '', event.id), noWrap))
        case 'SeqCreate': return created.set(event.id, out.length)
        case 'SeqDestroy': return destroyed.set(event.id, out.length)
        case 'SeqAutonumber': return out.push({ from: undefined, to: undefined, message: { start: event.start ?? undefined, step: event.step ?? undefined, visible: event.on }, wrap: false, type: views.SEQ.AUTONUMBER })
        case 'SeqBlockStart': {
          const block = blockTypes(DART_KIND[event.kind] ?? event.kind, false, hooks, name)
          stack.push(block)
          return out.push(withAbsent(marker(block[0], event.kind === 'rect' ? event.color ?? '' : event.label ?? ''), noWrap))
        }
        case 'SeqBlockDivider': {
          const block = stack.at(-1)
          if (!block?.[1]) return hooks.unavailable(`${name} sequence section outside a sectioned block`)
          return out.push(withAbsent(marker(block[1], event.label ?? ''), noWrap))
        }
        case 'SeqBlockEnd': {
          const block = stack.pop()
          if (!block) return hooks.unavailable(`${name} sequence block end without a start`)
          return out.push(withAbsent(marker(block[2]), noWrap))
        }
        default: return hooks.unavailable(`${name} sequence event ${event.$class ?? Object.keys(event).join(',')}`)
      }
    })
    return { out, created, destroyed }
  }
}
function dart(raw, hooks) {
  const name = 'mermaid_core'
  const events = dartEvents(raw, hooks)
  const boxes = () => (raw.boxes ?? []).map(box => boxRecord({ name: boxName(box.label), fill: box.color ?? 'transparent', actorKeys: box.members }, { wrap: `${name} keeps no text wrapping per box` }, hooks))
  const discarded = what => `${name} parses ${what} and discards it`
  return {
    ...messageView(() => events().out, {}, hooks),
    ...actorView(() => views.entriesOf(raw.participants).map(([id, p]) => ({ id, description: p.label, type: p.isActor ? 'actor' : 'participant', box: boxes().find(box => box.actorKeys.includes(id)) })), {
      wrap: `${name} keeps no text wrapping per participant`, links: discarded('link statements'), properties: discarded('properties statements'),
    }, hooks),
    getBoxes: boxes,
    getDiagramTitle: () => raw.title ?? '',
    ...unsupported(hooks, { getAccTitle: discarded('accTitle'), getAccDescription: discarded('accDescr') }),
    getCreatedActors: () => events().created,
    getDestroyedActors: () => events().destroyed,
  }
}

// ---------------------------------------------------------------------------------------
// XMermaid 0.4.2 parse_dsl sequence (captured parser output; its WASM ships no source):
// participants { id, label, kind }; messages { from, to, label, line_style solid|dashed,
// end_marker arrow|open|cross|none, bidirectional, activate_target (+), deactivate_source
// (-) }; one event list in source order (message, note, block_start / block_divider /
// block_end, activation, create, destroy, autonumber). A bare autonumber is kept as start 1,
// increment 1, the same as `autonumber 1 1`; a rect's colour is re-spaced ('rgb(1, 2, 3)');
// a box keeps its colour and name as one label. It rejects title lines and keeps no
// accessibility text, links, properties or wrap flags.
const XMERMAID_LINE = { 'solid:arrow': 'SOLID', 'dashed:arrow': 'DOTTED', 'solid:cross': 'SOLID_CROSS', 'dashed:cross': 'DOTTED_CROSS', 'solid:open': 'SOLID_POINT', 'dashed:open': 'DOTTED_POINT', 'solid:none': 'SOLID_OPEN', 'dashed:none': 'DOTTED_OPEN' }
function xmermaidSequence(raw, hooks) {
  if (raw.type !== 'sequence') return undefined
  const name = 'XMermaid'
  const LINE = views.MERMAID_CONSTANTS.sequence.LINETYPE
  const noWrap = { wrap: `${name}'s sequence model keeps no text wrapping` }
  const walk = () => {
    const out = [], stack = [], created = new Map(), destroyed = new Map()
    for (const event of raw.events ?? []) {
      if (event.kind === 'message') {
        const item = raw.messages[event.message_index]
        const word = item.bidirectional ? (item.end_marker === 'arrow' ? (item.line_style === 'dashed' ? 'BIDIRECTIONAL_DOTTED' : 'BIDIRECTIONAL_SOLID') : undefined) : XMERMAID_LINE[`${item.line_style}:${item.end_marker}`]
        if (word === undefined) return hooks.unavailable(`${name} sequence message ${item.line_style}/${item.end_marker}${item.bidirectional ? ' two-way' : ''}`)
        out.push(withAbsent({ from: item.from, to: item.to, message: item.label ?? '', type: LINE[word], activate: Boolean(item.activate_target), centralConnection: 0 }, noWrap))
        if (item.activate_target) out.push(withAbsent(marker(views.SEQ.ACTIVE_START, '', item.to), noWrap))
        if (item.deactivate_source) out.push(withAbsent(marker(views.SEQ.ACTIVE_END, '', item.from), noWrap))
      } else if (event.kind === 'note') {
        const [from, to] = noteEnds(event.participants ?? [])
        out.push(withAbsent({ from, to, message: event.text ?? '', type: views.SEQ.NOTE, placement: placementOf(event.placement) }, noWrap))
      } else if (event.kind === 'activation') out.push(withAbsent(marker(event.active ? views.SEQ.ACTIVE_START : views.SEQ.ACTIVE_END, '', event.participant), noWrap))
      else if (event.kind === 'create') created.set(event.participant, out.length)
      else if (event.kind === 'destroy') destroyed.set(event.participant, out.length)
      else if (event.kind === 'block_start') {
        const block = blockTypes(event.block, false, hooks, name)
        stack.push(block)
        out.push(withAbsent(event.block === 'rect' ? unlabelled(block[0], `${name} re-spaces a rect's colour text`) : marker(block[0], event.label ?? ''), noWrap))
      } else if (event.kind === 'block_divider') {
        const block = stack.at(-1)
        if (!block?.[1]) return hooks.unavailable(`${name} sequence section outside a sectioned block`)
        out.push(withAbsent(marker(block[1], event.label ?? ''), noWrap))
      } else if (event.kind === 'block_end') {
        const block = stack.pop()
        if (!block) return hooks.unavailable(`${name} sequence block end without a start`)
        out.push(withAbsent(marker(block[2]), noWrap))
      } else if (event.kind === 'autonumber' && Object.keys(event).every(key => ['kind', 'start', 'increment'].includes(key))) {
        const entry = { from: undefined, to: undefined, type: views.SEQ.AUTONUMBER, wrap: false }
        out.push(event.start === 1 && event.increment === 1 ? withAbsent(entry, { message: `${name} keeps a bare autonumber as start 1, increment 1, the same as autonumber 1 1` }) : { ...entry, message: { start: event.start, step: event.increment, visible: true } })
      } else return hooks.unavailable(`${name} sequence event ${event.kind}`)
    }
    return { out, created, destroyed }
  }
  const box = item => boxRecord({ actorKeys: [...(item.participants ?? [])] }, { name: `${name} keeps a box's colour and name as one label`, fill: `${name} keeps a box's colour and name as one label`, wrap: `${name} keeps no text wrapping per box` }, hooks)
  const boxes = () => (raw.boxes ?? []).map(box)
  return {
    ...messageView(() => walk().out, {}, hooks),
    ...actorView(() => (raw.participants ?? []).map(p => ({ id: p.id, description: p.label, type: p.kind, box: boxes().find(item => item.actorKeys.includes(p.id)) })), {
      wrap: `${name} keeps no text wrapping per participant`, links: `${name}'s sequence model keeps no participant links`, properties: `${name}'s sequence model keeps no participant properties`,
    }, hooks),
    getBoxes: boxes,
    getCreatedActors: () => walk().created,
    getDestroyedActors: () => walk().destroyed,
    ...unsupported(hooks, { getDiagramTitle: `${name}'s sequence parser rejects title lines`, getAccTitle: `${name}'s sequence model keeps no accessibility title`, getAccDescription: `${name}'s sequence model keeps no accessibility description` }),
  }
}

export default {
  schema: {
    sequence: {
      'xai-org/grok-build': grokFamily('xai-org/grok-build'),
      'spacedock-dev/mermaidtext': grokFamily('spacedock-dev/mermaidtext'),
      'Yassimba/loom': grokFamily('Yassimba/loom'),
      'Mootikins/figurehead-rs': figurehead,
      'emtyty/merslim': merslim,
      '1jehuang/mermaid-rs-renderer': mmdr,
      'AlexanderGrooff/mermaid-ascii': mermaidAscii,
      'KlangHaus/vitepress-plugin-diagram': vitepress,
      'adewale/agentic-mermaid': agentic,
      'lukilabs/beautiful-mermaid': beautifulFamily('lukilabs/beautiful-mermaid'),
      'kais-radwan/ascii-mermaid': beautifulFamily('kais-radwan/ascii-mermaid'),
      'dfadler/zombie-mermaid': beautifulFamily('dfadler/zombie-mermaid'),
      'fasouto/termaid': termaid,
      'orestesgaolin/mermaid': dart,
      'pub:mermaid_flutter': dart,
      'evangwt/xmermaid': xmermaidSequence,
    },
  },
}
