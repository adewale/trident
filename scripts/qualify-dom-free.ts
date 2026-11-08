import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { planDigest } from '../unified/campaign-plan.ts'
import { atomicWrite } from '../unified/result-storage.ts'
import { byteDigest } from '../portable/artifacts.ts'
import { environmentSummary, type EnvironmentReceipt } from '../unified/mermaid-fidelity/environments.ts'
import { fidelityTargetIdentity } from '../unified/fidelity-control.ts'

/** Stack locations describe the reporter, not the failed operation or value.
 * Preserve unfamiliar errors and assertion diffs; never equate failures by count. */
export function failureObservation(message: string, upstream: string, runtime: string) {
  const lines = message.replaceAll(upstream, '<upstream>').replaceAll(runtime, '<runtime>').replace(/\u001b\[[0-9;]*m/g, '').split('\n')
  // Message payloads can themselves start with "at". Only a frame with a
  // recognizable source location may be discarded as reporter formatting.
  const location = String.raw`(?:file:///|node:|/|[A-Za-z]:[\\/]|<(?:upstream|runtime)>/)[^\n]+:\d+:\d+`
  const frame = new RegExp(String.raw`^\s+at (?:(?:async )?${location}|[^\n()]+ \((?:${location}|native)\))\s*$`)
  const isFrame = (line: string) => frame.test(line)
  const normalized = lines.filter(line => !isFrame(line)).join('\n').trim()
  const kind = /^(?:Error: )?Unsupported candidate operation:/.test(normalized) ? 'unsupported' : /^(?:Error: )?TRIDENT_ADAPTER_GAP\b/.test(normalized) ? 'adapter-gap' : /^AssertionError:/.test(normalized) ? 'assertion' : 'unclassified'
  // The reducer distinguishes Trident programming errors from candidate faults
  // using the first frame. Keep that origin while ignoring its line/column.
  const origin = /^(?:TypeError|ReferenceError|RangeError):/.test(normalized) ? lines.find(isFrame)?.replace(/:\d+:\d+(?=\)?\s*$)/, '') : undefined
  const stack = kind === 'unclassified' ? lines.filter(isFrame).map(line => line.trim().replace(/:\d+:\d+(?=\)?\s*$)/, '')) : undefined
  return { kind, message: normalized, ...(origin ? { origin: origin.trim() } : {}), ...(stack ? { stack } : {}) }
}

type Run = { job: any; native: any; audit: any[]; environments: EnvironmentReceipt[] }
/** Compare callback identity, outcomes and all semantic audit dispositions.
 * Equal pass counts alone cannot qualify a cheaper execution environment. */
