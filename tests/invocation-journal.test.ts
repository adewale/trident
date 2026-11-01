import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { InvocationJournal } from '../portable/invocation-journal.ts'
import { CollectionCheckpoint } from '../portable/checkpoint.ts'
import { evidenceBytesDigest } from '../portable/evidence-contract.ts'
import { useTempDirs } from './helpers/temp-dir.ts'
const temp = useTempDirs('invocation-journal-'), identity = { project: 'fixture/renderer', caseId: 'independent:chain', sourceSha256: evidenceBytesDigest('graph LR\nA-->B'), artifactSha256: evidenceBytesDigest('public artifact bytes'), bindingSha256: evidenceBytesDigest('public binding'), format: 'svg' }
test('actual return and clock survive a later grading exception', () => {
  const directory = temp.dir(), journal = new InvocationJournal(directory), start = journal.start(identity)
  const returned = journal.returned(start, '<svg>actual public return</svg>', 1.25)
  expect(readFileSync(returned.output!.path, 'utf8')).toBe('<svg>actual public return</svg>')
  expect(() => { throw Error('Injected grading failure after durable capture') }).toThrow('grading failure')
  const recovered = new CollectionCheckpoint(directory, { schema: 'trident-invocation-journal-v1' }).get<any>(start.attemptId + ':returned')
  expect(recovered.durationMs).toBe(1.25)
  expect(recovered.output.sha256).toBe(evidenceBytesDigest('<svg>actual public return</svg>'))
  expect(() => journal.returned(start, 'another return', 2)).toThrow('terminal outcome')
})
test('a start without an outcome remains incomplete, while missing clocks stay null', () => {
  const directory = temp.dir(), journal = new InvocationJournal(directory), start = journal.start(identity)
  const checkpoint = new CollectionCheckpoint(directory, { schema: 'trident-invocation-journal-v1' })
  expect(checkpoint.get<any>(start.attemptId + ':started').state).toBe('started')
  expect(checkpoint.get(start.attemptId + ':returned')).toBeUndefined()
  expect(journal.pending(identity).map(frame => frame.attemptId)).toEqual([start.attemptId])
  const interrupted = journal.failed(start, 'transport stopped', null, 'interrupted')
  expect(interrupted).toMatchObject({ state: 'interrupted', durationMs: null, output: null, finishedAt: null })
  expect(journal.pending(identity)).toEqual([])
  expect(() => journal.returned({ ...start, identity: { ...identity, project: 'another' } }, 'forged', 1)).toThrow('matching durable start')
})

test('external returned frames retain explicit unknown clocks and cannot contradict an earlier outcome',()=>{
 const directory=temp.dir(),journal=new InvocationJournal(directory),owner=new InvocationJournal(temp.dir())
 const started=owner.start(identity),returned=owner.returned(started,'actual bytes',null)
 const adopted=journal.adopt({...returned,startedAt:null,finishedAt:null})
 expect(adopted.startedAt).toBeNull();expect(adopted.finishedAt).toBeNull();expect(adopted.output?.sha256).toBe(returned.output?.sha256)
 expect(journal.outcome(adopted.attemptId)?.state).toBe('returned')
 expect(()=>journal.adopt({...adopted,state:'public-error',output:null})).toThrow('contradictory')
})
