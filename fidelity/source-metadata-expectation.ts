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
    metadata[key]=structuredClone(facts[key]);delete facts[key]
    excluded.push('Raw '+key+' is source/native identity or history without a unique printed inverse; its complete ordered commits/parents/branch order,grammar AST or rooted hierarchy remains required: '+JSON.stringify(metadata[key]))
  }
  if(Object.keys(metadata).length){(expected.advisoryFacts??={})['unprinted-source-identities']=metadata;projections.push('Only Git operation history,railroad grammar dialect and mindmap DFS traversal are advisory/native identities; all visible topology,chronology,ownership and recursive grammar semantics remain required')}
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
