import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { runMermaidFidelitySuite } from '/workspace/trident-qualification/unified/fidelity-suite.ts'
import { verifyHarnessModelRows, harnessVerificationPlan } from '/workspace/trident-qualification/unified/harness-verification.ts'
import { protocolIdentity } from '/workspace/trident-qualification/unified/protocol-identity.ts'
import { evidenceBytesDigest } from '/workspace/trident-qualification/portable/evidence-contract.ts'
const root='/workspace/trident-qualification', parent='/workspace/trident-six-project-qualification/run-2', out='/workspace/trident-six-project-qualification/model-path-repair'
const primary=JSON.parse(readFileSync('/workspace/trident-six-project-qualification/seed-v2/community-prepared.json','utf8'))
const original=JSON.parse(readFileSync(join(parent,'result.json'),'utf8')), jobs=harnessVerificationPlan().jobs.filter(job=>job.transport==='model'), producers=protocolIdentity(root,['unified/harness-verification.ts','unified/fidelity-suite.ts'])
mkdirSync(out)
const results:any[]=[],collectionDeadline=Date.now()+5*60_000
for(const job of jobs){
 const directory=join(out,job.id),peer=primary.find((peer:any)=>peer.node.id===job.project);mkdirSync(directory)
 const attempt={job,parentResultSha256:evidenceBytesDigest(readFileSync(join(parent,job.id,'result.json'))),producers,startedAt:new Date().toISOString(),reason:'Original model worker failed its Node24 dependency import before invoking the project. Repair only those two paths; preserve all56 original output calls.'};writeFileSync(join(directory,'attempt.json'),JSON.stringify(attempt,null,2)+'\n')
 const result=await runMermaidFidelitySuite({root,harnessRoot:root,out:directory,rounds:1,profile:'smoke',communityCoverageOnce:true,communityProjects:[job.project],packageRoot:peer.artifact.root,fidelityCaseIds:['meaning:family:flowchart'],collectionDeadline,executable:'/usr/bin/chromium'})
 const verified=verifyHarnessModelRows(result.observations,job.project);results.push({job:job.id,project:job.project,execution:verified?'verified':'blocked',observations:result.observations.length,producers,result})
 writeFileSync(join(directory,'result.json'),JSON.stringify(results.at(-1),null,2)+'\n')
}
const merged=original.results.map((row:any)=>{const repair=results.find(item=>item.job===row.job);return repair?{...row,execution:repair.execution,phase:'model-path-repair',originalError:row.error,error:undefined}: {...row,phase:'run-2'}})
writeFileSync(join(out,'result.json'),JSON.stringify({schema:'trident-harness-verification-repair-v1',originalResultSha256:evidenceBytesDigest(readFileSync(join(parent,'result.json'))),originalPhase:'run-2',repairPhase:'model-path-repair',qualification:merged.every((row:any)=>row.execution==='verified')?'execution-paths-verified':'blocked',results:merged,scope:'Two explicit execution phases,56 original output calls and two repaired model workflows. No corpus accuracy or performance qualification.'},null,2)+'\n')
console.log(JSON.stringify(merged.map((row:any)=>({job:row.job,execution:row.execution,phase:row.phase}))))
if(merged.some((row:any)=>row.execution!=='verified'))process.exitCode=2
