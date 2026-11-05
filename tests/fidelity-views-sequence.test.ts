import { expect, test } from 'bun:test'
import { nativeSchemaView } from '../unified/mermaid-fidelity/schema-views.mjs'

// Native models below were captured from the parser bridges at their pinned versions
// (scripts/fidelity-probe.ts), trimmed to the fields each test needs.
const verdicts = () => {
  const log: string[] = []
  return {
    log,
    hooks: {
      unavailable: (reason: string) => {
        log.push('gap: ' + reason)
        throw Error('gap')
      },
      unsupported: (reason: string) => {
        log.push('unsupported: ' + reason)
        throw Error('unsupported')
      },
    },
  }
}
const pick = (record: any, fields: string[]) => Object.fromEntries(fields.map(field => [field, record[field]]))
/** A field's value, or 'U' where reading it is unsupported. */
const safe = (record: any, field: string) => {
  try {
    return record[field]
  } catch {
    return 'U'
  }
}
const LT = { SOLID: 0, DOTTED: 1, NOTE: 2, SOLID_CROSS: 3, DOTTED_CROSS: 4, SOLID_OPEN: 5, DOTTED_OPEN: 6, LOOP_START: 10, LOOP_END: 11, ALT_START: 12, ALT_ELSE: 13, ALT_END: 14, ACTIVE_START: 17, ACTIVE_END: 18, RECT_START: 22, SOLID_POINT: 24, DOTTED_POINT: 25, BIDIRECTIONAL_SOLID: 33 }

test('Grok family: a cross head is mapped, the shared Arrow head and divider-text blocks are unsupported', () => {
  const { hooks, log } = verdicts()
  const grok = {
    labels: ['Al', 'Bob'],
    index: { Alice: 0, Bob: 1 },
    items: [
      { Message: { from: 0, to: 1, text: 'x', dashed: true, head: 'Cross' } },
      { Message: { from: 1, to: 0, text: null, dashed: false, head: 'Arrow' } },
      { Note: { anchor: { Right: 1 }, text: 'thinks' } },
      { Note: { anchor: { Over: [0, 1] }, text: 'both' } },
    ],
  }
  const view = nativeSchemaView('xai-org/grok-build', 'sequence', grok, hooks)
  const messages = view.getMessages()
  expect(pick(messages[0], ['id', 'from', 'to', 'message', 'type'])).toEqual({ id: '0', from: 'Alice', to: 'Bob', message: 'x', type: LT.DOTTED_CROSS })
  expect(messages[1].message).toBe('')
  expect(() => messages[1].type).toThrow('unsupported')
  expect(log.at(-1)).toContain('one Arrow head')
  expect(() => messages[0].activate).toThrow('unsupported')
  expect(pick(messages[2], ['from', 'to', 'type', 'placement'])).toEqual({ from: 'Bob', to: 'Bob', type: LT.NOTE, placement: 1 })
  // Over(a, b) keeps the leftmost and rightmost participant, not the written order.
  expect(() => messages[3].from).toThrow('unsupported')
  expect(() => view.getNotes()[1].actor).toThrow('unsupported')
  expect(view.getNotes()[0].actor).toBe('Bob')
  expect(() => view.getDiagramTitle()).toThrow('unsupported')
  expect([...view.getActors().keys()]).toEqual(['Alice', 'Bob'])
  expect(view.LINETYPE.SOLID_TOP).toBe(41)

  const withBlock = { ...grok, items: [{ Divider: { text: 'loop Every min' } }, grok.items[0], { Divider: { text: 'end' } }] }
  expect(() => nativeSchemaView('xai-org/grok-build', 'sequence', withBlock, hooks).getMessages()).toThrow('unsupported')
  expect(log.at(-1)).toContain('divider text')
})

