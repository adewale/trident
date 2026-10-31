import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { reviewedTerminalCases } from '../fidelity/terminal-corpus.ts'
import { analyseTerminalSource } from '../fidelity/terminal-source.ts'
import { assessTerminalDrawing } from '../fidelity/terminal-assessment.ts'
import provenance from './fixtures/terminal/group-provenance.json'
const cases = reviewedTerminalCases(), fixture = (name: string) => readFileSync(new URL('./fixtures/terminal/' + name + '.txt', import.meta.url), 'utf8')
const assess = (name: string, output = fixture(name)) => assessTerminalDrawing(cases.find(input => input.id === provenance.find(row => row.file === name + '.txt')!.caseId)!, output)
function sourceControl(source: string, output: string) { const expected = analyseTerminalSource(source, 'flowchart'); return assessTerminalDrawing({ id: 'synthetic:group-ownership', source, sourceSha256: createHash('sha256').update(source).digest('hex'), family: 'flowchart', intent: 'valid', features: [], origins: [], expected: { status: 'independently-reviewed', contract: expected.contract, graph: expected.graph } }, output) }
function nestedFrame(withEdge: boolean) {
  const grid = Array.from({ length: 13 }, () => Array(17).fill(' '))
  const box = (left: number, top: number, right: number, bottom: number, text: string) => { for (let x = left + 1; x < right; x++) grid[top]![x] = grid[bottom]![x] = '─'; for (let y = top + 1; y < bottom; y++) grid[y]![left] = grid[y]![right] = '│'; grid[top]![left] = '┌'; grid[top]![right] = '┐'; grid[bottom]![left] = '└'; grid[bottom]![right] = '┘'; [...text].forEach((glyph, n) => grid[top + 1]![left + 2 + n] = glyph) }
  box(0, 0, 16, 12, 'Outer'); box(2, 3, 12, 10, 'Inner'); box(4, 6, 10, 8, 'x')
  if (withEdge) { grid[5]![13] = '◀'; grid[5]![14] = grid[5]![15] = '─'; grid[5]![16] = '┤' }
  return grid.map(row => row.join('')).join('\n')
}
test('group controls preserve literal retained bytes, source and artifact identity', () => {
  for (const row of provenance) { expect(createHash('sha256').update(fixture(row.file.slice(0, -4))).digest('hex')).toBe(row.sha256); expect(cases.some(input => input.id === row.caseId)).toBe(true); expect(row.originalStartedAt < row.originalFinishedAt).toBe(true) }
})
test('real module, CLI and Python group contours establish containment and pass-through routes', () => {
  for (const name of ['group-python-passthrough', 'group-module-passthrough', 'group-cli-two-scopes', 'group-python-two-scopes', 'group-module-source-port']) expect({ name, status: assess(name).status }).toEqual({ name, status: 'correct' })
  expect(assess('group-cli-quoted-label').status).toBe('incorrect')
})
test('group labels and direct membership cannot be replaced by text presence', () => {
  const name = 'group-module-passthrough', output = fixture(name)
  expect(assess(name, output.replace('Backend', 'Changed')).status).toBe('incorrect')
  expect(assess(name, output + '\nExtra member').status).not.toBe('correct')
  const wrongMembership = 'graph LR\nsubgraph Backend\nAPI\nend\nAPI-->DB\nClient-->API'
  expect(sourceControl(wrongMembership, output).status).toBe('incorrect')
})
test('a source group is an actual route endpoint, while a crossed wall cannot supply source identity', () => {
  const changedSource = 'graph LR\nsubgraph Backend\nAPI-->DB\nend\nClient\nBackend-->API'
  expect(sourceControl(changedSource, fixture('group-module-passthrough')).status).toBe('incorrect')
  expect(assess('group-module-source-port', fixture('group-module-source-port').replace('◄', '►')).status).not.toBe('correct')
})
test('nested parentage is independent of routes; group-to-group edges retain real boundary ownership', () => {
  const source = 'flowchart TD\nsubgraph Outer\nsubgraph Inner\nx\nend\nend'
  expect(sourceControl(source, nestedFrame(false)).status).toBe('correct')
  expect(sourceControl(source + '\nOuter-->Inner', nestedFrame(true)).status).toBe('correct')
  expect(sourceControl('flowchart TD\nsubgraph Outer\nsubgraph Inner\nend\nx\nend', nestedFrame(false)).status).toBe('incorrect')
  expect(sourceControl(source + '\nInner-->Outer', nestedFrame(true)).status).toBe('incorrect')
})
test('overlapping non-nested group frames cannot assign their shared member by expected ownership or area ties', () => {
  const grid = Array.from({ length: 11 }, () => Array(21).fill(' '))
  const box = (left: number, top: number, right: number, bottom: number) => { for (let x = left + 1; x < right; x++) grid[top]![x] = grid[bottom]![x] = '─'; for (let y = top + 1; y < bottom; y++) grid[y]![left] = grid[y]![right] = '│'; grid[top]![left] = '┌'; grid[top]![right] = '┐'; grid[bottom]![left] = '└'; grid[bottom]![right] = '┘' }
  box(0, 0, 12, 8); box(8, 2, 20, 10); box(9, 5, 11, 7); box(15, 6, 18, 8)
  grid[1]![2] = 'A'; grid[3]![14] = 'B'; grid[6]![10] = 'a'; grid[7]![16] = 'b'; grid[2]![12] = grid[8]![8] = '┼'
  const verdict = sourceControl('flowchart\nsubgraph A\na\nend\nsubgraph B\nb\nend', grid.map(row => row.join('')).join('\n'))
  expect(verdict.status).toBe('unknown')
  expect('checks' in verdict && verdict.checks?.find(check => check.criterion === 'groups')?.detail).toContain('Overlapping non-nested')
})
