import { expect, test } from 'bun:test'
import { threeBenchmarkReport, renderThreeBenchmarkReport } from '../unified/three-benchmark-report.ts'

function fixture() {
  const runs = (format: string) => [1, 2, 3].flatMap(run => ['a', 'b'].map((project, index) => ({ project, version: '1.0.0', format, run, boundary: 'fixture public API', attempted: 10, completed: 10 - index, failed: index, timeouts: 0, totalMs: 100 + index })))
  const corpus = { commit: 'fixed', occurrences: 10 }
  return { images: { state: 'complete', corpus, runs: [...runs('svg'), ...runs('png')], blocked: [] }, terminal: { state: 'complete', corpus, runs: runs('terminal'), blocked: [] }, versions: { complete: true, rows: [{ project: 'a' }, { project: 'b' }] }, catalog: { nodes: ['a', 'b'].map(id => ({ id, benchmark: { outputs: ['svg', 'terminal'] } })) } }
}
test('the campaign report combines measured formats but withholds synthetic overall ranks when the other campaigns do not exist', () => {
  const { images, terminal, versions, catalog } = fixture()
  const report = threeBenchmarkReport(images, terminal, versions, catalog)
  expect(report.measurements.davebench.attemptedCalls).toBe(180)
  expect(report.rankings.terminal).toHaveLength(2)
  expect(report.overall.ranked).toEqual([])
  expect(report.overall.overallWinner).toBeNull()
  expect(report.overall.unranked.find(row => row.project === 'a')!.components.davebench.score).toBe(100)
  expect(report.overall.unranked.find(row => row.project === 'b')!.components.davebench.score).toBe(0)
  expect(renderThreeBenchmarkReport(report)).toContain('Unranked')
})
test('incomplete or mismatched workloads cannot be published, and missing applicable formats remain unknown', () => {
  const { images, terminal, versions, catalog } = fixture()
  expect(() => threeBenchmarkReport({ ...images, state: 'running' }, terminal, versions, catalog)).toThrow('complete')
  expect(() => threeBenchmarkReport(images, { ...terminal, corpus: { ...terminal.corpus, commit: 'different' } }, versions, catalog)).toThrow('one documentation corpus')
  terminal.runs = terminal.runs.filter(row => row.project !== 'a')
  const report = threeBenchmarkReport(images, terminal, versions, catalog)
  expect(report.overall.unranked.find(row => row.project === 'a')!.components.davebench.score).toBeNull()
})
