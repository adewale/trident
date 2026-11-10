/**
 * Mechanical admission of a DaveBench output. A public call "completes" only
 * when it returns a usable artefact in the requested format. These checks do
 * not judge drawing meaning (Drawing Correctness does that); they stop an
 * empty return, an echoed source, an error message or an error placeholder
 * from counting as a completed render. Validation runs after the clock stops.
 */

import { svgXmlInspection } from './qualification.ts'
import { inspectPng } from './png-inspection.ts'
import { decodeHTML, decodeHTMLStrict } from 'entities'

export type Validity = { valid: true } | { valid: false; reason: string }

/** Phrases a renderer uses to report failure in place of a drawing. A phrase
 * that also occurs in the Mermaid source is an authored label, not an error. */
const errorPhrases = [
  /\bsyntax error\b/i, /\bparse error\b/i, /\bparsing error\b/i, /\bparser error\b/i, /\brender(?:ing)? error\b/i, /\blexical error\b/i,
  /\bunsupported diagram\b/i, /\bdiagram type\b.*\b(?:not supported|unsupported|unknown)\b/i, /\bunknown diagram\b/i, /\bno diagram type detected\b/i,
  /\bnot (?:yet )?supported\b/i, /\bunsupported\b.*\b(?:syntax|type|diagram|feature)\b/i, /\bfailed to (?:parse|render)\b/i, /\bcould not (?:parse|render)\b/i,
  /\bcannot (?:parse|render)\b/i, /\bunable to (?:parse|render)\b/i, /\bexpecting\b.*\bgot\b/i, /\bunexpected (?:token|character|end of input)\b/i,
  /^\s*(?:\w+)?error\s*[:!]/i, /^\s*exception\b/i, /^\s*traceback\b/i, /^\s*panic(?:ked)?\b/i, /^\s*usage:/i,
]

/** Serializable pattern list for the in-page browser check. */
export const errorPatternSources = errorPhrases.map(pattern => [pattern.source, pattern.flags] as [string, string])

/** Compare diagnostic words with authored text without changing renderer input.
 * Mermaid's #name;/#number; and ordinary HTML entities can spell the same label. */
