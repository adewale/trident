import { expect } from 'bun:test'
import { resolve } from 'node:path'
import { assertMermaidOracle, mermaidVerdicts } from '../portable/mermaid-oracle.ts'
import { qualifyOutput } from '../unified/qualification.ts'
import { testWithAgentic } from './helpers/environment.ts'

testWithAgentic('balanced native-family inputs have distinct feature witnesses qualified at the Agentic public SVG boundary', async () => {
  const { buildBalancedPortfolio, FAMILY_QUOTA } = await import('../unified/family-portfolio.ts')
  const api = await import('../../../src/agent/core.ts')
  const root = resolve(import.meta.dir, '../../..')
  const portfolio = buildBalancedPortfolio(root)
  for (const family of ['eventmodeling', 'zenuml']) {
    const cases = portfolio.filter(entry => entry.family === family)
    expect(cases).toHaveLength(FAMILY_QUOTA)
    expect(new Set(cases.map(entry => entry.source)).size).toBe(FAMILY_QUOTA)
    // Mermaid's ZenUML plugin parse() is intentionally a no-op. Its Node
    // acceptance cannot validate the DSL; a published-addon browser render is
    // a separate required baseline check, not evidence supplied by this test.
    if (family === 'eventmodeling') {
      const verdicts = await mermaidVerdicts(assertMermaidOracle(), cases.map(entry => entry.source))
      for (const [index, entry] of cases.entries()) expect(verdicts[index]?.accepted, `${entry.origin}: ${JSON.stringify(verdicts[index])}`).toBe(true)
    }
    for (const entry of cases) {
      expect(entry.expectedLabels?.length).toBeGreaterThan(0)
      const output = api.renderMermaidSVG(entry.source)
      const qualification = qualifyOutput({ id: entry.origin, family, source: entry.source, features: [entry.sourceClass], provenance: entry.origin, expectedLabels: [...entry.expectedLabels!] }, output, 'svg')
      expect(qualification.ok, `${entry.origin}: ${JSON.stringify(qualification.findings)}`).toBe(true)
    }
  }
})

testWithAgentic('native blank-build witnesses exercise connectivity rather than metadata alone', async () => {
  const api = await import('../../../src/agent/core.ts')
  const { structuralBuildWitnessForFamily } = await import('../unified/family-suite.ts')
  for (const [family, nodes, edges] of [['eventmodeling', 3, 2], ['zenuml', 2, 2]] as const) {
    const ops = structuralBuildWitnessForFamily(api, family)
    expect(ops).toBeDefined()
    const built = api.applyOps({ family, ops: ops! })
    if (!built.ok) throw Error(JSON.stringify(built.error))
    expect(built.verify.ok).toBe(true)
    const parsed = api.parseRegisteredMermaid(built.source)
    if (!parsed.ok) throw Error(JSON.stringify(parsed.error))
    const layout = api.layoutMermaid(parsed.value)
    expect(layout.nodes).toHaveLength(nodes)
    expect(layout.edges).toHaveLength(edges)
    expect(qualifyOutput({ id: `build:${family}`, family, source: built.source, features: ['typed-build'], provenance: 'authored structural operations', expectedLabels: ['UnifiedBenchmarkWitness'] }, api.renderMermaidSVG(parsed.value), 'svg').ok).toBe(true)
  }
})

testWithAgentic('Kanban keyword-safe encoding preserves independently authored labels, identities and arbitrary metadata', async () => {
  const api = await import('../../../src/agent/core.ts')
  const { sameFacts } = await import('../unified/family-suite.ts')
  const source = 'kanban\n  doing[In progress]\n    kanban[Kanban family]@{ assigned: "Alex", ticket: "AM-409", custom: "retained" }'
  const parse = (text: string) => {
    const result = api.parseRegisteredMermaid(text)
    if (!result.ok) throw Error(JSON.stringify(result.error))
    return result.value
  }
  const before = parse(source), serialized = api.serializeMermaid(before), after = parse(serialized)
  if (after.body.kind !== 'kanban' || before.body.kind !== 'kanban') throw Error('Expected native Kanban models')
  const task = after.body.columns[0]!.tasks[0]!
  expect(task.sourceId).toBe('kanban')
  expect(task.label).toBe('Kanban family')
  expect(task.metadata).toMatchObject({ assigned: 'Alex', ticket: 'AM-409', custom: 'retained', label: 'Kanban family' })
  expect(sameFacts(api, before, after, source)).toEqual([])
  // Missing source ownership cannot authorize a normalization inferred solely
  // from candidate output, even when its observed metadata happens to agree.
  expect(sameFacts(api, before, after)).not.toEqual([])
  for (const change of ['label', 'sourceId', 'ticket', 'nested-metadata', 'column-metadata'] as const) {
    const changed = structuredClone(after)
    if (changed.body.kind !== 'kanban') throw Error('Expected Kanban')
    const target = changed.body.columns[0]!.tasks[0]!
    if (change === 'label') { target.label = 'Changed label'; target.metadata.label = target.label }
    if (change === 'sourceId') target.sourceId = 'other'
    if (change === 'ticket') delete target.metadata.ticket
    if (change === 'nested-metadata') target.metadata.custom = { retained: false }
    if (change === 'column-metadata') changed.body.columns[0]!.metadata.extra = 'invented'
    expect(sameFacts(api, before, changed, source), change).not.toEqual([])
  }
  const authoredLabel = source.replace('ticket: "AM-409",', 'ticket: "AM-409", label: "Kanban family",')
  const original = parse(authoredLabel), lost = structuredClone(original)
  if (lost.body.kind !== 'kanban') throw Error('Expected Kanban')
  delete lost.body.columns[0]!.tasks[0]!.metadata.label
  expect(sameFacts(api, original, lost, authoredLabel)).not.toEqual([])
  const columnSource = 'kanban\n  kanban[Kanban column]@{ custom: "retained" }\n    task[Work]'
  const columnBefore = parse(columnSource), columnAfter = parse(api.serializeMermaid(columnBefore))
  expect(sameFacts(api, columnBefore, columnAfter, columnSource)).toEqual([])
  if (columnAfter.body.kind !== 'kanban') throw Error('Expected Kanban')
  delete columnAfter.body.columns[0]!.metadata.custom
  expect(sameFacts(api, columnBefore, columnAfter, columnSource)).not.toEqual([])
})


