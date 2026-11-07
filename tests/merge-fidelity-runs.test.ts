import { expect, test } from 'bun:test'
import { mergeFidelityRuns, mergeIntoPublished } from '../scripts/merge-fidelity-runs.ts'

const run = (results: any[], extra: any = {}) => ({ pin: 'p', selection: 'all core package tests', selectedFiles: 3, inventory: {}, outsideSelectedRunner: [], blocked: [], updatedAt: '2026-11-03T00:00:00Z', collectedThrough: '2026-11-03T00:00:00Z', results, ...extra })
const referenceCases = ['passed', 'passed', 'passed', 'passed', 'reference-unqualified', 'reference-unqualified', 'upstream-skipped'].map((status, i) => ({ file: 'x.spec.ts', name: 't' + i, status }))
const reference = { project: 'mermaid-js/mermaid', version: '12.2.0', missingFiles: [], cases: referenceCases }
const candidate = (project: string, passed: number, failed: number) => ({ project, version: '1', missingFiles: [], cases: referenceCases.map((c, i) => ({ ...c, ...(i < 4 ? { status: i < passed ? 'passed' : i < passed + failed ? 'failed' : 'trident-blocked', ...(i >= passed + failed ? { reason: 'TRIDENT_ADAPTER_GAP: parser 12' } : {}) } : {}) })) })

test('merging derives counts from the shared control population and keeps candidate gaps explicit', () => {
  const a = { ...candidate('a', 3, 1), counts: { passed: 999 } }
  const merged = mergeFidelityRuns([run([reference, a]), run([reference, candidate('b', 1, 0)], { blocked: [{ project: 'c', reason: 'no binding' }, { project: 'a', reason: 'stale' }] })])
  expect(merged.referenceQualifiedCallbacks).toBe(4)
  expect(merged.results.map(r => r.project)).toEqual(['mermaid-js/mermaid', 'a', 'b'])
  expect(merged.results[1]!.counts.passed).toBe(3)
  expect(merged.blocked).toEqual([{ project: 'c', reason: 'no binding' }])
  expect(merged.results[2]!.gapReasons).toEqual({ 'TRIDENT_ADAPTER_GAP: parser N': 3 })
  expect(merged.results[1]!.perFile).toEqual([{ path: 'x.spec.ts', counts: { passed: 3, failed: 1, 'reference-unqualified': 2, 'upstream-skipped': 1 } }])
})

test('a candidate with no assessable callback is unassessed, not a measured zero', () => {
  const merged = mergeFidelityRuns([run([reference, candidate('renderer-only', 0, 0)])])
  expect(merged.results.map(r => r.project)).toEqual(['mermaid-js/mermaid'])
  expect(merged.blocked).toEqual([{ project: 'renderer-only', reason: 'No original test reached a candidate operation: TRIDENT_ADAPTER_GAP: parser N' }])
})

test('different controls, selections and incomplete or substituted callbacks cannot merge', () => {
  expect(() => mergeFidelityRuns([run([reference]), run([reference], { selectedFiles: 2 })])).toThrow('one pin and file selection')
  expect(() => mergeFidelityRuns([run([candidate('a', 1, 0)])])).toThrow('no Mermaid control')
  expect(() => mergeFidelityRuns([run([reference, { ...candidate('a', 1, 0), cases: referenceCases.slice(0, 1) }])])).toThrow('every reference callback')
  const swapped = { ...reference, cases: referenceCases.map((c, i) => ({ ...c, status: i === 0 ? 'reference-unqualified' : i === 4 ? 'passed' : c.status })) }
  expect(() => mergeFidelityRuns([run([reference]), run([swapped, candidate('b', 4, 0)])])).toThrow('referenceDigest')
  const substituted = candidate('a', 4, 0); substituted.cases[1]!.name = 'a different test'
  expect(() => mergeFidelityRuns([run([reference, substituted])])).toThrow('callback population')
})

test('independent file completion order preserves callback ordinals and duplicate titles', () => {
  const control = { ...reference, cases: [
    { file: 'x.spec.ts', name: 'repeated title', status: 'reference-unqualified' },
    { file: 'x.spec.ts', name: 'repeated title', status: 'passed' },
    { file: 'y.spec.ts', name: 'another file', status: 'passed' },
  ] }
  const b = { ...candidate('b', 0, 0), cases: control.cases.map(c => ({ ...c, status: c.status === 'passed' ? 'failed' : c.status })) }
  const reorderFiles = (row: any) => ({ ...row, cases: [...row.cases.filter((c: any) => c.file === 'y.spec.ts'), ...row.cases.filter((c: any) => c.file === 'x.spec.ts')] })
  const merged = mergeFidelityRuns([run([control]), run([reorderFiles(control), reorderFiles(b)])])
  expect(merged.referenceQualifiedCallbacks).toBe(2)
  expect(merged.results.find(row => row.project === 'b')!.counts).toMatchObject({ passed: 0, failed: 2, 'reference-unqualified': 1 })

  const substituted = reorderFiles(b)
  substituted.cases[1].status = 'passed'
  substituted.cases[2].status = 'reference-unqualified'
  expect(() => mergeFidelityRuns([run([control]), run([reorderFiles(control), substituted])])).toThrow('callback population')
})

test('matching duplicate titles cannot hide a changed reference qualification', () => {
  const control = { ...reference, cases: [
    { file: 'x.spec.ts', name: 'repeated title', status: 'reference-unqualified' },
    { file: 'x.spec.ts', name: 'repeated title', status: 'passed' },
  ] }
  const swapped = { ...control, cases: [...control.cases].reverse() }
  const b = { ...candidate('b', 0, 0), cases: swapped.cases }
  expect(() => mergeFidelityRuns([run([control]), run([swapped, b])])).toThrow('reference callback order')
})

test('a partial re-run replaces only its projects, and only against the published control', () => {
  const published = mergeFidelityRuns([run([reference, candidate('a', 1, 3), candidate('b', 1, 0)])])
  expect(published.referenceDigest).toMatch(/^[0-9a-f]{64}$/)
  const updated = mergeIntoPublished(published, [run([reference, candidate('a', 3, 1)], { collectedThrough: '2026-11-05T00:00:00Z' })])
  expect(updated.results.map((r: any) => [r.project, r.counts.passed])).toEqual([['mermaid-js/mermaid', 4], ['a', 3], ['b', 1]])
  expect(updated.partialReruns).toEqual([{ projects: ['a'], collectedThrough: '2026-11-05T00:00:00Z' }])
  const otherControl = { ...reference, cases: referenceCases.map((c, i) => i === 4 ? { ...c, status: 'upstream-skipped' } : c) }
  expect(() => mergeIntoPublished(published, [run([otherControl])])).toThrow('referenceDigest')
  const { referenceDigest: _, ...undigested } = published
  expect(() => mergeIntoPublished(undigested, [run([reference, candidate('a', 3, 1)])])).toThrow('records no control digest')
})
