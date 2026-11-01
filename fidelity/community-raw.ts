import {randomUUID} from 'node:crypto'
import {existsSync,readFileSync,readdirSync} from 'node:fs'
import {join} from 'node:path'
import {CollectionCheckpoint,readCheckpointEntries,readCheckpointValue} from '../portable/checkpoint.ts'
import {InvocationJournal} from '../portable/invocation-journal.ts'
import {admitInvocationEvidence,evidenceBytesDigest,evidenceDigest,type InvocationEvidence} from '../portable/evidence-contract.ts'
import type {AuthoredFidelityCase} from './meaning.ts'
import type {CommunityArtifact} from '../unified/community-types.ts'

export interface AuthoredSvgRawOwner {project:string;artifactSha256:string;adapterBindingSha256:string}
export interface AuthoredSvgWorkflowEvidence {
  schema:'trident-authored-svg-workflow-evidence-v1'
  directory:string
  caseId:string
  workflowId:string
  receiptSha256:string
}
interface Request {step:string;source:string;options:unknown;requestId:string}
interface Step {
  step:string;requestId:string;sourceSha256:string;optionsSha256:string
  runtimeInstanceId:string;finishedRuntimeInstanceId:string
  attemptId:string;startedReceiptSha256:string;outcomeReceiptSha256:string
  predecessorOutcomeSha256:string|null
  result:Record<string,any>
}
interface Workflow extends AuthoredSvgRawOwner {
  schema:'trident-authored-svg-workflow-return-v1'
  caseId:string;family:string;workflowId:string;stimulusSha256:string
  runtimeInstanceId:string;capabilities:Record<string,any>;steps:Step[]
}
export interface RetainedAuthoredSvgWorkflow {
  workflowId:string;runtimeInstanceId:string;capabilities:Record<string,any>
  /** Capture ownership and source order remain valid across distinct CLI
   * processes or recovery; only shared-runtime workflow credit is withheld. */
  sameRuntime:boolean
  steps:{step:string;runtimeInstanceId:string;finishedRuntimeInstanceId:string;result:Record<string,any>;invocation:Readonly<InvocationEvidence>}[]
}

/** The actual public adapter inputs, not the independently changing oracle. */
export function authoredSvgAdapterBinding(engine:unknown,fontSizePath:unknown,cli?:Pick<CommunityArtifact,'args'|'input'|'outputBindings'>){return evidenceDigest({format:'svg',engine,fontSizePath:fontSizePath??null,...(cli?{cli:{args:cli.args??[],input:cli.input??'stdin',outputBindings:cli.outputBindings??null}}:{})})}
const stimulus=(input:AuthoredFidelityCase)=>({id:input.id,family:input.family,source:input.source,options:input.renderOptions??null,prelude:(input.prelude??[]).map(prelude=>({source:prelude.source,options:(prelude as any).renderOptions??null}))})
const requests=(input:AuthoredFidelityCase,workflowId:string):Request[]=>[
  ...(input.prelude??[]).map((prelude,index)=>({step:'prelude-'+index,source:prelude.source,options:(prelude as any).renderOptions??null,requestId:'community-'+workflowId+'-prelude-'+index})),
  {step:'main',source:input.source,options:input.renderOptions??null,requestId:'community-'+workflowId+'-main'},
]
const checkpointIdentity=(owner:AuthoredSvgRawOwner)=>({schema:'trident-community-authored-raw-v1',...owner})
const identity=(owner:AuthoredSvgRawOwner,input:AuthoredFidelityCase,workflowId:string,runtimeInstanceId:string,request:Request,predecessorOutcomeSha256:string|null)=>({project:owner.project,caseId:input.id,sourceSha256:evidenceBytesDigest(request.source),artifactSha256:owner.artifactSha256,bindingSha256:evidenceDigest({adapterBindingSha256:owner.adapterBindingSha256,stimulusSha256:evidenceDigest(stimulus(input)),workflowId,runtimeInstanceId,step:request.step,requestId:request.requestId,options:request.options,predecessorOutcomeSha256}),format:'svg',coordinate:'authored-svg-host-rpc:'+workflowId+':'+request.step})

/** Finite public transport outcomes; generic runtime errors prove no rejection. */
export function classifyAuthoredSvgResult(result:any):'passed'|'failed'|'unsupported'|'unavailable'{
  if(result?.hostTransportError||result?.errorName==='TimeoutError')return'unavailable'
  return result?.kind==='returned'?'passed':result?.kind==='invalid-return'?'failed':/^(?:UnknownDiagramError:|Error: Unsupported diagram|(?:Error: )?Unsupported (?:diagram|Mermaid)|(?:PeleError|Error): No diagram type)/.test(result?.error??'')?'unsupported':/^(?:Error: (?:Parse error on line|Lexical error on line|Parsing failed|Parser rejected source:))/.test(result?.error??'')?'failed':'unavailable'
}

/** Read only: ownership comes from the independently supplied original engine
 * and source inventory, never a status or an artifact named by the witness. */