export function qualifyDomFree(baseline: Iterable<Run>, alternate: Iterable<Run>, commit: string) {
  const alternatives = alternate[Symbol.iterator]()
  let controlIdentity = '', files: string[] = []
  const targets: Record<string, string> = {}, targetFiles: Record<string, string[]> = {}, fingerprints: Record<string, unknown> = {}, environments: Record<string, unknown> = {}, environmentRequirements: Record<string, unknown> = {}
  let equal = new Set<string>()
  for (const base of baseline) {
    const other = alternatives.next().value as Run | undefined
    if (!other || other.job.target.project !== base.job.target.project || targets[base.job.target.project]) throw Error('Both profiles require the same unique candidate cohort in project order')
    if (!controlIdentity) {
      controlIdentity = base.job.controlIdentity
      if (!/^[a-f0-9]{64}$/.test(controlIdentity)) throw Error('Missing control identity')
      files = base.job.files.map((file: any) => file.path)
      equal = new Set(files)
    }
    if (base.job.pin !== commit || other.job.pin !== commit || base.job.controlIdentity !== controlIdentity || other.job.controlIdentity !== controlIdentity || JSON.stringify(base.job.files.map((file: any) => file.path)) !== JSON.stringify(files) || JSON.stringify(other.job.files.map((file: any) => file.path)) !== JSON.stringify(files) || fidelityTargetIdentity(base.job.target) !== fidelityTargetIdentity(other.job.target)) throw Error('Profile runs differ in frozen inputs, harness, artifacts or selection')
    if (base.job.files.some((file: any) => file.environment === 'node') || other.job.files.some((file: any) => file.environment !== 'node')) throw Error('Compare an explicit jsdom baseline with an explicit node run')
    const project = base.job.target.project
    targets[project] = fidelityTargetIdentity(base.job.target)
    targetFiles[project] = []
    const normalizeEnvironments = (run: Run) => [...run.environments].map(receipt => ({ ...receipt, file: receipt.file.replaceAll(run.job.upstream, '<upstream>') })).sort((a, b) => a.file.localeCompare(b.file))
    environments[project] = { jsdom: { ...environmentSummary(base.job.files, base.environments), sha256: planDigest(normalizeEnvironments(base)) }, node: { ...environmentSummary(other.job.files, other.environments), sha256: planDigest(normalizeEnvironments(other)) } }
    const observe = (run: Run, file: string) => {
      const absolute = join(run.job.upstream, file), suites = run.native?.testResults?.filter((suite: any) => suite.name === absolute), suite = suites?.length === 1 ? suites[0] : undefined
      if (run.environments.filter(receipt => receipt.file === absolute).length !== 1) {
        // Vitest deliberately gives an upstream file directive precedence over
        // a project environment. The startup guard rejects that as a Node run.
        // This is a reviewed requirement, never evidence of Node execution.
        const mismatch = `TRIDENT_RUNNER_ENVIRONMENT: ${absolute}: expected node; window=object, document=object`
        if (suite?.status === 'failed' && suite.assertionResults?.length === 0 && suite.message === mismatch && existsSync(absolute) && /^\s*\/\/\s*@vitest-environment\s+jsdom\s*$/m.test(readFileSync(absolute, 'utf8'))) {
          const requirement = { environment: 'jsdom', sourceSha256: byteDigest(absolute), reason: 'Original file explicitly requires JSDOM; the attempted Node configuration was rejected before imports' }
          environmentRequirements[file] = requirement
          return planDigest({ disposition: 'environment-required', file, ...requirement })
        }
        return undefined
      }
      if (!suite || !Array.isArray(suite.assertionResults)) return undefined
      const audit = run.audit.filter(row => row.file === absolute).map(({ index, name, fullName, calls, rejections, gaps, unsupported, faults, expectedFailure, protocol }) => ({ index, name, fullName, calls, rejections, gaps, unsupported, faults, expectedFailure, protocol })).sort((a, b) => a.index - b.index)
      if (!suite.assertionResults.length) {
        // An empty observation is no proof. Vitest must report the selected
        // file's completed collection failure, with a recognized disposition.
        // Equal failures qualify only the cheaper scheduling of that failure;
        // they confer no semantic credit or invented callback observations.
        const message = String(suite.message ?? '').replaceAll(run.job.upstream, '<upstream>').replaceAll(run.job.runtime, '<runtime>')
        if (suite.status !== 'failed' || !message || audit.length) return undefined
        return planDigest({ disposition: 'collection-failed', file, failure: failureObservation(message, run.job.upstream, run.job.runtime) })
      }
      if (new Set(audit.map(row => JSON.stringify([row.index, row.name]))).size !== audit.length) return undefined
      const callbacks = suite.assertionResults.map((test: any, index: number) => ({ index, name: test.fullName, status: test.status, failures: (test.failureMessages ?? []).map((message: string) => failureObservation(message, run.job.upstream, run.job.runtime)) }))
      if (callbacks.some((test: any) => !['pending', 'todo', 'skipped'].includes(test.status) && !audit.some(row => row.index === test.index && (row.fullName ?? row.name.replaceAll(' > ', ' ')) === test.name))) return undefined
      const collection = { status: suite.status, failure: failureObservation(String(suite.message ?? ''), run.job.upstream, run.job.runtime) }
      return planDigest({ collection, callbacks, audit })
    }
    fingerprints[project] = Object.fromEntries(files.map(file => {
      const left = observe(base, file), right = observe(other, file)
      if (!left || left !== right) equal.delete(file)
      else targetFiles[project]!.push(file)
      return [file, { jsdom: left ?? null, node: right ?? null }]
    }))
  }
  if (!controlIdentity || !alternatives.next().done) throw Error('Both profiles require the same candidate cohort')
  const common = files.filter(file => equal.has(file))
  const additionalFiles = Object.fromEntries(Object.entries(targetFiles).map(([project, qualified]) => [project, qualified.filter(file => !equal.has(file))]))
  return { protocol: 'dom-free-qualification-v3', qualifierSha256: byteDigest(import.meta.filename), commit, controlIdentity, targets, additionalFiles, environments, environmentRequirements, files: common, fingerprints }
}

export function* readRuns(root: string): Generator<Run> {
  const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'))
  for (const entry of readdirSync(root, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory() || !existsSync(join(root, entry.name, 'job.json'))) continue
    const directory = join(root, entry.name), job = read(join(directory, 'job.json'))
    if (job.target.tool === 'mermaid') continue
    const lines = (name: string) => existsSync(join(directory, name)) ? readFileSync(join(directory, name), 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line)) : []
    yield { job, native: read(join(directory, 'vitest.json')), audit: lines('audit.jsonl'), environments: lines('environments.jsonl') }
  }
}
if (import.meta.main) {
  const [baseline, alternate, commit, out] = process.argv.slice(2)
  if (!baseline || !alternate || !commit || !out || existsSync(out)) throw Error('qualify-dom-free JSDOM_RUN NODE_RUN COMMIT FRESH_OUTPUT.json')
  const qualification = qualifyDomFree(readRuns(baseline), readRuns(alternate), commit)
  atomicWrite(out, JSON.stringify(qualification, null, 2) + '\n')
  console.log(qualification.files.length + ' files qualified for ' + Object.keys(qualification.targets).length + ' frozen candidate bindings')
}
