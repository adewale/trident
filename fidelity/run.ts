import { checkCollectionBudget } from '../portable/checkpoint.ts'
import { writeBenchmarkDocument } from '../portable/project-records.ts'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { admitCurrentReference } from '../reference/source.ts'
import { captureInstalledDependencyClosure } from '../portable/artifact-dependencies.ts'
import { assertBenchmarkExecutionAllowed } from '../ci-policy.ts'
import { assertBenchmarkSetVersions, benchmarkToolPins } from '../tool-versions.ts'
import { baselineMeasurementContext } from '../unified/baseline-measurement-context.ts'
import { deliveredArtifactIdentity } from '../unified/benchmark-context.ts'
import { runRetainedSuite } from '../unified/retained-suite.ts'
import type { BenchmarkObservation, UnifiedRunOptions, UnifiedSuiteResult } from '../unified/types.ts'
import { createMeaningAdapter, type MeaningTool } from './adapters.ts'
import { fidelityCoreProjects as projects, selectsCoreFidelity } from './selection.ts'
import { expandedFidelityCases } from './cases.ts'
export { expandedFidelityCases } from './cases.ts'
import { planFidelityCriteria, completeCriterionLedger, compareFidelityCriteria } from './ledger.ts'
import { assessMeaning, assessPrelude } from './meaning.ts'
import { mermaidOracleDirectory, mermaidUpstreamDirectory } from '../portable/mermaid-oracle.ts'

export interface FidelityRunOptions extends UnifiedRunOptions { fidelityDiagnostic?: boolean; fidelityCaseIds?: string[] }
const write = (path: string, value: unknown) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n')
const packageNames: Record<MeaningTool, string> = { agentic: 'agentic-mermaid', pele: 'pele', mermaid: 'mermaid' }

/** Model contracts use public Node APIs only. SVG collection belongs to the
 * shared renderer collector; serializer-specific product checks belong upstream. */
