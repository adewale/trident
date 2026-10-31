import {expect,test} from 'bun:test'
import {readFileSync} from 'node:fs'
import {gunzipSync} from 'node:zlib'
import registry from '../corpus/docs-source-registry.json' with {type:'json'}
import {admitDocsReviews,assessDocsDrawing,reviewedDocsCase,type DocsDrawingReview} from '../unified/docs-drawings.ts'
import {assessDocsPng} from '../unified/docs-png-drawings.ts'
import {docsSourceAdmission,docsSourceSemanticHash} from '../unified/docs-source-admission.ts'
import {reviewDocumentationSource,requiredDocumentationObligations} from '../unified/docs-source-review.ts'
import {makeSvgObservationBinding} from '../fidelity/svg-assessment.ts'
import {planFidelityCriteria} from '../fidelity/ledger.ts'
const reviews=JSON.parse(readFileSync(new URL('../corpus/docs-reviewed.json',import.meta.url),'utf8')) as DocsDrawingReview[]
const inputs=JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-source-inventory.json.gz',import.meta.url))).toString()).cases
const original=reviews.find(row=>row.id==='packages/mermaid/src/docs/syntax/agentflow.md:19')!,input=inputs.find((row:any)=>row.id===original.id)

test('all548 canonical source roles and exact semantic contracts match registered scoring data',()=>{
 expect(registry.cases).toHaveLength(548)
 const admitted=admitDocsReviews(inputs,reviews)
 expect(admitted.filter(row=>row.sourceAdmission?.matched)).toHaveLength(548)
 expect(admitted.filter(row=>row.registeredProfileEligible)).toHaveLength(543)
 expect(admitted.filter(row=>row.registeredIntent==='configuration-only')).toHaveLength(1)
 const standalone=reviews.find(row=>row.id==='packages/mermaid/src/docs/syntax/classDiagram.md:827')!
 expect(standalone.sourceReview!.excludedNonvisual.some(reason=>reason.includes('external stylesheet prerequisite'))).toBe(true)
 for(const row of registry.cases)expect(docsSourceSemanticHash(reviews.find(review=>review.id===row.id)!)).toBe(row.semanticSha256)
})

test('edited canonical intent cannot manufacture a configuration exclusion or shrink its registered profile',()=>{
 const forged:DocsDrawingReview={...original,intent:'configuration-only',expected:undefined,unverifiedFacts:undefined,sourceReview:{...original.sourceReview!,expectedFactsComplete:true,requiredObligations:[],unresolved:[]}}
 const admitted=admitDocsReviews([input],[forged])[0]!
 expect(admitted).toMatchObject({intent:'source-review-pending',registeredIntent:'drawing',registeredProfileEligible:true,sourceAdmission:{matched:false}})
 expect(assessDocsDrawing(input,forged,'passed',true,[]).status).toBe('unknown')
 expect(assessDocsPng(input,forged,undefined,[]).status).toBe('unknown')
 const absent=admitDocsReviews([input],[])[0]!
 expect(absent).toMatchObject({intent:'source-review-pending',registeredIntent:'drawing',registeredProfileEligible:true})
 const configured=reviews.find(row=>row.intent==='configuration-only')!,configuredInput=inputs.find((row:any)=>row.id===configured.id)
 expect(assessDocsDrawing(configuredInput,configured,'passed',false,[]).status).toBe('not-applicable')
 expect(assessDocsPng(configuredInput,configured,undefined,[]).status).toBe('not-applicable')
})

test('self-consistent invented canonical facts receive unknown even with every declared synthetic check passed',()=>{
 const expected={labels:['Substitute'],nodes:[{id:'X',label:'Substitute'}],edges:[],facts:{}}
 const forged:DocsDrawingReview={...original,expected,sourceReview:{...original.sourceReview!,requiredObligations:requiredDocumentationObligations(expected)}}
 expect(()=>admitDocsReviews([input],[forged])).not.toThrow()
 expect(docsSourceAdmission(input,forged).matched).toBe(false)
 const authored=reviewedDocsCase(input,forged),binding=makeSvgObservationBinding(authored,'a'.repeat(64),'b'.repeat(64))
 expect(authored.sourceReview!.expectedFactsComplete).toBe(false)
 const checks=planFidelityCriteria([authored]).filter(item=>item.surface==='browser-owned-ink').map(({criterion})=>({criterion,status:'passed' as const,expected:null,actual:null,scope:'Adversarial synthetic evidence-assembly control; no renderer accuracy claim'}))
 expect(assessDocsDrawing(input,forged,'passed',true,checks,binding).status).toBe('unknown')
 expect(assessDocsPng(input,forged,undefined,[]).reason).toContain('unregistered or changed')
})

test('editorial provenance edits and fixture source controls do not require a new canonical semantic identity',()=>{
 const editorial={...original,review:'Clearer source provenance wording',sourceReview:{...original.sourceReview!,method:'Clearer description of the same literal-source transcription'}}
 expect(docsSourceAdmission(input,editorial).matched).toBe(true)
 const fixture={id:'docs:synthetic-fixture',family:'flowchart',source:'flowchart LR\nA-->B'},review=reviewDocumentationSource(fixture)
 expect(docsSourceAdmission(fixture,review)).toMatchObject({canonical:false,matched:true})
 expect(admitDocsReviews([fixture],[review])[0]!.intent).toBe('drawing')
 const future={...fixture,id:'packages/mermaid/src/docs/syntax/unregistered.md:1'},futureReview=reviewDocumentationSource(future)
 expect(docsSourceAdmission(future,futureReview)).toMatchObject({canonical:true,matched:false})
 expect(assessDocsDrawing(future,futureReview,'passed',true,[]).status).toBe('unknown')
})
