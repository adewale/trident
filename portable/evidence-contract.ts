import { createHash } from 'node:crypto'
import { stableValue } from './project-records.ts'

/** These records bind evidence; they do not assert that an expectation or an
 * observer is scientifically valid. Qualification is a separate obligation. */
export interface EvidenceObligation { surface: string; criterion: string }
export interface CaseEvidenceContract {
  schema: 'trident-case-evidence-v1'
  caseId: string
  sourceSha256: string
  expectationsSha256: string
  requiredChecks: readonly EvidenceObligation[]
}
export interface EvidenceCheck extends EvidenceObligation {
  status: 'passed' | 'failed' | 'unknown'
  detail: string
}
export interface CheckedEvidence {
  schema: 'trident-checked-evidence-v1'
  caseId: string
  sourceSha256: string
  expectationsSha256: string
  outputSha256: string
  observerSha256: string
  checks: readonly EvidenceCheck[]
}
export interface EvidenceVerdict {
  schema: 'trident-evidence-verdict-v1'
  status: 'correct' | 'incorrect' | 'unknown'
  caseId: string
  sourceSha256: string
  expectationsSha256: string
  outputSha256: string | null
  observerSha256: string | null
  contractSha256: string
  evidenceSha256: string | null
  planned: number
  passed: number
  failed: number
  unknown: number
  missingChecks: readonly EvidenceObligation[]
}
export const evidenceDigest = (value: unknown) => createHash('sha256').update(stableValue(value)).digest('hex')
export const evidenceBytesDigest = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex')
const coordinate = (item: EvidenceObligation) => JSON.stringify([item.surface, item.criterion])
const text = (value: unknown) => typeof value === 'string' && value.trim().length > 0
const digest = (value: unknown) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
const fail = (message: string): never => { throw Error('Invalid evidence contract: ' + message) }
function obligations(value: unknown): asserts value is EvidenceObligation[] {
  if (!Array.isArray(value) || !value.length || value.some(item => !item || !text(item.surface) || !text(item.criterion)) || new Set(value.map(coordinate)).size !== value.length) fail('required checks must be unique, nonempty coordinates')
}
export function admitCaseEvidenceContract(value: unknown): Readonly<CaseEvidenceContract> {
  const item = value as CaseEvidenceContract
  if (!item || item.schema !== 'trident-case-evidence-v1' || !text(item.caseId) || !digest(item.sourceSha256) || !digest(item.expectationsSha256)) fail('case source/expectation identity is absent or invalid')
  obligations(item.requiredChecks)
  return Object.freeze({ ...item, requiredChecks: Object.freeze(item.requiredChecks.map(check => Object.freeze({ surface: check.surface, criterion: check.criterion }))) })
}
/** Build from the source and complete authored expectations, not renderer output. */
export function defineCaseEvidenceContract(input: { caseId: string; source: string; expectations: unknown; requiredChecks: readonly EvidenceObligation[] }) {
  if (typeof input.source !== 'string') fail('case source must be literal text')
  return admitCaseEvidenceContract({ schema: 'trident-case-evidence-v1', caseId: input.caseId, sourceSha256: evidenceBytesDigest(input.source), expectationsSha256: evidenceDigest(input.expectations), requiredChecks: input.requiredChecks })
}
export function admitCheckedEvidence(contract: CaseEvidenceContract, value: unknown): Readonly<CheckedEvidence> {
  contract = admitCaseEvidenceContract(contract)
  const item = value as CheckedEvidence
  if (!item || item.schema !== 'trident-checked-evidence-v1' || item.caseId !== contract.caseId || item.sourceSha256 !== contract.sourceSha256 || item.expectationsSha256 !== contract.expectationsSha256 || !digest(item.outputSha256) || !digest(item.observerSha256)) fail('checked evidence is stale or lacks output/observer identity')
  if (!Array.isArray(item.checks) || item.checks.some(check => !check || !text(check.surface) || !text(check.criterion) || !text(check.detail) || !['passed', 'failed', 'unknown'].includes(check.status)) || new Set(item.checks.map(coordinate)).size !== item.checks.length) fail('checked evidence has duplicate or invalid criteria')
  if (item.checks.some(check => !contract.requiredChecks.some(required => coordinate(required) === coordinate(check)))) fail('unplanned diagnostics cannot satisfy this case contract')
  return Object.freeze({ ...item, checks: Object.freeze(item.checks.map(check => Object.freeze({ ...check }))) })
}
export function constructEvidenceVerdict(contract: CaseEvidenceContract, value?: CheckedEvidence): Readonly<EvidenceVerdict> {
  contract = admitCaseEvidenceContract(contract)
  const evidence = value === undefined ? undefined : admitCheckedEvidence(contract, value)
  const checks = contract.requiredChecks.map(required => evidence?.checks.find(check => coordinate(check) === coordinate(required)))
  const passed = checks.filter(check => check?.status === 'passed').length, failed = checks.filter(check => check?.status === 'failed').length, unknown = checks.length - passed - failed
  return Object.freeze({ schema: 'trident-evidence-verdict-v1', status: failed ? 'incorrect' : passed === checks.length ? 'correct' : 'unknown', caseId: contract.caseId, sourceSha256: contract.sourceSha256, expectationsSha256: contract.expectationsSha256, outputSha256: evidence?.outputSha256 ?? null, observerSha256: evidence?.observerSha256 ?? null, contractSha256: evidenceDigest(contract), evidenceSha256: evidence ? evidenceDigest(evidence) : null, planned: checks.length, passed, failed, unknown, missingChecks: Object.freeze(contract.requiredChecks.filter((_required, index) => !checks[index]).map(item => Object.freeze({ ...item }))) })
}

