import { expect, test } from 'bun:test'
import { Resvg } from '@resvg/resvg-js'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { browserHost, davebenchBrowserCall, davebenchCliCall, davebenchInputs, davebenchRankings, type DavebenchRun } from '../unified/davebench.ts'
import { verifyCommunityBrowser, type CommunityBrowserEngine } from '../unified/community-browser.ts'
import { terminalCliCall } from '../unified/davebench-terminal.ts'
import { authoredDiagnosticSource, errorPatternSources, rawStatements } from '../unified/davebench-validity.ts'
import { useTempDirs } from './helpers/temp-dir.ts'
import { defaultChromium } from '../unified/benchmark-context.ts'

const temp = useTempDirs('simple-davebench-')
test('CLI deadlines kill descendants that retain the process pipes', async () => {
  const root = temp.dir(), fixture = join(root, 'descendants.mjs')
  writeFileSync(fixture, `import {spawn} from 'node:child_process';spawn(process.execPath,['-e','setTimeout(()=>{},5000)'],{stdio:'inherit'});setInterval(()=>{},1000)`)
  const artifact: any = { kind: 'cli', executable: process.execPath, args: [fixture], input: 'stdin', outputBindings: { svg: { args: [fixture] } } }
  for (const call of [() => davebenchCliCall({ artifact } as any, 'source', 'svg', 300), () => terminalCliCall(artifact, 'source', root, 300)]) {
    const started = performance.now()
    expect((await call()).outcome).toBe('timeout')
    expect(performance.now() - started).toBeLessThan(2500)
  }
})
test('native PNG stdout bindings write to a regular scratch file that is admitted after the clock and then removed', async () => {
  const root = temp.dir(), fixture = join(root, 'export.mjs')
  const png = new Resvg('<svg xmlns="http://www.w3.org/2000/svg" width="4" height="3"><rect width="4" height="3"/></svg>').render().asPng()
  // Merman-style exporters reopen stdout and reject non-regular files such as /dev/null.
  writeFileSync(fixture, `import { fstatSync } from 'node:fs';
if (process.argv[2] !== '-' || !fstatSync(1).isFile()) process.exit(7);
for await (const chunk of process.stdin) {}
process.stdout.write(process.argv[3] === 'bad' ? Buffer.alloc(1024) : Buffer.from('${Buffer.from(png).toString('base64')}', 'base64'));
`)
  const peer: any = { artifact: { executable: 'node', outputBindings: { png: { args: [fixture, '-'] } } } }
  const result = await davebenchCliCall(peer, 'flowchart TD; A-->B', 'png', 5000)
  expect(result.outcome).toBe('completed')
  expect(Object.keys(result).sort()).toEqual(['ms', 'outcome'])
  const bad: any = { artifact: { executable: 'node', outputBindings: { png: { args: [fixture, '-', 'bad'] } } } }
  expect(await davebenchCliCall(bad, 'flowchart TD; A-->B', 'png', 5000)).toMatchObject({ outcome: 'invalid' })
})
test('completion wins before speed, speed breaks equal completion, exact ties share ranks and incomplete runs remain unranked', () => {
  const runs = (project: string, completed: number[], times: number[], format = 'svg'): DavebenchRun[] => completed.map((count, index) => ({ project, version: 'fixture', format, run: index + 1, boundary: 'fixture public API', attempted: 10, completed: count, failed: 10 - count, timeouts: 0, totalMs: times[index]! }))
  const result = davebenchRankings([
    ...runs('fast-partial', [8, 8, 8], [1, 1, 1]),
    ...runs('complete-slow', [10, 10, 10], [100, 100, 100]),
    ...runs('complete-fast', [10, 10, 10], [15, 20, 90]),
    ...runs('complete-tie', [10, 10, 10], [20, 20, 20]),
    ...runs('flaky', [10, 10, 9], [1, 1, 1]),
    ...runs('incomplete', [10, 10], [1, 1]),
    ...runs('png-only', [10, 10, 10], [1, 1, 1], 'png'),
  ], 10)
  expect(result.svg.map(row => [row.project, row.rank, row.completed])).toEqual([
    ['complete-fast', 1, 10], ['complete-tie', 1, 10], ['complete-slow', 3, 10], ['flaky', 4, 9], ['fast-partial', 5, 8],
  ])
  expect(result.png.map(row => [row.project, row.rank])).toEqual([['png-only', 1]])
  expect(result.unranked.map(row => row.project)).toEqual(['incomplete'])
})
test('time breaks equal completion only between rows with the same boundary kind', () => {
  const runs = (project: string, completed: number, ms: number, boundary: string): DavebenchRun[] => [1, 2, 3].map(run => ({ project, version: 'fixture', format: 'svg', run, boundary, attempted: 10, completed, failed: 10 - completed, timeouts: 0, totalMs: ms }))
  const mixed = davebenchRankings([
    ...runs('api-fast', 10, 1, 'Chromium public SVG API'),
    ...runs('api-slow', 10, 5, 'Chromium public SVG API'),
    ...runs('cli', 10, 3, 'native CLI svg; process startup included'),
    ...runs('partial', 9, 1, 'Chromium public SVG API'),
  ], 10)
  // A fresh-process clock includes startup on every call, so it cannot be ordered
  // against persistent API time; the whole equal-completion group shares a rank.
  expect(mixed.svg.map(row => [row.project, row.rank])).toEqual([['cli', 1], ['api-fast', 1], ['api-slow', 1], ['partial', 4]])
  const alike = davebenchRankings([...runs('api-fast', 10, 1, 'Chromium public SVG API'), ...runs('api-slow', 10, 5, 'Chromium public SVG API')], 10)
  expect(alike.svg.map(row => [row.project, row.rank])).toEqual([['api-fast', 1], ['api-slow', 2]])
})
test('documentation extraction retains duplicate blocks and excludes a Mermaid fence inside a Markdown example', () => {
  const root = temp.dir(); mkdirSync(join(root, 'docs'))
  writeFileSync(join(root, 'docs/example.md'), '```mermaid\ngraph LR; A-->B\n```\n```mermaid-example\ngraph LR; A-->B\n```\n````markdown\n```mermaid\nnot a separate block\n```\n````\n')
  execFileSync('git', ['init', '--quiet'], { cwd: root }); execFileSync('git', ['add', '.'], { cwd: root })
  execFileSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--quiet', '-m', 'Fixture docs'], { cwd: root })
  const inputs = davebenchInputs(root, 'HEAD')
  expect(inputs.cases).toHaveLength(2)
  expect(inputs.cases[0]!.source).toBe(inputs.cases[1]!.source)
})
test('missing API durations cannot win a time tie, and typed boundaries govern new measurements', () => {
  const runs = [1, 2, 3].flatMap(run => ['known', 'unknown'].map(project => ({ project, version: '1', format: 'svg', run, boundary: 'same display text', boundaryKind: 'persistent-api' as const, attempted: 1, completed: 0, failed: 1, timeouts: 0, totalMs: project === 'known' ? 10 : 0, ...(project === 'unknown' ? { untimedCalls: 1 } : {}) })))
  const ranked = davebenchRankings(runs, 1).svg
  expect(ranked.map(row => row.rank)).toEqual([1, 1])
  expect(ranked.find(row => row.project === 'unknown')?.medianTotalMs).toBeNull()
})

