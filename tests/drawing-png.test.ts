import { expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { chromiumExecutable } from './helpers/environment.ts'
import { assessPngLabels, pngControlCase, pngControls, pngDrawingLaneApplies, pngLabelProfile, readsLabel, type PngLine, type PngReading } from '../fidelity/drawing/png-labels.ts'
import { PngTextReader } from '../fidelity/drawing/png-reader.ts'
import { drawingAssessmentProfiles, drawingObserverSources, verifyPngObserver } from '../fidelity/drawing/observer-contract.ts'
import { readDrawingOutput, readDrawingOutputBytes, retainDrawingOutput } from '../fidelity/drawing/retained-output.ts'
import { classifyObligations } from '../fidelity/drawing/obligations.ts'
import { drawingCases } from '../fidelity/drawing/corpus.ts'
import { mergeDrawingResults } from '../scripts/merge-drawing-results.ts'
import { synthesiseBenchmarks } from '../unified/overall-score.ts'
import { communityDeclaresOutput } from '../unified/community.ts'
import { pngLanesNeedingBundle } from '../unified/drawing-correctness.ts'
import { useTempDirs } from './helpers/temp-dir.ts'
import { reassessDrawingRun } from '../scripts/reassess-drawing-results.ts'
import { planDigest } from '../unified/campaign-plan.ts'

const temporary = useTempDirs('drawing-png-')
const line = (x: number, y: number, ...words: [string, number][]): PngLine => ({ box: [x, y, x + 12 * words.reduce((n, [w]) => n + w.length + 1, 0), y + 12], words: words.map(([text, conf], i) => ({ text, conf, box: [x + i * 40, y, 30, 12] })) })
const reading = (...lines: PngLine[]): PngReading => ({ status: 'observed', uniform: false, width: 400, height: 200, lines })
const control = (label: string, extra: Partial<Parameters<typeof pngControlCase>[0]> = {}) => pngControlCase({ name: 'unit', label, svg: '', status: 'correct', ...extra })

test('PNG lane credits only labels read whole in confident words; unread labels stay unknown', () => {
  const alpha = control('Alpha')
  expect(assessPngLabels(alpha, reading(line(10, 10, ['Alpha', 97]))).status).toBe('correct')
  // A label OCR does not read, reads weakly or reads differently is unassessed, never missing.
  for (const shown of [line(10, 10, ['Beta', 97]), line(10, 10, ['Alpha', 30]), line(10, 10, ['Alpho', 97])]) {
    const verdict = assessPngLabels(alpha, reading(shown))
    expect(verdict.status).toBe('unknown')
    expect(verdict.reason).toContain('unassessed rather than missing')
  }
  // Punctuation may adjoin a label inside a word; letters or digits may not.
  expect(readsLabel('Success', [line(10, 10, ['[Success]', 96])])).toBe(true)
  expect(readsLabel('Alpha', [line(10, 10, ['xAlpha', 96])])).toBe(false)
  expect(readsLabel('Box', [line(10, 10, ['Box<T>', 96])])).toBe(false)
  // Wrapped onto a directly following, overlapping row; not onto a distant one.
  const wrapped = control('Small rectangle')
  expect(assessPngLabels(wrapped, reading(line(10, 10, ['Small', 95]), line(10, 24, ['rectangle', 95]))).status).toBe('correct')
  expect(assessPngLabels(wrapped, reading(line(10, 10, ['Small', 95]), line(10, 80, ['rectangle', 95]))).status).toBe('unknown')
  expect(assessPngLabels(wrapped, reading(line(10, 10, ['Small', 95]), line(300, 24, ['rectangle', 95]))).status).toBe('unknown')
  // A label made only of glyphs OCR confuses earns no credit even when read.
  expect(assessPngLabels(control('Il1'), reading(line(10, 10, ['Il1', 99]))).status).toBe('unknown')
})

test('PNG lane fails only on positive pixel evidence', () => {
  const alpha = control('Alpha')
  const glued = assessPngLabels(alpha, reading(line(10, 10, ['A[Alpha]', 95])))
  expect(glued.status).toBe('incorrect')
  expect(glued.leaked).toEqual(['A[Alpha'])
  expect(assessPngLabels(alpha, reading(line(10, 10, ['flowchart', 96], ['LR', 96]), line(10, 40, ['Alpha', 97]))).status).toBe('incorrect')
  // Weakly read syntax is not evidence.
  expect(assessPngLabels(alpha, reading(line(10, 10, ['flowchart', 60], ['LR', 96]), line(10, 40, ['Alpha', 97]))).status).toBe('correct')
  expect(assessPngLabels(alpha, { status: 'observed', uniform: true, lines: [] }).status).toBe('incorrect')
  expect(assessPngLabels(alpha, { status: 'unknown', reason: 'Raster reader pixel bound exceeded' }).status).toBe('unknown')
  const empty = control('', { empty: true })
  expect(assessPngLabels(empty, { status: 'observed', uniform: true, lines: [] }).status).toBe('correct')
  expect(assessPngLabels(empty, reading()).status).toBe('incorrect')
})

test('the PNG lane applies only where no SVG or terminal lane assesses the same drawing', () => {
  const catalog = JSON.parse(readFileSync(join(import.meta.dirname, '../docs/evidence/benchmark-campaign-2026-11-14/catalog.json'), 'utf8'))
  const lanes = catalog.nodes.filter((node: any) => pngDrawingLaneApplies(['svg', 'terminal', 'png'].filter(format => communityDeclaresOutput(node, format)))).map((node: any) => node.id)
  expect(lanes).toEqual(['pub:mermaid_flutter'])
  // Native PNG beside an SVG (mmdr, Merslim) is the SVG lane's drawing.
  expect(pngDrawingLaneApplies(['svg', 'png'])).toBe(false)
  expect(pngDrawingLaneApplies(['terminal', 'png'])).toBe(false)
})

test('PNG profile is named and bound to its reader, judge and controls', () => {
  expect(pngLabelProfile).toContain('presence-only')
  expect(drawingAssessmentProfiles(['png']).png).not.toBe(drawingAssessmentProfiles(['svg']).svg)
  expect(Object.keys(drawingObserverSources(['png']).png!)).toEqual(['labels.ts', 'observer-contract.ts', 'png-labels.ts', 'png-reader.ts', 'png_text_reader.py'])
  // Positive and negative controls, including the ones that must not be credited.
  expect(new Set(pngControls.map(c => c.status))).toEqual(new Set(['correct', 'incorrect', 'unknown']))
})

// The reader uses Ubuntu's Tesseract data, and the native PNG lane runs only on
// Linux x64, where its Flutter bundle runs.
test.skipIf(process.platform !== 'linux')('PNG controls pass through the real reader and judge', async () => {
  const browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable })
  const context = await browser.newContext({ javaScriptEnabled: false })
  const reader = new PngTextReader()
  try {
    expect(await reader.start()).toMatchObject({ scale: 3 })
    const checks = await verifyPngObserver(context, reader)
    checks.forEach((check, i) => expect([pngControls[i]!.status, pngControls[i]!.alsoAccepts]).toContain(check.status))
  } finally { await reader.close(); await context.close(); await browser.close() }
}, 120_000)