export async function runFidelityCampaign(options: FidelityRunOptions): Promise<UnifiedSuiteResult> {
  assertBenchmarkExecutionAllowed()
  const startedAt = new Date().toISOString(), root = options.harnessRoot ?? options.root, out = options.out
  if (!selectsCoreFidelity(options.communityProjects)) return { id: 'mermaid-fidelity', startedAt, finishedAt: startedAt, status: 'not-applicable', observations: [], artifacts: [], gaps: ['No core public-model project was selected; no source, reference, runtime or output directory was prepared.'] }
  mkdirSync(out, { recursive: true })
  const reference = options.referenceDir ?? mermaidOracleDirectory(), upstream = options.mermaidDir ?? mermaidUpstreamDirectory()
  const sourcePin = admitCurrentReference(upstream, reference)
  const targets: Array<{ tool: MeaningTool; project: string; packageRoot: string; version: string }> = []
  for (const tool of ['mermaid', 'agentic', 'pele'] as const) {
    const project = projects[tool]
    if (options.communityProjects && !options.communityProjects.includes(project)) continue
    const packageRoot = tool === 'mermaid' ? join(reference, 'node_modules/mermaid') : tool === 'agentic' ? options.packageRoot ?? root : options.portableArtifactRoot ?? join(root, `node_modules/.cache/unified-community/pele@${benchmarkToolPins['obsidianmd/pele'].version}/node_modules/pele`)
    const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))
    if (manifest.name !== packageNames[tool]) throw Error('Wrong actual installed package for ' + project + ': ' + manifest.name)
    targets.push({ tool, project, packageRoot: resolve(packageRoot), version: manifest.version })
  }
  const addonRoot = options.fidelityZenumlRoot ?? process.env.MERMAID_ZENUML_BENCHMARK_ROOT
  const addon = addonRoot ? { root: resolve(addonRoot), manifest: JSON.parse(readFileSync(join(addonRoot, 'package.json'), 'utf8')) } : undefined
  if (addon && addon.manifest.name !== '@mermaid-js/mermaid-zenuml') throw Error('Wrong declared ZenUML reference backend package')
  const toolVersions = assertBenchmarkSetVersions([...targets.map(target => ({ tool: target.project, version: target.version, source: join(target.packageRoot, 'package.json') })), ...(addon ? [{ tool: addon.manifest.name, version: addon.manifest.version, source: join(addon.root, 'package.json') }] : [])])
  const allCases = expandedFidelityCases()
  if (new Set(allCases.map(value => value.id)).size !== allCases.length) throw Error('Duplicate authored fidelity case identity')
  const unknownCases = options.fidelityCaseIds?.filter(id => !allCases.some(value => value.id === id))
  if (unknownCases?.length) throw Error('Unknown authored fidelity cases: ' + unknownCases.join(', '))
  const selectedCases = allCases.filter((value, index) => options.fidelityCaseIds ? options.fidelityCaseIds.includes(value.id) : options.profile !== 'smoke' || allCases.findIndex(candidate => candidate.family === value.family) === index)
  if (!selectedCases.length) throw Error('No authored fidelity cases selected')
  const planned = planFidelityCriteria(selectedCases).filter(item => item.surface === 'native-public-api')
  const node = options.nodeExecutable ?? process.execPath, results: UnifiedSuiteResult[] = []
  for (const target of targets) {
    const projectOut = join(out, Buffer.from(target.project).toString('base64url'))
    const measure = async (directory: string): Promise<UnifiedSuiteResult> => {
      const began = new Date().toISOString(), observations: BenchmarkObservation[] = [], rows: unknown[] = [], collectionErrors: string[] = []
      mkdirSync(directory, { recursive: true })
      const adapter = await createMeaningAdapter({ tool: target.tool, packageRoot: target.packageRoot, ...(target.tool === 'mermaid' ? { referenceRoot: reference, zenumlRoot: addon?.root } : {}) })
      for (const testCase of selectedCases) {
        checkCollectionBudget(options.collectionDeadline)
        const add = (criterion: string, status: string, actual: unknown, expected: unknown, scope: string) => observations.push({ suite: 'mermaid-fidelity', surface: 'native-public-api', runtime: `${process.versions.bun ? 'Bun ' + process.versions.bun : 'Node ' + process.versions.node}:public-model-host`, family: testCase.family, caseId: testCase.id + ':' + criterion, operation: criterion, format: 'structured', mode: 'independent-authored-criteria', status: status === 'unavailable' ? 'blocked' : status === 'rejected' ? 'failed' : status as BenchmarkObservation['status'], detail: scope, metrics: { implementation: target.project, criterion, authoredCase: testCase.id, required: testCase.required, expected: JSON.stringify(expected ?? null), actual: JSON.stringify(actual ?? null), scope } })
        try {
          for (const [index, prelude] of (testCase.prelude ?? []).entries()) {
            const result = await adapter.parse(prelude.source, testCase.family)
            add('prelude-' + index, assessPrelude(prelude.accept, result.status), result.status, prelude.accept ? 'native admission' : 'native non-admission', result.scope)
          }
          const acquired = await adapter.parse(testCase.source, testCase.family), meaning = assessMeaning(testCase, acquired.meaning)
          add('native-admission', acquired.status === 'accepted' ? 'passed' : acquired.status, acquired.error ?? acquired.scope, 'native public meaning', acquired.scope)
          for (const item of meaning.checks) add(item.criterion, acquired.meaning ? item.status : acquired.status === 'unsupported' ? 'unsupported' : acquired.status === 'rejected' ? 'failed' : 'unavailable', item.actual, item.expected, acquired.meaning ? item.scope : acquired.scope + ': ' + (acquired.error ?? 'No native projection'))
          rows.push({ caseId: testCase.id, family: testCase.family, required: testCase.required, source: testCase.source, provenance: testCase.provenance, native: { status: acquired.status, entry: adapter.entry, meaning: acquired.meaning, error: acquired.error, scope: acquired.scope, checks: meaning.checks } })
        } catch (error) { collectionErrors.push(testCase.id + ': ' + String(error)); rows.push({ caseId: testCase.id, collectionError: String(error) }) }
      }
      const completed = completeCriterionLedger(planned, observations, target.project)
      write(join(directory, 'fidelity-cases.json'), { target, sourcePin, rows, scope: 'Public Node model contracts only; no SVG rendering or AM serializer workflows.' })
      return { id: 'mermaid-fidelity', startedAt: began, finishedAt: new Date().toISOString(), status: completed.some(row => row.status === 'failed') ? 'failed' : completed.some(row => ['blocked', 'unsupported'].includes(row.status)) ? 'blocked' : 'passed', observations: completed, artifacts: ['fidelity-cases.json'], gaps: ['Authored public-model contracts do not establish painted drawing correctness.', ...collectionErrors] }
    }
    const result = options.fidelityDiagnostic ? await measure(projectOut) : await runRetainedSuite({ out: projectOut, records: options.benchmarkRecordStore ?? join(out, 'records'), force: options.benchmarkForce, identity: () => ({ project: target.project, lane: 'public-model-contracts-v2', protocol: { sourcePin: admitCurrentReference(upstream, reference), cases: selectedCases, context: baselineMeasurementContext(root, node, ['fidelity/run.ts', 'fidelity/worker.mjs', 'unified/fidelity-suite.ts']) }, artifact: { target, dependencies: captureInstalledDependencyClosure(target.packageRoot), referenceHost: captureInstalledDependencyClosure(reference), delivered: deliveredArtifactIdentity(join(target.packageRoot, 'dist'), true), ...(addon ? { addon: captureInstalledDependencyClosure(addon.root) } : {}) }, measurement: { publicModelHost: { executable: process.execPath, versions: process.versions }, mode: 'Public Node model contracts only; no rendering or latency samples' } }), measure })
    results.push(result)
  }
  const observations = results.flatMap(result => result.observations)
  const report = { id: 'mermaid-fidelity', status: results.some(result => result.status === 'failed') ? 'failed' : results.some(result => result.status === 'blocked') ? 'blocked' : 'passed', startedAt, finishedAt: new Date().toISOString(), observations, artifacts: results.flatMap(result => result.artifacts ?? []), gaps: [...new Set(results.flatMap(result => result.gaps))], toolVersions, calibration: compareFidelityCriteria(observations, targets.map(target => target.project)), criteriaProtocol: { mode: 'public-model-contracts-v2', planned }, cases: selectedCases, targets, sourcePin }
  writeBenchmarkDocument(join(out, 'fidelity-report.json'), report)
  return report as UnifiedSuiteResult
}

