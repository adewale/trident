import { expect, test } from 'bun:test'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { unboundNativeCapability } from '../unified/mermaid-fidelity/native-capabilities.mjs'
import { useTempDirs } from './helpers/temp-dir.ts'
import { bridgeBuiltFromCheckout } from './helpers/bridge-build.ts'

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

function exercise(project: string, version: string, bodies: string[], setup = '', target: (root: string) => Record<string, unknown> = () => ({})) {
  const root = temporary.dir(), file = join(root, 'original.spec.ts'), entry = join(root, 'candidate.mjs')
  writeFileSync(entry, CANDIDATE)
  const names = bodies.map((_, index) => 'case ' + index)
  const job = { upstream: root, reference: root, audit: join(root, 'audit.jsonl'), target: { tool: 'pele', project, version, entry, ...target(root) }, files: [{ absolute: file, family: 'xychart', helperIdentifiers: [], declarations: names.map(name => ({ name, identifiers: [] })) }] }
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
  expect(unboundNativeCapability('crabtalk/bezel', '0.2.26', 'gantt', 'parseDuration')).toContain('src/diagrams/gantt/db.rs:45 pub fn parse_duration')
  expect(unboundNativeCapability('crabtalk/bezel', '0.2.26', 'quadrant', undefined)).toContain('pub fn parse_quadrant')
  // A member the stateful bridge binds is measured, so it is no longer listed.
  expect(unboundNativeCapability('crabtalk/bezel', '0.2.26', 'gantt', 'setDateFormat')).toBeUndefined()
  // treeview's database is in a private module: not a public capability.
  expect(unboundNativeCapability('crabtalk/bezel', '0.2.26', 'treeview', 'addNode')).toBeUndefined()
  // Per reviewed version, member and family only.
  expect(unboundNativeCapability('crabtalk/bezel', '0.2.25', 'gantt', 'parseDuration')).toBeUndefined()
  expect(unboundNativeCapability('crabtalk/bezel', '0.2.26', 'gantt', 'getConfig')).toBeUndefined()
  expect(unboundNativeCapability('obsidianmd/pele', '1.13.0', 'gantt', 'parseDuration')).toBeUndefined()
  const audit = exercise('crabtalk/bezel', '0.2.26', [
    `moduleFor('xychart','../gantt/ganttDb.js',file.filepath).default.parseDuration('1d')`,
    `const p=jison('quadrant');p.yy={setQuadrant1Text:recorder()};p.parse('quadrantChart')`,
    `moduleFor('xychart','../gantt/ganttDb.js',file.filepath).default.getConfig()`,
  ])
  expect(audit[0].unsupported).toEqual([])
  expect(audit[0].gaps.join()).toContain('crabtalk/bezel 0.2.26 implements gantt database parseDuration natively')
  expect(audit[1].unsupported).toEqual([])
  expect(audit[1].gaps.join()).toContain('implements a quadrant parser that drives a caller-supplied database natively')
  expect(audit[2]).toMatchObject({ unsupported: ["gantt database getConfig (the candidate exposes a parser, not Mermaid's database API)"], unsupportedKinds: ['assessment'] })
})

// A stateful bridge (bridges.ts `database`) shaped like Bezel's: gantt models in Bezel's JSON,
// and a replayed database history per request. It logs each request it receives.
const STATEFUL_BRIDGE = `
import { appendFileSync, readFileSync } from 'node:fs'
const request = JSON.parse(readFileSync(0, 'utf8'))
appendFileSync(process.argv[2], JSON.stringify(request) + '\\n')
const out = value => console.log(JSON.stringify(value))
const gantt = source => ({ type: 'gantt', todayMarker: source.includes('todayMarker off') ? 'off' : '', excludes: [], tasks: [] })
if (request.describe === 'database') out({ value: { gantt: ['setExcludes', 'setTodayMarker', 'addTask'] } })
else if (request.database) {
  let model, error
  for (const op of request.database) {
    error = undefined
    if (op.parse !== undefined) model = gantt(op.parse)
    else if (op.new !== undefined) model = gantt('')
    else if (op.call === 'setExcludes') model.excludes.push(op.args[0])
    else if (op.call === 'setTodayMarker') model.todayMarker = op.args[0]
    else if (op.call === 'addTask') {
      model.tasks.push({ id: 'task' + (model.tasks.length + 1), task: op.args[0], processed: false })
      if (!op.args[1]) error = { name: 'Error', message: 'Task needs a duration or an end date.' }
    }
  }
  out({ value: { model, ...(error ? { error } : {}) } })
} else if (request.source.startsWith('gantt')) out({ value: gantt(request.source) })
else out({ unsupported: 'not a gantt diagram' })`

