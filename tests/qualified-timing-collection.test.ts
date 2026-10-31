import { expect, test } from 'bun:test'
import { Worker } from 'node:worker_threads'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { once } from 'node:events'
import { spawnSync } from 'node:child_process'
import { collectQualifiedTiming, qualifiedTimingCoordinates, type QualifiedTimingPublicDriver, type ObserveTimedOutput } from '../portable/qualified-timing-collection.ts'
import { defineCaseEvidenceContract, evidenceBytesDigest as hash, evidenceDigest } from '../portable/evidence-contract.ts'
import { InvocationJournal } from '../portable/invocation-journal.ts'
import { qualifyRetainedTiming } from '../unified/qualify-timing.ts'
import { useTempDirs } from './helpers/temp-dir.ts'
const temp = useTempDirs('qualified-timing-collection-')
function fixture() {
  const root = temp.dir(), calls = join(root, 'calls'), worker = join(root, 'worker.mjs')
  const sources = [{ caseId: 'fixture:one', source: 'independent fixture source one' }, { caseId: 'fixture:two', source: 'independent fixture source two' }]
  const cases = sources.map(input => defineCaseEvidenceContract({ ...input, expectations: { literalReturn: 'fixture return: ' + input.source }, requiredChecks: [{ surface: 'fixture-output', criterion: 'literal-return' }] }))
  const artifact = { project: 'synthetic/reference', artifactSha256: hash('frozen synthetic reference worker'), bindingSha256: hash('fixed Worker request/return; import excluded') }
  const plan = { schema: 'trident-qualified-timing-plan-v1' as const, boundary: 'Fresh fixture Worker request through actual returned text; IPC included, imports and file retention excluded', format: 'svg' as const, track: 'first-use', environmentSha256: hash('synthetic controlled test host'), observerSha256: hash('synthetic independent literal-output observer'), rounds: 6, samplesPerRound: 1, maximumControlSpread: 1000, cases, artifacts: { A0: artifact, A1: artifact, B: { ...artifact, project: 'synthetic/candidate', artifactSha256: hash('frozen synthetic candidate worker') } } }
  writeFileSync(worker, `import {appendFileSync} from 'node:fs';import {serveQualifiedTimingWorker} from ${JSON.stringify(new URL('../portable/qualified-timing-collection.ts', import.meta.url).href)};serveQualifiedTimingWorker(async source=>{appendFileSync(${JSON.stringify(calls)},source+'\\n');await new Promise(resolve=>setTimeout(resolve,2));return 'fixture return: '+source;});`)
  let opens = 0
  const driver: QualifiedTimingPublicDriver = { context: { boundary: plan.boundary, format: plan.format, track: plan.track, environmentSha256: plan.environmentSha256, artifacts: plan.artifacts }, async open({ artifact }) { opens++; const handle = new Worker(worker); const [ready] = await once(handle, 'message'); if (ready?.schema !== 'trident-qualified-timing-ready-v1') throw Error('Fixture worker did not initialize before timing'); return { artifact, execution: { kind: 'node-worker', handle } } } }
  const observe: ObserveTimedOutput = ({ contract, bytes }) => ({ schema: 'trident-checked-evidence-v1', caseId: contract.caseId, sourceSha256: contract.sourceSha256, expectationsSha256: contract.expectationsSha256, outputSha256: hash(bytes), observerSha256: plan.observerSha256, checks: [{ surface: 'fixture-output', criterion: 'literal-return', status: bytes.toString() === 'fixture return: ' + sources.find(input => input.caseId === contract.caseId)!.source ? 'passed' : 'failed', detail: 'Exact independently authored literal-output fixture; not a real renderer benchmark' }] })
  return { root, calls, worker, sources, plan, driver, observe, opens: () => opens }
}

test('real per-call capture qualifies through the public offline CLI and never includes grading in API clocks', async () => {
  const f = fixture(), out = join(f.root, 'capture')
  const result = await collectQualifiedTiming(f.plan, f.sources, f.driver, input => { expect(f.opens()).toBe(36); return f.observe(input) }, out)
  expect(result.qualification.status).toBe('qualified')
  expect(result.samples).toHaveLength(36)
  expect(JSON.parse(readFileSync(join(out, 'sources.json'), 'utf8')).map((input: any) => input.source)).toEqual(f.sources.map(input => input.source))
  expect(f.opens()).toBe(36)
  expect(new Set(result.samples.map(sample => sample.invocation.measurement!.executionInstanceId)).size).toBe(36)
  const frames = new InvocationJournal(join(out, 'raw')).records()
  for (const sample of result.samples) {
    const start = frames.find(frame => frame.attemptId === sample.invocation.attemptId && frame.state === 'started')!
    expect(sample.invocation.startedReceiptSha256).toBe(evidenceDigest(start))
    expect((sample.invocation.measurement as any).captureProtocolSha256).toBe(evidenceDigest(result.captureProtocol))
    expect(sample.invocation.durationMs).toBe(Number(BigInt(sample.invocation.measurement!.apiFinishNs!) - BigInt(sample.invocation.measurement!.apiStartNs!)) / 1e6)
  }
  expect(qualifyRetainedTiming(result.bundleFile)!.status).toBe('qualified')
  const file = join(f.root, 'offline.json'), command = spawnSync(process.env.BUN_BIN ?? 'bun', ['commands.ts', 'timing:qualify', '--bundle', result.bundleFile, '--out', file], { cwd: join(import.meta.dir, '..'), encoding: 'utf8' })
  expect(command.status, command.stderr).toBe(0)
  expect(JSON.parse(readFileSync(file, 'utf8')).status).toBe('qualified')
})

