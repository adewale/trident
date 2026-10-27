import { expect, test } from 'bun:test'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { discoverStartupInventory, parseStartupResource, prepareEntryStartup, runEntryStartupSuite, runStartupChild } from '../unified/entry-startup.ts'
import { finishStartupMcpObserver, runInvocationMcpStartup } from '../unified/invocation-mcp.ts'
import { spawn } from 'node:child_process'
import { runInvocationBrowser } from '../unified/invocation-browser.ts'
import { chromiumExecutable } from './helpers/environment.ts'

test('inventory expands actual wildcard files and retains aliases, browser/data and missing native declarations', async () => {
  const root = mkdtempSync(join(tmpdir(), 'entry-inventory-'))
  try {
    mkdirSync(join(root, 'dist/diagrams'), { recursive: true })
    writeFileSync(join(root, 'dist/diagrams/flowchart.js'), 'export{}')
    writeFileSync(join(root, 'dist/diagrams/state.js'), 'export{}')
    writeFileSync(join(root, 'dist/diagrams/README.md'), 'not a public JavaScript match')
    for (const [name, content] of Object.entries({ 'README.md': '# Public documentation', LICENSE: 'Copyright holder: all rights reserved', 'theme.global.css': 'body{color:black}', 'api.d.ts': 'export declare const value: string', 'unknown.asset': 'unknown format remains unresolved', 'public.js': 'export const publicEntry = true' })) writeFileSync(join(root, name), content)
    writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'fixture', exports: { './diagrams/*': './dist/diagrams/*.js', './*': './*', './global': './dist/fixture.global.js', './package.json': './package.json' }, bin: { am: 'dist/am.js', alias: 'dist/am.js', 'fixture-mcp': 'dist/mcp.js' }, scripts: { 'build:binary': 'bun build bin.ts --compile --outfile dist/am' } }))
    const inventory = discoverStartupInventory(root)
    expect(inventory.filter(value => value.publicName.startsWith('./diagrams/')).map(value => value.publicName)).toEqual(['./diagrams/flowchart', './diagrams/state'])
    expect(inventory.find(value => value.publicName === 'am')?.aliases).toEqual(['am', 'alias'])
    expect(inventory.find(value => value.publicName === './global')?.kind).toBe('browser-global')
    expect(inventory.find(value => value.publicName === './package.json')?.kind).toBe('data')
    expect(inventory.find(value => value.kind === 'native')).toMatchObject({ path: 'dist/am', exists: false })
    const assets = ['./README.md', './LICENSE', './theme.global.css', './api.d.ts', './package.json']
    for (const name of assets) expect(inventory.find(value => value.publicName === name)?.kind).toBe('data')
    expect(inventory.find(value => value.publicName === './public.js')?.kind).toBe('module')
    expect(inventory.find(value => value.publicName === './unknown.asset')?.kind).toBe('module')
    const options = { root, out: join(root, 'out'), rounds: 1, profile: 'smoke' as const, surfaces: ['library'] as const, nodeExecutable: 'node', bunExecutable: join(root, 'no-bun'), startupPasses: 'latency' as const, observerExecutable: join(root, 'no-observer') }
    const prepared = await prepareEntryStartup(options)
    expect(prepared.jobs.some(job => job.entry.publicName === './public.js')).toBe(true)
    expect(prepared.gaps.some(gap => assets.some(name => gap.startsWith(name + '/')))).toBe(false)
    expect(prepared.gaps.some(gap => gap.startsWith('./unknown.asset/'))).toBe(true)
    const result = await runEntryStartupSuite(options, prepared)
    for (const name of assets) {
      const rows = result.observations.filter(row => row.surface === name)
      expect(rows.length).toBeGreaterThan(0)
      expect(rows.every(row => row.status === 'not-applicable' && row.samplesMs === undefined)).toBe(true)
    }
  } finally { rmSync(root, { recursive: true, force: true }) }
}, 20_000)

