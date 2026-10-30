import { expect, test } from 'bun:test'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { collectExternalCorpus } from '../unified/external-corpus.ts'
import { publishCampaigns } from '../unified/campaign-publication.ts'
import { nativeAdapter, projectSupport } from '../unified/support.ts'
import { qualifyPortable } from '../portable/fidelity.ts'
import { PORTABLE_MEASUREMENT_PROTOCOL } from '../portable/protocol.ts'
import type { PortableCase } from '../portable/cohorts.ts'
import type { PortableWorkerResult } from '../portable/protocol.ts'
import { portableSummary } from '../portable/report.ts'

test('project support distinguishes a missing observer from absent output and does not grant a fork reference evidence', () => {
  const declared = { id: 'other/svg', outputs: ['svg'], roles: ['peer'], benchmark: { adapter: 'declared', outputs: ['svg'], api: { svg: { export: 'draw' } } } }
  expect(projectSupport(declared).suites.portable.state).toBe('configured')
  expect(projectSupport(declared).suites['native-fidelity'].state).toBe('adapter-missing')
  expect(projectSupport({ ...declared, benchmark: undefined }).suites.docs.state).toBe('adapter-missing')
  expect(projectSupport({ id: 'other/terminal', outputs: ['ascii-unicode'], roles: ['peer'] }).suites.docs.state).toBe('project-unsupported')
  expect(nativeAdapter({ ...declared, benchmark: { adapter: 'mermaid' } })).toBeUndefined()
  expect(projectSupport({ ...declared, benchmark: { adapter: 'mermaid' } }).suites['native-fidelity'].state).toBe('adapter-missing')
})

test('campaign planning never installs a target or runs a renderer and execution requires explicit selection', () => {
  const directory = mkdtempSync(join(tmpdir(), 'trident-plan-'))
  try {
    const catalog = join(directory, 'catalog.json')
    writeFileSync(catalog, JSON.stringify({ nodes: [{ id: 'fixture/not-installed', outputs: ['svg'], roles: ['peer'], benchmark: { adapter: 'declared', package: 'not-an-installed-package', outputs: ['svg'], api: { svg: { export: 'draw' } } } }] }))
    const command = resolve(import.meta.dir, '../commands.ts')
    const env = { ...process.env, MERMAID_REFERENCE_DIR: join(directory, 'missing-oracle') }
    const result = spawnSync(process.execPath, [command, 'bench', '--projects', 'fixture/not-installed', '--community-catalog', catalog, '--suites', 'portable', '--plan', '--budget-minutes', '1'], { env, encoding: 'utf8', timeout: 10000 })
    expect({ status: result.status, stderr: result.stderr }).toEqual({ status: 0, stderr: '' })
    const plan = JSON.parse(result.stdout)
    expect(plan.selection).toEqual(['fixture/not-installed'])
    expect(plan.comparisonSelection.projects[0].selection).toBe('distinct-or-unresolved')
    expect(plan.rows.every((row: any) => row.acquisition === 'not attempted')).toBe(true)
    expect(plan.tools.oracle).toBeNull()
    expect(plan.budgetExceededByEstimate).toBe(true)
    expect(plan.rows.find((row: any) => row.suite === 'portable').freshWorkers).toBeGreaterThan(0)
    const defaults = spawnSync(process.execPath, [command, 'bench', '--projects', 'fixture/not-installed', '--community-catalog', catalog, '--plan'], { env, encoding: 'utf8', timeout: 10000 })
    expect(defaults.status).toBe(0)
    expect(JSON.parse(defaults.stdout).suites).toEqual(['docs', 'fidelity'])
    expect(JSON.parse(defaults.stdout).rows.every((row: any) => row.freshWorkers === 0)).toBe(true)
    const omitted = spawnSync(process.execPath, [command, 'bench'], { env: { ...process.env }, encoding: 'utf8', timeout: 10000 })
    expect(omitted.status).not.toBe(0)
    expect(omitted.stderr).toContain('explicitly --all-projects')
    expect(existsSync(join(directory, 'node_modules'))).toBe(false)
  } finally { rmSync(directory, { recursive: true, force: true }) }
})

