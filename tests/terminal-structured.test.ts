import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { reviewedTerminalCases } from '../fidelity/terminal-corpus.ts'
import { analyseTerminalSource } from '../fidelity/terminal-source.ts'
import { assessTerminalDrawing } from '../fidelity/terminal-assessment.ts'
import { inspectTerminalClass } from '../fidelity/terminal-class.ts'
import provenance from './fixtures/terminal/structured-provenance.json'
const cases = reviewedTerminalCases(), fixture = (name: string) => readFileSync(new URL('./fixtures/terminal/' + name + '.txt', import.meta.url), 'utf8')
const input = (name: string) => cases.find(item => item.id === provenance.find(row => row.file === name + '.txt')!.caseId)!
const assess = (name: string, output = fixture(name)) => assessTerminalDrawing(input(name), output)
test('class cardinalities outside the ownership radius stay unknown; absent or uniquely owned wrong values fail', () => {
  const contract = analyseTerminalSource('classDiagram\nclass Alpha\nclass Beta\nAlpha "1" --> "0..*" Beta', 'class').contract
  const drawing = (left: string, column = 10) => {
    const grid = Array.from({ length: 9 }, () => Array(52).fill(' ')), put = (x: number, y: number, text: string) => [...text].forEach((c, n) => grid[y]![x + n] = c)
    for (const [x, label] of [[0, 'Alpha'], [42, 'Beta']] as const) {
      put(x, 0, '┌───────┐'); put(x, 8, '└───────┘')
      for (let y = 1; y < 8; y++) { put(x, y, '│'); put(x + 8, y, '│') }
      put(x + 1, 1, label)
    }
    put(8, 4, '├' + '─'.repeat(32) + '►'); put(column, 3, left); put(37, 3, '0..*')
    return grid.map(row => row.join('')).join('\n')
  }
  const status = (text: string) => inspectTerminalClass(text, contract).find(c => c.criterion === 'class-relations')?.status
  expect(status(drawing('1'))).toBe('passed')
  expect(status(drawing('1', 11))).toBe('unknown')
  expect(status(drawing(''))).toBe('failed')
  expect(status(drawing('2'))).toBe('failed')
})
test('structured controls bind exact retained bytes, source cases, artifacts and original measurement clocks', () => {
  for (const row of provenance) { expect(createHash('sha256').update(fixture(row.file.slice(0, -4))).digest('hex')).toBe(row.sha256); expect(cases.some(item => item.id === row.caseId)).toBe(true); expect(row.originalStartedAt < row.originalFinishedAt).toBe(true) }
})
test('board column and nested-card geometry establish exact membership and card order', () => {
  const name = 'kanban-python-board', text = fixture(name)
  expect(assess(name).status).toBe('correct')
  expect(assess(name, text.replace('Spec', 'TEMP').replace('Test', 'Spec').replace('TEMP', 'Test')).status).toBe('incorrect')
  expect(assess(name, text.replace('Spec  ', 'TEMP  ').replace('Design│', 'Spec  │').replace('TEMP  ', 'Design')).status).not.toBe('correct')
  expect(assess(name, text.replace('In Progress', 'Different  ')).status).toBe('incorrect')
  expect(assess(name, text + '\nSpec Design Implement Test').status).toBe('unknown')
  expect(assess(name, 'To Do Spec Design In Progress Implement Done Test').status).toBe('unknown')
  const source = 'kanban\n  todo[To Do]\n    t2[Design]\n  doing[In Progress]\n    t3[Implement]\n  done[Done]\n    t4[Test]\n    t1[Spec]', contract = analyseTerminalSource(source, 'kanban').contract
  expect(assessTerminalDrawing({ ...input(name), id: 'synthetic:kanban-membership', source, sourceSha256: createHash('sha256').update(source).digest('hex'), expected: { status: 'independently-reviewed', contract } }, text).status).toBe('incorrect')
})
test('empty isolated class bodies need exact drawn containers and no members or relationships', () => {
  for (const name of ['class-python-empty', 'class-module-empty']) {
    expect(assess(name).status).toBe('correct')
    expect(assess(name, fixture(name).replace('Bar', 'Foo')).status).not.toBe('correct')
    expect(assess(name, fixture(name) + '\nunexpected()').status).toBe('unknown')
    expect(assess(name, 'class Foo class Bar').status).not.toBe('correct')
  }
  const source = 'classDiagram\nclass Foo {\n+required()\n}\nclass Bar', contract = analyseTerminalSource(source, 'class').contract, base = input('class-module-empty')
  expect(assessTerminalDrawing({ ...base, source, sourceSha256: createHash('sha256').update(source).digest('hex'), expected: { status: 'independently-reviewed', contract } }, fixture('class-module-empty')).status).toBe('unknown')
})
