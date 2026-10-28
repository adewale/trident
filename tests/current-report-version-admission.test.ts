import { expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadCurrentProjectRecords, publishProjectRecord, type ProjectBenchmarkRecord, writeBenchmarkDocument } from '../portable/project-records.ts'
import { renderCandidateComparison } from '../unified/candidate-comparison.ts'
import { communityCoreWorkloads } from '../unified/community.ts'
import { positiveRenderScore, publishResults } from '../unified/league.ts'
import { useTempDirs } from './helpers/temp-dir.ts'

const temp = useTempDirs('trident-current-report-versions-')
function retained(project = 'obsidianmd/pele', version = '1.9.0'): ProjectBenchmarkRecord {
  const evidence = temp.dir()
  writeFileSync(join(evidence, 'result.json'), '{}')
  writeBenchmarkDocument(join(evidence, 'context.json'), { inputs: { literal: {
    reference: { version: '12.2.0', parserVersion: '2.0.1', domVersion: '26.1.0' }, gaps: [],
    workloads: [{ id: 'positive', family: 'flowchart', source: 'flowchart LR; A[Visible]', intent: 'render', referenceAdmission: { accepted: true }, features: [], provenance: 'Independent report fixture' }],
  } } })
  const row = (caseId: string, round: number, ms: number) => ({ suite: 'community', surface: 'node:public-api', runtime: 'Node fixture', family: 'flowchart', caseId, operation: 'render', format: 'svg', mode: 'core-api-repeat', status: 'passed' as const, samplesMs: [ms], metrics: { implementation: project, version, round, firstMs: ms } })
  return { schemaVersion: 1, id: `version-${version}`, identity: { project,
    protocol: { context: 'same' }, artifact: { package: { artifact: { version, sourceRevision: 'abcdef0123456789' }, dependencies: { unrelatedPackage: { version: '99.0.0' } } } }, measurement: { rounds: 6 } },
    startedAt: '2026-10-27T00:00:00Z', finishedAt: '2026-10-27T00:01:00Z', status: 'passed', evidenceDirectory: evidence, evidenceFiles: ['result.json'], gaps: [],
    observations: [...[1, 2, 3, 7, 8, 9].flatMap((ms, index) => communityCoreWorkloads().map(workload => row(workload.id, index + 1, ms))), row('positive', 1, 1)] }
}
function sentinel(out: string) {
  mkdirSync(join(out, 'records'))
  writeFileSync(join(out, 'README.md'), 'previous published report')
  writeFileSync(join(out, 'records/keep'), 'previous owning records')
}
function unchanged(out: string) {
  expect(readFileSync(join(out, 'README.md'), 'utf8')).toBe('previous published report')
  expect(readFileSync(join(out, 'records/keep'), 'utf8')).toBe('previous owning records')
}

for (const scenario of ['old-release', 'later-observation', 'artifact-conflict'] as const) {
  test(`current publisher rejects ${scenario} before touching prior output; raw history stays readable`, () => {
    const record = retained('obsidianmd/pele', scenario === 'old-release' ? '1.8.0' : '1.9.0')
    if (scenario === 'later-observation') record.observations.at(-1)!.metrics!.version = '1.8.0'
    if (scenario === 'artifact-conflict') (record.identity.artifact as any).package.artifact.version = '1.8.0'
    const store = temp.dir(), out = temp.dir()
    publishProjectRecord(store, record)
    sentinel(out)
    expect(() => publishResults(store, out)).toThrow('requires obsidianmd/pele 1.9.0')
    unchanged(out)
    // Raw historical ownership/deserialization is not narrowed to today's pins.
    expect(loadCurrentProjectRecords(store)[0]!.observations).toEqual(record.observations)
  })
}

test('an unpinned tool cannot conceal disagreement between owning artifact and observed release', () => {
  const record = retained('fixture/renderer', '2.0.0')
  ;(record.identity.artifact as any).package.artifact.version = '1.0.0'
  const store = temp.dir(), out = temp.dir()
  publishProjectRecord(store, record)
  expect(() => publishResults(store, out)).toThrow('Mixed tool versions')
  expect(existsSync(join(out, 'README.md'))).toBe(false)
})

test('Pele 1.9 publishes with corrected raw medians; source pins and dependency releases are not tool versions', () => {
  const record = retained(), store = temp.dir(), out = temp.dir()
  publishProjectRecord(store, record)
  const result = publishResults(store, out)
  expect(result.lanes[0]!.version).toBe('1.9.0')
  expect(result.lanes[0]!.coreFirstMs).toBe(30)
  expect(result.lanes[0]!.coreMedianMs).toBe(30)
  expect(readFileSync(join(out, 'README.md'), 'utf8')).toContain('| 1.9.0 |')
})

