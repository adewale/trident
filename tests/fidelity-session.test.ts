import { expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { persistentBridge } from '../unified/mermaid-fidelity/bridge-client.mjs'
import { useTempDirs } from './helpers/temp-dir.ts'

const temporary = useTempDirs('fidelity-session-')
test('worker startup errors return transport failures and allow another attempt', async () => {
  const root = temporary.dir(),
    file = join(root, 'startup.ts'),
    audit = join(root, 'audit.jsonl'),
    job = join(root, 'job.json')
  writeFileSync(job, JSON.stringify({ upstream: root, reference: root, audit, target: { tool: 'bridge', bridge: { command: ['unused'], persistent: true } }, files: [{ absolute: file, family: 'flowchart', declarations: [] }] }))
  writeFileSync(
    file,
    `import {mock} from 'bun:test'
    import assert from 'node:assert/strict'
    const original={...await import('node:worker_threads')}
    let attempts=0
    mock.module('node:worker_threads',()=>({...original,Worker:class{constructor(){attempts++;throw Object.assign(new Error('forced worker capacity failure'),{code:'EAGAIN'})}}}))
    const {persistentBridge}=await import(${JSON.stringify(resolve(import.meta.dir, '../unified/mermaid-fidelity/bridge-client.mjs'))})
    const client=persistentBridge('node',[],undefined,1000)
    try {
      for(let index=0;index<2;index++)if(!client.call({source:'native input'}).failure?.includes('forced worker capacity failure'))throw Error('Transport failure was not reported')
      if(attempts!==2)throw Error('A failed startup prevented retry')
    }catch(error){console.error(String(error));process.exitCode=1}
    finally{client.close()}
    const {initialize,begin,finish,probeNative,shutdown}=await import(${JSON.stringify(resolve(import.meta.dir, '../unified/mermaid-fidelity/runtime.ts'))})
    await initialize(${JSON.stringify(file)})
    const task={type:'test',id:'negative',name:'negative parser assertion',result:{state:'pass'},file:{filepath:${JSON.stringify(file)},tasks:[] as any[]}}
    task.file.tasks=[task];begin(task)
    assert.throws(()=>probeNative('flowchart','native input'))
    try{finish(task)}catch{}
    shutdown()
    process.exit(process.exitCode??0)
  `,
  )
  const child = spawnSync(process.execPath, [file], { encoding: 'utf8', timeout: 10000, env: { ...process.env, TRIDENT_FIDELITY_JOB: job } })
  expect({ status: child.status, stderr: child.stderr }).toEqual({ status: 0, stderr: '' })
  const report = { testResults: [{ name: file, assertionResults: [{ fullName: 'negative parser assertion', status: 'passed' }] }] }
  const rows = readFileSync(audit, 'utf8')
    .trim()
    .split('\n')
    .map(line => JSON.parse(line))
  const { fidelityOutcomes } = await import('../unified/mermaid-fidelity.ts')
  expect(fidelityOutcomes(report, report, rows)[0]!.status).toBe('trident-blocked')
  expect(rows[0].gaps.join('; ')).toContain('forced worker capacity failure')
})
test('persistent replies preserve Unicode, own a request identity, and restart after a deadline', () => {
  const file = join(temporary.dir(), 'bridge.mjs')
  writeFileSync(file, `import {serve} from ${JSON.stringify(resolve(import.meta.dir, '../unified/mermaid-fidelity/bridges/common.mjs'))};await serve(async(family,source)=>{if(source==='hang')await new Promise(()=>{});return {value:{family,source}}})`)
  const client = persistentBridge('node', [file], undefined, 1000)
  try {
    const source = 'Alpha\u2028Beta\u2029é😀'
    expect(JSON.parse(client.call({ family: 'flowchart', source }).line!).value).toEqual({ family: 'flowchart', source })
    expect(client.call({ family: 'flowchart', source: 'hang' }).failure).toContain('no reply')
    expect(JSON.parse(client.call({ family: 'flowchart', source: 'after restart' }).line!).value.source).toBe('after restart')
  } finally {
    client.close()
  }
  expect(client.call({ source: 'closed' }).failure).toContain('closed')
})
test('a marked stale reply cannot be attributed to the current request', () => {
  const file = join(temporary.dir(), 'bridge.mjs')
  writeFileSync(file, `import readline from 'node:readline';for await(const line of readline.createInterface({input:process.stdin})){const job=JSON.parse(line);console.log('\\u0001TRIDENT\\u0001'+JSON.stringify({requestId:'old-session',value:job.source}))}`)
  const client = persistentBridge('node', [file], undefined, 1000)
  try {
    expect(client.call({ source: 'current' }).failure).toContain('identity')
  } finally {
    client.close()
  }
})
