import { expect, test } from 'bun:test'
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { writeSnapshot } from '../unified/results-snapshot.ts'
import { campaignPlan } from '../unified/campaign-plan.ts'
import { currentBenchmarkResultFiles, threeBenchmarkReport, renderThreeBenchmarkReport, renderBenchmarkLeagues } from '../unified/three-benchmark-report.ts'

function fixture() {
  const runs = (format: string) => [1, 2, 3].flatMap(run => ['a', 'b'].map((project, index) => ({ project, version: '1.0.0', format, run, boundary: 'fixture public API', attempted: 10, completed: 10 - index, failed: index, timeouts: 0, totalMs: 100 + index })))
  const corpus = { commit: 'fixed', occurrences: 10 }
  const method = { admission: 'fixture admission policy' }
  return { images: { state: 'complete', corpus, method, runs: [...runs('svg'), ...runs('png')], blocked: [] }, terminal: { state: 'complete', corpus, method, runs: runs('terminal'), blocked: [] } }
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
  expect(() => threeBenchmarkReport(images, { ...terminal, method: { admission: 'earlier policy' } })).toThrow('one recorded admission policy')
  expect(() => threeBenchmarkReport({ ...images, method: undefined }, { ...terminal, method: undefined })).toThrow('one recorded admission policy')
})

