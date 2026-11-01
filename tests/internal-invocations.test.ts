import { expect, test } from 'bun:test'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { runCommunityCli, runCommunityNodeRound } from '../unified/community.ts'
import { parseOptions } from '../unified/options.ts'
import { InvocationJournal } from '../portable/invocation-journal.ts'
import { useTempDirs } from './helpers/temp-dir.ts'
const temp = useTempDirs('internal-raw-'), svg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><text>A</text></svg>'
const workload = { id: 'case', family: 'flowchart', source: 'graph LR; A[A]', features: [], expectedLabels: ['A'], provenance: 'Synthetic durability control' }
function fixture(source: (counter: string) => string) {
  const root = temp.dir(), counter = join(root, 'calls'), module = join(root, 'index.mjs')
  writeFileSync(join(root, 'package.json'), '{"name":"raw-fixture","version":"1","type":"module"}')
  writeFileSync(module, source(counter))
  const node = { id: 'fixture/raw', roles: ['renderer'], outputs: ['svg'], benchmark: { adapter: 'declared', outputs: ['svg'], api: { svg: { export: 'render' } } } }
  return { root, counter, module, node }
}

test('Node resume preserves an actual return without silently repeating the renderer', async () => {
  const { root, counter, module, node } = fixture(counter => `import {appendFileSync} from 'node:fs';export function render(){appendFileSync(${JSON.stringify(counter)},'call\\n');return ${JSON.stringify(svg)}}`)
  const prepared = { node, artifact: { kind: 'node' as const, root, module, version: '1' } }, options = parseOptions(['--out', join(root, 'run'), '--profile', 'smoke'])
  const first = await runCommunityNodeRound(prepared, 'svg', [workload], 1, options)
  expect(first[0]!.status).toBe('passed')
  const resumed = await runCommunityNodeRound(prepared, 'svg', [workload], 1, options)
  expect(resumed[0]!.status).toBe('blocked')
  expect(resumed[0]!.metrics!.rawInvocationId).toBe(first[0]!.metrics!.rawInvocationId)
  expect(resumed[0]!.metrics!.measuredAt).toBe(first[0]!.metrics!.measuredAt)
  expect(readFileSync(counter, 'utf8')).toBe('call\n')
  expect(readFileSync(resumed[0]!.metrics!.outputFile as string, 'utf8')).toBe(svg)
})

test('Node death before an awaited return is unknown and cannot become renderer failure or an implicit retry', async () => {
  const { root, counter, module, node } = fixture(counter => `import {appendFileSync} from 'node:fs';export function render(){appendFileSync(${JSON.stringify(counter)},'call\\n');queueMicrotask(()=>process.exit(71));return Promise.resolve(${JSON.stringify(svg)})}`)
  const prepared = { node, artifact: { kind: 'node' as const, root, module, version: '1' } }, options = parseOptions(['--out', join(root, 'run'), '--profile', 'smoke'])
  const first = await runCommunityNodeRound(prepared, 'svg', [workload], 1, options)
  expect(first[0]!.status).toBe('blocked')
  expect(first[0]!.metrics!.measuredAt).toBeNull()
  const resumed = await runCommunityNodeRound(prepared, 'svg', [workload], 1, options)
  expect(resumed[0]!.status).toBe('blocked')
  expect(readFileSync(counter, 'utf8')).toBe('call\n')
})

test('CLI resume regrades exact retained output, while a different round gets a distinct invocation', () => {
  const { root, counter, module, node } = fixture(counter => `import {appendFileSync} from 'node:fs';appendFileSync(${JSON.stringify(counter)},'call\\n');process.stdout.write(${JSON.stringify(svg)})`)
  const out = join(root, 'cli'); mkdirSync(out)
  const prepared = { node, artifact: { kind: 'cli' as const, executable: 'node', args: [module], input: 'stdin' as const, version: '1' } }
  const first = runCommunityCli(prepared, 'svg', workload, 1, out), resumed = runCommunityCli(prepared, 'svg', workload, 1, out)
  expect(first.status).toBe('passed'); expect(resumed.status).toBe('passed')
  expect(resumed.metrics!.rawInvocationId).toBe(first.metrics!.rawInvocationId)
  expect(resumed.metrics!.measuredAt).toBe(first.metrics!.measuredAt)
  expect(readFileSync(counter, 'utf8')).toBe('call\n')
  const next = runCommunityCli(prepared, 'svg', workload, 2, out)
  expect(next.metrics!.rawInvocationId).not.toBe(first.metrics!.rawInvocationId)
  expect(readFileSync(counter, 'utf8')).toBe('call\ncall\n')
  writeFileSync(first.metrics!.outputFile as string, 'tampered')
  expect(() => runCommunityCli(prepared, 'svg', workload, 1, out)).toThrow('output bytes differ')
})

test('every legacy Node warm and sample public call has its own retained return', async () => {
  const { root, counter, module, node } = fixture(counter => `import {appendFileSync} from 'node:fs';export function render(){appendFileSync(${JSON.stringify(counter)},'call\\n');return ${JSON.stringify(svg)}}`)
  const rows = await runCommunityNodeRound({ node, artifact: { kind: 'node', root, module, version: '1' } }, 'svg', [{ ...workload, features: ['core-graph-batch'] }], 1, parseOptions(['--out', join(root, 'run'), '--profile', 'smoke']))
  const journal = new InvocationJournal(rows[0]!.metrics!.rawInvocationDirectory as string), returned = journal.records().filter(frame => frame.state === 'returned')
  expect(returned.length).toBeGreaterThan(1)
  expect(returned).toHaveLength(readFileSync(counter, 'utf8').trim().split('\n').length)
  expect(rows[0]!.metrics!.timingQualified).toBe(false)
})
