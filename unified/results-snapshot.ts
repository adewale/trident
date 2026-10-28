import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { campaignScorecards, readCampaign } from './campaign-publication.ts'
import { lineageInventory, type LineageCatalog } from './lineage.ts'
import { PUBLIC_SUITES, projectSupport, type PublicSuite } from './support.ts'
import { communityCatalogFile } from './trident-paths.ts'

type Cell = string | number
export interface SnapshotTable {
  id: string; suite: PublicSuite; measuredAt: string; historical: boolean; unit: string; caption: string
  columns: string[]; rows: { project: string; values: Cell[] }[]
  receipt: { url: string; sha256: string }
  population?: { total: string; outcomes: string[] }
  overview?: { numerator: string; denominator?: string; suffix: string }
  chart?: { numerator: string; denominator?: string; title: string; axis: string; maximum: number }
}
export interface SnapshotAttempt {
  id: string; project: string; suite: PublicSuite; measuredFrom: string; updatedAt: string
  status: string; detail: string; receipt: { url: string; sha256: string }
  evidenceUrl?: string
  groups: ReturnType<typeof campaignScorecards>
}
export interface ResultsSnapshot {
  schema: 'trident-results-snapshot-v1'
  projectNames?: Record<string, string>
  tables: SnapshotTable[]
  attempts: SnapshotAttempt[]
}
export const benchmarkNames: Record<PublicSuite, string> = {
  community: 'Mermaid Compatibility', docs: 'DaveBench: Documentation Examples', fidelity: 'Diagram Meaning',
  'native-fidelity': 'Model and Editing Contracts', 'upstream-fidelity': 'Mermaid Assertion Replay',
  'upstream-original': 'Mermaid Reference Tests', portable: 'Render Cost and Scaling',
}
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
  const projects = new Set(catalog.nodes.map(node => node.id)), ids = new Set<string>(), anchors = new Set<string>()
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
    stamp(entry.measuredAt)
    const seen = new Set<string>()
    if (entry.columns[0] !== 'Version' || new Set(entry.columns).size !== entry.columns.length) throw Error('Tables need unique columns starting with Version')
    for (const row of entry.rows) {
      if (!projects.has(row.project) || seen.has(row.project)) throw Error('Unknown or duplicate table project: ' + row.project)
      seen.add(row.project)
      if (row.values.length !== entry.columns.length || row.values.some(value => !['string', 'number'].includes(typeof value) || typeof value === 'number' && !Number.isFinite(value))) throw Error('Invalid table values')
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
    if (entry.chart) {
      if (!(entry.chart.maximum > 0) || !Number.isFinite(entry.chart.maximum)) throw Error('Invalid chart range')
      for (const row of entry.rows) chartValue(entry, row)
    }
  }
  for (const attempt of snapshot.attempts) {
    if (!projects.has(attempt.project) || stamp(attempt.updatedAt) < stamp(attempt.measuredFrom)) throw Error('Invalid campaign project or measurement interval')
    if (!['recorded', 'passed', 'failed', 'blocked', 'unsupported', 'not-applicable', 'unavailable'].includes(attempt.status)) throw Error('Invalid campaign status')
    if (attempt.evidenceUrl && !validLink(attempt.evidenceUrl)) throw Error('Invalid owning evidence URL')
    for (const group of attempt.groups) {
      if (group.project !== attempt.project || Object.values(group.dispositions).some(value => !Number.isInteger(value) || value < 0) || Object.values(group.dispositions).reduce((sum, value) => sum + value, 0) !== group.recordedObservations) throw Error('Invalid observation population')
    }
  }
}
function chartValue(entry: SnapshotTable, row: SnapshotTable['rows'][number]) {
  const chart = entry.chart!, numerator = row.values[entry.columns.indexOf(chart.numerator)]
  const denominator = chart.denominator ? row.values[entry.columns.indexOf(chart.denominator)] : 1
  if (typeof numerator !== 'number' || typeof denominator !== 'number' || numerator < 0 || denominator <= 0 || chart.denominator && numerator > denominator) throw Error('Chart needs observed numeric values and a valid denominator')
  const value = chart.denominator ? 100 * numerator / denominator : numerator
  if (value > chart.maximum) throw Error('Chart value exceeds range')
  return Number(value.toFixed(1))
}

