import { afterEach, expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { gunzipSync, gzipSync } from 'node:zlib'
import { CollectionBudgetExhausted, CollectionCheckpoint } from '../portable/checkpoint.ts'
import { FULL_SAMPLING, PORTABLE_MEASUREMENT_PROTOCOL } from '../portable/protocol.ts'
import { portableCases } from '../portable/cohorts.ts'
import { calibrate } from '../portable/statistics.ts'
import { parsePortableOptions } from '../portable/run.ts'
import { summarizePilot, pilotMarkdown } from '../unified/pilot-summary.ts'
import { campaignTables } from '../unified/campaign-tables.ts'
import { importCampaign, rankedRows, validateSnapshot } from '../unified/results-snapshot.ts'
import { stableReleaseBefore, resolveReleaseCatalog } from '../unified/release-selection.ts'
import { loadCampaignPreparation } from '../unified/campaign-preparation.ts'
import { verifyReleaseArchive } from '../scripts/package-release.ts'

const directories: string[] = []
const temp = () => { const root = mkdtempSync(join(tmpdir(), 'trident-workflow-')); directories.push(root); return root }
const write = (file: string, value: unknown) => writeFileSync(file, JSON.stringify(value))
const sha = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex')
afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }) })

test('pilot headlines use owning counts, reconcile pauses, and reject foreign/duplicate evidence', () => {
  const root = temp(), rows: any[] = []
  for (const [project, semantic, seconds] of [['fixture/one', 1, 2], ['fixture/two', 0, 1]] as const) {
    const id = project.replace('/', '--'), directory = join(root, id); mkdirSync(directory)
    write(join(directory, 'report.json'), { project, summary: { cases: [{ id: 'family:flowchart' }], counts: { positiveCases: 1, outputAdmissionCases: 1, completeSemanticCases: semantic, outputCalibratedTimingRows: 1, totalTimingRows: 3 } } })
    rows.push({ project, caseId: 'family:flowchart', seconds, report: '/obsolete/workspace/pilot/' + id + '/report.json', summary: { counts: { completeSemanticCases: 0 } } })
  }
  rows.push({ project: 'fixture/one', caseId: 'scaling:class:128', cancelledForBudget: true }, { project: 'fixture/two', caseId: 'scaling:class:128', status: 'not-started-budget-exhausted' })
  const file = join(root, 'summary.json'); write(file, { rows, completeSemanticCases: 0 })
  const summary = summarizePilot(file)
  expect(summary.counts).toEqual({ planned: 4, collected: 2, cancelled: 1, notStarted: 1, incomplete: 0, positiveCases: 2, outputAdmissionCases: 2, semanticCompleteCases: 1 })
  expect(pilotMarkdown(summary)).toContain('1/2 completed the declared semantic checks')
  expect(pilotMarkdown(summary).indexOf('| 1 | fixture/two')).toBeLessThan(pilotMarkdown(summary).indexOf('| 2 | fixture/one'))
  write(file, { rows: [...rows, rows[0]] }); expect(() => summarizePilot(file)).toThrow('Duplicate')
  write(file, { rows }); write(join(root, 'fixture--one/report.json'), { project: 'somebody/else' })
  expect(() => summarizePilot(file)).toThrow('differs')
})

test('a shared deadline retains complete units, resumes them once, and binds identity and bytes', async () => {
  const root = temp(), identity = { artifact: 'a', rounds: 6 }, first = new CollectionCheckpoint(root, identity)
  let calls = 0
  expect(await first.collect('round-1', async () => ({ calls: ++calls }))).toEqual({ calls: 1 })
  const paused = new CollectionCheckpoint(root, identity, Date.now() - 1)
  expect(await paused.collect<{ calls: number }>('round-1', async () => { throw Error('must not rerun') })).toEqual({ calls: 1 })
  await expect(paused.collect('round-2', async () => ({ calls: ++calls }))).rejects.toBeInstanceOf(CollectionBudgetExhausted)
  expect(calls).toBe(1)
  const resumed = new CollectionCheckpoint(root, identity, Date.now() + 10_000)
  expect(resumed.startedAt).toBe(first.startedAt)
  expect(await resumed.collect('round-2', async () => ({ calls: ++calls }))).toEqual({ calls: 2 })
  expect(() => new CollectionCheckpoint(root, { ...identity, artifact: 'b' })).toThrow('identity changed')
  const file = join(root, 'checkpoint.jsonl.gz'), data = gunzipSync(readFileSync(file)).toString().trim().split('\n').map(line => JSON.parse(line))
  data[0].value.calls = 99
  writeFileSync(file, gzipSync(data.map(row => JSON.stringify(row)).join('\n') + '\n'))
  expect(() => new CollectionCheckpoint(root, identity)).toThrow('changed')
})

