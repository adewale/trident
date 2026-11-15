// Admission rules changed after the outside review: SVG is admitted the way a browser displays
// it (strict XML is reported separately), one empty-output rule covers SVG and terminal text,
// every failed input is recorded per run, overlapping time ranges tie, and PNG rows say
// whether the PNG came from the project's own export or Trident's conversion.
import { expect, test } from 'bun:test'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { chromium } from 'playwright'
import { davebenchBrowserCall, davebenchCliCall, davebenchInputs } from '../unified/davebench.ts'
import { authoredDiagnosticSource, davebenchEmptyOutputCorpus, davebenchEmptyOutputRule, davebenchSvgValidity, davebenchTerminalValidity, errorPatternSources, htmlSvgAsXml, rawStatements, reviewedDrawingIntent, svgTextValidity, terminalTextValidity } from '../unified/davebench-validity.ts'
import { davebenchFailedInputs, davebenchRankings, decodeCaseRanges, encodeCaseRanges, recordOutcome, type DavebenchRun } from '../unified/davebench-model.ts'
import { defaultChromium } from '../unified/benchmark-context.ts'
import { tridentDirectory } from '../unified/trident-paths.ts'
import { useTempDirs } from './helpers/temp-dir.ts'

const temp = useTempDirs('davebench-admission-')
const inventory = JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-source-inventory.json.gz', import.meta.url))).toString()).cases as { id: string; source: string }[]
const reviewed = (id: string) => inventory.find(input => input.id === id)!.source
/** A Gantt chart that only sets options: reviewed configuration-only, it draws nothing. */
const configurationOnly = reviewed('packages/mermaid/src/docs/syntax/gantt.md:291')
/** A reviewed drawing source. */
const drawing = reviewed('packages/mermaid/src/docs/syntax/agentflow.md:19')

// Mermaid 12.3.0 documentation renders that browsers display but strict XML rejects:
// a raw `&` in a click tooltip and `&nbsp;` in a label.
const tooltip = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 20"><g class="node" title="Save & close"><rect width="50" height="16"/><text x="4" y="12">Save</text></g></svg>'
const nbsp = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 20"><rect width="50" height="16"/><foreignObject width="50" height="16"><div xmlns="http://www.w3.org/1999/xhtml"><span>A&nbsp;B</span><br></div></foreignObject></svg>'
const emptySvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 20"><style>.a{fill:red}</style><defs><marker id="m"><path d="M0 0L1 1"/></marker></defs><g class="grid"><path d=""/><text> </text></g><rect width="0" height="5"/></svg>'

test('SVG that a browser displays embedded in HTML is admitted outside the browser, and its strict-XML failure is reported separately', () => {
  for (const svg of [tooltip, nbsp]) {
    const validity = svgTextValidity(svg, drawing)
    expect(validity.valid).toBe(true)
    expect(validity.valid && validity.strictXmlInvalid).toBeTruthy()
    expect(davebenchSvgValidity(svg, drawing).valid).toBe(true)
  }
  // The rewrite only replaces HTML-isms with their XML equivalents.
  expect(htmlSvgAsXml(tooltip)).toContain('title="Save &amp; close"')
  expect(htmlSvgAsXml(nbsp)).toContain('A&#160;B</span><br/>')
  expect(htmlSvgAsXml('<svg width=10 height="10" width="20" hidden><a xlink:href="#a">1 < 2 &unknown; &#0;</a></svg>')).toBe('<svg xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" width="10" height="10" hidden=""><a xlink:href="#a">1 &lt; 2 &amp;unknown; &#xFFFD;</a></svg>')
  // Strict XML stays unflagged.
  expect(svgTextValidity('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 9"><text>A &amp; B</text></svg>', drawing)).toEqual({ valid: true })
})

