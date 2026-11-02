import { expect, test } from 'bun:test'
import { fidelityOutcomes } from '../unified/mermaid-fidelity.ts'

const native = (statuses: string[]) => ({ testResults: [{ name: '/original.spec.ts', assertionResults: statuses.map(status => ({ fullName: 'parameter table repeated title', status })) }] })
const audit = (index: number, extra = {}) => ({ index, file: '/original.spec.ts', name: 'parameter table repeated title', calls: 1, gaps: [], ...extra })
test('expanded parameter cases with the same title retain separate results', () => {
  const rows = fidelityOutcomes(native(['passed', 'passed']), native(['passed', 'failed']), [audit(0), audit(1)])
  expect(rows.map((r: any) => r.status)).toEqual(['passed', 'failed'])
})
test('a caught missing-adapter exception, unsupported result, or absent target invocation cannot become a pass', () => {
  const rows = fidelityOutcomes(native(['passed', 'passed', 'passed']), native(['passed', 'passed', 'passed']), [audit(0, { gaps: ['missing native getter'] }), audit(1, { unsupported: ['actual opaque model'] }), audit(2, { calls: 0 })])
  expect(rows.map((r: any) => r.status)).toEqual(['trident-blocked', 'unsupported', 'trident-blocked'])
})
test('upstream skips and unqualified control tests stay separate from candidate failures', () => {
  expect(fidelityOutcomes(native(['pending', 'failed']), native(['failed', 'failed']), [audit(0), audit(1)]).map((r: any) => r.status)).toEqual(['upstream-skipped', 'reference-unqualified'])
})

test('a passing reference assertion with an adapter gap cannot qualify a candidate', () => {
  const rows = fidelityOutcomes(native(['passed']), native(['passed']), [audit(0)], [audit(0, { gaps: ['unbound reference operation'] })])
  expect(rows[0].status).toBe('reference-unqualified')
})
