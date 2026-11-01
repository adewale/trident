import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'
import { evidenceBytesDigest } from '../portable/evidence-contract.ts'
import { assessDocsPng } from '../unified/docs-png-drawings.ts'
import { importOfflinePngReviews, type OfflinePngReviewReceipt } from '../unified/docs-png-offline-review.ts'
import type { DocsDrawingReview, DocsInput } from '../unified/docs-drawings.ts'

const root = new URL('./fixtures/png-independent-validation/', import.meta.url)
const sample = JSON.parse(readFileSync(new URL('sample.json', root), 'utf8'))
const receipts: OfflinePngReviewReceipt[] = readFileSync(new URL('reviews.jsonl', root), 'utf8').trim().split('\n').map(line => JSON.parse(line))
const contracts: DocsDrawingReview[] = JSON.parse(readFileSync(new URL('../corpus/docs-reviewed.json', import.meta.url), 'utf8'))
const inputs: DocsInput[] = [...new Map(sample.rows.map((row: any) => [row.id, { id: row.id, family: contracts.find(c => c.id === row.id)!.family, source: row.source }])).values()] as DocsInput[]
const bytes = (path: string) => readFileSync(new URL(path, root))
const current = (id: string) => contracts.find(contract => contract.id === id)!
const input = (id: string) => inputs.find(row => row.id === id)!

test('fresh independent image/source judgments have ordinary admission and retain the negative and unknown controls', () => {
  // This imports already authored judgments: acceptance/hashes are not a
  // semantic validator. The sample retains the actual images and newly
  // authored observations so a separate reader can dispute every judgment.
  const admitted = importOfflinePngReviews(inputs, inputs.map(i => current(i.id)), receipts, row => bytes(row.actualImage.path), row => bytes(row.inspection.packet))
  expect(admitted.imported).toHaveLength(15)
  expect(sample.rows.filter((row: any) => row.priorStatus === 'correct')).toHaveLength(13)
  const results = sample.rows.map((row: any) => ({ row, assessment: assessDocsPng(input(row.id), current(row.id), bytes(row.image), admitted.reviews) }))
  for (const { row, assessment } of results) expect(assessment.status).toBe(row.status)
  expect(results.filter((row: any) => row.assessment.status === 'correct')).toHaveLength(12)
  expect(results.filter((row: any) => row.assessment.status === 'incorrect')).toHaveLength(3)
  expect(results.filter((row: any) => row.assessment.status === 'unknown')).toHaveLength(1)
  for (const row of sample.rows) expect(evidenceBytesDigest(bytes(row.image))).toBe(row.pngSha256)
})

test('restoring an explicit requirement direction invalidates both old positive admissions; fresh saved images disagree', () => {
  const previous = readFileSync(new URL('prior-352-reviews.jsonl', root), 'utf8').trim().split('\n').map(line => JSON.parse(line).receipt)
  expect(previous).toHaveLength(2)
  for (const row of previous) {
    expect(row.review.status).toBe('correct')
    expect(() => importOfflinePngReviews(inputs, inputs.map(i => current(i.id)), [row], () => bytes('images/352-mermaid.png'), () => bytes('images/352-mermaid.png'))).toThrow('changed source or source contract')
  }
  const fresh = receipts.filter(row => row.review.id === previous[0].review.id)
  const admitted = importOfflinePngReviews(inputs, inputs.map(i => current(i.id)), fresh, row => bytes(row.actualImage.path), row => bytes(row.inspection.packet))
  const statuses = fresh.map(row => [row.project, assessDocsPng(input(row.review.id), current(row.review.id), bytes(row.actualImage.path), admitted.reviews).status])
  expect(statuses).toEqual([['mermaid-js/mermaid', 'correct'], ['pub:mermaid_flutter', 'incorrect']])
})

type Box = { x: number; y: number; width: number; height: number }
/** Independent test-only image measurement. Resvg only decodes the original
 * embedded PNG at 1:1, with no project SVG, font, target parser or renderer.
 * Component classification is fixed before reading source direction. Human
 * direct viewing supplies the two component-to-caption ownership bindings. */
