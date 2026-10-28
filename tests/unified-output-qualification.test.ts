import { describe, expect, test } from 'bun:test'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { runCommunityNodeRound, runCommunityCli } from '../unified/community.ts'
import { parseOptions } from '../unified/options.ts'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { crc32, deflateSync } from 'node:zlib'
import { qualifyOutput, withReferenceLabels } from '../unified/qualification.ts'
import type { UnifiedWorkload } from '../unified/types.ts'

const workload = (labels: string[]): UnifiedWorkload => ({ id: 'authored-output-admission', family: 'flowchart', source: 'flowchart LR', features: [], provenance: 'independently authored qualification examples', expectedLabels: labels })
const svgDocument = (body: string, canvas = 'viewBox="0 0 100 100"') => `<svg xmlns="http://www.w3.org/2000/svg" ${canvas}>${body}</svg>`
describe('benchmark output admission at reader-facing text', () => {
  test('admits literal authored labels inside decorated visible text runs', () => {
    const svg = svgDocument('<text>Free (60.0%)</text><text>alt [isWell]</text><text>Uses [HTTPS]</text><text>C1</text>')
    expect(qualifyOutput(workload(['Free', 'isWell', 'HTTPS', 'C1']), svg, 'svg').ok).toBe(true)
  })
  test('does not infer an authored identity from a longer identifier', () => {
    expect(qualifyOutput(workload(['C1']), svgDocument('<text>C10</text>'), 'svg').ok).toBe(false)
    expect(qualifyOutput(workload(['Node 1']), 'Node 12', 'terminal').ok).toBe(false)
  })
  test('metadata, source echoes and attributes do not substitute for visible labels', () => {
    const svg = svgDocument('<metadata><text>Cache</text></metadata><!-- <text>Cache</text> --><defs><text>Cache</text></defs><text>Database</text>', 'viewBox="0 0 100 100" data-label="Cache"')
    expect(qualifyOutput(workload(['Cache']), svg, 'svg').ok).toBe(false)
  })
  test('keeps interleaved values and separate text runs outside generic matching', () => {
    expect(qualifyOutput(workload(['ash (60.0%)']), svgDocument('<text>ash [60] (60.0%)</text>'), 'svg').ok).toBe(false)
    expect(qualifyOutput(workload(['First Second']), svgDocument('<text>First</text><text>Second</text>'), 'svg').ok).toBe(false)
    expect(qualifyOutput(workload(['First Second']), '│ First │\n│ Second │', 'terminal').ok).toBe(false)
  })
  test('reads escaped literal angle brackets and positioned line breaks', () => {
    const svg = svgDocument('<text>&lt;Customer&gt;</text><text><tspan x="0" y="10">First</tspan><tspan x="0" y="20">Second</tspan></text>')
    expect(qualifyOutput(workload(['<Customer>', 'First Second']), svg, 'svg').ok).toBe(true)
  })
  test('accepts a declared empty SVG envelope but never supplies a missing label', () => {
    expect(qualifyOutput(workload([]), '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>', 'svg').ok).toBe(true)
    expect(qualifyOutput(workload(['A']), '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>', 'svg').ok).toBe(false)
    expect(qualifyOutput(workload([]), '<s:svg xmlns:s="http://www.w3.org/2000/svg" viewBox="0 0 1 1"/>', 'svg').ok).toBe(true)
  })
  test('rejects malformed XML, unescaped CSS URLs and foreign or absent SVG namespaces', () => {
    expect(qualifyOutput(workload(['A']), svgDocument('<style>@import url("https://example.test/font?a=1&b=2");</style><text>A</text>'), 'svg').ok).toBe(false)
    expect(qualifyOutput(workload(['A']), svgDocument('<text>A'), 'svg').ok).toBe(false)
    expect(qualifyOutput(workload(['A']), svgDocument('<text>&unknown;</text>'), 'svg').ok).toBe(false)
    expect(qualifyOutput(workload(['A']), '<svg viewBox="0 0 10 10"><text>A</text></svg>', 'svg').ok).toBe(false)
    expect(qualifyOutput(workload(['A']), '<svg xmlns="http://www.w3.org/1999/xhtml" viewBox="0 0 10 10"><text>A</text></svg>', 'svg').ok).toBe(false)
    expect(qualifyOutput(workload(['A']), svgDocument('<style>@import url("https://example.test/font?a=1&amp;b=2");</style><text>A</text>'), 'svg').ok).toBe(true)
  })
  test('requires a positive finite viewBox or explicit dimensions', () => {
    for (const canvas of ['', 'viewBox="0 0 0 10"', 'viewBox="0 0 Infinity 10"', 'width="100%" height="100%"', 'width="10junk" height="10"']) expect(qualifyOutput(workload(['A']), svgDocument('<text>A</text>', canvas), 'svg').ok).toBe(false)
    expect(qualifyOutput(workload(['A']), svgDocument('<text>A</text>', 'width="10px" height="20"'), 'svg').ok).toBe(true)
    expect(qualifyOutput(workload(['A']), svgDocument('<text>A</text>', 'viewBox="-10 -10 20 20" width="100%" height="100%"'), 'svg').ok).toBe(true)
  })
})

