import { expect, test } from 'bun:test'
import { mergeNativePng } from '../unified/three-benchmark-report.ts'

function fixture() {
  const corpus = { commit: 'fixed-docs', occurrences: 2 }, method = { admission: 'fixture policy' }
  const runs = (project: string, format: string) => [1, 2, 3].map(run => ({ project, version: '0.3.2', format, run, boundary: 'fixture public API', boundaryKind: 'persistent-api', attempted: 2, completed: 2, failed: 0, timeouts: 0, totalMs: 1 }))
  return {
    images: { state: 'complete', corpus, method, runs: runs('other', 'svg'), summary: [], rankings: { svg: [], png: [], terminal: [], unranked: [] }, blocked: [{ project: 'pub:mermaid_flutter' }] },
    flutter: { state: 'complete', corpus, method, runs: runs('pub:mermaid_flutter', 'png'), blocked: [] },
  }
}

test('native PNG merge rebuilds summaries and rankings and removes the measured project from blocked rows', () => {
  const { images, flutter } = fixture()
  const merged = mergeNativePng(images, flutter)
  expect(merged.runs).toEqual([...images.runs, ...flutter.runs])
  expect(merged.blocked.map((block: any) => block.project)).not.toContain('pub:mermaid_flutter')
  expect(merged.rankings.png).toEqual([expect.objectContaining({ project: 'pub:mermaid_flutter', completed: 2, medianTotalMs: 1, rank: 1 })])
  expect(merged.rankings.svg).toEqual([expect.objectContaining({ project: 'other', completed: 2, rank: 1 })])
  expect(merged.summary).toEqual([
    expect.objectContaining({ project: 'other', format: 'svg', completed: [2, 2, 2] }),
    expect.objectContaining({ project: 'pub:mermaid_flutter', format: 'png', completed: [2, 2, 2], runs: 3 }),
  ])
  expect(images.summary).toEqual([])
  expect(images.rankings.png).toEqual([])
})

test('a native PNG collection over another corpus, an incomplete one or a duplicate is refused', () => {
  const { images: collected, flutter } = fixture()
  expect(() => mergeNativePng(collected, { ...flutter, corpus: { ...flutter.corpus, commit: 'other' } })).toThrow('different corpus')
  expect(() => mergeNativePng(collected, { ...flutter, state: 'running' })).toThrow('incomplete')
  expect(() => mergeNativePng(collected, { ...flutter, method: { ...flutter.method, admission: 'another policy' } })).toThrow('one recorded admission policy')
  expect(() => mergeNativePng(mergeNativePng(collected, flutter), flutter)).toThrow('already has image runs')
})
