import { expect, test } from 'bun:test'
import { Resvg } from '@resvg/resvg-js'
import { crc32, deflateSync } from 'node:zlib'
import { davebenchSvgValidity, davebenchTerminalValidity, errorPhrase, pngBytesValidity, rawStatements, svgTextValidity, terminalTextValidity } from '../unified/davebench-validity.ts'
import { inspectPng, pngChunkBudget } from '../unified/png-inspection.ts'
import { qualifyOutputFormat } from '../unified/qualification.ts'

const png = () => new Resvg('<svg xmlns="http://www.w3.org/2000/svg" width="4" height="3"><rect width="4" height="3"/></svg>').render().asPng()

test('PNG evidence purposes retain full mechanical validation without unused content or identity', () => {
  const bytes = png()
  const format = inspectPng(bytes, 'format'), content = inspectPng(bytes, 'content'), identity = inspectPng(bytes, 'identity')
  expect(format.findings).toEqual([])
  expect(format.visiblePixels).toBeUndefined(); expect(format.pixelIdentity).toBeUndefined()
  expect(content.findings).toContain('PNG has no nonuniform visible diagram content despite declared authored labels')
  expect(content.pixelIdentity).toBeUndefined()
  expect(identity.findings).toEqual([]); expect(identity.pixelIdentity?.sha256).toMatch(/^[a-f0-9]{64}$/)
  for (const purpose of ['format', 'content', 'identity'] as const) expect(inspectPng(bytes.subarray(0, -1), purpose).findings.length).toBeGreaterThan(0)
})
test('PNG ancillary chunk work is bounded independently of encoded bytes', () => {
  const bytes = png(), chunk = Buffer.alloc(12); chunk.write('vpAg', 4); chunk.writeUInt32BE(crc32(chunk.subarray(4, 8)), 8)
  const extended = Buffer.concat([bytes.subarray(0, -12), ...Array(pngChunkBudget).fill(chunk), bytes.subarray(-12)])
  for (const purpose of ['format', 'identity'] as const) expect(inspectPng(extended, purpose)).toMatchObject({ unavailable: true, findings: ['PNG exceeds the declared chunk qualification budget'] })
})

test('terminal admission rejects empty, error and echoed output but keeps real drawings', () => {
  const source = 'graph LR\n  A --> B'
  expect(terminalTextValidity('┌───┐   ┌───┐\n│ A ├──►│ B │\n└───┘   └───┘', source)).toEqual({ valid: true })
  expect(terminalTextValidity('\u001b[31m\u001b[0m  \n', source)).toEqual({ valid: false, reason: 'empty output' })
  expect(terminalTextValidity('Error: unsupported diagram type "pie"', source).valid).toBe(false)
  expect(terminalTextValidity('Syntax error at line 2', source).valid).toBe(false)
  expect(terminalTextValidity('graph LR\n A --> B\n', source)).toEqual({ valid: false, reason: 'echoed source' })
  expect(terminalTextValidity(undefined, source)).toEqual({ valid: false, reason: 'non-text return' })
})

test('source printed back inside a frame or fence is an echo, not a drawing', () => {
  const pie = 'pie title Pets\n  "Dogs" : 386\n  "Cats" : 85\n'
  // Observed fallback output from two terminal CLIs for unsupported input.
  const boxed = '╭ mermaid: pie ──╮\n│ pie title Pets │\n│   "Dogs" : 386 │\n│   "Cats" : 85  │\n╰────────────────╯\n'
  expect(terminalTextValidity(boxed, pie)).toEqual({ valid: false, reason: 'echoed source' })
  expect(terminalTextValidity('```mermaid\n' + boxed + '```\n', pie)).toEqual({ valid: false, reason: 'echoed source' })
  expect(terminalTextValidity('╭ mermaid: info ─╮\n│ info │\n╰──────╯', 'info')).toEqual({ valid: false, reason: 'echoed source' })
  // A real drawing repeats labels, never the keyword line and raw edge syntax.
  const flow = 'flowchart LR\n  A --> B\n'
  expect(terminalTextValidity('```mermaid\n┌───┐    ┌───┐\n│ A ├───▶│ B │\n└───┘    └───┘\n```', flow)).toEqual({ valid: true })
  expect(terminalTextValidity('     Pets\n  Dogs ███████ 386\n  Cats ██ 85', pie)).toEqual({ valid: true })
  expect(terminalTextValidity('┌──────┐\n│ root │\n└──────┘', 'root')).toEqual({ valid: true })
})