test('missing owning artifact evidence remains visible and unranked instead of inventing a version', () => {
  const record = retained(), store = temp.dir(), out = temp.dir()
  record.identity.artifact = { package: { error: 'actual artifact unavailable' }, browser: null }
  publishProjectRecord(store, record)
  const result = publishResults(store, out), lane = result.lanes[0]!
  expect(lane.version).toBe('unavailable')
  expect(lane.coreFirstMs).toBeNull()
  expect(lane.coreMedianMs).toBeNull()
  expect(positiveRenderScore(lane)).toBeNull()
  expect(readFileSync(join(out, 'README.md'), 'utf8').split('\n').find(line => line.includes('[obsidianmd/pele]'))).toStartWith('| — |')
})

test('explicit candidate versions are checked against their owning artifact for every project', () => {
  for (const [project, releaseVersion, candidateVersion] of [['adewale/agentic-mermaid','0.4.1','0.4.2'], ['obsidianmd/pele','1.9.0','1.9.1'], ['mermaid-js/mermaid','12.2.0','12.2.1']] as const) {
    const release = retained(project, releaseVersion), candidate = retained(project, candidateVersion)
    candidate.id += '-candidate'; candidate.identity.lane = 'candidate'
    ;(candidate.identity.artifact as any).candidate = { source: 'tarball', sha256: 'c'.repeat(64) }
    const markdown = renderCandidateComparison(candidate, release)
    expect(markdown).toContain('Candidate: ' + candidateVersion)
    expect(markdown).toContain('Release: ' + releaseVersion)
    expect(markdown).toContain('their times compare')
    candidate.observations.at(-1)!.metrics!.version = releaseVersion
    expect(() => renderCandidateComparison(candidate, release)).toThrow('Mixed tool versions')
  }
  const pele = retained(); pele.identity.lane = 'candidate'
  expect(() => renderCandidateComparison(pele, retained('obsidianmd/pele', '1.8.0'))).toThrow('requires obsidianmd/pele 1.9.0')
})

test('results:compare CLI rejects a hidden mismatched observation before replacing its output', () => {
  const release = retained(), candidate = retained()
  candidate.id += '-candidate'
  candidate.identity.lane = 'candidate'
  ;(candidate.identity.artifact as any).candidate = { source: 'tarball', sha256: 'c'.repeat(64) }
  candidate.observations.at(-1)!.metrics!.version = '1.8.0'
  const store = temp.dir(), out = join(temp.dir(), 'comparison.md')
  publishProjectRecord(store, release)
  publishProjectRecord(store, candidate)
  writeFileSync(out, 'previous comparison')
  const result = spawnSync(process.execPath, ['commands.ts', 'results:compare', '--records', store, '--project', 'obsidianmd/pele', '--out', out], { cwd: join(import.meta.dir, '..'), encoding: 'utf8' })
  expect(result.status).not.toBe(0)
  expect(result.stderr).toContain('requires obsidianmd/pele 1.9.0')
  expect(readFileSync(out, 'utf8')).toBe('previous comparison')
})

test('a browser artifact cannot hide an older release behind the valid Node artifact', () => {
  const record = retained(), store = temp.dir(), out = temp.dir()
  ;(record.identity.artifact as any).browser = { version: '1.8.0' }
  publishProjectRecord(store, record)
  expect(() => publishResults(store, out)).toThrow('requires obsidianmd/pele 1.9.0')
  expect(existsSync(join(out, 'README.md'))).toBe(false)
})

test('explicitly unexecuted metadata is not a tool-version claim or a new render', () => {
  const record = retained(), store = temp.dir(), out = temp.dir()
  record.status = 'blocked'
  record.observations.push({ ...record.observations[0]!, caseId: 'not-run', operation: 'capability', mode: 'not-executed', status: 'blocked', samplesMs: undefined, metrics: { implementation: 'obsidianmd/pele', version: '1.8.0', runtimeExecuted: false } })
  publishProjectRecord(store, record)
  expect(publishResults(store, out).lanes[0]!.version).toBe('1.9.0')
})


test.each([
  ['beautiful-mermaid', 'lukilabs/beautiful-mermaid'],
  ['SomeOrg/Renderer', 'someorg/renderer'],
])('release publication reconciles canonical aliases %s and %s before replacing output', (left, right) => {
  const store = temp.dir(), out = temp.dir()
  publishProjectRecord(store, retained(left, '2.0.0'))
  publishProjectRecord(store, retained(right, '3.0.0'))
  sentinel(out)
  expect(() => publishResults(store, out)).toThrow('Mixed tool versions')
  unchanged(out)
})

test('same-release canonical aliases remain independently visible without a mixed-version error', () => {
  const store = temp.dir(), out = temp.dir()
  for (const project of ['beautiful-mermaid', 'lukilabs/beautiful-mermaid']) publishProjectRecord(store, retained(project, '2.0.0'))
  const result = publishResults(store, out)
  expect(result.lanes.map(lane => lane.project).sort()).toEqual(['beautiful-mermaid', 'lukilabs/beautiful-mermaid'])
  expect(result.lanes.map(lane => lane.version)).toEqual(['2.0.0', '2.0.0'])
})