test('fresh public self-import uses the candidate, includes delayed initialization, first async result and every metadata byte', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'entry-candidate-')))
  try {
    writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'agentic-mermaid', type: 'module', exports: { '.': './candidate.js' } }))
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><text>Start End</text></svg>'
    writeFileSync(join(root, 'candidate.js'), `await new Promise(r=>setTimeout(r,35));export async function renderMermaidSVGWithReceiptAsync(){await new Promise(r=>setTimeout(r,25));return {svg:${JSON.stringify(svg)},receipt:{version:1,output:'svg',requestDigest:'authored-fixture'},metadata:{candidateOnly:'candidate-artifact',payload:'x'.repeat(8192)}}}`)
    const options = { root, packageRoot: root, out: join(root, 'out'), rounds: 1, profile: 'smoke' as const, surfaces: ['library'] as const, nodeExecutable: 'node', bunExecutable: join(root, 'missing-bun'), startupPasses: 'latency' as const, observerExecutable: join(root, 'missing-observer') }
    const prepared = await prepareEntryStartup(options)
    expect(prepared.jobs).toHaveLength(1)
    expect(prepared.jobs[0]!.operation.id).toBe('renderMermaidSVGWithReceiptAsync:svg')
    const result = await runEntryStartupSuite(options, prepared)
    const row = result.observations.find(value => value.mode === 'process-to-first-consumed')!
    expect(row.status).toBe('passed')
    expect(row.metrics!.entry).toBe('file://' + join(root, 'candidate.js'))
    expect(Number(row.metrics!.moduleImportMs)).toBeGreaterThanOrEqual(25)
    expect(Number(row.metrics!.firstApiMs)).toBeGreaterThanOrEqual(15)
    expect(row.samplesMs![0]).toBeGreaterThanOrEqual(Number(row.metrics!.moduleImportMs) + Number(row.metrics!.firstApiMs))
    expect(row.bytes).toBeGreaterThan(svg.length + 8192)
    expect(result.gaps.join('\n')).toContain('p95 unavailable')
  } finally { rmSync(root, { recursive: true, force: true }) }
}, 20_000)

test('resolved Scene startup consumes the public JSON sidecars and refuses a missing parts projection', async () => {
  const root = mkdtempSync(join(tmpdir(), 'entry-resolved-scene-'))
  try {
    writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'agentic-mermaid', type: 'module', exports: { '.': './candidate.js' } }))
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><text>Start End</text></svg>'
    const script = `export function renderResolvedScene(){return {version:1,family:'flowchart',width:100,height:40,svg:${JSON.stringify(svg)},colors:{bg:'#fff',fg:'#111'},frame:[],parts:[],payload:'x'.repeat(8192)}}`
    writeFileSync(join(root, 'candidate.js'), script)
    const options = { root, packageRoot: root, out: join(root, 'good'), rounds: 1, profile: 'smoke' as const, surfaces: ['library'] as const, nodeExecutable: 'node', bunExecutable: join(root, 'missing-bun'), startupPasses: 'latency' as const, observerExecutable: join(root, 'missing-observer') }
    const prepared = await prepareEntryStartup(options)
    expect(prepared.jobs.map(job => job.operation.id)).toEqual(['renderResolvedScene:svg'])
    const good = await runEntryStartupSuite(options, prepared)
    const first = good.observations.find(row => row.mode === 'process-to-first-consumed')!
    expect(first.status).toBe('passed')
    expect(first.bytes).toBeGreaterThan(svg.length + 8192)
    writeFileSync(join(root, 'candidate.js'), script.replace('parts:[],', ''))
    const bad = await runEntryStartupSuite({ ...options, out: join(root, 'bad') }, prepared)
    expect(bad.observations.find(row => row.mode === 'process-to-first-consumed')?.status).toBe('failed')
  } finally { rmSync(root, { recursive: true, force: true }) }
}, 20_000)

