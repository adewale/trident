import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { chromium } from 'playwright'
import { defaultChromium } from '../unified/benchmark-context.ts'
import { assessSvgLabels, assessTerminalLabels } from '../fidelity/drawing/labels.ts'
import { assessmentFonts, fontconfigFamilies } from '../fidelity/drawing/assessment-fonts.ts'
import { drawingCases } from '../fidelity/drawing/corpus.ts'
import { expectedLabels } from '../fidelity/drawing/labels.ts'
import { retainDrawingOutput } from '../fidelity/drawing/retained-output.ts'
import { reassessDrawingRun } from '../scripts/reassess-drawing-results.ts'
import { planDigest } from '../unified/campaign-plan.ts'
import { useTempDirs } from './helpers/temp-dir.ts'
import type { DrawingCase } from '../fidelity/drawing/corpus.ts'

const temporary = useTempDirs('drawing-environment-scope-')
const edge = 'first pointerenter or focus'
const flow = {
  id: 'wrapped-edge', family: 'flowchart', source: 'flowchart LR\nA[row mounts] -->|' + edge + '| B[Kobalte tooltip]\n', sourceGaps: [],
  expected: { nodes: [{ id: 'A', label: 'row mounts' }, { id: 'B', label: 'Kobalte tooltip' }], edges: [{ source: 'A', target: 'B', label: edge }] },
  terminal: { expected: { graph: { nodes: [{}, {}], edges: [{}] } } },
} as unknown as DrawingCase
// Ondine's drawing of drawing:29fc1dab07164509: the edge label is centred over two rows.
const drawing = (second: string) => [
  '+-------------+                       +-----------------+',
  '|             | first pointerenter or |                 |',
  '|  row mounts |----       ' + second.padEnd(5) + '      ---->  Kobalte tooltip|',
  '+-------------+                       +-----------------+',
].join('\n')

test('an edge label wrapped across rows outside a walled box is unknown, not missing', () => {
  const verdict = assessTerminalLabels(flow, drawing('focus'))
  expect(verdict.status).toBe('unknown')
  expect(verdict.reason).toContain('"' + edge + '"')
  expect(verdict.reason).toContain('present in reading order on successive rows but not contiguous')
  expect(verdict.reason).toContain('ownership cannot be established')
})

test('a wrapped label with an absent word, leaked syntax or scattered words stays incorrect', () => {
  expect(assessTerminalLabels(flow, drawing('blur'))).toMatchObject({ status: 'incorrect', missing: [edge] })
  // A word fragment inside another word is not the word.
  expect(assessTerminalLabels(flow, drawing('focused')).status).toBe('incorrect')
  // Leaked source syntax remains a failure even when the wrapped words are present.
  const leaked = assessTerminalLabels(flow, drawing('focus') + '\nA[row mounts]')
  expect(leaked.status).toBe('incorrect')
  expect(leaked.leaked?.length).toBeGreaterThan(0)
  // Words in reading order but too far apart, or not horizontally overlapping, own nothing.
  const apart = (...rows: string[]) => { const lines = drawing('focus').split('\n'); lines.splice(2, 0, ...rows); return lines.join('\n') }
  const blank = '|             |                       |                 |'
  // One blank row between the runs is still a wrapped label; two blank rows, or a skipped row with other text in the band, are not.
  expect(assessTerminalLabels(flow, apart(blank)).status).toBe('unknown')
  expect(assessTerminalLabels(flow, apart(blank, blank)).status).toBe('incorrect')
  expect(assessTerminalLabels(flow, apart(blank.replace('                       ', '        other          '))).status).toBe('incorrect')
  expect(assessTerminalLabels(flow, 'row mounts first pointerenter or\nKobalte tooltip' + ' '.repeat(40) + 'focus').status).toBe('incorrect')
  // Other text inside the band means the rows are not a lone wrapped label.
  expect(assessTerminalLabels(flow, drawing('focus').replace('----       focus', '---- note  focus')).status).toBe('incorrect')
  // A partly absent label is still reported missing beside a wrapped one.
  const other = { ...flow, expected: { ...flow.expected, nodes: [...(flow.expected.nodes ?? []), { id: 'C', label: 'Gone' }] } } as unknown as DrawingCase
  const mixed = assessTerminalLabels(other, drawing('focus'))
  expect(mixed.status).toBe('incorrect')
  expect(mixed.reason).toStartWith('Missing labels: Gone; Label "' + edge + '"')
})

test('single-word labels never earn the wrapped-words downgrade', () => {
  const yes = { ...flow, expected: { ...flow.expected, edges: [{ source: 'A', target: 'B', label: 'yes' }] } } as unknown as DrawingCase
  expect(assessTerminalLabels(yes, drawing('focus').replace('first pointerenter or', 'ye                   ')).status).toBe('incorrect')
})