export function readRetainedAuthoredSvgWorkflow(input:AuthoredFidelityCase,project:string,witness:AuthoredSvgWorkflowEvidence,expected:Omit<AuthoredSvgRawOwner,'project'>,remap:(path:string)=>string):RetainedAuthoredSvgWorkflow {
  if(!witness||witness.schema!=='trident-authored-svg-workflow-evidence-v1'||witness.caseId!==input.id||typeof witness.workflowId!=='string'||typeof witness.directory!=='string')throw Error('Missing owned authored SVG workflow')
  // Check each physical journal/checkpoint path, including nested symlinks;
  // validating the outer directory alone cannot establish archive ownership.
  const ownedCheckpoint=(original:string)=>{
    const directory=remap(original)
    for(const name of ['checkpoint.json','checkpoint.jsonl.gz','checkpoint-units'])if(existsSync(join(directory,name)))remap(join(original,name))
    if(existsSync(join(directory,'checkpoint-units')))for(const name of readdirSync(join(directory,'checkpoint-units')))remap(join(original,'checkpoint-units',name))
    return directory
  }
  const owner={project,...expected},directory=ownedCheckpoint(witness.directory),workflow=readCheckpointValue<Workflow>(directory,'complete:'+input.id,checkpointIdentity(owner))
  if(!workflow||workflow.schema!=='trident-authored-svg-workflow-return-v1'||evidenceDigest(workflow)!==witness.receiptSha256||workflow.workflowId!==witness.workflowId||workflow.caseId!==input.id||workflow.family!==input.family||workflow.project!==project||workflow.artifactSha256!==expected.artifactSha256||workflow.adapterBindingSha256!==expected.adapterBindingSha256||workflow.stimulusSha256!==evidenceDigest(stimulus(input)))throw Error('Incomplete or changed authored SVG workflow/source binding')
  const started=readCheckpointValue<any>(directory,'start:'+input.id,checkpointIdentity(owner)),planned=requests(input,workflow.workflowId)
  if(!started||started.workflowId!==workflow.workflowId||started.stimulusSha256!==workflow.stimulusSha256||evidenceDigest(started.requests)!==evidenceDigest(planned)||started.runtimeInstanceId!==workflow.runtimeInstanceId||!workflow.runtimeInstanceId||!Array.isArray(workflow.steps)||workflow.steps.length!==planned.length)throw Error('Authored SVG workflow has no complete ordered source requests')
  const frames=readCheckpointEntries<InvocationEvidence>(ownedCheckpoint(join(witness.directory,'invocations')),{schema:'trident-invocation-journal-v1'}).map(([,frame])=>admitInvocationEvidence(frame)),ids=new Set<string>()
  const steps=planned.map((request,index)=>{
    const step=workflow.steps[index]!,raw=readCheckpointValue<Step>(directory,'step:'+input.id+':'+request.step,checkpointIdentity(owner))
    const predecessor=index?workflow.steps[index-1]!.outcomeReceiptSha256:null
    if(!step||step.step!==request.step||step.requestId!==request.requestId||evidenceDigest(raw)!==evidenceDigest(step)||step.predecessorOutcomeSha256!==predecessor||step.sourceSha256!==evidenceBytesDigest(request.source)||step.optionsSha256!==evidenceDigest(request.options)||!step.runtimeInstanceId||!step.finishedRuntimeInstanceId||ids.has(step.attemptId))throw Error('Authored SVG workflow steps differ or lack actual runtime identities')
    ids.add(step.attemptId)
    const matching=frames.filter(frame=>frame.attemptId===step.attemptId),start=matching.find(frame=>frame.state==='started'),outcomes=matching.filter(frame=>frame.state!=='started')
    if(!start||matching.length!==2||outcomes.length!==1||evidenceDigest(start.identity)!==evidenceDigest(identity(owner,input,workflow.workflowId,step.runtimeInstanceId,request,predecessor))||evidenceDigest(start)!==step.startedReceiptSha256)throw Error('Authored SVG step lacks its exact durable host-request start')
    const outcome=outcomes[0]!
    if(evidenceDigest(outcome.identity)!==evidenceDigest(start.identity)||outcome.startedReceiptSha256!==step.startedReceiptSha256||evidenceDigest(outcome)!==step.outcomeReceiptSha256)throw Error('Authored SVG step lacks its matching retained outcome')
    const result={...step.result}
    if(outcome.output){
      const bytes=readFileSync(remap(outcome.output.path))
      if(bytes.length!==outcome.output.bytes||evidenceBytesDigest(bytes)!==outcome.output.sha256||outcome.state!=='returned')throw Error('Authored SVG step output bytes changed')
      result.svg=bytes.toString('utf8')
      if(!Buffer.from(result.svg).equals(bytes))throw Error('Authored SVG step is not an exact UTF8 string')
    }else{
      if(result.kind==='returned')throw Error('Authored SVG return has no actual retained SVG bytes')
      const state=result.hostTransportError||result.errorName==='TimeoutError'||result.kind==='unavailable'?'interrupted':'public-error'
      if(outcome.state!==state||outcome.detail!==String(result.error??'No SVG string in the actual host response'))throw Error('Authored SVG error differs from its retained host response')
    }
    return{step:request.step,runtimeInstanceId:step.runtimeInstanceId,finishedRuntimeInstanceId:step.finishedRuntimeInstanceId,result,invocation:outcome}
  })
  const ownFrames=frames.filter(frame=>frame.identity.project===project&&frame.identity.caseId===input.id&&frame.identity.coordinate?.startsWith('authored-svg-host-rpc:'+workflow.workflowId+':'))
  if(ownFrames.length!==steps.length*2)throw Error('Authored SVG workflow has hidden or duplicate public requests')
  return{workflowId:workflow.workflowId,runtimeInstanceId:workflow.runtimeInstanceId,capabilities:workflow.capabilities,sameRuntime:steps.every(step=>step.runtimeInstanceId===workflow.runtimeInstanceId&&step.finishedRuntimeInstanceId===workflow.runtimeInstanceId),steps}
}

