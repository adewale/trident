import { expect, test } from 'bun:test'
import { errorPhrase, pngBytesValidity, svgTextValidity, terminalTextValidity } from '../unified/davebench-validity.ts'

const png = (width: number, height: number) => {
  const bytes = new Uint8Array(33)
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52])
  new DataView(bytes.buffer).setUint32(16, width); new DataView(bytes.buffer).setUint32(20, height)
  return bytes
}

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
  expect(svgTextValidity('<svg viewBox="0 0 100 50"><rect width="10" height="10"/><text>A</text></svg>', source)).toEqual({ valid: true })
  expect(svgTextValidity('<?xml version="1.0"?>\n<svg width="20" height="20"><path d="M0 0L1 1"/></svg>\n', source)).toEqual({ valid: true })
  expect(svgTextValidity('', source)).toEqual({ valid: false, reason: 'no SVG document' })
  expect(svgTextValidity('<svg viewBox="0 0 0 0"><rect/></svg>', source)).toEqual({ valid: false, reason: 'zero-size SVG' })
  expect(svgTextValidity('<svg viewBox="0 0 17 17"><g/></svg>', 'gantt\n  weekday monday')).toEqual({ valid: true })
  expect(svgTextValidity('<svg aria-roledescription="error" viewBox="0 0 9 9"><path/></svg>', source)).toEqual({ valid: false, reason: 'error placeholder' })
  expect(svgTextValidity('<svg viewBox="0 0 90 20"><style>.error{}</style><text>Parse error on line 1</text></svg>', source).valid).toBe(false)
})

test('PNG admission checks the signature and positive IHDR dimensions', () => {
  expect(pngBytesValidity(png(4, 3))).toEqual({ valid: true })
  expect(pngBytesValidity(png(0, 3))).toEqual({ valid: false, reason: 'zero-size PNG' })
  expect(pngBytesValidity(new TextEncoder().encode('not an image at all, but long enough'))).toEqual({ valid: false, reason: 'not a PNG' })
})
