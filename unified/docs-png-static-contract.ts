import registry from '../corpus/docs-source-registry.json' with {type:'json'}
import {evidenceDigest} from '../portable/evidence-contract.ts'
import type {MeaningExpectation,MeaningJson,AuthoredFidelityCase} from '../fidelity/meaning.ts'
import {reviewedDocsCase,type DocsDrawingReview,type DocsInput} from './docs-drawings.ts'
import {docsSourceSemanticHash} from './docs-source-admission.ts'
import {requiredDocumentationObligations} from './docs-source-review.ts'
import {docsPngClearanceProjection,type DocsPngClearanceProjection} from './docs-png-clearance-contract.ts'
import {sourceEdgeAnimationActive,sourceDashPattern,projectSourceEdgePattern} from '../fidelity/edge-pattern-expectation.ts'

export const docsPngStaticProtocol='documentation-png-static-invariants-v1'
const animatedIds=new Set([818,832,844].map(line=>'packages/mermaid/src/docs/syntax/flowchart.md:'+line))
for(const line of [282,527])animatedIds.add('packages/mermaid/src/docs/syntax/usecase.md:'+line)
export interface DocsPngStaticProjection {
  protocol:typeof docsPngStaticProtocol
  sourceSemanticSha256:string
  originalExpectedSha256:string
  expected:MeaningExpectation
  nativeProfileExpected:MeaningExpectation
  excludedTemporal:{owner:string;property:string;value:MeaningJson;reason:string}[]
  excludedMetadata?:{owner:string;property:string;value:MeaningJson;reason:string}[]
  canvasClearance?:DocsPngClearanceProjection
  provenance:string[]
  claim:string
}

/** A PNG is one static frame, so it cannot prove elapsed animation or speed.
 * Registered responsive SVG behavior likewise has no single-raster inverse.
 * Unknown/custom syntax retains its full obligations. */
