import { expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { publicTestTables, readPublicTestEvidence } from '../unified/public-test-reporting.ts'
import { baselineComparison, importCampaign, rankedRows, renderSnapshot, validateSnapshot, type ResultsSnapshot } from '../unified/results-snapshot.ts'
import { publishCampaigns, readCampaign } from '../unified/campaign-publication.ts'
import { projectSupport } from '../unified/support.ts'
import type { LineageCatalog } from '../unified/lineage.ts'
import { useTempDirs } from './helpers/temp-dir.ts'

const temp = useTempDirs('public-test-reporting-')
const reference = 'mermaid-js/mermaid', peer = 'adewale/agentic-mermaid'
const receipt = { url: 'https://example.org/public-tests/public-conformance-report.json', sha256: 'a'.repeat(64) }
const catalog: LineageCatalog = { nodes: [reference, peer, 'fixture/unmeasured'].map(id => ({ id, roles: ['renderer'], outputs: ['svg'] })), edges: [] }
const empty = (): ResultsSnapshot => ({ schema: 'trident-results-snapshot-v1', tables: [], attempts: [] })
function retained() {
  const root = temp.dir()
  const archive = JSON.parse(gunzipSync(readFileSync(new URL('./fixtures/conformance/public-tests-v4-evidence.json.gz', import.meta.url))).toString())
  expect(archive.schema).toBe('trident-retained-public-tests-fixture-v1')
  for (const file of archive.files) {
    const bytes = Buffer.from(file.base64, 'base64')
    if (createHash('sha256').update(bytes).digest('hex') !== file.sha256) throw Error('Actual retained native fixture bytes changed')
    const path = join(root, file.path); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, bytes)
  }
  return root
}
const change = (root: string, name: string, apply: (value: any) => void) => { const file = join(root, name), value = JSON.parse(readFileSync(file, 'utf8')); apply(value); writeFileSync(file, JSON.stringify(value)) }

test('actual retained native controls produce one diagnostic table with the eligible scope and full census distinct', () => {
  const directory = retained(), evidence = readPublicTestEvidence(directory), [table] = publicTestTables(directory, receipt, evidence.saved.result.finishedAt)
  expect(evidence.qualification).toMatchObject({ qualified: true, cases: 41 })
  expect(table).toMatchObject({ suite: 'public-conformance', diagnostic: true, population: { total: 'Planned eligible' } })
  expect(table!.columns).toEqual(['Version', 'Passed', 'Failed', 'Unsupported', 'Binding gaps', 'Planned eligible', 'Public scope', 'Total declarations'])
  const rows = rankedRows(table!, id => id)
  expect(rows.map(row => [row.project, row.rank])).toEqual([[reference, 1], [peer, 2]])
  expect(rows[0]!.values).toEqual(['12.2.0', 41, 0, 0, 0, 41, '16 parse; 6 detection; 19 accessibility render', 4060])
  expect(rows[1]!.values.slice(0, 6)).toEqual(['0.4.1', 6, 21, 9, 5, 41])
  expect(baselineComparison(table!, rows[1]!)).toBe('Lower (-35)')
  expect(table!.caption).toContain('23 eligible declarations')
})

test('raw callback/event changes and inflated summaries cannot supply public-test passes', () => {
  const directory = retained()
  change(directory, 'public-conformance-report.json', value => { value.targets[1].counts.passed++ })
  expect(() => readPublicTestEvidence(directory)).toThrow('summary differs')
  const stale = retained()
  change(stale, 'inventory.json', value => { value.callbacks[0].callbackSha256 = 'b'.repeat(64) })
  expect(() => readPublicTestEvidence(stale)).toThrow('source, scope or declaration census')
  const lost = retained(), calls = join(lost, 'YWRld2FsZS9hZ2VudGljLW1lcm1haWQ/calls.jsonl')
  const lines = readFileSync(calls, 'utf8').trim().split('\n'); lines.splice(lines.findIndex(line => JSON.parse(line).type === 'call-result'), 1); writeFileSync(calls, lines.join('\n') + '\n')
  expect(() => readPublicTestEvidence(lost)).toThrow('summary differs')
  const unreviewed = retained(), resultFile = join(unreviewed, 'reference-public-binding/calls.jsonl')
  const events = readFileSync(resultFile, 'utf8').trim().split('\n').map(line => JSON.parse(line)); events.find(event => event.type === 'call-result').disposition = 'unknown-wrapper-status'; writeFileSync(resultFile, events.map(event => JSON.stringify(event)).join('\n') + '\n')
  expect(() => readPublicTestEvidence(unreviewed)).toThrow('unreviewed disposition')
  const producer = retained(); change(producer, 'context.json', value => { value.producers = [] })
  expect(() => readPublicTestEvidence(producer)).toThrow('adapter producer')
})

