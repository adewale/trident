import { comparisonProjects, lineageInventory, type LineageCatalog } from './lineage.ts'
import { outputName } from './support.ts'

const names: Record<string, string> = {
  'mermaid-js/mermaid': 'Mermaid.js', 'obsidianmd/pele': 'Pele',
  'Dicklesworthstone/frankenmermaid': 'Frankenmermaid', '1jehuang/mermaid-rs-renderer': 'Mermaid RS Renderer',
  'AlexanderGrooff/mermaid-ascii': 'Mermaid ASCII', 'anomalyco/opencode': 'OpenCode renderer',
  'crafter-station/mermaid': 'Crafter Mermaid', 'emtyty/merslim': 'Merslim', 'evangwt/xmermaid': 'XMermaid',
  'fasouto/termaid': 'Termaid', 'kitlangton/merman': 'Kitlangton Merman', 'Latias94/merman': 'Latias Merman',
  'KlangHaus/vitepress-plugin-diagram': 'VitePress Plugin Diagram', 'Mootikins/figurehead-rs': 'Figurehead',
  'sandyyst/dsh-plugin-mermaid-gb-svg': 'DSH GB SVG (flowcharts)', 'tariqshams/mermaidtui': 'MermaidTUI',
  'xai-org/grok-build': 'Grok renderer', 'Yassimba/loom': 'Loom renderer',
}

/** Draw the actual normal selection, including disconnected implementations. */
export function lineageDiagram(catalog: LineageCatalog): string {
  const selected = new Set(comparisonProjects(catalog, catalog.nodes.map(node => node.id)).included)
  const inventory = lineageInventory(catalog), nodes = catalog.nodes.filter(node => selected.has(node.id)).sort((a, b) => a.id.localeCompare(b.id))
  const name = (id: string) => catalog.nodes.find(node => node.id === id)?.comparisonBranding?.name ?? names[id] ?? id.split('/').at(-1)!
  const ids = new Map(nodes.map((node, index) => [node.id, 'p' + index]))
  const ancestry = inventory.nodes.filter(node => selected.has(node.project) && node.parent && selected.has(node.parent)).map(node => ({ from: node.parent!, to: node.project, label: node.relation === 'native-renderer' ? 'native renderer' : node.relation, component: false }))
  const components = (catalog.edges ?? []).filter(edge => edge.relation === 'component-port' && selected.has(edge.from) && selected.has(edge.to)).map(edge => ({ from: edge.to, to: edge.from, label: 'ASCII component port', component: true }))
  const edges = [...ancestry, ...components]
  const parents = new Map(nodes.map(node => [node.id, node.id]))
  const root = (id: string): string => parents.get(id) === id ? id : root(parents.get(id)!)
  for (const edge of edges) parents.set(root(edge.to), root(edge.from))
  const clusters = new Map<string, typeof nodes>()
  for (const node of nodes) { const key = root(node.id); clusters.set(key, [...(clusters.get(key) ?? []), node]) }
  const families = [...clusters.entries()].filter(([, members]) => members.length > 1).sort(([a, aa], [b, bb]) => Number(bb.some(node => node.relation === 'root')) - Number(aa.some(node => node.relation === 'root')) || bb.length - aa.length || a.localeCompare(b))
  const singles = [...clusters.values()].filter(members => members.length === 1).flat()
  const svg = singles.filter(node => node.outputs.includes('svg')), terminal = singles.filter(node => !node.outputs.includes('svg') && node.outputs.some(output => outputName(output) === 'terminal'))
  const raster = singles.filter(node => !svg.includes(node) && !terminal.includes(node))
  const groups = [...families.map(([key, members]) => ({ title: name(members.find(node => node.relation === 'root')?.id ?? key) + ' lineage', members })), { title: 'Other SVG renderers · no asserted ancestry', members: svg }, { title: 'Other terminal renderers · no asserted ancestry', members: terminal }, { title: 'Other raster renderers · no asserted ancestry', members: raster }].filter(group => group.members.length)
  const lines = ['flowchart TB', `  %% ${nodes.length} scheduled renderers. Output checks include failed or blocked interfaces.`, '  %% Solid arrows: recorded derivation. Dashed arrow: component port only.']
  for (const [index, group] of groups.entries()) {
    lines.push(`  subgraph G${index}["${group.title}"]`)
    for (const node of group.members) {
      const outputs = [...new Set((node.benchmark?.outputs ?? node.outputs).map(outputName))].filter(output => ['svg', 'png', 'jpeg', 'pdf', 'terminal'].includes(output))
      const kind = outputs.includes('svg') ? 'svg' : outputs.includes('terminal') ? 'terminal' : 'raster'
      const label = outputs.map(output => output === 'terminal' ? output : output.toUpperCase()).join(' + ')
      lines.push(`    %% ${node.id}`, `    ${ids.get(node.id)}["${name(node.id)}<br/>${label}"]:::${kind}`)
    }
    for (const edge of edges.filter(edge => group.members.some(node => node.id === edge.from) && group.members.some(node => node.id === edge.to))) lines.push(`    ${ids.get(edge.from)} ${edge.component ? '-.->' : '-->'}|${edge.label}| ${ids.get(edge.to)}`)
    lines.push('  end')
  }
  lines.push(
    '  subgraph legend["Legend"]',
    '    legendSvg["Blue · SVG renderer<br/>May also provide terminal or PNG"]:::svg',
    '    legendTerminal["Green · terminal-only renderer<br/>ASCII / Unicode"]:::terminal',
    '    legendRaster["Purple · native raster renderer<br/>PNG"]:::raster',
    '    legendNote["Grey frames group projects<br/>Solid arrows: project lineage<br/>Dashed arrow: component port<br/>Colours show output types, not scores"]',
    '  end',
    '  classDef svg fill:#e8eff8,stroke:#5e81ac,color:#233448',
    '  classDef terminal fill:#e5f3ed,stroke:#51816c,color:#233f35',
    '  classDef raster fill:#eee8f6,stroke:#8b73a6,color:#493759',
  )
  return lines.join('\n') + '\n'
}
