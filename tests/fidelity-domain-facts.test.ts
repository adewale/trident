import { afterAll, beforeAll, expect, setDefaultTimeout, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { chromium } from 'playwright'
import { expandedFidelityCases } from '../fidelity/cases.ts'
import type { MeaningExpectation } from '../fidelity/meaning.ts'
import { inspectDomainFacts } from '../fidelity/paint-domain-facts.ts'
import { inspectFidelityPaint, type PaintCheck } from '../fidelity/paint.ts'
import { chromiumExecutable } from './helpers/environment.ts'

setDefaultTimeout(30_000)
let browser: any
beforeAll(async () => { browser = await chromium.launch({ executablePath: chromiumExecutable, headless: true }) })
afterAll(async () => { await browser?.close() })
const directory = new URL('./fixtures/domain-facts/', import.meta.url)
const provenance = JSON.parse(readFileSync(new URL('provenance.json', directory), 'utf8')) as { file: string; family: string; caseId: string; sourceSha256: string; svgSha256: string }[]
const documentation = JSON.parse(readFileSync(new URL('../corpus/docs-reviewed.json', import.meta.url), 'utf8')) as any[]
const sources = JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-source-inventory.json.gz', import.meta.url))).toString()).cases as any[]
const authored = expandedFidelityCases()
const contract = (file: string) => { const entry = provenance.find(entry => entry.file === file)!; const reviewed = authored.find(item => item.id === entry.caseId) ?? documentation.find(item => item.id === entry.caseId); return { entry, source: reviewed.source ?? sources.find(item => item.id === entry.caseId).source, expected: structuredClone(reviewed.expected) as MeaningExpectation } }
const status = (checks: PaintCheck[], key: string) => checks.find(check => check.criterion === 'source-fact:' + key)?.status
async function inspect(file: string, options: { change?: string; expected?: MeaningExpectation; opaque?: boolean } = {}) {
  const { entry, source, expected } = contract(file), page = await browser.newPage({ viewport: { width: 1600, height: 1200 } })
  try {
    await page.setContent(readFileSync(new URL(file, directory), 'utf8'))
    if (options.change) await page.evaluate(options.change)
    const wanted = options.expected ?? expected
    const paint = entry.family === 'mindmap' ? await page.evaluate(inspectFidelityPaint, { family: entry.family, expected: wanted }) : { nodes: [], checks: [], connections: [], complete: true, passed: true, viewBox: null }
    if (options.opaque) paint.labelRepresentation = 'uninspectable'
    return await page.evaluate(inspectDomainFacts, { family: entry.family, source, expected: wanted, paint, quantitative: [] }) as PaintCheck[]
  } finally { await page.close() }
}

test('retained public outputs and exact source bytes retain immutable provenance', () => {
  for (const entry of provenance) {
    const { source } = contract(entry.file)
    expect(createHash('sha256').update(readFileSync(new URL(entry.file, directory))).digest('hex')).toBe(entry.svgSha256)
    expect(createHash('sha256').update(source).digest('hex')).toBe(entry.sourceSha256)
  }
})

for (const [file, keys] of [
  ['requirement-mermaid.svg', ['definitions']],
  ['timeline-mermaid.svg', ['periods', 'sections']], ['timeline-pele.svg', ['periods', 'sections']],
  ['journey-mermaid.svg', ['tasks', 'sections']], ['journey-authored-agentic.svg', ['tasks', 'sections']], ['mindmap-shaped-mermaid.svg', ['hierarchy']], ['gantt-mermaid.svg', ['tasks', 'sections', 'calendar-settings']],
  ['packet-mermaid.svg', ['fields']], ['packet-pele.svg', ['fields']],
  ['kanban-mermaid.svg', ['columns']], ['treeview-mermaid.svg', ['hierarchy']],
  ['venn-mermaid.svg', ['sets', 'intersections']], ['venn-pele.svg', ['sets', 'intersections']],
  ['wardley-mermaid.svg', ['map-axes', 'components', 'links', 'notes']],
  ['railroad-mermaid.svg', ['grammar-rules']], ['railroad-abnf-mermaid.svg', ['grammar-rules']], ['railroad-ebnf-mermaid.svg', ['grammar-rules']], ['railroad-peg-mermaid.svg', ['grammar-rules']],
  ['eventmodeling-mermaid.svg', ['frames']], ['zenuml-mermaid.svg', ['participant-order', 'participant-kinds', 'zenuml-event-order']],
] as [string, string[]][]) test('retained physical domain facts: ' + file, async () => {
  const checks = await inspect(file)
  for (const key of keys) expect(status(checks, key)).toBe('passed')
})

test('requirement fields have body owners and an exact inventory', async () => {
  const wrong = `const e=[...document.querySelectorAll('foreignObject')].find(e=>e.textContent==='ID: 1');e.querySelector('span').textContent='ID: 2'`
  expect(status(await inspect('requirement-mermaid.svg', { change: wrong }), 'definitions')).toBe('failed')
  const extra = `const e=[...document.querySelectorAll('foreignObject')].find(e=>e.textContent==='ID: 1');const c=e.cloneNode(true);c.setAttribute('x',String(Number(e.getAttribute('x')||0)+2));e.after(c)`
  expect(status(await inspect('requirement-mermaid.svg', { change: extra }), 'definitions')).not.toBe('passed')
})

test('timeline events cannot borrow another period column or gain extra captions', async () => {
  const swap = `const a=[...document.querySelectorAll('text')].find(e=>e.textContent==='LinkedIn'),b=[...document.querySelectorAll('text')].find(e=>e.textContent==='Facebook');a.textContent='Facebook';b.textContent='LinkedIn'`
  expect(status(await inspect('timeline-mermaid.svg', { change: swap }), 'periods')).toBe('failed')
  const extra = `document.querySelector('svg').insertAdjacentHTML('beforeend','<text x="20" y="20">Unrequested event</text>')`
  expect(status(await inspect('timeline-pele.svg', { change: extra }), 'periods')).toBe('failed')
})

test('journey absolute scores do not fit an expected relative ordering', async () => {
  expect((await inspect('journey-mermaid.svg')).find(check => check.criterion === 'painted-score-order')?.status).toBe('passed')
  const { expected } = contract('journey-mermaid.svg'), tasks = structuredClone(expected.facts!.tasks) as any[]
  for (const task of tasks) task.score += 1
  expect(status(await inspect('journey-mermaid.svg', { expected: { ...expected, facts: { ...expected.facts, tasks } } }), 'tasks')).toBe('failed')
  const changed = `const e=document.querySelector('circle.face');e.setAttribute('cy',String(Number(e.getAttribute('cy'))+30))`
  expect(status(await inspect('journey-mermaid.svg', { change: changed }), 'tasks')).not.toBe('passed')
  const actor = `const c=[...document.querySelectorAll('circle')].find(e=>e.getAttribute('class')==='actor-0'&&Number(e.getAttribute('cx'))>100);c.style.fill='black'`
  expect(status(await inspect('journey-mermaid.svg', { change: actor }), 'tasks')).not.toBe('passed')
})

test('radar legend requests bind every exact curve label and color swatch to actual curve paint', async () => {
  for (const file of ['radar-authored-mermaid.svg', 'radar-authored-agentic.svg']) {
    expect(status(await inspect(file), 'show-legend')).toBe('passed')
    const missing = `const e=[...document.querySelectorAll('text')].find(e=>e.textContent==='Current');e.remove()`
    expect(status(await inspect(file, { change: missing }), 'show-legend')).not.toBe('passed')
  }
})

test('a structural actor heading is bound to the visible legend and score ticks remain absolute', async () => {
  const move = `const e=[...document.querySelectorAll('text')].find(e=>e.textContent==='Actors');e.setAttribute('x','500')`
  expect(status(await inspect('journey-authored-agentic.svg', { change: move }), 'tasks')).toBe('failed')
  const wrong = `const e=[...document.querySelectorAll('circle')].find(e=>Number(e.getAttribute('r'))===16);e.setAttribute('cy',String(Number(e.getAttribute('cy'))+40))`
  expect(status(await inspect('journey-authored-agentic.svg', { change: wrong }), 'tasks')).not.toBe('passed')
})

test('mindmap endpoint covers allow only the actual exposed owned route', async () => {
  const missing = `document.querySelector('path.edge').remove()`
  expect(status(await inspect('mindmap-shaped-mermaid.svg', { change: missing }), 'hierarchy')).toBe('failed')
  const cover = `document.querySelector('svg').insertAdjacentHTML('beforeend','<rect x="45" y="190" width="30" height="25" fill="white"/>')`
  expect(status(await inspect('mindmap-shaped-mermaid.svg', { change: cover }), 'hierarchy')).not.toBe('passed')
  const extra = `const e=document.querySelector('path.edge');e.after(e.cloneNode(true))`
  expect(status(await inspect('mindmap-shaped-mermaid.svg', { change: extra }), 'hierarchy')).toBe('failed')
})

test('Gantt uses independent printed calendar ticks for absolute starts and dependencies', async () => {
  const shift = `const e=document.querySelector('rect.task');e.setAttribute('x',String(Number(e.getAttribute('x'))+25))`
  expect(status(await inspect('gantt-mermaid.svg', { change: shift }), 'tasks')).toBe('failed')
  const duration = `const e=document.querySelector('rect.task');e.setAttribute('width',String(Number(e.getAttribute('width'))-25))`
  expect(status(await inspect('gantt-mermaid.svg', { change: duration }), 'tasks')).toBe('failed')
  const ticks = `document.querySelectorAll('.tick text').forEach(e=>e.textContent='unreadable date')`
  expect(status(await inspect('gantt-mermaid.svg', { change: ticks }), 'tasks')).not.toBe('passed')
})

test('packet endpoints, extra rectangles and wrapped rows cannot reduce to relative width agreement', async () => {
  const change = `const e=[...document.querySelectorAll('text')].find(e=>e.textContent==='15');e.textContent='14'`
  expect(status(await inspect('packet-mermaid.svg', { change }), 'fields')).toBe('failed')
  const extra = `const e=document.querySelector('rect');const c=e.cloneNode(true);c.setAttribute('x',String(Number(c.getAttribute('x'))+20));c.setAttribute('y',String(Number(c.getAttribute('y'))+20));e.after(c)`
  expect(status(await inspect('packet-pele.svg', { change: extra }), 'fields')).not.toBe('passed')
  const { expected } = contract('packet-mermaid.svg'), fields = structuredClone(expected.facts!.fields) as any[]
  for (const field of fields) { field.start += 32; field.end += 32 }
  expect(status(await inspect('packet-mermaid.svg', { expected: { ...expected, facts: { ...expected.facts, fields } } }), 'fields')).toBe('failed')
})

test('Kanban cards must remain in their owned source column', async () => {
  const move = `const e=[...document.querySelectorAll('foreignObject')].find(e=>e.textContent==='Build');const g=e.closest('g.node');const t=g.getAttribute('transform');g.setAttribute('transform',t+' translate(230,0)')`
  expect(status(await inspect('kanban-authored-mermaid.svg', { change: move }), 'columns')).not.toBe('passed')
})

test('tree hierarchy requires indentation and physical parent connectors', async () => {
  const indent = `const e=[...document.querySelectorAll('text')].find(e=>e.textContent==='utils.ts');e.setAttribute('x',String(Number(e.getAttribute('x'))+30))`
  expect(status(await inspect('treeview-mermaid.svg', { change: indent }), 'hierarchy')).not.toBe('passed')
  const stem = `document.querySelectorAll('line')[4].remove()`
  expect(status(await inspect('treeview-mermaid.svg', { change: stem }), 'hierarchy')).not.toBe('passed')
})

test('Venn set and intersection membership derive from physical circles', async () => {
  const swap = `const a=[...document.querySelectorAll('text')].find(e=>e.textContent==='Desirable'),b=[...document.querySelectorAll('text')].find(e=>e.textContent==='Viable');a.textContent='Viable';b.textContent='Desirable'`
  expect(status(await inspect('venn-mermaid.svg', { change: swap }), 'intersections')).toBe('failed')
  const extra = `const e=document.querySelector('path,circle');const c=e.cloneNode(true);c.setAttribute('transform','translate(5,0)');e.after(c)`
  expect(status(await inspect('venn-pele.svg', { change: extra }), 'sets')).not.toBe('passed')
})

test('Wardley components, dependencies and evolution targets use the painted map frame', async () => {
  const move = `const e=[...document.querySelectorAll('text')].find(e=>e.textContent==='Tea');const c=e.previousElementSibling;c.setAttribute('cx',String(Number(c.getAttribute('cx'))+15))`
  expect(status(await inspect('wardley-mermaid.svg', { change: move }), 'components')).toBe('failed')
  const wrong = `document.querySelector('.wardley-link').setAttribute('x1','100')`
  expect(status(await inspect('wardley-mermaid.svg', { change: wrong }), 'links')).not.toBe('passed')
  const evolution = `const e=document.querySelector('.wardley-trend');e.setAttribute('x2',String(Number(e.getAttribute('x2'))-60))`
  expect(status(await inspect('wardley-mermaid.svg', { change: evolution }), 'evolution')).toBe('failed')
})

test('railroad grammar uses actual alternatives, terminal/reference shapes and wires', async () => {
  const swap = `const a=[...document.querySelectorAll('text')].find(e=>e.textContent==='0'),b=[...document.querySelectorAll('text')].find(e=>e.textContent==='1');a.textContent='1';b.textContent='0'`
  expect(status(await inspect('railroad-ebnf-mermaid.svg', { change: swap }), 'grammar-rules')).toBe('failed')
  const kind = `const e=document.querySelector('rect');e.setAttribute('rx','0');e.setAttribute('ry','0')`
  expect(status(await inspect('railroad-ebnf-mermaid.svg', { change: kind }), 'grammar-rules')).toBe('failed')
  const wire = `document.querySelector('path.railroad-line').remove()`
  expect(status(await inspect('railroad-abnf-mermaid.svg', { change: wire }), 'grammar-rules')).not.toBe('passed')
  expect(status(await inspect('railroad-mermaid.svg'), 'grammar-dialect')).toBe('unavailable')
})

test('event frames require their kind, exact route inventory and source chronology', async () => {
  const wrongKind = `const e=[...document.querySelectorAll('foreignObject')].find(e=>e.textContent==='AddItem');e.parentElement.querySelector('rect').setAttribute('fill','#ffb778')`
  expect(status(await inspect('eventmodeling-mermaid.svg', { change: wrongKind }), 'frames')).toBe('failed')
  const extra = `const e=document.querySelector('path.em-relation');e.after(e.cloneNode(true))`
  expect(status(await inspect('eventmodeling-mermaid.svg', { change: extra }), 'frames')).toBe('failed')
})

test('ZenUML events bind actual captions, arrows, stroke and chronology', async () => {
  const reverse = `const e=document.querySelector('svg.arrow-head g');e.setAttribute('transform','translate(7,0) scale(-1,1)')`
  expect(status(await inspect('zenuml-mermaid.svg', { change: reverse }), 'zenuml-event-order')).toBe('failed')
  const extra = `document.querySelector('g.message').after(document.querySelector('g.message').cloneNode(true))`
  expect(status(await inspect('zenuml-mermaid.svg', { change: extra }), 'zenuml-event-order')).not.toBe('passed')
  const caption = `document.querySelector('.message-label').textContent='Wrong event'`
  expect(status(await inspect('zenuml-mermaid.svg', { change: caption }), 'zenuml-event-order')).toBe('failed')
})

test('opaque alternatives and later paint cannot gain domain credit from metadata or labels', async () => {
  expect(await inspect('wardley-mermaid.svg', { opaque: true })).toEqual([])
  const cover = `document.querySelector('svg').insertAdjacentHTML('beforeend','<rect x="-1000" y="-1000" width="5000" height="5000" fill="white" style="pointer-events:none"/>')`
  for (const [file, key] of [['journey-mermaid.svg', 'tasks'], ['requirement-mermaid.svg', 'definitions'], ['packet-mermaid.svg', 'fields'], ['railroad-ebnf-mermaid.svg', 'grammar-rules']]) expect(status(await inspect(file!, { change: cover }), key!)).not.toBe('passed')
})

test('arbitrary renderer classes and generated IDs supply no domain facts', async () => {
  const rename = `const properties=['fill','stroke','stroke-width','stroke-dasharray','fill-opacity','stroke-opacity','font-family','font-size','font-weight','font-style','text-anchor','dominant-baseline','filter'];const snapshots=[...document.querySelectorAll('svg *')].map(e=>[e,properties.map(p=>getComputedStyle(e).getPropertyValue(p))]);for(const [e,values] of snapshots){properties.forEach((p,i)=>e.style.setProperty(p,values[i]));e.removeAttribute('class')}`
  for (const [file, key] of [['requirement-mermaid.svg', 'definitions'], ['timeline-mermaid.svg', 'periods'], ['journey-mermaid.svg', 'tasks'], ['wardley-mermaid.svg', 'components'], ['railroad-abnf-mermaid.svg', 'grammar-rules']]) expect(status(await inspect(file!, { change: rename }), key!)).toBe('passed')
})

test('retained Wardley evolution arrows expose their real shortened painted tips', async () => {
  expect(status(await inspect('wardley-mermaid.svg'), 'evolution')).toBe('failed')
  const repaired = `const lines=document.querySelectorAll('.wardley-trend');lines[0].setAttribute('x2','545.88');lines[1].setAttribute('x2','762.96')`
  expect(status(await inspect('wardley-mermaid.svg', { change: repaired }), 'evolution')).toBe('passed')
})

test('source-reviewed Wardley pipeline groups preserve shared visibility and every member evolution', async () => {
  for (const file of ['wardley-pipeline-mermaid.svg', 'wardley-pipeline-pele.svg']) {
    const { expected } = contract(file)
    const projected = structuredClone(expected)
    projected.facts!.components = (projected.facts!.components as any[]).map(component => component.kind === 'pipeline-group' ? component : ({ name: component.name, kind: 'pipeline-group', visibility: component.coordinates[0] }))
    expect(status(await inspect(file, { expected: projected }), 'pipelines')).toBe('passed')
    expect(status(await inspect(file, { expected: projected }), 'components')).toBe('passed')
    const wrong = `const e=document.querySelector('circle');e.setAttribute('cx',String(Number(e.getAttribute('cx'))+30))`
    expect(status(await inspect(file, { expected: projected, change: wrong }), 'pipelines')).toBe('failed')
    const removed = `document.querySelector('circle').remove()`
    expect(status(await inspect(file, { expected: projected, change: removed }), 'pipelines')).not.toBe('passed')
  }
})

test('Wardley label offsets bind the actual painted first-glyph baseline to its owned component', async () => {
  for (const file of ['wardley-offset-mermaid.svg', 'wardley-offset-pele.svg']) {
    expect(status(await inspect(file), 'components')).toBe('passed')
    const wrong = `const e=[...document.querySelectorAll('text')].find(e=>e.textContent==='Database');e.setAttribute('transform',(e.getAttribute('transform')||'')+' translate(12,0)')`
    expect(status(await inspect(file, { change: wrong }), 'components')).not.toBe('passed')
  }
})
