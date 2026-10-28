import { expect, test } from 'bun:test'
import { inspectExcalidraw } from '../unified/excalidraw-inspection.ts'
const shape = (id: string, text: string, x: number) => ({ id, type: 'rectangle', label: { text }, x, y: 0, width: 80, height: 40 })
const arrow = { type: 'arrow', x: 80, y: 20, points: [[0, 0], [20, 0]], start: { id: 'A' }, end: { id: 'B' } }
const elements = [shape('A', 'Alpha', 0), shape('B', 'Beta', 100), arrow]
const relationships = [{ from: 'Alpha', to: 'Beta' }]
test('editable conversion must retain authored labels and exact directed relationships', () => {
  expect(inspectExcalidraw({ elements }, ['Alpha', 'Beta'], relationships)).toEqual([])
  expect(inspectExcalidraw({ elements: elements.slice(0, 2) }, ['Alpha', 'Beta'], relationships).join(' ')).toContain('Missing editable relationship')
  expect(inspectExcalidraw({ elements: [...elements.slice(0, 2), { ...arrow, start: arrow.end, end: arrow.start }] }, [], relationships).join(' ')).toContain('Missing editable relationship')
  expect(inspectExcalidraw({ elements: [...elements, arrow] }, [], relationships).join(' ')).toContain('Unexpected editable relationships')
  expect(inspectExcalidraw({ elements: [shape('A', 'Alpha', 0)], source: 'Beta' }, ['Alpha', 'Beta']).join(' ')).toContain('Missing editable label: Beta')
})
test('editable geometry, endpoint identity and image-only fallbacks retain different dispositions', () => {
  expect(inspectExcalidraw({ elements: [{ type: 'image' }] }, [])[0]).toStartWith('Conversion qualification unavailable:')
  for (const bad of [{ ...arrow, end: { id: 'missing' } }, { ...arrow, points: [[0, 0], [0, 0]] }, { ...arrow, points: [[0, 0], [Infinity, 0]] }, shape('A', 'Alpha', NaN)]) {
    expect(inspectExcalidraw({ elements: [...elements.slice(0, 2), bad] }, [])).not.toEqual([])
  }
  expect(inspectExcalidraw({ elements: [elements[0], elements[0]] }, []).join(' ')).toContain('Duplicate')
})