// The PNG fixture encodes opaque black/white RGBA pixels with valid chunks and
// CRCs. It witnesses transport/content admission, not rendered label fidelity.
test('browser startup consumes one first result in each fresh browser and keeps heap diagnostics in separate passes', async () => {
  const root = mkdtempSync(join(tmpdir(), 'entry-browser-'))
  try {
    writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'fixture', exports: { './browser': './global.js' } }))
    writeFileSync(join(root, 'global.js'), `let calls=0;const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><text>Start End</text></svg>';function first(){if(++calls!==1)throw Error('Startup made a warmup call before the recorded result')}const receipt=output=>({version:1,output,requestDigest:'fixture'});var agenticMermaid={renderResolvedScene(){first();return{version:1,family:'flowchart',width:100,height:40,svg,colors:{bg:'#fff',fg:'#111'},parts:[],frame:[]}},renderMermaidSVG(){first();return svg},async renderMermaidSVGAsync(){first();await new Promise(r=>setTimeout(r,25));return svg},renderMermaidSVGWithReceipt(){first();return{svg,receipt:receipt('svg'),metadata:{owner:'fixture'}}},renderMermaidASCIIWithReceipt(source,options){first();return{text:'Start --> End',receipt:receipt(options.useAscii?'ascii':'unicode')}},renderMermaidPNGInBrowserWithReceipt(){first();return{png:Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAADklEQVR4nGNgYGD4DwIADvoE/EWwHYsAAAAASUVORK5CYII='),c=>c.charCodeAt(0)),receipt:receipt('png')}}}`)
    const workload = { id: 'browser-first', family: 'flowchart', source: 'flowchart LR\nA[Start] --> B[End]', expectedLabels: ['Start', 'End'], features: [], provenance: 'authored first-browser-call regression' }
    const result = await runInvocationBrowser({ root, harnessRoot: process.cwd(), out: join(root, 'out'), rounds: 1, profile: 'smoke', startupOnly: true, startupSamplesPerRound: 1, executable: chromiumExecutable }, [workload])
    const rows = result.rows.filter(value => value.mode === 'browser-launch-to-first-consumed')
    expect(rows).toHaveLength(7)
    expect(rows.map(value => ({ status: value.status, detail: value.detail, findings: value.findings }))).toEqual(rows.map(() => ({ status: 'passed', detail: undefined, findings: [] })))
    expect(rows.every(value => value.samplesMs!.length === 1 && value.samplesMs![0]! >= Number(value.metrics!.firstInputMs))).toBe(true)
    expect(rows.every(value => Number(value.metrics!.launchToReadyMs) >= Number(value.metrics!.pageToReadyMs))).toBe(true)
    const diagnostic = result.rows.filter(value => value.mode === 'fresh-browser-resource')
    expect(diagnostic).toHaveLength(7)
    expect(diagnostic.every(value => value.samplesMs === undefined && value.status === 'passed')).toBe(true)
    const resource = result.artifacts.find(value => value.endsWith('svg-resource-payload.json'))!
    const diagnostics = JSON.parse(readFileSync(resource, 'utf8'))
    expect(Object.keys(diagnostics.heapSnapshots)).toEqual(['beforeTargetLoad', 'apiReady', 'afterConsumed', 'afterReleaseAfterGc'])
    expect(Object.keys(diagnostics.processMemorySnapshots)).toEqual(['beforeTargetLoad', 'apiReady', 'afterConsumed', 'afterReleaseAfterGc'])
    const processRows = result.rows.filter(value => value.operation === 'process-memory')
    expect(processRows).toHaveLength(7)
    expect(processRows.every(value => value.samplesMs === undefined && value.metrics!.resourcePass === true)).toBe(true)
    if (process.platform === 'linux') {
      expect(diagnostics.processMemorySnapshots.afterReleaseAfterGc.status).toBe('measured')
      expect(diagnostics.processMemorySnapshots.afterReleaseAfterGc.rssBytes).toBeGreaterThan(0)
      expect(diagnostics.processMemorySnapshots.afterReleaseAfterGc.pssBytes).toBeGreaterThan(0)
    }
    expect(Number(rows.find(value => value.operation === 'svg-async')!.metrics!.firstInputMs)).toBeGreaterThanOrEqual(15)
  } finally { rmSync(root, { recursive: true, force: true }) }
}, 45_000)

