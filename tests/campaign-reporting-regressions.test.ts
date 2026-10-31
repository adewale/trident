import { afterEach, expect, test } from 'bun:test'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { importCampaign, rankedRows, renderSnapshot, type ResultsSnapshot } from '../unified/results-snapshot.ts'
import { summarizePilot } from '../unified/pilot-summary.ts'
import type { LineageCatalog } from '../unified/lineage.ts'
import { readCampaign } from '../unified/campaign-publication.ts'

const catalog: LineageCatalog = { nodes: ['fixture/a', 'fixture/b'].map(id => ({ id, roles: ['peer'], outputs: ['svg'], benchmark: { adapter: 'declared', outputs: ['svg'], api: { svg: { export: 'render' } } } })) }
const directories: string[] = []
const temp = () => { const directory = mkdtempSync(join(tmpdir(), 'trident-reporting-regression-')); directories.push(directory); return directory }
afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }) })
const write = (file: string, value: unknown) => writeFileSync(file, JSON.stringify(value))
const empty = (): ResultsSnapshot => ({ schema: 'trident-results-snapshot-v1', tables: [], attempts: [] })
function campaign(directory: string, options: { updatedAt: string; measuredAt?: string; partial?: boolean; candidate?: boolean; blocked?: boolean }) {
  const out = join(directory, 'docs'); mkdirSync(out, { recursive: true })
  const observations = ['fixture/a', 'fixture/b'].flatMap((project, projectIndex) => ['one', 'two'].map(caseId => ({ suite: 'docs', surface: 'browser:svg', runtime: 'Chromium', format: 'svg', family: 'flowchart', operation: 'render', mode: 'one-public-call', caseId,
    status: options.blocked ? 'blocked' : projectIndex === 1 && caseId === 'two' ? 'failed' : 'passed', metrics: { project, version: '1.0.0', round: 1, measuredAt: options.measuredAt ?? '2026-01-01T00:00:00Z', ...(options.candidate && projectIndex === 0 ? { artifactRole: 'candidate' } : {}) } })))
  if (!options.partial) {
    write(join(out, 'inventory.json'), { cases: [{ id: 'one' }, { id: 'two' }] })
    write(join(out, 'result.json'), { id: 'docs', startedAt: '2026-01-01T00:00:00Z', finishedAt: '2026-01-01T00:00:01Z', observations, gaps: [] })
  }
  write(join(directory, 'report.json'), { schema: 'trident-campaign-v2', startedAt: '2026-01-01T00:00:00Z', updatedAt: options.updatedAt, profile: 'full', rounds: 1, projects: ['fixture/a', 'fixture/b'], requestedSuites: ['docs'], ...(options.candidate ? { artifactRole: 'candidate' } : {}), results: options.partial ? [] : [{ suite: 'docs', status: options.blocked ? 'blocked' : 'failed', out }] })
  return directory
}

test('documentation SVG return and reviewed drawing correctness retain separate populations and ranks', () => {
  const root = campaign(temp(), { updatedAt: '2026-02-01T00:00:00Z' }), file = join(root, 'docs/result.json')
  const result = JSON.parse(readFileSync(file, 'utf8'))
  for (const project of ['fixture/a', 'fixture/b']) for (const caseId of ['one', 'two']) result.observations.push({ suite: 'docs', surface: 'browser:svg', runtime: 'Chromium', family: 'flowchart', operation: 'drawing-checks', mode: 'reviewed-first-round-output', format: 'svg', caseId, status: caseId === 'two' ? 'blocked' : project === 'fixture/a' ? 'failed' : 'passed', metrics: { project, version: '1.0.0', round: 1 } })
  write(file, result)
  const snapshot = importCampaign(empty(), root, 'https://example.test/drawings', catalog)
  const drawings = snapshot.tables.find(table => table.columns.includes('Correct'))!
  expect(drawings).toBeDefined()
  expect(drawings.chart).toBeUndefined()
  expect(drawings.rows.find(row => row.project === 'fixture/a')!.values.slice(1, 6)).toEqual([0, 1, 1, 0, 2])
  expect(rankedRows(drawings, value => value).map(row => row.project)).toEqual(['fixture/b', 'fixture/a'])
  expect(rankedRows(drawings, value => value).map(row => row.rank)).toEqual([1, 2])
  expect(drawings.caption).toContain('unknown')
  const returns = snapshot.tables.find(table => table.columns.includes('Returned in all rounds'))!
  expect(returns.rows.find(row => row.project === 'fixture/a')!.values[1]).toBe(2)
})

