import { drawingOutcomeColumns, drawingOutcomeStatistics, drawingStatisticsColumns, type DrawingOutcomeCounts } from './drawing-outcomes.ts'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'
import { campaignScorecards, campaignArtifactRole, campaignReportFile, readCampaign } from './campaign-publication.ts'
import { lineageInventory, type LineageCatalog } from './lineage.ts'
import { PUBLIC_SUITES, coreScopeReason, projectSupport, type PublicSuite } from './support.ts'
import { communityCatalogFile } from './trident-paths.ts'
import { measurementNumber, rankResults } from './result-ranking.ts'
import { campaignTables } from './campaign-tables.ts'
import { measurementContracts, measurementForTable, validateTableMeasurement, type MeasurementBinding } from './measurement-contracts.ts'

type Cell = string | number
export interface SnapshotTable {
  measurement?: MeasurementBinding
  id: string; suite: PublicSuite; measuredAt: string; historical: boolean; unit: string; caption: string
  artifactRole?: 'candidate'
  /** A bounded diagnostic cannot replace the ecosystem's primary ranking. */
  diagnostic?: boolean
  /** Named profiles cannot supersede broad compatibility or unrelated profiles. */
  cohort?: string
  /** Output lanes share a corpus, never a supersession or speed boundary. */
  outputFormat?: 'svg' | 'png'
  /** A compact result table also shown on the ecosystem landing page. */
  summary?: boolean
  /** Same protocol, pinned input bytes and sampling; coverage comparisons only. */
  comparisonKey?: string
  rolling?: boolean
  /** Owning import window, separate from the original observation date. */
  campaignUpdatedAt?: string
  columns: string[]; rows: { project: string; values: Cell[]; unrankedReason?: string; receipt?: { url: string; sha256: string }; campaignUpdatedAt?: string }[]
  receipt: { url: string; sha256: string }
  drawingOutcomePolicy?: 'drawing-outcomes-v1'
  population?: { total: string; outcomes: string[] }
  overview?: { numerator: string; denominator?: string; suffix: string }
  chart?: { numerator: string; denominator?: string; title: string; axis: string; maximum: number }
  ranking?: { column: string; direction: 'ascending' | 'descending'; denominator?: string }
}
export interface SnapshotAttempt {
  id: string; project: string; suite: PublicSuite; measuredFrom: string; updatedAt: string
  status: string; detail: string; receipt: { url: string; sha256: string }
  evidenceUrl?: string
  artifactRole?: 'candidate'
  cohort?: string
  outputFormats?: ('svg' | 'png')[]
  groups: ReturnType<typeof campaignScorecards>
}
export interface ResultsSnapshot {
  schema: 'trident-results-snapshot-v1'
  /** Immutable reference snapshot; later rolling views retain its exact bytes. */
  baseline?: { url: string; sha256: string }
  publications?: { title: string; url: string }[]
  projectNames?: Record<string, string>
  overviewRanking?: string
  tables: SnapshotTable[]
  attempts: SnapshotAttempt[]
}
export const benchmarkNames: Record<PublicSuite, string> = {
  community: 'Mermaid Compatibility', docs: 'DaveBench — Documentation Rendering', fidelity: 'Harness and Observer Regressions (unscored)',
  'mermaid-behaviour': 'Mermaid Behaviour Tests', 'native-fidelity': 'Public Model Regressions (unscored)', 'upstream-fidelity': 'Mermaid Assertion Replay',
  'upstream-original': 'Mermaid Reference Tests', portable: 'Rendering time by workload', 'public-conformance': 'Mermaid Public API Tests (diagnostic)',
}
const unscoredSuite = (suite: PublicSuite) => ['fidelity', 'native-fidelity'].includes(suite)
const regressionNote = 'Unscored harness/observer regressions'
/** Reclassify presentation without rewriting retained values or receipt identity. */
const regressionTable = (entry: SnapshotTable): SnapshotTable => !unscoredSuite(entry.suite) ? entry : { ...entry, ranking: undefined, overview: undefined, chart: undefined, summary: false,
  caption: (entry.caption.startsWith(regressionNote) ? entry.caption : regressionNote + ': AM/Trident-authored feature, reset and edit cases; not a comparative renderer benchmark. Original retained report context: ' + entry.caption).replace('Ranks count verified correct diagrams; unknown observations leave complete accuracy unresolved. ', ''),
  rows: entry.rows.map(row => ({ ...row, unrankedReason: row.unrankedReason?.startsWith(regressionNote) ? row.unrankedReason : regressionNote + (row.unrankedReason ? '; ' + row.unrankedReason : '') })) }
const regressionSnapshot = (snapshot: ResultsSnapshot): ResultsSnapshot => {
  const tables = snapshot.tables.map(regressionTable), previous = tables.find(entry => entry.id === snapshot.overviewRanking)
  return { ...snapshot, tables, ...(previous && unscoredSuite(previous.suite) ? { overviewRanking: tables.find(entry => entry.suite === 'docs' && entry.outputFormat !== 'png' && entry.overview && entry.ranking)?.id } : {}) }
}
const tableDisplayPriority = (entry: SnapshotTable) => entry.historical || entry.diagnostic || unscoredSuite(entry.suite) || entry.caption.startsWith('Archived') ? 2 : entry.drawingOutcomePolicy || entry.summary || entry.overview ? 0 : 1
const sha256 = (value: string | Buffer) => createHash('sha256').update(value).digest('hex')
const md = (value: unknown) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('|', '&#124;').replaceAll('\n', ' ')
const anchor = (id: string) => id.toLowerCase().replace(/[^a-z0-9-]/g, '-')
const date = (value: string) => value.slice(0, 10)
const table = (columns: string[], rows: Cell[][]) => ['| ' + columns.map(md).join(' | ') + ' |', '| ' + columns.map(() => '---').join(' | ') + ' |', ...rows.map(row => '| ' + row.map(md).join(' | ') + ' |')].join('\n')
const stamp = (value: string) => {
  const time = Date.parse(value)
  if (!Number.isFinite(time)) throw Error('Invalid measurement date: ' + value)
  return time
}
const validLink = (url: string) => /^(https:\/\/[^\s<>]+|(?:docs|results)\/[a-zA-Z0-9_./#%-]+)$/.test(url) && !url.includes('..') && !/[()]/.test(url)
const receiptLink = (receipt: { url: string }) => `[evidence](${receipt.url})`
export function validateSnapshot(snapshot: ResultsSnapshot, catalog: LineageCatalog) {
  if (snapshot.schema !== 'trident-results-snapshot-v1' || !Array.isArray(snapshot.tables) || !Array.isArray(snapshot.attempts)) throw Error('Unknown results snapshot schema')
  if (snapshot.baseline && (!/^results\/[a-zA-Z0-9_./%-]+\.json$/.test(snapshot.baseline.url) || snapshot.baseline.url.includes('..') || !/^[a-f0-9]{64}$/.test(snapshot.baseline.sha256))) throw Error('Invalid frozen baseline reference')
  const projects = new Set(catalog.nodes.map(node => node.id)), ids = new Set<string>(), anchors = new Set<string>()
  for (const publication of snapshot.publications ?? []) if (!publication.title.trim() || !validLink(publication.url)) throw Error('Invalid campaign publication link')
  for (const [project, name] of Object.entries(snapshot.projectNames ?? {})) if (!projects.has(project) || !name.trim()) throw Error('Invalid project display name')
  for (const entry of [...snapshot.tables, ...snapshot.attempts]) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9:_-]*$/.test(entry.id) || ids.has(entry.id)) throw Error('Invalid or duplicate result ID: ' + entry.id)
    if (anchors.has(anchor(entry.id))) throw Error('Colliding result anchors: ' + entry.id)
    ids.add(entry.id)
    anchors.add(anchor(entry.id))
    if (!PUBLIC_SUITES.includes(entry.suite)) throw Error('Unknown benchmark: ' + entry.suite)
    if (!validLink(entry.receipt.url) || !/^[a-f0-9]{64}$/.test(entry.receipt.sha256)) throw Error('Invalid evidence receipt')
  }
  for (const entry of snapshot.tables) {
    validateTableMeasurement(entry)
    if (entry.suite === 'public-conformance' && entry.diagnostic !== true) throw Error('PublicTests remains a diagnostic subset until campaign enrollment')
    if (entry.diagnostic !== undefined && typeof entry.diagnostic !== 'boolean' || entry.diagnostic && entry.id === snapshot.overviewRanking) throw Error('A diagnostic table cannot supply the primary ecosystem ranking')
    if (entry.outputFormat !== undefined && !['svg', 'png'].includes(entry.outputFormat)) throw Error('Unknown table output lane')
    stamp(entry.measuredAt)
    if (entry.campaignUpdatedAt !== undefined) stamp(entry.campaignUpdatedAt)
    if (entry.comparisonKey !== undefined && !/^[a-f0-9]{64}$/.test(entry.comparisonKey)) throw Error('Invalid comparison key')
    if (entry.rolling && (!entry.comparisonKey || entry.suite !== 'docs' || !entry.columns.includes('Measured') || entry.rows.some(row => !row.receipt || !row.campaignUpdatedAt))) throw Error('Rolling coverage needs per-row owning evidence')
    if (entry.artifactRole !== undefined && entry.artifactRole !== 'candidate') throw Error('Unknown table artifact role')
    if (entry.artifactRole === 'candidate' && (entry.overview || entry.id === (snapshot.overviewRanking ?? 'docs-coverage'))) throw Error('Candidate tables cannot replace the release overview')
    const seen = new Set<string>()
    if (entry.columns[0] !== 'Version' || new Set(entry.columns).size !== entry.columns.length) throw Error('Tables need unique columns starting with Version')
    for (const row of entry.rows) {
      if (!projects.has(row.project) || seen.has(row.project)) throw Error('Unknown or duplicate table project: ' + row.project)
      seen.add(row.project)
      if (row.values.length !== entry.columns.length || row.values.some(value => !['string', 'number'].includes(typeof value) || typeof value === 'number' && !Number.isFinite(value))) throw Error('Invalid table values')
      if (row.unrankedReason !== undefined && (typeof row.unrankedReason !== 'string' || !row.unrankedReason.trim())) throw Error('Invalid unranked reason')
      if (row.receipt && (!validLink(row.receipt.url) || !/^[a-f0-9]{64}$/.test(row.receipt.sha256))) throw Error('Invalid row evidence receipt')
      if (row.campaignUpdatedAt !== undefined) stamp(row.campaignUpdatedAt)
      if (entry.rolling) stamp(String(row.values[entry.columns.indexOf('Measured')]))
    }
    for (const projection of [entry.overview, entry.chart]) if (projection) {
      if (!entry.columns.includes(projection.numerator) || projection.denominator && !entry.columns.includes(projection.denominator)) throw Error('Unknown result column')
    }
    if (entry.population) {
      const { total, outcomes } = entry.population
      if (!outcomes.length || new Set(outcomes).size !== outcomes.length || outcomes.includes(total) || [total, ...outcomes].some(column => !entry.columns.includes(column))) throw Error('Invalid population columns')
      for (const row of entry.rows) {
        const counts = [total, ...outcomes].map(column => row.values[entry.columns.indexOf(column)])
        if (counts.some(count => typeof count !== 'number' || !Number.isInteger(count) || count < 0) || counts[0] !== (counts.slice(1) as number[]).reduce((sum, count) => sum + count, 0)) throw Error('Table population does not reconcile')
      }
    }
    if (entry.drawingOutcomePolicy !== undefined) {
      if (entry.drawingOutcomePolicy !== 'drawing-outcomes-v1' || !entry.population || JSON.stringify(entry.population.outcomes) !== JSON.stringify(drawingOutcomeColumns) || entry.ranking?.column !== 'Correct' || entry.ranking.direction !== 'descending' || entry.ranking.denominator) throw Error('Invalid drawing outcome policy')
      for (const row of entry.rows) {
        const bounds = drawingBounds(entry, row)!
        const expected = [bounds.observerCoverage, bounds.lowerPercent, bounds.upperPercent].map(value => value === null ? 'unavailable' : Number(value.toFixed(6)))
        if (drawingStatisticsColumns.some((column, index) => row.values[entry.columns.indexOf(column)] !== expected[index])) throw Error('Drawing coverage or bounds do not match outcome counts')
      }
    }
    if (entry.chart) {
      if (!(entry.chart.maximum > 0) || !Number.isFinite(entry.chart.maximum)) throw Error('Invalid chart range')
      for (const row of entry.rows) chartValue(entry, row)
    }
    if (entry.ranking && (!entry.columns.includes(entry.ranking.column) || entry.ranking.column === 'Version' || !['ascending', 'descending'].includes(entry.ranking.direction) || entry.ranking.denominator && !entry.columns.includes(entry.ranking.denominator))) throw Error('Invalid ranking metric')
  }
  for (const attempt of snapshot.attempts) {
    if (attempt.outputFormats !== undefined && (!Array.isArray(attempt.outputFormats) || !attempt.outputFormats.length || new Set(attempt.outputFormats).size !== attempt.outputFormats.length || attempt.outputFormats.some(format => !['svg', 'png'].includes(format)))) throw Error('Invalid attempt output lanes')
    if (attempt.artifactRole !== undefined && attempt.artifactRole !== 'candidate') throw Error('Unknown attempt artifact role')
    if (attempt.cohort !== undefined && (typeof attempt.cohort !== 'string' || !attempt.cohort.trim())) throw Error('Invalid attempt cohort')
    if (!projects.has(attempt.project) || stamp(attempt.updatedAt) < stamp(attempt.measuredFrom)) throw Error('Invalid campaign project or measurement interval')
    if (!['recorded', 'passed', 'failed', 'blocked', 'unsupported', 'not-applicable', 'unavailable'].includes(attempt.status)) throw Error('Invalid campaign status')
    if (attempt.evidenceUrl && !validLink(attempt.evidenceUrl)) throw Error('Invalid owning evidence URL')
    for (const group of attempt.groups) {
      if (group.project !== attempt.project || Object.values(group.dispositions).some(value => !Number.isInteger(value) || value < 0) || Object.values(group.dispositions).reduce((sum, value) => sum + value, 0) !== group.recordedObservations) throw Error('Invalid observation population')
    }
  }
}
/** Owning import records publish the table rather than supersede it. Order
 * later attempts against that publication window, retaining original clocks. */