test('child milestone decoder preserves Unicode split across stdout buffers and ignores unframed output', async () => {
  const root = mkdtempSync(join(tmpdir(), 'entry-frame-'))
  try {
    const script = join(root, 'frames.cjs')
    writeFileSync(script, `const fs=require('node:fs'),b=Buffer.from('noise\\n\\u0001entry-startup\\u0001'+JSON.stringify({phase:'first-consumed',label:'漢字'})+'\\n');const cut=b.indexOf(Buffer.from('漢'))+1;fs.writeSync(1,b.subarray(0,cut));setTimeout(()=>fs.writeSync(1,b.subarray(cut)),20)`)
    const result = await runStartupChild('node', [script], { cwd: root })
    expect(result.code).toBe(0)
    expect(result.phases).toHaveLength(1)
    expect(result.phases[0]!.label).toBe('漢字')
    expect(result.phases[0]!.observedMs).toBeGreaterThan(0)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('a fully consumed first SVG cannot hide a later failing process lifecycle', async () => {
  const root = mkdtempSync(join(tmpdir(), 'entry-lifecycle-'))
  try {
    writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'fixture-late-exit', type: 'module', exports: { '.': './index.js' } }))
    writeFileSync(join(root, 'index.js'), `export function renderMermaidSVG(){setImmediate(()=>{process.exitCode=1});return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><text>Start End</text></svg>'}`)
    const result = await runEntryStartupSuite({ root, out: join(root, 'out'), rounds: 1, profile: 'smoke', surfaces: ['library'], bunExecutable: join(root, 'missing'), startupPasses: 'latency' as const, observerExecutable: join(root, 'missing') })
    const row = result.observations.find(value => value.mode === 'process-to-first-consumed')!
    expect(row.status).toBe('failed')
    expect(row.metrics!.lifecycleExitCode).toBe(1)
    expect(row.samplesMs).toHaveLength(1)
    expect(row.detail).toContain('lifecycle')
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('MCP resource cleanup accepts an already reaped observer without consulting a vanished procfs child', async () => {
  const observer = spawn('node', ['--version'], { stdio: 'ignore' })
  await new Promise<void>((resolve, reject) => { observer.once('error', reject); observer.once('close', () => resolve()) })
  expect(observer.exitCode).toBe(0)
  await finishStartupMcpObserver(observer)
})

test('resource observer records fresh product and baseline process costs in explicit byte/millisecond units', async () => {
  const root = mkdtempSync(join(tmpdir(), 'entry-resource-'))
  try {
    writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'fixture-entry', type: 'module', exports: { '.': './index.js' } }))
    writeFileSync(join(root, 'index.js'), `export function renderMermaidSVG(){return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><text>Start End</text></svg>'}`)
    const observer = join(root, 'observer.cjs')
    writeFileSync(observer, `#!/usr/bin/env node\nconst fs=require('node:fs'),cp=require('node:child_process');if(process.argv.includes('--version')){fs.writeSync(1,'fixture (GNU Time)');process.exit(0)}const args=process.argv.slice(2),out=args[args.indexOf('-o')+1],start=args.indexOf('--')+1;const child=cp.spawnSync(args[start],args.slice(start+1),{encoding:'utf8'});fs.writeFileSync(out,'user_seconds=0.01\\nsystem_seconds=0.02\\npeak_rss_kib=1234\\n');if(child.stdout)fs.writeSync(1,child.stdout);if(child.stderr)fs.writeSync(2,child.stderr);process.exit(child.status||0)`)
    chmodSync(observer, 0o755)
    const result = await runEntryStartupSuite({ root, out: join(root, 'out'), rounds: 1, profile: 'smoke', surfaces: ['library'], bunExecutable: join(root, 'missing'), observerExecutable: observer })
    const row = result.observations.find(value => value.mode === 'fresh-process-resource-paired-control')!
    expect(row.status).toBe('passed')
    expect(row.samplesMs).toBeUndefined()
    expect(row.metrics).toMatchObject({ peakRssBytes: 1234 * 1024, baselinePeakRssBytes: 1234 * 1024, peakDifferenceBytes: 0, userCpuMs: 10, systemCpuMs: 20, cpuResolutionMs: 10 })
    const evidence = JSON.parse(readFileSync(String(row.metrics!.rawSnapshots), 'utf8'))
    expect(Object.keys(evidence.resource.snapshots)).toEqual(['beforeImport', 'apiReady', 'afterConsumed', 'outputHeldAfterGc', 'afterReleaseAfterGc'])
    expect(evidence.baseline.snapshots.beforeImport.rss).toBeGreaterThan(0)
    expect(parseStartupResource('user_seconds=0.00\nsystem_seconds=0.00\npeak_rss_kib=1\n')).toMatchObject({ userCpuMs: 0, systemCpuMs: 0, peakRssBytes: 1024, cpuResolutionMs: 10 })
    expect(() => parseStartupResource('peak_rss_kib=1')).toThrow('user_seconds')
  } finally { rmSync(root, { recursive: true, force: true }) }
}, 20_000)

