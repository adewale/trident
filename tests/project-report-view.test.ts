import { publishProjectRecord, type ProjectBenchmarkRecord, readBenchmarkDocument, writeBenchmarkDocument } from '../portable/project-records.ts'
import { expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { gunzipSync } from 'node:zlib'
import { join } from 'node:path'
import { lanes, positiveRenderScore, publishResults } from '../unified/league.ts'
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
      writeBenchmarkDocument(join(evidenceDirectory, 'context.json'), { inputs: { literal: {
        reference: { version: '12.2.0', parserVersion: '2.0.1', domVersion: '26.1.0' }, gaps: [],
        workloads: [{ id: 'authored-feature', family: 'flowchart', source: 'flowchart LR\n A[Fixture]', intent: 'render', referenceAdmission: { accepted: true }, features: [], provenance: 'Independently authored report fixture' }],
      } } })
      const row = (caseId: string, round: number) => ({ suite: 'community', surface, runtime: 'fixture', family: 'flowchart', caseId, operation: 'render', format, mode: 'core-api-repeat', status: 'passed' as const, samplesMs: [ms], metrics: { implementation: project, version: project === 'mermaid-js/mermaid' ? '12.2.0' : 'fixture', round, firstMs: ms } })
      const record: ProjectBenchmarkRecord = {
        schemaVersion: 1,
        id: project,
        identity: { project, protocol: { context: project === 'fixture/remote' ? 'different-runtime-protocol' : 'same' }, artifact: { package: { artifact: { version: project === 'mermaid-js/mermaid' ? '12.2.0' : 'fixture' } } }, measurement: { rounds: 5 } },
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
    expect(node[9]!.trim()).toBe('—')
    expect(browser[9]!.trim()).toBe('2.0× faster')
    expect(
      rows
        .find(line => line.includes('[fixture/remote]'))!
        .split('|')[9]!
        .trim(),
    ).toBe('—')
    expect(node[1]!.trim()).toBe('1')
    expect(browser[1]!.trim()).toBe('1')
    expect(markdown).toContain('## Formatted Mermaid source')
    expect(
      rows
        .find(line => line.includes('[fixture/formatter]'))!
        .split('|')[9]!
        .trim(),
    ).toBe('—')
    expect(markdown).toContain('### Node API')
    expect(markdown).toContain('### browser API')
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('stable Event Modeling changes the current mark while beta additions leave the historical mark intact', () => {
  const directory = mkdtempSync(join(tmpdir(), 'community-league-newer-')),
    store = join(directory, 'store'),
    out = join(directory, 'published')
  try {
    const project = 'fixture/newer'
    const evidenceDirectory = join(directory, 'evidence')
    mkdirSync(evidenceDirectory)
    writeFileSync(join(evidenceDirectory, 'result.json'), '{}')
    const row = (family: string, caseId: string, status: 'passed' | 'failed' | 'unsupported' | 'blocked', operation = 'render') => ({ suite: 'community', surface: 'node:public-api', runtime: 'fixture', family, caseId, operation, format: 'svg', mode: 'core-api-repeat', status, samplesMs: [1], metrics: { implementation: project, version: 'fixture', round: 1, firstMs: 1 } })
    publishProjectRecord(store, {
      schemaVersion: 1,
      id: project,
      identity: { project, protocol: { context: 'same' }, artifact: { package: { artifact: { version: 'fixture' } } }, measurement: { rounds: 1 } },
      startedAt: '2026-10-26T00:00:00Z',
      finishedAt: '2026-10-26T00:01:00Z',
      status: 'failed',
      evidenceDirectory,
      evidenceFiles: ['result.json'],
      gaps: [],
      observations: [
        row('flowchart', 'family-support:flowchart', 'passed', 'family-support'),
        row('class', 'family-support:class', 'blocked', 'family-support'),
        row('flowchart', 'authored-flowchart', 'passed'),
        row('eventmodeling', 'family-support:eventmodeling', 'passed', 'family-support'),
        row('eventmodeling', 'docs:eventmodeling:0', 'failed'),
        row('venn', 'family-support:venn', 'passed', 'family-support'),
        row('venn', 'docs:venn:0', 'passed'),
        row('venn', 'docs:venn:1', 'failed'),
        row('wardley', 'family-support:wardley', 'unsupported', 'family-support'),
      ],
    })
    publishResults(store, out)
    const markdown = readFileSync(join(out, 'README.md'), 'utf8')
    const cells = markdown.split('\n').find(line => line.includes('[fixture/newer]'))!.split('|').map(cell => cell.trim())
    expect(cells[5]).toBe('2/25')
    expect(cells[6]).toBe('50.0% (1/2)')
    expect(cells[7]).toBe('1/8, 50.0%')
    expect(cells[11]).toBe('1/23, 100.0% (1/1)')
    const newer = markdown.slice(markdown.indexOf('### Newer families'))
    expect(newer).toContain('| venn | 50.0% |')
    expect(newer).toContain('| wardley | — |')
    expect(markdown.slice(markdown.indexOf('## Families'), markdown.indexOf('### Newer families'))).not.toContain('| venn |')
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('portable reports retain every failure without duplicating oversized rendered evidence', () => {
  const directory = mkdtempSync(join(tmpdir(), 'community-report-budget-')),
    evidenceDirectory = join(directory, 'evidence'),
    out = join(directory, 'published'),
    project = 'fixture/budget'
  try {
    mkdirSync(evidenceDirectory)
    writeFileSync(join(evidenceDirectory, 'result.json'), '{}')
    const sizes = [128, 256 * 1024, ...Array(9).fill(120 * 1024)]
    const observations = sizes.map((bytes, index) => {
      const outputFile = join(evidenceDirectory, `failure-${index}.svg`)
      writeFileSync(outputFile, 'x'.repeat(bytes))
      return { suite: 'community', surface: 'browser:public-api', runtime: 'fixture', family: 'flowchart', caseId: `failure-${index}`, operation: 'render', format: 'svg', mode: 'feature', status: 'failed' as const, metrics: { implementation: project, version: 'fixture', round: 1, outputFile } }
    })
    publishProjectRecord(join(directory, 'store'), { schemaVersion: 1, id: project, identity: { project, protocol: {}, artifact: { package: { artifact: { version: 'fixture' } } }, measurement: { rounds: 1 } }, startedAt: '2026-10-26T00:00:00Z', finishedAt: '2026-10-26T00:01:00Z', status: 'failed', evidenceDirectory, evidenceFiles: ['result.json'], gaps: [], observations })
    publishResults(join(directory, 'store'), out)
    const markdown = readFileSync(join(out, 'failures/fixture-budget.md'), 'utf8'),
      outputDirectory = join(out, 'outputs/fixture-budget'),
      copied = readdirSync(outputDirectory).map(name => ({ name, bytes: statSync(join(outputDirectory, name)).size }))
    for (let index = 0; index < sizes.length; index++) expect(markdown).toContain(`### failure-${index}`)
    expect(copied.some(file => file.name.startsWith('failure-0-'))).toBe(true)
    expect(copied.some(file => file.name.startsWith('failure-1-'))).toBe(false)
    expect(copied.every(file => file.bytes <= 128 * 1024)).toBe(true)
    expect(copied.reduce((sum, file) => sum + file.bytes, 0)).toBeLessThanOrEqual(1024 * 1024)
    expect(markdown).toContain('omitted from this portable report')
    expect(statSync(join(evidenceDirectory, 'failure-1.svg')).size).toBe(256 * 1024)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})


test('portable reports preserve oracle caveats and separate pinned-accepted authored-label checks from raw results', () => {
  const directory = mkdtempSync(join(tmpdir(), 'community-report-oracle-')),
    store = join(directory, 'store'),
    out = join(directory, 'published')
  try {
    const warnings = ['rejected: pinned Mermaid rejected source (legacy syntax)', 'unlabeled: pinned Mermaid returned no nonempty authored label expectations', 'external: pinned Mermaid has no label getter projection']
    const literal = { reference: { version: '12.2.0', parserVersion: '2.0.1', domVersion: '26.1.0' }, gaps: warnings, workloads: ['good', 'lost', 'rejected', 'unlabeled', 'external'].map(id => ({ id, family: 'flowchart', source: `flowchart LR\n A[${id}]`, features: [], provenance: 'independently authored report fixture', expectedLabels: id === 'unlabeled' ? [] : [id] })) }
    for (const source of ['context', 'fallback', 'legacy'] as const) {
      const project = `fixture/${source}`,
        evidenceDirectory = join(directory, source)
      mkdirSync(join(evidenceDirectory, 'community'), { recursive: true })
      writeFileSync(join(evidenceDirectory, 'result.json'), '{}')
      if (source === 'context') {
        writeBenchmarkDocument(join(evidenceDirectory, 'context.json'), { inputs: { literal } })
        // The per-project consumer copy lost the gaps; the preserved context remains authoritative.
        writeBenchmarkDocument(join(evidenceDirectory, 'community/community-inputs.json'), { workloads: literal.workloads })
      } else writeBenchmarkDocument(join(evidenceDirectory, 'community/community-inputs.json'), source === 'legacy' ? { workloads: literal.workloads } : literal)
      const observations = ['good', 'lost', 'rejected', 'unlabeled', 'external', 'unmapped'].map(caseId => ({ suite: 'community', surface: 'browser:public-api', runtime: 'fixture', family: 'flowchart', caseId, operation: 'render', format: 'svg', mode: 'feature-corpus-qualification', status: caseId === 'lost' || (source === 'fallback' && caseId === 'rejected') ? 'failed' as const : 'passed' as const, metrics: { implementation: project, version: 'fixture', round: 1 } }))
      publishProjectRecord(store, { schemaVersion: 1, id: project, identity: { project, protocol: {}, artifact: { package: { artifact: { version: 'fixture' } } }, measurement: { rounds: 1 } }, startedAt: '2026-10-26T00:00:00Z', finishedAt: '2026-10-26T00:01:00Z', status: 'failed', evidenceDirectory, evidenceFiles: ['result.json'], gaps: ['original scope caveat'], observations })
    }
    const result = publishResults(store, out)
    const markdown = readFileSync(join(out, 'README.md'), 'utf8')
    expect(markdown).toContain('## Input oracle caveats')
    expect(markdown).toContain('## Pinned-accepted format-and-label admission')
    for (const source of ['context', 'fallback'] as const) {
      const portable = JSON.parse(gunzipSync(readFileSync(join(out, `records/fixture-${source}.json.gz`))).toString())
      expect(portable.inputEvidence.source).toBe(source === 'context' ? 'context' : 'community-inputs')
      expect(portable.inputEvidence.gaps).toEqual(warnings)
      expect(portable.gaps).toEqual(['original scope caveat', ...warnings])
      expect(portable.inputEvidence.rejectedCaseIds).toEqual(['rejected'])
      expect(portable.inputEvidence.unlabeledCaseIds).toEqual(['unlabeled'])
      expect(portable.observations.map((row: any) => row.status)).toEqual(['passed', 'failed', source === 'fallback' ? 'failed' : 'passed', 'passed', 'passed', 'passed'])
      const lane = result.lanes.find(lane => lane.project === `fixture/${source}`)!
      expect([lane.passed, lane.failed]).toEqual(source === 'fallback' ? [4, 2] : [5, 1])
      expect((lane as any).authoredLabels).toEqual({ passed: 2, failed: 1, blocked: 0, unavailable: 0, excludedRejected: 1, excludedUnlabeled: 1, unmapped: 1 })
    }
    const legacy = result.lanes.find(lane => lane.project === 'fixture/legacy')!
    expect((legacy as any).authoredLabels).toBeNull()
    expect(markdown).toContain('Retained input caveats are unavailable')
    const failures = readFileSync(join(out, 'failures/fixture-context.md'), 'utf8')
    expect(failures).toContain('Pinned Mermaid accepted this source; authored labels are declared')
    expect(failures).toContain('flowchart LR')
    expect(readFileSync(join(out, 'failures/fixture-fallback.md'), 'utf8')).toContain('Pinned Mermaid rejected this source')
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})


test('first-call core reports use the arithmetic median for six rounds', () => {
  const firstCalls = [101, 1, 101, 1, 101, 1],
    project = 'fixture/even-rounds'
  const row = (caseId: string, round: number, firstMs: number) => ({ suite: 'community', surface: 'browser:public-api', runtime: 'fixture', family: 'flowchart', caseId, operation: 'render', format: 'svg', mode: 'core-api-repeat', status: 'passed' as const, samplesMs: [5], metrics: { implementation: project, version: 'fixture', round, firstMs } })
  const record: ProjectBenchmarkRecord = {
    schemaVersion: 1, id: 'six-rounds', identity: { project, protocol: {}, artifact: { package: { artifact: { version: 'fixture' } } }, measurement: { rounds: 6 } },
    startedAt: '2026-10-27T00:00:00Z', finishedAt: '2026-10-27T00:01:00Z', status: 'passed',
    evidenceDirectory: '/unused', evidenceFiles: [], gaps: [],
    observations: [...firstCalls.flatMap((ms, index) => communityCoreWorkloads().map(workload => row(workload.id, index + 1, ms))), row('authored-feature', 1, 5)],
  }
  const before = JSON.stringify(record)
  expect(lanes(record)[0]!.coreFirstMs).toBe(306)
  expect(lanes(record)[0]!.coreMedianMs).toBe(30)
  // The ordinary five-round median stays unchanged, and reports never rewrite clocks.
  expect(lanes({ ...record, identity: { ...record.identity, measurement: { rounds: 5 } }, observations: record.observations.filter(row => row.metrics?.round !== 6) })[0]!.coreFirstMs).toBe(606)
  expect(JSON.stringify(record)).toBe(before)
})


test('current rendering ranks count the fixed positive population and leave unknown historical scores unranked', () => {
  const directory = mkdtempSync(join(tmpdir(), 'community-positive-rank-')),
    store = join(directory, 'store'), out = join(directory, 'published')
  const workloads = ['A', 'B', 'C', 'D', 'parser', 'diagnostic'].map(id => ({ id, family: 'flowchart', source: `flowchart LR\n A[${id}]`, intent: id === 'parser' ? 'parse-only' : id === 'diagnostic' ? 'diagnostic' : 'render', referenceAdmission: { accepted: true }, features: [], provenance: 'Independent fixed-population report counterexample' }))
  try {
    for (const kind of ['whole', 'partial', 'stopped', 'stopped-failed', 'unsupported-families', 'inapplicable', 'unbound', 'legacy', 'unknown-intent', 'unknown-reference', 'conflicting-reference', 'duplicate-id', 'missing-pin'] as const) {
      const project = `fixture/${kind === 'whole' ? 'z-whole' : kind === 'partial' ? 'a-partial' : kind}`,
        evidenceDirectory = join(directory, kind)
      mkdirSync(evidenceDirectory)
      writeFileSync(join(evidenceDirectory, 'result.json'), '{}')
      const inputs = workloads.map(workload => {
        if (kind === 'legacy') { const { intent: _intent, ...old } = workload; return old }
        if (kind === 'unknown-intent' && workload.id === 'A') return { ...workload, intent: 'render-v2' }
        if (kind === 'unknown-reference' && workload.id === 'A') { const { referenceAdmission: _reference, ...old } = workload; return old }
        return workload
      })
      writeBenchmarkDocument(join(evidenceDirectory, 'context.json'), { inputs: { literal: { workloads: kind === 'duplicate-id' ? [...inputs, inputs[0]] : inputs, gaps: kind === 'conflicting-reference' ? ['A: pinned Mermaid rejected source (independent contradiction fixture)'] : [], reference: { version: kind === 'missing-pin' ? '11.16.1' : '12.2.0', parserVersion: '2.0.1', domVersion: '26.1.0' } } } })
      const observation = (caseId: string, status: 'passed' | 'failed' | 'blocked' | 'unsupported' | 'not-applicable', operation = 'render') => ({ suite: 'community', surface: 'browser:public-api', runtime: 'fixture', family: 'flowchart', caseId, operation, format: 'svg', mode: 'feature', status, metrics: { implementation: project, version: 'fixture', round: 1 } })
      const observations = kind === 'unsupported-families' ? [observation('browser-capability', 'passed', 'capability'), observation('family-support:flowchart', 'unsupported', 'family-support')] : ['stopped', 'stopped-failed', 'inapplicable', 'unbound'].includes(kind) ? [observation('browser-capability', kind === 'stopped' ? 'blocked' : kind === 'stopped-failed' ? 'failed' : kind === 'inapplicable' ? 'not-applicable' : 'unsupported', 'capability')] : [observation('family-support:flowchart', 'passed', 'family-support'), ...workloads.filter(workload => kind !== 'partial' || workload.id !== 'D').map(workload => observation(workload.id, kind === 'whole' && !['A', 'B'].includes(workload.id) ? 'failed' : kind === 'partial' && workload.id === 'B' ? 'blocked' : kind === 'partial' && workload.id === 'C' ? 'unsupported' : 'passed'))]
      publishProjectRecord(store, { schemaVersion: 1, id: kind, identity: { project, protocol: { context: 'same' }, artifact: { package: { artifact: { version: 'fixture' } } }, measurement: { rounds: 1 } }, startedAt: '2026-10-27T00:00:00Z', finishedAt: '2026-10-27T00:01:00Z', status: kind === 'whole' || kind === 'stopped-failed' ? 'failed' : kind === 'partial' || kind === 'stopped' ? 'blocked' : 'passed', evidenceDirectory, evidenceFiles: ['result.json'], observations, gaps: [] })
    }
    const result = publishResults(store, out),
      whole = result.lanes.find(lane => lane.project === 'fixture/z-whole')!,
      partial = result.lanes.find(lane => lane.project === 'fixture/a-partial')!,
      markdown = readFileSync(join(out, 'README.md'), 'utf8'),
      cells = (project: string) => markdown.split('\n').find(line => line.includes(`[${project}]`))!.split('|').map(cell => cell.trim())
    expect([whole.passed, whole.failed]).toEqual([2, 4])
    expect([partial.passed, partial.failed, partial.blocked]).toEqual([3, 0, 1])
    expect(positiveRenderScore(whole)).toEqual({ passed: 2, total: 4, rate: 0.5 })
    expect(positiveRenderScore(partial)).toEqual({ passed: 1, total: 4, rate: 0.25 })
    expect(cells('fixture/z-whole')[1]).toBe('1')
    expect(cells('fixture/z-whole')[12]).toBe('50.0% (2/4)')
    expect(cells('fixture/a-partial')[1]).toBe('2')
    expect(cells('fixture/a-partial')[12]).toBe('25.0% (1/4)')
    expect(cells('fixture/stopped')[1]).toBe('3')
    expect(cells('fixture/stopped')[12]).toBe('0.0% (0/4)')
    expect(cells('fixture/stopped-failed')[1]).toBe('4')
    expect(cells('fixture/stopped-failed')[12]).toBe('0.0% (0/4)')
    expect(cells('fixture/unsupported-families')[1]).toBe('5')
    expect(cells('fixture/unsupported-families')[12]).toBe('0.0% (0/4)')
    expect(result.lanes.some(lane => ['fixture/inapplicable', 'fixture/unbound'].includes(lane.project))).toBe(false)
    for (const kind of ['legacy', 'unknown-intent', 'unknown-reference', 'conflicting-reference', 'duplicate-id', 'missing-pin']) {
      expect(cells(`fixture/${kind}`)[1]).toBe('—')
      expect(cells(`fixture/${kind}`)[6]).toBe('100.0% (6/6)')
      expect(positiveRenderScore(result.lanes.find(lane => lane.project === `fixture/${kind}`)!)).toBeNull()
    }
    for (const [kind, message] of [['conflicting-reference', 'Contradictory pinned reference admission'], ['duplicate-id', 'Duplicate workload ID']] as const) {
      const portable = JSON.parse(gunzipSync(readFileSync(join(out, `records/fixture-${kind}.json.gz`))).toString())
      expect(portable.inputEvidence.oracleLedgerComplete).toBe(false)
      expect(portable.inputEvidence.gaps.some((gap: string) => gap.includes(message))).toBe(true)
      expect(portable.observations.filter((row: any) => row.operation === 'render').every((row: any) => row.status === 'passed')).toBe(true)
    }
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
