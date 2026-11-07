import { expect, test } from 'bun:test'
import { terminalObservation } from '../fidelity/terminal-observation.ts'
import { inspectTerminalMeaning } from '../fidelity/terminal.ts'

test('output-scoped terminal facts are reused, profile-specific, and independent of source identities', () => {
  const output = '┌─────┐\n│ One │\n└─────┘', observation = terminalObservation(output)
  const display = observation.display()
  expect(observation.display()).toBe(display)
  expect(observation.display({ columns: 2, rows: 2, inputBytes: 1000 }).status).toBe('unavailable')
  expect(() => observation.assertOutput('other output')).toThrow('another output')
  expect(() => { display.cells[0]![0] = 'changed' }).toThrow()
  const profile = { horizontal: /^[─]+$/, vertical: /^[│]$/ }
  const boxes = observation.rectangles(display, profile); boxes[0]!.lines[0] = 'contaminated'
  expect(observation.rectangles(display, profile)[0]!.lines).toEqual(['One'])
})
test('exhaustion supplies unknown rather than a missing-node finding', () => {
  const output = '┌─────┐\n│ One │\n└─────┘'
  expect(inspectTerminalMeaning(output, { nodes: [{ id: 'one', label: 'One' }], edges: [] }, { primitiveShapes: true }, terminalObservation(output, 1)).status).toBe('unknown')
})