/** Thin raw-first use of the existing journal/checkpoint. A partial workflow is
 * retained, never completed by replaying state into a fresh runtime. */
export function createAuthoredSvgRawCapture(directory:string,owner:AuthoredSvgRawOwner){
  const checkpoint=new CollectionCheckpoint(directory,checkpointIdentity(owner)),journal=new InvocationJournal(join(directory,'invocations'))
  const witness=(input:AuthoredFidelityCase):AuthoredSvgWorkflowEvidence|undefined=>{const raw=checkpoint.get<Workflow>('complete:'+input.id);return raw?{schema:'trident-authored-svg-workflow-evidence-v1',directory,caseId:input.id,workflowId:raw.workflowId,receiptSha256:evidenceDigest(raw)}:undefined}
  const completed=(input:AuthoredFidelityCase)=>!!witness(input)
  const partial=(input:AuthoredFidelityCase)=>!completed(input)&&checkpoint.has('start:'+input.id)
  return{completed,partial,witness,async capture(input:AuthoredFidelityCase,invoke:(request:Request)=>Promise<any>,runtimeInstanceId:()=>string,capabilities:()=>Record<string,any>,prepare?:(request:Request)=>Promise<void>){
    const previous=witness(input)
    if(previous)return{witness:previous,...readRetainedAuthoredSvgWorkflow(input,owner.project,previous,owner,path=>path)}
    if(checkpoint.has('start:'+input.id))throw Error('Partial authored workflow retained; a fresh explicit workflow/context is required, not an implicit retry')
    const workflowId=randomUUID(),planned=requests(input,workflowId),stimulusSha256=evidenceDigest(stimulus(input))
    await prepare?.(planned[0]!)
    const runtime=runtimeInstanceId()
    if(!runtime)throw Error('Actual initialized SVG runtime identity is required')
    checkpoint.record('start:'+input.id,{...owner,caseId:input.id,workflowId,runtimeInstanceId:runtime,stimulusSha256,requests:planned,scope:'Host SVG request boundary after actual initialization; no renderer-internal API entry or timing is inferred'})
    const steps:Step[]=[]
    for(const [index,request] of planned.entries()){
      if(index)await prepare?.(request)
      const before=runtimeInstanceId(),predecessor=steps.at(-1)?.outcomeReceiptSha256??null,attempt=journal.start(identity(owner,input,workflowId,before,request,predecessor))
      let value:any
      try{value=await invoke(request)}catch(error:any){value={kind:'exception',error:String(error),errorName:error?.name??'Error',hostTransportError:true}}
      const {svg,...result}=value??{kind:'unavailable',error:'Host returned no transport receipt'}
      const outcome=typeof svg==='string'?journal.returned(attempt,svg,null):journal.failed(attempt,result.error??'No SVG string in the actual host response',null,result.hostTransportError||result.errorName==='TimeoutError'||result.kind==='unavailable'?'interrupted':'public-error')
      const step:Step={step:request.step,requestId:request.requestId,sourceSha256:evidenceBytesDigest(request.source),optionsSha256:evidenceDigest(request.options),runtimeInstanceId:before,finishedRuntimeInstanceId:runtimeInstanceId(),attemptId:attempt.attemptId,startedReceiptSha256:evidenceDigest(attempt),outcomeReceiptSha256:evidenceDigest(outcome),predecessorOutcomeSha256:predecessor,result}
      checkpoint.record('step:'+input.id+':'+request.step,step);steps.push(step)
    }
    const workflow:Workflow={schema:'trident-authored-svg-workflow-return-v1',...owner,caseId:input.id,family:input.family,workflowId,stimulusSha256,runtimeInstanceId:runtime,capabilities:capabilities(),steps}
    checkpoint.record('complete:'+input.id,workflow)
    const retained=witness(input)!
    return{witness:retained,...readRetainedAuthoredSvgWorkflow(input,owner.project,retained,owner,path=>path)}
  }}
}
