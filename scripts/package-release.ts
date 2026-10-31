import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { TRIDENT_VERSION } from '../version.ts'
import { loadCampaignPreparation } from '../unified/campaign-preparation.ts'
import { communityCoreWorkloads } from '../unified/community.ts'
import { supportWorkloads, supportControls } from '../unified/support-verification.ts'
import { portableAdapter, portableBinding } from '../unified/support.ts'
import { publishCampaigns } from '../unified/campaign-publication.ts'
import { readBenchmarkDocument, readProjectBenchmarkRecord, stableValue } from '../portable/project-records.ts'
import { portableCases } from '../portable/cohorts.ts'
import { qualifyPortable } from '../portable/fidelity.ts'
import type { PortableWorkerResult } from '../portable/protocol.ts'
import type { BenchmarkObservation } from '../unified/types.ts'
import type { PreparedCommunity } from '../unified/community-types.ts'

const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex')
const read = (file: string): any => JSON.parse(readFileSync(file, 'utf8'))
/** Verify the shipped bytes, not a second build from the checkout. */
export function verifyReleaseArchive(archive: string, sha256: string, out: string, version: string, node = process.env.NODE_BIN ?? 'node') {
  if (digest(readFileSync(archive)) !== sha256) throw Error('Release archive checksum differs')
  mkdirSync(out, { recursive: true })
  execFileSync('tar', ['-xzf', archive, '-C', out])
  const kit = join(out, 'trident-' + version), manifest = read(join(kit, 'harness-artifact.json'))
  for (const file of manifest.files) {
    const path = resolve(kit, file.path)
    if (!path.startsWith(kit + '/') || digest(readFileSync(path)) !== file.sha256) throw Error('Shipped kit file differs from manifest: ' + file.path)
  }
  if (execFileSync(node, [join(kit, 'run.mjs'), '--version'], { encoding: 'utf8', timeout: 10_000 }).trim() !== 'Trident ' + version) throw Error('Shipped kit version differs')
  return { kit, manifest }
}
export function verifySourceSmoke(observations: BenchmarkObservation[], svgProject: string, terminalProject: string) {
  for (const [project, format] of [[svgProject, 'svg'], [terminalProject, 'terminal']] as const)
    if (!observations.some(row => row.metrics?.implementation === project && row.caseId === 'support:flowchart' && row.status === 'passed' && row.format === format)) throw Error(`No independently admitted ${format} flowchart output for ${project}`)
}
/** Planned cases do not prove execution. Bind the kit's view to its owning
 * worker record, while retaining blocked option mappings as attempted findings. */
export function verifyKitSmoke(file: string, project: string, caseIds: readonly string[]) {
  if (!existsSync(file)) throw Error('Shipped kit did not produce its smoke report')
  const report = read(file), cases = report.summary?.cases
  if (report.project !== project || report.summary?.counts?.cases !== caseIds.length || !Array.isArray(cases) || cases.length !== caseIds.length || new Set(cases.map(row => row.id)).size !== caseIds.length || caseIds.some(id => !cases.some(row => row.id === id))) throw Error('Shipped kit smoke case inventory differs from the declared cases')
  if (typeof report.evidenceDirectory !== 'string' || relative(dirname(resolve(file)), resolve(report.evidenceDirectory)).startsWith('..')) throw Error('Shipped kit smoke has no owning attempt inside its evidence directory')
  const record = readProjectBenchmarkRecord(join(report.evidenceDirectory, 'result.json.gz'))
  const provenance = record.provenance as { workerProtocol?: string; results?: PortableWorkerResult[] } | undefined
  if (record.identity.project !== project || record.id !== report.recordId || resolve(record.evidenceDirectory) !== resolve(report.evidenceDirectory) || provenance?.workerProtocol !== report.protocol || !Array.isArray(provenance?.results) || provenance.results.some(worker => worker.protocol !== report.protocol)) throw Error('Shipped kit smoke differs from its owning worker record')
  const attempted = provenance.results.filter(worker => ['warm', 'cold', 'memory', 'retention'].includes(worker.mode))
  for (const id of caseIds) if (!attempted.some(worker => worker.caseId === id)) throw Error('Shipped kit did not attempt the declared case: ' + id)
  if (cases.find(row => row.id === 'family:flowchart')?.outputAdmission !== 'passed' || !attempted.some(worker => worker.caseId === 'family:flowchart' && worker.qualification?.evidence?.outputAdmission === 'passed')) throw Error('Shipped kit did not independently admit the flowchart output')
  return report
}
/** Packaging is a preservation check against the same artifact and frozen
 * workflows. It neither requires renderer perfection nor turns attempted jobs
 * into passing edit/reset/recovery contracts. */
