import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadCurrentProjectRecords, type ProjectBenchmarkRecord, stableValue } from '../portable/project-records.ts'
import { escape, featureRow, isCandidateRecord, type Lane, lanes, OUTPUTS, PROBED_FAMILIES, percent, SURFACES } from './league.ts'

const version = (record: ProjectBenchmarkRecord) => lanes(record)[0]?.version ?? String((record.identity.artifact as any)?.package?.artifact?.version ?? 'unknown')
const rounds = (record: ProjectBenchmarkRecord) => Number((record.identity.measurement as { rounds?: number } | undefined)?.rounds ?? 0)
const ms = (value: number | null | undefined) => (value === null || value === undefined ? '—' : `${value.toFixed(2)} ms`)
const label = (lane: Pick<Lane, 'surface' | 'format'>) => `${SURFACES[lane.surface] ?? lane.surface}, ${OUTPUTS[lane.format] ?? lane.format}`
/** Each feature case's round-1 verdict per surface and output, under the same rules as the league. */
function verdicts(record: ProjectBenchmarkRecord): Map<string, string> {
  const rows = record.observations.filter(row => row.suite !== 'community-cli' && row.metrics?.implementation === record.identity.project && featureRow(row) && (row.metrics?.round === undefined || row.metrics.round === 1) && ['passed', 'failed'].includes(row.status))
  return new Map(rows.map(row => [`${row.surface}\n${row.format}\n${row.caseId}`, row.status]))
}

/** One project's candidate beside its release, unranked. Speeds appear only when both records share protocol, inputs, machine and settings. */
export function renderCandidateComparison(candidate: ProjectBenchmarkRecord, release: ProjectBenchmarkRecord | undefined): string {
  if (!isCandidateRecord(candidate)) throw Error('Not a candidate record: ' + candidate.id)
  if (release && (isCandidateRecord(release) || release.identity.project !== candidate.identity.project)) throw Error('The release record must be the same project’s release')
  const project = candidate.identity.project,
    identity = (candidate.identity.artifact as { candidate?: { source?: string; sha256?: string } }).candidate
  const comparable = !!release && stableValue((release.identity.protocol as { context?: unknown }).context) === stableValue((candidate.identity.protocol as { context?: unknown }).context) && stableValue(release.identity.measurement) === stableValue(candidate.identity.measurement)
  const summary = (record: ProjectBenchmarkRecord) => `${escape(version(record))}, measured ${record.finishedAt}, status ${record.status}, ${rounds(record)} rounds, record \`${escape(record.id)}\``
  const lines = [
    `# ${project}: candidate against release`,
    '',
    `Candidate: ${summary(candidate)}. ${identity?.source === 'package-root' ? 'Local package root' : 'Tarball'} SHA-256 \`${escape(identity?.sha256 ?? 'unknown')}\`.`,
    '',
    release ? `Release: ${summary(release)}.` : `Release: no release record for ${project} in this store. Measure it into the same store with \`community:update --projects ${project}\` and the same settings, then compare again.`,
    '',
    'Both rows use the same corpus, pinned Mermaid oracle, family probes and checks as the league. This comparison is unranked; `results:publish` never puts a candidate in the league table.',
    release ? (comparable ? 'The two records share protocol, inputs, machine and measurement settings, so their times compare. They were measured one after the other, not interleaved.' : 'The two records differ in protocol, inputs, machine or measurement settings, so times are withheld.') : '',
    '',
    '| Surface | Output | Families supported | Pass rate in supported families | First-call fixed core | Repeated-source fixed core |',
    '|---|---|---:|---:|---:|---:|',
  ]
  const before = release ? lanes(release) : [],
    after = lanes(candidate),
    keys = [...new Set([...before, ...after].map(lane => `${lane.surface}\n${lane.format}`))]
  const find = (list: Lane[], key: string) => list.find(lane => `${lane.surface}\n${lane.format}` === key)
  const families = (lane?: Lane) => (lane ? `${lane.supported.length}/${PROBED_FAMILIES.length}` : '—'),
    rate = (lane?: Lane) => (lane ? `${percent(lane.passed, lane.passed + lane.failed)} (${lane.passed}/${lane.passed + lane.failed})` : '—'),
    speed = (lane: Lane | undefined, field: 'coreFirstMs' | 'coreMedianMs') => (comparable || !release ? ms(lane?.[field]) : '—')
  const pair = (left: string, right: string) => (release ? `${left} → ${right}` : right)
  for (const key of keys) {
    const old = find(before, key),
      now = find(after, key),
      [surface, format] = key.split('\n') as [string, string]
    lines.push(`| ${SURFACES[surface] ?? surface} | ${OUTPUTS[format] ?? format} | ${pair(families(old), families(now))} | ${pair(rate(old), rate(now))} | ${pair(speed(old, 'coreFirstMs'), speed(now, 'coreFirstMs'))} | ${pair(speed(old, 'coreMedianMs'), speed(now, 'coreMedianMs'))} |`)
  }
  if (!release) return lines.join('\n') + '\n'
  lines.push('', '## Changes', '')
  const was = verdicts(release),
    is = verdicts(candidate)
  for (const key of keys) {
    const [surface, format] = key.split('\n') as [string, string],
      changed = (from: string, to: string) => [...is].filter(([id, status]) => id.startsWith(key + '\n') && status === to && was.get(id) === from).map(([id]) => '`' + escape(id.split('\n')[2]) + '`')
    const old = find(before, key),
      now = find(after, key)
    const lost = old && now ? old.supported.filter(family => !now.supported.includes(family)) : [],
      gained = old && now ? now.supported.filter(family => !old.supported.includes(family)) : []
    const failing = changed('passed', 'failed'),
      passing = changed('failed', 'passed')
    lines.push(`### ${label({ surface, format })}`, '')
    if (!old || !now) lines.push(old ? 'The candidate measured nothing on this surface.' : 'The release measured nothing on this surface.', '')
    if (failing.length) lines.push(`Now failing (${failing.length}): ${failing.join(', ')}.`, '')
    if (passing.length) lines.push(`Now passing (${passing.length}): ${passing.join(', ')}.`, '')
    if (lost.length) lines.push(`Families no longer supported: ${lost.join(', ')}.`, '')
    if (gained.length) lines.push(`Families newly supported: ${gained.join(', ')}.`, '')
    if (old && now && !failing.length && !passing.length && !lost.length && !gained.length) lines.push('No case or family changed.', '')
  }
  return lines.join('\n')
}

/** The store's current candidate for one project beside its current release. */
export function compareCandidate(store: string, project: string): string {
  const current = loadCurrentProjectRecords(store).filter(record => record.identity.project === project)
  const candidate = current.find(record => record.identity.lane === 'candidate')
  if (!candidate) throw Error(`No candidate record for ${project} in ${store}; measure one with community:update --candidate-tarball or --candidate-dir`)
  return renderCandidateComparison(
    candidate,
    current.find(record => (record.identity.lane ?? 'community') === 'community'),
  )
}

if (import.meta.main) {
  const values = new Map<string, string>()
  for (let index = 2; index < process.argv.length; index += 2) values.set(process.argv[index]!, process.argv[index + 1]!)
  if (!values.has('--records') || !values.has('--project') || [...values.keys()].some(key => !['--records', '--project', '--out'].includes(key))) throw Error('Use results:compare --records STORE --project OWNER/TOOL [--out FILE]')
  const markdown = compareCandidate(resolve(values.get('--records')!), values.get('--project')!)
  if (values.has('--out')) writeFileSync(resolve(values.get('--out')!), markdown)
  else process.stdout.write(markdown)
}