const graph: PortableCase = { id: 'independent-graph', family: 'flowchart', cohort: 'family', source: 'flowchart LR\nA[Alpha] --> B[Beta]', expected: { accept: true, labels: ['Alpha', 'Beta'], topology: { nodes: ['A', 'B'], edges: [{ source: 'A', target: 'B' }] } } }
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><text>Alpha</text><text>Beta</text><path d="M0 0 L50 0"/></svg>'
test('identical SVG receives identical output admission regardless of tool name or optional parse API', () => {
  for (const adapter of ['agentic', 'pele', 'beautiful', 'declared', 'unrelated-project']) {
    const result = qualifyPortable(graph, { svg, adapter })
    expect(result.evidence).toEqual({ outputAdmission: 'passed', nativeModel: 'unmeasured', paintedMeaning: 'unmeasured' })
    expect(result.semanticComplete).toBe(false)
    const lost = qualifyPortable(graph, { svg: svg.replace('<text>Beta</text>', ''), adapter })
    expect(lost.evidence?.outputAdmission).toBe('failed')
  }
  const wrong = qualifyPortable(graph, { svg, model: { type: 'flowchart', nodes: {}, edges: [] } })
  expect(wrong.evidence?.outputAdmission).toBe('passed')
  expect(wrong.evidence?.nativeModel).toBe('failed')
  expect(wrong.semanticComplete).toBe(false)
})

test('a declared public SVG adapter preserves its receiver and awaits its returned field in both transports', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'trident-declared-portable-'))
  try {
    const entry = join(directory, 'renderer.mjs'), result = join(directory, 'result.json'), called = join(directory, 'called.json')
    writeFileSync(entry, `import{writeFileSync}from'node:fs';export const renderer={image:${JSON.stringify(svg)},async draw(source,options){writeFileSync(${JSON.stringify(called)},JSON.stringify({source,options}));return{image:this.image}}}`)
    const { declaredRenderer } = await import('../unified/declared-adapter.mjs')
    const api = await import(entry)
    expect(await declaredRenderer(api, { export: 'renderer.draw', result: 'image' }, 'svg')(graph.source)).toBe(svg)
    const job = { artifact: { project: 'other/renderer', root: directory, entry, version: '1.0.0', adapter: 'declared', binding: { export: 'renderer.draw', result: 'image', options: { color: 'blue' } } }, testCase: graph, mode: 'cold', samples: 1, round: 1, replica: 'B', sample: 0, resultFile: result }
    const input = join(directory, 'job.json'); writeFileSync(input, JSON.stringify(job))
    const child = spawnSync(process.env.NODE_BIN ?? 'node', [resolve(import.meta.dir, '../portable/worker.mjs'), input], { encoding: 'utf8', timeout: 10000 })
    expect({ status: child.status, stderr: child.stderr }).toEqual({ status: 0, stderr: '' })
    const observed = JSON.parse(readFileSync(result, 'utf8'))
    expect(observed.protocol).toBe(PORTABLE_MEASUREMENT_PROTOCOL)
    expect(observed.outputBytes).toBe(Buffer.byteLength(svg))
    expect(observed.qualification.evidence.outputAdmission).toBe('passed')
    expect(observed.qualification.semanticComplete).toBe(false)
    expect(JSON.parse(readFileSync(called, 'utf8'))).toEqual({ source: graph.source, options: { color: 'blue' } })
  } finally { rmSync(directory, { recursive: true, force: true }) }
})

