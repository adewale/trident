import {expect,test} from 'bun:test'
import {readFileSync} from 'node:fs'
import {inspectTerminalMeaning} from '../fidelity/terminal.ts'
import {inspectTerminalFacts} from '../fidelity/terminal-facts.ts'
import {analyseTerminalSource} from '../fidelity/terminal-source.ts'
import {reviewedTerminalCases} from '../fidelity/terminal-corpus.ts'
import {assessTerminalDrawing} from '../fidelity/terminal-assessment.ts'
import {evidenceBytesDigest} from '../portable/evidence-contract.ts'
import {terminalRectangles} from '../fidelity/terminal-rectangles.ts'
import {interpretTerminal} from '../fidelity/terminal-display.ts'
import provenance from './fixtures/terminal/remaining-provenance.json'
const fixture=(name:string)=>readFileSync(new URL('./fixtures/terminal/'+name+'.txt',import.meta.url),'utf8'), corpus=reviewedTerminalCases()
const actual=(name:string,text=fixture(name))=>assessTerminalDrawing(corpus.find(c=>c.id===provenance.find(p=>p.file===name+'.txt')!.caseId)!,text)
test('remaining controls bind actual sources, frozen artifacts and original returned bytes',()=>{for(const p of provenance){expect(evidenceBytesDigest(fixture(p.file.slice(0,-4)))).toBe(p.outputSha256);expect(corpus.find(c=>c.id===p.caseId)).toBeDefined()}})
test('corner source port owns a closed self-loop and its complete route',()=>{
 const graph={nodes:[{id:'A',label:'A'}],edges:[{source:'A',target:'A'}]}, drawing=`┌─────┬──╮
│     │  │
│  A  │◄─╯
│     │
└─────┘`
 expect(inspectTerminalMeaning(drawing,graph).status).toBe('correct')
 expect(inspectTerminalMeaning(drawing.replace('┬','┐'),graph).status).not.toBe('correct')
 expect(inspectTerminalMeaning(drawing.replace('◄','►'),graph).status).toBe('incorrect')
 expect(inspectTerminalMeaning(drawing.replace('◄─╯','◄ ╯'),graph).status).toBe('incorrect')
 expect(actual('corner-self-python').status).toBe('correct');expect(actual('corner-graph-python').status).toBe('correct')
})
test('a corner-port candidate cannot truncate an ordinary compartmented container',()=>{
 const grid=interpretTerminal('┌─────┐\n│  A  │\n├─────┤\n│ row │\n└─────┘').cells
 const profile={horizontal:/^[─┬┴┼+\-]+$/,vertical:/^[│|├┤┼+]$/,ports:true}
 expect(terminalRectangles(grid,{...profile,cornerPorts:true})).toEqual(terminalRectangles(grid,profile))
 expect(terminalRectangles(grid,{...profile,cornerPorts:true})[0]!.bottom).toBe(4)
})
// Independently hand-authored strip and legend; no SUT or decoder constructs it.
const strip=`██████████████████████████████░░░░░░░░░░
              A 75%              B 25%
A┃██████████████████████████████ 75.0%
B┃░░░░░░░░░░ 25.0%`
const pie=analyseTerminalSource('pie\n"A":3\n"B":1','pie').contract
const pieStatus=(text:string)=>inspectTerminalFacts(text,pie).find(f=>f.criterion==='slice-values')!.status
test('stacked plot, legend bars, labels and percentages jointly retain weights',()=>{
 expect(pieStatus(strip)).toBe('passed')
 expect(pieStatus(strip.replace('75.0%','25.0%'))).not.toBe('passed')
 expect(pieStatus(strip.replace('██████████████████████████████░░░░░░░░░░','██████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░'))).not.toBe('passed')
 expect(pieStatus(strip.replace('A┃██████','B┃██████'))).not.toBe('passed')
 expect(pieStatus(strip+'\nUnowned annotation')).not.toBe('passed')
 expect(pieStatus('A 75% B 25%')).not.toBe('passed')
})
test('retained pie strip permits full owned plot caption with abbreviated legend and rejects wrong weights',()=>{
 for(const name of ['strip-equal-python','strip-unicode-python'])expect(actual(name).status).toBe('correct')
 expect(actual('strip-unicode-python',fixture('strip-unicode-python').replace('75.0%','25.0%')).status).not.toBe('correct')
 for(const name of ['strip-title-python','strip-pets-python'])expect(actual(name).status).toBe('incorrect')
})
test('fully owned strip grammar detects missing title without confusing percentages for titles',()=>{
 const input=analyseTerminalSource('pie title Inventory\n"A":3\n"B":1','pie').contract
 expect(inspectTerminalFacts('Inventory\n'+strip,input).every(f=>f.status==='passed')).toBe(true)
 expect(inspectTerminalFacts(strip,input).find(f=>f.criterion==='title')!.status).toBe('failed')
 expect(inspectTerminalFacts('Wrong\n'+strip,input).find(f=>f.criterion==='title')!.status).toBe('failed')
})
test('timeline tree grammar observes explicit period versus following event rows',()=>{
 const contract=analyseTerminalSource('timeline\nsection One\n2023 : Plan\n : Build','timeline').contract
 const drawing=`══ One ══
│
●── 2023
│   Plan
│   Build`
 expect(inspectTerminalFacts(drawing,contract).every(f=>f.status==='passed')).toBe(true)
 expect(inspectTerminalFacts(drawing.replace('│   Build','●── Build'),contract).find(f=>f.criterion==='timeline-periods')!.status).toBe('failed')
 expect(inspectTerminalFacts(drawing.replace('Plan','Lost'),contract).find(f=>f.criterion==='timeline-periods')!.status).toBe('failed')
 expect(actual('timeline-tree-python').status).toBe('incorrect')
})
test('unique closed note detects merged authored breaks despite unresolved overlapping ownership',()=>{
 expect(actual('note-hardbreak-ascii').status).toBe('incorrect')
 expect(actual('note-hardbreak-ascii',fixture('note-hardbreak-ascii').replace('Line 1 Line 2 Line 3','Line 1 Lost 2 Line 3')).status).not.toBe('correct')
})
test('unframed quadrant extents own coordinates and all authored axis labels',()=>{
 const contract=analyseTerminalSource('quadrantChart\nx-axis Low --> High\ny-axis Bottom --> Top\nquadrant-1 One\nquadrant-2 Two\nquadrant-3 Three\nquadrant-4 Four\nA: [0.15, 0.7]','quadrant').contract
 const drawing=`          │
     Two  │ One
   ● A    │
          │
──────────┼──────────
          │
    Three │ Four
          │
Low -> High
y-axis bottom: Bottom | top: Top`
 const facts=(s:string)=>inspectTerminalFacts(s,contract).find(f=>f.criterion==='quadrant-chart')!.status
 expect(facts(drawing)).toBe('passed')
 expect(facts(drawing.replace('y-axis bottom: Bottom | top: Top',''))).toBe('failed')
 expect(facts(drawing.replace('   ● A    │','          │    ● A'))).toBe('failed')
 expect(facts(drawing.replace('│ One','│ Wrong'))).toBe('failed')
 expect(facts(drawing.replace('──────────┼','───── ────┼'))).not.toBe('passed')
 expect(actual('quadrant-cross-python').status).toBe('incorrect')
})
test('complete wrong shape inventory can fail before labels resolve, but matching counts cannot pass identities',()=>{
 const drawing=`┌─────────┐    ┌─────────┐
│ prefixA ├───►│ prefixB │
└─────────┘    └─────────┘`
 const wrong=analyseTerminalSource('flowchart LR\nA((A)) --> B[B]','flowchart')
 expect(inspectTerminalFacts(drawing,wrong.contract,wrong.graph).find(f=>f.criterion==='node-shapes')!.status).toBe('failed')
 const matching=analyseTerminalSource('flowchart LR\nA[A] --> B[B]','flowchart')
 expect(inspectTerminalFacts(drawing,matching.contract,matching.graph).find(f=>f.criterion==='node-shapes')!.status).toBe('unknown')
 expect(inspectTerminalFacts(drawing+'\nUnowned label',wrong.contract,wrong.graph).find(f=>f.criterion==='node-shapes')!.status).toBe('unknown')
 expect(actual('stadium-rectangle-ascii').status).toBe('incorrect')
})