export interface InvocationIdentity {
  /** Fixed sampling coordinate, when a journal spans multiple rounds. */
  coordinate?: string
  project: string
  caseId: string
  sourceSha256: string
  artifactSha256: string
  bindingSha256: string
  format: string
}
export interface InvocationEvidence {
  schema: 'trident-invocation-evidence-v1'
  attemptId: string
  identity: InvocationIdentity
  state: 'not-invoked' | 'started' | 'returned' | 'public-error' | 'interrupted'
  startedAt: string | null
  finishedAt: string | null
  /** Receipt time is separate from unknown public-call clocks during recovery. */
  recordedAt?: string
  /** Actual reported clock only; controller wall time is never substituted. */
  durationMs: number | null
  /** Controller-captured monotonic invocation envelope. Legacy or recovered
   * records without this context cannot qualify comparative timing. */
  measurement?: {
    planSha256: string; environmentSha256: string; boundary: string; track: string
    clockDomainId: string; executionInstanceId: string; sequence: number
    monotonicStartNs: string; monotonicFinishNs: string | null
  }
  output: { sha256: string; bytes: number; path: string } | null
  streams?: { stdout: { sha256: string; bytes: number; path: string }; stderr: { sha256: string; bytes: number; path: string } }
  detail: string
}
export function admitInvocationEvidence(value: unknown): Readonly<InvocationEvidence> {
  const item = value as InvocationEvidence
  if (!item || item.schema !== 'trident-invocation-evidence-v1' || !text(item.attemptId) || !item.identity || !text(item.identity.project) || !text(item.identity.caseId) || !text(item.identity.format) || !digest(item.identity.sourceSha256) || !digest(item.identity.artifactSha256) || !digest(item.identity.bindingSha256)) fail('invocation identity is missing')
  if (item.identity.coordinate !== undefined && !text(item.identity.coordinate)) fail('invocation sampling coordinate is invalid')
  if (!['not-invoked', 'started', 'returned', 'public-error', 'interrupted'].includes(item.state) || typeof item.detail !== 'string') fail('invocation state is invalid')
  const validTime = (value: unknown) => value === null || typeof value === 'string' && Number.isFinite(Date.parse(value))
  if (item.recordedAt !== undefined && !validTime(item.recordedAt)) fail('invocation receipt time is invalid')
  if (!validTime(item.startedAt) || !validTime(item.finishedAt) || item.startedAt !== null && item.finishedAt !== null && Date.parse(item.finishedAt) < Date.parse(item.startedAt)) fail('invocation clocks are invalid')
  if (item.durationMs !== null && (typeof item.durationMs !== 'number' || !Number.isFinite(item.durationMs) || item.durationMs < 0)) fail('invocation duration must be an actual finite measurement or null')
  if (item.measurement) {
    const clock = item.measurement, ns = (value: unknown) => typeof value === 'string' && /^(0|[1-9][0-9]{0,29})$/.test(value)
    if (!digest(clock.planSha256) || !digest(clock.environmentSha256) || !text(clock.boundary) || !text(clock.track) || !text(clock.clockDomainId) || !text(clock.executionInstanceId) || !Number.isSafeInteger(clock.sequence) || clock.sequence < 0 || !ns(clock.monotonicStartNs) || clock.monotonicFinishNs !== null && !ns(clock.monotonicFinishNs)) fail('invocation measurement context is invalid')
    if (clock.monotonicFinishNs !== null && BigInt(clock.monotonicFinishNs) < BigInt(clock.monotonicStartNs)) fail('monotonic invocation envelope runs backwards')
    if (item.state === 'started' && clock.monotonicFinishNs !== null) fail('started invocation has no finished clock')
  }
  if (item.output !== null && (!digest(item.output.sha256) || !text(item.output.path) || !Number.isSafeInteger(item.output.bytes) || item.output.bytes < 0)) fail('invocation output reference is invalid')
  if (item.streams && [item.streams.stdout, item.streams.stderr].some(stream => !stream || !digest(stream.sha256) || !text(stream.path) || !Number.isSafeInteger(stream.bytes) || stream.bytes < 0)) fail('invocation stream references are invalid')
  if (item.state === 'not-invoked' && (item.durationMs !== null || item.output !== null || item.startedAt !== null)) fail('uninvoked work cannot contain invocation evidence')
  if (item.state === 'returned' && !item.output) fail('returned invocation needs its actual retained output')
  if (item.state === 'started' && (!item.startedAt || item.finishedAt !== null || item.durationMs !== null || item.output !== null)) fail('started invocation is incomplete, not a finished sample')
  return Object.freeze({ ...item, identity: Object.freeze({ ...item.identity }), output: item.output && Object.freeze({ ...item.output }), ...(item.measurement ? { measurement: Object.freeze({ ...item.measurement }) } : {}), ...(item.streams ? { streams: Object.freeze({ stdout: Object.freeze({ ...item.streams.stdout }), stderr: Object.freeze({ ...item.streams.stderr }) }) } : {}) })
}
