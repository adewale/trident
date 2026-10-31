import {expect,test} from 'bun:test'
import {readFileSync,existsSync} from 'node:fs'
import {gunzipSync} from 'node:zlib'
import {Resvg} from '@resvg/resvg-js'
import reviewsJson from '../corpus/docs-reviewed.json' with {type:'json'}
import {docsPngStaticProjection,reviewedDocsPngCase} from '../unified/docs-png-static-contract.ts'
import {docsExpectationsHash,assessDocsPng,type DocsPngReview} from '../unified/docs-png-drawings.ts'
import {reviewedDocsCase,sourceHash,type DocsDrawingReview} from '../unified/docs-drawings.ts'
import {docsSourceAdmission} from '../unified/docs-source-admission.ts'
import {qualifyRetainedDocsPngConversion,type DocsPngConversionReturn} from '../unified/docs-png-qualification.ts'
import {assessSvgPngConversion,type FrozenRasterProfile} from '../unified/png-preservation.ts'
import {evidenceBytesDigest} from '../portable/evidence-contract.ts'
import {planFidelityCriteria} from '../fidelity/ledger.ts'
import {reviewDocumentationSource} from '../unified/docs-source-review.ts'

const reviews=reviewsJson as DocsDrawingReview[],inputs=JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-source-inventory.json.gz',import.meta.url))).toString()).cases
const legacyHash=(review:DocsDrawingReview)=>sourceHash(JSON.stringify({intent:review.intent,family:review.family,expected:review.expected,...(review.profileExpected?{profileExpected:review.profileExpected}:{}),...(review.expectedRejection?{expectedRejection:review.expectedRejection}:{}),unverifiedFacts:review.unverifiedFacts??[],...(review.sourceReview?{sourceReview:review.sourceReview}:{})}))
const selected=reviews.find(row=>row.id.endsWith('flowchart.md:818'))!,input=inputs.find((row:any)=>row.id===selected.id)

test('only the exact registered animation/ARIA contracts receive PNG-specific identities; SVG and native contracts remain complete',()=>{
  expect(reviews.filter(row=>docsExpectationsHash(row)!==legacyHash(row)).map(row=>row.id)).toEqual(['flowchart.md:818','flowchart.md:832','flowchart.md:844','stateDiagram.md:399','stateDiagram.md:433','swimlanes.md:232','usecase.md:282','usecase.md:507','usecase.md:527'].map(suffix=>'packages/mermaid/src/docs/syntax/'+suffix))
  for(const original of reviews.filter(row=>docsPngStaticProjection(row))){
    const before=JSON.stringify(original),projection=docsPngStaticProjection(original)!,stimulus=inputs.find((row:any)=>row.id===original.id),pngCase=reviewedDocsPngCase(stimulus,original),svgCase=reviewedDocsCase(stimulus,original)
    expect(JSON.stringify(original)).toBe(before)
    expect(docsSourceAdmission(stimulus,original).matched).toBe(true)
    expect(pngCase.expected.labels).toEqual(svgCase.expected.labels)
    expect(pngCase.expected.nodes).toEqual(svgCase.expected.nodes)
    expect(pngCase.expected.edges).toEqual(svgCase.expected.edges)
    expect(pngCase.profileExpected).toEqual(original.profileExpected??original.expected)
    expect(projection.excludedTemporal.every(item=>['animate','animation','stroke-dashoffset'].includes(item.property))).toBe(true)
    expect(projection.claim).toContain('does not certify animation')
    expect(pngCase.expected.facts!['edge-attributes']).toBeUndefined()
    if(projection.excludedTemporal.length){
      expect((pngCase.expected.facts!['edge-paint'] as any[])[0].properties['stroke-dasharray']).toBe(original.id.endsWith(':844')?'9':'9,5')
      expect(svgCase.expected.facts![original.id.endsWith(':844')?'authored-style':'edge-attributes']).toBeDefined()
    }
    if(original.id.endsWith('flowchart.md:844'))expect(pngCase.expected.facts!['authored-style']).toBeUndefined()
    else expect(pngCase.expected.facts!['authored-style']).toEqual(svgCase.expected.facts!['authored-style'])
    for(const key of ['accessibility-title','accessibility-description']){
      expect(pngCase.expected.facts![key]).toBeUndefined()
      if(original.expected!.facts![key]!==undefined)expect(projection.excludedMetadata!.find(item=>item.property===key)!.value).toEqual(original.expected!.facts![key])
    }
  }
  expect((reviewedDocsPngCase(input,selected).expected.facts!['edge-appearance'] as any[])[0].stroke).toBe('thick')
})

