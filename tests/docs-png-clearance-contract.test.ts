import{expect,test}from'bun:test'
import reviews from'../corpus/docs-reviewed.json' with{type:'json'}
import{docsPngClearanceProjection,inspectMinimumCanvasClearance}from'../unified/docs-png-clearance-contract.ts'
import type{DocsDrawingReview}from'../unified/docs-drawings.ts'
const source=reviews.find(row=>row.id==='packages/mermaid/src/docs/syntax/treemap.md:133')! as DocsDrawingReview
const projection=docsPngClearanceProjection(source)!
const usecase=reviews.find(row=>row.id==='packages/mermaid/src/docs/syntax/usecase.md:478')! as DocsDrawingReview
const usecaseProjection=docsPngClearanceProjection(usecase)!

test('the same forward minimum applies to registered usecase24 without removing fonts,colors or the full native/SVG setting',()=>{
  const original=structuredClone(usecase),config=(usecase.expected!.facts!['authored-config'] as any).usecase,{diagramPadding,...remaining}=config
  expect(diagramPadding).toBe(24)
  expect(usecaseProjection.requiredMinimum).toBe(24)
  expect((usecaseProjection.expected.facts!['authored-config'] as any).usecase).toEqual(remaining)
  expect(usecaseProjection.nativeProfileExpected).toEqual(usecase.profileExpected??usecase.expected!)
  expect((usecaseProjection.nativeProfileExpected.facts!['authored-config'] as any).usecase.diagramPadding).toBe(24)
  expect(usecaseProjection.expected.nodes).toEqual(usecase.expected!.nodes)
  expect(usecaseProjection.expected.edges).toEqual(usecase.expected!.edges)
  expect(usecase).toEqual(original)
  expect(()=>docsPngClearanceProjection({...usecase,expected:{...usecase.expected!,labels:['forged']}})).toThrow('exact registered')
})

test('24px and larger margins pass; independently cropped23px on each side fails without opposite-margin compensation',()=>{
  expect(inspectMinimumCanvasClearance(usecaseProjection,{width:140,height:130,pixelRatio:1,bounds:{left:24,top:24,right:116,bottom:106}}).status).toBe('correct')
  expect(inspectMinimumCanvasClearance(usecaseProjection,{width:200,height:160,pixelRatio:1,bounds:{left:30,top:40,right:160,bottom:130}}).status).toBe('correct')
  for(const bounds of[{left:23,top:30,right:150,bottom:120},{left:30,top:23,right:150,bottom:120},{left:30,top:30,right:177,bottom:120},{left:30,top:30,right:150,bottom:137}]){
    const result=inspectMinimumCanvasClearance(usecaseProjection,{width:200,height:160,pixelRatio:1,bounds})
    expect(result.status).toBe('incorrect')
    expect(result.failedSides).toHaveLength(1)
  }
  const actual={width:140,height:130,pixelRatio:1,bounds:{left:24,top:24,right:116,bottom:106}}
  for(const change of[{requiredMinimum:23},{sourcePadding:23},{pixelRatio:2},{sourceSemanticSha256:projection.sourceSemanticSha256}])expect(inspectMinimumCanvasClearance({...usecaseProjection,...change}as any,actual).status).toBe('unknown')
  expect(inspectMinimumCanvasClearance(usecaseProjection,{...actual,pixelRatio:2}).status).toBe('unknown')
})

test('only exact pinned source receives a forward clearance projection; all literal/native facts remain retained',()=>{
  const before=JSON.stringify(source)
  expect(projection.requiredMinimum).toBe(200)
  expect(projection.expected.facts!['minimum-canvas-clearance']).toEqual({minimum:200,unit:'px-at-frozen-pixelRatio-1',sides:['left','top','right','bottom'],bounds:'owned-visible-geometry-excluding-stroke-outset'})
  expect(projection.expected.facts!['authored-config']).toBeUndefined()
  expect(projection.nativeProfileExpected).toEqual(source.profileExpected??source.expected!)
  expect(projection.nativeProfileExpected.facts!['authored-config']).toEqual({treemap:{diagramPadding:200}})
  expect(projection.expected.labels).toEqual(source.expected!.labels)
  expect(projection.expected.nodes).toEqual(source.expected!.nodes)
  for(const fact of ['hierarchy','values','displayed-values','show-values'])expect(projection.expected.facts![fact]).toEqual(source.expected!.facts![fact])
  expect(JSON.stringify(source)).toBe(before)
  expect(docsPngClearanceProjection({...source,id:'synthetic:padding'})).toBeNull()
  expect(()=>docsPngClearanceProjection({...source,expected:{...source.expected!,labels:['changed']}})).toThrow('exact registered')
  expect(()=>docsPngClearanceProjection({...source,sourceSha256:'0'.repeat(64)})).toThrow('exact registered')
})