test('new SVG case verdicts rank verified correct counts while retaining unknown diagrams', () => {
  const root = campaign(temp(), { updatedAt: '2026-02-01T00:00:00Z' })
  const cases = [{ caseId: 'one', family: 'flowchart', status: 'correct' }, { caseId: 'two', family: 'flowchart', status: 'unknown' }]
  write(join(root, 'docs/result.json'), { id: 'mermaid-fidelity', startedAt: '2026-01-01T00:00:00Z', finishedAt: '2026-01-01T00:00:01Z', observations: [], gaps: [], selectedCaseIds: ['one', 'two'], criteriaProtocol: { observer: 'fixture' }, svgAssessments: [{ project: 'fixture/a', version: '1.0.0', cases }] })
  const controller = JSON.parse(readFileSync(join(root, 'report.json'), 'utf8')); controller.requestedSuites = ['fidelity']; controller.results[0].suite = 'fidelity'; write(join(root, 'report.json'), controller)
  const snapshot = importCampaign(empty(), root, 'https://example.test/svg', catalog)
  expect(snapshot.tables).toHaveLength(1)
  expect(snapshot.tables[0]!.rows[0]!.values.slice(1, 6)).toEqual([1, 0, 0, 1, 2])
  expect(rankedRows(snapshot.tables[0]!, value => value)[0]!.rank).toBe(1)
  write(join(root, 'docs/result.json'), { id: 'mermaid-fidelity', observations: [], selectedCaseIds: ['one', 'two', 'three'], svgAssessments: [{ project: 'fixture/a', version: '1.0.0', cases }] })
  expect(() => importCampaign(empty(), root, 'https://example.test/svg', catalog)).toThrow('omit')
})
function overview(snapshot: ResultsSnapshot, project = 'fixture/a') {
  const output = renderSnapshot(snapshot, catalog), lines = output.split('\n')
  const headers = lines.find(line => line.startsWith('| Project | Overview rank |'))!.split('|').map(value => value.trim())
  const cells = lines.find(line => line.startsWith('| ' + project + ' |'))!.split('|').map(value => value.trim())
  const docs = headers.findIndex(header => header.startsWith('DaveBench') && !header.endsWith('PNG'))
  return { row: cells.join('|'), rank: cells[headers.indexOf('Overview rank')], docs: cells[docs] }
}

test('newer PNG-only or unstarted PNG work cannot suppress retained SVG coverage', () => {
  const svg = campaign(temp(), { updatedAt: '2026-02-01T00:00:00Z' })
  const before = importCampaign(empty(), svg, 'https://example.test/svg', catalog)
  const png = campaign(temp(), { updatedAt: '2026-03-01T00:00:00Z' })
  const file = join(png, 'docs/result.json'), result = JSON.parse(readFileSync(file, 'utf8'))
  for (const row of result.observations) { row.format = 'png'; row.surface = 'browser:png-export'; row.status = 'blocked' }
  write(file, result)
  const controller = JSON.parse(readFileSync(join(png, 'report.json'), 'utf8')); controller.options = { docsFormats: ['png'] }; write(join(png, 'report.json'), controller)
  const after = importCampaign(before, png, 'https://example.test/png', catalog)
  expect(overview(after).rank).toEqual(overview(before).rank)
  expect(overview(after).docs).toEqual(overview(before).docs)
  expect(after.attempts.filter(attempt => attempt.receipt.url.includes('/png/')).every(attempt => JSON.stringify(attempt.outputFormats) === '["png"]')).toBe(true)
  const unstarted = campaign(temp(), { updatedAt: '2026-04-01T00:00:00Z', partial: true })
  const partial = JSON.parse(readFileSync(join(unstarted, 'report.json'), 'utf8')); partial.options = { docsFormats: ['png'] }; write(join(unstarted, 'report.json'), partial)
  const pending = overview(importCampaign(after, unstarted, 'https://example.test/png-unstarted', catalog))
  expect(pending.rank).toEqual(overview(before).rank)
  expect(pending.docs).toEqual(overview(before).docs)
})

