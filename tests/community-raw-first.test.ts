import {expect,setDefaultTimeout,test} from 'bun:test'
import {cpSync,mkdirSync,readFileSync,readdirSync,symlinkSync,unlinkSync,writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {InvocationJournal} from '../portable/invocation-journal.ts'
import {evidenceBytesDigest,evidenceDigest} from '../portable/evidence-contract.ts'
import {createAuthoredSvgRawCapture,readRetainedAuthoredSvgWorkflow,authoredSvgAdapterBinding,classifyAuthoredSvgResult} from '../fidelity/community-raw.ts'
import type {AuthoredFidelityCase} from '../fidelity/meaning.ts'
import {retainedPath} from '../unified/recheck-rendering.ts'
import {useTempDirs} from './helpers/temp-dir.ts'
import {spawnSync} from 'node:child_process'
import {gunzipSync} from 'node:zlib'
import {readBenchmarkDocument} from '../portable/project-records.ts'

const temp=useTempDirs('authored-raw-first-'),owner={project:'fixture/raw-first',artifactSha256:'a'.repeat(64),adapterBindingSha256:authoredSvgAdapterBinding({kind:'synthetic-fixture'},null)}
setDefaultTimeout(30_000)
const input:AuthoredFidelityCase={id:'fixture:workflow',family:'flowchart',required:true,source:'flowchart LR\nMain[Main]',features:[],provenance:'Independent synthetic durability control; no project renderer',expected:{labels:['Main']},prelude:[{source:'flowchart LR\nBefore[Before]',accept:true}]}
const svg=(label:string)=>'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><text x="5" y="25">'+label+'</text></svg>'

test('the actual collector survives process death at its first qualifier with all prelude/main bytes, then regrades without another host API call',()=>{
  const root=temp.dir(),fixture=new URL('./fixtures/community/raw-first.ts',import.meta.url).pathname
  const invoke=(mode:string)=>spawnSync(process.execPath,[fixture,root,mode],{encoding:'utf8',timeout:20_000,env:{...process.env,CI:'true'}})
  const crashed=invoke('crash')
  expect(crashed.status).toBe(73)
  const projectOut=join(root,'out',Buffer.from('fixture/raw-first').toString('base64url')),rawDirectory=join(projectOut,'authored-raw')
  const calls=readFileSync(join(root,'public-calls'),'utf8')
  expect(calls).toBe('initialize\nconfigure\nrender\nrender\n')
  expect(readFileSync(join(root,'grading-calls'),'utf8')).toBe('grade\n')
  const frames=new InvocationJournal(join(rawDirectory,'invocations')).records(),returned=frames.filter(frame=>frame.state==='returned')
  expect(returned).toHaveLength(2)
  expect(returned.map(frame=>readFileSync(frame.output!.path,'utf8')).sort()).toEqual([svg('Before'),svg('Main')].sort())
  const mainFiles=readdirSync(projectOut).filter(name=>name.endsWith('.svg.gz'))
  expect(mainFiles).toHaveLength(1)
  expect(gunzipSync(readFileSync(join(projectOut,mainFiles[0]!))).toString()).toBe(svg('Main'))
  const resumed=invoke('resume')
  expect(resumed.status).toBe(0)
  expect(resumed.stderr).not.toContain('error:')
  expect(readFileSync(join(root,'public-calls'),'utf8')).toBe(calls)
  expect(new InvocationJournal(join(rawDirectory,'invocations')).records()).toEqual(frames)
  const receipt=JSON.parse(readFileSync(join(projectOut,'community-fidelity-cases.json'),'utf8'))
  expect(receipt.rows[0].collectionError).toContain('Synthetic grading failure')
  expect(receipt.rows[0].workflowEvidence).toBeDefined()
  expect(receipt.rows[0].svgEvidence.sha256).toBe(evidenceBytesDigest(svg('Main')))
  const report=readBenchmarkDocument(join(root,'out','community-fidelity-report.json')) as any
  expect(report.observations.find((row:any)=>row.operation==='public-svg-admission').status).toBe('passed')
  expect(JSON.parse(resumed.stdout.trim().split('\n').at(-1)!).actualProjectCalls).toBe(0)
})

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

test('separate synthetic CLI processes retain both returns and grade the main without shared-context prelude credit',()=>{
  const root=temp.dir(),fixture=new URL('./fixtures/community/raw-first.ts',import.meta.url).pathname
  const invoke=()=>spawnSync(process.execPath,[fixture,root,'cli'],{encoding:'utf8',timeout:20_000,env:{...process.env,CI:'true'}})
  const first=invoke()
  expect(first.status).toBe(0)
  expect(first.stderr).not.toContain('error:')
  const projectOut=join(root,'out',Buffer.from(owner.project).toString('base64url'))
  const receipt=JSON.parse(readFileSync(join(projectOut,'community-fidelity-cases.json'),'utf8')),row=receipt.rows[0]
  expect(row.collectionError).toBeUndefined()
  expect(row.sameRuntime).toBe(false)
  expect(row.preludes).toHaveLength(1)
  expect(row.svgEvidence.sha256).toBe(evidenceBytesDigest(svg('Main')))
  const report=readBenchmarkDocument(join(root,'out','community-fidelity-report.json')) as any
  expect(report.observations.find((value:any)=>value.operation==='public-svg-admission').status).toBe('passed')
  expect(report.observations.find((value:any)=>value.operation==='standalone-svg-and-labels').status).toBe('passed')
  expect(report.observations.find((value:any)=>value.operation==='prelude-0').status).toBe('blocked')
  expect(report.observations.find((value:any)=>value.operation==='synthetic-main-observer').status).toBe('passed')
  expect(readFileSync(join(root,'public-calls'),'utf8')).toBe('cli\ncli\n')
  expect(readFileSync(join(root,'grading-calls'),'utf8')).toBe('grade\n')
  expect(readFileSync(join(root,'paint-calls'),'utf8')).toBe('paint\n')
  const frames=new InvocationJournal(join(projectOut,'authored-raw','invocations')).records()
  expect(frames.filter(frame=>frame.state==='returned')).toHaveLength(2)
  const replay=invoke()
  expect(replay.status).toBe(0)
  expect(readFileSync(join(root,'public-calls'),'utf8')).toBe('cli\ncli\n')
  expect(new InvocationJournal(join(projectOut,'authored-raw','invocations')).records()).toEqual(frames)
  expect(JSON.parse(replay.stdout.trim().split('\n').at(-1)!).actualProjectCalls).toBe(0)
})

test('CLI source/output ownership survives distinct per-step processes and binds the sealed argument protocol',async()=>{
  const directory=join(temp.dir(),'raw'),engine={kind:'cli',root:'/synthetic',entry:'/synthetic/renderer',version:'1.0.0',artifactSha256:owner.artifactSha256}
  const cli={args:['--svg'],input:'stdin' as const},cliOwner={...owner,adapterBindingSha256:authoredSvgAdapterBinding(engine,null,cli)}
  let processId=0,calls=0
  const raw=createAuthoredSvgRawCapture(directory,cliOwner)
  const captured=await raw.capture(input,async request=>{calls++;return{kind:'returned',svg:svg(request.step==='main'?'Main':'Before')}},()=> 'cli-process-'+processId,()=>({}),async()=>{processId++})
  expect(captured.sameRuntime).toBe(false)
  expect(captured.steps.map(step=>step.runtimeInstanceId)).toEqual(['cli-process-1','cli-process-2'])
  expect(captured.steps.every(step=>step.runtimeInstanceId===step.finishedRuntimeInstanceId)).toBe(true)
  expect(captured.steps.at(-1)!.result.svg).toBe(svg('Main'))
  const replay=await raw.capture(input,async()=>{throw Error('No process may run on replay')},()=> 'fresh-process',()=>({}),async()=>{throw Error('No process preparation on replay')})
  expect(calls).toBe(2)
  expect(replay.steps.map(step=>step.invocation.attemptId)).toEqual(captured.steps.map(step=>step.invocation.attemptId))
  const changed={...cliOwner,adapterBindingSha256:authoredSvgAdapterBinding(engine,null,{...cli,args:['--different']})}
  expect(changed.adapterBindingSha256).not.toBe(cliOwner.adapterBindingSha256)
  expect(()=>readRetainedAuthoredSvgWorkflow(input,owner.project,captured.witness,changed,path=>path)).toThrow('identity')
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

test('actual reinitialization withholds shared-runtime proof while source/options/artifact and byte ownership remain strict',async()=>{
  const directory=join(temp.dir(),'raw'),raw=createAuthoredSvgRawCapture(directory,owner);let runtime='actual-runtime-A'
  const recovered=await raw.capture(input,async request=>{if(request.step==='prelude-0')runtime='actual-runtime-B';return{kind:'returned',svg:svg('Actual')}},()=>runtime,()=>({}))
  expect(recovered.sameRuntime).toBe(false)
  expect(recovered.steps[0]!.runtimeInstanceId).toBe('actual-runtime-A')
  expect(recovered.steps[0]!.finishedRuntimeInstanceId).toBe('actual-runtime-B')
  expect(recovered.steps.at(-1)!.result.svg).toBe(svg('Actual'))
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
