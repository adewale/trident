import { expect, test } from 'bun:test'
import { readFileSync, writeFileSync } from 'node:fs'
import { qualifyDomFree } from '../scripts/qualify-dom-free.ts'
import { useTempDirs } from './helpers/temp-dir.ts'

const temporary = useTempDirs('dom-free-qualification-')
function runs(upstream = '/source') {
  const job = { pin: 'pin', controlIdentity: 'a'.repeat(64), target: { project: 'candidate', version: '1', sha256: 'frozen' }, upstream, runtime: '/runner', files: ['a.spec.ts', 'b.spec.ts'].map(path => ({ path, absolute: upstream + '/' + path })) }
  const native = { testResults: job.files.map(file => ({ name: file.absolute, assertionResults: [{ fullName: 'suite test', status: 'passed', failureMessages: [] }] })) }
  const audit = job.files.map(file => ({ file: file.absolute, index: 0, name: 'suite > test', calls: 1, rejections: 0, gaps: [], faults: [] as string[], unsupported: [], protocol: 'native-operations-v2' }))
  const environments = job.files.map(file => ({ protocol: 'fidelity-environment-v1' as const, file: file.absolute, environment: 'jsdom' as 'node' | 'jsdom', window: 'object', document: 'object' }))
  const baseline = [{ job, native, audit, environments }], node = structuredClone(baseline)
  for (const file of node[0]!.job.files) Object.assign(file, { environment: 'node' })
  for (const receipt of node[0]!.environments) Object.assign(receipt, { environment: 'node', window: 'undefined', document: 'undefined' })
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

test('a Node claim without the actual Node globals cannot qualify', () => {
  const { baseline, node } = runs()
  node[0]!.environments[0]!.window = 'object'
  expect(() => qualifyDomFree(baseline, node, 'pin')).toThrow('TRIDENT_RUNNER_ENVIRONMENT')
  node[0]!.environments = []
  expect(qualifyDomFree(baseline, node, 'pin').files).toEqual([])
})

test('an explicit upstream JSDOM directive is a complete constraint, without pretending Node executed it', () => {
  const root = temporary.dir(), { baseline, node } = runs(root), file = root + '/a.spec.ts'
  writeFileSync(file, '// @vitest-environment jsdom\n')
  node[0]!.environments.shift(); node[0]!.audit.shift()
  Object.assign(node[0]!.native.testResults[0]!, { assertionResults: [], status: 'failed', message: `TRIDENT_RUNNER_ENVIRONMENT: ${file}: expected node; window=object, document=object` })
  const proof = qualifyDomFree(baseline, node, 'pin')
  expect(proof.files).toEqual(['b.spec.ts'])
  expect(proof.environmentRequirements['a.spec.ts']).toMatchObject({ environment: 'jsdom' })
  expect((proof.fingerprints.candidate as any)['a.spec.ts'].node).toMatch(/^[a-f0-9]{64}$/)
})

test('identical completed collection failures can use Node without claiming callbacks or semantic credit', () => {
  const { baseline, node } = runs()
  for (const run of [baseline[0]!, node[0]!]) {
    Object.assign(run.native.testResults[0]!, { assertionResults: [], status: 'failed', message: 'Unsupported candidate operation: no registry API' })
    run.audit.shift()
  }
  expect(qualifyDomFree(baseline, node, 'pin').files).toEqual(['a.spec.ts', 'b.spec.ts'])
  Object.assign(node[0]!.native.testResults[0]!, { message: 'TRIDENT_ADAPTER_GAP: missing native getter' })
  expect(qualifyDomFree(baseline, node, 'pin').files).toEqual(['b.spec.ts'])
  for (const run of [baseline[0]!, node[0]!]) Object.assign(run.native.testResults[0]!, { message: '' })
  expect(qualifyDomFree(baseline, node, 'pin').files).toEqual(['b.spec.ts'])
})

test('published DOM-free selections require complete equal observations for the recorded cohort', () => {
  const proof = JSON.parse(readFileSync(new URL('../unified/mermaid-fidelity/dom-free-files.json', import.meta.url), 'utf8'))
  const targets = Object.keys(proof.targets)
  expect(proof.protocol).toBe('dom-free-qualification-v2')
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