test('documentation extraction names the missing Mermaid checkout or commit', () => {
  expect(() => davebenchInputs(join(temp.dir(), 'absent'))).toThrow(/does not contain\. Clone https:\/\/github\.com\/mermaid-js\/mermaid there; davebench and davebench:terminal also accept --upstream/)
  const root = temp.dir(); execFileSync('git', ['init', '--quiet'], { cwd: root })
  expect(() => davebenchInputs(root, '0000000000000000000000000000000000000000')).toThrow(/commit 0{40}, which .* does not contain/)
})
test('browser delivery is limited to the verified main and ZenUML asset bytes', async () => {
  const root = temp.dir(), addon = temp.dir()
  const entry = join(root, 'bundle.js'), asset = join(root, 'allowed.mjs'), addonEntry = join(addon, 'addon.mjs'), addonChunk = join(addon, 'chunk.mjs')
  const contents = new Map([
    [entry, `globalThis.fixtureApi={initialize(){},registerExternalDiagrams(plugins){globalThis.addonName=plugins[0].name},render(){return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><text>'+globalThis.addonName+'</text></svg>'}}`],
    [asset, 'export const value="verified asset"'], [addonEntry, 'import {name} from "./chunk.mjs";export default {name}'], [addonChunk, 'export const name="verified addon"'],
  ])
  for (const [path, content] of contents) writeFileSync(path, content)
  writeFileSync(join(root, 'unsealed.mjs'), 'unverified main asset')
  writeFileSync(join(addon, 'unsealed.mjs'), 'unverified addon asset')
  const files = [...contents].map(([path, content]) => ({ path, sha256: createHash('sha256').update(content).digest('hex') }))
  const engine: CommunityBrowserEngine = { root, entry: 'bundle.js', kind: 'mermaid', global: 'fixtureApi', version: 'fixture', artifactSha256: files[0]!.sha256, files, zenuml: { root: addon, entry: 'addon.mjs', version: 'fixture' } }
  const browser = await chromium.launch({ executablePath: process.env.TRIDENT_CHROMIUM_EXECUTABLE ?? defaultChromium(chromium), headless: true })
  const host = await browserHost(browser, { browser: engine } as any, 'svg')
  try {
    const initial = await host.open()
    for (const path of ['/unsealed.mjs', '/zenuml/unsealed.mjs', '/%FF']) expect(await initial.page.evaluate(async path => (await fetch(path)).status, path)).toBe(404)
    await initial.context.close()
    expect(() => verifyCommunityBrowser({ ...engine, files: files.filter(file => file.path !== addonEntry) })).toThrow('does not bind its ZenUML entry')
    // Verification and execution must consume the same bytes, including lazy imports.
    for (const path of contents.keys()) writeFileSync(path, 'throw Error("changed after verification")')
    const session = await host.open()
    expect(await session.page.evaluate(() => (globalThis as any).__fidelityCommunity.render())).toContain('verified addon')
    expect(await session.page.evaluate(async () => (await fetch('/allowed.mjs')).text())).toBe('export const value="verified asset"')
    await session.context.close()
  } finally { await browser.close(); await host.close() }
})
test('the browser runner awaits completion, includes failed-call time and admits only usable outputs', async () => {
  const browser = await chromium.launch({ executablePath: process.env.TRIDENT_CHROMIUM_EXECUTABLE ?? defaultChromium(chromium), headless: true })
  try {
    const page = await browser.newPage()
    await page.evaluate(() => {
      const outputs: Record<string, string> = { drawn: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 20"><rect width="10" height="10"/><text>A</text></svg>', empty: '', placeholder: '<svg xmlns="http://www.w3.org/2000/svg" aria-roledescription="error" viewBox="0 0 9 9"><path d="M0 0"/></svg>', message: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 20"><text>Syntax error in text</text></svg>', 'block\n  a b': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 20"><title>block diagram</title><text>block</text><text>a</text><text>b</text></svg>', 'flowchart\n  a b': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 20"><title>flowchart</title><text>a</text><text>b</text></svg>' }
      ;(globalThis as any).__fidelityCommunity = { render: async (source: string) => { await new Promise(done => setTimeout(done, 20)); if (source === 'reject') throw Error('Expected fixture failure'); return outputs[source] } }
    })
    const call = (source: string, format = 'svg') => page.evaluate(davebenchBrowserCall, { source, id: 'fixture', format, errorPatterns: errorPatternSources, errorSource: authoredDiagnosticSource(source), raw: rawStatements(source) })
    const complete = await call('drawn')
    expect(complete.outcome).toBe('completed'); expect(complete.ms).toBeGreaterThanOrEqual(15)
    expect(Object.keys(complete).sort()).toEqual(['ms', 'outcome'])
    const failed = await call('reject')
    expect(failed.outcome).toBe('error'); expect(failed.ms).toBeGreaterThanOrEqual(15)
    // A returned value that is not a usable drawing is a failure, timed like any other call.
    expect(await call('empty')).toMatchObject({ outcome: 'invalid', invalid: 'no SVG document' })
    expect(await call('placeholder')).toMatchObject({ outcome: 'invalid', invalid: 'error placeholder' })
    expect(await call('message')).toMatchObject({ outcome: 'invalid', invalid: 'error message: Syntax error' })
    expect((await call('empty')).ms).toBeGreaterThanOrEqual(15)
    // A fallback render (the header keyword drawn as a node) is not a completion; a drawn title is not checked.
    expect(await call('block\n  a b')).toMatchObject({ outcome: 'invalid', invalid: 'fallback render: source header shown: block' })
    expect((await call('flowchart\n  a b')).outcome).toBe('completed')
    await page.evaluate(() => { (globalThis as any).__fidelityCommunity.render = (source: string) => {
      ;(globalThis as any).__diagnosticSourceSeen = source
      return '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="40"><text x="5" y="20">Syntax error</text></svg>'
    } })
    for (const format of ['svg', 'png']) {
      const encoded = 'flowchart LR\nA["Syntax#32;error"]'
      expect((await call(encoded, format)).outcome).toBe('completed')
      expect(await page.evaluate(() => (globalThis as any).__diagnosticSourceSeen)).toBe(encoded)
      expect(await call('flowchart LR\nA[Other]', format)).toMatchObject({ outcome: 'invalid', invalid: 'error message: Syntax error' })
    }
    await page.evaluate(() => { (globalThis as any).__fidelityCommunity.render = () => '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><foreignObject width="20" height="20"><div xmlns="http://www.w3.org/1999/xhtml">A<br></br>B</div></foreignObject></svg>' })
    expect((await call('paired void')).outcome).toBe('completed')
    expect((await call('paired void', 'png')).outcome).toBe('completed')
    await page.evaluate(() => {
      ;(globalThis as any).__davebenchNativePng = async (source: string) => {
        await new Promise(done => setTimeout(done, 20)); (globalThis as any).__pngCompleted = true
        if (source === 'bad') return new Blob(['fixture bytes'])
        if (source === 'truncated') return new Blob([new Uint8Array([137,80,78,71,13,10,26,10])])
        const canvas = document.createElement('canvas'); canvas.width = 4; canvas.height = 3
        return new Promise<Blob | null>(done => canvas.toBlob(done, 'image/png'))
      }
    })
    const png = await call('PNG fixture', 'png')
    expect(png.outcome).toBe('completed'); expect(png.ms).toBeGreaterThanOrEqual(15)
    expect(await page.evaluate(() => (globalThis as any).__pngCompleted)).toBe(true)
    expect(Object.keys(png).sort()).toEqual(['ms', 'outcome'])
    expect(await call('bad', 'png')).toMatchObject({ outcome: 'invalid' })
    expect((await call('truncated', 'png')).outcome).toBe('invalid')
  } finally { await browser.close() }
})
