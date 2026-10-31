import { createHash } from 'node:crypto'
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { isAbsolute, join, relative } from 'node:path'
import manifest from '../corpus/mermaid-public-tests.json' with { type: 'json' }
import { qualifyPublicReference, reducePublicCallbacks, type PublicCallEvent } from './public-conformance.ts'
import type { PublicTestDeclaration } from './public-conformance-inventory.ts'
import type { SnapshotTable } from './results-snapshot.ts'

interface PublicTestTarget { project: string; version: string; planned: number; rows: ReturnType<typeof reducePublicCallbacks>; counts: Record<'passed' | 'failed' | 'unsupported' | 'blocked', number> }
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right)
/** Read-only reduction of original native callbacks. Summary counts and a saved
 * qualified flag cannot substitute for the owning reports and public calls. */
export function readPublicTestEvidence(directory: string) {
  const root = realpathSync(directory)
  const bytes = (name: string) => {
    const path = realpathSync(join(root, name)), own = relative(root, path)
    if (isAbsolute(own) || own === '..' || own.startsWith('../')) throw Error('Public-test evidence is outside its owning directory')
    return readFileSync(path)
  }
  const read = (name: string): any => JSON.parse(bytes(name).toString())
  const saved = read('public-conformance-report.json'), inventory = read('inventory.json'), context = read('context.json')
  const cases = manifest.eligible as PublicTestDeclaration[]
  const identity = (rows: readonly PublicTestDeclaration[]) => rows.map(row => [row.id, row.fullName, row.sourceSha256, row.callbackSha256, row.publicOperation])
  if (saved.result?.id !== 'public-conformance' || context.protocol !== manifest.protocol || inventory.protocol !== manifest.protocol || context.sourceCommit !== manifest.sourceCommit || inventory.sourceCommit !== manifest.sourceCommit || !same(identity(inventory.callbacks ?? []), identity(cases)) || !same(inventory.files, manifest.censusFiles) || !same(inventory.counts, manifest.counts) || !same(saved.inventory, manifest.counts)) throw Error('Public-test source, scope or declaration census differs from its frozen protocol')
  if (context.sourceConfigSha256 !== manifest.host.sourceConfigSha256 || context.runnerVersion !== manifest.host.runnerVersion || context.implementationSha256 !== manifest.publicBoundaries['packages/mermaid/src/mermaidAPI.ts'] || context.detectionSha256 !== manifest.publicBoundaries['packages/mermaid/src/diagram-api/detectType.ts'] || context.originalJsdomHelperSha256 !== manifest.host.jsdomHelper.sha256) throw Error('Original public boundary or jsdom host differs from the pinned source')
  const producers = Array.isArray(context.producers) ? context.producers.filter((row: unknown) => typeof row === 'string' && row.endsWith('\tunified/public-conformance-binding.mjs')) : []
  const producer = producers.length === 1 ? manifest.publicBindings.find(binding => binding.producer === producers[0]) : undefined
  if (!producer) throw Error('Public-test adapter producer differs from the qualified public boundary')
  const rawCapture = producer.rawCapture
  if (rawCapture === 'legacy-family-config-presence' ? context.rawCapture !== undefined : context.rawCapture?.protocol !== rawCapture) throw Error('Public-test raw capture metadata differs from its actual adapter producer')
  if (!Array.isArray(context.targets) || context.targets.some((target: any) => typeof target.binding?.project !== 'string' || !target.binding.project.trim() || typeof target.version !== 'string' || !target.version.trim()) || !context.targets.length || new Set(context.targets.map((target: any) => target.binding?.project)).size !== context.targets.length || !context.targets.some((target: any) => target.binding?.project === 'mermaid-js/mermaid' && target.binding.kind === 'mermaid-api')) throw Error('Public-test identities omit or duplicate the Mermaid reference')
  if (!saved.qualification?.qualified) {
    if (saved.targets?.length || saved.result.observations?.length || saved.result.status !== 'blocked') throw Error('Unqualified public-test controls cannot supply peer scores')
    return { saved, context, cases, rawCapture, qualification: { qualified: false, cases: cases.length, differences: [] }, targets: [] as PublicTestTarget[], scope: scopeName(cases) }
  }
  const receiptRows = (name: string, original = false) => {
    const receipt = read(name + '/receipt.json'), native = read(name + '/vitest.json')
    if (receipt.originalImplementationSha256 !== context.implementationSha256 || receipt.originalDetectorSha256 !== context.detectionSha256 || manifest.sourceSpecs.some(spec => receipt.originalSpecSha256?.[spec.path] !== spec.sha256)) throw Error('Public-test native receipt changed its original source')
    const callbacks = native.testResults?.flatMap((file: any) => file.assertionResults ?? []) ?? []
    const complete = !receipt.error && receipt.signal === null && [0, 1].includes(receipt.exitCode) && !(native.numUnhandledErrors ?? 0) && !native.unhandledErrors?.length && native.testResults?.every((file: any) => !file.message || file.assertionResults?.length)
    let events: PublicCallEvent[] = []
    if (!original && existsSync(join(root, name, 'calls.jsonl'))) {
      const text = bytes(name + '/calls.jsonl').toString()
      if (text && !text.endsWith('\n')) throw Error('Public-test invocation event stream is incomplete')
      events = text.trim().split('\n').filter(Boolean).map(line => JSON.parse(line))
      if (events.some(event => event.type === 'call-result' && (!['observed', 'unsupported', 'binding-unavailable'].includes(event.disposition ?? '') || !Array.isArray(event.missingFields) || event.missingFields.some(field => typeof field !== 'string')))) throw Error('Public-test invocation result has an unreviewed disposition or return contract')
      if (rawCapture === 'durable-public-return-json-v1') for (const event of events) {
        if (event.type !== 'call-result' || !cases.some(input => input.id === event.caseId && input.publicOperation === 'parse')) continue
        const values = [event.rawPublicReturn, event.rawPublicThrown].filter(value => value !== undefined)
        const raw: any = values[0]
        if (values.length !== 1 || raw?.protocol !== rawCapture || typeof raw.complete !== 'boolean' || (raw.complete ? !Object.hasOwn(raw, 'value') : typeof raw.loss !== 'string' || !raw.loss.trim() || raw.valueRetained !== false || Object.hasOwn(raw, 'value'))) throw Error('Public-test parse result omitted its actual return or explicit serialization loss')
      }
    }
    return reducePublicCallbacks(cases, callbacks, events, !!complete, original)
  }
  const original = receiptRows('original-control', true), reference = receiptRows('reference-public-binding')
  const qualification = qualifyPublicReference(cases, original, reference)
  if (!saved.qualification?.qualified || !qualification.qualified) return { saved, context, cases, rawCapture, qualification: { ...qualification, qualified: false }, targets: [], scope: scopeName(cases) }
  if (!Array.isArray(saved.targets) || saved.targets.length !== context.targets.length || new Set(saved.targets.map((target: any) => target.project)).size !== saved.targets.length) throw Error('Qualified public-test report omitted or duplicated a planned target')
  const targets: PublicTestTarget[] = context.targets.map((target: any) => {
    const project = target.binding.project, own = saved.targets.find((row: any) => row.project === project)
    const rows = project === 'mermaid-js/mermaid' ? reference : receiptRows(Buffer.from(project).toString('base64url'))
    const counts = Object.fromEntries(['passed', 'failed', 'unsupported', 'blocked'].map(status => [status, rows.filter(row => row.status === status).length])) as Record<'passed' | 'failed' | 'unsupported' | 'blocked', number>
    if (!own || own.version !== target.version || own.planned !== cases.length || !same(own.counts, counts) || !same(own.rows.map((row: any) => [row.caseId, row.status, row.callbackSha256]), rows.map(row => [row.caseId, row.status, row.callbackSha256]))) throw Error('Public-test summary differs from its raw callback evidence')
    const observations = saved.result.observations?.filter((row: any) => row.metrics?.project === project) ?? []
    if (observations.length !== rows.length || rows.some(row => observations.filter((observation: any) => observation.caseId === row.caseId && observation.status === row.status && observation.metrics?.originalCallbackSha256 === row.callbackSha256).length !== 1)) throw Error('Public-test observations omit, duplicate or contradict native callback outcomes')
    return { project, version: target.version as string, planned: cases.length, rows, counts }
  })
  return { saved, context, cases, rawCapture, qualification, targets, scope: scopeName(cases) }
}
function scopeName(cases: readonly PublicTestDeclaration[]) {
  return ['parse', 'detectType', 'render'].map(operation => cases.filter(input => input.publicOperation === operation).length + ' ' + ({ parse: 'parse', detectType: 'detection', render: 'accessibility render' } as Record<string, string>)[operation]).join('; ')
}
export function publicTestTables(directory: string, receipt: SnapshotTable['receipt'], updatedAt: string): SnapshotTable[] {
  const input = readPublicTestEvidence(directory)
  if (!input.qualification.qualified) return []
  const comparisonKey = digest({ protocol: manifest.protocol, sourceCommit: manifest.sourceCommit, callbacks: input.cases.map(row => [row.id, row.callbackSha256]), publicBoundaries: manifest.publicBoundaries, originalHost: manifest.host, runner: input.context.runnerVersion, sourceConfig: input.context.sourceConfigSha256, adapter: input.context.producers?.find((row: string) => row.endsWith('\tunified/public-conformance-binding.mjs')) })
  return [{
    id: 'public-tests-' + digest([receipt.sha256, comparisonKey]).slice(0, 24), suite: 'public-conformance', diagnostic: true, summary: true,
    measuredAt: input.saved.result.finishedAt, campaignUpdatedAt: updatedAt, historical: false, unit: 'original public test callbacks', cohort: manifest.protocol, comparisonKey, receipt,
    caption: `Diagnostic public API subset: ${input.cases.length} expanded callbacks from ${manifest.counts.eligibleDeclarations} eligible declarations; ${manifest.counts.declarations} original declarations in ${manifest.counts.files} files. Corpus: unchanged Mermaid tests at ${manifest.sourceCommit}. Original and delegated public Mermaid controls both pass every selected callback. Original assertions retain exact diagnostic wording, configuration expectations, accessibility roles and caller-ID conventions, including upstream jsdom geometry mocks. ${input.rawCapture === 'legacy-family-config-presence' ? 'These original v4 parse receipts retain family/configuration presence rather than complete returned configuration; the native assertions retain those verdicts.' : 'Public parse returns/configuration are snapshotted as JSON before assertions, with explicit loss for unserializable values; invocation events are fsynced. The uninstrumented original control retains native callback outcomes.'} This is strict API compatibility, not drawing accuracy, speed or whole-suite conformance. Binding gaps include unavailable public fields and incomplete invocation evidence. Unmeasured projects receive no zero.`,
    columns: ['Version', 'Passed', 'Failed', 'Unsupported', 'Binding gaps', 'Planned eligible', 'Public scope', 'Total declarations'],
    rows: input.targets.map(target => ({ project: target.project, values: [target.version, target.counts.passed, target.counts.failed, target.counts.unsupported, target.counts.blocked, target.planned, input.scope, manifest.counts.declarations], ...(target.counts.blocked === target.planned ? { unrankedReason: 'All planned callbacks have binding/evidence gaps' } : {}) })),
    population: { total: 'Planned eligible', outcomes: ['Passed', 'Failed', 'Unsupported', 'Binding gaps'] },
    ranking: { column: 'Passed', denominator: 'Planned eligible', direction: 'descending' }, overview: { numerator: 'Passed', denominator: 'Planned eligible', suffix: 'public callbacks passed' },
  }]
}