test('an error phrase that the source itself contains is an authored label, not a failure', () => {
  const source = 'flowchart LR\n  A[Syntax error] --> B'
  expect(errorPhrase('┌──────────────┐\n│ Syntax error │', source)).toBeUndefined()
  expect(terminalTextValidity('┌──────────────┐\n│ Syntax error ├─►B', source)).toEqual({ valid: true })
  expect(errorPhrase('Syntax error in text', 'flowchart LR\n A --> B')).toBe('Syntax error')
})

test('serialized SVG admission needs a sized svg root and no error placeholder; an empty drawing is not an error', () => {
  const source = 'graph LR\n  A --> B'
  expect(svgTextValidity('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><rect width="10" height="10"/><text>A</text></svg>', source)).toEqual({ valid: true })
  expect(svgTextValidity('<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M0 0L1 1"/></svg>\n', source)).toEqual({ valid: true })
  expect(svgTextValidity('', source)).toEqual({ valid: false, reason: 'no SVG document' })
  expect(svgTextValidity('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 0 0"><rect/></svg>', source)).toEqual({ valid: false, reason: 'zero-size SVG' })
  expect(svgTextValidity('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17 17"><g/></svg>', 'gantt\n  weekday monday')).toEqual({ valid: true })
  expect(svgTextValidity('<svg xmlns="http://www.w3.org/2000/svg" aria-roledescription="error" viewBox="0 0 9 9"><path/></svg>', source)).toEqual({ valid: false, reason: 'error placeholder' })
  expect(svgTextValidity('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 20"><style>.error{}</style><text>Parse error on line 1</text></svg>', source).valid).toBe(false)
  expect(svgTextValidity('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><g></svg>', source).valid).toBe(false)
  expect(svgTextValidity('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><text>&nbsp;</text></svg>', source).valid).toBe(false)
  expect(svgTextValidity('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><text>&#160;</text></svg>', source).valid).toBe(true)
  expect(svgTextValidity('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><a xlink:href="#a"><text>A</text></a></svg>', source).valid).toBe(false)
  expect(svgTextValidity('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="10" height="10"><a xlink:href="#a"><text>A</text></a></svg>', source).valid).toBe(true)
})

test('PNG admission decodes complete image data instead of trusting a plausible header', () => {
  const bytes = png()
  expect(pngBytesValidity(bytes)).toEqual({ valid: true })
  expect(pngBytesValidity(bytes.subarray(0, 33)).valid).toBe(false)
  expect(pngBytesValidity(new TextEncoder().encode('not an image at all, but long enough')).valid).toBe(false)
})

test('APNG format admission decodes its default image without certifying animation content', () => {
  const chunk = (type: string, data: Uint8Array) => {
    const bytes = Buffer.alloc(data.length + 12); bytes.writeUInt32BE(data.length); bytes.write(type, 4); bytes.set(data, 8); bytes.writeUInt32BE(crc32(bytes.subarray(4, -4)), bytes.length - 4); return bytes
  }
  const image = (scanline = new Uint8Array([0, 0, 0, 0, 255, 255, 255, 255, 255])) => {
    const header = Buffer.alloc(13); header.writeUInt32BE(2); header.writeUInt32BE(1, 4); header[8] = 8; header[9] = 6
    const animation = Buffer.alloc(8); animation.writeUInt32BE(2)
    const frame = (sequence: number) => { const data = Buffer.alloc(26); data.writeUInt32BE(sequence); data.writeUInt32BE(2, 4); data.writeUInt32BE(1, 8); data.writeUInt16BE(1, 20); data.writeUInt16BE(10, 22); return chunk('fcTL', data) }
    const next = Buffer.concat([Buffer.from([0, 0, 0, 2]), deflateSync(new Uint8Array([0, 255, 255, 255, 255, 0, 0, 0, 255]))])
    return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('acTL', animation), frame(0), chunk('IDAT', deflateSync(scanline)), frame(1), chunk('fdAT', next), chunk('IEND', new Uint8Array())])
  }
  const bytes = image()
  expect(pngBytesValidity(bytes)).toEqual({ valid: true })
  expect(qualifyOutputFormat(bytes, 'png')).toEqual({ ok: true, findings: [], scope: 'format-only' })
  expect(inspectPng(bytes, 'content')).toMatchObject({ unavailable: true, scope: 'binary-envelope', findings: ['Animated PNG needs a frame-specific content observer'] })
  expect(inspectPng(bytes, 'format').pixelIdentity).toBeUndefined()
  expect(pngBytesValidity(image(new Uint8Array([0]))).valid).toBe(false)
  const corrupt = Buffer.from(bytes); corrupt[corrupt.length - 13]! ^= 1
  expect(pngBytesValidity(corrupt).valid).toBe(false)
})

