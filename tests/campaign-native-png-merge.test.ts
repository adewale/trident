// campaign:results --native-png reproduces the release's Mermaid Flutter merge without a hand edit.
import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { mergeNativePng } from '../unified/three-benchmark-report.ts'

const root = join(import.meta.dir, '../results/release')
const read = (name: string) => JSON.parse(readFileSync(join(root, name), 'utf8'))

test('native PNG runs are appended to the image results and the project is no longer blocked', () => {
  const published = read('images.json'), flutter = read('flutter.json')
  const collected = { ...published, runs: published.runs.filter((run: any) => run.project !== 'pub:mermaid_flutter') }
  const merged = mergeNativePng(collected, flutter)
  expect(merged.runs).toEqual(published.runs)
  expect(merged.blocked.map((block: any) => block.project)).not.toContain('pub:mermaid_flutter')
})

test('a native PNG collection over another corpus, an incomplete one or a duplicate is refused', () => {
  const images = read('images.json'), flutter = read('flutter.json')
  const collected = { ...images, runs: images.runs.filter((run: any) => run.project !== 'pub:mermaid_flutter') }
  expect(() => mergeNativePng(collected, { ...flutter, corpus: { ...flutter.corpus, commit: 'other' } })).toThrow('different corpus')
  expect(() => mergeNativePng(collected, { ...flutter, state: 'running' })).toThrow('incomplete')
  expect(() => mergeNativePng(images, flutter)).toThrow('already has image runs')
})
