import {mock} from 'bun:test'
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,readdirSync} from 'node:fs'
import {join,resolve} from 'node:path'
import {Worker} from 'node:worker_threads'
import {once} from 'node:events'
const tree=resolve(import.meta.dir,'../../..'), mode=process.argv[2]??'artifact'
const modules=await import(tree+'/portable/qualified-timing-collection.ts'), realCollect=modules.collectQualifiedTiming, realLaunch=modules.launchOwnedTimingBrowser
// Test-only source identity: this child isolates mutable module mocks, and its
// synthetic fixture receipts are never published as renderer measurements.
mock.module(tree+'/unified/protocol-identity.ts',()=>({protocolIdentity:()=>({source:'synthetic driver-finalization regression',files:[]})}))
const{evidenceBytesDigest:hash}=await import(tree+'/portable/evidence-contract.ts')
const{qualifyRetainedTiming}=await import(tree+'/unified/qualify-timing.ts')
const{chromiumExecutable}=await import(tree+'/tests/helpers/environment.ts')
const root=mkdtempSync('/tmp/trident-timing-postcondition-'), out=join(root,'capture'), worker=join(root,'worker.mjs')
writeFileSync(worker,`import{serveQualifiedTimingWorker}from${JSON.stringify(tree+'/portable/qualified-timing-collection.ts')};serveQualifiedTimingWorker(async source=>{await new Promise(r=>setTimeout(r,5));return '<svg>synthetic lifecycle fixture</svg>'});`)
const entries=['reference','candidate'].map(name=>{const directory=join(root,name);mkdirSync(directory);const code='globalThis.FrozenSvg = () => "synthetic unused SVG binding";';writeFileSync(join(directory,'entry.js'),code);writeFileSync(join(directory,'package.json'),JSON.stringify({name:'fixture-'+name,version:'1.2.3'}));return{node:{id:'fixture/'+name,outputs:['svg']},artifact:{root:directory,version:'1.2.3'},browserStatus:'prepared',browser:{root:directory,entry:'entry.js',global:'FrozenSvg',kind:'function',version:'1.2.3',artifactSha256:hash(code),files:[{path:join(directory,'entry.js'),sha256:hash(code)}]}}})
const preparedFile=join(root,'prepared.json');writeFileSync(preparedFile,JSON.stringify(entries))
let retained:any
mock.module(tree+'/portable/qualified-timing-collection.ts',()=>({...modules,launchOwnedTimingBrowser:async(options:any)=>{const session=await realLaunch(options);return{...session,async close(){await session.close();if(mode==='cleanup')throw Error('Injected actual outer-browser cleanup failure after close')}}},collectQualifiedTiming:async(plan:any,sources:any,_driver:any,_observer:any,target:string,limits:any)=>{
 if(mode==='cleanup'){const owned:any[]=[];const opened=await _driver.open({round:1,replica:'A0',caseId:plan.cases[0].caseId,sample:0,artifact:plan.artifacts.A0,signal:new AbortController().signal,own:(execution:any)=>owned.push(execution)});await opened.execution.handle.close()}
 const driver={context:{boundary:plan.boundary,format:plan.format,track:plan.track,environmentSha256:plan.environmentSha256,artifacts:plan.artifacts},async open({artifact,own}:any){const handle=new Worker(worker);own({kind:'node-worker',handle});await once(handle,'message');return{artifact,execution:{kind:'node-worker',handle}}}}
 retained=await realCollect(plan,sources,driver,({contract,bytes}:any)=>({schema:'trident-checked-evidence-v1',caseId:contract.caseId,sourceSha256:contract.sourceSha256,expectationsSha256:contract.expectationsSha256,outputSha256:hash(bytes),observerSha256:plan.observerSha256,checks:contract.requiredChecks.map((check:any)=>({...check,status:'passed',detail:'Synthetic fixture premise to isolate post-capture lifecycle; no renderer accuracy claim'}))}),target,limits)
 // Reproduce a real post-capture frozen-artifact failure, outside public clocks.
 if(mode==='artifact')writeFileSync(join(root,'candidate/entry.js'),'changed after raw capture')
 return retained
}}))
const{runBrowserSvgTiming}=await import(tree+'/unified/timing-browser.ts')
let failed=false,detail=''
try{await runBrowserSvgTiming({preparedFile,baseline:'fixture/reference',candidate:'fixture/candidate',out,executable:chromiumExecutable,maximumControlSpread:1000})}catch(error){failed=true;detail=String(error)}
const files=readdirSync(out).filter(file=>file.startsWith('timing-bundle-'));const reread=retained?qualifyRetainedTiming(retained.bundleFile):undefined;const finalization=JSON.parse(readFileSync(join(out,'driver-finalization.json'),'utf8'))
console.log(JSON.stringify({driverFailed:failed,driverError:detail,bundleStatus:retained?.qualification.status,offlineStatus:reread?.status,storedStatuses:files.map(file=>JSON.parse(readFileSync(join(out,file),'utf8')).qualification.status),finalizationStatus:finalization.status,finalizationChecks:finalization.checks,actualProjectCalls:0,syntheticCalls:retained?.samples.length,bundle:retained?.bundleFile,root}))
