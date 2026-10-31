import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { afterAll, beforeAll, expect, test } from 'bun:test'
import { chromium } from 'playwright'
import { inspectSvgDrawing } from '../fidelity/inspect-svg.ts'
import { chromiumExecutable } from './helpers/environment.ts'
const sourceInventory = JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-source-inventory.json.gz', import.meta.url))).toString())
const retained = JSON.parse(readFileSync(new URL('./fixtures/graph-families/retained-shapes-provenance.json', import.meta.url), 'utf8')).retained
const cases = [{ index: 180, shape: 'notch-rect', label: 'Card' }, { index: 181, shape: 'lin-rect', label: 'Lined process' }, { index: 193, shape: 'lin-cyl', label: 'Disk storage' }, { index: 195, shape: 'div-rect', label: 'Divided process' }, { index: 197, shape: 'win-pane', label: 'Internal storage' }]
let browser: any
beforeAll(async () => { browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable }) })
afterAll(async () => { await browser?.close() })
for (const example of cases) test('retained actual compound shape ' + example.index + ' owns its real corners and divider/ridge paint', async () => {
  const provenance = retained.find((entry: any) => entry.docsIndex === example.index), source = sourceInventory.cases[example.index], bytes = readFileSync(new URL('./fixtures/graph-families/' + provenance.file, import.meta.url)), sha = (bytes: string | Uint8Array) => createHash('sha256').update(bytes).digest('hex')
  expect(sha(bytes)).toBe(provenance.svgSha256); expect(sha(source.source)).toBe(provenance.sourceSha256); expect(source.id).toBe(provenance.caseId)
  const expected = { labels: [example.label], nodes: [{ id: 'A', label: example.label }], facts: { 'node-shapes': [{ id: 'A', shape: example.shape }] } }, page = await browser.newPage()
  try {
    await page.setContent(bytes.toString())
    const positive = await inspectSvgDrawing(page, { family: 'flowchart', source: source.source, expected })
    expect(positive.checks.find(check => check.criterion === 'source-fact:node-shapes')?.status).toBe('passed')
    await page.evaluate(({ index }: { index: number }) => {
      const shapes = [...document.querySelectorAll('path,polygon')].filter(element => !element.closest('defs,marker'))
      if (index === 180) { const polygon = shapes.find(element => element.localName === 'polygon') as SVGPolygonElement, b = polygon.getBBox(); polygon.setAttribute('points', [[b.x,b.y],[b.x+b.width,b.y],[b.x+b.width,b.y+b.height],[b.x,b.y+b.height]].map(p => p.join(',')).join(' ')); return }
      if (index === 193) { const body = shapes.find(element => /[aA]/.test(element.getAttribute('d') ?? ''))!, paths = body.getAttribute('d')!.match(/[M][^M]*/g)!; if (paths.length !== 2) throw Error('Actual lined cylinder must have two actual independent drawn subpaths'); body.setAttribute('d', paths[0]!); return }
      let removed = 0
      for (const element of shapes) {
        if (element.localName !== 'path' || getComputedStyle(element).stroke === 'none') continue
        const path = element as SVGPathElement, b = path.getBBox(), parts = path.getAttribute('d')?.match(/[M][^M]*/g)
        if (!parts) continue
        if (parts.length === 1 && !/[acqstv]/i.test(parts[0]!.replace(/[eE][-+]?\d+/g, ''))) { path.setAttribute('d', `M${b.x} ${b.y} H${b.x+b.width} V${b.y+b.height} H${b.x} Z`); removed++; continue }
        const kept = parts.filter(d => { const segment = document.createElementNS('http://www.w3.org/2000/svg', 'path'); segment.setAttribute('d', d); const length = segment.getTotalLength(), points = Array.from({ length: 65 }, (_, i) => segment.getPointAtLength(length * i / 64)), x = points.map(p => p.x), y = points.map(p => p.y), vertical = Math.max(...x)-Math.min(...x)<.05 && Math.max(...y)-Math.min(...y)>b.height*.65 && x[0]!>b.x+1 && x[0]!<b.x+b.width-1, horizontal = Math.max(...y)-Math.min(...y)<.05 && Math.max(...x)-Math.min(...x)>b.width*.65 && y[0]!>b.y+1 && y[0]!<b.y+b.height-1, remove = index === 195 ? horizontal : vertical; if (remove) removed++; return !remove })
        path.setAttribute('d', kept.join(' '))
      }
      if (!removed) throw Error('Adverse control failed to remove actual internal divider paint')
    }, { index: example.index })
    const wrong = await inspectSvgDrawing(page, { family: 'flowchart', source: source.source, expected })
    expect(wrong.checks.find(check => check.criterion === 'source-fact:node-shapes')?.status).not.toBe('passed')
  } finally { await page.close() }
}, 30_000)
