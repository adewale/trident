import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { planDigest } from '../unified/campaign-plan.ts'
import { atomicWrite } from '../unified/result-storage.ts'
import { byteDigest } from '../portable/artifacts.ts'

type Run = { job: any; native: any; audit: any[] }
/** Compare callback identity, outcomes and all semantic audit dispositions.
 * Equal pass counts alone cannot qualify a cheaper execution environment. */
export function qualifyDomFree(baseline: Iterable<Run>, alternate: Iterable<Run>, commit: string) {
  const alternatives = alternate[Symbol.iterator]()
  let controlIdentity = '', files: string[] = []
  const targets: Record<string, string> = {}, fingerprints: Record<string, unknown> = {}
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
    if (base.job.pin !== commit || other.job.pin !== commit || base.job.controlIdentity !== controlIdentity || other.job.controlIdentity !== controlIdentity || JSON.stringify(base.job.files.map((file: any) => file.path)) !== JSON.stringify(files) || JSON.stringify(other.job.files.map((file: any) => file.path)) !== JSON.stringify(files) || planDigest(base.job.target) !== planDigest(other.job.target)) throw Error('Profile runs differ in frozen inputs, harness, artifacts or selection')
    if (base.job.files.some((file: any) => file.environment === 'node') || other.job.files.some((file: any) => file.environment !== 'node')) throw Error('Compare an explicit jsdom baseline with an explicit node run')
    const project = base.job.target.project
    targets[project] = planDigest(base.job.target)
    const observe = (run: Run, file: string) => {
      const absolute = join(run.job.upstream, file), suite = run.native?.testResults?.find((suite: any) => suite.name === absolute)
      if (!suite?.assertionResults?.length) return undefined
      const audit = run.audit.filter(row => row.file === absolute).map(({ index, name, calls, rejections, gaps, unsupported, faults, expectedFailure, protocol }) => ({ index, name, calls, rejections, gaps, unsupported, faults, expectedFailure, protocol })).sort((a, b) => a.index - b.index)
      if (new Set(audit.map(row => JSON.stringify([row.index, row.name]))).size !== audit.length) return undefined
      const callbacks = suite.assertionResults.map((test: any, index: number) => ({ index, name: test.fullName, status: test.status, failures: (test.failureMessages ?? []).map((message: string) => message.replaceAll(run.job.upstream, '<upstream>').replaceAll(run.job.runtime, '<runtime>')) }))
      if (callbacks.some((test: any) => !['pending', 'todo', 'skipped'].includes(test.status) && !audit.some(row => row.index === test.index && row.name.replaceAll(' > ', ' ') === test.name))) return undefined
      return planDigest({ callbacks, audit })
    }
    fingerprints[project] = Object.fromEntries(files.map(file => {
      const left = observe(base, file), right = observe(other, file)
      if (!left || left !== right) equal.delete(file)
      return [file, { jsdom: left ?? null, node: right ?? null }]
    }))
  }
  if (!controlIdentity || !alternatives.next().done) throw Error('Both profiles require the same candidate cohort')
  return { protocol: 'dom-free-qualification-v1', qualifierSha256: byteDigest(import.meta.filename), commit, controlIdentity, targets, files: files.filter(file => equal.has(file)), fingerprints }
}

function* readRuns(root: string): Generator<Run> {
  const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'))
  for (const entry of readdirSync(root, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory() || !existsSync(join(root, entry.name, 'job.json'))) continue
    const directory = join(root, entry.name), job = read(join(directory, 'job.json'))
    if (job.target.tool === 'mermaid') continue
    yield { job, native: read(join(directory, 'vitest.json')), audit: readFileSync(join(directory, 'audit.jsonl'), 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line)) }
  }
}
if (import.meta.main) {
  const [baseline, alternate, commit, out] = process.argv.slice(2)
  if (!baseline || !alternate || !commit || !out || existsSync(out)) throw Error('qualify-dom-free JSDOM_RUN NODE_RUN COMMIT FRESH_OUTPUT.json')
  const qualification = qualifyDomFree(readRuns(baseline), readRuns(alternate), commit)
  atomicWrite(out, JSON.stringify(qualification, null, 2) + '\n')
  console.log(qualification.files.length + ' files qualified for ' + Object.keys(qualification.targets).length + ' frozen candidate bindings')
}
