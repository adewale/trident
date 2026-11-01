import { expect, test } from 'bun:test'
import { InvocationJournal } from '../portable/invocation-journal.ts'
import { evidenceBytesDigest } from '../portable/evidence-contract.ts'
import { terminalCliSourceOutcome, assessTerminalRecord, terminalLegacyProfileId } from '../unified/terminal-profile.ts'
import { communityCliBinding, communityCliRequest } from '../unified/community-cli-request.ts'
import { reviewedTerminalCases } from '../fidelity/terminal-corpus.ts'
import { assessTerminalSourceRejection } from '../fidelity/terminal-assessment.ts'
import type { BenchmarkObservation, UnifiedWorkload } from '../unified/types.ts'
import type { PreparedCommunity } from '../unified/community-types.ts'
import { useTempDirs } from './helpers/temp-dir.ts'
const temp = useTempDirs('terminal-cli-source-')
const project = 'AlexanderGrooff/mermaid-ascii', sha256 = 'e940686912699c015358f0b86f7bad61816067c9ccce655d787fe1fde9a1b6e8'
const cases = reviewedTerminalCases().filter(c => c.intent === 'invalid')
function captured(input = cases.find(c => c.family === 'invalid')!, mutation: { message?: string; artifactSha?: string; interrupted?: boolean; returned?: boolean; stdout?: string } = {}) {
  const out = temp.dir(), peer: PreparedCommunity = { node: { id: project, roles: ['renderer'], outputs: ['terminal'] }, artifact: { kind: 'cli', version: '1.6.1', executable: '/synthetic/release/mermaid-ascii', args: [], input: 'stdin', sha256: mutation.artifactSha ?? sha256 } }
  const workload: UnifiedWorkload = { id: input.id, family: input.family, source: input.source, intent: 'negative-admission', features: [], provenance: 'Synthetic durable CLI diagnostic control; no renderer was invoked' }
  const journal = new InvocationJournal(out + '/invocations'), start = journal.start({ project, caseId: input.id, sourceSha256: input.sourceSha256, artifactSha256: peer.artifact!.sha256!, bindingSha256: communityCliBinding(peer.artifact!.executable!, 'terminal', communityCliRequest(peer.artifact!, 'terminal', out)), format: 'terminal' })
  const message = mutation.message ?? "failed to parse graph diagram: unsupported graph type 'not a diagram'. Supported types: 'graph' or 'flowchart' with an optional direction (TD, TB, BT, LR, RL)"
  const streams = journal.streams(Buffer.from(mutation.stdout ?? ''), Buffer.from('time="2026-11-01T00:44:22Z" level=fatal msg=' + JSON.stringify(message) + '\n'))
  if (mutation.returned) journal.returned(start, '', 1, streams)
  else journal.failed(start, message, 1, mutation.interrupted ? 'interrupted' : 'public-error', streams)
  const row: BenchmarkObservation = { suite: 'community', surface: 'cli:end-to-end', runtime: 'synthetic control', family: input.family, caseId: input.id, operation: 'render', format: 'terminal', mode: 'feature-corpus-qualification', status: 'failed', metrics: { implementation: project, rawInvocationDirectory: journal.directory, rawInvocationId: start.attemptId } }
  return { out, peer, workload, row, journal, input }
}

test('exact frozen CLI family diagnostic answers only the no-family controls', () => {
  for (const input of cases) {
    const f = captured(input), outcome = terminalCliSourceOutcome(f.peer, f.workload, f.row, f.out)
    expect(outcome?.kind).toBe('unknown-family')
    expect(assessTerminalSourceRejection(input, outcome, project).status).toBe(input.family === 'invalid' ? 'correct' : 'unknown')
    expect(outcome?.measuredAt).toMatch(/^\d{4}-/)
    const record = { profile: terminalLegacyProfileId, inventory: [[input.id, input.sourceSha256]], artifacts: [{ project, version: '1.6.1' }], outputs: [{ project, caseId: input.id, typedSourceOutcome: outcome }], sourceReference: [{ project: 'mermaid-js/mermaid', caseId: input.id }] }
    expect(assessTerminalRecord(record, f.out, [input])[0]!.rejection.cases[0]!.status).toBe(input.family === 'invalid' ? 'correct' : 'unknown')
  }
})

test('exit, transport, generic diagnostics, mixed output and other executable bytes supply no type credit', () => {
  for (const mutation of [{ message: 'SyntaxError' }, { message: 'permission denied' }, { interrupted: true }, { artifactSha: 'b'.repeat(64) }, { stdout: 'unexpected side output' }]) {
    const f = captured(undefined, mutation)
    expect(terminalCliSourceOutcome(f.peer, f.workload, f.row, f.out)).toBeUndefined()
  }
  const f = captured(); f.workload.source += '\n'
  expect(terminalCliSourceOutcome(f.peer, f.workload, f.row, f.out)).toBeUndefined()
  const normal = captured(); normal.workload.intent = undefined
  expect(terminalCliSourceOutcome(normal.peer, normal.workload, normal.row, normal.out)).toBeUndefined()
})

test('an actual successful public CLI return is accepted-invalid rather than a rejection', () => {
  const f = captured(undefined, { returned: true }), outcome = terminalCliSourceOutcome(f.peer, f.workload, f.row, f.out)
  expect(outcome?.kind).toBe('accepted')
  expect(assessTerminalSourceRejection(f.input, outcome, project).status).toBe('incorrect')
  expect(outcome?.sourceSha256).toBe(evidenceBytesDigest(f.input.source))
})
