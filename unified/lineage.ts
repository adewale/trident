import type { CatalogMember } from './support.ts'

export interface LineageCatalog {
  checkedAt?: string
  nodes: CatalogMember[]
  edges?: Array<{ from: string; to: string; relation: string; evidence?: string; scope?: string }>
}
/** Ancestry narrows comparison selection; it never grants measurement reuse. */
export function lineageInventory(catalog: LineageCatalog) {
  const ids = new Set(catalog.nodes.map(node => node.id))
  if (ids.size !== catalog.nodes.length) throw Error('Catalog project IDs must be unique')
  const edges = catalog.edges ?? []
  for (const edge of edges.filter(edge => ['fork', 'port', 'binding'].includes(edge.relation))) {
    if (!ids.has(edge.from) || !ids.has(edge.to)) throw Error('Missing lineage endpoint: ' + edge.from + ' → ' + edge.to)
  }
  const nodes = catalog.nodes.map(node => {
    const ancestry = edges.filter(edge => edge.from === node.id && ['fork', 'port', 'binding'].includes(edge.relation))
    if (new Set(ancestry.map(edge => edge.relation)).size > 1) throw Error('Conflicting lineage relations: ' + node.id)
    const parents = [...new Set([...(node.parent ? [node.parent] : []), ...ancestry.map(edge => edge.to)])]
    if (parents.length > 1) throw Error('Conflicting lineage parents: ' + node.id)
    const parent = parents[0] ?? null
    if (parent && !ids.has(parent)) throw Error('Missing lineage parent: ' + parent)
    const relation = ancestry[0]?.relation ?? node.relation ?? 'unverified'
    const branding = node.comparisonBranding ?? null
    const exclusions = [...(parent && !(branding?.distinct && branding.name?.trim() && branding.evidence?.trim()) ? ['no-distinct-branding'] : []), ...(relation === 'binding' ? ['shared-engine-runtime-binding'] : []), ...(relation === 'fork' && node.vsParent?.ahead === 0 ? ['zero-ahead-version'] : [])]
    const zeroAhead = relation === 'fork' && node.vsParent?.ahead === 0
    const selection = zeroAhead ? node.vsParent?.behind === 0 ? 'same-parent-head-candidate' : 'historical-version-candidate'
      : relation === 'binding' ? 'runtime-variant' : 'distinct-or-unresolved'
    return { project: node.id, parent, relation, scope: ancestry[0]?.scope ?? null, branding, excludedFromComparison: exclusions.length > 0, exclusionReasons: exclusions, catalogRelation: node.relation ?? 'unverified', vsParent: node.vsParent ?? null, selection,
      comparison: exclusions.includes('no-distinct-branding') ? 'Skip normal comparisons: no distinct brand established. Use the explicit inclusion override only for a named version/fork/runtime investigation. No result is inherited.' : zeroAhead ? 'Omit from the current-engine comparison unless testing this version/build. No result is inherited.' : relation === 'binding' ? 'Test separately only for an explicit runtime/package question; do not count as another engine.' : 'Keep eligible; ancestry does not prove equivalent behavior.',
      adapter: node.benchmark?.adapter ?? null }
  }).sort((a, b) => a.project.localeCompare(b.project))
  const byId = new Map(nodes.map(node => [node.project, node]))
  for (const node of nodes) {
    const seen = new Set<string>(); let current: typeof node | undefined = node
    while (current) {
      if (seen.has(current.project)) throw Error('Lineage cycle: ' + current.project)
      seen.add(current.project); current = current.parent ? byId.get(current.parent) : undefined
    }
  }
  return { catalogCheckedAt: catalog.checkedAt ?? null, entities: nodes.length, nodes,
    relationships: edges.filter(edge => !['fork', 'port', 'binding'].includes(edge.relation)),
    duplicateCandidates: nodes.filter(node => node.selection === 'same-parent-head-candidate' || node.selection === 'historical-version-candidate').map(node => node.project),
    excludedProjects: nodes.filter(node => node.excludedFromComparison).map(node => node.project),
    policy: 'Descendants without established distinct branding are excluded from normal comparisons, even with code changes. Owner/package scopes and runtime suffixes alone do not establish branding. Bindings and zero-ahead versions are also excluded. An explicit inclusion override retains these for version/runtime investigations. Selection guidance uses the recorded catalog snapshot, not a fresh upstream audit. Ports and changed forks remain separate. Zero-ahead descendants can be omitted from a current-engine comparison, but historical/build studies retain them. Measurement aliases require verified artifact, build, runtime and invocation equivalence through catalog-eligibility; lineage alone never supplies a score.' }
}
export function lineageMarkdown(inventory: ReturnType<typeof lineageInventory>) {
  const lines = ['# Project lineage', '', `Catalog checked: ${inventory.catalogCheckedAt ?? 'not recorded'}. ${inventory.entities} entities. Regenerate with \`bun commands.ts support --lineage\`.`, '', inventory.policy, '',
    'Arrows in the tree mean source fork, port or runtime binding as labelled. Independently rooted code can still be a documented port. Dependencies, vendoring and inspiration are listed separately below.', '', '```text']
  const walk = (parent: string | null, prefix: string) => {
    const children = inventory.nodes.filter(node => node.parent === parent)
    children.forEach((node, index) => {
      const last = index === children.length - 1
      const scope = node.vsParent ? `; +${node.vsParent.ahead}/−${node.vsParent.behind}` : ''
      lines.push(prefix + (last ? '└── ' : '├── ') + `${node.project} [${node.relation}${node.scope ? "; " + node.scope : ""}${scope}; ${node.excludedFromComparison ? "SKIP: " + node.exclusionReasons.join(", ") : node.selection}]`)
      walk(node.project, prefix + (last ? '    ' : '│   '))
    })
  }
  walk(null, '')
  lines.push('```', '', '## Other relationships', '', ...inventory.relationships.map(edge => `- ${edge.from} → ${edge.to}: ${edge.relation}${edge.evidence ? edge.evidence.startsWith('https://') && !edge.evidence.includes(' ') ? ` ([evidence](${edge.evidence}))` : ' (evidence recorded in catalog)' : ''}`), '',
    '## Comparison selection', '', `${inventory.duplicateCandidates.length} zero-ahead forks are candidates to omit from current-engine comparisons. This saves work by narrowing the question; it does not assert that a newer parent score describes a historical descendant. ${inventory.nodes.filter(node => node.selection === 'same-parent-head-candidate').length} same-parent-head candidates also need artifact verification before any result reuse.`, '',
    `${inventory.excludedProjects.length} entries are excluded from normal comparisons by branding, version or binding policy. Changed forks still need distinct branding. Independently implemented ports also need an established separate brand under this selection rule. This is a comparison-scope choice, not a claim about code quality or behavior. Mermaid Dart retains its support evidence but has no separate brand established here.`, '', 'Keep branded differentiated projects such as Agentic Mermaid, Zombie Mermaid, Beautiful Mermaid and Ondine. Frankenmermaid has an independent root. Review unverified lineages before counting independent engines. Never silently transfer results between projects.', '',
    'Use an explicit `bench --projects ... --plan` selection. `--include-excluded-descendants` is reserved for a named version/fork/runtime investigation. Community collection already measures verified physical-artifact aliases once and keeps per-entity evidence-reuse receipts; candidates without that proof run independently when explicitly selected.', '')
  return lines.join('\n')
}

export function comparisonProjects(catalog: LineageCatalog, requested: string[], includeExcluded = false) {
  const inventory = lineageInventory(catalog)
  const selected = inventory.nodes.filter(node => requested.includes(node.project))
  return { projects: selected, included: selected.filter(node => includeExcluded || !node.excludedFromComparison).map(node => node.project), excluded: selected.filter(node => !includeExcluded && node.excludedFromComparison), includeExcluded, policy: inventory.policy }
}
