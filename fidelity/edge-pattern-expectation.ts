import type {MeaningExpectation} from './meaning.ts'

/** flowchart.md824-839 and usecase.md296 define enable/speed only, without
 * requiring a backend's default dash, cap, offset or animation-period skin. */
export function sourceEdgeAnimationActive(attributes:Record<string,unknown>):boolean{
  return attributes.animate===true||['fast','slow'].includes(String(attributes.animation))
}
export function sourceDashPattern(value:string):'solid'|'dotted'|null{
  if(value==='none')return'solid'
  const tokens=value.trim().split(/[ ,]+/)
  if(!tokens.length||tokens.some(token=>!/^\d+(?:\.\d+)?(?:px)?$/.test(token)))return null
  let values=tokens.map(Number.parseFloat)
  if(values.length%2)values=[...values,...values]
  if(values.every(value=>value===0))return'solid'
  const paint=values.some((value,index)=>index%2===0&&value>0),gap=values.some((value,index)=>index%2===1&&value>0)
  return paint?gap?'dotted':'solid':null
}

/** A DSL edge's base pattern does not override its later source-selected CSS.
 * Width/thick requests stay separate: animation does not cancel the authored
 * weight, and its unrequested default dash/cap skin supplies no fixed paint. Other unlowered CSS/animation facts remain required. */
export function projectSourceEdgePattern(expected:MeaningExpectation){
  const facts:any=expected.facts??{},appearances:any[]=facts['edge-appearance']??[],styles:any[]=facts['authored-style']??[],excluded:string[]=[],projections:string[]=[]
  const names=(value:unknown)=>String(value??'').split(/[\s,]+/).filter(Boolean)
  for(const edge of appearances){
    if(!edge.id||!['solid','dotted'].includes(edge.stroke))continue
    const attributes=facts['edge-attributes']?.find((row:any)=>row.id===edge.id)?.attributes??{},animation=sourceEdgeAnimationActive(attributes),classes=new Set<string>()
    for(const row of styles)if(row.kind==='class'&&names(row.selection).includes(edge.id))for(const attribute of row.attributes??[])for(const name of names(attribute.class))classes.add(name)
    const matching=styles.filter(row=>row.kind==='classDef'&&names(row.selection).some(name=>classes.has(name))||row.kind==='style'&&names(row.selection).includes(edge.id)),dashRequests=matching.flatMap(row=>(row.attributes??[]).filter((attribute:any)=>attribute.property==='stroke-dasharray'))
    const resets=matching.some(row=>(row.attributes??[]).some((attribute:any)=>attribute.property==='all'))
    // Multiple class assignments and mixed class/inline precedence are not
    // inferred from definition order. Keep their complete style requirement,
    // but do not invent either an effective pattern or the obsolete DSL one.
    const boundedCss=matching.every(row=>(row.attributes??[]).every((attribute:any)=>['stroke-dasharray','stroke-dashoffset','animation'].includes(attribute.property)))
    const qualified=classes.size<=1&&matching.length===1&&dashRequests.length===1&&!resets&&boundedCss&&typeof dashRequests[0].value==='string',dash=dashRequests.length===1?dashRequests[0].value:undefined,pattern=qualified?sourceDashPattern(dash):null,unqualifiedDash=(dashRequests.length>0||resets)&&!pattern
    if(!pattern&&!animation&&!unqualifiedDash||pattern===edge.stroke)continue
    const base={...edge}
    if(pattern)edge.stroke=pattern;else delete edge.stroke
    excluded.push('Explicit edge CSS supersedes its DSL base pattern; animation enable/speed leaves the default pattern advisory. Full original appearance remains native (flowchart.md816-861; usecase.md296): '+JSON.stringify({base,effectiveStroke:pattern??(unqualifiedDash?'unqualified CSS priority (advisory)':'animation-selected skin (advisory)'),...(dash===undefined?{}:{dash}),selectedBy:pattern?'owned-edge-css':unqualifiedDash?'unqualified-edge-css':'edge-animation'}))
  }
  if(excluded.length)projections.push('Resolve owned edge dash through explicit class/inline CSS; enabled animation leaves unrequested default line pattern advisory; retain the literal base appearance natively, every marker/width request, and all full CSS/temporal obligations')
  return{changed:excluded.length>0,excluded,projections}
}