test('MCP startup sends exactly one first real format call per fresh initialized server, before any warmup', async () => {
  const root = mkdtempSync(join(tmpdir(), 'entry-mcp-'))
  try {
    const calls = join(root, 'calls.jsonl'), server = join(root, 'mcp.cjs')
    writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'fixture', bin: { 'fixture-mcp': 'mcp.cjs' } }))
    writeFileSync(server, `const fs=require('node:fs');const alive=setInterval(()=>{},1000);process.stdin.on('end',()=>clearInterval(alive));let pending='';process.stdin.setEncoding('utf8');process.stdin.on('data',chunk=>{pending+=chunk;let nl;while((nl=pending.indexOf('\\n'))>=0){const line=pending.slice(0,nl);pending=pending.slice(nl+1);if(!line.trim())continue;const r=JSON.parse(line);if(r.id===undefined)continue;let result;if(r.method==='initialize')result={protocolVersion:r.params.protocolVersion,capabilities:{tools:{}},serverInfo:{name:'fixture',version:'1'}};else if(r.method==='tools/list')result={tools:['render_svg','render_ascii','render_png'].map(name=>({name,inputSchema:{type:'object',properties:{source:{type:'string'}}}}))};else if(r.method==='tools/call'){fs.appendFileSync(${JSON.stringify(calls)},JSON.stringify({pid:process.pid,name:r.params.name,args:r.params.arguments})+'\\n');const format=r.params.name==='render_svg'?'svg':r.params.name==='render_png'?'png':r.params.arguments.useAscii?'ascii':'unicode';const value=format==='svg'?{svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><text>Start End</text></svg>'}:format==='png'?{png_base64:'iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAADklEQVR4nGNgYGD4DwIADvoE/EWwHYsAAAAASUVORK5CYII='}:{text:'Start --> End'};value.receipt={version:1,output:format,requestDigest:'fixture'};result={content:[{type:'text',text:JSON.stringify(value)}]}}else result={};fs.writeSync(1,JSON.stringify({jsonrpc:'2.0',id:r.id,result})+'\\n')}});`)
    const workload = { id: 'mcp-first', family: 'flowchart', source: 'flowchart LR\nA[Start] --> B[End]', expectedLabels: ['Start', 'End'], features: [], provenance: 'authored first-request regression' }
    const result = await runInvocationMcpStartup({ root, harnessRoot: process.cwd(), out: join(root, 'out'), rounds: 1, profile: 'smoke', startupOnly: true, startupPasses: 'latency', startupSamplesPerRound: 1, startupRuntimes: [{ name: 'node', executable: 'node', version: 'test' }], startupMcpTransports: ['stdio'] }, [workload])
    const rows = result.rows.filter(value => value.mode === 'process-initialize-first-fully-consumed-tool')
    expect(rows).toHaveLength(4)
    expect(rows.map(value => ({ status: value.status, detail: value.detail, findings: value.findings }))).toEqual(rows.map(() => ({ status: 'passed', detail: undefined, findings: [] })))
    expect(rows.every(value => value.metrics!.receiptPresent === true)).toBe(true)
    expect(rows.every(value => value.samplesMs![0]! >= Number(value.metrics!.firstCallAndConsumptionMs))).toBe(true)
    const observed = readFileSync(calls, 'utf8').trim().split('\n').map(line => JSON.parse(line))
    expect(observed).toHaveLength(4)
    expect(new Set(observed.map(value => value.pid)).size).toBe(4)
    expect(observed.map(value => value.name)).toEqual(['render_svg', 'render_ascii', 'render_ascii', 'render_png'])
    // Local published MCP exposes code execution for SVG/terminal, while the
    // hosted tool set can expose direct render tools. Exercise both contracts.
    writeFileSync(server, readFileSync(server, 'utf8').replace("['render_svg','render_ascii','render_png']", "['execute','render_png']").replace("const format=", "const code=r.params.arguments.code??'';if(r.params.name==='execute'){r.params.name=code.includes('renderMermaidSVGWithReceipt')?'render_svg':'render_ascii';r.params.arguments.useAscii=code.includes('\"useAscii\":true')}const format="))
    const codeWorkflow = await runInvocationMcpStartup({ root, harnessRoot: process.cwd(), out: join(root, 'code-out'), rounds: 1, profile: 'smoke', startupOnly: true, startupPasses: 'latency', startupSamplesPerRound: 1, startupRuntimes: [{ name: 'node', executable: 'node', version: 'test' }], startupMcpTransports: ['stdio'] }, [workload])
    const codeRows = codeWorkflow.rows.filter(value => value.mode === 'process-initialize-first-fully-consumed-tool')
    expect(codeRows.every(value => value.status === 'passed')).toBe(true)
    expect(codeRows.map(value => value.operation)).toEqual(['execute', 'execute', 'execute', 'render_png'])
    expect(codeRows.slice(0, 3).every(value => JSON.parse(String(value.metrics!.requestArguments)).code.includes('WithReceipt'))).toBe(true)
    // The public SDK has no server exit-status field. A separate observer must
    // reject a server which replies correctly and later drains with exit1.
    writeFileSync(server, 'process.exitCode=1;\n' + readFileSync(server, 'utf8'))
    const observer = join(root, 'observe.cjs')
    writeFileSync(observer, `#!/usr/bin/env node\nconst fs=require('node:fs'),cp=require('node:child_process'),a=process.argv.slice(2),file=a[a.indexOf('-o')+1],start=a.indexOf('--')+1;const child=cp.spawn(a[start],a.slice(start+1),{stdio:'inherit'});child.on('close',code=>{fs.writeFileSync(file,'user_seconds=0.01\\nsystem_seconds=0.02\\npeak_rss_kib=1234\\nexit_code='+code+'\\n');process.exitCode=code??1})`)
    chmodSync(observer, 0o755)
    const late = await runInvocationMcpStartup({ root, harnessRoot: process.cwd(), out: join(root, 'late-out'), rounds: 1, profile: 'smoke', startupOnly: true, startupPasses: 'resources', startupSamplesPerRound: 5, startupRuntimes: [{ name: 'node', executable: 'node', version: 'test' }], startupMcpTransports: ['stdio'], startupObserverExecutable: observer }, [workload])
    const resources = late.rows.filter(value => value.mode === 'fresh-mcp-server-resource')
    expect(resources).toHaveLength(4)
    expect(late.rows.every(row => row.samplesMs === undefined)).toBe(true)
    expect(readFileSync(calls, 'utf8').trim().split('\n')).toHaveLength(12)
    expect(resources.every(value => value.status === 'failed' && value.metrics!.serverExitCode === 1)).toBe(true)
    expect(resources.every(value => value.metrics!.peakRssBytes === 1234 * 1024)).toBe(true)
    expect(resources.every(value => value.detail!.includes('lifecycle'))).toBe(true)
  } finally { rmSync(root, { recursive: true, force: true }) }
}, 20_000)

