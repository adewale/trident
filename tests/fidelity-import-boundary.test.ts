import { expect, test } from 'bun:test'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fidelityOutcomes } from '../unified/mermaid-fidelity.ts'
import { useTempDirs } from './helpers/temp-dir.ts'

const temporary = useTempDirs('fidelity-import-boundary-')

test('unused imports permit native observations while unavailable uses, faults and wrong results keep their verdicts', () => {
  const root = temporary.dir(), file = join(root, 'original.spec.ts'), calls = join(root, 'calls.jsonl')
  mkdirSync(join(root, 'src'))
  writeFileSync(join(root, 'package.json'), '{"type":"module"}')
  writeFileSync(join(root, 'src/parser.ts'), `import {appendFileSync} from 'node:fs';export function parseMermaid(source){appendFileSync(${JSON.stringify(calls)},JSON.stringify(source)+'\\n');if(source==='fault')throw new TypeError('candidate fault');return {observed:source}}`)
  const names = ['unused static import', 'unused dynamic import', 'used import', 'namespace reflection', 'wrong result', 'no native operation', 'candidate fault', 'used constructor', 'unused partial import', 'used partial import', 'inherited namespace member', 'partial namespace reflection', 'unknown database call', 'unknown database type', 'inherited database method', 'database namespace reflection', 'unbound named getter type', 'cached unavailable export', 'unused dynamic partial module']
  const job = {
    upstream: root, reference: root, audit: join(root, 'audit.jsonl'), target: { tool: 'beautiful', root },
    files: [{ absolute: file, family: 'flowchart', helperIdentifiers: [], declarations: names.map(name => ({ name, identifiers: name === 'used import' ? ['unavailable'] : name === 'used partial import' ? ['partialMember'] : name === 'unbound named getter type' ? ['getMissing'] : [] })) }],
  }
  const jobPath = join(root, 'job.json'); writeFileSync(jobPath, JSON.stringify(job))
  const script = join(root, 'exercise.ts')
  writeFileSync(script, `
    import assert from 'node:assert/strict'
    import {initialize,moduleFor,importFor,begin,finish,probeNative,shutdown} from ${JSON.stringify(resolve(import.meta.dirname, '../unified/mermaid-fidelity/runtime.ts'))}
    const names=${JSON.stringify(names)},file={filepath:${JSON.stringify(file)},tasks:[] as any[]}
    file.tasks=names.map((name,index)=>({type:'test',name,id:String(index),file,result:{state:'run'}}))
    await initialize(file.filepath)
    const unknown=moduleFor('flowchart','./unbound.js',file.filepath,{unavailable:'unavailable',ClassMember:'Constructor'})
    const unavailable=unknown.unavailable, Constructor=unknown.ClassMember
    const namespace=await importFor('flowchart','./dynamic-unbound.js',file.filepath)
    const databaseModule=moduleFor('flowchart','./flowDb.js',file.filepath,{getMissing:'getMissing'}),database=databaseModule.default,getMissing=databaseModule.getMissing
    assert.throws(()=>namespace.missingDuringSetup,/TRIDENT_ADAPTER_GAP/)
    const partial=moduleFor('flowchart','./diagramAPI.js',file.filepath,{getDiagram:'partialMember'}),partialMember=partial.getDiagram
    for(const inspect of [()=>Object.getPrototypeOf(namespace),()=>Object.isExtensible(namespace),()=>Reflect.set(namespace,'invented',1),()=>Object.defineProperty(namespace,'invented',{value:1}),()=>Reflect.deleteProperty(namespace,'invented')])assert.throws(inspect,/Native module namespace is not bound/)
    const observe=(source='native')=>probeNative('flowchart',source)
    const bodies=[
      ()=>assert.equal(observe().observed,'native'),
      ()=>assert.equal(observe().observed,'native'),
      ()=>{observe();try{unavailable()}catch{}},
      ()=>{observe();try{Object.keys(namespace)}catch{}},
      ()=>assert.equal(observe('wrong').observed,'correct'),
      ()=>assert.equal(1,1),
      ()=>observe('fault'),
      ()=>{observe();try{new Constructor()}catch{}},
      ()=>assert.equal(observe().observed,'native'),
      ()=>{observe();assert.throws(()=>partialMember('missing'))},
      ()=>{observe();assert.equal(partial.constructor,undefined)},
      ()=>{observe();assert.ok(Object.keys(partial).includes('getDiagram'))},
      ()=>{observe();assert.doesNotThrow(()=>database.probeMissing())},
      ()=>{observe();assert.equal(typeof database.probeMissing,'function')},
      ()=>{observe();assert.equal(database.toString(),'[object Object]')},
      ()=>{observe();assert.ok(Object.keys(database).includes('parse'))},
      ()=>{observe();assert.equal(typeof getMissing,'function')},
      ()=>{observe();assert.equal(typeof partial.log,'function')},
      async()=>{await importFor('flowchart','./diagramAPI.js',file.filepath);assert.equal(observe().observed,'native')},
    ]
    const assertions=[]
    for(const [index,task] of file.tasks.entries()){
      begin(task);let error
      try{await bodies[index]!()}catch(caught){error=caught}
      task.result.state=error?'fail':'pass'
      try{finish(task)}catch(caught){error??=caught}
      assertions.push({fullName:task.name,status:error?'failed':'passed',failureMessages:error?[String(error)]:[]})
    }
    shutdown();console.log(JSON.stringify(assertions))
  `)
  const child = spawnSync(process.execPath, [script], { encoding: 'utf8', timeout: 10000, env: { ...process.env, TRIDENT_FIDELITY_JOB: jobPath } })
  expect({ status: child.status, stderr: child.stderr }).toEqual({ status: 0, stderr: '' })
  const assertions = JSON.parse(child.stdout), audit = readFileSync(job.audit, 'utf8').trim().split('\n').map(line => JSON.parse(line))
  const control = { testResults: [{ name: file, assertionResults: names.map(fullName => ({ fullName, status: 'passed' })) }] }
  const candidate = { testResults: [{ name: file, assertionResults: assertions }] }
  expect(fidelityOutcomes(control, candidate, audit).map((row: any) => row.status)).toEqual(['passed', 'passed', 'trident-blocked', 'trident-blocked', 'failed', 'trident-blocked', 'failed', 'trident-blocked', 'passed', 'trident-blocked', 'trident-blocked', 'trident-blocked', 'trident-blocked', 'trident-blocked', 'trident-blocked', 'trident-blocked', 'trident-blocked', 'trident-blocked', 'passed'])
  expect(audit.map(row => row.calls)).toEqual([1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1])
  expect(audit[3].gaps).toContain('Native module namespace is not bound: ./dynamic-unbound.js')
  expect(audit[6].faults[0]).toContain('candidate fault')
  // Schema and empty-model probes earn no callback credit.
  expect(readFileSync(calls, 'utf8').trim().split('\n').map(line => JSON.parse(line))).toEqual(['flowchart TD\nA-->B', 'flowchart TD', 'native', 'native', 'native', 'native', 'wrong', 'fault', 'native', 'native', 'native', 'native', 'native', 'native', 'native', 'native', 'native', 'native', 'native', 'native'])
})
