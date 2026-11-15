import { expect, test } from 'bun:test'
import { nativeSchemaView } from '../unified/mermaid-fidelity/schema-views.mjs'

// One rule for every class model that records namespaces by their written name: Mermaid's
// hierarchy is derived from the qualified name alone (classDb.ts addNamespace), so the views
// derive it the same way (views/misc.mjs qualifiedNamespaces). Native models are the probe
// outputs of the installed artifacts (docs/evidence/fidelity-model-concept-review-2026-11-14.json,
// concept class-ns-flat) for classDiagram.spec.ts's sources, trimmed to what the views read.
const verdicts = () => {
  const log: string[] = []
  return {
    log,
    hooks: {
      unavailable: (reason: string) => { log.push('gap: ' + reason); throw Error('gap') },
      unsupported: (reason: string) => { log.push('unsupported: ' + reason); throw Error('unsupported') },
    },
  }
}
const shape = (namespaces: Map<string, any>) => [...namespaces].map(([id, space]) => [id, space.parent, [...space.children.keys()], space.explicit, [...space.classes.keys()]])
// namespace Company.Project.Module.SubModule { class Report } / namespace Company.Project.Module { class Admin }
const MERMAID_DOTTED = [
  ['Company', undefined, ['Company.Project'], false, []],
  ['Company.Project', 'Company', ['Company.Project.Module'], false, []],
  ['Company.Project.Module', 'Company.Project', ['Company.Project.Module.SubModule'], true, ['Admin']],
  ['Company.Project.Module.SubModule', 'Company.Project.Module', [], true, ['Report']],
]

test('mermaid_core: Mermaid\'s namespace hierarchy from the recorded dotted ids; a brace-nested block keeps its bare id', () => {
  const dart = (namespaces: any[], classes: [string, any][]) => ({ classes: new Map(classes.map(([id, rest]) => [id, { id, label: id, annotations: [], attributes: [], methods: [], cssClasses: [], styles: new Map(), link: null, ...rest }])), relations: [], namespaces, notes: [], classDefs: new Map(), direction: 'tb', title: null })
  for (const project of ['orestesgaolin/mermaid', 'pub:mermaid_flutter']) {
    const { hooks, log } = verdicts()
    const view = nativeSchemaView(project, 'class', dart([{ id: 'Company.Project.Module.SubModule', label: 'Company.Project.Module.SubModule', classIds: ['Report'] }, { id: 'Company.Project.Module', label: 'Company.Project.Module', classIds: ['Admin'] }], [['Report', {}], ['Admin', {}]]), hooks)
    const namespaces = view.getNamespaces()
    expect(shape(namespaces)).toEqual(MERMAID_DOTTED)
    expect(view.getClass('Report').parent).toBe('Company.Project.Module.SubModule')
    expect(namespaces.get('Company.Project').label).toBe('Project')
    // A dotted leaf's label equal to its id: unwritten (Mermaid: 'SubModule') or written as the whole id.
    expect(() => namespaces.get('Company.Project.Module.SubModule').label).toThrow('unsupported')
    expect(log.at(-1)).toContain("records a dotted namespace's unwritten label as its whole id")
    // namespace Company.Project["Proj Label"] { class User }: the written label.
    expect(nativeSchemaView(project, 'class', dart([{ id: 'Company.Project', label: 'Proj Label', classIds: ['User'] }], [['User', {}]]), hooks).getNamespaces().get('Company.Project').label).toBe('Proj Label')
    // namespace Outer { namespace Inner { class Foo } class Baz }: Inner is recorded under its
    // bare id with no parent, and Foo is listed in both namespaces.
    const nested = nativeSchemaView(project, 'class', dart([{ id: 'Inner', label: 'Inner', classIds: ['Foo'] }, { id: 'Outer', label: 'Outer', classIds: ['Foo', 'Baz'] }], [['Foo', {}], ['Baz', {}]]), hooks)
    expect(shape(nested.getNamespaces())).toEqual([['Inner', undefined, [], true, ['Foo']], ['Outer', undefined, [], true, ['Foo', 'Baz']]])
    expect(nested.getClass('Baz').parent).toBe('Outer')
    expect(() => nested.getClass('Foo').parent).toThrow('unsupported')
    expect(log.at(-1)).toContain('lists a class in several namespaces')
  }
})

