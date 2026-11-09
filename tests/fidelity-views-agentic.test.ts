import { expect, test } from 'bun:test'
import { nativeSchemaView, nativeAstView } from '../unified/mermaid-fidelity/schema-views.mjs'

const project = 'adewale/agentic-mermaid'
const hooks = { unavailable: (why: string): never => { throw Error('gap: ' + why) }, unsupported: (why: string): never => { throw Error('unsupported: ' + why) } }
test('Agentic flowchart views retain explicit borders and independent default, indexed and edge-ID curves', () => {
  const raw = { graph: { direction: 'TD', nodes: new Map([['A', { id: 'A', label: 'Deploy', shape: 'rectangle', borders: 'lt' }], ['B', { id: 'B', label: 'B', shape: 'rectangle' }]]), edges: [{ source: 'A', target: 'B', hasArrowEnd: true, style: 'solid', curve: 'linear' }, { source: 'B', target: 'A', hasArrowEnd: true, style: 'solid' }], subgraphs: [], classDefs: new Map(), classAssignments: new Map(), nodeStyles: new Map(), linkStyles: new Map(), linkCurves: new Map<number | string, string>([['default', 'basis'], [0, 'cardinal'], [1, 'stepAfter']]) } }
  const view = nativeSchemaView(project, 'flowchart', raw, hooks)
  expect(view.getVertices().get('A').type).toBe('rect')
  expect(view.getVertices().get('A').props).toEqual({ borders: 'lt' })
  expect(view.getEdges().defaultInterpolate).toBe('basis')
  expect(view.getEdges().map((edge: any) => edge.interpolate)).toEqual(['linear', 'stepAfter'])
  const older = { graph: { ...raw.graph, linkCurves: undefined } }
  expect(nativeSchemaView(project, 'flowchart', older, hooks).getEdges()[0].interpolate).toBe('linear')
  expect(nativeSchemaView(project, 'flowchart', older, hooks).getEdges().defaultInterpolate).toBeUndefined()
})
test('Agentic C4 written boundary types override macro defaults', () => {
  const raw = { variant: 'C4Context', elements: [], relationships: [], boundaries: [
    { id: 'system', macro: 'System_Boundary', label: 'System', type: 'Written system type' },
    { id: 'container', macro: 'Container_Boundary', label: 'Container', type: 'Written container type', parentId: 'system' },
    { id: 'default', macro: 'System_Boundary', label: 'Default' },
  ] }
  const view = nativeSchemaView(project, 'c4', raw, hooks)
  expect(view.getBoundaries().map((b: any) => [b.alias, b.type.text, b.parentBoundary])).toEqual([
    ['global', 'global', ''], ['system', 'Written system type', 'global'], ['container', 'Written container type', 'system'], ['default', 'SYSTEM', 'global'],
  ])
})
test('Agentic qualified namespace paths expose parents, linked children and authored leaves', () => {
  const raw = { classes: [{ id: 'Report', members: [], namespace: 'Company.Project.Module.SubModule' }, { id: 'Admin', members: [], namespace: 'Company.Project.Module' }], namespaces: [{ name: 'Company.Project.Module.SubModule', label: 'Reports' }, { name: 'Company.Project.Module' }], relationships: [], notes: [] }
  const view = nativeSchemaView(project, 'class', raw, hooks)
  const spaces = view.getNamespaces()
  expect([...spaces.keys()]).toEqual(['Company', 'Company.Project', 'Company.Project.Module', 'Company.Project.Module.SubModule'])
  expect(spaces.get('Company').parent).toBeUndefined()
  expect(spaces.get('Company.Project').parent).toBe('Company')
  expect(spaces.get('Company.Project.Module').children.get('Company.Project.Module.SubModule')).toBe(spaces.get('Company.Project.Module.SubModule'))
  expect(spaces.get('Company.Project.Module.SubModule').label).toBe('Reports')
  expect([...spaces.get('Company.Project.Module.SubModule').classes.keys()]).toEqual(['Report'])
  expect([...spaces.values()].map((n: any) => n.explicit)).toEqual([false, false, true, true])
  expect(raw.namespaces).toHaveLength(2)
  expect(() => spaces.get('Company').notes).toThrow('unsupported:')
})
test('Agentic railroad retains duplicate rules, nested bounds and explicit native loss of singleton syntax', () => {
  const raw = { kind: 'railroad', rules: [{ name: 'word', definition: { type: 'repetition', min: 1, max: null, element: { type: 'terminal', value: 'a' } } }, { name: 'word', definition: { type: 'nonterminal', name: 'other' } }] }
  const view = nativeSchemaView(project, 'railroad', raw, hooks)
  expect(view.getRules()).toHaveLength(2)
  expect(view.getRules()[0].definition).toEqual({ type: 'repetition', min: 1, max: Infinity, separator: undefined, element: { type: 'terminal', value: 'a' } })
  expect(view.getRule('word').definition).toEqual({ type: 'nonterminal', name: 'other' })
  expect(() => nativeAstView(project, 'Railroad', raw, hooks).rules[0].definition).toThrow('unsupported:')
  const richer = nativeSchemaView(project, 'railroad', { ...raw, rules: [{ name: 'x', definition: { type: 'choice', ordered: true, alternatives: [{ type: 'predicate', operator: '!', element: { type: 'terminal', value: 'x' } }, { type: 'any' }, { type: 'exception', base: { type: 'nonterminal', name: 'word' }, except: { type: 'terminal', value: 'bad' } }] } }] }, hooks)
  expect(richer.getRules()[0].definition).toEqual({ type: 'choice', alternatives: [{ type: 'special', text: '!"x"' }, { type: 'special', text: '.' }, { type: 'sequence', elements: [{ type: 'nonterminal', name: 'word' }, { type: 'terminal', value: '-' }, { type: 'terminal', value: 'bad' }] }] })
})
test('Agentic tree keeps explicit parent identity and annotations without inventing indentation widths', () => {
  const raw = { kind: 'treeview', nodes: [{ id: 'treeview-0', label: 'src', nodeType: 'directory' }, { id: 'treeview-1', parentId: 'treeview-0', label: 'main.ts', nodeType: 'file', icon: 'code', className: 'hot', description: 'entry' }] }
  const view = nativeSchemaView(project, 'treeview', raw, hooks), root = view.getRoot()
  expect(view.getCount()).toBe(3)
  expect(root.children[0].children[0].name).toBe('main.ts')
  expect(root.children[0].children[0].cssClass).toBe('hot')
  expect(() => root.children[0].level).toThrow('indentation')
  const ast = nativeAstView(project, 'TreeView', raw, hooks)
  expect(ast.nodes[0].name).toBe('src/')
  expect(ast.nodes[1].iconAnnotation).toBe('code')
  expect(() => ast.nodes[1].indent).toThrow('unsupported:')
  expect(() => nativeSchemaView(project, 'treeview', { ...raw, nodes: [{ ...raw.nodes[0], parentId: 'absent' }] }, hooks)).toThrow('gap:')
})
test('Agentic usecase preserves record kinds and JSON key order; the absent normalized AST is unsupported', () => {
  const raw = { kind: 'usecase', direction: 'LR', nodes: [{ kind: 'actor', id: 'A', label: 'User', type: 'normal', labelType: 'text', business: false, classes: [], styles: [] }, { kind: 'usecase', id: 'B', label: 'Login', shape: 'ellipse', labelType: 'text', business: false, classes: [], styles: [] }], boundaries: [], relationships: [], notes: [], classDefs: [], jsonNodes: [{ id: 'J', value: { '2': 2, '1': 1 }, propertyOrder: [['', ['2', '1']]], classes: [], styles: [] }] }
  const view = nativeSchemaView(project, 'usecase', raw, hooks)
  expect([...view.getActors().keys()]).toEqual(['A'])
  expect(view.getUseCase('B').shape).toBe('ellipse')
  expect(view.getJsonNode('J').propertyOrder).toEqual({ '': ['2', '1'] })
  expect(view.getData().nodes.find((n: any) => n.id === 'A').shape).toBe('usecaseActor')
  expect(() => view.getAST()).toThrow('unsupported:')
})
test('Agentic agentflow translates native roles, markers, metadata and source positions', () => {
  const raw = { kind: 'agentflow', graph: { direction: 'TB', nodes: new Map([['a', { id: 'a', label: 'Alpha', shape: 'rectangle' }], ['b', { id: 'b', label: 'Beta', shape: 'subroutine' }]]), edges: [{ source: 'a', target: 'b', id: 'edge', label: 'yes', style: 'solid', hasArrowStart: false, hasArrowEnd: true }], subgraphs: [], classDefs: new Map(), classAssignments: new Map(), nodeStyles: new Map() }, roles: new Map([['a', 'task'], ['b', 'tool']]), metadata: new Map([['b', { shape: 'tool', owner: 'me' }]]), connectors: new Set(), globals: new Set(), mappings: [{ id: 'a', type: 'vertex', line: 2, col: 3, endLine: 2, endCol: 8 }] }
  const view = nativeSchemaView(project, 'agentflow', raw, hooks)
  expect(view.getVertices().get('b').type).toBe('subroutine')
  expect(view.getTools().map((n: any) => n.id)).toEqual(['b'])
  expect(view.getEdges()[0].type).toBe('arrow_point')
  expect(view.getSemanticModel().edges[0]).toEqual({ id: 'edge', start: 'a', end: 'b', label: 'yes', type: 'arrow_point', stroke: 'normal', length: 1, edgeSemantic: 'sequence' })
  expect(view.getSemanticModel().vertices[1].metadata).toEqual({ owner: 'me' })
  expect(view.getElementById('a').position.startColumn).toBe(2)
  expect(() => view.getDiagnostics()).toThrow('unsupported:')
  expect(() => view.getElementById('a').position.startIndex).toThrow('unsupported:')
})
