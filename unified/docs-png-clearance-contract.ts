import registry from '../corpus/docs-source-registry.json' with {type:'json'}
import {evidenceDigest} from '../portable/evidence-contract.ts'
import type {MeaningExpectation} from '../fidelity/meaning.ts'
import type {DocsDrawingReview} from './docs-drawings.ts'
import {docsSourceSemanticHash} from './docs-source-admission.ts'

const sourceId='packages/mermaid/src/docs/syntax/treemap.md:133'
const usecaseSourceId='packages/mermaid/src/docs/syntax/usecase.md:478'
export interface DocsPngClearanceProjection {
  protocol:'documentation-png-minimum-canvas-clearance-v1'
  sourceSemanticSha256:string
  originalExpectedSha256:string
  expected:MeaningExpectation
  nativeProfileExpected:MeaningExpectation
  sourcePadding:24|200
  requiredMinimum:24|200
  pixelRatio:1
  boundsPolicy:'owned-visible-geometry-excluding-stroke-outset'
  provenance:string[]
  claim:string
}

/** Forward source projection only: a public PNG adapter may add outer canvas
 * margins, so a raster cannot inverse-identify the internal padding setting.
 * The literal value and original native/SVG contract remain unchanged. */
export function docsPngClearanceProjection(review:DocsDrawingReview):DocsPngClearanceProjection|null {
  if(review.id!==sourceId&&review.id!==usecaseSourceId)return null
  const entry=registry.cases.find(row=>row.id===review.id),semantic=docsSourceSemanticHash(review),family=review.id===sourceId?'treemap':'usecase'
  if(!entry||entry.sourceSha256!==review.sourceSha256||entry.semanticSha256!==semantic||review.intent!=='drawing'||review.family!==family||!review.expected||!review.sourceReview?.expectedFactsComplete)throw Error('PNG clearance projection requires the exact registered source contract')
  const expected=structuredClone(review.expected),facts:any=expected.facts,config=facts?.['authored-config']
  if(family==='usecase'){
    if(config?.usecase?.diagramPadding!==24)throw Error('PNG clearance source configuration changed')
    delete config.usecase.diagramPadding
    facts['minimum-canvas-clearance']={minimum:24,unit:'px-at-frozen-pixelRatio-1',sides:['left','top','right','bottom'],bounds:'owned-visible-geometry-excluding-stroke-outset'}
    ;(expected.advisoryFacts??={})['source-diagram-padding']={value:24,unit:'source-unit',exactInternalValueInverseInferable:false}
    return{protocol:'documentation-png-minimum-canvas-clearance-v1',sourceSemanticSha256:semantic,originalExpectedSha256:evidenceDigest(review.expected),expected,nativeProfileExpected:structuredClone(review.profileExpected??review.expected),sourcePadding:24,requiredMinimum:24,pixelRatio:1,boundsPolicy:'owned-visible-geometry-excluding-stroke-outset',provenance:[
      'Pinned source1fb7869866dd619168d840291c9c54b4f129758b: usecase.md474,478: padding around the diagram; usecaseRenderer.ts286-293 invokes setupViewPortForSVG with authored diagramPadding',
      'setupViewPortForSVG.ts18-45: getBBox width/height plus2padding; viewBox origin minuspadding; getBBox excludes stroke outset',
      'docs-png-browser.ts: intrinsic viewBox raster dimensions; native renderToPng uses frozen pixelRatio1 without cropping; public adapter outer margins may add clearance',
    ],claim:'Minimum24px visible clearance on all four sides at frozen pixelRatio1, measured at independently owned geometry bounds excluding stroke outset. Exact internal padding value is not inverse-inferred; literal24 and native/SVG obligations remain retained.'}
  }
  if(config?.treemap?.diagramPadding!==200||Object.keys(config).length!==1||Object.keys(config.treemap).length!==1)throw Error('PNG clearance source configuration changed')
  delete facts['authored-config']
  facts['minimum-canvas-clearance']={minimum:200,unit:'px-at-frozen-pixelRatio-1',sides:['left','top','right','bottom'],bounds:'owned-visible-geometry-excluding-stroke-outset'}
  ;(expected.advisoryFacts??={})['source-diagram-padding']={value:200,unit:'source-unit',exactInternalValueInverseInferable:false}
  return {
    protocol:'documentation-png-minimum-canvas-clearance-v1',sourceSemanticSha256:semantic,originalExpectedSha256:evidenceDigest(review.expected),expected,nativeProfileExpected:structuredClone(review.profileExpected??review.expected),sourcePadding:200,requiredMinimum:200,pixelRatio:1,boundsPolicy:'owned-visible-geometry-excluding-stroke-outset',
    provenance:[
      'Pinned source1fb7869866dd619168d840291c9c54b4f129758b: treemap.md131,156: padding around the entire diagram',
      'setupViewPortForSVG.ts18-45: getBBox width/height plus2padding; viewBox origin minuspadding; getBBox excludes stroke outset',
      'docs-png-browser.ts: intrinsic viewBox raster dimensions; native docs-png-worker calls renderToPng(source,pixelRatio:1) without cropping',
      'Public adapter canvas margins may exceed the diagram renderer padding; extra clearance does not contradict the literal source setting',
    ],
    claim:'Minimum200px visible clearance on all four sides at frozen pixelRatio1, measured at owned diagram geometry bounds (stroke outset and raster quantization are not an internal-padding inverse). Exact internal padding value is not inverse-inferred; original literal200 and native/SVG obligations remain retained.',
  }
}

