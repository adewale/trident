import type { MeaningExpectation } from './meaning.ts'
import { compileVisualStyles } from './style-expectation.ts'
import { projectSourceConfiguration } from './configuration-expectation.ts'
import { projectSourceMetadata } from './source-metadata-expectation.ts'
import { projectEventData } from './event-data-expectation.ts'
import { projectSourceEdgePattern } from './edge-pattern-expectation.ts'

/** Standalone source cannot supply absent host CSS or a unique inverse for a
 * layout-engine input. Keep those exact inputs natively, without inventing
 * pixel anchors, CSS repairs, or literal text for a typed priority enum. */
function projectStandaloneInputs(family: string, expected: MeaningExpectation, projections: string[], excluded: string[], suppliedStyles: any[]) {
  const facts: any = expected.facts ?? {}, config = facts['authored-config'], retained: Record<string, any> = {}
  const retain = (key: string, value: any, reason: string) => { retained[key] = structuredClone(value); excluded.push(reason + ': ' + key + '=' + JSON.stringify(value)) }
  if (family === 'agentflow' || family === 'usecase') {
    const settings = config?.[family]
    for (const key of ['nodeSpacing', 'rankSpacing']) if (settings && Object.hasOwn(settings, key)) {
      retain(family + '.' + key, settings[key], 'Documented same/different-level layout input has no specified clear-gap, centre-distance, pixel unit or anchor equation (agentflow.md327-328/usecase.md472-473; config.schema.yaml2464-2479/3008-3017)')
      delete settings[key]
    }
    if (settings && !Object.keys(settings).length) delete config[family]
  }
  if (family === 'quadrant' && typeof config?.themeVariables?.quadrant1TextFill === 'string' && /^[\da-f]{6}$/i.test(config.themeVariables.quadrant1TextFill)) {
    retain('themeVariables.quadrant1TextFill', config.themeVariables.quadrant1TextFill, 'Bare six-digit hexadecimal is invalid CSS paint, passed verbatim to SVG fill; no missing # is repaired and no fallback skin is required (quadrantChart.md129; quadrantDb131,quadrantBuilder393,quadrantRenderer116)')
    delete config.themeVariables.quadrant1TextFill
    if (!Object.keys(config.themeVariables).length) delete config.themeVariables
  }
  if (config && !Object.keys(config).length) delete facts['authored-config']
  if (family === 'mindmap' && Array.isArray(facts.decorations)) {
    // Any supplied matching definition remains a required style obligation.
    // Icons/annotations and treeView's built-in classes are untouched.
    const definitions = new Set(suppliedStyles.filter((row: any) => row.kind === 'classDef').flatMap((row: any) => String(row.selection).split(/[\s,]+/)))
    facts.decorations = facts.decorations.filter((row: any) => {
      if (typeof row.decoration !== 'string' || !/^:::\s*[\w-]+(?:\s+[\w-]+)*$/.test(row.decoration) || row.decoration.slice(3).trim().split(/\s+/).some((name: string) => definitions.has(name))) return true
      retain('mindmap.hostClasses.' + row.id, row.decoration, 'Mindmap classes require site-administrator CSS, absent from this standalone source (mindmap.md194-205)')
      return false
    })
    if (!facts.decorations.length) delete facts.decorations
  }
  if (family === 'kanban' && Array.isArray(facts.columns)) {
    const protectedLabels = new Set([...(expected.nodes ?? []).map(node => node.label), ...(expected.groups ?? []).map(group => group.label), ...(expected.edges ?? []).flatMap(edge => edge.label ? [edge.label] : []), ...(typeof facts.title === 'string' ? [facts.title] : [])])
    const priorities = new Set<string>()
    for (const column of facts.columns) {
      protectedLabels.add(column.label)
      for (const task of column.tasks ?? []) {
        protectedLabels.add(task.label)
        for (const [key, value] of Object.entries(task.attributes ?? {})) if (key !== 'priority' && typeof value === 'string') protectedLabels.add(value)
        if (['Very High', 'High', 'Low', 'Very Low'].includes(task.attributes?.priority)) priorities.add(task.attributes.priority)
      }
    }
    const labels = expected.labels.filter(label => !priorities.has(label) || protectedLabels.has(label))
    if (labels.length !== expected.labels.length) {
      expected.labels = labels
      retain('kanban.priorityPresentation', [...priorities], 'Task-owned priority remains required metadata; the documented enum need not be printed as a duplicate literal caption (kanban.md51-57)')
    }
  }
  if (!Object.keys(retained).length) return false
  ;(expected.advisoryFacts ??= {})['standalone-input-provenance'] = retained
  projections.push('Standalone inputs retain exact native/advisory provenance without invented geometry, unavailable host CSS or invalid CSS repair; every meaningful owned visual fact remains required, including task priority semantics')
  return true
}