test('an inapplicable output lane has no fabricated score or setup blocker', () => {
  const root = campaign(temp(), { updatedAt: '2026-02-01T00:00:00Z' }), file = join(root, 'docs/result.json')
  const result = JSON.parse(readFileSync(file, 'utf8'))
  result.observations = ['fixture/a', 'fixture/b'].map(project => ({ suite: 'docs', surface: 'declared-capability', runtime: 'not-invoked', family: '*', format: 'svg', caseId: project, operation: 'format-admission', mode: 'format-not-applicable', status: 'not-applicable', metrics: { project, version: '1' } }))
  write(file, result)
  const snapshot = importCampaign(empty(), root, 'https://example.test/not-applicable', catalog)
  expect(snapshot.tables).toHaveLength(0)
  expect(snapshot.attempts.every(attempt => attempt.status === 'not-applicable')).toBe(true)
})

function oneProjectRerun(options: { updatedAt: string; partial?: boolean; changedInput?: boolean }) {
  const root = campaign(temp(), options)
  const report = JSON.parse(readFileSync(join(root, 'report.json'), 'utf8'))
  report.projects = ['fixture/a']; write(join(root, 'report.json'), report)
  if (!options.partial) {
    const file = join(root, 'docs/result.json'), result = JSON.parse(readFileSync(file, 'utf8'))
    result.observations = result.observations.filter((row: any) => row.metrics.project === 'fixture/a').map((row: any) => ({ ...row, status: 'failed', metrics: { ...row.metrics, measuredAt: options.updatedAt } }))
    write(file, result)
    if (options.changedInput) write(join(root, 'docs/inventory.json'), { cases: [{ id: 'one', source: 'different bytes' }, { id: 'two' }] })
  }
  return root
}

test('a one-project docs rerun updates its row while comparable peer scores, dates and owning receipts survive', () => {
  let data = importCampaign(empty(), campaign(temp(), { updatedAt: '2026-02-01T00:00:00Z' }), 'https://example.org/original', catalog)
  const original = structuredClone(data.tables[0])
  data = importCampaign(data, oneProjectRerun({ updatedAt: '2026-02-02T00:00:00Z' }), 'https://example.org/rerun', catalog)
  const comparison = data.tables.find(table => table.id === data.overviewRanking)!
  expect(comparison.rolling).toBe(true)
  expect(comparison.rows).toHaveLength(2)
  expect(comparison.rows.find(row => row.project === 'fixture/b')?.receipt?.url).toBe('https://example.org/original/report.json')
  expect(comparison.rows.find(row => row.project === 'fixture/a')?.receipt?.url).toBe('https://example.org/rerun/report.json')
  expect(data.tables.find(table => table.id === original!.id)).toEqual(original!)
  expect(overview(data).rank).toBe('2')
  expect(overview(data).docs).toContain('0.0%')
  expect(overview(data).docs).toContain('2026-02-02')
  expect(overview(data, 'fixture/b').rank).toBe('1')
  expect(overview(data, 'fixture/b').docs).toContain('50.0%')
  expect(overview(data, 'fixture/b').docs).toContain('2026-01-01')
  data = importCampaign(data, oneProjectRerun({ updatedAt: '2026-02-03T00:00:00Z', partial: true }), 'https://example.org/interrupted', catalog)
  expect(overview(data).rank).toBe('—')
  expect(overview(data).docs).toContain('unavailable')
  expect(overview(data, 'fixture/b').rank).toBe('1')
  const output = renderSnapshot(data, catalog)
  const currentTable = output.split(`<a id="${comparison.id}"></a>`)[1]!.split('<a id=')[0]!
  expect(currentTable).not.toContain('| fixture/a |')
  expect(currentTable).toContain('| fixture/b | 1 |')
})

