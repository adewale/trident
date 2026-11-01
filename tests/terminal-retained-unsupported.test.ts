import{expect,test}from'bun:test'
import registry from'../corpus/terminal-retained-unsupported.json'
import{terminalRetainedUnsupported}from'../unified/terminal-unsupported.ts'
import{terminalProfileCorpus}from'../fidelity/terminal-active-corpus.ts'
import{assessTerminalRecord}from'../unified/terminal-profile.ts'
const corpus=terminalProfileCorpus(),source=(id:string)=>corpus.cases.find(c=>c.id===id)!,copy=(entry:typeof registry.original.entries[number])=>({...entry.row,collectionId:'original-120',originalRawSha256:registry.original.rawSha256,originalProducerSource:registry.original.producer}),record=(entry:typeof registry.original.entries[number])=>({collections:[{rawSha256:registry.original.rawSha256,source:registry.original.producer}],transportObservations:[entry.transport]})
test('all37 legacy and one journal-owned actual unsupported inputs retain exact source/artifact/error ownership',()=>{
 for(const entry of registry.original.entries){const input=source(entry.row.caseId);expect(terminalRetainedUnsupported(record(entry),input,registry.owner,copy(entry))?.status).toBe('unsupported')}
 const entry=registry.adaptation
 expect(terminalRetainedUnsupported({transportObservations:[entry.transport]},source(entry.row.caseId),registry.owner,entry.row)?.status).toBe('unsupported')
 expect(registry.original.entries).toHaveLength(37);expect(entry.frames.map(f=>f.state).sort()).toEqual(['public-error','started'])
})
test('host failures, source edits, forged ownership and invalid grammar controls get no unsupported admission',()=>{
 const entry=registry.original.entries[0]!,input=source(entry.row.caseId),row=copy(entry),raw=record(entry)
 expect(terminalRetainedUnsupported(raw,input,{...registry.owner,artifact:{...registry.owner.artifact,sha256:'0'.repeat(64)}},row)).toBeUndefined()
 expect(terminalRetainedUnsupported(raw,input,{...registry.owner,artifact:{...registry.owner.artifact,input:'file'}},row)).toBeUndefined()
 expect(terminalRetainedUnsupported(raw,{...input,source:input.source+' '},registry.owner,row)).toBeUndefined()
 expect(terminalRetainedUnsupported(raw,{...input,intent:'invalid'},registry.owner,row)).toBeUndefined()
 expect(terminalRetainedUnsupported(raw,input,registry.owner,{...row,runtimeExecuted:false})).toBeUndefined()
 expect(terminalRetainedUnsupported(raw,input,registry.owner,{...row,witness:'invented.txt'})).toBeUndefined()
 expect(terminalRetainedUnsupported(raw,input,registry.owner,{...row,originalRawSha256:'0'.repeat(64)})).toBeUndefined()
 expect(terminalRetainedUnsupported(raw,input,registry.owner,{...row,detail:'process startup failed'})).toBeUndefined()
 expect(terminalRetainedUnsupported({...raw,transportObservations:[{...entry.transport,metrics:{...entry.transport.metrics,failureStage:'transport'}}]},input,registry.owner,row)).toBeUndefined()
})
test('ordinary assessor emits unsupported drawing disposition and keeps invalid controls separate',()=>{
 const entry=registry.original.entries[0]!,input=source(entry.row.caseId),invalid=corpus.cases.find(c=>c.intent==='invalid')!,cases=[input,invalid],raw={...record(entry),profile:'terminal-project-corpus-v1',inventory:cases.map(c=>[c.id,c.sourceSha256]),artifacts:[registry.owner],outputs:[copy(entry)],sourceReference:cases.map(c=>({project:'mermaid-js/mermaid',caseId:c.id,status:'unscored-reducer-control'}))}
 const result=assessTerminalRecord(raw,'/tmp',cases)[0]!
 expect(result.full.unsupported).toBe(1);expect(result.full.unknown).toBe(0);expect(result.full.correct).toBe(0)
 expect(result.rejection.unknown).toBe(1);expect(result.rejection.correct).toBe(0)
})
