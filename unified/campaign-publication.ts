import { cpSync, existsSync, lstatSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { readBenchmarkDocument } from '../portable/project-records.ts'
import { canonicalBenchmarkTool } from '../tool-versions.ts'
import type { BenchmarkObservation, UnifiedSuiteResult } from './types.ts'
import { PUBLIC_SUITES } from './support.ts'
import { copyPublicationMethods } from './publication-methods.ts'

export interface CampaignEnvelope {
  startedAt: string; updatedAt: string; projects: string[]; profile: string; rounds: number
  results: { suite: string; project?: string; status: string; disposition?: string; detail?: string; out?: string; observations?: number; counts?: Record<string, unknown>; gaps?: string[] }[]
}
export function readCampaign(directory: string): CampaignEnvelope {
  const report = readBenchmarkDocument(join(directory, 'report.json')) as CampaignEnvelope
  if (!Array.isArray(report.projects) || !Array.isArray(report.results) || typeof report.startedAt !== 'string') throw Error('Not a public-artifact campaign: ' + directory)
  return report
}
const cell = (value: unknown) => String(value).replaceAll('|', '/').replaceAll('\n', ' ')
const link = (root: string, path: string) => encodeURI(relative(root, path)).replaceAll('#', '%23')
export function campaignScorecards(row: CampaignEnvelope['results'][number]) {
  if (!row.out) return []
  const files = ['result.json', 'node-fidelity-result.json', 'community-fidelity-report.json', 'upstream-fidelity-report.json', 'upstream-original-report.json']
  let result: UnifiedSuiteResult | undefined
  for (const name of files) {
    const path = join(row.out, name)
    if (!existsSync(path) && !existsSync(path + '.gz')) continue
    const value = readBenchmarkDocument(path) as any
    const candidate = value.result ?? value
    if (Array.isArray(candidate.observations)) { result = candidate; break }
  }
  if (!result) return []
  const groups = new Map<string, { project: string; version: string; variant: string; surface: string; runtime: string; mode: string; round: number | string; observations: BenchmarkObservation[] }>()
  for (const observation of result.observations) {
    const raw = observation.metrics?.project ?? observation.metrics?.implementation ?? row.project ?? 'unattributed'
    const project = canonicalBenchmarkTool(String(raw)), variant = String(observation.metrics?.variant ?? 'default')
    const version = String(observation.metrics?.version ?? result.toolVersions?.find(receipt => canonicalBenchmarkTool(receipt.tool) === project && (receipt.variant ?? 'default') === variant)?.version ?? 'see frozen artifact receipt')
    const group = { project, version, variant, surface: observation.surface, runtime: observation.runtime, mode: observation.mode, round: String(observation.metrics?.round ?? 'not round-based') }
    const key = JSON.stringify(group)
    const own = groups.get(key) ?? { ...group, observations: [] as BenchmarkObservation[] }
    own.observations.push(observation); groups.set(key, own)
  }
  return [...groups.values()].sort((a, b) => JSON.stringify(a.project + a.surface + a.mode + a.round).localeCompare(JSON.stringify(b.project + b.surface + b.mode + b.round))).map(({ observations, ...group }) => ({ ...group,
    caseIds: new Set(observations.map(observation => observation.caseId)).size, recordedObservations: observations.length,
    dispositions: Object.fromEntries([...new Set(observations.map(observation => observation.status))].sort().map(status => [status, observations.filter(observation => observation.status === status).length])) }))
}
/** A report is a view over retained evidence. It never relabels earlier data as
 * a current-protocol run, changes dates, or pools unrelated suite denominators. */
export function publishCampaigns(directories: string[], out: string, settings: { copyEvidence?: boolean; suiteSelection?: Record<string, string[]> } = {}) {
  if (!directories.length || existsSync(out)) throw Error('Choose input campaigns and a fresh publication directory')
  const sources = directories.map(directory => realpathSync(directory))
  if (new Set(sources).size !== sources.length) throw Error('Duplicate campaign directory')
  if (sources.some(source => { const path = relative(source, resolve(out)); return !path.startsWith('..') })) throw Error('Publication output must be outside input evidence')
  const inputs = sources.map(directory => {
    const original = readCampaign(directory), selectedSuites = settings.suiteSelection?.[directory]
    if (selectedSuites && (!selectedSuites.length || new Set(selectedSuites).size !== selectedSuites.length || selectedSuites.some(suite => !PUBLIC_SUITES.includes(suite as any)))) throw Error('Publication suite selection must name unique public suites')
    const results = selectedSuites ? original.results.filter(row => selectedSuites.includes(row.suite)) : original.results
    if (settings.copyEvidence && results.some(row => row.out && relative(directory, resolve(row.out)).startsWith('..'))) throw Error('A selected suite owns evidence outside its campaign; supply the original owning campaign for a portable bundle')
    return { directory, selectedSuites, report: { ...original, results } }
  })
  mkdirSync(out, { recursive: true })
  copyPublicationMethods(out)
  const lines = ['# Trident benchmark evidence', '', `Published ${new Date().toISOString()}. Measurement dates below belong to the original campaigns.`, '',
    'Unranked scorecards. Coverage, output correctness, optional model evidence, time and resources have different units. Missing adapters and unavailable observers receive no pass credit. No global winner or validated production holdout is claimed.', '',
    settings.copyEvidence ? 'Evidence is copied below. Original absolute paths inside raw records remain provenance; the links here point to the copied files.' : 'This local index links the original evidence in place. It is not a self-contained web publication; use --copy-evidence to create a portable evidence bundle.', '',
    '| Campaign | Measured from | Last recorded update | Profile / rounds | Projects | Completion |', '|---|---|---|---|---:|---|']
  const manifest: unknown[] = []
  for (const [index, { directory, report, selectedSuites }] of inputs.entries()) {
    const target = settings.copyEvidence ? join(out, 'evidence', String(index + 1)) : directory
    if (settings.copyEvidence) {
      cpSync(directory, target, { recursive: true, dereference: false, filter: source => { if (source === directory) return true; const part = relative(directory, source).split(/[\\/]/); if (part.some(name => ['node_modules', '.git'].includes(name))) return false; if (lstatSync(source).isSymbolicLink()) throw Error('Evidence symlinks need explicit admission before portable publication: ' + source); return true } })
    }
    const complete = existsSync(join(directory, 'completed.json')) ? 'collection completed; qualification may fail' : 'no completion receipt: partial'
    lines.push(`| [${index + 1}](${link(out, join(target, 'report.json'))}) | ${cell(report.startedAt)} | ${cell(report.updatedAt)} | ${report.profile} / ${report.rounds} | ${report.projects.length} | ${complete} |`)
    manifest.push({ source: directory, selectedSuites: selectedSuites ?? 'all recorded suites', measuredFrom: report.startedAt, lastRecordedUpdate: report.updatedAt, profile: report.profile, rounds: report.rounds, projects: report.projects, complete, results: report.results })
  }
  for (const [index, { directory, report, selectedSuites }] of inputs.entries()) {
    const target = settings.copyEvidence ? join(out, 'evidence', String(index + 1)) : directory
    lines.push('', `## Campaign ${index + 1}`, '', 'Selected projects: ' + report.projects.join(', ') + '.', '', '| Suite | Project scope | Status / disposition | Counts and limits | Owning evidence |', '|---|---|---|---|---|')
    if (selectedSuites) lines.splice(lines.length - 2, 0, `This publication selects these suites from the original campaign: ${selectedSuites.join(', ')}. The linked original report and copied evidence remain unchanged.`, '')
    for (const row of [...report.results].sort((a, b) => a.suite.localeCompare(b.suite) || (a.project ?? '').localeCompare(b.project ?? ''))) {
      const owning = row.out ? resolve(row.out) : undefined
      const within = owning && !relative(directory, owning).startsWith('..')
      const mapped = within ? join(target, relative(directory, owning!)) : owning
      const evidence = mapped && existsSync(owning!) ? `[owning directory](${link(out, mapped)}/)` : 'no owning evidence directory recorded'
      const counts = row.counts ? JSON.stringify(row.counts) : row.observations !== undefined ? `${row.observations} observations; not whole-diagram passes` : row.detail ?? 'Process status only; inspect owning results'
      lines.push('| ' + [row.suite, row.project ?? report.projects.join(', '), row.status + (row.disposition ? ' / ' + row.disposition : ''), counts + (row.gaps?.length ? '; ' + row.gaps.join('; ') : '')].map(cell).join(' | ') + ' | ' + evidence + ' |')
    }
    for (const row of report.results) {
      const cards = campaignScorecards(row)
      if (!cards.length) continue
      lines.push('', `### ${row.suite}${row.project ? ': ' + row.project : ''} observations`, '', 'Counts are recorded observations within each public surface/mode/round. Unexecuted inputs and planned denominators remain in the owning inventory; no acceptance percentage is inferred.', '',
        '| Project | Version / artifact role | Surface / runtime | Mode / round | Distinct case IDs | Recorded observations | Dispositions |', '|---|---|---|---|---:|---:|---|')
      for (const card of cards) lines.push('| ' + [card.project, `${card.version} / ${card.variant}`, `${card.surface} / ${card.runtime}`, `${card.mode} / ${card.round}`, card.caseIds, card.recordedObservations, JSON.stringify(card.dispositions)].map(cell).join(' | ') + ' |')
    }
    lines.push('', 'Raw samples, input inventories, versions and failure outputs remain in the owning evidence; no denominator or speed comparison is reconstructed from process completion.')
  }
  writeFileSync(join(out, 'README.md'), lines.join('\n') + '\n')
  writeFileSync(join(out, 'campaigns.json'), JSON.stringify({ publishedAt: new Date().toISOString(), copyEvidence: !!settings.copyEvidence, campaigns: manifest }, null, 2) + '\n')
  return { out, campaigns: inputs.length, copied: !!settings.copyEvidence }
}
if (import.meta.main) {
  const sources: string[] = [], suiteSelection: Record<string, string[]> = {}; let out: string | undefined, copyEvidence = false
  const args = process.argv.slice(2)
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--campaign' && args[index + 1]) sources.push(resolve(args[++index]!))
    else if (args[index] === '--suites' && args[index + 1] && sources.length && !suiteSelection[sources.at(-1)!]) suiteSelection[sources.at(-1)!] = args[++index]!.split(',')
    else if (args[index] === '--out' && args[index + 1] && !out) out = resolve(args[++index]!)
    else if (args[index] === '--copy-evidence') copyEvidence = true
    else throw Error('Use results:campaign --campaign DIR [--campaign DIR] --out FRESH_DIR [--copy-evidence]')
  }
  if (!out) throw Error('A fresh --out directory is required')
  console.log(JSON.stringify(publishCampaigns(sources, out, { copyEvidence, suiteSelection })))
}