test('an output that draws nothing is admitted only for an input whose reviewed source draws nothing', () => {
  expect(reviewedDrawingIntent(configurationOnly)).toBe('nothing')
  expect(reviewedDrawingIntent(drawing)).toBe('drawing')
  expect(reviewedDrawingIntent('flowchart LR\n  never --> reviewed\n')).toBeUndefined()
  expect(davebenchEmptyOutputRule(configurationOnly)).toEqual({ drawsNothing: true })
  expect(davebenchEmptyOutputRule(drawing)).toEqual({ drawsNothing: false })
  // Exactly one reviewed documentation source draws nothing.
  expect(inventory.filter(input => reviewedDrawingIntent(input.source) === 'nothing').map(input => input.id)).toEqual(['packages/mermaid/src/docs/syntax/gantt.md:291'])

  expect(davebenchSvgValidity(emptySvg, drawing)).toEqual({ valid: false, reason: 'draws nothing' })
  expect(davebenchSvgValidity(emptySvg, configurationOnly)).toEqual({ valid: true })
  expect(svgTextValidity(emptySvg, drawing, { drawsNothing: false })).toEqual({ valid: false, reason: 'draws nothing' })
  // Without a reviewed source the earlier SVG rule holds (Drawing Correctness passes no rule).
  expect(svgTextValidity(emptySvg, drawing)).toEqual({ valid: true })
  expect(davebenchSvgValidity(emptySvg, 'gantt\n  unreviewed\n')).toEqual({ valid: true })
  // Text, a sized shape or a use reference is a drawing; hidden content is not.
  for (const drawn of ['<text>A</text>', '<rect width="3" height="3"/>', '<use href="#m"/>', '<foreignObject width="9" height="9"><div xmlns="http://www.w3.org/1999/xhtml">A</div></foreignObject>']) expect(davebenchSvgValidity(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 9">${drawn}</svg>`, drawing)).toEqual({ valid: true })
  expect(davebenchSvgValidity('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 9"><g display="none"><text>A</text></g><text visibility="hidden">B</text></svg>', drawing)).toEqual({ valid: false, reason: 'draws nothing' })

  // Terminal text: blank braille, whitespace and control sequences draw nothing.
  const blankBraille = '\u001b[0m' + ('⠀'.repeat(20) + '\n').repeat(4)
  expect(terminalTextValidity(blankBraille, drawing)).toEqual({ valid: false, reason: 'draws nothing' })
  expect(davebenchTerminalValidity(blankBraille, drawing)).toEqual({ valid: false, reason: 'draws nothing' })
  expect(davebenchTerminalValidity(blankBraille, configurationOnly)).toEqual({ valid: true })
  expect(davebenchTerminalValidity('  \n\u001b[31m\u001b[0m', configurationOnly)).toEqual({ valid: true })
  expect(terminalTextValidity('⠀⣿⠀', drawing)).toEqual({ valid: true })
})

test('the reviewed draws-nothing inputs map to the two DaveBench Gantt examples', () => {
  const upstream = join(tridentDirectory, '../mermaid')
  let inputs: ReturnType<typeof davebenchInputs>
  try { inputs = davebenchInputs(upstream) } catch { console.warn('Mermaid documentation checkout unavailable; mapping check skipped'); return }
  const rules = inputs.cases.map(input => davebenchEmptyOutputRule(input.source))
  const corpus = davebenchEmptyOutputCorpus(inputs.cases, rules)
  expect(corpus.drawsNothing).toEqual(['docs/syntax/gantt.md:380', 'docs/syntax/gantt.md:386'])
  expect(corpus.emptyOutputUnreviewed).toBe(245)
})

test('the browser admits what it displays, reports strict XML separately, converts it to PNG and applies the empty-output rule', async () => {
  const browser = await chromium.launch({ executablePath: process.env.TRIDENT_CHROMIUM_EXECUTABLE ?? defaultChromium(chromium), headless: true })
  try {
    const page = await browser.newPage()
    await page.evaluate(outputs => { (globalThis as any).__fidelityCommunity = { render: async (source: string) => outputs[source] } }, { tooltip, nbsp, empty: emptySvg, trailing: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 9"><text>A</text></svg><p>B</p>', html: '<div><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 9"><text>A</text></svg></div>', strict: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 9"><text>A &amp; B</text></svg>' } as Record<string, string>)
    const call = (source: string, format = 'svg', drawsNothing?: boolean) => page.evaluate(davebenchBrowserCall, { source, id: 'fixture', format, errorPatterns: errorPatternSources, errorSource: authoredDiagnosticSource(source), raw: rawStatements(source), ...(drawsNothing === undefined ? {} : { drawsNothing }) })
    for (const format of ['svg', 'png']) {
      for (const source of ['tooltip', 'nbsp']) {
        const result = await call(source, format)
        expect(result.outcome).toBe('completed')
        expect(typeof (result as any).strictXmlInvalid).toBe('string')
      }
      expect(Object.keys(await call('strict', format)).sort()).toEqual(['ms', 'outcome'])
      // Content beside the SVG is not one SVG document in either parse.
      expect((await call('trailing', format)).outcome).not.toBe('completed')
      expect((await call('html', format)).outcome).not.toBe('completed')
      expect(await call('empty', format, false)).toMatchObject({ outcome: 'invalid', invalid: 'draws nothing' })
      expect((await call('empty', format, true)).outcome).toBe('completed')
      expect((await call('empty', format)).outcome).toBe('completed')
    }
  } finally { await browser.close() }
})

test('a CLI SVG that is not strict XML completes and carries the strict-XML reason', async () => {
  const root = temp.dir(), fixture = join(root, 'svg.mjs')
  writeFileSync(fixture, `for await (const chunk of process.stdin) {}\nprocess.stdout.write(${JSON.stringify(tooltip)})`)
  const result = await davebenchCliCall({ artifact: { executable: process.execPath, outputBindings: { svg: { args: [fixture] } } } } as any, drawing, 'svg', 5000)
  expect(result.outcome).toBe('completed')
  expect(result.strictXmlInvalid).toBeTruthy()
})

test('every failed input is recorded per run by reason while counts keep their rules', () => {
  const cases = ['a.md:1', 'a.md:9', 'b.md:3', 'b.md:7', 'c.md:2', 'c.md:5']
  const run: DavebenchRun = { project: 'fixture', version: '1', format: 'svg', run: 1, boundary: 'fixture API', attempted: 0, completed: 0, failed: 0, timeouts: 0, totalMs: 0, invalid: 0, invalidReasons: {}, errorReasons: {}, failures: {} }
  const outcomes = [{ outcome: 'completed', ms: 1, strictXmlInvalid: 'undefined entity.' }, { outcome: 'error', ms: 2, error: 'Parse error on line 3:' }, { outcome: 'error', ms: 2, error: 'Parse error on line 4:' }, { outcome: 'invalid', ms: 1, invalid: 'fallback render: source header shown: block' }, { outcome: 'timeout', ms: null }, { outcome: 'completed', ms: 1 }]
  for (const [index, value] of outcomes.entries()) recordOutcome(run, index, cases[index]!, value)
  expect(run).toMatchObject({ attempted: 6, completed: 2, failed: 4, timeouts: 1, invalid: 1, untimedCalls: 1, totalMs: 7, errorReasons: { 'Parse error on line N:': 2 }, invalidReasons: { 'fallback render': 1 }, rejected: { 'b.md:7': 'fallback render: source header shown: block' }, strictXmlInvalid: 1, strictXmlReasons: { 'undefined entity.': 1 } })
  expect(run.failures).toEqual({ 'error: Parse error on line N:': '1-2', 'invalid: fallback render': '3', timeout: '4' })
  expect(davebenchFailedInputs(run, cases)).toEqual({ 'a.md:9': 'error: Parse error on line N:', 'b.md:3': 'error: Parse error on line N:', 'b.md:7': 'invalid: fallback render', 'c.md:2': 'timeout' })
  expect(Object.keys(davebenchFailedInputs(run, cases)).length).toBe(run.failed)
  expect(encodeCaseRanges([7, 0, 1, 2, 5, 9, 8])).toBe('0-2,5,7-9')
  expect(decodeCaseRanges('0-2,5,7-9')).toEqual([0, 1, 2, 5, 7, 8, 9])
  expect(() => davebenchFailedInputs({ failures: { x: '6' } }, cases)).toThrow('unplanned')
})

test('equal completion with overlapping three-run time ranges shares a rank; separated ranges order by median', () => {
  const runs = (project: string, times: number[], extra: Partial<DavebenchRun> = {}): DavebenchRun[] => times.map((totalMs, index) => ({ project, version: '1', format: 'svg', run: index + 1, boundary: 'Chromium public SVG API', boundaryKind: 'persistent-api', attempted: 10, completed: 10, failed: 0, timeouts: 0, totalMs, ...extra }))
  const ranked = davebenchRankings([...runs('a', [10, 12, 20]), ...runs('b', [15, 16, 17]), ...runs('c', [30, 31, 32]), ...runs('d', [32, 40, 41]), ...runs('e', [50, 50, 50])], 10).svg
  // a and b overlap (medians 12 and 16 differ); c is clear of b; d overlaps c at 32.
  expect(ranked.map(row => [row.project, row.rank])).toEqual([['a', 1], ['b', 1], ['c', 3], ['d', 3], ['e', 5]])
  expect(ranked[0]!.totalMsRange).toEqual([10, 20])
})

test('PNG rows record whether the PNG came from the project or from Trident conversion', () => {
  const runs = (project: string, pngPath: DavebenchRun['pngPath'][]): DavebenchRun[] => pngPath.map((path, index) => ({ project, version: '1', format: 'png', run: index + 1, boundary: 'fixture', attempted: 1, completed: 1, failed: 0, timeouts: 0, totalMs: 1 + index, pngPath: path }))
  const ranked = davebenchRankings([...runs('own', ['native', 'native', 'native']), ...runs('converted', ['trident-conversion', 'trident-conversion', 'trident-conversion']), ...runs('mixed', ['native', 'trident-conversion', 'native'])], 1)
  expect(Object.fromEntries(ranked.png.map(row => [row.project, row.pngPath]))).toEqual({ own: 'native', converted: 'trident-conversion' })
  expect(ranked.unranked.map(row => row.project)).toEqual(['mixed'])
})