function supersedingAttempt(attempts: SnapshotAttempt[], entry: SnapshotTable, project: string) {
  // Historical docs tables predate PNG lanes and describe SVG. A PNG-only
  // attempt cannot erase that SVG evidence, including when setup was blocked.
  const output = entry.outputFormat ?? (entry.suite === 'docs' ? 'svg' : undefined)
  const eligible = attempts.filter(attempt => attempt.project === project && attempt.suite === entry.suite && attempt.artifactRole !== 'candidate' && (entry.cohort !== undefined ? (attempt.cohort ?? 'core') === entry.cohort : attempt.cohort === undefined || ['core', 'external'].includes(attempt.cohort)) && (!output || (attempt.outputFormats ?? (attempt.suite === 'docs' ? ['svg'] : [])).includes(output)))
  const row = entry.rows.find(row => row.project === project), receipt = row?.receipt ?? entry.receipt
  const updatedAt = row?.campaignUpdatedAt ?? entry.campaignUpdatedAt
  const publishedAt = stamp(updatedAt ?? entry.measuredAt)
  const owns = (attempt: SnapshotAttempt) => updatedAt !== undefined && stamp(attempt.updatedAt) === publishedAt && attempt.receipt.sha256 === receipt.sha256 && attempt.receipt.url === receipt.url
  return eligible.filter(attempt => !owns(attempt) && stamp(attempt.updatedAt) >= publishedAt).sort((a, b) => stamp(b.updatedAt) - stamp(a.updatedAt) || b.id.localeCompare(a.id))[0]
}
/** One campaign may own several independent input cohorts. Its shared update
 * time cannot choose one cohort's outcome by hash-ID ordering. */
function currentCohorts(attempts: SnapshotAttempt[], entry?: SnapshotTable) {
  const latest = attempts[0]
  if (!latest || entry && stamp(latest.updatedAt) < stamp(entry.campaignUpdatedAt ?? entry.measuredAt)) return []
  const group = attempts.filter(attempt => attempt.receipt.sha256 === latest.receipt.sha256 && attempt.receipt.url === latest.receipt.url && stamp(attempt.updatedAt) === stamp(latest.updatedAt))
  return new Set(group.map(attempt => attempt.cohort ?? 'core')).size > 1 ? group.sort((a, b) => (a.cohort ?? 'core').localeCompare(b.cohort ?? 'core')) : []
}
const attemptCell = (attempt: SnapshotAttempt, label = '') => `[${md(label)}${md(attempt.status)} · ${date(attempt.updatedAt)}](#${anchor(attempt.id)})`
function terminalOnly(snapshot: ResultsSnapshot) {
  const community = [...snapshot.tables, ...snapshot.attempts].filter(entry => entry.suite === 'community')
  return community.length > 0 && community.every(entry => entry.cohort?.startsWith('terminal-'))
}
const snapshotBenchmarkNames = (snapshot: ResultsSnapshot) => ({ ...benchmarkNames, ...(terminalOnly(snapshot) ? { community: 'Terminal Rendering' } : {}) })

/** Bounds use the planned corpus, never just the outputs the observer handled. */
export function drawingBounds(entry: SnapshotTable, row: SnapshotTable['rows'][number]) {
  if (!entry.drawingOutcomePolicy || !entry.population) return null
  const counts = Object.fromEntries(drawingOutcomeColumns.map(key => [key, row.values[entry.columns.indexOf(key)]])) as DrawingOutcomeCounts
  const total = row.values[entry.columns.indexOf(entry.population.total)] as number
  return { total, ...drawingOutcomeStatistics(counts, total) }
}
/** Compare the named count only. Unknown work and unlike populations cannot
 * become a claim that a project is worse, or an unqualified speed comparison. */
