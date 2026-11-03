import { expect, test } from 'bun:test'
import { aggregateDrawingRows, mergeDrawingResults } from '../scripts/merge-drawing-results.ts'

const base = () => ({
  corpus: { cases: 2, ids: ['c1', 'c2'] }, versionsFrozenAt: 'freeze', blocked: [{ project: 'p', format: 'terminal', reason: 'old' }, { project: 'q', format: 'svg/png', reason: 'kept' }],
  results: [
    { project: 'p', version: '1', format: 'terminal', counts: { correct: 0, incorrect: 0, 'renderer-failure': 0, 'invalid-format': 0, unknown: 2, unrun: 0 } },
    { project: 'p', version: '1', format: 'svg', counts: { correct: 1, incorrect: 0, 'renderer-failure': 0, 'invalid-format': 0, unknown: 1, unrun: 0 } },
  ],
})

test('a recollected format replaces only that format and recounts totals', () => {
  const run = { state: 'complete', corpus: { ids: ['c1', 'c2'] }, versionsFrozenAt: 'freeze', blocked: [], rows: [
    { project: 'p', version: '1', format: 'terminal', caseId: 'c1', status: 'invalid-format', reason: 'Inadmissible terminal output: echoed source' },
    { project: 'p', version: '1', format: 'terminal', caseId: 'c2', status: 'unknown', reason: 'Required source facts lack qualified evidence: relationships' },
  ] }
  const merged = mergeDrawingResults(base(), run, ['terminal'])
  const terminal = merged.results.find((r: any) => r.format === 'terminal')
  expect(terminal.counts).toEqual({ correct: 0, incorrect: 0, 'renderer-failure': 0, 'invalid-format': 1, unknown: 1, unrun: 0 })
  expect(terminal.assessmentGapReasons).toEqual({ 'Required source facts lack qualified evidence: relationships': 1 })
  expect(merged.results.find((r: any) => r.format === 'svg').counts.correct).toBe(1)
  expect(merged.totals).toMatchObject({ correct: 1, 'invalid-format': 1, unknown: 2 })
  expect(merged.blocked).toEqual([{ project: 'q', format: 'svg/png', reason: 'kept' }])
})

test('a different corpus, freeze or incomplete case accounting cannot merge', () => {
  const run: any = { state: 'complete', corpus: { ids: ['c1'] }, versionsFrozenAt: 'freeze', blocked: [], rows: [] }
  expect(() => mergeDrawingResults(base(), run, ['terminal'])).toThrow('published corpus')
  expect(() => mergeDrawingResults(base(), { ...run, corpus: { ids: ['c1', 'c2'] }, versionsFrozenAt: 'other' }, ['terminal'])).toThrow('version freeze')
  expect(() => mergeDrawingResults(base(), { ...run, corpus: { ids: ['c1', 'c2'] }, rows: [{ project: 'p', version: '1', format: 'terminal', caseId: 'c1', status: 'correct' }] }, ['terminal'])).toThrow('every case')
  expect(() => aggregateDrawingRows([{ project: 'p', version: '1', format: 'svg', caseId: 'c1', status: 'correct' }, { project: 'p', version: '2', format: 'svg', caseId: 'c2', status: 'correct' }])).toThrow('Mixed versions')
})
