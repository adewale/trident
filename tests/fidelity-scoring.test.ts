import { expect, test } from 'bun:test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { mergeFidelityRuns } from '../scripts/merge-fidelity-runs.ts'
import { gapsByCause, UNREVIEWED_UNSUPPORTED } from '../scripts/fidelity-gaps.ts'
import { fidelityOutcomes } from '../unified/mermaid-fidelity.ts'
import { fidelityCoverage } from '../unified/fidelity-coverage.ts'
import { fidelityPopulation, synthesiseBenchmarks } from '../unified/overall-score.ts'
import { renderBenchmarkLeagues, threeBenchmarkReport } from '../unified/three-benchmark-report.ts'
import { fidelityScoring, isScoredFidelityFile } from '../unified/mermaid-fidelity/scoring.ts'
import { REVIEWED_VIEW_VERSIONS, unreviewedViewGap } from '../unified/mermaid-fidelity/views/reviewed-versions.mjs'
import { flutterLock, lockedVersions } from '../unified/mermaid-fidelity/bridges/dart/lock.ts'

const DIAGRAM = 'packages/mermaid/src/diagrams/flowchart/parser/flow.spec.js'
const PARSER = 'packages/parser/tests/pie.test.ts'
const WEBSITE = 'packages/mermaid/src/docs/.vitepress/redirect.spec.ts'
const RENDERING = 'packages/mermaid/src/rendering-util/layout.spec.ts'
// Six reference-qualified callbacks: four scored (diagrams/, parser/), two inventory.
const referenceCases = [DIAGRAM, DIAGRAM, DIAGRAM, PARSER, WEBSITE, RENDERING].map((file, i) => ({ file, name: 't' + i, status: 'passed' }))
const reference = { project: 'mermaid-js/mermaid', version: '12.3.0', missingFiles: [], cases: referenceCases }
const candidate = (project: string, statuses: string[], version = '1') => ({ project, version, missingFiles: [], cases: referenceCases.map((c, i) => ({ ...c, status: statuses[i], ...(statuses[i] === 'trident-blocked' ? { reason: 'TRIDENT_ADAPTER_GAP: x' } : statuses[i] === 'unsupported' ? { reason: 'no such parser' } : {}) })) })
const run = (results: any[], extra: any = {}) => ({ pin: 'p', selection: 'all core package tests', selectedFiles: 4, inventory: {}, outsideSelectedRunner: [], blocked: [], updatedAt: '2026-11-13T00:00:00Z', collectedThrough: '2026-11-13T00:00:00Z', results, ...extra })

test('the scored population is the qualified callbacks under diagrams/ and parser/; the rest are inventory', () => {
  expect([DIAGRAM, PARSER, WEBSITE, RENDERING, 'packages/mermaid/src/mermaidAPI.spec.ts'].map(isScoredFidelityFile)).toEqual([true, true, false, false, false])
  // Inventory callbacks a candidate passes or fails change nothing in its score.
  const merged = mergeFidelityRuns([run([reference, candidate('a', ['passed', 'failed', 'unsupported', 'trident-blocked', 'passed', 'failed'])])])
  expect([merged.referenceQualifiedCallbacks, merged.scoredPopulation, merged.inventoryCallbacks]).toEqual([6, 4, 2])
  const a = merged.results.find(row => row.project === 'a')!
  expect(a.counts).toMatchObject({ passed: 2, failed: 2, unsupported: 1, 'trident-blocked': 1 })
  expect(a.scored).toEqual({ passed: 1, failed: 1, unsupported: 1, 'trident-blocked': 1 })
  // The reference passes the whole scored population.
  expect(merged.results.find(row => row.project === 'mermaid-js/mermaid')!.scored).toEqual({ passed: 4, failed: 0, unsupported: 0, 'trident-blocked': 0 })
  expect(fidelityPopulation(merged)).toBe(4)
  const coverage = fidelityCoverage(run([reference, candidate('a', ['passed', 'failed', 'unsupported', 'trident-blocked', 'passed', 'failed'])]))
  expect([coverage.scoredPopulation, coverage.inventoryCallbacks]).toEqual([4, 2])
  expect(coverage.results[1]!.scopes.inventory).toMatchObject({ population: 2, passed: 1, failed: 1 })
  expect(coverage.results[1]!.gaps.find((gap: any) => gap.file === DIAGRAM)).toMatchObject({ inventory: false, unsupported: 1 })
})

