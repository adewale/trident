import { expect, test } from 'bun:test'
import { join } from 'node:path'
import { writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { drawingCases } from '../fidelity/drawing/corpus.ts'
import { expectedLabels } from '../fidelity/drawing/labels.ts'
import { drawingAssessmentProfiles, verifyDrawingObserver } from '../fidelity/drawing/observer-contract.ts'
import { retainDrawingOutput, readDrawingOutput } from '../fidelity/drawing/retained-output.ts'
import { reassessDrawingRun } from '../scripts/reassess-drawing-results.ts'
import { planDigest } from '../unified/campaign-plan.ts'
import { useTempDirs } from './helpers/temp-dir.ts'

const temporary = useTempDirs('drawing-observer-contract-')
test('terminal observer exercises independent positive and negative controls', async () => {
  expect((await verifyDrawingObserver('terminal')).map(row => row.status)).toEqual(['correct', 'incorrect', 'incorrect'])
  expect(drawingAssessmentProfiles(['terminal']).terminal).toBe(drawingAssessmentProfiles(['svg', 'terminal']).terminal)
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