test('grading crash resumes complete raw output with stable attempts, original clocks and zero new calls', async () => {
  const f = fixture(), out = join(f.root, 'capture'); let fail = true
  const first = await collectQualifiedTiming(f.plan, f.sources, f.driver, input => { if (fail) { fail = false; throw Error('Injected observer crash after all raw capture') }; return f.observe(input) }, out)
  expect(first.qualification.status).toBe('unqualified')
  const original = new InvocationJournal(join(out, 'raw')).records(), count = readFileSync(f.calls, 'utf8')
  const resumed = await collectQualifiedTiming(f.plan, f.sources, { ...f.driver, async open() { throw Error('Regrading must never reopen a public renderer') } }, f.observe, out)
  expect(resumed.qualification.status).toBe('qualified')
  expect(new InvocationJournal(join(out, 'raw')).records()).toEqual(original)
  expect(readFileSync(f.calls, 'utf8')).toBe(count)
  expect(JSON.parse(readFileSync(first.bundleFile, 'utf8')).qualification.status).toBe('unqualified')
})

test('a renamed cached callback cannot claim a fresh runtime, and changed sources or warm tracks cannot invoke', async () => {
  const f = fixture(); let cachedCalls = 0
  const result = await collectQualifiedTiming(f.plan, f.sources, { ...f.driver, async open({ artifact }) { return { artifact, execution: { kind: 'cached-callback', handle: {} }, invoke() { cachedCalls++; return 'cached output' } } as any } }, f.observe, join(f.root, 'invalid-runtime'))
  expect(result.qualification.status).toBe('unqualified')
  expect(cachedCalls).toBe(0)
  await expect(collectQualifiedTiming(f.plan, f.sources.map((source, index) => index ? source : { ...source, source: 'changed source' }), f.driver, f.observe, join(f.root, 'changed'))).rejects.toThrow('frozen corpus')
  await expect(collectQualifiedTiming({ ...f.plan, track: 'warm' }, f.sources, f.driver, f.observe, join(f.root, 'warm'))).rejects.toThrow('first-use only')
  expect(f.opens()).toBe(0)
})

test('interrupted raw capture remains incomplete without rerunning or silently filling planned calls', async () => {
  const f = fixture(), out = join(f.root, 'partial'), journal = new InvocationJournal(join(out, 'raw')), contract = f.plan.cases[0]!, planSha256 = evidenceDigest(f.plan)
  journal.start({ ...f.plan.artifacts.A0, sourceSha256: contract.sourceSha256, caseId: contract.caseId, format: f.plan.format, coordinate: JSON.stringify([planSha256, 1, 'A0', contract.caseId, 0]) }, { planSha256, environmentSha256: f.plan.environmentSha256, boundary: f.plan.boundary, track: f.plan.track, clockDomainId: 'original-fixture-controller', executionInstanceId: 'original-fixture-worker', sequence: 0 })
  const recovered = await collectQualifiedTiming(f.plan, f.sources, f.driver, f.observe, out)
  expect(recovered.qualification.status).toBe('unqualified')
  expect(recovered.rawComplete).toBe(false)
  expect(f.opens()).toBe(0)
  expect(journal.records()).toHaveLength(1)
})


test('runtime close failures persist through grader-only recovery and keep timing withheld', async () => {
  const f = fixture(), out = join(f.root, 'close-error'), original = f.driver.open
  const driver: QualifiedTimingPublicDriver = { ...f.driver, async open(coordinate) {
    const opened = await original(coordinate)
    if (opened.execution.kind === 'node-worker') {
      const worker = opened.execution.handle, terminate = worker.terminate.bind(worker)
      worker.terminate = async () => { await terminate(); throw Error('Injected teardown receipt failure after actual Worker termination') }
    }
    return opened
  } }
  const first = await collectQualifiedTiming(f.plan, f.sources, driver, f.observe, out)
  expect(first.qualification.status).toBe('unqualified')
  expect(first.qualification.gaps.join(' ')).toContain('runtime-close')
  const resumed = await collectQualifiedTiming(f.plan, f.sources, { ...f.driver, async open() { throw Error('A grading replay cannot open a runtime') } }, f.observe, out)
  expect(resumed.qualification.status).toBe('unqualified')
  expect(resumed.qualification.gaps.join(' ')).toContain('teardown receipt failure')
})


test('the fixed six-round schedule balances every replica position on every source', () => {
  const f = fixture(), schedule = qualifiedTimingCoordinates(f.plan)
  for (const input of f.plan.cases) for (const replica of ['A0', 'A1', 'B']) {
    const positions = [0, 0, 0]
    for (let round = 1; round <= 6; round++) positions[schedule.filter(coordinate => coordinate.round === round && coordinate.caseId === input.caseId).findIndex(coordinate => coordinate.replica === replica)]!++
    expect(positions).toEqual([2, 2, 2])
  }
})
