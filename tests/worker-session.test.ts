import { expect, test } from 'bun:test'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { JsonLineSession } from '../unified/json-line-session.ts'
import { TerminalCallWorker } from '../unified/terminal-call-worker.ts'
import { memoryLimit, watchMemory } from '../unified/process-memory.ts'
import { killCommunityProcess, spawnCommunitySubprocess } from '../unified/community-process.ts'
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
test('idle shutdown permits EOF cleanup and still kills an unresponsive worker', async () => {
  const marker = join(temporary.dir(), 'cleanup')
  const script = `const fs=require('node:fs'),rl=require('node:readline');(async()=>{for await(const line of rl.createInterface({input:process.stdin})){const job=JSON.parse(line);console.log(JSON.stringify({id:job.id,ok:true}))}fs.writeFileSync(process.argv[1],'cleaned')})()`
  const session = new JsonLineSession(['node', '-e', script, marker], { reply })
  await session.call({}, 1, 2000)
  await session.close()
  expect(readFileSync(marker, 'utf8')).toBe('cleaned')
  expect(session.child.exitCode).toBe(0)
  const stuck = new JsonLineSession(['node', '-e', script + ';setInterval(()=>{},1000)', marker], { reply })
  await stuck.call({}, 1, 2000)
  await stuck.close()
  expect(stuck.child.signalCode).toBe('SIGKILL')
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

test.skipIf(process.platform !== 'linux')('memory guard includes the renderer behind a small wrapper', async () => {
  const renderer = `const allocation=Buffer.alloc(128*1024*1024,1);console.log('allocated');setInterval(()=>{if(allocation[0]!==1)process.exit(1)},1000)`
  const wrapper = `require('node:child_process').spawn(process.execPath,['-e',${JSON.stringify(renderer)}],{stdio:'inherit'});setInterval(()=>{},1000)`
  const child = spawnCommunitySubprocess(['node', '-e', wrapper])
  let stop = () => {}
  try {
    const reader = child.stdout.getReader()
    const chunk = await reader.read(); reader.releaseLock()
    expect(new TextDecoder().decode(chunk.value)).toContain('allocated')
    const rss = /VmRSS:\s+(\d+)/.exec(readFileSync(`/proc/${child.pid}/status`, 'utf8'))!
    expect(Number(rss[1]) / 1024).toBeLessThan(96)
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(Error('Renderer child escaped the memory guard')), 3000)
      stop = watchMemory(child.pid, () => { clearTimeout(timeout); resolve() }, 96)
    })
  } finally { stop(); killCommunityProcess(child, 'SIGKILL'); await child.exited }
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