export function authoredDiagnosticSource(source: string) {
  return decodeHTML(source.replace(/(?<!&)#([A-Za-z][A-Za-z0-9]*);/g, (original, name: string) => {
    const entity = '&' + name + ';'
    return decodeHTMLStrict(entity) === entity ? original : entity
  }).replace(/(?<!&)#(\d+);/g, '&#$1;')).replace(/\s+/g, ' ').trim()
}

export function errorPhrase(text: string, source: string, patterns: RegExp[] = errorPhrases) {
  const head = text.trim().split('\n').slice(0, 3).join('\n').slice(0, 400)
  const authored = authoredDiagnosticSource(source).toLowerCase()
  for (const pattern of patterns) {
    const match = pattern.exec(head)
    if (match && !authored.includes(match[0].trim().toLowerCase())) return match[0].trim()
  }
  return undefined
}

const ansi = /\u001b\[[0-?]*[ -/]*[@-~]|\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)|\u001b[@-Z\\-_]/g
const squash = (text: string) => text.replace(/\s+/g, ' ').trim()

/** Native terminal text: non-empty after removing control sequences, not an
 * error report and not the Mermaid source echoed back unchanged. */
export function terminalTextValidity(value: unknown, source: string): Validity {
  const text = typeof value === 'string' ? value : value instanceof Uint8Array ? new TextDecoder().decode(value) : typeof (value as any)?.output === 'string' ? (value as any).output : typeof (value as any)?.text === 'string' ? (value as any).text : undefined
  if (text === undefined) return { valid: false, reason: 'non-text return' }
  const visible = text.replace(ansi, '')
  if (!visible.trim()) return { valid: false, reason: 'empty output' }
  const phrase = errorPhrase(visible, source)
  if (phrase) return { valid: false, reason: 'error message: ' + phrase }
  if (echoesSource(visible, source)) return { valid: false, reason: 'echoed source' }
  return { valid: true }
}

/** Marks of Mermaid statement syntax: links and arrows, a node id glued to its shape
 * bracket, class/style shorthands, shape data and macro calls. `key: value` is not one:
 * data records (quadrant points, payload fields, legends) are legitimately drawn as
 * written, so a renderer that lists them is not falling back. */
const statementSyntax = /--|==|-\.|\.-|->|<-|~~~|\w[\[\(\{>]|:::|@\{|\w\(/

/**
 * Source statements a drawing does not show verbatim: the diagram's header line and every
 * statement carrying Mermaid syntax (at least 8 characters). A renderer that does not
 * understand a diagram and falls back to drawing its text (most often as a flowchart of
 * the statements, or the source in a box) shows them; a renderer that understood it shows
 * their labels. Left out: prose inside accessibility blocks, class bodies (Mermaid draws
 * members such as `+quack()` verbatim), and any line that also occurs inside another line,
 * since that text is an authored label too (`mindmap` above `root((mindmap))`).
 */
export function rawStatements(source: string) {
  const lines = source.replace(/^\s*---\s*\n[\s\S]*?\n---\s*\n/, '').replace(/%%\{[\s\S]*?\}%%/g, '').split('\n').map(line => squash(line)).filter(line => line && !line.startsWith('%%'))
  if (!lines.length) return { header: undefined, statements: [] as string[] }
  const [header, ...rest] = lines
  const classes = /^classDiagram/.test(header!)
  const body: string[] = []
  let block = 0
  for (const line of rest) {
    const opens = (classes && /^class\b.*\{\s*$/.test(line)) || /^accDescr\s*\{/.test(line)
    if (block) { if (line.startsWith('}')) block--; continue }
    if (opens) { if (!line.includes('}')) block++; continue }
    body.push(line)
  }
  const label = (line: string) => lines.some(other => other !== line && other.includes(line))
  const statements = [...new Set(body.filter(line => line.length >= 8 && statementSyntax.test(line) && !label(line) && !(classes && /^[+\-#~]/.test(line))))]
  return { header: header!.length >= 4 && !label(header!) ? header : undefined, statements }
}

/**
 * Whether visible output is a fallback drawing of the source text: it shows the header
 * line, or at least half of the syntax-bearing statements (and at least three). A few raw
 * statements among real labels are misread labels, which Drawing Correctness judges.
 */
export function fallbackShown(visible: string, raw: ReturnType<typeof rawStatements>) {
  const text = squash(visible.replace(frame, ' '))
  if (raw.header && new RegExp('(?:^|\\s)' + raw.header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:\\s|$)').test(text)) return 'source header shown: ' + raw.header
  const shown = raw.statements.filter(statement => text.includes(statement))
  return shown.length >= 3 && shown.length * 2 >= raw.statements.length ? `${shown.length} of ${raw.statements.length} source statements shown` : undefined
}

/** Visible SVG text: element text joined by spaces, without styles, scripts and the
 * accessibility title, description and metadata, which are not drawn. */
export function svgVisibleText(svg: string) {
  return svg.replace(/<(style|script|title|desc|metadata)\b[\s\S]*?<\/\1\s*>/gi, ' ').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
}

/** DaveBench admission for terminal text: the mechanical checks plus the fallback check. */
export function davebenchTerminalValidity(value: unknown, source: string): Validity {
  const validity = terminalTextValidity(value, source)
  if (!validity.valid) return validity
  const text = typeof value === 'string' ? value : value instanceof Uint8Array ? new TextDecoder().decode(value) : String((value as any)?.output ?? (value as any)?.text)
  const fallback = fallbackShown(text.replace(ansi, ''), rawStatements(source))
  return fallback ? { valid: false, reason: 'fallback render: ' + fallback } : validity
}

/** DaveBench admission for serialized SVG: the mechanical checks plus the fallback check. */
export function davebenchSvgValidity(svg: string, source: string): Validity {
  const validity = svgTextValidity(svg, source)
  if (!validity.valid) return validity
  const fallback = fallbackShown(svgVisibleText(svg), rawStatements(source))
  return fallback ? { valid: false, reason: 'fallback render: ' + fallback } : validity
}

/** Box-drawing and block characters used for frames around fallback text. */
const frame = /[\u2500-\u259F]/g
/**
 * Some renderers print unsupported input back unchanged, sometimes inside a
 * box (`╭ mermaid: pie ─╮ │ pie title Pets │ …`) or a Markdown fence. Ignoring
 * frame characters and fence lines, output that reproduces every non-empty
 * source line verbatim and in order is an echo, not a drawing: a rendered
 * diagram does not contain its own keyword line and raw edge syntax. A framed
 * single-line source counts only with the `mermaid:` fallback header, since one
 * framed label is also what a one-node drawing looks like.
 */
export function echoesSource(visible: string, source: string) {
  const lines = source.split('\n').map(line => squash(line)).filter(Boolean)
  if (!lines.length) return false
  if (squash(visible) === lines.join(' ')) return true
  const text = squash(visible.split('\n').filter(line => !/^\s*(?:```|~~~)/.test(line)).join('\n').replace(frame, ' '))
  // One framed word could be a real one-node drawing; only the fallback header marks it as an echo.
  if (lines.length < 2) return /^mermaid:/i.test(text) && text.replace(/^mermaid:\s*\S*\s*/i, '') === lines[0]
  let position = 0
  for (const line of lines) {
    const index = text.indexOf(line, position)
    if (index < 0) return false
    position = index + line.length
  }
  return true
}

/** Serialized SVG outside a browser (CLI output). The in-page check in
 * davebenchBrowserCall applies the same rules to a parsed document. A sized SVG
 * that draws nothing is admitted: some examples (a Gantt chart with no tasks)
 * may legitimately be empty, and judging that is Drawing Correctness's job. */
export function svgTextValidity(svg: string, source: string): Validity {
  if (typeof svg !== 'string' || !svg.trim()) return { valid: false, reason: 'no SVG document' }
  const parsed = svgXmlInspection(svg)
  if (parsed.findings.length) return { valid: false, reason: parsed.findings.some(reason => reason.includes('positive finite')) ? 'zero-size SVG' : parsed.findings.join('; ') }
  if (parsed.root?.attributes['aria-roledescription'] === 'error') return { valid: false, reason: 'error placeholder' }
  const text = decodeHTML(svg.replace(/<(style|script)\b[\s\S]*?<\/\1\s*>/gi, ' ').replace(/<[^>]+>/g, ' '))
  const phrase = errorPhrase(squash(text), source)
  if (phrase) return { valid: false, reason: 'error message: ' + phrase }
  return { valid: true }
}

/** Decode the PNG after the clock stops, using the existing bounded validator. */
export function pngBytesValidity(bytes: Uint8Array): Validity {
  const result = inspectPng(bytes, 'format')
  return result.findings.length ? { valid: false, reason: result.findings.join('; ') } : { valid: true }
}
