import { expect, test } from 'bun:test'
import { Worker } from 'node:worker_threads'
import { once } from 'node:events'
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { collectQualifiedTiming, type QualifiedTimingPublicDriver, type ObserveTimedOutput } from '../portable/qualified-timing-collection.ts'
import { defineCaseEvidenceContract, evidenceBytesDigest as hash, evidenceDigest } from '../portable/evidence-contract.ts'
import { timingDriverFinalizationChecks, type TimingDriverFinalization } from '../portable/qualified-timing.ts'
import { deriveTimingGrading, timingJournalDigest } from '../portable/timing-grading.ts'
import { InvocationJournal } from '../portable/invocation-journal.ts'
import { qualifyRetainedTiming, qualifyRetainedTimingBundle } from '../unified/qualify-timing.ts'
import { useTempDirs } from './helpers/temp-dir.ts'

const temporary = useTempDirs('timing-driver-finalization-')
test('predeclared driver finalization cannot disappear, retain errors or borrow a different capture', async () => {
  const root = temporary.dir(), worker = join(root, 'worker.mjs'), source = 'literal lifecycle fixture', output = 'actual fixture return', contract = defineCaseEvidenceContract({ caseId: 'fixture:lifecycle', source, expectations: { output }, requiredChecks: [{ surface: 'fixture', criterion: 'literal' }] })
  writeFileSync(worker, `import {serveQualifiedTimingWorker} from ${JSON.stringify(new URL('../portable/qualified-timing-collection.ts', import.meta.url).href)};serveQualifiedTimingWorker(async()=>{await new Promise(r=>setTimeout(r,3));return ${JSON.stringify(output)}});`)
  const artifact = { project: 'fixture/reference', artifactSha256: hash('fixture reference'), bindingSha256: hash('actual Worker fixture binding') }, plan = { schema: 'trident-qualified-timing-plan-v1' as const, boundary: 'Synthetic lifecycle Worker fixture; not browser or renderer performance evidence', format: 'terminal' as const, track: 'first-use', environmentSha256: hash('fixture environment'), observerSha256: hash('fixture observer'), rounds: 6, samplesPerRound: 1, maximumControlSpread: 1000, cases: [contract], artifacts: { A0: artifact, A1: artifact, B: { ...artifact, project: 'fixture/candidate', artifactSha256: hash('fixture candidate') } }, driverFinalization: { protocol: 'browser-svg-first-use-v1' as const, producerSha256: hash('fixture driver finalization producer') } }
  const driver: QualifiedTimingPublicDriver = { context: { boundary: plan.boundary, format: plan.format, track: plan.track, environmentSha256: plan.environmentSha256, artifacts: plan.artifacts }, async open({ artifact, own }) { const handle = new Worker(worker); own({ kind: 'node-worker', handle }); await once(handle, 'message'); return { artifact, execution: { kind: 'node-worker', handle } } } }
  const observe: ObserveTimedOutput = ({ contract, bytes }) => ({ schema: 'trident-checked-evidence-v1', caseId: contract.caseId, sourceSha256: contract.sourceSha256, expectationsSha256: contract.expectationsSha256, outputSha256: hash(bytes), observerSha256: plan.observerSha256, checks: contract.requiredChecks.map(check => ({ ...check, status: bytes.toString() === output ? 'passed' : 'failed', detail: 'Exact independently authored fixture return' })) })
  const captured = await collectQualifiedTiming(plan, [{ caseId: contract.caseId, source }], driver, observe, join(root, 'capture'))
  expect(captured.qualification.status).toBe('unqualified')
  expect(qualifyRetainedTiming(captured.bundleFile)?.gaps.join(' ')).toContain('finalization receipt is missing')
  const directory = join(root, 'capture'), receiptFile = join(directory, 'driver-finalization.json'), frames = new InvocationJournal(join(directory, 'raw')).records()
  const receipt: TimingDriverFinalization = { schema: 'trident-timing-driver-finalization-v1', planSha256: evidenceDigest(plan), policySha256: evidenceDigest(plan.driverFinalization), captureProtocolSha256: evidenceDigest(captured.captureProtocol), journalSha256: timingJournalDigest(frames), checks: Object.fromEntries(timingDriverFinalizationChecks.map(check => [check, true])) as TimingDriverFinalization['checks'], status: 'passed', errors: [], completedAt: new Date().toISOString() }
  const save = (value: unknown) => writeFileSync(receiptFile, JSON.stringify(value))
  save(receipt)
  expect(qualifyRetainedTiming(captured.bundleFile)?.status).toBe('qualified')
  for (const changed of [
    { ...receipt, planSha256: hash('different plan') }, { ...receipt, policySha256: hash('different driver') },
    { ...receipt, captureProtocolSha256: hash('different schedule') }, { ...receipt, journalSha256: hash('different actual attempts') },
    { ...receipt, status: 'failed' }, { ...receipt, errors: ['Actual artifact drift after capture'] },
    { ...receipt, checks: { ...receipt.checks, cleanup: false } }, { ...receipt, checks: { ...receipt.checks, fonts: undefined } },
    { ...receipt, completedAt: 'not an actual timestamp' },
  ]) { save(changed); expect(qualifyRetainedTiming(captured.bundleFile)?.status).toBe('unqualified') }
  save(receipt)
  const altered = structuredClone(captured); delete altered.plan.driverFinalization
  expect(() => qualifyRetainedTimingBundle(altered, directory)).toThrow('predeclared plan')
  const grading = await deriveTimingGrading(plan, captured.samples, output => readFileSync(output.path), { schema: 'trident-derived-timing-grading-v1', collectionPlanSha256: evidenceDigest(plan), cases: [{ ...contract, expectationsSha256: hash('fresh fixture source interpretation'), requiredChecks: [...contract.requiredChecks, { surface: 'fixture', criterion: 'additional-fact' }] }], observerSha256: hash('fresh fixture observer'), reason: 'Freshly inspect retained bytes without another invocation', provenance: { source: 'independent fixture checker', sha256: hash('checker fixture') } }, ({ contract, invocation, bytes, observerSha256 }) => ({ schema: 'trident-checked-evidence-v1', caseId: contract.caseId, sourceSha256: contract.sourceSha256, expectationsSha256: contract.expectationsSha256, outputSha256: hash(bytes), observerSha256, checks: contract.requiredChecks.map(check => ({ ...check, status: bytes.toString() === output && invocation.output?.sha256 === hash(output) ? 'passed' : 'failed', detail: 'Fresh actual-byte fixture inspection' })) }), frames)
  expect(qualifyRetainedTimingBundle({ ...captured, grading }, directory)?.status).toBe('qualified')
  expect(new InvocationJournal(join(directory, 'raw')).records()).toEqual(frames)
  unlinkSync(receiptFile)
  expect(qualifyRetainedTimingBundle({ ...captured, grading }, directory)?.status).toBe('unqualified')
}, 30_000)

