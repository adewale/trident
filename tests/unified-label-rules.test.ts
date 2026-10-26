import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { qualifyOutput } from '../unified/qualification.ts'
import type { UnifiedWorkload } from '../unified/types.ts'

// Retained failing outputs from the published campaign: the tool drew the label, the check missed it.
const fixtures = join(import.meta.dir, 'fixtures/label-rules')
const cases: { project: string; rule: string; file: string; workload: UnifiedWorkload; missingBefore: string[] }[] = JSON.parse(readFileSync(join(fixtures, 'cases.json'), 'utf8'))
const workload = (labels: string[], source = 'flowchart LR\n %% authored label-rule counterexample\n A[Fixture]'): UnifiedWorkload => ({ id: 'authored-label-rules', family: 'flowchart', source, features: [], provenance: 'independently authored label-rule counterexamples', expectedLabels: labels })
const svg = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200">${body}</svg>`
const accepts = (labels: string[], body: string) => qualifyOutput(workload(labels), svg(body), 'svg').ok

for (const entry of cases)
  test(`retained ${entry.project} output passes once ${entry.rule} labels are read as drawn: ${entry.workload.id}`, () => {
    expect(entry.missingBefore.length).toBeGreaterThan(0)
    expect(qualifyOutput(entry.workload, readFileSync(join(fixtures, entry.file), 'utf8'), 'svg')).toEqual({ ok: true, findings: [], scope: 'format-and-authored-labels' })
  })

test('markdown strong and emphasis markers are optional, never the words they wrap', () => {
  const label = 'The cat in **the** hat'
  expect(accepts([label], '<text>The cat in the hat</text>')).toBe(true)
  expect(accepts([label], '<text>The cat in **the** hat</text>')).toBe(true)
  expect(accepts([label], '<text>The cat in hat</text>')).toBe(false)
  expect(accepts(['*italicized text* **bold text**'], '<text>italicized text bold text</text>')).toBe(true)
  expect(accepts(['__test_req__'], '<text>test_req</text>')).toBe(true)
  expect(accepts(['__test_req__'], '<text>test</text>')).toBe(false)
  expect(accepts(['***both***'], '<text>both</text>')).toBe(true)
})

test('marker syntax that markdown leaves alone is still required literally', () => {
  expect(accepts(['snake_case_name'], '<text>snakecasename</text>')).toBe(false)
  expect(accepts(['a * b * c'], '<text>a b c</text>')).toBe(false)
  expect(accepts(['Class 2 !@#$%^&*() label'], '<text>Class 2 !@#$%^&amp;() label</text>')).toBe(false)
  expect(accepts(['`code` span'], '<text>code span</text>')).toBe(false)
})

test('terminal output reads markdown labels the same way', () => {
  const terminal = (output: string) => qualifyOutput(workload(['The cat in **the** hat']), output, 'terminal').ok
  expect(terminal('┌────────────────────┐\n│ The cat in the hat │\n└────────────────────┘')).toBe(true)
  expect(terminal('┌────────────────────────┐\n│ The cat in **the** hat │\n└────────────────────────┘')).toBe(true)
  expect(terminal('┌────────────────┐\n│ The cat in hat │\n└────────────────┘')).toBe(false)
})

test('stacked <text> rows of one wrapped label join in reading order', () => {
  const label = 'Hello Bob, how are you today?'
  expect(accepts([label], '<text x="10" y="10" class="m">Hello Bob, how</text><text x="10" y="28" class="m">are you today?</text>')).toBe(true)
  expect(accepts([label], '<g><text x="10" y="40" class="m"><tspan x="10" dy="-8">Hello Bob, how</tspan></text><text x="10" y="40" class="m"><tspan x="10" dy="8">are you today?</tspan></text></g>')).toBe(true)
  expect(accepts([label], '<text x="10" y="10" style="font-size: 16px">Hello Bob, how</text>\n  <text x="10" y="28" style="font-size: 16px">are you today?</text>')).toBe(true)
  expect(accepts([label], '<text x="100" y="10"><tspan x="10">Hello Bob, how</tspan></text><text x="200" y="28"><tspan x="10">are you today?</tspan></text>')).toBe(true)
})

test('rows that are not one wrapped label stay separate', () => {
  const label = 'Read Write'
  expect(accepts([label], '<text>Read</text><text>Write</text>')).toBe(false)
  expect(accepts([label], '<text x="10" y="28">Write</text><text x="10" y="10">Read</text>')).toBe(false)
  expect(accepts([label], '<text x="10" y="10">Write</text><text x="10" y="28">Read</text>')).toBe(false)
  expect(accepts([label], '<text x="10" y="10">Read</text><text x="60" y="28">Write</text>')).toBe(false)
  expect(accepts([label], '<text x="10" y="10">Read</text><line x1="0" y1="20" x2="100" y2="20"/><text x="10" y="28">Write</text>')).toBe(false)
  expect(accepts([label], '<text x="10" y="10" class="title">Read</text><text x="10" y="28" class="member">Write</text>')).toBe(false)
  expect(accepts([label], '<text x="10" y="10" transform="translate(0 0)">Read</text><text x="10" y="28" transform="translate(200 0)">Write</text>')).toBe(false)
  expect(accepts([label], '<text x="10" y="10" dx="0">Read</text><text x="10" y="28" dx="200">Write</text>')).toBe(false)
  expect(accepts([label], '<text x="10" y="10" dy="100">Read</text><text x="10" y="28">Write</text>')).toBe(false)
  expect(accepts([label], '<text x="10" y="10"><tspan x="100">Read</tspan></text><text x="10" y="28"><tspan x="200">Write</tspan></text>')).toBe(false)
  expect(accepts([label], '<text x="10" y="10"><tspan dx="100">Read</tspan></text><text x="10" y="28"><tspan dx="200">Write</tspan></text>')).toBe(false)
  expect(accepts([label], '<text x="10" y="10" font-size="13">Read</text><text x="10" y="40" font-size="13">Write</text>')).toBe(false)
  expect(accepts([label], '<g><text x="10" y="10">Read</text></g><g><text x="10" y="28">Write</text></g>')).toBe(false)
  expect(accepts(['Hello Bob, how are you today?'], '<text x="10" y="10">Hello Bob, how</text><text x="10" y="28">are you</text>')).toBe(false)
})

test('a source echo stacked as rows is still not a diagram', () => {
  const source = 'flowchart LR\n A[Start] --> B[End]'
  const result = qualifyOutput(workload(['Start', 'End'], source), svg('<text x="0" y="10">flowchart LR</text><text x="0" y="26">A[Start] --&gt; B[End]</text>'), 'svg')
  expect(result.ok).toBe(false)
  expect(result.findings.some(finding => /source/i.test(finding))).toBe(true)
})
