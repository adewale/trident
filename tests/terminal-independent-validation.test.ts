import{expect,test}from'bun:test'
import{readFileSync}from'node:fs'
import{gunzipSync}from'node:zlib'
import{resolve}from'node:path'
import manifest from'./fixtures/terminal/independent-validation.json'
import known from'./fixtures/terminal/known-encoding.json'
import{terminalProfileCorpus}from'../fidelity/terminal-active-corpus.ts'
import{assessTerminalDrawing}from'../fidelity/terminal-assessment.ts'
import{terminalKnownEncodingContext}from'../fidelity/terminal-encoding.ts'
import{analyseTerminalSource}from'../fidelity/terminal-source.ts'
import{inspectTerminalFacts}from'../fidelity/terminal-facts.ts'
import{evidenceBytesDigest}from'../portable/evidence-contract.ts'
const root=resolve(import.meta.dir,'..'),corpus=terminalProfileCorpus().cases,gaps=JSON.parse(gunzipSync(readFileSync(resolve(root,'docs/evidence/terminal-present-gaps-2026-11-01/minimum50-dispositions.json.gz'))).toString()) as{project:string;caseId:string;actualOutput:string}[]
function output(row:typeof manifest.rows[number]){const path=resolve(root,row.evidence.path);return row.evidence.kind==='gap-record'?Buffer.from(gaps.find(g=>g.project===row.project&&g.caseId===row.caseId)!.actualOutput):row.evidence.kind==='gzip-file'?gunzipSync(readFileSync(path)):readFileSync(path)}
test('independent stratified retained review binds literal source, actual bytes and immutable B0 origin',()=>{
 expect(manifest.rows).toHaveLength(19);expect(new Set(manifest.rows.map(row=>row.family)).size).toBe(8)
 expect(evidenceBytesDigest(readFileSync(resolve(root,'docs/evidence/b0/evidence/terminal-raw.tar.gz')))).toBe(manifest.b0ArchiveSha256)
 expect(evidenceBytesDigest(gunzipSync(readFileSync(resolve(root,'docs/evidence/b0/normal/terminal-result.json.gz'))))).toBe(manifest.b0ResultSha256)
 for(const row of manifest.rows){
  const input=corpus.find(c=>c.id===row.caseId)!,bytes=output(row)
  expect(input.sourceSha256).toBe(row.sourceSha256);expect(evidenceBytesDigest(bytes)).toBe(row.outputSha256);expect(row.manualFinding.length).toBeGreaterThan(60)
  const encoding=row.project===known.owner.project?terminalKnownEncodingContext(known.owner,{sourceSha256:input.sourceSha256,outputSha256:row.outputSha256,owningRawSha256:manifest.b0RawSha256}):undefined
  expect(assessTerminalDrawing(input,bytes,encoding).status).toBe(row.manualVerdict)
 }
})
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
