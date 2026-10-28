// Isolated archived strict-observer repair; not a replacement for the current public runner.
import { expect, test } from 'bun:test'
import { portableCases, type PortableCase } from '../portable/cohorts.ts'
import { portableCaseForAdapter } from '../portable/render-intent.ts'
import { qualifyPortable } from '../portable/fidelity.ts'
import { parsePortableOptions, selectPortableCases } from '../portable/run.ts'
import { portableSummary } from '../portable/report.ts'

const source = 'flowchart TB\nA[Current] --> B[Configuration]'
const testCase: PortableCase = {
  id: 'adversarial:configuration-reset', family: 'flowchart', cohort: 'adversarial', source,
  expected: { accept: true, labels: ['Current', 'Configuration'], topology: { nodes: ['A', 'B'], edges: [{ source: 'A', target: 'B' }] } },
  renderIntent: { nodeLabelFontSize: 14 },
  edit: { source, expected: { accept: true, labels: ['Current', 'Configuration'], topology: { nodes: ['A', 'B'], edges: [{ source: 'A', target: 'B' }] } }, renderIntent: { nodeLabelFontSize: 24 } },
}

test('a neutral node-label intent uses the actual reviewed public option for each adapter', () => {
  const original = structuredClone(testCase)
  expect(portableCaseForAdapter('agentic', testCase).renderOptions).toEqual({ style: { roles: { node: { fontSize: 14 } } } })
  expect(portableCaseForAdapter('agentic', testCase).edit?.renderOptions).toEqual({ style: { roles: { node: { fontSize: 24 } } } })
  expect(portableCaseForAdapter('pele', testCase).renderOptions).toEqual({ fontSize: 14 })
  expect(portableCaseForAdapter('pele', testCase).edit?.renderOptions).toEqual({ fontSize: 24 })
  expect(testCase).toEqual(original)
  expect(() => portableCaseForAdapter('unreviewed', testCase)).toThrow('No reviewed')
  expect(() => portableCaseForAdapter('agentic', { ...testCase, renderIntent: null as any })).toThrow('Invalid declared')
})

test('actual raw options remain raw and existing style stack leaves survive intent mapping', () => {
  const raw: PortableCase = { ...testCase, renderIntent: undefined, edit: undefined, renderOptions: { fontSize: 14 } }
  expect(portableCaseForAdapter('agentic', raw)).toBe(raw)
  expect(portableCaseForAdapter('agentic', raw).renderOptions).toEqual({ fontSize: 14 })
  const composed = portableCaseForAdapter('agentic', { ...testCase, renderOptions: { bg: '#fff', style: 'dracula' } })
  expect(composed.renderOptions).toEqual({ bg: '#fff', style: ['dracula', { roles: { node: { fontSize: 14 } } }] })
})

const svg = (size: number, rootSize = size) => `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="140" style="font-size:${rootSize}px"><g class="node" data-id="A"><rect x="0" y="0" width="80" height="40"/><text font-size="${size}">Current</text></g><g class="node" data-id="B"><rect x="0" y="80" width="200" height="40"/><text font-size="${size}">Configuration</text></g></svg>`
const fontChecks = (value: ReturnType<typeof qualifyPortable>) => value.checks.filter(check => check.name.startsWith('svg-node-label-font'))

test('owned node declarations must match the edited intent; a root-font spoof cannot pass', () => {
  const edited = { ...testCase, renderIntent: testCase.edit!.renderIntent!, expected: testCase.edit!.expected }
  expect(fontChecks(qualifyPortable(edited, { adapter: 'agentic', svg: svg(24) })).every(check => check.status === 'passed')).toBe(true)
  expect(fontChecks(qualifyPortable(edited, { adapter: 'agentic', svg: svg(14, 24) })).some(check => check.status === 'failed')).toBe(true)
  const unsupportedUnit = svg(24).replaceAll('font-size="24"', 'font-size="2em"')
  expect(fontChecks(qualifyPortable(edited, { adapter: 'agentic', svg: unsupportedUnit })).some(check => check.status === 'failed')).toBe(true)
  const localOverride = svg(24).replaceAll('<text font-size="24">', '<text style="font-size:14px !important" font-size="24">')
  expect(fontChecks(qualifyPortable(edited, { adapter: 'agentic', svg: localOverride })).some(check => check.status === 'failed')).toBe(true)
  const hidden = svg(24).replace('<g class="node" data-id="A">', '<g class="node" data-id="A" style="display:none">')
  expect(fontChecks(qualifyPortable(edited, { adapter: 'agentic', svg: hidden })).some(check => check.status === 'failed')).toBe(true)
  // Typography checks are a declared projection, not a full semantic certificate.
  expect(qualifyPortable(edited, { adapter: 'agentic', svg: svg(24) }).semanticComplete).toBe(false)
})

test('explicit case selection rejects typos/duplicates and keeps actual source order', () => {
  const cases = portableCases()
  expect(selectPortableCases(cases, ['adversarial:configuration-reset']).map(item => item.id)).toEqual(['adversarial:configuration-reset'])
  expect(() => selectPortableCases(cases, ['missing'])).toThrow()
  expect(() => selectPortableCases(cases, ['adversarial:configuration-reset', 'adversarial:configuration-reset'])).toThrow()
  expect(selectPortableCases(cases)).toBe(cases)
  expect(parsePortableOptions(['--project', 'adewale/agentic-mermaid', '--artifact-root', '/tmp/unused', '--cases', 'adversarial:configuration-reset']).caseIds).toEqual(['adversarial:configuration-reset'])
})

test('a single adversarial case declares one positive family without activating unrelated cases', () => {
  const cases = portableCases()
  const original = JSON.stringify(cases)
  const settings = { rounds: 6, samples: 31, coldSamples: 20, maximumControlSpread: 0.25 }
  const selected = selectPortableCases(cases, ['adversarial:configuration-reset'])
  const summary = portableSummary(selected, [], settings)
  expect(summary.counts.cases).toBe(1)
  expect(summary.counts.families).toBe(1)
  expect(summary.counts.canonicalFamilyRepresentatives).toBe(0)
  expect(summary.cases.map(item => item.id)).toEqual(['adversarial:configuration-reset'])
  expect(JSON.stringify(cases)).toBe(original)
  expect(portableSummary(cases, [], settings).counts.families).toBe(25)
  expect(portableSummary(selectPortableCases(cases, ['invalid:unknown-header']), [], settings).counts.families).toBe(0)
})