test('changed canonical facts cannot borrow a static projection and unrelated custom animation is never implicitly weakened',()=>{
  expect(()=>docsPngStaticProjection({...selected,expected:{...selected.expected!,labels:['A']}})).toThrow('exact registered')
  expect(()=>docsPngStaticProjection({...selected,expected:{...selected.expected!,facts:{...selected.expected!.facts,'edge-appearance':[]}}})).toThrow('exact registered')
  const custom={id:'docs:custom-animation',family:'flowchart',source:'flowchart LR\nA e1@--> B\ne1@{ animate: true }'},unregistered=reviewDocumentationSource(custom)
  expect(docsPngStaticProjection(unregistered)).toBeNull()
  expect(docsExpectationsHash(unregistered)).toBe(legacyHash(unregistered))
  expect(reviewedDocsPngCase(custom,unregistered).expected.facts!['edge-attributes']).toBeDefined()
})

const selectedFont=[{path:'/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',family:'DejaVu Sans'},{path:'/System/Library/Fonts/Supplemental/Arial.ttf',family:'Arial'}].find(item=>existsSync(item.path))
if(!selectedFont)throw Error('Static PNG control needs DejaVu Sans or Arial, as the existing PNG preservation controls do')
const font=selectedFont.path
const profile:FrozenRasterProfile={schema:'trident-raster-profile-v1',background:'#ffffff',defaultFontFamily:selectedFont.family,fontFiles:[{path:font,sha256:evidenceBytesDigest(readFileSync(font))}]}
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="260" height="100"><rect width="260" height="100" fill="white"/><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="black"/></marker></defs><g><rect x="10" y="20" width="60" height="40" fill="white" stroke="black"/><text x="35" y="45" font-family="DejaVu Sans" font-size="16">A</text></g><g><rect x="180" y="20" width="60" height="40" fill="white" stroke="black"/><text x="205" y="45" font-family="DejaVu Sans" font-size="16">B</text></g><path d="M70 40L175 40" fill="none" stroke="black" stroke-width="3.5" stroke-dasharray="9,5" stroke-linecap="round" marker-end="url(#arrow)"/></svg>'
const raster=(text:string)=>new Resvg(text,{background:'#ffffff',fitTo:{mode:'original'},font:{loadSystemFonts:false,fontFiles:[font],defaultFontFamily:profile.defaultFontFamily},dpi:96,logLevel:'off'}).render().asPng()
const baseline=raster(svg)
const imageReview:DocsPngReview={id:input.id,sourceSha256:sourceHash(input.source),pngSha256:evidenceBytesDigest(baseline),expectationsSha256:docsExpectationsHash(selected),status:'correct',reviewedBy:'Synthetic static-frame trust-boundary control, not benchmark evidence',review:'Hand-authored A/B rectangles, LR thick9,5 dashed arrow with round caps. This synthetic review exercises format binding and cannot certify animation or substitute for actual benchmark image inspection.'}
const returnEvidence=(actual:Uint8Array,text:string):DocsPngConversionReturn=>({schema:'trident-docs-png-return-v1',project:'synthetic/static-contract',caseId:input.id,round:1,variant:'primary',attemptId:'synthetic',sourceSha256:sourceHash(input.source),artifactSha256:'a'.repeat(64),bindingSha256:'b'.repeat(64),originalSvgSha256:evidenceBytesDigest(text),rasterizedSvgSha256:evidenceBytesDigest(text),pngSha256:evidenceBytesDigest(actual),rawUnitSha256:'c'.repeat(64),startedFrameSha256:'d'.repeat(64),returnedFrameSha256:'e'.repeat(64)})

