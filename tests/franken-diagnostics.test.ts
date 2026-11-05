import { diagnosticSummary } from '../unified/community-extra-adapters.mjs'
import { expect, test } from 'bun:test'

test('a public snake-case rejection flag cannot become successful validation', () => {
  expect(diagnosticSummary({ is_valid: false, errors: [] }).accepted).toBe(false)
  expect(diagnosticSummary({ is_valid: true, errors: [] }).accepted).toBe(true)
})