test('equal-sized docs inventories with changed input bytes cannot join a rolling comparison', () => {
  let data = importCampaign(empty(), campaign(temp(), { updatedAt: '2026-02-01T00:00:00Z' }), 'https://example.org/original', catalog)
  data = importCampaign(data, oneProjectRerun({ updatedAt: '2026-02-02T00:00:00Z', changedInput: true }), 'https://example.org/changed', catalog)
  const comparison = data.tables.find(table => table.id === data.overviewRanking)!
  expect(comparison.rolling).not.toBe(true)
  expect(comparison.rows).toHaveLength(1)
  expect(overview(data, 'fixture/b').rank).toBe('—')
})

test('a newer multi-project run cannot keep an omitted project score alive through another row’s publication date', () => {
  let data = importCampaign(empty(), campaign(temp(), { updatedAt: '2026-02-01T00:00:00Z' }), 'https://example.org/original', catalog)
  data = importCampaign(data, oneProjectRerun({ updatedAt: '2026-02-02T00:00:00Z' }), 'https://example.org/rerun', catalog)
  const root = campaign(temp(), { updatedAt: '2026-02-03T00:00:00Z' }), file = join(root, 'docs/result.json')
  const result = JSON.parse(readFileSync(file, 'utf8'))
  result.observations = result.observations.filter((row: any) => row.metrics.project === 'fixture/b')
  write(file, result)
  data = importCampaign(data, root, 'https://example.org/missing-one-project', catalog)
  expect(overview(data).rank).toBe('—')
  expect(overview(data).docs).toContain('unavailable')
  expect(overview(data, 'fixture/b').rank).toBe('1')
  expect(overview(data, 'fixture/b').docs).toContain('50.0%')
})

test('fresh generated docs tables supply their own overview rank and literal percentage', () => {
  const data = importCampaign(empty(), campaign(temp(), { updatedAt: '2026-02-01T00:00:00Z' }), 'https://example.org/fresh', catalog)
  expect(overview(data).rank).toBe('1')
  expect(overview(data).docs).toContain('100.0%')
  expect(overview(data, 'fixture/b').rank).toBe('2')
  expect(overview(data, 'fixture/b').docs).toContain('50.0%')
  expect(data.tables[0]!.measuredAt).toBe('2026-01-01T00:00:00Z')
})

test('a genuinely later partial attempt hides older scores, but a later owning import restores reused dated evidence', () => {
  let data = importCampaign(empty(), campaign(temp(), { updatedAt: '2026-02-01T00:00:00Z' }), 'https://example.org/first', catalog)
  data = importCampaign(data, campaign(temp(), { partial: true, updatedAt: '2026-02-02T00:00:00Z' }), 'https://example.org/partial', catalog)
  expect(overview(data).rank).toBe('—')
  expect(overview(data).docs).toContain('unavailable')
  data = importCampaign(data, campaign(temp(), { updatedAt: '2026-02-03T00:00:00Z' }), 'https://example.org/resumed', catalog)
  expect(overview(data).rank).toBe('1')
  expect(overview(data).docs).toContain('100.0%')
  expect(data.tables.find(table => table.id === data.overviewRanking)!.measuredAt).toBe('2026-01-01T00:00:00Z')
})

test('candidate study tables and attempts cannot replace or suppress release scores, including unstarted boundaries', () => {
  let data = importCampaign(empty(), campaign(temp(), { updatedAt: '2026-02-01T00:00:00Z' }), 'https://example.org/release', catalog)
  const primary = data.overviewRanking
  data = importCampaign(data, campaign(temp(), { candidate: true, updatedAt: '2026-02-02T00:00:00Z' }), 'https://example.org/candidate', catalog)
  expect(data.overviewRanking).toBe(primary)
  expect(overview(data).rank).toBe('1')
  expect(overview(data).docs).toContain('100.0%')
  expect(data.attempts.filter(attempt => attempt.receipt.url.includes('/candidate/')).every(attempt => attempt.artifactRole === 'candidate')).toBe(true)
  expect(data.tables.filter(table => table.receipt.url.includes('/candidate/')).every(table => table.artifactRole === 'candidate' && !table.overview)).toBe(true)
  data = importCampaign(data, campaign(temp(), { candidate: true, partial: true, updatedAt: '2026-02-03T00:00:00Z' }), 'https://example.org/candidate-partial', catalog)
  expect(overview(data).rank).toBe('1')
  expect(overview(data).docs).toContain('100.0%')
  expect(renderSnapshot(data, catalog)).toContain('**Source candidate study**')
})

