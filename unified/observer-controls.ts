import { evidenceBytesDigest, evidenceDigest } from '../portable/evidence-contract.ts'

export type ControlVerdict = 'satisfied' | 'violated' | 'unassessed'
export interface ObserverControl {
  id: string
  property: string
  representation: string
  kind: 'positive' | 'wrong-output' | 'equivalent'
  source: string
  output: string
  /** Origin of the expected answer, independent of the observer under test. */
  provenance: string
}
/** Run the instrument on actual controls. A saved qualified flag, mutation that
 * never gets inspected, or unsupported equivalent representation cannot pass.
 * Each property/representation needs its own three-way control group. */
export async function qualifyObserverControls(controls: readonly ObserverControl[], observerSha256: string,
  observe: (input: ObserverControl) => ControlVerdict | Promise<ControlVerdict>) {
  if (!/^[a-f0-9]{64}$/.test(observerSha256) || !controls.length || new Set(controls.map(control => control.id)).size !== controls.length) throw Error('Observer controls need an identity and unique nonempty inventory')
  const gaps: string[] = [], rows = []
  const groups = new Map<string, Set<string>>()
  for (const control of controls) {
    if (![control.id, control.property, control.representation, control.source, control.provenance].every(value => typeof value === 'string' && value.trim()) || typeof control.output !== 'string' || !['positive', 'wrong-output', 'equivalent'].includes(control.kind)) throw Error('Observer control lacks independent scope or actual stimulus/output')
    const key = JSON.stringify([control.property, control.representation]), kinds = groups.get(key) ?? new Set<string>()
    kinds.add(control.kind); groups.set(key, kinds)
    const expected = control.kind === 'wrong-output' ? 'violated' : 'satisfied'
    let observed: ControlVerdict = 'unassessed', error: string | undefined
    try { observed = await observe(control); if (!['satisfied', 'violated', 'unassessed'].includes(observed)) throw Error('Observer returned an unknown verdict') }
    catch (cause) { observed = 'unassessed'; error = String(cause) }
    if (observed !== expected) gaps.push(control.id + ': expected ' + expected + ', observed ' + observed)
    rows.push({ id: control.id, property: control.property, representation: control.representation, kind: control.kind, provenance: control.provenance,
      sourceSha256: evidenceBytesDigest(control.source), outputSha256: evidenceBytesDigest(control.output), expected, observed, ...(error ? { error } : {}) })
  }
  for (const [scope, kinds] of groups) for (const kind of ['positive', 'wrong-output', 'equivalent']) if (!kinds.has(kind)) gaps.push(scope + ': missing ' + kind + ' control')
  return { schema: 'trident-observer-controls-v1', observerSha256, controlsSha256: evidenceDigest(controls), qualified: gaps.length === 0, gaps, rows,
    scope: [...groups.keys()].map(key => { const [property, representation] = JSON.parse(key) as [string, string]; return { property, representation } }),
    limits: 'Qualification covers only these properties, representations and controls. Provenance must be independently reviewed; this runner does not establish reviewer independence or whole-corpus correctness.' }
}