test('unqualified original controls yield no comparative table or inferred peer failure', () => {
  const directory = retained()
  change(directory, 'original-control/vitest.json', value => { const row = value.testResults.flatMap((file: any) => file.assertionResults).find((row: any) => row.status === 'passed'); row.status = 'failed'; row.failureMessages = ['Synthetic corruption control; no original test was executed'] })
  expect(publicTestTables(directory, receipt, '2026-10-31T13:00:00Z')).toEqual([])
})

test('standalone evidence uses normal publication and snapshot imports without assigning zeros to unmeasured projects', () => {
  const directory = retained(), report = readCampaign(directory)
  expect(report.results[0]).toMatchObject({ suite: 'public-conformance', out: directory })
  const snapshot = importCampaign(empty(), directory, 'https://example.org/public-tests', catalog), output = renderSnapshot(snapshot, catalog)
  expect(snapshot.overviewRanking).toBeUndefined()
  expect(output).toContain('**Diagnostic subset**')
  expect(output).toContain('| mermaid-js/mermaid | 1 | 12.2.0 | 41 | 0 | 0 | 0 | 41 |')
  expect(output).toContain('| adewale/agentic-mermaid | 2 | 0.4.1 | 6 | 21 | 9 | 5 | 41 |')
  expect(output.split('\n').find(line => line.startsWith('| fixture/unmeasured |'))).toContain('Unmeasured: binding gap')
  expect(snapshot.attempts.map(attempt => attempt.project).sort()).toEqual([peer, reference].sort())
  expect(snapshot.tables[0]!.receipt.url).toBe(receipt.url)
  const out = join(temp.dir(), 'published'); publishCampaigns([directory], out, { copyEvidence: true })
  expect(readFileSync(join(out, 'README.md'), 'utf8')).toContain('public-conformance-report.json')
  expect(readPublicTestEvidence(join(out, 'evidence/1')).targets[1]!.counts.passed).toBe(6)
})

test('public-test ties share ranks, all-gap rows stay unranked, and diagnostics cannot replace the ecosystem primary', () => {
  const [table] = publicTestTables(retained(), receipt, '2026-10-31T13:00:00Z')
  table!.rows.push({ project: 'fixture/tie', values: [...table!.rows[0]!.values] })
  expect(rankedRows(table!, id => id).map(row => row.rank)).toEqual([1, 1, 3])
  const unknown = { project: 'fixture/gaps', values: ['1.0', 0, 0, 0, 41, 41, 'same public scope', 4060] }
  table!.rows.push(unknown)
  expect(rankedRows(table!, id => id).find(row => row.project === unknown.project)?.rank).toBeNull()
  expect(baselineComparison(table!, unknown)).toBe('Unresolved')
  const data = importCampaign(empty(), retained(), 'https://example.org/public-tests', catalog)
  data.overviewRanking = data.tables[0]!.id
  expect(() => validateSnapshot(data, catalog)).toThrow('diagnostic table')
  delete data.overviewRanking; data.tables[0]!.diagnostic = false
  expect(() => validateSnapshot(data, catalog)).toThrow('diagnostic subset')
  expect([reference, peer, 'fixture/unmeasured'].map(id => projectSupport(catalog.nodes.find(node => node.id === id)!).suites['public-conformance'].state)).toEqual(['adapter-missing', 'adapter-missing', 'adapter-missing'])
})

test('blocked standalone controls stay importable without invented native evidence or scheduler enrollment', () => {
  const directory = retained()
  change(directory, 'public-conformance-report.json', value => { value.qualification.qualified = false; value.targets = []; value.result.status = 'blocked'; value.result.observations = [] })
  rmSync(join(directory, 'original-control/vitest.json'))
  const data = importCampaign(empty(), directory, 'https://example.org/blocked-controls', catalog)
  expect(data.tables).toHaveLength(0)
  expect(data.attempts.map(attempt => attempt.status)).toEqual(['blocked', 'blocked'])
  const command = new URL('../commands.ts', import.meta.url).pathname
  const selected = spawnSync(process.execPath, [command, 'bench', '--suites', 'public-conformance', '--plan'], { encoding: 'utf8', env: { ...process.env, CI: 'true' } })
  expect(selected.status).not.toBe(0)
  expect(selected.stderr).toContain('standalone diagnostic')
})
