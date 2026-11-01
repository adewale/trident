import {expect,test} from 'bun:test'
import {readFileSync} from 'node:fs'
import {gunzipSync} from 'node:zlib'
import {inspectTerminalFacts} from '../fidelity/terminal-facts.ts'
import {analyseTerminalSource} from '../fidelity/terminal-source.ts'
import {terminalMissingLiteralGlyphs} from '../fidelity/terminal-text.ts'
import {interpretTerminal} from '../fidelity/terminal-display.ts'
import {terminalRectangles} from '../fidelity/terminal-rectangles.ts'
import {inspectTerminalMeaning} from '../fidelity/terminal.ts'
import {reviewedTerminalCases} from '../fidelity/terminal-corpus.ts'
import {assessTerminalDrawing} from '../fidelity/terminal-assessment.ts'
const retained=JSON.parse(gunzipSync(readFileSync(new URL('../docs/evidence/terminal-present-gaps-2026-11-01/minimum50-dispositions.json.gz',import.meta.url))).toString()) as {project:string;caseId:string;actualOutput:string}[]
const saved=(project:string,id:string)=>retained.find(row=>row.project===project&&row.caseId==='terminal:'+id)!, corpus=reviewedTerminalCases()
const actual=(project:string,id:string,text=saved(project,id).actualOutput)=>assessTerminalDrawing(corpus.find(c=>c.id==='terminal:'+id)!,text)
const facts=(source:string,output:string)=>{const s=analyseTerminalSource(source,'flowchart');return inspectTerminalFacts(output,s.contract,s.graph)}
test('missing literal glyph is a necessary negative; global presence never proves caption or ownership',()=>{
 const cells=(s:string)=>interpretTerminal(s).cells
 expect(terminalMissingLiteralGlyphs(cells('Alph'),['Alpha'])).toEqual([{caption:'Alpha',missing:[{glyph:'a',needed:1,visible:0}]}])
 expect(terminalMissingLiteralGlyphs(cells('caf\u0065\u0301\nבְרֵא\nal\npha'),['café','בְרֵא','alpha'])).toEqual([])
 expect(terminalMissingLiteralGlyphs(cells('safe'),['\x1b[2Jsafe'])).toEqual([])
 const nonOwner='┌─────────┐\n│ prefixA │\n└─────────┘'
 expect(facts('graph TD\nA[A]',nonOwner).find(f=>f.criterion==='nodes')!.status).toBe('unknown')
 const clipped='┌─────────┐\n│   Alph  │\n└─────────┘'
 expect(facts('graph TD\nA[Alpha]',clipped).find(f=>f.criterion==='nodes')!.status).toBe('failed')
 expect(facts('graph TD\nA[Alpha]','Unsupported diagram').every(f=>f.status==='unknown')).toBe(true)
})
test('ordered left-point outline is an independently closed asymmetric primitive',()=>{
 const drawing='\\───────┐\n\\       │\n> Alpha │\n/       │\n/───────┘', source='graph TD\nA>Alpha]'
 expect(terminalRectangles(interpretTerminal(drawing).cells,{horizontal:/^[─┬┴┼+\-]+$/,vertical:/^[│|├┤┼+]$/,primitives:true,ports:true})[0]?.shape).toBe('asymmetric')
 expect(facts(source,drawing).every(f=>f.status==='passed')).toBe(true)
 expect(facts(source,drawing.replace('> Alpha','/ Alpha')).some(f=>f.status==='passed')).toBe(false)
 expect(facts('graph TD\nA[Alpha]',drawing).find(f=>f.criterion==='node-shapes')!.status).toBe('failed')
 expect(facts(source,drawing.replace('Alpha','Alph ')).find(f=>f.criterion==='nodes')!.status).toBe('failed')
})
test('retained HTML captions lose authored lines and ASCII Hebrew caption loses its final w',()=>{
 expect(actual('fasouto/termaid','383e68bb60ac3633').status).toBe('incorrect')
 expect(actual('fasouto/termaid','6c29eb05c097760d').status).toBe('incorrect')
 const ascii=saved('AlexanderGrooff/mermaid-ascii','32ad8ee06ab49562').actualOutput
 expect(actual('AlexanderGrooff/mermaid-ascii','32ad8ee06ab49562').status).toBe('incorrect')
 // Restoration supplies only the missing literal evidence. Ragged walls still
 // cannot earn a whole-drawing pass from source text presence.
 const restored=actual('AlexanderGrooff/mermaid-ascii','32ad8ee06ab49562',ascii.replace('hebre','hebrew'))
 expect(restored.status).not.toBe('correct');expect('checks' in restored&&restored.checks?.find(f=>f.criterion==='nodes')?.status).toBe('unknown')
})
test('missing retry6 is a caption loss even while the shared self-loop routes are ambiguous',()=>{
 const row=saved('fasouto/termaid','90e78c1ed707e7e4'), verdict=actual(row.project,'90e78c1ed707e7e4')
 expect(verdict.status).toBe('incorrect')
 expect('checks' in verdict&&verdict.checks?.find(f=>f.criterion==='relationships')?.detail).toContain('letters/numbers are absent')
 expect(actual(row.project,'90e78c1ed707e7e4',row.actualOutput+'\nretry 6').status).toBe('unknown')
})
test('flat state identity remains inspectable when crossings prevent transition attribution',()=>{
 for(const id of ['3042977d4e6d813b','cd771fca2659a460']){
  const row=saved('fasouto/termaid',id),verdict=actual(row.project,id)
  expect(verdict.status).toBe('unknown');expect('checks' in verdict&&verdict.checks?.find(f=>f.criterion==='states')?.status).toBe('passed')
  const wrong=actual(row.project,id,row.actualOutput.replace(id.startsWith('304')?'Draft':'Idle','Lost'))
  expect(wrong.status).toBe('incorrect')
 }
})
test('group endpoint ambiguity cannot hide a completely absent directional head',()=>{
 const source='flowchart TD\nsubgraph G\na\nend\nG --> a', drawing='┌─────────┐\n│ G       │\n│ ┌─────┐ │\n│ ├──a──│ │\n│ └─────┘ │\n└─────────┘'
 expect(facts(source,drawing).find(f=>f.criterion==='relationships')!.status).toBe('failed')
 // An unqualified marker vocabulary blocks the absence proof; a free head
 // still does not establish any route or endpoint ownership.
 expect(facts(source,drawing+'\n↳').find(f=>f.criterion==='relationships')!.status).toBe('unknown')
 expect(facts(source,drawing+'\n→').find(f=>f.criterion==='relationships')!.status).toBe('unknown')
 expect(facts(source.replace('-->','---'),drawing).find(f=>f.criterion==='relationships')!.status).toBe('unknown')
 for(const id of ['64788fe4b88b1f1f','de6e8bf0fd559efc'])expect(actual('fasouto/termaid',id).status).toBe('incorrect')
})
test('separate complete ER cards cannot obtain missing relationship ink from their own source fragments',()=>{
 const source=analyseTerminalSource('erDiagram\nA ||--o{ B : owns','er').contract
 const drawing='┌─────────┐    ┌───────┐\n│ A ||--o{│    │ B {   │\n│ B : owns│    │       │\n└─────────┘    └───────┘'
 const check=(s:string)=>inspectTerminalFacts(s,source).find(f=>f.criterion==='entity-relations')!
 expect(check(drawing).status).toBe('failed')
 expect(check(drawing+'\n⤵').status).toBe('unknown')
 expect(actual('fasouto/termaid','89be4f2885fb74a9').status).toBe('incorrect')
})
test('an ambiguous component cannot hide a separate dangling arrowhead',()=>{
 const row=saved('AlexanderGrooff/mermaid-ascii','908bfa4128c34006'), source=corpus.find(c=>c.id===row.caseId)!
 expect(inspectTerminalMeaning(row.actualOutput,source.expected.graph!).status).toBe('unknown')
 expect(inspectTerminalMeaning(row.actualOutput+'\n►',source.expected.graph!).status).toBe('incorrect')
})
test('literal rectangular shape cannot be supplied by shifted caption-row walls',()=>{
 const source='graph TD\nA[Alpha]', broken='┌─────────┐\n│         │\n│ Alpha │\n│         │\n└─────────┘', repaired=broken.replace('│ Alpha │','│ Alpha   │')
 expect(facts(source,broken).find(f=>f.criterion==='node-shapes')!.status).toBe('failed')
 expect(facts(source,repaired).every(f=>f.status==='passed')).toBe(true)
 expect(facts(source,broken.replace('│ Alpha │','│ Alpha ├──')).find(f=>f.criterion==='node-shapes')!.status).toBe('unknown')
 expect(facts(source,broken.replace('Alpha','Lost')).find(f=>f.criterion==='node-shapes')!.status).toBe('unknown')
 expect(actual('fasouto/termaid','32ad8ee06ab49562').status).toBe('incorrect')
})
test('state identity and actual top/bottom routes do not require an unrequested rectangle skin',()=>{
 const contract=analyseTerminalSource('stateDiagram-v2\n[*] --> Alpha\nAlpha --> [*]','state').contract
 const drawing='╭─────────╮\n│    ●    │\n╰────┬────╯\n     │\n     ▼\n╭─────────╮\n│         │\n│ Alpha │\n│         │\n╰────┬────╯\n     │\n     ▼\n╭─────────╮\n│    ◉    │\n╰─────────╯'
 const checks=(s:string)=>inspectTerminalFacts(s,contract)
 expect(checks(drawing).every(row=>row.status==='passed')).toBe(true)
 expect(checks(drawing.replace('Alpha','Other')).find(row=>row.criterion==='states')!.status).toBe('failed')
 expect(checks(drawing.replace('     ▼','     ▲')).find(row=>row.criterion==='transitions')!.status).toBe('failed')
 expect(checks(drawing.replace('     │','      ')).find(row=>row.criterion==='transitions')!.status).toBe('failed')
 expect(checks(drawing.replace('│ Alpha │','  Alpha │')).some(row=>row.status==='passed')).toBe(false)
 expect(checks(drawing+'\nUnowned').some(row=>row.status==='passed')).toBe(false)
 expect(actual('fasouto/termaid','9e4e5a5e072642e8').status).toBe('correct')
})