if (import.meta.main) {
  const values = new Map<string, string>(), flags = new Set<string>()
  for (let index = 2; index < process.argv.length; index++) { const key = process.argv[index]!.replace(/^--/, ''); if (['diagnostic', 'force'].includes(key)) flags.add(key); else values.set(key, process.argv[++index]!) }
  const root = values.get('root') ?? resolve(fileURLToPath(new URL('../../..', import.meta.url)))
  const result = await runFidelityCampaign({ root, out: resolve(values.get('out')!), profile: values.get('profile') === 'smoke' ? 'smoke' : 'full', rounds: 1, harnessRoot: root, packageRoot: values.get('package-root'), portableArtifactRoot: values.get('pele-root'), referenceDir: values.get('reference-dir'), fidelityZenumlRoot: values.get('zenuml-root'), mermaidDir: values.get('mermaid-dir'), executable: values.get('browser'), nodeExecutable: values.get('node'), benchmarkRecordStore: values.get('records'), benchmarkForce: flags.has('force'), communityProjects: values.get('projects')?.split(','), fidelityDiagnostic: flags.has('diagnostic'), fidelityCaseIds: values.get('cases')?.split(',') })
  console.log(JSON.stringify({ status: result.status, observations: result.observations.length }))
  process.exitCode = result.status === 'failed' ? 1 : 0
}
