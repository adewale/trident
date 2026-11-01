import type {MeaningExpectation,MeaningJson} from './meaning.ts'
import {sourceThemePalette,reduxUsecaseSourcePolicy,type SourceThemeName} from './theme-source-policy.ts'
import {compileVisualStyles} from './style-expectation.ts'

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
export interface SourceThemePaint {theme:string;family:string;quantizationTolerancePerChannel:number;comparison:'source-paint-tokens';roles:SourceThemePaintRole[];equalities?:{property:'fill';roleIndices:number[]}[]}
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
  const roleTokens=new Map<SourceThemePaintRole,Record<string,string>>(),addRole=(role:SourceThemePaintRole,tokens:Record<string,string>)=>{roles.push(role);roleTokens.set(role,tokens)}
  const stylePolicy=compileVisualStyles(expected),styleOverrides=new Map(stylePolicy.rules.map(rule=>[rule.id,rule.properties]))
  const equalities:{property:'fill';roleIndices:number[]}[]=[]
  // Theme constructors apply overrides before derived colors. A source base
  // variable we have not independently transcribed (primaryColor,darkMode,etc)
  // can change the entire palette, so adding default-derived colors would be
  // contradictory, even while retaining that unhandled variable as required.
  const classic=requestedLook===undefined||requestedLook==='classic',independentGitPaint=new Set(['commitLabelColor','commitLabelBackground','commitLabelFontSize','tagLabelColor','tagLabelBackground','tagLabelBorder','tagLabelFontSize'])
  const supportedOverrides=Object.keys(variables).every(key=>/^(?:cScale(?:Peer|Label)?\d+|git(?:Inv|BranchLabel)?\d+)$/.test(key)||family==='gitgraph'&&independentGitPaint.has(key)||family==='radar'&&key==='radar')&&!(family==='treemap'&&Object.keys(variables).some(key=>/^cScale\d+$/.test(key)))&&Object.entries(variables).every(([key,value])=>!/^(?:cScale(?:Peer)?\d+|git(?:Inv)?\d+)$/.test(key)||typeof value==='string'&&/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value))
  // The finite documented positive-order profile agrees with the pinned
  // decimal-ordinal action. Beyond ten branches or explicit nonpositive peer
  // orders, that implementation can diverge from documented definition order;
  // do not turn its quirk into an expected palette for an unqualified source.
  const supportedGitOrder=family!=='gitgraph'||!Array.isArray(facts.branches)||facts.branches.length<=10&&facts.branches.slice(1).every((branch:any)=>!Object.hasOwn(branch,'order')||Number.isInteger(branch.order)&&branch.order>0)
  const token=(key:string)=>{if(Object.hasOwn(variables,key)){consumed.add(key);retain('themeVariables.'+key,variables[key]!,'Authored paint token is retained exactly; active documented owners keep its required paint and unexercised slots remain native provenance')}}
  let paint:SourceThemePaint|undefined
  if(named.has(theme)&&classic&&supportedOverrides&&supportedGitOrder&&stylePolicy.complete){
    const palette=sourceThemePalette(theme as SourceThemeName,variables)
    if(family==='timeline'&&Array.isArray(facts.periods)){
      const sections:string[]=facts.sections??[],monochrome=config.timeline?.disableMulticolor===true
      for(const[index,period]of facts.periods.entries()){
        const ordinal=monochrome?0:sections.length?sections.indexOf(period.section):index,slot=((ordinal%7)+7)%7,color=palette.scale[slot]!
        addRole({owner:period.period,kind:'period',sourceOrdinal:index,fill:color.hex,foreground:color.foreground},{fill:'cScale'+slot,foreground:'cScaleLabel'+slot})
        for(const[eventIndex,event]of period.events.entries())addRole({owner:event,kind:'event',sourceOrdinal:facts.periods.slice(0,index).reduce((sum:number,row:any)=>sum+row.events.length,0)+eventIndex,fill:color.hex,foreground:color.foreground},{fill:'cScale'+slot,foreground:'cScaleLabel'+slot})
      }
      for(const[index,section]of sections.entries()){const slot=monochrome?0:index%7,color=palette.scale[slot]!;addRole({owner:section,kind:'section',sourceOrdinal:index,fill:color.hex,foreground:color.foreground},{fill:'cScale'+slot,foreground:'cScaleLabel'+slot})}
      // A fully lowered owner style wins over the selected palette. An
      // unsupported style makes stylePolicy.complete false and leaves the
      // entire request required, rather than guessing its priority/effect.
      if(monochrome)for(const kind of ['period','event','section']){const indices=roles.flatMap((role,index)=>role.kind===kind&&!Object.hasOwn(styleOverrides.get(role.owner)??{},'fill')?[index]:[]);if(indices.length>1)equalities.push({property:'fill',roleIndices:indices})}
      for(const key of Object.keys(variables))if(/^cScale(?:Label)?\d+$/.test(key))token(key)
      if(config.timeline&&Object.hasOwn(config.timeline,'disableMulticolor')&&(theme!=='default'||equalities.length)){retain('timeline.disableMulticolor',config.timeline.disableMulticolor,'Timeline monochrome selection requires same-role owned paint equality, without imposing a renderer default palette');delete config.timeline.disableMulticolor;if(!Object.keys(config.timeline).length)delete config.timeline}
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
          addRole({owner:row.id,kind:section?'section':'leaf',sourceOrdinal:index,fill:color.hex,foreground:color.foreground,stroke:section?color.peer:color.hex},{fill:'cScale'+slot,foreground:'cScaleLabel'+slot,stroke:(section?'cScalePeer':'cScale')+slot})
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
          addRole({owner:row.id,kind:'node',sourceOrdinal:index,fill:color.hex,foreground:color.foreground},{fill:level===0?'git0':'cScale'+level,foreground:level===0?'gitBranchLabel0':'cScaleLabel'+level})
          if(row.parent)addRole({owner:row.parent+'->'+row.id,kind:'edge',stroke:color.hex},{stroke:'cScale'+level})
        }
        for(const key of Object.keys(variables))if(/^(?:git0|gitBranchLabel0|cScale(?:Label)?\d+)$/.test(key))token(key)
        if(theme!=='default'){retain('mindmap.colorBy',config.mindmap.colorBy,'Documented depth colors and child-edge paint are projected to exact node/path owners');delete config.mindmap.colorBy;if(!Object.keys(config.mindmap).length)delete config.mindmap}
      }
    }else if(family==='radar'&&Array.isArray(facts.curves)){
      const radarVariables:any=variables.radar??{},opacity=radarVariables.curveOpacity
      for(const[index,curve]of facts.curves.entries()){
        const color=palette.scale[index%7]!
        addRole({owner:curve.id,kind:'curve',sourceOrdinal:index,fill:color.hex,stroke:color.hex,...(typeof opacity==='number'?{fillOpacity:opacity}:{})},{fill:'cScale'+index%7,stroke:'cScale'+index%7,...(typeof opacity==='number'?{fillOpacity:'radar.curveOpacity'}:{})})
      }
      for(const key of Object.keys(variables))if(/^cScale\d+$/.test(key))token(key)
      if(typeof opacity==='number'){retain('themeVariables.radar.curveOpacity',opacity,'Radar curve and legend fill opacity is a concrete owned paint obligation');delete radarVariables.curveOpacity;if(!Object.keys(radarVariables).length)delete (variables as any).radar}
    }else if(family==='gitgraph'&&Array.isArray(facts.branches)&&Array.isArray(facts.commits)){
      // Pinned public branch-order rule: explicit order wins, otherwise the
      // declaration ordinal is 0.ordinal; stable ascending order assigns lanes.
      const branches=facts.branches.map((row:any,index:number)=>({...row,paletteOrder:row.order??Number('0.'+index)})).sort((a:any,b:any)=>a.paletteOrder-b.paletteOrder)
      for(const[index,branch]of branches.entries()){
        const slot=index%8,color=palette.git[slot]!
        if(config.gitGraph?.showBranches!==false)addRole({owner:branch.id,kind:'branch',sourceOrdinal:index,fill:color.hex,foreground:color.foreground},{fill:'git'+slot,foreground:'gitBranchLabel'+slot})
        for(const commit of facts.commits.filter((row:any)=>row.branch===branch.id&&row.type==='NORMAL'&&!row.mergedBranch))addRole({owner:commit.id,kind:'commit',fill:color.hex,stroke:color.hex},{fill:'git'+slot,stroke:'git'+slot})
      }
      // gitInv / special inner glyph and commit/tag-label requests remain in
      // authored-config. They are never credited from normal marker paint.
      for(const key of Object.keys(variables))if(/^(?:git\d+|gitBranchLabel\d+)$/.test(key))token(key)
    }
    if(roles.length)paint={theme,family,quantizationTolerancePerChannel:palette.quantizationTolerancePerChannel,comparison:'source-paint-tokens',roles}
  }else if(theme==='redux-color'&&family==='usecase'&&classic&&!Object.keys(variables).length&&stylePolicy.complete){
    const policy=reduxUsecaseSourcePolicy,kinds:any[]=facts['dialect-kinds']??[],actors=(expected.nodes??[]).filter(node=>kinds.some(row=>row.id===node.id&&row.kind==='actor')),usecases=(expected.nodes??[]).filter(node=>!actors.some(actor=>actor.id===node.id)),rotate=config.usecase?.colorScheme==='rotate'
    for(const[index,node]of [...actors,...usecases].entries()){
      const kind=actors.some(actor=>actor.id===node.id)?'actor':'usecase',color=rotate?policy.rotation[index%policy.rotation.length]!:policy.role[kind]
      roles.push({owner:node.id,kind,sourceOrdinal:index,fill:color.fill,stroke:color.stroke,foreground:policy.foreground})
    }
    for(const[index,group]of(expected.groups??[]).entries()){const color=policy.rotation[index%policy.rotation.length]!;roles.push({owner:group.id,kind:'boundary',sourceOrdinal:index,fill:color.fill,stroke:color.stroke,foreground:policy.boundaryTitle})}
    for(const row of kinds)if(['include','extend'].includes(row.kind))roles.push({owner:row.source+'->'+row.target,kind:row.kind,stroke:policy.role[row.kind as 'include'|'extend']})
    paint={theme,family,quantizationTolerancePerChannel:1,comparison:'source-paint-tokens',roles}
    if(config.usecase&&Object.hasOwn(config.usecase,'colorScheme')){retain('usecase.colorScheme',config.usecase.colorScheme,'Usecase role/rotation scheme is projected to each exact owner paint');delete config.usecase.colorScheme;if(!Object.keys(config.usecase).length)delete config.usecase}
  }
  if(paint){
    const requiredByEquality=new Set(equalities.flatMap(group=>group.roleIndices)),indices=new Map<number,number>()
    paint.roles=roles.flatMap((role,index)=>{
      const result={...role},bindings=roleTokens.get(role)??{},overrides=styleOverrides.get(role.owner)??{}
      for(const property of ['fill','stroke','foreground'] as const)if((theme==='default'&&(!bindings[property]||!Object.hasOwn(variables,bindings[property]!)))||Object.hasOwn(overrides,property==='foreground'?'color':property))delete result[property]
      if(!Object.keys(result).some(key=>['fill','stroke','foreground','fillOpacity','strokeOpacity','strokeWidth','brightness'].includes(key))&&!requiredByEquality.has(index))return[]
      indices.set(index,indices.size);return[result]
    })
    if(equalities.length)paint.equalities=equalities.map(group=>({property:group.property,roleIndices:group.roleIndices.map(index=>indices.get(index)!)}))
    if(!paint.roles.length)paint=undefined
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
