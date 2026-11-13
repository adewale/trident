import type {MeaningExpectation,MeaningJson} from './meaning.ts'

/** Resolve the documented data-block reference into the owned displayed frame
 * fields. Declarations and reference names are native IR, not separate records
 * to paint. Pinned db.ts348–376 sets inline data first, then a resolved data
 * reference replaces it. Every used name/value remains a required frame field.
 */
export function projectEventData(expected:MeaningExpectation){
  const facts:any=expected.facts??={},definitions:any[]=facts['data-definitions'],frames:any[]=facts.frames
  const unchanged={changed:false,projections:[] as string[],excluded:[] as string[]}
  if(!Array.isArray(definitions)||!Array.isArray(frames)||!frames.length||new Set(frames.map(row=>row.id)).size!==frames.length)return unchanged
  if(definitions.some(row=>typeof row.id!=='string'||!Array.isArray(row.fields)||row.fields.some((field:any)=>typeof field.name!=='string'||typeof field.value!=='string')))return unchanged
  const resolved=new Map<string,{reference:string;definition:any}>()
  for(const frame of frames){
    const reference=frame.dataReference
    if(reference===null||reference===undefined)continue
    if(typeof frame.id!=='string'||typeof reference!=='string'||!reference.trim())return unchanged
    const matches=definitions.filter(row=>row.id===reference.trim())
    if(matches.length!==1)return unchanged // missing/ambiguous names never guess values
    resolved.set(frame.id,{reference,definition:matches[0]})
  }
  const aliases:any[]=[],referenceMetadata:any[]=[]
  facts.frames=frames.map(frame=>{
    const own=resolved.get(frame.id)
    if(!own)return frame
    const{dataReference,...visible}=frame
    referenceMetadata.push({frame:frame.id,reference:dataReference,definition:own.definition.id,supersededInlineFields:frame.fields??[]})
    return{...visible,fields:structuredClone(own.definition.fields)}
  })
  if(Array.isArray(facts['frame-content']))facts['frame-content']=facts['frame-content'].map((frame:any)=>{
    const own=resolved.get(frame.id)
    if(!own)return frame
    const{dataReference,data,fields,...visible}=frame
    const original:Record<string,MeaningJson>={frame:frame.id}
    for(const key of ['dataReference','data','fields'])if(Object.hasOwn(frame,key))original[key]=frame[key]
    aliases.push(original)
    return{...visible,fields:structuredClone(own.definition.fields)}
  })
  const declarationLabels=new Set<string>(definitions.flatMap(row=>[row.id,...row.fields.flatMap((field:any)=>[field.name,field.value])]))
  for(const row of referenceMetadata){declarationLabels.add(row.reference);for(const field of row.supersededInlineFields)for(const value of [field.name,field.value])declarationLabels.add(value)}
  const requiredLabels=new Set<string>([
    ...(expected.nodes??[]).map(row=>row.label),...(expected.groups??[]).map(row=>row.label),...(expected.edges??[]).flatMap(row=>row.label?[row.label]:[]),...(typeof facts.title==='string'?[facts.title]:[]),
    ...facts.frames.flatMap((row:any)=>[row.label,...(row.fields??[]).flatMap((field:any)=>[field.name,field.value])]),
  ])
  expected.labels=expected.labels.filter(label=>!declarationLabels.has(label)||requiredLabels.has(label))
  for(const label of requiredLabels)if(label&&!expected.labels.includes(label))expected.labels.push(label)
  const advisory=expected.advisoryFacts??={}
  advisory['native-event-data-definitions']=definitions
  if(referenceMetadata.length)advisory['event-reference-resolution']=referenceMetadata
  if(aliases.length)advisory['native-event-frame-data']=aliases
  delete facts['data-definitions']
  return{changed:true,projections:['Event data declarations/reference IDs remain exact native/advisory IR; resolved used field names/values are required on their particular frames. A resolved reference replaces inline data per the pinned public grammar/action; unused definitions have no painted-record obligation.'],excluded:['Nonvisual Event data declarations and reference identities (eventmodeling.md96-156;eventmodeling.langium28-31;db.ts348-376): '+JSON.stringify({definitions,references:referenceMetadata})]}
}