test('MermaidText and Loom share the Grok reading; Loom activations are spans, so they are unsupported', () => {
  const { hooks, log } = verdicts()
  const mtext = {
    labels: ['A', 'B'],
    index: new Map([['A', 0], ['B', 1]]),
    items: [
      { kind: 'seqItemMessage', from: 0, to: 1, text: 'hi', dashed: false, head: 'seqHeadCross', anchor: { kind: 'anchorOver', a: 0, b: 0 } },
      { kind: 'seqItemNote', from: 0, to: 0, text: 'n', dashed: false, head: 'seqHeadArrow', anchor: { kind: 'anchorLeft', a: 1, b: 0 } },
    ],
  }
  const messages = nativeSchemaView('spacedock-dev/mermaidtext', 'sequence', mtext, hooks).getMessages()
  expect(messages.map((m: any) => pick(m, ['from', 'to', 'type', 'placement']))).toEqual([
    { from: 'A', to: 'B', type: LT.SOLID_CROSS, placement: undefined },
    { from: 'B', to: 'B', type: LT.NOTE, placement: 0 },
  ])

  const loom = { labels: ['A', 'B'], index: { A: 0, B: 1 }, items: [{ kind: 'message', from: 0, to: 1, text: 'hi', dashed: false, head: 'arrow' }, { kind: 'note', anchor: { kind: 'over', from: 0, to: 0 }, text: 'n' }], activations: [] }
  const view = nativeSchemaView('Yassimba/loom', 'sequence', loom, hooks)
  expect(view.getMessages()[0].activate).toBe(false)
  expect(view.getNotes()[0].actor).toBe('A')
  expect(() => nativeSchemaView('Yassimba/loom', 'sequence', { ...loom, activations: [{ at: 1, from: 0, to: 0 }] }, hooks).getMessages()).toThrow('unsupported')
  expect(log.at(-1)).toContain('spans over item rows')
})

test('figurehead: six arrows map exactly; activation, links and boxes are not carried', () => {
  const { hooks } = verdicts()
  const msg = (line: string, head: string) => ({ Message: { from: 'A', to: 'B', label: line + head, arrow: { line, head }, depth: 0 } })
  const raw = { participants: [{ id: 'A', label: 'Alice' }, { id: 'B', label: 'B' }], items: ['Solid', 'Dotted'].flatMap(line => ['Arrow', 'None', 'Open'].map(head => msg(line, head))) }
  const view = nativeSchemaView('Mootikins/figurehead-rs', 'sequence', raw, hooks)
  expect(view.getMessages().map((m: any) => m.type)).toEqual([LT.SOLID, LT.SOLID_OPEN, LT.SOLID_POINT, LT.DOTTED, LT.DOTTED_OPEN, LT.DOTTED_POINT])
  expect(() => view.getMessages()[0].activate).toThrow('unsupported')
  expect(() => view.getMessages()[0].wrap).toThrow('unsupported')
  const alice = view.getActor('A')
  expect(pick(alice, ['name', 'description', 'nextActor'])).toEqual({ name: 'A', description: 'Alice', nextActor: 'B' })
  expect(() => alice.links).toThrow('unsupported')
  expect(() => view.getBoxes()).toThrow('unsupported')
  expect(view.getActor('missing')).toBeUndefined()
})

test('merslim: sync and reply are shared by two arrows each; cross, async, notes and title map', () => {
  const { hooks, log } = verdicts()
  const raw = {
    type: 'sequence', title: 'T',
    participants: [{ id: 'A', label: 'A' }, { id: 'B', label: 'B' }],
    steps: [
      { kind: 'message', from: 'A', to: 'B', arrow: 'sync', label: 'one' },
      { kind: 'message', from: 'A', to: 'B', arrow: 'async', label: 'two' },
      { kind: 'note', side: 'over', participants: ['B', 'A'], text: 'n' },
    ],
  }
  const view = nativeSchemaView('emtyty/merslim', 'sequence', raw, hooks)
  const messages = view.getMessages()
  expect(() => messages[0].type).toThrow('unsupported')
  expect(log.at(-1)).toContain("->> and -> both 'sync'")
  expect(messages[1].type).toBe(LT.SOLID_POINT)
  expect(pick(messages[2], ['from', 'to', 'placement'])).toEqual({ from: 'B', to: 'A', placement: 2 })
  expect(view.getNotes()[0].actor).toEqual(['B', 'A'])
  expect(view.getDiagramTitle()).toBe('T')
  expect(() => view.getAccTitle()).toThrow('unsupported')
})

