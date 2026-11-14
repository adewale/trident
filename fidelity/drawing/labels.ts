/**
 * Drawing Correctness by labels: cheap, deterministic, and the same for every
 * output format. A case passes when every label its reviewed source facts name
 * appears in the output and no raw Mermaid syntax leaks into it. It does not
 * check edges, arrow direction, layout or styling. PNG is not assessed: OCR
 * misread too many diagram labels to measure renderers rather than the OCR.
 */
import type { DrawingCase } from './corpus.ts'
import { isFontDependentClipping, observeSvgLabelEvidence, type SvgLabelEvidence } from './svg-label-observer.ts'
import { inspectEmptySvgDrawing } from './empty.ts'
import { interpretTerminal } from '../terminal-display.ts'
import { terminalRectangles, TerminalRectangleBudgetExceeded } from '../terminal-rectangles.ts'
import { observeGlyphWitness, type GlyphWitnessResult } from './svg-glyph-witness.ts'

export type LabelVerdict = { status: 'correct' | 'incorrect' | 'unknown'; reason?: string; missing?: string[]; leaked?: string[]; labels: number; evidence?: { checks: SvgLabelEvidence[]; glyphWitness?: GlyphWitnessResult } }
export const labelPolicy = 'drawing-reviewed-labels-v3'
export interface LabelPlan {
  readonly caseId: string
  readonly source: string
  readonly policy: typeof labelPolicy
  readonly required: readonly { readonly role: 'node' | 'edge' | 'group' | 'fact' | 'authored'; readonly text: string }[]
  readonly labels: readonly string[]
  readonly forbidden: Readonly<Record<'svg' | 'terminal', readonly Readonly<{ match: string; label: string }>[]>>
  readonly unlabeledStatements: readonly string[]
  readonly empty: boolean
  readonly unavailable?: string
}

/** Keys whose string values name something every renderer must show verbatim. */
const labelKeys = new Set(['label', 'title', 'section', 'sections', 'period', 'events', 'authoredId', 'x-categories', 'categories'])
const labelFamilies = new Set(['architecture', 'block', 'c4', 'class', 'er', 'flowchart', 'gantt', 'gitgraph', 'journey', 'kanban', 'mindmap', 'packet', 'pie', 'quadrant', 'sequence', 'state', 'timeline', 'treemap', 'xychart', 'zenuml'])

