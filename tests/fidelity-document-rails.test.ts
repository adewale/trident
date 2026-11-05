import { afterAll, beforeAll, expect, setDefaultTimeout, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { chromium, type Browser } from 'playwright'
import { inspectSvgDrawing } from '../fidelity/inspect-svg.ts'
import { chromiumExecutable } from './helpers/environment.ts'
import { retainedGraphFonts } from './helpers/retained-graph-fonts.ts'

setDefaultTimeout(30_000)
let browser: Browser
beforeAll(async()=>{browser=await chromium.launch({headless:true,executablePath:chromiumExecutable})})
afterAll(async()=>{await browser?.close()})
const directory=new URL('./fixtures/document-rails/',import.meta.url),manifest=JSON.parse(readFileSync(new URL('provenance.json',directory),'utf8')),sources=JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-source-inventory.json.gz',import.meta.url))).toString()).cases,reviews=JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-reviewed.json.gz', import.meta.url))).toString())
async function inspect(svg:string,input:any){const page=await browser.newPage();try{await page.setContent(svg);await retainedGraphFonts(page);return await inspectSvgDrawing(page,input)}finally{await page.close()}}
const shape=(result:any)=>result.checks.find((check:any)=>check.criterion==='source-fact:node-shapes')
for(const entry of manifest)test('retained full-height wave document rails '+entry.index,async()=>{const svg=gunzipSync(readFileSync(new URL(entry.file,directory))).toString(),source=sources.find((row:any)=>row.id===entry.id).source,review=reviews.find((row:any)=>row.id===entry.id),sha=(value:string)=>createHash('sha256').update(value).digest('hex');expect(sha(svg)).toBe(entry.svgSha256);expect(sha(source)).toBe(entry.sourceSha256);expect((await inspect(svg,{family:review.family,source,expected:review.expected})).checks.filter(check=>check.status!=='passed')).toEqual([])})
// Independently authored cubic: the wave at t=.1 is (33.545,88.625).
// The inset rail must reach that actual boundary, not an arbitrary box height.
const input=(lined=true)=>({family:'flowchart',source:'flowchart TB\nA@{shape:'+(lined?'lin-doc':'doc')+',label:"Report"}',expected:{labels:['Report'],nodes:[{id:'A',label:'Report'}],edges:[],facts:{'node-shapes':[{id:'A',shape:lined?'lined-document':'document'}]}}})
const wave=(t:number)=>({x:(1-t)**3*20+3*(1-t)**2*t*65+3*(1-t)*t*t*110+t**3*200,y:(1-t)**3*80+3*(1-t)**2*t*120+3*(1-t)*t*t*40+t**3*65})
function drawing(change='',polyline=false,scale=1){const curve=polyline?Array.from({length:64},(_,i)=>{const p=wave((i+1)/64);return'L'+p.x+' '+p.y}).join(' '):'C65 120 110 40 200 65',body='M20 20L20 80 '+curve+(change==='missing-right'?'':'L200 20')+'Z',divider=change==='missing-divider'?'':`<line x1="33.545" x2="33.545" y1="20" y2="${change==='short-divider'?50:88.625}" stroke-opacity="${change==='faint-divider'?0.000001:1}" stroke-dasharray="${change==='dashed-invisible-divider'?'0 1000':'none'}" stroke="${change==='hidden-divider'?'none':change==='white-divider'?'white':'black'}"/>`,extra=change==='extra-divider'?'<line x1="47.36" x2="47.36" y1="20" y2="91.4" stroke="black"/>':'';return`<svg xmlns="http://www.w3.org/2000/svg" width="${260*scale}" height="${150*scale}"><g transform="scale(${scale})"><path d="${change==='rectangle'?'M20 20H200V90H20Z':body}" fill="white" stroke="black"/>${divider}${extra}${change==='covered-divider'?'<rect x="32" y="22" width="3" height="63" fill="white"/>':''}<text x="85" y="50">Report</text></g></svg>`}
test('a document owns its actual complete rails across curved and polygonal wave representations',async()=>{for(const polyline of [false,true])for(const scale of [1,2]){const actual=await inspect(drawing('',polyline,scale),input());expect(shape(actual)?.status).toBe('passed');expect(actual.checks.filter(check=>check.status!=='passed')).toEqual([])}expect(shape(await inspect(drawing('missing-divider'),input(false)))?.status).toBe('passed')})
test('an inset line cannot borrow a missing wall, short rail, absent divider or wrong silhouette',async()=>{for(const change of ['short-divider','missing-right','missing-divider','extra-divider','rectangle','hidden-divider','white-divider','covered-divider','faint-divider','dashed-invisible-divider'])expect(shape(await inspect(drawing(change),input()))?.status).not.toBe('passed')})
