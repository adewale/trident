import { expect, test } from 'bun:test'
import { gunzipSync } from 'node:zlib'
import { readFileSync } from 'node:fs'
import { reviewDocumentationSource } from '../unified/docs-source-review.ts'

const review = (source: string) => reviewDocumentationSource({ id: 'sequence-note-scope-control', source, family: 'sequence' }, { visual: false })
const notes = (source: string) => review(source).expected!.facts!.notes as any[]

test('a note before the first message retains explicit colored-fragment ownership', () => {
  const prefix = 'sequenceDiagram\nparticipant A\n', note = 'Note right of A: before any message\n', end = 'end\nA->>B: next'
  const inside = notes(prefix + 'rect rgb(191,223,255)\n' + note + end)
  const outside = notes(prefix + 'rect rgb(191,223,255)\nend\n' + note + 'A->>B: next')
  expect(inside[0]).toMatchObject({ afterMessage: 0, fragmentScope: [{ fragment: 0 }] })
  expect(outside[0]).toMatchObject({ afterMessage: 0, fragmentScope: [] })
  expect(inside).not.toEqual(outside)
})

test('nested notes retain both container and active branch ownership at a shared message boundary', () => {
  const source = 'sequenceDiagram\nalt first\nNote over A,B: first branch\nelse second\nrect rgb(1,2,3)\nNote over A,B: nested second branch\nend\nend\nNote over A,B: outside\nA->>B: next'
  expect(notes(source).map(note => [note.afterMessage, note.fragmentScope])).toEqual([[0, [{ fragment: 0 }]], [0, [{ fragment: 0, branch: 1 }, { fragment: 2 }]], [0, []]])
})

test('pinned sequenceDiagram661 binds Alice note to the outer colored rectangle', () => {
  const inventory = JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-source-inventory.json.gz', import.meta.url))).toString())
  const input = inventory.cases.find((item: any) => item.id === 'packages/mermaid/src/docs/syntax/sequenceDiagram.md:661')!
  const row = reviewDocumentationSource(input, { visual: false })
  expect((row.expected!.facts!.notes as any[])[0]).toEqual({ side: 'right of', actors: ['Alice'], text: 'Alice calls John.', afterMessage: 0, fragmentScope: [{ fragment: 0 }] })
  expect(row.sourceReview.expectedFactsComplete).toBe(true)
})