test('optional model failures do not erase a qualified SVG-only timing while full-check qualification remains failed', () => {
  const results: PortableWorkerResult[] = Array.from({ length: 5 }, (_, round) => (['A0', 'A1', 'B'] as const).map<PortableWorkerResult>(replica => ({
    protocol: PORTABLE_MEASUREMENT_PROTOCOL, caseId: graph.id, family: graph.family, mode: 'warm', round: round + 1, replica, sample: 0,
    status: 'failed', importMs: 0, tracks: { 'warm-repeat': Array.from({ length: 31 }, () => 1) }, outputBytes: 100,
    qualification: { accepted: true, passed: false, semanticComplete: false, evidence: { outputAdmission: 'passed', nativeModel: 'failed', paintedMeaning: 'unmeasured' }, checks: [], unmeasuredScopes: [], scope: 'model failure retained' }, prelude: [], runtime: { executable: 'node', node: '24', platform: 'fixture', arch: 'fixture' },
  }))).flat()
  const report = portableSummary([graph], results, { rounds: 5, samples: 31, coldSamples: 20, maximumControlSpread: .25 })
  const row = report.timing.find(row => row.track === 'warm-repeat')!
  expect(row.outputCalibration.status).toBe('calibrated')
  expect(row.calibration.status).toBe('uncalibrated')
  expect(row.semanticComplete).toBe(false)
  expect(report.status).toBe('failed')
  results[0]!.prelude = [{ source: 'prior input', expectedAccepted: true, actualAccepted: false, passed: false }]
  expect(portableSummary([graph], results, { rounds: 5, samples: 31, coldSamples: 20, maximumControlSpread: .25 }).timing.find(row => row.track === 'warm-repeat')!.outputCalibration.status).toBe('uncalibrated')
  results[0]!.prelude = []
  results[0]!.status = 'blocked'
  expect(portableSummary([graph], results, { rounds: 5, samples: 31, coldSamples: 20, maximumControlSpread: .25 }).timing.find(row => row.track === 'warm-repeat')!.outputCalibration.status).toBe('uncalibrated')
  results[0]!.status = 'failed'
  results[0]!.qualification!.evidence!.outputAdmission = 'failed'
  expect(portableSummary([graph], results, { rounds: 5, samples: 31, coldSamples: 20, maximumControlSpread: .25 }).timing.find(row => row.track === 'warm-repeat')!.outputCalibration.status).toBe('uncalibrated')
})

test('external corpus selection reads pinned source, retains duplicates and empty contributors, and ignores renderer results', () => {
  const directory = mkdtempSync(join(tmpdir(), 'trident-external-'))
  try {
    const sources = ['one', 'two'].map(name => {
      const root = join(directory, name); mkdirSync(root); mkdirSync(join(root, 'docs'))
      writeFileSync(join(root, 'LICENSE'), 'MIT fixture copyright notice must survive publication\n')
      writeFileSync(join(root, 'README.md'), name === 'one' ? '```mermaid\nflowchart LR\nA-->B\n```\n```mermaid\nflowchart LR\nA-->B\n```\n```ts\nthrow new Error("example must never execute"); const source = "flowchart LR\\nC-->D";\n```\n' : 'No diagram examples\n')
      writeFileSync(join(root, 'docs', 'example.mmd'), 'flowchart LR\nB-->C')
      execFileSync('git', ['init', '-q'], { cwd: root }); execFileSync('git', ['add', '.'], { cwd: root })
      execFileSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'examples'], { cwd: root })
      const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
      writeFileSync(join(root, 'README.md'), 'Modified working tree must not select examples')
      return { repository: 'external/' + name, commit, checkout: root, license: 'MIT' }
    })
    const corpus = collectExternalCorpus({ protocol: 'external-repository-examples-v1', maxFilesPerProject: 1, sources })
    expect(corpus.workloads).toHaveLength(3)
    expect(corpus.workloads[0]!.source).toBe(corpus.workloads[1]!.source)
    expect(corpus.workloads[2]!.source).toBe('flowchart LR\nC-->D')
    expect(corpus.sources[1]!.occurrences).toBe(0)
    expect(corpus.sources.every(source => source.filesOmittedByCap === 1)).toBe(true)
    expect(corpus.workloads[0]!.provenance).toContain(sources[0]!.commit)
    expect(corpus.sources[0]!.licenseFiles[0]!.text).toContain('copyright notice must survive')
  } finally { rmSync(directory, { recursive: true, force: true }) }
})

