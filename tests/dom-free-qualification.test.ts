import { expect, test } from 'bun:test'
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
