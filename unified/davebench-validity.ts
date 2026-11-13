/**
 * Mechanical admission of a DaveBench output. A public call "completes" only
 * when it returns a usable artefact in the requested format. These checks do
 * not judge drawing meaning (Drawing Correctness does that); they stop an
 * empty return, an echoed source, an error message or an error placeholder
 * from counting as a completed render. Validation runs after the clock stops.
 */

import { svgXmlInspection } from './qualification.ts'
import { inspectPng } from './png-inspection.ts'
import { SVG_NAMESPACE, type SvgInspectionElement } from './svg-text-inspection.ts'
import { decodeHTML, decodeHTMLStrict } from 'entities'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'

/** An admitted SVG that is not strict XML (a browser displays it embedded in HTML)
 * carries the strict parser's first complaint; it is reported, not a failure. */
export type Validity = { valid: true; strictXmlInvalid?: string } | { valid: false; reason: string }

/**
 * Whether an output may draw nothing. `true`: the reviewed source draws nothing, so an
 * empty output is admitted. `false`: the reviewed source draws something, so an empty
 * output is rejected ('draws nothing'). Omitted: no reviewed source; SVG keeps the earlier
 * rule (an empty sized SVG is admitted) and terminal text keeps rejecting empty output.
 */
export interface EmptyOutputRule { drawsNothing?: boolean }

let reviewedIntents: Map<string, string> | undefined
/**
 * The reviewed intent of a documentation source, matched by its exact bytes (SHA-256)
 * against Trident's reviewed docs corpus. 'nothing' for configuration-only sources (for
 * example a Gantt chart that only sets tickInterval and weekday), 'drawing' for every
 * other reviewed source, undefined when no review has these exact bytes.
 */
