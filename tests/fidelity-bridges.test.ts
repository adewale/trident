import { expect, test } from 'bun:test'
import { familyMatches } from '../unified/mermaid-fidelity/bridges/common.mjs'
import { bridgedProjects } from '../unified/mermaid-fidelity/bridges.ts'
import '../unified/mermaid-fidelity/bridge-registry.ts'

test('a project-reported diagram type matches only its own family', () => {
  expect(familyMatches('flowchart-v2', 'flowchart')).toBe(true)
  expect(familyMatches('classDiagram', 'class')).toBe(true)
  expect(familyMatches('stateDiagram-v2', 'state')).toBe(true)
  expect(familyMatches('gitGraph', 'gitgraph')).toBe(true)
  expect(familyMatches('sequence', 'flowchart')).toBe(false)
  expect(familyMatches(undefined, 'flowchart')).toBe(false)
})

test('every project without an importable synchronous parser per family has a registered parser bridge', () => {
  expect(bridgedProjects().sort()).toEqual(['1jehuang/mermaid-rs-renderer', 'AlexanderGrooff/mermaid-ascii', 'KlangHaus/vitepress-plugin-diagram', 'Latias94/merman', 'Mootikins/figurehead-rs', 'Yassimba/loom', 'anomalyco/opencode', 'crabtalk/bezel', 'crafter-station/mermaid', 'dfadler/zombie-mermaid', 'evangwt/xmermaid', 'fasouto/termaid', 'lukilabs/beautiful-mermaid', 'orestesgaolin/mermaid', 'pub:mermaid_flutter', 'sandyyst/dsh-plugin-mermaid-gb-svg', 'spacedock-dev/mermaidtext', 'tariqshams/mermaidtui', 'wevm/ondine', 'xai-org/grok-build'])
})