test('fully blocked generated docs data stays blocked and unranked rather than showing zero percent', () => {
  const data = importCampaign(empty(), campaign(temp(), { blocked: true, updatedAt: '2026-02-01T00:00:00Z' }), 'https://example.org/blocked', catalog)
  expect(overview(data).rank).toBe('—')
  expect(overview(data).docs).toContain('blocked')
  expect(overview(data).docs).not.toContain('0.0%')
})

test('an interrupted docs round retains partial observations without a fabricated zero rank or chart bar', () => {
  const root = campaign(temp(), { updatedAt: '2026-02-01T00:00:00Z' })
  const report = JSON.parse(readFileSync(join(root, 'report.json'), 'utf8')); report.rounds = 2; write(join(root, 'report.json'), report)
  const result = JSON.parse(readFileSync(join(root, 'docs/result.json'), 'utf8'))
  result.observations.push(...result.observations.filter((row: any) => row.metrics.project === 'fixture/b').map((row: any) => ({ ...row, metrics: { ...row.metrics, round: 2 } })))
  result.observations.push({ suite: 'docs', surface: 'browser:svg', runtime: 'Chromium', mode: 'round', operation: 'round', caseId: 'round:2', status: 'blocked', metrics: { project: 'fixture/a', round: 2 }, detail: 'Browser host deadline' })
  write(join(root, 'docs/result.json'), result)
  const data = importCampaign(empty(), root, 'https://example.org/interrupted', catalog)
  const table = data.tables.find(table => table.suite === 'docs')!, row = table.rows.find(row => row.project === 'fixture/a')!
  expect(row.values[table.columns.indexOf('Partially observed')]).toBe(2)
  expect(row.values[table.columns.indexOf('Unexecuted')]).toBe(0)
  expect(row.unrankedReason).toBe('incomplete (1/2 complete rounds)')
  expect(rankedRows(table, id => id).map(row => [row.project, row.rank])).toEqual([['fixture/b', 1], ['fixture/a', null]])
  expect(overview(data).rank).toBe('—')
  expect(overview(data).docs).toContain('incomplete')
  const output = renderSnapshot(data, catalog)
  expect(output).toContain('bar [50]')
  expect(output).not.toContain('bar [50, 0]')
  expect(output).not.toContain('| 0.0% |')
})

