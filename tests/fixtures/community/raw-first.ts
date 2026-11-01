import {mock} from 'bun:test'
import {appendFileSync,existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs'
import {join,resolve} from 'node:path'
import {createHash} from 'node:crypto'
import {createRequire} from 'node:module'

// This isolated child runs the actual collector with a synthetic host/page.
// It loads no project engine or browser and publishes no benchmark evidence.
const tree=resolve(import.meta.dir,'../../..'),fixture=process.argv[2]!,mode=process.argv[3]!,project='fixture/raw-first'
mkdirSync(fixture,{recursive:true})
const entry=join(fixture,'entry.js'),manifest=join(fixture,'package.json'),code='// Synthetic unused engine bytes, not a project renderer.\n'
if(!existsSync(entry))writeFileSync(entry,code)
if(!existsSync(manifest))writeFileSync(manifest,JSON.stringify({name:'synthetic-raw-first',version:'1.0.0'}))
const sha=(value:string)=>createHash('sha256').update(value).digest('hex'),counter=join(fixture,'public-calls'),grades=join(fixture,'grading-calls')
const testCase={id:'fixture:raw-first',family:'flowchart',required:true,source:'flowchart LR\nMain[Main]',features:[],provenance:'Synthetic raw-first collector regression; zero project calls',expected:{labels:['Main']},prelude:[{source:'flowchart LR\nBefore[Before]',accept:true}]}
mock.module(tree+'/ci-policy.ts',()=>({assertBenchmarkExecutionAllowed:()=>{}}))
mock.module(tree+'/fidelity/cases.ts',()=>({expandedFidelityCases:()=>[testCase]}))
mock.module(tree+'/unified/baseline-measurement-context.ts',()=>({baselineMeasurementContext:()=>({source:'synthetic raw-first producer context'})}))
const qualification=await import(tree+'/unified/qualification.ts')
mock.module(tree+'/unified/qualification.ts',()=>({...qualification,qualifyOutput:()=>{
  appendFileSync(grades,'grade\n')
  if(mode==='crash')process.exit(73)
  throw Error('Synthetic grading failure after raw capture')
}}))
const page=()=>{
  let closed=false
  return{setDefaultTimeout(){},async goto(){},async addScriptTag(){},isClosed(){return closed},async close(){closed=true},async evaluate(_fn:unknown,input:any){
    if(input?.type==='initialize-global'){appendFileSync(counter,'initialize\n');return{fontOptions:true}}
    if(input?.type==='configure'){appendFileSync(counter,'configure\n');return{configured:true}}
    if(input?.type==='render'){
      if(input.options!==undefined)throw Error('Absent actual API options must remain undefined')
      appendFileSync(counter,'render\n')
      const label=input.source.includes('Before')?'Before':'Main'
      return{kind:'returned',svg:'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><text x="5" y="25">'+label+'</text></svg>'}
    }
    return undefined
  }}
}
const fakeBrowser={async newContext(){return{async newPage(){return page()},async route(){},async close(){}}},async close(){}}
// The collector intentionally uses createRequire for its owning harness. Patch
// that exact isolated child's CJS object rather than an unrelated ESM mock.
const require=createRequire(join(tree,'package.json')),playwright=require('playwright')
playwright.chromium.launch=async()=>fakeBrowser
const node={id:project,outputs:['svg'],benchmark:{adapter:'declared',outputs:['svg'],api:{svg:{fontSizePath:['fontSize']}}}}
const peer={node,artifact:{kind:'node',root:fixture,module:entry,version:'1.0.0'},browserStatus:'prepared',browser:{kind:'function',global:'SyntheticUnusedEngine',root:fixture,entry:'entry.js',version:'1.0.0',artifactSha256:sha(code),files:[{path:entry,sha256:sha(code)}]}}
const prepared=join(fixture,'prepared.json'),catalog=join(fixture,'catalog.json')
writeFileSync(prepared,JSON.stringify([peer]));writeFileSync(catalog,JSON.stringify({nodes:[node]}))
const{runCommunityFidelitySuite}=await import(tree+'/fidelity/community.ts')
const result=await runCommunityFidelitySuite({root:tree,harnessRoot:tree,out:join(fixture,'out'),profile:'full',rounds:1,executable:process.execPath,communityBrowserPreparedFile:prepared,communityCatalogFile:catalog,communityProjects:[project],fidelityCaseIds:[testCase.id],fidelityDiagnostic:true,communityFidelityPng:'none'})
console.log(JSON.stringify({status:result.status,publicCalls:readFileSync(counter,'utf8').trim().split('\n'),graderCalls:readFileSync(grades,'utf8').trim().split('\n').length,actualProjectCalls:0}))
