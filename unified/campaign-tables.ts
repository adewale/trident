import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { readBenchmarkDocument } from '../portable/project-records.ts'
import { campaignResults, campaignProjectId, campaignArtifactRole, type CampaignEnvelope } from './campaign-publication.ts'
import type { SnapshotTable } from './results-snapshot.ts'
import type { PublicSuite } from './support.ts'

const measuredAt = (rows: any[], fallback: string): string => rows.map(row => row.metrics?.measuredAt).filter((value): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value))).sort((a, b) => Date.parse(a) - Date.parse(b)).at(-1) ?? fallback
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex')
/** Tables are reductions of owning observations, with interfaces and observed
 * populations separated. No hand-transcribed numbers or pooled overall score. */
export function campaignTables(report: CampaignEnvelope, receipt: SnapshotTable['receipt']): SnapshotTable[] {
  const projectId = (value: unknown) => campaignProjectId(value, report.projects ?? [])
  const artifactRole = campaignArtifactRole(report), candidate = artifactRole === 'candidate'
  const tables = new Map<string, SnapshotTable>()
  const add = (key: unknown[], suite: PublicSuite, measuredAt: string, caption: string, columns: string[], project: string, values: (string | number)[], ranking: SnapshotTable['ranking'], extra: Partial<SnapshotTable> = {}) => {
    const id = 'run-' + hash([receipt.sha256, ...key]).slice(0, 24)
    const entry = tables.get(id) ?? { id, suite, measuredAt, campaignUpdatedAt: report.updatedAt, historical: (report as any).schema !== 'trident-campaign-v2', unit: 'observations', caption, columns, rows: [], receipt, ranking, ...(artifactRole ? { artifactRole } : {}), ...extra }
    if (entry.rows.some(row => row.project === project)) throw Error('Duplicate project in reduced campaign cohort')
    if (Date.parse(measuredAt) > Date.parse(entry.measuredAt)) entry.measuredAt = measuredAt
    entry.rows.push({ project, values }); tables.set(id, entry)
  }
  for (const boundary of report.results) {
    if (!boundary.out) continue
    const cohort = (boundary as typeof boundary & { cohort?: string }).cohort ?? 'core'
    if (boundary.suite === 'portable') {
      const file = join(boundary.out, 'report.json')
      if (!existsSync(file)) continue
      const result = readBenchmarkDocument(file) as any
      if (!result.summary?.timing || !result.version || !result.finishedAt) continue
      const cases = result.summary.cases as any[]
      if (Array.isArray(cases) && cases.every(row => typeof row.expectedAccepted === 'boolean')) {
        if (new Set(cases.map(row => row.id)).size !== cases.length) throw Error('Portable case inventory is duplicated')
        const positive = cases.filter(row => row.expectedAccepted), negative = cases.filter(row => !row.expectedAccepted)
        const admitted = positive.filter(row => row.outputAdmission === 'passed').length
        const unsupported = positive.filter(row => row.outputAdmission !== 'passed' && row.unsupported).length
        const failed = positive.filter(row => row.outputAdmission !== 'passed' && !row.unsupported && (row.failedWorkers > 0 || row.outputAdmission === 'failed')).length
        const blocked = positive.filter(row => row.outputAdmission !== 'passed' && !row.unsupported && !row.failedWorkers && row.outputAdmission !== 'failed' && row.blockedWorkers > 0).length
        add(['portable-admission', cohort, result.protocol, result.sampling, hash(cases.map(row => [row.id, row.expectedAccepted]))], 'portable', result.finishedAt,
          'Public Node SVG output admission on the same planned cases and sampling. Invalid rejection and declared semantics remain separate from SVG return; no overall quality score is inferred.',
          ['Version', 'Admitted', 'Failed', 'Unsupported', 'Blocked', 'Unmeasured', 'Planned positive', 'Invalid rejected', 'Planned invalid', 'Declared semantics complete', 'Measured'], result.project,
          [result.version, admitted, failed, unsupported, blocked, positive.length - admitted - failed - unsupported - blocked, positive.length,
            negative.filter(row => row.acceptanceMatches && !row.failedWorkers && !row.blockedWorkers).length, negative.length, positive.filter(row => row.semanticComplete).length, result.finishedAt],
          { column: 'Admitted', denominator: 'Planned positive', direction: 'descending' },
          { unit: 'cases', population: { total: 'Planned positive', outcomes: ['Admitted', 'Failed', 'Unsupported', 'Blocked', 'Unmeasured'] } })
      }
      for (const row of result.summary.timing) {
        if (!row.expectedAccepted) continue
        const qualified = row.outputAdmissionComplete && row.outputCalibration?.status === 'calibrated'
        add(['portable', cohort, row.caseId, row.track, result.protocol, result.sampling], 'portable', result.finishedAt,
          `${row.caseId}; ${row.track}. ${row.scope} SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.`,
          ['Version', 'Median ms', 'Samples', 'Declared semantics', 'Output calibration', 'Measured'], result.project,
          [result.version, qualified && Number.isFinite(row.medianMs) ? row.medianMs : 'withheld', row.samples, row.semanticComplete ? 'complete for this case' : 'partial', row.outputCalibration?.status ?? 'unavailable', result.finishedAt],
          { column: 'Median ms', direction: 'ascending' }, { unit: 'ms' })
      }
      continue
    }
    const results = campaignResults(boundary)
    for (const result of results) {
      if (boundary.suite === 'docs') {
        const file = join(boundary.out, 'inventory.json')
        if (!existsSync(file)) continue
        const inventory = JSON.parse(readFileSync(file, 'utf8'))
        if (!Array.isArray(inventory.cases) || new Set(inventory.cases.map((c: any) => c.id)).size !== inventory.cases.length) throw Error('Docs inventory IDs are missing or duplicated')
        const projects = new Set(result.observations.map(row => projectId(String(row.metrics?.project ?? row.metrics?.implementation ?? boundary.project))))
        for (const project of projects) {
          const own = result.observations.filter(row => projectId(String(row.metrics?.project ?? row.metrics?.implementation ?? boundary.project)) === project)
          if (!own.some(row => row.operation === 'render' || row.status === 'blocked')) continue
          const coordinates = new Set<string>(), byCase = new Map<string, typeof own>()
          for (const row of own.filter(row => row.operation === 'render')) {
            const coordinate = JSON.stringify([row.caseId, row.metrics?.round])
            if (coordinates.has(coordinate) || !Number.isInteger(row.metrics?.round) || Number(row.metrics?.round) < 1 || Number(row.metrics?.round) > report.rounds || !inventory.cases.some((c: any) => c.id === row.caseId)) throw Error('Docs observations do not match the declared inventory/rounds')
            coordinates.add(coordinate); byCase.set(row.caseId, [...(byCase.get(row.caseId) ?? []), row])
          }
          const counts = { passed: 0, failed: 0, unsupported: 0, blocked: 0, missing: 0 }
          for (const input of inventory.cases) {
            const observations = byCase.get(input.id) ?? []
            if (observations.length === report.rounds && observations.every(row => row.status === 'passed')) counts.passed++
            else if (observations.some(row => row.status === 'failed')) counts.failed++
            else if (observations.some(row => row.status === 'unsupported')) counts.unsupported++
            else if (observations.some(row => row.status === 'blocked') || own.some(row => row.operation === 'artifact-admission' && row.status === 'blocked')) counts.blocked++
            else counts.missing++
          }
          const version = own.find(row => typeof row.metrics?.version === 'string')?.metrics?.version ?? result.toolVersions?.find(row => projectId(row.tool) === project)?.version ?? 'unavailable'
          add(['docs', cohort, hash(inventory.cases), report.rounds], 'docs', measuredAt(own, result.finishedAt),
            `Pinned documentation occurrences; Chromium public SVG calls. Returned means the occurrence returned SVG in all ${report.rounds} declared rounds. Failures and unexecuted work retain the full inventory. SVG return does not certify meaning or paint.`,
            ['Version', 'Returned in all rounds', 'Failed', 'Unsupported', 'Blocked', 'Unexecuted', 'Planned', 'Measured'], project,
            [String(version), counts.passed, counts.failed, counts.unsupported, counts.blocked, counts.missing, inventory.cases.length, measuredAt(own, result.finishedAt)],
            { column: 'Returned in all rounds', denominator: 'Planned', direction: 'descending' },
            { unit: 'documentation occurrences', population: { total: 'Planned', outcomes: ['Returned in all rounds', 'Failed', 'Unsupported', 'Blocked', 'Unexecuted'] }, ...(candidate ? { artifactRole: 'candidate' } : { overview: { numerator: 'Returned in all rounds', denominator: 'Planned', suffix: '%' } }) })
        }
        continue
      }
      const groups = new Map<string, typeof result.observations>()
      for (const row of result.observations) {
        const project = projectId(String(row.metrics?.project ?? row.metrics?.implementation ?? boundary.project ?? 'unattributed'))
        if (project === 'unattributed') continue
        const surface = row.surface.startsWith(project + ':') ? row.surface.slice(project.length + 1) : row.surface
        const key = JSON.stringify([project, surface, row.runtime, row.format ?? '', row.operation ?? '', row.metrics?.variant ?? 'default'])
        groups.set(key, [...(groups.get(key) ?? []), row])
      }
      for (const [key, observations] of groups) {
        const [project, surface, runtime, format, operation, variant] = JSON.parse(key)
        // Equal recorded coordinates are necessary for comparing check counts.
        // Different projections or populations get their own cohort, never a rate
        // purporting to cover an inferred whole-diagram inventory.
        const population = observations.map(row => JSON.stringify([row.caseId, row.mode, row.metrics?.round ?? null])).sort()
        const counts = (status: string) => observations.filter(row => row.status === status).length
        const passed = counts('passed'), failed = counts('failed'), unsupported = counts('unsupported'), blocked = counts('blocked'), inapplicable = counts('not-applicable'), skipped = counts('skipped')
        const version = observations.find(row => typeof row.metrics?.version === 'string')?.metrics?.version ?? result.toolVersions?.find(row => projectId(row.tool) === project)?.version ?? 'unavailable'
        add([boundary.suite, cohort, result.id, surface, runtime, format, operation, variant, hash(population)], boundary.suite as PublicSuite, measuredAt(observations, result.finishedAt),
          `${cohort}; ${variant}; ${surface}; ${runtime}; ${format || 'no format'}; ${operation || 'declared checks'}. Compared rows have the same recorded check coordinates. Counts are observations, not inferred diagram passes or full-inventory coverage. Missing bindings remain in campaign attempts.`,
          ['Version', 'Passed', 'Failed', 'Unsupported', 'Blocked', 'Not applicable', 'Skipped', 'Unavailable', 'Recorded', 'Measured'], project,
          [String(version), passed, failed, unsupported, blocked, inapplicable, skipped, observations.length - passed - failed - unsupported - blocked - inapplicable - skipped, observations.length, measuredAt(observations, result.finishedAt)],
          { column: 'Passed', direction: 'descending' }, { ...(candidate ? { artifactRole: 'candidate' } : {}), population: { total: 'Recorded', outcomes: ['Passed', 'Failed', 'Unsupported', 'Blocked', 'Not applicable', 'Skipped', 'Unavailable'] } })
      }
    }
  }
  // Charts use exactly the table's verified numeric rows. Fully unobserved rows
  // stay visible and unranked in the table, without a fabricated zero bar.
  for (const table of tables.values()) {
    if (table.suite === 'docs' && table.rows.every(row => Number(row.values[4]) + Number(row.values[5]) < Number(row.values[6]))) table.chart = { numerator: 'Returned in all rounds', denominator: 'Planned', title: 'Documentation SVG return', axis: '%', maximum: 100 }
  }
  return [...tables.values()]
}