test('mermaid-ascii: events flatten into Mermaid entries; shorthand activation, central connections and lifelines', () => {
  const { hooks, log } = verdicts()
  const A = { ID: 'A', Label: 'Alice', Index: 0 }, B = { ID: 'B', Label: 'B', Index: 1 }, C = { ID: 'C', Label: 'C', Index: 2 }
  const message = (From: any, To: any, Label: string, ArrowType: string, extra = {}) => ({ Kind: 'EventMessage', Message: { From, To, Label, ArrowType, CentralFrom: false, CentralTo: false, Number: 0, ...extra } })
  const raw = {
    Participants: [A, B, C],
    Autonumber: false,
    Boxes: [{ Title: '', First: 0, Last: 1 }],
    Events: [
      message(A, B, 'one', 'SolidArrow'),
      { Kind: 'EventActivate', Participant: B },
      message(B, A, 'two', 'DottedPoint', { CentralTo: true }),
      { Kind: 'EventFragmentStart', Fragment: { Type: 'FragmentAlt', Label: 'x' } },
      { Kind: 'EventNote', Note: { Placement: 'NoteLeftOf', Participants: [A], Text: 'n' } },
      { Kind: 'EventFragmentDivider', Fragment: { Type: 'FragmentAlt', Label: 'y' } },
      message(A, B, 'x', 'DottedArrow'),
      { Kind: 'EventCreate', Participant: C },
      message(B, C, 'three', 'SolidCross'),
      message(C, B, 'four', 'SolidOpen'),
      { Kind: 'EventDestroy', Participant: C },
      { Kind: 'EventFragmentEnd' },
      { Kind: 'EventFragmentStart', Fragment: { Type: 'FragmentRect', Label: '' } },
      message(A, B, 'five', 'BidirectionalSolid'),
      { Kind: 'EventFragmentEnd' },
    ],
  }
  const view = nativeSchemaView('AlexanderGrooff/mermaid-ascii', 'sequence', raw, hooks)
  const messages = view.getMessages()
  expect(messages.map((m: any) => [m.type, m.from ?? '-', safe(m, 'message')].join(' '))).toEqual(['0 A one', '17 B ', '25 B two', '59 A ', '12 - x', '2 A n', '13 - y', '1 A x', '3 B three', '5 C four', '14 - ', '22 - U', '33 A five', '23 - '])
  expect(() => messages[0].activate).toThrow('unsupported')
  expect(pick(messages[2], ['activate', 'centralConnection'])).toEqual({ activate: true, centralConnection: 59 })
  expect(messages[8].activate).toBe(false)
  expect(() => messages[11].message).toThrow('unsupported')
  expect(log.at(-1)).toContain('rgb()')
  expect(Object.getOwnPropertySymbols(messages[0])).toEqual([])
  expect(view.getCreatedActors()).toEqual(new Map([['C', 8]]))
  expect(view.getDestroyedActors()).toEqual(new Map([['C', 9]]))
  // A create bound to a message that follows another statement could have been written on either side of it.
  const ambiguous = { ...raw, Events: raw.Events.filter((event: any) => event.Message?.Label !== 'x') }
  expect(() => nativeSchemaView('AlexanderGrooff/mermaid-ascii', 'sequence', ambiguous, hooks).getCreatedActors()).toThrow('unsupported')
  expect(pick(view.getBoxes()[0], ['name', 'actorKeys'])).toEqual({ name: undefined, actorKeys: ['A', 'B'] })
  expect(() => view.getBoxes()[0].fill).toThrow('unsupported')
  expect(() => nativeSchemaView('AlexanderGrooff/mermaid-ascii', 'sequence', { ...raw, Autonumber: true }, hooks).getMessages()).toThrow('unsupported')
})

