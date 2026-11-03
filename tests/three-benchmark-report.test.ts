import { expect, test } from 'bun:test'
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { writeSnapshot } from '../unified/results-snapshot.ts'
import { threeBenchmarkReport, renderThreeBenchmarkReport, renderBenchmarkLeagues } from '../unified/three-benchmark-report.ts'

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
  expect(text).toContain('This report contains DaveBench only')
  expect(text).not.toContain('| Project | Version |')
  expect(text).not.toContain('equal-weight synthesis')
})
test('incomplete or mismatched workloads cannot be published', () => {
  const { images, terminal } = fixture()
  expect(() => threeBenchmarkReport({ ...images, state: 'running' }, terminal)).toThrow('complete')
  expect(() => threeBenchmarkReport(images, { ...terminal, corpus: { ...terminal.corpus, commit: 'different' } })).toThrow('one documentation corpus')
})

function leaguesFixture() {
  const { images, terminal } = fixture()
  const davebench = threeBenchmarkReport(images, terminal)
  const drawing = { state: 'complete', corpus: { cases: 2 }, blocked: [], results: ['a', 'b'].map(project => ({ project, version: '1.0.0', format: 'svg', counts: { correct: 1, incorrect: 0, 'renderer-failure': 0, 'invalid-format': 0, unknown: 1, unrun: 0 } })) }
  const fidelity = { referenceQualifiedCallbacks: 2, results: [{ project: 'a', version: '1.0.0', counts: { passed: 1, failed: 1, unsupported: 0, 'trident-blocked': 0 } }], blocked: [{ project: 'b' }] }
  const catalog = { nodes: ['a', 'b'].map(id => ({ id, benchmark: { version: '1.0.0', outputs: ['svg'] } })) }
  return { davebench, drawing, fidelity, catalog }
}
test('the landing page contains all three leagues, one project-version label and no method prose', () => {
  const { davebench, drawing, fidelity, catalog } = leaguesFixture()
  const before = JSON.stringify({ davebench, drawing, fidelity })
  const page = renderBenchmarkLeagues(davebench, drawing, fidelity, catalog, { a: 'Alpha', b: 'Beta' })
  expect(page.match(/^## .+$/gm)).toEqual(['## DaveBench', '## Drawing Correctness', '## Mermaid Fidelity', '## Equal-weight synthesis'])
  expect(page).toContain('| 1 | Alpha 1.0.0 |')
  expect(page).not.toContain('| Version |')
  expect(page).toContain('### Terminal rendering')
  expect(page).toContain('### Terminal correctness')
  expect(page).not.toContain('### Terminal text')
  expect(page).toContain('| 1 | Beta 1.0.0 | 1 | 0 | 1 |') // equal drawing passes tie
  expect(page).toContain('| — | Beta 1.0.0 | Not run | — | 2 |') // missing adapter is not zero
  expect(page).not.toContain('remain unimplemented')
  expect(page.split('\n').every(line => !line || /^[#|[]/.test(line))).toBe(true)
  expect(JSON.stringify({ davebench, drawing, fidelity })).toBe(before)
})
test('observed zero and wholly unassessed drawing outputs remain different', () => {
  const { davebench, drawing, fidelity, catalog } = leaguesFixture()
  drawing.results[0]!.counts = { correct: 0, incorrect: 2, 'renderer-failure': 0, 'invalid-format': 0, unknown: 0, unrun: 0 }
  drawing.results[1]!.counts = { correct: 0, incorrect: 0, 'renderer-failure': 0, 'invalid-format': 0, unknown: 2, unrun: 0 }
  const page = renderBenchmarkLeagues(davebench, drawing, fidelity, catalog)
  expect(page).toContain('| 1 | a 1.0.0 | 0 | 2 | 0 |')
  expect(page.split('## Drawing Correctness')[1]!.split('## Mermaid Fidelity')[0]).toContain('| — | b 1.0.0 | Not assessed | — | 2 |')
})

test('snapshot regeneration reads all three current results rather than reviving the legacy page', () => {
  const { davebench, drawing, fidelity, catalog } = leaguesFixture()
  const root = mkdtempSync(join(tmpdir(), 'trident-current-leagues-'))
  const files = ['docs/evidence/benchmark-campaign-2026-11-02/report.json', 'results/drawing-correctness-2026-11-02.json', 'results/mermaid-fidelity-2026-11-02.json', 'docs/evidence/benchmark-campaign-2026-11-02/catalog.json']
  try {
    const data = [davebench, drawing, fidelity, catalog]
    for (let i = 0; i < files.length; i++) { const path = join(root, files[i]!); mkdirSync(join(path, '..'), { recursive: true }); writeFileSync(path, JSON.stringify(data[i])) }
    const legacy = { schema: 'trident-results-snapshot-v1' as const, tables: [], attempts: [] }
    writeSnapshot(legacy, catalog as any, root)
    expect(readFileSync(join(root, 'RESULTS.md'), 'utf8')).toContain('## Mermaid Fidelity')
    writeSnapshot(legacy, catalog as any, root, true)
    fidelity.results[0]!.counts.passed = 2; fidelity.results[0]!.counts.failed = 0
    writeFileSync(join(root, files[2]!), JSON.stringify(fidelity))
    expect(() => writeSnapshot(legacy, catalog as any, root, true)).toThrow('stale')
    rmSync(join(root, files[2]!))
    expect(() => writeSnapshot(legacy, catalog as any, root)).toThrow('all three')
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('reference adapter gaps stay in the common Fidelity population', () => {
  const { davebench, drawing, fidelity, catalog } = leaguesFixture()
  Object.assign(fidelity.results[0]!.counts, { 'reference-unqualified': 3 })
  const page = renderBenchmarkLeagues(davebench, drawing, fidelity, catalog)
  const league = page.split('## Mermaid Fidelity')[1]!
  expect(league).toContain('Passed / 5')
  expect(league).toContain('| 1 | a 1.0.0 | 1 | 1 | 3 |')
  expect(league).toContain('| — | b 1.0.0 | Not run | — | 5 |')
})