function statefulBridge(database: boolean) {
  return (root: string) => {
    const script = join(root, 'bridge.mjs')
    writeFileSync(script, STATEFUL_BRIDGE)
    writeFileSync(join(root, 'requests.jsonl'), '')
    return { tool: 'bridge', bridge: { command: [process.execPath, script, join(root, 'requests.jsonl')], database } }
  }
}
const GANTT_DB = `const db=moduleFor('xychart','../gantt/ganttDb.js',file.filepath).default`

test("a stateful bridge runs a test's database calls on the candidate's own model", () => {
  const setup = `${GANTT_DB}
    const callingSpy=(name)=>{const original=Object.getOwnPropertyDescriptor(db,name).value,mock=(...a)=>{mock.calls.push(a);return original(...a)};mock.calls=[];mock._isMockFunction=true;Object.defineProperty(db,name,{configurable:true,enumerable:true,writable:true,value:mock});return mock}`
  const bodies = [
    // Calls accumulate on one database; getters read the model the bridge returned.
    `db.clear();db.setExcludes('weekends');db.setExcludes('friday');assert.deepEqual(db.getExcludes(),['weekends','friday'])
     assert.equal(db.addTask('t','id1,2019-02-01,1d'),undefined);assert.deepEqual(db.getTasks().map(t=>t.task),['t'])`,
    // The candidate's own method error is thrown, and its database keeps what the method did.
    `db.clear();assert.throws(()=>db.addTask('t',''),/needs a duration/);assert.equal(db.getTasks().length,1)`,
    // clear() starts a fresh database.
    `db.clear();db.setExcludes('weekends');db.clear();assert.deepEqual(db.getExcludes(),[])`,
    // Calls after a parse change the parsed model.
    `db.clear();db.parse('gantt\\ntodayMarker off');db.setExcludes('weekends');assert.equal(db.getTodayMarker(),'off');assert.deepEqual(db.getExcludes(),['weekends'])`,
    // A spy sees the test's own direct calls, which still reach the candidate.
    `db.clear();const mock=callingSpy('setTodayMarker');db.setTodayMarker('off');assert.deepEqual(mock.calls,[['off']]);assert.equal(db.getTodayMarker(),'off')`,
    // The bridge's parser calls its database out of process, where no spy can observe them.
    `db.clear();callingSpy('setTodayMarker');db.parse('gantt\\ntodayMarker off')`,
    // Members the bridge does not bind keep their review outcome.
    `db.clear();db.parseDuration('1d')`,
    `db.clear();db.setDisplayMode('compact')`,
    // An argument JSON would change is not sent.
    `db.clear();db.setExcludes(new Map())`,
  ]
  const audit = exercise('crabtalk/bezel', '0.2.26', bodies, setup, statefulBridge(true))
  const at = (index: number) => audit.find(row => row.index === index)!
  for (const index of [0, 1, 2, 3, 4]) {
    expect(at(index)).toMatchObject({ gaps: [], unsupported: [] })
    expect(at(index).calls).toBeGreaterThan(0)
  }
  expect(at(5).gaps.join()).toContain('crabtalk/bezel 0.2.26 implements a gantt parser that drives a caller-supplied database natively')
  expect(at(6).gaps.join()).toContain('implements gantt database parseDuration natively')
  expect(at(7)).toMatchObject({ unsupported: ["gantt database setDisplayMode (the candidate exposes a parser, not Mermaid's database API)"], unsupportedKinds: ['assessment'] })
  expect(at(8).gaps.join()).toContain('gantt database setExcludes: an argument is not a JSON value the bridge receives unchanged')
  // Without the stateful database the same calls are Mermaid's database API, which the
  // parse-only bridge does not offer.
  const stateless = exercise('crabtalk/bezel', '0.2.26', bodies.slice(0, 1), setup, statefulBridge(false))
  expect(stateless[0]).toMatchObject({ unsupported: ["gantt database setExcludes (the candidate exposes a parser, not Mermaid's database API)"] })
})

