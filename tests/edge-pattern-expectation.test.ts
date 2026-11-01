import {expect,test} from 'bun:test'
import {readFileSync} from 'node:fs'
import {gunzipSync} from 'node:zlib'
import {reviewDocumentationSource} from '../unified/docs-source-review.ts'
import {projectSourceEdgePattern,sourceDashPattern,sourceEdgeAnimationActive} from '../fidelity/edge-pattern-expectation.ts'

const inventory=JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-source-inventory.json.gz',import.meta.url))).toString()).cases
const review=(body:string)=>reviewDocumentationSource({id:'synthetic-edge-pattern',family:'flowchart',source:body})
test('enabled animation leaves its unspecified dash skin advisory while preserving every temporal and marker request',()=>{
  for(const index of [229,486,494]){
    const row=reviewDocumentationSource(inventory[index]),facts:any=row.expected!.facts,native:any=row.profileExpected!.facts,first=facts['edge-appearance'][0]
    expect(first.stroke).toBeUndefined()
    expect(first.markerStart).toBe('none');expect(first.markerEnd).toBe('arrow')
    expect(native['edge-appearance'][0].stroke).toBe('solid')
    expect(facts['edge-attributes']).toEqual(native['edge-attributes'])
    expect(facts['edge-paint']).toBeUndefined()
    const repeat=structuredClone(row.expected!);expect(projectSourceEdgePattern(repeat).changed).toBe(false);expect(repeat).toEqual(row.expected!)
  }
})
test('explicit class dash supersedes base solidity, while thick weight and disabled animation remain required',()=>{
  const row=reviewDocumentationSource(inventory[230]),facts:any=row.expected!.facts
  expect(facts['edge-appearance'][0].stroke).toBe('dotted')
  expect((row.profileExpected!.facts!['edge-appearance'] as any[])[0].stroke).toBe('solid')
  expect(facts['authored-style']).toEqual(row.profileExpected!.facts!['authored-style'])
  const thick=reviewDocumentationSource(inventory[228]);expect((thick.expected!.facts!['edge-appearance'] as any[])[0].stroke).toBe('thick')
  expect(thick.expected!.facts!['edge-attributes']).toEqual([{id:'e1',attributes:{animate:true}}])
  const off=review('flowchart LR\nA e1@--> B\ne1@{ animate: false }')
  expect((off.expected!.facts!['edge-appearance'] as any[])[0].stroke).toBe('solid')
  const nodeClass=review('flowchart LR\nA e1@--> B\nclassDef dash stroke-dasharray:9;\nclass A dash')
  expect((nodeClass.expected!.facts!['edge-appearance'] as any[])[0].stroke).toBe('solid')
})
test('shared source lowering contains no default animation dash constants and handles exact authored patterns',()=>{
  expect(sourceEdgeAnimationActive({animation:'fast'})).toBe(true)
  expect(sourceEdgeAnimationActive({animate:false})).toBe(false)
  for(const [value,pattern]of [['9','dotted'],['9,5','dotted'],['1,0','solid'],['0','solid'],['none','solid'],['0,9',null],['9%',null]] as const)expect(sourceDashPattern(value)).toBe(pattern)
})
test('unqualified multiple-class priority or CSS values cannot invent an effective dash pattern',()=>{
  for(const declarations of ['classDef one stroke-dasharray:9;\nclassDef two stroke-dasharray:0;\nclass e1 one,two','classDef one stroke-dasharray:var(--dash);\nclass e1 one','classDef one stroke-dasharray:9,stroke-width:100px,stroke-linecap:round;\nclass e1 one']){
    const row=review('flowchart LR\nA e1@--> B\n'+declarations)
    expect((row.expected!.facts!['edge-appearance'] as any[])[0].stroke).toBeUndefined()
    expect(row.expected!.facts!['authored-style']).toBeDefined()
    expect(row.expected!.facts!['authored-style']).toEqual(row.profileExpected!.facts!['authored-style'])
    expect((row.profileExpected!.facts!['edge-appearance'] as any[])[0].stroke).toBe('solid')
  }
})