test('full sampling has independent-round uncertainty with 70 percent fewer cold launch slots', () => {
  expect(FULL_SAMPLING).toEqual({ rounds: 6, samples: 31, coldSamples: 5 })
  const options = parsePortableOptions(['--project', 'fixture/tool', '--artifact-root', '/unused'])
  expect([options.rounds, options.samples, options.coldSamples]).toEqual([6, 31, 5])
  expect(PORTABLE_MEASUREMENT_PROTOCOL).toBe('portable-svg-processes-v7')
  const rounds = Array.from({ length: FULL_SAMPLING.rounds }, (_, index) => ({ round: index + 1, A0: Array(5).fill(10), A1: Array(5).fill(10), B: Array(5).fill(10) }))
  expect(calibrate(rounds, 5).roundRatioUncertainty?.replicaB.interval?.confidence).toBeGreaterThanOrEqual(.95)
  rounds[1]!.A1 = Array(5).fill(20)
  expect(calibrate(rounds, 5).status).toBe('uncalibrated')
  expect(portableCases()).toHaveLength(54)
  expect(11 * portableCases().filter(row => row.expected.accept).length * 3 * FULL_SAMPLING.rounds * FULL_SAMPLING.coldSamples).toBe(50490)
})

const receipt = { url: 'https://example.org/evidence/report.json', sha256: 'a'.repeat(64) }
function docsFixture(root: string) {
  const out = join(root, 'docs'); mkdirSync(out)
  write(join(out, 'inventory.json'), { cases: [{ id: 'one' }, { id: 'two' }] })
  const observations: any[] = []
  for (const project of ['Fixture/A', 'fixture/b']) for (let round = 1; round <= 6; round++) for (const id of ['one', 'two']) observations.push({ suite: 'docs', surface: 'browser:svg', runtime: 'Chromium', format: 'svg', family: 'flowchart', operation: 'render', mode: 'one-public-call', caseId: id, status: project === 'Fixture/A' && id === 'two' && round === 3 ? 'failed' : 'passed', metrics: { project, version: '1.0.0', round }, samplesMs: [1] })
  write(join(out, 'result.json'), { id: 'docs', startedAt: '2026-01-01', finishedAt: '2026-01-02', observations, gaps: [] })
  const report: any = { schema: 'trident-campaign-v2', startedAt: '2026-02-01', updatedAt: '2026-02-02', rounds: 6, profile: 'full', projects: ['Fixture/A', 'fixture/b'], requestedSuites: ['docs'], results: [{ suite: 'docs', status: 'failed', out }] }
  write(join(root, 'report.json'), report)
  return { out, observations, report }
}

test('campaign imports generate ranked tables and charts from the full docs inventory without transcription', () => {
  const root = temp(), { report } = docsFixture(root)
  const tables = campaignTables(report, receipt), entry = tables[0]!
  expect(tables).toHaveLength(1)
  expect(entry.rows.find(row => row.project === 'Fixture/A')?.values).toEqual(['1.0.0', 1, 1, 0, 0, 0, 0, 2, '2026-01-02'])
  expect(entry.rows.find(row => row.project === 'fixture/b')?.values[1]).toBe(2)
  expect(rankedRows(entry, id => id).map(row => [row.project, row.rank])).toEqual([['fixture/b', 1], ['Fixture/A', 2]])
  expect(entry.chart?.denominator).toBe('Planned')
  const catalog: any = { nodes: report.projects.map((id: string) => ({ id, roles: ['renderer'], outputs: ['svg'], benchmark: { adapter: 'declared', package: id, outputs: ['svg'], api: { svg: { export: 'render' } } } })), edges: [] }
  const imported = importCampaign({ schema: 'trident-results-snapshot-v1', tables: [], attempts: [] }, root, 'https://example.org/evidence', catalog)
  expect(imported.tables).toHaveLength(1)
  expect(imported.attempts.find(attempt => attempt.project === 'Fixture/A')!.groups.length).toBeGreaterThan(0)
  expect(imported.overviewRanking).toBe(imported.tables[0]!.id)
  expect(() => validateSnapshot(imported, catalog)).not.toThrow()
  report.pilot = true; write(join(root, 'report.json'), report)
  expect(() => importCampaign(imported, root, 'https://example.org/evidence', catalog)).toThrow('Pilot')
})

test('missing docs rounds retain partial observations without a rank, and duplicates cannot inflate a return rate', () => {
  const root = temp(), { out, observations, report } = docsFixture(root)
  const own = observations.filter(row => !(row.metrics.project === 'fixture/b' && row.caseId === 'two' && row.metrics.round === 6))
  write(join(out, 'result.json'), { id: 'docs', finishedAt: '2026-01-02', observations: own })
  const entry = campaignTables(report, receipt)[0]!
  expect(entry.rows.find(row => row.project === 'fixture/b')!.values.slice(1, 8)).toEqual([1, 0, 0, 0, 0, 1, 2])
  expect(rankedRows(entry, id => id).find(row => row.project === 'fixture/b')!.rank).toBeNull()
  write(join(out, 'result.json'), { id: 'docs', finishedAt: '2026-01-02', observations: [...own, own[0]] })
  expect(() => campaignTables(report, receipt)).toThrow('inventory/rounds')
})

