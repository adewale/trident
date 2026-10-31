import {expect,test} from 'bun:test'
import {readFileSync,writeFileSync,mkdirSync,cpSync} from 'node:fs'
import {dirname,join} from 'node:path'
import {createHash} from 'node:crypto'
import {gunzipSync} from 'node:zlib'
import {readPublicTestEvidence,publicTestTables} from '../unified/public-test-reporting.ts'
import {writePublicScopeUnionBundle} from '../unified/public-conformance-union.ts'
import {readCampaign,campaignResults} from '../unified/campaign-publication.ts'
import {rankedRows,importCampaign} from '../unified/results-snapshot.ts'
import {useTempDirs} from './helpers/temp-dir.ts'
const temp=useTempDirs('public-union-'),hash=(text:Uint8Array|string)=>createHash('sha256').update(text).digest('hex')
function retained(){
  const root=temp.dir(),archive=JSON.parse(gunzipSync(readFileSync(new URL('./fixtures/conformance/public-tests-expanded154-evidence.json.gz',import.meta.url))).toString())
  if(archive.schema!=='trident-retained-public-scope-union-fixture-v1')throw Error('Wrong native evidence fixture')
  for(const file of archive.files){const bytes=Buffer.from(file.text);if(hash(bytes)!==file.sha256)throw Error('Retained native source evidence bytes changed');const path=join(root,file.path);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,bytes)}
  return root
}
function change(root:string,path:string,mutate:(value:any)=>void){const file=join(root,path),value=JSON.parse(readFileSync(file,'utf8'));mutate(value);writeFileSync(file,JSON.stringify(value))}
test('actual154 native callbacks reach normal campaign/table readers and stack ranks without new invocations',()=>{
  const root=retained(),evidence=readPublicTestEvidence(root),campaign=readCampaign(root)
  expect(evidence.qualification).toMatchObject({qualified:true,cases:154})
  expect(evidence.context.sampling).toEqual({mode:'retained-disjoint-scopes',newPublicInvocations:0})
  expect(evidence.scope).toBe('102 parse; 32 detection; 19 accessibility render; 1 generic SVG render (24 inner sources)')
  const[table]=publicTestTables(root,{url:'https://example.org/retained/public-conformance-report.json',sha256:hash(readFileSync(join(root,'public-conformance-report.json')))},campaign.updatedAt)
  expect(rankedRows(table!,id=>id).map(row=>[row.project,row.rank,row.values.slice(1,6)])).toEqual([['mermaid-js/mermaid',1,[154,0,0,0,154]],['adewale/agentic-mermaid',2,[59,27,63,5,154]]])
  expect(table!.caption).toContain('every parent native receipt')
  expect(table!.caption).toContain('37 eligible declarations')
  expect(campaign.projects).toEqual(['mermaid-js/mermaid','adewale/agentic-mermaid'])
  expect(campaignResults(campaign.results[0]!).flatMap(result=>result.observations)).toEqual(evidence.saved.result.observations)
  expect(evidence.saved.result.observations).toHaveLength(308)
  const snapshot=importCampaign({schema:'trident-results-snapshot-v1',tables:[],attempts:[]},root,'https://example.org/retained',{nodes:campaign.projects.map(id=>({id,roles:['renderer'],outputs:['svg']})),edges:[]})
  expect(snapshot.tables).toHaveLength(1)
  expect(snapshot.tables[0]!.rows[0]!.values.slice(1,6)).toEqual([154,0,0,0,154])
  expect(snapshot.overviewRanking).toBeUndefined()
},30_000)
test('normal union admission regrades owning raw callbacks and refuses changed parent or aggregate claims',()=>{
  for(const mutation of [
    (root:string)=>change(root,'public-conformance-report.json',saved=>saved.targets[0].counts.passed++),
    (root:string)=>change(root,'scopes/1/context.json',context=>context.implementationSha256='0'.repeat(64)),
    (root:string)=>change(root,'scopes/1/original-control/vitest.json',native=>native.testResults[0].assertionResults[0].status='failed'),
    (root:string)=>change(root,'context.json',context=>context.publicScopeUnion.parents[1].directory=context.publicScopeUnion.parents[0].directory),
    (root:string)=>change(root,'context.json',context=>context.publicScopeUnion.parents[0].directory='../outside'),
    (root:string)=>change(root,'inventory.json',inventory=>inventory.callbacks.pop()),
    (root:string)=>change(root,'context.json',context=>context.targets[0].version='invented'),
  ]){const root=retained();mutation(root);expect(()=>readPublicTestEvidence(root)).toThrow()}
},30_000)
test('portable bundle writer preserves parent measured observations and validates copies after relocation',()=>{
  const old=retained(),output=join(temp.dir(),'assembled'),built=writePublicScopeUnionBundle([join(old,'scopes/0'),join(old,'scopes/1')],output)
  expect(built.saved.result.observations).toEqual(readPublicTestEvidence(old).saved.result.observations)
  expect(built.saved.result.startedAt).toBe(readPublicTestEvidence(old).saved.result.startedAt)
  const moved=join(temp.dir(),'moved');cpSync(output,moved,{recursive:true})
  expect(readPublicTestEvidence(moved).targets).toEqual(built.targets)
  expect(()=>writePublicScopeUnionBundle([join(old,'scopes/0'),join(old,'scopes/1')],output)).toThrow('Fresh')
},30_000)