test('production driver failures after capture leave no qualified artifact or offline result', () => {
  for (const mode of ['artifact', 'cleanup', 'passed']) {
    const processResult = spawnSync(process.env.BUN_BIN ?? 'bun', [join(import.meta.dir, 'fixtures/timing/driver-finalization.ts'), mode], { encoding: 'utf8', timeout: 30_000 })
    expect(processResult.status, processResult.stderr).toBe(0)
    const result = JSON.parse(processResult.stdout.trim().split('\n').at(-1)!)
    expect(result.actualProjectCalls).toBe(0)
    expect(result.syntheticCalls).toBe(18)
    if (mode === 'passed') {
      expect(result.driverFailed).toBe(false)
      expect(result.finalizationStatus).toBe('passed')
      expect(result.offlineStatus).toBe('qualified')
      expect(result.storedStatuses).toContain('qualified')
    } else {
      expect(result.driverFailed).toBe(true)
      expect(result.finalizationStatus).toBe('failed')
      expect(result.offlineStatus).toBe('unqualified')
      expect(result.storedStatuses.every((status: string) => status === 'unqualified')).toBe(true)
      expect(result.finalizationChecks[mode === 'artifact' ? 'artifacts' : 'cleanup']).toBe(false)
    }
  }
}, 100_000)
