import { afterAll, beforeAll, expect, setDefaultTimeout, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { chromium } from 'playwright'
import { inspectDomainFacts } from '../fidelity/paint-domain-facts.ts'
import { chromiumExecutable } from './helpers/environment.ts'
setDefaultTimeout(30_000)
const directory = new URL('./fixtures/git-observer/', import.meta.url)
const provenance = JSON.parse(readFileSync(new URL('provenance.json', directory), 'utf8')) as any[]
const reviews = JSON.parse(readFileSync(new URL('../corpus/docs-reviewed.json', import.meta.url), 'utf8')) as any[]
const sources = JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-source-inventory.json.gz', import.meta.url))).toString()).cases as any[]
let browser: any
beforeAll(async () => { browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable }) })
afterAll(async () => { await browser?.close() })
async function inspect(index: number | string, change?: string, expected?: any) {
  const meta = typeof index === 'number' ? provenance.find(row => row.index === index) : (() => { const row = JSON.parse(readFileSync(new URL('./fixtures/domain-facts/provenance.json', import.meta.url), 'utf8')).find((row: any) => row.file === index); return { ...row, id: row.caseId } })(), page = await browser.newPage({ viewport: { width: 1600, height: 1200 } })
  try {
    await page.setContent(readFileSync(new URL(meta.file, typeof index === 'number' ? directory : new URL('./fixtures/domain-facts/', import.meta.url)), 'utf8'))
    if (change) await page.evaluate(change)
    return await page.evaluate(inspectDomainFacts, { family: 'gitgraph', source: sources.find(row => row.id === meta.id).source, expected: expected ?? reviews.find(row => row.id === meta.id).expected, paint: { labelRepresentation: 'svg-text', nodes: [], checks: [], connections: [] } as any, quantitative: [] })
  } finally { await page.close() }
}
const status = (rows: any[], name: string) => rows.find(row => row.criterion === 'source-fact:' + name)?.status

test('retained Git outputs bind original project bytes and literal source hashes', () => {
  for (const meta of provenance) {
    expect(createHash('sha256').update(readFileSync(new URL(meta.file, directory))).digest('hex')).toBe(meta.svgSha256)
    expect(createHash('sha256').update(sources.find(row => row.id === meta.id).source).digest('hex')).toBe(meta.sourceSha256)
  }
})
for (const index of [270, 271, 272, 274, 275, 280, 287, 294]) test('complete retained Git commit/parent/lane facts ' + index, async () => {
  const rows = await inspect(index)
  expect(status(rows, 'commits')).toBe('passed')
  expect(status(rows, 'branches')).toBe('passed')
})
test('missing and duplicated actual parent routes fail, while independent heads remain proven', async () => {
  const remove = await inspect(272, `document.querySelector('path[d*="68 A"]').remove()`)
  expect(status(remove, 'commits')).toBe('failed'); expect(status(remove, 'branches')).toBe('passed')
  const duplicate = await inspect(272, `const e=document.querySelector('path[d*="68 A"]'),clone=e.cloneNode(true);clone.setAttribute('d','M60 -2 L90 30 Q130 60 110 88');e.after(clone)`)
  expect(status(duplicate, 'commits')).toBe('failed')
  const wrong = await inspect(272, `const e=document.querySelector('path[d*="68 A"]');e.setAttribute('d','M10 -2 L10 88 L110 88')`)
  expect(status(wrong, 'commits')).toBe('failed')
})
test('reverse X and highlight bodies require their actual complete primitive geometry', async () => {
  expect(status(await inspect(270, `const e=[...document.querySelectorAll('path')].find(e=>(e.getAttribute('d')?.match(/M/g)||[]).length===2);e.remove()`), 'commits')).toBe('failed')
  expect(status(await inspect(270, `const e=[...document.querySelectorAll('path')].find(e=>(e.getAttribute('d')?.match(/M/g)||[]).length===2);e.setAttribute('d','M105 -7L115 -7M105 3L115 3')`), 'commits')).not.toBe('passed')
  expect(status(await inspect(270, `const e=[...document.querySelectorAll('rect')].find(e=>e.getAttribute('width')==='12'&&e.getAttribute('height')==='12');e.remove()`), 'commits')).not.toBe('passed')
  expect(status(await inspect(270, `const glyph=[...document.querySelectorAll('circle')].find(e=>e.getAttribute('cx')==='110'),e=document.createElementNS(glyph.namespaceURI,'rect');for(const [k,v]of Object.entries({x:107,y:-5,width:6,height:6,fill:'none',stroke:getComputedStyle(glyph).fill,'stroke-width':6}))e.setAttribute(k,String(v));glyph.parentNode.append(e)`), 'commits')).not.toBe('passed')
})
test('foreign interior covers and unrelated text cannot borrow endpoint-caption ownership', async () => {
  for (const cover of [`<rect x="80" y="83" width="12" height="12" fill="black"/>`, `<rect x="80" y="65" width="20" height="12" fill="none" stroke="white" stroke-width="30"/>`, `<rect x="80" y="83" width="12" height="12" fill="white"/><text x="80" y="90">foreign</text>`]) {
    const change = `const svg=document.querySelector('svg'),e=document.querySelector('path[d*="68 A"]');const g=document.createElementNS(svg.namespaceURI,'g');g.setAttribute('transform',e.getAttribute('transform')||'');g.innerHTML=${JSON.stringify(cover)};e.parentNode.append(g)`
    expect(status(await inspect(272, change), 'commits')).not.toBe('passed')
  }
})
test('actual authored label/tag ownership and generated-ID independence', async () => {
  expect(status(await inspect(275, `for(const e of document.querySelectorAll('[id]'))if(e!==document.querySelector('svg'))e.id='unrelated-'+Math.random()`), 'commits')).toBe('passed')
  expect(status(await inspect(275, `const a=[...document.querySelectorAll('text')].find(e=>e.textContent==='3'),b=[...document.querySelectorAll('text')].find(e=>e.textContent==='4');a.textContent='4';b.textContent='3'`), 'commits')).toBe('failed')
  expect(status(await inspect(275, `[...document.querySelectorAll('text')].find(e=>e.textContent==='customTag').textContent='wrongTag'`), 'commits')).not.toBe('passed')
})
test('parallel generation alignment is measured independently against both retained outputs', async () => {
  const base = structuredClone(reviews[287].expected), parallel = structuredClone(reviews[288].expected)
  expect(status(await inspect(287), 'authored-config')).toBe('passed')
  expect(status(await inspect(288), 'authored-config')).toBe('passed')
  expect(status(await inspect(287, undefined, parallel), 'authored-config')).toBe('failed')
  expect(status(await inspect(288, undefined, base), 'authored-config')).toBe('failed')
})
test('source-suppressed headings and captions never remove topology or tag obligations', async () => {
  for (const index of [277, 280]) { const rows = await inspect(index); expect(status(rows, 'branches')).toBe('passed'); expect(status(rows, 'hidden-git-labels')).toBe('passed'); expect(status(rows, 'authored-config')).toBe('passed') }
  const show = `document.querySelector('svg').insertAdjacentHTML('beforeend','<text x="10" y="10">main</text>')`
  expect(status(await inspect(280, show), 'hidden-git-labels')).toBe('failed')
})
test('authored tag paint rejects contrary values and unsupported cherry semantics remain unknown', async () => {
  expect(status(await inspect(300), 'authored-config')).toBe('passed')
  expect(status(await inspect(300, `for(const e of document.querySelectorAll('text'))if(e.textContent==='v1.0.0'||e.textContent==='v2.0.0')e.style.fill='black'`), 'authored-config')).not.toBe('passed')
  const cherry = await inspect(276); expect(status(cherry, 'commits')).toBe('passed'); expect(status(cherry, 'branches')).toBe('passed')
  expect(status(await inspect(301), 'authored-config')).toBe('unavailable')
})

