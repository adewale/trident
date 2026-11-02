import { afterAll, beforeAll, expect, test } from 'bun:test'
import { chromium } from 'playwright'
import { defaultChromium } from '../unified/benchmark-context.ts'
import { drawingCases } from '../fidelity/drawing/corpus.ts'
import { inspectRegressionGeometry, inspectSvgDrawing, wholeDrawing } from '../fidelity/drawing/svg.ts'
import { captureDrawingPng } from '../fidelity/drawing/export-png.ts'
import { compareRasterWitness } from '../fidelity/drawing/png.ts'
import { assessTextDrawing } from '../fidelity/drawing/terminal.ts'
import { DrawingWorker } from '../fidelity/drawing/worker.ts'
import { resolve } from 'node:path'

let browser: any
beforeAll(async () => {
  browser = await chromium.launch({ headless: true, executablePath: defaultChromium(chromium) })
})
afterAll(async () => {
  await browser?.close()
})
test('the shared corpus retains the reviewed seed, adds real regression sources, and deduplicates repeated reproducers', () => {
  const cases = drawingCases()
  expect(cases.length).toBeGreaterThan(116)
  expect(cases.some(c => c.origins.some(o => o.repository === 'obsidianmd/pele'))).toBe(true)
  expect(cases.some(c => c.geometry.includes('edge-node-clearance'))).toBe(true)
  expect(new Set(cases.map(c => c.source.trim().replaceAll('\r\n', '\n'))).size).toBe(cases.length)
})
test('a whole drawing requires every planned observation; source and representation gaps cannot earn passes', () => {
  expect(wholeDrawing([{ criterion: 'labels', status: 'passed' }], ['labels', 'edges']).status).toBe('unknown')
  expect(
    wholeDrawing(
      [
        { criterion: 'labels', status: 'passed' },
        { criterion: 'edges', status: 'failed' },
      ],
      ['labels', 'edges'],
    ).status,
  ).toBe('incorrect')
  expect(wholeDrawing([{ criterion: 'labels', status: 'passed' }], ['labels'], ['unresolved source']).status).toBe('unknown')
  expect(wholeDrawing([{ criterion: 'edges', status: 'failed' }], ['edges'], ['incomplete source']).status).toBe('unknown')
  expect(
    wholeDrawing(
      [
        { criterion: 'labels', status: 'passed' },
        { criterion: 'svg-unique-ids', status: 'failed' },
      ],
      ['labels', 'svg-unique-ids'],
    ).status,
  ).toBe('correct')
})
test('regression route checks detect a path through an unrelated node and a bad terminal tangent', async () => {
  const page = await browser.newPage()
  try {
    await page.setContent('<svg width="400" height="200"><path d="M40 50 L300 50" stroke="black" fill="none"/></svg>')
    const start = await page.evaluate(() => {
      const p = document.querySelector('path')!
      const m = p.getScreenCTM()!
      const a = p.getPointAtLength(0).matrixTransform(m),
        b = p.getPointAtLength(p.getTotalLength()).matrixTransform(m)
      return { a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y } }
    })
    const paint: any = {
      nodes: [
        { id: 'A', box: { x: start.a.x - 40, y: start.a.y - 20, width: 40, height: 40 } },
        { id: 'B', box: { x: start.b.x, y: start.b.y - 20, width: 40, height: 40 } },
        { id: 'C', box: { x: start.a.x + 100, y: start.a.y - 10, width: 50, height: 20 } },
      ],
      connections: [{ source: 'A', target: 'B', start: start.a, end: start.b }],
      checks: [],
    }
    const bad = await page.evaluate(inspectRegressionGeometry, { paint, geometry: ['edge-node-clearance', 'orthogonal-node-approach'] })
    expect(bad.find((c: any) => c.criterion === 'edge-node-clearance').status).toBe('failed')
    paint.nodes = paint.nodes.filter((n: any) => n.id !== 'C')
    expect((await page.evaluate(inspectRegressionGeometry, { paint, geometry: ['edge-node-clearance'] }))[0].status).toBe('passed')
    paint.nodes[1].box = { x: start.b.x - 20, y: start.b.y, width: 40, height: 40 }
    expect((await page.evaluate(inspectRegressionGeometry, { paint, geometry: ['orthogonal-node-approach'] }))[0].status).toBe('failed')
  } finally {
    await page.close()
  }
})
test('full SVG assessment rejects wrong labels and missing connectors on independently drawn node controls', async () => {
  const page = await browser.newPage()
  try {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="110"><defs><marker id="arrow" viewBox="0 0 10 10" refX="0" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="black"/></marker></defs><g><rect x="20" y="25" width="100" height="50" fill="white" stroke="black"/><text x="40" y="57" font-size="18">Alpha</text></g><g><rect x="240" y="25" width="100" height="50" fill="white" stroke="black"/><text x="266" y="57" font-size="18">Beta</text></g><path d="M120 50 H229" stroke="black" fill="none" marker-end="url(#arrow)"/></svg>'
    const base = drawingCases().find(c => c.id.startsWith('regression:0be487'))!
    const input: any = {
      ...base,
      geometry: [],
      source: 'graph LR\nA[Alpha]-->B[Beta]',
      sourceGaps: [],
      expected: {
        labels: ['Alpha', 'Beta'],
        nodes: [
          { id: 'A', label: 'Alpha' },
          { id: 'B', label: 'Beta' },
        ],
        edges: [{ source: 'A', target: 'B', directed: true, startMarker: 'none', endMarker: 'arrow' }],
      },
      terminal: { ...base.terminal, expected: {} },
    }
    await page.setContent(svg)
    const positive = await inspectSvgDrawing(page, input)
    expect(positive.status, JSON.stringify({ failed: positive.failed, unknown: positive.unknown })).toBe('correct')
    await page.setContent(svg.replace('Beta', 'Omega'))
    expect((await inspectSvgDrawing(page, input)).status).toBe('incorrect')
    await page.setContent(svg.replace('<path d="M120 50 H229" stroke="black" fill="none" marker-end="url(#arrow)"/>', ''))
    expect((await inspectSvgDrawing(page, input)).status).toBe('incorrect')
  } finally {
    await page.close()
  }
})
test('PNG evidence accepts an exact checked witness and withholds judgment for changed ink or dimensions', async () => {
  const page = await browser.newPage({ viewport: { width: 80, height: 60 } })
  try {
    await page.setContent('<style>body{margin:0}</style><svg width="80" height="60"><rect x="10" y="10" width="30" height="25" fill="black"/></svg>')
    const data = (bytes: Buffer) => 'data:image/png;base64,' + bytes.toString('base64')
    const original = data(await page.screenshot({ omitBackground: true }))
    expect((await page.evaluate(compareRasterWitness, { png: original, witness: original })).status).toBe('correct')
    await page.evaluate(() => {
      document.body.style.background = 'white'
    })
    const opaque = data(await page.screenshot({ omitBackground: true }))
    expect((await page.evaluate(compareRasterWitness, { png: opaque, witness: original })).status).toBe('unknown')
    await page.evaluate(() => {
      document.body.style.background = 'transparent'
    })
    await page.locator('rect').evaluate((r: any) => r.setAttribute('width', '10'))
    const changed = data(await page.screenshot({ omitBackground: true }))
    expect((await page.evaluate(compareRasterWitness, { png: changed, witness: original })).status).toBe('unknown')
  } finally {
    await page.close()
  }
})
test('independent PNG observer reads actual pixels and cannot pass blank or dot-headed substitutes', async () => {
  const page = await browser.newPage({ viewport: { width: 360, height: 110 } }),
    worker = new DrawingWorker(['python3', resolve(import.meta.dirname, '../fidelity/drawing/png_graph.py')])
  try {
    const svg = (marker: string) =>
      `<style>body{margin:0}</style><svg width="360" height="110" xmlns="http://www.w3.org/2000/svg"><rect width="360" height="110" fill="white"/><g stroke="black" fill="white" stroke-width="2"><rect x="20" y="25" width="100" height="50"/><rect x="240" y="25" width="100" height="50"/></g><g font-family="DejaVu Sans" font-size="18" fill="black"><text x="40" y="57">Alpha</text><text x="266" y="57">Beta</text></g><path d="M120 50 H229" stroke="black" stroke-width="2"/>${marker}</svg>`
    const expected = {
      labels: ['Alpha', 'Beta'],
      nodes: [
        { id: 'A', label: 'Alpha' },
        { id: 'B', label: 'Beta' },
      ],
      edges: [{ source: 'A', target: 'B', directed: true, startMarker: 'none', endMarker: 'arrow' }],
    }
    const observe = async (value: string) => {
      await page.setContent(value)
      const bytes = await page.screenshot()
      return worker.call({ png: bytes.toString('base64'), family: 'flowchart', expected })
    }
    const actual = await observe(svg('<polygon points="239,50 227,44 227,56" fill="black"/>'))
    expect(actual.status, JSON.stringify(actual)).toBe('correct')
    expect((await observe('<svg width="360" height="110"></svg>')).status).not.toBe('correct')
    expect((await observe(svg('<circle cx="232" cy="50" r="7" fill="black"/>'))).status).not.toBe('correct')
    expect((await observe(svg('<polygon points="121,50 133,44 133,56" fill="black"/>'))).status).not.toBe('correct')
    expect((await observe(svg('<polygon points="239,50 227,44 227,56" fill="black"/>').replace('Alpha', 'Omega'))).status).not.toBe('correct')
    expect((await observe(svg('<polygon points="239,50 227,44 227,56" fill="black"/><text x="150" y="100">Unrelated</text>'))).status).not.toBe('correct')
    expect((await observe(svg('<polygon points="239,50 227,44 227,56" fill="black"/>').replace('<path d="M120 50 H229" stroke="black" stroke-width="2"/>', ''))).status).not.toBe('correct')
  } finally {
    await worker.close()
    await page.close()
  }
}, 30000)

