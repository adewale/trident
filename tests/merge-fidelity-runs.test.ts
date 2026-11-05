import { expect, test } from 'bun:test'
import { mergeFidelityRuns, mergeIntoPublished } from '../scripts/merge-fidelity-runs.ts'

const counts = (passed: number, failed: number, blocked: number, unqualified = 2) => ({ passed, failed, unsupported: 0, 'trident-blocked': blocked, 'reference-unqualified': unqualified, 'upstream-skipped': 1, 'upstream-expected-failure': 0 })
const run = (results: any[], extra: any = {}) => ({ pin: 'p', selection: 'all core package tests', selectedFiles: 3, inventory: {}, outsideSelectedRunner: [], blocked: [], updatedAt: '2026-11-03T00:00:00Z', collectedThrough: '2026-11-03T00:00:00Z', results, ...extra })
const referenceCases = ['passed', 'passed', 'passed', 'passed', 'reference-unqualified', 'reference-unqualified', 'upstream-skipped'].map((status, i) => ({ file: 'x.spec.ts', name: 't' + i, status }))
const reference = { project: 'mermaid-js/mermaid', version: '12.2.0', counts: counts(4, 0, 0), missingFiles: [], cases: referenceCases }

test('merging shares one control and keeps every candidate on the qualified population', () => {
  const merged = mergeFidelityRuns([
    run([reference, { project: 'a', version: '1', counts: counts(3, 1, 0), missingFiles: [], cases: [{ file: 'x.spec.ts', status: 'passed' }, { file: 'x.spec.ts', status: 'failed' }] }]),
    run([reference, { project: 'b', version: '2', counts: counts(1, 0, 3), missingFiles: [], cases: [{ file: 'y.spec.ts', status: 'trident-blocked', reason: 'TRIDENT_ADAPTER_GAP: parser 12' }] }], { blocked: [{ project: 'c', reason: 'no binding' }, { project: 'a', reason: 'stale' }] }),
  ])
  expect(merged.referenceQualifiedCallbacks).toBe(4)
  expect(merged.results.map(r => r.project)).toEqual(['mermaid-js/mermaid', 'a', 'b'])
  expect(merged.blocked).toEqual([{ project: 'c', reason: 'no binding' }])
  expect(merged.results[2]!.gapReasons).toEqual({ 'TRIDENT_ADAPTER_GAP: parser N': 1 })
  expect(merged.results[1]!.perFile).toEqual([{ path: 'x.spec.ts', counts: { passed: 1, failed: 1 } }])
})

test('a candidate with no assessable callback is unassessed, not a measured zero', () => {
  const merged = mergeFidelityRuns([run([reference, { project: 'renderer-only', version: '1', counts: counts(0, 0, 4), missingFiles: [], cases: [{ file: 'f', status: 'trident-blocked', reason: 'Installed public module has no synchronous flowchart parser binding' }] }])])
  expect(merged.results.map(r => r.project)).toEqual(['mermaid-js/mermaid'])
  expect(merged.blocked).toEqual([{ project: 'renderer-only', reason: 'No original test reached a candidate operation: Installed public module has no synchronous flowchart parser binding' }])
})

test('runs with different selections, missing controls or unaccounted callbacks cannot merge', () => {
  expect(() => mergeFidelityRuns([run([reference]), run([reference], { selectedFiles: 2 })])).toThrow('one pin and file selection')
  expect(() => mergeFidelityRuns([run([{ project: 'a', version: '1', counts: counts(1, 0, 0), missingFiles: [] }])])).toThrow('no Mermaid control')
  expect(() => mergeFidelityRuns([run([reference, { project: 'a', version: '1', counts: counts(1, 0, 0), missingFiles: [] }])])).toThrow('accounts for 1')
})

test('a partial re-run replaces only its projects, and only against the published control', () => {
  const a = (passed: number) => ({ project: 'a', version: '1', counts: counts(passed, 4 - passed, 0), missingFiles: [], cases: [] })
  const b = { project: 'b', version: '2', counts: counts(1, 0, 3), missingFiles: [], cases: [] }
  const published = mergeFidelityRuns([run([reference, a(1), b])])
  expect(published.referenceDigest).toMatch(/^[0-9a-f]{64}$/)
  const updated = mergeIntoPublished(published, [run([reference, a(3)], { collectedThrough: '2026-11-05T00:00:00Z' })])
  expect(updated.results.map((r: any) => [r.project, r.counts.passed])).toEqual([['mermaid-js/mermaid', 4], ['a', 3], ['b', 1]])
  expect(updated.partialReruns).toEqual([{ projects: ['a'], collectedThrough: '2026-11-05T00:00:00Z' }])
  // A re-run against a different control (one outcome changed) is refused.
  const otherControl = { ...reference, cases: referenceCases.map((c, i) => (i === 4 ? { ...c, status: 'passed' } : c)) }
  expect(() => mergeIntoPublished(published, [run([otherControl, a(3)])])).toThrow('referenceDigest')
  const { referenceDigest: _, ...undigested } = published
  expect(() => mergeIntoPublished(undigested, [run([reference, a(3)])])).toThrow('records no control digest')
})
