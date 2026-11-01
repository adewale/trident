import {expect,test} from 'bun:test'
import type {MeaningExpectation} from '../fidelity/meaning.ts'
import {projectEventData} from '../fidelity/event-data-expectation.ts'
import {reviewDocumentationSource} from '../unified/docs-source-review.ts'
import {projectVisualExpectation} from '../fidelity/visual-expectation.ts'
const literal=(source:string)=>reviewDocumentationSource({id:'event-data-control',family:'eventmodeling',source},{visual:false}).expected!
const project=(input:MeaningExpectation)=>{const expected=structuredClone(input),policy=projectEventData(expected);return{expected,policy}}
const source=(unused:string,reference='Used')=>'eventmodeling\ntf 01 cmd Work [['+reference+']]\ndata '+reference+' {\nvalue: 7\n}\ndata Unused {\nvalue: '+unused+'\n}'
test('unused data-record changes cannot change the visible field contract, while every used field is owned and required',()=>{
  const a=project(literal(source('Alpha'))),b=project(literal(source('Beta')))
  expect(a.expected.facts).toEqual(b.expected.facts)
  expect(a.expected.labels).toEqual(['Work','value','7'])
  expect(a.expected.facts!['data-definitions']).toBeUndefined()
  expect((a.expected.facts!.frames as any[])[0]).toEqual({id:'01',resets:false,kind:'command',label:'Work',fields:[{name:'value',value:'7'}],readsFrom:[]})
  expect(a.expected.advisoryFacts!['native-event-data-definitions']).not.toEqual(b.expected.advisoryFacts!['native-event-data-definitions'])
  const changed=project(literal(source('Alpha').replace('value: 7','value: 8')))
  expect(changed.expected.facts).not.toEqual(a.expected.facts)
})
test('reference-ID renaming with identical records is not a printed ID obligation',()=>{
  const a=project(literal(source('Alpha','FirstId'))),b=project(literal(source('Alpha','SecondId')))
  expect(a.expected.facts).toEqual(b.expected.facts)
  expect(a.expected.labels).toEqual(b.expected.labels)
  expect(a.expected.advisoryFacts!['event-reference-resolution']).not.toEqual(b.expected.advisoryFacts!['event-reference-resolution'])
})
test('resolved reference replaces inline body, retaining superseded values and native alias data exactly',()=>{
  const input=literal('eventmodeling\ntf 01 cmd Work [[Used]] { value: inline }\ndata Used {\nvalue: referenced\n}')
  ;(input.facts as any)['frame-content']=[{id:'01',entityType:'command',entity:'Work',dataReference:'Used',data:{text:' value: inline '},reset:false,sources:[]}]
  const visual=project(input).expected
  expect((visual.facts!.frames as any[])[0].fields).toEqual([{name:'value',value:'referenced'}])
  expect((visual.facts!['frame-content'] as any[])[0]).toEqual({id:'01',entityType:'command',entity:'Work',reset:false,sources:[],fields:[{name:'value',value:'referenced'}]})
  expect(visual.advisoryFacts!['event-reference-resolution']).toEqual([{frame:'01',reference:'Used',definition:'Used',supersededInlineFields:[{name:'value',value:'inline'}]}])
  expect(visual.advisoryFacts!['native-event-frame-data']).toEqual([{frame:'01',dataReference:'Used',data:{text:' value: inline '}}])
  expect(visual.labels).not.toContain('inline')
  expect(projectVisualExpectation('eventmodeling',input).profileExpected).toEqual(input)
})
test('unresolved or ambiguous definitions remain fail-closed and cannot invent empty/default field values',()=>{
  const missing=literal(source('Alpha'))
  ;(missing.facts!.frames as any[])[0].dataReference='Missing'
  expect(project(missing)).toEqual({expected:missing,policy:{changed:false,projections:[],excluded:[]}})
  const duplicate=literal(source('Alpha'))
  ;(duplicate.facts!['data-definitions'] as any[]).push({id:'Used',fields:[{name:'value',value:'other'}]})
  expect(project(duplicate).expected).toEqual(duplicate)
  expect(project(duplicate).policy.changed).toBe(false)
})
