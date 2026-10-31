import {expect,test} from 'bun:test'
import type {MeaningExpectation} from '../fidelity/meaning.ts'
import {projectSourceMetadata} from '../fidelity/source-metadata-expectation.ts'
import {reviewDocumentationSource} from '../unified/docs-source-review.ts'
import {projectVisualExpectation} from '../fidelity/visual-expectation.ts'
const literal=(source:string)=>reviewDocumentationSource({id:'source-metadata-control',family:'source',source},{visual:false}).expected!
const project=(family:string,input:MeaningExpectation)=>{const expected=structuredClone(input),policy=projectSourceMetadata(family,expected);return{expected,policy}}
test('source-only redundant-checkout twins retain identical visible ordered commits/parents/branches without requiring raw history',()=>{
  const left=literal('gitGraph\ncommit id:"one"\ncommit id:"two"'),right=literal('gitGraph\ncommit id:"one"\ncheckout main\ncommit id:"two"')
  expect(left.facts!['git-operation-order']).not.toEqual(right.facts!['git-operation-order'])
  const a=project('gitgraph',left),b=project('gitgraph',right)
  expect(a.expected.facts).toEqual(b.expected.facts)
  expect(a.expected.facts!.commits).toEqual(left.facts!.commits)
  expect(a.expected.facts!.branches).toEqual(left.facts!.branches)
  expect(a.expected.advisoryFacts!['unprinted-source-identities']).toEqual({'git-operation-order':left.facts!['git-operation-order']!})
  expect(projectVisualExpectation('gitgraph',left).profileExpected).toEqual(left)
})
test('constructor and EBNF same-terminal twins retain the complete recursive AST independent of unprinted grammar dialect',()=>{
  const a=project('railroad',literal('railroad-beta\nword = terminal("a");')),b=project('railroad-ebnf',literal('railroad-ebnf-beta\nword = "a";'))
  expect(a.expected.facts).toEqual(b.expected.facts)
  expect(a.expected.facts!['grammar-rules']).toEqual([{name:'word',expression:{kind:'terminal',value:'a'}}])
  expect(a.expected.advisoryFacts!['unprinted-source-identities']).not.toEqual(b.expected.advisoryFacts!['unprinted-source-identities'])
})
test('only mindmap tree-order is metadata; rooted hierarchy and unrelated ordering keys remain required',()=>{
  const input:MeaningExpectation={labels:['Root','Child'],nodes:[{id:'root',label:'Root'},{id:'child',label:'Child'}],edges:[{source:'root',target:'child',directed:false}],facts:{'tree-order':['root','child'],'message-order':['keep'],'grid-cell-order':['keep'],'lane-order':['keep']}}
  const visual=project('mindmap',input).expected
  expect(visual.facts).toEqual({'message-order':['keep'],'grid-cell-order':['keep'],'lane-order':['keep']})
  expect(visual.nodes).toEqual(input.nodes)
  expect(visual.edges).toEqual(input.edges)
  expect(project('flowchart',input).expected.facts).toEqual(input.facts)
  expect(projectVisualExpectation('mindmap',input).profileExpected).toEqual(input)
})
test('event namespaces require owned basename plus correct typed row while qualified native identities remain intact',()=>{
  const input:MeaningExpectation={labels:['Cart.UI','Cart.Add','Other.Deep.Entity'],nodes:[{id:'01',label:'Cart.UI'},{id:'03',label:'Other.Deep.Entity'}],facts:{frames:[{id:'01',kind:'ui',label:'Cart.UI',fields:[],readsFrom:[]},{id:'02',kind:'command',label:'Cart.Add',fields:[{name:'productId',value:'7'}],readsFrom:['01']},{id:'03',kind:'event',label:'Other.Deep.Entity',fields:[],readsFrom:[]}],'frame-content':[{id:'01',entityType:'ui',entity:'Cart.UI',reset:true,sources:[],data:null}]}}
  const visual=project('eventmodeling',input).expected
  expect(visual.labels).toEqual(['Other.Deep.Entity','UI','Add'])
  expect(visual.nodes![0]!.label).toBe('UI')
  expect(visual.facts!['event-namespace-presentation']).toEqual([{id:'01',entityIdentifier:'Cart.UI',displayLabel:'UI',namespace:'Cart',entityType:'ui'},{id:'02',entityIdentifier:'Cart.Add',displayLabel:'Add',namespace:'Cart',entityType:'command'}])
  expect((visual.facts!.frames as any[])[0]).toMatchObject({label:'Cart.UI',displayLabel:'UI',namespace:'Cart'})
  expect((visual.facts!['frame-content'] as any[])[0]).toMatchObject({entity:'Cart.UI',entityType:'ui',displayLabel:'UI',namespace:'Cart',reset:true,sources:[]})
  expect((visual.facts!.frames as any[])[1].fields).toEqual([{name:'productId',value:'7'}])
  expect((visual.facts!.frames as any[])[2]).toEqual((input.facts!.frames as any[])[2])
  expect(projectVisualExpectation('eventmodeling',input).profileExpected).toEqual(input)
})
