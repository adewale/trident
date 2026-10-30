import { afterEach, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { updateProjectRecords } from '../unified/project-update.ts'
import { findProjectRecord, type ProjectBenchmarkIdentity, type ProjectBenchmarkRecord } from '../portable/project-records.ts'
import { CollectionBudgetExhausted, CollectionCheckpoint } from '../portable/checkpoint.ts'
import { collectCampaignBoundary, releaseSelectionProjects } from '../unified/benchmark.ts'
import { assertBenchmarkExecutionAllowed } from '../ci-policy.ts'
import { measurePortableProject } from '../portable/execution.ts'
import { parsePortableOptions } from '../portable/run.ts'
import { portableCases } from '../portable/cohorts.ts'
import { runRetainedSuite } from '../unified/retained-suite.ts'
import type { PortableWorkerResult } from '../portable/protocol.ts'

const directories: string[] = []
afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }) })

test('a force-fresh resume reuses this campaign only, keeping old and other-cohort cache entries fresh', async () => {
  const root = mkdtempSync(join(tmpdir(), 'trident-forced-resume-')); directories.push(root)
  const store = join(root, 'records'), calls: string[] = []
  const identity = (project: string): ProjectBenchmarkIdentity => ({ project, protocol: { sampler: 'fixture' }, artifact: { version: '1.0.0' }, measurement: { rounds: 6 } })
  const request = (project: string, id: string, campaign: string) => ({ identity: identity(project), measure: async (): Promise<ProjectBenchmarkRecord> => {
    calls.push(id)
    const directory = join(root, id); mkdirSync(directory)
    writeFileSync(join(directory, 'output.json'), '{"observed":true}')
    return { schemaVersion: 1, id, identity: identity(project), startedAt: '2026-01-01T00:00:00Z', finishedAt: '2026-01-01T00:01:00Z', status: 'passed', evidenceDirectory: directory, evidenceFiles: ['output.json'], observations: [{ suite: 'community', surface: 'node:public-api', runtime: 'Node', family: 'flowchart', caseId: 'one', operation: 'render', format: 'svg', mode: 'fixture', status: 'passed', metrics: { implementation: project } }], gaps: [], provenance: { collectionCampaignId: campaign } }
  } })
  await updateProjectRecords(store, [request('fixture/a', 'old-a', 'old:core'), request('fixture/b', 'old-b', 'old:core')])
  const freshA = request('fixture/a', 'new-a', 'current:core')
  await expect(updateProjectRecords(store, [freshA, { identity: identity('fixture/b'), measure: async () => { throw new CollectionBudgetExhausted() } }], true)).rejects.toBeInstanceOf(CollectionBudgetExhausted)
  await updateProjectRecords(store, [request('fixture/a', 'interleaved-a', 'other:core')], true)
  const resumed = await updateProjectRecords(store, [{ identity: identity('fixture/a'), measure: async () => { throw Error('Completed campaign project must not rerun') } }, request('fixture/b', 'new-b', 'current:core')], true, 'current:core')
  expect(resumed.map(update => [update.action, update.record.id])).toEqual([['reused', 'new-a'], ['measured', 'new-b']])
  expect(calls).toEqual(['old-a', 'old-b', 'new-a', 'interleaved-a', 'new-b'])
  const external = await updateProjectRecords(store, [request('fixture/a', 'external-a', 'current:external')], true, 'current:external')
  expect(external[0]!.action).toBe('measured')
  expect(findProjectRecord(store, identity('fixture/a'))!.id).toBe('external-a')
  expect(findProjectRecord(store, identity('fixture/a'), 'current:core')!.id).toBe('new-a')
  const normal = await updateProjectRecords(store, [{ identity: identity('fixture/a'), measure: async () => { throw Error('Normal cross-campaign reuse should remain enabled') } }])
  expect(normal[0]!.record.id).toBe('external-a')
})