export function baselineComparison(entry: SnapshotTable, row: SnapshotTable['rows'][number], baseline = 'mermaid-js/mermaid'): string {
  if (unscoredSuite(entry.suite)) return regressionNote
  const reference = entry.rows.find(item => item.project === baseline)
  if (!reference) return 'No reference score'
  if (row.project === baseline) return 'Baseline'
  const column = entry.ranking?.column
  if (!column || entry.ranking?.direction !== 'descending' || !entry.population) return 'Not comparable'
  const number = (item: typeof row, name: string) => measurementNumber(item.values[entry.columns.indexOf(name)])
  const total = number(row, entry.population.total), referenceTotal = number(reference, entry.population.total)
  if (!(total && referenceTotal) || total !== referenceTotal) return 'Different populations'
  if (entry.drawingOutcomePolicy) {
    const own = drawingBounds(entry, row)!, other = drawingBounds(entry, reference)!
    const difference = own.lower - other.lower, delta = `${difference > 0 ? '+' : ''}${difference}`
    if (own.lower > other.upper) return `Higher on this corpus (${delta} verified); disjoint bounds`
    if (own.upper < other.lower) return `Lower on this corpus (${delta} verified); disjoint bounds`
    if (own.lower === own.upper && other.lower === other.upper && own.lower === other.lower) return 'Tie on this corpus; fully resolved'
    return `${difference === 0 ? 'Same verified count' : (difference > 0 ? 'More' : 'Fewer') + ' verified (' + delta + ')'}; bounds overlap`
  }
  if (entry.suite === 'mermaid-behaviour' && column === 'Passed') {
    const value = number(row, column), referenceValue = number(reference, column)
    if (value === null || referenceValue === null) return 'Unresolved'
    const difference = value - referenceValue
    const unresolved = (item: typeof row) => (number(item, 'Unavailable') ?? 0) + (number(item, 'Unrun') ?? 0)
    if (unresolved(row) || unresolved(reference)) return difference === 0 ? 'Same verified count; outcome unresolved' : `${difference > 0 ? 'More' : 'Fewer'} verified (${difference > 0 ? '+' : ''}${difference}); outcome unresolved`
    return difference === 0 ? 'Tie on these behaviours' : `${difference > 0 ? 'Higher' : 'Lower'} on these behaviours (${difference > 0 ? '+' : ''}${difference})`
  }
  const unknown = (item: typeof row) => entry.population!.outcomes.filter(name => /^(Unknown|Blocked|Binding gaps|Unavailable|Unexecuted|Unmeasured|Missing|N\/A|Skipped)$/.test(name)).reduce((sum, name) => sum + (number(item, name) ?? 0), 0)
  if (unknown(reference) >= referenceTotal || column !== 'Correct' && reference.unrankedReason) return 'Reference unresolved'
  if (unknown(row) >= total || column !== 'Correct' && row.unrankedReason) return 'Unresolved'
  const value = number(row, column), referenceValue = number(reference, column)
  if (value === null || referenceValue === null) return 'Unresolved'
  const difference = value - referenceValue
  if (column === 'Correct' && (unknown(reference) > 0 || unknown(row) > 0)) return difference === 0 ? 'Same verified count; accuracy unresolved' : `${difference > 0 ? 'More' : 'Fewer'} verified (${difference > 0 ? '+' : ''}${difference}); accuracy unresolved`
  return difference === 0 ? 'Tie' : `${difference > 0 ? 'Higher' : 'Lower'} (${difference > 0 ? '+' : ''}${difference})`
}
/** A recorded zero is rankable only after at least one outcome was resolved. */
function resolvedOutcomes(entry: SnapshotTable, row: SnapshotTable['rows'][number]): number | null {
  const columns = entry.drawingOutcomePolicy ? drawingOutcomeColumns.slice(0, 5) : entry.suite === 'mermaid-behaviour' && entry.ranking?.column === 'Passed' ? ['Passed', 'Failed'] : null
  if (!columns) return null
  const counts = columns.map(column => measurementNumber(row.values[entry.columns.indexOf(column)]))
  return counts.some(count => count === null) ? null : (counts as number[]).reduce((sum, count) => sum + count, 0)
}
function rankingNote(entry: SnapshotTable, row: SnapshotTable['rows'][number]) {
  return row.unrankedReason ?? (resolvedOutcomes(entry, row) === 0 ? entry.suite === 'community' ? 'No verified terminal drawing observations' : entry.suite === 'mermaid-behaviour' ? 'No verified observable behaviour outcomes' : 'No verified drawing-content observations' : undefined)
}
/** Shared competition ranks (1, 1, 3); unavailable measurements never become zero. */
export function rankedRows(entry: SnapshotTable, name: (id: string) => string) {
  entry = regressionTable(entry)
  const numeric = (value: Cell | undefined) => measurementNumber(value) ?? NaN
  const ranked = rankResults(entry.rows, { direction: entry.ranking?.direction ?? 'descending', name: row => name(row.project), score: row => {
    if (row.unrankedReason) return null
    if (entry.drawingOutcomePolicy || entry.suite === 'mermaid-behaviour' && entry.ranking?.column === 'Passed') {
      const total = numeric(row.values[entry.columns.indexOf(entry.population!.total)])
      const correct = numeric(row.values[entry.columns.indexOf(entry.drawingOutcomePolicy ? 'Correct' : 'Passed')])
      return total > 0 && Number.isFinite(correct) && (resolvedOutcomes(entry, row) ?? 0) > 0 ? correct : null
    }
    const metric = entry.ranking
    const numerator = metric ? numeric(row.values[entry.columns.indexOf(metric.column)]) : NaN
    const denominator = metric?.denominator ? numeric(row.values[entry.columns.indexOf(metric.denominator)]) : 1
    const total = entry.population ? numeric(row.values[entry.columns.indexOf(entry.population.total)]) : NaN
    const unobserved = (entry.population?.outcomes ?? []).filter(column => /^(Blocked|Binding gaps|Unavailable|Unexecuted|Unmeasured|Missing|Not applicable|N\/A|Skipped)$/.test(column)).reduce((sum, column) => sum + numeric(row.values[entry.columns.indexOf(column)]), 0)
    const value = numerator / denominator
    return Number.isFinite(numerator) && Number.isFinite(denominator) && denominator > 0 && Number.isFinite(value) && !(total > 0 && unobserved >= total) ? value : null
  } }).map(({ row, ...rank }) => ({ ...row, ...rank, ...(rankingNote(entry, row) ? { unrankedReason: rankingNote(entry, row) } : {}) }))
  // Verified counts remain readable best-first even where unknown evidence
  // withholds a formal correctness rank. Ranking eligibility is unchanged.
  return !entry.drawingOutcomePolicy && entry.ranking?.column === 'Correct' ? rankResults(ranked, { direction: entry.ranking.direction, name: row => name(row.project), score: row => measurementNumber(row.values[entry.columns.indexOf('Correct')]) }).map(({ row }) => row) : ranked
}
function chartValue(entry: SnapshotTable, row: SnapshotTable['rows'][number]) {
  const chart = entry.chart!, numerator = measurementNumber(row.values[entry.columns.indexOf(chart.numerator)])
  const denominator = chart.denominator ? measurementNumber(row.values[entry.columns.indexOf(chart.denominator)]) : 1
  if (numerator === null || denominator === null || numerator < 0 || denominator <= 0 || chart.denominator && numerator > denominator) throw Error('Chart needs observed numeric values and a valid denominator')
  const value = chart.denominator ? 100 * numerator / denominator : numerator
  if (value > chart.maximum) throw Error('Chart value exceeds range')
  return Number(value.toFixed(1))
}

