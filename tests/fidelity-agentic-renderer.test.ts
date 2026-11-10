import { expect, test } from 'bun:test'
import { agenticRenderer } from '../unified/mermaid-fidelity/agentic-renderer.ts'

const hooksFor = () => {
  const observed = { calls: 0, rejections: 0, faults: [] as string[] }
  const hooks = {
    beforeCall: () => {}, called: () => { observed.calls++ }, refused: () => { observed.rejections++ },
    fault: (reason: string): never => { observed.faults.push(reason); throw Error('native fault: ' + reason) },
    unavailable: (reason: string): never => { throw Error('gap: ' + reason) },
    missing: (member: string): never => { throw Error('gap: ' + member) },
    hasInlineTarget: (_id: string) => false,
  }
  return { hooks, observed }
}
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="40"><text x="4" y="20">Native</text></svg>'

test('renderer completion invokes the actual public API with the untouched source and validates its SVG', async () => {
  const { hooks, observed } = hooksFor(), seen: string[] = [], source = '---\ntitle: Original\n---\nsequenceDiagram\nA->>B: hi'
  const renderer = agenticRenderer({ renderMermaidSVG: async (text: string) => { seen.push(text); return svg } }, hooks)!
  expect(await renderer.draw(source, 'unused-host-id')).toBe(svg)
  expect(seen).toEqual([source])
  expect(observed.calls).toBe(1)
  expect(() => (renderer as any).bounds).toThrow('gap: bounds')
  expect(agenticRenderer({}, hooks)).toBeUndefined()
})

test('native renderer crashes and unusable returned artefacts cannot earn a negative-test pass', async () => {
  for (const renderMermaidSVG of [() => { throw new TypeError('native crash') }, () => '<svg', () => 'not a drawing']) {
    const { hooks, observed } = hooksFor(), renderer = agenticRenderer({ renderMermaidSVG }, hooks)!
    await expect(renderer.draw('sequenceDiagram')).rejects.toThrow('native fault:')
    expect(observed.faults).toHaveLength(1)
  }
  const { hooks, observed } = hooksFor()
  const renderer = agenticRenderer({ renderMermaidSVG: () => { throw new SyntaxError('native refusal') } }, hooks)!
  await expect(renderer.draw('invalid source')).rejects.toThrow('native refusal')
  expect(observed.rejections).toBe(1)
  expect(observed.faults).toEqual([])
})

test('an unbound inline DOM request cannot be credited as standalone rendering', async () => {
  const { hooks, observed } = hooksFor(); hooks.hasInlineTarget = () => true
  const renderer = agenticRenderer({ renderMermaidSVG: () => svg }, hooks)!
  await expect(renderer.draw('sequenceDiagram', 'existing-host')).rejects.toThrow('gap:')
  expect(observed.calls).toBe(0)
})
