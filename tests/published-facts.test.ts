import { expect, test } from 'bun:test'
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, cpSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fillFacts, publishedFacts } from '../unified/published-facts.ts'
import { currentBenchmarkResultFiles } from '../unified/three-benchmark-report.ts'
import { writeSnapshot } from '../unified/results-snapshot.ts'
import { fidelityScoring } from '../unified/mermaid-fidelity/scoring.ts'

const root = resolve(import.meta.dir, '..')
const read = (path: string) => JSON.parse(readFileSync(join(root, path), 'utf8'))

test('a fact marker is filled from the result files and an unknown fact is an error', () => {
  const [davebench, drawing, fidelity] = currentBenchmarkResultFiles.slice(0, 3).map(read)
  const facts = publishedFacts(davebench, drawing, fidelity)
  // The population fact is the scored population: under the current scoring protocol, the
  // diagram and parser callbacks the control passes; for older result files, every one.
  expect(facts['fidelity-population']).toBe(fidelityScoring(fidelity).population.toLocaleString('en-US'))
  expect(fillFacts('x <!-- fact:fidelity-population -->1<!-- /fact --> y', facts)).toBe(`x <!-- fact:fidelity-population -->${facts['fidelity-population']}<!-- /fact --> y`)
  expect(() => fillFacts('<!-- fact:nonsense -->1<!-- /fact -->', facts)).toThrow('unknown published fact')
})

test('results:snapshot --check fails when a published number drifts from the results', () => {
  const copy = mkdtempSync(join(tmpdir(), 'trident-facts-'))
  for (const path of [...currentBenchmarkResultFiles, 'RESULTS.md', 'README.md', ...(existsSync(join(root, 'docs/davebench-families.md')) ? ['docs/davebench-families.md'] : [])]) { mkdirSync(join(copy, path, '..'), { recursive: true }); cpSync(join(root, path), join(copy, path)) }
  expect(() => writeSnapshot(copy, true)).not.toThrow()
  writeFileSync(join(copy, 'README.md'), readFileSync(join(copy, 'README.md'), 'utf8').replace(/<!-- fact:fidelity-population -->[^<]*<!-- \/fact -->/, '<!-- fact:fidelity-population -->3,602<!-- /fact -->'))
  expect(() => writeSnapshot(copy, true)).toThrow('README.md')
})

test('a leader fact names ties and is marked while an unassessed case could still overtake it', () => {
  const [davebench, drawing, fidelity] = currentBenchmarkResultFiles.slice(0, 3).map(read)
  const svg = drawing.results.filter((row: any) => row.format === 'svg')
  for (const [index, row] of svg.entries()) Object.assign(row.counts, { correct: index < 2 ? 100 : 80, unknown: 0, unrun: 0 })
  const tied = svg.slice(0, 2)
  expect(publishedFacts(davebench, drawing, fidelity)['drawing-svg-leader']).toBe(tied.map((row: any) => row.project).sort().join(' and ') + ' with 100 each')
  // A trailing row whose unassessed cases could reach the leader makes the lead unsettled.
  const trailing = svg[2]
  trailing.counts.unknown = 20
  expect(publishedFacts(davebench, drawing, fidelity)['drawing-svg-leader']).toEndWith('(not yet settled)')
})

test("the README's install commands check out the pinned Mermaid reference's tag", async () => {
  const { MERMAID_ORACLE_PIN } = await import('../portable/mermaid-oracle.ts')
  const readme = readFileSync(join(root, 'README.md'), 'utf8')
  const tags = [...readme.matchAll(/checkout (mermaid@[0-9.]+)/g)].map(match => match[1])
  expect(tags.length).toBeGreaterThan(0)
  expect(new Set(tags)).toEqual(new Set([`mermaid@${MERMAID_ORACLE_PIN.version}`]))
})
