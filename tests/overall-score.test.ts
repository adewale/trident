import { expect, test } from 'bun:test'
import { overallScore } from '../unified/overall-score.ts'

test('overall scoring gives each measured benchmark equal weight', () => {
  expect(overallScore({ davebench: 100, drawing: 40, fidelity: 40 })).toBe(60)
  expect(overallScore({ davebench: 60, drawing: 70, fidelity: 80 })).toBe(70)
  expect(overallScore({ davebench: 0, drawing: 0, fidelity: 0 })).toBe(0)
})
test('missing or invalid measurements cannot produce an overall score', () => {
  for (const key of ['davebench', 'drawing', 'fidelity']) expect(overallScore({ davebench: 100, drawing: 100, fidelity: 100, [key]: null })).toBeNull()
  expect(() => overallScore({ davebench: 101, drawing: 80, fidelity: 80 })).toThrow()
  expect(() => overallScore({ davebench: Number.NaN, drawing: null, fidelity: null })).toThrow()
})