test('resource-only library recovery qualifies one fresh actual result per round without rerunning latency samples', async () => {
  const root = mkdtempSync(join(tmpdir(), 'entry-resource-only-'))
  try {
    const calls = join(root, 'calls.jsonl'), observer = join(root, 'observe.cjs')
    writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'fixture-resource-only', type: 'module', exports: { '.': './index.js' } }))
    writeFileSync(join(root, 'index.js'), `import{appendFileSync}from'node:fs';export function renderMermaidSVG(){appendFileSync(${JSON.stringify(calls)},JSON.stringify({gc:typeof globalThis.gc==='function'})+String.fromCharCode(10));return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><text>Start End</text></svg>'}`)
    // A process-observer fixture, not measured product resource evidence.
    writeFileSync(observer, `#!/usr/bin/env node
const fs=require('node:fs'),cp=require('node:child_process');if(process.argv.includes('--version')){console.log('fixture GNU Time');process.exit(0)}const a=process.argv.slice(2),file=a[a.indexOf('-o')+1],start=a.indexOf('--')+1;const child=cp.spawnSync(a[start],a.slice(start+1),{stdio:'inherit'});fs.writeFileSync(file,['user_seconds=0.01','system_seconds=0.02','peak_rss_kib=1234',''].join(String.fromCharCode(10)));process.exit(child.status??1)`)
    chmodSync(observer, 0o755)
    const options = { root, out: join(root, 'resources'), rounds: 2, samplesPerRound: 5, profile: 'full' as const, startupPasses: 'resources' as const, surfaces: ['library'] as const, bunExecutable: join(root, 'missing-bun'), observerExecutable: observer }
    const result = await runEntryStartupSuite(options)
    const rows = result.observations.filter(row => row.mode === 'fresh-process-resource-paired-control')
    expect(rows).toHaveLength(2)
    expect(rows.every(row => row.status === 'passed' && row.samplesMs === undefined)).toBe(true)
    expect(result.observations.every(row => row.samplesMs === undefined)).toBe(true)
    const recorded = readFileSync(calls, 'utf8').trim().split('\n').map(line => JSON.parse(line))
    expect(recorded).toEqual([{ gc: true }, { gc: true }])
    writeFileSync(join(root, 'index.js'), `export function renderMermaidSVG(){return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><text>Wrong</text></svg>'}`)
    const invalid = await runEntryStartupSuite({ ...options, out: join(root, 'invalid'), rounds: 1 })
    expect(invalid.observations.find(row => row.mode === 'fresh-process-resource-paired-control')!.status).toBe('failed')
    expect(invalid.observations.every(row => row.samplesMs === undefined)).toBe(true)
  } finally { rmSync(root, { recursive: true, force: true }) }
}, 20_000)