test('campaign publication preserves dates, failed criteria and raw samples in a portable unranked bundle', () => {
  const directory = mkdtempSync(join(tmpdir(), 'trident-publication-'))
  try {
    const source = join(directory, 'source'), owning = join(source, 'docs'), out = join(directory, 'publication')
    mkdirSync(owning, { recursive: true })
    const bytes = '{"samples":[1,2],"version":"1.0.0"}\n'; writeFileSync(join(owning, 'samples.json'), bytes)
    writeFileSync(join(source, 'report.json'), JSON.stringify({ startedAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z', profile: 'full', rounds: 5, projects: ['other/svg'], results: [{ suite: 'docs', status: 'failed', observations: 2, out: owning, counts: { passed: 1, failed: 1 } }] }))
    publishCampaigns([source], out, { copyEvidence: true })
    const markdown = readFileSync(join(out, 'README.md'), 'utf8')
    expect(markdown).toContain('2026-01-01T00:00:00Z')
    expect(markdown).toContain('partial')
    expect(markdown).toContain('"failed":1')
    expect(markdown).not.toContain('| Rank |')
    expect(readFileSync(join(out, 'evidence/1/docs/samples.json'), 'utf8')).toBe(bytes)
    expect(existsSync(join(out, 'METHODOLOGY.md'))).toBe(true)
    expect(() => publishCampaigns([source], out)).toThrow('fresh')
    const envelope = JSON.parse(readFileSync(join(source, 'report.json'), 'utf8'))
    envelope.results[0].out = directory
    writeFileSync(join(source, 'report.json'), JSON.stringify(envelope))
    const escaped = join(directory, 'escaped-publication')
    expect(() => publishCampaigns([source], escaped, { copyEvidence: true })).toThrow('outside its campaign')
    expect(existsSync(escaped)).toBe(false)
  } finally { rmSync(directory, { recursive: true, force: true }) }
})

test('a later model-only failure cannot erase an earlier bad SVG return in a warm worker', () => {
  const directory = mkdtempSync(join(tmpdir(), 'trident-output-failure-'))
  try {
    const entry = join(directory, 'renderer.mjs'), result = join(directory, 'result.json'), input = join(directory, 'job.json')
    writeFileSync(entry, `let calls=0;export function draw(){return ++calls===1?${JSON.stringify(svg.replace('<text>Beta</text>', ''))}:${JSON.stringify(svg)}};export function parse(){return{type:'flowchart',nodes:{},edges:[]}}`)
    writeFileSync(input, JSON.stringify({ artifact: { project: 'fixture/flaky', root: directory, entry, version: '1.0.0', adapter: 'declared', binding: { export: 'draw' } }, testCase: graph, mode: 'warm', samples: 1, minSampleMs: 0, round: 1, replica: 'B', sample: 0, resultFile: result, svgFile: join(directory, 'failure.svg') }))
    const child = spawnSync(process.env.NODE_BIN ?? 'node', [resolve(import.meta.dir, '../portable/worker.mjs'), input], { encoding: 'utf8', timeout: 10000 })
    expect({ status: child.status, stderr: child.stderr }).toEqual({ status: 0, stderr: '' })
    const observed = JSON.parse(readFileSync(result, 'utf8'))
    expect(observed.status).toBe('failed')
    expect(observed.qualification.evidence.outputAdmission).toBe('failed')
    expect(readFileSync(join(directory, 'failure.svg'), 'utf8')).toBe(svg.replace('<text>Beta</text>', ''))
    expect(observed.qualification.checks.some((check: any) => check.status === 'failed' && check.name.includes('label'))).toBe(true)
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