test('cherry-pick origin and selected parent require an owned visible annotation and physical provenance route', async () => {
  for (const text of ['cherry-pick:MERGE|parent:ONE', 'cherry-pick:TWO|parent:B']) expect(status(await inspect(276, `const e=[...document.querySelectorAll('text')].find(e=>e.textContent?.startsWith('cherry-pick:'));e.textContent=${JSON.stringify(text)}`), 'commits')).toBe('failed')
  expect(status(await inspect(276, `[...document.querySelectorAll('text')].find(e=>e.textContent?.startsWith('cherry-pick:')).textContent='MERGE'`), 'commits')).toBe('unavailable')
  expect(status(await inspect(276, `for(const e of document.querySelectorAll('circle'))if(e.getAttribute('r')==='2.75')e.remove()`), 'commits')).not.toBe('passed')
})
test('independent retained Pele lane and commit geometry uses the same source contract', async () => {
  const rows = await inspect('git-empty-order-pele.svg')
  expect(status(rows, 'commits')).toBe('passed'); expect(status(rows, 'branches')).toBe('passed')
  const erased = await inspect('git-empty-order-pele.svg', `const e=[...document.querySelectorAll('path')].find(e=>e.getAttribute('d')==='M-20,0L20,0');e.parentNode.insertAdjacentHTML('beforeend','<rect x="-20" y="-8" width="40" height="16" fill="none" stroke="white" stroke-width="30"/>')`)
  expect(status(erased, 'authored-config')).not.toBe('passed')
})
test('ordinary independent-branch commits retain global chronology even with all parents adapted', async () => {
  const change = `for(const e of document.querySelectorAll('path')){const d=e.getAttribute('d');if(d)e.setAttribute('d',d.replace(/\\b260\\b/g,'9999').replace(/\\b310\\b/g,'260').replace(/9999/g,'310'))}for(const e of document.querySelectorAll('circle')){if(e.getAttribute('cx')==='260')e.setAttribute('cx','310');else if(e.getAttribute('cx')==='310')e.setAttribute('cx','260')}for(const label of ['6','7']){const e=[...document.querySelectorAll('text')].find(e=>e.textContent===label),g=e.closest('g');g.setAttribute('transform','translate('+(label==='6'?50:-50)+' 0) '+(g.getAttribute('transform')||''))}`
  const rows = await inspect(275, change)
  expect(status(rows, 'commits')).not.toBe('passed')
})

test('parent strokes cannot gain visibility from geometry when matching the painted background', async () => {
  const change = `const svg=document.querySelector('svg');svg.insertAdjacentHTML('afterbegin','<rect x="-100" y="-100" width="1000" height="1000" fill="white"/>');for(const e of document.querySelectorAll('path'))if((e.getAttribute('d')?.match(/M/g)||[]).length===1)e.style.stroke='white'`
  expect(status(await inspect(272, change), 'commits')).not.toBe('passed')
  expect(status(await inspect(272, `for(const e of document.querySelectorAll('circle')){e.style.fill='white';e.style.stroke='white'}`), 'commits')).not.toBe('passed')
})
