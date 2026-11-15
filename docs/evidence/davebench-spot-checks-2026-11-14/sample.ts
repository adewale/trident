// Deterministic spot-check sample over the published DaveBench report.
// bun sample.ts REPORT_JSON MERMAID_CHECKOUT OUT_JSON
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { davebenchFailedInputs } from '../../../unified/davebench-model.ts'
import { davebenchInputs, davebenchFamily } from '../../../unified/davebench-inputs.ts'
import { acceptedCompletion, referenceRejectedInputs, davebenchReferenceProject } from '../../../unified/davebench-report.ts'
const report = JSON.parse(readFileSync(process.argv[2]!, 'utf8'))
const inv = davebenchInputs(process.argv[3]!), source = new Map(inv.cases.map(c => [c.id, c.source]))
const rejected = new Set(referenceRejectedInputs(report).map(r => r.id))
const hash = (id: string) => createHash('sha256').update(id).digest('hex')
const completedSet = (format: string, row: { project: string; run: number }) => {
  const cases: string[] = format === 'terminal' ? report.plans.terminal.cases : report.plans.images.cases
  const run = report.runs.find((r: any) => r.project === row.project && r.format === format && r.run === row.run)
  const failed = davebenchFailedInputs(run, cases)
  return new Set(cases.filter(id => !failed[id]))
}
const svgTable = acceptedCompletion(report, 'svg')
const refRow = svgTable.rows.find(r => r.project === davebenchReferenceProject)!
const reference = completedSet('svg', refRow)
const sample: { project: string; format: string; id: string; position: number; family: string; tier: string; reason: string }[] = []
for (const [format, top] of [['svg', 6], ['terminal', 3]] as const) {
  const table = acceptedCompletion(report, format), group = table.rows.slice(0, top)
  const done = new Map(group.map(row => [row.project, completedSet(format, row)]))
  for (const row of group) {
    const mine = done.get(row.project)!, others = group.filter(o => o.project !== row.project)
    const order = (ids: string[]) => ids.sort((a, b) => hash(a).localeCompare(hash(b)))
    const accepted = [...mine].filter(id => !rejected.has(id))
    const failingOthers = (id: string) => others.filter(o => !done.get(o.project)!.has(id)).length
    const tiers: [string, string[], number, (id: string) => string][] = [
      ['T1 reference-rejected rendered', order([...mine].filter(id => rejected.has(id))), 2, () => 'reference rejects this input; project rendered it'],
      ['T2 completes where reference fails', row.project === davebenchReferenceProject ? [] : order(accepted.filter(id => !reference.has(id))), 2, () => 'reference (Mermaid SVG) failed this accepted input'],
      ['T3 only this project in group', order(accepted.filter(id => failingOthers(id) === others.length && others.length > 0)), 3, () => `no other top-${top} ${format} project completed it`],
      ['T4 completes where a near peer fails', accepted.filter(id => failingOthers(id) > 0).sort((a, b) => failingOthers(b) - failingOthers(a) || hash(a).localeCompare(hash(b))), 3, id => `${failingOthers(id)} of ${others.length} other top-${top} projects failed it`],
      ['T5 stratified fill', order(accepted), 99, () => 'completed; distinct family fill'],
    ]
    const picked: typeof sample = [], sources = new Set<string>(), families = new Set<string>()
    for (const [tier, ids, cap, why] of tiers) {
      let taken = 0
      // Within a tier, inputs of a family not yet sampled come first; T5 takes new families only.
      for (const pass of tier.startsWith('T5') ? [0] : [0, 1]) for (const id of ids) {
        if (picked.length >= 8 || taken >= cap || (tier.startsWith('T5') && picked.length >= 6)) break
        const text = source.get(id)!, family = davebenchFamily(text)
        if (sources.has(text) || (pass === 0 && families.has(family))) continue
        sources.add(text); families.add(family); taken++
        picked.push({ project: row.project, format, id, position: inv.cases.findIndex(c => c.id === id), family, tier, reason: why(id) })
      }
    }
    sample.push(...picked)
  }
}
writeFileSync(process.argv[4]!, JSON.stringify(sample, null, 2) + '\n')
const count = new Map<string, number>(); for (const s of sample) count.set(s.project + ' ' + s.format, (count.get(s.project + ' ' + s.format) ?? 0) + 1)
console.log(sample.length, [...count])
for (const s of sample) console.log(s.format, s.project, s.id, s.family, s.tier)
