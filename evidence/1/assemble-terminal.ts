import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { readBenchmarkDocument as read } from '/workspace/trident-ecosystem-results/portable/project-records.ts'
const root='/workspace/trident-ecosystem-2026-10-31-final', old='/workspace/trident-ecosystem-2026-10-31-terminal-full', repair='/workspace/trident-ecosystem-2026-10-31-campaign/terminal-repair'
if(!existsSync(root+'/recheck-receipt.json'))throw Error('Wait for completed SVG reassessment')
const raw:any=read(old+'/raw.json'), extraRaw:any=read(repair+'/regraded/raw.json')
for(const key of ['inventory','corpusSha256','reviewsSha256'])if(JSON.stringify(raw[key])!==JSON.stringify(extraRaw[key]))throw Error('Terminal source/review identity differs: '+key)
cpSync(old,root+'/terminal-sources/full',{recursive:true});cpSync(repair,root+'/terminal-sources/repair',{recursive:true})
const result:any=read(old+'/terminal/result.json'), extra:any=read(repair+'/regraded/terminal/result.json'), ids=new Set(extra.terminalAssessments.map((x:any)=>x.project))
if(ids.size!==3||extra.terminalAssessments.some((x:any)=>x.planned!==120)||extra.terminalReviewedAssessments.some((x:any)=>x.planned!==16))throw Error('Unexpected repair population')
for(const key of ['terminalAssessments','terminalReviewedAssessments'])result[key]=[...result[key].filter((x:any)=>!ids.has(x.project)),...extra[key]]
result.initialTerminalCoverage=result.terminalCoverage;result.terminalCoverage=[...result.terminalCoverage.filter((x:any)=>!ids.has(x.project)),...extra.terminalCoverage]
result.coverageAccounting='Original attempted counts exclude six evidenced started panic/timeout calls; see terminal-sources/full/accounting-audit.json. Repaired CLI status/timing loss and unknown invocation states remain explicit.'
result.observations=[...result.observations.filter((x:any)=>!ids.has(x.metrics?.project)),...extra.observations]
if(result.terminalAssessments.length!==18||result.terminalReviewedAssessments.length!==18)throw Error('Missing terminal participant')
const sha=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex')
result.assembly={assembledAt:new Date().toISOString(),sources:[{file:old+'/terminal/result.json',sha256:sha(old+'/terminal/result.json')},{file:repair+'/regraded/terminal/result.json',sha256:sha(repair+'/regraded/terminal/result.json')}],limits:'Original18-project collection and targeted3-project transport repair. Raw records, lost-clock disclosures and originals retained. No repeated15-project rendering, no combined speed comparison.'}
mkdirSync(root+'/terminal',{recursive:true});writeFileSync(root+'/terminal/result.json',JSON.stringify(result)+'\n')
// Witness names are content-addressed, but the original records stay in their owning roots.
for(const directory of [old,repair+'/regraded'])for(const name of readdirSync(directory).filter(x=>x.endsWith('.txt'))){const to=join(root,'terminal',name),from=join(directory,name);if(existsSync(to)&&sha(to)!==sha(from))throw Error('Text witness collision');cpSync(from,to)}
const report:any=read(root+'/report.json');report.requestedSuites.push('community');report.results.push({suite:'community',cohort:'terminal-project-corpus-v1',out:root+'/terminal',status:'blocked',completed:true});report.updatedAt=new Date().toISOString();report.assembly.terminal=result.assembly;writeFileSync(root+'/report.json',JSON.stringify(report)+'\n');cpSync('/tmp/trident-add-terminal.ts',root+'/assemble-terminal.ts')
console.log(result.terminalReviewedAssessments.map(({project,correct,incorrect,unknown}:any)=>({project,correct,incorrect,unknown})).sort((a:any,b:any)=>b.correct-a.correct))
