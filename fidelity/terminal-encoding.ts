import { evidenceBytesDigest, evidenceDigest } from '../portable/evidence-contract.ts'
import { analyseTerminalSource } from './terminal-source.ts'
import { inspectTerminalEncodedJourney } from './terminal-encoded-journey.ts'
import { inspectTerminalGantt } from './terminal-family-schedule.ts'
import { inspectTerminalGit } from './terminal-family-git.ts'
import { terminalEncodingRuntime } from './terminal-encoding-runtime.ts'

/** Independent inputs exercise every non-universal glyph mapping we decode. */
export const terminalEncodingControls = [
  ...[1, 2, 3, 4, 5].map(score => ({ id: 'journey-' + score, family: 'journey', source: 'journey\nsection Section\nTask: ' + score + ': Actor' })),
  ...['done', 'active', 'milestone'].map(status => ({ id: 'gantt-' + status, family: 'gantt', source: 'gantt\ndateFormat YYYY-MM-DD\nsection Section\nTask :' + status + ', a, 2024-01-01, ' + (status === 'milestone' ? '0d\nSpan :done, b, 2024-01-01, 10d' : '10d') })),
  { id: 'gitgraph', family: 'gitgraph', source: 'gitGraph\ncommit id: "A"\nbranch other\ncommit id: "B"\ncheckout main\ncommit id: "C"' },
] as const
export interface TerminalEncodingQualification {
  runtimeSha256: string
  artifactSha256: string
  archives: { sha256: string }[]
  observations: { id: string; source: string; output: string }[]
}
export interface TerminalEncodingContext {
  encoding: 'terminal-dictionary-v1'; artifactSha256: string; qualificationSha256: string
  capabilities: readonly string[]
  sourceSha256: string; outputSha256: string; owningRawSha256: string
}
const qualifiedContexts = new WeakSet<TerminalEncodingContext>()
export function qualifyTerminalEncoding(owner: any, observations: TerminalEncodingQualification['observations']): TerminalEncodingQualification {
  const artifact = owner?.artifact
  if (!/^[a-f0-9]{64}$/.test(artifact?.sha256) || !artifact.files?.length || artifact.files.some((file: any) => !/^[a-f0-9]{64}$/.test(file.sha256))) throw Error('Encoding qualification needs a bound artifact and its archives')
  const qualification = { runtimeSha256: terminalEncodingRuntime(owner), artifactSha256: artifact.sha256, archives: artifact.files.map(({ sha256 }: any) => ({ sha256 })), observations }
  if (!qualifiedCapabilities(qualification).length) throw Error('No terminal glyph dictionary passed independent controls')
  return qualification
}
function qualifiedCapabilities(qualification: TerminalEncodingQualification) {
  if (!Array.isArray(qualification.observations) || new Set(qualification.observations.map(row => row.id)).size !== qualification.observations.length) return []
  const passed = new Set<string>()
  let qualificationSha256: string | undefined
  for (const control of terminalEncodingControls) {
    const row = qualification.observations.find(row => row.id === control.id)
    if (!row || row.source !== control.source || typeof row.output !== 'string') continue
    const source = analyseTerminalSource(control.source, control.family)
    // This local context only enables the decoder being qualified. It is never
    // returned as evidence for a candidate drawing.
    const context: TerminalEncodingContext = { encoding: 'terminal-dictionary-v1', capabilities: [control.family], artifactSha256: qualification.artifactSha256, qualificationSha256: qualificationSha256 ??= evidenceDigest(qualification), sourceSha256: evidenceBytesDigest(control.source), outputSha256: evidenceBytesDigest(row.output), owningRawSha256: evidenceDigest(row) }
    const checks = control.family === 'journey' ? inspectTerminalEncodedJourney(row.output, source.contract) : control.family === 'gantt' ? inspectTerminalGantt(row.output, source.contract, context) : inspectTerminalGit(row.output, source.contract, context)
    if (checks.length && checks.every(check => check.status === 'passed')) passed.add(control.id)
  }
  return ['journey', 'gantt', 'gitgraph'].filter(family => terminalEncodingControls.filter(control => control.family === family).every(control => passed.has(control.id)))
}
/** Artifact hashes bind who was exercised; no project/version/hash allowlist
 * chooses a dictionary. A new artifact must qualify its own actual outputs. */
export function terminalKnownEncodingContext(owner: any, binding: { sourceSha256: string; outputSha256: string; owningRawSha256: string }, qualification?: TerminalEncodingQualification): TerminalEncodingContext | undefined {
  if (!qualification || owner?.artifact?.sha256 !== qualification.artifactSha256 || evidenceDigest((owner.artifact.files ?? []).map(({ sha256 }: any) => ({ sha256 }))) !== evidenceDigest(qualification.archives) || !Object.values(binding).every(value => /^[a-f0-9]{64}$/.test(value))) return
  try { if (!/^[a-f0-9]{64}$/.test(qualification.runtimeSha256) || terminalEncodingRuntime(owner) !== qualification.runtimeSha256) return } catch { return }
  const capabilities = qualifiedCapabilities(qualification)
  if (!capabilities.length) return
  const context = Object.freeze({ encoding: 'terminal-dictionary-v1' as const, artifactSha256: qualification.artifactSha256, qualificationSha256: evidenceDigest(qualification), capabilities: Object.freeze(capabilities), ...binding })
  qualifiedContexts.add(context)
  return context
}
export function admittedTerminalEncoding(context: TerminalEncodingContext | undefined, output: string | Uint8Array, sourceSha256?: string) {
  return context && qualifiedContexts.has(context) && (!sourceSha256 || context.sourceSha256 === sourceSha256) && context.outputSha256 === evidenceBytesDigest(output) ? context : undefined
}
