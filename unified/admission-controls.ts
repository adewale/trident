import { readFileSync } from 'node:fs'
import { evidenceDigest } from '../portable/evidence-contract.ts'
import { qualifyObserverControls, type ObserverControl } from './observer-controls.ts'
import { qualifyOutput } from './qualification.ts'
import { protocolIdentity } from './protocol-identity.ts'
import { tridentDirectory } from './trident-paths.ts'

/** A deliberately small public instrument check, not a drawing oracle.
 * Expectations live in the independent control inventory, not renderer output. */
export async function runAdmissionControls() {
  const controls = JSON.parse(readFileSync(new URL('../qualification/admission-controls.json', import.meta.url), 'utf8')) as ObserverControl[]
  const producers = protocolIdentity(tridentDirectory, ['unified/admission-controls.ts', 'qualification/admission-controls.json'])
  const result = await qualifyObserverControls(controls, evidenceDigest(producers), control => {
    if (!['format-validity', 'literal-label-admission'].includes(control.property) || !['static SVG', 'SVG text', 'terminal text'].includes(control.representation)) throw Error('Unregistered admission control scope')
    const value = qualifyOutput({ id: control.id, source: control.source, family: 'flowchart', features: [], provenance: control.provenance,
      ...(control.property === 'literal-label-admission' ? { expectedLabels: ['Alpha'] } : {}) }, control.output, control.representation === 'terminal text' ? 'terminal' : 'svg')
    return value.unavailable ? 'unassessed' : value.ok ? 'satisfied' : 'violated'
  })
  return { ...result, producers }
}
