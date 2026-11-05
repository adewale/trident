import{expect,test}from'bun:test'
import{analyseTerminalSource}from'../fidelity/terminal-source.ts'
import{inspectTerminalFacts}from'../fidelity/terminal-facts.ts'
const source='stateDiagram-v2\n[*] --> Ready\nReady --> [*]',contract=analyseTerminalSource(source,'state').contract
const horizontal='     ╭───────╮\n●───►│ Ready ├───►◎\n     ╰───────╯'
const boxed='     ┌───────┐     ┌───┐\n●───►│ Ready ├────►│ ◎ │\n     └───────┘     └───┘'
const vertical='    ●\n    │\n    ▼\n┌───────┐\n│ Ready │\n└───┬───┘\n    │\n    ▼\n┌───────┐\n│   ◎   │\n└───────┘'
const checks=(text:string,expected=contract)=>inspectTerminalFacts(text,expected),passed=(text:string)=>checks(text).every(row=>row.status==='passed')
test('independent point/boxed final styles and translated horizontal/vertical chains retain the same source meaning',()=>{
 for(const text of[horizontal,boxed,vertical]){expect(passed(text)).toBe(true);expect(passed(text.replace('◎','◉'))).toBe(true);expect(passed('\n'+text.split('\n').map(row=>'  '+row).join('\n'))).toBe(true)}
})
test('circle likeness, text occurrences and hidden or ambiguous contact cannot establish a final endpoint',()=>{
 expect(checks(horizontal.replace('◎','○')).every(row=>row.status!=='failed')).toBe(true)
 for(const text of[horizontal.replace('◎','○'),horizontal.replace('►◎','◄◎'),horizontal.replace('►◎','► ◎'),horizontal+'─',horizontal+'\n◎',horizontal.replace('├───►','├─ ─►')])expect(passed(text)).toBe(false)
 const literal=analyseTerminalSource('stateDiagram-v2\nstate "◎" as Ready\n[*] --> Ready\nReady --> [*]','state').contract
 expect(checks(horizontal,literal).every(row=>row.status==='unknown')).toBe(true)
 const caption=analyseTerminalSource('stateDiagram-v2\n[*] --> Ready\nReady --> [*] : ◎','state').contract
 expect(checks(horizontal,caption).every(row=>row.status==='unknown')).toBe(true)
})
