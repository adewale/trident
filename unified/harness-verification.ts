import { createHash } from 'node:crypto'
import { checkCollectionBudget } from '../portable/checkpoint.ts'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'
import profile from '../qualification/harness-profile.json' with { type: 'json' }
import { tridentDirectory } from './trident-paths.ts'
import { reconcileCampaignBrowsers } from './campaign-preparation.ts'
import { protocolIdentity } from './protocol-identity.ts'
import { verifyProvidedCommunityArtifact, runCommunityNodeRound, runCommunityCli } from './community.ts'
import { runExternalCommunity } from './community-external.ts'
import { verifyReleaseCli } from './release-cli.ts'
import { selectArtifactVariant } from './artifact-variants.ts'
import { admitPreparedFidelityEngine } from '../fidelity/community.ts'
import { docsArtifactServer, initializeDocsPage, callDocsPage, closeDocsContext } from './docs-runtime.ts'
import { readDocsResources, routeDocsResource } from './docs-resources.ts'
import { publicSvgBrowserAction } from './public-svg-browser.ts'
import { publicDocsPngAction } from './docs-png-browser.ts'
import { qualifyOutput } from './qualification.ts'
import { inspectPng } from './png-inspection.ts'
import { runMermaidFidelitySuite } from './fidelity-suite.ts'
import { assertBenchmarkExecutionAllowed } from '../ci-policy.ts'
import type { PreparedCommunity } from './community-types.ts'
import type { PreparedCommunityBrowser } from './community-browser.ts'
import type { BenchmarkObservation, UnifiedRunOptions, UnifiedWorkload } from './types.ts'
const hash=(value:string|Uint8Array)=>createHash('sha256').update(value).digest('hex')
const write=(path:string,value:unknown)=>writeFileSync(path,JSON.stringify(value,null,2)+'\n')
const source='flowchart LR\nA[Alpha] --> B[Beta]'
export const verificationControls: UnifiedWorkload[]=[
 {id:'verification:positive',family:'flowchart',source,expectedLabels:['Alpha','Beta'],features:['retain-output-witness'],provenance:'Independent authored two-node harness control; not a benchmark score'},
 {id:'verification:changed',family:'flowchart',source:'flowchart LR\nA[Alpha] --> B[Gamma]',expectedLabels:['Alpha','Gamma'],features:['retain-output-witness'],provenance:'Metamorphic label replacement of harness control'},
 {id:'verification:invalid',family:'invalid-source',source:'This is deliberately not a Mermaid diagram. @@@ {{{',features:['retain-output-witness'],intent:'negative-admission',provenance:'Independent malformed-header harness control; acceptance is a renderer finding'},
 {id:'verification:recovery',family:'flowchart',source,expectedLabels:['Alpha','Beta'],features:['retain-output-witness'],provenance:'Original source after invalid input; same worker/context'}
]
export function harnessVerificationPlan() {
 const required=['reference-svg','reference-png-conversion','reference-model','terminal-baseline','node-svg','node-png','node-terminal','alternate-model','package-cli','png-only-worker','wasm-svg','native-node-engine','native-svg-cli','native-png-cli','native-terminal-cli','python-api']
 if(new Set(profile.projects.map(p=>p.project)).size!==6||JSON.stringify(profile.jobs.map(job=>job.id).sort())!==JSON.stringify(required.sort())||profile.jobs.some(job=>!profile.projects.some(p=>p.project===job.project)))throw Error('Harness profile omits or duplicates a required execution path')
 return {...profile,controlSources:verificationControls,renderJobCount:profile.jobs.filter(job=>job.transport!=='model').length,plannedOutputCalls:profile.jobs.filter(job=>job.transport!=='model').length*verificationControls.length,modelCase:'meaning:family:flowchart',modelCallScope:'Existing public-model contract workflow; raw records retain its operations. Not included in output-call count.',sampling:'One call per control/output path, no performance warmups or repetitions',referenceTerminalScore:false}
}
async function browserControls(peer:PreparedCommunityBrowser,output:string,options:UnifiedRunOptions) {
 admitPreparedFidelityEngine(peer)
 const engine=peer.browser!,server=docsArtifactServer(engine.root,engine.zenuml),resources=readDocsResources(options.docsResourcesFile)
 await new Promise<void>(done=>server.listen(0,'127.0.0.1',done));const origin='http://127.0.0.1:'+(server.address() as any).port
 const browser=await chromium.launch({headless:true,executablePath:options.executable??'/usr/bin/chromium'}),context=await browser.newContext({viewport:{width:1400,height:1000}}),page=await context.newPage(),rows:BenchmarkObservation[]=[]
 try {
  await context.route('**/*',route=>routeDocsResource(route,origin,resources));await initializeDocsPage(page,engine,origin)
  for(const [index,input] of verificationControls.entries()) {
   checkCollectionBudget(options.collectionDeadline)
   write(join(options.out,`started-${index}.json`),{caseId:input.id,startedAt:new Date().toISOString(),project:peer.node.id,output,transport:'browser'})
   const value=await callDocsPage(page,output==='png'?publicDocsPngAction:publicSvgBrowserAction,output==='png'?{source:input.source,id:'v'+index}:{type:'measure-docs',source:input.source,id:'v'+index,retainSvg:true},Math.min(20_000,Math.max(1,(options.collectionDeadline??Infinity)-Date.now())))
   // Persist the untouched return before output checking can fail.
   write(join(options.out,`raw-${index}.json`),value)
   const returned=output==='png'?value.status==='ok':value.status==='passed'
   const bytes=output==='png'&&Array.isArray(value.png)?Buffer.from(value.png):typeof value.svg==='string'?Buffer.from(value.svg):undefined
   const file=bytes?join(options.out,hash(bytes)+'.'+output):undefined;if(bytes&&file)writeFileSync(file,bytes)
   const admission=bytes?(output==='png'?inspectPng(bytes,false).findings.length===0:qualifyOutput(input,bytes.toString(),output).ok):false
   const negative=input.intent==='negative-admission',status=negative?(returned?'failed':'blocked'):returned&&admission?'passed':'failed'
   rows.push({suite:'harness-verification',surface:'browser:'+output,runtime:'Chromium',family:input.family,caseId:input.id,operation:negative?'negative-admission':'render',format:output,mode:'unscored-invocation-control',status,detail:negative?'Renderer acceptance/rejection is a finding, not a harness-quality score':value.error??value.detail,metrics:{project:peer.node.id,version:engine.version,measuredAt:new Date().toISOString(),...(file?{outputFile:file}:{}),timingQualified:false}})
   write(join(options.out,'observations.json'),rows)
  }
 }finally{await closeDocsContext(context,server);await browser.close()}
 return rows
}
export async function verifyHarness(preparedFile:string,browserFile:string,out:string,executable?:string) {
 assertBenchmarkExecutionAllowed();if(existsSync(out))throw Error('Choose fresh harness verification output')
 const plan={...harnessVerificationPlan(),preparedSha256:hash(readFileSync(preparedFile)),browserPreparedSha256:hash(readFileSync(browserFile))},prepared=JSON.parse(readFileSync(preparedFile,'utf8')) as PreparedCommunity[],browsers=reconcileCampaignBrowsers(prepared,JSON.parse(readFileSync(browserFile,'utf8')))
 for(const expected of profile.projects){const peer=prepared.find(p=>p.node.id===expected.project);if(!peer?.artifact||peer.artifact.version!==expected.version)throw Error('Verification requires the pinned artifact '+expected.project+'@'+expected.version);verifyProvidedCommunityArtifact(peer.artifact);verifyReleaseCli(peer.node,peer.artifact)}
 const producers=protocolIdentity(tridentDirectory,['unified/harness-verification.ts','qualification/harness-profile.json']);mkdirSync(out,{recursive:true});write(join(out,'plan.json'),plan)
 const results:any[]=[],collectionDeadline=Date.now()+profile.budgetMinutes*60_000
 for(const job of profile.jobs){
  const directory=join(out,job.id);mkdirSync(directory)
  const primary=prepared.find(peer=>peer.node.id===job.project)!,options:UnifiedRunOptions={root:tridentDirectory,harnessRoot:tridentDirectory,out:directory,rounds:1,profile:'smoke',communityCoverageOnce:true,communityProjects:[job.project],executable,collectionDeadline}
  let rows:BenchmarkObservation[]=[],error:string|undefined
  try{
   checkCollectionBudget(collectionDeadline)
   write(join(directory,'attempt.json'),{job,startedAt:new Date().toISOString(),artifact:primary.artifact,producers})
   if(job.transport==='model'){
    const modelOptions={...options,packageRoot:primary.artifact!.root,fidelityCaseIds:['meaning:family:flowchart']};const result=await runMermaidFidelitySuite(modelOptions);rows=result.observations
   }else if(job.transport==='browser'){
    const peer=browsers.find(peer=>peer.node.id===job.project);if(!peer||job.id==='wasm-svg'&&peer.browser?.kind!=='merman')throw Error('Missing pinned browser mechanism');rows=await browserControls(peer,job.output,options)
   }else{
    const peer=selectArtifactVariant(primary,job.output as 'svg'|'png'|'terminal',[{project:job.project,output:job.output as any,variant:job.transport}]);write(join(directory,'selected-artifact.json'),peer)
    const expectedKind=job.id==='png-only-worker'?'jsonl-worker':job.id==='python-api'?'python':job.transport!=='primary'?'cli':job.id==='terminal-baseline'?'cli':'node';if(peer.artifact?.kind!==expectedKind)throw Error('Prepared artifact does not exercise the required '+expectedKind+' mechanism')
    if(peer.artifact!.kind==='cli')rows=verificationControls.map(input=>{checkCollectionBudget(collectionDeadline);return runCommunityCli(peer,job.output,input,1,directory)})
    else if(peer.artifact!.kind==='python'||peer.artifact!.kind==='jsonl-worker')rows=await runExternalCommunity(peer,[...verificationControls],job.output,1,options)
    else rows=await runCommunityNodeRound(peer,job.output,[...verificationControls],1,options)
   }
  }catch(e){error=String(e)}
  write(join(directory,'result.json'),{job,rows,error,finishedAt:new Date().toISOString()})
  const positive=job.transport==='model'?rows.some(row=>row.status==='passed'):verificationControls.filter(c=>c.intent!=='negative-admission').every(c=>rows.some(row=>row.caseId===c.id&&row.status==='passed'&&row.metrics?.outputFile))
  const accounted=job.transport==='model'?rows.length>0:verificationControls.every(c=>rows.some(row=>row.caseId===c.id))
  results.push({job:job.id,project:job.project,output:job.output,transport:job.transport,execution:!error&&accounted&&positive?'verified':'blocked',error,observations:rows.length,scope:'Invocation/retention controls only; no corpus accuracy or speed qualification'})
  write(join(out,'result.json'),{schema:'trident-harness-verification-v1',qualification:results.length===profile.jobs.length&&results.every(row=>row.execution==='verified')?'execution-paths-verified':'blocked',plan,producers,results})
 }
 return results
}
if(import.meta.main){
 const args=process.argv.slice(2)
 if(args.includes('--help'))console.log('verify:harness --plan\nverify:harness --prepared FILE --browser-prepared FILE --out FRESH_DIR [--executable CHROMIUM]\nUnscored six-project execution-path checks. No acquisition or performance qualification.')
 else if(args.length===1&&args[0]==='--plan')console.log(JSON.stringify(harnessVerificationPlan(),null,2))
 else {const options=new Map<string,string>();for(let i=0;i<args.length;i+=2){if(!['--prepared','--browser-prepared','--out','--executable'].includes(args[i]!)||!args[i+1]||options.has(args[i]!))throw Error('Use --help');options.set(args[i]!,resolve(args[i+1]!))}if(!options.has('--prepared')||!options.has('--browser-prepared')||!options.has('--out'))throw Error('Use --help');const rows=await verifyHarness(options.get('--prepared')!,options.get('--browser-prepared')!,options.get('--out')!,options.get('--executable'));if(rows.some(row=>row.execution!=='verified'))process.exitCode=2;console.log(JSON.stringify(rows))}
}