test('retained PNG outputs keep their bytes and are never read as text', () => {
  const root = temporary.dir(), input = { id: 'c', source: 'flowchart LR\nA' }
  const bytes = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0, 255, 128, 10])
  const record = retainDrawingOutput(root, 'p', input, 'png', bytes)
  expect([...readDrawingOutputBytes(root, record, input.source)]).toEqual([...bytes])
  expect(() => readDrawingOutput(root, record, input.source)).toThrow('binary')
})

test('PNG obligations are unassessed except a missing drawing', () => {
  const test = drawingCases().find(c => c.expected.edges?.length)!
  expect(classifyObligations(test, 'png', { producerStatus: 'correct' }).categories.relationships.status).toBe('unassessed')
  expect(classifyObligations(test, 'png', { producerStatus: 'renderer-failure' }).categories.relationships.status).toBe('failed')
})

test('a merged PNG lane joins the published formats and gives a PNG-only project its Drawing component', () => {
  const counts = (correct: number, unknown: number) => ({ correct, incorrect: 0, 'renderer-failure': 0, 'invalid-format': 0, unknown, unrun: 0 })
  const base = { formats: ['svg', 'terminal'], corpus: { cases: 2, ids: ['c1', 'c2'] }, blocked: [], results: [{ project: 's', version: '1', format: 'svg', counts: counts(2, 0) }] }
  const run = { state: 'complete', updatedAt: '2026-11-14T00:00:00.000Z', corpus: { ids: ['c1', 'c2'] }, blocked: [], rows: [{ project: 'f', version: '1', format: 'png', caseId: 'c1', status: 'correct' }, { project: 'f', version: '1', format: 'png', caseId: 'c2', status: 'unknown' }] }
  const drawing = mergeDrawingResults(base, run, ['png'])
  expect(drawing.formats).toEqual(['svg', 'terminal', 'png'])
  const runs = [{ project: 'f', version: '1', format: 'png' }, { project: 's', version: '1', format: 'svg' }]
  const davebench = { corpus: { occurrences: 10 }, runs, blocked: [], rankings: { svg: [{ ...runs[1], completed: 10 }], png: [{ ...runs[0], completed: 10, pngPath: 'native' }, { ...runs[1], completed: 10, pngPath: 'native' }], terminal: [] } }
  const fidelity = { referenceQualifiedCallbacks: 10, results: [], blocked: [{ project: 'f' }, { project: 's' }] }
  const catalog = { nodes: [{ id: 'f', benchmark: { outputs: ['png'] } }, { id: 's', benchmark: { outputs: ['svg', 'png'] } }] }
  const rows = synthesiseBenchmarks(davebench, drawing, fidelity, catalog)
  expect(rows.find(r => r.project === 'f')!.drawing).toEqual({ lower: 50, upper: 100 })
  // An SVG project's own PNG adds no unmeasured Drawing format.
  expect(rows.find(r => r.project === 's')!.drawing).toEqual({ lower: 100, upper: 100 })
})