test('an unsupported verdict is unassessed in scoring while its raw disposition is kept', () => {
  const merged = mergeFidelityRuns([run([reference, candidate('a', ['passed', 'failed', 'unsupported', 'unsupported', 'passed', 'passed'])])])
  const a = merged.results.find(row => row.project === 'a')!
  expect(a.scored.unsupported).toBe(2)
  expect(a.unsupportedReasons).toEqual({ 'no such parser': 2 })
  expect(gapsByCause(merged).a).toEqual({ [UNREVIEWED_UNSUPPORTED]: 2 })
  const scoring = fidelityScoring(merged)
  expect(scoring.score(a)).toMatchObject({ passed: 1, nonpasses: 1, unassessed: 2 })
  const { davebench, drawing, catalog } = synthesisInputs(['a'])
  const row = synthesiseBenchmarks(davebench, drawing, merged, catalog).find(r => r.project === 'a')!
  expect(row.fidelity).toEqual({ lower: 25, upper: 75 })
  // Rendered: unsupported is not added to the nonpasses and stays inside the unassessed range.
  const page = renderBenchmarkLeagues(davebench, drawing, merged, catalog).split('## Mermaid Fidelity')[1]!.split('## Equal-weight synthesis')[0]!
  expect(page).toContain('Passed / 4 ↑')
  expect(page).toContain('Unsupported (counted as unassessed)')
  expect(page).toContain('| 2 | 2 | a 1 | 1 | 1 | 2 | 2 + 0 |')
  expect(page).toContain('The other 2 qualified callbacks')
})

test('results published under the earlier definition are read under it', () => {
  const legacy = { referenceQualifiedCallbacks: 4, results: [{ project: 'a', version: '1', counts: { passed: 1, failed: 1, unsupported: 1, 'trident-blocked': 1 } }], blocked: [] }
  expect(fidelityScoring(legacy).score(legacy.results[0]!)).toMatchObject({ passed: 1, nonpasses: 2, unassessed: 1 })
  expect(() => fidelityScoring({ ...legacy, scoring: { protocol: 'something-else' } })).toThrow('Unknown Fidelity scoring protocol')
})

test('a project without a public parse interface is n/a: no Fidelity row, rank or synthesis component', () => {
  const catalog = { nodes: ['a', 'b', 'private', 'mermaid-js/mermaid'].map(id => ({ id, benchmark: { version: '1', outputs: ['svg'], ...(id === 'private' ? { notApplicable: { fidelity: 'parsers reachable only through private code' } } : {}) } })) }
  const merged = mergeFidelityRuns([run([reference, candidate('a', ['passed', 'passed', 'failed', 'failed', 'failed', 'failed']), candidate('private', ['passed', 'passed', 'passed', 'passed', 'passed', 'passed'])])], { catalog })
  expect(merged.results.map(row => row.project)).toEqual(['mermaid-js/mermaid', 'a'])
  expect(merged.notApplicable).toEqual([{ project: 'private', reason: 'parsers reachable only through private code' }])
  const { davebench, drawing } = synthesisInputs(['a', 'private'])
  const rows = synthesiseBenchmarks(davebench, drawing, merged, catalog)
  const own = rows.find(r => r.project === 'private')!
  expect(own.fidelity).toBeNull()
  // The mean leaves Fidelity out instead of treating it as 0–100.
  expect(own.overall).toEqual({ lower: (own.davebench.lower + own.drawing!.lower) / 2, upper: (own.davebench.upper + own.drawing!.upper) / 2 })
  const page = renderBenchmarkLeagues(davebench, drawing, merged, catalog)
  const league = page.split('## Mermaid Fidelity')[1]!.split('## Equal-weight synthesis')[0]!
  expect(league).toContain('| — | — | private 1 | n/a | n/a | n/a | n/a |')
  expect(league).toContain('| 2 | 2 | a 1 | 2 | 2 | 0 | 0 + 0 |')
  expect(page.split('## Equal-weight synthesis')[1]).toMatch(/\| private 1 \| [^|]+ \| [^|]+ \| n\/a \|/)
  // An older run that still holds a row for the project cannot bring it back.
  const fromCatalogOnly = fidelityScoring({ ...merged, notApplicable: [], results: [...merged.results, { project: 'private', version: '1', scored: { passed: 4, failed: 0, unsupported: 0, 'trident-blocked': 0 } }] }, catalog)
  expect(fromCatalogOnly.results.map((row: any) => row.project)).toEqual(['mermaid-js/mermaid', 'a'])
})

