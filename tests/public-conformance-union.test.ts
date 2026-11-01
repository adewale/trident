import {expect,test} from 'bun:test'
import manifest from '../corpus/mermaid-public-tests-expanded.json' with {type:'json'}
import {joinReviewedPublicScopeRows} from '../unified/public-conformance-union.ts'
import type {PublicTestDeclaration} from '../unified/public-conformance-inventory.ts'
const cases=manifest.eligible.slice(0,2) as PublicTestDeclaration[]
const part=(input:PublicTestDeclaration,status='passed')=>({cases:[input],qualification:{qualified:true,cases:1,differences:[],scope:'Synthetic evidence assembly control; no API invocation or correctness claim'},targets:[{project:'fixture/public-api',version:'1',planned:1,counts:{passed:status==='passed'?1:0,failed:status==='failed'?1:0,unsupported:0,blocked:0},rows:[{caseId:input.id,name:input.fullName,path:input.path,line:input.line,callbackSha256:input.callbackSha256,status:status as 'passed'|'failed',reason:'Synthetic assembly control',publicCalls:1,nativeStatus:status}]}]})
test('scope union preserves disjoint raw callback outcomes and refuses omissions, duplicates, changed contracts or cohorts',()=>{
  const a=part(cases[0]!),b=part(cases[1]!,'failed')
  expect(joinReviewedPublicScopeRows(cases,[a,b])[0]).toMatchObject({planned:2,counts:{passed:1,failed:1,unsupported:0,blocked:0}})
  expect(()=>joinReviewedPublicScopeRows(cases,[a])).toThrow('omits')
  expect(()=>joinReviewedPublicScopeRows(cases,[a,a,b])).toThrow('duplicates')
  expect(()=>joinReviewedPublicScopeRows(cases,[a,{...b,cases:[{...cases[1]!,callbackSha256:'a'.repeat(64)}]}])).toThrow('changes')
  expect(()=>joinReviewedPublicScopeRows(cases,[a,{...b,qualification:{...b.qualification,qualified:false}}])).toThrow('qualify')
  expect(()=>joinReviewedPublicScopeRows(cases,[a,{...b,targets:[{...b.targets[0]!,project:'other/public-api'}]}])).toThrow('cohort')
  expect(()=>joinReviewedPublicScopeRows(cases,[a,{...b,targets:[{...b.targets[0]!,version:'2'}]}])).toThrow('version')
})
