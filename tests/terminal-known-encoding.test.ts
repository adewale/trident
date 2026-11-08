import{expect,test}from'bun:test'
import{readFileSync}from'node:fs'
import{gunzipSync}from'node:zlib'
import{terminalKnownEncodingContext,admittedTerminalEncoding,qualifyTerminalEncoding}from'../fidelity/terminal-encoding.ts'
import{evidenceBytesDigest,evidenceDigest}from'../portable/evidence-contract.ts'
import{reviewedTerminalCases}from'../fidelity/terminal-corpus.ts'
import{assessTerminalDrawing}from'../fidelity/terminal-assessment.ts'
import{analyseTerminalSource}from'../fidelity/terminal-source.ts'
import{inspectTerminalFacts}from'../fidelity/terminal-facts.ts'
import proof from'./fixtures/terminal/known-encoding.json'
const records=JSON.parse(gunzipSync(readFileSync(new URL('../docs/evidence/terminal-present-gaps-2026-11-01/minimum50-dispositions.json.gz',import.meta.url))).toString()) as{project:string;caseId:string;actualOutput:string;outputSha256:string}[],corpus=reviewedTerminalCases()
const saved=(id:string)=>records.find(r=>r.project==='fasouto/termaid'&&r.caseId==='terminal:'+id)!
const context=(source:string,output:string,owner=proof.owner)=>terminalKnownEncodingContext(owner,{sourceSha256:evidenceBytesDigest(source),outputSha256:evidenceBytesDigest(output),owningRawSha256:evidenceDigest({kind:'synthetic-encoding-control',source,output})},proof.qualification)
const actual=(id:string,text=saved(id).actualOutput,bound=true)=>{const input=corpus.find(c=>c.id==='terminal:'+id)!;return assessTerminalDrawing(input,text,bound?context(input.source,text):undefined)}
test('glyph dictionaries require independently exercised controls and source/output ownership',()=>{
 const row=saved('a60c7e7b3b930353'),input=corpus.find(c=>c.id===row.caseId)!,binding={sourceSha256:input.sourceSha256,outputSha256:row.outputSha256,owningRawSha256:proof.owningRawSha256},admitted=terminalKnownEncodingContext(proof.owner,binding,proof.qualification)!
 expect(admittedTerminalEncoding(admitted,row.actualOutput,input.sourceSha256)).toEqual(admitted)
 expect(terminalKnownEncodingContext({...proof.owner,artifact:{...proof.owner.artifact,sha256:'0'.repeat(64)}},binding,proof.qualification)).toBeUndefined()
 expect(terminalKnownEncodingContext({...proof.owner,artifact:{...proof.owner.artifact,files:[]}},binding,proof.qualification)).toBeUndefined()
 expect(terminalKnownEncodingContext({...proof.owner,artifact:{...proof.owner.artifact,files:[{path:'termaid-0.10.0-py3-none-any.whl',sha256:'0'.repeat(64)}]}},binding,proof.qualification)).toBeUndefined()
 expect(admitted.capabilities).toEqual(['journey','gantt','gitgraph'])
 expect(admittedTerminalEncoding({...admitted},row.actualOutput,input.sourceSha256)).toBeUndefined()
 expect(terminalKnownEncodingContext({...proof.owner,project:'renamed/project',version:'new release'},binding,proof.qualification)?.capabilities).toEqual(admitted.capabilities)
 const changed=structuredClone(proof.qualification);changed.observations.find(row=>row.id==='journey-5')!.output=changed.observations.find(row=>row.id==='journey-5')!.output.replace('😄','😞')
 expect(terminalKnownEncodingContext(proof.owner,binding,changed)?.capabilities).not.toContain('journey')
 expect(()=>qualifyTerminalEncoding(proof.owner,[])).toThrow('independent controls')
 expect(admittedTerminalEncoding(admitted,row.actualOutput+'x',input.sourceSha256)).toBeUndefined()
 expect(admittedTerminalEncoding(admitted,row.actualOutput,'0'.repeat(64))).toBeUndefined()
 expect(actual('a60c7e7b3b930353',row.actualOutput,false).status).toBe('unknown')
 expect(actual('a60c7e7b3b930353').status).toBe('correct')
})
test('owned native faces, actor legends and section spans reject independent score/actor/task/timeline perturbations',()=>{
 const row=saved('a60c7e7b3b930353')
 expect(actual('a60c7e7b3b930353',row.actualOutput.replace('😄','😞')).status).toBe('incorrect')
 expect(actual('a60c7e7b3b930353',row.actualOutput.replace('● 家族','● Other')).status).toBe('incorrect')
 expect(actual('a60c7e7b3b930353',row.actualOutput.replace('メールを確認する','メールを変更する')).status).toBe('incorrect')
 expect(actual('a60c7e7b3b930353',row.actualOutput.replace('────►','── ─►')).status).not.toBe('correct')
 expect(actual('a60c7e7b3b930353',row.actualOutput+'\nUnowned').status).not.toBe('correct')
})
const gantt=' One    │\n  Task  │░░░░░░░░░░░░░░░░░░░░\n        └┬─────────┬─────────┬\n      Jan 01    Jan 06    Jan 11',source='gantt\nsection One\nTask :done, a, 2024-01-01, 10d'
const ganttCheck=(text:string,src=source,bound=true)=>{const contract=analyseTerminalSource(src,'gantt').contract;return inspectTerminalFacts(text,contract,undefined,bound?context(src,text):undefined).find(f=>f.criterion==='gantt-tasks')!}
test('day-axis calibration is output-owned, source intervals project forward and status codes need their exact dialect',()=>{
 expect(ganttCheck(gantt).status).toBe('passed')
 expect(ganttCheck(gantt,source.replace('10d','9d')).status).toBe('failed')
 expect(ganttCheck(gantt,source,false).status).toBe('unknown')
 expect(ganttCheck(gantt.replace('░░░░░░░░░░░░░░░░░░░░','░░░░░░░░░░')).status).toBe('failed')
 expect(ganttCheck(gantt.replace('Jan 11','Jan 21')).status).not.toBe('passed')
 expect(ganttCheck(gantt.replaceAll('░','▓')).status).toBe('failed')
 expect(ganttCheck(gantt.replaceAll('░','█'),source.replace('done, ','')).status).toBe('unknown')
 expect(ganttCheck(gantt.replaceAll('░','█'),source.replace('done','crit')).status).toBe('unknown')
 for(const id of['276c8474274911fa','aaf86b713c100b5a']){const verdict=actual(id);expect(verdict.status).toBe('unknown');expect('checks'in verdict&&verdict.checks?.find(f=>f.criterion==='gantt-tasks')?.detail).toContain('native █ cannot distinguish')}
})

