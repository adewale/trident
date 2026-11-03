/**
 * Mechanical admission of a DaveBench output. A public call "completes" only
 * when it returns a usable artefact in the requested format. These checks do
 * not judge drawing meaning (Drawing Correctness does that); they stop an
 * empty return, an echoed source, an error message or an error placeholder
 * from counting as a completed render. Validation runs after the clock stops.
 */

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

export function errorPhrase(text: string, source: string, patterns: RegExp[] = errorPhrases) {
  const head = text.trim().split('\n').slice(0, 3).join('\n').slice(0, 400)
  for (const pattern of patterns) {
    const match = pattern.exec(head)
    if (match && !source.toLowerCase().includes(match[0].trim().toLowerCase())) return match[0].trim()
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
  const start = svg.search(/<svg\b/i)
  if (start < 0 || !/<\/svg\s*>\s*$|\/>\s*$/i.test(svg.trim())) return { valid: false, reason: 'no SVG document' }
  const root = /<svg\b[^>]*>/i.exec(svg.slice(start))![0]
  if (/aria-roledescription\s*=\s*["']error["']/i.test(root)) return { valid: false, reason: 'error placeholder' }
  const box = /viewBox\s*=\s*["']\s*[-\d.e]+[\s,]+[-\d.e]+[\s,]+([-\d.e]+)[\s,]+([-\d.e]+)/i.exec(root)
  const size = (name: string) => Number.parseFloat(new RegExp(name + '\\s*=\\s*["\']\\s*([\\d.]+)', 'i').exec(root)?.[1] ?? '')
  const width = box ? Number(box[1]) : size('width'), height = box ? Number(box[2]) : size('height')
  if (!(width > 0 && height > 0)) return { valid: false, reason: 'zero-size SVG' }
  const text = svg.replace(/<(style|script)\b[\s\S]*?<\/\1\s*>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  const phrase = errorPhrase(squash(text), source)
  if (phrase) return { valid: false, reason: 'error message: ' + phrase }
  return { valid: true }
}

/** PNG bytes: signature, IHDR and positive dimensions. */
export function pngBytesValidity(bytes: Uint8Array): Validity {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  if (bytes.length < 33 || signature.some((byte, index) => bytes[index] !== byte)) return { valid: false, reason: 'not a PNG' }
  if (String.fromCharCode(...bytes.subarray(12, 16)) !== 'IHDR') return { valid: false, reason: 'PNG has no IHDR' }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (!(view.getUint32(16) > 0 && view.getUint32(20) > 0)) return { valid: false, reason: 'zero-size PNG' }
  return { valid: true }
}