test('the Drawing bundle binds its own target without disturbing the DaveBench receipt', () => {
  const result = execFileSync('python3', ['-B', '-c', `
import sys
sys.path.insert(0, sys.argv[1]); import bundle as m
base = m.sources(); drawing = m.sources(m.DRAWING_TARGET)
assert m.DRAWING_TARGET not in [name.split('app/', 1)[-1] for name in base]
assert set(drawing) - set(base) == {'app/' + m.DRAWING_TARGET}
try: m.check_ready({'package': 'mermaid_flutter', 'version': '0.3.2', 'mode': 'release', 'runtime': {'platform': 'linux', 'dart': m.pin()['dart']}}, m.DRAWING_TARGET)
except ValueError: print('timing worker rejected as drawing target')
`, join(import.meta.dirname, '../native-flutter')], { encoding: 'utf8' })
  expect(result.trim()).toBe('timing worker rejected as drawing target')
})

test('a Drawing run that would block Mermaid Flutter for want of its drawing bundle is refused', () => {
  const catalog = JSON.parse(readFileSync(join(import.meta.dirname, '../docs/evidence/benchmark-campaign-2026-11-14/catalog.json'), 'utf8'))
  const all = catalog.nodes.map((node: any) => node.id)
  expect(pngLanesNeedingBundle(catalog, all, ['svg', 'terminal', 'png'])).toEqual(['pub:mermaid_flutter'])
  expect(pngLanesNeedingBundle(catalog, all, ['svg', 'terminal'])).toEqual([])
  expect(pngLanesNeedingBundle(catalog, ['mermaid-js/mermaid', 'obsidianmd/pele'], ['png'])).toEqual([])
})

test.skipIf(process.platform !== 'linux')('reassessing retained PNGs runs the reader and judge again and keeps admission refusals', async () => {
  const [labelled, refused] = drawingCases().filter(c => c.family === 'flowchart' && c.expected.nodes?.length).slice(0, 2)
  const cases = [labelled!, refused!], root = temporary.dir()
  const browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable })
  const context = await browser.newContext({ javaScriptEnabled: false })
  const reader = new PngTextReader()
  try {
    await reader.start()
    const page = await context.newPage()
    await page.setViewportSize({ width: 200, height: 100 })
    await page.setContent('<!doctype html><style>html,body{margin:0;background:#fff}</style><svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><text x="20" y="50" font-size="16">Not a label</text></svg>')
    const png = await page.screenshot({ type: 'png' })
    const record = retainDrawingOutput(root, 'pub:mermaid_flutter', labelled!, 'png', png)
    const run = {
      state: 'complete', updatedAt: '2026-11-14T20:04:58.596Z', assessmentPolicy: 'old', assessmentProfiles: { png: 'old' }, observerSources: {}, observerChecks: {}, assessmentEnvironments: {},
      corpus: { ids: cases.map(c => c.id), contractSha256: planDigest(cases.map(({ id, source, expected, sourceGaps }) => ({ id, source, expected, sourceGaps }))) },
      outputs: [record],
      rows: [
        { project: 'pub:mermaid_flutter', version: '0.3.2', format: 'png', caseId: labelled!.id, status: 'correct', reason: 'stale verdict', reading: 'stale' },
        { project: 'pub:mermaid_flutter', version: '0.3.2', format: 'png', caseId: refused!.id, status: 'invalid-format', reason: 'Inadmissible PNG output: PNG exceeds validation budget' },
      ],
    }
    const reassessed = await reassessDrawingRun(run, root, ['png'], context, reader)
    const expected = assessPngLabels(labelled!, await reader.read(png))
    expect(reassessed.rows[0]).toMatchObject({ status: expected.status, reason: expected.reason })
    expect(reassessed.rows[0].reading).not.toBe('stale')
    expect(reassessed.rows[1]).toEqual(run.rows[1])
    expect(reassessed.assessmentProfiles.png).toBe(drawingAssessmentProfiles(['png']).png)
    expect(reassessed.assessmentPolicies.png).toEndWith('/' + pngLabelProfile)
    expect(reassessed.observerChecks.png.map((check: any) => check.name)).toEqual(pngControls.map(c => c.name))
    expect(reassessed.reassessment.renderersInvoked).toBe(false)
  } finally { await reader.close(); await context.close(); await browser.close() }
}, 120_000)