test('missing GNU time stops all/resources before target discovery while explicit latency remains available', async () => {
  const root = mkdtempSync(join(tmpdir(), 'entry-observer-preflight-'))
  try {
    const imported = join(root, 'imported')
    writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'fixture-observer-gate', type: 'module', exports: { '.': './index.js' } }))
    writeFileSync(join(root, 'index.js'), `import{writeFileSync}from'node:fs';writeFileSync(${JSON.stringify(imported)},'actual import');export function renderMermaidSVG(){return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><text>Start End</text></svg>'}`)
    const options = { root, out: join(root, 'out'), rounds: 1, profile: 'smoke' as const, surfaces: ['library'] as const, bunExecutable: join(root, 'missing-bun'), observerExecutable: join(root, 'missing-observer') }
    for (const startupPasses of ['all', 'resources'] as const) await expect(prepareEntryStartup({ ...options, startupPasses })).rejects.toThrow('No target samples were collected')
    expect(() => readFileSync(imported)).toThrow()
    const prepared = await prepareEntryStartup({ ...options, startupPasses: 'latency' })
    expect(prepared.settings.startupPasses).toBe('latency')
    const result = await runEntryStartupSuite({ ...options, startupPasses: 'latency' }, prepared)
    expect(result.observations.find(row => row.mode === 'process-to-first-consumed')!.status).toBe('passed')
    expect(result.observations.some(row => row.mode.includes('resource'))).toBe(false)
  } finally { rmSync(root, { recursive: true, force: true }) }
}, 20_000)

