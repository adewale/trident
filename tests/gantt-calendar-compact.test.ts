import {afterAll,beforeAll,expect,setDefaultTimeout,test} from 'bun:test'
import {readFileSync} from 'node:fs'
import {gunzipSync} from 'node:zlib'
import {chromium} from 'playwright'
import {inspectSvgDrawing} from '../fidelity/inspect-svg.ts'
import {reviewDocumentationSource} from '../unified/docs-source-review.ts'
import {evidenceBytesDigest} from '../portable/evidence-contract.ts'
import {chromiumExecutable} from './helpers/environment.ts'
setDefaultTimeout(30_000)
let browser:any
beforeAll(async()=>{browser=await chromium.launch({executablePath:chromiumExecutable,headless:true})})
afterAll(async()=>{await browser?.close()})
const directory=new URL('./fixtures/gantt-calendar/',import.meta.url),rows=JSON.parse(readFileSync(new URL('provenance.json',directory),'utf8'))
async function inspect(name:string,source?:string,change?:string){
  const row=rows.find((row:any)=>row.file===name+'.svg.gz'),compressed=readFileSync(new URL(row.file,directory)),svg=gunzipSync(compressed)
  expect(evidenceBytesDigest(compressed)).toBe(row.compressedSha256);expect(evidenceBytesDigest(svg)).toBe(row.svgSha256);expect(evidenceBytesDigest(row.source)).toBe(row.sourceSha256)
  const literal=source??row.source,review=reviewDocumentationSource({id:'gantt-control:'+name,family:'gantt',source:literal}),page=await browser.newPage({viewport:{width:1600,height:1200}})
  try{await page.setContent(svg.toString());if(change)await page.evaluate(change);return await inspectSvgDrawing(page,{family:'gantt',source:literal,expected:review.expected!})}finally{await page.close()}
}
const fact=(result:any,name:string)=>result.checks.find((check:any)=>check.criterion==='source-fact:'+name)
test('authored Friday/Saturday exclusion resolves source dates before comparing actual calibrated bars',async()=>{
  const result=await inspect('friday')
  expect(fact(result,'tasks').status).toBe('passed');expect(fact(result,'calendar-settings').status).toBe('passed')
  expect(fact(result,'tasks').actual.tasks.map((task:any)=>[new Date(task.calendar.start*86400000).toISOString().slice(0,10),new Date(task.calendar.end*86400000).toISOString().slice(0,10)])).toEqual([['2024-01-01','2024-02-12'],['2024-02-12','2024-03-11']])
  const wrong=rows.find((row:any)=>row.file==='friday.svg.gz').source.replace('weekend friday','weekend saturday')
  expect(fact(await inspect('friday',wrong),'tasks').status).toBe('failed')
})
test('compact mode admits nonoverlapping row reuse without disabling calendar or collision checks',async()=>{
  const result=await inspect('compact')
  for(const key of ['tasks','calendar-settings','frontmatter:displayMode'])expect(fact(result,key).status).toBe('passed')
  expect(fact(result,'frontmatter:displayMode').actual.rows).toEqual([68,92,68])
  const overlap=`const body=document.querySelector('rect[id$="-a2"]'),label=document.querySelector('text[id$="-a2-text"]');body.setAttribute('y','50');label.setAttribute('y','63.5')`
  expect(fact(await inspect('compact',undefined,overlap),'tasks').status).not.toBe('passed')
  const ordinary=rows.find((row:any)=>row.file==='compact.svg.gz').source.replace(/^---\n[\s\S]*?\n---\n/,'')
  expect(fact(await inspect('compact',ordinary),'tasks').status).toBe('failed')
})
