import type { MeaningExpectation } from './meaning.ts'
import type { PaintCheck, PaintEvidence } from './paint.ts'

/** Every independently declared fact is an obligation. An unsupported fact must
 * remain in the plan; a successful labels/topology check cannot stand in for it. */
export const plannedSourceFactCriteria = (input: { expected: MeaningExpectation }) => Object.keys(input.expected.facts ?? {}).sort().map(key => 'source-fact:' + key)

/** A stronger, independently qualified projection may replace an unavailable
 * generic projection. It cannot discard a contrary observed result. */
export function mergePaintChecks(...groups: readonly PaintCheck[][]): PaintCheck[] {
  const indexed = new Map<string, PaintCheck>()
  for (const check of groups.flat()) {
    const previous = indexed.get(check.criterion)
    if (!previous) { indexed.set(check.criterion, check); continue }
    if (previous.status === 'unavailable' && check.status !== 'unavailable') { indexed.set(check.criterion, { ...check, scope: check.scope + ' Earlier unavailable projection: ' + previous.scope }); continue }
    if (previous.status !== 'unavailable' && check.status === 'unavailable') continue
    if (previous.status !== check.status) throw Error('Qualified SVG observers disagree on ' + check.criterion + ': ' + previous.status + ' versus ' + check.status)
    indexed.set(check.criterion, { ...previous, scope: previous.scope + ' Additional agreeing projection: ' + check.scope })
  }
  return [...indexed.values()]
}

/** Runs against retained, mounted SVG. These checks qualify only the named
 * source-fact profiles; unsupported semantics explicitly remain unavailable. */
