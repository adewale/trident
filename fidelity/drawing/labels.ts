/**
 * Drawing Correctness by labels: cheap, deterministic, and the same for every
 * output format. A case passes when every label its reviewed source facts name
 * appears in the output and no raw Mermaid syntax leaks into it. It does not
 * check edges, arrow direction, layout or styling.
 */
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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

/** Flatten transparency onto white (Tesseract reads transparent pixels as
 * black), invert dark backgrounds and scale small diagram text up. Two variants
 * are written: plain grayscale, and a binarized copy in which light fills and
 * box borders do not swamp dark text. Each reads labels the other misses. */
const prepareForOcr = `import sys
from PIL import Image
image = Image.open(sys.argv[1]).convert('RGBA')
flat = Image.new('RGBA', image.size, (255, 255, 255, 255))
flat.alpha_composite(image)
flat = flat.convert('L')
if sorted(flat.getdata())[flat.width * flat.height // 2] < 128:
    flat = flat.point(lambda p: 255 - p)
def save(img, scale, path):
    if max(img.size) * scale > 8000: scale = 1
    img = img.resize((img.width * scale, img.height * scale), Image.BICUBIC)
    framed = Image.new('L', (img.width + 60, img.height + 60), 255)
    framed.paste(img, (30, 30))
    framed.save(path)
save(flat, 3, sys.argv[2])
save(flat.point(lambda p: 255 if p > 150 else 0), 3, sys.argv[3])
`

/** OCR of a PNG with Tesseract: the union of text read from both prepared
 * variants in the page modes that work best for each. */
export function pngText(png: Uint8Array, tesseract = 'tesseract', python = 'python3') {
  const dir = mkdtempSync(join(tmpdir(), 'trident-labels-'))
  try {
    const original = join(dir, 'original.png'), plainFile = join(dir, 'plain.png'), binaryFile = join(dir, 'binary.png')
    writeFileSync(original, png)
    const prepared = spawnSync(python, ['-c', prepareForOcr, original, plainFile, binaryFile], { encoding: 'utf8', timeout: 20_000 })
    if (prepared.error || prepared.status !== 0) throw Error('OCR preparation failed: ' + (prepared.error?.message ?? prepared.stderr.slice(0, 200)))
    return ([[plainFile, '3'], [plainFile, '12'], [binaryFile, '11'], [binaryFile, '6']] as const).map(([file, mode]) => {
      const result = spawnSync(tesseract, [file, 'stdout', '--psm', mode], { encoding: 'utf8', timeout: 20_000, maxBuffer: 16 * 1024 * 1024 })
      if (result.error || result.status !== 0) throw Error('OCR failed: ' + (result.error?.message ?? result.stderr.slice(0, 200)))
      return result.stdout
    }).join('\n')
  } finally { rmSync(dir, { recursive: true, force: true }) }
}

const editDistance = (a: string, b: string) => {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0]!; row[0] = i
    for (let j = 1; j <= b.length; j++) { const current = row[j]!; row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1)); previous = current }
  }
  return row[b.length]!
}

/** A label is found when its text appears with whitespace ignored, or, for text
 * wrapped inside a box, when each of its words appears. OCR text also allows one
 * character error in words of four or more characters, ignoring case. */
export function labelFound(label: string, text: string, ocr = false) {
  const norm = (value: string) => ocr ? squash(value).toLowerCase() : squash(value)
  const haystack = norm(text)
  if (haystack.includes(norm(label))) return true
  const words = text.normalize('NFKC').split(/\s+/).filter(Boolean).map(word => ocr ? word.toLowerCase() : word)
  return label.split(/\s+/).filter(Boolean).every(token => {
    const want = norm(token)
    if (haystack.includes(want)) return true
    return ocr && want.length >= 4 && words.some(word => Math.abs(word.length - want.length) <= 1 && editDistance(word.replace(/[^\p{L}\p{N}]/gu, ''), want) <= 1)
  })
}

/** Raw source syntax that a drawing would never show: the diagram header line,
 * a node definition such as `A[Label]`, or (outside terminal art) a piped
 * edge label `|label|`. */
export function leakedSyntax(test: DrawingCase, text: string, format: 'svg' | 'png' | 'terminal' = 'svg') {
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

/** Labels whose script Tesseract's English model cannot read. */
const latinOnly = (label: string) => /^[\p{Script=Latin}\p{N}\p{P}\p{S}\s]*$/u.test(label)

/** The one corpus shape whose correct drawing is empty: no nodes, edges, groups or facts. */
export const expectsEmptyDrawing = (test: DrawingCase) => test.terminal.expected.graph?.nodes.length === 0 && test.terminal.expected.graph.edges.length === 0 && !test.terminal.expected.graph.groups?.length && !test.expected.groups?.length && !Object.keys(test.expected.facts ?? {}).length

export function assessLabels(test: DrawingCase, format: 'svg' | 'png' | 'terminal', text: string): LabelVerdict {
  const labels = expectedLabels(test)
  if (expectsEmptyDrawing(test)) return squash(text) ? { status: 'incorrect', reason: 'An empty diagram shows text', labels: 0 } : { status: 'correct', labels: 0 }
  if (!labels.length) return { status: 'unknown', reason: 'The reviewed source facts name no labels to check', labels: 0 }
  const ocr = format === 'png'
  const checkable = ocr ? labels.filter(latinOnly) : labels
  if (!checkable.length) return { status: 'unknown', reason: 'Every expected label uses a script the OCR model cannot read', labels: labels.length }
  const missing = checkable.filter(label => !labelFound(label, text, ocr))
  // OCR noise produces spurious bracket sequences; raw syntax is checked in SVG and terminal text.
  const leaked = ocr ? [] : leakedSyntax(test, text, format)
  if (missing.length || leaked.length) return { status: 'incorrect', reason: [missing.length ? 'Missing labels: ' + missing.join(', ') : '', leaked.length ? 'Raw source syntax shown: ' + leaked.join(', ') : ''].filter(Boolean).join('; '), missing, leaked, labels: labels.length }
  if (checkable.length < labels.length) return { status: 'unknown', reason: 'Some expected labels use a script the OCR model cannot read; the readable ones are present', labels: labels.length }
  return { status: 'correct', labels: labels.length }
}
