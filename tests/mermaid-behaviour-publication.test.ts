import { expect, test } from 'bun:test'
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { useTempDirs } from './helpers/temp-dir.ts'
import corpus from '../corpus/mermaid-behaviour-tests.json' with { type: 'json' }
import { replayMermaidBehaviours } from '../unified/mermaid-behaviour.ts'
import { captureBehaviourRaw, runNativeBehaviours, type BehaviourAdapter } from '../unified/mermaid-behaviour-capture.ts'
import { campaignResults, readCampaign } from '../unified/campaign-publication.ts'
import { campaignTables } from '../unified/campaign-tables.ts'
import { baselineComparison, rankedRows, renderSnapshot } from '../unified/results-snapshot.ts'
import { CAMPAIGN_SUITES, DEFAULT_SUITES, projectSupport } from '../unified/support.ts'
import type { LineageCatalog } from '../unified/lineage.ts'
const temp = useTempDirs('behaviour-publication-'), reference = 'mermaid-js/mermaid', peer = 'adewale/agentic-mermaid', absent = 'fixture/unrun'
const catalog: LineageCatalog = { nodes: [reference, peer, absent, 'fixture/native'].map(id => ({ id, roles: ['peer'], outputs: ['svg'], benchmark: { adapter: 'declared', outputs: ['svg'], api: { svg: { export: 'render' } } } })) }
const receipt = { url: 'https://example.test/behaviour/report.json', sha256: 'a'.repeat(64) }
function parentFixture() {
  const directory = temp.dir(), saved = JSON.parse(gunzipSync(readFileSync(new URL('./fixtures/conformance/public-tests-expanded154-evidence.json.gz', import.meta.url))).toString())
  for (const file of saved.files) { const path = join(directory, file.path); mkdirSync(join(path, '..'), { recursive: true }); writeFileSync(path, file.text) }
  return directory
}
test('normal campaign publication reopens actual49 behaviours, retains unrun rows and ranks verified counts', () => {
  const out = join(temp.dir(), 'replay'); replayMermaidBehaviours({ evidence: parentFixture(), out, projects: [reference, peer, absent] })
  const report = readCampaign(out)
  expect(report.results[0]!.suite).toBe('mermaid-behaviour')
  expect(campaignResults(report.results[0]!)[0]!.observations).toHaveLength(147)
  const tables = campaignTables(report, receipt), entry = tables[0]!
  expect(tables).toHaveLength(1)
  expect(entry.rows.map(row => row.values.slice(1, 6))).toEqual([[49, 0, 0, 0, 49], [29, 0, 20, 0, 49], [0, 0, 0, 49, 49]])
  expect(rankedRows(entry, id => id).map(row => [row.project, row.rank])).toEqual([[reference, 1], [peer, 2], [absent, 3]])
  expect(baselineComparison(entry, entry.rows[1]!)).toBe('Fewer verified (-20); outcome unresolved')
  expect(baselineComparison(entry, entry.rows[2]!)).toBe('Fewer verified (-49); outcome unresolved')
  expect(entry.rows[2]!.values.at(-1)).toBe('Unknown; no recorded public call')
  expect(entry.caption).toContain(corpus.sourceCommit)
  expect(entry.caption).toContain('detail checks are not extra votes')
  const data = { schema: 'trident-results-snapshot-v1' as const, tables, attempts: [] }
  expect(renderSnapshot(data, catalog)).toContain('Observable Mermaid Behaviour')
  expect(projectSupport(catalog.nodes[0]!).suites['mermaid-behaviour'].state).toBe('adapter-missing')
  expect([...DEFAULT_SUITES, ...CAMPAIGN_SUITES]).not.toContain('mermaid-behaviour')
  const file = join(out, 'report.json'), changed = JSON.parse(readFileSync(file, 'utf8')); changed.targets[1].counts.passed = 49; writeFileSync(file, JSON.stringify(changed))
  expect(() => readCampaign(out)).toThrow('re-evaluated')
}, 15000)
test('normal native-only publication retains the actual qualified reference without inventing a reference target or clock', () => {
  const referenceOut = join(temp.dir(), 'reference'); replayMermaidBehaviours({ evidence: parentFixture(), out: referenceOut })
  const root = temp.dir(), adapterFile = join(root, 'bridge.mjs'), artifact = join(root, 'public.mjs'); writeFileSync(adapterFile, '// synthetic bridge'); writeFileSync(artifact, '// synthetic public artifact')
  const adapter: BehaviourAdapter = { schema: 'mermaid-behaviour-stdio-adapter-v1', project: 'fixture/native', version: 'fixture1', executable: realpathSync(process.execPath), adapter: adapterFile, artifactFiles: [artifact], capabilities: ['detect-family'], bindingDescription: 'Synthetic retained raw-journal fixture; no project process' }
  const capture = join(temp.dir(), 'capture'), input = corpus.cases.find(row => row.operation === 'detect-family')!
  captureBehaviourRaw(capture, adapter, [input], () => ({ status: 0, signal: null, stdout: Buffer.from('{"family":"flowchart"}'), stderr: new Uint8Array() }))
  const out = join(temp.dir(), 'native'); runNativeBehaviours({ capture, reference: referenceOut, out })
  const report = readCampaign(out), table = campaignTables(report, receipt)[0]!
  expect(table.rows.map(row => row.project)).toEqual(['fixture/native'])
  expect(table.rows[0]!.values.slice(1, 6)).toEqual([1, 0, 0, 48, 49])
  expect(table.rows[0]!.values.at(-1)).toBe(table.measuredAt)
  expect(table.caption).toContain('Actual Mermaid reference qualification: qualified')
  expect(table.caption).toContain('no reference target row is invented')
  expect(baselineComparison(table, table.rows[0]!)).toBe('No reference score')
  expect(campaignResults(report.results[0]!)[0]!.observations.filter(row => row.metrics?.caseOutcome === 'unrun').every(row => row.metrics?.measuredAt === null)).toBe(true)
}, 15000)
