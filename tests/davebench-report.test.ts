import { expect, test } from 'bun:test'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { acceptedCompletion, acceptedRankings, acceptedRuns, davebenchFailureKind, referenceRejectedInputs, renderDavebenchAcceptedCompletion, type DavebenchReportInput } from '../unified/davebench-report.ts'
import { davebenchCliCall } from '../unified/davebench.ts'
import { terminalCliCall } from '../unified/davebench-terminal.ts'
import type { DavebenchRun } from '../unified/davebench-model.ts'
import { assertMermaidOracle, mermaidVerdicts } from '../portable/mermaid-oracle.ts'
import { useTempDirs } from './helpers/temp-dir.ts'

const temp = useTempDirs('davebench-report-')
// Five inputs: 0-1 ordinary, 2 a Mermaid parse error, 3 a Mermaid render failure that is not a
// rejection (an image the sandbox cannot fetch), 4 a detection error in only one reference run.
const cases = ['docs/a.md:1', 'docs/a.md:9', 'docs/bad.md:1', 'docs/img.md:1', 'docs/flaky.md:1']
const run = (project: string, format: string, number: number, failures: Record<string, string>, extra: Partial<DavebenchRun> = {}): DavebenchRun => {
  const failed = Object.values(failures).reduce((sum, ranges) => sum + ranges.split(',').reduce((count, part) => { const [a, b = a] = part.split('-').map(Number); return count + b! - a! + 1 }, 0), 0)
  return { project, version: '1', format, run: number, boundary: 'Chromium public SVG API', boundaryKind: 'persistent-api', attempted: 5, completed: 5 - failed, failed, timeouts: 0, totalMs: 10 * number, failures, ...extra }
}
const reference = (format: string) => [1, 2, 3].map(number => run('mermaid-js/mermaid', format, number, { 'error: Parse error on line N:': '2', 'error: The source image cannot be decoded.': '3', ...(number === 2 ? { 'error: No diagram type detected for text: ': '4' } : {}) }))
function fixture(): DavebenchReportInput {
  return {
    corpus: { occurrences: 5 }, plans: { images: { cases }, terminal: { cases } },
    runs: [
      ...reference('svg'), ...reference('png').map(row => ({ ...row, pngPath: 'trident-conversion' as const })),
      // "lenient" renders everything, including the input Mermaid rejects: 5 completions today.
      ...[1, 2, 3].map(number => run('lenient', 'svg', number, {})),
      // "strict" fails only the rejected input: 4 completions today, but all 4 accepted.
      ...[1, 2, 3].map(number => run('strict', 'svg', number, number === 3 ? { 'error: parse': '2', 'timeout': '0' } : { 'error: parse': '2' })),
      ...[1, 2, 3].map(number => run('lenient', 'png', number, { 'invalid: draws nothing': '0', 'error: PNG conversion: zero-size SVG': '1', 'error: PNG conversion: The source image cannot be decoded.': '3' }, { pngPath: 'trident-conversion' })),
      ...[1, 2, 3].map(number => run('text', 'terminal', number, { 'invalid: echoed source': '0', 'timeout': '1' }, { boundary: 'public CLI terminal; process startup included', boundaryKind: 'fresh-process' })),
    ],
  }
}

test('reference-rejected inputs are those every reference SVG run failed with a parser or detection error', () => {
  expect(referenceRejectedInputs(fixture())).toEqual([{ id: 'docs/bad.md:1', error: 'Parse error on line N:' }])
  // A collection that recorded the pinned oracle's verdicts is used as recorded.
  const recorded = fixture(); recorded.corpus.referenceRejected = { 'docs/flaky.md:1': 'No diagram type detected', 'docs/bad.md:1': 'Parse error on line 1:' }
  expect(referenceRejectedInputs(recorded).map(input => input.id)).toEqual(['docs/bad.md:1', 'docs/flaky.md:1'])
  const missing = fixture(); missing.runs = missing.runs.filter(row => row.project !== 'mermaid-js/mermaid')
  expect(() => referenceRejectedInputs(missing)).toThrow(/no SVG runs of the reference/)
})

test('a candidate that renders a reference-rejected input gets no completion credit for it', () => {
  const svg = acceptedCompletion(fixture(), 'svg')
  expect(svg.accepted).toBe(4)
  const row = (project: string) => svg.rows.find(candidate => candidate.project === project)!
  expect(row('lenient')).toMatchObject({ completed: 4, currentCompleted: 5, accepted: 4, referenceRejectedRendered: ['docs/bad.md:1'] })
  // The counted run is the one with the fewest accepted completions (run 3 timed out once).
  expect(row('strict')).toMatchObject({ completed: 3, currentCompleted: 3, run: 3, referenceRejectedRendered: [] })
  expect(row('mermaid-js/mermaid')).toMatchObject({ completed: 2, run: 2, failures: { execution: 2, admission: 0, conversion: 0 } })
  // Ranking over accepted inputs: lenient no longer outranks a project that drew every accepted input it could.
  const rankings = acceptedRankings(fixture())
  expect(rankings.accepted).toEqual({ svg: 4, png: 4, terminal: 4 })
  expect(rankings.svg.map(ranked => [ranked.project, ranked.completed])).toEqual([['lenient', 4], ['strict', 3], ['mermaid-js/mermaid', 2]])
  const restated = acceptedRuns(fixture()).find(candidate => candidate.project === 'strict' && candidate.run === 1)!
  expect(restated).toMatchObject({ attempted: 4, completed: 4, failed: 0, failures: {} })
})