test('observation counts compare equal populations and keep incompatible populations separate', () => {
  const root = temp(), out = join(root, 'fidelity'); mkdirSync(out)
  const observation = (project: string, caseId: string, status: string) => ({ suite: 'fidelity', surface: 'browser-owned-ink', runtime: 'Chromium', format: 'svg', operation: 'criterion', mode: 'label', family: 'flowchart', caseId, status, metrics: { project, version: '1.0.0' } })
  const rows = [observation('Fixture/A', 'one', 'passed'), observation('Fixture/A', 'two', 'failed'), observation('fixture/b', 'one', 'passed'), observation('fixture/b', 'two', 'passed')]
  const report: any = { projects: ['Fixture/A', 'fixture/b'], rounds: 1, results: [{ suite: 'fidelity', out }] }
  write(join(out, 'result.json'), { finishedAt: '2026-01-02', observations: rows })
  const tables = campaignTables(report, receipt)
  expect(tables).toHaveLength(1)
  expect(tables[0]!.rows.map(row => row.project)).toEqual(['Fixture/A', 'fixture/b'])
  expect(rankedRows(tables[0]!, id => id)[0]!.project).toBe('fixture/b')
  rows.push(observation('fixture/b', 'extra', 'passed'))
  write(join(out, 'result.json'), { finishedAt: '2026-01-02', observations: rows })
  expect(campaignTables(report, receipt)).toHaveLength(2)
})

test('release selection respects the cutoff and refuses a new CLI release without an archive binding', async () => {
  const cutoff = '2026-01-15T00:00:00Z'
  expect(stableReleaseBefore([{ version: '1.0.0', at: '2026-01-01' }, { version: '2.0.0-rc.1', at: '2026-01-02' }, { version: '2.0.0', at: '2026-02-01' }], cutoff, row => row.version, row => row.at).version).toBe('1.0.0')
  const catalog: any = { nodes: [{ id: 'fixture/npm', outputs: ['svg'], roles: ['renderer'], benchmark: { adapter: 'declared', package: 'fixture' }, packages: [{ registry: 'npm', name: 'fixture', version: '0.1.0', gitHead: 'old' }] },
    { id: 'fixture/cli', outputs: ['terminal'], roles: ['renderer'], release: { tag: 'v1.0.0', commit: 'a'.repeat(40) }, benchmark: { adapter: 'source-cli', cliRelease: { version: '1.0.0', revision: 'a'.repeat(40) } } }] }
  const frozen = await resolveReleaseCatalog(catalog, ['fixture/npm', 'fixture/cli'], cutoff, temp(), async (kind, _name, url) => kind === 'npm' ? { versions: { '1.0.0': { gitHead: 'new' }, '2.0.0': {} }, time: { '1.0.0': '2026-01-01', '2.0.0': '2026-02-01' } } : url.includes('/commits/') ? { sha: 'b'.repeat(40) } : [{ tag_name: 'v2.0.0', published_at: '2026-01-02' }])
  expect(frozen.catalog.nodes[0]!.benchmark.version).toBe('1.0.0')
  expect(frozen.catalog.nodes[0]!.packages[0].gitHead).toBe('new')
  expect(frozen.catalog.nodes[1]!.benchmark.preparationError).toContain('reviewed CLI archive/binding')
  expect(catalog.nodes[0].packages[0].version).toBe('0.1.0')
  const source: any = { nodes: [{ id: 'fixture/source', benchmark: { adapter: 'source-cli', sourcePin: 'c'.repeat(40) } }] }
  const pinned = await resolveReleaseCatalog(source, ['fixture/source'], cutoff, temp(), async () => [])
  expect(pinned.catalog.nodes[0]!.benchmark.preparationError).toBeUndefined()
  expect(pinned.catalog.nodes[0]!.benchmark.sourcePin).toBe('c'.repeat(40))
  const future: any = { nodes: [{ ...catalog.nodes[1], release: { tag: 'v9.0.0', commit: 'b'.repeat(40) } }] }
  const selected = await resolveReleaseCatalog(future, ['fixture/cli'], cutoff, temp(), async (_kind, _name, url) => url.includes('/commits/') ? { sha: 'a'.repeat(40) } : [{ tag_name: 'v1.0.0', published_at: '2026-01-01' }])
  expect(selected.catalog.nodes[0]!.release.tag).toBe('v1.0.0')
  expect(selected.catalog.nodes[0]!.benchmark.preparationError).toBeUndefined()
})

