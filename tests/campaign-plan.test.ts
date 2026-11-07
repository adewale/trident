import { expect, test } from 'bun:test'
import { campaignPlan, assertCampaignCoverage } from '../unified/campaign-plan.ts'
import { threeBenchmarkReport } from '../unified/three-benchmark-report.ts'
import { publishDrawingRun } from '../scripts/merge-drawing-results.ts'

const lane = (project: string, format = 'svg') => ({ project, version: '1', format })
test('a missing lane cannot disappear from an otherwise complete campaign', () => {
  const plan = campaignPlan([lane('a'), lane('b')], ['c'], 1, { source: 'reviewed' })
  const rows = [{ ...lane('a'), caseId: 'c', status: 'correct' }]
  expect(() => assertCampaignCoverage(plan, rows, [], 'drawing')).toThrow('planned lane')
  expect(() => assertCampaignCoverage(plan, rows, [{ project: 'b', format: 'svg', reason: 'No artifact' }], 'drawing')).not.toThrow()
  expect(() => assertCampaignCoverage(plan, [...rows, rows[0]], [{ project: 'a', reason: 'blocked' }, { project: 'b', reason: 'blocked' }], 'drawing')).toThrow('Duplicate')
  expect(() => assertCampaignCoverage(plan, [{ ...rows[0], version: 'other' }], [], 'drawing')).toThrow('version')
})
test('empty envelopes cannot claim measurement, and complete all-blocked plans stay unmeasured', () => {
  const common = { state: 'complete', corpus: { commit: 'pin', occurrences: 1 }, method: { admission: 'same' }, runs: [], blocked: [] }
  expect(() => threeBenchmarkReport(common, common)).toThrow('Empty collection')
  const collection = (format: string) => ({ ...common, plan: campaignPlan([lane('a', format)], ['c'], 3, {}), blocked: [{ project: 'a', reason: 'Unavailable' }] })
  expect(threeBenchmarkReport(collection('svg'), collection('terminal')).measurements.davebench.status).toBe('unmeasured')
  expect(() => publishDrawingRun({ state: 'complete', corpus: { cases: 1, ids: ['c'] }, rows: [], blocked: [] })).toThrow('Empty Drawing')
})
test('reviewed expectations and admission inputs are part of the plan identity', () => {
  const make = (inputs: unknown) => campaignPlan([lane('a')], ['c'], 1, inputs)
  expect(make({ label: 'old' }).identity).not.toBe(make({ label: 'new' }).identity)
  expect(() => (make({}).cases as string[]).push('extra')).toThrow()
  expect(() => campaignPlan([{ ...lane('a'), version: 1 as unknown as string }], ['c'], 1, {})).toThrow('frozen versions')
  expect(() => campaignPlan([lane('a')], [1 as unknown as string], 1, {})).toThrow('case IDs')
})