test('release lookup excludes applications and unbranded descendants but may reconsider a paused version', () => {
  const node = (id: string, extra = {}) => ({ id, roles: ['renderer'], outputs: ['svg'], benchmark: { adapter: 'declared', package: id, outputs: ['svg'] }, ...extra })
  const catalog = { nodes: [node('fixture/root'), node('fixture/fork', { parent: 'fixture/root', relation: 'fork' }), node('fixture/app', { comparisonScope: { kind: 'application', reason: 'Editor workflow' } }), node('fixture/paused', { benchmark: { adapter: 'declared', package: 'paused', version: '1.0.0', outputs: ['svg'], skip: { version: '1.0.0', reason: 'Broken release' } } })] }
  const ids = catalog.nodes.map(project => project.id)
  expect(releaseSelectionProjects(catalog, ids)).toEqual(['fixture/paused', 'fixture/root'])
  expect(releaseSelectionProjects(catalog, ids, true)).toEqual(['fixture/fork', 'fixture/paused', 'fixture/root'])
})

let localCollection = true
try { assertBenchmarkExecutionAllowed() } catch { localCollection = false }
test.skipIf(!localCollection)('early admission failure retains the actual SVG from the first scheduled replica', async () => {
  const root = mkdtempSync(join(tmpdir(), 'trident-admission-witness-')); directories.push(root)
  const tool = join(root, 'tool'); mkdirSync(tool); mkdirSync(join(root, 'svg'))
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><text x="5" y="20">Wrong</text></svg>'
  writeFileSync(join(tool, 'package.json'), '{"name":"fixture-witness","version":"1.0.0","type":"module"}')
  const entry = join(tool, 'index.mjs'); writeFileSync(entry, `export function render(){return {svg:${JSON.stringify(svg)}}}`)
  const options = parsePortableOptions(['--project', 'fixture/witness', '--artifact-root', tool, '--rounds', '1', '--samples', '1', '--cold-samples', '1', '--min-sample-ms', '0'])
  const results: PortableWorkerResult[] = []
  await measurePortableProject({ project: 'fixture/witness', root: tool, entry, version: '1.0.0', adapter: 'pele' }, portableCases(['family'], ['family:flowchart']), options, root, result => results.push(result), new CollectionCheckpoint(root, { fixture: 'witness' }))
  expect(results.filter(result => result.mode === 'warm').map(result => [result.replica, result.status])).toEqual([['A1', 'failed']])
  expect(readdirSync(join(root, 'svg'))).toEqual(['family_flowchart.svg'])
  expect(readFileSync(join(root, 'svg/family_flowchart.svg'), 'utf8')).toBe(svg)
}, 30_000)


test.skipIf(!localCollection)('forced retained-suite resume keeps same-campaign history and original dates', async () => {
  const root = mkdtempSync(join(tmpdir(), 'trident-retained-campaign-')); directories.push(root)
  const records = join(root, 'records'), calls: string[] = []
  const run = (project: string, campaign: string, resume = false, forbid = false, force = true) => runRetainedSuite({ out: join(root, project), records, force, campaign: { id: campaign, resume }, identity: () => ({ project, protocol: 'fixture', artifact: '1.0.0', measurement: 'fixed' }), measure: async () => {
    if (forbid) throw Error('Completed retained unit must not rerun')
    calls.push(project + ':' + campaign)
    return { id: 'fixture', status: 'passed', startedAt: '2026-01-01T00:00:00Z', finishedAt: '2026-01-01T00:01:00Z', observations: [{ suite: 'fixture', surface: 'public-api', runtime: 'Node', family: 'flowchart', caseId: 'one', operation: 'render', format: 'svg', mode: 'fixture', status: 'passed' }], gaps: [] }
  } })
  await run('a', 'old:core'); await run('b', 'old:core')
  const first = await run('a', 'current:core')
  await run('a', 'interleaved:core')
  const resumed = await run('a', 'current:core', true, true)
  expect([resumed.startedAt, resumed.finishedAt]).toEqual([first.startedAt, first.finishedAt])
  await run('b', 'current:core', true)
  expect(calls).toEqual(['a:old:core', 'b:old:core', 'a:current:core', 'a:interleaved:core', 'b:current:core'])
  await run('a', 'current:external', true)
  await run('a', 'new:core', false, true, false)
  expect(calls.at(-1)).toBe('a:current:external')
})