// Honest independently hand-authored geometry controls: no SUT drawing, decoder
// round trip, inverse padding solver, renderer-derived width or expected fit.
test('synthetic200px exact and larger asymmetric adapter margins pass all four bounds',()=>{
  expect(inspectMinimumCanvasClearance(projection,{width:700,height:600,pixelRatio:1,bounds:{left:200,top:200,right:500,bottom:400}})).toMatchObject({status:'correct',clearances:{left:200,top:200,right:200,bottom:200}})
  expect(inspectMinimumCanvasClearance(projection,{width:1100,height:900,pixelRatio:1,bounds:{left:235,top:260,right:800,bottom:640}})).toMatchObject({status:'correct',clearances:{left:235,top:260,right:300,bottom:260}})
})

test('199px on any one side fails even when aggregate and opposite margins exceed400',()=>{
  for(const bounds of [{left:199,top:250,right:600,bottom:450},{left:250,top:199,right:600,bottom:450},{left:250,top:250,right:701,bottom:450},{left:250,top:250,right:600,bottom:601}]){
    const result=inspectMinimumCanvasClearance(projection,{width:900,height:800,pixelRatio:1,bounds})
    expect(result.status).toBe('incorrect')
    expect(result.failedSides).toHaveLength(1)
    expect(result.diagnostic).toContain('not inverse-inferred')
  }
})

test('missing geometry or unqualified scale cannot borrow the minimum or fit a raster unit',()=>{
  for(const actual of [{width:700,height:600,pixelRatio:2,bounds:{left:200,top:200,right:500,bottom:400}},{width:700,height:600,pixelRatio:1,bounds:{left:NaN,top:200,right:500,bottom:400}},{width:700,height:600,pixelRatio:1,bounds:{left:200,top:200,right:200,bottom:400}}])expect(inspectMinimumCanvasClearance(projection,actual).status).toBe('unknown')
})

test('a mutated projection cannot lower the threshold or change the declared source metric',()=>{
  const geometry={width:700,height:600,pixelRatio:1,bounds:{left:199,top:200,right:500,bottom:400}}
  for(const change of [{requiredMinimum:199},{sourcePadding:199},{protocol:'forged'},{boundsPolicy:'fit-to-raster'},{pixelRatio:2},{sourceSemanticSha256:'0'.repeat(64)}])expect(inspectMinimumCanvasClearance({...projection,...change}as any,geometry).status).toBe('unknown')
  expect(inspectMinimumCanvasClearance(null as any,geometry).status).toBe('unknown')
  const changed=structuredClone(projection)
  ;(changed.expected.facts!['minimum-canvas-clearance']as any).minimum=199
  expect(inspectMinimumCanvasClearance(changed,geometry).status).toBe('unknown')
})

test('every named owned bound must be present; absent evidence never becomes a successful comparison',()=>{
  const good={width:700,height:600,pixelRatio:1,bounds:{left:200,top:200,right:500,bottom:400}}
  for(const side of ['left','top','right','bottom']){
    const missing=structuredClone(good)
    delete(missing.bounds as any)[side]
    expect(inspectMinimumCanvasClearance(projection,missing).status).toBe('unknown')
  }
  for(const incomplete of [{...good,bounds:{}},{width:700,height:600,pixelRatio:1},{...good,bounds:null},null,undefined])expect(inspectMinimumCanvasClearance(projection,incomplete as any).status).toBe('unknown')
})
