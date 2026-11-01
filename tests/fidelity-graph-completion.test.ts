import { afterAll, beforeAll, expect, setDefaultTimeout, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { chromium } from 'playwright'
import { inspectSvgDrawing } from '../fidelity/inspect-svg.ts'
import { chromiumExecutable } from './helpers/environment.ts'

setDefaultTimeout(30_000)
let browser: any
beforeAll(async () => { browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable }) })
afterAll(async () => { await browser?.close() })
const directory = new URL('./fixtures/graph-completion/', import.meta.url), provenance = JSON.parse(readFileSync(new URL('provenance.json', directory), 'utf8'))
const sources = JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-source-inventory.json.gz', import.meta.url))).toString()).cases, reviews = JSON.parse(readFileSync(new URL('../corpus/docs-reviewed.json', import.meta.url), 'utf8'))
async function inspect(svg: string, input: any) { const page = await browser.newPage(); try { await page.setContent(svg); return await inspectSvgDrawing(page, input) } finally { await page.close() } }
const status = (paint: any, criterion: string) => paint.checks.find((c: any) => c.criterion === criterion)?.status
test('retained graph gaps close from actual contours and complete observed topology', async () => {
  for (const meta of provenance) {
    const svg = gunzipSync(readFileSync(new URL(meta.file, directory))).toString(), source = sources.find((c: any) => c.id === meta.id).source, review = reviews.find((c: any) => c.id === meta.id)
    expect(createHash('sha256').update(svg).digest('hex')).toBe(meta.svgSha256)
    expect(createHash('sha256').update(source).digest('hex')).toBe(meta.sourceSha256)
    const actual = await inspect(svg, { family: review.family, source, expected: review.expected })
    expect(actual.checks.filter((c: any) => c.status !== 'passed')).toEqual([])
  }
}, 120_000)
const edgeSvg = (change = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="150"><defs><marker id="head" viewBox="0 0 10 10" markerWidth="8" markerHeight="8" refX="10" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path d="${change === 'wrong-marker' ? 'M0 0H10V10H0Z' : 'M0 0L10 5L0 10Z'}" fill="black"/></marker></defs><g><rect x="20" y="30" width="80" height="60" fill="white" stroke="black"/><text x="35" y="65">Alpha</text></g><g><rect x="220" y="30" width="80" height="60" fill="white" stroke="black"/><text x="235" y="65">Beta</text></g>${change === 'missing' ? '' : `<path d="M100 60H${change === 'detached' ? 180 : 220}" stroke="black" fill="none" marker-end="url(#head)"/>`}${change === 'extra' ? '<path d="M100 70H220" stroke="black" fill="none" marker-end="url(#head)"/>' : ''}</svg>`
test('graph family admission requires all actual endpoints, markers and exact multiplicity', async () => {
  const expected = { labels: ['Alpha', 'Beta'], nodes: [{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }], edges: [{ source: 'a', target: 'b', directed: true, startMarker: 'none', endMarker: 'arrow' }] }
  for (const family of ['agentflow', 'swimlane', 'usecase']) {
    const source = family === 'agentflow' ? 'agentflow TB\na[Alpha] --> b[Beta]' : family === 'swimlane' ? 'swimlane-beta LR\na[Alpha] --> b[Beta]' : 'usecase-beta\na[Alpha]\nb[Beta]\na --> b'
    const input = { family, source, expected }
    expect(status(await inspect(edgeSvg(), input), 'painted-relationships')).toBe('passed')
    for (const change of ['missing', 'detached', 'extra', 'wrong-marker']) expect(status(await inspect(edgeSvg(change), input), 'painted-relationships')).not.toBe('passed')
  }
})
const nodeInput = (shape: string) => ({ family: 'flowchart', source: 'flowchart TB\n' + (shape === 'asymmetric' ? 'A>Alpha]' : shape === 'stadium' ? 'A([Alpha])' : 'A[Alpha]'), expected: { labels: ['Alpha'], nodes: [{ id: 'A', label: 'Alpha' }], edges: [], facts: { 'node-shapes': [{ id: 'A', shape }] } } })
const nodeSvg = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="250" height="140">${body}<text x="85" y="65">Alpha</text></svg>`
test('straight cubic polygons preserve shape while bowed or wrong silhouettes cannot borrow it', async () => {
  const path = 'M20 30 C80 30 140 30 200 30 C200 50 200 70 200 90 C140 90 80 90 20 90 C30 80 40 70 50 60 C40 50 30 40 20 30', body = `<path d="${path}" fill="white" stroke="black"/>`
  expect(status(await inspect(nodeSvg(body), nodeInput('asymmetric')), 'source-fact:node-shapes')).toBe('passed')
  expect(status(await inspect(nodeSvg(body.replace('80 30 140 30', '80 5 140 5')), nodeInput('asymmetric')), 'source-fact:node-shapes')).not.toBe('passed')
  expect(status(await inspect(nodeSvg('<path d="M20 30H200V90H20Z" fill="white" stroke="black"/>'), nodeInput('asymmetric')), 'source-fact:node-shapes')).toBe('failed')
})
test('stadium contours and separate coincident borders supply measured visible ink', async () => {
  const capsule = '<path d="M50 30H170A30 30 0 0 1 170 90H50A30 30 0 0 1 50 30Z" fill="white" stroke="black"/>'
  expect(status(await inspect(nodeSvg('<rect x="20" y="30" width="180" height="60" rx="1" ry="30" fill="white" stroke="black"/>'), nodeInput('stadium')), 'source-fact:node-shapes')).not.toBe('passed')
  const missingRails = '<g><path d="M50 30A30 30 0 0 0 50 90 M170 30A30 30 0 0 1 170 90" fill="white" stroke="black"/></g>'
  expect(status(await inspect(nodeSvg(missingRails), nodeInput('stadium')), 'source-fact:node-shapes')).not.toBe('passed')
  const observed = await inspect(nodeSvg(capsule), nodeInput('stadium'))
  expect(status(observed, 'source-fact:node-shapes')).toBe('passed'); expect(status(observed, 'painted-node-visibility')).toBe('passed')
  const d = 'M20 30H200V90H20Z', pair = `<path d="${d}" fill="white" stroke="none"/><path d="${d}" fill="none" stroke="black"/>`
  expect(status(await inspect(nodeSvg(pair), nodeInput('rectangle')), 'painted-node-visibility')).toBe('passed')
  expect(status(await inspect(nodeSvg(pair.replace('stroke="black"', 'stroke="white"')), nodeInput('rectangle')), 'painted-node-visibility')).not.toBe('passed')
  expect(status(await inspect(nodeSvg(pair + `<path d="${d}" fill="white" stroke="white" stroke-width="6"/>`), nodeInput('rectangle')), 'painted-node-visibility')).not.toBe('passed')
})

const symbolInput = (shape: string, count = 1) => ({ family: 'flowchart', source: 'flowchart TB\n'+Array.from({length:count},(_,i)=>String.fromCharCode(65+i)+'@{shape:'+shape+'}').join('\n'), expected: { labels: [], nodes: Array.from({length:count},(_,i)=>({id:String.fromCharCode(65+i),label:''})),edges:[],facts:{'node-shapes':Array.from({length:count},(_,i)=>({id:String.fromCharCode(65+i),shape})),'symbol-only-nodes':Array.from({length:count},(_,i)=>({id:String.fromCharCode(65+i),shape,labelPolicy:'unprinted',ownership:'unique-visible-glyph'}))} } })
const symbolSvg=(ink:string)=>'<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150">'+ink+'</svg>'
test('unprinted glyph ownership is unique before its independently measured shape is compared',async()=>{
 const circle='<circle cx="60" cy="60" r="20" fill="black" stroke="black"/>',second='<circle cx="160" cy="60" r="20" fill="black" stroke="black"/>'
 const positive=await inspect(symbolSvg(circle),symbolInput('sm-circ'));expect(positive.checks.filter((c:any)=>c.status!=='passed')).toEqual([])
 expect(status(await inspect(symbolSvg('<rect x="40" y="40" width="40" height="40" fill="black"/>'),symbolInput('sm-circ')),'source-fact:node-shapes')).toBe('failed')
 for(const [ink,count] of [['',1],[circle+second,1],[circle+second,2]] as const) expect(status(await inspect(symbolSvg(ink),symbolInput('sm-circ',count)),'source-fact:symbol-only-nodes')).not.toBe('passed')
 expect(status(await inspect(symbolSvg(circle+'<circle cx="60" cy="60" r="16" fill="white"/>'),symbolInput('f-circ')),'source-fact:node-shapes')).not.toBe('passed')
 expect((await inspect(symbolSvg(circle+'<rect x="40" y="40" width="40" height="40" fill="black"/>'),symbolInput('sm-circ'))).passed).toBe(false)
 const image='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Crect width=%2240%22 height=%2240%22 fill=%22white%22/%3E%3C/svg%3E'
 expect((await inspect(symbolSvg(circle+`<image x="40" y="40" width="40" height="40" fill="none" href="${image}"/>`),symbolInput('sm-circ'))).passed).toBe(false)
 expect((await inspect(symbolSvg(circle+`<image x="200" y="40" width="40" height="40" fill="none" href="${image}"/>`),symbolInput('sm-circ'))).passed).toBe(true)
 expect(status(await inspect(symbolSvg(circle),symbolInput('framed-circle')),'source-fact:node-shapes')).toBe('failed')
})

const inheritanceInput={family:'class',source:'classDiagram\nclass Alpha\nclass Beta\nAlpha <|-- Beta',expected:{labels:['Alpha','Beta'],nodes:[{id:'Alpha',label:'Alpha'},{id:'Beta',label:'Beta'}],edges:[{source:'Alpha',target:'Beta',directed:true,startMarker:'triangle',endMarker:'none'}]}}
const inheritanceSvg=(change='',scale=1)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${400*scale}" height="${180*scale}"><defs><marker id="tri" viewBox="0 0 30 14" markerWidth="30" markerHeight="14" refX="${change==='detached'?40:18}" refY="7" markerUnits="userSpaceOnUse" orient="auto"><polygon points="${change==='reversed'?'26,7 18,13 18,1':'10,7 18,13 18,1'}" fill="white" stroke="black"/></marker></defs><g transform="scale(${scale})"><g><rect x="20" y="30" width="80" height="60" fill="white" stroke="black"/><text x="35" y="65">Alpha</text></g><g><rect x="220" y="30" width="80" height="60" fill="white" stroke="black"/><text x="235" y="65">Beta</text></g><path d="M118 60H220" fill="none" stroke="black" marker-start="url(#tri)"/>${change==='thin'?'<rect x="108.95" y="50" width=".2" height="20" fill="gray"/>':''}${change==='foreign'?'<rect x="102" y="50" width="5" height="20" fill="gray" stroke="black"/>':''}${change==='neighbor'?'<g><rect x="102" y="50" width="5" height="20" fill="gray" stroke="black"/><text x="103" y="60" font-size="4">G</text></g>':''}</g></svg>`
test('marker approach uses its measured direction and extent with scale-invariant unique ownership',async()=>{
 for(const scale of [1,2])expect(status(await inspect(inheritanceSvg('',scale),inheritanceInput),'painted-relationships')).toBe('passed')
 for(const change of ['reversed','detached','neighbor','foreign','thin']) {const input=change==='neighbor'?{...inheritanceInput,source:inheritanceInput.source+'\nclass G',expected:{...inheritanceInput.expected,labels:[...inheritanceInput.expected.labels,'G'],nodes:[...inheritanceInput.expected.nodes,{id:'G',label:'G'}]}}:inheritanceInput;expect(status(await inspect(inheritanceSvg(change),input),'painted-relationships')).not.toBe('passed')}
})
