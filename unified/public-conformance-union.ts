/** Read-only union of disjoint, already regraded native callback scopes. No test,
 * parser, renderer, binding or reference control is re-executed. */
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync,existsSync} from 'node:fs'
import {join,resolve} from 'node:path'
import manifest from '../corpus/mermaid-public-tests-expanded.json' with {type:'json'}
import {readPublicTestEvidence} from './public-test-reporting.ts'
import type {PublicTestDeclaration} from './public-conformance-inventory.ts'

type Part=ReturnType<typeof readPublicTestEvidence>
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b)
const hash=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex')
export function joinReviewedPublicScopeRows(cases:readonly PublicTestDeclaration[],parts:readonly Pick<Part,'cases'|'targets'|'qualification'>[]){
  if(!parts.length||parts.some(part=>!part.qualification.qualified))throw Error('Every original and public reference scope must qualify before union')
  const seen=new Set<string>()
  for(const part of parts)for(const input of part.cases){const expected=cases.find(row=>row.id===input.id);if(!expected||!same(expected,input)||seen.has(input.id))throw Error('Public scope union duplicates or changes a source callback');seen.add(input.id)}
  if(seen.size!==cases.length)throw Error('Public scope union omits planned original callbacks')
  const projects=parts[0]!.targets.map(target=>target.project)
  if(!projects.length||new Set(projects).size!==projects.length||parts.some(part=>!same(part.targets.map(target=>target.project),projects)))throw Error('Public scope union changes the measured cohort')
  return projects.map(project=>{
    const targets=parts.map(part=>part.targets.find(target=>target.project===project)!),version=targets[0]!.version
    if(targets.some(target=>target.version!==version))throw Error('Public scope union changes the measured version')
    const rows=cases.map(input=>{const own=targets.flatMap(target=>target.rows.filter(row=>row.caseId===input.id));if(own.length!==1||own[0]!.callbackSha256!==input.callbackSha256)throw Error('Public scope union omits or changes native callback evidence');return own[0]!})
    const counts=Object.fromEntries(['passed','failed','unsupported','blocked'].map(status=>[status,rows.filter(row=>row.status===status).length]))
    return{project,version,planned:cases.length,counts,rows}
  })
}
export function joinPublicConformanceScopes(directories:readonly string[]){
  const parts=directories.map(directory=>readPublicTestEvidence(resolve(directory))),first=parts[0]
  if(!first)throw Error('Public source scopes are required')
  for(const part of parts.slice(1)){
    for(const key of ['protocol','sourceCommit','sourceConfigSha256','originalJsdomHelperSha256','implementationSha256','detectionSha256','runnerVersion','node','runtimeQualification','rawCapture','publicModuleResolution','targets'])if(!same(first.context[key],part.context[key]))throw Error('Public source scope host, artifact or binding changed: '+key)
  }
  const targets=joinReviewedPublicScopeRows(manifest.eligible as PublicTestDeclaration[],parts)
  return{schema:'trident-original-public-scope-union-v1',sourceCommit:manifest.sourceCommit,scope:manifest.scope,counts:manifest.counts,qualification:{qualified:true,cases:manifest.eligible.length,method:'Disjoint source-identical callbacks; original and installed public reference controls separately pass every callback under identical source/host/artifact/binding identities'},wholeSuiteConformanceQualified:false,measuredAt:parts.map(part=>part.saved.result.finishedAt).sort().at(-1),assembledAt:new Date().toISOString(),assessmentProducer:{path:'unified/public-conformance-union.ts',sha256:hash(readFileSync(import.meta.filename))},timing:'No performance measurements or new public API invocations; each raw callback outcome keeps its parent measurement',parents:directories.map((directory,index)=>({directory:resolve(directory),callbacks:parts[index]!.cases.length,contextSha256:hash(readFileSync(join(directory,'context.json'))),inventorySha256:hash(readFileSync(join(directory,'inventory.json'))),reportSha256:hash(readFileSync(join(directory,'public-conformance-report.json')))})),targets}
}
if(import.meta.main){
  const args=process.argv.slice(2),outIndex=args.indexOf('--out'),out=outIndex<0?undefined:args[outIndex+1],directories=outIndex<0?args:args.slice(0,outIndex)
  if(!directories.length||outIndex>=0&&!out)throw Error('Usage: bun unified/public-conformance-union.ts RETAINED_SCOPE... [--out FRESH_JSON]')
  const union=joinPublicConformanceScopes(directories)
  if(out){if(existsSync(out))throw Error('Fresh output required');writeFileSync(out,JSON.stringify(union,null,2)+'\n')}
  console.log(JSON.stringify({qualified:union.qualification.qualified,callbacks:union.qualification.cases,targets:union.targets.map(({project,counts})=>({project,counts})),out:out??null}))
}
