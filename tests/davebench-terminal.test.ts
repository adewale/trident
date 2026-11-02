import { expect, test } from 'bun:test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { TerminalCallWorker, terminalCliCall } from '../unified/davebench-terminal.ts'
import { davebenchRankings, type DavebenchRun } from '../unified/davebench.ts'
import { useTempDirs } from './helpers/temp-dir.ts'

const temp = useTempDirs('davebench-terminal-')
test('persistent terminal calls await the actual API and return only timing and outcome, including empty successful returns', async () => {
  const root = temp.dir(); mkdirSync(join(root, 'fixture'))
  const module = join(root, 'fixture/render.mjs')
  writeFileSync(module, `export async function render(source){await new Promise(done=>setTimeout(done,20));if(source==='reject')throw Error('fixture rejection');return ''}`)
  writeFileSync(join(root, 'fixture/package.json'), '{"name":"fixture","version":"1.0.0","type":"module"}')
  const peer: any = { node: { id: 'fixture/terminal', benchmark: { adapter: 'declared', api: { terminal: { export: 'render' } } } }, artifact: { kind: 'node', version: '1.0.0', root: join(root, 'fixture'), module } }
  const worker = new TerminalCallWorker(peer, join(root, 'operand.json'))
  try {
    await worker.ready
    const ok = await worker.call('source', 'one', 2000), error = await worker.call('reject', 'two', 2000)
    expect(ok.outcome).toBe('completed'); expect(ok.ms).toBeGreaterThanOrEqual(15)
    expect(error.outcome).toBe('error'); expect(error.ms).toBeGreaterThanOrEqual(15)
    expect(Object.keys(ok).sort()).toEqual(['ms', 'outcome'])
  } finally { worker.close() }
})

test('a missing public terminal API blocks initialization rather than counting every input as a renderer failure', async () => {
  const root = temp.dir(), module = join(root, 'empty.mjs')
  writeFileSync(module, 'export const unrelated = true;'); writeFileSync(join(root, 'package.json'), '{"name":"fixture","version":"1.0.0"}')
  const worker = new TerminalCallWorker({ node: { id: 'fixture/missing', roles: [], outputs: ['terminal'], benchmark: { adapter: 'beautiful' } }, artifact: { kind: 'node', root, module, version: '1.0.0' } }, join(root, 'operand.json'))
  try { await expect(worker.ready).rejects.toThrow('terminal API') } finally { worker.close() }
})

test('native terminal calls count exit status, discard stdout, and kill a timed-out process', async () => {
  const root = temp.dir()
  const artifact: any = { kind: 'cli', executable: process.execPath, input: 'stdin', version: 'fixture', args: ['-e', `process.stdin.resume();process.stdin.on('end',()=>{process.stdout.write('drawing');process.exit(0)})`] }
  const ok = await terminalCliCall(artifact, 'source', root, 2000)
  expect(ok.outcome).toBe('completed'); expect(Object.keys(ok).sort()).toEqual(['ms', 'outcome'])
  const rejected = await terminalCliCall({ ...artifact, args: ['-e', 'process.exit(2)'] }, 'source', root, 2000)
  expect(rejected.outcome).toBe('error')
  const timeout = await terminalCliCall({ ...artifact, args: ['-e', 'setTimeout(()=>{},10000)'] }, 'source', root, 30)
  expect(timeout.outcome).toBe('timeout')
})

test('terminal rankings retain their own completion-first comparison independently of image formats', () => {
  const runs: DavebenchRun[] = [1, 2, 3].flatMap(run => [
    { project: 'fixture/complete', version: '1.0.0', format: 'terminal', run, boundary: 'fixture API', attempted: 10, completed: 10, failed: 0, timeouts: 0, totalMs: 100 },
    { project: 'fixture/fast', version: '1.0.0', format: 'terminal', run, boundary: 'fixture API', attempted: 10, completed: 9, failed: 1, timeouts: 0, totalMs: 1 },
  ])
  const ranked = davebenchRankings(runs, 10)
  expect(ranked.terminal.map(row => [row.project, row.rank])).toEqual([['fixture/complete', 1], ['fixture/fast', 2]])
  expect(ranked.svg).toEqual([]); expect(ranked.png).toEqual([])
})
