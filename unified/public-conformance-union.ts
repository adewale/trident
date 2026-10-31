/** Read-only union of disjoint, already regraded native callback scopes. No test,
 * parser, renderer, binding or reference control is re-executed. */
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync,existsSync,mkdirSync,cpSync,realpathSync} from 'node:fs'
import {join,resolve,relative,isAbsolute} from 'node:path'
import manifest from '../corpus/mermaid-public-tests-expanded.json' with {type:'json'}
import {readPublicTestEvidence,scopeName,type PublicTestEvidence,type PublicTestTarget} from './public-test-reporting.ts'
import type {PublicTestDeclaration} from './public-conformance-inventory.ts'

type Part=PublicTestEvidence
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b)
const hash=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex')
const hostKeys=['protocol','sourceCommit','sourceConfigSha256','originalJsdomHelperSha256','implementationSha256','detectionSha256','runnerVersion','node','runtimeQualification','rawCapture','publicModuleResolution','targets']
function validateHost(parts:readonly Part[]){
  const first=parts[0];if(!first)throw Error('Public source scopes are required')
  for(const part of parts.slice(1))for(const key of hostKeys)if(!same(first.context[key],part.context[key]))throw Error('Public source scope host, artifact or binding changed: '+key)
  return first
}
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
    const counts=Object.fromEntries(['passed','failed','unsupported','blocked'].map(status=>[status,rows.filter(row=>row.status===status).length])) as PublicTestTarget['counts']
    return{project,version,planned:cases.length,counts,rows}
  })
}
export function joinPublicConformanceScopes(directories:readonly string[]){
  const parts=directories.map(directory=>readPublicTestEvidence(resolve(directory)))
  validateHost(parts)
  const targets=joinReviewedPublicScopeRows(manifest.eligible as PublicTestDeclaration[],parts)
  return{schema:'trident-original-public-scope-union-v1',sourceCommit:manifest.sourceCommit,scope:manifest.scope,counts:manifest.counts,qualification:{qualified:true,cases:manifest.eligible.length,method:'Disjoint source-identical callbacks; original and installed public reference controls separately pass every callback under identical source/host/artifact/binding identities'},wholeSuiteConformanceQualified:false,measuredAt:parts.map(part=>part.saved.result.finishedAt).sort().at(-1),assembledAt:new Date().toISOString(),assessmentProducer:{path:'unified/public-conformance-union.ts',sha256:hash(readFileSync(import.meta.filename))},timing:'No performance measurements or new public API invocations; each raw callback outcome keeps its parent measurement',parents:directories.map((directory,index)=>({directory:resolve(directory),callbacks:parts[index]!.cases.length,contextSha256:hash(readFileSync(join(directory,'context.json'))),inventorySha256:hash(readFileSync(join(directory,'inventory.json'))),reportSha256:hash(readFileSync(join(directory,'public-conformance-report.json')))})),targets}
}

const bundleSchema='trident-retained-public-scope-bundle-v1'
const parentFiles=['context.json','inventory.json','public-conformance-report.json'] as const
function aggregateReport(parts:readonly Part[]){
  const targets=joinReviewedPublicScopeRows(manifest.eligible as PublicTestDeclaration[],parts)
  const observations=targets.flatMap(target=>(manifest.eligible as PublicTestDeclaration[]).map(input=>{
    const rows=parts.flatMap(part=>part.saved.result.observations.filter((row:any)=>row.metrics?.project===target.project&&row.caseId===input.id))
    if(rows.length!==1)throw Error('Public scope union observations omit or duplicate native evidence')
    return rows[0]
  }))
  const qualification={qualified:true,cases:manifest.eligible.length,differences:[],scope:manifest.scope}
  return{inventory:manifest.counts,qualification,targets,wholeSuiteConformanceQualified:false,result:{id:'public-conformance',status:targets.some(target=>target.counts.failed||target.counts.blocked||target.counts.unsupported)?'failed':'passed',startedAt:parts.map(part=>part.saved.result.startedAt).sort()[0],finishedAt:parts.map(part=>part.saved.result.finishedAt).sort().at(-1),observations,gaps:[manifest.scope,manifest.wholeSuiteBlocker,'Disjoint retained scopes were joined without repeating callbacks; every owning native receipt and invocation is regraded at read time.'],artifacts:['inventory.json','context.json','reference-qualification.json','public-conformance-report.json','scopes/']}}
}

/** Normal portable evidence directory. Child copies own every raw receipt;
 * absolute historical locations are diagnostic and never followed by readers. */