test('focused browser resource recovery invokes only the selected API and never repeats latency passes', async () => {
  const root = mkdtempSync(join(tmpdir(), 'entry-browser-resources-only-'))
  try {
    writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'fixture', exports: { './browser': './global.js' } }))
    writeFileSync(join(root, 'global.js'), `let calls=0;var agenticMermaid={renderMermaidSVG(){throw Error('Unselected SVG operation ran')},renderResolvedScene(){if(++calls!==1)throw Error('Warmup or repeated first call');return{version:1,family:'flowchart',width:100,height:40,svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><text>Start End</text></svg>',colors:{bg:'#fff',fg:'#111'},parts:[],frame:[]}}}`)
    const common = { root, harnessRoot: process.cwd(), rounds: 1, profile: 'smoke' as const, startupOnly: true, startupSamplesPerRound: 5, startupOperations: ['resolved-scene'], executable: chromiumExecutable }
    const workload = { id: 'only-resolved', family: 'flowchart', source: 'flowchart LR\nA[Start] --> B[End]', expectedLabels: ['Start', 'End'], features: [], provenance: 'Independent focused startup recovery contract' }
    const resource = await runInvocationBrowser({ ...common, out: join(root, 'resources'), startupPasses: 'resources' }, [workload])
    expect(resource.rows.every(row => row.samplesMs === undefined)).toBe(true)
    expect(resource.rows.filter(row => row.operation === 'resolved-scene' && row.mode === 'fresh-browser-resource').map(row => row.status)).toEqual(['passed'])
    expect(resource.rows.every(row => row.surface === 'browser:global')).toBe(true)
    expect(resource.rows.some(row => row.operation === 'process-memory')).toBe(true)
    const latency = await runInvocationBrowser({ ...common, out: join(root, 'latency'), startupPasses: 'latency', startupSamplesPerRound: 2 }, [workload])
    expect(latency.rows.filter(row => row.operation === 'resolved-scene' && row.mode === 'browser-launch-to-first-consumed').map(row => row.status)).toEqual(['passed', 'passed'])
    expect(latency.rows.some(row => ['process-memory', 'heap-checkpoint'].includes(row.operation))).toBe(false)
    await expect(runInvocationBrowser({ ...common, out: join(root, 'unknown'), startupOperations: ['unknown-api'] }, [workload])).rejects.toThrow('startupOperations')
  } finally { rmSync(root, { recursive: true, force: true }) }
}, 30_000)

test('resource-only CLI recovery executes and qualifies both input modes without latency launches', async () => {
  const root = mkdtempSync(join(tmpdir(), 'entry-cli-resource-only-'))
  try {
    const calls = join(root, 'calls.jsonl'), observer = join(root, 'observer.cjs')
    writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'fixture-cli-resource-only', bin: { am: './cli.cjs' } }))
    writeFileSync(join(root, 'cli.cjs'), `const fs=require('node:fs'),a=process.argv.slice(2);if(a.includes('--help')){console.log('  --format svg     SVG output');process.exit(0)}const source=fs.readFileSync(a[1]==='-'?0:a[1],'utf8');fs.appendFileSync(${JSON.stringify(calls)},JSON.stringify({input:a[1]==='-'?'stdin':'file',source})+String.fromCharCode(10));fs.writeFileSync(a[a.indexOf('--output')+1],'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><text>Start End</text></svg>')`)
    // Explicit observer fixture: test routing and units, never product costs.
    writeFileSync(observer, `#!/usr/bin/env node
const fs=require('node:fs'),cp=require('node:child_process');if(process.argv.includes('--version')){console.log('fixture GNU Time');process.exit(0)}const a=process.argv.slice(2),file=a[a.indexOf('-o')+1],start=a.indexOf('--')+1;const child=cp.spawnSync(a[start],a.slice(start+1),{stdio:'inherit'});fs.writeFileSync(file,['user_seconds=0.01','system_seconds=0.02','peak_rss_kib=1234',''].join(String.fromCharCode(10)));process.exit(child.status??1)`)
    chmodSync(observer, 0o755)
    const result = await runEntryStartupSuite({ root, out: join(root, 'out'), rounds: 2, samplesPerRound: 5, profile: 'full', startupPasses: 'resources', surfaces: ['cli'], bunExecutable: join(root, 'missing-bun'), observerExecutable: observer })
    const resources = result.observations.filter(row => row.mode === 'fresh-cli-process-resource')
    expect(resources).toHaveLength(4)
    expect(resources.every(row => row.status === 'passed' && row.samplesMs === undefined)).toBe(true)
    expect(result.observations.every(row => row.samplesMs === undefined)).toBe(true)
    const actual = readFileSync(calls, 'utf8').trim().split('\n').map(line => JSON.parse(line))
    expect(actual.map(value => value.input)).toEqual(['stdin', 'stdin', 'file', 'file'])
    expect(actual.every(value => value.source === 'flowchart LR\nA[Start] --> B[End]')).toBe(true)
  } finally { rmSync(root, { recursive: true, force: true }) }
}, 20_000)