test('CLI variants belong to their catalogue project while terminal compatibility shares only identical input populations', () => {
  const root = temp(), out = join(root, 'community'); mkdirSync(out)
  const observations = ['fixture/a', 'fixture/b'].flatMap((project, index) => ['one', 'two'].map(caseId => ({ suite: 'community', surface: index ? 'node:public-api' : 'cli:end-to-end', runtime: index ? 'Node' : 'Rust', format: 'terminal', operation: 'render', mode: 'feature-corpus-qualification', caseId, status: index && caseId === 'two' ? 'failed' : 'passed', metrics: { implementation: project, round: 1, version: '1' } })))
  observations.push({ ...observations[0]!, mode: 'fresh-process', metrics: { implementation: 'FIXTURE/A#native-release', round: 1, version: '1', variant: 'native-release' } } as any)
  write(join(out, 'result.json'), { id: 'community', finishedAt: '2026-02-01T00:00:00Z', observations })
  write(join(root, 'report.json'), { schema: 'trident-campaign-v2', startedAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-01T00:00:01Z', projects: ['fixture/a', 'fixture/b'], requestedSuites: ['community'], rounds: 1, profile: 'full', results: [{ suite: 'community', out, status: 'failed' }] })
  const data = importCampaign(empty(), root, 'https://example.org/variants', catalog)
  expect(() => renderSnapshot(data, catalog)).not.toThrow()
  expect(data.tables.flatMap(table => table.rows).every(row => ['fixture/a', 'fixture/b'].includes(row.project))).toBe(true)
  expect(data.attempts.find(attempt => attempt.project === 'fixture/a')?.groups.some(group => group.variant === 'native-release')).toBe(true)
  const table = data.tables.find(table => table.summary)!
  expect(table.rows).toHaveLength(2)
  expect(rankedRows(table, id => id).map(row => [row.project, row.rank])).toEqual([['fixture/a', 1], ['fixture/b', 2]])
})

test('copied campaign evidence reads its own reports even while the original directory still exists', () => {
  const root = campaign(temp(), { updatedAt: '2026-02-01T00:00:00Z' })
  const file = join(root, 'report.json'), report = JSON.parse(readFileSync(file, 'utf8'))
  report.options = { out: root }; write(file, report)
  const copy = join(temp(), 'extracted'); cpSync(root, copy, { recursive: true })
  write(join(root, 'docs/result.json'), { observations: [] })
  expect(readCampaign(copy).results[0]!.out).toBe(join(copy, 'docs'))
  const data = importCampaign(empty(), copy, 'https://example.org/extracted', catalog)
  expect(data.tables.find(table => table.suite === 'docs')?.rows).toHaveLength(2)
  expect(overview(data).docs).toContain('100.0%')
  const raw = JSON.parse(readFileSync(join(copy, 'report.json'), 'utf8'))
  expect(raw.results[0].out).toBe(join(root, 'docs'))
})

test('an extracted native pilot reads owning reports relative to its controller and retains usable report paths', () => {
  const root = temp(), project = 'fixture/a', caseId = 'family:flowchart', directory = join(root, 'portable', encodeURIComponent(project), encodeURIComponent(caseId))
  mkdirSync(directory, { recursive: true })
  write(join(directory, 'report.json'), { project, summary: { cases: [{ id: caseId }], counts: { positiveCases: 1, outputAdmissionCases: 1, completeSemanticCases: 1, outputCalibratedTimingRows: 1, totalTimingRows: 3 } } })
  const file = join(root, 'report.json')
  write(file, { pilot: true, results: [{ project, caseId, out: '/nonexistent/old-workspace/pilot/portable/project/case', elapsedSeconds: 2, completed: true }] })
  const summary = summarizePilot(file)
  expect(summary.counts).toMatchObject({ collected: 1, notStarted: 0, positiveCases: 1, semanticCompleteCases: 1 })
  const row = summary.rows[0]!
  expect(row.state === 'collected' ? row.report : undefined).toBe(join('portable', encodeURIComponent(project), encodeURIComponent(caseId), 'report.json'))
})

test('latest core and external cohort statuses are both visible and a newer partial campaign supersedes the pair', () => {
  for (const externalStatus of ['blocked', 'failed']) {
    const root = temp(), results: any[] = []
    for (const cohort of ['external', 'core']) {
      const out = join(root, cohort); mkdirSync(out)
      const status = cohort === 'core' ? 'passed' : externalStatus
      write(join(out, 'result.json'), { id: 'community', finishedAt: '2026-02-01T00:00:00Z', gaps: [], observations: [{ suite: 'community', surface: 'node:public-api', runtime: 'Node', format: 'svg', family: 'flowchart', operation: 'render', mode: 'qualification', caseId: 'one', status, metrics: { project: 'fixture/a', version: '1.0.0' } }] })
      results.push({ suite: 'community', cohort, out, status })
    }
    write(join(root, 'report.json'), { schema: 'trident-campaign-v2', startedAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-01T00:00:01Z', profile: 'full', rounds: 1, projects: ['fixture/a'], requestedSuites: ['community'], results })
    let data = importCampaign(empty(), root, 'https://example.org/cohorts', catalog)
    const compatibility = overview(data).row.split('|')[3]!
    expect(compatibility).toContain('core: recorded')
    expect(compatibility).toContain('external: ' + externalStatus)
    expect(renderSnapshot(data, catalog)).toContain('Mermaid Compatibility (external)')
    const newer = temp()
    write(join(newer, 'report.json'), { schema: 'trident-campaign-v2', startedAt: '2026-02-02T00:00:00Z', updatedAt: '2026-02-02T00:00:01Z', profile: 'full', rounds: 1, projects: ['fixture/a'], requestedSuites: ['community'], results: [] })
    data = importCampaign(data, newer, 'https://example.org/newer-partial', catalog)
    const latest = overview(data).row.split('|')[3]!
    expect(latest).toContain('unavailable')
    expect(latest).not.toContain('core:')
    expect(latest).not.toContain('external:')
  }
})
