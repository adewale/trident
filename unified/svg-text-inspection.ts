/** No runtime imports, parsing, rendering, or DOM mutation.
 * Host adapters supply an independently parsed XML tree. This proves authored
 * text retention within the admitted namespaces, not CSS/paint visibility. */
export const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
export const XHTML_NAMESPACE = 'http://www.w3.org/1999/xhtml'

export interface SvgInspectionText {
  kind: 'text'
  value: string
}
export interface SvgInspectionElement {
  kind: 'element'
  localName: string
  namespaceURI: string
  attributes: Record<string, string>
  children: SvgInspectionNode[]
}
export type SvgInspectionNode = SvgInspectionElement | SvgInspectionText

/** HTML's void elements, which HTML serializes without a closing slash. */
const HTML_VOID = /<(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)\b([^<>]*?)\/?>/gi
/** Close HTML void elements, so HTML-serialized markup is otherwise judged as strict XML. */
export const closeHtmlVoidElements = (markup: string): string => markup.replace(HTML_VOID, '<$1$2/>')

export const normalizeAuthoredText = (value: string): string => value.replace(/\s+/gu, ' ').trim()
const inert = new Set(['defs', 'metadata', 'title', 'desc', 'style', 'script'])
const excluded = (node: SvgInspectionElement): boolean => inert.has(node.localName.toLowerCase())

/** Decorations are admitted only around a complete authored token. Thus
 * Free matches Free(60), while C1 does not match C10. No case transformation,
 * arbitrary substring, source parsing, or output-derived expectations occur. */
export function containsAuthoredLabel(run: string, authoredLabel: string, markdown = false): boolean {
  const text = normalizeAuthoredText(run)
  return authoredLabelForms(authoredLabel, markdown).some(label => !label || new RegExp(`(?<![\\p{L}\\p{N}\\p{M}_])${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}\\p{M}_])`, 'u').test(text))
}

/** Markdown strings draw strong/emphasis as formatting, not marker characters. Only
 * delimiter pairs around non-space text are removed (underscores never inside a word);
 * every other character, including code-span backticks, is kept. */
function markdownDisplayText(label: string): string {
  let text = label,
    previous: string
  do {
    previous = text
    text = text
      .replace(/\*\*(?=\S)(.+?)(?<=\S)\*\*/gu, '$1')
      .replace(/(?<![\p{L}\p{N}\p{M}_])__(?=\S)(.+?)(?<=\S)__(?![\p{L}\p{N}\p{M}_])/gu, '$1')
      .replace(/(?<!\*)\*(?=[^\s*])(.+?)(?<=[^\s*])\*(?!\*)/gu, '$1')
      .replace(/(?<![\p{L}\p{N}\p{M}_])_(?=[^\s_])(.+?)(?<=[^\s_])_(?![\p{L}\p{N}\p{M}_])/gu, '$1')
  } while (text !== previous)
  return text
}
/** Literal by default: punctuation is authored content unless its oracle/fixture declares Markdown. */
export const authoredLabelForms = (label: string, markdown = false): string[] => [...new Set([normalizeAuthoredText(label), ...(markdown ? [normalizeAuthoredText(markdownDisplayText(label))] : [])])]

function content(node: SvgInspectionNode, insideForeignObject: boolean, positionedLines: boolean): string {
  if (node.kind === 'text') return node.value
  if (excluded(node)) return ''
  const svg = node.namespaceURI === SVG_NAMESPACE
  const html = insideForeignObject && node.namespaceURI === XHTML_NAMESPACE
  if (!svg && !html) return ''
  if (html && node.localName.toLowerCase() === 'br') return ' '
  const foreign = insideForeignObject || (svg && node.localName === 'foreignObject')
  let previousY: number | undefined
  return node.children
    .map(child => {
      let boundary = ''
      if (positionedLines && child.kind === 'element' && child.namespaceURI === SVG_NAMESPACE && child.localName === 'tspan' && !excluded(child)) {
        const absolute = Number.parseFloat(child.attributes.y ?? ''),
          parsedDy = Number.parseFloat(child.attributes.dy ?? '0'),
          dy = Number.isFinite(parsedDy) ? parsedDy : 0,
          currentY = Number.isFinite(absolute) ? absolute : previousY === undefined ? undefined : previousY + dy
        if (child.attributes.x !== undefined && (dy !== 0 || (previousY !== undefined && currentY !== undefined && currentY !== previousY))) boundary = ' '
        previousY = currentY
      }
      return boundary + content(child, foreign, positionedLines)
    })
    .join('')
}