test('zombie-mermaid, beautiful-mermaid, ascii-mermaid, vitepress and XMermaid derive the same hierarchy from their written names', () => {
  const { hooks } = verdicts()
  const methods = [{ visibility: '+', name: 'm', isStatic: false, isAbstract: false, isMethod: true }]
  const graph = { classes: [{ id: 'Report', label: 'Report', attributes: [], methods }, { id: 'Admin', label: 'Admin', attributes: [], methods }], relationships: [], namespaces: [{ name: 'Company.Project.Module.SubModule', classIds: ['Report'] }, { name: 'Company.Project.Module', classIds: ['Admin'] }], interactions: new Map(), classDefs: new Map(), classAssignments: new Map(), nodeStyles: new Map(), notes: [] }
  for (const project of ['dfadler/zombie-mermaid', 'lukilabs/beautiful-mermaid', 'kais-radwan/ascii-mermaid']) {
    const view = nativeSchemaView(project, 'class', graph, hooks)
    expect(shape(view.getNamespaces())).toEqual(MERMAID_DOTTED)
    // Their parser records only a namespace written without a label: Mermaid's label is the last segment.
    expect([...view.getNamespaces().values()].map((space: any) => space.label)).toEqual(['Company', 'Project', 'Module', 'SubModule'])
  }
  // namespace Outer { namespace Inner { class Foo } class Baz }: only the innermost block is kept, under its bare name.
  const nested = nativeSchemaView('dfadler/zombie-mermaid', 'class', { ...graph, classes: [{ id: 'Foo', label: 'Foo', attributes: [], methods }, { id: 'Baz', label: 'Baz', attributes: [], methods }], namespaces: [{ name: 'Inner', classIds: ['Foo'] }] }, hooks)
  expect(shape(nested.getNamespaces())).toEqual([['Inner', undefined, [], true, ['Foo']]])
  const vitepress = nativeSchemaView('KlangHaus/vitepress-plugin-diagram', 'class', { classes: new Map([['Report', { id: 'Report', members: [], namespace: 'Company.Project.Module.SubModule' }], ['Admin', { id: 'Admin', members: [], namespace: 'Company.Project.Module' }]]), relationships: [], namespaces: [{ id: 'Company.Project.Module.SubModule', classIds: ['Report'] }, { id: 'Company.Project.Module', classIds: ['Admin'] }] }, hooks)
  expect(shape(vitepress.getNamespaces())).toEqual(MERMAID_DOTTED)
  // classDiagram / namespace Company.Project { class User } / namespace Company { class CEO }
  const xmermaid = nativeSchemaView('evangwt/xmermaid', 'class', { type: 'class', classes: [{ id: 'User', label: 'User', namespace: 'Company.Project' }, { id: 'CEO', label: 'CEO', namespace: 'Company' }], relations: [], namespaces: [{ id: 'Company.Project', classes: ['User'] }, { id: 'Company', classes: ['CEO'] }], direction: 'LR' }, hooks)
  expect(shape(xmermaid.getNamespaces())).toEqual([['Company', undefined, ['Company.Project'], true, ['CEO']], ['Company.Project', 'Company', [], true, ['User']]])
  expect(xmermaid.getClass('User').parent).toBe('Company.Project')
})

test('Frankenmermaid: dotted keys follow the shared rule; a brace-nested child keeps its bare key and stays unmapped', () => {
  const { hooks, log } = verdicts()
  const ir = (subgraphs: any[], labels: string[]) => ({ diagram_type: 'Class', direction: 'TB', nodes: [{ id: 'Report', shape: 'Rect', classes: [] }, { id: 'Admin', shape: 'Rect', classes: [] }], edges: [], labels: labels.map(text => ({ text })), graph: { subgraphs }, meta: {} })
  const dotted = nativeSchemaView('Dicklesworthstone/frankenmermaid', 'class', ir([{ id: 0, key: 'Company.Project.Module.SubModule', title: 0, children: [], members: [0] }, { id: 1, key: 'Company.Project.Module', title: 1, children: [], members: [1] }], ['Company.Project.Module.SubModule', 'Company.Project.Module']), hooks)
  expect(shape(dotted.getNamespaces())).toEqual(MERMAID_DOTTED)
  const nested = nativeSchemaView('Dicklesworthstone/frankenmermaid', 'class', ir([{ id: 0, key: 'Outer', title: 0, children: [1], members: [0, 1] }, { id: 1, key: 'Inner', title: 1, parent: 0, children: [], members: [0] }], ['Outer', 'Inner']), hooks)
  expect(() => nested.getNamespaces().get('Inner').parent).toThrow('unsupported')
  expect(log.at(-1)).toContain('nested namespaces are not mapped')
})

test("agentic-mermaid's view builds its qualified paths with the same shared rule", () => {
  const { hooks } = verdicts()
  // namespace Company.Project.Module.SubModule { class Report } / namespace Company.Project.Module { class Admin }
  const view = nativeSchemaView('adewale/agentic-mermaid', 'class', { kind: 'class', classes: [{ id: 'Report', members: [], namespace: 'Company.Project.Module.SubModule' }, { id: 'Admin', members: [], namespace: 'Company.Project.Module' }], relations: [], notes: [], namespaces: [{ name: 'Company.Project.Module.SubModule' }, { name: 'Company.Project.Module' }] }, hooks)
  expect(shape(view.getNamespaces())).toEqual(MERMAID_DOTTED)
  // namespace Outer { namespace Inner {…} }: agentic records the qualified 'Outer.Inner'.
  const nested = nativeSchemaView('adewale/agentic-mermaid', 'class', { kind: 'class', classes: [{ id: 'Foo', members: [], namespace: 'Outer.Inner' }, { id: 'Baz', members: [], namespace: 'Outer' }], relations: [], notes: [], namespaces: [{ name: 'Outer' }, { name: 'Outer.Inner' }] }, hooks)
  expect(shape(nested.getNamespaces())).toEqual([['Outer', undefined, ['Outer.Inner'], true, ['Baz']], ['Outer.Inner', 'Outer', [], true, ['Foo']]])
})