const breaks = /<br\s*\/?>/gi
const entities: Record<string, string> = { '&lt;': '<', '&gt;': '>', '&amp;': '&', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&nbsp;': ' ' }
const decode = (text: string) => text.replace(/&(?:lt|gt|amp|quot|apos|nbsp|#39);/g, m => entities[m]!).replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_m, n) => String.fromCodePoint(Number.parseInt(n, 16)))
/** Markdown emphasis markers in authored labels are formatting, not text. */
const plain = (label: string) => decode(label.replace(breaks, ' ')).replace(/\*\*|__|`/g, '').replace(/(^|\s)[*_](\S)/g, '$1$2').replace(/(\S)[*_](?=\s|$)/g, '$1')

/** Every distinct non-empty label named by the case's reviewed facts. */
export function compileLabelPlan(test: DrawingCase): LabelPlan {
  const required: { role: 'node' | 'edge' | 'group' | 'fact' | 'authored'; text: string }[] = []
  const add = (value: unknown, role: typeof required[number]['role']) => { const text = typeof value === 'string' ? plain(value).trim() : ''; if (text) required.push(Object.freeze({ role, text })) }
  for (const node of test.expected.nodes ?? []) add(node.label, 'node')
  for (const edge of test.expected.edges ?? []) add((edge as any).label, 'edge')
  for (const group of test.expected.groups ?? []) add(group.label, 'group')
  const walk = (value: unknown, key?: string) => {
    if (Array.isArray(value)) { for (const item of value) walk(item, key); return }
    if (value && typeof value === 'object') { for (const [k, v] of Object.entries(value)) if (k !== 'authored-config') walk(v, k); return }
    if (key && labelKeys.has(key)) add(value, 'fact')
  }
  walk(test.expected.facts ?? {})
  // The reviewed label inventory is authoritative even when a fact uses a new
  // field name. Field-name reflection must not silently shrink the obligations.
  for (const label of test.expected.labels ?? []) { const text = plain(label).trim(); if (!required.some(item => item.text === text)) add(label, 'authored') }
  const unavailable = !labelFamilies.has(test.family) ? 'No reviewed label plan for family ' + test.family : test.sourceGaps?.length ? test.sourceGaps.join('; ') : undefined
  return Object.freeze({ caseId: test.id, source: test.source, policy: labelPolicy, required: Object.freeze(required), labels: Object.freeze([...new Set(required.map(label => label.text))]), forbidden: compileForbiddenSyntax(test), unlabeledStatements: Object.freeze(test.source.split('\n').slice(1).map(line => line.trim()).filter(line => line.length >= 4)), empty: expectsEmptyDrawing(test), ...(unavailable ? { unavailable } : {}) })
}
export function expectedLabels(test: DrawingCase) { return [...compileLabelPlan(test).labels] }

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

export function terminalText(text: string) {
  const display = interpretTerminal(text)
  const wrapped = display.status === 'available' ? terminalRectangles(display.cells, { horizontal: /^[─┬┴┼+\-]+$/, vertical: /^[│|├┤┼+]$/, primitives: true, ports: true, cornerPorts: true }, terminalLabelWorkBudget).map(box => box.lines.join(' ')) : []
  return [text.replace(ansi, '').replace(boxDrawing, ' '), ...wrapped].join('\n')
}

export const terminalLabelWorkBudget = 1_000_000

/** Control characters are never visible text. A label written with an escape
 * sequence ("\u001b[31mX") is shown either without the escape character ("[31mX") or
 * without the whole sequence ("X"); a renderer is not required to echo raw control
 * characters to pass. */
const controls = /[\u0000-\u0008\u000b-\u001f\u007f]/g
const visibleForms = (label: string) => [...new Set([label, label.replace(controls, ''), label.replace(ansi, '').replace(controls, '')])].filter(form => form.trim())

/** Preserve label order. Terminal wrapping is joined within actual frames above. */
export function labelFound(label: string, text: string) {
  const haystack = squash(text.replace(controls, ''))
  return visibleForms(label).some(form => haystack.includes(squash(form)))
}

/** Raw source syntax that a drawing would never show: the diagram header line,
 * a node definition such as `A[Label]`, or (outside terminal art) a piped
 * edge label `|label|`. */
function compileForbiddenSyntax(test: DrawingCase): LabelPlan['forbidden'] {
  const common: { match: string; label: string }[] = [], svg: { match: string; label: string }[] = []
  const body = test.source.replace(/^---[\s\S]*?\n---\s*\n/, '').split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('%%'))
  const header = body[0]
  if (header && squash(header).length >= 6) common.push({ match: squash(header), label: header })
  for (const node of test.expected.nodes ?? []) {
    if (!node.label || node.id === node.label || /[\/\[\]]/.test(node.id)) continue
    for (const open of ['[', '(', '{', '>']) {
      const raw = squash(node.id + open + plain(node.label))
      if (raw.length >= 5) common.push({ match: raw, label: node.id + open + node.label })
    }
  }
  // Terminal drawings legitimately place edge labels between '|' line characters.
  for (const edge of test.expected.edges ?? []) { const label = (edge as any).label; if (label) svg.push({ match: squash('|' + plain(label) + '|'), label: '|' + label + '|' }) }
  const terminal = Object.freeze(common.map(pattern => Object.freeze(pattern)))
  return Object.freeze({ terminal, svg: Object.freeze([...terminal, ...svg.map(pattern => Object.freeze(pattern))]) })
}
export function leakedSyntax(test: DrawingCase, text: string, format: 'svg' | 'terminal' = 'svg', plan = compileLabelPlan(test)) {
  if (plan.caseId !== test.id || plan.source !== test.source) throw Error('Label plan belongs to another case/source')
  const haystack = squash(text)
  return [...new Set(plan.forbidden[format].filter(pattern => haystack.includes(pattern.match)).map(pattern => pattern.label))]
}

/** The one corpus shape whose correct drawing is empty: no nodes, edges, groups or facts. */
export const expectsEmptyDrawing = (test: DrawingCase) => test.terminal.expected.graph?.nodes.length === 0 && test.terminal.expected.graph.edges.length === 0 && !test.terminal.expected.graph.groups?.length && !test.expected.groups?.length && !Object.keys(test.expected.facts ?? {}).length

export function assessLabels(test: DrawingCase, format: 'svg' | 'terminal', text: string, plan = compileLabelPlan(test)): LabelVerdict {
  if (plan.caseId !== test.id || plan.source !== test.source) throw Error('Label plan belongs to another case/source')
  const labels = plan.labels
  if (plan.unavailable) return { status: 'unknown', reason: plan.unavailable, labels: labels.length }
  if (plan.empty) return squash(text) ? { status: 'incorrect', reason: 'An empty diagram shows text', labels: 0 } : { status: 'correct', labels: 0 }
  // A chart that names nothing has no label to find, so only the other half of the check
  // applies: no raw Mermaid syntax, including any source statement printed verbatim.
  if (!labels.length) {
    const haystack = squash(text), leaked = [...leakedSyntax(test, text, format, plan), ...plan.unlabeledStatements.filter(line => haystack.includes(squash(line)))]
    return leaked.length ? { status: 'incorrect', reason: 'Raw source syntax shown: ' + leaked.join(', '), leaked, labels: 0 } : { status: 'correct', reason: 'No label to find; no raw source syntax shown', labels: 0 }
  }
  const missing = labels.filter(label => !labelFound(label, text))
  const leaked = leakedSyntax(test, text, format, plan)
  if (missing.length || leaked.length) return { status: 'incorrect', reason: [missing.length ? 'Missing labels: ' + missing.join(', ') : '', leaked.length ? 'Raw source syntax shown: ' + leaked.join(', ') : ''].filter(Boolean).join('; '), missing, leaked, labels: labels.length }
  return { status: 'correct', labels: labels.length }
}

/** Display rows of a terminal capture with each character's display column.
 * Box-drawing and control characters become blanks, as in terminalText. */
function terminalRows(output: string): { text: string; columns: number[] }[] {
  const display = interpretTerminal(output)
  if (display.status !== 'available') return output.replace(ansi, '').replace(boxDrawing, ' ').replace(controls, ' ').split('\n').map(line => { const text = line.normalize('NFKC'); return { text, columns: [...text].flatMap((character, index) => Array(character.length).fill(index)) } })
  return display.cells.map(cells => {
    let text = ''
    const columns: number[] = []
    cells.forEach((cell, column) => { if (!cell) return; const visible = cell.normalize('NFKC').replace(boxDrawing, ' ').replace(controls, ' '); text += visible; for (let n = 0; n < visible.length; n++) columns.push(column) })
    return { text, columns }
  })
}
const wordCharacter = /[\p{L}\p{N}]/u
const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
/** A label that the ordinary rules do not find can still be drawn across rows outside
 * a walled rectangle: on an edge, in a diamond or a round node. Its words then cannot
 * be bound to one owner, so the case is unknown rather than missing. Evidence is
 * deliberately narrow, so that common words scattered over a drawing never qualify:
 * the label has at least two words; its words appear whole and in reading order as
 * whitespace-separated runs on two or more successive display rows, at most one row
 * apart; each run overlaps the previous run's columns; and inside the band of columns
 * those runs span, the rows (a skipped row included) hold no other letters or digits. */
export function wrappedLabelWordsPresent(label: string, rows: readonly { text: string; columns: number[] }[]) {
  return visibleForms(label).some(form => {
    const words = form.normalize('NFKC').split(/\s+/).filter(Boolean)
    if (words.length < 2) return false
    type Run = { row: number; first: number; last: number; start: number; end: number; offset: number; length: number }
    const runs = new Map<string, Run[]>(), at = (row: number, first: number) => runs.get(row + ':' + first) ?? []
    const edge = (word: string, end: boolean) => wordCharacter.test(end ? [...word].at(-1)! : [...word][0]!)
    rows.forEach((row, index) => {
      for (let first = 0; first < words.length; first++) for (let last = first; last < words.length; last++) {
        const pattern = (edge(words[first]!, false) ? '(?<![\\p{L}\\p{N}])' : '') + words.slice(first, last + 1).map(escapeRegExp).join('\\s+') + (edge(words[last]!, true) ? '(?![\\p{L}\\p{N}])' : '')
        for (const match of row.text.matchAll(new RegExp(pattern, 'gu'))) {
          const run = { row: index, first, last, offset: match.index, length: match[0].length, start: row.columns[match.index]!, end: row.columns[match.index + match[0].length - 1]! + 1 }
          const key = index + ':' + first
          if (runs.has(key)) runs.get(key)!.push(run); else runs.set(key, [run])
        }
      }
    })
    // No other letter or digit may share the rows, including a skipped row, inside the
    // runs' column band.
    const clean = (chain: Run[]) => {
      const start = Math.min(...chain.map(run => run.start)), end = Math.max(...chain.map(run => run.end))
      const owned = new Map(chain.map(run => [run.row, run]))
      for (let row = chain[0]!.row; row <= chain.at(-1)!.row; row++) {
        const { text, columns } = rows[row]!, run = owned.get(row)
        for (let n = 0; n < text.length; n++) if ((!run || n < run.offset || n >= run.offset + run.length) && columns[n]! >= start && columns[n]! < end && wordCharacter.test(String.fromCodePoint(text.codePointAt(n)!))) return false
      }
      return true
    }
    const extend = (chain: Run[]): boolean => {
      const tail = chain.at(-1)!
      if (tail.last === words.length - 1) return chain.length > 1 && clean(chain)
      return [tail.row + 1, tail.row + 2].some(row => at(row, tail.last + 1).some(run => run.start < tail.end && tail.start < run.end && extend([...chain, run])))
    }
    return rows.some((_row, index) => at(index, 0).some(run => extend([run])))
  })
}

export function assessTerminalLabels(test: DrawingCase, output: string, plan = compileLabelPlan(test)): LabelVerdict {
  try {
    const verdict = assessLabels(test, 'terminal', terminalText(output), plan)
    // Leaked syntax stays a failure; only labels that are otherwise missing qualify.
    if (verdict.status !== 'incorrect' || verdict.leaked?.length || !verdict.missing?.length) return verdict
    const rows = terminalRows(output), unowned = verdict.missing.filter(label => wrappedLabelWordsPresent(label, rows))
    if (!unowned.length) return verdict
    const note = unowned.map(label => 'Label ' + JSON.stringify(label) + ': its words are present in reading order on successive rows but not contiguous, so ownership cannot be established').join('; ')
    const absent = verdict.missing.filter(label => !unowned.includes(label))
    if (absent.length) return { ...verdict, reason: 'Missing labels: ' + absent.join(', ') + '; ' + note }
    return { status: 'unknown', reason: note, labels: verdict.labels }
  } catch (error) {
    if (!(error instanceof TerminalRectangleBudgetExceeded)) throw error
    return { status: 'unknown', labels: expectedLabels(test).length, reason: error.message }
  }
}

/** SVG passes require measured paint or a complete actual-glyph raster witness. */
export async function assessSvgLabels(test: DrawingCase, page: any, svg: string, plan = compileLabelPlan(test)): Promise<LabelVerdict> {
  const text = assessLabels(test, 'svg', svgText(svg), plan), labels = plan.labels
  if (plan.unavailable) return text
  if (plan.empty) {
    const empty = await inspectEmptySvgDrawing(page, test)
    return { status: empty.status, labels: 0, reason: [...empty.failed, ...empty.unknown].join('; ') || undefined }
  }
  const observe = (labels: readonly string[]) => observeSvgLabelEvidence(page, test.family, labels)
  let rasterWitness = false
  if (labels.length) {
    // The lexical and painted checks use the same visible forms of control-
    // bearing labels. Each alternative must satisfy every paint criterion;
    // evidence for different forms cannot be combined into a passing label.
    // Ordinary labels keep the existing single batched observation.
    const visible = labels.map(visibleForms), obligations = visible.some(alternatives => alternatives.length > 1)
      ? visible.map(alternatives => alternatives.map(form => [form]))
      : [[labels]]
    for (const alternatives of obligations) {
      let matched = false, failedChecks: SvgLabelEvidence[] | undefined
      let unresolved: { checks: SvgLabelEvidence[]; witness: Extract<GlyphWitnessResult, { status: 'unassessed' }> } | undefined
      const failed = new Set<string>()
      for (const forms of alternatives) {
        const checks = await observe(forms), failures = checks.filter(check => check.status === 'failed')
        if (failures.length) { for (const check of failures) failed.add(check.criterion); failedChecks ??= checks; continue }
        if (checks.every(check => check.status === 'passed')) { matched = true; break }
        const witness = await observeGlyphWitness(page, forms)
        if (witness.status === 'proved') { rasterWitness = true; matched = true; break }
        unresolved ??= { checks, witness }
      }
      if (matched) continue
      if (unresolved) {
        const { checks, witness } = unresolved, unavailable = checks.filter(check => check.status !== 'passed').map(check => check.criterion)
        const environment = checks.filter(isFontDependentClipping).map(check => check.scope)
        return { status: 'unknown', labels: labels.length, reason: `Unresolved SVG label evidence: ${unavailable.join(', ')}; ${environment.map(scope => scope + '; ').join('')}glyph ${witness.kind} during ${witness.stage}: ${witness.reason}`, evidence: { checks, glyphWitness: witness } }
      }
      return { status: 'incorrect', labels: labels.length, reason: [...failed].join('; '), evidence: { checks: failedChecks! } }
    }
  }
  // A serialized leak is a nomination, not proof of paint. Failure to match
  // it cannot prove absence across fragments, references or hidden duplicates.
  for (const leak of text.leaked ?? []) {
    const checks = await observe([leak])
    if (checks.every(check => check?.status === 'passed')) return { status: 'incorrect', labels: labels.length, leaked: [leak], reason: 'Raw source syntax shown: ' + leak }
    return { status: 'unknown', labels: labels.length, reason: 'Visibility of possible raw source syntax is unassessed' }
  }
  return { status: 'correct', labels: labels.length, ...(rasterWitness ? { reason: 'Authored glyphs preserve their independently isolated raster ink, contrast and canvas containment' } : {}) }
}
