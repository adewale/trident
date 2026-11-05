// The published release results must be internally consistent: every count reconciles with
// the cases behind it, every rejection and gap has a recorded reason, all three benchmarks
// measured the same project versions, and the DaveBench report is exactly what its raw runs
// produce. A hand edit, a partial merge or a mixed collection fails here.
import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { threeBenchmarkReport } from '../unified/three-benchmark-report.ts'

const root = join(import.meta.dir, '../results/release')
const read = (name: string) => JSON.parse(readFileSync(join(root, name), 'utf8'))
const images = read('images.json'), terminal = read('terminal.json'), flutter = read('flutter.json')
const drawing = read('drawing-correctness.json'), fidelity = read('mermaid-fidelity.json')
const SCORED = ['passed', 'failed', 'unsupported', 'trident-blocked']
const UNSCORED = ['reference-unqualified', 'upstream-skipped', 'upstream-expected-failure']
const sum = (counts: Record<string, number>, keys = Object.keys(counts)) => keys.reduce((total, key) => total + (counts[key] ?? 0), 0)

test('every DaveBench row has three complete runs whose accounting reconciles', () => {
  for (const collection of [images, terminal, flutter]) {
    expect(collection.state).toBe('complete')
    const rows = new Map<string, any[]>()
    for (const run of collection.runs) rows.set(run.project + ' ' + run.format, [...(rows.get(run.project + ' ' + run.format) ?? []), run])
    for (const [row, runs] of rows) {
      expect(runs.map(run => run.run).sort(), row).toEqual([1, 2, 3])
      expect(new Set(runs.map(run => run.version)).size, row).toBe(1)
      for (const run of runs) {
        expect(run.attempted, row).toBe(collection.corpus.occurrences)
        expect(run.completed + run.failed, row).toBe(run.attempted)
        expect(run.totalMs, row).toBeGreaterThan(0)
        const invalid = run.invalid ?? 0
        expect(invalid, row).toBeLessThanOrEqual(run.failed)
        expect(sum(run.invalidReasons ?? {}), row).toBe(invalid)
        // Every rejected output is recorded by input id, with its reason.
        if (invalid) expect(Object.keys(run.rejected ?? {}).length, row).toBe(invalid)
      }
    }
  }
})

test('the DaveBench report is exactly what its raw runs produce', () => {
  expect(JSON.stringify(threeBenchmarkReport(images, terminal))).toBe(JSON.stringify(read('report.json')))
})

test('every Drawing row accounts for each case once and the totals reconcile', () => {
  const ids: string[] = drawing.corpus.ids
  expect(new Set(ids).size).toBe(drawing.corpus.cases)
  for (const id of ids) expect(id).toMatch(/^(drawing|regression):[0-9a-f]{16}$/)
  const totals: Record<string, number> = {}
  for (const row of drawing.results) {
    const label = row.project + ' ' + row.format
    expect(sum(row.counts), label).toBe(drawing.corpus.cases)
    expect(Object.values(row.caseOutcomes).flat().sort(), label).toEqual([...ids].sort())
    for (const [status, count] of Object.entries(row.counts as Record<string, number>)) {
      expect(row.caseOutcomes[status]?.length ?? 0, label + ' ' + status).toBe(count)
      totals[status] = (totals[status] ?? 0) + count
    }
  }
  expect(totals).toEqual(drawing.totals)
})

test('every Fidelity project is scored over exactly the tests the control passes, file by file', () => {
  const control = fidelity.results.find((row: any) => row.project === 'mermaid-js/mermaid')
  expect(fidelity.referenceQualifiedCallbacks).toBe(control.counts.passed)
  expect(control.counts.failed + control.counts.unsupported + control.counts['trident-blocked']).toBe(0)
  const controlFiles = new Map<string, Record<string, number>>(control.perFile.map((file: any) => [file.path, file.counts]))
  for (const row of fidelity.results) {
    expect(sum(row.counts), row.project).toBe(fidelity.expandedCallbacks)
    expect(new Set(row.perFile.map((file: any) => file.path)), row.project).toEqual(new Set(controlFiles.keys()))
    const totals: Record<string, number> = {}
    for (const file of row.perFile) {
      const reference = controlFiles.get(file.path)!
      expect(sum(file.counts, SCORED), row.project + ' ' + file.path).toBe(reference.passed ?? 0)
      for (const status of UNSCORED) expect(file.counts[status] ?? 0, row.project + ' ' + file.path + ' ' + status).toBe(reference[status] ?? 0)
      for (const [status, count] of Object.entries(file.counts as Record<string, number>)) totals[status] = (totals[status] ?? 0) + count
    }
    for (const [status, count] of Object.entries(row.counts as Record<string, number>)) expect(totals[status] ?? 0, row.project + ' ' + status).toBe(count)
    // Every test Trident could not assess carries its reason.
    expect(sum(row.gapReasons), row.project).toBe(row.counts['trident-blocked'])
  }
})

test('declared ports and shared parsers score identically', () => {
  const row = (project: string) => fidelity.results.find((entry: any) => entry.project === project)
  // MermaidText is a declared Go port of Grok's renderer; Mermaid Flutter calls mermaid_core unchanged.
  for (const [a, b] of [['xai-org/grok-build', 'spacedock-dev/mermaidtext'], ['orestesgaolin/mermaid', 'pub:mermaid_flutter']] as const) {
    expect(row(a).counts).toEqual(row(b).counts)
    expect(row(a).perFile).toEqual(row(b).perFile)
  }
})

test('all three benchmarks measured the same version of each project', () => {
  const versions = new Map<string, Set<string>>()
  const note = (project: string, version: string) => versions.set(project, (versions.get(project) ?? new Set()).add(version))
  for (const collection of [images, terminal, flutter]) for (const run of collection.runs) note(run.project, run.version)
  for (const row of drawing.results) note(row.project, row.version)
  for (const row of fidelity.results) note(row.project, row.version)
  for (const [project, seen] of versions) expect([...seen], project).toHaveLength(1)
})