test('source code fallbacks never qualify as rendered SVG or terminal diagrams', () => {
  const source = 'flowchart LR\nA[Start] --> B[End]'
  const w = { ...workload(['Start', 'End']), source }
  expect(qualifyOutput(w, '┌────────────────────────────┐\n│ flowchart LR               │\n│ A[Start] --> B[End]         │\n└────────────────────────────┘', 'terminal').ok).toBe(false)
  expect(qualifyOutput(w, svgDocument('<text>flowchart LR</text><text>A[Start] --&gt; B[End]</text>'), 'svg').ok).toBe(false)
  expect(qualifyOutput(w, svgDocument('<metadata>flowchart LR A[Start] --&gt; B[End]</metadata><text>Start</text><text>End</text>'), 'svg').ok).toBe(true)
  expect(qualifyOutput(w, source, 'source').ok).toBe(true)
})

test('community labels refuse to load without the pinned Mermaid oracle, instead of passing cases unchecked', async () => {
  const workload = { id: 'labelled', family: 'flowchart', source: 'flowchart LR\nA[Alpha]', features: [], provenance: 'authored refusal fixture' }
  const saved = { directory: process.env.MERMAID_REFERENCE_DIR, admitted: process.env.TRIDENT_MERMAID_ORACLE }
  process.env.MERMAID_REFERENCE_DIR = join(tmpdir(), 'no-mermaid-oracle-install')
  delete process.env.TRIDENT_MERMAID_ORACLE
  try {
    await expect(withReferenceLabels([workload])).rejects.toThrow('needs the pinned Mermaid oracle')
  } finally {
    for (const [name, value] of [
      ['MERMAID_REFERENCE_DIR', saved.directory],
      ['TRIDENT_MERMAID_ORACLE', saved.admitted],
    ] as const)
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
  }
})

test('wide terminal gutters cannot stall source-echo admission', () => {
  // A real renderer produced 393,651-column lines. Keep the regression bounded
  // outside this process so a quadratic classifier cannot stall the test runner.
  const module = new URL('../unified/qualification-visible-source.ts', import.meta.url).href
  const script = `import {isRenderedSourceEcho} from ${JSON.stringify(module)};
const source='flowchart LR\\nA-->B', gap=' '.repeat(400000);
console.log(JSON.stringify([
 isRenderedSourceEcho(source,'flowchart LR\\n'+gap+'A-->B','terminal'),
 isRenderedSourceEcho(source,'│'+gap+'A → B','terminal'),
 isRenderedSourceEcho(source,'│ flowchart LR │\\n│ A-->B │','terminal')
]));`
  const child = spawnSync(process.execPath, ['--eval', script], { encoding: 'utf8', timeout: 2000, killSignal: 'SIGKILL' })
  expect({ status: child.status, error: child.error?.message }).toEqual({ status: 0, error: undefined })
  expect(JSON.parse(child.stdout)).toEqual([true, false, true])
})

const pngImage = (() => {
  const chunk = (type: string, data: Uint8Array) => {
    const bytes = Buffer.alloc(data.length + 12); bytes.writeUInt32BE(data.length); bytes.write(type, 4); bytes.set(data, 8); bytes.writeUInt32BE(crc32(bytes.subarray(4, -4)), bytes.length - 4); return bytes
  }
  return (scanline: Uint8Array, { depth = 8, color = 6, interlace = 0, width = 2, height = 1 } = {}) => {
    const header = Buffer.alloc(13); header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = depth; header[9] = color; header[12] = interlace
    return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(scanline)), chunk('IEND', new Uint8Array())])
  }
})()