export interface OwnedCanvasGeometry {
  width:number
  height:number
  /** Frozen public adapter setting, never fitted to expected or actual output. */
  pixelRatio:number
  /** Independently inspected complete diagram union; canvas/background excluded.
   * For stroked paths these are geometry/centerline bounds, as SVG getBBox,
   * rather than the outward half-stroke or a faint anti-aliased sample. */
  bounds:{left:number;top:number;right:number;bottom:number}
}

/** Inspect all four independently owned bounds, never the aggregate margin.
 * Geometry ownership is an independent prerequisite, not supplied by this
 * arithmetic helper. No renderer/source agreement or cell-size fit is used. */
export function inspectMinimumCanvasClearance(projection:DocsPngClearanceProjection,actual:OwnedCanvasGeometry) {
  const registered=registry.cases.find(row=>[sourceId,usecaseSourceId].includes(row.id)&&row.semanticSha256===projection?.sourceSemanticSha256),minimum=registered?.id===sourceId?200:registered?.id===usecaseSourceId?24:undefined
  const diagnostic='minimum'+(minimum??'unregistered')+'px visible clearance; exact internal padding value not inverse-inferred'
  const required=projection?.expected?.facts?.['minimum-canvas-clearance'] as Record<string,unknown>|undefined
  if(!projection||!minimum||projection.protocol!=='documentation-png-minimum-canvas-clearance-v1'||projection.sourcePadding!==minimum||projection.requiredMinimum!==minimum||projection.pixelRatio!==1||projection.boundsPolicy!=='owned-visible-geometry-excluding-stroke-outset'||projection.sourceSemanticSha256!==registered?.semanticSha256||required?.minimum!==minimum||required.unit!=='px-at-frozen-pixelRatio-1'||required.bounds!=='owned-visible-geometry-excluding-stroke-outset'||JSON.stringify(required.sides)!==JSON.stringify(['left','top','right','bottom']))return{status:'unknown' as const,diagnostic,reason:'Projection does not retain the exact registered'+minimum+'px minimum, bounds policy and frozen pixel ratio'}
  if(!actual||typeof actual!=='object'||!actual.bounds||typeof actual.bounds!=='object'||Array.isArray(actual.bounds))return{status:'unknown' as const,diagnostic,reason:'Missing independently owned canvas geometry'}
  const values=[actual.width,actual.height,actual.pixelRatio,actual.bounds.left,actual.bounds.top,actual.bounds.right,actual.bounds.bottom]
  if(values.some(value=>!Number.isFinite(value))||actual.width<=0||actual.height<=0||actual.pixelRatio!==1||actual.bounds.left<0||actual.bounds.top<0||actual.bounds.right<=actual.bounds.left||actual.bounds.bottom<=actual.bounds.top||actual.bounds.right>actual.width||actual.bounds.bottom>actual.height)return{status:'unknown' as const,diagnostic,reason:'Missing, invalid or unqualified independently owned geometry at frozen pixelRatio1'}
  const clearances={left:actual.bounds.left,top:actual.bounds.top,right:actual.width-actual.bounds.right,bottom:actual.height-actual.bounds.bottom}
  const failedSides=Object.entries(clearances).filter(([,value])=>value<projection.requiredMinimum).map(([side])=>side)
  return{status:failedSides.length?'incorrect' as const:'correct' as const,diagnostic,clearances,failedSides,reason:failedSides.length?'At least one independently owned side has less than'+minimum+'px clearance':'Every independently owned side has at least'+minimum+'px clearance; outer adapter margins may add more'}
}
