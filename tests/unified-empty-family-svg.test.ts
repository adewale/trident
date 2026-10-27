import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { qualifyFamilySvg, retainTerminalFailure } from '../unified/family-suite.ts'

const workload = { id: 'authored:empty-model', family: 'class', source: 'classDiagram', provenance: 'authored independent zero-model oracle', features: [] }
const evidence = { assertions: { nodeCount: 0, edgeCount: 0, groupCount: 0 }, origins: ['authored independent zero-model oracle'] }
const empty = { nodes: 0, edges: 0, groups: 0 }
const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 0 0"><title>Accessible metadata</title></svg>'

test('independently empty and actually empty SVG excludes only the inapplicable positive-canvas criterion', () => {
  expect(qualifyFamilySvg(workload, svg, evidence, empty).status).toBe('not-applicable')
  expect(qualifyFamilySvg(workload, svg, evidence, empty).metrics).toMatchObject({ independentNodes: 0, observedLayoutNodes: 0, explicitLabelExpectations: 0 })
  expect(qualifyFamilySvg(workload, svg, undefined, empty).findings).toContain('SVG has no positive finite viewBox or explicit canvas')
  expect(qualifyFamilySvg(workload, svg, evidence, { ...empty, nodes: 1 }).findings).toContain('SVG has no positive finite viewBox or explicit canvas')
  expect(qualifyFamilySvg(workload, svg, evidence, undefined).findings).toContain('SVG has no positive finite viewBox or explicit canvas')
})

test('empty expectations cannot hide malformed XML, foreign roots, required labels or contradictory nonempty assertions', () => {
  expect(qualifyFamilySvg(workload, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 -1 0"/>', evidence, empty).status).not.toBe('not-applicable')
  expect(qualifyFamilySvg(workload, '<svg xmlns="http://www.w3.org/2000/svg" width="NaN" height="0"/>', evidence, empty).status).not.toBe('not-applicable')
  expect(qualifyFamilySvg(workload, '<svg xmlns="http://www.w3.org/2000/svg"/>', evidence, empty).status).not.toBe('not-applicable')
  expect(qualifyFamilySvg(workload, '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="0" viewBox="0 0 0 0"/>', evidence, empty).status).not.toBe('not-applicable')
  expect(qualifyFamilySvg(workload, '<svg>', evidence, empty).status).not.toBe('not-applicable')
  expect(qualifyFamilySvg(workload, '<svg xmlns="urn:wrong"/>', evidence, empty).status).not.toBe('not-applicable')
  expect(qualifyFamilySvg({ ...workload, expectedLabels: ['Node'] }, svg, evidence, empty).status).not.toBe('not-applicable')
  expect(qualifyFamilySvg(workload, svg, { ...evidence, assertions: { ...evidence.assertions, minNodes: 1 } }, empty).status).not.toBe('not-applicable')
  expect(qualifyFamilySvg(workload, svg, { ...evidence, assertions: { ...evidence.assertions, labelsContain: ['Node'] } }, empty).status).not.toBe('not-applicable')
  expect(qualifyFamilySvg(workload, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"/>', evidence, empty).findings).toEqual([])
})

test('failed terminal evidence keeps complete dense ink within a bounded immutable artifact and declares truncation', () => {
  const out = mkdtempSync(join(tmpdir(), 'trident-terminal-evidence-'))
  const budget = { files: 0, bytes: 0 }
  const dense = 'edge label17 '.repeat(19000).slice(0, 247343)
  const digest = (text: string | Buffer) => createHash('sha256').update(text).digest('hex')
  try {
    const saved = retainTerminalFailure(out, workload, dense, budget).metrics!
    expect(saved.terminalArtifactTruncated).toBe(false)
    expect(saved.terminalOutputSha256).toBe(digest(dense))
    expect(saved.terminalArtifactBytes).toBe(Buffer.byteLength(dense))
    expect(readFileSync(String(saved.terminalArtifact), 'utf8')).toBe(dense)
    const repeated = retainTerminalFailure(out, workload, dense, budget).metrics!
    expect(repeated.terminalArtifact).toBe(saved.terminalArtifact)
    expect(readdirSync(join(out, 'failed-terminal'))).toHaveLength(1)
    const large = retainTerminalFailure(out, workload, 'x'.repeat(300000), budget).metrics!
    expect(large.terminalArtifactTruncated).toBe(true)
    expect(large.terminalArtifactBytes).toBe(256 * 1024)
    expect(large.terminalOutputBytes).toBe(300000)
    expect(large.terminalArtifactSha256).toBe(digest(readFileSync(String(large.terminalArtifact))))
    expect(retainTerminalFailure(out, workload, dense, { files: 16, bytes: 0 }).metrics?.terminalArtifact).toBeUndefined()
    expect(retainTerminalFailure(out, workload, dense, { files: 0, bytes: 2 * 1024 * 1024 }).metrics?.terminalArtifact).toBeUndefined()
    writeFileSync(String(saved.terminalArtifact), 'tampered')
    expect(() => retainTerminalFailure(out, workload, dense, budget)).toThrow()
  } finally { rmSync(out, { recursive: true, force: true }) }
})
