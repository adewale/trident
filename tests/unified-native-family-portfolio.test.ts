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
