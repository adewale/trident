import { expect, test } from 'bun:test'
import { InvocationJournal } from '../portable/invocation-journal.ts'
import { evidenceBytesDigest, type InvocationEvidence } from '../portable/evidence-contract.ts'
import { bindTerminalAdaptationInvocation } from '../unified/terminal-adaptation-invocation.ts'
import { useTempDirs } from './helpers/temp-dir.ts'

const temp = useTempDirs('terminal-adaptation-invocation-audit-')
const identity = { project: 'synthetic/audit', caseId: 'fresh-authored-control', sourceSha256: evidenceBytesDigest('fresh source'), artifactSha256: 'a'.repeat(64), bindingSha256: 'b'.repeat(64), format: 'terminal' }
function fixture() {
  const journal = new InvocationJournal(temp.dir()), start = journal.start(identity)
  journal.returned(start, 'Synthetic actual bytes; no renderer is invoked', null)
  return { frames: journal.records(), attemptId: start.attemptId }
}

test('fresh adaptation admission rejects a mismatched durable start even when the terminal frame names the correct source', () => {
  const { frames, attemptId } = fixture()
  expect(bindTerminalAdaptationInvocation(frames, attemptId, identity).state).toBe('returned')
  for (const key of ['sourceSha256', 'artifactSha256', 'bindingSha256'] as const) {
    const changed = frames.map(frame => frame.state === 'started' ? { ...frame, identity: { ...frame.identity, [key]: 'f'.repeat(64) } } : frame)
    expect(() => bindTerminalAdaptationInvocation(changed, attemptId, identity)).toThrow('mixed')
  }
  const badHash = frames.map(frame => frame.state === 'returned' ? { ...frame, startedReceiptSha256: 'f'.repeat(64) } : frame)
  expect(() => bindTerminalAdaptationInvocation(badHash, attemptId, identity)).toThrow('mixed')
  const badClock = frames.map(frame => frame.state === 'returned' ? { ...frame, startedAt: '2020-01-01T00:00:00.000Z' } : frame)
  expect(() => bindTerminalAdaptationInvocation(badClock, attemptId, identity)).toThrow('mixed')
})

test('legacy missing predecessor hash stays explicit without permitting contradictory outcomes or uninvoked substitutes', () => {
  const { frames, attemptId } = fixture()
  const legacy = frames.map(frame => { const copy = { ...frame }; delete copy.startedReceiptSha256; return copy })
  expect(bindTerminalAdaptationInvocation(legacy, attemptId, identity).startedReceiptSha256).toBeUndefined()
  const returned = frames.find(frame => frame.state === 'returned')!
  expect(() => bindTerminalAdaptationInvocation([...frames, { ...returned, state: 'public-error', output: null }], attemptId, identity)).toThrow('exactly one')
  expect(() => bindTerminalAdaptationInvocation([returned], attemptId, identity)).toThrow('exactly one')
  expect(() => bindTerminalAdaptationInvocation(frames, 'another-attempt', identity)).toThrow('exactly one')
  const notInvoked = frames.map(frame => frame.state === 'returned' ? { ...frame, state: 'not-invoked' } as InvocationEvidence : frame)
  expect(() => bindTerminalAdaptationInvocation(notInvoked, attemptId, identity)).toThrow('completed outcome')
})