test('terminal regression geometry needs observed frames and orthogonal owned routes', () => {
  const base = drawingCases().find(c => c.id.startsWith('regression:0be487'))!
  const source = 'flowchart LR\nA[Alpha]-->B[Beta]'
  const input: any = {
    ...base,
    id: 'regression:control',
    source,
    geometry: ['distinct-node-bodies', 'edge-node-clearance', 'orthogonal-node-approach'],
    terminal: {
      ...base.terminal,
      id: 'regression:control',
      source,
      sourceSha256: require('node:crypto').createHash('sha256').update(source).digest('hex'),
      expected: {
        status: 'independently-reviewed',
        graph: {
          nodes: [
            { id: 'A', label: 'Alpha' },
            { id: 'B', label: 'Beta' },
          ],
          edges: [{ source: 'A', target: 'B' }],
        },
      },
    },
  }
  const drawing = '┌───────┐    ┌──────┐\n│ Alpha ├───▶│ Beta │\n└───────┘    └──────┘'
  expect(assessTextDrawing(input, drawing).status).toBe('correct')
  expect(assessTextDrawing(input, drawing.replace('Beta', 'Oops')).status).not.toBe('correct')
  expect(assessTextDrawing({ ...input, geometry: ['unimplemented-fact'] }, drawing).status).toBe('unknown')
})

test('shared PNG export serializes HTML labels and normalizes percentage SVG dimensions', async () => {
  const page = await browser.newPage()
  try {
    const png = await page.evaluate(captureDrawingPng, { source: '', svg: '<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 80 60"><foreignObject width="80" height="60"><div style="color:black">Alpha<br>Beta</div></foreignObject></svg>' })
    const bytes = Buffer.from(png)
    expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
    expect(bytes.readUInt32BE(16)).toBe(80)
    expect(bytes.readUInt32BE(20)).toBe(60)
  } finally {
    await page.close()
  }
})
