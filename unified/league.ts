import { copyFileSync, existsSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { basename, isAbsolute, join, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import { MERMAID_ORACLE_PIN } from '../portable/mermaid-oracle.ts'
import { legacyScoredFamilies, newerFamilies, scoredFamilies } from '../portable/cohorts.ts'
import { loadCurrentProjectRecords, readBenchmarkDocument, stableValue, type ProjectBenchmarkRecord } from '../portable/project-records.ts'
import { rankCommunityObservations } from './community.ts'
import { communityCorpus } from './corpus.ts'
import type { BenchmarkObservation, UnifiedWorkload } from './types.ts'
import { positiveRenderInput } from './workload-intent.ts'
import { median } from '../portable/statistics.ts'
import { assertCurrentReportSetVersions, currentReportVersion } from './current-report-versions.ts'
import { copyPublicationMethods } from './publication-methods.ts'

/** Mermaid defines valid input, so its row is the reference, not a contestant. */
export const REFERENCE_PROJECT = 'mermaid-js/mermaid'
/** Fewer rounds than this cannot calibrate a speed; such rows show no speed at all. */
export const CALIBRATED_ROUNDS = 5
/** The mark: ranks, "families supported" and the pass rate count these families only. */
export const SCORED_FAMILIES = scoredFamilies()
/** Preserve the old mark without excluding a stable family from today's score. */
const LEGACY_FAMILIES = legacyScoredFamilies()
/** Other documented additions, reported beside the current mark. */
export const NEWER_FAMILIES = newerFamilies().filter(family => !SCORED_FAMILIES.includes(family))

export const OUTPUTS: Record<string, string> = { svg: 'SVG', terminal: 'Terminal text', png: 'PNG', parse: 'Parser', diagnostics: 'Diagnostics', source: 'Formatted Mermaid source', 'react-flow': 'React Flow model', excalidraw: 'Editable Excalidraw model' }
export const SURFACES: Record<string, string> = { 'browser:public-api': 'browser API', 'node:public-api': 'Node API', 'bun:public-api': 'Bun API', 'node:public-parse-validation': 'Node parser API', 'cli:end-to-end': 'CLI', 'python:public-api': 'Python API', 'native:in-process-api': 'native API' }
const slug = (project: string) => project.replace(/[^a-z0-9._-]+/gi, '-').toLowerCase()
export const percent = (passed: number, total: number) => (total ? `${((100 * passed) / total).toFixed(1)}%` : '—')
export const escape = (value: unknown) => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ')

export interface ReportInputs {
  source: 'context' | 'community-inputs' | 'unavailable'
  workloads: Map<string, UnifiedWorkload>
  gaps: string[]
  reference: { version?: string; parserVersion?: string; domVersion?: string } | null
  oracleLedgerComplete: boolean
  rejectedCaseIds: Set<string>
}
interface AuthoredLabelAdmission {
  passed: number
  failed: number
  blocked: number
  unavailable: number
  excludedRejected: number
  excludedUnlabeled: number
  unmapped: number
}

export interface PositiveRenderAdmission {
  passed: number
  failed: number
  blocked: number
  unavailable: number
  excludedParserOnly: number
  excludedDiagnostic: number
  excludedReferenceRejected: number
  unknownIntent: number
  unknownReference: number
  unmapped: number
}

export interface Lane {
  project: string
  version: string
  surface: string
  format: string
  rounds: number
  supported: string[]
  unsupported: string[]
  passed: number
  failed: number
  blocked: number
  /** Report-only subset; null when retained oracle caveats cannot establish its denominator. */
  authoredLabels?: AuthoredLabelAdmission | null
  positiveRendering?: PositiveRenderAdmission | null
  legacy: { supported: number; passed: number; failed: number }
  /** The newer families, kept out of every number above; null when the record probed none of them. */
  newer: { supported: string[]; passed: number; failed: number } | null
  /** Fixed core, each input's first call in its process: median over rounds, summed. Cache-proof. */
  coreFirstMs: number | null
  /** Fixed core, repeated identical source: what a tool that caches by source reports. */
  coreMedianMs: number | null
  families: Record<string, { passed: number; failed: number; unsupported: boolean }>
}

const rounds = (record: ProjectBenchmarkRecord) => Number((record.identity.measurement as { rounds?: number } | undefined)?.rounds ?? 0)
const versionOf = (record: ProjectBenchmarkRecord) => currentReportVersion(record) ?? 'unavailable'
export const featureRow = (row: BenchmarkObservation) => !row.caseId.startsWith('core:') && !['family-support', 'capability', 'delivery', 'memory', 'process-memory', 'load-and-initialize', 'worker-lifecycle', 'enroll', 'resource-diagnostic'].includes(row.operation) && !row.operation.endsWith('negative-admission')

/** One row per tool and public surface/output, from one retained project record. */
export function lanes(record: ProjectBenchmarkRecord, evidence?: ReportInputs): Lane[] {
  const admittedVersion = currentReportVersion(record)
  const groups = new Map<string, BenchmarkObservation[]>()
  for (const row of record.observations.filter(row => row.suite !== 'community-cli' && row.metrics?.implementation === record.identity.project)) {
    const key = `${row.surface}\n${row.format}`
    groups.set(key, [...(groups.get(key) ?? []), row])
  }
  // The supplemental CLI suite repeats core cases under its own protocol; it is not this lane's evidence.
  const speed = rankCommunityObservations(record.observations.filter(row => row.suite !== 'community-cli'), Math.max(1, rounds(record)))
  return [...groups].flatMap(([key, rows]) => {
    const [surface, format] = key.split('\n') as [string, string]
    const features = rows.filter(featureRow).filter(row => row.status !== 'not-applicable' && (row.metrics?.round === undefined || row.metrics.round === 1))
    const inputLedgerRows = rows.filter(featureRow).filter(row => row.metrics?.round === undefined || row.metrics.round === 0 || row.metrics.round === 1)
    const positive = evidence && evidence.oracleLedgerComplete && renderingOutput(format) ? positiveRenderAdmission(inputLedgerRows.filter(row => SCORED_FAMILIES.includes(row.family)), evidence) : null
    // A blocked enrolled surface retains its whole planned denominator. An
    // explicitly inapplicable interface (such as Mermaid SVG in Node) earns no row.
    const enrolled = rows.some(row =>
      (['capability', 'enroll'].includes(row.operation) && ['passed', 'blocked', 'failed'].includes(row.status)) ||
      (row.operation === 'family-support' && ['passed', 'failed', 'blocked', 'unsupported'].includes(row.status)) ||
      (row.operation === 'render' && ['passed', 'blocked', 'failed'].includes(row.status)),
    )
    if (!features.length && (!positive || !enrolled || positive.passed + positive.failed + positive.blocked + positive.unavailable === 0)) return []
    const allProbes = rows.filter(row => row.operation === 'family-support')
    const probes = allProbes.filter(row => SCORED_FAMILIES.includes(row.family)),
      newerProbes = allProbes.filter(row => NEWER_FAMILIES.includes(row.family))
    const unsupported = allProbes.filter(row => row.status === 'unsupported').map(row => row.family)
    const scored = features.filter(row => SCORED_FAMILIES.includes(row.family)),
      newer = features.filter(row => NEWER_FAMILIES.includes(row.family))
    const legacy = features.filter(row => LEGACY_FAMILIES.includes(row.family))
    const supported = (probe: BenchmarkObservation) => probe.status === 'passed' || probe.status === 'failed'
    const families: Lane['families'] = {}
    for (const family of [...SCORED_FAMILIES, ...NEWER_FAMILIES]) {
      const own = features.filter(row => row.family === family)
      families[family] = { passed: own.filter(row => row.status === 'passed').length, failed: own.filter(row => row.status === 'failed').length, unsupported: unsupported.includes(family) }
    }
    const rank = speed.find(item => item.surface === surface && item.output === format)
    const firstCalls = rank?.qualified ? rank.requiredCaseIds.map(id => {
      // Every CLI sample is a fresh process, so its sample is already a first call.
      const values = rows.filter(row => row.caseId === id && row.status === 'passed').map(row => Number(surface === 'cli:end-to-end' ? row.samplesMs?.[0] : row.metrics?.firstMs)).filter(Number.isFinite).sort((a, b) => a - b)
      return values.length === rounds(record) ? median(values) : NaN
    }) : []
    return [
      {
        project: record.identity.project,
        version: versionOf(record),
        surface,
        format,
        rounds: rounds(record),
        supported: [...new Set(probes.filter(supported).map(row => row.family))],
        unsupported: unsupported.filter(family => !NEWER_FAMILIES.includes(family)),
        passed: scored.filter(row => row.status === 'passed').length,
        failed: scored.filter(row => row.status === 'failed').length,
        blocked: scored.filter(row => row.status === 'blocked').length,
        ...(evidence && ['svg', 'terminal'].includes(format) ? { authoredLabels: authoredLabelAdmission(scored, evidence) } : {}),
        ...(evidence && ['svg', 'terminal', 'png'].includes(format) ? { positiveRendering: positive } : {}),
        legacy: { supported: new Set(probes.filter(probe => LEGACY_FAMILIES.includes(probe.family) && supported(probe)).map(probe => probe.family)).size, passed: legacy.filter(row => row.status === 'passed').length, failed: legacy.filter(row => row.status === 'failed').length },
        newer: newerProbes.length ? { supported: [...new Set(newerProbes.filter(supported).map(row => row.family))], passed: newer.filter(row => row.status === 'passed').length, failed: newer.filter(row => row.status === 'failed').length } : null,
        coreFirstMs: admittedVersion !== null && rounds(record) >= CALIBRATED_ROUNDS && firstCalls.length && firstCalls.every(Number.isFinite) ? firstCalls.reduce((sum, value) => sum + value, 0) : null,
        coreMedianMs: admittedVersion !== null && rounds(record) >= CALIBRATED_ROUNDS && rank?.qualified ? rank.medianMs : null,
        families,
      },
    ]
  })
}

const renderingOutput = (format: string) => ['svg', 'terminal', 'png'].includes(format)
/** A stopped worker or unsupported family cannot shrink the positive denominator.
 * Unknown input intent/reference cannot establish a scoped positive rendering ratio. */
export function positiveRenderScore(lane: Lane): { passed: number; total: number; rate: number } | null {
  const score = lane.positiveRendering
  if (lane.version === 'unavailable' || !score || score.unknownIntent || score.unknownReference || score.unmapped) return null
  const total = score.passed + score.failed + score.blocked + score.unavailable
  return total ? { passed: score.passed, total, rate: score.passed / total } : null
}

/** Correctness first: families supported, then pass rate in them, then calibrated speed. */
export function leagueOrder(left: Lane, right: Lane): number {
  const rate = (lane: Lane) => (lane.passed + lane.failed ? lane.passed / (lane.passed + lane.failed) : 0)
  return right.supported.length - left.supported.length || rate(right) - rate(left) || (left.coreFirstMs ?? Infinity) - (right.coreFirstMs ?? Infinity) || left.project.localeCompare(right.project)
}

/** Protocol/runtime cohort for one public surface; browser checks are part of its meaning. */
export function comparisonKey(record: ProjectBenchmarkRecord, surface: string): string {
  const protocol = record.identity.protocol as { context?: unknown; browserQualifier?: unknown } | null
  return stableValue([protocol?.context ?? record.identity.protocol, record.identity.measurement, surface.startsWith('browser:') ? protocol?.browserQualifier ?? null : null])
}

/** Published records carry no machine paths, so the results directory can be copied anywhere. */
function publishedRecord(record: ProjectBenchmarkRecord, evidence: ReportInputs) {
  const portable = (value: unknown): unknown => (typeof value === 'string' && isAbsolute(value) ? basename(value) : Array.isArray(value) ? value.map(portable) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, portable(item)])) : value)
  const measurement = record.identity.measurement as Record<string, any>
  return {
    schemaVersion: 1,
    project: record.identity.project,
    recordId: record.id,
    version: versionOf(record),
    status: record.status,
    startedAt: record.startedAt,
    finishedAt: record.finishedAt,
    rounds: rounds(record),
    profile: measurement?.profile ?? null,
    machine: { platform: measurement?.platform, arch: measurement?.arch, kernel: measurement?.kernel, cpu: measurement?.cpu?.[0] ?? null, cpus: measurement?.cpu?.length ?? null, node: measurement?.node?.version ?? null, bun: measurement?.bun?.version ?? null, browser: basename(String(measurement?.browser?.path ?? '')) || null, observer: measurement?.observer?.version ?? null },
    oracle: MERMAID_ORACLE_PIN,
    corpus: { ...communityCorpus().source, ...(communityCorpus().upstream ? { upstream: communityCorpus().upstream } : {}) },
    comparisonContext: (record.identity.protocol as { context?: unknown } | null)?.context ?? null,
    gaps: [...new Set([...record.gaps, ...evidence.gaps])],
    inputEvidence: {
      source: evidence.source,
      oracleLedgerComplete: evidence.oracleLedgerComplete,
      reference: evidence.reference,
      workloads: evidence.workloads.size,
      gaps: evidence.gaps,
      rejectedCaseIds: [...evidence.rejectedCaseIds].sort(),
      unlabeledCaseIds: [...evidence.workloads.values()].filter(workload => !workload.expectedLabels?.some(label => label.trim())).map(workload => workload.id).sort(),
    },
    authoredLabelAdmission: lanes(record, evidence).filter(lane => ['svg', 'terminal'].includes(lane.format)).map(lane => ({ surface: lane.surface, format: lane.format, counts: lane.authoredLabels })),
    positiveRenderAdmission: lanes(record, evidence).filter(lane => ['svg', 'terminal', 'png'].includes(lane.format)).map(lane => ({ surface: lane.surface, format: lane.format, counts: lane.positiveRendering })),
    observations: portable(record.observations),
  }
}

