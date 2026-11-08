import { mock } from 'bun:test'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

const repo = resolve(import.meta.dirname, '../..'), root = mkdtempSync(join(tmpdir(), 'drawing-storage-')), out = join(root, 'run')
const input = { id: 'one-case', source: 'flowchart LR\nA[Alpha]', expected: { nodes: [{ id: 'A', label: 'Alpha' }], edges: [] }, sourceGaps: [] }
const artifact = { kind: 'node', version: '1' }, project = 'fixture/renderer'
const page = { evaluate: async () => '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="1" y="20">Alpha</text></svg>' }
const context = { route: async () => {}, close: async () => {} }
mock.module(repo + '/fidelity/drawing/corpus.ts', () => ({ drawingCases: () => [input] }))
mock.module(repo + '/fidelity/drawing/labels.ts', () => ({ assessTerminalLabels: () => ({ status: 'correct' }), assessSvgLabels: () => ({ status: 'correct' }), expectsEmptyDrawing: () => false, terminalLabelWorkBudget: 100, compileLabelPlan: () => ({}), labelPolicy: 'fixture' }))
mock.module(repo + '/fidelity/drawing/observer-contract.ts', () => ({ drawingAssessmentProfiles: () => ({ svg: 'fixture' }), drawingObserverSources: () => ({ svg: {} }), verifyDrawingObserver: async () => [] }))
mock.module(repo + '/unified/benchmark-versions.ts', () => ({ latestBenchmarkRenderingArtifact: () => artifact, plannedBenchmarkVersion: () => artifact.version, verifiedBenchmarkBinding: () => artifact }))
mock.module(repo + '/unified/community.ts', () => ({ communityDeclaresOutput: (_node: any, format: string) => format === 'svg', communityModuleOutputSupported: () => true }))
mock.module(repo + '/unified/lineage.ts', () => ({ comparisonProjects: () => ({ included: [project] }) }))
mock.module(repo + '/unified/davebench.ts', () => ({ browserHost: async () => ({ open: async () => ({ page, context }), close: async () => {} }) }))
mock.module('playwright', () => ({ chromium: { launch: async () => { writeFileSync(join(out, 'outputs'), 'filesystem obstruction'); return { newContext: async () => context, close: async () => {} } } } }))
mock.module(repo + '/ci-policy.ts', () => ({ assertBenchmarkExecutionAllowed: () => {} }))
mock.module(repo + '/unified/benchmark-context.ts', () => ({ defaultChromium: () => undefined }))
try {
  for (const [name, value] of Object.entries({ catalog: { nodes: [{ id: project }] }, images: [{ node: { id: project }, artifact, browser: {} }], terminals: [] })) writeFileSync(join(root, name + '.json'), JSON.stringify(value))
  const { main } = await import(repo + '/unified/drawing-correctness.ts')
  await main(['--prepared', join(root, 'images.json'), '--terminal-prepared', join(root, 'terminals.json'), '--catalog', join(root, 'catalog.json'), '--out', out, '--formats', 'svg'])
  console.log(readFileSync(join(out, 'results.json'), 'utf8').replace(/\n/g, ''))
} finally { rmSync(root, { recursive: true, force: true }) }