/** A drawing encodes proportions and printed values, not an invisible copy of
 * its input database. Literal source bytes remain in the corpus inventory. */
export function projectVisualExpectation(family: string, literal: MeaningExpectation): { expected: MeaningExpectation; projections: string[]; profileExpected?:MeaningExpectation; excludedNonvisual?:string[] } {
  const expected = structuredClone(literal), facts: any = expected.facts ??= {}, projections: string[] = []
  let profileExpected:MeaningExpectation|undefined
  const excludedNonvisual:string[]=[]
  if(family==='eventmodeling'){const dataProjection=projectEventData(expected);if(dataProjection.changed){profileExpected=structuredClone(literal);projections.push(...dataProjection.projections);excludedNonvisual.push(...dataProjection.excluded)}}
  const sourceMetadata=projectSourceMetadata(family,expected)
  if(sourceMetadata.changed){profileExpected=structuredClone(literal);projections.push(...sourceMetadata.projections);excludedNonvisual.push(...sourceMetadata.excluded)}
  if(family==='flowchart'&&Array.isArray(facts['node-shapes'])){
    const glyphs=new Set(['sm-circ','start','small-circle','fr-circ','stop','framed-circle','fork','join','hourglass','collate','bolt','com-link','lightning-bolt','f-circ','junction','filled-circle','cross-circ','summary','crossed-circle'])
    const symbols:any[]=facts['node-shapes'].filter((row:any)=>glyphs.has(row.shape)),symbolIds=new Set(symbols.map(row=>row.id)),nativeLabels=(expected.nodes??[]).filter(node=>symbolIds.has(node.id)).map(node=>({id:node.id,label:node.label,shape:symbols.find(row=>row.id===node.id)!.shape}))
    if(nativeLabels.length){
      profileExpected=structuredClone(literal)
      const protectedLabels=new Set([...(expected.nodes??[]).filter(node=>!symbolIds.has(node.id)).map(node=>node.label),...(expected.groups??[]).map(group=>group.label),...(expected.edges??[]).flatMap(edge=>edge.label?[edge.label]:[]),...(typeof facts.title==='string'?[facts.title]:[])])
      const hidden=new Set(nativeLabels.map(row=>row.label));expected.labels=expected.labels.filter(label=>!hidden.has(label)||protectedLabels.has(label))
      expected.nodes=expected.nodes?.map(node=>symbolIds.has(node.id)?{...node,label:''}:node)
      if(Array.isArray(facts['node-attributes']))facts['node-attributes']=facts['node-attributes'].map((row:any)=>{if(!symbolIds.has(row.id))return row;const attributes={...row.attributes};delete attributes.label;return{...row,attributes}})
      if(Array.isArray(facts['text-line-breaks'])){facts['text-line-breaks']=facts['text-line-breaks'].filter((row:any)=>row.owner?.kind!=='node'||!symbolIds.has(row.owner.id));if(!facts['text-line-breaks'].length)delete facts['text-line-breaks']}
      facts['symbol-only-nodes']=symbols.map(row=>({id:row.id,shape:row.shape,labelPolicy:'unprinted',ownership:'unique-visible-glyph'}))
      ;(expected.advisoryFacts??={})['symbol-source-labels']=nativeLabels
      excludedNonvisual.push('Symbol-only glyph labels are retained source/native metadata; pinned shape handlers explicitly clear labels or draw fixed circle/bullseye glyphs without text (shapes.ts304-334,361-364,433-437,489-493; forkJoin14,hourglass11,lightningBolt12,filledCircle15,crossedCircle26; stateStart/stateEnd): '+JSON.stringify(nativeLabels))
      projections.push('Start,stop,fork,collate,communication-link,junction and summary glyphs encode semantic symbols without a painted caption; every node still requires unique actual glyph ownership and its exact shape,relationships and static styles')
    }
  }
  if(family==='gitgraph'&&Array.isArray(facts.commits)){
    const messages:any[]=[]
    facts.commits=facts.commits.map((entry:any)=>{if(!Object.hasOwn(entry,'message'))return entry;const{message,...visual}=entry;messages.push({id:entry.id,message});return visual})
    if(messages.length){profileExpected=structuredClone(literal);(expected.advisoryFacts??={})['nonvisual-commit-messages']=messages;excludedNonvisual.push('Git commit messages are carried native metadata distinct from displayed commit IDs/tags (gitGraphParser.ts50-57,gitGraph.spec.ts345-375,gitGraphRenderer.ts350/423): '+JSON.stringify(messages));projections.push('Git bare quoted commit messages remain exact owned advisory metadata and complete native profile facts; displayed custom id and tag text remain separate visible obligations')}
    if(Array.isArray(facts.branches)){
      const ownedBranches=new Set(facts.commits.map((commit:any)=>commit.branch)),heads:any[]=[]
      facts.branches=facts.branches.map((branch:any)=>{if(ownedBranches.has(branch.id)||!Object.hasOwn(branch,'head'))return branch;const{head,...visible}=branch;heads.push({id:branch.id,head});return visible})
      if(heads.length){profileExpected??=structuredClone(literal);(expected.advisoryFacts??={})['unprinted-empty-branch-heads']=heads;excludedNonvisual.push('A branch without an owned source commit has no displayed head/attachment glyph: branch creation carries the current DB head, but branch renderer consumes only name/order and lane ordinal (gitGraphAst.ts138-149,457-472; gitGraphRenderer.ts869-889,1010,1059-1075): '+JSON.stringify(heads));projections.push('Empty-branch head pointers remain exact native/advisory data; branch identities,labels,order,palette and all actual commit parents/merge routes remain required')}
    }
  }
  if(family==='wardley'&&Array.isArray(facts.pipelines)&&Array.isArray(facts.components)){
    const originals:any[]=[]
    facts.components=facts.components.map((component:any)=>{
      const pipeline=facts.pipelines.find((row:any)=>row.component===component.name)
      if(!pipeline||component.kind!=='component'||component.coordinates?.length!==2||!pipeline.members?.length||!pipeline.members.every((member:any)=>member.coordinates?.length===1))return component
      originals.push({name:component.name,coordinates:structuredClone(component.coordinates)})
      const{coordinates,...identity}=component
      return{...identity,kind:'pipeline-group',visibility:coordinates[0]}
    })
    if(originals.length){profileExpected??=structuredClone(literal);(expected.advisoryFacts??={})['pipeline-parent-native-coordinates']=originals;excludedNonvisual.push('Wardley pipeline parent is a range/header group sharing source visibility, not an additional evolution point; exact authored parent coordinates remain native/advisory (wardley.md230-232): '+JSON.stringify(originals));projections.push('Pipeline parent label and member range encode the group; visibility and every named member evolution remain required, while the parent original evolution coordinate is preserved without manufacturing a separate point glyph')}
  }
  if(family==='usecase'&&Array.isArray(facts['dialect-kinds'])){
    const metadata:any[]=[],hiddenPaths=new Set<string>(),visibleKeys=new Set<string>(),protectedLabels=new Set([...(expected.nodes??[]).map(node=>node.label),...(expected.groups??[]).map(group=>group.label),...(expected.edges??[]).flatMap(edge=>edge.label?[edge.label]:[]),...(typeof facts.title==='string'?[facts.title]:[])])
    for(const table of facts['dialect-kinds'].filter((entry:any)=>entry.kind==='json-table'&&Array.isArray(entry.rows))){
      // Brackets in an ordinary object key are literal text. Only independent
      // strict-JSON AST provenance can establish that a row came from an array.
      const rows:any[]=table.rows,arrays:any[]=Array.isArray(expected.advisoryFacts?.['json-scalar-array-source-structure'])?(expected.advisoryFacts!['json-scalar-array-source-structure'] as any[]).filter(row=>row.table===table.id):[]
      table.rows=rows.map((row,rowIndex)=>{
        protectedLabels.add(row.value)
        const array=arrays.find(array=>rowIndex>=array.rowStart&&rowIndex<array.rowStart+array.length)
        if(!array){protectedLabels.add(row.path);return row}
        const group=array.group,index=rowIndex-array.rowStart,displayKey=index===0?group:''
        if(row.path!==group+'['+index+']'||!['string','number','boolean','null'].includes(row.kind))throw Error('Source scalar-array row provenance contradicts literal JSON structure')
        hiddenPaths.add(row.path);if(displayKey)visibleKeys.add(displayKey)
        metadata.push({table:table.id,path:row.path,arrayGroup:group,arrayIndex:index})
        return{...row,displayKey,arrayGroup:group,arrayIndex:index}
      })
    }
    if(metadata.length){profileExpected??=structuredClone(literal);expected.labels=expected.labels.filter(label=>!hiddenPaths.has(label)||protectedLabels.has(label));for(const key of visibleKeys)if(!expected.labels.includes(key))expected.labels.push(key);(expected.advisoryFacts??={})['json-array-logical-paths']=metadata;excludedNonvisual.push('Scalar JSON arrays print one group key then ordered continuation rows; logical index paths remain source/native ownership metadata, not separate painted keys (usecase.md342,usecaseDb149-202,usecase.spec.ts1094-1105): '+JSON.stringify(metadata));projections.push('JSON table scalar arrays preserve exact ordered values and logical indices, with displayed parent key on the first row and blank continuation keys; object-array nested leaf paths remain visibly indexed')}
  }
  if(family==='agentflow'&&Array.isArray(facts['node-attributes'])){
    const actedOn=new Set(['shape','label','labelType','view','algorithm','curve','animate','animation']),metadata:any[]=[]
    facts['node-attributes']=facts['node-attributes'].map((entry:any)=>{
      const visual:Record<string,any>={},nonvisual:Record<string,any>={}
      for(const[key,value]of Object.entries(entry.attributes??{}))(actedOn.has(key)?visual:nonvisual)[key]=value
      if(Object.keys(nonvisual).length){metadata.push({id:entry.id,attributes:nonvisual});excludedNonvisual.push('Agentflow carried metadata is nonvisual (agentflow.md:14,250-260): '+JSON.stringify({id:entry.id,attributes:nonvisual}))}
      return{id:entry.id,attributes:visual}
    }).filter((entry:any)=>Object.keys(entry.attributes).length)
    if(!facts['node-attributes'].length)delete facts['node-attributes']
    if(metadata.length){profileExpected=structuredClone(literal);(expected.advisoryFacts??={})['nonvisual-node-metadata']=metadata;projections.push('Agentflow acts only on shape,label,labelType,view,algorithm,curve,animate,animation; other exact metadata keys/values remain advisory for static drawings and mandatory in the original native profileExpected')}
  }
  const configuration = facts['authored-config'] ?? {}
  const lineBreaks: any[] = Array.isArray(facts['text-line-breaks']) ? facts['text-line-breaks'] : []
  const addLineBreaks = (owner: Record<string, string | number>, label: string) => { const lines = label.replace(/<br\s*\/?\s*>/gi, '\n').split('\n'); if (lines.length < 2 || lineBreaks.some(entry => entry.owner?.kind === owner.kind && entry.owner?.id === owner.id && entry.owner?.index === owner.index)) return; lineBreaks.push({ owner, lines }) }
  for (const node of expected.nodes ?? []) addLineBreaks({ kind: family === 'sequence' ? 'participant' : 'node', id: node.id }, node.label)
  for (const [index, edge] of (expected.edges ?? []).entries()) if (edge.label) addLineBreaks({ kind: family === 'sequence' ? 'message' : 'edge', index }, edge.label)
  for (const group of expected.groups ?? []) addLineBreaks({ kind: 'group', id: group.id }, group.label)
  if (typeof facts.title === 'string') addLineBreaks({ kind: 'title' }, facts.title)
  if (lineBreaks.length) facts['text-line-breaks'] = lineBreaks
  if (family === 'class' && Array.isArray(facts.members)) {
    const signature = (value: string) => value.normalize('NFC').replace(/\s+/g, ' ').trim().replace(/\)\s*:\s*/g, ') ').replace(/\s*:\s*/g, ':')
    const members = new Set(facts.members.flatMap((entry: any) => entry.values.map((value: string) => signature(value))))
    const owned = new Set([...(expected.nodes ?? []).map(node => node.label), ...(expected.edges ?? []).flatMap(edge => edge.label ? [edge.label] : []), ...(expected.groups ?? []).map(group => group.label), ...(typeof facts.title === 'string' ? [facts.title] : [])].map(signature))
    const labels = expected.labels.filter(label => owned.has(signature(label)) || !members.has(signature(label)))
    if (labels.length !== expected.labels.length) { expected.labels = labels; projections.push('Class member signatures are checked as complete owned member facts; syntax punctuation is not a second literal display-label obligation') }
  }
  if (Object.hasOwn(facts, 'direction')) {
    const edges = expected.edges ?? [], nodes = expected.nodes ?? [], indegree = new Map(nodes.map(node => [node.id, 0])), outdegree = new Map(indegree)
    for (const edge of edges) { indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1); outdegree.set(edge.source, (outdegree.get(edge.source) ?? 0) + 1) }
    const roots = nodes.filter(node => indegree.get(node.id) === 0), visited = new Set<string>()
    let cursor = roots[0]?.id
    while (cursor && !visited.has(cursor)) { visited.add(cursor); cursor = edges.find(edge => edge.source === cursor)?.target }
    const chain = family === 'flowchart' && nodes.length > 1 && edges.length === nodes.length - 1 && roots.length === 1 && visited.size === nodes.length && [...indegree.values(), ...outdegree.values()].every(degree => degree <= 1) && !expected.groups?.length && !facts['layout-constraints']
    if (!chain) { (expected.advisoryFacts ??= {}).direction = facts.direction; delete facts.direction; projections.push('Literal global direction remains an advisory layout hint outside a connected simple flowchart chain without local groups/constraints; it does not impose invented per-edge precedence') }
  }
  for (const key of ['edge-length-requests', 'subgraph-direction-requests', 'group-directions']) if (Object.hasOwn(facts, key)) { (expected.advisoryFacts ??= {})[key] = facts[key]; delete facts[key]; projections.push('Literal ' + key + ' is retained as advisory layout intent; its own syntax does not establish a strict per-edge/rank obligation') }
  if (family === 'sequence' && Array.isArray(facts['message-order']) && Array.isArray(facts['message-style'])) {
    let unprinted = false
    facts['message-order'] = facts['message-order'].map((message: any, index: number) => { if (!['->', '-->'].includes(facts['message-style'][index])) return message; const [from, to] = [message.from, message.to].sort(); unprinted = true; return { ...message, from, to, direction: 'unprinted' } })
    if (unprinted) projections.push('Sequence messages without arrowheads encode unordered endpoint pairs, caption, chronology and solid/dotted stroke; literal sender/receiver remain in source/native data rather than invented visible direction')
  }
  if (family === 'pie' && Array.isArray(facts.slices) && facts['show-data'] !== true) {
    const total = facts.slices.reduce((sum: number, slice: any) => sum + slice.value, 0)
    if (total > 0 && facts.slices.every((slice: any) => Number.isFinite(slice.value) && slice.value >= 0)) {
      facts.slices = facts.slices.map((slice: any) => ({ ...slice, value: slice.value / total }))
      projections.push('Pie without showData encodes each labelled slice fraction; common rescaling of unprinted totals is visually equivalent')
    }
  }
  if (family === 'sankey' && Array.isArray(facts.links)) {
    const links = structuredClone(facts.links) as { source: string; target: string; value: number }[], settings = configuration.sankey ?? {}, total = links.reduce((sum, link) => sum + link.value, 0)
    facts['show-values'] = settings.showValues !== false
    if (facts['show-values']) {
      const ids = [...new Set(links.flatMap(link => [link.source, link.target]))]
      facts['displayed-node-values'] = ids.map(id => { const incoming = links.filter(link => link.target === id).reduce((sum, link) => sum + link.value, 0), outgoing = links.filter(link => link.source === id).reduce((sum, link) => sum + link.value, 0), value = Math.max(incoming, outgoing); return { id, value, display: String(settings.prefix ?? '') + String(Math.round(value * 100) / 100) + String(settings.suffix ?? '') } })
      projections.push('Sankey showValues defaults true at the pinned schema: print each node max(incoming,outgoing), rounded to two decimal places with configured prefix/suffix')
    }
    if (total > 0 && links.every(link => Number.isFinite(link.value) && link.value >= 0)) facts.links = links.map(link => ({ ...link, value: link.value / total }))
    delete expected.edges
    projections.push('Sankey link geometry encodes relative endpoint-owned flow widths and left-to-right source/target ownership, without manufactured arrowheads; hidden absolute link totals are not additional visible facts')
    for (const key of ['showValues', 'prefix', 'suffix']) delete settings[key]
    if (configuration.sankey && !Object.keys(settings).length) delete configuration.sankey
  }
  if (family === 'treemap' && Array.isArray(facts.values)) {
    const literalValues = structuredClone(facts.values) as { id: string; value: number }[], settings = configuration.treemap ?? {}, hierarchy: { id: string; parent: string }[] = facts.hierarchy ?? (expected.nodes ?? []).map(node => ({ id: node.id, parent: node.id.split('/').slice(0, -1).join('/') })), weights = new Map(literalValues.map(entry => [entry.id, entry.value]))
    facts['show-values'] = settings.showValues !== false
    const visiting = new Set<string>()
    const weight = (id: string): number => {
      if (weights.has(id)) return weights.get(id)!
      if (visiting.has(id)) return NaN
      visiting.add(id); const children = hierarchy.filter(entry => entry.parent === id), value = children.reduce((sum, child) => sum + weight(child.id), 0); visiting.delete(id); weights.set(id, value); return value
    }
    hierarchy.forEach(entry => weight(entry.id))
    facts.hierarchy ??= hierarchy
    if (facts['show-values']) facts['displayed-values'] = hierarchy.map(entry => ({ id: entry.id, value: weight(entry.id), format: settings.valueFormat ?? ',' }))
    const normalized = hierarchy.map(entry => { const siblings = hierarchy.filter(other => other.parent === entry.parent), total = siblings.reduce((sum, other) => sum + weight(other.id), 0); return { id: entry.id, value: total > 0 ? weight(entry.id) / total : NaN } })
    if (normalized.every(entry => Number.isFinite(entry.value) && entry.value >= 0)) facts.values = normalized
    // Native hierarchy edges remain in profileExpected. The visible encoding
    // is nested area, so no unrequested arrowhead obligation is manufactured.
    delete expected.edges
    for (const key of ['showValues', 'valueFormat']) delete settings[key]
    if (configuration.treemap && !Object.keys(settings).length) delete configuration.treemap
    projections.push('Treemap area encodes sibling weight fractions including independently derived subtree aggregates; showValues defaults true, so printed source values remain separate obligations unless explicitly disabled')
  }
  if (facts['authored-config'] && !Object.keys(configuration).length) delete facts['authored-config']
  const configProjection=projectSourceConfiguration(family,expected)
  if(configProjection.changed){profileExpected??=structuredClone(literal);projections.push(...configProjection.projections);excludedNonvisual.push(...configProjection.excluded)}
  const priorNativeEdgeProfile=profileExpected??structuredClone(expected),edgePattern=projectSourceEdgePattern(expected)
  if(edgePattern.changed){profileExpected??=priorNativeEdgeProfile;projections.push(...edgePattern.projections);excludedNonvisual.push(...edgePattern.excluded)}
  const styles = compileVisualStyles(expected)
  if (styles.active && styles.complete) projections.push('Known source class/default/inline selectors compile to concrete node fill, stroke, width and dash paint requests; source CSS class spelling is not an additional visible fact')
  const visual = styles.active && styles.complete ? styles.expected : expected, priorNative = profileExpected ?? structuredClone(visual)
  if (projectStandaloneInputs(family, visual, projections, excludedNonvisual, facts['authored-style'] ?? [])) profileExpected ??= priorNative
  return { expected: visual, projections,...(profileExpected?{profileExpected,excludedNonvisual}:{}) }
}