test('mermaid-rs-renderer: index-addressed notes and frames interleave; same-slot statements of two kinds do not', () => {
  const { hooks, log } = verdicts()
  const edge = (from: string, to: string, label: string, style = 'Solid') => ({ from, to, label, style })
  const raw = {
    nodes: { A: { label: 'Alice' }, B: { label: 'B' } },
    sequence_participants: ['A', 'B'],
    edges: [edge('A', 'B', 'one'), edge('A', 'B', 'two'), edge('B', 'A', 'three', 'Dotted'), edge('A', 'B', 'four')],
    sequence_notes: [{ position: 'RightOf', participants: ['B'], label: 'n', index: 1 }],
    sequence_frames: [
      { kind: 'Loop', sections: [{ label: 'inner', start_idx: 2, end_idx: 3 }], start_idx: 2, end_idx: 3 },
      { kind: 'Alt', sections: [{ label: 'x', start_idx: 2, end_idx: 3 }, { label: null, start_idx: 3, end_idx: 4 }], start_idx: 2, end_idx: 4 },
    ],
    sequence_activations: [],
    sequence_autonumber: null,
    sequence_boxes: [{ label: null, color: null, participants: ['A'] }],
  }
  const view = nativeSchemaView('1jehuang/mermaid-rs-renderer', 'sequence', raw, hooks)
  const messages = view.getMessages()
  expect(messages.map((m: any) => safe(m, 'type') + ':' + m.message)).toEqual(['U:one', '2:n', 'U:two', '12:x', '10:inner', 'U:three', '11:', '13:', 'U:four', '14:'])
  expect(() => messages[0].type).toThrow('unsupported')
  expect(messages[0].activate).toBe(false)
  expect(pick(view.getBoxes()[0], ['name', 'fill', 'actorKeys'])).toEqual({ name: undefined, fill: 'transparent', actorKeys: ['A'] })
  expect(view.getActor('A').box.actorKeys).toEqual(['A'])

  const crowded = { ...raw, sequence_notes: [{ position: 'Over', participants: ['A'], label: 'n', index: 2 }] }
  expect(() => nativeSchemaView('1jehuang/mermaid-rs-renderer', 'sequence', crowded, hooks).getMessages()).toThrow('unsupported')
  expect(log.at(-1)).toContain('before message 3 is not kept')
  const activated = { ...raw, sequence_activations: [{ participant: 'B', index: 0, kind: 'Activate' }] }
  expect(() => nativeSchemaView('1jehuang/mermaid-rs-renderer', 'sequence', activated, hooks).getMessages()).toThrow('unsupported')
})

