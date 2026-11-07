import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { qualifyDomFree } from '../scripts/qualify-dom-free.ts'

function runs() {
  const job = { pin: 'pin', controlIdentity: 'a'.repeat(64), target: { project: 'candidate', version: '1', sha256: 'frozen' }, upstream: '/source', runtime: '/runner', files: ['a.spec.ts', 'b.spec.ts'].map(path => ({ path })) }
  const native = { testResults: job.files.map(file => ({ name: '/source/' + file.path, assertionResults: [{ fullName: 'suite test', status: 'passed', failureMessages: [] }] })) }
  const audit = job.files.map(file => ({ file: '/source/' + file.path, index: 0, name: 'suite > test', calls: 1, rejections: 0, gaps: [], faults: [] as string[], unsupported: [], protocol: 'native-operations-v2' }))
  const baseline = [{ job, native, audit }], node = structuredClone(baseline)
  for (const file of node[0]!.job.files) Object.assign(file, { environment: 'node' })
  return { baseline, node }
}
test('DOM-free qualification requires complete callback and audit equality, including faults hidden by equal pass counts', () => {
  const { baseline, node } = runs()
  expect(qualifyDomFree(baseline, node, 'pin').files).toEqual(['a.spec.ts', 'b.spec.ts'])
  node[0]!.audit[1]!.faults.push('caught candidate fault')
  expect(qualifyDomFree(baseline, node, 'pin').files).toEqual(['a.spec.ts'])
  node[0]!.native.testResults[0]!.assertionResults[0]!.fullName = 'different callback'
  expect(qualifyDomFree(baseline, node, 'pin').files).toEqual([])
})
test('DOM-free qualification cannot cross an artifact, runner, or cohort change', () => {
  const { baseline, node } = runs()
  node[0]!.job.target.sha256 = 'different bytes'
  expect(() => qualifyDomFree(baseline, node, 'pin')).toThrow('frozen inputs')
  expect(() => qualifyDomFree(baseline, [], 'pin')).toThrow('cohort')
})

test('published DOM-free selections require complete equal observations for the recorded cohort', () => {
  const proof = JSON.parse(readFileSync(new URL('../unified/mermaid-fidelity/dom-free-files.json', import.meta.url), 'utf8'))
  const targets = Object.keys(proof.targets)
  expect(proof.protocol).toBe('dom-free-qualification-v1')
  expect(targets.length).toBeGreaterThan(0)
  expect(Object.keys(proof.fingerprints).sort()).toEqual([...targets].sort())
  const files = Object.keys(proof.fingerprints[targets[0]!])
  for (const project of targets) expect(Object.keys(proof.fingerprints[project]).sort()).toEqual([...files].sort())
  const eligible = files.filter(file => targets.every(project => {
    const pair = proof.fingerprints[project][file]
    return typeof pair?.jsdom === 'string' && /^[a-f0-9]{64}$/.test(pair.jsdom) && pair.jsdom === pair.node
  }))
  expect([...proof.files].sort()).toEqual(eligible.sort())
})