export function reviewedDrawingIntent(source: string): 'nothing' | 'drawing' | undefined {
  reviewedIntents ??= new Map((JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-reviewed.json.gz', import.meta.url))).toString()) as { sourceSha256: string; intent: string; expected?: { labels?: unknown[]; nodes?: unknown[]; edges?: unknown[]; groups?: unknown[]; facts?: Record<string, unknown> } }[])
    .map(review => {
      const expected = review.expected, drawsNothing = review.intent === 'configuration-only' || review.intent === 'drawing' && !!expected && !expected.labels?.length && !expected.nodes?.length && !expected.edges?.length && !expected.groups?.length && !Object.keys(expected.facts ?? {}).length
      return [review.sourceSha256, drawsNothing ? 'nothing' : 'drawing']
    }))
  return reviewedIntents.get(createHash('sha256').update(source).digest('hex')) as 'nothing' | 'drawing' | undefined
}
/** The reviewed empty-output rule over the corpus, for the results file: the inputs whose
 * reviewed source draws nothing, and how many inputs have no reviewed source. */
export function davebenchEmptyOutputCorpus(cases: readonly { id: string }[], rules: readonly EmptyOutputRule[]) {
  return { drawsNothing: cases.filter((_, index) => rules[index]!.drawsNothing === true).map(input => input.id), emptyOutputUnreviewed: rules.filter(rule => rule.drawsNothing === undefined).length }
}

/** The empty-output rule DaveBench applies to one input. */
export function davebenchEmptyOutputRule(source: string): EmptyOutputRule {
  const intent = reviewedDrawingIntent(source)
  return intent === undefined ? {} : { drawsNothing: intent === 'nothing' }
}

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
/** Characters that draw nothing on a terminal: whitespace, remaining control characters,
 * zero-width characters and the blank braille cell U+2800 that braille canvases fill with. */
const blankTerminal = /[\s\u0000-\u001f\u007f-\u009f\u200b-\u200d\u2060\ufeff\u2800]/g
/** Terminal text draws nothing when only blank characters remain after removing control sequences. */
export const terminalDrawsNothing = (text: string) => !text.replace(ansi, '').replace(blankTerminal, '')

/** Native terminal text: draws something after removing control sequences (unless the
 * reviewed source draws nothing), not an error report and not the Mermaid source echoed
 * back unchanged. */
export function terminalTextValidity(value: unknown, source: string, rule: EmptyOutputRule = {}): Validity {
  const text = typeof value === 'string' ? value : value instanceof Uint8Array ? new TextDecoder().decode(value) : typeof (value as any)?.output === 'string' ? (value as any).output : typeof (value as any)?.text === 'string' ? (value as any).text : undefined
  if (text === undefined) return { valid: false, reason: 'non-text return' }
  const visible = text.replace(ansi, '')
  if (terminalDrawsNothing(visible)) return rule.drawsNothing ? { valid: true } : { valid: false, reason: 'draws nothing' }
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

/** DaveBench admission for terminal text: the mechanical checks, the reviewed empty-output
 * rule for this source, and the fallback check. */
export function davebenchTerminalValidity(value: unknown, source: string): Validity {
  const validity = terminalTextValidity(value, source, davebenchEmptyOutputRule(source))
  if (!validity.valid) return validity
  const text = typeof value === 'string' ? value : value instanceof Uint8Array ? new TextDecoder().decode(value) : String((value as any)?.output ?? (value as any)?.text)
  const fallback = fallbackShown(text.replace(ansi, ''), rawStatements(source))
  return fallback ? { valid: false, reason: 'fallback render: ' + fallback } : validity
}

/** DaveBench admission for serialized SVG: the mechanical checks, the reviewed empty-output
 * rule for this source, and the fallback check. */
export function davebenchSvgValidity(svg: string, source: string): Validity {
  const validity = svgTextValidity(svg, source, davebenchEmptyOutputRule(source))
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

/** Graphic elements that paint when present; containers and references are judged by their content. */
const svgShapes = new Set(['path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'image', 'use'])
/** Subtrees that are never painted in place: definitions, paint servers, resources and metadata. */
const svgUnpainted = new Set(['defs', 'clippath', 'mask', 'marker', 'pattern', 'symbol', 'lineargradient', 'radialgradient', 'filter', 'style', 'script', 'title', 'desc', 'metadata'])
/** A shape that has no geometry (a path without data, a rect without positive size) paints nothing. */
const svgShapeHasGeometry = (name: string, attribute: (name: string) => string | null | undefined) => {
  const positive = (key: string) => { const value = Number.parseFloat(attribute(key) ?? ''); return Number.isFinite(value) && value > 0 }
  if (name === 'path') return !!attribute('d')?.trim()
  if (name === 'polyline' || name === 'polygon') return !!attribute('points')?.trim()
  if (name === 'rect' || name === 'image') return positive('width') && positive('height')
  if (name === 'circle') return positive('r')
  if (name === 'ellipse') return positive('rx') && positive('ry')
  return true
}
/**
 * Whether a parsed SVG draws nothing: no painted shape with geometry and no visible text
 * outside definitions, resources, metadata and elements hidden by display="none" or
 * visibility="hidden". Structural only: CSS and transforms are not evaluated. The in-page
 * check in davebenchBrowserCall applies the same rule to the browser's parsed document.
 */
export function svgDrawsNothing(root: SvgInspectionElement): boolean {
  const draws = (element: SvgInspectionElement): boolean => {
    const name = element.localName.toLowerCase()
    if (svgUnpainted.has(name) || element.attributes.display?.trim() === 'none' || element.attributes.visibility?.trim() === 'hidden') return false
    if (svgShapes.has(name) && svgShapeHasGeometry(name, key => element.attributes[key])) return true
    return element.children.some(child => child.kind === 'text' ? /[^\s\u2800]/.test(child.value) : draws(child))
  }
  return !draws(root)
}

const xlinkNamespace = 'http://www.w3.org/1999/xlink'
const htmlVoidElements = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'])
const xmlPredefinedEntities = new Set(['amp', 'lt', 'gt', 'quot', 'apos'])
const xmlCharacter = (code: number) => code === 0x9 || code === 0xa || code === 0xd || code >= 0x20 && code <= 0xd7ff || code >= 0xe000 && code <= 0xfffd || code >= 0x10000 && code <= 0x10ffff
const xmlName = /^[A-Za-z_:\u00c0-\uffff][\w.:\-\u00b7-\uffff]*$/
const entityReference = /&(?:#(\d{1,8})|#[xX]([0-9a-fA-F]{1,8})|([A-Za-z][A-Za-z0-9]{0,40}))(;?)/y
/** One `&` in HTML text or an attribute value, as XML: HTML named entities become numeric
 * character references and an `&` that starts no valid entity is escaped. */
function xmlEntityAt(text: string, at: number): [string, number] {
  entityReference.lastIndex = at
  const match = entityReference.exec(text)
  if (!match) return ['&amp;', 1]
  const [whole, decimal, hex, name, semicolon] = match
  if (decimal !== undefined || hex !== undefined) {
    const code = Number.parseInt(decimal ?? hex!, decimal !== undefined ? 10 : 16)
    // The HTML parser substitutes U+FFFD for references that are not characters.
    return [xmlCharacter(code) ? `&#${code};` : '&#xFFFD;', whole.length]
  }
  if (semicolon && xmlPredefinedEntities.has(name!)) return [whole, whole.length]
  const decoded = semicolon ? decodeHTMLStrict(whole) : whole
  if (semicolon && decoded !== whole) return [[...decoded].map(character => `&#${character.codePointAt(0)};`).join(''), whole.length]
  return ['&amp;', 1]
}
/** HTML text or attribute content as XML character data. */
const xmlText = (text: string, attribute: boolean) => {
  let out = ''
  for (let index = 0; index < text.length;) {
    const character = text[index]!
    if (character === '&') { const [replacement, length] = xmlEntityAt(text, index); out += replacement; index += length; continue }
    out += character === '<' ? '&lt;' : attribute && character === '"' ? '&quot;' : character
    index++
  }
  return out
}

/**
 * Serialized SVG as a browser reads it when the SVG is embedded in an HTML page, rewritten
 * as XML so the strict parser can inspect it outside a browser. Only HTML-isms the HTML
 * parser accepts are rewritten: HTML named entities (`&nbsp;`) become numeric references,
 * an `&` that starts no entity and a `<` that starts no tag are escaped, attribute values
 * are quoted (valueless attributes get an empty value), duplicate attributes keep the
 * first, void elements are closed, unclosed elements are closed by an ancestor's end tag
 * or at the end, stray end tags are dropped, comments lose `--`, and the SVG and xlink
 * namespaces (which the HTML parser applies itself) and other undeclared prefixes are
 * declared on the root. Well-formed XML is never passed through this.
 */
export function htmlSvgAsXml(text: string): string {
  let out = '', index = 0, rootInsert = -1, rootSeen = false, rootClosed = false
  const stack: string[] = [], usedPrefixes = new Set<string>(), rootDeclared = new Set<string>()
  const space = /\s*/y, tagName = /[^\s/>]+/y, attributeName = /[^\s"'>\/=]+/y, unquoted = /[^\s>]*/y
  const skipSpace = () => { space.lastIndex = index; space.exec(text); index = space.lastIndex }
  const take = (pattern: RegExp) => { pattern.lastIndex = index; const match = pattern.exec(text); if (match) index = pattern.lastIndex; return match?.[0] ?? '' }
  while (index < text.length) {
    const character = text[index]!
    if (character === '&') { const [replacement, length] = xmlEntityAt(text, index); out += replacement; index += length; continue }
    if (character !== '<') {
      let next = index + 1
      while (next < text.length && text[next] !== '<' && text[next] !== '&') next++
      out += text.slice(index, next); index = next; continue
    }
    if (text.startsWith('<!--', index)) {
      const end = text.indexOf('-->', index + 4), body = text.slice(index + 4, end < 0 ? text.length : end)
      out += '<!--' + body.replace(/--/g, '- -').replace(/-$/, '- ') + '-->'; index = end < 0 ? text.length : end + 3; continue
    }
    if (text.startsWith('<![CDATA[', index)) {
      const end = text.indexOf(']]>', index); out += end < 0 ? text.slice(index) + ']]>' : text.slice(index, end + 3); index = end < 0 ? text.length : end + 3; continue
    }
    if (text.startsWith('<?', index) || text.startsWith('<!', index)) {
      const end = text.indexOf(text[index + 1] === '?' ? '?>' : '>', index), stop = end < 0 ? text.length : end + (text[index + 1] === '?' ? 2 : 1)
      // An XML declaration is only valid first and a doctype only before the root; HTML reads either as a comment.
      const declaration = /^<\?xml[\s?]/i.test(text.slice(index, index + 6)), doctype = /^<!doctype/i.test(text.slice(index, index + 9))
      if (declaration ? out === '' : doctype ? !rootSeen : text[index + 1] === '?') out += text.slice(index, stop)
      index = stop; continue
    }
    if (text[index + 1] === '/') {
      const start = index; index += 2
      const name = take(tagName), close = text.indexOf('>', index)
      if (!/^[A-Za-z]/.test(name)) { out += '&lt;'; index = start + 1; continue }
      index = close < 0 ? text.length : close + 1
      const open = stack.findLastIndex(item => item.toLowerCase() === name.toLowerCase())
      if (open < 0) continue
      while (stack.length > open) out += '</' + stack.pop()! + '>'
      if (!stack.length && rootSeen) rootClosed = true
      continue
    }
    if (!/[A-Za-z]/.test(text[index + 1] ?? '')) { out += '&lt;'; index++; continue }
    index++
    const name = take(tagName), attributes = new Map<string, string>()
    let selfClosing = false
    while (index < text.length) {
      skipSpace()
      if (text[index] === '>') { index++; break }
      if (text.startsWith('/>', index)) { selfClosing = true; index += 2; break }
      if (text[index] === '/') { index++; continue }
      const key = take(attributeName) || text[index++]!
      skipSpace()
      let value = ''
      if (text[index] === '=') {
        index++; skipSpace()
        const quote = text[index]
        if (quote === '"' || quote === "'") { const end = text.indexOf(quote, index + 1); value = text.slice(index + 1, end < 0 ? text.length : end); index = end < 0 ? text.length : end + 1 }
        else value = take(unquoted)
      }
      if (!xmlName.test(key) || [...attributes.keys()].some(existing => existing.toLowerCase() === key.toLowerCase())) continue
      attributes.set(key, value)
    }
    const root = !rootSeen && !rootClosed
    for (const key of attributes.keys()) {
      const [prefix, local] = key.includes(':') ? key.split(':', 2) : [undefined, key]
      if (prefix === 'xmlns') { if (root) rootDeclared.add(local!) }
      else if (prefix && prefix !== 'xml') usedPrefixes.add(prefix)
    }
    if (name.includes(':')) usedPrefixes.add(name.split(':')[0]!)
    out += '<' + name
    if (root) { rootSeen = true; rootInsert = out.length; if (name.toLowerCase() === 'svg' && !attributes.has('xmlns')) out += ` xmlns="${SVG_NAMESPACE}"` }
    for (const [key, value] of attributes) out += ` ${key}="${xmlText(value, true)}"`
    if (selfClosing || htmlVoidElements.has(name.toLowerCase())) { out += '/>'; if (root) rootClosed = true }
    else { out += '>'; stack.push(name) }
  }
  while (stack.length) out += '</' + stack.pop()! + '>'
  const declarations = [...usedPrefixes].filter(prefix => !rootDeclared.has(prefix)).map(prefix => ` xmlns:${prefix}="${prefix === 'xlink' ? xlinkNamespace : 'urn:x-trident:undeclared-prefix:' + encodeURIComponent(prefix)}"`).join('')
  return rootInsert < 0 ? out : out.slice(0, rootInsert) + declarations + out.slice(rootInsert)
}

/** A strict parser's first complaint, without positions, for the strict-XML diagnostic. */
const strictXmlReason = (findings: string[]) => (findings[0] ?? 'not strict XML').replace(/^Malformed SVG XML:\s*/, '').replace(/\d+:\d+:\s*/g, '').split(/[;\n]/)[0]!.trim().slice(0, 120)

/**
 * Serialized SVG outside a browser (CLI output, Drawing Correctness). An SVG is admitted
 * when a browser displays it: as strict XML, or as SVG embedded in an HTML page, which
 * htmlSvgAsXml reproduces before the strict parse. Strict-XML failures of admitted SVG are
 * reported in `strictXmlInvalid`, not counted as failures. The in-page check in
 * davebenchBrowserCall applies the same rules to a parsed document. A sized SVG that
 * draws nothing is rejected when the reviewed source draws something, admitted when it
 * draws nothing (a Gantt chart that only sets options), and admitted when no rule is given.
 */
export function svgTextValidity(svg: string, source: string, rule: EmptyOutputRule = {}): Validity {
  if (typeof svg !== 'string' || !svg.trim()) return { valid: false, reason: 'no SVG document' }
  const malformed = (findings: string[]) => findings.some(reason => !reason.includes('positive finite'))
  let parsed = svgXmlInspection(svg), strictXmlInvalid: string | undefined
  if (malformed(parsed.findings)) {
    const lenient = svgXmlInspection(htmlSvgAsXml(svg))
    if (!malformed(lenient.findings)) { strictXmlInvalid = strictXmlReason(parsed.findings); parsed = lenient }
  } else if (parsed.xmlWellFormed === false) strictXmlInvalid = 'unclosed HTML void element'
  if (parsed.findings.length) return { valid: false, reason: parsed.findings.some(reason => reason.includes('positive finite')) ? 'zero-size SVG' : parsed.findings.join('; ') }
  if (parsed.root?.attributes['aria-roledescription'] === 'error') return { valid: false, reason: 'error placeholder' }
  const text = decodeHTML(svg.replace(/<(style|script)\b[\s\S]*?<\/\1\s*>/gi, ' ').replace(/<[^>]+>/g, ' '))
  const phrase = errorPhrase(squash(text), source)
  if (phrase) return { valid: false, reason: 'error message: ' + phrase }
  if (rule.drawsNothing === false && svgDrawsNothing(parsed.root!)) return { valid: false, reason: 'draws nothing' }
  return strictXmlInvalid ? { valid: true, strictXmlInvalid } : { valid: true }
}

/** Decode the PNG after the clock stops, using the existing bounded validator. */
export function pngBytesValidity(bytes: Uint8Array): Validity {
  const result = inspectPng(bytes, 'format')
  return result.findings.length ? { valid: false, reason: result.findings.join('; ') } : { valid: true }
}
