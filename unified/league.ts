import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { basename, isAbsolute, join, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import { MERMAID_ORACLE_PIN } from '../portable/mermaid-oracle.ts'
import { probedFamilies } from '../portable/cohorts.ts'
import { loadCurrentProjectRecords, readBenchmarkDocument, stableValue, type ProjectBenchmarkRecord } from '../portable/project-records.ts'
import { rankCommunityObservations } from './community.ts'
import { communityCorpus } from './corpus.ts'
import type { BenchmarkObservation, UnifiedWorkload } from './types.ts'

/** Mermaid defines valid input, so its row is the reference, not a contestant. */
export const REFERENCE_PROJECT = 'mermaid-js/mermaid'
/** Fewer rounds than this cannot calibrate a speed; such rows show no speed at all. */
export const CALIBRATED_ROUNDS = 5
/** The families Trident can probe: one canonical source each in the portable family cohort. */
export const PROBED_FAMILIES = probedFamilies()

export const OUTPUTS: Record<string, string> = { svg: 'SVG', terminal: 'Terminal text', png: 'PNG', parse: 'Parser', diagnostics: 'Diagnostics', source: 'Formatted Mermaid source', 'react-flow': 'React Flow model' }
export const SURFACES: Record<string, string> = { 'browser:public-api': 'browser API', 'node:public-api': 'Node API', 'bun:public-api': 'Bun API', 'node:public-parse-validation': 'Node parser API', 'cli:end-to-end': 'CLI', 'python:public-api': 'Python API', 'native:in-process-api': 'native API' }
const slug = (project: string) => project.replace(/[^a-z0-9._-]+/gi, '-').toLowerCase()
export const percent = (passed: number, total: number) => (total ? `${((100 * passed) / total).toFixed(1)}%` : '—')
export const escape = (value: unknown) => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ')

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
  /** Fixed core, each input's first call in its process: median over rounds, summed. Cache-proof. */
  coreFirstMs: number | null
  /** Fixed core, repeated identical source: what a tool that caches by source reports. */
  coreMedianMs: number | null
  families: Record<string, { passed: number; failed: number; unsupported: boolean }>
}

const rounds = (record: ProjectBenchmarkRecord) => Number((record.identity.measurement as { rounds?: number } | undefined)?.rounds ?? 0)
const versionOf = (record: ProjectBenchmarkRecord) => String(record.observations.find(row => row.metrics?.version)?.metrics?.version ?? (record.identity.artifact as any)?.package?.artifact?.version ?? 'unknown')
export const featureRow = (row: BenchmarkObservation) => !row.caseId.startsWith('core:') && !['family-support', 'capability', 'delivery', 'memory', 'load-and-initialize', 'worker-lifecycle', 'enroll', 'resource-diagnostic'].includes(row.operation) && !row.operation.endsWith('negative-admission')

/** One row per tool and public surface/output, from one retained project record. */
export function lanes(record: ProjectBenchmarkRecord): Lane[] {
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
    // A surface that measured nothing (for example Mermaid's SVG in Node, which needs a browser) has no row.
    if (!features.length) return []
    const probes = rows.filter(row => row.operation === 'family-support')
    const unsupported = probes.filter(row => row.status === 'unsupported').map(row => row.family)
    const families: Lane['families'] = {}
    for (const family of PROBED_FAMILIES) {
      const own = features.filter(row => row.family === family)
      families[family] = { passed: own.filter(row => row.status === 'passed').length, failed: own.filter(row => row.status === 'failed').length, unsupported: unsupported.includes(family) }
    }
    const rank = speed.find(item => item.surface === surface && item.output === format)
    const firstCalls = rank?.qualified ? rank.requiredCaseIds.map(id => {
      // Every CLI sample is a fresh process, so its sample is already a first call.
      const values = rows.filter(row => row.caseId === id && row.status === 'passed').map(row => Number(surface === 'cli:end-to-end' ? row.samplesMs?.[0] : row.metrics?.firstMs)).filter(Number.isFinite).sort((a, b) => a - b)
      return values.length === rounds(record) ? values[values.length >> 1]! : NaN
    }) : []
    return [
      {
        project: record.identity.project,
        version: versionOf(record),
        surface,
        format,
        rounds: rounds(record),
        supported: probes.filter(row => row.status !== 'unsupported').map(row => row.family),
        unsupported,
        passed: features.filter(row => row.status === 'passed').length,
        failed: features.filter(row => row.status === 'failed').length,
        blocked: features.filter(row => row.status === 'blocked').length,
        coreFirstMs: rounds(record) >= CALIBRATED_ROUNDS && firstCalls.length && firstCalls.every(Number.isFinite) ? firstCalls.reduce((sum, value) => sum + value, 0) : null,
        coreMedianMs: rounds(record) >= CALIBRATED_ROUNDS && rank?.qualified ? rank.medianMs : null,
        families,
      },
    ]
  })
}

