import { readFileSync, readdirSync, realpathSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'
import { readCheckpointValue } from '../portable/checkpoint.ts'
import { evidenceBytesDigest, evidenceDigest } from '../portable/evidence-contract.ts'
import { readRetainedPreparationInput } from './recheck-inputs.ts'
import type { DocsInput } from './docs-drawings.ts'

// Audited archived transport: reads the literal retained job, checks each native
// sequence/workload and launch/runtime, then retains both actual image paths.
// This is deliberately a narrow legacy adapter, not a generic pointer fallback.
const legacyWorkerSha256 = 'b252543c4af59af3cb71c39d6a231c0dd0b1e7b7a582e8446179717c59037780'
const owned = (root: string, file: string) => {
  const suffix = relative(realpathSync(root), realpathSync(file))
  if (isAbsolute(suffix) || suffix === '..' || suffix.startsWith('../')) throw Error('Legacy PNG receipt escapes its owned archive')
  return file
}
const read = (file: string): any => JSON.parse(readFileSync(file, 'utf8'))
const lines = (file: string): any[] => readFileSync(file, 'utf8').trimEnd().split('\n').filter(Boolean).map(line => JSON.parse(line))

/** The original input batch and per-source public native return own these
 * images. No invocation UUID, same-call SVG or qualified clock is invented. */
export function retainedLegacyNativePngContext(campaignRoot: string, pngRoot: string, remap: (path: string) => string) {
  const inventory = readRetainedPreparationInput(campaignRoot, 'inventories'), preparation = inventory.manifest
  const cases: DocsInput[] = JSON.parse(inventory.bytes.toString()).docs?.cases
  if (!Array.isArray(cases) || new Set(cases.map(input => input.id)).size !== cases.length) throw Error('Legacy PNG has no unique sealed original source inventory')
  const context = read(owned(pngRoot, join(pngRoot, 'context.json')))
  const peers = context.artifacts?.filter((peer: any) => peer.node?.id === 'pub:mermaid_flutter')
  const sealed = preparation.artifacts?.filter((peer: any) => peer.project === 'pub:mermaid_flutter')
  if (peers?.length !== 1 || sealed?.length !== 1 || peers[0].artifact?.kind !== 'jsonl-worker' || peers[0].artifact?.version !== '0.3.2' || peers[0].artifact?.sha256 !== legacyWorkerSha256 || evidenceDigest(peers[0].artifact) !== evidenceDigest(sealed[0].identity?.artifact)) throw Error('Legacy PNG has no matching audited frozen native artifact')
  const artifact = peers[0].artifact
  const worker = readRetainedPreparationInput(campaignRoot, 'artifact:' + legacyWorkerSha256)
  if (worker.sha256 !== legacyWorkerSha256) throw Error('Legacy PNG transport bytes changed')
  for (const file of artifact.files) readRetainedPreparationInput(campaignRoot, 'artifact:' + file.sha256)
  const directory = join(pngRoot, 'community-raw')
  const jobs = readdirSync(directory).filter(name => /^pub_mermaid_flutter-png-r[1-9][0-9]*-features-a[1-9][0-9]*\.job\.json$/.test(name))
  const batches = jobs.map(name => {
    const jobFile = owned(pngRoot, join(directory, name)), job = read(jobFile)
    const match = /^pub_mermaid_flutter-png-r([1-9][0-9]*)-features-a([1-9][0-9]*)\.job\.json$/.exec(name)!
    const round = Number(match[1]), attempt = Number(match[2]), stem = name.slice(0, -'.job.json'.length)
    const resultFile = owned(pngRoot, join(directory, stem + '.jsonl')), nativeDirectory = owned(pngRoot, resultFile + '.native')
    const rawFile = owned(pngRoot, join(nativeDirectory, 'raw.jsonl')), raw = lines(rawFile), results = lines(resultFile)
    if (job.output !== 'png' || job.coverageOnly !== true || job.timing?.warmCalls !== 1 || job.timing?.warmupMs !== 0 || job.timing?.minSampleMs !== 0 || !Array.isArray(job.workloads) || job.workloads.length !== cases.length || raw.length !== cases.length || results.length !== cases.length || new Set(job.workloads.map((input: any) => input.id)).size !== cases.length) throw Error('Legacy native batch is incomplete, adaptive or ambiguous')
    for (const [index, source] of cases.entries()) {
      const workload = job.workloads[index], returned = raw[index], result = results[index]
      if (workload?.id !== source.id || workload.source !== source.source || returned?.workload !== source.id || result?.workload !== source.id || returned.sequence !== index || result.sequence !== index || returned.release !== true || result.release !== true) throw Error('Legacy native batch differs from its sealed literal source/order')
      for (const key of ['workload', 'sequence', 'release', 'png', 'firstPng', 'outputBytes', 'firstOutputBytes']) if (returned[key] !== result[key]) throw Error('Legacy native emitted return differs from its original per-source return')
    }
    const launchFile = owned(pngRoot, join(nativeDirectory, 'launch.json')), runtimeFile = owned(pngRoot, join(nativeDirectory, 'runtime.json'))
    const launch = read(launchFile), runtime = read(runtimeFile)
    const launchArtifact = artifact.files.find((file: any) => file.path === launch.launchManifest)
    if (!launchArtifact) throw Error('Legacy native launch has no sealed manifest')
    const launchManifest = readRetainedPreparationInput(campaignRoot, 'artifact:' + launchArtifact.sha256), declared = JSON.parse(launchManifest.bytes.toString())
    const executable = artifact.files.find((file: any) => file.path === launch.executable), library = artifact.files.find((file: any) => file.path === join(resolve(launch.executable, '..'), 'lib/libapp.so'))
    if (!executable || !library || executable.sha256 !== launch.sha256 || library.sha256 !== launch.libappSha256 || declared.executable !== launch.executable || declared.version !== '0.3.2' || launch.version !== declared.version || launch.entrypoint !== declared.entrypoint || declared.entrypoint !== 'mermaid_flutter.renderToPng' || runtime.packageVersion !== declared.version || runtime.entrypoint !== declared.entrypoint || runtime.runtime !== 'native Linux Flutter' || runtime.release !== true || runtime.pixelRatio !== declared.pixelRatio || runtime.startupExcludedFromApiClocks !== declared.startupExcludedFromApiClocks) throw Error('Legacy native launch/runtime differs from its frozen public API')
    const transport = read(owned(pngRoot, join(pngRoot, 'transport-pub%3Amermaid_flutter-r' + round + '.json')))
    const observations = readCheckpointValue<any[]>(pngRoot, JSON.stringify(['pub:mermaid_flutter', round]))
    if (!Array.isArray(transport) || !Array.isArray(observations)) throw Error('Legacy PNG lacks original transport/checkpoint corroboration')
    return { round, attempt, jobFile, job, resultFile, results, rawFile, raw, nativeDirectory, launchFile, runtimeFile, transport, observations }
  })
  return { campaignRoot, pngRoot, remap, cases, inventorySha256: inventory.sha256, artifactSha256: artifact.sha256, batches }
}

export function requireLegacyNativePngOwnership(input: { context: ReturnType<typeof retainedLegacyNativePngContext>; project: string; source: DocsInput; round: number; actualPng: Uint8Array }) {
  const { context, project, source, round, actualPng } = input
  if (project !== 'pub:mermaid_flutter' || !Number.isSafeInteger(round) || round < 1) throw Error('No legacy source-only PNG owner for this project/round')
  const index = context.cases.findIndex(item => item.id === source.id && item.source === source.source)
  if (index < 0) throw Error('Legacy PNG source differs from its sealed original input')
  const candidates = context.batches.filter(batch => batch.round === round && batch.results[index]?.status === 'ok' && batch.raw[index]?.status === 'ok')
  if (candidates.length !== 1) throw Error('Legacy native PNG has no unique successful per-source return')
  const batch = candidates[0]!, row = batch.results[index], raw = batch.raw[index]
  const returned = batch.transport.filter((entry: any) => entry.caseId === source.id && entry.metrics?.implementation === project && entry.metrics?.round === round)
  const original = batch.observations.filter(entry => entry.caseId === source.id && entry.operation === 'render' && entry.format === 'png' && entry.metrics?.project === project && entry.metrics?.round === round)
  if (returned.length !== 1 || original?.length !== 1 || returned[0].status !== 'passed' || original[0].status !== 'passed' || returned[0].metrics.outputFile !== row.png || returned[0].metrics.workerAttempt !== batch.attempt || original[0].metrics.transport !== 'native' || original[0].metrics.version !== '0.3.2' || original[0].metrics.witness !== 'drawings/' + evidenceBytesDigest(actualPng) + '.png' || original[0].metrics.bytes !== actualPng.byteLength) throw Error('Legacy PNG is not corroborated by its original project/source return receipts')
  if (row.pngReturned !== true || row.outputBytes !== actualPng.byteLength || row.firstOutputBytes !== actualPng.byteLength || row.timingProtocol !== 'native-png-api-one-call-qualification-v1' || !Array.isArray(row.samplesMs) || row.samplesMs.length || !Array.isArray(row.sampleIterations) || row.sampleIterations.length || typeof row.png !== 'string' || typeof row.firstPng !== 'string') throw Error('Legacy PNG does not retain its one-call first/final image')
  const image = owned(batch.nativeDirectory, context.remap(row.png)), first = owned(batch.nativeDirectory, context.remap(row.firstPng))
  for (const file of [image, first]) if (evidenceBytesDigest(readFileSync(file)) !== evidenceBytesDigest(actualPng)) throw Error('Legacy native return bytes differ from the actual reviewed PNG')
  return { schema: 'trident-legacy-source-owned-png-v1' as const, project, caseId: source.id, round, sourceSha256: evidenceBytesDigest(source.source), pngSha256: evidenceBytesDigest(actualPng), inventorySha256: context.inventorySha256, artifactSha256: context.artifactSha256, jobSha256: evidenceBytesDigest(readFileSync(batch.jobFile)), rawReturnSha256: evidenceDigest(raw), emittedReturnSha256: evidenceDigest(row), transportReturnSha256: evidenceDigest(returned[0]), originalObservationSha256: evidenceDigest(original[0]), launchReceiptSha256: evidenceBytesDigest(readFileSync(batch.launchFile)), runtimeReceiptSha256: evidenceBytesDigest(readFileSync(batch.runtimeFile)), timingQualified: false, scope: 'Original sealed source inventory, exact retained native job and per-source first/final public image returns. Legacy content ownership only; no per-call invocation journal, qualified clock or SVG evidence.' }
}
