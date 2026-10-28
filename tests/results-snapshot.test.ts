import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { importCampaign, renderSnapshot, validateSnapshot, writeSnapshot, type ResultsSnapshot } from '../unified/results-snapshot.ts'
import type { LineageCatalog } from '../unified/lineage.ts'

const receipt = { url: 'https://example.org/evidence/report.json', sha256: 'a'.repeat(64) }
const catalog: LineageCatalog = { nodes: [
  { id: 'fixture/zebra', outputs: ['svg'], roles: ['peer'], benchmark: { adapter: 'declared', outputs: ['svg'], api: { svg: { export: 'render' } } } },
  { id: 'fixture/alpha', outputs: ['ascii'], roles: ['peer'] },
  { id: 'fixture/clone', outputs: ['svg'], roles: ['peer'], comparisonBranding: { distinct: false, evidence: 'No separate brand' } },
], edges: [{ from: 'fixture/clone', to: 'fixture/zebra', relation: 'fork' }] }
const snapshot = (): ResultsSnapshot => ({ schema: 'trident-results-snapshot-v1', attempts: [], tables: [{
  id: 'docs-coverage', suite: 'docs', measuredAt: '2026-01-01', historical: true, unit: 'occurrences', caption: 'Same two documentation inputs.', receipt,
  columns: ['Version', 'Returned', 'Failed', 'Planned'], rows: [{ project: 'fixture/zebra', values: ['1.0', 1, 1, 2] }],
  overview: { numerator: 'Returned', denominator: 'Planned', suffix: 'SVG returned' },
  population: { total: 'Planned', outcomes: ['Returned', 'Failed'] },
  chart: { numerator: 'Returned', denominator: 'Planned', title: 'Docs', axis: 'Returned (%)', maximum: 100 },
}] })
function campaign(root: string, projects: string[], results: unknown[], updatedAt = '2026-02-02T00:00:00Z', requestedSuites = ['docs']) {
  mkdirSync(root, { recursive: true })
  writeFileSync(join(root, 'report.json'), JSON.stringify({ startedAt: '2026-02-01T00:00:00Z', updatedAt, projects, requestedSuites, results, profile: 'full', rounds: 5 }))
}
function temporary(run: (root: string) => void) {
  const root = mkdtempSync(join(tmpdir(), 'trident-snapshot-'))
  try { run(root) } finally { rmSync(root, { recursive: true, force: true }) }
}

test('one numeric source supplies both the visible table rate and Mermaid bar; missing observations stay missing', () => {
  const output = renderSnapshot(snapshot(), catalog)
  expect(output).toContain('| fixture/zebra | 1.0 | 1 | 1 | 2 | 50.0% |')
  expect(output).toContain('bar [50]')
  expect(output).toContain('Historical: Docs')
  expect(output).toContain('2 eligible projects')
  expect(output).toContain('1 catalog descendants/bindings')
  const row = output.split('\n').find(line => line.startsWith('| fixture/alpha |'))!
  expect(row).toContain('N/A')
  expect(row).toContain('Unmeasured')
  expect(row).not.toContain('0%')
  expect(output).not.toContain('| fixture/clone | Unmeasured')
  const changed = snapshot(); changed.tables[0]!.rows[0]!.values[1] = 0
  changed.tables[0]!.rows[0]!.values[2] = 2
  expect(renderSnapshot(changed, catalog)).toContain('bar [0]')
  expect(renderSnapshot(changed, catalog)).toContain('| 0.0% |')
})

test('latest failed or partial attempt overrides historical success without deleting its dated evidence', () => temporary(root => {
  campaign(root, ['fixture/zebra'], [{ suite: 'docs', project: 'fixture/zebra', status: 'failed', detail: 'Render rejected' }])
  let data = importCampaign(snapshot(), root, 'https://example.org/run', catalog)
  let output = renderSnapshot(data, catalog)
  expect(output.split('\n').find(line => line.startsWith('| fixture/zebra |'))).toContain('failed · 2026-02-02')
  expect(output).toContain('2026-01-01 · Historical')
  expect(output).toContain('Render rejected')
  campaign(root, ['fixture/zebra'], [], '2026-02-03T00:00:00Z')
  data = importCampaign(data, root, 'https://example.org/partial', catalog)
  output = renderSnapshot(data, catalog)
  expect(output.split('\n').find(line => line.startsWith('| fixture/zebra |'))).toContain('unavailable · 2026-02-03')
  expect(output).toContain('Requested boundary has no recorded result')
  expect(data.attempts).toHaveLength(2)
  expect(importCampaign(data, root, 'https://example.org/partial', catalog).attempts).toHaveLength(2)
}))

