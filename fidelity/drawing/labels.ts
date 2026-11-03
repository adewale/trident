/**
 * Drawing Correctness by labels: cheap, deterministic, and the same for every
 * output format. A case passes when every label its reviewed source facts name
 * appears in the output and no raw Mermaid syntax leaks into it. It does not
 * check edges, arrow direction, layout or styling. PNG is not assessed: OCR
 * misread too many diagram labels to measure renderers rather than the OCR.
 */
import type { DrawingCase } from './corpus.ts'

export type LabelVerdict = { status: 'correct' | 'incorrect' | 'unknown'; reason?: string; missing?: string[]; leaked?: string[]; labels: number }

/** Keys whose string values name something every renderer must show verbatim. */
const labelKeys = new Set(['label', 'title', 'section', 'sections', 'period', 'events', 'authoredId', 'x-categories', 'categories'])

const breaks = /<br\s*\/?>/gi
const entities: Record<string, string> = { '&lt;': '<', '&gt;': '>', '&amp;': '&', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&nbsp;': ' ' }
const decode = (text: string) => text.replace(/&(?:lt|gt|amp|quot|apos|nbsp|#39);/g, m => entities[m]!).replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_m, n) => String.fromCodePoint(Number.parseInt(n, 16)))
/** Markdown emphasis markers in authored labels are formatting, not text. */
const plain = (label: string) => decode(label.replace(breaks, ' ')).replace(/\*\*|__|`/g, '').replace(/(^|\s)[*_](\S)/g, '$1$2').replace(/(\S)[*_](?=\s|$)/g, '$1')

/** Every distinct non-empty label named by the case's reviewed facts. */
export function expectedLabels(test: DrawingCase) {
  const found = new Set<string>()
  const add = (value: unknown) => { if (typeof value === 'string' && plain(value).trim()) found.add(plain(value).trim()) }
  for (const node of test.expected.nodes ?? []) add(node.label)
  for (const edge of test.expected.edges ?? []) add((edge as any).label)
  const walk = (value: unknown, key?: string) => {
    if (Array.isArray(value)) { for (const item of value) walk(item, key); return }
    if (value && typeof value === 'object') { for (const [k, v] of Object.entries(value)) if (k !== 'authored-config') walk(v, k); return }
    if (key && labelKeys.has(key)) add(value)
  }
  walk(test.expected.facts ?? {})
  return [...found]
}

const boxDrawing = /[─-▟⠀-⣿]/g
const ansi = /\u001b\[[0-?]*[ -/]*[@-~]|\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)/g
const squash = (text: string) => text.normalize('NFKC').replace(/\s+/g, '')

/** Visible text of a serialized SVG: text, tspans and HTML labels; styles,
 * scripts, accessibility metadata and definitions excluded. No browser. */
export function svgText(svg: string) {
  return decode(svg
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(style|script|title|desc|metadata|defs)\b[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(breaks, ' ')
    .replace(/<[^>]+>/g, ' '))
}

export function terminalText(text: string) { return text.replace(ansi, '').replace(boxDrawing, ' ') }

/** A label is found when its text appears with whitespace ignored, or, for text
 * wrapped inside a box, when each of its words appears. */
export function labelFound(label: string, text: string) {
  const haystack = squash(text)
  return haystack.includes(squash(label)) || label.split(/\s+/).filter(Boolean).every(token => haystack.includes(squash(token)))
}

/** Raw source syntax that a drawing would never show: the diagram header line,
 * a node definition such as `A[Label]`, or (outside terminal art) a piped
 * edge label `|label|`. */
export function leakedSyntax(test: DrawingCase, text: string, format: 'svg' | 'terminal' = 'svg') {
  const haystack = squash(text), leaks: string[] = []
  const body = test.source.replace(/^---[\s\S]*?\n---\s*\n/, '').split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('%%'))
  const header = body[0]
  if (header && squash(header).length >= 6 && haystack.includes(squash(header))) leaks.push(header)
  for (const node of test.expected.nodes ?? []) {
    if (!node.label || node.id === node.label || /[\/\[\]]/.test(node.id)) continue
    for (const open of ['[', '(', '{', '>']) {
      const raw = squash(node.id + open + plain(node.label))
      if (raw.length >= 5 && haystack.includes(raw)) leaks.push(node.id + open + node.label)
    }
  }
  // Terminal drawings legitimately place edge labels between '|' line characters.
  if (format !== 'terminal') for (const edge of test.expected.edges ?? []) { const label = (edge as any).label; if (label && haystack.includes(squash('|' + plain(label) + '|'))) leaks.push('|' + label + '|') }
  return [...new Set(leaks)]
}

/** The one corpus shape whose correct drawing is empty: no nodes, edges, groups or facts. */
export const expectsEmptyDrawing = (test: DrawingCase) => test.terminal.expected.graph?.nodes.length === 0 && test.terminal.expected.graph.edges.length === 0 && !test.terminal.expected.graph.groups?.length && !test.expected.groups?.length && !Object.keys(test.expected.facts ?? {}).length

export function assessLabels(test: DrawingCase, format: 'svg' | 'terminal', text: string): LabelVerdict {
  const labels = expectedLabels(test)
  if (expectsEmptyDrawing(test)) return squash(text) ? { status: 'incorrect', reason: 'An empty diagram shows text', labels: 0 } : { status: 'correct', labels: 0 }
  if (!labels.length) return { status: 'unknown', reason: 'The reviewed source facts name no labels to check', labels: 0 }
  const missing = labels.filter(label => !labelFound(label, text))
  const leaked = leakedSyntax(test, text, format)
  if (missing.length || leaked.length) return { status: 'incorrect', reason: [missing.length ? 'Missing labels: ' + missing.join(', ') : '', leaked.length ? 'Raw source syntax shown: ' + leaked.join(', ') : ''].filter(Boolean).join('; '), missing, leaked, labels: labels.length }
  return { status: 'correct', labels: labels.length }
}