test('a stateful bridge replays the whole history of one database', () => {
  let root = ''
  exercise('crabtalk/bezel', '0.2.26', [`db.clear();db.setExcludes('weekends');db.parse('gantt\\ntodayMarker off');db.setTodayMarker('on')`], GANTT_DB, dir => ((root = dir), statefulBridge(true)(dir)))
  const requests = readFileSync(join(root, 'requests.jsonl'), 'utf8').trim().split('\n').map(line => JSON.parse(line))
  expect(requests.filter(request => request.database).map(request => request.database)).toEqual([
    [{ new: 'gantt' }, { call: 'setExcludes', args: ['weekends'] }],
    // A parse starts the database again from the candidate's model of that source.
    [{ parse: 'gantt\ntodayMarker off' }, { call: 'setTodayMarker', args: ['on'] }],
  ])
})

// The Bezel bridge as a Fidelity run builds it (bridges/bezel/build.ts, from the
// checksum-verified bezel-mermaid crate); skipped where no run has built it from this checkout's sources.
const BEZEL_BRIDGE = bridgeBuiltFromCheckout('bezel', 'crabtalk-bezel', 'bezel-bridge')
test.skipIf(!BEZEL_BRIDGE)("Bezel's bridge runs its own public database methods on its own model", () => {
  const ask = (request: unknown) => {
    const child = spawnSync(BEZEL_BRIDGE!, { input: JSON.stringify(request), encoding: 'utf8' })
    return JSON.parse(child.stdout.trim().split('\n').at(-1)!)
  }
  const members = ask({ describe: 'database' }).value
  expect(members.gantt).toContain('setDateFormat')
  expect(members.treeview).not.toContain('addNode')
  const gantt = ask({ family: 'gantt', database: [{ new: 'gantt' }, { call: 'setDateFormat', args: ['YYYY-MM-DD'] }, { call: 'addSection', args: ['s'] }, { call: 'addTask', args: ['t', 'id1,2019-02-01,1d'] }] }).value
  expect(gantt.model).toMatchObject({ type: 'gantt', dateFormat: 'YYYY-MM-DD', sections: ['s'], tasks: [{ id: 'id1', task: 't', section: 's' }] })
  // Bezel's own error, with the database as its method left it.
  const junction = ask({ family: 'architecture', database: [{ new: 'architecture-beta' }, { call: 'addGroup', args: [{ id: 'g1', title: 'Group' }] }, { call: 'addJunction', args: [{ id: 'g1', type: 'junction' }] }] }).value
  expect(junction.error.message).toContain('already in use')
  expect(Object.keys(junction.model.groups)).toEqual(['g1'])
  // An enum argument is the variant whose own name it is; a record must serialize back.
  expect(ask({ family: 'requirement', database: [{ new: 'requirementDiagram' }, { call: 'addRequirement', args: ['r', 'Functional Requirement'] }] }).value.model.requirements.r.type).toBe('Functional Requirement')
  expect(ask({ family: 'requirement', database: [{ new: 'requirementDiagram' }, { call: 'addRequirement', args: ['r', 'functional'] }] }).adapterGap).toContain('not a name the native type has')
  expect(ask({ family: 'architecture', database: [{ new: 'architecture-beta' }, { call: 'addGroup', args: [{ id: 'g1', label: 'Group' }] }] }).adapterGap).toContain('serializes back to')
  // A parse starts the database from Bezel's model of that source.
  const parsed = ask({ family: 'journey', database: [{ parse: 'journey\nsection A\nTask: 3: Me' }, { call: 'addTask', args: ['More', ':5:You'] }] }).value
  expect(parsed.model.tasks.map((task: any) => task.task)).toEqual(['Task', 'More'])
})