test('a fallback render drawn from the source text is not a completion', () => {
  const block = 'block\n  a b c\n'
  // The header keyword drawn as a node: the renderer did not understand the family.
  expect(davebenchSvgValidity('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 20"><title>block-beta diagram</title><text>block</text><text>a</text><text>b</text></svg>', block)).toEqual({ valid: false, reason: 'fallback render: source header shown: block' })
  // Accessibility title and description are not drawn, so they do not count.
  expect(davebenchSvgValidity('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 20"><desc>flowchart diagram</desc><text>Hello</text><text>World</text></svg>', 'flowchart\n  Hello --> World')).toEqual({ valid: true })
  const flow = 'flowchart LR\n  A[Start] --> B{Ready?}\n  B -->|yes| C(Go)\n  B -->|no| A'
  expect(davebenchTerminalValidity('┌──────────────────────┐\n│ A[Start] --> B{Ready?} │\n│ B -->|yes| C(Go)      │\n│ B -->|no| A           │\n└──────────────────────┘', flow)).toEqual({ valid: false, reason: 'fallback render: 3 of 3 source statements shown' })
  expect(davebenchTerminalValidity('┌───────┐   ┌────────┐ yes ┌────┐\n│ Start ├──►│ Ready? ├────►│ Go │\n└───────┘   └────────┘     └────┘', flow)).toEqual({ valid: true })
  // Data records drawn as written are not a fallback: a legend repeating quadrant points.
  const quadrant = 'quadrantChart\n  title Reach\n  Campaign A: [0.3, 0.6]\n  Campaign B: [0.45, 0.23]\n  Campaign C: [0.57, 0.69]'
  expect(davebenchTerminalValidity('     Reach\n┌────┬────┐\n│  ● │ ●  │\n└────┴────┘\n● Campaign A: [0.3, 0.6]\n● Campaign B: [0.45, 0.23]\n● Campaign C: [0.57, 0.69]', quadrant)).toEqual({ valid: true })
  // One or two misread labels among an understood drawing are Drawing Correctness's business.
  expect(davebenchTerminalValidity('root((mindmap)) ──┬─ Origins\n                  ╰─ ::icon(fa fa-book)', 'mindmap\nroot((mindmap))\n  Origins\n  ::icon(fa fa-book)')).toEqual({ valid: true })
})

test('raw statements leave out authored labels, accessibility prose and class members', () => {
  expect(rawStatements('mindmap\nroot((mindmap))\n  A').header).toBeUndefined()
  expect(rawStatements('classDiagram\n  class Duck {\n    +quack()\n  }\n  Animal <|-- Duck').statements).toEqual(['Animal <|-- Duck'])
  expect(rawStatements('graph LR\n  accDescr {\n    A simple flow: one step\n  }\n  A[Start] --> B[End]').statements).toEqual(['A[Start] --> B[End]'])
  expect(rawStatements('---\ntitle: T\n---\n%%{init: {}}%%\nsequenceDiagram\n  Alice->>Bob: Hi').header).toBe('sequenceDiagram')
  // Data fields inside { … } blocks are drawn as written; other syntax inside blocks still counts.
  expect(rawStatements("eventmodeling\ntf 01 cmd AddItem [[AddItem01]]\ndata AddItem01 {\n  description: 'john'\n  price: 20.4\n}").statements).toEqual([])
  expect(rawStatements('stateDiagram-v2\n  state Busy {\n    Working --> Waiting\n  }').statements).toEqual(['Working --> Waiting'])
})
