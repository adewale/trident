import { expect, test } from 'bun:test'
import { Worker } from 'node:worker_threads'
import { once } from 'node:events'
import { copyFileSync, readFileSync, writeFileSync, unlinkSync, symlinkSync } from 'node:fs'
import { basename, join } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { collectQualifiedTiming, type QualifiedTimingPublicDriver, type ObserveTimedOutput } from '../portable/qualified-timing-collection.ts'
import { defineCaseEvidenceContract, evidenceBytesDigest as hash } from '../portable/evidence-contract.ts'
import { readCampaign, publishCampaigns } from '../unified/campaign-publication.ts'
import { importCampaign, rankedRows, writeSnapshot, type ResultsSnapshot } from '../unified/results-snapshot.ts'
import { nativeTimingFile } from '../unified/native-timing-report.ts'
import { replayMeasurements } from '../unified/measurement-replay.ts'
import { reviewedDocsCase } from '../unified/docs-drawings.ts'
import { makeSvgCaseContract } from '../fidelity/svg-assessment.ts'
import { terminalProfileCorpus } from '../fidelity/terminal-active-corpus.ts'
import { terminalTimingContract } from '../unified/timing-terminal.ts'
import { pngTimingContract } from '../unified/timing-png.ts'
import type { LineageCatalog } from '../unified/lineage.ts'
import { useTempDirs } from './helpers/temp-dir.ts'
const temp = useTempDirs('native-timing-report-')
const catalog: LineageCatalog = { nodes: ['fixture/a', 'fixture/b'].map(id => ({ id, roles: ['peer'], outputs: ['svg', 'png', 'terminal'], benchmark: { adapter: 'declared', outputs: ['svg'], api: { svg: { export: 'render' } } } })) }
const empty = (): ResultsSnapshot => ({ schema: 'trident-results-snapshot-v1', tables: [], attempts: [] })

test('measurement replay revalidates timing raw bytes and retains unqualified attempts without any new public calls', async () => {
  const f = await capture('svg', true), out = join(temp.dir(), 'replay')
  const receipt = await replayMeasurements({ kind: 'timing', campaign: f.out, out })
  expect(receipt.rendererInvocations).toBe(0)
  const result = JSON.parse(readFileSync(join(out, 'timing-qualification.json'), 'utf8'))
  expect(result.qualified).toBe(false)
  expect(result.rows.every((row: any) => row.ratio === null && row.medianWorkloadMs === null)).toBe(true)
  writeFileSync(f.result.samples[0]!.invocation.output!.path, 'changed actual return')
  await expect(replayMeasurements({ kind: 'timing', campaign: f.out, out: join(temp.dir(), 'tampered') })).rejects.toThrow('changed')
}, 20_000)

