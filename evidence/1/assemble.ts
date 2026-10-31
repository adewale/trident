import { cpSync, existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { readBenchmarkDocument as read } from '/workspace/trident-ecosystem-results/portable/project-records.ts'
const root='/workspace/trident-ecosystem-2026-10-31-campaign',out='/workspace/trident-ecosystem-2026-10-31-combined'
if(existsSync(out)) throw Error('Fresh output required')
const sha=(file:string)=>createHash('sha256').update(readFileSync(file)).digest('hex')
const write=(file:string,v:any)=>writeFileSync(file,JSON.stringify(v)+'\n')
cpSync(root,out,{recursive:true});cpSync(join(root,'report.json'),join(out,'report.initial.json'));cpSync(join(root,'docs/result.json'),join(out,'docs/result.initial.json'))
const report:any=read(join(root,'report.json')),docs:any=read(join(root,'docs/result.json'))
const sourceRows=[{file:root+'/docs/result.json',sha256:sha(root+'/docs/result.json'),purpose:'Original SVG and PNG outcomes, including interrupted Merslim and unbound Merman native PNG.'}]
const replacement=(project:string,format:string,directory:string,missingOnly=false)=>{
 const file=join(root,directory,'docs/result.json'), result:any=read(file)
 const incoming=result.observations.filter((x:any)=>x.metrics?.project===project&&x.format===format&&['render','drawing-checks'].includes(x.operation))
 const previous=docs.observations.filter((x:any)=>x.metrics?.project===project&&x.format===format&&['render','drawing-checks'].includes(x.operation))
 if(missingOnly&&incoming.some((x:any)=>previous.some((p:any)=>p.caseId===x.caseId&&p.operation===x.operation&&p.metrics.round===x.metrics.round)))throw Error('Repair duplicates an observed coordinate')
 if(!missingOnly) docs.observations=docs.observations.filter((x:any)=>!(x.metrics?.project===project&&x.format===format))
 else docs.observations=docs.observations.filter((x:any)=>!(x.metrics?.project===project&&x.format===format&&x.operation==='round'))
 docs.observations.push(...incoming)
 const renders=docs.observations.filter((x:any)=>x.metrics?.project===project&&x.format===format&&x.operation==='render')
 if(renders.length!==548||new Set(renders.map((x:any)=>x.caseId)).size!==548)throw Error('Incomplete repaired corpus')
 const inventory:any=read(join(root,directory,'docs/inventory.json'));const original:any=read(join(root,'docs/inventory.json'))
 if(JSON.stringify(inventory.cases)!==JSON.stringify(original.cases))throw Error('Repair changed corpus')
 const from=join(root,directory,'docs',format,'drawings'),to=join(out,'docs',format,'drawings')
 if(existsSync(from))for(const name of readdirSync(from)){const dest=join(to,name);if(existsSync(dest)&&sha(dest)!==sha(join(from,name)))throw Error('Witness collision');cpSync(join(from,name),dest)}
 sourceRows.push({file,sha256:sha(file),purpose:missingOnly?'Only previously unrecorded333 SVG coordinates; original215 outcomes preserved.':'First actual PNG exports through public browser SVG plus shared conversion; original unbound-native receipts preserved.'})
}
replacement('Latias94/merman','png','merman-png-repair')
replacement('emtyty/merslim','svg','merslim-svg-repair',true)
docs.assembly={assembledAt:new Date().toISOString(),sources:sourceRows,timing:'Descriptive single-pass clocks, never a qualified comparative speed campaign.'};docs.finishedAt=new Date().toISOString()
write(join(out,'docs/result.json'),docs)
const retry:any=read(join(root,'model-retry/report.json'))
for(const boundary of retry.results) { const i=report.results.findIndex((x:any)=>x.suite===boundary.suite&&x.project===boundary.project);if(i<0)throw Error('Unknown model repair project');report.results[i]=boundary }
report.results.find((x:any)=>x.suite==='docs').status=docs.status
report.assembly={...docs.assembly,models:{file:root+'/model-retry/report.json',sha256:sha(root+'/model-retry/report.json'),reason:'Original collector identity failed before any model calls; retry is first actual collection.'}}
report.updatedAt=new Date().toISOString();write(join(out,'report.json'),report);write(join(out,'collection-sources.json'),report.assembly)
console.log(out)