/** Import observed dispositions, not inferred whole-diagram pass rates or timing qualification. */
export function importCampaign(snapshot: ResultsSnapshot, directory: string, evidenceUrl: string, catalog: LineageCatalog): ResultsSnapshot {
  if (!/^https:\/\//.test(evidenceUrl) || !validLink(evidenceUrl)) throw Error('Provide the permanent HTTPS URL of the published campaign evidence directory')
  const reportFile = campaignReportFile(directory), report = readCampaign(directory), digest = sha256(readFileSync(join(directory, reportFile)))
  if ((report as typeof report & { pilot?: boolean }).pilot) throw Error('Pilot observations are diagnostics and cannot be imported as ecosystem scores')
  const attempts: SnapshotAttempt[] = []
  const artifactRole = campaignArtifactRole(report)
  const touched = new Set<string>()
  const suites = (report as typeof report & { requestedSuites?: PublicSuite[] }).requestedSuites ?? [...new Set(report.results.map(row => row.suite))]
  for (const row of report.results) {
    if (!PUBLIC_SUITES.includes(row.suite as PublicSuite)) throw Error('Unknown campaign benchmark: ' + row.suite)
    const cards = campaignScorecards(row, report.projects)
    const owning = row.out ? relative(resolve(directory), resolve(row.out)) : undefined
    if (owning?.startsWith('..')) throw Error('Campaign evidence must be owned inside the published campaign directory')
    const scopes = row.project ? [row.project] : report.projects
    for (const project of scopes) {
      touched.add(project + ':' + row.suite)
      const groups = cards.filter(card => card.project === project)
      // A failed multi-project process does not establish that every project failed.
      const own = Object.fromEntries([...new Set(groups.flatMap(group => Object.keys(group.dispositions)))].map(status => [status, groups.reduce((sum, group) => sum + (group.dispositions[status] ?? 0), 0)]))
      const boundaryFailure = scopes.length === 1 && ['failed', 'blocked'].includes(row.status) ? row.status : undefined
      const status = boundaryFailure ?? (groups.length ? own.failed ? 'failed' : own.blocked ? 'blocked' : own['not-applicable'] === groups.reduce((sum, group) => sum + group.recordedObservations, 0) ? 'not-applicable' : own.unsupported === groups.reduce((sum, group) => sum + group.recordedObservations, 0) ? 'unsupported' : 'recorded'
        : row.project || scopes.length === 1 || row.status === 'blocked' ? row.status === 'passed' ? 'recorded' : row.status : 'unavailable')
      const outputFormats = row.suite === 'docs' ? [...new Set(groups.map(group => group.format).filter(format => ['svg', 'png'].includes(format)))] : []
      const declaredFormats = (report as any).options?.docsFormats
      if (row.suite === 'docs' && !outputFormats.length) outputFormats.push(...(Array.isArray(declaredFormats) ? declaredFormats : ['svg']))
      attempts.push({ id: 'attempt-' + sha256(digest + project + row.suite + (row.cohort ?? '')).slice(0, 24), project, suite: row.suite as PublicSuite, ...(row.cohort !== undefined ? { cohort: row.cohort } : {}), ...(row.suite === 'docs' ? { outputFormats: outputFormats as ('svg' | 'png')[] } : {}),
        measuredFrom: report.startedAt, updatedAt: report.updatedAt, status,
        detail: [row.detail, row.disposition, ...(row.gaps ?? []), 'Campaign process status: ' + row.status, !groups.length ? 'No per-project observation table was available.' : 'Recorded observation dispositions; process completion does not establish benchmark qualification.'].filter(Boolean).join('; '),
        receipt: { url: evidenceUrl.replace(/\/$/, '') + '/' + reportFile, sha256: digest }, ...(artifactRole ? { artifactRole } : {}),
        ...(owning && existsSync(row.out!) ? { evidenceUrl: evidenceUrl.replace(/\/$/, '') + '/' + encodeURI(owning).replaceAll('#', '%23') + '/' } : {}), groups })
    }
  }
  // A partial run must not silently fall back to earlier successful evidence.
  for (const project of report.projects) for (const suite of suites) if (!touched.has(project + ':' + suite)) {
    const node = catalog.nodes.find(node => node.id === project)
    if (!node || !PUBLIC_SUITES.includes(suite as PublicSuite)) throw Error('Unknown project or suite in campaign inventory')
    if (['reference-only', 'project-unsupported', 'out-of-scope'].includes(projectSupport(node).suites[suite as PublicSuite].state)) continue
    attempts.push({
      id: 'attempt-' + sha256(digest + project + suite).slice(0, 24), project, suite: suite as PublicSuite,
      ...(suite === 'docs' ? { outputFormats: ((report as any).options?.docsFormats ?? ['svg']) as ('svg' | 'png')[] } : {}),
      measuredFrom: report.startedAt, updatedAt: report.updatedAt, status: 'unavailable', detail: 'Requested boundary has no recorded result in this partial campaign.',
      receipt: { url: evidenceUrl.replace(/\/$/, '') + '/' + reportFile, sha256: digest }, ...(artifactRole ? { artifactRole } : {}), groups: [],
    })
  }
  const byId = new Map(snapshot.attempts.map(attempt => [attempt.id, attempt]))
  for (const attempt of attempts) byId.set(attempt.id, attempt)
  const tables = new Map(snapshot.tables.map(table => [table.id, table]))
  const generated = campaignTables(report, { url: evidenceUrl.replace(/\/$/, '') + '/' + reportFile, sha256: digest })
  for (const table of generated) tables.set(table.id, table)
  const overviewEligible = (table: SnapshotTable) => !unscoredSuite(table.suite) && !table.diagnostic && table.artifactRole !== 'candidate' && !!table.overview
  let overview = generated.find(table => overviewEligible(table) && table.outputFormat === 'svg' && table.unit === 'documentation drawings') ?? generated.find(table => overviewEligible(table) && table.outputFormat === 'svg') ?? (!snapshot.overviewRanking ? generated.find(overviewEligible) : undefined)
  if (overview?.comparisonKey) {
    const key = overview.comparisonKey
    const comparable = [...tables.values()].filter(table => table.comparisonKey === key && !table.rolling && table.artifactRole !== 'candidate')
      .sort((a, b) => stamp(a.campaignUpdatedAt ?? a.measuredAt) - stamp(b.campaignUpdatedAt ?? b.measuredAt) || a.id.localeCompare(b.id))
    if (comparable.length > 1) {
      const latest = comparable.at(-1)!, rows = new Map<string, SnapshotTable['rows'][number]>()
      for (const table of comparable) {
        if (JSON.stringify(table.columns) !== JSON.stringify(latest.columns)) throw Error('Comparable coverage has different columns')
        for (const row of table.rows) rows.set(row.project, { ...row, receipt: table.receipt, campaignUpdatedAt: table.campaignUpdatedAt ?? table.measuredAt })
      }
      overview = { ...latest, id: 'latest-docs-' + key.slice(0, 24), rolling: true, rows: [...rows.values()],
        measuredAt: comparable.map(table => table.measuredAt).sort((a, b) => stamp(a) - stamp(b)).at(-1)!,
        caption: 'Latest comparable documentation scores per project, across dated runs. Protocol, pinned input bytes, source expectations and observer identity match. Each row retains its own measurement date and evidence. This is a rolling count comparison, with no cross-run timing claim.' }
      tables.set(overview.id, overview)
    }
  }
  return { ...snapshot, ...(overview ? { overviewRanking: overview.id } : {}), tables: [...tables.values()], attempts: [...byId.values()].sort((a, b) => stamp(a.updatedAt) - stamp(b.updatedAt) || a.id.localeCompare(b.id)) }
}

export function renderSnapshot(snapshot: ResultsSnapshot, catalog: LineageCatalog, detailLinks?: Map<string, string>, includeRecordedProjects = false): string {
  snapshot = regressionSnapshot(snapshot)
  validateSnapshot(snapshot, catalog)
  const lineage = lineageInventory(catalog)
  const nodes = new Map(catalog.nodes.map(node => [node.id, node]))
  const visible = (project: string) => includeRecordedProjects || !coreScopeReason(nodes.get(project)!)
  const name = (id: string) => snapshot.projectNames?.[id] ?? nodes.get(id)?.comparisonBranding?.name ?? id
  const titles = snapshotBenchmarkNames(snapshot)
  const activeSuites = PUBLIC_SUITES.filter(suite => snapshot.tables.some(entry => entry.suite === suite) || snapshot.attempts.some(entry => entry.suite === suite))
  const overviewColumns: { suite: PublicSuite; format?: 'svg' | 'png'; title: string }[] = activeSuites.filter(suite => !unscoredSuite(suite)).flatMap<{ suite: PublicSuite; format?: 'svg' | 'png'; title: string }>(suite => suite === 'docs' && snapshot.tables.some(entry => entry.suite === 'docs' && entry.outputFormat === 'png') ? [{ suite, format: 'svg' as const, title: 'DaveBench SVG' }, { suite, format: 'png' as const, title: 'DaveBench PNG' }] : [{ suite, ...(suite === 'docs' ? { format: 'svg' as const } : {}), title: titles[suite] }])
  const alphabetical = <T extends { project: string }>(rows: T[]) => [...rows].sort((a, b) => name(a.project).localeCompare(name(b.project)))
  const primary = snapshot.tables.find(entry => !unscoredSuite(entry.suite) && entry.id === (snapshot.overviewRanking ?? 'docs-coverage'))
  if (snapshot.overviewRanking && !primary) throw Error('Unknown overview ranking table')
  if (primary && !primary.ranking) throw Error('Overview ranking table needs a named metric')
  const attemptsFor = (project: string, suite: PublicSuite, format?: 'svg' | 'png') => snapshot.attempts.filter(attempt => (!format || (attempt.outputFormats ?? ['svg']).includes(format)) && attempt.project === project && attempt.suite === suite && attempt.artifactRole !== 'candidate' && (suite !== 'community' || terminalOnly(snapshot) || attempt.cohort === undefined || ['core', 'external'].includes(attempt.cohort))).sort((a, b) => stamp(b.updatedAt) - stamp(a.updatedAt) || b.id.localeCompare(a.id))
  const currentPrimary = primary ? { ...primary, rows: primary.rows.filter(row => visible(row.project) && !supersedingAttempt(snapshot.attempts, primary, row.project) && !currentCohorts(attemptsFor(row.project, primary.suite), primary).length) } : undefined
  const primaryRanks = new Map(currentPrimary ? rankedRows(currentPrimary, name).map(row => [row.project, row.rank]) : [])
  const recorded = new Set(snapshot.attempts.map(attempt => attempt.project))
  const projects = [...lineage.nodes.filter(node => includeRecordedProjects ? recorded.has(node.project) : !node.excludedFromComparison)].sort((a, b) => (primaryRanks.get(a.project) ?? Infinity) - (primaryRanks.get(b.project) ?? Infinity) || name(a.project).localeCompare(name(b.project)))
  const measured = [...snapshot.tables.map(entry => entry.measuredAt), ...snapshot.attempts.map(entry => entry.updatedAt)].sort((a, b) => stamp(a) - stamp(b))
  const latest = measured.at(-1)
  const lines = ['# Mermaid ecosystem benchmark results', '',
    `Last recorded measurement/update: **${latest ? date(latest) : 'none'}**. ${snapshot.attempts.length} imported project/benchmark attempts; ${snapshot.tables.length} retained result tables.`, '',
    '**Historical** marks retained measurements collected before the current reporting work. **Source candidates** are unreleased builds, ranked only within their own comparison tables; they do not replace release scores in the overview. This page is a rolling view across dated runs, not one matched ecosystem experiment. Regenerating it runs no benchmarks and does not qualify old outputs against newer source contracts or observers. Dates, versions, interfaces and qualification belong to each table.', '',
    '[Machine-readable results](results/latest.json) · [Benchmark methods](BENCHMARKS.md) · [Reading the tables](REPORTING.md) · [Update this page](results/README.md)', '',
    ...(snapshot.baseline ? [`[Frozen reference baseline](${snapshot.baseline.url}) · input and outcome hashes are checked with these results.`, ''] : []),
    ...(primary?.suite === 'docs' && primary.columns.includes('Returned in all rounds') ? ['**The overview ranks SVG-return coverage. It does not rank drawing correctness.** Unknown source expectations and observers withhold correctness ranks; see the dated qualification evidence.', ''] : []),
    ...(snapshot.publications ?? []).flatMap(publication => [`[${md(publication.title)}](${publication.url})`, '']),
    '## Ecosystem overview', '',
    includeRecordedProjects ? `${projects.length} originally recorded projects are listed below, including projects later excluded from regular campaigns. This archive preserves the measured selection; it does not change current benchmark eligibility.` : `${projects.length} eligible projects are listed below. ${lineage.excludedProjects.length} catalog entries outside core comparison scope are listed separately. Results are never inherited through lineage.`, '',
    'Each cell links its latest recorded attempt, or a dated retained table. New failed, blocked and partial attempts take precedence over earlier tables. Different suites have different units; there is no combined score. “Unmeasured” is missing evidence; “N/A” follows the declared output or reference scope, not a measured failure.', '',
    `Overview order: ${primary?.drawingOutcomePolicy || primary?.suite === 'mermaid-behaviour' ? 'verified-count rank, ' : ''}${primary ? titles[primary.suite] + ', ' + (primary.ranking?.direction === 'ascending' ? 'lowest' : 'highest') + ' ' + primary.ranking?.column + (primary.ranking?.denominator ? ' / ' + primary.ranking.denominator : '') + ' first (' + date(primary.measuredAt) + ').' : 'No comparable ranking measure is available.'} Ties share a rank. Projects with no result for this measure, or a newer superseding attempt, remain unranked below. Each benchmark has its own ranking. The overview’s ranked benchmark cell uses this same table and population.`, '',
    '| Project | Overview rank | ' + overviewColumns.map(column => column.title).join(' | ') + ' |',
    '|---|---|' + overviewColumns.map(() => '---|').join('')]
  for (const { project } of projects) {
    const support = projectSupport(nodes.get(project)!)
    const cells = overviewColumns.map(({ suite, format }) => {
      if ((format === 'svg' || suite === 'fidelity') && !support.declaredOutputs.includes('svg')) return 'N/A'
      if (format === 'png' && !support.declaredOutputs.some(output => ['svg', 'png'].includes(output))) return 'N/A'
      if (suite === 'community' && terminalOnly(snapshot) && !support.declaredOutputs.includes('terminal')) return 'N/A'
      const attempts = attemptsFor(project, suite, format)
      const entries = snapshot.tables.filter(entry => entry.artifactRole !== 'candidate' && entry.suite === suite && entry.overview && (!format || (entry.outputFormat ?? 'svg') === format) && (suite !== primary?.suite || format && format !== (primary.outputFormat ?? 'svg') || entry.id === primary.id) && entry.rows.some(row => row.project === project)).sort((a, b) => stamp(b.measuredAt) - stamp(a.measuredAt) || a.id.localeCompare(b.id))
      const entry = entries[0], attempt = entry ? supersedingAttempt(attempts, entry, project) : attempts[0]
      const cohorts = currentCohorts(attempts, entry)
      if (cohorts.length) return cohorts.map(attempt => attemptCell(attempt, (attempt.cohort ?? 'core') + ': ')).join('; ')
      if (attempt) return attemptCell(attempt)
      if (entry) {
        const row = entry.rows.find(row => row.project === project)!, projection = entry.overview!
        const observedAt = entry.rolling ? String(row.values[entry.columns.indexOf('Measured')]) : entry.measuredAt
        const note = rankingNote(entry, row)
        if (note) return `[${md(note)} · ${date(observedAt)}](#${anchor(entry.id)})`
        if (projection.suffix === '%' && entry.ranking && rankedRows(entry, name).find(row => row.project === project)?.rank === null) {
          const owner = attempts.find(attempt => attempt.receipt.sha256 === entry.receipt.sha256 && attempt.receipt.url === entry.receipt.url)
          return owner ? attemptCell(owner) : 'Unmeasured'
        }
        const value = row.values[entry.columns.indexOf(projection.numerator)]
        const denominator = projection.denominator ? '/' + row.values[entry.columns.indexOf(projection.denominator)] : ''
        const display = entry.drawingOutcomePolicy ? md(value) + denominator : projection.suffix === '%' && projection.denominator ? (100 * Number(value) / Number(row.values[entry.columns.indexOf(projection.denominator)])).toFixed(1) + '%' : md(value) + denominator + (projection.suffix ? ' ' + md(projection.suffix) : '')
        const bounds = drawingBounds(entry, row)
        return `[${display}${bounds ? ' verified; bounds ' + bounds.lower + '–' + bounds.upper + '/' + bounds.total : ''}${entry.historical ? ' · historical' : ''} · ${date(observedAt)}](#${anchor(entry.id)})`
      }
      const state = support.suites[suite]
      return state.state === 'reference-only' || state.state === 'project-unsupported' ? 'N/A' : state.state === 'disabled' ? 'Skipped: release disabled' : state.state === 'adapter-missing' ? 'Unmeasured: binding gap' : 'Unmeasured'
    })
    lines.push('| ' + md(name(project)) + ' | ' + (primaryRanks.get(project) ?? '—') + ' | ' + cells.join(' | ') + ' |')
  }
  const candidates = snapshot.tables.filter(entry => entry.artifactRole === 'candidate' && entry.rows.some(row => visible(row.project)))
  if (candidates.length) lines.push('', '## Source candidate comparisons', '',
    'These tables compare unreleased builds within the named workload. Their dates and source commits belong to each table; they do not update release scores or ranks above.', '',
    table(['Benchmark', 'Comparison', 'Measured'], candidates.map(entry => [titles[entry.suite], `[${entry.id}](#${anchor(entry.id)})`, date(entry.measuredAt)])), '')
  lines.push('', '## Results by benchmark', '', 'Tables retain the full recorded populations. Charts show one named measure from the adjacent table; blocked, unavailable and failed checks remain visible in that table. Linked publications provide raw downloads; each table’s receipt identifies its owning evidence.', '')
  for (const suite of activeSuites) {
    lines.push(`### ${titles[suite]}`, '')
    const entries = snapshot.tables.filter(entry => entry.suite === suite).map(entry => ({ ...entry, rows: entry.rows.filter(row => visible(row.project) && (!entry.rolling || !supersedingAttempt(snapshot.attempts, entry, row.project))) })).filter(entry => entry.rows.length).sort((a, b) => tableDisplayPriority(a) - tableDisplayPriority(b) || stamp(b.campaignUpdatedAt ?? b.measuredAt) - stamp(a.campaignUpdatedAt ?? a.measuredAt) || a.id.localeCompare(b.id))
    if (!entries.length) lines.push('No comparative result table has been published.', '')
    if (detailLinks) lines.push(`[All ${entries.length} tables and recorded attempts](${detailLinks.get('suite:' + suite)})`, '')
    for (const entry of entries.filter(entry => !detailLinks || entry.summary || entry.id === primary?.id)) {
      const unscored = unscoredSuite(entry.suite)
      lines.push(`<a id="${anchor(entry.id)}"></a>`, '', `**${entry.id}** · ${date(entry.measuredAt)}${entry.historical ? ' · Historical' : ''}${entry.diagnostic ? ' · **Diagnostic subset**' : ''}${entry.artifactRole === 'candidate' ? ' · **Source candidates**' : ''} · unit: ${md(entry.unit)} · ${entry.rolling ? '[latest source run](' + entry.receipt.url + ')' : receiptLink(entry.receipt)}`, '', entry.caption, '')
      const contract = measurementContracts[measurementForTable(entry)]
      lines.push('**Measurement:** ' + contract.question, '', '**Claim boundary:** ' + contract.limit, '')
      const rows = rankedRows(entry, name)
      lines.push(unscored ? 'Unscored harness/observer regressions; rows are alphabetical.' : entry.ranking ? `Ranked by **${md(entry.ranking.column)}${entry.ranking.denominator ? ' / ' + md(entry.ranking.denominator) : ''}**, ${entry.ranking.direction === 'ascending' ? 'lowest' : 'highest'} first. Equal values share a rank; unavailable values are unranked.${/\bms\b/.test(entry.unit ?? '') ? ' Timing ranks describe the displayed samples and retain their qualification limits.' : ''}` : 'No comparable numeric ranking measure is available.', '')
      if (entry.drawingOutcomePolicy) lines.push('Ranks order verified correct counts once an outcome is resolved; observed zero remains ranked and fully unresolved rows are unranked. Observer coverage counts drawing and format verdicts. Correctness bounds include unresolved cases; overlapping bounds establish no accuracy winner. Unsupported inputs and proven renderer failures remain explicit non-successes on this corpus.', '')
      const rate = entry.chart?.denominator
      const notes = rows.some(row => row.unrankedReason)
      const reference = entry.cohort?.startsWith('terminal-') ? 'AlexanderGrooff/mermaid-ascii' : 'mermaid-js/mermaid'
      const compare = entry.population && entry.ranking?.direction === 'descending' && entry.rows.some(row => row.project === reference)
      if (compare) lines.push(`${entry.suite === 'mermaid-behaviour' ? 'Comparisons use whole-case verified pass counts. Unavailable or unrun cases leave outcomes unresolved; a count lead is not an overall quality claim.' : entry.drawingOutcomePolicy ? 'Comparisons claim superiority only when correctness bounds are disjoint; otherwise they describe verified-count differences.' : entry.ranking!.column === 'Correct' ? 'Comparisons use **Correct** counts. “More verified” and “Fewer verified” mean accuracy is unresolved because either project has unknown outcomes.' : `“Higher” and “Lower” compare **${md(entry.ranking!.column)}** on this population. Unknown evidence remains unresolved.`} ${reference === 'AlexanderGrooff/mermaid-ascii' ? 'Mermaid has no terminal output; Mermaid ASCII is the terminal baseline.' : 'This is a comparison of the named metric, not overall project quality.'}`, '')
      lines.push(table(['Project', ...(unscored ? [] : [entry.drawingOutcomePolicy || entry.suite === 'mermaid-behaviour' ? 'Verified-count rank' : 'Rank']), ...entry.columns, ...(compare ? [reference === 'mermaid-js/mermaid' ? 'vs Mermaid' : 'vs Mermaid ASCII'] : []), ...(rate ? [entry.chart!.axis] : []), ...(notes ? [unscored ? 'Diagnostic note' : 'Ranking note'] : []), ...(entry.rolling ? ['Row evidence'] : [])], rows.map(row => [name(row.project), ...(unscored ? [] : [row.rank ?? '—']), ...row.values.map((value, index) => drawingStatisticsColumns.includes(entry.columns[index] as any) && typeof value === 'number' ? value.toFixed(1) : value), ...(compare ? [baselineComparison(entry, row, reference)] : []), ...(rate ? [row.rank === null ? '—' : chartValue(entry, row).toFixed(1) + '%'] : []), ...(notes ? [row.unrankedReason ?? ''] : []), ...(entry.rolling ? [receiptLink(row.receipt!)] : [])])), '')
      const chartRows = rows.filter(row => row.rank !== null)
      if (entry.chart && chartRows.length) {
        const quote = (value: string) => JSON.stringify(value.replace(/[\r\n]/g, ' '))
        lines.push('```mermaid', 'xychart-beta horizontal', `    title ${quote((entry.artifactRole === 'candidate' ? 'Source candidates: ' : entry.historical ? 'Historical: ' : '') + entry.chart.title + ' — ' + date(entry.measuredAt))}`,
          '    x-axis [' + chartRows.map(row => quote(name(row.project) + ' ' + row.values[0])).join(', ') + ']',
          `    y-axis ${quote(entry.chart.axis)} 0 --> ${entry.chart.maximum}`,
          '    bar [' + chartRows.map(row => chartValue(entry, row)).join(', ') + ']', '```', '')
      }
    }
  }
  lines.push('## Campaign attempts', '', 'Latest attempts remain visible even when collection or qualification fails. Counts below are recorded observations, not inferred whole-diagram passes. Original inventories, protocols, timing qualification and failures remain in the owning evidence.', '')
  if (!snapshot.attempts.length) lines.push('No campaign attempt has been imported into this snapshot yet. Comparative tables above retain their own dates, artifact roles and evidence receipts.', '')
  if (detailLinks && snapshot.attempts.length) lines.push('Per-project attempts, original failures and observation counts appear on each benchmark’s linked detail pages.', '')
  for (const attempt of snapshot.attempts.filter(attempt => !detailLinks && visible(attempt.project)).sort((a, b) => stamp(b.updatedAt) - stamp(a.updatedAt) || a.id.localeCompare(b.id))) {
    lines.push(`<a id="${anchor(attempt.id)}"></a>`, '', `### ${md(name(attempt.project))}: ${titles[attempt.suite]}${attempt.cohort !== undefined ? ' (' + md(attempt.cohort) + ')' : ''}`, '',
      `Campaign invocation: ${attempt.measuredFrom} → ${attempt.updatedAt} · **${attempt.status}**${attempt.artifactRole === 'candidate' ? ' · **Source candidate study**' : ''} · ${receiptLink(attempt.receipt)}${attempt.evidenceUrl ? ` · [owning results and failures](${attempt.evidenceUrl})` : ''}`, '', md(attempt.detail), '')
    if (attempt.groups.length) lines.push(table(['Version / artifact role', 'Interface / runtime', 'Format / operation', 'Mode / round', 'Distinct case IDs', 'Passed observations', 'Failed', 'Unsupported', 'Blocked', 'Other dispositions', 'Recorded observations'], attempt.groups.map(group => [group.version + ' / ' + group.variant, group.surface + ' / ' + group.runtime, group.format + ' / ' + group.operation, group.mode + ' / ' + group.round, group.caseIds, group.dispositions.passed ?? 0, group.dispositions.failed ?? 0, group.dispositions.unsupported ?? 0, group.dispositions.blocked ?? 0, JSON.stringify(Object.fromEntries(Object.entries(group.dispositions).filter(([key]) => !['passed', 'failed', 'unsupported', 'blocked'].includes(key)))), group.recordedObservations])), '')
  }
  lines.push('## Excluded catalog entries', '', 'These entries are omitted from normal ecosystem comparisons under the [lineage policy](LINEAGE.md). No parent score is substituted.', '',
    table(['Project', 'Reason'], alphabetical(lineage.nodes.filter(node => node.excludedFromComparison)).map(node => [name(node.project), node.exclusionReasons.join(', ')])), '',
    'GitHub renders the Mermaid blocks. Tables carry the exact values and remain readable without charts. Chart syntax can be checked against GitHub’s installed Mermaid version using a `mermaid` block containing `info`.', '')
  const output = lines.join('\n')
  return detailLinks ? output.replace(/\]\(#([^)]*)\)/g, (link, id: string) => {
    const target = detailLinks.get(id)
    return target && !lines.some(line => line === `<a id="${id}"></a>`) ? `](${target}#${id})` : link
  }) : output
}

