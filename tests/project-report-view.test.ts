import { publishProjectRecord, type ProjectBenchmarkRecord, readBenchmarkDocument } from '../portable/project-records.ts'
import { expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { publishResults } from '../unified/league.ts'
import { communityCoreWorkloads } from '../unified/community.ts'
import { projectReportView } from '../unified/project-report-view.ts'
import { coverageRows, type UnifiedReport, writeUnifiedReport } from '../unified/report.ts'
import type { UnifiedSuiteResult } from '../unified/types.ts'

const fixture = (): UnifiedSuiteResult => ({
  id: 'entry-startup',
  status: 'passed',
  startedAt: '2026-10-25T00:00:00.000Z',
  finishedAt: '2026-10-25T00:00:01.000Z',
  gaps: [],
  observations: [
    { suite: 'entry-startup', surface: 'library', runtime: 'Node', family: 'flowchart', caseId: 'first-result', operation: 'render', format: 'svg', mode: 'fresh-process', status: 'passed', samplesMs: [3], metrics: { implementation: 'agentic', project: 'stale/project', returnRssBytes: 100 } },
    { suite: 'entry-startup', surface: 'browser', runtime: 'Chromium', family: '*', caseId: 'delivery', operation: 'delivery', format: 'report', mode: 'observed-requests', status: 'passed' },
  ],
})

test('two retained project views keep their canonical owner without mutating cached raw evidence', () => {
  const raw = fixture()
  const before = JSON.stringify(raw)
  for (const row of raw.observations) {
    if (row.metrics) Object.freeze(row.metrics)
    Object.freeze(row)
  }
  Object.freeze(raw.observations)
  Object.freeze(raw)
  const agentic = projectReportView(raw, 'adewale/agentic-mermaid')
  const pele = projectReportView(raw, 'obsidianmd/pele')
  expect(JSON.stringify(raw)).toBe(before)
  expect(agentic).not.toBe(raw)
  expect(pele.observations).not.toBe(raw.observations)
  for (const [view, owner] of [
    [agentic, 'adewale/agentic-mermaid'],
    [pele, 'obsidianmd/pele'],
  ] as const) {
    expect(view.observations.every(row => row.metrics?.implementation === owner && row.metrics?.project === owner)).toBe(true)
    expect(view.observations[0]!.samplesMs).toEqual([3])
    expect(view.observations[0]!.metrics?.returnRssBytes).toBe(100)
    expect(view.startedAt).toBe(raw.startedAt)
    expect(view.finishedAt).toBe(raw.finishedAt)
  }
  const groups = coverageRows([...agentic.observations, ...pele.observations])
  expect(groups).toHaveLength(4)
  expect(new Set(groups.map(row => row.implementation))).toEqual(new Set(['adewale/agentic-mermaid', 'obsidianmd/pele']))
  expect(groups.every(row => row.cases === 1 && row.statuses.passed === 1)).toBe(true)
})

test('legacy project metadata is attributed consistently in coverage and exported CSV', () => {
  const raw = fixture()
  raw.observations = [{ ...raw.observations[0]!, metrics: { project: 'obsidianmd/pele' } }]
  raw.toolVersions = [{ tool: 'obsidianmd/pele', version: '1.9.0', source: 'owning artifact fixture' }]
  expect(coverageRows([fixture().observations[1]!])[0]!.implementation).toBe('unattributed')
  expect(coverageRows(raw.observations)[0]!.implementation).toBe('obsidianmd/pele')
  const out = mkdtempSync(join(tmpdir(), 'project-report-view-'))
  try {
    const report: UnifiedReport = {
      schemaVersion: 1,
      startedAt: raw.startedAt,
      finishedAt: raw.finishedAt,
      profile: 'full',
      rounds: 3,
      driverRoot: '/driver',
      targetRoot: '/target',
      driverDirty: false,
      targetDirty: false,
      status: 'passed',
      policy: 'Authored report consumer control',
      suites: [{ id: raw.id, title: raw.id, source: 'fixture', policy: 'local-only', target: 'candidate', status: 'passed', selected: true, prerequisites: [], result: raw }],
    }
    writeUnifiedReport(out, report)
    expect(existsSync(join(out, 'observations.csv'))).toBe(false)
    expect(existsSync(join(out, 'coverage.json'))).toBe(false)
    expect(readBenchmarkDocument(join(out, 'report.json')).suites[0].result.observations[0].metrics.project).toBe('obsidianmd/pele')
    report.exports = { tables: true }
    writeUnifiedReport(out, report)
    expect(readFileSync(join(out, 'coverage.csv'), 'utf8')).toContain('"entry-startup","obsidianmd/pele"')
    expect(readFileSync(join(out, 'observations.csv'), 'utf8')).toContain('"entry-startup","obsidianmd/pele"')
    expect(readFileSync(join(out, 'observations.csv'), 'utf8')).not.toContain('"agentic-mermaid"')
  } finally {
    rmSync(out, { recursive: true, force: true })
  }
})

test('community league costs compare and rank within each invocation surface', () => {
  const directory = mkdtempSync(join(tmpdir(), 'community-league-boundaries-')),
    store = join(directory, 'store'),
    out = join(directory, 'published')
  try {
    for (const [project, surface, ms, format] of [
      ['mermaid-js/mermaid', 'browser:public-api', 10, 'svg'],
      ['fixture/browser', 'browser:public-api', 5, 'svg'],
      ['fixture/node', 'node:public-api', 1, 'svg'],
      ['fixture/formatter', 'node:public-api', 1, 'source'],
      ['fixture/remote', 'browser:public-api', 1, 'svg'],
    ] as const) {
      const evidenceDirectory = join(directory, project.replaceAll('/', '-'))
      mkdirSync(evidenceDirectory)
      writeFileSync(join(evidenceDirectory, 'result.json'), '{}')
      const row = (caseId: string, round: number) => ({ suite: 'community', surface, runtime: 'fixture', family: 'flowchart', caseId, operation: 'render', format, mode: 'core-api-repeat', status: 'passed' as const, samplesMs: [ms], metrics: { implementation: project, version: 'fixture', round, firstMs: ms } })
      const record: ProjectBenchmarkRecord = {
        schemaVersion: 1,
        id: project,
        identity: { project, protocol: { context: project === 'fixture/remote' ? 'different-runtime-protocol' : 'same' }, artifact: {}, measurement: { rounds: 5 } },
        startedAt: '2026-10-26T00:00:00Z',
        finishedAt: '2026-10-26T00:01:00Z',
        status: 'passed',
        evidenceDirectory,
        evidenceFiles: ['result.json'],
        gaps: [],
        observations: [...Array.from({ length: 5 }, (_, i) => communityCoreWorkloads().map(w => row(w.id, i + 1))).flat(), row('authored-feature', 1)],
      }
      publishProjectRecord(store, record)
    }
    publishResults(store, out)
    const markdown = readFileSync(join(out, 'README.md'), 'utf8'),
      rows = markdown.split('\n')
    const node = rows.find(line => line.includes('[fixture/node]'))!.split('|'),
      browser = rows.find(line => line.includes('[fixture/browser]'))!.split('|')
    expect(node[8]!.trim()).toBe('—')
    expect(browser[8]!.trim()).toBe('2.0× faster')
    expect(
      rows
        .find(line => line.includes('[fixture/remote]'))!
        .split('|')[8]!
        .trim(),
    ).toBe('—')
    expect(node[1]!.trim()).toBe('1')
    expect(browser[1]!.trim()).toBe('1')
    expect(markdown).toContain('## Formatted Mermaid source')
    expect(
      rows
        .find(line => line.includes('[fixture/formatter]'))!
        .split('|')[8]!
        .trim(),
    ).toBe('—')
    expect(markdown).toContain('### Node API')
    expect(markdown).toContain('### browser API')
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