function chromaticBodies(row: any): Box[] {
  const decoded = new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${row.width}" height="${row.height}"><image width="${row.width}" height="${row.height}" href="data:image/png;base64,${bytes(row.image).toString('base64')}"/></svg>`).render()
  const rgba = decoded.pixels, mask = new Uint8Array(row.width * row.height), components: Box[] = []
  for (let i = 0; i < mask.length; i++) {
    const r = rgba[i * 4]!, g = rgba[i * 4 + 1]!, b = rgba[i * 4 + 2]!
    mask[i] = Math.max(r, g, b) - Math.min(r, g, b) > 12 && Math.max(r, g, b) > 100 && rgba[i * 4 + 3]! > 128 ? 1 : 0
  }
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue
    const queue = [i]; mask[i] = 0
    let left = row.width, top = row.height, right = 0, bottom = 0
    for (let j = 0; j < queue.length; j++) {
      const p = queue[j]!, x = p % row.width, y = Math.floor(p / row.width)
      left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y)
      for (const n of [x > 0 ? p - 1 : -1, x + 1 < row.width ? p + 1 : -1, y > 0 ? p - row.width : -1, y + 1 < row.height ? p + row.width : -1]) if (n >= 0 && mask[n]) { mask[n] = 0; queue.push(n) }
    }
    if (queue.length > 100) components.push({ x: left, y: top, width: right - left + 1, height: bottom - top + 1 })
  }
  return components
}
/** Bounded two-node witness only: a positive requires disjoint bodies on the
 * requested axis with overlapping perpendicular spans. Diagonal ambiguity
 * remains unknown. The node identities come from inspected captions, not an
 * arrowhead; the requested direction comes from literal source. */
function directionWitness(direction: string, source: Box, target: Box): 'passed' | 'failed' | 'unknown' {
  const xOverlap = Math.min(source.x + source.width, target.x + target.width) > Math.max(source.x, target.x)
  const yOverlap = Math.min(source.y + source.height, target.y + target.height) > Math.max(source.y, target.y)
  const right = target.x >= source.x + source.width, left = source.x >= target.x + target.width
  const below = target.y >= source.y + source.height, above = source.y >= target.y + target.height
  if (['LR', 'RL'].includes(direction)) {
    if (xOverlap && (above || below) || yOverlap && (direction === 'LR' ? left : right)) return 'failed'
    if (yOverlap && (direction === 'LR' ? right : left)) return 'passed'
  } else if (['TB', 'BT'].includes(direction)) {
    if (yOverlap && (left || right) || xOverlap && (direction === 'TB' ? above : below)) return 'failed'
    if (xOverlap && (direction === 'TB' ? below : above)) return 'passed'
  }
  return 'unknown'
}

test('actual independently owned requirement body pixels establish the authored axis without using SVG or old verdicts', () => {
  const rows = sample.rows.filter((row: any) => row.index === 352)
  for (const row of rows) {
    const bodies = chromaticBodies(row)
    expect(bodies).toEqual(row.observedChromaticComponents.map(({ pixels: _, ...box }: any) => box))
    // Caption-to-body bindings were established by viewing the actual image.
    const source = bodies[row.project === 'mermaid-js/mermaid' ? 1 : 0]!, target = bodies[row.project === 'mermaid-js/mermaid' ? 0 : 1]!
    const direction = current(row.id).expected!.facts!.direction as string
    expect(directionWitness(direction, source, target)).toBe(row.project === 'mermaid-js/mermaid' ? 'passed' : 'failed')
  }
})

test('direction proof accepts equivalent translations/scales and rejects wrong axis or reflection; ambiguous bodies stay unknown', () => {
  const a = { x: 10, y: 20, width: 50, height: 80 }, b = { x: 160, y: 25, width: 70, height: 60 }
  const transforms = [(box: Box) => box, (box: Box) => ({ x: box.x * 3 + 417, y: box.y * 3 - 91, width: box.width * 3, height: box.height * 3 })]
  for (const transform of transforms) {
    expect(directionWitness('LR', transform(a), transform(b))).toBe('passed')
    expect(directionWitness('RL', transform(b), transform(a))).toBe('passed')
    expect(directionWitness('LR', transform(b), transform(a))).toBe('failed')
    expect(directionWitness('TB', transform(a), transform(b))).toBe('failed')
  }
  const transpose = (box: Box) => ({ x: box.y, y: box.x, width: box.height, height: box.width })
  expect(directionWitness('TB', transpose(a), transpose(b))).toBe('passed')
  expect(directionWitness('BT', transpose(b), transpose(a))).toBe('passed')
  expect(directionWitness('LR', a, { ...b, y: 300 })).toBe('unknown')
  expect(directionWitness('LR', a, a)).toBe('unknown')
})
