import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { admitDocsReviews, assessDocsDrawing } from '../unified/docs-drawings.ts'
import { assessDocsPng } from '../unified/docs-png-drawings.ts'
import { reviewDocumentationSource } from '../unified/docs-source-review.ts'
import { docsSourceAdmission } from '../unified/docs-source-admission.ts'
import { assessDocsInvalidSource, type DocsPublicRejectionEvidence } from '../unified/docs-invalid-source.ts'

const input = {id:'docs:invalid-kanban',family:'kanban',source:'kanban\nTodo\n  task[First]\nDone\n  task[Second]'}
const review = reviewDocumentationSource(input)
const native: DocsPublicRejectionEvidence = {protocol:'docs-native-public-rejection-v1',sourceSha256:review.sourceSha256,origin:'native-public-api',outcome:'rejected',nativeError:{name:'SyntaxError',code:'DUPLICATE_IDENTIFIER',identifier:'task',message:'Duplicate identifier task'}}

test('documented invalid controls need exact native typed rejection rather than any thrown exception',()=>{
  expect(assessDocsInvalidSource(input,review,native).status).toBe('correct')
  expect(assessDocsInvalidSource(input,review,{...native,outcome:'returned'}).status).toBe('incorrect')
  for(const evidence of [undefined,{...native,sourceSha256:'a'.repeat(64)},{...native,origin:'adapter' as const},{...native,origin:'transport' as const},{...native,outcome:'unavailable' as const},{...native,nativeError:{name:'Error',message:'Renderer crashed'}},{...native,nativeError:{name:'Error',message:'Duplicate identifier task'}},{...native,nativeError:{...native.nativeError!,identifier:'other'}},{...native,nativeError:{...native.nativeError!,code:'UNSUPPORTED_VALIDATION'}}]) expect(assessDocsInvalidSource(input,review,evidence).status).toBe('unknown')
  expect(assessDocsDrawing(input,review,'passed',true,[]).status).toBe('not-applicable')
  expect(assessDocsPng(input,review,undefined,[]).status).toBe('not-applicable')
})

test('typed rejection role is closed to incomplete, mixed and forged canonical contracts',()=>{
  expect(admitDocsReviews([input],[review])[0]!.intent).toBe('invalid-source')
  for(const forged of [{...review,expectedRejection:undefined},{...review,expected:{labels:['invented drawing']}},{...review,expectedRejection:{...review.expectedRejection!,identifiers:[]}},{...review,intent:'drawing' as const}]) expect(()=>admitDocsReviews([input],[forged])).toThrow()
  const inventory = JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-source-inventory.json.gz',import.meta.url))).toString())
  const canonical = inventory.cases.find((row:any)=>row.id.endsWith('kanban.md:83')), expected = reviewDocumentationSource(canonical)
  expect(expected.expectedRejection!.identifiers).toEqual(['id3'])
  expect(docsSourceAdmission(canonical,expected).matched).toBe(true)
  const altered={...expected,expectedRejection:{...expected.expectedRejection!,identifiers:['id2']}}
  expect(docsSourceAdmission(canonical,altered).matched).toBe(false)
  expect(assessDocsInvalidSource(canonical,altered,{...native,sourceSha256:expected.sourceSha256,nativeError:{...native.nativeError!,identifier:'id2',message:'Duplicate identifier id2'}}).status).toBe('unknown')
})
