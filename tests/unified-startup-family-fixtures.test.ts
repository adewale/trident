import { expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { prepareEntryStartup, runEntryStartupSuite } from '../unified/entry-startup.ts'

// Independent input headers and visible labels for the consumer routing test.
// These synthetic SVGs are transport fixtures, not renderer fidelity evidence;
// published Pele's actual output is qualified separately before a campaign.
const registrations = [
  { type: 'agentflow', header: 'agentflow-beta TB', labels: ['Alpha', 'Beta', 'Gamma'] },
  { type: 'cynefin', header: 'cynefin-beta', labels: ['Alpha', 'Beta', 'Gamma', 'Delta'] },
  { type: 'info', header: 'info', labels: ['StartupInfo'] },
  { type: 'railroad', header: 'railroad-ebnf-beta', labels: ['alpha', 'beta', 'gamma', 'delta'] },
  { type: 'swimlane', header: 'swimlane-beta LR', labels: ['Alpha', 'Beta', 'Gamma', 'Delta'] },
  { type: 'treeView', header: 'treeView-beta', labels: ['Alpha', 'Beta.txt', 'Gamma.txt'] },
  { type: 'usecase', header: 'usecase-beta', labels: ['Alpha', 'Beta', 'Gamma'] },
  { type: 'venn', header: 'venn-beta', labels: ['Alpha', 'Beta', 'Both'] },
  { type: 'wardley', header: 'wardley-beta', labels: ['Value', 'Alpha', 'Beta'] },
] as const

test('every additional declared diagram entry reaches first consumed render with its reviewed public family stimulus', async () => {
  const root = mkdtempSync(join(tmpdir(), 'trident-startup-additional-families-'))
  try {
    mkdirSync(join(root, 'diagrams'))
    writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'startup-peer-fixture', type: 'module', exports: { './core': './core.js', './diagrams/*': './diagrams/*.js' } }))
    const sources = join(root, 'sources.jsonl')
    writeFileSync(join(root, 'core.js'), `import{appendFileSync}from'node:fs';let diagram;export function register(value){diagram=value}export function render(source){const header=source.split('\\n')[0];if(!diagram||header!==diagram.expectedHeader)throw Error('wrong registered family source');appendFileSync(${JSON.stringify(sources)},JSON.stringify({type:diagram.type,source})+'\\n');return diagram.svg}`)
    for (const { type, header, labels } of registrations) {
      const text = labels.map((label, index) => `<text x="20" y="${40 + index * 30}">${label}</text>`).join('')
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><rect x="10" y="10" width="380" height="180" fill="white" stroke="black"/>${text}</svg>`
      writeFileSync(join(root, 'diagrams', type + '.js'), `export default ${JSON.stringify({ type, expectedHeader: header, svg })}`)
    }
    const options = { root, out: join(root, 'out'), profile: 'smoke' as const, rounds: 1, surfaces: ['library'] as const, adapter: 'pele' as const, nodeExecutable: 'node', bunExecutable: join(root, 'no-bun'), startupPasses: 'latency' as const, observerExecutable: join(root, 'no-observer'), nativeExecutable: process.execPath }
    const prepared = await prepareEntryStartup(options)
    expect(prepared.inventory.some(entry => entry.kind === 'native')).toBe(false)
    // ./core registers flowchart as its companion dependency. It is a distinct
    // public entry, not one of these nine diagram registration exports.
    const registered = prepared.jobs.filter(job => job.entry.publicName.startsWith('./diagrams/'))
    expect(registered).toHaveLength(9)
    expect(registered.every(job => job.operation.id === 'registered.render:svg')).toBe(true)
    expect(prepared.gaps.some(gap => gap.includes('no independently authored'))).toBe(false)
    const result = await runEntryStartupSuite(options, { ...prepared, jobs: registered })
    const rendered = result.observations.filter(row => row.mode === 'process-to-first-consumed')
    expect(rendered).toHaveLength(9)
    expect(rendered.map(row => ({ status: row.status, detail: row.detail, findings: row.findings }))).toEqual(rendered.map(() => ({ status: 'passed', detail: undefined, findings: [] })))
    const actual = readFileSync(sources, 'utf8').trim().split('\n').map(line => JSON.parse(line))
    expect(actual.map(row => row.type).sort()).toEqual(registrations.map(({ type }) => type).sort())
    expect(actual.find(row => row.type === 'info').source).toBe('info\ntitle StartupInfo')
    expect(registered.find(job => job.workload.family === 'info')!.workload.features).toContain('pele-info-title-extension')
    expect(actual.find(row => row.type === 'treeView').source).toContain('Beta.txt')
    const wrong = registered[0]!
    const rejected = await runEntryStartupSuite({ ...options, out: join(root, 'wrong') }, { ...prepared, jobs: [{ ...wrong, workload: { ...wrong.workload, source: 'flowchart LR\nA[Alpha]' } }] })
    const rejectedRender = rejected.observations.find(row => row.mode === 'process-to-first-consumed')!
    expect(rejectedRender.status).toBe('failed')
    expect(rejectedRender.detail).toContain('wrong registered family source')
  } finally { rmSync(root, { recursive: true, force: true }) }
}, 45_000)
