import { expect, test } from 'bun:test'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { unboundNativeCapability } from '../unified/mermaid-fidelity/native-capabilities.mjs'
import { useTempDirs } from './helpers/temp-dir.ts'

const temporary = useTempDirs('fidelity-native-bindings-')

// A candidate module shaped like Pele: parse(source) returns an instance of the family's own
// database class, whose methods its parser calls while it parses. Quadrant and sankey models
// are plain objects (no database class); gantt is plain too.
const CANDIDATE = `
class XyDb {
  setDiagramTitle(text) { this.title = text }
  setXAxisTitle(title) { this.xAxis = title; this.setXAxisLabelCache(title) }
  setXAxisLabelCache(title) { this.cache = title }
}
const refuse = message => Object.assign(new Error(message), { code: 'unsupported-diagram' })
const syntax = message => Object.assign(new Error(message), { code: 'syntax' })
export function parse(source) {
  if (source.startsWith('xychart')) {
    if (source.includes('broken')) throw syntax('Parse error: broken xychart')
    const db = new XyDb()
    for (const line of source.split('\\n').slice(1)) {
      const [keyword, ...rest] = line.trim().split(' ')
      if (keyword === 'title') db.setDiagramTitle(rest.join(' '))
      if (keyword === 'x-axis') db.setXAxisTitle({ text: rest.join(' '), type: 'text' })
    }
    return db
  }
  if (source.startsWith('quadrantChart')) return { type: 'quadrant' }
  if (source.startsWith('sankey')) return { type: 'sankey' }
  if (source.startsWith('gantt')) return { type: 'gantt' }
  if (source.startsWith('timeline')) return { type: 'timeline', direction: 'LR', sections: ['abc-123'] }
  throw refuse('No diagram type detected for the given text.')
}`

function exercise(project: string, version: string, bodies: string[], setup = '') {
  const root = temporary.dir(), file = join(root, 'original.spec.ts'), entry = join(root, 'candidate.mjs')
  writeFileSync(entry, CANDIDATE)
  const names = bodies.map((_, index) => 'case ' + index)
  const job = { upstream: root, reference: root, audit: join(root, 'audit.jsonl'), target: { tool: 'pele', project, version, entry }, files: [{ absolute: file, family: 'xychart', helperIdentifiers: [], declarations: names.map(name => ({ name, identifiers: [] })) }] }
  const jobPath = join(root, 'job.json')
  writeFileSync(jobPath, JSON.stringify(job))
  const script = join(root, 'exercise.ts')
  writeFileSync(script, `
    import assert from 'node:assert/strict'
    import {initialize,moduleFor,begin,finish,shutdown} from ${JSON.stringify(resolve(import.meta.dirname, '../unified/mermaid-fidelity/runtime.ts'))}
    const file={filepath:${JSON.stringify(file)},tasks:[] as any[]}
    file.tasks=${JSON.stringify(names)}.map((name,index)=>({type:'test',name,id:String(index),file,result:{state:'run'}}))
    await initialize(file.filepath)
    // The first argument is the test file's own family, as the runtime passes it.
    const jison=family=>moduleFor('xychart','../'+family+'/parser/'+family+'.jison',file.filepath,{parser:'parser'}).parser
    const recorder=()=>{const calls=[];const fn=(...args)=>{calls.push(args)};fn.calls=calls;return fn}
    const spy=()=>{const fn=recorder();fn._isMockFunction=true;return fn}
    ${setup}
    const bodies=[${bodies.map(body => `async()=>{${body}}`).join(',')}]
    for(const [index,task] of file.tasks.entries()){
      begin(task);let error
      try{await bodies[index]()}catch(caught){error=caught}
      task.result.state=error?'fail':'pass'
      try{finish(task)}catch{}
      if(error&&!/Unsupported candidate operation|TRIDENT_ADAPTER_GAP|Parse error|No diagram type/.test(String(error)))console.log('BODY '+index+': '+String(error))
    }
    shutdown()
  `)
  const child = spawnSync(process.execPath, [script], { encoding: 'utf8', timeout: 20000, env: { ...process.env, TRIDENT_FIDELITY_JOB: jobPath } })
  expect({ status: child.status, stderr: child.stderr, stdout: child.stdout }).toEqual({ status: 0, stderr: '', stdout: '' })
  return readFileSync(job.audit, 'utf8').trim().split('\n').map(line => JSON.parse(line))
}

