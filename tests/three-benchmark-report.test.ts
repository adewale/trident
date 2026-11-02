import { expect, test } from 'bun:test'
import { threeBenchmarkReport, renderThreeBenchmarkReport } from '../unified/three-benchmark-report.ts'

function fixture() {
  const runs = (format: string) => [1, 2, 3].flatMap(run => ['a', 'b'].map((project, index) => ({ project, version: '1.0.0', format, run, boundary: 'fixture public API', attempted: 10, completed: 10 - index, failed: index, timeouts: 0, totalMs: 100 + index })))
  const corpus = { commit: 'fixed', occurrences: 10 }
  return { images: { state: 'complete', corpus, runs: [...runs('svg'), ...runs('png')], blocked: [] }, terminal: { state: 'complete', corpus, runs: runs('terminal'), blocked: [] } }
}
test('report measured formats directly without requiring another catalog or synthesizing missing benchmark scores', () => {
  const { images, terminal } = fixture()
  const report = threeBenchmarkReport(images, terminal)
  expect(report.measurements.davebench.attemptedCalls).toBe(180)
  expect(report.rankings.terminal.map(row => row.project)).toEqual(['a', 'b'])
  expect(report).not.toHaveProperty('overall')
  const text = renderThreeBenchmarkReport(report)
  expect(text).toContain('remain unimplemented')
  expect(text).not.toContain('equal-weight synthesis')
})
test('incomplete or mismatched workloads cannot be published', () => {
  const { images, terminal } = fixture()
  expect(() => threeBenchmarkReport({ ...images, state: 'running' }, terminal)).toThrow('complete')
  expect(() => threeBenchmarkReport(images, { ...terminal, corpus: { ...terminal.corpus, commit: 'different' } })).toThrow('one documentation corpus')
})