async function capture(format: 'svg' | 'png' | 'terminal', unknown = false, caseId?: string, partial = false, candidateProject = 'fixture/b') {
  const root = temp.dir(), out = join(root, 'capture'), worker = join(root, 'worker.mjs')
  const inventory = JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-source-inventory.json.gz', import.meta.url))).toString())
  const input = format === 'terminal' ? terminalProfileCorpus().cases.find(input => input.id === 'terminal:e977db2dd4ba0536')! : inventory.cases.find((input: any) => input.id === 'packages/mermaid/src/docs/syntax/flowchart.md:686')
  const review = JSON.parse(readFileSync(new URL('../corpus/docs-reviewed.json', import.meta.url), 'utf8')).find((review: any) => review.id === input.id)
  const sources = [{ caseId: caseId ?? input.id, source: caseId ? 'independently authored test source' : input.source }]
  const full = caseId ? defineCaseEvidenceContract({ ...sources[0]!, expectations: { literal: 'synthetic output' }, requiredChecks: [{ surface: 'fixture', criterion: 'literal' }] })
    : format === 'terminal' ? terminalTimingContract(input) : format === 'png' ? pngTimingContract(input, review) : makeSvgCaseContract(reviewedDocsCase(input, review))
  const cases = [{ ...full, requiredChecks: partial ? full.requiredChecks.slice(0, 1) : full.requiredChecks }]
  const artifact = { project: 'fixture/a', artifactSha256: hash('synthetic reference'), bindingSha256: hash('fixture worker protocol') }
  const plan = { schema: 'trident-qualified-timing-plan-v1' as const, format, track: 'first-use', boundary: 'Synthetic fixture Worker RPC; no renderer benchmark claim', environmentSha256: hash('fixture host'), observerSha256: hash('fixture observer'), rounds: 6, samplesPerRound: 1, maximumControlSpread: 1000, cases, artifacts: { A0: artifact, A1: artifact, B: { ...artifact, project: candidateProject, artifactSha256: hash('synthetic candidate ' + candidateProject) } } }
  writeFileSync(worker, 'import {serveQualifiedTimingWorker} from ' + JSON.stringify(new URL('../portable/qualified-timing-collection.ts', import.meta.url).href) + ';serveQualifiedTimingWorker(async ()=>{await new Promise(resolve=>setTimeout(resolve,2));return "synthetic output";});')
  const driver: QualifiedTimingPublicDriver = { context: { boundary: plan.boundary, format, track: plan.track, environmentSha256: plan.environmentSha256, artifacts: plan.artifacts }, async open({ artifact, own }) {
    const handle = new Worker(worker); own({ kind: 'node-worker', handle }); await once(handle, 'message')
    return { artifact, execution: { kind: 'node-worker', handle } }
  } }
  const observe: ObserveTimedOutput = ({ contract, bytes }) => ({ schema: 'trident-checked-evidence-v1', caseId: contract.caseId, sourceSha256: contract.sourceSha256, expectationsSha256: contract.expectationsSha256, outputSha256: hash(bytes), observerSha256: plan.observerSha256, checks: contract.requiredChecks.map(check => ({ ...check, status: unknown ? 'unknown' : bytes.toString() === 'synthetic output' ? 'passed' : 'failed', detail: 'Synthetic protocol fixture with declared checks; not renderer evidence' })) })
  return { out, result: await collectQualifiedTiming(plan, sources, driver, observe, out) }
}

for (const format of ['svg', 'png', 'terminal'] as const) test(`native ${format} bundle imports through normal publication with both projects and actual clocks`, async () => {
  const f = await capture(format)
  expect(f.result.qualification.status).toBe('qualified')
  const report = readCampaign(f.out)
  expect(report.projects).toEqual(['fixture/a', 'fixture/b'])
  expect(report.startedAt).toBe(f.result.samples.map(s => s.invocation.startedAt!).sort()[0]!)
  const snapshot = importCampaign(empty(), f.out, 'https://example.test/native', catalog)
  expect(snapshot.attempts.map(row => row.status)).toEqual(['recorded', 'recorded'])
  const table = snapshot.tables[0]!
  expect(table.rows).toHaveLength(2)
  // Exercise the generated pages, whose schema also constrains column names.
  const rendered = temp.dir()
  writeSnapshot(snapshot, catalog, rendered)
  expect(readFileSync(join(rendered, 'results/tables/portable-1.md'), 'utf8')).toContain('artifact ')
  expect(table.caption).toContain(format === 'terminal' ? 'Terminal project documentation and regression fixtures' : 'Mermaid syntax documentation')
  const ratios = table.rows.map(row => row.values[table.columns.indexOf('Ratio to reference')]) as number[]
  expect(ratios[0]).toBe(1)
  expect(ratios[1]).toBe(f.result.qualification.calibration!.candidateRatio!)
  const ranked = rankedRows(table, id => id)
  expect(ranked.map(row => row.values[table.columns.indexOf('Ratio to reference')])).toEqual([...ratios].sort((a, b) => a - b))
  const publication = join(temp.dir(), 'publication')
  publishCampaigns([f.out], publication, { copyEvidence: true })
  expect(readCampaign(join(publication, 'evidence/1')).projects).toEqual(report.projects)
}, 20_000)

test('unqualified native returns remain visible and withhold both projects’ speed ranks', async () => {
  const f = await capture('svg', true)
  expect(f.result.qualification.status).toBe('unqualified')
  const snapshot = importCampaign(empty(), f.out, 'https://example.test/unqualified', catalog)
  expect(snapshot.attempts.every(row => row.status === 'blocked')).toBe(true)
  expect(snapshot.tables).toHaveLength(1)
  const table = snapshot.tables[0]!
  expect(rankedRows(table, id => id).every(row => row.rank === null)).toBe(true)
  expect(table.rows.every(row => row.values[table.columns.indexOf('Median replica-round ms')] === 'withheld')).toBe(true)
  const output = f.result.samples[0]!.invocation.output!
  writeFileSync(output.path, 'tampered bytes')
  expect(() => importCampaign(empty(), f.out, 'https://example.test/tampered', catalog)).toThrow(/changed/)
}, 20_000)