test('zombie-mermaid: notes are placed by the blocks that hold them; one-message blocks are ambiguous; lifelines map', () => {
  const { hooks, log } = verdicts()
  const message = (from: string, to: string, label: string, extra = {}) => ({ from, to, label, lineStyle: 'solid', arrowHead: 'filled', ...extra })
  const raw = {
    actors: [{ id: 'A', label: 'A', type: 'participant' }, { id: 'B', label: 'B', type: 'actor', participantType: 'database' }, { id: 'C', label: 'C', type: 'participant', createdAt: 4 }],
    messages: [message('A', 'B', 'one', { activate: true }), message('A', 'B', 'two', { isLost: true }), message('B', 'A', 'three', { arrowHead: 'open' }), message('A', 'B', 'four'), message('B', 'C', 'five')],
    blocks: [{ type: 'loop', label: 'L', startIndex: 1, endIndex: 2, dividers: [], noteStartIndex: 1, noteEndIndex: 2 }],
    notes: [
      { actorIds: ['A'], text: 'before', position: 'over', afterIndex: 0 },
      { actorIds: ['A'], text: 'inside', position: 'over', afterIndex: 0 },
    ],
    activations: [],
    boxes: [{ label: 'G', actorIds: ['A', 'B'], color: 'Aqua' }],
  }
  const view = nativeSchemaView('dfadler/zombie-mermaid', 'sequence', raw, hooks)
  const messages = view.getMessages()
  expect(messages.map((m: any) => safe(m, 'type') + ':' + m.message)).toEqual(['0:one', '17:', '2:before', '10:L', '2:inside', '3:two', 'U:three', '11:', '0:four', '0:five'])
  expect(messages[0].activate).toBe(true)
  expect(() => messages[6].type).toThrow('unsupported')
  expect(view.getActor('B').type).toBe('database')
  expect(view.getCreatedActors()).toEqual(new Map([['C', 9]]))
  // Created at message 4 ("four"), whose slot holds the loop's end: either side is possible.
  const crowded = { ...raw, actors: [raw.actors[0], raw.actors[1], { ...raw.actors[2], createdAt: 3 }] }
  expect(() => nativeSchemaView('dfadler/zombie-mermaid', 'sequence', crowded, hooks).getCreatedActors()).toThrow('unsupported')
  expect(pick(view.getBoxes()[0], ['name', 'fill', 'actorKeys'])).toEqual({ name: 'G', fill: 'Aqua', actorKeys: ['A', 'B'] })

  const single = { ...raw, blocks: [{ ...raw.blocks[0], endIndex: 1 }] }
  expect(() => nativeSchemaView('dfadler/zombie-mermaid', 'sequence', single, hooks).getMessages()).toThrow('unsupported')
  expect(log.at(-1)).toContain('holding one message')
  expect(() => nativeSchemaView('lukilabs/beautiful-mermaid', 'sequence', { ...raw, blocks: [] }, hooks).getMessages()[4].type).toThrow('unsupported')
  expect(log.at(-1)).toContain("->> and -x both 'filled'")
})

test('VitePress: nested blocks flatten; open heads are shared; participant type and alias map', () => {
  const { hooks } = verdicts()
  const raw = {
    participants: [{ id: 'A', alias: 'Alice', type: 'actor' }, { id: 'B', type: 'participant' }],
    statements: [
      { kind: 'block', type: 'alt', label: 'x', branches: [{ label: 'x', statements: [{ kind: 'message', from: 'A', to: 'B', text: 'one', lineStyle: 'dotted', arrowHead: 'arrow', activate: true }] }, { label: 'y', statements: [{ kind: 'note', position: 'left', participants: ['A'], text: 'n' }] }] },
      { kind: 'message', from: 'B', to: 'A', text: 'two', lineStyle: 'solid', arrowHead: 'open' },
    ],
  }
  const view = nativeSchemaView('KlangHaus/vitepress-plugin-diagram', 'sequence', raw, hooks)
  const messages = view.getMessages()
  expect(messages.map((m: any) => safe(m, 'type') + ':' + m.message)).toEqual(['12:x', '1:one', '17:', '13:y', '2:n', '14:', 'U:two'])
  expect(messages[1].activate).toBe(true)
  expect(() => messages[6].type).toThrow('unsupported')
  expect(pick(view.getActor('A'), ['description', 'type'])).toEqual({ description: 'Alice', type: 'actor' })
})

