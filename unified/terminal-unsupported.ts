import registry from '../corpus/terminal-retained-unsupported.json' with {type:'json'}
import {evidenceBytesDigest,evidenceDigest} from '../portable/evidence-contract.ts'
import type {TerminalProjectCase} from '../fidelity/terminal-corpus.ts'
const registrySha256='fbb07512cddfd1e93d9cd92ac0653198ac1d36b73f2493bff9c2cde17de6bd0a'
/** Finite admission of original source-bound public errors. This is neither a
 * family capability declaration nor typed invalid-input grammar evidence. The
 * old collector had no durable per-call journal; that limitation is retained. */
export function terminalRetainedUnsupported(record:any,input:TerminalProjectCase,owner:any,row:any){
 if(evidenceDigest(registry)!==registrySha256)throw Error('Retained terminal unsupported evidence changed')
 if(input.intent==='invalid'||evidenceBytesDigest(input.source)!==input.sourceSha256||row?.witness||row?.project!==registry.owner.project||row.caseId!==input.id||row.runtimeExecuted!==true||row.publicStatus!=='failed'||evidenceDigest(owner)!==evidenceDigest(registry.owner))return
 const match=/^time="[^"\r\n]+" level=fatal msg=("(?:[^"\\\r\n]|\\.)*")\r?\n?$/.exec(row.detail??'');if(!match)return
 let diagnostic:string;try{diagnostic=JSON.parse(match[1]!)}catch{return}
 if(!/^failed to parse graph diagram: unsupported graph type '[^\r\n]+'. Supported types: 'graph' or 'flowchart' with an optional direction \(TD, TB, BT, LR, RL\)$/.test(diagnostic))return
 const observations=(record.transportObservations??[]).filter((observation:any)=>observation.caseId===input.id&&observation.metrics?.implementation===registry.owner.project)
 if(observations.length!==1)return
 const entry=registry.original.entries.find(entry=>entry.row.caseId===input.id),projection={project:row.project,caseId:row.caseId,runtimeExecuted:row.runtimeExecuted,publicStatus:row.publicStatus,detail:row.detail}
 let owningRawSha256:string,limitation:string
 if(entry){
  const copied=row.originalRawSha256===registry.original.rawSha256&&row.originalProducerSource===registry.original.producer&&(record.collections??[]).some((collection:any)=>collection.rawSha256===registry.original.rawSha256&&collection.source===registry.original.producer),original=record.source===registry.original.producer&&evidenceDigest(record)===registry.original.semanticSha256
  if(!copied&&!original||entry.sourceSha256!==input.sourceSha256||evidenceDigest(projection)!==evidenceDigest(entry.row)||evidenceDigest(observations[0])!==evidenceDigest(entry.transport))return
  owningRawSha256=registry.original.rawSha256;limitation=registry.original.transportLimit
 }else{
  const admitted=registry.adaptation
  if(input.id!==admitted.row.caseId||input.sourceSha256!==admitted.sourceSha256||row.collectionId!=='authored-adaptation'||evidenceDigest(row)!==evidenceDigest(admitted.row)||evidenceDigest(observations[0])!==evidenceDigest(admitted.transport)||admitted.row.invocation.identity.artifactSha256!==owner.artifact.sha256||admitted.row.invocation.streams.stdout.bytes!==0||evidenceBytesDigest(row.detail)!==admitted.row.invocation.streams.stderr.sha256)return
  owningRawSha256=admitted.combinedOwnerSha256;limitation='Actual matched started/public-error journal pair and complete stderr/empty stdout were verified before finite replay admission; no new call or frame was made.'
 }
 return{status:'unsupported' as const,reason:'The frozen public CLI explicitly rejects this exact retained input as an unsupported graph type; this is an observed input-specific outcome, not a drawing fault or invalid-source grammar credit',unsupportedEvidence:{sourceSha256:input.sourceSha256,artifactSha256:owner.artifact.sha256,owningRawSha256,registrySha256,diagnostic,limitation}}
}
