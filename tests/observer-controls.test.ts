import { expect, test } from 'bun:test'
import { evidenceBytesDigest } from '../portable/evidence-contract.ts'
import { qualifyOutput, SVG_QUALIFICATION_PROTOCOL } from '../unified/qualification.ts'
import { qualifyObserverControls, type ObserverControl } from '../unified/observer-controls.ts'
import { evaluateBehaviourStep } from '../unified/mermaid-behaviour.ts'
import type { BehaviourCase } from '../unified/mermaid-behaviour-corpus.ts'

const source = 'flowchart LR\nA["Crème & Tea"]'
const svg = (body: string) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50">' + body + '</svg>'
const controls: ObserverControl[] = [
  { id: 'literal', kind: 'positive', output: svg('<text>Crème &amp; Tea</text>') },
  { id: 'lost-label', kind: 'wrong-output', output: svg('<text>Wrong label</text>') },
  { id: 'split-label', kind: 'equivalent', output: svg('<text><tspan>Crème</tspan><tspan> &amp; Tea</tspan></text>') },
].map(control => ({ ...control, property: 'authored-label-admission', representation: 'namespaced SVG text', source, provenance: 'Independent literal label, omitted-label negative, equivalent inline tspan decomposition' })) as ObserverControl[]
const identity = evidenceBytesDigest(SVG_QUALIFICATION_PROTOCOL)
const observe = (control: ObserverControl) => {
  const value = qualifyOutput({ id: control.id, family: 'flowchart', source: control.source, expectedLabels: ['Crème & Tea'], features: [], provenance: control.provenance }, control.output, 'svg')
  return value.unavailable ? 'unassessed' as const : value.ok ? 'satisfied' as const : 'violated' as const
}
test('static ARIA group names preserve valid equivalents while wrong, hidden, styled and nested targets cannot gain credit', () => {
  const step = { source: 'classDiagram\naccTitle: Name\naccDescr: Description', sourceSha256: 'a'.repeat(64), expected: { title: 'Name', description: 'Description' } }
  const input: BehaviourCase = { id: 'independent-aria', operation: 'svg-accessibility', steps: [step], origin: { callbackId: 'independent', callbackSha256: 'b'.repeat(64), sourcePath: 'independent', sourceSha256: 'a'.repeat(64), line: 1 }, adaptation: 'Independent static naming control' }
  const inspect = (body: string) => evaluateBehaviourStep(input, step, { kind: 'svg', svg: '<svg xmlns="http://www.w3.org/2000/svg" aria-labelledby="n" aria-describedby="d">' + body + '</svg>' })
  const body = '<g id="n">Name</g><g id="d">Description</g>'
  expect(inspect(body).every(check => check.status === 'passed')).toBe(true)
  expect(inspect(body.replace('>Name<', '>Wrong<')).some(check => check.status === 'failed')).toBe(true)
  expect(inspect(body.replace('id="n"', 'id="n" style="display:none"')).some(check => check.status === 'unavailable')).toBe(true)
  expect(inspect('<style>g{display:none}</style>' + body).some(check => check.status === 'unavailable')).toBe(true)
  expect(inspect('<g>' + body + '</g>').some(check => check.status === 'unavailable')).toBe(true)
})
test('actual label observer runs positive, wrong-output and equivalent controls with separate narrow qualification', async () => {
  const result = await qualifyObserverControls(controls, identity, observe)
  expect(result.qualified).toBe(true)
  expect(result.scope).toEqual([{ property: 'authored-label-admission', representation: 'namespaced SVG text' }])
  expect(result.rows.map(row => row.observed)).toEqual(['satisfied', 'violated', 'satisfied'])
  expect(result.rows[0]!.outputSha256).toBe(evidenceBytesDigest(controls[0]!.output))
  expect(result.limits).toContain('does not establish reviewer independence')
})
test('false positives, false negatives, unsupported equivalents and observer crashes withhold qualification', async () => {
  expect((await qualifyObserverControls(controls, identity, () => 'satisfied')).qualified).toBe(false)
  expect((await qualifyObserverControls(controls, identity, () => 'violated')).qualified).toBe(false)
  const unknown = await qualifyObserverControls(controls, identity, input => input.kind === 'equivalent' ? 'unassessed' : observe(input))
  expect(unknown.qualified).toBe(false)
  expect(unknown.rows[2]!.observed).toBe('unassessed')
  const crashed = await qualifyObserverControls(controls, identity, () => { throw Error('broken observer') })
  expect(crashed.qualified).toBe(false)
  expect(crashed.rows.every(row => row.observed === 'unassessed')).toBe(true)
})
test('each additional property and representation needs its own independent controls', async () => {
  const incomplete = await qualifyObserverControls(controls.slice(0, 2), identity, observe)
  expect(incomplete.gaps.some(gap => gap.includes('missing equivalent'))).toBe(true)
  const other = await qualifyObserverControls([...controls, { ...controls[0]!, id: 'outline', representation: 'outlined SVG glyphs' }], identity, observe)
  expect(other.qualified).toBe(false)
  await expect(qualifyObserverControls([controls[0]!, controls[0]!], identity, observe)).rejects.toThrow('unique')
  await expect(qualifyObserverControls([], identity, observe)).rejects.toThrow('inventory')
})
