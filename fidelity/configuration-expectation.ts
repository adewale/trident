import type {MeaningExpectation,MeaningJson} from './meaning.ts'
import {sourceThemePalette,reduxUsecaseSourcePolicy,type SourceThemeName} from './theme-source-policy.ts'

export interface SourceThemePaintRole {
  owner:string
  kind:string
  sourceOrdinal?:number
  fill?:string
  foreground?:string
  stroke?:string
  fillOpacity?:number
  strokeOpacity?:number
  strokeWidth?:number
  brightness?:number
}
export interface SourceThemePaint {theme:string;family:string;quantizationTolerancePerChannel:number;roles:SourceThemePaintRole[]}
const named=new Set(['base','default','forest','dark','neutral'])

/** Source configuration names select a policy; their spelling is not painted.
 * All concrete unprojected settings remain required. This module consumes only
 * documented identifiers and independently transcribed, owned palette effects.
 * Unsupported themes/variables stay in authored-config and cannot earn credit.
 */
export function projectSourceConfiguration(family:string,expected:MeaningExpectation){
  const facts:any=expected.facts??={},config:any=facts['authored-config'],advisory:Record<string,MeaningJson>={},projections:string[]=[],excluded:string[]=[]
  const requestedLook=config?.look
  const retain=(path:string,value:MeaningJson,reason:string)=>{advisory[path]=structuredClone(value);excluded.push(reason+': '+path+'='+JSON.stringify(value))}
  if(config){
    for(const key of ['layout','look','htmlLabels'])if(Object.hasOwn(config,key)&&(key!=='look'||config.look==='classic')){
      retain(key,config[key],'Engine/look/DOM implementation identity is source/native provenance; owned topology,labels,shapes and every concrete metric/paint setting remain required')
      delete config[key]
    }
  }
  // Algorithm identity has no unique inverse from a finite drawing. The
  // group's owned enclosure/membership remains independently required.
  if(family==='agentflow'&&Array.isArray(facts['node-attributes'])){
    facts['node-attributes']=facts['node-attributes'].map((entry:any)=>{
      const attributes={...entry.attributes}
      if(Object.hasOwn(attributes,'algorithm')){retain('node:'+entry.id+'.algorithm',attributes.algorithm,'Layout algorithm identifier remains native/advisory; no backend-name inference from one drawing');delete attributes.algorithm}
      return{...entry,attributes}
    }).filter((entry:any)=>Object.keys(entry.attributes).length)
    if(!facts['node-attributes'].length)delete facts['node-attributes']
  }
  const theme=config?.theme,variables:Record<string,string>=config?.themeVariables??{},roles:SourceThemePaintRole[]=[],consumed=new Set<string>()
  const token=(key:string)=>{if(Object.hasOwn(variables,key)){consumed.add(key);retain('themeVariables.'+key,variables[key]!,'Literal theme token is retained with its concrete owned paint projection')}}
  let paint:SourceThemePaint|undefined
  if(named.has(theme)){
    const palette=sourceThemePalette(theme as SourceThemeName,variables)
    if(family==='timeline'&&Array.isArray(facts.periods)){
      const sections:string[]=facts.sections??[],monochrome=config.timeline?.disableMulticolor===true
      for(const[index,period]of facts.periods.entries()){
        const ordinal=monochrome?0:sections.length?sections.indexOf(period.section):index,slot=((ordinal%7)+7)%7,color=palette.scale[slot]!
        roles.push({owner:period.period,kind:'period',sourceOrdinal:index,fill:color.hex,foreground:color.foreground})
        for(const[eventIndex,event]of period.events.entries())roles.push({owner:event,kind:'event',sourceOrdinal:facts.periods.slice(0,index).reduce((sum:number,row:any)=>sum+row.events.length,0)+eventIndex,fill:color.hex,foreground:color.foreground,brightness:palette.eventBrightness})
      }
      for(const[index,section]of sections.entries()){const slot=monochrome?0:index%7,color=palette.scale[slot]!;roles.push({owner:section,kind:'section',sourceOrdinal:index,fill:color.hex,foreground:color.foreground})}
      for(const key of Object.keys(variables))if(/^cScale(?:Label)?\d+$/.test(key))token(key)
      if(config.timeline&&Object.hasOwn(config.timeline,'disableMulticolor')){retain('timeline.disableMulticolor',config.timeline.disableMulticolor,'Timeline color selection is required by each exact owned role');delete config.timeline.disableMulticolor;if(!Object.keys(config.timeline).length)delete config.timeline}
    }else if(family==='treemap'&&Array.isArray(facts.hierarchy)){
      const hierarchy:any[]=facts.hierarchy,parents=new Set(hierarchy.map(row=>row.parent).filter(Boolean)),sections=hierarchy.filter(row=>parents.has(row.id))
      // Canonical themed case is two sibling sections and their leaves. More
      // deeply nested palettes remain unprojected until independently audited.
      if(sections.every(row=>!row.parent)&&sections.length<=7){
        // The pinned palette traversal follows stable descending aggregate
        // subtree value, not the literal declaration order (renderer.ts144–147).
        // Sibling fractions preserve that order without inventing raw totals.
        const weights=new Map((facts.values??[]).map((row:any)=>[row.id,Number(row.value)])),ordered=sections.map((row,index)=>({...row,sourceOrdinal:index})).sort((a,b)=>Number(weights.get(b.id)??0)-Number(weights.get(a.id)??0)||a.sourceOrdinal-b.sourceOrdinal)
        const slots=new Map(ordered.map((row,index)=>[row.id,index]))
        for(const[index,row]of hierarchy.entries()){
          const section=parents.has(row.id),slot=slots.get(section?row.id:row.parent),color=slot===undefined?undefined:palette.scale[slot]
          if(!color)continue
          roles.push({owner:row.id,kind:section?'section':'leaf',sourceOrdinal:index,fill:color.hex,foreground:color.foreground,fillOpacity:section?0.6:0.3,...(section?{stroke:color.peer,strokeWidth:2,strokeOpacity:0.4}:{stroke:color.hex,strokeWidth:3})})
        }
        for(const key of Object.keys(variables))if(/^cScale(?:Label)?\d+$/.test(key))token(key)
      }
    }else if(family==='mindmap'&&config.mindmap?.colorBy==='depth'&&Array.isArray(facts.hierarchy)){
      const hierarchy:any[]=facts.hierarchy,byId=new Map(hierarchy.map(row=>[row.id,row])),depth=(id:string,seen=new Set<string>()):number=>{if(seen.has(id))throw Error('Cyclic source mindmap hierarchy');seen.add(id);const row=byId.get(id);return row?.parent?1+depth(row.parent,seen):0}
      // The explicit pinned documentation describes classic depth colors:
      // root git0; depths1..11 cScale1..11; child-owned edge color.
      const depths=hierarchy.map(row=>depth(row.id))
      if(depths.every(value=>value<=6)&&!String(requestedLook??'classic').toLowerCase().includes('neo')){
        for(const[index,row]of hierarchy.entries()){
          const level=depths[index]!,color=level===0?palette.git[0]!:palette.scale[level]!
          roles.push({owner:row.id,kind:'node',sourceOrdinal:index,fill:color.hex,foreground:color.foreground})
          if(row.parent)roles.push({owner:row.parent+'->'+row.id,kind:'edge',stroke:color.hex})
        }
        for(const key of Object.keys(variables))if(/^(?:git0|gitBranchLabel0|cScale(?:Label)?\d+)$/.test(key))token(key)
        retain('mindmap.colorBy',config.mindmap.colorBy,'Documented depth colors and child-edge paint are projected to exact node/path owners');delete config.mindmap.colorBy;if(!Object.keys(config.mindmap).length)delete config.mindmap
      }
    }else if(family==='radar'&&Array.isArray(facts.curves)){
      const radarVariables:any=variables.radar??{},opacity=radarVariables.curveOpacity
      for(const[index,curve]of facts.curves.entries()){
        const color=palette.scale[index%7]!
        roles.push({owner:curve.id,kind:'curve',sourceOrdinal:index,fill:color.hex,stroke:color.hex,...(typeof opacity==='number'?{fillOpacity:opacity}:{})})
      }
      for(const key of Object.keys(variables))if(/^cScale\d+$/.test(key))token(key)
      if(typeof opacity==='number'){retain('themeVariables.radar.curveOpacity',opacity,'Radar curve and legend fill opacity is a concrete owned paint obligation');delete radarVariables.curveOpacity;if(!Object.keys(radarVariables).length)delete (variables as any).radar}
    }else if(family==='gitgraph'&&Array.isArray(facts.branches)&&Array.isArray(facts.commits)){
      // Pinned public branch-order rule: explicit order wins, otherwise the
      // declaration ordinal is 0.ordinal; stable ascending order assigns lanes.
      const branches=facts.branches.map((row:any,index:number)=>({...row,paletteOrder:row.order??Number('0.'+index)})).sort((a:any,b:any)=>a.paletteOrder-b.paletteOrder)
      for(const[index,branch]of branches.entries()){
        const slot=index%8,color=palette.git[slot]!
        if(config.gitGraph?.showBranches!==false)roles.push({owner:branch.id,kind:'branch',sourceOrdinal:index,fill:color.hex,foreground:color.foreground})
        for(const commit of facts.commits.filter((row:any)=>row.branch===branch.id&&row.type==='NORMAL'&&!row.mergedBranch))roles.push({owner:commit.id,kind:'commit',fill:color.hex,stroke:color.hex})
      }
      // gitInv / special inner glyph and commit/tag-label requests remain in
      // authored-config. They are never credited from normal marker paint.
      for(const key of Object.keys(variables))if(/^(?:git\d+|gitBranchLabel\d+)$/.test(key))token(key)
    }
    if(roles.length)paint={theme,family,quantizationTolerancePerChannel:palette.quantizationTolerancePerChannel,roles}
  }else if(theme==='redux-color'&&family==='usecase'){
    const policy=reduxUsecaseSourcePolicy,kinds:any[]=facts['dialect-kinds']??[],actors=(expected.nodes??[]).filter(node=>kinds.some(row=>row.id===node.id&&row.kind==='actor')),usecases=(expected.nodes??[]).filter(node=>!actors.some(actor=>actor.id===node.id)),rotate=config.usecase?.colorScheme==='rotate'
    for(const[index,node]of [...actors,...usecases].entries()){
      const kind=actors.some(actor=>actor.id===node.id)?'actor':'usecase',color=rotate?policy.rotation[index%policy.rotation.length]!:policy.role[kind]
      roles.push({owner:node.id,kind,sourceOrdinal:index,fill:color.fill,stroke:color.stroke,foreground:policy.foreground,strokeWidth:2})
    }
    for(const[index,group]of(expected.groups??[]).entries()){const color=policy.rotation[index%policy.rotation.length]!;roles.push({owner:group.id,kind:'boundary',sourceOrdinal:index,fill:color.fill,stroke:color.stroke,foreground:policy.boundaryTitle,strokeWidth:1})}
    for(const row of kinds)if(['include','extend'].includes(row.kind))roles.push({owner:row.source+'->'+row.target,kind:row.kind,stroke:policy.role[row.kind as 'include'|'extend']})
    paint={theme,family,quantizationTolerancePerChannel:1,roles}
    if(config.usecase&&Object.hasOwn(config.usecase,'colorScheme')){retain('usecase.colorScheme',config.usecase.colorScheme,'Usecase role/rotation scheme is projected to each exact owner paint');delete config.usecase.colorScheme;if(!Object.keys(config.usecase).length)delete config.usecase}
  }
  if(config&&Object.hasOwn(config,'theme')&&(paint||theme==='default')){
    retain('theme',theme,paint?'Named theme spelling is advisory; exact source-derived owned colors remain required in theme-paint':'Default theme identity is advisory; cross-renderer cosmetic defaults are not an inverse engine/theme-name claim')
    delete config.theme
  }
  for(const key of consumed)delete variables[key]
  if(config?.themeVariables&&!Object.keys(variables).length)delete config.themeVariables
  if(config&&!Object.keys(config).length)delete facts['authored-config']
  if(paint)facts['theme-paint']=paint
  if(Object.keys(advisory).length){(expected.advisoryFacts??={})['configuration-identifiers-and-tokens']=advisory;projections.push('Configuration identities are preserved as exact source/native metadata; named themes compile to finite semantic-owner paint effects from independently transcribed pinned literals/formulas. All remaining concrete configuration is required unchanged')}
  return{changed:Object.keys(advisory).length>0,projections,excluded}
}
