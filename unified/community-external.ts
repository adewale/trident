import { InvocationJournal } from '../portable/invocation-journal.ts'
import { evidenceBytesDigest, evidenceDigest, type InvocationEvidence, type InvocationIdentity } from '../portable/evidence-contract.ts'
import { recoverExternalInvocations } from './external-invocations.ts'
import { checkCollectionBudget } from '../portable/checkpoint.ts'
import { randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'
import type { PreparedCommunity } from './community-types.ts'
import type { BenchmarkObservation, UnifiedRunOptions, UnifiedWorkload } from './types.ts'
import { assertCommunityNotInterrupted, trackCommunityProcess } from './community-process.ts'

/** Native worker API clocks stay separate from cold CLI process clocks. */
export async function runExternalCommunity(prepared: PreparedCommunity, workloads: UnifiedWorkload[], output: string, round: number, options: UnifiedRunOptions): Promise<BenchmarkObservation[]> {
  const rows: BenchmarkObservation[] = [],
    root = join(options.out, 'community-raw')
  mkdirSync(root, { recursive: true })
  for (const core of [true, false]) {
    const selected = workloads.filter(w => w.features.includes('core-graph-batch') === core)
    if (!selected.length) continue
    const name = prepared.node.id.replace(/[^a-z0-9._-]/gi, '_') + `-${output}-r${round}-${core ? 'core' : 'features'}`,
      artifact = prepared.artifact!,
      results = new Map<string, Record<string, unknown>>(),
      attempts: unknown[] = [],
      artifactSha256 = artifact.sha256 ?? evidenceDigest(JSON.parse(JSON.stringify({ version: artifact.version, files: artifact.files, executable: artifact.executable }))),
      bindingSha256 = evidenceDigest({ output, kind: artifact.kind, args: artifact.args ?? [], worker: evidenceBytesDigest(readFileSync(artifact.kind === 'python' ? join(dirname(fileURLToPath(import.meta.url)), 'community-python-worker.py') : artifact.executable!)) }),
      identities = new Map<string, InvocationIdentity>(selected.map(w => [w.id, { project: prepared.node.id, caseId: w.id, sourceSha256: evidenceBytesDigest(w.source), artifactSha256, bindingSha256, format: output }])),
      journal = new InvocationJournal(join(root, name + '.invocations'))
    let remaining = selected,
      lastDetail: string | undefined
    for (let attempt = 1; remaining.length && attempt <= 8; attempt++) {
      checkCollectionBudget(options.collectionDeadline)
      lastDetail = undefined
      const stem = name + `-a${attempt}`,
        job = join(root, stem + '.job.json'),
        result = join(root, stem + '.jsonl')
      writeFileSync(job, JSON.stringify({ output, invocationRunId: randomUUID(), retainOutputWitness: output === 'terminal' && selected.some(w => w.features.includes('retain-output-witness')), frozenPython: artifact.kind === 'python' ? { version: artifact.version, files: artifact.files } : undefined, coverageOnly: !core && (options.communityCoverageOnce ?? true), timing: { warmCalls: core ? 3 : 1, warmupMs: core ? 50 : 0, minSampleMs: core ? 10 : 0, maxCaseMs: 10_000, samples: core ? 5 : 3 }, workloads: remaining.map(w => ({ id: w.id, source: w.source, expected: w.expectedLabels ?? [], intent: w.intent, features: w.features, invocationIdentity: identities.get(w.id) })) }))
      const command = artifact.kind === 'python' ? [artifact.python ?? artifact.executable!, join(dirname(fileURLToPath(import.meta.url)), 'community-python-worker.py'), job, result] : [artifact.executable!, ...(artifact.args ?? []), job, result]
      let text = '',
        stderr = '',
        progressCount = 0,
        lastProgress = performance.now(),
        timedOut = false
      let rawFrames: Readonly<InvocationEvidence>[] = []
      const readProgress = () => {
        rawFrames = recoverExternalInvocations(result, identities, journal)
        if (!existsSync(result)) return
        const lines = readFileSync(result, 'utf8').split('\n')
        // The last line may still be in flight. Only newline-complete records count.
        lines.pop()
        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const value = JSON.parse(line) as Record<string, unknown>
            if (remaining.some(workload => workload.id === value.workload)) {
              const frame = rawFrames.find(frame => frame.identity.caseId === value.workload && (typeof value.invocationId === 'string' ? frame.attemptId === value.invocationId : frame.state !== 'started'))
              results.set(value.workload as string, frame ? { ...value, invocationId: frame.attemptId, outputFile: frame.output?.path, firstMs: frame.durationMs, measuredAt: frame.finishedAt, workerAttempt: attempt } : { status: 'blocked', detail: 'Worker reported a grade without a matching durable raw invocation', measuredAt: null, workerAttempt: attempt })
            }
          } catch {
            /* A malformed completed record cannot qualify a case. */
          }
        }
        const count = remaining.filter(workload => results.has(workload.id)).length
        if (count !== progressCount) {
          progressCount = count
          lastProgress = performance.now()
        }
      }
      const recoverStopped = () => {
        for (const workload of remaining) {
          if (results.has(workload.id)) continue
          const frames = rawFrames.filter(frame => frame.identity.caseId === workload.id), frame = frames.find(frame => frame.state !== 'started') ?? frames[0]
          if (!frame) continue
          results.set(workload.id, { status: 'blocked', detail: 'Raw invocation recovered without a completed qualification; no renderer retry or correctness is inferred', outputFile: frame.output?.path, invocationId: frame.attemptId, firstMs: frame.durationMs, measuredAt: frame.finishedAt, workerAttempt: attempt })
        }
      }
      readProgress(); recoverStopped()
      remaining = remaining.filter(workload => !results.has(workload.id))
      if (!remaining.length) break
      const pendingJob = JSON.parse(readFileSync(job, 'utf8')); pendingJob.workloads = pendingJob.workloads.filter((workload: { id: string }) => remaining.some(w => w.id === workload.id)); writeFileSync(job, JSON.stringify(pendingJob))
      assertCommunityNotInterrupted()
      const child = spawn(command[0]!, command.slice(1), { detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] })
      trackCommunityProcess(child)
      child.stdout?.on('data', chunk => {
        text = (text + String(chunk)).slice(-2_000_000)
      })
      child.stderr?.on('data', chunk => {
        stderr = (stderr + String(chunk)).slice(-2_000_000)
      })
      const monitor = setInterval(() => {
        readProgress()
        const limit = progressCount === remaining.length ? 10_000 : progressCount ? 30_000 : 120_000
        if (performance.now() - lastProgress <= limit) return
        timedOut = true
        lastDetail = `External worker made no completed-case progress for ${limit}ms`
        try {
          if (process.platform !== 'win32' && child.pid) process.kill(-child.pid, 'SIGKILL')
          else child.kill('SIGKILL')
        } catch {}
      }, 100)
      const code = await new Promise<number | null>(done => {
        child.once('error', error => {
          lastDetail = String(error)
        })
        child.once('close', done)
      })
      clearInterval(monitor)
      readProgress()
      recoverStopped()
      writeFileSync(join(root, stem + '.log'), text + stderr)
      attempts.push({ attempt, code, timedOut, completedCases: progressCount, detail: lastDetail })
      const unresolved = remaining.filter(workload => !results.has(workload.id))
      if (!unresolved.length) {
        remaining = []
        break
      }
      if (code === 0) {
        lastDetail ??= 'Worker exited without reporting all cases'
        remaining = unresolved
        break
      }
      // Workers process the supplied inputs in order; retain completed JSONL and
      // assign the stopped current case before restarting untouched cases. JSONL
      // transports may be waiting for acknowledgement: without a completed row,
      // process exit alone cannot attribute a renderer failure to that input.
      const stopped = unresolved[0]!
      results.set(stopped.id, { status: 'blocked', detail: lastDetail ?? `Worker stopped during this case (exit ${code}): ${stderr.slice(-1500)}`, workerAttempt: attempt })
      remaining = unresolved.slice(1)
    }
    writeFileSync(join(root, name + '-attempts.json'), JSON.stringify(attempts, null, 2))
    for (const w of selected) {
      const r = results.get(w.id),
        status = r?.status === 'ok' || r?.status === 'passed' ? 'passed' : r?.status === 'blocked' || !r ? 'blocked' : 'failed'
      rows.push({
        suite: 'community',
        surface: artifact.kind === 'python' ? 'python:public-api' : 'native:in-process-api',
        runtime: artifact.runtime ?? artifact.kind,
        family: w.family,
        caseId: w.id,
        operation: 'render',
        format: output,
        mode: core ? 'core-api-repeat' : (options.communityCoverageOnce ?? true) ? 'feature-corpus-qualification' : 'feature-corpus-attempt',
        status,
        samplesMs: !core && (options.communityCoverageOnce ?? true) ? undefined : r?.samplesMs as number[] | undefined,
        bytes: r?.outputBytes as number | undefined,
        detail: (r?.detail as string | undefined) ?? lastDetail ?? (remaining.length ? 'External worker restart limit exhausted; completed rows are retained' : undefined),
        metrics: {
          implementation: prepared.node.id,
          measuredAt: typeof r?.measuredAt === 'string' ? r.measuredAt : null,
          measuredFrom: null,
          invocationId: typeof r?.invocationId === 'string' ? r.invocationId : null,
          invocationDirectory: journal.directory,
          version: artifact.version,
          ...(typeof r?.outputFile === 'string' ? { outputFile: r.outputFile } : typeof r?.png === 'string' ? { outputFile: r.png } : {}),
          round,
          workerAttempt: (r?.workerAttempt as number) ?? null,
          firstMs: (r?.firstMs as number) ?? null,
          sampleIterations: r?.sampleIterations ? JSON.stringify(r.sampleIterations) : null,
          timingQualified: false,
          timingProtocol: (r?.timingProtocol as string | undefined) ?? null,
          rejected: r?.status === 'unsupported' ? true : typeof r?.rejected === 'boolean' ? r.rejected : null,
          pngReturned: r?.pngReturned === true,
          failureStage: (r?.failureStage as string) ?? null,
          qualification: (r?.qualificationScope as string | undefined) ?? (w.expectedLabels?.length ? 'declared-labels' : 'artifact-envelope-only'),
          boundary: 'native public API; executable startup excluded',
        },
      })
    }
  }
  return rows
}
