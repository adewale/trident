import { expect, test } from 'bun:test'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { useTempDirs } from './helpers/temp-dir.ts'

const temporary = useTempDirs('fidelity-setup-destructure-')

// radar.spec.ts destructures the database at module setup (`const { getDiagramTitle, ...,
// getConfig } = db`), before any test parses. Mermaid's database methods read its state at
// each call, so the setup read decides nothing: each call meets the candidate's model (or
// its absence) inside the test that makes it, with that test's audit.
test('database members destructured at module setup are read at their call, inside the calling test', () => {
  const root = temporary.dir(), file = join(root, 'original.spec.ts')
  writeFileSync(join(root, 'package.json'), '{"type":"module"}')
  writeFileSync(join(root, 'parser.js'), 'export function parseMermaid(source){return {title:source.split("\\n").at(-1)}}')
  const names = ['reads the current parse', 'calls a member the model lacks', "calls Mermaid's database API", 'calls nothing']
  const job = { upstream: root, reference: root, audit: join(root, 'audit.jsonl'), target: { tool: 'native', entry: join(root, 'parser.js') }, files: [{ absolute: file, family: 'flowchart', helperIdentifiers: [], declarations: names.map(name => ({ name, identifiers: [] })) }] }
  const jobPath = join(root, 'job.json')
  writeFileSync(jobPath, JSON.stringify(job))
  const script = join(root, 'exercise.ts')
  writeFileSync(script, `
    import assert from 'node:assert/strict'
    import {initialize,moduleFor,begin,finish,shutdown} from ${JSON.stringify(resolve(import.meta.dirname, '../unified/mermaid-fidelity/runtime.ts'))}
    const names=${JSON.stringify(names)},file={filepath:${JSON.stringify(file)},tasks:[] as any[]}
    file.tasks=names.map((name,index)=>({type:'test',name,id:String(index),file,result:{state:'run'}}))
    await initialize(file.filepath)
    const db=moduleFor('flowchart','./db.js',file.filepath,{db:'db'}).db
    // Module setup: every member read here, none of them called.
    const {clear,getDiagramTitle,getMissing,getConfig}=db
    const bodies=[
      ()=>{clear();db.parse('flowchart TD\\nfirst');assert.equal(getDiagramTitle(),'first');db.parse('flowchart TD\\nsecond');assert.equal(getDiagramTitle(),'second')},
      ()=>{db.parse('flowchart TD\\nx');getMissing()},
      ()=>{db.parse('flowchart TD\\nx');getConfig()},
      ()=>{db.parse('flowchart TD\\nx')},
    ]
    const out=[]
    for(const [index,task] of file.tasks.entries()){
      begin(task);let error
      try{await bodies[index]!()}catch(caught){error=caught}
      try{finish(task)}catch(caught){error??=caught}
      out.push(error?String(error.message).slice(0,200):'passed')
    }
    shutdown();console.log(JSON.stringify(out))
  `)
  const child = spawnSync(process.execPath, [script], { encoding: 'utf8', timeout: 20000, env: { ...process.env, TRIDENT_FIDELITY_JOB: jobPath } })
  expect({ status: child.status, stderr: child.stderr }).toEqual({ status: 0, stderr: '' })
  const outcomes = JSON.parse(child.stdout), audit = readFileSync(job.audit, 'utf8').trim().split('\n').map(line => JSON.parse(line))
  expect(outcomes[0]).toBe('passed')
  expect(outcomes[1]).toBe('TRIDENT_ADAPTER_GAP: flowchart.db.getMissing')
  expect(outcomes[2]).toMatch(/^Unsupported candidate operation: flowchart database getConfig/)
  expect(outcomes[3]).toBe('passed')
  // The database API surface belongs to the test that called it, not to the file's setup.
  expect(audit.map(row => row.surfaces)).toEqual([[], [], ['database-api'], []])
  expect(audit.map(row => row.gaps)).toEqual([[], ['flowchart.db.getMissing'], [], []])
})
