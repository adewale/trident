import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { gunzipSync } from 'node:zlib'
import { afterAll, beforeAll, expect, setDefaultTimeout, test } from 'bun:test'
import { chromium } from 'playwright'
import { inspectSvgDrawing } from '../fidelity/inspect-svg.ts'
import { reviewedDocsCase } from '../unified/docs-drawings.ts'
import { reviewDocumentationSource } from '../unified/docs-source-review.ts'
import { chromiumExecutable } from './helpers/environment.ts'

setDefaultTimeout(60_000)
let browser: any
beforeAll(async () => { browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable }) })
afterAll(async () => { await browser?.close() })
const status = (result: any) => result.checks.find((c: any) => c.criterion === 'source-fact:authored-config')
const source = JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-source-inventory.json.gz', import.meta.url))).toString()).cases[332]
const review = JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-reviewed.json.gz', import.meta.url))).toString()).find((r: any) => r.id === source.id)
const original = readFileSync(new URL('./fixtures/radar-tension/mermaid-docs-332.svg', import.meta.url), 'utf8')
async function inspect(svg: string, input: any, mutate?: (page: any) => Promise<void>) {
  const page = await browser.newPage()
  try { await page.setContent(svg); if (mutate) await mutate(page); return await inspectSvgDrawing(page, input) } finally { await page.close() }
}

test('the named pinned radar coefficient owns exact actual cubic controls on retained source332', async () => {
  const provenance = JSON.parse(readFileSync(new URL('./fixtures/radar-tension/provenance.json', import.meta.url), 'utf8')), hash = (v: string) => createHash('sha256').update(v).digest('hex')
  expect(hash(original)).toBe(provenance.svgSha256); expect(hash(source.source)).toBe(provenance.sourceSha256)
  const input = reviewedDocsCase(source, review)
  expect(status(await inspect(original, input)).status).toBe('passed')
  for (const wrongT of [0, .05, .17]) {
    const wrong = await inspect(original, input, page => page.evaluate((wrongT: number) => {
      let changed = 0
      for (const path of document.querySelectorAll('path')) {
        const d = path.getAttribute('d') ?? ''; if (!d.includes('C') || !/Z\s*$/.test(d)) continue
        const parts = d.match(/[MC][^MCZ]*/g); if (!parts || parts.length !== 6) throw Error('Expected the actual closed five-segment radar cubic')
        const numbers = (s: string) => s.match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi)!.map(Number), vertices = [numbers(parts[0]!).slice(0,2), ...parts.slice(1,-1).map(p => numbers(p).slice(-2))]
        const n = vertices.length, body = vertices.map((p,i) => { const before=vertices[(i+n-1)%n]!,next=vertices[(i+1)%n]!,after=vertices[(i+2)%n]!;return 'C'+[p[0]!+wrongT*(next[0]!-before[0]!),p[1]!+wrongT*(next[1]!-before[1]!),next[0]!-wrongT*(after[0]!-p[0]!),next[1]!-wrongT*(after[1]!-p[1]!),...next].join(',') }).join(' ')
        path.setAttribute('d','M'+vertices[0]!.join(',')+' '+body+' Z'); changed++
      }
      if(changed!==3)throw Error('All three actual curve controls must be independently changed')
    }, wrongT))
    expect(status(wrong).status).toBe('failed')
    expect(wrong.checks.find((c:any)=>c.criterion==='source-fact:range')?.status).toBe('passed')
  }
})
test('range and data are proved jointly from independent grid and actual vertices, separately from tension', async () => {
  const input = reviewedDocsCase(source,review)
  expect((await inspect(original,input)).checks.find(c=>c.criterion==='source-fact:range')?.status).toBe('passed')
  // Independent source-only controls; no canonical corpus contract is changed
  // or restamped. A larger requested range alone halves the expected radii.
  const wrong = structuredClone(input); wrong.sourceReview=undefined; wrong.source=wrong.source.replace('radar-beta\n','radar-beta\n  max 10\n'); (wrong.expected.facts!.range as number[])=[0,10]
  expect(reviewDocumentationSource({id:'independent-radar-max-control',family:'radar',source:wrong.source}).expected?.facts?.range).toEqual([0,10])
  expect((await inspect(original,wrong)).checks.find(c=>c.criterion==='source-fact:range')?.status).toBe('failed')
  const equivalent=structuredClone(input); equivalent.sourceReview=undefined
  equivalent.source=equivalent.source.replace('c1{1,2,3,4,5}','c1{2,4,6,8,10}').replace('c2{5,4,3,2,1}','c2{10,8,6,4,2}').replace('c3{3,3,3,3,3}','c3{6,6,6,6,6}')
  ;(equivalent.expected.facts!.range as number[])=[0,10]
  for(const curve of equivalent.expected.facts!.curves as any[])curve.values=curve.values.map((v:number)=>v*2)
  const projected=await inspect(original,equivalent)
  expect(projected.checks.find(c=>c.criterion==='source-fact:range')?.status).toBe('passed')
  expect(status(projected).status).toBe('passed')
})

// Independently hand-computed diamond: top→right has C1=(220,100),
// C2=(300,180), end=(300,200) at t=.1; the other turns are quarter rotations.
const hand = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><g fill="none" stroke="gray"><circle cx="200" cy="200" r="50"/><circle cx="200" cy="200" r="100"/><path d="M200 200L200 100"/><path d="M200 200L300 200"/><path d="M200 200L200 300"/><path d="M200 200L100 200"/></g><path d="M200 100 C220 100 300 180 300 200 C300 220 220 300 200 300 C180 300 100 220 100 200 C100 180 180 100 200 100 Z" fill="none" stroke="blue" stroke-width="2"/><!--COVER--><g fill="black"><text x="195" y="70">A</text><text x="330" y="205">B</text><text x="195" y="340">C</text><text x="60" y="205">D</text><text x="200" y="200">0</text><text x="200" y="100">5</text></g></svg>'
const handInput = { family: 'radar', source: 'independent four-axis numeric and cubic fixture', expected: { labels: ['A','B','C','D'], facts: { axes: ['A','B','C','D'].map(id=>({id,label:id})), curves: [{ id:'curve',values:[5,5,5,5] }], range:[0,5],graticule:'circle','authored-config': {radar:{axisScaleFactor:1,curveTension:.1}} } } }
test('hand-authored cubic geometry verifies the coefficient, transformed geometry and exposed carrier without imposing an absent default', async () => {
  expect(status(await inspect(hand,handInput)).status).toBe('passed')
  const transformed=hand.replace('height="400"','height="400" viewBox="0 0 500 500"').replace('<g fill="none"','<g transform="translate(15 12) scale(.8)"><g fill="none"').replace('</svg>','</g></svg>')
  expect(status(await inspect(transformed,handInput)).status).toBe('passed')
  expect(status(await inspect(hand.replace('<!--COVER-->','<rect x="95" y="95" width="210" height="210" fill="white"/>'),handInput)).status).toBe('unavailable')
  const noDefault=structuredClone(handInput); delete (noDefault.expected.facts['authored-config'].radar as any).curveTension
  const unrequested=status(await inspect(hand,noDefault))
  expect(unrequested.status).toBe('passed'); expect(unrequested.actual.some((leaf:any)=>leaf.path==='radar.curveTension')).toBe(false)
})