/** Reader-facing results; detailed tables and capture history stay linked. */
export function renderPublicResults(snapshot: ResultsSnapshot, catalog: LineageCatalog, links: Map<string, string>, includeRecordedProjects = false) {
  snapshot = regressionSnapshot(snapshot)
  validateSnapshot(snapshot, catalog)
  const nodes = new Map(catalog.nodes.map(node => [node.id, node]))
  const visible = (project: string) => includeRecordedProjects || !coreScopeReason(nodes.get(project)!)
  const name = (project: string) => snapshot.projectNames?.[project] ?? nodes.get(project)?.comparisonBranding?.name ?? project
  const recent = (a: SnapshotTable, b: SnapshotTable) => stamp(b.campaignUpdatedAt ?? b.measuredAt) - stamp(a.campaignUpdatedAt ?? a.measuredAt) || a.id.localeCompare(b.id)
  const current = (entry: SnapshotTable) => ({ ...entry, rows: entry.rows.filter(row => visible(row.project) && (entry.suite === 'portable' || !supersedingAttempt(snapshot.attempts, entry, row.project))) })
  const detail = (entry: SnapshotTable) => (links.get(anchor(entry.id)) ?? links.get('suite:' + entry.suite) ?? '') + '#' + anchor(entry.id)
  const number = (entry: SnapshotTable, row: SnapshotTable['rows'][number], column: string) => measurementNumber(row.values[entry.columns.indexOf(column)])
  const latest = [...snapshot.tables.map(entry => entry.measuredAt), ...snapshot.attempts.map(entry => entry.updatedAt)].sort((a, b) => stamp(a) - stamp(b)).at(-1)
  const lines = ['# Mermaid ecosystem benchmark results', '', `Updated **${latest ? date(latest) : 'no measurements'}**. Each benchmark has its own ranking; there is no overall project rank.`, '',
    'Output production, mechanical format validity, selected behaviours, drawing assessment and execution cost are separate measurements. [Measurement contracts and qualification](docs/measurement-contracts.md) define their evidence and limits. Drawing-count completeness does not certify an observer or establish overall accuracy.', '',
    '[DaveBench SVG](#davebench-svg) · [DaveBench PNG](#davebench-png) · [Terminal rendering](#terminal-rendering) · [Behaviour tests](#mermaid-behaviour-tests) · [Rendering time](#rendering-time)', '',
    'Rank counts verified correct results, highest first; ties share a rank. **Unresolved results can change the accuracy order.** “Better” or “Worse” means the correctness bounds do not overlap. “Uncertain” means they do. Unassessed projects receive no rank.', '',
    'Failed includes incorrect drawings, invalid output, proven unsupported input and renderer errors. Unresolved includes missing assessments, unrun work and Trident failures. Invalid-source and configuration-only controls are in the details.', '',
    '[Methods and corpus provenance](BENCHMARKS.md) · [Machine-readable results](results/latest.json) · [Supported projects](CATALOG.md)', '']
  const lanes: { title: string; suite: PublicSuite; format?: 'svg' | 'png'; drawing: boolean; source: string }[] = [
    { title: 'DaveBench SVG', suite: 'docs', format: 'svg', drawing: true, source: 'Mermaid syntax documentation' },
    { title: 'DaveBench PNG', suite: 'docs', format: 'png', drawing: true, source: 'The same Mermaid syntax documentation as SVG; PNG images are assessed separately' },
    { title: 'Terminal rendering', suite: 'community', drawing: true, source: '[Pinned terminal-project docs, tests, issues and PRs, with explicit adaptations](BENCHMARKS.md#terminal-rendering--project-examples)' },
    { title: 'Mermaid Behaviour Tests', suite: 'mermaid-behaviour', drawing: false, source: '[Adapted Mermaid upstream tests](BENCHMARKS.md#mermaid-behaviour-tests), covering syntax-family detection and SVG accessible names/descriptions' },
  ]
  for (const lane of lanes) {
    lines.push('## ' + lane.title, '')
    const entry = snapshot.tables.filter(entry => entry.suite === lane.suite && entry.artifactRole !== 'candidate' && !entry.diagnostic && (lane.drawing ? !!entry.drawingOutcomePolicy : entry.ranking?.column === 'Passed') && (!lane.format || (entry.outputFormat ?? 'svg') === lane.format) && (lane.suite !== 'community' || entry.cohort?.startsWith('terminal-'))).sort(recent)[0]
    if (!entry) { lines.push('No assessed result table is available.', ''); continue }
    const shown = current(entry), rows = rankedRows(shown, name)
    const reference = lane.suite === 'community' ? 'AlexanderGrooff/mermaid-ascii' : 'mermaid-js/mermaid'
    const totalColumn = entry.population?.total ?? 'Planned'
    const totals = [...new Set(entry.rows.map(row => number(entry, row, totalColumn)))]
    if (totals.length !== 1) { lines.push(`Different planned populations cannot share a compact ranking. [Original populations and outcomes](${detail(entry)}).`, ''); continue }
    // Provenance must come from this report, never an unrelated newer inventory.
    const provenance = snapshot.tables.filter(other => other.receipt.sha256 === entry.receipt.sha256 && other.outputFormat === entry.outputFormat).map(other => other.caption).join(' ')
    const pin = /(?:documentation at|pinned Mermaid) ([a-f0-9]{40})/.exec(provenance)?.[1]
    const source = lane.suite === 'docs' && pin ? `[Mermaid syntax documentation at ${pin.slice(0, 7)}](https://github.com/mermaid-js/mermaid/tree/${pin}/packages/mermaid/src/docs/syntax)${lane.format === 'png' ? '; PNG images are assessed separately' : ''}` : lane.suite === 'docs' ? 'Exact documentation revision not recorded in this table; consult the linked source evidence' : lane.source + (pin ? ` at [${pin.slice(0, 7)}](https://github.com/mermaid-js/mermaid/tree/${pin})` : '')
    lines.push(`**Corpus:** ${source}. **Population:** ${totals.length === 1 ? totals[0] : 'see each row’s original population'} ${lane.drawing ? 'drawings' : 'whole behaviour cases'} per project. **Date:** ${date(entry.measuredAt)}.`, '')
    if (lane.suite === 'docs' && lane.format === 'svg') {
      const returned = snapshot.tables.find(other => other.receipt.sha256 === entry.receipt.sha256 && other.outputFormat === entry.outputFormat && other.columns.includes('Returned in all rounds') && other.rows.length)
      const occurrences = returned ? number(returned, returned.rows[0]!, 'Planned') : null
      if (occurrences && occurrences !== totals[0]) lines.push(`The full inventory has ${occurrences} documentation occurrences; invalid-source and configuration-only controls are reported separately from drawings.`, '')
    }
    if (!lane.drawing) lines.push('A case passes only when all its assertions pass. Unavailable includes missing public bindings and unrun cases. These are selected behaviours, not the entire Mermaid test suite.', '')
    const compare = (row: typeof entry.rows[number], rank: number | null) => {
      if (row.project === reference) return rank === null ? 'Reference not assessed' : 'Reference'
      if (rank === null) return 'Not assessed'
      const baseline = shown.rows.find(row => row.project === reference)
      if (!baseline) return 'No reference result'
      if (lane.drawing) {
        const a = drawingBounds(entry, row)!, b = drawingBounds(entry, baseline)!
        return a.lower > b.upper ? 'Better' : a.upper < b.lower ? 'Worse' : a.lower === a.upper && b.lower === b.upper && a.lower === b.lower ? 'Tie' : 'Uncertain'
      }
      return baselineComparison(shown, row, reference).startsWith('Tie') ? 'Tie' : baselineComparison(shown, row, reference).includes('unresolved') ? 'Uncertain' : (number(entry, row, 'Passed') ?? 0) > (number(entry, baseline, 'Passed') ?? 0) ? 'Better' : 'Worse'
    }
    lines.push(table(['Rank', 'Project', 'Version', lane.drawing ? 'Correct' : 'Passed', 'Failed', lane.drawing ? 'Unresolved' : 'Unavailable', 'vs ' + name(reference)], rows.map(row => {
      const bounds = drawingBounds(entry, row)
      const unresolved = bounds ? bounds.upper - bounds.lower : (number(entry, row, 'Unavailable') ?? 0) + (number(entry, row, 'Unrun') ?? 0)
      const passed = number(entry, row, lane.drawing ? 'Correct' : 'Passed') ?? 0
      const total = number(entry, row, totalColumn) ?? 0
      return [row.rank ?? '—', name(row.project), row.values[0]!, row.rank === null ? '—' : passed, row.rank === null ? '—' : total - passed - unresolved, unresolved, compare(row, row.rank)]
    })), '')
    const superseded = entry.rows.filter(row => visible(row.project) && !shown.rows.includes(row))
    if (superseded.length) lines.push('Newer attempts supersede these scores: ' + superseded.map(row => name(row.project)).join(', ') + '. See the collection details; old scores are not substituted.', '')
    lines.push(`[Full outcomes, correctness bounds and collection details](${detail(entry)}) · [Source evidence](${entry.receipt.url})`, '')
  }
  lines.push('## Rendering time', '', 'Lower ratios are faster. The latest attempt for each project pair and format is shown; older workloads remain in the details. Each table compares one fixed workload against its own reference in the same run. Workload times are median replica-round totals; ratios are medians of paired round ratios. Times include the stated public-call boundary and do not describe the full DaveBench corpus. Only runs with correct sampled outputs and sufficiently stable repeated reference measurements receive a rank.', '')
  const latestPairs = new Map<string, SnapshotTable>()
  for (const entry of snapshot.tables.filter(entry => entry.suite === 'portable' && entry.artifactRole !== 'candidate' && entry.cohort?.startsWith('native-timing:')).sort(recent)) {
    const format = entry.cohort!.split(':')[1]!
    const key = JSON.stringify([format, entry.rows.map(row => row.project).sort()])
    if (!latestPairs.has(key)) latestPairs.set(key, current(entry))
  }
  for (const format of ['svg', 'png', 'terminal']) {
    lines.push('### ' + format.toUpperCase(), '')
    const entries = [...latestPairs.values()].filter(entry => entry.cohort!.split(':')[1] === format)
    const qualified = entries.filter(entry => entry.rows.length === 2 && entry.rows.every(row => (number(entry, row, 'Ratio to reference') ?? 0) > 0 && (number(entry, row, 'Median replica-round ms') ?? 0) > 0 && !row.unrankedReason && row.values[entry.columns.indexOf('Qualification')] === 'qualified'))
    if (!qualified.length) lines.push('No paired run qualified. No speed ranking is available.', '')
    for (const entry of qualified.sort((a, b) => {
      const ratio = (e: SnapshotTable) => Math.min(...e.rows.filter(row => row.project !== 'mermaid-js/mermaid' && row.project !== 'AlexanderGrooff/mermaid-ascii').map(row => number(e, row, 'Ratio to reference')!))
      return ratio(a) - ratio(b)
    })) {
      const count = number(entry, entry.rows[0]!, 'Examples'), rounds = number(entry, entry.rows[0]!, 'Rounds')
      const boundary = entry.caption.split(' Corpus: ')[0]!.replace(/^[\s\S]*?Host /, 'Host ')
      lines.push(`**${entry.rows.map(row => name(row.project)).join(' / ')}** · ${count} examples · ${rounds} rounds · ${date(entry.measuredAt)}`, '', 'Corpus and selection: ' + (entry.caption.split(' Corpus: ')[1]?.split(' Ranks use')[0] ?? 'See the linked source plan for exact input IDs.') + '', '',
        table(['Rank', 'Project', 'Workload (ms)', 'Ratio to reference', 'Ratio interval'], rankedRows(entry, name).map(row => [row.rank ?? '—', name(row.project), Number(number(entry, row, 'Median replica-round ms')!.toFixed(1)), number(entry, row, 'Ratio to reference')!.toFixed(3), String(row.values[entry.columns.indexOf('Ratio interval')]).split('–').map(value => Number.isFinite(Number(value)) ? Number(value).toFixed(3) : value).join('–')])), '',
        '**Clock:** ' + boundary, '', `[Exact artifacts, samples and timing method](${detail(entry)})`, '')
    }
    const withheld = entries.filter(entry => !qualified.includes(entry))
    if (withheld.length) lines.push(table(['Unranked pair', 'Reason', 'Details'], withheld.map(entry => {
      const reason = entry.rows.map(row => row.unrankedReason ?? '').join(' ')
      return [entry.rows.map(row => name(row.project)).join(' / '), /noise ceiling/.test(reason) ? 'Reference measurements too noisy' : /incomplete|interrupted/.test(reason) ? 'Capture incomplete' : /source contract/.test(reason) ? 'Correctness not fully verified' : 'Timing not qualified', `[Run details](${detail(entry)})`]
    })), '')
  }
  lines.push('## Evidence and previous runs', '', 'Detailed pages retain return-rate diagnostics, invalid-input controls, every outcome category and superseded attempts. Original measurements and the frozen B0 baseline are unchanged.', '')
  for (const [key, link] of links) if (key.startsWith('suite:') && ['docs', 'community', 'mermaid-behaviour', 'portable'].includes(key.slice(6))) lines.push(`- [${snapshotBenchmarkNames(snapshot)[key.slice(6) as PublicSuite]} details](${link})`)
  const diagnostics = [...links].filter(([key]) => key.startsWith('suite:') && !['docs', 'community', 'mermaid-behaviour', 'portable'].includes(key.slice(6)))
  if (diagnostics.length) {
    lines.push('', '<details>', '<summary>Historical and maintenance diagnostics</summary>', '')
    for (const [key, link] of diagnostics) lines.push(`- [${snapshotBenchmarkNames(snapshot)[key.slice(6) as PublicSuite]}](${link})`)
    lines.push('', '</details>', '')
  }
  for (const publication of snapshot.publications ?? []) lines.push(`- [${md(publication.title)}](${publication.url})`)
  lines.push('', 'The raw benchmark evidence archive preserves captured outputs and the reports generated at collection time. Checking its hashes and rebuilding its tables verifies preservation and reproducibility; it does not validate every drawing or grading decision.', '')
  return lines.join('\n').trimEnd() + '\n'
}