test('agentic-mermaid: exact operators (half arrows too), central connections and wrap; opaque source lines are unsupported', () => {
  const { hooks, log } = verdicts()
  const raw = {
    kind: 'sequence',
    participants: [{ id: 'A', label: 'A', kind: 'database', links: { Help: 'https://example.com' } }, { id: 'B', label: 'B', kind: 'participant' }],
    messages: [
      { from: 'A', to: 'B', text: 'one', style: 'sync', arrow: '-|\\', wrap: true },
      { from: 'A', to: 'B', text: 'two', style: 'sync', arrow: '->>', centralEnd: true, centralStart: true },
    ],
    statements: [{ kind: 'participant', ref: 0 }, { kind: 'message', ref: 0 }, { kind: 'fragment', fragment: { fragmentKind: 'loop', label: 'L', branches: [{ messages: [{ from: 'B', to: 'A', text: 'three', style: 'reply', arrow: '--x' }] }] } }, { kind: 'message', ref: 1 }],
    accessibilityTitle: 'AT',
  }
  const view = nativeSchemaView('adewale/agentic-mermaid', 'sequence', raw, hooks)
  const messages = view.getMessages()
  expect(messages.map((m: any) => m.type)).toEqual([41, LT.LOOP_START, LT.DOTTED_CROSS, LT.LOOP_END, LT.SOLID, 59, 60])
  expect(messages[0].wrap).toBe(true)
  expect(() => messages[2].wrap).toThrow('unsupported')
  expect(pick(messages[4], ['activate', 'centralConnection'])).toEqual({ activate: true, centralConnection: 61 })
  expect(pick(messages[5], ['from', 'to'])).toEqual({ from: 'B', to: undefined })
  expect(view.getActor('A').links).toEqual({ Help: 'https://example.com' })
  expect(view.getActor('A').type).toBe('database')
  expect(view.getActor('B').links).toEqual({})
  expect(() => view.getActor('A').properties).toThrow('unsupported')
  expect(view.getAccTitle()).toBe('AT')
  expect(view.getAccDescription()).toBe('')
  const opaque = { ...raw, statements: [...raw.statements, { kind: 'opaque-block', lines: ['Note over A: n'] }] }
  expect(() => nativeSchemaView('adewale/agentic-mermaid', 'sequence', opaque, hooks).getMessages()).toThrow('unsupported')
  expect(log.at(-1)).toContain('unparsed source lines')
})

test('termaid: destroy events give Mermaid indexes; activate is known unless an activation follows the message', () => {
  const { hooks } = verdicts()
  const raw = {
    participants: [{ id: 'A', label: 'A', kind: 'queue' }, { id: 'C', label: 'C', kind: 'participant' }],
    events: [
      { source: 'A', target: 'C', label: 'hi', line_type: 'solid', arrow_type: 'arrow' },
      { participant: 'C', active: true },
      { participant: 'C' },
      { source: 'C', target: 'A', label: 'bye', line_type: 'dotted', arrow_type: 'async' },
    ],
    autonumber: false,
    warnings: [],
  }
  const view = nativeSchemaView('fasouto/termaid', 'sequence', raw, hooks)
  const messages = view.getMessages()
  expect(messages.map((m: any) => m.type)).toEqual([LT.SOLID, LT.ACTIVE_START, LT.DOTTED_POINT])
  expect(() => messages[0].activate).toThrow('unsupported')
  expect(messages[2].activate).toBe(false)
  expect(view.getDestroyedActors()).toEqual(new Map([['C', 2]]))
  expect(view.getActor('A').type).toBe('queue')
  expect(() => view.getCreatedActors()).toThrow('unsupported')
})

test('mermaid_core: create and destroy events add no entry; telling them apart needs the bridge', () => {
  const { hooks, log } = verdicts()
  const raw = {
    participants: new Map([['A', { id: 'A', label: 'Alice', isActor: true }], ['C', { id: 'C', label: 'C', isActor: false }]]),
    events: [{ id: 'C' }, { from: 'A', to: 'C', arrow: 'solidArrow', text: 'hi', wrap: false }, { kind: 'rect', label: '', color: 'rgb(1,2,3)' }, {}],
    title: 'T',
    boxes: [{ label: '', members: ['A'], color: null }],
  }
  const view = nativeSchemaView('orestesgaolin/mermaid', 'sequence', raw, hooks)
  expect(view.getMessages().map((m: any) => [m.type, m.message])).toEqual([[LT.SOLID, 'hi'], [LT.RECT_START, 'rgb(1,2,3)'], [23, '']])
  expect(view.getMessages()[0].activate).toBe(false)
  expect(pick(view.getActor('A'), ['description', 'type'])).toEqual({ description: 'Alice', type: 'actor' })
  expect(pick(view.getBoxes()[0], ['name', 'fill'])).toEqual({ name: undefined, fill: 'transparent' })
  expect(view.getDiagramTitle()).toBe('T')
  expect(() => view.getAccTitle()).toThrow('unsupported')
  expect(() => view.getCreatedActors()).toThrow('gap')
  expect(log.at(-1)).toContain('same as SeqDestroy')
})
