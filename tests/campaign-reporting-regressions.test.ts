import { afterEach, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { importCampaign, renderSnapshot, type ResultsSnapshot } from '../unified/results-snapshot.ts'
import { summarizePilot } from '../unified/pilot-summary.ts'
import type { LineageCatalog } from '../unified/lineage.ts'

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
function overview(snapshot: ResultsSnapshot, project = 'fixture/a') {
  const row = renderSnapshot(snapshot, catalog).split('\n').find(line => line.startsWith('| ' + project + ' |'))!
  const cells = row.split('|').map(value => value.trim())
  return { row, rank: cells[2], docs: cells[4] }
}

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
