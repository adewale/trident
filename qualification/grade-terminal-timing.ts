/** Finish a captured terminal timing run offline, preserving every original
 * invocation, clock, source, replica and partial old grading record. */
import {readFileSync} from 'node:fs'
import {dirname,resolve,join} from 'node:path'
import {terminalProfileCorpus} from '../fidelity/terminal-active-corpus.ts'
import {assessTerminalDrawing} from '../fidelity/terminal-assessment.ts'
import {deriveTimingGrading} from '../portable/timing-grading.ts'
import {readCheckpointEntries,writeDurableEvidence} from '../portable/checkpoint.ts'
import {admitInvocationEvidence,evidenceBytesDigest,evidenceDigest,type InvocationEvidence,type CheckedEvidence} from '../portable/evidence-contract.ts'
import {qualifiedTimingCoordinates} from '../portable/qualified-timing-collection.ts'
import {verifyProvidedCommunityArtifact} from '../unified/community.ts'
import {qualifyRetainedTimingBundle} from '../unified/qualify-timing.ts'
import {protocolIdentity} from '../unified/protocol-identity.ts'
const file=resolve(process.argv[2]!),root=dirname(file),originalBytes=readFileSync(file),original=JSON.parse(originalBytes.toString()),inputs=JSON.parse(readFileSync(join(root,'terminal-inputs.json'),'utf8')),outcomes=JSON.parse(readFileSync(join(root,'cli-outcomes.json'),'utf8'))
if(original.plan.format!=='terminal'||!original.rawComplete)throw Error('Only a complete original terminal raw capture can be graded offline')
for(const peer of inputs.prepared)verifyProvidedCommunityArtifact(peer.artifact)
const corpus=terminalProfileCorpus(),sources=new Map(original.plan.cases.map((contract:any)=>{const source=corpus.cases.find(source=>source.id===contract.caseId);if(!source||source.sourceSha256!==contract.sourceSha256||evidenceDigest(source.expected.contract)!==contract.expectationsSha256)throw Error('Original complete source contract is stale');return[contract.caseId,source]}))
const capture=new Map<string,any[]>();for(const entry of outcomes.coordinates){const key=JSON.stringify(entry.coordinate);if(capture.has(key))throw Error('Duplicate actual CLI outcome coordinate');capture.set(key,entry.rows)}
const schedule=qualifiedTimingCoordinates(original.plan);if(capture.size!==schedule.length||schedule.some(c=>!capture.has(JSON.stringify([c.round,c.replica,c.caseId,c.sample]))))throw Error('Actual CLI receipt set differs from the original complete schedule')
const frames=readCheckpointEntries<InvocationEvidence>(join(root,original.journalDirectory),{schema:'trident-invocation-journal-v1'}).map(([,frame])=>admitInvocationEvidence(frame)),producers=protocolIdentity(resolve(import.meta.dir,'..'),['qualification/grade-terminal-timing.ts','fidelity/terminal-assessment.ts']),observerSha256=evidenceDigest({producers,originalObserver:original.plan.observerSha256,outcomesSha256:evidenceBytesDigest(readFileSync(join(root,'cli-outcomes.json')))})
const grading=await deriveTimingGrading(original.plan,original.samples,output=>readFileSync(join(root,original.journalDirectory,'outputs',output.sha256)),{schema:'trident-derived-timing-grading-v1',collectionPlanSha256:evidenceDigest(original.plan),cases:original.plan.cases,observerSha256,reason:'Complete offline inspection after the coordinated post-capture pause exhausted the collector grading budget. All108 original raw calls, complete sources and partial old grading remain unchanged; zero new renderer calls.',provenance:{source:'qualification/grade-terminal-timing.ts',sha256:evidenceBytesDigest(readFileSync(import.meta.filename))}},({contract,invocation,bytes})=>{
 const input:any=sources.get(contract.caseId),grade=assessTerminalDrawing(input,bytes),coordinate=JSON.parse(invocation.identity.coordinate!).slice(1),rows=capture.get(JSON.stringify(coordinate))??[];let utf8=true;try{new TextDecoder('utf-8',{fatal:true}).decode(bytes)}catch{utf8=false}
 const actual=rows.length===1&&rows[0].status===0&&rows[0].error===null&&rows[0].sourceSha256===contract.sourceSha256&&rows[0].stdoutSha256===evidenceBytesDigest(bytes)&&rows[0].stdoutBytes===bytes.length
 return{schema:'trident-checked-evidence-v1',caseId:contract.caseId,sourceSha256:contract.sourceSha256,expectationsSha256:contract.expectationsSha256,outputSha256:evidenceBytesDigest(bytes),observerSha256,checks:[...('checks'in grade?grade.checks??[]:[]).map(f=>({surface:'terminal:display-facts',criterion:f.criterion,status:f.status,detail:f.detail})),{surface:'terminal:public-cli',criterion:'complete-utf8-return',status:actual&&utf8?'passed':'unknown',detail:JSON.stringify({policy:'Fresh full-source inspection, exact original CLI return/UTF8 receipt; frozen artifacts reverified offline',utf8,captured:rows})}]}as CheckedEvidence
},frames)
const derived={...original,originalBundle:{file:file.split('/').at(-1),sha256:evidenceBytesDigest(originalBytes)},grading},qualification=qualifyRetainedTimingBundle(derived,root),result={...derived,qualification},target=join(root,'timing-regraded-'+evidenceDigest(result).slice(0,24)+'.json')
writeDurableEvidence(target,Buffer.from(JSON.stringify(result,null,2)+'\n'));console.log(JSON.stringify({bundleFile:target,qualification},null,2));if(qualification.status!=='qualified')process.exitCode=2
