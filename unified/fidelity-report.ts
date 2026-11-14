/** Mermaid Fidelity report sections that read a merged Fidelity result
 * (scripts/merge-fidelity-runs.ts). Rendering only: nothing here changes a score. */
import { OUTCOME_KINDS, type OutcomeCounts } from './mermaid-fidelity/outcome-kinds.ts'

const LABELS: Record<(typeof OUTCOME_KINDS)[number], string> = {
  passed: 'Passed',
  'native-failure': 'Native failures',
  'native-unsupported': 'Native unsupported',
  'capability-assessment': 'Capability assessments',
  'adapter-limitation': 'Adapter limitations',
}
const number = (n: number) => n.toLocaleString('en-US')

/** One project's outcome kinds, checked against the populations they partition. */
function kinds(row: any, scoredPopulation: number, qualifiedPopulation: number): { scored: OutcomeCounts; qualified: OutcomeCounts } {
  const counts = row.outcomeKinds
  if (!counts?.scored || !counts?.qualified) throw Error(`Fidelity row ${row.project} records no outcome kinds; merge it again from its raw run (scripts/merge-fidelity-runs.ts)`)
  for (const [scope, population] of [['scored', scoredPopulation], ['qualified', qualifiedPopulation]] as const) {
    const total = OUTCOME_KINDS.reduce((sum, kind) => sum + counts[scope][kind], 0)
    if (total !== population) throw Error(`Fidelity outcome kinds for ${row.project} cover ${total} ${scope} callbacks, not ${population}`)
  }
  return counts
}

/** "Binding coverage": per project, how each callback ended, over the scored population
 * and over every reference-qualified callback. A project's score counts only passes and
 * native failures as known, so a strong renderer whose public bindings expose little
 * (few parsers, no model, no database API) scores low through unassessed callbacks, not
 * through failures; this table shows which. */
export function renderBindingCoverage(fidelity: any, label?: (row: { project: string; version?: string }) => string, heading = '## Binding coverage'): string {
  // Without a label the project and version are separate columns.
  const names = label ? ['Project'] : ['Project', 'Version'], name = (row: any) => label ? label(row).replaceAll('|', '\\|') : `${row.project} | ${row.version}`
  const scoredPopulation = fidelity.scoredPopulation, qualifiedPopulation = fidelity.referenceQualifiedCallbacks
  if (!Number.isInteger(scoredPopulation) || !Number.isInteger(qualifiedPopulation)) throw Error('Binding coverage needs a result scored under the current Fidelity definition')
  const rows = (fidelity.results ?? []).filter((row: any) => row.project !== 'mermaid-js/mermaid').map((row: any) => ({ row, ...kinds(row, scoredPopulation, qualifiedPopulation) }))
  rows.sort((a: any, b: any) => b.scored.passed - a.scored.passed || b.scored['native-failure'] - a.scored['native-failure'] || a.row.project.localeCompare(b.row.project))
  const cells = (counts: OutcomeCounts) => OUTCOME_KINDS.map(kind => number(counts[kind])).join(' | ')
  const header = OUTCOME_KINDS.map(kind => LABELS[kind])
  return [
    heading,
    '',
    `How each reference-qualified callback ended for each project, over the ${number(scoredPopulation)}-callback scored population and over all ${number(qualifiedPopulation)} qualified callbacks. Only passes and native failures are known outcomes in the score; the other three are unassessed.`,
    '',
    "- **Native failures**: an original assertion failed, or the candidate's own code faulted.",
    "- **Native unsupported**: the candidate's own code reported that it cannot do this (its parser or detector refused the diagram type, or its parse returned another diagram kind).",
    '- **Capability assessments**: Trident decided from the candidate\'s source, types or interface that the capability is absent (a family its bridge table does not list, Mermaid\'s database API, a concept its model does not carry). Each names its basis; the capability review checks them against the installed artifacts.',
    '- **Adapter limitations**: Trident has no binding, view or value for what the test needs.',
    '',
    'A project whose public interface exposes few parsers or no model can render well and still have most callbacks in the last three columns.',
    '',
    `| ${names.join(' | ')} | ${header.map(title => title + ' (scored)').join(' | ')} | ${header.map(title => title + ' (all)').join(' | ')} |`,
    `| ${names.map(() => '---').join(' | ')} | ${Array(OUTCOME_KINDS.length * 2).fill('---:').join(' | ')} |`,
    ...rows.map(({ row, scored, qualified }: any) => `| ${name(row)} | ${cells(scored)} | ${cells(qualified)} |`),
    '',
  ].join('\n')
}
