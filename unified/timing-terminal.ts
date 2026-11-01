import { once } from 'node:events'
import { Worker } from 'node:worker_threads'
import { cpus, platform, release, arch } from 'node:os'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { assertBenchmarkExecutionAllowed } from '../ci-policy.ts'
import { evidenceBytesDigest, evidenceDigest, defineCaseEvidenceContract, type CheckedEvidence } from '../portable/evidence-contract.ts'
import { collectQualifiedTiming, type QualifiedTimingPublicDriver, type TimingCoordinate } from '../portable/qualified-timing-collection.ts'
import { admitTimingPlan } from '../portable/qualified-timing.ts'
import { terminalProfileCorpus } from '../fidelity/terminal-active-corpus.ts'
import { assessTerminalDrawing } from '../fidelity/terminal-assessment.ts'
import { verifyProvidedCommunityArtifact } from './community.ts'
import type { PreparedCommunity } from './community-types.ts'
import { protocolIdentity } from './protocol-identity.ts'
const environment = { NO_COLOR: '1', TERM: 'dumb', PYTHONIOENCODING: 'utf-8', PYTHONDONTWRITEBYTECODE: '1' }
export const terminalCliTimingBoundary = 'Host request through fresh owned Node-worker RPC, cold public CLI process startup/import/render, complete drained stdout bytes and RPC return; worker initialization, artifact verification, retention and full output grading excluded. Filesystem/OS caches uncontrolled; frozen package bytecode caches retained; no warm renderer.'
interface Options { preparedFile: string; prerequisiteFile: string; baseline: string; candidate: string; caseIds: string[]; out: string }
export const terminalTimingContract = (input: ReturnType<typeof terminalProfileCorpus>['cases'][number]) => defineCaseEvidenceContract({ caseId: input.id, source: input.source, expectations: input.expected.contract!, requiredChecks: [...input.expected.contract!.facts.filter(f => f.required !== false).map(f => ({ surface: 'terminal:display-facts', criterion: f.criterion })), { surface: 'terminal:public-cli', criterion: 'complete-utf8-return' }] })
const key = (coordinate: TimingCoordinate) => JSON.stringify([coordinate.round, coordinate.replica, coordinate.caseId, coordinate.sample])
export async function runTerminalCliTiming(options: Options) {
  assertBenchmarkExecutionAllowed(process.env, { mermaidOracle: false })
  if (existsSync(options.out)) throw Error('Terminal timing requires a fresh output directory')
  const preparedBytes = readFileSync(options.preparedFile), prepared = JSON.parse(preparedBytes.toString()) as PreparedCommunity[], corpus = terminalProfileCorpus(), cases = options.caseIds.map(id => corpus.cases.find(input => input.id === id)!)
  if (!cases.length || new Set(options.caseIds).size !== cases.length || cases.some(input => !input || input.intent === 'invalid' || !input.expected.contract)) throw Error('Timing requires unique independently reviewed real drawing sources')
  const selected = [options.baseline, options.candidate].map(project => { const rows = prepared.filter(peer => peer.node.id === project); if (rows.length !== 1 || rows[0]!.artifact?.kind !== 'cli' || rows[0]!.artifact!.input !== 'stdin' || rows[0]!.artifact!.args?.length) throw Error('Both frozen bindings must be actual stdin public CLIs with their declared default arguments'); verifyProvidedCommunityArtifact(rows[0]!.artifact!); return rows[0]! })
  if (options.baseline === options.candidate) throw Error('Select two distinct terminal projects')
  const prerequisiteBytes = readFileSync(options.prerequisiteFile), prerequisites = JSON.parse(prerequisiteBytes.toString()) as { project: string; caseId: string; grade: { status: string; sourceSha256?: string; expectationsSha256?: string; observerSha256?: string } }[]
  const producers = protocolIdentity(resolve(import.meta.dir, '..'), ['unified/timing-terminal.ts', 'unified/terminal-cli-timing-worker.ts', 'fidelity/terminal-assessment.ts'])
  const host = { platform: platform(), release: release(), arch: arch(), cpu: cpus().map(cpu => cpu.model), versions: process.versions, executable: process.execPath, executableSha256: evidenceBytesDigest(readFileSync(process.execPath)), environment }, environmentSha256 = evidenceDigest(host)
  const contracts = cases.map(terminalTimingContract)
  for (const input of cases) for (const peer of selected) { const matches = prerequisites.filter(row => row.project === peer.node.id && row.caseId === input.id); if (matches.length !== 1 || matches[0]!.grade.status !== 'correct' || matches[0]!.grade.sourceSha256 !== input.sourceSha256 || matches[0]!.grade.expectationsSha256 !== evidenceDigest(input.expected.contract)) throw Error('Every frozen timing source needs one actual correct console-CLI prerequisite per binding: ' + input.id) }
  const observerSha256 = evidenceDigest({ producers, prerequisiteSha256: evidenceBytesDigest(prerequisiteBytes), scope: 'Full terminal source-fact observer plus actual CLI return/UTF-8 receipt' })
  const identities = selected.map(peer => ({ project: peer.node.id, artifactSha256: evidenceDigest(peer.artifact), bindingSha256: evidenceDigest({ executable: peer.artifact!.executable, args: [], environment, worker: evidenceBytesDigest(readFileSync(new URL('./terminal-cli-timing-worker.ts', import.meta.url))) }) }))
  const plan = admitTimingPlan({ schema: 'trident-qualified-timing-plan-v1', boundary: terminalCliTimingBoundary, format: 'terminal', track: 'first-use', environmentSha256, observerSha256, rounds: 6, samplesPerRound: 1, maximumControlSpread: .25, cases: contracts, artifacts: { A0: identities[0]!, A1: identities[0]!, B: identities[1]! } })
  mkdirSync(options.out, { recursive: true })
  writeFileSync(join(options.out, 'terminal-inputs.json'), JSON.stringify({ schema: 'trident-terminal-cli-timing-inputs-v1', planSha256: evidenceDigest(plan), preparedSha256: evidenceBytesDigest(preparedBytes), prerequisitesSha256: evidenceBytesDigest(prerequisiteBytes), prepared: selected, sources: cases, host, producers }, null, 2) + '\n')
  const outcomes = new Map<string, any[]>(); let postCaptureVerified = false
  const driver: QualifiedTimingPublicDriver = { context: { boundary: plan.boundary, format: plan.format, track: plan.track, environmentSha256, artifacts: plan.artifacts }, async open(coordinate) {
    const peer = selected.find(peer => peer.node.id === coordinate.artifact.project)!, handle = new Worker(new URL('./terminal-cli-timing-worker.ts', import.meta.url), { workerData: { executable: peer.artifact!.executable, args: [], environment, timeoutMs: 10_000 } })
    coordinate.own({ kind: 'node-worker', handle })
    handle.on('message', value => { if (value?.schema === 'trident-terminal-cli-streams-v1') outcomes.set(key(coordinate), [...(outcomes.get(key(coordinate)) ?? []), value]) })
    const [ready] = await once(handle, 'message'); if (ready?.schema !== 'trident-qualified-timing-ready-v1') throw Error('Fresh CLI host failed to initialize')
    return { artifact: coordinate.artifact, execution: { kind: 'node-worker', handle } }
  } }
  try {
    const result = await collectQualifiedTiming(plan, cases.map(input => ({ caseId: input.id, source: input.source, provenance: input.origins.map(origin => origin.url).join('; ') })), driver, ({ contract, bytes, coordinate }) => {
      if (!postCaptureVerified) {
        for (const peer of selected) verifyProvidedCommunityArtifact(peer.artifact!)
        if (evidenceDigest(protocolIdentity(resolve(import.meta.dir, '..'), ['unified/timing-terminal.ts', 'unified/terminal-cli-timing-worker.ts', 'fidelity/terminal-assessment.ts'])) !== evidenceDigest(producers)) throw Error('Terminal timing producer changed during capture')
        writeFileSync(join(options.out, 'cli-outcomes.json'), JSON.stringify({ coordinates: [...outcomes].map(([coordinate, rows]) => ({ coordinate: JSON.parse(coordinate), rows })), boundary: terminalCliTimingBoundary }, null, 2) + '\n')
        postCaptureVerified = true
      }
      const input = cases.find(input => input.id === contract.caseId)!, grade = assessTerminalDrawing(input, bytes), captured = outcomes.get(key(coordinate)) ?? []; let utf8 = true
      try { new TextDecoder('utf-8', { fatal: true }).decode(bytes) } catch { utf8 = false }
      const returned = captured.length === 1 && captured[0].status === 0 && captured[0].error === null && captured[0].sourceSha256 === input.sourceSha256 && captured[0].stdoutSha256 === evidenceBytesDigest(bytes) && captured[0].stdoutBytes === bytes.length
      return { schema: 'trident-checked-evidence-v1', caseId: input.id, sourceSha256: contract.sourceSha256, expectationsSha256: contract.expectationsSha256, outputSha256: evidenceBytesDigest(bytes), observerSha256, checks: [...('checks' in grade ? grade.checks ?? [] : []).map(f => ({ surface: 'terminal:display-facts', criterion: f.criterion, status: f.status, detail: f.detail })), { surface: 'terminal:public-cli', criterion: 'complete-utf8-return', status: returned && utf8 ? 'passed' : 'unknown', detail: JSON.stringify({ policy: 'Actual fresh CLI status/source/full stdout hash and byte count; fatal UTF-8 decode; artifacts and producers reverified after capture', utf8, captured }) }] } as CheckedEvidence
    }, options.out)
    for (const peer of selected) verifyProvidedCommunityArtifact(peer.artifact!)
    return result
  } finally {
    writeFileSync(join(options.out, 'cli-outcomes.json'), JSON.stringify({ coordinates: [...outcomes].map(([coordinate, rows]) => ({ coordinate: JSON.parse(coordinate), rows })), boundary: terminalCliTimingBoundary }, null, 2) + '\n')
  }
}
if (import.meta.main) {
  if (process.argv.slice(2).join(' ') === '--help') { console.log('timing:terminal --prepared FILE --prerequisites FILE --baseline PROJECT --candidate PROJECT --cases ID,... --out FRESH_DIR\nSix balanced rounds of cold public CLI calls through complete UTF-8 stdout; includes process startup and common RPC overhead, excludes correctness grading. Requires actual per-binding correct CLI prerequisites. A/A or content gaps withhold speed. No renderer acquisition or runtime Codex.'); process.exit(0) }
  const values = new Map<string, string>(); for (let at = 2; at < process.argv.length; at += 2) { const name = process.argv[at]!, value = process.argv[at + 1]; if (!['--prepared', '--prerequisites', '--baseline', '--candidate', '--cases', '--out'].includes(name) || !value || values.has(name)) throw Error('timing:terminal --prepared FILE --prerequisites FILE --baseline PROJECT --candidate PROJECT --cases ID,... --out FRESH_DIR'); values.set(name, value) }
  for (const name of ['--prepared', '--prerequisites', '--baseline', '--candidate', '--cases', '--out']) if (!values.has(name)) throw Error('Missing ' + name)
  const result = await runTerminalCliTiming({ preparedFile: resolve(values.get('--prepared')!), prerequisiteFile: resolve(values.get('--prerequisites')!), baseline: values.get('--baseline')!, candidate: values.get('--candidate')!, caseIds: values.get('--cases')!.split(','), out: resolve(values.get('--out')!) }); console.log(JSON.stringify({ bundleFile: result.bundleFile, qualification: result.qualification }, null, 2)); if (result.qualification.status !== 'qualified') process.exitCode = 2
}
