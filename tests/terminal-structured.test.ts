import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { reviewedTerminalCases } from '../fidelity/terminal-corpus.ts'
import { analyseTerminalSource } from '../fidelity/terminal-source.ts'
import { assessTerminalDrawing } from '../fidelity/terminal-assessment.ts'
import provenance from './fixtures/terminal/structured-provenance.json'
const cases = reviewedTerminalCases(), fixture = (name: string) => readFileSync(new URL('./fixtures/terminal/' + name + '.txt', import.meta.url), 'utf8')
const input = (name: string) => cases.find(item => item.id === provenance.find(row => row.file === name + '.txt')!.caseId)!
const assess = (name: string, output = fixture(name)) => assessTerminalDrawing(input(name), output)
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
  expect(assessTerminalDrawing({ ...input(name), source, sourceSha256: createHash('sha256').update(source).digest('hex'), expected: { status: 'independently-reviewed', contract } }, text).status).toBe('incorrect')
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
