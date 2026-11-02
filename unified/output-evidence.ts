import { cpSync, lstatSync, readFileSync, realpathSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { readCheckpointValue } from '../portable/checkpoint.ts'
import { admitInvocationEvidence, evidenceBytesDigest, evidenceDigest } from '../portable/evidence-contract.ts'
import { qualifyOutputFormat } from './qualification.ts'
import type { BenchmarkObservation } from './types.ts'

const own = (root: string, path: string) => {
  if (typeof path !== 'string' || isAbsolute(path)) throw Error('Output evidence must use an owned relative path')
  const target = resolve(root, path), logical = relative(root, target), physical = relative(realpathSync(root), realpathSync(target))
  if ([logical, physical].some(value => isAbsolute(value) || value === '..' || value.startsWith('../'))) throw Error('Output evidence escapes its owning capture')
  return target
}
const proofSchema = (proof: any) => ['trident-output-return-v1', 'trident-output-outcome-v1'].includes(proof?.schema)
export function outputEvidence(root: string, journalDirectory: string, attemptId: string, witness?: string) {
  const directory = relative(resolve(root), resolve(journalDirectory))
  own(resolve(root), directory)
  if (witness !== undefined) own(resolve(root), witness)
  const identity = { schema: 'trident-invocation-journal-v1' }
  const outcomes = ['returned', 'public-error', 'interrupted'].map(state => readCheckpointValue<any>(join(resolve(root), directory), attemptId + ':' + state, identity)).filter(Boolean)
  if (outcomes.length > 1) throw Error('Output invocation has contradictory terminal outcomes')
  const returned = outcomes[0]
  if (!returned) return null
  const started = readCheckpointValue(join(resolve(root), directory), attemptId + ':started', identity)
  if (!started || returned.startedReceiptSha256 !== evidenceDigest(started)) return null // Legacy frames are not silently upgraded.
  if (returned.state !== 'returned') return JSON.stringify({ schema: 'trident-output-outcome-v1', journal: directory, attemptId, state: returned.state })
  return witness === undefined ? null : JSON.stringify({ schema: 'trident-output-return-v1', journal: directory, attemptId, witness })
}
export function copyOutputEvidence(source: string, out: string, encoded: string, witness: string | undefined, copied: Set<string>) {
  const proof = JSON.parse(encoded)
  if (!proofSchema(proof) || !proof.journal || proof.journal === '.') throw Error('Invalid copied output journal')
  const directory = own(source, proof.journal)
  if (!copied.has(proof.journal)) {
    cpSync(directory, resolve(out, proof.journal), { recursive: true, dereference: false, filter: path => { if (lstatSync(path).isSymbolicLink()) throw Error('Output journal contains a symlink'); return true } })
    copied.add(proof.journal)
  }
  return JSON.stringify({ ...proof, ...(proof.schema === 'trident-output-return-v1' ? { witness } : {}) })
}
export function scopeOutputEvidence(encoded: string, lane: 'svg' | 'png') {
  const proof = JSON.parse(encoded)
  if (!proofSchema(proof) || !['svg', 'png'].includes(lane)) throw Error('Unknown composite output proof')
  for (const path of [proof.journal, ...(proof.schema === 'trident-output-return-v1' ? [proof.witness] : [])]) if (typeof path !== 'string' || isAbsolute(path) || path.split(/[\\/]/).includes('..')) throw Error('Composite output evidence has an unowned path')
  return JSON.stringify({ ...proof, journal: join(lane, proof.journal), ...(proof.schema === 'trident-output-return-v1' ? { witness: join(lane, proof.witness) } : {}) })
}

/** Summary flags cannot supply measured output facts. Reopen the exact bytes
 * and causal public return, check literal source/format/project ownership, then
 * rerun the mechanical checker. Never touch the renderer or former machine. */
export function verifiedOutputObservations(root: string, inputs: readonly { id: string; source?: string; sourceSha256?: string }[], rows: readonly BenchmarkObservation[]) {
  const used = new Set<string>()
  const artifacts = new Map<string, string>()
  return rows.map(row => {
    if (row.operation !== 'render') return row
    const clean = { ...row, metrics: { ...row.metrics, outputState: null as string | null, publicOutputReturned: null as boolean | null, formatValid: null as boolean | null, returnedBytes: null as number | null } }
    if (row.metrics?.parentInvocationFormat === 'png' && row.metrics?.witnessRole === 'actual-original-public-svg-return') return clean
    const encoded = row.metrics?.outputEvidence
    if (typeof encoded !== 'string') return clean
    const proof = JSON.parse(encoded), input = inputs.find(input => input.id === row.caseId)
    if (!proofSchema(proof) || typeof proof.attemptId !== 'string' || proof.attemptId !== row.metrics?.rawInvocationId || !input) throw Error('Output proof has a different source or invocation')
    const directory = own(root, proof.journal), identity = { schema: 'trident-invocation-journal-v1' }
    const key = join(directory, proof.attemptId)
    if (used.has(key)) throw Error('One public return cannot supply several planned output coordinates')
    used.add(key)
    const started = admitInvocationEvidence(readCheckpointValue(directory, proof.attemptId + ':started', identity))
    const outcomes = ['returned', 'public-error', 'interrupted'].map(state => readCheckpointValue(directory, proof.attemptId + ':' + state, identity)).filter(Boolean)
    if (outcomes.length !== 1) throw Error('Output invocation has missing or contradictory terminal outcomes')
    const returned = admitInvocationEvidence(outcomes[0])
    if (started.state !== 'started' || started.attemptId !== proof.attemptId || returned.attemptId !== proof.attemptId || evidenceDigest(started.identity) !== evidenceDigest(returned.identity)
      || returned.startedReceiptSha256 !== evidenceDigest(started) || returned.identity.project !== row.metrics?.project || returned.identity.caseId !== row.caseId && !/^docs_\d+_\d+$/.test(returned.identity.caseId)
      || returned.identity.sourceSha256 !== (typeof input.source === 'string' ? evidenceBytesDigest(input.source) : input.sourceSha256) || returned.identity.format !== row.format) throw Error('Public return differs from the literal source/project/format')
    const artifactKey = JSON.stringify([returned.identity.project, returned.identity.format]), prior = artifacts.get(artifactKey)
    if (prior && prior !== returned.identity.artifactSha256) throw Error('Output population mixes different public artifacts')
    artifacts.set(artifactKey, returned.identity.artifactSha256)
    clean.metrics.outputState = returned.state
    if (proof.schema === 'trident-output-outcome-v1') {
      if (!['public-error', 'interrupted'].includes(proof.state) || proof.state !== returned.state) throw Error('Output outcome differs from its causal terminal frame')
      clean.metrics.publicOutputReturned = returned.state === 'public-error' ? false : null
      return clean
    }
    if (returned.state !== 'returned' || !returned.output) throw Error('Output proof has no completed public return')
    const witness = own(root, proof.witness)
    const retained = readFileSync(witness), bytes = witness.endsWith('.gz') ? gunzipSync(retained, { maxOutputLength: 128 * 1024 * 1024 }) : retained
    if (returned.output.sha256 !== evidenceBytesDigest(bytes) || returned.output.bytes !== bytes.byteLength) throw Error('Measured output bytes differ from their public return')
    // Use the owned content-addressed payload, never its former absolute path.
    const journalBytes = readFileSync(own(root, relative(root, join(directory, 'outputs', returned.output.sha256))))
    if (evidenceBytesDigest(journalBytes) !== returned.output.sha256 || journalBytes.length !== bytes.length) throw Error('Public journal output bytes changed')
    let valid: boolean | null = null
    try {
      const checked = qualifyOutputFormat(row.format === 'png' ? bytes : new TextDecoder('utf-8', { fatal: true }).decode(bytes), row.format)
      valid = checked.unavailable ? null : checked.ok
    } catch { valid = false }
    clean.metrics.publicOutputReturned = true; clean.metrics.formatValid = valid; clean.metrics.returnedBytes = bytes.length
    return clean
  })
}
