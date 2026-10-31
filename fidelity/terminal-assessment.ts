import { readFileSync } from 'node:fs'
import { defineCaseEvidenceContract, constructEvidenceVerdict, evidenceBytesDigest, evidenceDigest } from '../portable/evidence-contract.ts'
import { inspectTerminalFacts } from './terminal-facts.ts'
import { inspectTerminalMeaning } from './terminal.ts'
import type { TerminalProjectCase } from './terminal-corpus.ts'
const observerSha256 = evidenceDigest(Object.fromEntries(['terminal-assessment.ts', 'terminal-display.ts', 'terminal-facts.ts', 'terminal-sequence.ts', 'terminal-kanban.ts', 'terminal-rectangles.ts', 'terminal.ts', '../portable/evidence-contract.ts', '../portable/project-records.ts'].map(file => [file, evidenceBytesDigest(readFileSync(new URL(file, import.meta.url)))])))
/** Never infer whole-drawing correctness from text admission, source tags,
 * source-reference agreement or an absent observer for a different family. */
export function assessTerminalDrawing(input: TerminalProjectCase, output?: string | Uint8Array) {
  if (evidenceBytesDigest(input.source) !== input.sourceSha256 || input.expected.contract && input.expected.contract.family !== input.family) throw Error('Terminal source identity or family is stale')
  let terminal: string | undefined, decodingError: string | undefined
  if (typeof output === 'string' || output === undefined) terminal = output
  else { try { terminal = new TextDecoder('utf-8', { fatal: true }).decode(output) } catch { decodingError = 'Retained terminal bytes are not valid UTF-8; replacement decoding cannot establish displayed labels' } }
  if (input.intent === 'invalid') return { status: 'unknown', reason: 'Reviewed invalid source belongs in a separate typed-rejection table; no drawing pass or grammar rejection is inferred from a command exit.' }
  if (input.expected.status !== 'independently-reviewed' || !input.expected.graph && !input.expected.contract) return { status: 'unknown', reason: 'No independently reviewed drawing expectation for this exact source.' }
  if (input.expected.unverifiedFacts?.length) return { status: 'unknown', reason: 'Required source facts lack an observer: ' + input.expected.unverifiedFacts.join('; ') }
  if (input.expected.contract) {
    const sourceContract = input.expected.contract
    const contract = defineCaseEvidenceContract({ caseId: input.id, source: input.source, expectations: sourceContract, requiredChecks: sourceContract.facts.filter(fact => fact.required !== false).map(fact => ({ surface: 'terminal:display-facts', criterion: fact.criterion })) })
    if (output === undefined) return { ...constructEvidenceVerdict(contract), reason: 'No retained terminal output; inspect transport/setup evidence separately.', checks: [] }
    const checks = decodingError ? sourceContract.facts.filter(fact => fact.required !== false).map(fact => ({ criterion: fact.criterion, status: 'unknown' as const, detail: decodingError!, expected: fact.expected })) : inspectTerminalFacts(terminal!, sourceContract, input.expected.graph)
    if (sourceContract.sourceUncertainties.length) for (const check of checks) if (check.status === 'passed') { check.status = 'unknown'; check.detail = 'Source obligations are not completely reviewed: ' + sourceContract.sourceUncertainties.join('; ') }
    const verdict = constructEvidenceVerdict(contract, { schema: 'trident-checked-evidence-v1', caseId: input.id, sourceSha256: contract.sourceSha256, expectationsSha256: contract.expectationsSha256, outputSha256: evidenceBytesDigest(output), observerSha256, checks: checks.map(({ criterion, status, detail }) => ({ surface: 'terminal:display-facts', criterion, status, detail })) })
    return { ...verdict, reason: verdict.status === 'incorrect' ? 'Declared source facts failed: ' + checks.filter(check => check.status === 'failed').map(check => check.criterion).join(', ') : verdict.status === 'unknown' ? 'Required source facts lack qualified evidence: ' + checks.filter(check => check.status === 'unknown').map(check => check.criterion).join(', ') : 'Every independently declared source obligation has qualified output evidence', checks }
  }
  if (input.family !== 'flowchart') return { status: 'unknown', reason: 'No reviewed terminal drawing observer for ' + input.family }
  if (output === undefined) return { status: 'unknown', reason: 'No retained terminal output; inspect transport/setup evidence separately.' }
  if (decodingError) return { status: 'unknown', reason: decodingError }
  return inspectTerminalMeaning(terminal!, input.expected.graph!)
}
export interface TerminalTypedSourceOutcome {
  project: string
  caseId: string
  sourceSha256: string
  kind: 'syntax-rejection' | 'unknown-family' | 'accepted' | 'unavailable'
  publicBoundary: string
  detail: string
  observerSha256: string
}
/** Public typed rejection is distinct from process exit, transport failure and
 * drawing correctness. A caller without the reviewed classification stays unknown. */
export function assessTerminalSourceRejection(input: TerminalProjectCase, outcome?: TerminalTypedSourceOutcome, expectedProject?: string) {
  if (evidenceBytesDigest(input.source) !== input.sourceSha256) throw Error('Terminal source identity is stale')
  if (input.intent !== 'invalid') throw Error('Typed rejection control requires independently invalid source')
  const contract = defineCaseEvidenceContract({ caseId: input.id, source: input.source, expectations: { expected: 'typed-source-rejection', sourceContract: input.expected.contract ?? input.expected.reason }, requiredChecks: [{ surface: 'terminal:public-rejection', criterion: 'typed-source-rejection' }] })
  if (!outcome) return { ...constructEvidenceVerdict(contract), reason: 'No reviewed typed public rejection; CLI exit and missing output supply no grammar credit' }
  if (!expectedProject || outcome.project !== expectedProject || outcome.caseId !== input.id || outcome.sourceSha256 !== input.sourceSha256 || !outcome.publicBoundary.trim() || !outcome.detail.trim()) throw Error('Typed terminal rejection is stale or lacks its public boundary')
  const unknownFamilyExpected = input.family === 'invalid'
  const status = outcome.kind === 'accepted' ? 'failed' : outcome.kind === 'syntax-rejection' || outcome.kind === 'unknown-family' && unknownFamilyExpected ? 'passed' : 'unknown'
  return { ...constructEvidenceVerdict(contract, { schema: 'trident-checked-evidence-v1', caseId: input.id, sourceSha256: contract.sourceSha256, expectationsSha256: contract.expectationsSha256, outputSha256: evidenceDigest(outcome), observerSha256: outcome.observerSha256, checks: [{ surface: 'terminal:public-rejection', criterion: 'typed-source-rejection', status, detail: outcome.detail }] }), reason: outcome.detail }
}
