import { expect, test } from 'bun:test'
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runFidelityCampaign } from '../fidelity/run.ts'
import { runMermaidFidelitySuite } from '../unified/fidelity-suite.ts'

for (const [boundary, invoke] of [['direct campaign', runFidelityCampaign], ['native worker bridge', runMermaidFidelitySuite]] as const) {
  test(`peer-only selection skips ${boundary} before reference, executable and output preparation`, async () => {
    const directory = join(tmpdir(), 'unselected-core-fidelity-' + crypto.randomUUID())
    const result = await invoke({ root: directory, out: join(directory, 'out'), referenceDir: join(directory, 'absent-reference'), mermaidDir: join(directory, 'absent-source'), nodeExecutable: join(directory, 'absent-node'), executable: join(directory, 'absent-browser'), communityProjects: ['marco-orru/mermaid-ascii'], profile: 'full', rounds: 1 })
    expect(result.status).toBe('not-applicable')
    expect(result.observations).toEqual([])
    expect(existsSync(directory)).toBe(false)
  })
}

import { mermaidOracleDirectory, mermaidUpstreamDirectory } from '../portable/mermaid-oracle.ts'

test.skipIf(!existsSync(mermaidOracleDirectory()) || !existsSync(mermaidUpstreamDirectory()))('public model contracts need no browser bundle and invoke no product serializer', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'model-only-contract-'))
  try {
    mkdirSync(join(directory, 'dist'))
    writeFileSync(join(directory, 'package.json'), JSON.stringify({ name: 'agentic-mermaid', version: '0.4.1', type: 'module' }))
    writeFileSync(join(directory, 'dist/agent-core.js'), 'export function parseRegisteredMermaid(){return {ok:true,value:{body:{kind:"flowchart",nodes:[],edges:[]}}}};export function serializeMermaid(){throw Error("Product serializer must not run")}')
    const result = await runFidelityCampaign({ root: process.cwd(), out: join(directory, 'evidence'), packageRoot: directory, communityProjects: ['adewale/agentic-mermaid'], profile: 'full', rounds: 1, fidelityCaseIds: ['meaning:family:flowchart'], executable: join(directory, 'missing-browser') })
    expect(result.observations.length).toBeGreaterThan(0)
    expect(result.observations.every(row => row.surface === 'native-public-api' && row.format === 'structured')).toBe(true)
    expect(result.observations.some(row => row.operation.startsWith('serialized-'))).toBe(false)
    expect(existsSync(join(directory, 'dist/browser'))).toBe(false)
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