export function inspectSourceFacts(input: { family: string; source: string; expected: MeaningExpectation; paint: PaintEvidence; quantitative: PaintCheck[] }): PaintCheck[] {
  const svg = document.querySelector('svg'), checks: PaintCheck[] = [], facts: any = input.expected.facts ?? {}
  const add = (key: string, actual: unknown, passed: boolean | null, scope: string) => checks.push({ criterion: 'source-fact:' + key, expected: facts[key], actual, status: passed === null ? 'unavailable' : passed ? 'passed' : 'failed', scope })
  const normalize = (value: string) => value.normalize('NFC').replace(/\s+/g, ' ').trim()
  let uncertainPaint = false
  const uncertainElements = new Set<Element>()
  const color = document.createElement('canvas').getContext('2d')!
  const alpha = (value: string) => { if (value === 'none' || value === 'transparent') return 0; if (/url\(|var\(|context-/.test(value)) { uncertainPaint = true; return null }; color.clearRect(0, 0, 1, 1); color.fillStyle = value; color.fillRect(0, 0, 1, 1); return color.getImageData(0, 0, 1, 1).data[3]! / 255 }
  const visible = (element: Element) => {
    for (let parent: Element | null = element; parent; parent = parent.parentElement) {
      const css = getComputedStyle(parent)
      if (['defs', 'marker', 'clipPath', 'mask', 'title', 'desc'].includes(parent.localName) || css.display === 'none' || ['hidden', 'collapse'].includes(css.visibility) || Number(css.opacity) === 0) return false
      if (css.filter !== 'none' || css.maskImage !== 'none' || css.clipPath !== 'none') { uncertainPaint = true; uncertainElements.add(element); return false }
      if (parent === svg) break
    }
    const b = element.getBoundingClientRect(), css = getComputedStyle(element)
    const fill = alpha(element.namespaceURI === 'http://www.w3.org/2000/svg' ? css.fill : css.color), stroke = alpha(css.stroke)
    if (fill === null || stroke === null) uncertainElements.add(element)
    return b.width > 0 && b.height > 0 && (fill !== null && fill * Number(css.fillOpacity) > 0 || stroke !== null && stroke * Number(css.strokeOpacity) > 0 && Number.parseFloat(css.strokeWidth) > 0)
  }
  const allText = svg ? [...svg.querySelectorAll('text,foreignObject p,foreignObject span,foreignObject div')] : []
  const text = allText.filter(element => visible(element) && ![...element.children].some(child => visible(child) && normalize(child.textContent ?? '') === normalize(element.textContent ?? '')))
  const label = (value: string) => text.filter(element => normalize(element.textContent ?? '') === normalize(value))
  const nodes = input.paint.nodes as { id: string; label: string; box: { x: number; y: number; width: number; height: number } }[]
  const nodeById = new Map(nodes.map(node => [node.id, node]))
  const checkById = new Map([...input.paint.checks, ...input.quantitative].map(check => [check.criterion, check]))
  const inside = (outer: { x: number; y: number; width: number; height: number }, inner: DOMRect) => inner.x >= outer.x - 1.5 && inner.y >= outer.y - 1.5 && inner.right <= outer.x + outer.width + 1.5 && inner.bottom <= outer.y + outer.height + 1.5
  // Structural rows need their own paint proof, including fields that were not
  // chosen as the case's convenient display labels. Bounding boxes alone do
  // not prove that a member/type/key is visible through clipping or covers.
  const rowPaint = (elements: Element[]) => elements.every(element => {
    const box = element.getBoundingClientRect()
    if (!svg || !inside(svg.getBoundingClientRect(), box)) return false
    for (let parent: Element | null = element; parent; parent = parent.parentElement) {
      const css = getComputedStyle(parent), outer = parent.getBoundingClientRect()
      if (css.clipPath !== 'none' || css.maskImage !== 'none' || css.filter !== 'none' || css.clip !== 'auto' || css.mixBlendMode !== 'normal' || ['hidden', 'clip'].includes(css.overflowX) && !inside(outer, box) || ['hidden', 'clip'].includes(css.overflowY) && !inside(outer, box)) return false
      if (parent === svg) break
    }
    for (const cover of svg.querySelectorAll('rect,circle,ellipse,polygon,path,image,use,foreignObject')) {
      if (cover.contains(element) || element.contains(cover) || !(element.compareDocumentPosition(cover) & Node.DOCUMENT_POSITION_FOLLOWING)) continue
      if (!visible(cover) && !uncertainElements.has(cover)) continue
      const other = cover.getBoundingClientRect(), css = getComputedStyle(cover)
      if (!['image', 'use', 'foreignObject'].includes(cover.localName) && (alpha(css.fill) === 0 || Number(css.fillOpacity) === 0)) continue
      if (Math.min(box.right, other.right) - Math.max(box.x, other.x) > .5 && Math.min(box.bottom, other.bottom) - Math.max(box.y, other.y) > .5) return false
    }
    return true
  })
  const ownedText = (id: string) => {
    const node = nodeById.get(id)
    return node ? text.filter(element => inside(node.box, element.getBoundingClientRect())) : null
  }
  const bodyText = (id: string, elements: Element[] | null) => {
    const node = nodeById.get(id)
    const header = elements?.filter(element => normalize(element.textContent ?? '') === normalize(node!.label)).sort((a, b) => a.getBoundingClientRect().y - b.getBoundingClientRect().y)[0]
    return elements?.filter(element => element !== header) ?? []
  }
  const ambiguousOwnedText = (id: string) => { const node = nodeById.get(id); return !node || allText.some(element => uncertainElements.has(element) && inside(node.box, element.getBoundingClientRect())) }
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
  for (const key of Object.keys(facts).sort()) {
    if (!svg) { add(key, null, null, 'No mounted SVG is available for the required source fact'); continue }
    if (['accessibility-title', 'accessibility-description'].includes(key) && typeof facts[key] === 'string') {
      const attribute = key === 'accessibility-title' ? 'aria-labelledby' : 'aria-describedby', direct = key === 'accessibility-title' ? 'aria-label' : 'aria-description'
      const references = (svg.getAttribute(attribute) ?? '').trim().split(/\s+/).filter(Boolean), targets = references.map(id => document.getElementById(id))
      const resolved = references.length ? targets.every(target => target && svg.contains(target)) : svg.hasAttribute(direct)
      const actual = references.length && resolved ? targets.map(target => target!.textContent ?? '').join(' ') : !references.length ? svg.getAttribute(direct) : null
      add(key, { attribute: references.length ? attribute : direct, references, text: actual }, resolved ? normalize(actual ?? '') === normalize(facts[key]) : false, 'The actual standalone SVG accessibility name/description must resolve through its own ARIA references or direct attribute. Arbitrary generated IDs and unrelated metadata earn no credit; this is not a screen-reader compatibility certification')
      continue
    }
    if (key === 'title' && typeof facts.title === 'string') {
      const clipping = checkById.get('unclipped-authored-labels'), clippedTitle = Array.isArray(clipping?.actual) && clipping.actual.includes(facts.title)
      const found = label(facts.title), root = svg.getBoundingClientRect()
      const outsideContent = found.filter(element => {
        const b = element.getBoundingClientRect(), p = { x: b.x + b.width / 2, y: b.y + b.height / 2 }
        return ![...nodes, ...(input.paint.groups ?? [])].some(owner => p.x >= owner.box.x - 1 && p.x <= owner.box.x + owner.box.width + 1 && p.y >= owner.box.y - 1 && p.y <= owner.box.y + owner.box.height + 1) && b.x >= root.x - 1.5 && b.y >= root.y - 1.5 && b.right <= root.right + 1.5 && b.bottom <= root.bottom + 1.5
      })
      add(key, { visibleOccurrences: found.length, unownedTitleOccurrences: outsideContent.length, clipped: clippedTitle }, clippedTitle ? false : clipping?.status !== 'passed' ? null : outsideContent.length === 1 ? true : uncertainPaint ? null : false, 'The literal title needs its own visible, unclipped occurrence inside the canvas and outside authored node/group bodies. SVG metadata, a borrowed node label, hidden text and positive but clipped bounds supply no title credit')
      continue
    }
    if (key === 'members' && input.family === 'class' && Array.isArray(facts.members)) {
      // The colon before a displayed return type is presentation punctuation;
      // visibility, names, argument/return types and access modifiers remain.
      const canonical = (value: string) => normalize(value).replace(/\)\s*:\s*/g, ') ')
      const actual = facts.members.map((entry: any) => {
        const elements = ownedText(entry.id)
        return { id: entry.id, elements, values: elements ? bodyText(entry.id, elements).map(element => normalize(element.textContent ?? '')).filter(Boolean).map(canonical).sort() : null }
      }).sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)))
      const expected = facts.members.map((entry: any) => ({ id: entry.id, values: Array.isArray(entry.values) ? entry.values.map((value: any) => canonical(String(value))).sort() : null })).sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)))
      const profile = expected.every((entry: any) => Array.isArray(entry.values) && entry.values.every((value: string) => !/[~$*]|<<|>>/.test(value))) && actual.every((entry: any) => entry.elements && !ambiguousOwnedText(entry.id) && rowPaint(entry.elements))
      add(key, actual.map(({ elements: _, ...entry }: any) => entry), profile ? same(expected, actual.map(({ elements: _, ...entry }: any) => entry)) : null, 'Exact visible member multiset within each independently owned class body, including access, arguments and return types. Only return-type colon punctuation is normalized. Generic, abstract/static decorations, clipped/covered rows and unowned bodies need additional qualified projections')
      continue
    }
    if (key === 'attributes' && input.family === 'er' && Array.isArray(facts.attributes)) {
      const actual = facts.attributes.map((entry: any) => {
        const elements = ownedText(entry.id), content = bodyText(entry.id, elements)
        const rows: { y: number; height: number; cells: { x: number; text: string }[] }[] = []
        for (const element of [...content].sort((a, b) => a.getBoundingClientRect().y - b.getBoundingClientRect().y)) {
          const box = element.getBoundingClientRect(), y = box.y + box.height / 2
          const row = rows.find(row => Math.abs(row.y - y) <= Math.max(1.5, Math.min(row.height, box.height) * .35))
          const cell = { x: box.x, text: normalize(element.textContent ?? '') }
          if (row) row.cells.push(cell); else rows.push({ y, height: box.height, cells: [cell] })
        }
        const values = rows.map(row => {
          const cells = row.cells.sort((a, b) => a.x - b.x).map(cell => cell.text), keys = cells[2] && /^(?:PK|FK|UK)(?:\s*,\s*(?:PK|FK|UK))*$/.test(cells[2]) ? cells[2].split(/\s*,\s*/) : []
          return { type: cells[0], name: cells[1], keys, ...(cells.length > (keys.length ? 3 : 2) ? { comment: cells[keys.length ? 3 : 2] } : {}), ...(cells.length < 2 || cells.length > (keys.length ? 4 : 3) ? { unresolved: cells } : {}) }
        })
        return { id: entry.id, elements, values }
      }).sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)))
      const canonical = (entries: any[]) => entries.map(entry => ({ id: entry.id, values: entry.values.map((value: any) => ({ type: normalize(String(value.type)), name: normalize(String(value.name)), keys: [...value.keys].sort(), ...(value.comment !== undefined ? { comment: normalize(String(value.comment)) } : {}) })) })).sort((a, b) => String(a.id).localeCompare(String(b.id)))
      const profile = facts.attributes.every((entry: any) => Array.isArray(entry.values) && entry.values.every((value: any) => typeof value.type === 'string' && typeof value.name === 'string' && Array.isArray(value.keys))) && actual.every((entry: any) => entry.elements && !ambiguousOwnedText(entry.id) && rowPaint(entry.elements) && entry.values.every((value: any) => !value.unresolved))
      add(key, actual.map(({ elements: _, ...entry }: any) => entry), profile ? same(canonical(facts.attributes), canonical(actual)) : null, 'Complete entity-owned attribute rows are read geometrically in row/column order: type, name, key multiset and optional comment. Source identities never substitute for text/table evidence; combined, clipped or ambiguous cells need a separate projection')
      continue
    }
    if (['message-order', 'message-style'].includes(key) && input.family === 'sequence' && Array.isArray(facts[key])) {
      const relations = input.paint.connections as { source: string; target: string; startMarker: string; endMarker: string; startFilled?: boolean; endFilled?: boolean; box?: { y: number; height: number }; labels?: string[]; dash?: string }[]
      const ordered = [...relations].sort((a, b) => (a.box?.y ?? Infinity) - (b.box?.y ?? Infinity))
      const bound = ['painted-relationships', 'painted-relationship-label-counts', 'painted-relationship-label-ownership'].every(criterion => checkById.get(criterion)?.status === 'passed') && ordered.every((edge, index) => edge.box && edge.labels?.length === 1 && (!index || edge.box.y - ordered[index - 1]!.box!.y > 1))
      const actual = ordered.map(edge => {
        const reverse = edge.startMarker === 'arrow' && edge.endMarker === 'none'
        return { from: reverse ? edge.target : edge.source, to: reverse ? edge.source : edge.target, text: edge.labels?.[0] ?? null, dash: edge.dash, filled: reverse ? edge.startFilled : edge.endFilled }
      })
      if (key === 'message-order') add(key, actual.map(({ dash: _, filled: __, ...message }) => message), bound ? same(facts[key].map((message: any) => ({ from: message.from, to: message.to, text: normalize(message.text) })), actual.map(({ dash: _, filled: __, ...message }) => message)) : null, 'Every message label belongs to a measured endpoint-owned route, then actual route heights establish chronological order. Source attributes, global label order and matching text alone cannot establish message direction/order; tied/ambiguous rows remain unknown')
      else {
        const supported = facts[key].every((style: any) => ['->>', '-->>'].includes(style))
        const actualStyle = actual.map(message => message.filled === true ? !message.dash || message.dash === 'none' || /^0(?:px)?(?:[ ,]+0(?:px)?)*$/.test(message.dash) ? '->>' : message.dash.split(/[ ,]+/).every(value => Number.parseFloat(value) > 0) ? '-->>' : null : null)
        add(key, actualStyle, bound && supported && actualStyle.every(Boolean) ? same(facts[key], actualStyle) : null, 'Solid/dashed stroke and an actual closed filled arrowhead are read on each chronological message route. Only the ->>/-->> profile is qualified here; open, cross, asynchronous and compound markers need their own visible glyph proof')
      }
      continue
    }
    if (key === 'direction' && input.family === 'flowchart') {
      const direction = String(facts.direction), edges = input.expected.edges ?? [], indegree = new Map((input.expected.nodes ?? []).map(node => [node.id, 0]))
      for (const edge of edges) indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1)
      const remaining = new Map(indegree), ready = [...remaining].filter(([, degree]) => !degree).map(([id]) => id)
      let visited = 0
      for (let index = 0; index < ready.length; index++) { const id = ready[index]!; visited++; for (const edge of edges.filter(edge => edge.source === id)) { const degree = (remaining.get(edge.target) ?? 0) - 1; remaining.set(edge.target, degree); if (!degree) ready.push(edge.target) } }
      const supported = ['TB', 'TD', 'BT', 'LR', 'RL'].includes(direction) && edges.length > 0 && visited === indegree.size && !/^\s*direction\s+/im.test(input.source) && edges.every(edge => nodeById.has(edge.source) && nodeById.has(edge.target))
      const actual = edges.map(edge => {
        const a = nodeById.get(edge.source)?.box, b = nodeById.get(edge.target)?.box
        return { source: edge.source, target: edge.target, dx: a && b ? b.x + b.width / 2 - a.x - a.width / 2 : null, dy: a && b ? b.y + b.height / 2 - a.y - a.height / 2 : null }
      })
      add(key, actual, supported ? actual.every(edge => direction === 'LR' ? edge.dx! > 1 : direction === 'RL' ? edge.dx! < -1 : direction === 'BT' ? edge.dy! < -1 : edge.dy! > 1) : null, 'Owned node centers preserve the requested direction on an acyclic flowchart with no local direction override. Cycles, isolated nodes, unresolved bodies and local overrides need separate layout evidence')
      continue
    }
    if (key === 'slices' && input.family === 'pie') {
      const weights = checkById.get('painted-slice-weights')
      add(key, weights?.actual ?? null, weights?.status === 'passed' ? true : weights?.status === 'failed' ? false : null, 'Authored slice labels bind actual arc weights under the qualified pie fraction profile. This proves displayed proportions, not recovery of unprinted absolute quantities')
      continue
    }
    if (key === 'show-data' && input.family === 'pie' && typeof facts[key] === 'boolean' && Array.isArray(facts.slices)) {
      const observed = facts.slices.map((slice: any) => {
        const escaped = String(slice.label).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const pattern = new RegExp('^' + escaped + '\\s*[\\[(]([-+\\d.e]+)(%?)[\\])]$')
        const matches = text.map(element => pattern.exec(normalize(element.textContent ?? ''))).filter(Boolean)
        return { label: slice.label, quantities: matches.map(match => ({ value: Number(match![1]), percent: match![2] === '%' })), expected: slice.value }
      })
      const supported = observed.every((item: any) => item.quantities.length <= 1)
      add(key, observed, supported ? facts[key] ? observed.every((item: any) => item.quantities.length === 1 && !item.quantities[0].percent && Math.abs(item.quantities[0].value - item.expected) < 1e-9) : observed.every((item: any) => item.quantities.length === 0) : null, 'Requested pie data values require exact visible legend quantities; a percentage or native model value cannot substitute for the requested absolute display')
      continue
    }
    if (key === 'image-requests' && Array.isArray(facts[key])) {
      const imageCheck = checkById.get('embedded-images'), images = Array.isArray(imageCheck?.actual) ? imageCheck!.actual as { href: string; box: { x: number; y: number; width: number; height: number }; loaded: boolean; visible: boolean; clipUnknown: boolean }[] : []
      const actual = facts[key].map((request: any) => ({ ...request, node: nodeById.get(request.id), matches: images.filter(image => image.href === request.href) }))
      const available = imageCheck && actual.every((request: any) => request.node && request.matches.length === 1)
      add(key, actual, available ? imageCheck!.status === 'unavailable' ? null : imageCheck!.status === 'passed' && actual.every((request: any) => request.matches.every((image: any) => image.box.x >= request.node.box.x - 2 && image.box.y >= request.node.box.y - 2 && image.box.x + image.box.width <= request.node.box.x + request.node.box.width + 2 && image.box.y + image.box.height <= request.node.box.y + request.node.box.height + 2)) : null, 'Each exact source asset must decode and occupy its independently owned source node; a matching URL elsewhere or successful model parse supplies no image ownership credit')
      continue
    }
    add(key, null, null, 'No qualified SVG observer verifies this complete source fact: ' + input.family + '/' + key + '. Partial quantitative checks, labels and native models cannot silently satisfy it')
  }
  return checks
}