const coordinate = (value: string | undefined): number | undefined => (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?(?:px)?$/i.test(value?.trim() ?? '') ? Number.parseFloat(value!) : undefined)
const lineStyle = ['class', 'style', 'transform', 'text-anchor', 'font-family', 'font-size', 'font-weight', 'writing-mode', 'direction', 'dominant-baseline', 'alignment-baseline'] as const
/** Resolve the inline/presentation subset only; CSS stylesheets remain unmeasured. */
function fontSize(node: SvgInspectionElement, inherited: number | undefined): number | undefined {
  const value = /(?:^|;)\s*font-size:\s*([^;]+)/.exec(node.attributes.style ?? '')?.[1] ?? node.attributes['font-size']
  if (value === undefined) return inherited
  const size = coordinate(value) ?? (inherited !== undefined && /^[+]?(?:\d+(?:\.\d*)?|\.\d+)em$/i.test(value.trim()) ? Number.parseFloat(value) * inherited : undefined)
  return size !== undefined && Number.isFinite(size) && size > 0 ? size : undefined
}
/** Scalar positioning of the first glyph. A first tspan's positioning overrides
 * its text parent's values. Unsupported lists/units and per-span transforms do
 * not provide enough evidence to join independently positioned text rows. */
function lineOrigin(node: SvgInspectionElement, inheritedSize: number | undefined): { x: number; y: number; size: number } | undefined {
  const first = node.children.find(child => child.kind === 'element' || child.value.trim()),
    tspan = first?.kind === 'element' && first.namespaceURI === SVG_NAMESPACE && first.localName === 'tspan' ? first : undefined,
    size = fontSize(node, inheritedSize),
    spanSize = tspan ? fontSize(tspan, size) : size
  if (spanSize === undefined || tspan?.children.some(child => child.kind === 'element')) return undefined
  const position = (element: SvgInspectionElement | undefined, name: string): number | undefined => {
    const value = element?.attributes[name],
      fontSize = element === tspan ? spanSize : size
    return coordinate(value) ?? (fontSize !== undefined && /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)em$/i.test(value?.trim() ?? '') ? Number.parseFloat(value!) * fontSize : undefined)
  }
  for (const element of [node, tspan]) {
    if (!element) continue
    if (element.attributes.rotate !== undefined || (element === tspan && element.attributes.transform !== undefined)) return undefined
    for (const name of ['x', 'y', 'dx', 'dy']) if (element.attributes[name] !== undefined && position(element, name) === undefined) return undefined
  }
  const x = position(tspan, 'x') ?? position(node, 'x'),
    y = position(tspan, 'y') ?? position(node, 'y'),
    dx = position(tspan, 'dx') ?? position(node, 'dx') ?? 0,
    dy = position(tspan, 'dy') ?? position(node, 'dy') ?? 0
  return x === undefined || y === undefined || !Number.isFinite(x + dx) || !Number.isFinite(y + dy) ? undefined : { x: x + dx, y: y + dy, size: spanSize }
}
/** One label wrapped into sibling <text> rows: adjacent (nothing but whitespace between),
 * the same x and text styling, each row below the last and within two font sizes
 * of it. Resolve inline/presentation sizes through ancestors; other siblings stay separate. */
