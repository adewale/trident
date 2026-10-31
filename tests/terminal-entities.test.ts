import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { reviewedTerminalCases } from '../fidelity/terminal-corpus.ts'
import { analyseTerminalSource } from '../fidelity/terminal-source.ts'
import { assessTerminalDrawing } from '../fidelity/terminal-assessment.ts'
import { terminalErSourceAttribute } from '../fidelity/terminal-er.ts'
import provenance from './fixtures/terminal/entity-provenance.json'
const cases = reviewedTerminalCases(), fixture = (name: string) => readFileSync(new URL('./fixtures/terminal/' + name + '.txt', import.meta.url), 'utf8')
const assess = (name: string, output = fixture(name)) => assessTerminalDrawing(cases.find(item => item.id === provenance.find(row => row.file === name + '.txt')!.caseId)!, output)
test('entity/state controls retain exact source, output, artifact and collection identities', () => {
  for (const row of provenance) { expect(createHash('sha256').update(fixture(row.file.slice(0, -4))).digest('hex')).toBe(row.sha256); expect(cases.some(input => input.id === row.caseId)).toBe(true); expect(row.originalStartedAt < row.originalFinishedAt).toBe(true) }
})
test('documented attribute stars preserve primary-key semantics; all three public output layouts preserve the isolated ER table', () => {
  expect(terminalErSourceAttribute('string *title')).toEqual({ type: 'string', name: 'title', keys: ['PK'] })
  expect(terminalErSourceAttribute('string cafe\u0301')).toEqual({ type: 'string', name: 'café', keys: [] })
  expect(terminalErSourceAttribute('string id PK, FK')).toEqual({ type: 'string', name: 'id', keys: ['FK', 'PK'] })
  for (const name of ['er-cli-literal-stars', 'er-python-literal-stars', 'er-module-literal-stars']) {
    expect(assess(name).status).toBe('correct')
    expect(assess(name, fixture(name).replace('*title', '*other')).status).toBe('incorrect')
    expect(assess(name, fixture(name).replace('string', 'number')).status).toBe('incorrect')
    expect(assess(name, fixture(name) + '\nUNOWNED').status).not.toBe('correct')
    const rows = fixture(name).split('\n'), first = rows.findIndex(row => row.includes('*title')), second = rows.findIndex(row => row.includes('*the_Primary_Key'))
    ;[rows[first], rows[second]] = [rows[second]!, rows[first]!]
    expect(assess(name, rows.join('\n')).status).toBe('correct')
  }
  expect(assess('er-module-literal-stars', fixture('er-module-literal-stars') + '\n┌──────┐\n│ Note │\n└──────┘').status).toBe('unknown')
})
test('column and prefix keys retain field roles; missing or changed keys cannot receive body credit', () => {
  for (const name of ['er-cli-key-columns', 'er-module-key-prefix']) {
    const original = assess(name), changed = assess(name, fixture(name).replace('PK', 'FK'))
    expect('checks' in original && original.checks?.find(check => check.criterion === 'entity-bodies')?.status).toBe('passed')
    expect('checks' in changed && changed.checks?.find(check => check.criterion === 'entity-bodies')?.status).toBe('failed')
    expect(assess(name).status).toBe('unknown') // No relation/cardinality observer is implied by correct body data.
  }
})
test('ambiguous unlabelled inline key placement stays unknown instead of borrowing source field roles', () => {
  const source = 'erDiagram\nT {\nFK PK UK\n}', analysis = analyseTerminalSource(source, 'er'), output = '┌──────────┐\n│ T        │\n├──────────┤\n│ FK PK UK │\n└──────────┘'
  const verdict = assessTerminalDrawing({ ...cases[0]!, id: 'synthetic:source-control', source, sourceSha256: createHash('sha256').update(source).digest('hex'), family: 'er', expected: { status: 'independently-reviewed', contract: analysis.contract } }, output)
  expect(verdict.status).toBe('unknown')
})
test('ordinary state cycles need exact states and real directed transitions; global direction remains advisory', () => {
  for (const name of ['state-python-cycle', 'state-module-cycle']) {
    const verdict = assess(name)
    expect(verdict.status).toBe('correct')
    expect('advisories' in verdict && verdict.advisories?.some(item => item.criterion === 'direction' && item.status === 'unknown')).toBe(true)
    expect(assess(name, fixture(name).replace('State2', 'Other2')).status).not.toBe('correct')
    expect(assess(name, fixture(name).replace('▼', '▲')).status).not.toBe('correct')
    expect(assess(name, fixture(name) + '\nState2').status).not.toBe('correct')
  }
})

test('numeric cardinalities, relationship identity and complete captions belong to their actual straight links', () => {
  for (const name of ['er-python-cardinalities', 'er-python-identifying', 'er-python-keys-relations']) expect(assess(name).status).toBe('correct')
  const name = 'er-python-cardinalities', text = fixture(name)
  expect(assess(name, text.replace('0..*', '1..*')).status).toBe('incorrect')
  expect(assess(name, text.replace('places', 'sends!')).status).toBe('incorrect')
  expect(assess(name, text.replace('│ places', '┆ places').replaceAll('│1', '┆1')).status).not.toBe('correct')
  expect(assess(name, text.replace('│ places', '  places')).status).not.toBe('correct')
  expect(assess(name, text.replace('│ places', '│                 places')).status).not.toBe('correct')
  expect(assess(name, text + '\n1..* UNOWNED').status).toBe('unknown')
  expect(assess('er-python-literal-break-caption').status).toBe('incorrect')
  const book = 'er-python-literal-stars', body = fixture(book)
  expect(assess(book, body.replace('*title', ' title')).status).toBe('incorrect')
  expect(assess(book, '\x1b[1m' + body.replace('*title', ' title')).status).toBe('unknown')
})

test('pseudostates require observed initial and final marker roles and connected owned routes', () => {
  for (const name of ['state-python-initial', 'state-python-cjk']) {
    expect(assess(name).status).toBe('correct')
    expect(assess(name, fixture(name).replace('●', '◉')).status).not.toBe('correct')
    expect(assess(name, fixture(name).replace('●', ' ')).status).not.toBe('correct')
    expect(assess(name, fixture(name).replace('▼', '▲')).status).not.toBe('correct')
  }
  const source = 'stateDiagram-v2\n[*] --> A\nA --> [*]', contract = analyseTerminalSource(source, 'state').contract
  const output = '╭─◯─╮\n│ ● │\n╰─◯─╯\n  │\n  ▼\n╭───╮\n│ A │\n╰─┬─╯\n  │\n  ▼\n╭─◯─╮\n│ ◉ │\n╰─◯─╯'
  const input = { ...cases[0]!, id: 'synthetic:state-pseudostates', source, sourceSha256: createHash('sha256').update(source).digest('hex'), family: 'state', expected: { status: 'independently-reviewed', contract } }
  expect(assessTerminalDrawing(input, output).status).toBe('correct')
  expect(assessTerminalDrawing(input, output.replace('◉', '●')).status).not.toBe('correct')
  expect(assessTerminalDrawing(input, output.replace('A', 'B')).status).not.toBe('correct')
})