test('driver qualification revisions of one capture import without trusting their cached verdict', async () => {
  const f = await capture('svg'), revision = join(f.out, 'timing-bundle-ffffffffffffffffffffffff.json')
  const finalization = Buffer.from(JSON.stringify({ scope: 'Synthetic selection marker; no driver-finalization policy or renderer claim' }))
  writeFileSync(join(f.out, 'driver-finalization.json'), finalization)
  const bundle = JSON.parse(readFileSync(f.result.bundleFile, 'utf8'))
  bundle.qualification = { status: 'unqualified', gaps: ['Deliberately false saved verdict'], driverFinalizationSha256: hash(finalization) }
  writeFileSync(revision, JSON.stringify(bundle))
  expect(nativeTimingFile(f.out)).toBe(basename(revision))
  expect(readCampaign(f.out).results[0]!.status).toBe('passed')
  expect(importCampaign(empty(), f.out, 'https://example.test/revisions', catalog).tables[0]!.rows).toHaveLength(2)
}, 20000)

test('native publication rejects ambiguous attempts and preserves legacy report routing', async () => {
  const f = await capture('svg')
  const other = JSON.parse(readFileSync(f.result.bundleFile, 'utf8'))
  other.plan.environmentSha256 = '1'.repeat(64)
  writeFileSync(join(f.out, 'timing-bundle-deadbeef.json'), JSON.stringify(other))
  expect(() => readCampaign(f.out)).toThrow(/each native timing attempt/)
  writeFileSync(join(f.out, 'report.json'), JSON.stringify({ schema: 'trident-campaign-v2', startedAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', projects: ['fixture/a'], profile: 'legacy', rounds: 1, results: [] }))
  expect(nativeTimingFile(f.out)).toBeUndefined()
  expect(readCampaign(f.out).profile).toBe('legacy')
  expect(basename(f.result.bundleFile)).toMatch(/^timing-bundle-/)
}, 20_000)

test('a caller’s terminal-looking case ID cannot manufacture upstream corpus provenance', async () => {
  const f = await capture('terminal', false, 'terminal:invented')
  const table = importCampaign(empty(), f.out, 'https://example.test/provenance', catalog).tables[0]!
  expect(table.caption).toContain('Caller-selected fixed corpus')
  expect(table.caption).not.toContain('Corpus: Terminal project corpus')
  expect(rankedRows(table, id => id).every(row => row.rank === null)).toBe(true)
}, 20_000)

test('a qualified output-only bundle cannot replace the full current source obligations', async () => {
  const f = await capture('svg', false, undefined, true)
  expect(f.result.qualification.status).toBe('qualified')
  const snapshot = importCampaign(empty(), f.out, 'https://example.test/partial-contract', catalog)
  expect(snapshot.attempts.every(row => row.status === 'blocked')).toBe(true)
  const table = snapshot.tables[0]!
  expect(rankedRows(table, id => id).every(row => row.rank === null)).toBe(true)
  expect(table.rows.every(row => row.values[table.columns.indexOf('Qualification')] === 'source-unassessed')).toBe(true)
}, 20_000)

test('a native bundle cannot borrow a foreign file through a symlink', async () => {
  const f = await capture('svg'), outside = join(temp.dir(), basename(f.result.bundleFile))
  copyFileSync(f.result.bundleFile, outside)
  unlinkSync(f.result.bundleFile)
  symlinkSync(outside, f.result.bundleFile)
  expect(() => readCampaign(f.out)).toThrow(/owning directory/)
}, 20_000)


test('separate paired controls survive importing several candidates with the same host and workload', async () => {
  const first = await capture('svg'), second = await capture('svg', false, undefined, false, 'fixture/c')
  const expanded = { ...catalog, nodes: [...catalog.nodes, { ...catalog.nodes[1]!, id: 'fixture/c' }] }
  const one = importCampaign(empty(), first.out, 'https://example.test/pair-b', expanded)
  const both = importCampaign(one, second.out, 'https://example.test/pair-c', expanded)
  expect(both.tables).toHaveLength(2)
  expect(both.tables.map(table => table.rows.map(row => row.project).sort()).sort()).toEqual([['fixture/a', 'fixture/b'], ['fixture/a', 'fixture/c']])
  expect(both.tables.every(table => table.rows.length === 2)).toBe(true)
}, 30000)
