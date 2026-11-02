import { readFileSync } from 'node:fs'
import { evidenceDigest } from '../portable/evidence-contract.ts'
import { qualifyObserverControls, type ObserverControl } from './observer-controls.ts'
import { qualifyOutput, qualifyOutputFormat } from './qualification.ts'
import { protocolIdentity } from './protocol-identity.ts'
import { tridentDirectory } from './trident-paths.ts'
import { analyseTerminalSource } from '../fidelity/terminal-source.ts'
import { inspectTerminalBlock } from '../fidelity/terminal-family-layout.ts'
import { evaluateBehaviourStep } from './mermaid-behaviour.ts'
import type { BehaviourCase } from './mermaid-behaviour-corpus.ts'
import { evidenceBytesDigest } from '../portable/evidence-contract.ts'

/** A deliberately small public instrument check, not a drawing oracle.
 * Expectations live in the independent control inventory, not renderer output. */
export async function runMeasurementControls() {
  const controls = JSON.parse(readFileSync(new URL('../qualification/measurement-controls.json', import.meta.url), 'utf8')) as ObserverControl[]
  const producers = protocolIdentity(tridentDirectory, ['unified/admission-controls.ts', 'qualification/measurement-controls.json'])
  const result = await qualifyObserverControls(controls, evidenceDigest(producers), control => {
    if (control.property === 'block-grid-layout' && control.representation === 'terminal Unicode boxes') {
      const contract = analyseTerminalSource(control.source, 'block').contract
      const checks = inspectTerminalBlock(control.output, contract)
      return checks.some(check => check.status === 'failed') ? 'violated' : checks.length && checks.every(check => check.status === 'passed') ? 'satisfied' : 'unassessed'
    }
    if (control.property === 'accessible-name-description' && control.representation === 'static SVG title/ARIA') {
      const step = { source: control.source, sourceSha256: evidenceBytesDigest(control.source), expected: { title: control.expected?.title, description: control.expected?.description } }
      if (!step.expected.title || !step.expected.description) throw Error('Naming control lacks independent expected strings')
      const input: BehaviourCase = { id: control.id, operation: 'svg-accessibility', steps: [step], origin: { callbackId: 'independent-control', callbackSha256: evidenceBytesDigest(control.provenance), sourcePath: 'qualification/measurement-controls.json', sourceSha256: evidenceBytesDigest(control.source), line: 1 }, adaptation: control.provenance }
      const checks = evaluateBehaviourStep(input, step, { kind: 'svg', svg: control.output })
      return checks.some(check => check.status === 'failed') ? 'violated' : checks.length && checks.every(check => check.status === 'passed') ? 'satisfied' : 'unassessed'
    }
    if (!['format-validity', 'literal-label-admission'].includes(control.property) || !['static SVG', 'SVG text', 'terminal text', 'PNG bytes'].includes(control.representation)) throw Error('Unregistered measurement control scope')
    const format = control.representation === 'PNG bytes' ? 'png' : control.representation === 'terminal text' ? 'terminal' : 'svg'
    if (control.property === 'literal-label-admission' && !control.expected?.labels?.length) throw Error('Label control lacks independently declared labels')
    const value = control.property === 'format-validity' ? qualifyOutputFormat(control.encoding === 'base64' ? Buffer.from(control.output, 'base64') : control.output, format) : qualifyOutput({ id: control.id, source: control.source, family: 'flowchart', features: [], provenance: control.provenance,
      expectedLabels: control.expected?.labels }, control.output, format)
    return value.unavailable ? 'unassessed' : value.ok ? 'satisfied' : 'violated'
  })
  return { ...result, producers }
}
