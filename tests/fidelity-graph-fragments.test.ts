import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { expect, test } from 'bun:test'
import { chromium } from 'playwright'
import { inspectSvgDrawing } from '../fidelity/inspect-svg.ts'
import { chromiumExecutable } from './helpers/environment.ts'

test('a real alt frame owns both branches; an internal separator is not an outer frame border', async () => {
  const retained = JSON.parse(readFileSync(new URL('./fixtures/graph-families/mermaid-sequence-nested-fragments.json', import.meta.url), 'utf8')), svg = readFileSync(new URL('./fixtures/graph-families/mermaid-sequence-nested-fragments.svg', import.meta.url)), sha = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex')
  expect(sha(svg)).toBe(retained.svgSha256); expect(sha(retained.source)).toBe(retained.sourceSha256)
  const browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable }), page = await browser.newPage()
  try {
    await page.setContent(svg.toString())
    const input = { family: 'sequence', source: retained.source, expected: retained.expected }, correct = await inspectSvgDrawing(page, input), fragment = correct.checks.find(check => check.criterion === 'source-fact:fragments')!
    expect(fragment.status).toBe('passed')
    const alt = (fragment.actual as any[]).find(entry => entry.expected.kind === 'alt').box
    expect((fragment.actual as any[]).find(entry => entry.expected.kind === 'else').box).toEqual(alt)
    await page.evaluate((alt: { x: number; y: number; width: number; height: number }) => {
      let changed = 0
      for (const line of document.querySelectorAll('line')) {
        const b = line.getBoundingClientRect(), matrix = line.getScreenCTM(); if (!matrix) continue
        const left = Math.abs(b.x - alt.x) < .5, right = Math.abs(b.x - alt.x - alt.width) < .5, vertical = b.width < .5 && Math.abs(b.height - alt.height) < .5 && (left || right), bottom = b.height < .5 && Math.abs(b.width - alt.width) < .5 && Math.abs(b.y - alt.y - alt.height) < .5
        if (!vertical && !bottom) continue
        const p = new DOMPoint(b.x, alt.y + alt.height * .4).matrixTransform(matrix.inverse())
        if (bottom) { line.y1.baseVal.value = p.y; line.y2.baseVal.value = p.y } else if (line.y1.baseVal.value > line.y2.baseVal.value) line.y1.baseVal.value = p.y; else line.y2.baseVal.value = p.y
        changed++
      }
      if (changed !== 3) throw Error('Expected exactly the two real outer side borders and the real bottom border')
    }, alt)
    const wrong = await inspectSvgDrawing(page, input)
    expect(wrong.checks.find(check => check.criterion === 'source-fact:fragments')?.status).not.toBe('passed')
  } finally { await browser.close() }
}, 30_000)
