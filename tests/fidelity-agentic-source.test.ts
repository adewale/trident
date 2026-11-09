import { expect, test } from 'bun:test'
import captured from './fixtures/agentic-source-models.json'
import { parseAgenticSource } from '../unified/mermaid-fidelity/agentic-parser.mjs'
import { nativeSchemaView } from '../unified/mermaid-fidelity/schema-views.mjs'

const hooks = {
  unavailable: (reason: string): never => { throw Error('gap: ' + reason) },
  unsupported: (reason: string): never => { throw Error('unsupported: ' + reason) },
}
const revive = (value: any): any => {
  if (Array.isArray(value)) return value.map(revive)
  if (value && typeof value === 'object') {
    if (value.__map) return new Map(value.__map.map(([key, item]: any) => [key, revive(item)]))
    if (value.__set) return new Set(value.__set.map(revive))
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, revive(item)]))
  }
  return value
}
const operations = { class: 'parseClassDiagram', sequence: 'parseSequenceDiagram', er: 'parseErDiagram', usecase: 'parseUsecaseModel', agentflow: 'parseAgentflowModel' }
const sourceView = (family: keyof typeof operations, changes = {}) => nativeSchemaView('adewale/agentic-mermaid', family, {
  ...revive(captured[family].model),
  nativeParser: operations[family],
  editingModel: revive((captured[family] as { editingModel?: unknown }).editingModel),
  ...changes,
}, hooks)

test('Agentic source parser capability selection preserves the full input and never retries a rejection through the editing parser', () => {
  const source = '---\ntitle: Example\n---\nsequenceDiagram\nA->>B: hello'
  const seen: string[] = []
  const api = {
    parseSequenceDiagram: (text: string) => { seen.push(text); return captured.sequence.model },
    parseRegisteredMermaid: () => { seen.push('editable'); return { ok: false } },
  }
  expect(parseAgenticSource(api, 'sequence', source)?.model).toBe(captured.sequence.model)
  expect(seen).toEqual([source, 'editable'])
  expect(parseAgenticSource({}, 'sequence', source)).toBeUndefined()
  expect(parseAgenticSource(api, 'state', source)).toBeUndefined()
  api.parseSequenceDiagram = () => { throw new SyntaxError('malformed participant') }
  seen.length = 0
  expect(() => parseAgenticSource(api, 'sequence', source)).toThrow('malformed participant')
  expect(seen).toEqual([])
})

test('Agentic source classes expose native attributes, methods, annotations, styles and nested namespace declarations', () => {
  const view = sourceView('class'), c = view.getClass('C')
  expect([c.label, c.type, c.annotations, c.parent, c.cssClasses]).toEqual(['C', 'T', ['interface'], 'A.B', 'default hot'])
  expect(() => c.styles).toThrow('unsupported:')
  expect(sourceView('class', { classDefs: new Map() }).getClass('C').styles).toEqual(['stroke:blue'])
  expect(c.members[0].id).toBe('String name')
  expect(c.members[0].getDisplayDetails()).toEqual({ displayText: '+String name', cssStyle: '' })
  expect(c.methods[0].getDisplayDetails()).toEqual({ displayText: '+go(x: int) : bool', cssStyle: 'text-decoration:underline;' })
  expect(view.getDirection()).toBe('LR')
  expect(view.getNamespace('A').explicit).toBe(false)
  expect(view.getNamespace('A.B').explicit).toBe(true)
  expect(view.getNamespace('A').children.get('A.B').classes.get('C').id).toBe('C')
  expect(view.getRelations()[0]).toMatchObject({ id1: 'C', id2: 'D', relation: { type1: 2, type2: 'none', lineType: 0 }, title: 'owns' })
})