test("a test's own jison database sees the calls a candidate's parser makes on its database class", () => {
  const audit = exercise('obsidianmd/pele', '1.13.0', [
    // Each outermost call the parser makes reaches the test's database, with the candidate's own arguments.
    `const p=jison('xychart'),yy={setDiagramTitle:recorder(),setXAxisTitle:recorder(),setXAxisLabelCache:recorder()};p.yy=yy
     assert.equal(p.parse('xychart\\ntitle T\\nx-axis X'),true)
     assert.deepEqual(yy.setDiagramTitle.calls,[['T']]);assert.deepEqual(yy.setXAxisTitle.calls,[[{text:'X',type:'text'}]])
     assert.deepEqual(yy.setXAxisLabelCache.calls,[])`,
    // The candidate's own syntax rejection is its outcome, not a missing protocol.
    `const p=jison('xychart');p.yy={setDiagramTitle:recorder()};assert.throws(()=>p.parse('xychart broken'),/broken xychart/)`,
    // A candidate whose model has no database class still parses first; an accepted parse
    // drives no database the test supplied: a capability assessment.
    `const p=jison('sankey');p.yy={addLink:recorder()};p.parse('sankey-beta\\nA,B,1')`,
    // The candidate's own refusal of the diagram type is native.
    `const p=jison('sankey');p.yy={addLink:recorder()};p.parse('not a diagram')`,
    // Mermaid's own database module as yy (timeline.spec.js) is bound to the candidate's model.
    `const timelineDB=moduleFor('xychart','../timeline/timelineDb.js',file.filepath,{'*':'timelineDB'}),p=jison('timeline');p.yy=timelineDB
     p.parse('timeline\\n  section abc-123');assert.deepEqual(timelineDB.getSections(),['abc-123']);assert.equal(timelineDB.getDirection(),'LR')`,
    // A spy on a member the candidate's database class implements sees its parser's calls;
    // one on a member the class lacks stays an assessment.
    `const XyDb=moduleFor('xychart','./xychartDb.js',file.filepath,{XyChartDB:'XyChartDB'}).XyChartDB,db=new XyDb(),mock=spy()
     const described=Object.getOwnPropertyDescriptor(db,'setDiagramTitle');assert.equal(typeof described.value,'function')
     Object.defineProperty(db,'setDiagramTitle',{...described,value:mock})
     db.parse('xychart\\ntitle Spied');assert.deepEqual(mock.calls,[['Spied']]);assert.equal(db.getDiagramTitle?.()??db.title,'Spied')`,
    `const XyDb=moduleFor('xychart','./xychartDb.js',file.filepath,{XyChartDB:'XyChartDB'}).XyChartDB,db=new XyDb();Object.getOwnPropertyDescriptor(db,'setClickEvent')`,
  ])
  const at = (index: number) => audit.find(row => row.index === index)!
  expect(at(0)).toMatchObject({ gaps: [], unsupported: [], rejections: 0 })
  expect(at(0).calls).toBeGreaterThan(0)
  expect(at(1)).toMatchObject({ gaps: [], unsupported: [], rejections: 1 })
  expect(at(2)).toMatchObject({ unsupported: ['sankey parser driving a caller-supplied database (Mermaid jison yy callback protocol)'], unsupportedKinds: ['assessment'] })
  expect(at(3)).toMatchObject({ unsupported: ['No diagram type detected for the given text.'], unsupportedKinds: ['native'] })
  expect(at(4)).toMatchObject({ gaps: [], unsupported: [] })
  expect(at(5)).toMatchObject({ gaps: [], unsupported: [] })
  expect(at(6)).toMatchObject({ unsupported: ["xychart database setClickEvent spied on or inspected (Mermaid's parser -> database protocol)"], unsupportedKinds: ['assessment'] })
})

test('a database member or callback protocol the capability review found in the public API is an adapter limitation', () => {
  expect(unboundNativeCapability('crabtalk/bezel', '0.2.26', 'gantt', 'setDateFormat')).toContain('src/diagrams/gantt/db.rs:237 pub fn set_date_format')
  expect(unboundNativeCapability('crabtalk/bezel', '0.2.26', 'quadrant', undefined)).toContain('pub fn parse_quadrant')
  // Per reviewed version, member and family only.
  expect(unboundNativeCapability('crabtalk/bezel', '0.2.25', 'gantt', 'setDateFormat')).toBeUndefined()
  expect(unboundNativeCapability('crabtalk/bezel', '0.2.26', 'gantt', 'getConfig')).toBeUndefined()
  expect(unboundNativeCapability('obsidianmd/pele', '1.13.0', 'gantt', 'setDateFormat')).toBeUndefined()
  const audit = exercise('crabtalk/bezel', '0.2.26', [
    `moduleFor('xychart','../gantt/ganttDb.js',file.filepath).default.setDateFormat('YYYY')`,
    `const p=jison('quadrant');p.yy={setQuadrant1Text:recorder()};p.parse('quadrantChart')`,
    `moduleFor('xychart','../gantt/ganttDb.js',file.filepath).default.getConfig()`,
  ])
  expect(audit[0].unsupported).toEqual([])
  expect(audit[0].gaps.join()).toContain('crabtalk/bezel 0.2.26 implements gantt database setDateFormat natively')
  expect(audit[1].unsupported).toEqual([])
  expect(audit[1].gaps.join()).toContain('implements a quadrant parser that drives a caller-supplied database natively')
  expect(audit[2]).toMatchObject({ unsupported: ["gantt database getConfig (the candidate exposes a parser, not Mermaid's database API)"], unsupportedKinds: ['assessment'] })
})
