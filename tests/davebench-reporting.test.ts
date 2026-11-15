import { expect, test } from 'bun:test'
import { davebenchFamily } from '../unified/davebench-inputs.ts'
import { renderDavebenchFamilies, renderBenchmarkLeagues } from '../unified/three-benchmark-report.ts'
import { synthesiseBenchmarks } from '../unified/overall-score.ts'

test('a documentation example is grouped by the diagram type its first statement declares', () => {
  expect(davebenchFamily('---\ntitle: T\n---\nflowchart LR\nA-->B')).toBe('flowchart')
  expect(davebenchFamily('%%{init: {"theme": "forest"}}%%\n%% comment\ngraph TD\nA')).toBe('flowchart')
  expect(davebenchFamily('sequenceDiagram\nA->>B: hi')).toBe('sequence')
  expect(davebenchFamily('C4Context\ntitle x')).toBe('c4')
  expect(davebenchFamily('railroad-ebnf\nrule = "a";')).toBe('railroad')
  expect(davebenchFamily('xychart-beta\nbar [1]')).toBe('xychart')
  expect(davebenchFamily('%%{init: {}}%%\n')).toBe('other')
})

// Two lanes over four cases: flowchart x2, sequence x2. Run 2 of "a" is its weakest run.
function familyFixture(failuresA: Record<string, string>[], failuresB: Record<string, string>[]) {
  const cases = ['docs/f.md:1', 'docs/f.md:9', 'docs/s.md:1', 'docs/s.md:9']
  const lane = (project: string, failures: Record<string, string>[], completed: number[]) => failures.map((f, i) => ({ project, version: '1', format: 'svg', run: i + 1, completed: completed[i], failed: 4 - completed[i]!, failures: f, boundaryKind: 'persistent-api' }))
  const runs = [...lane('a', failuresA, [3, 2, 3]), ...lane('b', failuresB, [2, 2, 2])]
  return { corpus: { occurrences: 4, families: ['flowchart', 'flowchart', 'sequence', 'sequence'] }, plans: { images: { cases }, terminal: { cases } }, runs, blocked: [],
    rankings: { svg: [{ project: 'a', version: '1', rank: 1, completed: 2, medianTotalMs: 1 }, { project: 'b', version: '1', rank: 2, completed: 2, medianTotalMs: 2 }], png: [], terminal: [] } }
}

test('family completion uses the run the league count comes from and its recorded failures', () => {
  const report = familyFixture([{ 'error: x': '2' }, { 'error: x': '2-3' }, { 'error: y': '3' }], [{ 'error: z': '0-1' }, { 'error: z': '0-1' }, { 'error: z': '0-1' }])
  const page = renderDavebenchFamilies(report, { nodes: [] })!
  expect(page).toContain('| Project | flowchart (2) | sequence (2) |')
  // a: weakest run fails cases 2 and 3, both sequence -> flowchart 100, sequence 0.
  expect(page).toContain('| a 1 | 100 | 0 |')
  expect(page).toContain('| b 1 | 0 | 100 |')
})

test('collections without case families or per-case failures produce no family page', () => {
  const report: any = familyFixture([{}, {}, {}], [{}, {}, {}])
  delete report.corpus.families
  expect(renderDavebenchFamilies(report, { nodes: [] })).toBeUndefined()
  const legacy: any = familyFixture([{}, {}, {}], [{}, {}, {}]); for (const run of legacy.runs) delete run.failures
  expect(renderDavebenchFamilies(legacy, { nodes: [] })).toBeUndefined()
})

test("Trident's PNG conversion of a project's SVG does not count again in the synthesis", () => {
  const runs = ['svg', 'png'].map(format => ({ project: 'a', version: '1', format }))
  const davebench = (pngPath: string) => ({ corpus: { occurrences: 10 }, runs, blocked: [], rankings: { svg: [{ project: 'a', version: '1', rank: 1, completed: 10 }], png: [{ project: 'a', version: '1', rank: 1, completed: 0, pngPath }], terminal: [] } })
  const drawing = { corpus: { cases: 10 }, blocked: [], formats: ['svg', 'terminal'], results: [{ project: 'a', version: '1', format: 'svg', counts: { correct: 10, incorrect: 0, 'renderer-failure': 0, 'invalid-format': 0, unknown: 0, unrun: 0 } }] }
  const fidelity = { referenceQualifiedCallbacks: 10, results: [{ project: 'a', version: '1', counts: { passed: 10, failed: 0, unsupported: 0, 'trident-blocked': 0, 'reference-unqualified': 0 } }], blocked: [] }
  const catalog = { nodes: [{ id: 'a', benchmark: { outputs: ['svg'] } }] }
  const converted = synthesiseBenchmarks(davebench('trident-conversion'), drawing, fidelity, catalog)[0]!
  expect(converted.formats).toEqual(['svg'])
  expect(converted.davebench).toEqual({ lower: 100, upper: 100 })
  const native = synthesiseBenchmarks(davebench('native'), drawing, fidelity, catalog)[0]!
  expect(native.formats).toEqual(['svg', 'png'])
  expect(native.davebench).toEqual({ lower: 50, upper: 50 })
})