test('Agentic class mapping retains unknown declaration and classifier information instead of inventing it', () => {
  const view = sourceView('class', { editingModel: undefined })
  expect(view.getClass('C').members[0].getDisplayDetails().displayText).toBe('+String name')
  expect(() => view.getClass('C').label).toThrow('unsupported:')
  expect(() => view.getNamespace('A').explicit).toThrow('unsupported:')
  const model = structuredClone(captured.class.model)
  model.classes[0]!.methods[0]!.isAbstract = true
  expect(() => sourceView('class', model).getClass('C').methods[0].classifier).toThrow('unsupported:')
})

test('Agentic source sequence can observe notes, boxes and actors independently of ambiguous statement order', () => {
  const view = sourceView('sequence')
  expect(view.getNotes()[0].actor).toEqual(['A', 'B'])
  expect(view.getNotes()[0].message).toBe('hello')
  expect(view.getBoxes()[0].actorKeys).toEqual(['C'])
  expect(view.getActor('C').box.fill).toBe('red')
  expect(view.getActor('A').description).toBe('Alice')
  expect(() => view.getMessages()).toThrow('unsupported:')
  expect(view.getCreatedActors().size).toBe(0)
})

test('Agentic source sequence interleaves unambiguous notes and activation markers with native arrow ends', () => {
  const model = { ...captured.sequence.model, blocks: [], activationEvents: [{ actorId: 'C', kind: 'activate', messageIndex: 2 }] }
  const view = sourceView('sequence', { ...model, title: 'Example', editingModel: undefined })
  expect(view.getMessages().map((m: any) => [m.from, m.to, m.message, m.type])).toEqual([
    ['A', 'B', 'hello', 2], ['A', 'B', 'request', 0], ['B', undefined, '', 17],
    ['B', 'A', 'yes', 1], ['B', undefined, '', 18], ['C', undefined, '', 17], ['B', 'A', 'no', 4],
  ])
  expect(view.getDiagramTitle()).toBe('Example')
  expect(() => view.getNotes()[0].wrap).toThrow('unsupported:')
})

test('Agentic source sequence preserves exact editing-model order where semantic records exist', () => {
  const editingModel = { kind: 'sequence', participants: [], messages: [], statements: [{ kind: 'fragment', fragment: { fragmentKind: 'loop', label: 'Empty', branches: [{ messages: [] }] } }] }
  const view = sourceView('sequence', { notes: [], activationEvents: [], editingModel })
  expect(view.getMessages().map((m: any) => m.message)).toEqual(['Empty', ''])
})

test('Agentic public ER model exposes typed attributes, cardinalities and class definitions', () => {
  const view = sourceView('er'), entity = view.getEntity('A')
  expect(entity.attributes[0]).toMatchObject({ type: 'string', name: 'id', keys: ['PK'], comment: 'identifier' })
  expect(entity.cssClasses).toBe('default hot')
  expect(view.getClasses().get('hot').styles).toEqual(['fill:red'])
  expect(view.getRelationships()[0]).toMatchObject({ entityA: 'A', entityB: 'B', relSpec: { cardA: 'ZERO_OR_MORE', cardB: 'ONLY_ONE', relType: 'IDENTIFYING' } })
})

test('Agentic public UseCase model retains declaration order and source spans without claiming absent AST tables', () => {
  const view = sourceView('usecase')
  expect(view.getActor('User').label).toBe('User')
  expect(view.getUseCase('Buy').label).toBe('Buy')
  expect(view.getRelationships()[0]).toMatchObject({ source: 'User', target: 'Buy' })
  expect(view.getAST().source).toBe(captured.usecase.source)
  expect(view.getAST().statements[0].span).toEqual([13, 25])
  expect(() => view.getAST().nodes).toThrow('unsupported:')
  expect(() => JSON.stringify(view.getAST())).toThrow('unsupported:')
})

test('Agentic public AgentFlow model uses its existing reviewed graph and metadata view', () => {
  const view = sourceView('agentflow')
  expect(view.getVertices().get('A')).toMatchObject({ id: 'A', text: 'Do', type: 'roundedRect' })
  expect(view.getEdges()[0]).toMatchObject({ start: 'A', end: 'B', type: 'arrow_point' })
})