export function docsPngStaticProjection(review:DocsDrawingReview):DocsPngStaticProjection|null{
  const clearance=docsPngClearanceProjection(review)
  if(clearance)return{protocol:docsPngStaticProtocol,sourceSemanticSha256:clearance.sourceSemanticSha256,originalExpectedSha256:clearance.originalExpectedSha256,expected:clearance.expected,nativeProfileExpected:clearance.nativeProfileExpected,excludedTemporal:[],excludedMetadata:[{owner:'diagram',property:'treemap.diagramPadding.exactInternalValue',value:200,reason:'The literal internal200 setting is retained in the original source/native/SVG contract. Extra public-adapter canvas margins prevent inverse-identifying it from PNG pixels; the required minimum200px effect remains explicit.'}],canvasClearance:clearance,provenance:clearance.provenance,claim:clearance.claim}
  const responsive=review.id==='packages/mermaid/src/docs/syntax/usecase.md:478'
  const metadataKeys=['accessibility-title','accessibility-description'].filter(key=>Object.hasOwn(review.expected?.facts??{},key))
  if(!responsive&&!animatedIds.has(review.id)&&(!metadataKeys.length||!review.id.startsWith('packages/mermaid/src/docs/syntax/')))return null
  const entry=registry.cases.find(row=>row.id===review.id),semantic=docsSourceSemanticHash(review)
  if(!entry||entry.sourceSha256!==review.sourceSha256||entry.semanticSha256!==semantic||review.intent!=='drawing'||!review.expected||!review.sourceReview?.expectedFactsComplete)throw Error('PNG static projection requires the exact registered original source contract: '+review.id)
  const expected=structuredClone(review.expected),facts:any=expected.facts??={},excludedTemporal:DocsPngStaticProjection['excludedTemporal']=[],excludedMetadata:NonNullable<DocsPngStaticProjection['excludedMetadata']>=[]
  if(animatedIds.has(review.id))projectSourceEdgePattern(expected)
  for(const key of metadataKeys){excludedMetadata.push({owner:'diagram',property:key,value:facts[key],reason:'PNG pixels cannot expose DOM/ARIA name or description metadata; the original SVG and native contract retains this exact value'});delete facts[key]}
  if(responsive){
    if(facts['authored-config']?.usecase?.useMaxWidth!==false)throw Error('Unreviewed PNG responsive configuration')
    excludedMetadata.push({owner:'diagram',property:'usecase.useMaxWidth',value:false,reason:'One fixed PNG cannot prove whether its originating SVG scales to a different parent width; the exact false setting remains in the complete original SVG/native contract'})
    delete facts['authored-config'].usecase.useMaxWidth
    ;(expected.advisoryFacts??={})['png-inaccessible-metadata']=excludedMetadata as unknown as MeaningJson
    return{protocol:docsPngStaticProtocol,sourceSemanticSha256:semantic,originalExpectedSha256:evidenceDigest(review.expected),expected,nativeProfileExpected:structuredClone(review.profileExpected??review.expected),excludedTemporal:[],excludedMetadata,provenance:['usecase.md:476,478 (pinned source1fb7869866dd619168d840291c9c54b4f129758b): useMaxWidth selects whether the SVG scales to available width','A single fixed raster has no counterfactual parent/container behavior. Fonts,padding24,colors,nodes,shapes and relationships remain required unchanged.'],claim:'PNG correctness covers every source-requested static font,padding,color,shape,label and relationship. It does not certify responsive SVG/container scaling from a single fixed raster; complete source/native/SVG obligations remain unchanged.'}
  }
  const exclude=(owner:string,property:string,value:MeaningJson,reason:string)=>excludedTemporal.push({owner,property,value,reason})
  const edgeFor=(id:string)=>{
    const appearance=facts['edge-appearance']?.find((item:any)=>item.id===id),owned=expected.edges?.filter(item=>item.source===appearance?.source&&item.target===appearance?.target)
    if(!appearance||owned?.length!==1)throw Error('PNG animation projection has no unique source-owned edge')
    return{appearance,edge:owned[0]!}
  }
  const addPaint=(id:string,properties:Record<string,string>)=>{const{appearance,edge}=edgeFor(id);if(['solid','dotted'].includes(appearance.stroke))appearance.stroke=sourceDashPattern(properties['stroke-dasharray']??'')??appearance.stroke;facts['edge-paint']=[...(facts['edge-paint']??[]),{edge:structuredClone(edge),properties}]}
  if(animatedIds.has(review.id)&&!review.id.endsWith('flowchart.md:844')){
    facts['edge-attributes']=facts['edge-attributes'].map((item:any)=>{
      const attributes={...item.attributes}
      const hasTemporal=['animate','animation'].some(key=>Object.hasOwn(attributes,key)),active=sourceEdgeAnimationActive(attributes)
      if(hasTemporal){
        if(attributes.animation!==undefined&&!['fast','slow'].includes(attributes.animation)||attributes.animate!==undefined&&typeof attributes.animate!=='boolean')throw Error('Unreviewed PNG animation vocabulary')
        edgeFor(item.id)
        for(const key of ['animate','animation'])if(Object.hasOwn(attributes,key)){exclude('edge:'+item.id,key,attributes[key],'A single PNG cannot verify animation activation/absence,temporal progression or playback speed');delete attributes[key]}
        // Animation enable/speed does not request a backend default dash, cap
        // or initial offset. Explicit authored CSS remains required separately.
        if(active)edgeFor(item.id)
      }
      return{...item,attributes}
    }).filter((item:any)=>Object.keys(item.attributes).length)
    if(!facts['edge-attributes'].length)delete facts['edge-attributes']
  }else if(review.id.endsWith('flowchart.md:844')){
    const properties:Record<string,string>={}
    const styles:any[]=facts['authored-style'],definition=styles?.find(item=>item.kind==='classDef'&&item.selection==='animate'),assignment=styles?.find(item=>item.kind==='class'&&item.selection==='e1')
    if(styles?.length!==2||!definition||!assignment||assignment.attributes.length!==1||assignment.attributes[0].class!=='animate')throw Error('Registered animation class ownership changed')
    for(const attribute of definition.attributes){
      if(attribute.property==='animation')exclude('edge:e1',attribute.property,attribute.value,'Animation name,25s duration,linear timing and infinite repetition cannot be verified in one PNG')
      else if(attribute.property==='stroke-dashoffset')exclude('edge:e1',attribute.property,attribute.value,'The authored dash animation changes this offset; one captured frame cannot establish its elapsed phase')
      else if(typeof attribute.property==='string'&&typeof attribute.value==='string')properties[attribute.property]=attribute.value
      else throw Error('Uninterpreted static animation style')
    }
    delete facts['authored-style']
    if(!Object.keys(properties).length)throw Error('Empty PNG static animation paint')
    addPaint('e1',properties)
  }
  if(!excludedTemporal.length&&!excludedMetadata.length)throw Error('Empty PNG static projection')
  if(excludedTemporal.length)(expected.advisoryFacts??={})['png-temporal-source']=excludedTemporal as unknown as MeaningJson
  if(excludedMetadata.length)(expected.advisoryFacts??={})['png-inaccessible-metadata']=excludedMetadata as unknown as MeaningJson
  return{protocol:docsPngStaticProtocol,sourceSemanticSha256:semantic,originalExpectedSha256:evidenceDigest(review.expected),expected,nativeProfileExpected:structuredClone(review.profileExpected??review.expected),excludedTemporal,...(excludedMetadata.length?{excludedMetadata}:{}),provenance:['flowchart.md:816-861 (pinned source1fb7869866dd619168d840291c9c54b4f129758b)',animatedIds.has(review.id)&&!review.id.endsWith('flowchart.md:844')?'flowchart.md816-838;usecase.md296: animation enable/speed does not require backend default dash,cap or initial offset':'styles.ts:52-68: fast/slow retain9,5 dash and roundcaps while dashoffset advances','rendering-util/rendering-elements/edges.js:815-821: animate:true selectsfast; animation:fast selectsfast','usecase/styles.ts:356-359 retainsroundcaps for shared fast/slow animation classes','CSS/SVG dash arrays with odd length repeat the pattern; source844dash9 means9,9, never repaired9,5','PNG is a raster image format; DOM/ARIA name/description relationships are not pixels. Authored visible labels are retained separately'],claim:(animatedIds.has(review.id)&&!review.id.endsWith('flowchart.md:844')?'PNG correctness covers source-requested static labels,nodes,shapes,relationships,markers,weight,color and explicit CSS. Unrequested animation dash/cap/offset skin remains advisory. It does not certify activation,speed,phase,progression or DOM/ARIA metadata; full source/native/SVG obligations remain unchanged.':'PNG correctness covers the complete static frame: owned labels,nodes,shapes,relationships,markers,thickness,color and authored/default dash paint. It does not certify animation activation,absence,elapsed phase,speed,temporal progression or DOM/ARIA metadata; full source/native/SVG obligations remain unchanged.')}
}

/** Canonical admission remains on the original review. This derived authored
 * case is used only to inspect the exact SVG retained for PNG conversion. */
export function reviewedDocsPngCase(input:DocsInput,review:DocsDrawingReview):AuthoredFidelityCase{
  const original=reviewedDocsCase(input,review),projection=docsPngStaticProjection(review)
  if(!projection)return original
  return{...original,expected:projection.expected,profileExpected:projection.nativeProfileExpected,sourceReview:original.sourceReview?{...original.sourceReview,expectedSha256:evidenceDigest(projection.expected),requiredObligations:requiredDocumentationObligations(projection.expected),provenance:original.sourceReview.provenance+' '+projection.claim}:undefined}
}