test('Grok, MermaidText and Loom are declared n/a in the catalog; Mermaid Dart and Flutter stay applicable', () => {
  const catalog = JSON.parse(readFileSync(join(import.meta.dir, '../catalog/mermaid-community.json'), 'utf8'))
  const declared = catalog.nodes.filter((node: any) => node.benchmark?.notApplicable?.fidelity).map((node: any) => node.id).sort()
  expect(declared).toEqual(['Yassimba/loom', 'spacedock-dev/mermaidtext', 'xai-org/grok-build'])
})

test("an unreviewed view version makes every qualified callback unassessed, whatever was observed", () => {
  expect(unreviewedViewGap('crabtalk/bezel', '0.2.24')).toBeUndefined()
  expect(unreviewedViewGap('crabtalk/bezel', '9.9.9')).toBe('view not reviewed for crabtalk/bezel 9.9.9')
  expect(unreviewedViewGap('no/view-project', '1.0.0')).toBeUndefined()
  const file = '/upstream/' + DIAGRAM
  const names = ['passes', 'fails', 'skipped']
  const control = { testResults: [{ name: file, assertionResults: names.map((fullName, i) => ({ fullName, status: i === 2 ? 'skipped' : 'passed' })) }] }
  const observed = { testResults: [{ name: file, assertionResults: [{ fullName: 'passes', status: 'passed' }, { fullName: 'fails', status: 'failed', failureMessages: ['AssertionError: expected 1 to be 2'] }, { fullName: 'skipped', status: 'skipped' }] }] }
  const audit = names.slice(0, 2).map((fullName, index) => ({ file, index, fullName, gaps: [], calls: 1, unsupported: [], faults: [] }))
  expect(fidelityOutcomes(control, observed, audit).map((row: any) => row.status)).toEqual(['passed', 'failed', 'upstream-skipped'])
  const guarded = fidelityOutcomes(control, observed, audit, undefined, { viewGap: unreviewedViewGap('crabtalk/bezel', '9.9.9') })
  expect(guarded.map((row: any) => [row.status, row.reason])).toEqual([['trident-blocked', 'view not reviewed for crabtalk/bezel 9.9.9'], ['trident-blocked', 'view not reviewed for crabtalk/bezel 9.9.9'], ['upstream-skipped', undefined]])
})

test('every project a view module names declares the versions its views were reviewed against', () => {
  const dir = join(import.meta.dir, '../unified/mermaid-fidelity')
  const sources = ['view-core.mjs', 'schema-views.mjs', ...readdirSync(join(dir, 'views')).filter(name => name.endsWith('.mjs') && name !== 'reviewed-versions.mjs').map(name => 'views/' + name)].map(name => readFileSync(join(dir, name), 'utf8'))
  const named = new Set(sources.flatMap(text => [...text.matchAll(/'((?:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)|pub:[a-z_]+)'/g)].map(match => match[1]!)).filter(name => !name.startsWith('.') && !name.includes('.mjs')))
  for (const project of named) expect(Object.keys(REVIEWED_VIEW_VERSIONS[project as keyof typeof REVIEWED_VIEW_VERSIONS] ?? {}), project).not.toHaveLength(0)
})

