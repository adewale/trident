import type {MeaningExpectation,MeaningJson} from './meaning.ts'

export interface EventNamespacePresentation {id:string;entityIdentifier:string;displayLabel:string;namespace:string;entityType:string}
const eventTypes:Record<string,string>={ui:'ui',pcr:'processor',processor:'processor',cmd:'command',command:'command',evt:'event',event:'event',rmo:'read-model',readmodel:'read-model','read-model':'read-model'}

/** A source identity/history remains complete native data even when no unique
 * printed token or traversal can encode it. This allowlist does not demote any
 * other ordering requirement. Event namespace identities remain required as a
 * composite of a particular frame caption and its owned typed namespace row. */
export function projectSourceMetadata(family:string,expected:MeaningExpectation){
  const facts:any=expected.facts??={},projections:string[]=[],excluded:string[]=[],metadata:Record<string,MeaningJson>={}
  const keys=family==='gitgraph'?['git-operation-order']:['railroad','railroad-abnf','railroad-ebnf','railroad-peg'].includes(family)?['grammar-dialect']:family==='mindmap'?['tree-order']:[]
  for(const key of keys)if(Object.hasOwn(facts,key)){
    metadata[key]=facts[key];delete facts[key]
    excluded.push('Raw '+key+' is source/native identity or history without a unique printed inverse; its complete ordered commits/parents/branch order,grammar AST or rooted hierarchy remains required: '+JSON.stringify(metadata[key]))
  }
  if(Object.keys(metadata).length)projections.push('Only Git operation history,railroad grammar dialect and mindmap DFS traversal are advisory/native identities; all visible topology,chronology,ownership and recursive grammar semantics remain required')
  if(family==='gitgraph'&&Array.isArray(facts.commits)){
    const selected:MeaningJson[]=[]
    facts.commits=facts.commits.map((commit:any)=>{
      if(commit.type!=='CHERRY_PICK'||!Object.hasOwn(commit,'cherryPickParent'))return commit
      const{cherryPickParent,...visible}=commit
      selected.push({id:commit.id,parent:cherryPickParent})
      return visible
    })
    if(selected.length){
      metadata['cherry-pick-selected-parents']=selected
      excluded.push('A cherry-pick selected merge parent validates the operation but has no mandatory drawn DAG/caption encoding: gitgraph.md241 promises the cherry glyph and source-ID tag;244-250 validates the parent;gitGraphAst.ts350 uses current head/source parents independently and356-358 only adds parent to a generated default tag. Exact selected parent remains native/advisory: '+JSON.stringify(selected))
      projections.push('Cherry-pick selected merge parent stays exact native/advisory input; cherry type,source provenance,current-branch parent,source-ID tag and every authored tag remain required visible facts')
    }
  }
  if(family.startsWith('railroad')&&Array.isArray(facts['grammar-rules'])){
    const blanks:MeaningJson[]=[]
    const project=(node:any,rule:string,path:(string|number)[]):any=>{
      if(!node||typeof node!=='object'||Array.isArray(node))return node
      if(node.kind==='terminal'&&typeof node.value==='string'&&/^ +$/.test(node.value)&&Object.keys(node).every(key=>['kind','value'].includes(key))){blanks.push({rule,path,value:node.value});return{kind:'blank-terminal'}}
      if(Array.isArray(node.items))return{...node,items:node.items.map((item:any,index:number)=>project(item,rule,[...path,'items',index]))}
      if(node.expression)return{...node,expression:project(node.expression,rule,[...path,'expression'])}
      return node
    }
    facts['grammar-rules']=facts['grammar-rules'].map((rule:any)=>({...rule,expression:project(rule.expression,rule.name,[])}))
    if(blanks.length){
      metadata['blank-terminal-source-values']=blanks
      expected.labels=expected.labels.filter(label=>!/^ +$/.test(label))
      excluded.push('Pure ASCII-space terminal values have no count-specific printed ink. A required blank-terminal leaf retains its rounded body, exact recursive AST position and physical path ownership; exact string/count remains native/advisory (railroad.md40,58-60,286;railroadRenderer.ts98-125 text(value) with SVG default whitespace): '+JSON.stringify(blanks))
      projections.push('Pure-space terminals require an owned blank rounded terminal at the exact recursive grammar position, without an invisible character-count obligation; exact source values remain complete native/advisory data')
    }
  }
  if(Object.keys(metadata).length){
    (expected.advisoryFacts??={})['unprinted-source-identities']=metadata
    if(Object.hasOwn(metadata,'cherry-pick-selected-parents')||Object.hasOwn(metadata,'blank-terminal-source-values')){
      const index=projections.findIndex(value=>value.startsWith('Only Git operation history,'))
      if(index>=0)projections[index]='The enumerated source history,dialect and selected-parent or blank-terminal values remain native/advisory; all visible topology,chronology,ownership and recursive grammar structure remain required'
    }
  }
  const presentations=new Map<string,EventNamespacePresentation>()
  if(family==='eventmodeling'){
    const capture=(id:unknown,identifier:unknown,type:unknown)=>{
      if(typeof id!=='string'||typeof identifier!=='string'||typeof type!=='string'||!Object.hasOwn(eventTypes,type))return
      const parts=identifier.split('.')
      // Pinned db.extractName/extractNamespace specify exactly two parts.
      // Multi-dot names and empty segments remain literal, never guessed.
      if(parts.length!==2||!parts[0]||!parts[1])return
      const row={id,entityIdentifier:identifier,displayLabel:parts[1],namespace:parts[0],entityType:eventTypes[type]!},prior=presentations.get(id)
      if(prior&&JSON.stringify(prior)!==JSON.stringify(row))throw Error('Conflicting source-qualified event identity for frame '+id)
      presentations.set(id,row)
    }
    for(const row of Array.isArray(facts.frames)?facts.frames:[])capture(row.id,row.label,row.kind)
    for(const row of Array.isArray(facts['frame-content'])?facts['frame-content']:[])capture(row.id,row.entity,row.entityType)
    if(presentations.size){
      const qualified=new Set([...presentations.values()].map(row=>row.entityIdentifier)),protectedLabels=new Set<string>([
        ...(expected.nodes??[]).filter(node=>node.label!==presentations.get(node.id)?.entityIdentifier).map(node=>node.label),
        ...(expected.groups??[]).map(group=>group.label),...(expected.edges??[]).flatMap(edge=>edge.label?[edge.label]:[]),...(typeof facts.title==='string'?[facts.title]:[]),
      ])
      for(const entry of [...(Array.isArray(facts.frames)?facts.frames:[]),...(Array.isArray(facts['data-definitions'])?facts['data-definitions']:[])])for(const field of entry.fields??[])for(const value of [field.name,field.value])if(typeof value==='string')protectedLabels.add(value)
      expected.labels=expected.labels.filter(label=>!qualified.has(label)||protectedLabels.has(label))
      for(const row of presentations.values())if(!expected.labels.includes(row.displayLabel))expected.labels.push(row.displayLabel)
      if(expected.nodes)expected.nodes=expected.nodes.map(node=>{const row=presentations.get(node.id);return row&&node.label===row.entityIdentifier?{...node,label:row.displayLabel}:node})
      for(const key of ['frames','frame-content'])if(Array.isArray(facts[key]))facts[key]=facts[key].map((entry:any)=>{const row=presentations.get(entry.id);return row?{...entry,displayLabel:row.displayLabel,namespace:row.namespace}:entry})
      facts['event-namespace-presentation']=[...presentations.values()]
      ;(expected.advisoryFacts??={})['event-qualified-source-identities']=[...presentations.values()] as unknown as MeaningJson
      excluded.push('Exactly two-part event entity identifiers print basename in the owned frame and namespace in its typed row; full qualified identity remains a required composite, not a second literal standalone glyph (eventmodeling.md274,284-299;db.ts189-203,237-286,336): '+JSON.stringify([...presentations.values()]))
      projections.push('Event namespace presentation preserves every qualified identity,entity type,frame order,data value,reset/source relation and namespace-row ownership; only a duplicate request to print the full qualified name inside the frame is removed')
    }
  }
  return{changed:Object.keys(metadata).length>0||presentations.size>0,projections,excluded}
}