export function writeSnapshot(snapshot: ResultsSnapshot, catalog: LineageCatalog, root: string, check = false, includeRecordedProjects = false) {
  const frozen = join(root, 'results/baseline.json')
  if (existsSync(frozen) && (snapshot.baseline?.url !== 'results/baseline.json' || snapshot.baseline.sha256 !== sha256(readFileSync(frozen)))) throw Error('Results must preserve the existing frozen baseline reference')
  snapshot = regressionSnapshot(snapshot)
  const full = renderSnapshot(snapshot, catalog, undefined, includeRecordedProjects), json = JSON.stringify(snapshot, null, 2) + '\n'
  const outputs: [string, string][] = [], links = new Map<string, string>()
  // Keep GitHub pages below its rendering limit. The complete numeric snapshot
  // stays in one JSON file; detail pages preserve every table and attempt.
  { // Always put diagnostics behind a link, even for a small campaign.
    for (const suite of PUBLIC_SUITES) {
      const heading = `### ${snapshotBenchmarkNames(snapshot)[suite]}\n\n`, start = full.indexOf(heading, full.indexOf('## Results by benchmark'))
      if (start < 0) continue
      const next = full.indexOf('\n### ', start + heading.length), end = Math.min(next < 0 ? Infinity : next, full.indexOf('\n## Campaign attempts', start))
      const tables = full.slice(start + heading.length, end)
      const ids = new Set(snapshot.attempts.filter(attempt => attempt.suite === suite).map(attempt => anchor(attempt.id)))
      const attemptStart = full.indexOf('## Campaign attempts')
      const attemptEnd = full.indexOf('## Excluded catalog entries', attemptStart)
      const attempts = full.slice(attemptStart, attemptEnd).split(/(?=<a id=")/).filter(block => ids.has(/^<a id="([^"]+)"/.exec(block)?.[1] ?? ''))
      const blocks = [...tables.split(/(?=<a id=")/).filter(block => block.trim()), ...attempts]
      const chunks: string[][] = [[]]
      for (const block of blocks) {
        if (chunks.at(-1)!.length && Buffer.byteLength(chunks.at(-1)!.join('') + block) > 120000) chunks.push([])
        chunks.at(-1)!.push(block)
      }
      const index = `results/tables/${suite}.md`
      links.set('suite:' + suite, index)
      const indexLines = [`# ${snapshotBenchmarkNames(snapshot)[suite]}`, '', '[Ecosystem overview](../../RESULTS.md)', '', 'Ranked tables and original attempt details. Each table names its own interface, input population and measurement date.', '']
      for (const [part, chunk] of chunks.entries()) {
        const file = `results/tables/${suite}-${part + 1}.md`
        const content = chunk.join('').replace(/\]\(((?:docs|results)\/[^)]+)\)/g, '](../../$1)')
        for (const match of content.matchAll(/<a id="([^"]+)"/g)) links.set(match[1]!, file)
        indexLines.push(`- [Part ${part + 1}](${suite}-${part + 1}.md)`)
        outputs.push([join(root, file), `# ${snapshotBenchmarkNames(snapshot)[suite]} · part ${part + 1}\n\n[Ecosystem overview](../../RESULTS.md) · [All parts](${suite}.md)\n\n` + content])
      }
      outputs.push([join(root, index), indexLines.join('\n') + '\n'])
    }
  }
  outputs.push([join(root, 'RESULTS.md'), renderPublicResults(snapshot, catalog, links, includeRecordedProjects)], [join(root, 'results/latest.json'), json])
  if (check) {
    for (const [path, expected] of outputs) if (!existsSync(path) || readFileSync(path, 'utf8') !== expected) throw Error('Results snapshot is stale: ' + path)
  } else {
    for (const [path, content] of outputs) { mkdirSync(join(path, '..'), { recursive: true }); writeFileSync(path, content) }
  }
}

/** Canonical observed values only; presentation order and ranking metadata may change. */
export function retainedTableValues(snapshot: ResultsSnapshot, ids: string[]) {
  return [...ids].sort().map(id => {
    const entry = snapshot.tables.find(table => table.id === id)
    if (!entry) throw Error('Missing retained table: ' + id)
    return { id: entry.id, suite: entry.suite, ...(entry.diagnostic ? { diagnostic: true } : {}), ...(entry.drawingOutcomePolicy ? { drawingOutcomePolicy: entry.drawingOutcomePolicy } : {}), measuredAt: entry.measuredAt, historical: entry.historical, ...(entry.artifactRole ? { artifactRole: entry.artifactRole } : {}), unit: entry.unit, columns: entry.columns,
      rows: [...entry.rows].sort((a, b) => a.project < b.project ? -1 : a.project > b.project ? 1 : 0).map(row => ({ project: row.project, values: row.values })) }
  })
}

function linkedBaseline(snapshot: ResultsSnapshot, root: string): ResultsSnapshot | undefined {
  if (!snapshot.baseline) return undefined
  const { url, sha256: expected } = snapshot.baseline
  if (!/^results\/[a-zA-Z0-9_./%-]+\.json$/.test(url) || url.includes('..') || !/^[a-f0-9]{64}$/.test(expected)) throw Error('Invalid frozen baseline reference')
  const path = realpathSync(resolve(root, url)), within = relative(realpathSync(root), path)
  if (isAbsolute(within) || within.startsWith('..')) throw Error('Frozen baseline escaped its repository')
  const bytes = readFileSync(path)
  if (sha256(bytes) !== expected) throw Error('Frozen baseline changed: ' + url)
  const baseline = JSON.parse(bytes.toString()) as ResultsSnapshot
  if (baseline.schema !== 'trident-results-snapshot-v1' || !Array.isArray(baseline.tables) || !Array.isArray(baseline.attempts) || baseline.baseline) throw Error('Invalid frozen baseline snapshot')
  return baseline
}

export function validateSnapshotReceipts(snapshot: ResultsSnapshot, root: string) {
  const baseline = linkedBaseline(snapshot, root)
  if (baseline) validateSnapshotReceipts(baseline, root)
  const bytesByUrl = new Map<string, Buffer>(), physicalRoot = realpathSync(root)
  for (const receipt of [...snapshot.tables.flatMap(entry => [entry.receipt, ...entry.rows.flatMap(row => row.receipt ? [row.receipt] : [])]), ...snapshot.attempts.map(entry => entry.receipt)]) {
    if (receipt.url.startsWith('https://')) continue
    let bytes = bytesByUrl.get(receipt.url)
    if (!bytes) {
      const path = realpathSync(resolve(root, receipt.url.split('#')[0]!)), within = relative(physicalRoot, path)
      if (isAbsolute(within) || within.startsWith('..')) throw Error('Retained receipt escaped its repository: ' + receipt.url)
      bytes = readFileSync(path); bytesByUrl.set(receipt.url, bytes)
    }
    if (sha256(bytes) !== receipt.sha256) throw Error('Retained receipt hash changed: ' + receipt.url)
  }
  const local = new Map<string, SnapshotTable[]>()
  for (const entry of snapshot.tables) if (!entry.receipt.url.startsWith('https://')) local.set(entry.receipt.url, [...(local.get(entry.receipt.url) ?? []), entry])
  for (const [url, bytes] of bytesByUrl) {
    const entries = local.get(url) ?? []
    const receipt = (url.split('#')[0]!.endsWith('.json') ? JSON.parse(bytes.toString()) : {}) as { tableData?: { ids: string[]; valuesSha256: string }; files?: { path: string; sha256: string }[] }
    // Frozen baselines use the same table receipt as rolling results, with
    // their actual input and outcome files attached. Check those bytes too;
    // an intact summary cannot certify a changed corpus or outcome ledger.
    if (receipt.files !== undefined) {
      if (!Array.isArray(receipt.files) || new Set(receipt.files.map(file => file.path)).size !== receipt.files.length) throw Error('Invalid frozen evidence inventory: ' + url)
      for (const file of receipt.files) {
        if (typeof file.path !== 'string' || !/^(?:docs|results)\/[a-zA-Z0-9_./%-]+$/.test(file.path) || file.path.includes('..') || !/^[a-f0-9]{64}$/.test(file.sha256)) throw Error('Invalid frozen evidence file: ' + url)
        const path = realpathSync(resolve(root, file.path)), within = relative(physicalRoot, path)
        if (isAbsolute(within) || within.startsWith('..') || sha256(readFileSync(path)) !== file.sha256) throw Error('Frozen evidence file changed or escaped: ' + file.path)
      }
    }
    if (receipt.tableData && entries.length) {
      if (JSON.stringify(entries.map(entry => entry.id).sort()) !== JSON.stringify([...receipt.tableData.ids].sort())) throw Error('Retained table population changed: ' + url)
      if (sha256(JSON.stringify(retainedTableValues(snapshot, receipt.tableData.ids))) !== receipt.tableData.valuesSha256) throw Error('Retained table values changed: ' + url)
    }
  }
}
export function main(argv = process.argv.slice(2)) {
  if (argv.includes('--help')) { console.log('bun commands.ts results:snapshot [--input results/latest.json] [--campaign DIR --evidence-url HTTPS_DIRECTORY]... [--out REPOSITORY_ROOT] [--check]\nRegenerates RESULTS.md and results/latest.json without running benchmarks. Campaign imports retain failed and partial attempts and original dates. Publish evidence first with results:campaign --copy-evidence; supply its permanent HTTPS evidence directory. --check verifies tracked output without writing.'); return }
  let input = resolve(import.meta.dir, '../results/latest.json'), out = resolve(import.meta.dir, '..'), check = false
  const imports: { directory: string; evidenceUrl?: string }[] = [], seen = new Set<string>()
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index]!
    if (!['--campaign', '--evidence-url'].includes(flag) && seen.has(flag)) throw Error('Duplicate option: ' + flag)
    seen.add(flag)
    if (flag === '--check') { check = true; continue }
    const value = argv[++index]
    if (!value || value.startsWith('--')) throw Error('Missing option value: ' + flag)
    if (flag === '--input') input = resolve(value)
    else if (flag === '--out') out = resolve(value)
    else if (flag === '--campaign') imports.push({ directory: resolve(value) })
    else if (flag === '--evidence-url' && imports.length && !imports.at(-1)!.evidenceUrl) imports.at(-1)!.evidenceUrl = value
    else throw Error('Unknown or misplaced option: ' + flag)
  }
  if (check && imports.length) throw Error('--check cannot import new campaigns')
  const catalog = JSON.parse(readFileSync(communityCatalogFile, 'utf8')) as LineageCatalog
  let snapshot = JSON.parse(readFileSync(input, 'utf8')) as ResultsSnapshot
  validateSnapshot(snapshot, catalog)
  const baseline = linkedBaseline(snapshot, resolve(import.meta.dir, '..'))
  if (baseline) validateSnapshot(baseline, catalog)
  validateSnapshotReceipts(snapshot, resolve(import.meta.dir, '..'))
  for (const entry of imports) {
    if (!entry.evidenceUrl) throw Error('--campaign needs --evidence-url')
    snapshot = importCampaign(snapshot, entry.directory, entry.evidenceUrl, catalog)
  }
  writeSnapshot(snapshot, catalog, out, check)
  console.log(check ? 'Results snapshot is current.' : 'Updated ' + join(out, 'RESULTS.md'))
}
if (import.meta.main) main()
