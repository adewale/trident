import { expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { prepareEntryStartup, runEntryStartupSuite } from '../unified/entry-startup.ts'
import { runInvocationBrowser } from '../unified/invocation-browser.ts'
import { chromiumExecutable } from './helpers/environment.ts'

const workload = { id: 'entry-startup:two-node', family: 'flowchart', source: 'flowchart LR\nA[Start] --> B[End]', expectedLabels: ['Start', 'End'], features: ['labelled-nodes', 'directed-edge'], provenance: 'Authored common startup source, independently qualified after clocks' }
const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><text>Start End</text></svg>'
function fixture(root: string) {
  mkdirSync(join(root, 'dist'))
  writeFileSync(join(root, 'README.md'), '# Public Mermaid package documentation')
  writeFileSync(join(root, 'LICENSE'), 'Copyright holder: all rights reserved')
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'mermaid', version: '12.2.0', type: 'module', exports: { '.': './dist/mermaid.core.mjs', './*': './*', './package.json': './package.json' } }))
  // No Node render is attempted without a genuine SVG geometry environment.
  writeFileSync(join(root, 'dist/mermaid.core.mjs'), `export default{initialize(){},render(){throw Error('Node SVG render must remain unavailable')}}`)
  writeFileSync(join(root, 'dist/mermaid.esm.min.mjs'), `let initialized=false,calls=0;export default{initialize(options){if(options.startOnLoad!==false||options.securityLevel!=='strict')throw Error('Wrong public setup');initialized=true},async render(id,source){if(!initialized||++calls!==1||source!==${JSON.stringify(workload.source)})throw Error('Warmup/wrong source');await new Promise(resolve=>setTimeout(resolve,20));return{svg:${JSON.stringify(svg)},diagramType:'flowchart',metadata:'x'.repeat(8192),bindFunctions(){}}}}`)
}

test('Mermaid public browser ESM startup includes initialization and the first consumed render without a warmup', async () => {
  const root = mkdtempSync(join(tmpdir(), 'trident-mermaid-browser-startup-'))
  try {
    fixture(root)
    const result = await runInvocationBrowser({ root, harnessRoot: process.cwd(), out: join(root, 'out'), profile: 'smoke', rounds: 1, startupOnly: true, startupAdapter: 'mermaid', startupSamplesPerRound: 1, executable: chromiumExecutable }, [workload])
    const rows = result.rows.filter(row => row.mode === 'browser-launch-to-first-consumed')
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ surface: 'browser:module', operation: 'svg', status: 'passed', findings: [] })
    expect(rows[0]!.metrics).toMatchObject({ adapter: 'mermaid', publicEntry: './dist/mermaid.esm.min.mjs', independentFreshBrowser: true })
    expect(Number(rows[0]!.metrics!.firstInputMs)).toBeGreaterThanOrEqual(15)
    expect(Number(rows[0]!.metrics!.transferredSidecarBytes)).toBeGreaterThan(8192)
    expect(rows[0]!.samplesMs![0]).toBeGreaterThan(Number(rows[0]!.metrics!.launchToReadyMs))
    const resources = result.rows.filter(row => row.mode === 'fresh-browser-resource')
    expect(resources).toHaveLength(1); expect(resources[0]!.status).toBe('passed'); expect(resources[0]!.samplesMs).toBeUndefined()
    writeFileSync(join(root, 'dist/mermaid.esm.min.mjs'), `export default{initialize(){},render(){return{svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><text>Wrong</text></svg>'}}}`)
    const wrong = await runInvocationBrowser({ root, harnessRoot: process.cwd(), out: join(root, 'wrong'), profile: 'smoke', rounds: 1, startupOnly: true, startupAdapter: 'mermaid', startupSamplesPerRound: 1, executable: chromiumExecutable }, [workload])
    expect(wrong.rows.find(row => row.mode === 'browser-launch-to-first-consumed')!.status).toBe('failed')
  } finally { rmSync(root, { recursive: true, force: true }) }
}, 45_000)

test('Mermaid Node import readiness is retained while unprovisioned SVG and undeclared CLI/MCP stay explicit', async () => {
  const root = mkdtempSync(join(tmpdir(), 'trident-mermaid-node-startup-'))
  try {
    fixture(root)
    const options = { root, out: join(root, 'out'), profile: 'smoke' as const, rounds: 1, adapter: 'mermaid' as const, surfaces: ['library', 'cli', 'mcp'] as const, nodeExecutable: 'node', bunExecutable: join(root, 'no-bun'), observerExecutable: join(root, 'no-observer'), nativeExecutable: process.execPath }
    const prepared = await prepareEntryStartup(options)
    expect(prepared.jobs.map(job => job.operation.id)).toEqual(['module-ready:json'])
    expect(prepared.inventory.some(entry => entry.kind === 'native')).toBe(false)
    for (const name of ['./README.md', './LICENSE', './package.json']) {
      const entries = prepared.inventory.filter(entry => entry.publicName === name)
      expect(entries).toHaveLength(1)
      expect(entries[0]!.kind).toBe('data')
    }
    expect(new Set(prepared.inventory.map(entry => entry.publicName)).size).toBe(prepared.inventory.length)
    const result = await runEntryStartupSuite(options, prepared)
    for (const name of ['./README.md', './LICENSE', './package.json']) expect(result.observations.find(row => row.surface === name)!.status).toBe('not-applicable')
    expect(result.observations.find(row => row.operation === 'module-ready:json')!.status).toBe('passed')
    expect(result.observations.find(row => row.operation === 'module-ready:json')!.metrics!.project).toBe('mermaid-js/mermaid')
    const render = result.observations.find(row => row.operation === 'render:svg')!
    expect(render.status).toBe('blocked'); expect(render.samplesMs).toBeUndefined()
    expect(result.observations.filter(row => ['cli', 'mcp'].includes(row.surface)).map(row => row.status)).toEqual(['not-applicable', 'not-applicable'])
  } finally { rmSync(root, { recursive: true, force: true }) }
}, 20_000)


test('a different Mermaid version is rejected before any public startup worker or browser is launched', async () => {
  const root = mkdtempSync(join(tmpdir(), 'trident-mermaid-startup-version-'))
  try {
    fixture(root)
    writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'mermaid', version: '12.1.0', type: 'module', exports: { '.': './dist/mermaid.core.mjs' } }))
    await expect(prepareEntryStartup({ root, out: join(root, 'out'), profile: 'smoke', rounds: 1, adapter: 'mermaid', surfaces: ['library'] })).rejects.toThrow()
    await expect(runInvocationBrowser({ root, harnessRoot: process.cwd(), out: join(root, 'browser'), profile: 'smoke', rounds: 1, startupOnly: true, startupAdapter: 'mermaid', executable: chromiumExecutable }, [workload])).rejects.toThrow()
  } finally { rmSync(root, { recursive: true, force: true }) }
})
