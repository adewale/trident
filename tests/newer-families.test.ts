import { expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { familySupportProbe, newerFamilies, portableCases, scoredFamilies } from '../portable/cohorts.ts'
import { assertMermaidOracle, assertOracleAgrees, MERMAID_ORACLE_PIN, mermaidUpstreamDirectory, mermaidVerdicts } from '../portable/mermaid-oracle.ts'
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

test('the mark stays 23 families and the newer families stay out of the portable cohorts', () => {
  expect(scoredFamilies()).toHaveLength(23)
  expect(newerFamilies()).toEqual(['venn', 'treeview', 'wardley', 'eventmodeling', 'cynefin', 'railroad', 'swimlane', 'agentflow', 'usecase'])
  expect(newerFamilies().filter(family => scoredFamilies().includes(family))).toEqual([])
  expect(portableCases().filter(testCase => newerFamilies().includes(testCase.family))).toEqual([])
})

test('the pinned oracle accepts every newer probe and reads back exactly its labels', async () => {
  const oracle = assertMermaidOracle()
  const probes = newerFamilies().map(family => familySupportProbe(family)!)
  await assertOracleAgrees(oracle, probes.map(probe => ({ id: probe.id, source: probe.source, accept: true })))
  const replies = await mermaidVerdicts(oracle, probes.map(probe => probe.source), { snapshot: true })
  probes.forEach((probe, index) => {
    const labels = referenceLabels(probe.family, replies[index]!)
    // Eventmodeling has no element getter; its probe's own labels are the only expectation.
    if (probe.family === 'eventmodeling') return expect(labels).toBeUndefined()
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