testWithAgentic('Kanban effective icons survive equivalent metadata encoding without hiding authored changes', async () => {
  const api = await import('../../../src/agent/core.ts')
  const { sameFacts } = await import('../unified/family-suite.ts')
  const parse = (source: string) => {
    const result = api.parseRegisteredMermaid(source)
    if (!result.ok) throw Error(JSON.stringify(result.error))
    return result.value
  }
  for (const decorations of ['::icon(bomb)', ':::m-4 p-8\n    ::icon(bomb)', '::icon(bomb)\n    :::m-4 p-8']) {
    const source = `kanban\n    root[The root]\n    ${decorations}\n    `
    const original = parse(source), again = parse(api.serializeMermaid(original))
    expect(sameFacts(api, original, again, source), decorations).toEqual([])
  }
  const source = 'kanban\n  root[The root]@{ custom: "root-retained" }\n  ::icon(bomb)\n  :::column\n    task[Work]@{ assigned: "Alex", custom: "task-retained" }\n    ::icon(star)\n    :::card\n    next[Next]'
  const original = parse(source), again = parse(api.serializeMermaid(original))
  const body = (diagram: typeof original) => {
    if (diagram.body.kind !== 'kanban') throw Error('Expected Kanban')
    return diagram.body
  }
  const item = (diagram: typeof original, scope: 'column' | 'task') => scope === 'column' ? body(diagram).columns[0]! : body(diagram).columns[0]!.tasks[0]!
  expect(sameFacts(api, original, again, source)).toEqual([])
  for (const scope of ['column', 'task'] as const) {
    const redundant = structuredClone(original)
    item(redundant, scope).metadata.icon = item(redundant, scope).icon
    // Matching reserved metadata is redundant in either direction, including
    // task metadata facts; neither direction may discard the explicit icon.
    expect(sameFacts(api, original, redundant, source), scope).toEqual([])
    expect(sameFacts(api, redundant, original, source), scope).toEqual([])
    for (const change of ['changed-icon', 'dropped-icon', 'label', 'sourceId', 'id', 'class', 'custom'] as const) {
      const changed = structuredClone(again), target = item(changed, scope)
      if (change === 'changed-icon') target.icon = 'changed-icon'
      if (change === 'dropped-icon') delete target.icon
      if (change === 'label') target.label = 'changed label'
      if (change === 'sourceId') target.sourceId = 'changed-source-id'
      if (change === 'id') target.id = 'changed-public-id'
      if (change === 'class') target.className = 'changed-class'
      if (change === 'custom') delete target.metadata.custom
      expect(sameFacts(api, original, changed, source), `${scope}:${change}`).not.toEqual([])
    }
  }
  const reordered = structuredClone(again)
  body(reordered).columns[0]!.tasks.reverse()
  expect(sameFacts(api, original, reordered, source)).not.toEqual([])
  const conflictingSource = source.replace('custom: "root-retained"', 'icon: "authored-column", custom: "root-retained"').replace('assigned: "Alex"', 'icon: "authored-task", assigned: "Alex"')
  const conflicting = parse(conflictingSource)
  for (const scope of ['column', 'task'] as const) {
    for (const change of ['lost', 'overwritten'] as const) {
      const changed = structuredClone(conflicting), target = item(changed, scope)
      if (change === 'lost') delete target.metadata.icon
      else target.metadata.icon = target.icon
      expect(sameFacts(api, conflicting, changed, conflictingSource), `${scope}:${change}`).not.toEqual([])
    }
  }
})
