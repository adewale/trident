import {expect,test} from 'bun:test'
import {cpSync,mkdirSync,readFileSync,readdirSync,symlinkSync,unlinkSync,writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {InvocationJournal} from '../portable/invocation-journal.ts'
import {evidenceBytesDigest,evidenceDigest} from '../portable/evidence-contract.ts'
import {createAuthoredSvgRawCapture,readRetainedAuthoredSvgWorkflow,authoredSvgAdapterBinding,classifyAuthoredSvgResult} from '../fidelity/community-raw.ts'
import type {AuthoredFidelityCase} from '../fidelity/meaning.ts'
import {retainedPath} from '../unified/recheck-rendering.ts'
import {useTempDirs} from './helpers/temp-dir.ts'

const temp=useTempDirs('authored-raw-first-'),owner={project:'fixture/raw-first',artifactSha256:'a'.repeat(64),adapterBindingSha256:authoredSvgAdapterBinding({kind:'synthetic-fixture'},null)}
const input:AuthoredFidelityCase={id:'fixture:workflow',family:'flowchart',required:true,source:'flowchart LR\nMain[Main]',features:[],provenance:'Independent synthetic durability control; no project renderer',expected:{labels:['Main']},prelude:[{source:'flowchart LR\nBefore[Before]',accept:true}]}
const svg=(label:string)=>'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><text x="5" y="25">'+label+'</text></svg>'

test('every actual return is durable before grading; a completed workflow replays bytes and original UUIDs without any public or initialization call',async()=>{
  const directory=join(temp.dir(),'raw'),raw=createAuthoredSvgRawCapture(directory,owner);let calls=0
  const captured=await raw.capture(input,async request=>{calls++;return{kind:'returned',svg:svg(request.step==='main'?'Main':'Before')}},()=> 'actual-fixture-runtime-A',()=>({fontOptions:true}))
  const returned=new InvocationJournal(join(directory,'invocations')).records().filter(frame=>frame.state==='returned')
  expect(returned).toHaveLength(2)
  expect(returned.map(frame=>evidenceBytesDigest(readFileSync(frame.output!.path))).sort()).toEqual([evidenceBytesDigest(svg('Before')),evidenceBytesDigest(svg('Main'))].sort())
  expect(()=>{throw Error('Synthetic grader failure after completed raw capture')}).toThrow('grader failure')
  const before=JSON.stringify(returned),reopened=createAuthoredSvgRawCapture(directory,owner)
  const replay=await reopened.capture({...input,expected:{labels:['Different independently reviewed oracle']}},async()=>{throw Error('Public render must not repeat')},()=> 'different-fresh-runtime',()=>({}),async()=>{throw Error('Initialization must not repeat')})
  expect(calls).toBe(2)
  expect(replay.steps.map(step=>step.result.svg)).toEqual([svg('Before'),svg('Main')])
  expect(replay.workflowId).toBe(captured.workflowId)
  expect(replay.steps.map(step=>step.invocation.attemptId)).toEqual(captured.steps.map(step=>step.invocation.attemptId))
  expect(replay.capabilities).toEqual({fontOptions:true})
  expect(JSON.stringify(new InvocationJournal(join(directory,'invocations')).records().filter(frame=>frame.state==='returned'))).toBe(before)
})

test('a crash between prelude and main retains the partial attempt and never completes it in a fresh context',async()=>{
  const directory=join(temp.dir(),'raw'),raw=createAuthoredSvgRawCapture(directory,owner);let calls=0
  await expect(raw.capture(input,async()=>{calls++;return{kind:'returned',svg:svg('Before')}},()=> 'first-runtime',()=>({}),async request=>{if(request.step==='main')throw Error('Synthetic controller stopped before main')})).rejects.toThrow('stopped before main')
  expect(calls).toBe(1)
  expect(raw.partial(input)).toBe(true)
  expect(new InvocationJournal(join(directory,'invocations')).records().filter(frame=>frame.state==='returned')).toHaveLength(1)
  const reopened=createAuthoredSvgRawCapture(directory,owner)
  await expect(reopened.capture(input,async()=>{calls++;return{kind:'returned',svg:svg('Main')}},()=> 'fresh-runtime',()=>({}),async()=>{throw Error('No implicit initialization')})).rejects.toThrow('Partial authored workflow')
  expect(calls).toBe(1)
})

test('actual reinitialization, changed source/options/artifact or changed returned bytes cannot borrow a complete workflow',async()=>{
  const directory=join(temp.dir(),'raw'),raw=createAuthoredSvgRawCapture(directory,owner);let runtime='actual-runtime-A'
  await expect(raw.capture(input,async request=>{if(request.step==='prelude-0')runtime='actual-runtime-B';return{kind:'returned',svg:svg('Actual')}},()=>runtime,()=>({}))).rejects.toThrow('actual runtime')
  expect(new InvocationJournal(join(directory,'invocations')).records().filter(frame=>frame.state==='returned')).toHaveLength(2)
  const second=join(temp.dir(),'raw'),complete=await createAuthoredSvgRawCapture(second,owner).capture(input,async()=>({kind:'returned',svg:svg('Actual')}),()=> 'one-runtime',()=>({}))
  const read=(value:AuthoredFidelityCase,expected=owner)=>readRetainedAuthoredSvgWorkflow(value,owner.project,complete.witness,expected,path=>path)
  expect(()=>read({...input,source:input.source+'\nOther'})).toThrow('source binding')
  expect(()=>read({...input,renderOptions:{fontSize:24}})).toThrow('source binding')
  expect(()=>read(input,{...owner,artifactSha256:'b'.repeat(64)})).toThrow('identity')
  expect(()=>read(input,{...owner,adapterBindingSha256:'c'.repeat(64)})).toThrow('identity')
  writeFileSync(complete.steps[0]!.invocation.output!.path,'foreign bytes')
  expect(()=>read(input)).toThrow('output bytes changed')
})

test('moved archives resolve their own raw bytes; nested checkpoint symlinks cannot borrow another archive',async()=>{
  const root=temp.dir(),original=join(root,'original'),moved=join(root,'moved'),directory=join(original,'raw');mkdirSync(original)
  const captured=await createAuthoredSvgRawCapture(directory,owner).capture(input,async()=>({kind:'returned',svg:svg('Actual')}),()=> 'one-runtime',()=>({}))
  cpSync(original,moved,{recursive:true})
  const remap=(path:string)=>retainedPath(original,moved,[],path)
  expect(readRetainedAuthoredSvgWorkflow(input,owner.project,captured.witness,owner,remap).steps).toHaveLength(2)
  const units=join(moved,'raw','invocations','checkpoint-units'),name=readdirSync(units)[0]!,foreign=join(temp.dir(),'foreign.json.gz')
  writeFileSync(foreign,readFileSync(join(units,name)));unlinkSync(join(units,name));symlinkSync(foreign,join(units,name))
  expect(()=>readRetainedAuthoredSvgWorkflow(input,owner.project,captured.witness,owner,remap)).toThrow('symlink escapes')
})

test('host exceptions and timeouts never earn source-rejection credit even with parser-looking messages',()=>{
  expect(classifyAuthoredSvgResult({kind:'exception',error:'Error: Parse error on line 1'})).toBe('failed')
  expect(classifyAuthoredSvgResult({kind:'exception',error:'Error: Parse error on line 1',hostTransportError:true})).toBe('unavailable')
  expect(classifyAuthoredSvgResult({kind:'exception',error:'Error: Parse error on line 1',errorName:'TimeoutError'})).toBe('unavailable')
  expect(classifyAuthoredSvgResult({kind:'exception',error:'TypeError: native runtime bug'})).toBe('unavailable')
  expect(classifyAuthoredSvgResult({kind:'exception',error:'UnknownDiagramError: unsupported'})).toBe('unsupported')
  expect(evidenceDigest(owner)).toHaveLength(64)
})
