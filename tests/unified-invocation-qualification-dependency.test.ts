import { expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { buildInvocationLibraryHarness } from '../unified/invocation.ts'
import { assertResolvedSceneEnvelope } from '../unified/invocation-receipt.ts'

const harnessRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
test('relocated actual library worker resolves real harness saxes and independently accepts/rejects SVG', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'am-relocated-qualifier-'))
  try {
    const candidate = join(directory, 'isolated-candidate'),
      out = join(directory, 'isolated-evidence')
    mkdirSync(candidate)
    writeFileSync(join(candidate, 'package.json'), JSON.stringify({ type: 'module', exports: { '.': './index.mjs' } }))
    const entry = join(candidate, 'index.mjs')
    writeFileSync(entry, `export function renderMermaidSVG(source){return source.includes('INVALID')?'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><text>Start & broken</text></svg>':'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><text>Start</text></svg>'}\nexport function renderResolvedScene(source){const svg=renderMermaidSVG(source);return {version:1,family:'flowchart',width:100,height:40,svg,colors:source.includes('BADCOLOR')?[]:{bg:'#fff',fg:'#111'},frame:source.includes('BADFRAME')?[null]:[],...(source.includes('SHAPEFAIL')?{}:{parts:source.includes('BADPART')?[{id:'A',primitives:[null]}]:[],payload:'x'.repeat(9000)})}}\n`)
    const built = await buildInvocationLibraryHarness({ out, harnessRoot }),
      result = join(out, 'result.json'),
      job = join(out, 'job.json')
    expect(existsSync(join(candidate, 'node_modules'))).toBe(false)
    const workload = { family: 'flowchart', features: [], provenance: 'authored relocated qualification regression', expectedLabels: ['Start'] }
    writeFileSync(
      job,
      JSON.stringify({
        root: candidate,
        entry,
        qualifier: built.qualifier,
        exportName: '.',
        workloads: [
          { ...workload, id: 'valid', source: 'flowchart LR\nA[Start]' },
          { ...workload, id: 'invalid', source: 'INVALID' },
          { ...workload, id: 'shape-invalid', source: 'flowchart LR\nA[Start] %% SHAPEFAIL' },
          ...['BADFRAME', 'BADPART', 'BADCOLOR'].map(marker => ({ ...workload, id: marker, source: `flowchart LR\nA[Start] %% ${marker}` })),
        ],
        full: false,
        out: result,
        round: 1,
      }),
    )
    execFileSync(process.env.NODE_BIN ?? 'node', [built.worker, job], { cwd: candidate, timeout: 30_000 })
    const rows = JSON.parse(readFileSync(result, 'utf8')).rows as { caseId: string; operation: string; status: string; detail?: string }[]
    const valid = rows.filter(row => row.caseId === 'valid' && row.operation === 'renderMermaidSVG'),
      invalid = rows.filter(row => row.caseId === 'invalid' && row.operation === 'renderMermaidSVG')
    expect(valid.length).toBeGreaterThan(0)
    expect(valid.every(row => row.status === 'passed')).toBe(true)
    expect(invalid.length).toBeGreaterThan(0)
    expect(invalid.every(row => row.status === 'failed')).toBe(true)
    const scene = rows.filter(row => row.operation === 'renderResolvedScene')
    expect(scene.filter(row => row.caseId === 'valid').length).toBeGreaterThan(0)
    expect(scene.filter(row => row.caseId === 'valid').every(row => row.status === 'passed')).toBe(true)
    expect(scene.filter(row => row.caseId === 'shape-invalid').length).toBeGreaterThan(0)
    expect(scene.filter(row => row.caseId === 'shape-invalid').every(row => row.status === 'failed')).toBe(true)
    for (const marker of ['BADFRAME', 'BADPART', 'BADCOLOR']) {
      const malformed = scene.filter(row => row.caseId === marker)
      expect(malformed.length).toBeGreaterThan(0)
      expect(malformed.every(row => row.status === 'failed')).toBe(true)
    }
    expect(rows.some(row => row.detail?.includes('requires the saxes'))).toBe(false)
    const qualifier = await import(pathToFileURL(built.qualifier).href)
    expect(qualifier.svgQualificationProvenance().nodeXmlParser).toEqual(built.provenance.nodeXmlParser)
    expect(built.provenance.nodeXmlParser.version).toBe(JSON.parse(readFileSync(built.provenance.nodeXmlParser.packageJson, 'utf8')).version)
    expect(JSON.parse(readFileSync(built.provenanceFile, 'utf8')).moduleResolutionAnchor).toBe(pathToFileURL(join(harnessRoot, 'eval/benchmark/unified/qualification.ts')).href)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}, 30_000)


test('resolved Scene admission rejects malformed paint, identities, and numeric geometry', () => {
  const paint = { fill: '#fff', fillOpacity: 1, stroke: '#111', strokeOpacity: 1, strokeWidth: 1, opacity: 1, lineCap: 'butt', lineJoin: 'miter', miterLimit: 4, fillRule: 'nonzero', paintOrder: 'normal' }
  const primitive = { kind: 'text', text: 'Start', x: 10, y: 20, fontSize: 12, fontFamily: ['Inter'], fontWeight: 400, fontStyle: 'normal', anchor: 'start', matrix: [1, 0, 0, 1, 0, 0], paint }
  const part = { id: 'A', role: 'node', kind: 'text', node: { id: 'A', role: 'node', kind: 'text' }, primitives: [primitive] }
  for (const version of [1, 2]) {
    const scene = { version, family: 'flowchart', width: 100, height: 40, svg: '<svg/>', colors: { bg: '#fff', fg: '#111' }, parts: [part], frame: [] }
    expect(() => assertResolvedSceneEnvelope(scene)).not.toThrow()
    expect(() => assertResolvedSceneEnvelope({ ...scene, parts: [], frame: [{ kind: 'path', d: '', matrix: primitive.matrix, paint }] })).not.toThrow()
    for (const bad of [
      { ...scene, colors: [] },
      { ...scene, colors: { bg: '#fff' } },
      { ...scene, frame: [null] },
      { ...scene, frame: Array(1) },
      { ...scene, parts: [{ ...part, primitives: Array(1) }] },
      { ...scene, parts: [{ ...part, primitives: [{ ...primitive, matrix: Array(6) }] }] },
      { ...scene, parts: [{ id: 'A', primitives: [] }] },
      { ...scene, parts: [{ ...part, node: { ...part.node, id: 'other' } }] },
      { ...scene, parts: [{ ...part, primitives: [null] }] },
      { ...scene, parts: [{ ...part, primitives: [{ ...primitive, matrix: [1, 0, 0, 1, NaN, 0] }] }] },
      { ...scene, parts: [{ ...part, primitives: [{ ...primitive, paint: { ...paint, strokeWidth: Infinity } }] }] },
      { ...scene, parts: [{ ...part, primitives: [{ ...primitive, fontFamily: 'Inter' }] }] },
      { ...scene, frame: [{ kind: 'unsupported', matrix: primitive.matrix, paint }] },
    ]) expect(() => assertResolvedSceneEnvelope(bad)).toThrow()
    for (const unsupported of [0, -1, 3, 1.5, '2', undefined]) expect(() => assertResolvedSceneEnvelope({ ...scene, version: unsupported })).toThrow()
  }
})
