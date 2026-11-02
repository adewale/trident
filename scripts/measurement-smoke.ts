import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { evidenceBytesDigest } from '../portable/evidence-contract.ts'
import { assertBenchmarkExecutionAllowed } from '../portable/ci-policy.ts'
import { defaultChromium } from '../unified/benchmark-context.ts'
import { chromium } from 'playwright'
import { freshOutputOutside } from '../unified/measurement-replay.ts'
import plan from '../qualification/measurement-smoke.json' with { type: 'json' }
import { loadCampaignPreparation } from '../unified/campaign-preparation.ts'
import { readBenchmarkDocument } from '../portable/project-records.ts'

const root = resolve(import.meta.dir, '..'), command = join(root, 'commands.ts')
const help = 'verify:measurements:live --plan | --out FRESH_DIRECTORY [--executable CHROMIUM]\nAcquires the three frozen catalogue releases in qualification/measurement-smoke.json, collects the predeclared partial SVG/PNG workload and active terminal corpus, then replays retained bytes. This is public-adapter integration evidence, not whole-corpus accuracy or speed qualification. Run locally with the pinned oracle and source installed.'
export function main(args = process.argv.slice(2)) {
  if (args.length === 1 && args[0] === '--help') { console.log(help); return }
  if (args.length === 1 && args[0] === '--plan') { console.log(JSON.stringify(plan, null, 2)); return }
  const options = new Map<string, string>()
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]!, value = args[i + 1]
    if (!['--out', '--executable'].includes(key) || !value || value.startsWith('--') || options.has(key)) throw Error(help)
    options.set(key, value)
  }
  if (!options.has('--out')) throw Error(help)
  assertBenchmarkExecutionAllowed()
  const out = resolve(options.get('--out')!), executable = options.get('--executable') ?? defaultChromium(chromium)
  freshOutputOutside(root, out); mkdirSync(out, { recursive: true })
  writeFileSync(join(out, 'plan.json'), JSON.stringify(plan, null, 2) + '\n', { flag: 'wx' })
  writeFileSync(join(out, 'docs-cases.json'), JSON.stringify(plan.docsCaseIds) + '\n', { flag: 'wx' })
  const steps: { name: string; args: string[]; exitCode: number | null; signal: string | null; logSha256: string }[] = []
  const save = (state: string, details?: unknown) => writeFileSync(join(out, 'acceptance.json'), JSON.stringify({ schema: 'trident-live-measurement-acceptance-v1', state, scope: plan.purpose, selection: plan.selection, steps, ...(details ? { details } : {}) }, null, 2) + '\n')
  const run = (name: string, argv: string[], allowRecordedOutcomes = false) => {
    const result = spawnSync(process.execPath, [command, ...argv], { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
    const log = (result.stdout ?? '') + '\n' + (result.stderr ?? '')
    writeFileSync(join(out, name + '.log'), log, { flag: 'wx' })
    steps.push({ name, args: argv, exitCode: result.status, signal: result.signal, logSha256: evidenceBytesDigest(log) }); save('running')
    // A failed/unknown renderer assessment can be a completely captured run.
    // Preserve that status; require actual report/evidence below, not exit 0.
    if (result.error || result.signal || ![0, ...(allowRecordedOutcomes ? [1, 2] : [])].includes(result.status ?? -1)) throw Error(name + ' failed; see ' + join(out, name + '.log'))
  }
  try {
    const docs = join(out, 'docs'), terminal = join(out, 'terminal'), replay = join(out, 'docs-replay')
    run('prepare', ['bench', '--projects', plan.projects.join(','), '--suites', 'docs', '--docs-formats', plan.formats.join(','), '--docs-cases', join(out, 'docs-cases.json'), '--executable', executable, '--prepare', '--out', docs])
    const selected = loadCampaignPreparation(join(docs, 'preparation.json')).options
    if (JSON.stringify(selected.docsCaseIds) !== JSON.stringify(plan.docsCaseIds) || JSON.stringify(selected.docsFormats) !== JSON.stringify(plan.formats)) throw Error('Preparation lost or changed the predeclared smoke workload; collection was not started')
    run('docs', ['bench', '--prepared', join(docs, 'preparation.json'), '--budget-minutes', '5', '--out', docs], true)
    const collected = readBenchmarkDocument(join(docs, 'docs/result.json')) as any
    const calls = collected.observations.filter((row: any) => row.operation === 'render')
    if (calls.length !== plan.projects.length * plan.formats.length * plan.docsCaseIds.length || calls.some((row: any) => !plan.docsCaseIds.includes(row.caseId))) throw Error('Collector executed a different documentation source population')
    run('terminal', ['bench', '--terminal', '--community-prepared', join(docs, 'preparation/community-prepared.json'), '--projects', plan.terminalProject, '--out', terminal], true)
    const before = evidenceBytesDigest(readFileSync(join(docs, 'report.json'))), terminalBefore = evidenceBytesDigest(readFileSync(join(terminal, 'raw.json')))
    run('docs-audit', ['measurements', '--campaign', docs, '--out', join(out, 'docs-audit')])
    run('terminal-audit', ['measurements', '--campaign', terminal, '--out', join(out, 'terminal-audit')])
    run('docs-replay', ['measurements:replay', '--kind', 'docs', '--campaign', docs, '--formats', plan.formats.join(','), '--executable', executable, '--out', replay])
    run('terminal-replay', ['measurements:replay', '--kind', 'terminal', '--campaign', terminal, '--out', join(out, 'terminal-replay')])
    run('replayed-audit', ['measurements', '--campaign', replay, '--out', join(out, 'replayed-audit')])
    if (before !== evidenceBytesDigest(readFileSync(join(docs, 'report.json'))) || terminalBefore !== evidenceBytesDigest(readFileSync(join(terminal, 'raw.json')))) throw Error('Replay changed original evidence')
    const measured = (directory: string) => JSON.parse(readFileSync(join(out, directory, 'measurements.json'), 'utf8')).tables.filter((table: any) => ['output-production', 'output-validity', 'output-size'].includes(table.measurement.id)).map((table: any) => ({ measurement: table.measurement.id, scope: table.scope, columns: table.columns, rows: table.rows.map((row: any) => ({ project: row.project, values: row.values })) }))
    const captured = measured('docs-audit'), replayed = measured('replayed-audit'), terminalData = measured('terminal-audit')
    if (JSON.stringify(captured) !== JSON.stringify(replayed)) throw Error('Replay changed mechanical production, format or byte measurements')
    const production = captured.filter((table: any) => table.measurement === 'output-production').flatMap((table: any) => table.rows)
    if (production.length !== plan.projects.length * plan.formats.length || production.some((row: any) => !plan.projects.includes(row.project) || row.values[1] < 1)) throw Error('A selected public output transport has no actual verified return')
    if (!terminalData.some((table: any) => table.measurement === 'output-production' && table.rows.some((row: any) => row.project === plan.terminalProject && row.values[1] > 0))) throw Error('Terminal public transport has no owned output measurements')
    save('verified-integration', { docs: captured, terminal: terminalData, immutableReplay: true, limits: 'Only the predeclared public releases/transports and selected sources. Unassessed drawings, missing outputs and unqualified timing remain unqualified; inspect all retained collection statuses and reports.' })
    console.log(JSON.stringify({ out, state: 'verified-integration', measuredOutputGroups: production.length, immutableReplay: true }))
  } catch (error) { save('failed', { error: String(error) }); throw error }
}
if (import.meta.main) main()