test('clipping measured in a fallback for an absent declared font is unavailable; installed fonts still fail', async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.TRIDENT_CHROMIUM_EXECUTABLE ?? defaultChromium(chromium) })
  const page = await browser.newPage({ javaScriptEnabled: false })
  const installed = 'families' in assessmentFonts() ? (assessmentFonts() as { families: string[] }).families.map(line => line.split(',')[0]!).find(family => /^(DejaVu Sans|Liberation Sans|FreeSans)$/.test(family)) : undefined
  try {
    const label = 'Payment Service'
    const sample = { id: 'font-scope', source: 'flowchart LR\nA[' + label + ']', family: 'flowchart', expected: { nodes: [{ id: 'A', label }], edges: [] }, sourceGaps: [], terminal: { expected: { graph: { nodes: [{ id: 'A', label }], edges: [] } } } } as unknown as DrawingCase
    const assess = async (family: string, mode: 'style' | 'stylesheet') => {
      const css = family.replaceAll('"', '&quot;')
      // Merman's pattern: a precomputed box sized for the declared face; the fallback face is wider.
      const body = mode === 'style'
        ? `<foreignObject x="10" y="10" width="200" height="60"><div xmlns="http://www.w3.org/1999/xhtml" style="font:20px/30px ${css};white-space:nowrap;color:black;background:white;overflow:hidden;width:60px;height:30px">${label}</div></foreignObject>`
        : `<style>#root{font-family:${family};font-size:20px}</style><g id="root"><foreignObject x="10" y="10" width="200" height="60"><div xmlns="http://www.w3.org/1999/xhtml" style="display:table-cell;white-space:nowrap;line-height:30px;color:black;background:white;overflow:hidden;max-width:60px;width:60px;height:30px"><span class="nodeLabel"><p style="margin:0">${label}</p></span></div></foreignObject></g>`
      await page.setContent('<!doctype html><style>body{margin:0}</style><svg xmlns="http://www.w3.org/2000/svg" width="400" height="100">' + body + '</svg>')
      const verdict = await assessSvgLabels(sample, page, '')
      return { verdict, clipping: verdict.evidence?.checks.find(check => check.criterion === 'unclipped-authored-labels') }
    }
    for (const mode of ['style', 'stylesheet'] as const) {
      const absent = await assess('"Recursive Variable", "Trident Absent Face", arial, sans-serif', mode)
      expect({ mode, status: absent.verdict.status, clipping: absent.clipping?.status }).toEqual({ mode, status: 'unknown', clipping: 'unavailable' })
      expect(absent.clipping?.scope).toContain('Declared font "Recursive Variable" is not installed on the assessing machine')
      expect(absent.clipping?.scope).toContain('environment-dependent')
      expect(absent.verdict.reason).toContain('environment-dependent')
      for (const family of ['sans-serif', 'monospace', ...(installed ? ['"' + installed + '", "Trident Absent Face"'] : [])]) {
        const present = await assess(family, mode)
        expect({ mode, family, status: present.verdict.status, clipping: present.clipping?.status }).toEqual({ mode, family, status: 'incorrect', clipping: 'failed' })
      }
    }
  } finally { await browser.close() }
}, 60000)

test('assessment fonts are the sorted, deduplicated fontconfig family list and its digest', async () => {
  const listed = fontconfigFamilies('Zeta\nAlpha,Alpha Bold\n\nZeta\n')
  expect(listed.families).toEqual(['Alpha,Alpha Bold', 'Zeta'])
  expect(listed.sha256).toBe(createHash('sha256').update('Alpha,Alpha Bold\nZeta').digest('hex'))
  const root = temporary.dir(), input = drawingCases().find(test => test.family === 'flowchart' && !test.sourceGaps.length && expectedLabels(test).length > 0)!
  const record = retainDrawingOutput(root, 'fixture', input, 'terminal', expectedLabels(input).join('\n'))
  const run = { state: 'complete', corpus: { ids: [input.id], contractSha256: planDigest([{ id: input.id, source: input.source, expected: input.expected, sourceGaps: input.sourceGaps }]) }, assessmentEnvironments: { svg: { fonts: { source: 'fc-list : family', families: ['Original'], sha256: 'x' } } }, outputs: [record], rows: [{ project: 'fixture', caseId: input.id, version: '1', format: 'terminal', status: 'unknown' }] }
  const result = await reassessDrawingRun(run, root, ['terminal'])
  expect(result.assessmentEnvironments.svg).toEqual(run.assessmentEnvironments.svg)
  expect(result.assessmentEnvironments.terminal.fonts).toEqual(assessmentFonts())
})
