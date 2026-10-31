import { expect, test } from 'bun:test'
import { interpretTerminal, terminalCellWidth, terminalTextWidth } from '../fidelity/terminal-display.ts'

test('display cells distinguish graphemes, CJK width, variation and combining marks', () => {
  expect(terminalTextWidth('A日本B')).toBe(6)
  expect(terminalTextWidth('Be\u0301ta')).toBe(4)
  expect(terminalCellWidth('👨‍👩‍👧')).toBe(2)
  expect(terminalTextWidth('⚠️')).toBe(2)
  expect(interpretTerminal('A日本B').cells[0]).toEqual(['A', '日', '', '本', '', 'B'])
})
test('cursor moves, carriage return, erasure and saved positions change the actual display', () => {
  expect(interpretTerminal('wrong\rRight\x1b[K').text).toBe('Right')
  expect(interpretTerminal('Alpha\nBeta\x1b[1A\rGamma').text).toBe('Gamma\nBeta')
  expect(interpretTerminal('old\x1b[2J\x1b[Hnew').text).toBe('new')
  expect(interpretTerminal('abc\x1b7\rX\x1b8Z').text).toBe('XbcZ')
  expect(interpretTerminal('abcde\r\x1b[2C\x1b[2X').text).toBe('ab  e')
})
test('concealed and matching-colour ink cannot supply visible labels', () => {
  expect(interpretTerminal('\x1b[8mHidden\x1b[28mVisible').text).toBe('      Visible')
  expect(interpretTerminal('\x1b[31;41mHidden\x1b[0mVisible').text).toBe('      Visible')
  expect(interpretTerminal('\x1b[38;2;1;2;3;48;2;1;2;3mHidden').text).toBe('')
})
test('style and hyperlink metadata do not become drawing text; unsupported state remains unknown', () => {
  expect(interpretTerminal('\x1b[31mRed\x1b[0m').text).toBe('Red')
  expect(interpretTerminal('\x1b]8;;https://example.test\x07Link\x1b]8;;\x07').text).toBe('Link')
  for (const source of ['\x1b[9999999C', '\x1b[5mBlink', '\x1b]52;clipboard\x07', '\x1b[2']) expect(interpretTerminal(source).status).toBe('unavailable')
})
test('wide cells overwritten through either half cannot leave an orphan glyph', () => {
  expect(interpretTerminal('日本\rA').cells[0]).toEqual(['A', ' ', '本', ''])
  expect(interpretTerminal('日\x1b[1DX').cells[0]).toEqual([' ', 'X'])
})
test('an exited alternate screen cannot supply ink that is no longer displayed', () => {
  expect(interpretTerminal('main\x1b[?1049hhidden\x1b[?1049l').text).toBe('main')
  expect(interpretTerminal('\x1b[?1049hactive').text).toBe('active')
  expect(interpretTerminal('\x1b[?1049l').status).toBe('unavailable')
  expect(interpretTerminal('\x1b[20;1H\x1b[8mHidden').text).toBe('')
  expect(interpretTerminal('a\u202eb').status).toBe('unavailable')
})