export function verifyReleaseSmokeParity(sourceFile: string, kitFile: string, project: string, caseIds: readonly string[]) {
  const frozenCases = portableCases(undefined, [...caseIds])
  const load = (file: string) => {
    const report = verifyKitSmoke(file, project, caseIds), recordFile = join(report.evidenceDirectory, 'result.json.gz'), record = readProjectBenchmarkRecord(recordFile)
    const protocol = record.identity.protocol as any, measurement = record.identity.measurement as any, provenance = record.provenance as { results: PortableWorkerResult[] }
    if (stableValue(protocol?.cases) !== stableValue(frozenCases)) throw Error('Release smoke does not use the exact current source workflows and expectations')
    if (protocol?.measurement !== report.protocol || !measurement?.environment || !measurement?.sampling) throw Error('Release smoke has no frozen protocol/runtime identity')
    const workers = new Map<string, PortableWorkerResult>(), witnesses: { caseId: string; path: string; sha256: string }[] = []
    for (const worker of provenance.results) {
      const key = stableValue([worker.caseId, worker.mode, worker.round, worker.replica, worker.sample])
      if (workers.has(key)) throw Error('Duplicate release smoke worker identity')
      workers.set(key, worker)
      if (!caseIds.includes(worker.caseId) || !['warm', 'cold', 'memory', 'retention'].includes(worker.mode)) continue
      const testCase = frozenCases.find(row => row.id === worker.caseId)!
      if (worker.status === 'blocked' && !(worker.caseId === 'adversarial:configuration-reset' && worker.error?.startsWith('Error: Adapter gap: no reviewed public font-size configuration binding for '))) throw Error('Release smoke contains an unqualified harness failure: ' + worker.caseId)
      if (stableValue(worker.prelude.map(row => ({ source: row.source, accept: row.expectedAccepted }))) !== stableValue(testCase.prelude ?? [])) throw Error('Release smoke lost or changed a workflow prelude')
      if (worker.status === 'passed' && (!worker.qualification?.passed || worker.prelude.some(row => !row.passed))) throw Error('Release smoke has contradictory passing worker evidence')
      if (worker.status === 'failed') {
        const path = join(record.evidenceDirectory, 'svg', worker.caseId.replaceAll(':', '_') + '.svg'), relativePath = relative(record.evidenceDirectory, path)
        if (!record.evidenceFiles.includes(relativePath) || !existsSync(path)) throw Error('Failed release workflow has no independent returned-output witness')
        const bytes = readFileSync(path), observed = qualifyPortable(testCase, { svg: bytes.toString(), adapter: (provenance as any).artifact?.adapter })
        const confirmed = observed.checks.filter(check => check.status === 'failed' && !['acceptance', 'qualification-protocol'].includes(check.name)).some(check => worker.qualification?.checks.some(reported => reported.name === check.name && reported.status === 'failed'))
        if (!confirmed) throw Error('Failed release workflow has no independently confirmed output violation; cause remains unclassified')
        witnesses.push({ caseId: worker.caseId, path, sha256: digest(bytes) })
      }
      if (worker.qualification?.evidence?.outputAdmission === 'passed') {
        const relativePath = 'svg/' + worker.caseId.replaceAll(':', '_') + '.svg', path = join(record.evidenceDirectory, relativePath)
        if (!record.evidenceFiles.includes(relativePath) || !existsSync(path)) throw Error('Release smoke lost its retained SVG witness')
        if (!witnesses.some(row => row.caseId === worker.caseId)) {
          const bytes = readFileSync(path), checked = qualifyPortable(testCase, { svg: bytes.toString(), adapter: (provenance as any).artifact?.adapter })
          if (checked.evidence?.outputAdmission !== 'passed') throw Error('Release smoke witness contradicts its independently rechecked output admission')
          witnesses.push({ caseId: worker.caseId, path, sha256: digest(bytes) })
        }
      }
    }
    for (const testCase of frozenCases.filter(row => row.prelude?.some(prelude => !prelude.accept))) {
      const attempted = [...workers.values()].filter(worker => worker.caseId === testCase.id && ['warm', 'cold', 'memory', 'retention'].includes(worker.mode))
      if (!attempted.length || attempted.some(worker => !worker.prelude.some(prelude => prelude.source === testCase.prelude!.find(row => !row.accept)!.source && prelude.expectedAccepted === false))) throw Error('Release smoke has no owning negative-control evidence')
    }
    for (const relativePath of record.evidenceFiles.filter(path => path.endsWith('.svg'))) {
      const path = resolve(record.evidenceDirectory, relativePath), owned = relative(record.evidenceDirectory, path)
      if (owned === '..' || owned.startsWith('../') || !existsSync(path)) throw Error('Release smoke witness is missing or outside its owning attempt')
      if (!witnesses.some(row => row.path === path)) witnesses.push({ caseId: frozenCases.find(row => relativePath === 'svg/' + row.id.replaceAll(':', '_') + '.svg')?.id ?? 'failed-call-diagnostic', path, sha256: digest(readFileSync(path)) })
    }
    return { report, record, recordFile, protocol, measurement, workers, witnesses }
  }
  const source = load(sourceFile), kit = load(kitFile)
  for (const [scope, left, right] of [
    ['artifact', source.record.identity.artifact, kit.record.identity.artifact],
    ['sampling', source.measurement.sampling, kit.measurement.sampling],
    ['runtime', source.measurement.environment, kit.measurement.environment],
    ['cohort', source.protocol.cohort, kit.protocol.cohort],
    ['family support', source.protocol.familySupport, kit.protocol.familySupport],
  ]) if (stableValue(left) !== stableValue(right)) throw Error('Source and shipped kit release smoke differ in ' + scope)
  if (stableValue([...source.workers.keys()].sort()) !== stableValue([...kit.workers.keys()].sort())) throw Error('Source and shipped kit did not execute the same workflow jobs')
  const outcome = (worker: PortableWorkerResult) => ({
    status: worker.status, runtime: worker.runtime, prelude: worker.prelude, error: worker.error?.split('\n')[0] ?? null,
    qualification: worker.qualification ? {
      observer: worker.qualification.observer ?? null, accepted: worker.qualification.accepted, passed: worker.qualification.passed, semanticComplete: worker.qualification.semanticComplete, evidence: worker.qualification.evidence ?? null,
      checks: worker.qualification.checks.map(check => ({ name: check.name, status: check.status, expected: check.expected, actual: check.status === 'failed' ? check.actual : null, scope: check.scope })),
    } : null,
  })
  for (const [key, worker] of source.workers) if (stableValue(outcome(worker)) !== stableValue(outcome(kit.workers.get(key)!))) throw Error('Shipped kit changed a source workflow outcome: ' + worker.caseId + '/' + worker.mode)
  return {
    schema: 'trident-release-smoke-parity-v1', status: 'package-parity-verified', project,
    sourceRecord: { path: source.recordFile, sha256: digest(readFileSync(source.recordFile)) }, kitRecord: { path: kit.recordFile, sha256: digest(readFileSync(kit.recordFile)) },
    workflowsSha256: digest(Buffer.from(stableValue(frozenCases))), artifactSha256: digest(Buffer.from(stableValue(source.record.identity.artifact))),
    cases: caseIds.length, workerJobs: source.workers.size, sourceWitnesses: source.witnesses, kitWitnesses: kit.witnesses,
    limits: 'Exact frozen workflow and reported outcome preservation, with independent retained-SVG admission rechecks. Independently witnessed identical output violations and known unavailable option mappings remain findings. Shared source defects are outside this preservation proof; source-harness, accuracy and timing qualification remain separate release gates.',
  }
}
export async function packageRelease(argv: string[]) {
  const args = new Map<string, string>()
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index]!, value = argv[index + 1]
    if (!['--out', '--prepared', '--projects', '--executable'].includes(flag) || args.has(flag) || !value || value.startsWith('--')) throw Error('Use release:check --out FRESH_DIR --prepared FILE --projects SVG_PROJECT,TERMINAL_PROJECT [--executable CHROMIUM]')
    args.set(flag, value)
  }
  if (!args.has('--out') || args.has('--prepared') !== args.has('--projects')) throw Error('Choose --out, and both --prepared/--projects for the complete release check')
  const root = resolve(import.meta.dirname, '..'), out = resolve(args.get('--out')!)
  if (existsSync(out)) throw Error('Release output must be fresh')
  mkdirSync(out, { recursive: true })
  const name = 'trident-' + TRIDENT_VERSION, kit = join(out, name), node = process.env.NODE_BIN ?? 'node'
  // Build outside the checkout so a fresh in-repository output directory cannot
  // make the build mistake its own generated files for dirty source.
  const staging = mkdtempSync(join(tmpdir(), 'trident-release-'))
  try {
    const built = join(staging, name)
    execFileSync(node, [join(root, 'commands.ts'), 'build', '--out', built], { cwd: root, stdio: 'inherit' })
    cpSync(built, kit, { recursive: true })
  } finally { rmSync(staging, { recursive: true, force: true }) }
  copyFileSync(join(root, 'LICENSE'), join(kit, 'LICENSE'))
  const manifest = read(join(kit, 'harness-artifact.json'))
  writeFileSync(join(kit, 'README.md'), `# Trident ${TRIDENT_VERSION}\n\nRequires Node 24+, an installed target artifact and the pinned Mermaid oracle.\n\nRun \`node run.mjs --version\` or \`node run.mjs --help\`. Set MERMAID_REFERENCE_DIR to the installed oracle. Target artifacts are installed separately.\n\nMethods: https://github.com/adewale/trident/blob/${manifest.sourceRevision ?? 'main'}/BENCHMARKS.md\n`)
  const archive = join(out, name + '-node24.tar.gz'), shaFile = join(out, 'SHA256SUMS')
  execFileSync('tar', ['-czf', archive, '-C', out, name])
  const sha256 = digest(readFileSync(archive))
  writeFileSync(shaFile, sha256 + '  ' + name + '-node24.tar.gz\n', { flag: 'wx' })
  if (args.has('--prepared')) {
    if (!manifest.sourceRevision || manifest.sourceDirty) throw Error('Release checks require committed source; keep development archives separate')
    const frozen = loadCampaignPreparation(resolve(args.get('--prepared')!)), projects = args.get('--projects')!.split(',')
    if (projects.length !== 2 || new Set(projects).size !== 2) throw Error('Choose one portable SVG project followed by one distinct terminal project')
    const prepared = read(frozen.options.communityPreparedFile!) as PreparedCommunity[], svg = prepared.find(peer => peer.node.id === projects[0]), terminal = prepared.find(peer => peer.node.id === projects[1])
    if (!svg?.artifact?.root || !svg.artifact.module || !portableAdapter(svg.node) || !terminal?.artifact || !terminal.node.outputs.some(output => ['terminal', 'ascii', 'unicode', 'ascii-unicode'].includes(output))) throw Error('Release smoke projects need actual reviewed SVG and terminal bindings')
    const verification = join(out, 'verification'), source = join(verification, 'source')
    mkdirSync(verification)
    const inputs = join(verification, 'inputs.json')
    writeFileSync(inputs, JSON.stringify({ workloads: [...communityCoreWorkloads(), supportWorkloads[0], ...supportControls], gaps: ['Bounded release smoke; six legacy cases, one common flowchart and two invalid controls. No deep coverage or qualified timing claim.'] }))
    const sourceArgs = [join(root, 'commands.ts'), 'bench', '--projects', projects.join(','), '--profile', 'smoke', '--suites', 'community', '--community-catalog', frozen.options.communityCatalogFile!, '--community-prepared', frozen.options.communityPreparedFile!, '--community-browser-prepared', frozen.options.communityBrowserPreparedFile!, '--community-artifact-policy', 'frozen', '--community-inputs', inputs, '--out', source, ...(args.has('--executable') ? ['--executable', args.get('--executable')!] : [])]
    const collected = spawnSync(process.execPath, sourceArgs, { cwd: root, encoding: 'utf8', timeout: 600_000, maxBuffer: 8 * 1024 * 1024 })
    writeFileSync(join(verification, 'source.log'), collected.stdout + collected.stderr)
    if (collected.error || ![0, 1, 2].includes(collected.status ?? -1) || !existsSync(join(source, 'completed.json'))) throw Error('Source collection smoke did not complete; inspect verification/source.log')
    const campaign = read(join(source, 'report.json')), boundary = campaign.results.find((row: any) => row.suite === 'community')
    const community = readBenchmarkDocument(join(boundary.out, 'result.json')) as any
    verifySourceSmoke(community.observations, projects[0]!, projects[1]!)
    publishCampaigns([source], join(verification, 'report'))
    const shipped = verifyReleaseArchive(archive, sha256, join(verification, 'extracted'), TRIDENT_VERSION, node)
    const empty = join(verification, 'empty'); mkdirSync(empty)
    const adapter = portableAdapter(svg.node)!, binding = portableBinding(svg.node)
    const caseIds = ['family:flowchart', 'adversarial:label-edit', 'adversarial:configuration-reset', 'adversarial:invalid-recovery']
    const kitArgs = [join(shipped.kit, 'run.mjs'), '--project', svg.node.id, '--artifact-root', svg.artifact.root, '--entry', svg.artifact.module, '--adapter', adapter,
      ...(adapter === 'declared' ? ['--binding', JSON.stringify(binding)] : []), ...(adapter === 'public-package' ? ['--public-config', JSON.stringify(svg.node.benchmark)] : []),
      '--out', join(verification, 'kit'), '--records', join(verification, 'kit-records'), '--cases', caseIds.join(','), '--rounds', '1', '--samples', '1', '--cold-samples', '1', '--min-sample-ms', '0', '--worker-timeout-ms', '15000', '--allow-partial']
    const sourceKitArgs = [join(root, 'commands.ts'), 'portable', ...kitArgs.slice(1)]
    sourceKitArgs[sourceKitArgs.indexOf('--out') + 1] = join(verification, 'source-kit')
    sourceKitArgs[sourceKitArgs.indexOf('--records') + 1] = join(verification, 'source-kit-records')
    const sourceChecked = spawnSync(process.execPath, sourceKitArgs, { cwd: root, encoding: 'utf8', timeout: 180_000, maxBuffer: 8 * 1024 * 1024 })
    writeFileSync(join(verification, 'source-kit.log'), sourceChecked.stdout + sourceChecked.stderr)
    if (sourceChecked.error || ![0, 1].includes(sourceChecked.status ?? -1)) throw Error('Source workflow smoke did not complete; inspect verification/source-kit.log')
    const checked = spawnSync(node, kitArgs, { cwd: empty, encoding: 'utf8', timeout: 180_000, maxBuffer: 8 * 1024 * 1024 })
    writeFileSync(join(verification, 'kit.log'), checked.stdout + checked.stderr)
    if (checked.error || ![0, 1].includes(checked.status ?? -1)) throw Error('Shipped kit did not complete its smoke invocation; inspect verification/kit.log')
    const result = verifyKitSmoke(join(verification, 'kit/report.json'), svg.node.id, caseIds)
    const parity = verifyReleaseSmokeParity(join(verification, 'source-kit/report.json'), join(verification, 'kit/report.json'), svg.node.id, caseIds)
    writeFileSync(join(verification, 'source-kit-parity.json'), JSON.stringify(parity, null, 2) + '\n')
    writeFileSync(join(out, 'release-check.json'), JSON.stringify({ sourceRevision: manifest.sourceRevision, version: TRIDENT_VERSION, archive, sha256, status: 'package-parity-verified', projects,
      sourceWorkflowCommand: sourceKitArgs, sourceWorkflowExitCode: sourceChecked.status, workflowParity: join(verification, 'source-kit-parity.json'),
      sourceCommand: sourceArgs, sourceExitCode: collected.status, sourceCampaign: join(source, 'report.json'), kitCommand: kitArgs, kitExitCode: checked.status,
      kitRecord: join(result.evidenceDirectory, 'result.json.gz'), kitCases: result.summary.cases, limits: 'Source-versus-extracted-kit preservation of exact frozen workflow inputs and outcomes; retained SVG admission is independently rechecked. Independently witnessed identical output violations remain visible; this is preservation, not full source-harness qualification. Renderer findings and blocked option mappings remain in owning reports; this is not B0, a full support claim or timing qualification.' }, null, 2) + '\n')
  } else verifyReleaseArchive(archive, sha256, join(out, 'archive-check'), TRIDENT_VERSION, node)
  return { version: TRIDENT_VERSION, archive, sha256, checksums: shaFile, ...(args.has('--prepared') ? { verification: join(out, 'release-check.json') } : {}) }
}
if (import.meta.main) {
  if (process.argv.slice(2).join(' ') === '--help') console.log('bun commands.ts release:check --prepared FILE --projects SVG_PROJECT,TERMINAL_PROJECT --out FRESH_DIR [--executable CHROMIUM]\nBuilds once, checks source collection/reporting and the actual extracted Node kit; writes release-check.json. No release is published.')
  else console.log(JSON.stringify(await packageRelease(process.argv.slice(2))))
}
