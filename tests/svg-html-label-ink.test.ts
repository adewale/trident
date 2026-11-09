import { expect, test } from 'bun:test'
import { chromium } from 'playwright'
import { defaultChromium } from '../unified/benchmark-context.ts'
import { assessSvgLabels, type LabelVerdict } from '../fidelity/drawing/labels.ts'
import type { DrawingCase } from '../fidelity/drawing/corpus.ts'

test('plain HTML ink distinguishes unused font-box overflow from clipped glyphs', async () => {
  const browser = await chromium.launch({ headless: true, executablePath: defaultChromium(chromium) })
  const page = await browser.newPage({ javaScriptEnabled: false })
  try {
    const fixtures: { label: string; height: number; width: number; status: LabelVerdict['status']; scale?: number; pseudo?: string }[] = [
      { label: 'ABC', height: 18, width: 100, status: 'correct' },
      { label: 'ABC', height: 12, width: 100, status: 'incorrect' },
      { label: 'ABC', height: 24, width: 20, status: 'incorrect' },
      { label: 'gyp', height: 24, width: 100, status: 'correct' },
      { label: 'gyp', height: 12, width: 100, status: 'incorrect' },
      { label: 'ABC', height: 18, width: 100, status: 'correct', scale: 2 },
      { label: 'ABC', height: 12, width: 100, status: 'incorrect', scale: 2 },
      { label: 'ABC', height: 18, width: 100, status: 'unknown', pseudo: '<style>div::first-letter{color:white}</style>' },
    ]
    for (const fixture of fixtures) {
      const test = { id: 'html-ink-control', source: 'flowchart LR\nA[' + fixture.label + ']', family: 'flowchart', expected: { nodes: [{ id: 'A', label: fixture.label }], edges: [] }, sourceGaps: [], terminal: { expected: { graph: { nodes: [{ id: 'A', label: fixture.label }], edges: [] } } } } as unknown as DrawingCase
      await page.setContent('<!doctype html><style>body{margin:0}</style><svg xmlns="http://www.w3.org/2000/svg" width="600" height="200">' + (fixture.pseudo ?? '') + `<g transform="scale(${fixture.scale ?? 1})"><foreignObject x="10" y="10" width="200" height="60"><div xmlns="http://www.w3.org/1999/xhtml" style="font:20px/20px sans-serif;white-space:nowrap;color:black;background:white;overflow:hidden;width:${fixture.width}px;height:${fixture.height}px">${fixture.label}</div></foreignObject></g></svg>`)
      const verdict = await assessSvgLabels(test, page, '')
      expect({ fixture, status: verdict.status }).toEqual({ fixture, status: fixture.status })
      if (fixture.status === 'incorrect') expect(verdict.evidence?.checks.find(check => check.criterion === 'unclipped-authored-labels')?.status).toBe('failed')
    }
  } finally { await browser.close() }
}, 30000)