test('PNG reviews require the projected hash and declare temporal limits without upgrading old full-animation reviews',()=>{
  expect(assessDocsPng(input,selected,baseline,[imageReview])).toMatchObject({status:'correct',excludedTemporal:[{property:'animate'},{property:'stroke-dashoffset'}]})
  expect(assessDocsPng(input,selected,baseline,[{...imageReview,expectationsSha256:legacyHash(selected)}]).status).toBe('unknown')
  expect(assessDocsPng(input,selected,raster(svg.replace('>B</text>','>C</text>')),[imageReview]).status).toBe('unknown')
})

test('strong preservation re-inspects the PNG-projected static SVG plan; absent dash evidence cannot borrow temporal exclusions',async()=>{
  let inspected=false
  const inspect=async(text:string,authored:any)=>{
    inspected=true
    expect(authored.expected.facts['edge-attributes']).toBeUndefined()
    expect(authored.expected.facts['edge-paint'][0].properties).toEqual({'stroke-dasharray':'9,5','stroke-linecap':'round'})
    return planFidelityCriteria([authored]).filter(item=>item.surface==='browser-owned-ink').map(item=>({criterion:item.criterion,status:item.criterion==='source-fact:edge-paint'&&!text.includes('stroke-dasharray="9,5"')?'failed' as const:'passed' as const,expected:null,actual:null,scope:'Synthetic complete observer record; independent literal dash attribute check. No benchmark result.'}))
  }
  const result=await qualifyRetainedDocsPngConversion({source:input,review:selected,actualPng:baseline,originalSvg:svg,rasterizedSvg:svg,returnEvidence:returnEvidence(baseline,svg),profile,pngReviews:[imageReview],observerSha256:'f'.repeat(64),inspectSvg:inspect})
  expect(inspected).toBe(true)
  expect(result.status).toBe('correct')
  const broken=svg.replace('stroke-dasharray="9,5"','stroke-dasharray="none"'),actual=raster(broken)
  const rejected=await qualifyRetainedDocsPngConversion({source:input,review:selected,actualPng:actual,originalSvg:broken,rasterizedSvg:broken,returnEvidence:returnEvidence(actual,broken),profile,pngReviews:[imageReview],observerSha256:'f'.repeat(64),inspectSvg:inspect})
  expect(rejected.status).toBe('unknown')
  expect(rejected.reason).toContain('lacks complete passing semantic evidence')
})

test('conversion cannot omit the static paint criterion or reuse the original temporal SVG plan',()=>{
  const full=planFidelityCriteria([reviewedDocsPngCase(input,selected)]).filter(item=>item.surface!=='native-public-api').map(({surface,criterion})=>({surface,criterion})),original=planFidelityCriteria([reviewedDocsCase(input,selected)]).filter(item=>item.surface!=='native-public-api').map(({surface,criterion})=>({surface,criterion}))
  expect(full.some(item=>item.criterion==='source-fact:edge-paint')).toBe(true)
  expect(original.some(item=>item.criterion==='source-fact:edge-attributes')).toBe(true)
  for(const requiredChecks of [full.filter(item=>item.criterion!=='source-fact:edge-paint'),original]){
    expect(()=>assessSvgPngConversion({input,expected:selected,originalSvg:svg,rasterizedSvg:svg,actualPng:baseline,svgContract:{schema:'trident-case-evidence-v1',caseId:input.id,sourceSha256:sourceHash(input.source),expectationsSha256:docsExpectationsHash(selected),requiredChecks},profile,referencePngReviews:[imageReview]})).toThrow('required source check')
  }
})