export function reportInputs(record: ProjectBenchmarkRecord): ReportInputs {
  const read = (file: string): any => existsSync(file) || existsSync(file + '.gz') ? readBenchmarkDocument(file) : undefined
  const context = read(join(record.evidenceDirectory, 'context.json'))?.inputs?.literal,
    local = context && Array.isArray(context.workloads) ? undefined : read(join(record.evidenceDirectory, 'community/community-inputs.json')),
    document = context && Array.isArray(context.workloads) ? context : local,
    declared: UnifiedWorkload[] = Array.isArray(document?.workloads) ? document.workloads : [],
    workloads = new Map<string, UnifiedWorkload>(),
    ledgerErrors = new Set<string>(),
    gaps: string[] = Array.isArray(document?.gaps) ? document.gaps.filter((gap: unknown): gap is string => typeof gap === 'string') : [],
    reference = document?.reference ?? null,
    rejected = ': pinned Mermaid rejected source ('
  for (const [index, workload] of declared.entries()) {
    if (typeof workload?.id !== 'string' || !workload.id) { ledgerErrors.add(`Malformed retained workload identity at index ${index}; positive rendering ratio unavailable`); continue }
    if (workloads.has(workload.id)) ledgerErrors.add(`Duplicate workload ID in retained input ledger: ${workload.id}; positive rendering ratio unavailable`)
    workloads.set(workload.id, workload)
  }
  const rejectedCaseIds = new Set([...gaps.filter(gap => gap.includes(rejected)).map(gap => gap.slice(0, gap.indexOf(rejected))).filter(id => workloads.has(id)), ...[...workloads.values()].filter(workload => workload.referenceAdmission?.accepted === false).map(workload => workload.id)])
  for (const workload of workloads.values()) if (workload.referenceAdmission?.accepted === true && rejectedCaseIds.has(workload.id)) ledgerErrors.add(`Contradictory pinned reference admission in retained input ledger: ${workload.id}; positive rendering ratio unavailable`)
  gaps.push(...ledgerErrors)
  return {
    source: document ? document === context ? 'context' : 'community-inputs' : 'unavailable',
    workloads,
    gaps,
    reference,
    oracleLedgerComplete: !ledgerErrors.size && Array.isArray(document?.gaps) && document.gaps.length === gaps.length && reference?.version === MERMAID_ORACLE_PIN.version && reference?.parserVersion === MERMAID_ORACLE_PIN.parser && reference?.domVersion === MERMAID_ORACLE_PIN.dom,
    rejectedCaseIds,
  }
}