function leaguesFixture() {
  const { images, terminal } = fixture()
  const davebench = threeBenchmarkReport(images, terminal)
  const drawing = { state: 'complete', corpus: { cases: 2 }, blocked: [], results: ['a', 'b'].map(project => ({ project, version: '1.0.0', format: 'svg', counts: { correct: 1, incorrect: 0, 'renderer-failure': 0, 'invalid-format': 0, unknown: 1, unrun: 0 } })) }
  const fidelity = { referenceQualifiedCallbacks: 2, results: [{ project: 'a', version: '1.0.0', counts: { passed: 1, failed: 1, unsupported: 0, 'trident-blocked': 0 } }], blocked: [{ project: 'b' }] }
  const catalog = { nodes: ['a', 'b'].map(id => ({ id, benchmark: { version: '1.0.0', outputs: ['svg'] } })) }
  return { davebench, drawing, fidelity, catalog }
}
test('the landing page names timing boundaries, label scope and uncertainty alongside its leagues', () => {
  const { davebench, drawing, fidelity, catalog } = leaguesFixture()
  const before = JSON.stringify({ davebench, drawing, fidelity })
  const page = renderBenchmarkLeagues(davebench, drawing, fidelity, catalog, { a: 'Alpha', b: 'Beta' })
  expect(page.match(/^## .+$/gm)).toEqual(['## DaveBench', '## Drawing Correctness', '## Mermaid Fidelity', '## Equal-weight synthesis'])
  expect(page).toContain('| 1 | Alpha 1.0.0 |')
  expect(page).not.toContain('| Version |')
  expect(page).toContain('### Terminal rendering')
  expect(page).toContain('### Terminal correctness')
  expect(page).not.toContain('### Terminal text')
  expect(page).toContain('| 1 | 1–2 | Beta 1.0.0 | 1 | 1–2 | 0 | 1 |') // pass bounds retain the unknown case
  expect(page).toContain('| — | — | Beta 1.0.0 | Not run | — | — | 2 |') // missing adapter is not zero
  expect(page).toContain('| 1–2 | Alpha 1.0.0 |') // synthesis shows reachable ranks, not rank by minimum
  expect(page).not.toContain('remain unimplemented')
  expect(page).toContain('API; initialization excluded')
  expect(page).toContain('Edges, arrow direction, layout and styling are outside this benchmark')
  expect(page).toContain('Assertion/fault nonpasses | Unsupported')
  expect(JSON.stringify({ davebench, drawing, fidelity })).toBe(before)
})
test('observed zero and wholly unassessed drawing outputs remain different', () => {
  const { davebench, drawing, fidelity, catalog } = leaguesFixture()
  drawing.results[0]!.counts = { correct: 0, incorrect: 2, 'renderer-failure': 0, 'invalid-format': 0, unknown: 0, unrun: 0 }
  drawing.results[1]!.counts = { correct: 0, incorrect: 0, 'renderer-failure': 0, 'invalid-format': 0, unknown: 2, unrun: 0 }
  const page = renderBenchmarkLeagues(davebench, drawing, fidelity, catalog)
  expect(page).toContain('| 1 | 1 | a 1.0.0 | 0 | 0 | 2 | 0 |')
  expect(page.split('## Drawing Correctness')[1]!.split('## Mermaid Fidelity')[0]).toContain('| — | — | b 1.0.0 | Not assessed | 0–2 | — | 2 |')
})

test('snapshot regeneration reads all three current results', () => {
  const { davebench, drawing, fidelity, catalog } = leaguesFixture()
  const root = mkdtempSync(join(tmpdir(), 'trident-current-leagues-'))
  const files = currentBenchmarkResultFiles
  try {
    const data = [davebench, drawing, fidelity, catalog]
    for (let i = 0; i < files.length; i++) { const path = join(root, files[i]!); mkdirSync(join(path, '..'), { recursive: true }); writeFileSync(path, JSON.stringify(data[i])) }
    writeSnapshot(root)
    expect(readFileSync(join(root, 'RESULTS.md'), 'utf8')).toContain('## Mermaid Fidelity')
    writeSnapshot(root, true)
    fidelity.results[0]!.counts.passed = 2; fidelity.results[0]!.counts.failed = 0
    writeFileSync(join(root, files[2]!), JSON.stringify(fidelity))
    expect(() => writeSnapshot(root, true)).toThrow('stale')
    rmSync(join(root, files[2]!))
    expect(() => writeSnapshot(root)).toThrow('all three')
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('Fidelity scores the reference-qualified population; callbacks the control cannot pass are not everyone\'s unknowns', () => {
  const { davebench, drawing, fidelity, catalog } = leaguesFixture()
  Object.assign(fidelity.results[0]!.counts, { 'reference-unqualified': 3 })
  const page = renderBenchmarkLeagues(davebench, drawing, fidelity, catalog)
  const league = page.split('## Mermaid Fidelity')[1]!.split('## Equal-weight synthesis')[0]!
  expect(league).toContain('Passed / 2 ↑')
  expect(league).toContain('| 1 | 1 | a 1.0.0 | 1 | 1 | 0 | 0 |')
  expect(league).toContain('| — | — | b 1.0.0 | Not run | — | — | 2 |')
})

test('shared Fidelity gaps remain distinct from additional gaps and unsupported operations', () => {
  const model = leaguesFixture(), row = model.fidelity.results[0]!
  row.counts = { passed: 0, failed: 0, unsupported: 1, 'trident-blocked': 1 }
  const fidelity = { ...model.fidelity, coverage: { candidates: 1, commonUnassessedCallbacks: 1, commonUncollectedCallbacks: 1 } }
  const page = renderBenchmarkLeagues(model.davebench, model.drawing, fidelity, model.catalog)
  expect(page).toContain('1 reference-qualified callbacks are unassessed')
  expect(page).toContain('Unassessed (shared + additional)')
  expect(page.split('## Mermaid Fidelity')[1]).toContain('| 1 | 1 | a 1.0.0 | 0 | 0 | 1 | 1 + 0 |')
  expect(() => renderBenchmarkLeagues(model.davebench, model.drawing, { ...fidelity, coverage: { ...fidelity.coverage, commonUnassessedCallbacks: 2 } }, model.catalog)).toThrow('shared Fidelity gap')
})

test('current result files carry no hand-chosen collection date in their names', () => {
  // A dated name once claimed 4 November for Fidelity collected on 5 November. Dates are
  // published from the timestamps inside each file; only the frozen catalog is named for its cutoff.
  for (const path of currentBenchmarkResultFiles.slice(0, 3)) expect(path).not.toMatch(/\d{4}-\d{2}-\d{2}/)
})

test('a labelled functional subset cannot silently become the current league', () => {
  const { davebench, drawing, fidelity, catalog } = leaguesFixture()
  expect(() => renderBenchmarkLeagues({ ...davebench, scope: 'subset' }, drawing, fidelity, catalog)).toThrow('full campaigns')
})
test('a collection that recorded reference rejections ranks completion over accepted inputs only', () => {
  const cases = Array.from({ length: 10 }, (_, index) => `docs/x.md:${index + 1}`)
  // "a" renders all ten inputs; "b" fails only input 9, which the Mermaid reference rejects.
  const runs = (format: string) => [1, 2, 3].flatMap(run => [
    { project: 'a', version: '1.0.0', format, run, boundary: 'fixture public API', attempted: 10, completed: 10, failed: 0, timeouts: 0, totalMs: 200, failures: {} },
    { project: 'b', version: '1.0.0', format, run, boundary: 'fixture public API', attempted: 10, completed: 9, failed: 1, timeouts: 0, totalMs: 100, failures: { 'error: parse': '9' } },
  ])
  const corpus = { commit: 'fixed', occurrences: 10, referenceRejected: { 'docs/x.md:10': 'Parse error on line 1:' } }
  const method = { admission: 'fixture admission policy' }
  const lanes = (formats: string[]) => formats.flatMap(format => ['a', 'b'].map(project => ({ project, version: '1.0.0', format })))
  const report: any = threeBenchmarkReport({ state: 'complete', corpus, method, plan: campaignPlan(lanes(['svg', 'png']), cases, 3, 'fixture'), runs: [...runs('svg'), ...runs('png')], blocked: [] }, { state: 'complete', corpus, method, plan: campaignPlan(lanes(['terminal']), cases, 3, 'fixture'), runs: runs('terminal'), blocked: [] })
  expect(report.credit).toEqual({ basis: 'reference-accepted', inputs: 9 })
  // Both completed all nine accepted inputs, so "a" earns nothing for rendering the rejected one.
  expect(report.rankings.svg.map((row: any) => [row.project, row.completed])).toEqual([['b', 9], ['a', 9]])
  expect(report.rankings.terminal.every((row: any) => row.completed === 9)).toBe(true)
  // Without recorded rejections, the earlier credit over every planned input applies.
  const { images, terminal } = fixture()
  expect(threeBenchmarkReport(images, terminal)).not.toHaveProperty('credit')
})
