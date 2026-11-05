import { afterAll, beforeAll, expect, setDefaultTimeout, test } from 'bun:test'
import { gunzipSync } from 'node:zlib'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { chromium } from 'playwright'
import { inspectSvgDrawing } from '../fidelity/inspect-svg.ts'
import { chromiumExecutable } from './helpers/environment.ts'
let browser: any
setDefaultTimeout(30_000)
beforeAll(async () => { browser = await chromium.launch({ executablePath: chromiumExecutable, headless: true }) })
afterAll(async () => { await browser?.close() })
const period = (name: string, x: number, fill: string, alpha = .7, extra = '', width = 2) => `<g><path d="M${x} 20h120v80h-120Z" fill="${fill}" fill-opacity="${alpha}" stroke="#123456" stroke-width="${width}" ${extra}/><text x="${x+60}" y="65" text-anchor="middle">${name}</text></g>`
async function theme(body: string, roles: any[], equalities?: any[]) {
  const page = await browser.newPage()
  try { await page.setContent(`<svg xmlns="http://www.w3.org/2000/svg" width="550" height="160">${body}</svg>`); const expected = { labels: roles.map(role => role.owner), facts: { 'theme-paint': { comparison: 'source-paint-tokens', theme: 'independently-authored', family: 'timeline', roles, ...(equalities ? { equalities } : {}) } } }; return (await inspectSvgDrawing(page, { family: 'timeline', source: 'timeline\n2020 : First\n2021 : Second', expected })).checks.find(check => check.criterion === 'source-fact:theme-paint')?.status } finally { await page.close() }
}
test('source paint tokens permit unrequested alpha/neutral brightness while explicit paint remains strict', async () => {
  const role = { owner: '2020', kind: 'period', fill: '#123456' }
  for (const alpha of [.3,.7]) expect(await theme(period('2020',20,'#123456',alpha),[role])).toBe('passed')
  expect(await theme(period('2020',20,'#123456',.3,'style="filter:brightness(1.2)"'),[role])).toBe('passed')
  expect(await theme(period('2020',20,'#ff0000'),[role])).toBe('failed')
  expect(await theme(period('2020',20,'#123456',.5),[{...role,fillOpacity:.5}])).toBe('passed')
  expect(await theme(period('2020',20,'#123456',.25),[{...role,fillOpacity:.5}])).toBe('failed')
  expect(await theme(period('2020',20,'#123456',.3),[{...role,fill:'rgba(18,52,86,1)'}])).toBe('failed')
  expect(await theme(period('2020',20,'#eee',.3,'',2),[{owner:'2020',kind:'period',stroke:'#123456',strokeWidth:4}])).toBe('failed')
})
test('same-kind equality has no palette assumption and can exclude an explicitly overridden owner', async () => {
  const roles = [{owner:'2020',kind:'period'},{owner:'2021',kind:'period'}], equalities = [{property:'fill',roleIndices:[0,1]}]
  for (const fill of ['#222222','#cceeff']) expect(await theme(period('2020',20,fill,.3)+period('2021',190,fill,.8),roles,equalities)).toBe('passed')
  expect(await theme(period('2020',20,'#222')+period('2021',190,'#cceeff'),roles,equalities)).toBe('failed')
  expect(await theme(period('2020',20,'red')+period('2021',190,'#222')+period('2022',360,'#222'),[{owner:'2020',kind:'period',fill:'red'},...roles.map((role,index)=>({...role,owner:String(2021+index)}))],[{property:'fill',roleIndices:[1,2]}])).toBe('passed')
})
test('color-only generic node paint keeps default alpha separate from explicit alpha/width/opacity', async () => {
  const inspect = async (fill: string, properties: Record<string,string>, alpha=.3, extra='') => { const page=await browser.newPage();try{await page.setContent(`<svg xmlns="http://www.w3.org/2000/svg" width="260" height="180"><g><rect x="20" y="20" width="120" height="80" fill="${fill}" fill-opacity="${alpha}" stroke="black" stroke-width="2" ${extra}/><text x="40" y="65">Alpha</text></g></svg>`);const expected={labels:['Alpha'],nodes:[{id:'A',label:'Alpha'}],facts:{'node-paint':[{id:'A',properties}]}};return(await inspectSvgDrawing(page,{family:'flowchart',source:'flowchart TB\nA[Alpha]',expected})).checks.find(c=>c.criterion==='source-fact:node-paint')?.status}finally{await page.close()}}
  expect(await inspect('#123456',{fill:'#123456'})).toBe('passed')
  expect(await inspect('#ff0000',{fill:'#123456'})).toBe('failed')
  expect(await inspect('#123456',{fill:'#123456ff'})).toBe('failed')
  expect(await inspect('#123456',{fill:'rgba(18,52,86,.5)'},.5)).toBe('passed')
  expect(await inspect('#123456',{fill:'#123456','fill-opacity':'.5'},.25)).toBe('failed')
  expect(await inspect('#123456',{fill:'#123456','stroke-width':'4px'})).toBe('failed')
  expect(await inspect('#123456',{fill:'#123456'},.3,'style="filter:hue-rotate(90deg)"')).toBe('unavailable')
  expect(await inspect('#123456',{fill:'#123456'},.3,'style="filter:brightness(0)"')).toBe('unavailable')
  expect(await inspect('#123456',{fill:'#123456'},.3,'style="filter:brightness(.001)"')).toBe('unavailable')
  expect(await inspect('#123456',{fill:'#123456'},.3,'style="filter:brightness(1000000)"')).toBe('unavailable')
  expect(await inspect('#123456',{fill:'#123456'},.3,'style="filter:drop-shadow(1px 1px black) hue-rotate(90deg)"')).toBe('unavailable')
})
for (const index of [466,467]) test('retained source '+index+' explicit RGB does not demand an opaque default skin', async () => {
  const directory=new URL('./fixtures/theme-tokens/',import.meta.url), row=JSON.parse(readFileSync(new URL('provenance.json',directory),'utf8')).retained.find((row:any)=>row.index===index), svg=readFileSync(new URL(row.file,directory)), docs=JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-reviewed.json.gz', import.meta.url))).toString()), expected=structuredClone(docs.find((c:any)=>c.id===row.caseId).expected)
  expect(createHash('sha256').update(svg).digest('hex')).toBe(row.svgSha256);expect(createHash('sha256').update(row.source).digest('hex')).toBe(row.sourceSha256)
  expected.facts['node-paint']=index===466?[{id:'Section 1/Section 1.2',properties:{fill:'red',stroke:'#FFD600'}},{id:'Section 2/Leaf 2.1',properties:{fill:'red',stroke:'#FFD600'}}]:[{id:'Main/B',properties:{fill:'#f96',stroke:'#333','stroke-width':'2px'}}]
  const page=await browser.newPage({viewport:{width:1600,height:1200}});try{await page.setContent(svg.toString());const observed=await inspectSvgDrawing(page,{family:'treemap',source:row.source,expected});expect(observed.checks.find(c=>c.criterion==='source-fact:node-paint')?.status).toBe('passed')}finally{await page.close()}
},30_000)
