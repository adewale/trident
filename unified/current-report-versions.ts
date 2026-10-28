import type { ProjectBenchmarkRecord } from '../portable/project-records.ts'
import { assertBenchmarkSetVersions, type BenchmarkToolVersion } from '../tool-versions.ts'

/** Current report admission, not raw-history deserialization. Dependency/runtime
 * versions and source revisions are deliberately not project release claims. */
export function currentReportVersion(record: ProjectBenchmarkRecord): string | null {
  const artifact = record.identity.artifact as {
    version?: unknown
    package?: { artifact?: { version?: unknown } }
    browser?: { version?: unknown }
  } | null
  const owners = [
    ['package artifact', artifact?.package?.artifact?.version],
    ['browser artifact', artifact?.browser?.version],
    ['direct artifact', artifact?.version],
  ] as const
  const claims: BenchmarkToolVersion[] = []
  const claim = (version: unknown, source: string) => {
    if (version === undefined || version === null) return
    if (typeof version !== 'string') throw Error(`Invalid project artifact version in ${record.id}: ${source}`)
    claims.push({ tool: record.identity.project, version, source: `${record.id}: ${source}` })
  }
  for (const [source, version] of owners) claim(version, source)
  for (const row of record.observations) {
    if (row.metrics?.runtimeExecuted === false || row.mode === 'not-executed') continue
    claim(row.metrics?.version, `${row.suite}/${row.surface}/${row.caseId}`)
  }
  // One record is one project artifact. Candidate and release records are
  // admitted independently, so their explicitly compared versions may differ.
  const candidate = record.identity.lane === 'candidate' || !!(record.identity.artifact as any)?.candidate || !!(record.identity.artifact as any)?.package?.artifact?.candidate
  if (candidate) {
    for (const { version } of claims) if (!version.trim() || version !== version.trim()) throw Error('Missing artifact version in candidate record ' + record.id)
    if (new Set(claims.map(claim => claim.version)).size > 1) throw Error('Mixed tool versions in candidate record ' + record.id)
  } else assertBenchmarkSetVersions(claims)
  const owning = owners.find(([, version]) => typeof version === 'string')?.[1]
  return typeof owning === 'string' ? owning : null
}

/** Release tables are one version set even when distinct catalog IDs alias the
 * same canonical tool. Explicit candidate/release comparisons stay separate. */
export function assertCurrentReportSetVersions(records: readonly ProjectBenchmarkRecord[]): void {
  const claims = records.flatMap(record => {
    const version = currentReportVersion(record)
    return version === null ? [] : [{ tool: record.identity.project, version, source: record.id }]
  })
  assertBenchmarkSetVersions(claims)
}
