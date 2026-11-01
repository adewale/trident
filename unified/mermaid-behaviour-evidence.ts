import { readFileSync, realpathSync } from 'node:fs'
import { join } from 'node:path'
import corpus from '../corpus/mermaid-behaviour-tests.json' with { type: 'json' }
import { evidenceBytesDigest, evidenceDigest } from '../portable/evidence-contract.ts'
import { readPublicTestEvidence } from './public-test-reporting.ts'
import { readPublicBehaviourTargets, requireBehaviourReference, ownedBehaviourFile } from './mermaid-behaviour.ts'
import { readBehaviourCapture } from './mermaid-behaviour-capture.ts'

const sha = (path: string | URL) => evidenceBytesDigest(readFileSync(path))
const same = (a: unknown, b: unknown) => evidenceDigest(a) === evidenceDigest(b)
/** Normal publication reopens actual owned values; it never trusts saved
 * counts, native callback status, reference flags or assessment timestamps as
 * substitutes for the source/artifact-bound observations. */
export function readBehaviourEvidence(directory: string) {
  const root = realpathSync(directory), report = JSON.parse(readFileSync(ownedBehaviourFile(root, 'report.json'), 'utf8'))
  const frozen = JSON.parse(readFileSync(ownedBehaviourFile(root, 'corpus.json'), 'utf8'))
  if (report.schema !== 'trident-mermaid-behaviour-report-v1' || report.protocol !== corpus.protocol || report.sourceCommit !== corpus.sourceCommit || report.scope !== corpus.scope || !same(frozen, corpus) || report.corpusSha256 !== sha(new URL('../corpus/mermaid-behaviour-tests.json', import.meta.url)) || !Array.isArray(report.targets) || !report.targets.length || new Set(report.targets.map((target: any) => target.project)).size !== report.targets.length) throw Error('Behaviour publication source/scope/target inventory changed')
  let targets: any[], referenceQualification: any, measuredAt: string | null, rawInvocations = 0
  if (report.captureMode === 'retained-upstream-public-calls') {
    if (report.parent?.directory !== 'parent-public-tests' || report.projectInvocations !== 0) throw Error('Retained behaviour parent ownership changed')
    const parentRoot = ownedBehaviourFile(root, report.parent.directory), parent = readPublicTestEvidence(parentRoot)
    for (const [field, file] of [['contextSha256', 'context.json'], ['inventorySha256', 'inventory.json'], ['reportSha256', 'public-conformance-report.json']] as const) if (report.parent[field] !== sha(ownedBehaviourFile(parentRoot, file))) throw Error('Behaviour native parent receipt changed')
    const reference = readPublicBehaviourTargets(parentRoot, ['mermaid-js/mermaid'])[0]!, qualified = reference.artifact?.binding?.kind === 'mermaid-api' && reference.rows.every(row => row.status === 'passed')
    referenceQualification = { qualified, cases: 49, artifactSha256: reference.artifact?.entrySha256 ?? null, rawChecksPassed: reference.rows.filter(row => row.status === 'passed').length }
    targets = readPublicBehaviourTargets(parentRoot, report.targets.map((target: any) => target.project)).map(target => qualified || target.project === 'mermaid-js/mermaid' || !target.artifact ? target : { ...target, counts: { passed: 0, failed: 0, unavailable: 49, unrun: 0 }, rows: target.rows.map(row => ({ ...row, rawAssessment: { status: row.status, checks: row.checks }, status: 'unavailable', checks: [], reason: 'Actual Mermaid behaviour reference is unresolved; peer assertions are withheld' })) })
    measuredAt = parent.saved.result.finishedAt
    if (report.parentMeasuredAt !== measuredAt) throw Error('Retained behaviour measurement date changed')
  } else if (['native-stdio', 'retained-native-stdio'].includes(report.captureMode)) {
    if (report.capture?.directory !== 'native-capture' || report.referenceEvidence?.directory !== 'reference-behaviour') throw Error('Native behaviour capture/reference ownership changed')
    const captureRoot = ownedBehaviourFile(root, report.capture.directory), referenceRoot = ownedBehaviourFile(root, report.referenceEvidence.directory)
    if (report.capture.contextSha256 !== sha(ownedBehaviourFile(captureRoot, 'context.json')) || report.referenceEvidence.reportSha256 !== sha(ownedBehaviourFile(referenceRoot, 'report.json'))) throw Error('Native behaviour capture/reference receipt changed')
    referenceQualification = requireBehaviourReference(referenceRoot)
    const captured = readBehaviourCapture(captureRoot)
    targets = [{ project: captured.context.adapter.project, version: captured.context.adapter.version, planned: 49, counts: captured.counts, rows: captured.rows }]
    rawInvocations = captured.actualCallBounds.attempts
    measuredAt = captured.actualCallBounds.to
    if (report.projectInvocations !== (report.captureMode === 'native-stdio' ? rawInvocations : 0)) throw Error('Native behaviour invocation count differs from actual journal records')
  } else throw Error('Unknown behaviour observation boundary')
  if (!same(referenceQualification, report.referenceQualification) || !same(targets, report.targets)) throw Error('Behaviour rows/counts/reference differ from re-evaluated actual raw evidence')
  if (measuredAt !== null && !Number.isFinite(Date.parse(measuredAt))) throw Error('Behaviour raw parent has no valid actual measurement date')
  return { report, corpus, protocol: corpus.protocol, sourceCommit: corpus.sourceCommit, targets, referenceQualification, measuredAt, assessedAt: report.assessedAt, captureMode: report.captureMode as string, rawInvocations, reportSha256: sha(join(root, 'report.json')) }
}