test("Mermaid Flutter's row names Mermaid Dart's parser at the versions its app resolves", () => {
  expect(lockedVersions('packages:\n  mermaid_core:\n    dependency: "direct main"\n    version: "0.3.9"\n  mermaid_flutter:\n    version: "0.4.0"\n')).toEqual({ mermaid_core: '0.3.9', mermaid_flutter: '0.4.0' })
  expect(flutterLock()).toEqual({ mermaid_core: expect.stringMatching(/^\d+\.\d+\.\d+$/), mermaid_flutter: expect.stringMatching(/^\d+\.\d+\.\d+$/) })
  const dart = candidate('orestesgaolin/mermaid', ['passed', 'passed', 'failed', 'failed', 'failed', 'failed'], '0.3.2')
  const flutter = { ...candidate('pub:mermaid_flutter', ['passed', 'passed', 'failed', 'failed', 'failed', 'failed'], '0.3.2'), sharedParserWith: 'orestesgaolin/mermaid', parserVersion: '0.3.2' }
  const merged = mergeFidelityRuns([run([reference, dart, flutter])])
  expect(merged.results.find(row => row.project === 'pub:mermaid_flutter')).toMatchObject({ sharedParserWith: 'orestesgaolin/mermaid', parserVersion: '0.3.2' })
  expect(() => mergeFidelityRuns([run([reference, dart, { ...flutter, parserVersion: '0.3.3' }])])).toThrow("orestesgaolin/mermaid's parser 0.3.3")
  const { davebench, drawing, catalog } = synthesisInputs(['orestesgaolin/mermaid', 'pub:mermaid_flutter'], '0.3.2')
  expect(renderBenchmarkLeagues(davebench, drawing, merged, catalog, { 'orestesgaolin/mermaid': 'Mermaid Dart', 'pub:mermaid_flutter': 'Mermaid Flutter' })).toContain('Mermaid Flutter 0.3.2 (same parser as Mermaid Dart 0.3.2)')
})

function synthesisInputs(projects: string[], version = '1') {
  const runs = (format: string) => [1, 2, 3].flatMap(round => projects.map(project => ({ project, version, format, run: round, boundary: 'fixture public API', attempted: 10, completed: 8, failed: 2, timeouts: 0, totalMs: 100 })))
  const corpus = { commit: 'fixed', occurrences: 10 }, method = { admission: 'fixture admission policy' }
  const davebench = threeBenchmarkReport({ state: 'complete', corpus, method, runs: [...runs('svg'), ...runs('png')], blocked: [] }, { state: 'complete', corpus, method, runs: runs('terminal'), blocked: [] })
  const drawing = { state: 'complete', corpus: { cases: 2 }, blocked: [], results: projects.map(project => ({ project, version, format: 'svg', counts: { correct: 1, incorrect: 1, 'renderer-failure': 0, 'invalid-format': 0, unknown: 0, unrun: 0 } })) }
  const catalog = { nodes: [...projects, 'mermaid-js/mermaid'].map(id => ({ id, benchmark: { version, outputs: ['svg'] } })) }
  return { davebench, drawing, catalog }
}

test('a partial re-run cannot be merged into a result published under the earlier definition', async () => {
  const { mergeIntoPublished } = await import('../scripts/merge-fidelity-runs.ts')
  const current = mergeFidelityRuns([run([reference, candidate('a', ['passed', 'failed', 'failed', 'failed', 'failed', 'failed'])])])
  const { scoring: _scoring, scoredPopulation: _population, inventoryCallbacks: _inventory, ...legacy } = current
  expect(() => mergeIntoPublished(legacy, [run([reference, candidate('a', ['passed', 'passed', 'failed', 'failed', 'failed', 'failed'])])])).toThrow('different Fidelity definition')
  expect(mergeIntoPublished(current, [run([reference, candidate('a', ['passed', 'passed', 'failed', 'failed', 'failed', 'failed'])])]).results.find((row: any) => row.project === 'a').scored.passed).toBe(2)
})
