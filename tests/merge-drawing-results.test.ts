import { expect, test } from 'bun:test'
import { aggregateDrawingRows, mergeDrawingResults, publishDrawingRun } from '../scripts/merge-drawing-results.ts'

const base = () => ({
  corpus: { cases: 2, ids: ['c1', 'c2'] }, versionsFrozenAt: 'freeze', blocked: [{ project: 'p', format: 'terminal', reason: 'old' }, { project: 'q', format: 'svg/png', reason: 'kept' }],
  results: [
    { project: 'p', version: '1', format: 'terminal', counts: { correct: 0, incorrect: 0, 'renderer-failure': 0, 'invalid-format': 0, unknown: 2, unrun: 0 } },
    { project: 'p', version: '1', format: 'svg', counts: { correct: 1, incorrect: 0, 'renderer-failure': 0, 'invalid-format': 0, unknown: 1, unrun: 0 } },
  ],
})

test('a recollected format replaces only that format and recounts totals', () => {
  const run = { state: 'complete', updatedAt: '2026-11-05T17:02:59.000Z', corpus: { ids: ['c1', 'c2'] }, versionsFrozenAt: 'freeze', blocked: [], rows: [
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
  // The published date is when the run collected, never when it was merged.
  expect(merged.updatedAt).toBe('2026-11-05T17:02:59.000Z')
  expect(() => mergeDrawingResults(base(), { ...run, updatedAt: undefined }, ['terminal'])).toThrow('collection time')
})

test('a different corpus, operand or incomplete case accounting cannot merge', () => {
  const run: any = { state: 'complete', corpus: { ids: ['c1'] }, versionsFrozenAt: 'freeze', blocked: [], rows: [] }
  expect(() => mergeDrawingResults(base(), run, ['terminal'])).toThrow('published corpus')
  expect(() => mergeDrawingResults(base(), { ...run, corpus: { ids: ['c1', 'c2'] }, rows: [{ project: 'p', version: '2', format: 'terminal', caseId: 'c1', status: 'correct' }] }, ['terminal'])).toThrow('frozen project/format version')
  expect(() => mergeDrawingResults(base(), { ...run, corpus: { ids: ['c1', 'c2'] }, rows: [{ project: 'p', version: '1', format: 'terminal', caseId: 'c1', status: 'correct' }] }, ['terminal'])).toThrow('every case')
  expect(() => aggregateDrawingRows([{ project: 'p', version: '1', format: 'svg', caseId: 'c1', status: 'correct' }, { project: 'p', version: '2', format: 'svg', caseId: 'c2', status: 'correct' }], ['c1', 'c2'])).toThrow('Mixed versions')
})

test('one complete run publishes every format, dated by its own collection', () => {
  const rows = ['svg', 'terminal'].flatMap(format => ['c1', 'c2'].map(caseId => ({ project: 'p', version: '1', format, caseId, status: caseId === 'c1' ? 'correct' : 'incorrect' })))
  const run = { benchmark: 'Drawing Correctness', state: 'complete', startedAt: '2026-11-05T17:00:00.000Z', updatedAt: '2026-11-05T17:02:59.000Z', corpus: { cases: 2, ids: ['c1', 'c2'] }, versionsFrozenAt: 'freeze', blocked: [], rows }
  const published = publishDrawingRun(run)
  expect(published.formats).toEqual(['svg', 'terminal'])
  expect(published.totals).toMatchObject({ correct: 2, incorrect: 2 })
  expect(published.updatedAt).toBe('2026-11-05T17:02:59.000Z')
  expect(published.collection).toMatchObject({ startedAt: '2026-11-05T17:00:00.000Z', finishedAt: '2026-11-05T17:02:59.000Z' })
  expect('rows' in published).toBe(false)
  expect(() => publishDrawingRun({ ...run, state: 'running' })).toThrow('not complete')
  expect(() => publishDrawingRun({ ...run, rows: [rows[0], rows[0]] })).toThrow('duplicate drawing case')
  expect(() => publishDrawingRun({ ...run, rows: [{ ...rows[0], caseId: 'not-in-the-corpus' }, rows[1]] })).toThrow('Unknown')
})

test('a partial project rerun preserves other projects in the same format, including blockers', () => {
  const published = base()
  published.results.push({ ...published.results[1]!, project: 'q' })
  const rows = ['c1', 'c2'].map(caseId => ({ project: 'p', version: '1', format: 'svg', caseId, status: 'correct' }))
  const merged = mergeDrawingResults(published, { state: 'complete', updatedAt: '2026-11-05T17:02:59.000Z', corpus: published.corpus, versionsFrozenAt: 'freeze', rows, blocked: [] }, ['svg'])
  expect(merged.results.find((row: any) => row.project === 'q')).toEqual(published.results[2])
  expect(merged.blocked).toEqual(published.blocked)
})

test('a partial recollection replaces its runtime binding and removes stale bindings when blocked', () => {
  const published = { ...base(), runtimeBindings: [{ project: 'p', format: 'svg', binding: 'kept' }, { project: 'p', format: 'terminal', binding: 'old' }] }
  const run = { state: 'complete', updatedAt: '2026-11-05T17:02:59.000Z', corpus: published.corpus, versionsFrozenAt: 'freeze', blocked: [], rows: ['c1', 'c2'].map(caseId => ({ project: 'p', version: '1', format: 'terminal', caseId, status: 'correct' })), runtimeBindings: [{ project: 'p', format: 'terminal', binding: 'new' }] }
  expect(mergeDrawingResults(published, run, ['terminal']).runtimeBindings).toEqual([published.runtimeBindings[0], run.runtimeBindings[0]])
  expect(mergeDrawingResults(published, { ...run, rows: [], blocked: [{ project: 'p', format: 'terminal', reason: 'unavailable' }], runtimeBindings: [] }, ['terminal']).runtimeBindings).toEqual([published.runtimeBindings[0]])
})


test('collection freeze timestamps are provenance; actual frozen versions decide compatibility', () => {
  const run = { state: 'complete', updatedAt: '2026-11-08T12:00:00Z', versionsFrozenAt: 'new editorial date', corpus: base().corpus, blocked: [], rows: ['c1', 'c2'].map(caseId => ({ project: 'p', version: '1', format: 'terminal', caseId, status: 'correct' })) }
  expect(mergeDrawingResults(base(), run, ['terminal']).totals.correct).toBe(3)
  expect(() => mergeDrawingResults(base(), { ...run, rows: run.rows.map(row => ({ ...row, version: '2' })) }, ['terminal'])).toThrow('frozen project/format version')
})

test('same-version artifact substitutions cannot hide behind an unchanged freeze date', async () => {
  const { campaignPlan } = await import('../unified/campaign-plan.ts')
  const operand = { sha256: 'first bytes', integrity: 'download identity' }
  const lane = { project: 'p', version: '1', format: 'terminal', operand }
  const published = { ...base(), plan: campaignPlan([lane], ['c1', 'c2'], 1, {}) }
  const run = { state: 'complete', updatedAt: '2026-11-08T12:00:00Z', corpus: published.corpus, versionsFrozenAt: 'any editorial date', plan: campaignPlan([{ ...lane, operand: { integrity: operand.integrity, sha256: operand.sha256 } }], ['c1', 'c2'], 1, {}), blocked: [], rows: ['c1', 'c2'].map(caseId => ({ project: 'p', version: '1', format: 'terminal', caseId, status: 'correct' })) }
  const merged = mergeDrawingResults(published, run, ['terminal'])
  expect(merged.results.find((row: any) => row.format === 'terminal').operand).toEqual(operand)
  expect(() => mergeDrawingResults(published, { ...run, plan: campaignPlan([{ ...lane, operand: { ...operand, sha256: 'substituted bytes' } }], ['c1', 'c2'], 1, {}) }, ['terminal'])).toThrow('frozen artifact bytes')
})

test('partial reassessment preserves each lane\'s producer instead of claiming one global observer', () => {
  const published = { ...base(), observerSources: { svg: { producer: 'old SVG' }, terminal: { producer: 'old terminal' } } }
  const run = { state: 'complete', updatedAt: '2026-11-08T12:00:00Z', corpus: published.corpus, versionsFrozenAt: 'later check', observerSources: { svg: { producer: 'new SVG' } }, blocked: [], rows: ['c1', 'c2'].map(caseId => ({ project: 'p', version: '1', format: 'svg', caseId, status: 'correct' })) }
  const merged = mergeDrawingResults(published, run, ['svg'])
  expect(merged.observerSources).toBeUndefined()
  expect(merged.results.find((row: any) => row.format === 'svg').observerSources).toEqual({ producer: 'new SVG' })
  expect(merged.results.find((row: any) => row.format === 'terminal').observerSources).toEqual({ producer: 'old terminal' })
})


test('publication keeps capture counts without duplicating the raw output manifest', () => {
  const rows = ['c1', 'c2'].map(caseId => ({ project: 'p', version: '1', format: 'terminal', caseId, status: 'correct' }))
  const run = { state: 'complete', updatedAt: '2026-11-08T12:00:00Z', corpus: { cases: 2, ids: ['c1', 'c2'] }, rows, blocked: [], outputs: rows.map(row => ({ project: row.project, caseId: row.caseId, format: row.format, outputSha256: 'retained-object' })) }
  const published = publishDrawingRun(run)
  expect(published.collection).toMatchObject({ outputsRetained: true, returnedOutputs: 2 })
  expect('outputs' in published).toBe(false)
  expect('rows' in published).toBe(false)
})

test('a merged format carries the font record of the machine that reassessed it', () => {
  const fonts = (sha256: string) => ({ fonts: { families: ['DejaVu Sans'], sha256 } })
  const published = { ...base(), assessmentEnvironments: { svg: fonts('old-svg'), terminal: fonts('old-terminal') }, observerSources: { svg: { producer: 'old SVG' }, terminal: { producer: 'old terminal' } } }
  const run = { state: 'complete', updatedAt: '2026-11-08T12:00:00Z', corpus: published.corpus, versionsFrozenAt: 'later check', assessmentEnvironments: { svg: fonts('new-svg'), terminal: fonts('new-terminal') }, observerSources: { svg: { producer: 'new SVG' } }, blocked: [], rows: ['c1', 'c2'].map(caseId => ({ project: 'p', version: '1', format: 'svg', caseId, status: 'correct' })) }
  const merged = mergeDrawingResults(published, run, ['svg'])
  expect(merged.assessmentEnvironments).toEqual({ svg: fonts('new-svg'), terminal: fonts('old-terminal') })
})
