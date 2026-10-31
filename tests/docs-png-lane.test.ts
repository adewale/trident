import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { crc32, deflateSync } from 'node:zlib'
import { runDocsPngLane } from '../unified/docs-png-lane.ts'
import { campaignTables } from '../unified/campaign-tables.ts'
import { useTempDirs } from './helpers/temp-dir.ts'
const temp = useTempDirs('trident-docs-png-')
const digest = (b: Uint8Array | string) => createHash('sha256').update(b).digest('hex')

test.skipIf(!!process.env.CI)('PNG-only public transport retains source-owned images and completed resume units without SVG or Chromium', async () => {
  const root = temp.dir(), script = join(root, 'png.mjs'), counter = join(root, 'calls')
  const chunk = (t: string, d: Buffer) => { const b = Buffer.alloc(d.length + 12); b.writeUInt32BE(d.length); b.write(t, 4); d.copy(b, 8); b.writeUInt32BE(crc32(b.subarray(4, -4)), b.length - 4); return b }
  const h = Buffer.alloc(13); h.writeUInt32BE(2); h.writeUInt32BE(1, 4); h[8] = 8; h[9] = 6
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', h), chunk('IDAT', deflateSync(Buffer.from([0, 0, 0, 0, 255, 255, 255, 255, 255]))), chunk('IEND', Buffer.alloc(0))])
  writeFileSync(script, `import fs from 'node:fs';fs.appendFileSync(${JSON.stringify(counter)},'call\\n');process.stdout.write(Buffer.from(${JSON.stringify(png.toString('base64'))},'base64'))`)
  const node = { id: 'fixture/png-only', roles: ['renderer'], outputs: ['png'], benchmark: { adapter: 'source-cli', outputs: ['png'] } }
  const prepared = [{ node, artifact: { kind: 'cli', executable: process.execPath, args: [script], version: 'fixture', sha256: digest(readFileSync(process.execPath)), files: [{ path: script, sha256: digest(readFileSync(script)) }] } }]
  const file = join(root, 'prepared.json'); writeFileSync(file, JSON.stringify(prepared))
  const options = { root: resolve(import.meta.dir, '..'), out: join(root, 'out'), profile: 'smoke' as const, rounds: 1, communityPreparedFile: file, communityProjects: [node.id], executable: '/missing/chromium' }
  const cases = [{ id: 'fixture:one', family: 'flowchart', source: 'flowchart LR\nA-->B' }], inventory = { pin: { commit: 'fixture' }, pages: ['fixture.md'], occurrences: 1, distinct: 1, cases } as any
  const result = await runDocsPngLane(options, inventory, [], [])
  expect(result.observations.find(row => row.operation === 'render')).toMatchObject({ status: 'passed', format: 'png' })
  expect(result.observations.find(row => row.operation === 'render')!.detail).toBeUndefined()
  expect(result.observations.find(row => row.operation === 'drawing-checks')!.status).toBe('blocked')
  const witness = String(result.observations[0]!.metrics!.witness)
  expect(readFileSync(join(options.out, witness))).toEqual(png)
  const calls = readFileSync(counter, 'utf8')
  const repeated = await runDocsPngLane(options, inventory, [], [])
  expect(repeated.observations).toEqual(result.observations)
  expect(readFileSync(counter, 'utf8')).toBe(calls)
})

test('one documentation corpus reduces into separate SVG/PNG tables without double-counting or replacing SVG overview', () => {
  const out = temp.dir(), cases = [{ id: 'one' }, { id: 'two' }], date = '2026-10-31T00:00:00Z'
  writeFileSync(join(out, 'inventory.json'), JSON.stringify({ protocol: 'public-docs-output-lanes-v2', pin: { commit: 'pinned' }, cases }))
  const observations = ['svg', 'png'].flatMap(format => cases.map(input => ({ suite: 'docs', format, surface: format, runtime: 'fixture', family: 'flowchart', mode: 'one-call', caseId: input.id, operation: 'render', status: format === 'png' && input.id === 'two' ? 'failed' : 'passed', metrics: { project: 'fixture/a', version: '1', round: 1, measuredAt: date } })))
  writeFileSync(join(out, 'result.json'), JSON.stringify({ finishedAt: date, observations }))
  const report = { schema: 'trident-campaign-v2', startedAt: date, updatedAt: date, projects: ['fixture/a'], rounds: 1, results: [{ suite: 'docs', out }] } as any
  const tables = campaignTables(report, { url: 'https://example.test/evidence', sha256: 'a'.repeat(64) })
  expect(tables).toHaveLength(2)
  expect(tables.find(table => table.caption.includes('SVG output lane'))!.rows[0]!.values.slice(1, 3)).toEqual([2, 0])
  expect(tables.find(table => table.caption.includes('PNG output lane'))!.rows[0]!.values.slice(1, 3)).toEqual([1, 1])
  expect(tables.filter(table => table.overview)).toHaveLength(1)
  expect(tables.find(table => table.overview)!.caption).toContain('SVG')
})
