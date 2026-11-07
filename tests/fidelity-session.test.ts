import { expect, test } from 'bun:test'
import { writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { persistentBridge } from '../unified/mermaid-fidelity/bridge-client.mjs'
import { useTempDirs } from './helpers/temp-dir.ts'

const temporary = useTempDirs('fidelity-session-')
test('persistent replies preserve Unicode, own a request identity, and restart after a deadline', () => {
  const file = join(temporary.dir(), 'bridge.mjs')
  writeFileSync(file, `import {serve} from ${JSON.stringify(resolve(import.meta.dir, '../unified/mermaid-fidelity/bridges/common.mjs'))};await serve(async(family,source)=>{if(source==='hang')await new Promise(()=>{});return {value:{family,source}}})`)
  const client = persistentBridge('node', [file], undefined, 1000)
  try {
    const source = 'Alpha\u2028Beta\u2029é😀'
    expect(JSON.parse(client.call({ family: 'flowchart', source }).line!).value).toEqual({ family: 'flowchart', source })
    expect(client.call({ family: 'flowchart', source: 'hang' }).failure).toContain('no reply')
    expect(JSON.parse(client.call({ family: 'flowchart', source: 'after restart' }).line!).value.source).toBe('after restart')
  } finally { client.close() }
  expect(client.call({ source: 'closed' }).failure).toContain('closed')
})
test('a marked stale reply cannot be attributed to the current request', () => {
  const file = join(temporary.dir(), 'bridge.mjs')
  writeFileSync(file, `import readline from 'node:readline';for await(const line of readline.createInterface({input:process.stdin})){const job=JSON.parse(line);console.log('\\u0001TRIDENT\\u0001'+JSON.stringify({requestId:'old-session',value:job.source}))}`)
  const client = persistentBridge('node', [file], undefined, 1000)
  try { expect(client.call({ source: 'current' }).failure).toContain('identity') }
  finally { client.close() }
})
