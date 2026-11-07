import { expect, test } from 'bun:test'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { JsonLineSession } from '../unified/json-line-session.ts'
import { TerminalCallWorker } from '../unified/terminal-call-worker.ts'
import { memoryLimit } from '../unified/process-memory.ts'
import { useTempDirs } from './helpers/temp-dir.ts'

const temporary = useTempDirs('worker-session-')
const program = (body: string) => ['node', '-e', `const rl=require('node:readline');for await (const line of rl.createInterface({input:process.stdin})){const job=JSON.parse(line);${body}}`.replace('for await', ';(async()=>{for await') + '})()']
const reply = (row: any) => Number.isSafeInteger(row.id) && typeof row.ok === 'boolean'

test('concurrent calls are refused, while the owned request still settles and close is idempotent', async () => {
  const session = new JsonLineSession(program(`await new Promise(done=>setTimeout(done,60));console.log(JSON.stringify({id:job.id,ok:true}))`), { reply })
  try {
    const first = session.call({}, 1, 2000)
    await expect(session.call({}, 1, 2000)).rejects.toThrow('outstanding')
    expect(await first).toEqual({ id: 1, ok: true })
    const pending = session.call({}, 2, 2000)
    const outcome = pending.then(() => 'resolved', error => error.message)
    await session.close(); expect(await outcome).toBe('Worker closed')
    await session.close()
  } finally { await session.close() }
})
test('unexpected identities and oversized frames retire the session and drain pending calls', async () => {
  for (const [body, reason] of [[`console.log(JSON.stringify({id:job.id+1,ok:true}))`, 'identity'], [`console.log('x'.repeat(2000))`, 'byte budget']] as const) {
    const session = new JsonLineSession(program(body), { reply, maxFrameBytes: 1024 })
    try { await expect(session.call({}, 1, 2000)).rejects.toThrow(reason); await expect(session.call({}, 2, 2000)).rejects.toThrow(reason) }
    finally { await session.close() }
  }
})
test('invalid or absent API durations cannot become zero or controller API timing', async () => {
  const directory = temporary.dir(), script = join(directory, 'worker.mjs')
  for (const expression of ['-1', 'null', '"5"']) {
    writeFileSync(script, `import readline from 'node:readline';console.log(JSON.stringify({type:'ready'}));for await(const line of readline.createInterface({input:process.stdin})){const job=JSON.parse(line);console.log(JSON.stringify({type:'result',id:job.id,outcome:'completed',ms:${expression}}))}`)
    const worker = new TerminalCallWorker({ node: { id: 'fixture', roles: [], outputs: [] } }, join(directory, 'operand.json'), ['node', script])
    try { const result = await worker.call('source', 'request', 2000); expect(result).toMatchObject({ outcome: 'error', ms: null }); expect(result.controllerMs).toBeGreaterThan(0) }
    finally { await worker.close() }
  }
  writeFileSync(script, `console.log(JSON.stringify({type:'ready'}));process.stdin.resume()`)
  const worker = new TerminalCallWorker({ node: { id: 'fixture', roles: [], outputs: [] } }, join(directory, 'operand.json'), ['node', script])
  try { expect(await worker.call('source', 'request', 30)).toMatchObject({ outcome: 'timeout', ms: null }) }
  finally { await worker.close() }
})
test('invalid resource limits fail before collection', () => {
  for (const value of ['NaN', 'Infinity', '-1', '0', '']) expect(() => memoryLimit(value)).toThrow('finite and positive')
  expect(memoryLimit('512')).toBe(512)
})

test('a final protocol reply is drained before worker exit and Unicode remains one request', async () => {
  const directory = temporary.dir(), script = join(directory, 'last-frame.mjs')
  writeFileSync(script, `import readline from 'node:readline';console.log(JSON.stringify({type:'ready'}));for await(const line of readline.createInterface({input:process.stdin})){const job=JSON.parse(line);process.stdout.write(JSON.stringify({type:'result',id:job.id,outcome:'completed',ms:1,output:job.source})+'\\n',()=>process.exit(0))}`)
  const source = 'Alpha\u2028Beta\u2029😀'
  for (let repeat = 0; repeat < 3; repeat++) {
    const worker = new TerminalCallWorker({ node: { id: 'fixture', roles: [], outputs: [] } }, join(directory, 'operand.json'), ['node', script], output => ({ valid: output === source }))
    try { expect(await worker.call(source, 'last', 2000)).toEqual({ outcome: 'completed', ms: 1 }) }
    finally { await worker.close() }
  }
})
