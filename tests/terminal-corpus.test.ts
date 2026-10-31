import { expect, test } from 'bun:test'
import { extractTerminalSources, terminalSourceTags } from '../scripts/freeze-terminal-corpus.ts'
test('literal Mermaid source and golden input sections preserve bytes and exclude output', () => {
  const source = 'graph LR\nA --> B\n'
  expect(extractTerminalSources('```mermaid\n' + source + '```\n', 'md')[0]?.source).toBe(source)
  expect(extractTerminalSources(source + '---\n┌ output ┐\n', 'txt')[0]?.source).toBe(source)
})
test('static source extraction rejects test titles, type names, interpolation and dynamic fragments', () => {
  const code = 'describe("flowchart nodes",()=>{}); const family="flowchart"; const dynamic="graph LR\\n%s --> B"; const fragment="graph TD\\n" + nodes; const valid=`graph LR\nA --> B`;'
  expect(extractTerminalSources(code, 'ts').map(row => row.source)).toEqual(['graph LR\nA --> B'])
})
test('source metadata describes feature strata without becoming drawing expectations', () => {
  expect(terminalSourceTags('flowchart BT\nA --> B\nA --> C\nC --> A')).toEqual(['branching', 'cycle', 'direction:BT'])
})

import { readTerminalCorpus } from '../fidelity/terminal-corpus.ts'
test('committed real corpus has authenticated source bytes, research snapshots and explicit missing correctness evidence', () => {
  const corpus = readTerminalCorpus()
  expect(corpus.cases).toHaveLength(120)
  expect(corpus.projects).toHaveLength(18)
  expect(new Set(corpus.cases.map(input => input.family)).size).toBeGreaterThan(15)
  expect(corpus.cases.every(input => input.origins.length && input.expected.status === 'unreviewed')).toBe(true)
  const features = new Set(corpus.cases.flatMap(input => input.features))
  for (const feature of ['direction:LR', 'direction:RL', 'direction:TD', 'direction:TB', 'direction:BT', 'groups', 'multiline-labels', 'wide-labels', 'combining-labels', 'escaping', 'terminal-controls', 'cycle', 'merging', 'branching', 'large-source']) expect(features.has(feature)).toBe(true)
})
