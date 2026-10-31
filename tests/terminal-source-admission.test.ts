import { expect, test } from 'bun:test'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { evidenceBytesDigest } from '../portable/evidence-contract.ts'
import { readTerminalCorpus, readTerminalSourceAudit, reviewedTerminalCases, terminalSourceAuditStatus } from '../fidelity/terminal-corpus.ts'
import { useTempDirs } from './helpers/temp-dir.ts'

const temporary = useTempDirs('terminal-source-admission-')
const reviewFile = new URL('../corpus/terminal-project-reviews.json', import.meta.url)
const reviews = () => JSON.parse(readFileSync(reviewFile, 'utf8'))
const candidate = () => reviewedTerminalCases().find(input => input.id === 'terminal:2431a54dd231055c')!
const saveReviews = (value: unknown) => { const file = join(temporary.dir(), 'reviews.json'); writeFileSync(file, JSON.stringify(value)); return file }

test('canonical source admission preserves all inputs when a full read is missing', () => {
  const audit = readTerminalSourceAudit(), input = candidate()
  expect(terminalSourceAuditStatus(input).admitted).toBe(true)
  const cases = reviewedTerminalCases(readTerminalCorpus(), undefined, { ...audit, cases: [] })
  expect(cases).toHaveLength(120)
  expect(cases.every(item => item.expected.status === 'unreviewed')).toBe(true)
  expect(cases.every(item => item.expected.contract?.facts.length)).toBe(true)
})

test('a generator review string cannot admit changed values, removed checks or downgraded requirements', () => {
  const input = candidate()
  for (const change of ['value', 'remove', 'downgrade']) {
    const changed = reviews(), review = changed.find((item: any) => item.caseId === input.id)
    review.review = 'Independently reviewed and approved; all expectations are correct.'
    if (change === 'value') review.contract.facts.find((fact: any) => fact.criterion === 'nodes').expected[0].label = 'Invented label'
    if (change === 'remove') review.contract.facts = review.contract.facts.filter((fact: any) => fact.criterion !== 'layout-order')
    if (change === 'downgrade') review.contract.facts.find((fact: any) => fact.criterion === 'relationships').required = false
    const cases = reviewedTerminalCases(readTerminalCorpus(), saveReviews(changed)), result = cases.find(item => item.id === input.id)!
    expect(cases).toHaveLength(120)
    expect(result.expected.status).toBe('unreviewed')
    expect(terminalSourceAuditStatus(result).admitted).toBe(false)
  }
})

test('changed source, family and intent cannot inherit an existing source review', () => {
  const input = candidate(), source = input.source + '\nB --> C'
  expect(terminalSourceAuditStatus({ ...input, sourceSha256: evidenceBytesDigest(source) }).admitted).toBe(false)
  expect(terminalSourceAuditStatus({ ...input, family: 'sequence' }).admitted).toBe(false)
  expect(terminalSourceAuditStatus({ ...input, intent: 'invalid' }).admitted).toBe(false)
  const corpus = structuredClone(readTerminalCorpus()), changed = reviews(), at = corpus.cases.findIndex(item => item.id === input.id), review = changed.find((item: any) => item.caseId === input.id)
  corpus.cases[at] = { ...input, id: 'terminal:' + evidenceBytesDigest(source).slice(0, 16), source, sourceSha256: evidenceBytesDigest(source) }
  review.caseId = corpus.cases[at]!.id; review.sourceSha256 = corpus.cases[at]!.sourceSha256
  const result = reviewedTerminalCases(corpus, saveReviews(changed))
  expect(result).toHaveLength(120)
  expect(result[at]!.expected.status).toBe('unreviewed')
})

test('review wording, scope prose and provenance annotations do not invalidate unchanged semantics', () => {
  const input = candidate(), changed = reviews(), review = changed.find((item: any) => item.caseId === input.id)
  review.review = 'A shorter explanation of the same completed review.'
  for (const fact of review.contract.facts) fact.scope = 'Clarified prose for the same obligation.'
  const corpus = structuredClone(readTerminalCorpus())
  corpus.cases.find(item => item.id === input.id)!.origins[0]!.annotation = 'An editorial provenance note.'
  const result = reviewedTerminalCases(corpus, saveReviews(changed)).find(item => item.id === input.id)!
  expect(result.expected.status).toBe('independently-reviewed')
  expect(terminalSourceAuditStatus(result).admitted).toBe(true)
})

test('a second observer graph cannot replace the reviewed contract meaning', () => {
  const input = candidate(), forged = structuredClone(input)
  forged.expected.graph!.edges = []
  expect(terminalSourceAuditStatus(forged).admitted).toBe(false)
  const changed = reviews(), review = changed.find((item: any) => item.caseId === input.id)
  review.graph = forged.expected.graph
  const result = reviewedTerminalCases(readTerminalCorpus(), saveReviews(changed)).find(item => item.id === input.id)!
  expect(result.expected.graph!.edges).toHaveLength(1)
  expect(terminalSourceAuditStatus(result).admitted).toBe(true)
})

test('duplicate receipts and unresolved expectation findings cannot confer source admission', () => {
  const audit = readTerminalSourceAudit(), input = candidate(), row = audit.cases.find(item => item.caseId === input.id)!
  const duplicate = join(temporary.dir(), 'duplicate.json')
  writeFileSync(duplicate, JSON.stringify({ ...audit, cases: [...audit.cases, row] }))
  expect(() => readTerminalSourceAudit(duplicate)).toThrow('duplicate')
  const unresolved = { ...audit, cases: audit.cases.map(item => item.caseId === input.id ? { ...item, findingIds: ['new-finding'] } : item), findings: [...audit.findings, { id: 'new-finding', status: 'pending' }] }
  expect(terminalSourceAuditStatus(input, unresolved).admitted).toBe(false)
})
