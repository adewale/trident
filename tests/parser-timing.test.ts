import { expect, test } from 'bun:test'
import { samplePublicParser } from '../unified/parser-timing.mjs'

test('sampling preserves authored source and separates first, warmup and repeated calls', async () => {
  const calls: string[] = []
  const result = await samplePublicParser(async (source: string) => { calls.push(source); return { diagramType: 'flowchart' } }, 'graph LR; A-->B', 3)
  expect(calls).toEqual(Array(5).fill('graph LR; A-->B'))
  expect(result.ok).toBe(true)
  expect(result.timing.samplesMs).toHaveLength(3)
  expect([result.timing.firstMs, ...result.timing.samplesMs].every(value => Number.isFinite(value) && value >= 0)).toBe(true)
})

test('rejected sources retain timings and distinguish false returns from exceptions', async () => {
  const refused = await samplePublicParser(async () => false, 'invalid', 2)
  expect(refused.ok).toBe(false)
  expect(refused.error).toBe('Public parser returned false')
  expect(refused.timing.samplesMs).toHaveLength(2)
  const thrown = await samplePublicParser(async () => { throw new Error('invalid grammar') }, 'invalid', 2)
  expect(thrown.ok).toBe(false)
  expect(thrown.error).toBe('invalid grammar')
  expect(thrown.timing.samplesMs).toHaveLength(2)
})

test.each([0, 101, 1.5, NaN])('invalid sample count %s refuses before parser execution', async samples => {
  let called = false
  await expect(samplePublicParser(async () => { called = true }, 'source', samples)).rejects.toThrow('Invalid API benchmark samples')
  expect(called).toBe(false)
})