test('league tables label PNG origin, report strict-XML invalidity and name rows with identical outcomes', () => {
  const lane = (project: string, format: string, extra: object) => [1, 2, 3].map(run => ({ project, version: '1', format, run, completed: 9, failed: 1, failures: { 'error: e': '4' }, boundaryKind: 'persistent-api', ...extra }))
  const runs = [...lane('a', 'svg', { strictXmlInvalid: 2 }), ...lane('b', 'svg', { strictXmlInvalid: 0 }), ...lane('a', 'png', { pngPath: 'trident-conversion' }), ...lane('b', 'png', { pngPath: 'trident-conversion' })]
  const rank = (project: string, format: string, extra: object = {}) => ({ project, version: '1', format, rank: 1, completed: 9, medianTotalMs: 1000, ...extra })
  const davebench = { corpus: { occurrences: 10 }, runs, blocked: [], rankings: { svg: [rank('a', 'svg'), rank('b', 'svg')], png: [rank('a', 'png', { pngPath: 'trident-conversion' }), rank('b', 'png', { pngPath: 'trident-conversion' })], terminal: [] } }
  const drawing = { state: 'complete', corpus: { cases: 2 }, formats: ['svg'], blocked: [], results: ['a', 'b'].map((project, i) => ({ project, version: '1', format: 'svg', counts: { correct: 2, incorrect: 0, 'renderer-failure': 0, 'invalid-format': 0, unknown: 0, unrun: 0 }, caseOutcomes: { correct: i ? ['c1', 'c2'] : ['c2', 'c1'] } })) }
  const fidelity = { referenceQualifiedCallbacks: 10, results: [], blocked: [] }
  const catalog = { nodes: ['a', 'b'].map(id => ({ id, benchmark: { outputs: ['svg'] } })) }
  const page = renderBenchmarkLeagues(davebench, drawing, fidelity, catalog)
  expect(page).toContain('| Rank | Project | Completed / 10 ↑ | Strict-XML invalid | Median seconds ↓ | Timing boundary |')
  expect(page).toContain('| 1 | a 1 | 9 | 2 |')
  expect(page).toContain("| 1 | a 1 | 9 | Trident's Chromium conversion of its SVG |")
  expect(page).toContain('- a 1 and b 1: identical per-case outcomes in every DaveBench and Drawing lane.')
})

test('matching outcomes need every shared lane, DaveBench per-case outcomes included', () => {
  const lane = (project: string, failures: string) => [1, 2, 3].map(run => ({ project, version: '1', format: 'svg', run, completed: 9, failed: 1, failures: { 'error: e': failures }, boundaryKind: 'persistent-api' }))
  const rank = (project: string) => ({ project, version: '1', format: 'svg', rank: 1, completed: 9, medianTotalMs: 1000 })
  const drawing = { state: 'complete', corpus: { cases: 2 }, formats: ['svg'], blocked: [], results: ['a', 'b'].map(project => ({ project, version: '1', format: 'svg', counts: { correct: 2, incorrect: 0, 'renderer-failure': 0, 'invalid-format': 0, unknown: 0, unrun: 0 }, caseOutcomes: { correct: ['c1', 'c2'] } })) }
  const catalog = { nodes: ['a', 'b'].map(id => ({ id, benchmark: { outputs: ['svg'] } })) }
  const fidelity = { referenceQualifiedCallbacks: 10, results: [], blocked: [] }
  const differing = { corpus: { occurrences: 10 }, runs: [...lane('a', '4'), ...lane('b', '5')], blocked: [], rankings: { svg: [rank('a'), rank('b')], png: [], terminal: [] } }
  expect(renderBenchmarkLeagues(differing, drawing, fidelity, catalog)).not.toContain('Matching outcomes')
  const legacy = { ...differing, runs: differing.runs.map(({ failures: _failures, ...run }) => run) }
  expect(renderBenchmarkLeagues(legacy, drawing, fidelity, catalog)).not.toContain('Matching outcomes')
})
