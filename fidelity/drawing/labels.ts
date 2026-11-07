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
    // Keep the ambiguity of a visible line-end hyphen: it can belong to the
    // authored word or be inserted by wrapping. Only explicit SVG line moves
    // within one text element qualify; adjacent styled spans/text nodes do not.
    .replace(/<text\b[^>]*>[\s\S]*?<\/text\s*>/gi, text => text.replace(/-\s*<\/tspan>\s*<tspan\b([^>]*)>/gi, (boundary, attributes: string) => {
      const x = /\bx\s*=\s*["'][^"']+["']/i.test(attributes)
      const dy = attributes.match(/\bdy\s*=\s*["']([+-]?(?:\d+(?:\.\d*)?|\.\d+))(?:px|em)?["']/i)?.[1]
      return x && dy !== undefined && Number(dy) !== 0 ? '\u00ad' : boundary
    }))
    .replace(breaks, ' ')
    .replace(/<[^>]+>/g, ' '))
}

export function terminalText(text: string) { return text.replace(ansi, '').replace(boxDrawing, ' ') }

/** Control characters are never visible text. A label written with an escape
 * sequence ("\u001b[31mX") is shown either without the escape character ("[31mX") or
 * without the whole sequence ("X"); a renderer is not required to echo raw control
 * characters to pass. */
const controls = /[\u0000-\u0008\u000b-\u001f\u007f]/g
const visibleForms = (label: string) => [...new Set([label, label.replace(controls, ''), label.replace(ansi, '').replace(controls, '')])].filter(form => form.trim())

/** A label is found when its text appears with whitespace ignored, or, for text
 * wrapped inside a box, when each of its words appears. */
export function labelFound(label: string, text: string) {
  const observed = squash(text.replace(controls, ''))
  const found = (value: string) => {
    const needle = squash(value)
    if (!observed.includes('\u00ad')) return observed.includes(needle)
    const pattern = [...needle].map(char => char === '-' ? '[-\u00ad]' : char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\u00ad?')
    return new RegExp(pattern, 'u').test(observed)
  }
  return visibleForms(label).some(form => found(form) || form.split(/\s+/).filter(Boolean).every(found))
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
  // A chart that names nothing has no label to find, so only the other half of the check
  // applies: no raw Mermaid syntax, including any source statement printed verbatim.
  if (!labels.length) {
    const statements = test.source.split('\n').slice(1).map(line => line.trim()).filter(line => line.length >= 4)
    const leaked = [...leakedSyntax(test, text, format), ...statements.filter(line => squash(text).includes(squash(line)))]
    return leaked.length ? { status: 'incorrect', reason: 'Raw source syntax shown: ' + leaked.join(', '), leaked, labels: 0 } : { status: 'correct', reason: 'No label to find; no raw source syntax shown', labels: 0 }
  }
  const missing = labels.filter(label => !labelFound(label, text))
  const leaked = leakedSyntax(test, text, format)
  if (missing.length || leaked.length) return { status: 'incorrect', reason: [missing.length ? 'Missing labels: ' + missing.join(', ') : '', leaked.length ? 'Raw source syntax shown: ' + leaked.join(', ') : ''].filter(Boolean).join('; '), missing, leaked, labels: labels.length }
  return { status: 'correct', labels: labels.length }
}