test('one preparation index rejects modified or escaping component files', () => {
  const root = temp(), files: any = {}
  for (const key of ['catalog', 'prepared', 'browsers', 'inputs', 'inventories']) {
    const file = join(root, key + '.json'); write(file, key === 'prepared' || key === 'browsers' ? [] : {})
    files[key] = { path: key + '.json', sha256: sha(file) }
  }
  const file = join(root, 'preparation.json')
  write(file, { schema: 'trident-campaign-preparation-v1', projects: [], artifacts: [], files })
  expect(loadCampaignPreparation(file).options.communityArtifactPolicy).toBe('frozen')
  write(join(root, 'inputs.json'), { changed: true })
  expect(() => loadCampaignPreparation(file)).toThrow('changed')
  files.inputs.path = '../escape.json'; write(file, { schema: 'trident-campaign-preparation-v1', projects: [], artifacts: [], files })
  expect(() => loadCampaignPreparation(file)).toThrow('escaped')
})

test('release verification checks the actual archive, extracted manifest and executable version', () => {
  const root = temp(), kit = join(root, 'trident-1.0.0'); mkdirSync(kit)
  const entry = join(kit, 'run.mjs'); writeFileSync(entry, "console.log('Trident 1.0.0')")
  write(join(kit, 'harness-artifact.json'), { files: [{ path: 'run.mjs', sha256: sha(entry) }] })
  const archive = join(root, 'kit.tar.gz'); execFileSync('tar', ['-czf', archive, '-C', root, 'trident-1.0.0'])
  expect(verifyReleaseArchive(archive, sha(archive), join(root, 'extracted'), '1.0.0').kit).toBe(join(root, 'extracted/trident-1.0.0'))
  expect(() => verifyReleaseArchive(archive, 'f'.repeat(64), join(root, 'bad'), '1.0.0')).toThrow('checksum')
  writeFileSync(entry, "console.log('Trident WRONG')")
  execFileSync('tar', ['-czf', archive, '-C', root, 'trident-1.0.0'])
  expect(() => verifyReleaseArchive(archive, sha(archive), join(root, 'tampered'), '1.0.0')).toThrow('manifest')
})

test('portable tables keep invalid rejection separate and never rank unmeasured output as zero', () => {
  const root = temp(), out = join(root, 'portable'); mkdirSync(out)
  const cases = [{ id: 'positive', expectedAccepted: true, outputAdmission: 'passed', failedWorkers: 0, blockedWorkers: 0, semanticComplete: false }, { id: 'negative', expectedAccepted: false, acceptanceMatches: true, failedWorkers: 0, blockedWorkers: 0 }]
  const result = { project: 'Fixture/A', version: '1.0.0', protocol: PORTABLE_MEASUREMENT_PROTOCOL, finishedAt: '2026-01-01', sampling: FULL_SAMPLING, summary: { cases, timing: [{ expectedAccepted: false, medianMs: 1 }] } }
  write(join(out, 'report.json'), result)
  const campaign: any = { schema: 'trident-campaign-v2', results: [{ suite: 'portable', out }] }
  const tables = campaignTables(campaign, receipt)
  expect(tables).toHaveLength(1)
  expect(tables[0]!.rows[0]!.values.slice(1, 10)).toEqual([1, 0, 0, 0, 0, 1, 1, 1, 0])
  expect(rankedRows(tables[0]!, id => id)[0]!.rank).toBe(1)
  cases[0]!.outputAdmission = 'incomplete'
  write(join(out, 'report.json'), result)
  expect(rankedRows(campaignTables(campaign, receipt)[0]!, id => id)[0]!.rank).toBeNull()
})

test('inapplicable and skipped observations keep their own counts and receive no rank', () => {
  const root = temp(), out = join(root, 'fidelity'); mkdirSync(out)
  const observations = ['not-applicable', 'skipped', 'blocked'].map((status, index) => ({ suite: 'fidelity', surface: 'browser', runtime: 'Chromium', format: 'svg', caseId: 'one', operation: 'criterion', mode: 'capability', family: 'flowchart', status, metrics: { project: 'fixture/' + index, version: '1.0.0' } }))
  write(join(out, 'result.json'), { id: 'fidelity', finishedAt: '2026-01-02', observations })
  const table = campaignTables({ projects: observations.map(row => row.metrics.project), results: [{ suite: 'fidelity', out }] } as any, receipt)[0]!
  expect(table.rows[0]!.values[table.columns.indexOf('Not applicable')]).toBe(1)
  expect(table.rows[1]!.values[table.columns.indexOf('Skipped')]).toBe(1)
  expect(table.rows.every(row => row.values[table.columns.indexOf('Unavailable')] === 0)).toBe(true)
  expect(rankedRows(table, id => id).map(row => row.rank)).toEqual([null, null, null])
})
