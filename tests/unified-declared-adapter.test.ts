import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { communityCoreWorkloads, prepareCommunity, runCommunitySuite } from '../unified/community.ts'
import { harnessRepository } from '../unified/trident-paths.ts'

test('a tool declared only in its catalog entry is benchmarked through its named public export', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'am-declared-adapter-'))
  try {
    const module = join(directory, 'index.mjs')
    // An API shape no built-in adapter knows: a namespaced function returning { svg }.
    writeFileSync(module, `export const studio={draw:(source,options)=>{if(options?.theme!=='plain')throw Error('options were not passed');if(!source.startsWith('flowchart'))throw Error('unknown diagram');return{svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><text>Alpha</text><text>Beta</text></svg>'}}}`)
    writeFileSync(join(directory, 'package.json'), '{"name":"declared-fixture","version":"1.0.0","type":"module"}')
    const node = { id: 'fixture/declared', roles: ['renderer'], outputs: ['svg'], benchmark: { adapter: 'declared', outputs: ['svg'], api: { svg: { export: 'studio.draw', options: { theme: 'plain' }, result: 'svg' } } } }
    const files = { catalog: join(directory, 'catalog.json'), prepared: join(directory, 'prepared.json'), browser: join(directory, 'browser.json'), inputs: join(directory, 'inputs.json') }
    writeFileSync(files.catalog, JSON.stringify({ nodes: [node] }))
    writeFileSync(files.prepared, JSON.stringify([{ node, artifact: { kind: 'node', root: directory, module, sha256: createHash('sha256').update(readFileSync(module)).digest('hex'), version: '1.0.0', runtime: 'Node' } }]))
    writeFileSync(files.browser, JSON.stringify([{ node, browserStatus: 'not-applicable', browserDetail: 'Node fixture' }]))
    const feature = { id: 'feature:declared-flowchart', family: 'flowchart', source: 'flowchart LR\nA[Alpha] --> B[Beta]', expectedLabels: ['Alpha', 'Beta'], features: [], provenance: 'authored declared-adapter fixture' }
    writeFileSync(files.inputs, JSON.stringify({ workloads: [...communityCoreWorkloads(), feature] }))
    const options = { root: harnessRepository, harnessRoot: harnessRepository, out: join(directory, 'out'), profile: 'smoke' as const, rounds: 1, communityProjects: [node.id], communityCatalogFile: files.catalog }
    const result = await runCommunitySuite({ ...options, communityPreparedFile: files.prepared, communityBrowserPreparedFile: files.browser, communityInputsFile: files.inputs })
    expect(result.observations.find(row => row.caseId === feature.id)?.status).toBe('passed')
    expect(result.observations.find(row => row.caseId === 'family-support:sequence')?.status).toBe('unsupported')
    // A declared output without its binding is refused at preparation, before any acquisition.
    writeFileSync(files.catalog, JSON.stringify({ nodes: [{ ...node, benchmark: { adapter: 'declared', outputs: ['svg', 'terminal'], api: node.benchmark.api } }] }))
    const [prepared] = await prepareCommunity({ ...options, out: join(directory, 'prepare') })
    expect(prepared?.error).toContain('no api.terminal.export binding')
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}, 60_000)