/** Correctness first: families supported, then pass rate in them, then calibrated speed. */
export function leagueOrder(left: Lane, right: Lane): number {
  const rate = (lane: Lane) => (lane.passed + lane.failed ? lane.passed / (lane.passed + lane.failed) : 0)
  return right.supported.length - left.supported.length || rate(right) - rate(left) || (left.coreFirstMs ?? Infinity) - (right.coreFirstMs ?? Infinity) || left.project.localeCompare(right.project)
}

/** Published records carry no machine paths, so the results directory can be copied anywhere. */
function publishedRecord(record: ProjectBenchmarkRecord) {
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
    corpus: communityCorpus().source,
    comparisonContext: (record.identity.protocol as { context?: unknown } | null)?.context ?? null,
    gaps: record.gaps,
    observations: portable(record.observations),
  }
}

function inputs(record: ProjectBenchmarkRecord): Map<string, UnifiedWorkload> {
  const file = join(record.evidenceDirectory, 'community/community-inputs.json')
  if (!existsSync(file)) return new Map()
  return new Map((readBenchmarkDocument(file).workloads as UnifiedWorkload[]).map(workload => [workload.id, workload]))
}

/** Every failure, with the source, what was expected and the tool's own output when retained. */
function failurePage(record: ProjectBenchmarkRecord, out: string): string {
  const workloads = inputs(record),
    project = record.identity.project
  const failures = record.observations.filter(row => row.status === 'failed' && featureRow(row) && row.metrics?.implementation === project)
  const lines = [`# ${project} ${versionOf(record)}: failures`, '', `${failures.length} failed observations in families the tool supports. Each shows the input, what the pinned Mermaid ${MERMAID_ORACLE_PIN.version} oracle expects, and what the tool did.`, '', `[Back to the league table](../README.md)`, '']
  const families = [...new Set(failures.map(row => row.family))].sort()
  for (const family of families) {
    lines.push(`## ${family}`, '')
    for (const row of failures.filter(row => row.family === family)) {
      const workload = workloads.get(row.caseId)
      lines.push(`### ${escape(row.caseId)}`, '', `${SURFACES[row.surface] ?? row.surface}, ${OUTPUTS[row.format] ?? row.format}. ${escape(row.detail ?? (row.findings ?? []).join('; ') ?? 'failed')}`, '')
      if (workload) lines.push('```mermaid', workload.source, '```', '', `Expected labels: ${workload.expectedLabels?.length ? workload.expectedLabels.map(label => '`' + label.replaceAll('`', "'") + '`').join(', ') : 'none declared'}`, '')
      const output = row.metrics?.outputFile,
        retained = typeof output === 'string' ? (isAbsolute(output) ? output : join(record.evidenceDirectory, output)) : undefined
      if (retained && existsSync(retained)) {
        const name = `${slug(row.caseId)}-${slug(row.surface)}${retained.slice(retained.lastIndexOf('.'))}`
        mkdirSync(join(out, 'outputs', slug(project)), { recursive: true })
        copyFileSync(retained, join(out, 'outputs', slug(project), name))
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
  const lines = ['| Rank | Tool | Version | Surface | Families supported | Pass rate in supported families | First-call fixed core | vs Mermaid | Repeated-source fixed core | Record |', '|---:|---|---|---|---:|---:|---:|---:|---:|---|']
  const row = (lane: Lane, rank: string) => {
    const tool = `[${escape(lane.project)}](https://github.com/${lane.project})`,
      ratio = lane.surface === reference?.surface && lane.format === reference.format && lane.coreFirstMs !== null && reference.coreFirstMs ? speedVersus(lane.coreFirstMs, reference.coreFirstMs) : '—',
      ms = (value: number | null) => (value === null ? '—' : `${value.toFixed(2)} ms`)
    return `| ${rank} | ${lane === reference ? `*${tool} (reference)*` : tool} | ${escape(lane.version)} | ${SURFACES[lane.surface] ?? lane.surface} | ${lane.supported.length}/${PROBED_FAMILIES.length} | ${percent(lane.passed, lane.passed + lane.failed)} (${lane.passed}/${lane.passed + lane.failed}) | ${ms(lane.coreFirstMs)} | ${lane === reference && lane.coreFirstMs !== null ? 'reference' : ratio} | ${ms(lane.coreMedianMs)} | [record](records/${slug(lane.project)}.json.gz) · [failures](failures/${slug(lane.project)}.md) |`
  }
  if (reference) lines.push(row(reference, '—'))
  lanes.forEach((lane, index) => lines.push(row(lane, String(index + 1))))
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
  const misfiled = records.filter(isCandidateRecord)
  if (misfiled.length) throw Error(`results:publish ranks releases only; the release lane of ${store} holds candidate records for ${misfiled.map(record => record.identity.project).join(', ')}`)
  if (!records.length) throw Error('No current community records in ' + store)
  rmSync(join(out, 'records'), { recursive: true, force: true })
  rmSync(join(out, 'failures'), { recursive: true, force: true })
  rmSync(join(out, 'outputs'), { recursive: true, force: true })
  for (const directory of ['records', 'failures']) mkdirSync(join(out, directory), { recursive: true })
  const comparison = new Map<Lane, string>()
  const all = records.flatMap(record => {
    const protocol = record.identity.protocol as { context?: unknown; browserQualifier?: unknown } | null
    return lanes(record).map(lane => {
      comparison.set(lane, stableValue([protocol?.context ?? record.identity.protocol, record.identity.measurement, lane.surface.startsWith('browser:') ? protocol?.browserQualifier ?? null : null]))
      return lane
    })
  })
  for (const record of records) {
    writeFileSync(join(out, 'records', `${slug(record.identity.project)}.json.gz`), gzipSync(JSON.stringify(publishedRecord(record)) + '\n', { level: 9 }))
    writeFileSync(join(out, 'failures', `${slug(record.identity.project)}.md`), failurePage(record, out) + '\n')
  }
  const measured = records.map(record => record.finishedAt).sort()
  const calibrated = records.every(record => rounds(record) >= CALIBRATED_ROUNDS)
  const lines = [
    '# Mermaid derivatives league table',
    '',
    `Measured ${measured[0]!.slice(0, 10)}${measured.at(-1)!.slice(0, 10) !== measured[0]!.slice(0, 10) ? ` to ${measured.at(-1)!.slice(0, 10)}` : ''} by [Trident](../README.md) against the pinned Mermaid ${MERMAID_ORACLE_PIN.version} oracle, on the corpus frozen from Agentic Mermaid ${communityCorpus().source.commit.slice(0, 8)}. ${calibrated ? '' : `**Records with fewer than ${CALIBRATED_ROUNDS} rounds show no speed.**`}`,
    '',
    'How to read it: one table per kind of output, because SVG, terminal and parser tools are different products. Tables group each output by public invocation surface and compatible protocol/runtime settings; costs and ranks never cross these boundaries. Rolling records are not paired same-session experiments. Rows within each group are ordered by correctness first: how many of the probed families the tool supports, then the share of cases it passes in those families, then first-call fixed-core time. That time sums the first call of each of the six fixed-core inputs in its process (median over rounds), so it cannot be a cache hit; the repeated-source column repeats identical input, which a tool that caches results by source answers from its cache. Mermaid is the reference row: it defines valid input, so it is measured with the same checks but not ranked. An unsupported family is a coverage gap, never a failure. See the [methodology](../METHODOLOGY.md).',
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
        lines.push(...table(own.filter(lane => lane.project !== REFERENCE_PROJECT).sort(leagueOrder), reference), '')
      }
    }
  }
  const grid = all.filter(lane => lane.format === 'svg' || lane.format === 'terminal').sort(leagueOrder)
  lines.push('## Families', '', `Pass rate per family, for each tool's SVG and terminal surfaces. "—" means the tool does not support the family. Trident probes ${PROBED_FAMILIES.length} families; Mermaid ${MERMAID_ORACLE_PIN.version} documents more, which have no cases yet.`, '')
  lines.push(`| Family | ${grid.map(lane => `${escape(lane.project.split('/')[1])} (${SURFACES[lane.surface] ?? lane.surface}, ${OUTPUTS[lane.format]})`).join(' | ')} |`, `|---|${grid.map(() => '---:').join('|')}|`)
  for (const family of PROBED_FAMILIES) lines.push(`| ${family} | ${grid.map(lane => (lane.families[family]!.unsupported ? '—' : percent(lane.families[family]!.passed, lane.families[family]!.passed + lane.families[family]!.failed))).join(' | ')} |`)
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
