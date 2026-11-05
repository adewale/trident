import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { communityDeclaresOutput } from '../unified/community.ts'

const catalog = JSON.parse(readFileSync(join(import.meta.dir, '../docs/evidence/benchmark-campaign-2026-11-02/catalog.json'), 'utf8'))
const node = (id: string) => catalog.nodes.find((entry: { id: string }) => entry.id === id)

test('collectors take a project only for the outputs its catalog binding declares', () => {
  // Terminal through the module, through a release CLI, and not at all.
  expect(communityDeclaresOutput(node('fasouto/termaid'), 'terminal')).toBe(true)
  expect(communityDeclaresOutput(node('Latias94/merman'), 'terminal')).toBe(true)
  expect(communityDeclaresOutput(node('obsidianmd/pele'), 'terminal')).toBe(false)
  expect(communityDeclaresOutput(node('obsidianmd/pele'), 'svg')).toBe(true)
  expect(communityDeclaresOutput(node('fasouto/termaid'), 'svg')).toBe(false)
  expect(communityDeclaresOutput(node('pub:mermaid_flutter'), 'svg')).toBe(false)
  expect(communityDeclaresOutput({ id: 'no-binding' } as any, 'svg')).toBe(false)
})
