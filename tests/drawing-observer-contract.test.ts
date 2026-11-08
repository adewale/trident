import { expect, test } from 'bun:test'
import { join } from 'node:path'
import { writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { execFileSync } from 'node:child_process'
import { drawingCases } from '../fidelity/drawing/corpus.ts'
import { expectedLabels, labelPolicy } from '../fidelity/drawing/labels.ts'
import { drawingAssessmentProfiles, verifyDrawingObserver } from '../fidelity/drawing/observer-contract.ts'
import { retainDrawingOutput, readDrawingOutput } from '../fidelity/drawing/retained-output.ts'
import { reassessDrawingRun } from '../scripts/reassess-drawing-results.ts'
import { campaignPlan, planDigest } from '../unified/campaign-plan.ts'
import { publishDrawingRun, mergeDrawingResults } from '../scripts/merge-drawing-results.ts'
import { useTempDirs } from './helpers/temp-dir.ts'

const temporary = useTempDirs('drawing-observer-contract-')
test('capture storage failure blocks collection without blaming a successful renderer', () => {
  const output = execFileSync(process.execPath, [join(import.meta.dirname, 'fixtures/drawing-storage-failure.ts')], { encoding: 'utf8' })
  const run = JSON.parse(output.trim().split('\n').at(-1)!)
  expect(run.rows).toEqual([])
  expect(run.outputs).toEqual([])
  expect(run.blocked).toHaveLength(1)
  expect(run.blocked[0].reason).toContain('Drawing output storage failed')
})
test('terminal observer exercises independent positive and negative controls', async () => {
  expect((await verifyDrawingObserver('terminal')).map(row => row.status)).toEqual(['correct', 'incorrect', 'incorrect'])
  expect(drawingAssessmentProfiles(['terminal']).terminal).toBe(drawingAssessmentProfiles(['svg', 'terminal']).terminal)
})

test('partial replay publishes the current policy only on reassessed formats', async () => {
  const root = temporary.dir(), input = drawingCases().find(test => test.family === 'flowchart' && !test.sourceGaps.length && expectedLabels(test).length > 0)!
  const record = retainDrawingOutput(root, 'fixture', input, 'terminal', expectedLabels(input).join('\n'))
  const lanes = ['terminal', 'svg'].map(format => ({ project: 'fixture', version: '1', format }))
  const run = { state: 'complete', assessmentPolicy: 'drawing-reviewed-labels-v1', updatedAt: 'collection time', plan: campaignPlan(lanes, [input.id], 1, {}), blocked: [], corpus: { cases: 1, ids: [input.id], contractSha256: planDigest([{ id: input.id, source: input.source, expected: input.expected, sourceGaps: input.sourceGaps }]) }, outputs: [record], rows: lanes.map(lane => ({ ...lane, caseId: input.id, status: 'unknown' })) }
  const result = await reassessDrawingRun(run, root, ['terminal'])
  expect(result.assessmentPolicy).toBeUndefined()
  expect(result.assessmentPolicies).toEqual({ terminal: labelPolicy, svg: run.assessmentPolicy })
  const published = publishDrawingRun(result), merged = mergeDrawingResults(publishDrawingRun(run), result, ['terminal'])
  for (const publication of [published, merged]) {
    expect(publication.assessmentPolicy).toBeUndefined()
    expect(publication.results.find((row: any) => row.format === 'terminal').assessmentPolicy).toBe(labelPolicy)
    expect(publication.results.find((row: any) => row.format === 'svg').assessmentPolicy).toBe(run.assessmentPolicy)
  }
})
test('reassessment observes retained output bytes, preserves collection time and detects tampering', async () => {
  const root = temporary.dir(), cases = drawingCases()
  const input = cases.find(test => test.family === 'flowchart' && !test.sourceGaps.length && expectedLabels(test).length > 0)!
  const record = retainDrawingOutput(root, 'fixture', input, 'terminal', expectedLabels(input).join('\n'))
  const run = { state: 'complete', updatedAt: 'original collection time', corpus: { ids: [input.id], contractSha256: planDigest([{ id: input.id, source: input.source, expected: input.expected, sourceGaps: input.sourceGaps }]) }, outputs: [record], rows: [{ project: 'fixture', caseId: input.id, version: '1', format: 'terminal', status: 'unknown' }] }
  const result = await reassessDrawingRun(run, root, ['terminal'])
  expect(result.rows[0].status).toBe('correct')
  expect(result.updatedAt).toBe('original collection time')
  expect(result.reassessment.renderersInvoked).toBe(false)
  writeFileSync(join(root, 'outputs', record.outputSha256 + '.gz'), gzipSync('changed drawing'))
  expect(() => readDrawingOutput(root, record, input.source)).toThrow('output changed')
  await expect(reassessDrawingRun(run, root, ['terminal'])).rejects.toThrow('output changed')
  await expect(reassessDrawingRun({ ...run, outputs: [] }, root, ['terminal'])).rejects.toThrow('retained outputs')
})