/** Import observed dispositions, not inferred whole-diagram pass rates or timing qualification. */
export function importCampaign(snapshot: ResultsSnapshot, directory: string, evidenceUrl: string, catalog: LineageCatalog): ResultsSnapshot {
  if (!/^https:\/\//.test(evidenceUrl) || !validLink(evidenceUrl)) throw Error('Provide the permanent HTTPS URL of the published campaign evidence directory')
  const report = readCampaign(directory), digest = sha256(readFileSync(join(directory, 'report.json')))
  const attempts: SnapshotAttempt[] = []
  const touched = new Set<string>()
  const suites = (report as typeof report & { requestedSuites?: PublicSuite[] }).requestedSuites ?? [...new Set(report.results.map(row => row.suite))]
  for (const row of report.results) {
    if (!PUBLIC_SUITES.includes(row.suite as PublicSuite)) throw Error('Unknown campaign benchmark: ' + row.suite)
    const cards = campaignScorecards(row)
    const owning = row.out ? relative(resolve(directory), resolve(row.out)) : undefined
    if (owning?.startsWith('..')) throw Error('Campaign evidence must be owned inside the published campaign directory')
    const scopes = row.project ? [row.project] : report.projects
    for (const project of scopes) {
      touched.add(project + ':' + row.suite)
      const groups = cards.filter(card => card.project === project)
      // A failed multi-project process does not establish that every project failed.
      const own = Object.fromEntries([...new Set(groups.flatMap(group => Object.keys(group.dispositions)))].map(status => [status, groups.reduce((sum, group) => sum + (group.dispositions[status] ?? 0), 0)]))
      const boundaryFailure = scopes.length === 1 && ['failed', 'blocked'].includes(row.status) ? row.status : undefined
      const status = boundaryFailure ?? (groups.length ? own.failed ? 'failed' : own.blocked ? 'blocked' : own.unsupported === groups.reduce((sum, group) => sum + group.recordedObservations, 0) ? 'unsupported' : 'recorded'
        : row.project || scopes.length === 1 || row.status === 'blocked' ? row.status === 'passed' ? 'recorded' : row.status : 'unavailable')
      attempts.push({ id: 'attempt-' + sha256(digest + project + row.suite).slice(0, 24), project, suite: row.suite as PublicSuite,
        measuredFrom: report.startedAt, updatedAt: report.updatedAt, status,
        detail: [row.detail, row.disposition, ...(row.gaps ?? []), 'Campaign process status: ' + row.status, !groups.length ? 'No per-project observation table was available.' : 'Recorded observation dispositions; process completion does not establish benchmark qualification.'].filter(Boolean).join('; '),
        receipt: { url: evidenceUrl.replace(/\/$/, '') + '/report.json', sha256: digest },
        ...(owning ? { evidenceUrl: evidenceUrl.replace(/\/$/, '') + '/' + encodeURI(owning).replaceAll('#', '%23') + '/' } : {}), groups })
    }
  }
  // A partial run must not silently fall back to earlier successful evidence.
  for (const project of report.projects) for (const suite of suites) if (!touched.has(project + ':' + suite)) {
    const node = catalog.nodes.find(node => node.id === project)
    if (!node || !PUBLIC_SUITES.includes(suite as PublicSuite)) throw Error('Unknown project or suite in campaign inventory')
    if (['reference-only', 'project-unsupported'].includes(projectSupport(node).suites[suite as PublicSuite].state)) continue
    attempts.push({
      id: 'attempt-' + sha256(digest + project + suite).slice(0, 24), project, suite: suite as PublicSuite,
      measuredFrom: report.startedAt, updatedAt: report.updatedAt, status: 'unavailable', detail: 'Requested boundary has no recorded result in this partial campaign.',
      receipt: { url: evidenceUrl.replace(/\/$/, '') + '/report.json', sha256: digest }, groups: [],
    })
  }
  const byId = new Map(snapshot.attempts.map(attempt => [attempt.id, attempt]))
  for (const attempt of attempts) byId.set(attempt.id, attempt)
  return { ...snapshot, attempts: [...byId.values()].sort((a, b) => stamp(a.updatedAt) - stamp(b.updatedAt) || a.id.localeCompare(b.id)) }
}

export function renderSnapshot(snapshot: ResultsSnapshot, catalog: LineageCatalog): string {
  validateSnapshot(snapshot, catalog)
  const lineage = lineageInventory(catalog)
  const nodes = new Map(catalog.nodes.map(node => [node.id, node]))
  const name = (id: string) => snapshot.projectNames?.[id] ?? nodes.get(id)?.comparisonBranding?.name ?? id
  const alphabetical = <T extends { project: string }>(rows: T[]) => [...rows].sort((a, b) => name(a.project).localeCompare(name(b.project)))
  const measured = [...snapshot.tables.map(entry => entry.measuredAt), ...snapshot.attempts.map(entry => entry.updatedAt)].sort((a, b) => stamp(a) - stamp(b))
  const latest = measured.at(-1)
  const lines = ['# Mermaid ecosystem benchmark results', '',
    `Last recorded measurement/update: **${latest ? date(latest) : 'none'}**. ${snapshot.attempts.length} imported project/benchmark attempts; ${snapshot.tables.length} retained result tables.`, '',
    '**Historical** marks retained measurements collected before the current reporting work. This page is a rolling view across dated runs, not one matched ecosystem experiment. No fresh benchmark was run to create this page. Dates, versions, interfaces and qualification belong to each table.', '',
    '[Machine-readable results](results/latest.json) · [Benchmark methods](BENCHMARKS.md) · [Reading the tables](REPORTING.md) · [Update this page](results/README.md)', '',
    '## Ecosystem overview', '',
    `${lineage.nodes.filter(node => !node.excludedFromComparison).length} eligible projects are listed below. ${lineage.excludedProjects.length} catalog descendants/bindings are listed separately. Results are never inherited through lineage.`, '',
    'Each cell links its latest recorded attempt, or a dated retained table. New failed, blocked and partial attempts take precedence over earlier tables. Different suites have different units; there is no combined score. “Unmeasured” is missing evidence; “N/A” follows the declared output or reference scope, not a measured failure.', '',
    '| Project | Compatibility | DaveBench | Meaning | Models / editing | Assertion replay | Reference tests | Render cost |',
    '|---|---|---|---|---|---|---|---|']
  for (const { project } of alphabetical(lineage.nodes.filter(node => !node.excludedFromComparison))) {
    const support = projectSupport(nodes.get(project)!)
    const cells = PUBLIC_SUITES.map(suite => {
      const attempts = snapshot.attempts.filter(attempt => attempt.project === project && attempt.suite === suite).sort((a, b) => stamp(b.updatedAt) - stamp(a.updatedAt) || b.id.localeCompare(a.id))
      const entries = snapshot.tables.filter(entry => entry.suite === suite && entry.overview && entry.rows.some(row => row.project === project)).sort((a, b) => stamp(b.measuredAt) - stamp(a.measuredAt) || a.id.localeCompare(b.id))
      const attempt = attempts[0], entry = entries[0]
      if (attempt && (!entry || stamp(attempt.updatedAt) >= stamp(entry.measuredAt))) return `[${md(attempt.status)} · ${date(attempt.updatedAt)}](#${anchor(attempt.id)})`
      if (entry) {
        const row = entry.rows.find(row => row.project === project)!, projection = entry.overview!
        const value = row.values[entry.columns.indexOf(projection.numerator)]
        const denominator = projection.denominator ? '/' + row.values[entry.columns.indexOf(projection.denominator)] : ''
        return `[${md(value)}${denominator}${projection.suffix ? ' ' + md(projection.suffix) : ''}${entry.historical ? ' · historical' : ''} · ${date(entry.measuredAt)}](#${anchor(entry.id)})`
      }
      const state = support.suites[suite]
      return state.state === 'reference-only' || state.state === 'project-unsupported' ? 'N/A' : state.state === 'adapter-missing' ? 'Unmeasured: binding gap' : 'Unmeasured'
    })
    lines.push('| ' + md(name(project)) + ' | ' + cells.join(' | ') + ' |')
  }
  lines.push('', '## Results by benchmark', '', 'Tables retain the full recorded populations. Charts show one named measure from the adjacent table; blocked, unavailable and failed checks remain visible in that table. Raw evidence from the retained historical runs is not hosted in this repository; the linked receipts record its original paths and hashes.', '')
  for (const suite of PUBLIC_SUITES) {
    lines.push(`### ${benchmarkNames[suite]}`, '')
    const entries = snapshot.tables.filter(entry => entry.suite === suite)
    if (!entries.length) lines.push('No comparative result table has been published.', '')
    for (const entry of entries) {
      lines.push(`<a id="${anchor(entry.id)}"></a>`, '', `**${entry.id}** · ${date(entry.measuredAt)}${entry.historical ? ' · Historical' : ''} · unit: ${md(entry.unit)} · ${receiptLink(entry.receipt)}`, '', entry.caption, '')
      const rows = alphabetical(entry.rows)
      const rate = entry.chart?.denominator
      lines.push(table(['Project', ...entry.columns, ...(rate ? [entry.chart!.axis] : [])], rows.map(row => [name(row.project), ...row.values, ...(rate ? [chartValue(entry, row).toFixed(1) + '%'] : [])])), '')
      if (entry.chart && rows.length) {
        const quote = (value: string) => JSON.stringify(value.replace(/[\r\n]/g, ' '))
        lines.push('```mermaid', 'xychart-beta horizontal', `    title ${quote((entry.historical ? 'Historical: ' : '') + entry.chart.title + ' — ' + date(entry.measuredAt))}`,
          '    x-axis [' + rows.map(row => quote(name(row.project) + ' ' + row.values[0])).join(', ') + ']',
          `    y-axis ${quote(entry.chart.axis)} 0 --> ${entry.chart.maximum}`,
          '    bar [' + rows.map(row => chartValue(entry, row)).join(', ') + ']', '```', '')
      }
    }
  }
  lines.push('## Campaign attempts', '', 'Latest attempts remain visible even when collection or qualification fails. Counts below are recorded observations, not inferred whole-diagram passes. Original inventories, protocols, timing qualification and failures remain in the owning evidence.', '')
  if (!snapshot.attempts.length) lines.push('No campaign has been imported into this snapshot yet. The tables above are explicitly dated historical evidence.', '')
  for (const attempt of [...snapshot.attempts].sort((a, b) => stamp(b.updatedAt) - stamp(a.updatedAt) || a.id.localeCompare(b.id))) {
    lines.push(`<a id="${anchor(attempt.id)}"></a>`, '', `### ${md(name(attempt.project))}: ${benchmarkNames[attempt.suite]}`, '',
      `Campaign invocation: ${attempt.measuredFrom} → ${attempt.updatedAt} · **${attempt.status}** · ${receiptLink(attempt.receipt)}${attempt.evidenceUrl ? ` · [owning results and failures](${attempt.evidenceUrl})` : ''}`, '', md(attempt.detail), '')
    if (attempt.groups.length) lines.push(table(['Version / artifact role', 'Interface / runtime', 'Format / operation', 'Mode / round', 'Distinct case IDs', 'Passed observations', 'Failed', 'Unsupported', 'Blocked', 'Other dispositions', 'Recorded observations'], attempt.groups.map(group => [group.version + ' / ' + group.variant, group.surface + ' / ' + group.runtime, group.format + ' / ' + group.operation, group.mode + ' / ' + group.round, group.caseIds, group.dispositions.passed ?? 0, group.dispositions.failed ?? 0, group.dispositions.unsupported ?? 0, group.dispositions.blocked ?? 0, JSON.stringify(Object.fromEntries(Object.entries(group.dispositions).filter(([key]) => !['passed', 'failed', 'unsupported', 'blocked'].includes(key)))), group.recordedObservations])), '')
  }
  lines.push('## Excluded catalog entries', '', 'These entries are omitted from normal ecosystem comparisons under the [lineage policy](LINEAGE.md). No parent score is substituted.', '',
    table(['Project', 'Reason'], alphabetical(lineage.nodes.filter(node => node.excludedFromComparison)).map(node => [name(node.project), node.exclusionReasons.join(', ')])), '',
    'GitHub renders the Mermaid blocks. Tables carry the exact values and remain readable without charts. Chart syntax can be checked against GitHub’s installed Mermaid version using a `mermaid` block containing `info`.', '')
  return lines.join('\n')
}

export function writeSnapshot(snapshot: ResultsSnapshot, catalog: LineageCatalog, root: string, check = false) {
  const markdown = renderSnapshot(snapshot, catalog), json = JSON.stringify(snapshot, null, 2) + '\n'
  const outputs = [[join(root, 'RESULTS.md'), markdown], [join(root, 'results/latest.json'), json]] as const
  if (check) {
    for (const [path, expected] of outputs) if (!existsSync(path) || readFileSync(path, 'utf8') !== expected) throw Error('Results snapshot is stale: ' + path)
  } else {
    mkdirSync(join(root, 'results'), { recursive: true })
    for (const [path, content] of outputs) writeFileSync(path, content)
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
  for (const entry of snapshot.tables) if (!entry.receipt.url.startsWith('https://')) {
    const file = resolve(import.meta.dir, '..', entry.receipt.url.split('#')[0]!)
    if (sha256(readFileSync(file)) !== entry.receipt.sha256) throw Error('Retained receipt hash changed: ' + entry.receipt.url)
  }
  for (const entry of imports) {
    if (!entry.evidenceUrl) throw Error('--campaign needs --evidence-url')
    snapshot = importCampaign(snapshot, entry.directory, entry.evidenceUrl, catalog)
  }
  writeSnapshot(snapshot, catalog, out, check)
  console.log(check ? 'Results snapshot is current.' : 'Updated ' + join(out, 'RESULTS.md'))
}
if (import.meta.main) main()