test('multi-project process failure is not assigned to every project; individual counts and versions remain visible', () => temporary(root => {
  const owning = join(root, 'docs'); mkdirSync(owning)
  writeFileSync(join(owning, 'result.json'), JSON.stringify({ toolVersions: [], observations: [
    { metrics: { project: 'fixture/zebra', version: '2.0', round: 1 }, caseId: 'one', status: 'passed', surface: 'browser', runtime: 'Chromium', mode: 'call', format: 'svg', operation: 'render' },
    { metrics: { project: 'fixture/alpha', version: '3.0', round: 1 }, caseId: 'one', status: 'failed', surface: 'browser', runtime: 'Chromium', mode: 'call', format: 'svg', operation: 'render' },
  ] }))
  campaign(root, ['fixture/zebra', 'fixture/alpha'], [{ suite: 'docs', status: 'failed', out: owning }])
  const data = importCampaign(snapshot(), root, 'https://example.org/run', catalog)
  expect(data.attempts.find(row => row.project === 'fixture/zebra')?.status).toBe('recorded')
  expect(data.attempts.find(row => row.project === 'fixture/alpha')?.status).toBe('failed')
  const output = renderSnapshot(data, catalog)
  expect(output).toContain('| 2.0 / default | browser / Chromium | svg / render | call / 1 | 1 | 1 | 0 | 0 | 0 | {} | 1 |')
  expect(output).toContain('[owning results and failures](https://example.org/run/docs/)')
  expect(output).not.toContain('100%')
  data.attempts[0]!.groups[0]!.recordedObservations = 2
  expect(() => validateSnapshot(data, catalog)).toThrow('Invalid observation population')
  campaign(root, ['fixture/zebra', 'fixture/alpha'], [{ suite: 'docs', status: 'failed' }])
  expect(importCampaign(snapshot(), root, 'https://example.org/run', catalog).attempts.every(row => row.status === 'unavailable')).toBe(true)
}))

test('snapshot rejects invented numeric chart values, unknown projects and broken population counts', () => {
  const missing = snapshot(); missing.tables[0]!.rows[0]!.values[1] = 'Unavailable'
  expect(() => renderSnapshot(missing, catalog)).toThrow('population does not reconcile')
  const excess = snapshot(); excess.tables[0]!.rows[0]!.values[1] = 3
  expect(() => renderSnapshot(excess, catalog)).toThrow('population does not reconcile')
  const unknown = snapshot(); unknown.tables[0]!.rows[0]!.project = 'fixture/unknown'
  expect(() => validateSnapshot(unknown, catalog)).toThrow('Unknown or duplicate')
  const duplicate = snapshot(); duplicate.tables.push(duplicate.tables[0]!)
  expect(() => validateSnapshot(duplicate, catalog)).toThrow('duplicate result')
  const collision = snapshot(); collision.tables.push({ ...collision.tables[0]!, id: 'DOCS-COVERAGE' })
  expect(() => validateSnapshot(collision, catalog)).toThrow('Colliding result anchors')
})

test('campaign groups keep formats and operations separate and retain qualification failures after successful output', () => temporary(root => {
  const owning = join(root, 'docs'); mkdirSync(owning)
  const observations = [['svg', 'render'], ['ascii', 'render'], ['svg', 'paint']].map(([format, operation]) => ({ metrics: { project: 'fixture/zebra', version: '2.0', round: 1 }, caseId: 'one', status: 'passed', surface: 'browser', runtime: 'Chromium', mode: 'call', format, operation }))
  writeFileSync(join(owning, 'result.json'), JSON.stringify({ observations }))
  campaign(root, ['fixture/zebra'], [{ suite: 'docs', project: 'fixture/zebra', status: 'failed', detail: 'Qualification failed after output', out: owning }])
  const data = importCampaign(snapshot(), root, 'https://example.org/run', catalog)
  expect(data.attempts[0]!.groups).toHaveLength(3)
  expect(data.attempts[0]!.groups.map(group => group.format + '/' + group.operation)).toEqual(['svg/render', 'ascii/render', 'svg/paint'])
  expect(data.attempts[0]!.status).toBe('failed')
  expect(renderSnapshot(data, catalog)).toContain('Campaign process status: failed')
}))

test('snapshot check detects stale Markdown without rewriting it; reads need no Mermaid oracle', () => temporary(root => {
  writeSnapshot(snapshot(), catalog, root)
  writeSnapshot(snapshot(), catalog, root, true)
  writeFileSync(join(root, 'RESULTS.md'), 'stale')
  expect(() => writeSnapshot(snapshot(), catalog, root, true)).toThrow('stale')
  expect(readFileSync(join(root, 'RESULTS.md'), 'utf8')).toBe('stale')
  const result = spawnSync(process.execPath, [resolve(import.meta.dir, '../commands.ts'), 'results:snapshot', '--check'], { encoding: 'utf8', env: { ...process.env, CI: 'true', MERMAID_REFERENCE_DIR: join(root, 'no-oracle') }, timeout: 10000 })
  expect({ status: result.status, stderr: result.stderr }).toEqual({ status: 0, stderr: '' })
}))

test('tracked historical tables reproduce the existing receipt values with their original dates', () => {
  const root = resolve(import.meta.dir, '..')
  const data = JSON.parse(readFileSync(join(root, 'results/latest.json'), 'utf8')) as ResultsSnapshot
  const bytes = readFileSync(join(root, 'docs/evidence/benchmark-examples.json'))
  const examples = JSON.parse(bytes.toString()) as { tables: { id: string; date: string; rows: Cell[][] }[] }
  const digest = createHash('sha256').update(bytes).digest('hex')
  for (const entry of data.tables.filter(row => row.historical)) {
    const original = examples.tables.find(row => row.id === entry.id)!
    expect(entry.measuredAt).toBe(original.date)
    expect(entry.receipt.sha256).toBe(digest)
    for (const row of entry.rows) {
      const values = original.rows.find(values => values[0] === data.projectNames?.[row.project])!.slice(1)
      expect(row.values).toEqual(entry.id === 'docs-coverage' ? values.slice(0, -1) : values)
    }
  }
  writeSnapshot(data, JSON.parse(readFileSync(join(root, 'catalog/mermaid-community.json'), 'utf8')), root, true)
})

type Cell = string | number