test('native Git lanes project all source operations to independently visible parent history',()=>{
 for(const id of['2295dae5ca33addf','c64d9c102f509905']){
  const row=saved(id);expect(actual(id,row.actualOutput,false).status).toBe('unknown');expect(actual(id).status).toBe('unknown')
 }
 const row=saved('2295dae5ca33addf')
 expect(actual('2295dae5ca33addf',row.actualOutput.replace('ui-polish','ui-broken')).status).toBe('incorrect')
 expect(actual('2295dae5ca33addf',row.actualOutput.replace('v1.1.0','v9.9.9')).status).toBe('incorrect')
 const copy=saved('c64d9c102f509905');expect(actual('c64d9c102f509905',copy.actualOutput.replace('B-cherry','X-cherry')).status).not.toBe('correct')
 expect(actual('c64d9c102f509905',copy.actualOutput.replace('│',' ')).status).not.toBe('correct')
})
test('independent unoccluded lane drawing qualifies all fork/current-head history, while occluded paths stay unknown',()=>{
 const source='gitGraph\ncommit id: "A"\nbranch other\ncommit id: "B"\ncheckout main\ncommit id: "C"',drawing=' main    ──●──┼────●─\n           A  │    C\n              │\n other        ●─\n              B',s=analyseTerminalSource(source,'gitgraph')
 expect(inspectTerminalFacts(drawing,s.contract,undefined,context(source,drawing)).every(row=>row.status==='passed')).toBe(true)
 expect(inspectTerminalFacts(drawing.replace('              │','               '),s.contract,undefined,context(source,drawing.replace('              │','               '))).every(row=>row.status==='passed')).toBe(false)
 for(const id of['2295dae5ca33addf','c64d9c102f509905']){const result=actual(id);expect(result.status).toBe('unknown');expect('checks'in result&&result.checks?.find(row=>row.criterion==='git-operations')?.detail).toContain('occludes')}
})