test('PNG admission requires complete decodable pixels and content, not an invented IHDR envelope', () => {
  const image = pngImage
  const painted = image(new Uint8Array([0, 0, 0, 0, 255, 255, 255, 255, 255]))
  expect(qualifyOutput(workload(['Alpha']), painted, 'png')).toMatchObject({ ok: true, scope: 'decoded-raster-content' })
  expect(qualifyOutput(workload(['Alpha']), painted.subarray(0, 33), 'png').ok).toBe(false)
  const corrupt = Buffer.from(painted); corrupt[corrupt.length - 1]! ^= 1
  expect(qualifyOutput(workload(['Alpha']), corrupt, 'png').findings.join(' ')).toContain('CRC')
  const blank = image(new Uint8Array([0, 255, 255, 255, 255, 255, 255, 255, 255]))
  expect(qualifyOutput(workload(['Alpha']), blank, 'png').ok).toBe(false)
  expect(qualifyOutput(workload([]), blank, 'png').ok).toBe(true)
  const transparent = image(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0]))
  expect(qualifyOutput(workload(['Alpha']), transparent, 'png').ok).toBe(false)
  expect(qualifyOutput(workload([]), image(new Uint8Array([0, 0])), 'png').ok).toBe(false)
  expect(qualifyOutput(workload([]), image(new Uint8Array([7, 0, 0, 0, 255, 255, 255, 255, 255])), 'png').ok).toBe(false)
  for (const filter of [1, 2, 3, 4]) {
    const filtered = new Uint8Array([filter, 0, 0, 0, 255, 255, 255, 255, filter === 3 ? 128 : filter === 2 ? 255 : 0])
    expect(qualifyOutput(workload(['Alpha']), image(filtered), 'png').ok).toBe(true)
  }
  expect(qualifyOutput(workload(['Alpha']), image(new Uint8Array([0, 0x40]), { depth: 1, color: 0 }), 'png').scope).toBe('decoded-raster-content')
  expect(qualifyOutput(workload(['Alpha']), image(new Uint8Array([0, 0xc0]), { depth: 1, color: 0 }), 'png').ok).toBe(false)
  const interlaced = new Uint8Array([0, 0, 0, 0, 255, 0, 255, 255, 255, 255])
  expect(qualifyOutput(workload(['Alpha']), image(interlaced, { interlace: 1 }), 'png').ok).toBe(true)
  expect(qualifyOutput(workload(['Alpha']), image(new Uint8Array([0, 255, 255, 255, 255, 0, 255, 255, 255, 255]), { interlace: 1 }), 'png').ok).toBe(false)
  const sixteenBit = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255])
  expect(qualifyOutput(workload(['Alpha']), image(sixteenBit, { depth: 16 }), 'png').ok).toBe(true)
})


test('PNG inspection limits block module and CLI qualification without blaming the renderer', async () => {
  const root = mkdtempSync(join(tmpdir(), 'trident-png-observer-limit-'))
  try {
    const width = 4200, height = 4000, stride = Math.ceil(width / 8) + 1
    const scanlines = Buffer.alloc(stride * height, 255)
    for (let row = 0; row < height; row++) scanlines[row * stride] = 0
    scanlines[1] = 0
    const png = pngImage(scanlines, { width, height, color: 0, depth: 1 })
    expect(qualifyOutput(workload(['Alpha']), png, 'png')).toMatchObject({ ok: false, unavailable: true })
    const file = join(root, 'output.png'), module = join(root, 'index.mjs'), cli = join(root, 'cli.mjs')
    writeFileSync(file, png)
    writeFileSync(join(root, 'package.json'), '{"name":"png-budget-fixture","version":"1.0.0","type":"module"}')
    writeFileSync(module, `import {readFileSync} from 'node:fs';export function render(){return readFileSync(${JSON.stringify(file)})}`)
    writeFileSync(cli, `import {readFileSync} from 'node:fs';process.stdout.write(readFileSync(${JSON.stringify(file)}))`)
    const node = { id: 'fixture/png-limit', roles: ['renderer'], outputs: ['png'], benchmark: { adapter: 'declared', outputs: ['png'], api: { png: { export: 'render' } } } }
    const rows = await runCommunityNodeRound({ node, artifact: { kind: 'node', root, module, version: '1.0.0' } }, 'png', [workload(['Alpha'])], 1, parseOptions(['--out', join(root, 'module'), '--profile', 'smoke']))
    expect(rows[0]).toMatchObject({ status: 'blocked' })
    expect(rows[0]?.samplesMs).toBeUndefined()
    const row = runCommunityCli({ node, artifact: { kind: 'cli', executable: process.env.NODE_BIN ?? 'node', args: [cli], input: 'stdin', format: 'png', version: '1.0.0' } }, 'png', workload(['Alpha']), 1, join(root, 'cli'))
    expect(row.status).toBe('blocked')
    expect(row.findings?.join(' ')).toContain('qualification budget')
  } finally { rmSync(root, { recursive: true, force: true }) }
})