test('failures split into execution, output admission and Trident PNG conversion', () => {
  expect(davebenchFailureKind('timeout')).toBe('execution')
  expect(davebenchFailureKind('error: Parse error on line N:')).toBe('execution')
  expect(davebenchFailureKind('invalid: fallback render')).toBe('admission')
  expect(davebenchFailureKind('invalid: error placeholder')).toBe('admission')
  // The conversion stopped because the project's SVG itself is not admissible.
  expect(davebenchFailureKind('error: PNG conversion: zero-size SVG')).toBe('admission')
  expect(davebenchFailureKind('error: PNG conversion: Malformed SVG document')).toBe('admission')
  expect(davebenchFailureKind('error: PNG conversion: The source image cannot be decoded.')).toBe('conversion')
  expect(davebenchFailureKind('invalid: empty PNG encoding')).toBe('conversion')
  const png = acceptedCompletion(fixture(), 'png').rows.find(row => row.project === 'lenient')!
  expect(png).toMatchObject({ completed: 1, failures: { execution: 0, admission: 2, conversion: 1 } })
  expect(png.completed + png.failures.execution + png.failures.admission + png.failures.conversion).toBe(png.accepted)
  expect(acceptedCompletion(fixture(), 'terminal').rows[0]).toMatchObject({ project: 'text', completed: 2, failures: { execution: 1, admission: 1, conversion: 0 }, referenceRejectedRendered: ['docs/bad.md:1'] })
})

test('the renderer lists reference-rejected inputs and tabulates each format by failure kind', () => {
  const page = renderDavebenchAcceptedCompletion(fixture(), (project, version) => `${project.toUpperCase()} v${version}`)
  expect(page).toContain('| docs/bad.md:1 | Parse error on line N: |')
  expect(page).toContain('rejects 1 of the 5 documentation inputs')
  expect(page).toContain('## SVG\n\n| Project | Completed of 4 accepted ↑ | Current count of 5 | Execution failures | Admission failures | Conversion failures | Reference-rejected inputs rendered |')
  expect(page).toContain('| LENIENT v1 | 4 | 5 | 0 | 0 | — | 1 |')
  expect(page).toContain('## PNG')
  expect(page).toContain('| LENIENT v1 | 1 | 2 | 0 | 2 | 1 | 1 |')
  expect(page).toContain('## Terminal text')
  expect(page).toContain('| TEXT v1 | 2 | 3 | 1 | 1 | — | 1 |')
})

test('the published 0.4.0 report: Mermaid rejects four inputs and no project is credited for them', () => {
  const report = JSON.parse(readFileSync(join(import.meta.dir, '../results/release/report.json'), 'utf8'))
  expect(referenceRejectedInputs(report)).toEqual([
    { id: 'docs/config/8.6.0_docs.md:82', error: 'Parse error on line N:' },
    { id: 'docs/config/8.6.0_docs.md:94', error: 'Parse error on line N:' },
    { id: 'docs/config/directives.md:100', error: 'No diagram type detected matching given configuration for text: ' },
    { id: 'docs/config/directives.md:106', error: 'No diagram type detected matching given configuration for text: ' },
  ])
  const svg = acceptedCompletion(report, 'svg')
  expect(svg.rows.slice(0, 2).map(row => [row.project, row.completed, row.accepted])).toEqual([['Latias94/merman', 1338, 1338], ['mermaid-js/mermaid', 1336, 1338]])
  const franken = acceptedCompletion(report, 'terminal').rows.find(row => row.project === 'Dicklesworthstone/frankenmermaid')!
  expect([franken.completed, franken.currentCompleted, franken.referenceRejectedRendered.length]).toEqual([1334, 1338, 4])
})

test('the pinned Mermaid oracle rejects those sources and accepts the external-image source the reference failed to render', async () => {
  const sources = ['%%{init: {"theme": "default", "logLevel": 1 }}%%\n graph LR\n  a-->b\n  f-->g\n  g-->\n', "%%{init: { 'logLevel': 'debug', 'theme': 'forest' } }%%\n%%{initialize: { 'logLevel': 'fatal', \"theme\":'dark', 'startOnLoad': true } }%%\n...\n",
    'flowchart TD\n  A@{ img: "https://mermaid.js.org/favicon.svg", label: "My example image label", pos: "t", h: 60, constraint: "on" }\n']
  const verdicts = await mermaidVerdicts(assertMermaidOracle(), sources)
  expect(verdicts.map(verdict => verdict.accepted)).toEqual([false, false, true])
  expect(verdicts[0]!.error).toMatch(/^Parse error on line/)
  expect(verdicts[1]!.error).toMatch(/^No diagram type detected/)
})

test('spot-checks can read a CLI output through the measured call path; measurement passes no hook', async () => {
  const root = temp.dir(), fixturePath = join(root, 'emit.mjs')
  writeFileSync(fixturePath, `for await (const chunk of process.stdin) {}\nprocess.stdout.write('<svg xmlns="http://www.w3.org/2000/svg" width="4" height="3"><rect width="4" height="3"/><text>A</text></svg>')`)
  let svg = ''
  const result = await davebenchCliCall({ artifact: { executable: process.execPath, outputBindings: { svg: { args: [fixturePath] } } } } as any, 'flowchart TD; A', 'svg', 5000, bytes => { svg = bytes.toString('utf8') })
  expect(result.outcome).toBe('completed'); expect(Object.keys(result).sort()).toEqual(['ms', 'outcome'])
  expect(svg).toContain('<rect width="4"')
  let text = ''
  const terminal = await terminalCliCall({ kind: 'cli', executable: process.execPath, input: 'stdin', version: 'fixture', args: ['-e', `process.stdin.resume();process.stdin.on('end',()=>{process.stdout.write('[A]');process.exit(0)})`] } as any, 'source', root, 2000, output => { text = output })
  expect(terminal.outcome).toBe('completed'); expect(text).toBe('[A]')
})
