import { expect, test } from 'bun:test'
import { parseOptions } from '../unified/options.ts'
import { startupPasses, startupPassFlags } from '../unified/startup-passes.ts'

test('startup pass selection is explicit and invalid values are refused', () => {
  expect(startupPasses(undefined)).toBe('all')
  for (const pass of ['all', 'latency', 'resources'] as const) expect(parseOptions(['--startup-passes', pass]).startupPasses).toBe(pass)
  expect(() => parseOptions(['--startup-passes', 'memory'])).toThrow('startup-passes')
  expect(startupPassFlags('all', 1)).toEqual([false, true])
  expect(startupPassFlags('all', 2)).toEqual([false])
  expect(startupPassFlags('latency', 1)).toEqual([false])
  expect(startupPassFlags('resources', 1)).toEqual([true])
  expect(startupPassFlags('resources', 2)).toEqual([])
})
