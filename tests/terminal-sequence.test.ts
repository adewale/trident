import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { reviewedTerminalCases } from '../fidelity/terminal-corpus.ts'
import { analyseTerminalSource } from '../fidelity/terminal-source.ts'
import { assessTerminalDrawing } from '../fidelity/terminal-assessment.ts'
import provenance from './fixtures/terminal/sequence-provenance.json'
const cases = reviewedTerminalCases(), fixture = (name: string) => readFileSync(new URL('./fixtures/terminal/' + name + '.txt', import.meta.url), 'utf8')
const assess = (name: string, text = fixture(name)) => assessTerminalDrawing(cases.find(input => input.id === provenance.find(row => row.file === name + '.txt')!.caseId)!, text)

test('retained public sequence controls retain original bytes, artifacts, source identities and measurement clocks', () => {
  for (const row of provenance) {
    expect(createHash('sha256').update(fixture(row.file.slice(0, -4))).digest('hex')).toBe(row.sha256)
    expect(cases.find(input => input.id === row.caseId)?.family).toBe('sequence')
    expect(row.originalStartedAt < row.originalFinishedAt).toBe(true)
  }
})
test('independent source obligations retain fragment spans and note chronology', () => {
  const input = cases.find(input => input.id === 'terminal:d3cc8b77d097ec56')!
  expect(input.expected.contract?.facts.find(fact => fact.criterion === 'fragments')?.expected).toEqual([{ kind: 'alt', label: 'Success', beforeMessage: 1, nesting: [], afterMessage: 3 }, { kind: 'else', label: 'Failure', beforeMessage: 2, parent: 0, afterMessage: 3 }])
  const bad = analyseTerminalSource('sequenceDiagram\nA->>B: hi\nelse wrong\nend', 'sequence')
  expect(bad.contract.sourceUncertainties.length).toBeGreaterThan(0)
})
test('participant boxes, lifelines and owned routes qualify across CLI, module and Python sequence layouts', () => {
  for (const name of ['sequence-ascii-simple', 'sequence-module-simple', 'sequence-python-simple', 'sequence-ascii-alt', 'sequence-module-alt', 'sequence-python-alt', 'sequence-three-actors', 'sequence-python-notes']) expect({ name, status: assess(name).status }).toEqual({ name, status: 'correct' })
  expect(assess('sequence-solid-return').status).toBe('incorrect')
})
test('matching participant and message words cannot hide wrong direction, broken stems or wrong stroke', () => {
  for (const name of ['sequence-ascii-simple', 'sequence-module-simple', 'sequence-python-simple']) {
    const original = fixture(name)
    expect(assess(name, original.replace(/[►▶]/, '◀')).status).not.toBe('correct')
    const route = original.split('\n').findIndex(line => /[►▶]/.test(line))
    expect(assess(name, original.split('\n').map((line, n) => n === route ? line.replace('──', '─ ') : line).join('\n')).status).not.toBe('correct')
    expect(assess(name, original.split('\n').map((line, n) => n === route ? line.replaceAll('─', '┄') : line).join('\n')).status).toBe('incorrect')
    expect(assess(name, original.replace(/x(?=\s*[│┆])/, 'wrong')).status).not.toBe('correct')
    expect(assess(name, original + '\nEXTRA').status).toBe('unknown')
  }
})
test('missing or duplicated messages, swapped order and detached captions receive no correctness credit', () => {
  const name = 'sequence-ascii-alt', lines = fixture(name).split('\n'), arrow = lines.findIndex(line => /►/.test(line)), last = lines.findIndex(line => line.includes('500 Error'))
  expect(assess(name, lines.filter((_line, n) => n !== arrow).join('\n')).status).not.toBe('correct')
  expect(assess(name, [...lines.slice(0, arrow), ...lines.slice(arrow - 1, arrow + 1), ...lines.slice(arrow)].join('\n')).status).not.toBe('correct')
  const swapped = fixture(name).replace('200 OK', 'TEMP').replace('500 Error', '200 OK').replace('TEMP', '500 Error')
  expect(assess(name, swapped).status).toBe('incorrect')
  expect(assess(name, lines.map((line, n) => n === last ? line.replace('500 Error', '         ') + ' '.repeat(100) + '500 Error' : line).join('\n')).status).not.toBe('correct')
})
test('fragment labels, branch boundaries and enclosure own the exact messages', () => {
  for (const name of ['sequence-ascii-alt', 'sequence-module-alt', 'sequence-python-alt']) {
    const text = fixture(name)
    expect(assess(name, text.replace('Success', 'Wrong')).status).not.toBe('correct')
    expect(assess(name, text.replace('Failure', 'Wrong')).status).not.toBe('correct')
    const lines = text.split('\n'), branch = lines.findIndex(line => line.includes('Failure')), second = lines.findIndex(line => line.includes('200 OK'))
    const [separator] = lines.splice(branch, 1); lines.splice(second, 0, separator!)
    expect(assess(name, lines.join('\n')).status).not.toBe('correct')
  }
})
test('notes require their actual actor span, authored lines, text and chronological owner', () => {
  const name = 'sequence-python-notes', text = fixture(name)
  expect(assess(name, text.replace('Line 2', 'Wrong!')).status).toBe('incorrect')
  expect(assess(name, text.replace('│ Line 2 │', '│        │')).status).not.toBe('correct')
  const lines = text.split('\n'), start = lines.findIndex(line => line.includes('┌──────────────────┐'))
  expect(start).toBeGreaterThan(0)
  expect(assess(name, lines.map((line, n) => n >= start && n < start + 4 ? ' '.repeat(40) + line : line).join('\n')).status).not.toBe('correct')
})
test('over-notes cannot include extra actors and side notes cannot borrow a more distant actor', () => {
  const base = cases.find(input => input.id === 'terminal:df5eb5c9968bbb86')!, text = fixture('sequence-three-actors').trimEnd()
  const note = (left: number, right: number) => [0, 1, 2].map(row => {
    const cells = Array(45).fill(' ')
    for (const x of [5, 21, 37]) cells[x] = '│'
    cells[left] = row === 0 ? '┌' : row === 2 ? '└' : '│'; cells[right] = row === 0 ? '┐' : row === 2 ? '┘' : '│'
    for (let x = left + 1; x < right; x++) cells[x] = row === 1 ? ' ' : '─'
    if (row === 1) [...'Shared'].forEach((glyph, n) => cells[left + 2 + n] = glyph)
    return cells.join('')
  }).join('\n')
  const score = (declaration: string, left: number, right: number) => {
    const source = base.source + '\n' + declaration, contract = analyseTerminalSource(source, 'sequence').contract
    return assessTerminalDrawing({ ...base, source, sourceSha256: createHash('sha256').update(source).digest('hex'), expected: { status: 'independently-reviewed', contract } }, text + '\n' + note(left, right)).status
  }
  expect(score('Note over Browser,Server: Shared', 3, 23)).toBe('correct')
  expect(score('Note over Browser,Server: Shared', 3, 39)).toBe('incorrect')
  expect(score('Note right of Browser: Shared', 8, 18)).toBe('correct')
  expect(score('Note right of Browser: Shared', 24, 34)).toBe('incorrect')
})
test('cleared, concealed, discontinuous and unknown display state cannot supply sequence facts', () => {
  const name = 'sequence-ascii-simple', text = fixture(name)
  expect(assess(name, text + '\x1b[2J').status).not.toBe('correct')
  expect(assess(name, '\x1b[8m' + text).status).not.toBe('correct')
  expect(assess(name, '\x1b[5m' + text).status).toBe('unknown')
  const rows = text.split('\n'), plainLifeline = rows.findIndex((row, n) => n > 2 && row.trim() === '│         │')
  expect(plainLifeline).toBeGreaterThan(2)
  expect(assess(name, rows.map((row, n) => n === plainLifeline ? row.replace('│', ' ') : row).join('\n')).status).not.toBe('correct')
})
test('open or ambiguous heads and nested frame profiles remain unknown rather than inventing style or enclosure evidence', () => {
  const base = cases.find(input => input.id === 'terminal:54f7237ee5ab1a85')!, output = fixture('sequence-ascii-simple')
  expect(assess('sequence-ascii-simple', output.replace('►', '>')).status).toBe('unknown')
  expect(assess('sequence-ascii-simple', output.replace('►', '→')).status).toBe('unknown')
  for (const source of ['sequenceDiagram\nA->B: x', 'sequenceDiagram\nalt outer\nopt inner\nA->>B: x\nend\nend']) {
    const contract = analyseTerminalSource(source, 'sequence').contract
    expect(assessTerminalDrawing({ ...base, source, sourceSha256: createHash('sha256').update(source).digest('hex'), expected: { status: 'independently-reviewed', contract } }, output).status).toBe('unknown')
  }
})
