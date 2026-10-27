import { expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { familySupportProbe, legacyScoredFamilies, newerFamilies, portableCases, scoredFamilies } from '../portable/cohorts.ts'
import { assertMermaidOracle, assertOracleAgrees, MERMAID_ORACLE_PIN, mermaidUpstreamDirectory, mermaidVerdicts, mermaidZenumlAddon, mermaidOracleDirectory } from '../portable/mermaid-oracle.ts'
import { communityCorpus } from '../unified/corpus.ts'
import { mermaidDocsWorkloads } from '../unified/corpus-import.ts'
import { censusDisplayText, referenceLabels } from '../unified/oracle-labels.ts'

const tag = `mermaid@${MERMAID_ORACLE_PIN.version}`
const upstreamTagged = (() => {
  try {
    execFileSync('git', ['rev-parse', '--verify', `refs/tags/${tag}`], { cwd: mermaidUpstreamDirectory(), stdio: 'ignore' })
    return true
  } catch {
    return false
  }
})()

test('the historical family mark stays fixed while the current portable cohort exercises both required additions', () => {
  expect(legacyScoredFamilies()).toHaveLength(23)
  expect(scoredFamilies()).toHaveLength(25)
  expect(newerFamilies()).toEqual(['venn', 'treeview', 'wardley', 'eventmodeling', 'cynefin', 'railroad', 'swimlane', 'agentflow', 'usecase'])
  expect(newerFamilies().filter(family => scoredFamilies().includes(family))).toEqual(['eventmodeling'])
  expect(legacyScoredFamilies()).not.toContain('eventmodeling')
  expect(legacyScoredFamilies()).not.toContain('zenuml')
  expect(portableCases(['family']).filter(testCase => ['eventmodeling', 'zenuml'].includes(testCase.family)).map(testCase => [testCase.family, testCase.source])).toEqual(['eventmodeling', 'zenuml'].map(family => [family, familySupportProbe(family)!.source]))
  expect(portableCases().filter(testCase => newerFamilies().includes(testCase.family)).map(testCase => testCase.family)).toEqual(['eventmodeling'])
})

test('the pinned oracle accepts every newer probe and reads back exactly its labels', async () => {
  const oracle = assertMermaidOracle()
  const probes = newerFamilies().map(family => familySupportProbe(family)!)
  await assertOracleAgrees(oracle, probes.map(probe => ({ id: probe.id, source: probe.source, accept: true })))
  const replies = await mermaidVerdicts(oracle, probes.map(probe => probe.source), { snapshot: true })
  probes.forEach((probe, index) => {
    const labels = referenceLabels(probe.family, replies[index]!)
    expect([...new Set(labels!.map(label => censusDisplayText(label.text)))].sort()).toEqual([...probe.expected.labels].sort())
  })
})

test('the committed corpus carries every documented example of the newer families at the oracle release', () => {
  const corpus = communityCorpus()
  expect(corpus.upstream?.tag).toBe(tag)
  for (const family of newerFamilies()) {
    const own = corpus.workloads.filter(workload => workload.family === family)
    expect(own.length).toBeGreaterThan(0)
    expect(own.every(workload => workload.provenance.startsWith(`${tag}:${corpus.upstream!.files[family]}#`))).toBe(true)
    expect(corpus.profiles.smoke.filter(id => own.some(workload => workload.id === id))).toHaveLength(1)
    expect(own.every(workload => corpus.profiles.full.includes(workload.id))).toBe(true)
  }
})

test.skipIf(!upstreamTagged)('a re-import from the tagged Mermaid checkout reproduces the committed examples', () => {
  const docs = mermaidDocsWorkloads(mermaidUpstreamDirectory())
  expect(docs.upstream).toEqual(communityCorpus().upstream!)
  expect(docs.workloads).toEqual(communityCorpus().workloads.filter(workload => newerFamilies().includes(workload.family)))
})

// The independent parser supplies Event Modeling identities even when jsdom cannot
// execute Mermaid's layout-dependent getState getter. Missing those labels must fail.
test('Event Modeling label expectations survive the oracle layout getter failing', async () => {
  const [reply] = await mermaidVerdicts(assertMermaidOracle(), ['eventmodeling\ntf 01 ui Cart.Screen\ntf 02 cmd AddItem { description: string }\ntf 03 evt ItemAdded\ntf 04 evt Account.Cart.CheckedOut'], { snapshot: true })
  expect(reply!.accepted).toBe(true)
  expect(referenceLabels('eventmodeling', reply!)?.map(label => label.text)).toEqual(['Screen', 'Cart', 'AddItem', 'ItemAdded', 'Account.Cart.CheckedOut'])
})

test('the pinned Mermaid baseline accepts every imported documented example before benchmarking', async () => {
  const imported = communityCorpus().workloads.filter(workload => newerFamilies().includes(workload.family))
  await assertOracleAgrees(assertMermaidOracle(), imported.map(workload => ({ id: workload.id, source: workload.source, accept: true })))
})

test('ZenUML refuses an addon version outside this benchmark set before loading it', () => {
  const root = mkdtempSync(join(tmpdir(), 'trident-zenuml-pin-'))
  try {
    mkdirSync(join(root, 'dist'))
    writeFileSync(join(root, 'dist/mermaid-zenuml.esm.min.mjs'), 'throw Error("must not import")')
    writeFileSync(join(root, 'package.json'), JSON.stringify({ name: '@mermaid-js/mermaid-zenuml', version: '1.0.0' }))
    expect(() => mermaidZenumlAddon(mermaidOracleDirectory(), root)).toThrow('1.0.1')
  } finally { rmSync(root, { recursive: true, force: true }) }
})

const addonAvailable = existsSync(join(process.env.MERMAID_ZENUML_BENCHMARK_ROOT ?? join(mermaidOracleDirectory(), 'node_modules/@mermaid-js/mermaid-zenuml'), 'package.json'))
test.skipIf(!addonAvailable)('the pinned first-party addon admits the authored required ZenUML source', async () => {
  const probe = familySupportProbe('zenuml')!
  const [reply] = await mermaidVerdicts(assertMermaidOracle(), [probe.source], { snapshot: true })
  expect(reply!.accepted).toBe(true)
  expect(reply!.diagramType).toBe('zenuml')
  // Its public DB contains only clear(): authored fixture labels remain the oracle.
  expect(referenceLabels('zenuml', reply!)).toBeUndefined()
})
