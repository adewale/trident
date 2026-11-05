import { expect, test } from 'bun:test'
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, cpSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fillFacts, publishedFacts } from '../unified/published-facts.ts'
import { currentBenchmarkResultFiles } from '../unified/three-benchmark-report.ts'
import { writeSnapshot } from '../unified/results-snapshot.ts'

const root = resolve(import.meta.dir, '..')
const read = (path: string) => JSON.parse(readFileSync(join(root, path), 'utf8'))

test('a fact marker is filled from the result files and an unknown fact is an error', () => {
  const [davebench, drawing, fidelity] = currentBenchmarkResultFiles.slice(0, 3).map(read)
  const facts = publishedFacts(davebench, drawing, fidelity)
  const control = fidelity.results.find((row: any) => row.project === 'mermaid-js/mermaid')
  expect(facts['fidelity-population']).toBe(control.counts.passed.toLocaleString('en-US'))
  expect(fillFacts('x <!-- fact:fidelity-population -->1<!-- /fact --> y', facts)).toBe(`x <!-- fact:fidelity-population -->${facts['fidelity-population']}<!-- /fact --> y`)
  expect(() => fillFacts('<!-- fact:nonsense -->1<!-- /fact -->', facts)).toThrow('unknown published fact')
})

test('results:snapshot --check fails when a published number drifts from the results', () => {
  const copy = mkdtempSync(join(tmpdir(), 'trident-facts-'))
  for (const path of [...currentBenchmarkResultFiles, 'RESULTS.md', 'README.md']) { mkdirSync(join(copy, path, '..'), { recursive: true }); cpSync(join(root, path), join(copy, path)) }
  const snapshot = read('results/latest.json'), catalog = read('docs/evidence/benchmark-campaign-2026-11-02/catalog.json')
  expect(() => writeSnapshot(snapshot, catalog, copy, true)).not.toThrow()
  writeFileSync(join(copy, 'README.md'), readFileSync(join(copy, 'README.md'), 'utf8').replace(/<!-- fact:fidelity-population -->[^<]*<!-- \/fact -->/, '<!-- fact:fidelity-population -->3,602<!-- /fact -->'))
  expect(() => writeSnapshot(snapshot, catalog, copy, true)).toThrow('README.md')
})