/** Unknown declarations remain counted outside the positive denominator. A
 * source accepted by a peer cannot establish its own reference acceptance. */
export function positiveRenderAdmission(rows: BenchmarkObservation[], evidence: Pick<ReportInputs, 'workloads'>): PositiveRenderAdmission | null {
  if (![...evidence.workloads.values()].some(workload => workload.intent !== undefined)) return null
  const result: PositiveRenderAdmission = { passed: 0, failed: 0, blocked: 0, unavailable: 0, excludedParserOnly: 0, excludedDiagnostic: 0, excludedReferenceRejected: 0, unknownIntent: 0, unknownReference: 0, unmapped: 0 }
  const observed = new Map<string, BenchmarkObservation>()
  for (const row of rows) {
    if (!evidence.workloads.has(row.caseId)) { result.unmapped++; continue }
    if (observed.has(row.caseId)) throw Error('Duplicate positive-render observation: ' + row.caseId)
    observed.set(row.caseId, row)
  }
  // Plan from the frozen input ledger, not the rows a successful worker chose
  // to return. A stopped collector cannot shrink the positive denominator.
  for (const workload of evidence.workloads.values()) {
    if (workload.id.startsWith('core:') || !SCORED_FAMILIES.includes(workload.family)) continue
    const row = observed.get(workload.id)
    if (!['render', 'parse-only', 'negative-admission', 'diagnostic'].includes(workload.intent ?? '')) result.unknownIntent++
    else if (workload.intent === 'parse-only') result.excludedParserOnly++
    else if (workload.intent === 'negative-admission' || workload.intent === 'diagnostic') result.excludedDiagnostic++
    else if (workload.referenceAdmission?.accepted === false) result.excludedReferenceRejected++
    else if (!positiveRenderInput(workload)) result.unknownReference++
    else if (row && (row.status === 'passed' || row.status === 'failed' || row.status === 'blocked')) result[row.status]++
    else result.unavailable++
  }
  return result
}

