import type { MeaningExpectation } from './meaning.ts'
import type { PaintCheck, PaintEvidence } from './paint.ts'

/** Every independently declared fact is an obligation. An unsupported fact must
 * remain in the plan; a successful labels/topology check cannot stand in for it. */
export const plannedSourceFactCriteria = (input: { expected: MeaningExpectation }) => Object.keys(input.expected.facts ?? {}).sort().map(key => 'source-fact:' + key)

/** Runs against retained, mounted SVG. These checks qualify only the named
 * source-fact profiles; unsupported semantics explicitly remain unavailable. */
export function inspectSourceFacts(input: { family: string; source: string; expected: MeaningExpectation; paint: PaintEvidence; quantitative: PaintCheck[] }): PaintCheck[] {
  const svg = document.querySelector('svg'), checks: PaintCheck[] = [], facts: any = input.expected.facts ?? {}
  const add = (key: string, actual: unknown, passed: boolean | null, scope: string) => checks.push({ criterion: 'source-fact:' + key, expected: facts[key], actual, status: passed === null ? 'unavailable' : passed ? 'passed' : 'failed', scope })
  const normalize = (value: string) => value.normalize('NFC').replace(/\s+/g, ' ').trim()
  const visible = (element: Element) => {
    for (let parent: Element | null = element; parent; parent = parent.parentElement) {
      const css = getComputedStyle(parent)
      if (['defs', 'marker', 'clipPath', 'mask', 'title', 'desc'].includes(parent.localName) || css.display === 'none' || ['hidden', 'collapse'].includes(css.visibility) || Number(css.opacity) === 0) return false
      if (parent === svg) break
    }
    const b = element.getBoundingClientRect()
    return b.width > 0 && b.height > 0
  }
  const text = svg ? [...svg.querySelectorAll('text,foreignObject p,foreignObject span,foreignObject div')].filter(element => visible(element) && ![...element.children].some(child => visible(child) && normalize(child.textContent ?? '') === normalize(element.textContent ?? ''))) : []
  const label = (value: string) => text.filter(element => normalize(element.textContent ?? '') === normalize(value))
  const nodes = input.paint.nodes as { id: string; label: string; box: { x: number; y: number; width: number; height: number } }[]
  const nodeById = new Map(nodes.map(node => [node.id, node]))
  const checkById = new Map([...input.paint.checks, ...input.quantitative].map(check => [check.criterion, check]))
  for (const key of Object.keys(facts).sort()) {
    if (!svg) { add(key, null, null, 'No mounted SVG is available for the required source fact'); continue }
    if (key === 'title' && typeof facts.title === 'string') {
      const found = label(facts.title)
      add(key, found.length, found.length > 0, 'The literal source title must be actual visible drawing text; SVG title/desc metadata, hidden text and zero-sized text supply no credit')
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