export function writePublicScopeUnionBundle(directories:readonly string[],output:string){
  const root=resolve(output)
  if(existsSync(root))throw Error('Fresh output required')
  const sources=directories.map(directory=>realpathSync(directory)),parts=sources.map(readPublicTestEvidence),first=validateHost(parts)
  if(parts.some(part=>part.context.publicScopeUnion))throw Error('Union bundles cannot recursively own union bundles')
  const saved=aggregateReport(parts)
  for(const source of sources){const own=relative(source,root);if(!own||(!isAbsolute(own)&&own!=='..'&&!own.startsWith('../')))throw Error('Union output must be outside its parent evidence')}
  mkdirSync(root,{recursive:true})
  const parents=sources.map((source,index)=>{
    const directory='scopes/'+index;cpSync(source,join(root,directory),{recursive:true,dereference:true})
    return{directory,callbacks:parts[index]!.cases.length,sha256:Object.fromEntries(parentFiles.map(name=>[name,hash(readFileSync(join(root,directory,name)))]))}
  })
  const context={...first.context,scopeSelection:'expanded-public-union',scope:manifest.scope,sampling:{mode:'retained-disjoint-scopes',newPublicInvocations:0},publicScopeUnion:{schema:bundleSchema,parents,assembledAt:new Date().toISOString(),assessmentProducer:{path:'unified/public-conformance-union.ts',sha256:hash(readFileSync(import.meta.filename))}}}
  const firstInventory=JSON.parse(readFileSync(join(sources[0]!,'inventory.json'),'utf8'))
  const inventory={...firstInventory,scopeSelection:'expanded-public-union',scope:manifest.scope,callbacks:manifest.eligible,counts:manifest.counts,scopeReview:manifest.scopeReview,scopeCounts:manifest.scopeCounts,wholeSuiteConformanceQualified:false,wholeSuiteBlocker:manifest.wholeSuiteBlocker}
  for(const[name,value]of Object.entries({'context.json':context,'inventory.json':inventory,'public-conformance-report.json':saved,'reference-qualification.json':saved.qualification,'result.json':saved.result}))writeFileSync(join(root,name),JSON.stringify(value,null,2)+'\n')
  return readPublicTestEvidence(root)
}

export function readPublicScopeUnionBundle(root:string,input:{context:any;inventory:any;saved:any},readScope:(directory:string)=>Part):Part{
  const{context,inventory,saved}=input,union=context.publicScopeUnion
  if(union?.schema!==bundleSchema||context.scopeSelection!=='expanded-public-union'||!Array.isArray(union.parents)||union.parents.length<2)throw Error('Invalid public scope union provenance')
  const seen=new Set<string>(),parts:Part[]=union.parents.map((parent:any)=>{
    if(typeof parent.directory!=='string'||isAbsolute(parent.directory)||parent.directory.includes('..'))throw Error('Public scope parent is outside its owning directory')
    const directory=realpathSync(join(root,parent.directory)),own=relative(root,directory)
    if(!own||isAbsolute(own)||own==='..'||own.startsWith('../')||seen.has(directory))throw Error('Public scope parent is outside its owning directory or duplicated')
    seen.add(directory)
    for(const name of parentFiles){const file=realpathSync(join(directory,name)),within=relative(directory,file);if(isAbsolute(within)||within==='..'||within.startsWith('../')||hash(readFileSync(file))!==parent.sha256?.[name])throw Error('Public scope parent receipt hash changed: '+name)}
    // Refuse a cycle/nested assembly before recursively opening a scope.
    if(JSON.parse(readFileSync(join(directory,'context.json'),'utf8')).publicScopeUnion)throw Error('Nested public scope union parents are not admitted')
    const part=readScope(directory)
    if(part.cases.length!==parent.callbacks)throw Error('Public scope parent callback census changed')
    return part
  })
  const first=validateHost(parts)
  for(const key of [...hostKeys,'producers'])if(!same(context[key],first.context[key]))throw Error('Public scope union changed its validated parent identity: '+key)
  if(!same(inventory.callbacks,manifest.eligible)||!same(inventory.counts,manifest.counts)||!same(inventory.files,manifest.censusFiles)||inventory.protocol!==manifest.protocol||inventory.sourceCommit!==manifest.sourceCommit)throw Error('Public scope union changed the frozen154 callback source/census')
  const expected=aggregateReport(parts)
  if(!same(saved,expected))throw Error('Public scope union report differs from its regraded native parents')
  return{saved,context,manifest:manifest as Part['manifest'],cases:manifest.eligible as PublicTestDeclaration[],rawCapture:first.rawCapture,qualification:expected.qualification,targets:expected.targets,scope:scopeName(manifest.eligible as PublicTestDeclaration[])}
}
if(import.meta.main){
  const args=process.argv.slice(2)
  if(args.includes('--help')){console.log('Usage: bun commands.ts mermaid:public-tests:union RETAINED_SCOPE... [--out FRESH_JSON | --bundle FRESH_DIRECTORY]\nRead-only assembly; normal results:campaign/results:snapshot validate every retained parent.');process.exit(0)}
  const outIndex=args.findIndex(arg=>arg==='--out'||arg==='--bundle'),out=outIndex<0?undefined:args[outIndex+1],directories=outIndex<0?args:args.slice(0,outIndex)
  if(!directories.length||outIndex>=0&&(!out||args.length!==outIndex+2))throw Error('Usage: bun unified/public-conformance-union.ts RETAINED_SCOPE... [--out FRESH_JSON | --bundle FRESH_DIRECTORY]')
  if(args[outIndex]==='--bundle'){const evidence=writePublicScopeUnionBundle(directories,out!);console.log(JSON.stringify({qualified:evidence.qualification.qualified,callbacks:evidence.cases.length,targets:evidence.targets.map(({project,counts})=>({project,counts})),out}));process.exit(0)}
  const union=joinPublicConformanceScopes(directories)
  if(out){if(existsSync(out))throw Error('Fresh output required');writeFileSync(out,JSON.stringify(union,null,2)+'\n')}
  console.log(JSON.stringify({qualified:union.qualification.qualified,callbacks:union.qualification.cases,targets:union.targets.map(({project,counts})=>({project,counts})),out:out??null}))
}
