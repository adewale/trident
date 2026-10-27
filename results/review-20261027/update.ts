/** Refresh this snapshot from retained Trident records. Run: bun update.ts STORE [OUT]. */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { projectRecordPath, readProjectBenchmarkRecord } from '../../portable/project-records.ts'
import { comparisonKey, lanes, reportInputs, SCORED_FAMILIES, NEWER_FAMILIES } from '../../unified/league.ts'
import { renderCandidateComparison } from '../../unified/candidate-comparison.ts'

if (!process.argv[2]) throw Error('Use bun update.ts STORE [OUT]; runs.json identifies the exact retained records')
const store = resolve(process.argv[2]), out = resolve(process.argv[3] ?? import.meta.dir)
const manifest = JSON.parse(readFileSync(join(import.meta.dir, 'runs.json'), 'utf8'))
mkdirSync(out, { recursive: true })
const rows = manifest.runs.map((run: any) => {
  const record = readProjectBenchmarkRecord(projectRecordPath(store, run.project, run.record))
  if (record.id !== run.record || record.identity.project !== run.project) throw Error('Record owner/identity differs from runs.json')
  const digest = (record.identity.artifact as any)?.candidate?.sha256
  if (run.sha256 && digest !== run.sha256) throw Error('Candidate archive differs from its source-build receipt')
  return { run, record }
})
const median = (values: number[]) => {
  const a = values.filter(Number.isFinite).sort((a, b) => a - b)
  return a.length ? (a[(a.length - 1) >> 1]! + a[a.length >> 1]!) / 2 : null
}
const portable = (value: any): any => Array.isArray(value) ? value.map(portable) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, value]) => [key, portable(value)])) : typeof value === 'string' && value.startsWith('/') ? basename(value) : value
const groups = new Map<string, string>()
const summaries = rows.map(({ run, record }: any) => {
  const input = reportInputs(record), own = lanes(record, input)
  const group = comparisonKey(record, 'browser:public-api')
  if (!groups.has(group)) groups.set(group, `browser-cohort-${groups.size + 1}`)
  const browser = record.observations.filter((row: any) => row.suite === 'community-browser' && row.surface === 'browser:public-api' && row.status === 'passed')
  const core = browser.filter((row: any) => row.metrics?.featureCases === 0 && row.metrics?.portfolioCaseCount === 6)
  const values = (operation: string, metric: string) => core.filter((row: any) => row.operation === operation).map((row: any) => Number(row.metrics?.[metric])).filter(Number.isFinite)
  const startup = browser.filter((row: any) => row.operation === 'load-and-initialize').flatMap((row: any) => row.samplesMs ?? [])
  const release = rows.find((row: any) => row.record.identity.project === record.identity.project && (row.record.identity.lane ?? 'community') === 'community')?.record
  if (record.identity.lane === 'candidate') writeFileSync(join(out, `candidate-${run.key}.md`), renderCandidateComparison(record, release))
  return {
    project: record.identity.project, lane: record.identity.lane ?? 'community', key: run.key,
    label: run.label, head: run.head ?? null, archiveSha256: run.sha256 ?? null,
    id: record.id, status: record.status, startedAt: record.startedAt, finishedAt: record.finishedAt,
    version: own[0]?.version ?? 'unavailable', browserComparison: groups.get(group),
    measurement: portable(record.identity.measurement), lanes: own,
    runtimeDependencies: (record.identity.artifact as any)?.package?.dependencies?.nodes?.map((node: any) => ({ name: node.name, version: node.version })) ?? (record.identity.artifact as any)?.package?.artifact?.dependencies ?? null,
    inputEvidence: { oracle: input.reference, completeLedger: input.oracleLedgerComplete, gaps: input.gaps },
    browserResources: {
      startupMs: median(startup), startupSamplesMs: startup,
      coreGzipBytes: median(values('delivery', 'gzipBytes')),
      coreJsHeapUsedBytes: median(values('memory', 'jsHeapUsedBytes')),
      coreJsHeapSamples: values('memory', 'jsHeapUsedBytes'),
      coreRequestCount: median(values('delivery', 'requests')),
      fullPortfolioGzipBytes: browser.find((row: any) => row.operation === 'delivery' && row.metrics?.round === 1)?.metrics?.gzipBytes ?? null,
      fullPortfolioCaseCount: browser.find((row: any) => row.operation === 'delivery' && row.metrics?.round === 1)?.metrics?.portfolioCaseCount ?? null,
      heapScope: 'Fresh browser realm, forced GC after six fixed-core inputs; rounds 2–5. Excludes native, WASM and GPU memory.',
    },
    resources: portable(record.observations.filter((row: any) => ['memory', 'delivery', 'load-and-initialize', 'resource-diagnostic'].includes(row.operation)).map((row: any) => ({ suite: row.suite, surface: row.surface, operation: row.operation, mode: row.mode, status: row.status, samplesMs: row.samplesMs, metrics: row.metrics, detail: row.detail }))),
    gaps: [...new Set([...record.gaps, ...input.gaps])],
  }
})
writeFileSync(join(out, 'comparison.json'), JSON.stringify({ schemaVersion: 1, generatedAt: new Date().toISOString(), currentRendererKey: manifest.currentRendererKey ?? 'current', latestRendererEquivalence: manifest.latestRendererEquivalence ?? null, currentFamilies: SCORED_FAMILIES, supplementaryFamilies: NEWER_FAMILIES, corpus: manifest.corpus, records: summaries }, null, 2) + '\n')
console.log(`Exported ${summaries.length} exact records; no renderer or timing lane ran.`)