function wrappedLines(parent: SvgInspectionElement, inheritedSize: number | undefined): SvgInspectionElement[][] {
  const blocks: SvgInspectionElement[][] = []
  let block: SvgInspectionElement[] = [],
    last: { x: number; y: number; size: number } | undefined
  const close = () => {
    if (block.length > 1) blocks.push(block)
    block = []
    last = undefined
  }
  for (const child of parent.children) {
    if (child.kind === 'text') {
      if (child.value.trim()) close()
      continue
    }
    const origin = child.namespaceURI === SVG_NAMESPACE && child.localName === 'text' ? lineOrigin(child, inheritedSize) : undefined
    if (!origin) {
      close()
      continue
    }
    const previous = block.at(-1)
    if (!previous || !last || origin.x !== last.x || origin.y <= last.y || origin.y - last.y > 2 * Math.min(origin.size, last.size) || lineStyle.some(name => previous.attributes[name] !== child.attributes[name])) close()
    block.push(child)
    last = origin
  }
  close()
  return blocks
}

export interface SvgTextInspection {
  runs: string[]
  /** Maximal text containers in document order, without duplicate child runs.
   * Source-echo admission uses these, rather than joining overlapping variants. */
  primaryRuns: string[]
  /** Path/image/use candidates cannot establish whether missing DOM labels are absent. */
  opaqueLabelCandidates: boolean
  missingLabels: string[]
  scope: 'namespace-aware-authored-text-retention; CSS-and-paint-visibility-unmeasured'
}

export function inspectSvgText(root: SvgInspectionElement, expectedLabels: readonly string[] = [], markdownLabels: readonly string[] = []): SvgTextInspection {
  const runs = new Set<string>(),
    primaryRuns: string[] = []
  const add = (text: string): void => {
    const normalized = normalizeAuthoredText(text)
    if (normalized) runs.add(normalized)
  }
  const visit = (node: SvgInspectionNode, insideForeignObject: boolean, insideTextContainer: boolean, inheritedSize: number | undefined): void => {
    if (node.kind === 'text') {
      if (insideForeignObject) add(node.value)
      return
    }
    if (excluded(node)) return
    const svg = node.namespaceURI === SVG_NAMESPACE,
      html = insideForeignObject && node.namespaceURI === XHTML_NAMESPACE
    if (!svg && !html) return
    const foreign = insideForeignObject || (svg && node.localName === 'foreignObject'),
      container = svg && ['text', 'tspan', 'foreignObject'].includes(node.localName),
      size = fontSize(node, inheritedSize)
    if (container) {
      const plain = content(node, foreign, false),
        positioned = content(node, foreign, true)
      add(plain)
      add(positioned)
      if (!insideTextContainer) primaryRuns.push(normalizeAuthoredText(positioned))
    }
    if (!container) for (const block of wrappedLines(node, size)) add(block.map(line => content(line, foreign, true)).join(' '))
    for (const child of node.children) visit(child, foreign, insideTextContainer || container, size)
  }
  visit(root, false, false, 16)
  const opaqueInk = (node: SvgInspectionNode): boolean => node.kind === 'element' && !excluded(node) && (node.namespaceURI === SVG_NAMESPACE && (node.localName === 'path' && !!node.attributes.d?.trim() || ['image', 'use'].includes(node.localName) && !!(node.attributes.href ?? node.attributes['xlink:href'])) || node.children.some(opaqueInk))
  // Paths/raster/use can encode glyphs without machine-readable text. Their
  // presence supplies neither a missing-label verdict nor positive OCR proof.
  const opaqueLabelCandidates = opaqueInk(root)
  return {
    runs: [...runs],
    primaryRuns,
    opaqueLabelCandidates,
    missingLabels: expectedLabels.filter(label => ![...runs].some(run => containsAuthoredLabel(run, label, markdownLabels.includes(label)))),
    scope: 'namespace-aware-authored-text-retention; CSS-and-paint-visibility-unmeasured',
  }
}