test('resumed boundary collection adds active windows without counting idle pause time', async () => {
  const originalNow = Date.now, results: any[] = [], boundary = { suite: 'portable', project: 'fixture/a', out: '/fixture', cohort: 'pilot:family:flowchart' }
  let clock = 0, saves = 0
  Date.now = () => clock
  try {
    await collectCampaignBoundary(results, 1000, boundary, async () => { clock = 2000; throw new CollectionBudgetExhausted() }, () => saves++)
    expect([results[0].elapsedSeconds, results[0].completed]).toEqual([2, false])
    clock = 1_000_000
    await collectCampaignBoundary(results, clock + 500, boundary, async () => { clock += 1000; return { status: 'passed', samples: [2, 3], finishedAt: 'original-measurement-date' } }, () => saves++)
    expect([results[0].elapsedSeconds, results[0].completed]).toEqual([3, true])
    expect(results[0].samples).toEqual([2, 3])
    expect(results[0].finishedAt).toBe('original-measurement-date')
    await collectCampaignBoundary(results, 0, boundary, async () => { throw Error('Completed boundary must not rerun') }, () => saves++)
    expect(saves).toBe(2)
  } finally { Date.now = originalNow }
})

for (const failedProcess of [3, 5]) test.skipIf(!localCollection)(`a later warm failure retains its actual SVG without replacing the representative (process ${failedProcess})`, async () => {
  const root = mkdtempSync(join(tmpdir(), 'trident-later-witness-')); directories.push(root)
  const tool = join(root, 'tool'); mkdirSync(tool); mkdirSync(join(root, 'svg'))
  const good = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><text x="5" y="20">Visible</text></svg>'
  const bad = good.replace('Visible', 'Wrong')
  writeFileSync(join(tool, 'package.json'), '{"name":"fixture-later-witness","version":"1.0.0","type":"module"}')
  const entry = join(tool, 'index.mjs')
  writeFileSync(entry, `import{existsSync,readFileSync,writeFileSync}from'node:fs';const file=new URL('../processes.txt',import.meta.url);const number=(existsSync(file)?Number(readFileSync(file,'utf8')):0)+1;writeFileSync(file,String(number));export function render(){return {svg:number===${failedProcess}?${JSON.stringify(bad)}:${JSON.stringify(good)}}}`)
  const round = failedProcess === 5 ? 2 : 1
  const options = parsePortableOptions(['--project', 'fixture/later-witness', '--artifact-root', tool, '--rounds', String(round), '--samples', '1', '--cold-samples', '1', '--min-sample-ms', '0'])
  const results: PortableWorkerResult[] = []
  await measurePortableProject({ project: 'fixture/later-witness', root: tool, entry, version: '1.0.0', adapter: 'pele' }, [{ id: 'fixture:witness', family: 'flowchart', cohort: 'adversarial', source: 'flowchart LR\nA[Visible]', expected: { accept: true, labels: ['Visible'] } }], options, root, result => results.push(result), new CollectionCheckpoint(root, { fixture: 'later-witness' }))
  const warm = results.filter(result => result.mode === 'warm')
  expect(warm[0]!.qualification?.evidence?.outputAdmission).toBe('passed')
  expect(warm.filter(result => result.status === 'failed').map(result => [result.round, result.replica])).toEqual([[round, 'B']])
  expect(readFileSync(join(root, 'svg/fixture_witness.svg'), 'utf8')).toBe(good)
  expect(readFileSync(join(root, `failures/fixture_witness-warm-r${round}-B-0.svg`), 'utf8')).toBe(bad)
  expect(readdirSync(join(root, 'failures')).filter(name => name.endsWith('.svg'))).toHaveLength(1)
}, 30_000)
