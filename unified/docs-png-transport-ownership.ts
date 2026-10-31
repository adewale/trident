import { readFileSync, realpathSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'
import { readCheckpointValue } from '../portable/checkpoint.ts'
import { admitInvocationEvidence, evidenceBytesDigest, evidenceDigest } from '../portable/evidence-contract.ts'
import type { DocsInput } from './docs-drawings.ts'

/** The docs wrapper and external transports use different public metric names.
 * Both refer to an existing journal; neither creates an invocation or clock. */
export function externalPngInvocation(metrics: Record<string, unknown> | undefined) {
  const select = (raw: string, external: string) => {
    const left = metrics?.[raw], right = metrics?.[external]
    if (typeof left === 'string' && typeof right === 'string' && left !== right) throw Error('PNG transport has conflicting actual invocation metadata')
    return typeof left === 'string' ? left : typeof right === 'string' ? right : undefined
  }
  return { invocationId: select('rawInvocationId', 'invocationId'), invocationDirectory: select('rawInvocationDirectory', 'invocationDirectory') }
}

const owned = (root: string, path: string) => {
  const actual = relative(realpathSync(root), realpathSync(path))
  if (isAbsolute(actual) || actual === '..' || actual.startsWith('../')) throw Error('Recovered native PNG witness escapes its owned result')
  return path
}

/** Repair only a lost wrapper field using the already admitted actual native
 * journal and transport row. The original raw unit remains immutable. There is
 * no aggregate-pointer, legacy-image or invented per-call clock fallback. */
export function recoverRetainedNativePngOwnership(input: { root: string; project: string; source: DocsInput; round: number; actualPng: Uint8Array; remap?: (path: string) => string }) {
  const { root, project, source, round, actualPng } = input, remap = input.remap ?? ((path: string) => path)
  const raw = readCheckpointValue<any>(root, JSON.stringify(['raw-png', project, round, source.id]))
  if (!Number.isSafeInteger(round) || round < 1 || !raw || raw.status !== 'passed' || raw.invocationId != null || typeof raw.bytesBase64 !== 'string' || evidenceBytesDigest(Buffer.from(raw.bytesBase64, 'base64')) !== evidenceBytesDigest(actualPng)) throw Error('Native PNG recovery requires the matching immutable raw return with lost invocation metadata')
  const context = JSON.parse(readFileSync(owned(root, join(root, 'context.json')), 'utf8')), peers = context.artifacts?.filter((peer: any) => peer.node?.id === project)
  if (peers?.length !== 1 || peers[0].artifact?.kind !== 'jsonl-worker') throw Error('Native PNG recovery has no unique frozen external native artifact')
  const artifact = peers[0].artifact, workers = artifact.files?.filter((file: any) => file.path === artifact.executable)
  if (workers?.length !== 1 || workers[0].sha256 !== artifact.sha256) throw Error('Native PNG recovery lacks its unique frozen worker byte identity')
  const worker = workers[0]
  const transport = JSON.parse(readFileSync(owned(root, join(root, 'transport-' + encodeURIComponent(project) + '-r' + round + '.json')), 'utf8'))
  if (!Array.isArray(transport)) throw Error('Native PNG recovery has no original transport rows')
  const rows = transport.filter((row: any) => row.caseId === source.id && row.format === 'png' && row.operation === 'render' && row.metrics?.implementation === project && row.metrics?.round === round)
  if (rows.length !== 1 || rows[0].status !== 'passed') throw Error('Native PNG recovery has no unique successful original transport return')
  const row = rows[0], invocation = externalPngInvocation(row.metrics)
  if (!invocation.invocationId || !invocation.invocationDirectory) throw Error('Native PNG recovery transport has no actual journal coordinate')
  const directory = owned(root, resolve(remap(invocation.invocationDirectory))), identity = { schema: 'trident-invocation-journal-v1' }
  const started = admitInvocationEvidence(readCheckpointValue(directory, invocation.invocationId + ':started', identity)), returned = admitInvocationEvidence(readCheckpointValue(directory, invocation.invocationId + ':returned', identity))
  for (const terminal of ['public-error', 'interrupted']) if (readCheckpointValue(directory, invocation.invocationId + ':' + terminal, identity)) throw Error('Recovered native PNG invocation has contradictory terminal outcomes')
  const expectedBinding = evidenceDigest({ output: 'png', kind: artifact.kind, args: artifact.args ?? [], worker: worker.sha256 })
  if (started.state !== 'started' || returned.state !== 'returned' || started.attemptId !== invocation.invocationId || returned.attemptId !== invocation.invocationId || evidenceDigest(started.identity) !== evidenceDigest(returned.identity) || returned.startedReceiptSha256 !== undefined && returned.startedReceiptSha256 !== evidenceDigest(started) || returned.identity.project !== project || returned.identity.caseId !== source.id || returned.identity.sourceSha256 !== evidenceBytesDigest(source.source) || returned.identity.format !== 'png' || returned.identity.artifactSha256 !== artifact.sha256 || returned.identity.bindingSha256 !== expectedBinding || returned.output?.sha256 !== evidenceBytesDigest(actualPng) || returned.output.bytes !== actualPng.byteLength) throw Error('Recovered native PNG journal differs from the literal source, artifact or actual returned bytes')
  const output = owned(directory, resolve(remap(returned.output.path)))
  if (typeof row.metrics.outputFile !== 'string' || resolve(remap(row.metrics.outputFile)) !== output || evidenceBytesDigest(readFileSync(output)) !== evidenceBytesDigest(actualPng)) throw Error('Recovered native PNG output differs from its durable actual transport witness')
  return { schema: 'trident-recovered-native-png-invocation-v1' as const, project, caseId: source.id, round, sourceSha256: returned.identity.sourceSha256, pngSha256: returned.output.sha256, attemptId: invocation.invocationId, rawUnitSha256: evidenceDigest(raw), transportReturnSha256: evidenceDigest(row), artifactContextSha256: evidenceDigest(artifact), startedFrameSha256: evidenceDigest(started), returnedFrameSha256: evidenceDigest(returned), timingQualified: false, scope: 'Actual original native public invocation recovered from its source/artifact-bound journal after wrapper metric-name loss. Original raw PNG unit unchanged; no new project call, invocation or clock.' }
}