function authoredLabelAdmission(rows: BenchmarkObservation[], evidence: ReportInputs): AuthoredLabelAdmission | null {
  if (!evidence.oracleLedgerComplete) return null
  const result: AuthoredLabelAdmission = { passed: 0, failed: 0, blocked: 0, unavailable: 0, excludedRejected: 0, excludedUnlabeled: 0, unmapped: 0 }
  for (const row of rows) {
    const workload = evidence.workloads.get(row.caseId)
    if (!workload) result.unmapped++
    else if (evidence.rejectedCaseIds.has(row.caseId)) result.excludedRejected++
    else if (!workload.expectedLabels?.some(label => label.trim())) result.excludedUnlabeled++
    else if (row.status === 'passed' || row.status === 'failed' || row.status === 'blocked') result[row.status]++
    else result.unavailable++
  }
  return result
}

/** Every failure, with the source, what was expected and the tool's own output when retained. */
function failurePage(record: ProjectBenchmarkRecord, out: string, evidence: ReportInputs): string {
  let copiedBytes = 0
  const workloads = evidence.workloads,
    project = record.identity.project
  const failures = record.observations.filter(row => row.status === 'failed' && featureRow(row) && row.metrics?.implementation === project)
  const lines = [`# ${project} ${versionOf(record)}: failures`, '', `${failures.length} raw failed observations. These include parser rejections and output admission failures; they are not all fidelity defects. Each retained input and oracle caveat remains visible.`, '', `[Back to the league table](../README.md)`, '']
  const families = [...new Set(failures.map(row => row.family))].sort()
  for (const family of families) {
    lines.push(`## ${family}`, '')
    for (const row of failures.filter(row => row.family === family)) {
      const workload = workloads.get(row.caseId)
      lines.push(`### ${escape(row.caseId)}`, '', `${SURFACES[row.surface] ?? row.surface}, ${OUTPUTS[row.format] ?? row.format}. ${escape(row.detail ?? (row.findings ?? []).join('; ') ?? 'failed')}`, '')
      if (evidence.rejectedCaseIds.has(row.caseId)) lines.push('Pinned Mermaid rejected this source. This is a retained legacy/invalid-input outcome, excluded from the secondary positive authored-label admission score.', '')
      else if (workload && !workload.expectedLabels?.some(label => label.trim())) lines.push('No nonempty authored-label expectation was recorded; a passing render can establish format admission only.', '')
      else if (workload && evidence.oracleLedgerComplete) lines.push('Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.', '')
      else lines.push('Retained input caveats are unavailable; positive-input admission cannot be established from this record.', '')
      for (const gap of evidence.gaps.filter(gap => gap.startsWith(row.caseId + ': '))) lines.push(`Oracle caveat: ${escape(gap)}`, '')
      if (workload) lines.push('```mermaid', workload.source, '```', '', `Expected labels: ${workload.expectedLabels?.length ? workload.expectedLabels.map(label => '`' + label.replaceAll('`', "'") + '`').join(', ') : 'none declared'}`, '')
      const output = row.metrics?.outputFile,
        retained = typeof output === 'string' ? (isAbsolute(output) ? output : join(record.evidenceDirectory, output)) : undefined
      if (retained && existsSync(retained)) {
        const bytes = statSync(retained).size
        if (bytes > 128 * 1024 || copiedBytes + bytes > 1024 * 1024) {
          lines.push(`Tool output (${bytes} bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.`, '')
          continue
        }
        const name = `${slug(row.caseId)}-${slug(row.surface)}${retained.slice(retained.lastIndexOf('.'))}`
        mkdirSync(join(out, 'outputs', slug(project)), { recursive: true })
        copyFileSync(retained, join(out, 'outputs', slug(project), name))
        copiedBytes += bytes
        lines.push(`Tool output: [${name}](../outputs/${slug(project)}/${name})`, '')
      }
    }
  }
  return lines.join('\n')
}

/** Speed against Mermaid on the same surface and output, as a multiple either way. */
const speedVersus = (ms: number, reference: number) => {
  const ratio = reference / ms,
    multiple = (value: number) => (value >= 10 ? value.toFixed(0) : value.toFixed(1))
  return ratio >= 1 ? `${multiple(ratio)}× faster` : `${multiple(1 / ratio)}× slower`
}
function table(lanes: Lane[], reference: Lane | undefined) {
  const lines = ['| Tool | Version | Surface | Families supported | Pass rate in supported families | Newer families | First-call fixed core | vs Mermaid | Repeated-source fixed core | Legacy 23-family mark | Record |', '|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|']
  const row = (lane: Lane) => {
    const tool = `[${escape(lane.project)}](https://github.com/${lane.project})`,
      ratio = lane.surface === reference?.surface && lane.format === reference.format && lane.coreFirstMs !== null && reference.coreFirstMs ? speedVersus(lane.coreFirstMs, reference.coreFirstMs) : '—',
      ms = (value: number | null) => (value === null ? '—' : `${value.toFixed(2)} ms`),
      newer = !lane.newer ? '—' : lane.newer.supported.length ? `${lane.newer.supported.length}/${NEWER_FAMILIES.length}, ${percent(lane.newer.passed, lane.newer.passed + lane.newer.failed)}` : `0/${NEWER_FAMILIES.length}`
    return `| ${lane === reference ? `*${tool} (reference)*` : tool} | ${escape(lane.version)} | ${SURFACES[lane.surface] ?? lane.surface} | ${lane.supported.length}/${SCORED_FAMILIES.length} | ${percent(lane.passed, lane.passed + lane.failed)} (${lane.passed}/${lane.passed + lane.failed}) | ${newer} | ${ms(lane.coreFirstMs)} | ${lane === reference && lane.coreFirstMs !== null ? 'reference' : ratio} | ${ms(lane.coreMedianMs)} | ${lane.legacy.supported}/${LEGACY_FAMILIES.length}, ${percent(lane.legacy.passed, lane.legacy.passed + lane.legacy.failed)} (${lane.legacy.passed}/${lane.legacy.passed + lane.legacy.failed}) | [record](records/${slug(lane.project)}.json.gz) · [failures](failures/${slug(lane.project)}.md) |`
  }
  if (reference) lines.push(row(reference))
  lanes.forEach(lane => lines.push(row(lane)))
  return lines
}

/** An unreleased build: the candidate lane, or a candidate artifact wherever it was written. */
export const isCandidateRecord = (record: ProjectBenchmarkRecord) => {
  const artifact = record.identity.artifact as { candidate?: unknown; package?: { artifact?: { candidate?: unknown } } } | undefined
  return record.identity.lane === 'candidate' || !!artifact?.candidate || !!artifact?.package?.artifact?.candidate
}

/** Render the league table and its evidence from the current records into a portable directory.
 * The table ranks releases only: candidate-lane records are left out, and a candidate in the release lane is refused. */
export function publishResults(store: string, out: string): { lanes: Lane[]; files: string[]; candidates: string[] } {
  const current = loadCurrentProjectRecords(store),
    records = current.filter(record => (record.identity.lane ?? 'community') === 'community')
  assertCurrentReportSetVersions(records)
  const misfiled = records.filter(isCandidateRecord)
  if (misfiled.length) throw Error(`results:publish ranks releases only; the release lane of ${store} holds candidate records for ${misfiled.map(record => record.identity.project).join(', ')}`)
  if (!records.length) throw Error('No current community records in ' + store)
  rmSync(join(out, 'records'), { recursive: true, force: true })
  rmSync(join(out, 'failures'), { recursive: true, force: true })
  rmSync(join(out, 'outputs'), { recursive: true, force: true })
  for (const directory of ['records', 'failures']) mkdirSync(join(out, directory), { recursive: true })
  copyPublicationMethods(out)
  const inputEvidence = new Map(records.map(record => [record, reportInputs(record)]))
  const comparison = new Map<Lane, string>()
  const all = records.flatMap(record => {
    return lanes(record, inputEvidence.get(record)).map(lane => {
      comparison.set(lane, comparisonKey(record, lane.surface))
      return lane
    })
  })
  for (const record of records) {
    writeFileSync(join(out, 'records', `${slug(record.identity.project)}.json.gz`), gzipSync(JSON.stringify(publishedRecord(record, inputEvidence.get(record)!)) + '\n', { level: 9 }))
    writeFileSync(join(out, 'failures', `${slug(record.identity.project)}.md`), failurePage(record, out, inputEvidence.get(record)!) + '\n')
  }
  const measured = records.map(record => record.finishedAt).sort()
  const calibrated = records.every(record => rounds(record) >= CALIBRATED_ROUNDS)
  const lines = [
    '# Mermaid public-artifact scorecards',
    '',
    `Measured ${measured[0]!.slice(0, 10)}${measured.at(-1)!.slice(0, 10) !== measured[0]!.slice(0, 10) ? ` to ${measured.at(-1)!.slice(0, 10)}` : ''} by [Trident](../README.md) against the pinned Mermaid ${MERMAID_ORACLE_PIN.version} oracle, on the corpus frozen from Agentic Mermaid ${communityCorpus().source.commit.slice(0, 8)}${communityCorpus().upstream ? `, with the newer families' examples from Mermaid's ${communityCorpus().upstream!.tag} syntax docs` : ''}. ${calibrated ? '' : `**Records with fewer than ${CALIBRATED_ROUNDS} rounds show no speed.**`}`,
    '',
    `How to read it: one table per kind of output, because SVG, terminal and parser tools are different products. Tables group each output by public invocation surface and compatible protocol/runtime settings; costs never cross these boundaries. Rolling records are not paired same-session experiments. Rows are alphabetical within each group. Coverage, conditional pass rate and fixed-core timing are separate diagnostics; none determines a rank or overall winner. That time sums the first call of each of the six fixed-core inputs in its process (median over rounds), so it cannot be a cache hit; the repeated-source column repeats identical input, which a tool that caches results by source answers from its cache. Mermaid is the reference row: it defines valid input, so it is measured with the same checks but not ranked. An unsupported family is a coverage gap, never a failure. The legacy 23-family column preserves the original mark; the current mark also includes stable Event Modeling and required first-party ZenUML. "Newer families" counts how many of Mermaid's ${NEWER_FAMILIES.length} newest families the tool supports, with its pass rate in them; it never changes the other columns. See the [methodology](METHODOLOGY.md).`,
    '',
  ]
  for (const format of new Set([...Object.keys(OUTPUTS), ...all.map(lane => lane.format)])) {
    const rows = all.filter(lane => lane.format === format)
    if (!rows.length) continue
    lines.push(`## ${OUTPUTS[format] ?? format}`, '')
    for (const surface of new Set(rows.map(lane => lane.surface))) {
      const cohorts = new Map<string, Lane[]>()
      for (const lane of rows.filter(lane => lane.surface === surface)) {
        const key = comparison.get(lane)!
        cohorts.set(key, [...(cohorts.get(key) ?? []), lane])
      }
      lines.push(`### ${SURFACES[surface] ?? surface}`, '')
      let cohort = 0
      for (const own of cohorts.values()) {
        if (cohorts.size > 1) lines.push(`#### Comparable cohort ${++cohort}`, '', 'Different protocol/runtime settings are shown separately; an absent matching Mermaid baseline has no ratio.', '')
        const reference = own.find(lane => lane.project === REFERENCE_PROJECT)
        lines.push(...table(own.filter(lane => lane.project !== REFERENCE_PROJECT).sort((a, b) => a.project.localeCompare(b.project) || a.surface.localeCompare(b.surface)), reference), '')
      }
    }
  }
  lines.push('## Input oracle caveats', '', 'Raw current and legacy observations above remain unchanged. They include retained legacy/parser fixtures and unlabeled format-only checks; their pass rates are not a complete Mermaid-fidelity score. Caveats come from each record’s frozen input context, never from a peer’s output. Counts below describe the input ledger, not executed cases; rejected and unlabeled sets may overlap.', '', '| Tool | Retained oracle warnings | Pinned-rejected inputs | Inputs without authored labels |', '|---|---:|---:|---:|')
  for (const record of records) {
    const evidence = inputEvidence.get(record)!
    lines.push(`| ${escape(record.identity.project)} | ${evidence.oracleLedgerComplete ? evidence.gaps.length : 'unavailable'} | ${evidence.oracleLedgerComplete ? evidence.rejectedCaseIds.size : '—'} | ${evidence.source === 'unavailable' ? '—' : [...evidence.workloads.values()].filter(workload => !workload.expectedLabels?.some(label => label.trim())).length} |`)
  }
  if ([...inputEvidence.values()].some(evidence => !evidence.oracleLedgerComplete)) lines.push('', 'Retained input caveats are unavailable for some records. Their original observations remain visible; no secondary positive-input score is inferred.')
  lines.push('', 'All input warnings are retained in each portable record’s `inputEvidence.gaps` and merged into its published `gaps`. SVG XML portability is distinct from browser drawing behavior: an unbound namespace prefix or HTML named entity can fail standalone XML admission even when an HTML page can display the drawing.', '', '## Pinned-accepted format-and-label admission', '', `Secondary SVG/terminal view for the ${SCORED_FAMILIES.length} current families, restricted to cases with nonempty recorded labels and no pinned-oracle rejection. This does not replace the raw observations. This view still retains runtime and standalone-XML failures, even when a browser can display readable labels; it is format-and-label admission, not a count of label defects. It does not establish topology, multiplicity, painted visibility, native-model coverage or complete fidelity. Explicit authored labels remain checkable when a DB getter is unavailable; a no-op parser such as ZenUML’s does not prove syntax validation. Parser-only fixtures may still fail rendering, so this is not a ledger of independently certified complete diagrams.`, '', '| Tool | Surface | Output | Passed / checked | Blocked / unavailable | Excluded rejected / unlabeled | Unmapped inputs |', '|---|---|---|---:|---:|---:|---:|')
  for (const lane of all.filter(lane => ['svg', 'terminal'].includes(lane.format))) {
    const score = lane.authoredLabels
    lines.push(`| ${escape(lane.project)} | ${SURFACES[lane.surface] ?? lane.surface} | ${OUTPUTS[lane.format]} | ${score ? `${percent(score.passed, score.passed + score.failed)} (${score.passed}/${score.passed + score.failed})` : 'unavailable'} | ${score ? `${score.blocked} / ${score.unavailable}` : '—'} | ${score ? `${score.excludedRejected} / ${score.excludedUnlabeled}` : '—'} | ${score?.unmapped ?? '—'} |`)
  }
  lines.push('', '## Declared positive rendering', '', 'Only inputs explicitly declared renderable by their owner and actually accepted by the pinned parser enter this fixed denominator; blocked, unsupported and missing outputs remain included. A scoped positive-render ratio requires complete known intent/reference declarations. Counts for partial known populations remain visible below without implying a complete ratio. Parser-only fixtures, intentional negative/diagnostic cases and observed reference rejection remain separate. Unknown historical intent/admission is unavailable, never inferred from a tool’s output or failure. This is admission under the output qualifier, not full semantic or perceptual fidelity; PNG decoded-content checks do not establish text/topology.', '', '| Tool | Surface | Output | Passed / known planned | Blocked / unavailable | Excluded parser / diagnostic / rejected | Unknown intent / reference / unmapped |', '|---|---|---|---:|---:|---:|---:|')
  for (const lane of all.filter(lane => ['svg', 'terminal', 'png'].includes(lane.format))) {
    const score = lane.positiveRendering
    lines.push(`| ${escape(lane.project)} | ${SURFACES[lane.surface] ?? lane.surface} | ${OUTPUTS[lane.format]} | ${score ? `${percent(score.passed, score.passed + score.failed + score.blocked + score.unavailable)} (${score.passed}/${score.passed + score.failed + score.blocked + score.unavailable})` : 'unavailable'} | ${score ? `${score.blocked} / ${score.unavailable}` : '—'} | ${score ? `${score.excludedParserOnly} / ${score.excludedDiagnostic} / ${score.excludedReferenceRejected}` : '—'} | ${score ? `${score.unknownIntent} / ${score.unknownReference} / ${score.unmapped}` : '—'} |`)
  }
  lines.push('')
  const grid = all.filter(lane => lane.format === 'svg' || lane.format === 'terminal').sort((a, b) => a.project.localeCompare(b.project) || a.surface.localeCompare(b.surface))
  const header = [`| Family | ${grid.map(lane => `${escape(lane.project.split('/')[1])} (${SURFACES[lane.surface] ?? lane.surface}, ${OUTPUTS[lane.format]})`).join(' | ')} |`, `|---|${grid.map(() => '---:').join('|')}|`]
  const cell = (lane: Lane, family: string) => (lane.families[family]!.unsupported ? '—' : percent(lane.families[family]!.passed, lane.families[family]!.passed + lane.families[family]!.failed))
  lines.push('## Families', '', `Pass rate per family, for each tool's SVG and terminal surfaces. "—" means the tool does not support the family. These are the ${SCORED_FAMILIES.length} scored families.`, '', ...header)
  for (const family of SCORED_FAMILIES) lines.push(`| ${family} | ${grid.map(lane => cell(lane, family)).join(' | ')} |`)
  const newer = grid.filter(lane => lane.newer)
  lines.push('', '### Newer families', '')
  if (newer.length) {
    lines.push(`Mermaid's ${NEWER_FAMILIES.length} newest families, added from 11.12.3 to 12.0.0; all use a \`-beta\` keyword. They are reported here and never scored. Event Modeling is scored above; its authored frame identities come from the independently pinned parser because its layout getter needs browser SVG measurements. Inline data and relationships remain unchecked. ZenUML is scored above using one explicitly labelled representative and the independently pinned first-party addon; its no-op parser supplies no syntax-validation or native-model proof.`, '')
    lines.push(`| Family | ${newer.map(lane => `${escape(lane.project.split('/')[1])} (${SURFACES[lane.surface] ?? lane.surface}, ${OUTPUTS[lane.format]})`).join(' | ')} |`, `|---|${newer.map(() => '---:').join('|')}|`)
    for (const family of NEWER_FAMILIES) lines.push(`| ${family} | ${newer.map(lane => cell(lane, family)).join(' | ')} |`)
  } else lines.push(`No record measured Mermaid's ${NEWER_FAMILIES.length} newest families yet.`)
  lines.push('', '## Reproduce a row', '', 'Every row is one project record. With the pinned Mermaid oracle installed (`node commands.ts mermaid:install`), this re-measures one project; unchanged projects are reused:', '', '```sh', 'bun commands.ts community:update --projects OWNER/TOOL --profile full --rounds 5 --records RECORDS --out EVIDENCE', 'bun commands.ts results:publish --records RECORDS --out results', '```', '', 'Each record (gzipped JSON) names its machine, runtimes, oracle pin, corpus commit and the tool version measured, and holds every observation.', '')
  writeFileSync(join(out, 'README.md'), lines.join('\n'))
  return { lanes: all, files: records.map(record => slug(record.identity.project)), candidates: current.filter(record => record.identity.lane === 'candidate').map(record => record.identity.project) }
}

if (import.meta.main) {
  const values = new Map<string, string>()
  for (let index = 2; index < process.argv.length; index += 2) values.set(process.argv[index]!, process.argv[index + 1]!)
  if (!values.has('--records') || [...values.keys()].some(key => !['--records', '--out'].includes(key))) throw Error('Use results:publish --records STORE [--out results]')
  const out = resolve(values.get('--out') ?? join(import.meta.dirname, '../results'))
  const result = publishResults(resolve(values.get('--records')!), out)
  console.log(JSON.stringify({ out, projects: result.files, lanes: result.lanes.length, candidatesLeftOut: result.candidates }))
}
