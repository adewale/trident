import {afterAll,beforeAll,expect,setDefaultTimeout,test} from 'bun:test'
import {readFileSync} from 'node:fs'
import {gunzipSync} from 'node:zlib'
import {createHash} from 'node:crypto'
import {chromium} from 'playwright'
import {inspectSvgDrawing} from '../fidelity/inspect-svg.ts'
import {chromiumExecutable} from './helpers/environment.ts'
setDefaultTimeout(30_000)
let browser:any
beforeAll(async()=>{browser=await chromium.launch({executablePath:chromiumExecutable,headless:true})})
afterAll(async()=>{await browser?.close()})
const directory=new URL('./fixtures/svg-exposed-borders/',import.meta.url),provenance=JSON.parse(readFileSync(new URL('provenance.json',directory),'utf8'))
const reviewed=JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-reviewed.json.gz', import.meta.url))).toString()),sources=JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-source-inventory.json.gz',import.meta.url))).toString()).cases
const status=(paint:any)=>paint.checks.find((check:any)=>check.criterion==='painted-node-visibility')?.status
async function inspect(svg:string,input:any,mutation?:string){const page=await browser.newPage({viewport:{width:1400,height:1000}});try{await page.setContent(svg);if(mutation)await page.evaluate(mutation);return await inspectSvgDrawing(page,input)}finally{await page.close()}}
for(const index of[55,64,104])test('actual stroke-only border does not claim inherited fill area: '+index,async()=>{
 const row=provenance.find((row:any)=>row.index===index),svg=readFileSync(new URL(row.file,directory),'utf8'),hash=(value:string)=>createHash('sha256').update(value).digest('hex')
 expect(hash(svg)).toBe(row.svgSha256);expect(hash(sources[index].source)).toBe(row.sourceSha256)
 const input={family:reviewed[index].family,source:sources[index].source,expected:reviewed[index].expected}
 expect(status(await inspect(svg,input))).toBe('passed')
 const overlay=`const root=document.querySelector('svg');const e=document.createElementNS(root.namespaceURI,'rect');e.setAttribute('x','10');e.setAttribute('y','10');e.setAttribute('width','500');e.setAttribute('height','500');e.setAttribute('fill','red');root.append(e)`
 expect(status(await inspect(svg,input,overlay))).not.toBe('passed')
})
test('collinear cubic borders need exposed nonzero stroke and do not excuse foreign covers',async()=>{
 const body='<g><path d="M20 20C40 20 80 20 120 20M120 20L120 80M120 80L20 80M20 80L20 20" fill="red" stroke="black" stroke-width="2"/><text x="45" y="55">Alpha</text></g>',svg='<svg xmlns="http://www.w3.org/2000/svg" width="160" height="110">'+body+'</svg>',input={family:'flowchart',source:'flowchart LR\nA[Alpha]',expected:{labels:['Alpha'],nodes:[{id:'A',label:'Alpha'}]}}
 expect(status(await inspect(svg,input))).toBe('passed')
 const requestedFill={...input,expected:{...input.expected,facts:{'node-paint':[{id:'A',properties:{fill:'red'}}]}}}
 expect((await inspect(svg,requestedFill)).checks.find((check:any)=>check.criterion==='source-fact:node-paint')?.status).not.toBe('passed')
 for(const property of ['stroke:none','stroke-opacity:0','stroke-opacity:0.000001','stroke-width:0','stroke-width:0.0001','stroke-dasharray:0 1000'])expect(status(await inspect(svg,input,`document.querySelector('path').setAttribute('style',${JSON.stringify(property)})`))).not.toBe('passed')
 const covered=svg.replace('</svg>','<rect x="18" y="18" width="5" height="64" fill="white"/></svg>')
 expect(status(await inspect(covered,input))).not.toBe('passed')
})

test('retained delay border has collinear and zero-length subpaths, while a bowed fill cannot borrow it',async()=>{
 const svg=readFileSync(new URL('191.svg',directory),'utf8'),index=191,input={family:reviewed[index].family,source:sources[index].source,expected:reviewed[index].expected},row=provenance.find((row:any)=>row.index===index),hash=(value:string)=>createHash('sha256').update(value).digest('hex')
 expect(hash(svg)).toBe(row.svgSha256);expect(hash(sources[index].source)).toBe(row.sourceSha256)
 const page=await browser.newPage({viewport:{width:1400,height:1000}})
 try{
  await page.setContent(svg)
  // The actual first path owns the delay's interior. The second path is108
  // separately closed chord subpaths (including4 points), not a curved fill.
  expect(await page.evaluate(()=>[...document.querySelectorAll('g.node path')].map(element=>(element as SVGGeometryElement).isPointInFill(new DOMPoint(-11,-20))))).toEqual([true,false])
  expect(status(await inspectSvgDrawing(page,input))).toBe('passed')
  await page.evaluate(()=>document.querySelectorAll('g.node path')[1]!.setAttribute('d','M-78.6002512578676 -22.5 C-34 -10 11 -10 56.1002512578676 -22.5'))
  expect(await page.evaluate(()=>(document.querySelectorAll('g.node path')[1] as SVGGeometryElement).isPointInFill(new DOMPoint(-11,-20)))).toBe(true)
  expect(status(await inspectSvgDrawing(page,input))).toBe('unavailable')
 }finally{await page.close()}
})
