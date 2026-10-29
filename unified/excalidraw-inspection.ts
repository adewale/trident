/** Inspect editable conversion output, never the Mermaid source or metadata.
 * This checks declared labels and optional relationships, not the final canvas. */
export function inspectExcalidraw(value: unknown, labels: readonly string[], relationships?: readonly { from: string; to: string; label?: string }[]): string[] {
  const findings: string[] = []
  if (!value || typeof value !== 'object' || !Array.isArray((value as any).elements) || !(value as any).elements.length) return ['No editable Excalidraw elements returned']
  const elements = (value as any).elements as Record<string, any>[]
  if (elements.some(element => !element || typeof element !== 'object')) return ['Malformed Excalidraw element']
  if (elements.every(element => element.type === 'image')) return ['Conversion qualification unavailable: image-only fallback is not an editable diagram model']
  const ids = new Map<string, Record<string, any>>()
  const texts: string[] = []
  const normalize = (text: string) => text.replace(/\s+/g, ' ').trim()
  for (const element of elements) {
    if (typeof element.id === 'string') {
      if (!element.id || ids.has(element.id)) findings.push('Duplicate or empty Excalidraw element id')
      ids.set(element.id, element)
    }
    if (!['rectangle', 'ellipse', 'diamond', 'text', 'arrow', 'line', 'image'].includes(element.type)) findings.push('Unknown editable element type: ' + element.type)
    if (![element.x, element.y].every(number => typeof number === 'number' && Number.isFinite(number))) findings.push('Non-finite Excalidraw position')
    if (['rectangle', 'ellipse', 'diamond', 'image'].includes(element.type) && ![element.width, element.height].every(number => typeof number === 'number' && Number.isFinite(number) && number > 0)) findings.push('Invalid Excalidraw shape dimensions')
    if (['arrow', 'line'].includes(element.type) && (!Array.isArray(element.points) || element.points.length < 2 || element.points.some((point: unknown) => !Array.isArray(point) || point.length !== 2 || !point.every(number => typeof number === 'number' && Number.isFinite(number))) || element.points.every((point: number[]) => point[0] === element.points[0][0] && point[1] === element.points[0][1]))) findings.push('Invalid Excalidraw route points')
    const text = element.type === 'text' ? element.text : element.label?.text
    if (typeof text === 'string') texts.push(normalize(text))
  }
  for (const label of labels) if (!texts.includes(normalize(label))) findings.push('Missing editable label: ' + label)
  for (const arrow of elements.filter(element => element.type === 'arrow')) {
    if (!ids.has(arrow.start?.id) || !ids.has(arrow.end?.id)) findings.push('Arrow has a missing editable endpoint')
  }
  if (relationships) {
    const nodeLabel = (id: string) => normalize(ids.get(id)?.label?.text ?? ids.get(id)?.text ?? '')
    const arrows = elements.filter(element => element.type === 'arrow').map(arrow => ({ from: nodeLabel(arrow.start?.id), to: nodeLabel(arrow.end?.id), label: normalize(arrow.label?.text ?? '') }))
    for (const expected of relationships) {
      const index = arrows.findIndex(arrow => arrow.from === normalize(expected.from) && arrow.to === normalize(expected.to) && (expected.label === undefined || arrow.label === normalize(expected.label)))
      if (index < 0) findings.push(`Missing editable relationship: ${expected.from} -> ${expected.to}`)
      else arrows.splice(index, 1)
    }
    if (arrows.length) findings.push('Unexpected editable relationships: ' + arrows.length)
  }
  return findings
}
