import { readFileSync } from 'node:fs'
import type { CommunityNode } from './community-types.ts'
import { fidelityCoreProjects } from '../fidelity/selection.ts'
import { PORTABLE_ADAPTER_IDS, type PortableBinding } from '../portable/protocol.ts'
import { releaseBenchmarkSkip } from './benchmark-skip.ts'

export const PUBLIC_SUITES = ['community', 'docs', 'fidelity', 'native-fidelity', 'upstream-fidelity', 'upstream-original', 'portable'] as const
/** Historical IDs remain readable. Expensive clocks and optional model APIs
 * require explicit selection; ordinary campaigns start with SVG evidence. */
export const CAMPAIGN_SUITES = ['community', 'docs', 'fidelity', 'native-fidelity', 'portable'] as const
export const DEFAULT_SUITES = ['docs', 'fidelity'] as const
export type PublicSuite = typeof PUBLIC_SUITES[number]
export type SupportState = 'configured' | 'conditional' | 'adapter-missing' | 'project-unsupported' | 'reference-only' | 'out-of-scope' | 'disabled'
export interface CatalogMember extends CommunityNode {
  comparisonScope?: { kind: 'application' | 'catalog-only'; reason: string }
  comparisonBranding?: { distinct: boolean; name?: string | null; evidence: string }
  relation?: string
  parent?: string
  categories?: string[]
  runtime?: string
  license?: string
  vsParent?: { ahead: number; behind: number }
  benchmarkEligibility?: { adapterReview?: string; classification?: string; reason?: string }
}
export interface SuiteSupport { state: SupportState; reason: string }
export const outputName = (value: string) => ({ 'ascii-unicode': 'terminal', ascii: 'terminal', unicode: 'terminal', ast: 'parse', 'mermaid-text': 'source' }[value] ?? value)
/** Syntax-only tools stay discoverable without entering renderer campaigns. */
export function coreScopeReason(node: CatalogMember): string | undefined {
  if (node.comparisonScope) return node.comparisonScope.reason
  if (!node.outputs.some(output => ['svg', 'png', 'jpeg', 'pdf', 'terminal'].includes(outputName(output)))) return 'No rendered output is declared; validator, parser, formatter and conversion-only tools are outside renderer benchmarks.'
}
/** Reviewed bindings describe public APIs, not a preferred set of project IDs. */
export function nativeAdapter(node: CommunityNode): string | undefined {
  const adapter = node.benchmark?.adapter
  return adapter && fidelityCoreProjects[adapter as keyof typeof fidelityCoreProjects] === node.id ? adapter : undefined
}
export const PORTABLE_ADAPTERS = new Set<string>(PORTABLE_ADAPTER_IDS)
export function portableAdapter(node: CommunityNode): string | undefined {
  if (node.benchmark?.portable?.adapter === 'public-package') return 'public-package'
  if (node.benchmark?.portable?.adapter === 'declared' && node.benchmark.portable.binding.export) return 'declared'
  const adapter = node.benchmark?.adapter
  if (adapter === 'declared' && !node.benchmark?.api?.svg) return undefined
  return adapter && PORTABLE_ADAPTERS.has(adapter) ? adapter : undefined
}
export const portableBinding = (node: CommunityNode): PortableBinding | undefined => (node.benchmark?.portable?.adapter === 'declared' ? node.benchmark.portable.binding : undefined) ?? node.benchmark?.api?.svg
export function projectSupport(node: CatalogMember) {
  const declared = [...new Set(node.outputs.map(outputName))].sort()
  const bound = [...new Set((node.benchmark?.outputs ?? []).map(outputName))].sort()
  const adapter = node.benchmark?.adapter
  const cell = (state: SupportState, reason: string): SuiteSupport => ({ state, reason })
  const svg = declared.includes('svg') || bound.includes('svg')
  const renderer = !svg ? cell('project-unsupported', 'No SVG capability is declared; terminal/parser evidence has its own output boundary.')
    : !adapter || !bound.includes('svg') ? cell('adapter-missing', 'SVG is declared but Trident has no configured SVG output binding.')
      : cell('conditional', 'SVG binding is configured; browser build, artifact and output admission still require execution.')
  const native = nativeAdapter(node)
    ? cell('configured', 'Reviewed public-model binding; family-specific projections and actual parse results remain separately qualified.')
    : cell('adapter-missing', 'No reviewed public-model projection in Trident; this does not establish absence of a project model API.')
  const suites: Record<PublicSuite, SuiteSupport> = {
    community: adapter && bound.length ? cell('configured', 'Declared output transport; build/install/API and family success are not inferred.') : cell('adapter-missing', 'Catalog metadata only; no community output transport is bound.'),
    docs: renderer,
    fidelity: renderer,
    'native-fidelity': native,
    'upstream-fidelity': cell('out-of-scope', 'Retired comparative benchmark: private test/projection compatibility is not a renderer-quality score. Historical evidence remains readable.'),
    'upstream-original': adapter === 'mermaid' && node.relation === 'root'
      ? cell('configured', 'The pinned language reference runs its own original tests; an installed original Vitest runner is required.')
      : cell('reference-only', 'Original upstream tests validate the pinned reference, not another project or a fork revision.'),
    portable: !svg ? cell('project-unsupported', 'This protocol requests a public Node SVG call.')
      : portableAdapter(node) ? cell('configured', 'Reviewed public Node SVG call; SVG admission, optional model/paint evidence and A/A calibration remain distinct.')
        : cell('adapter-missing', 'No reviewed portable Node SVG invocation is bound; browser/WASM/CLI capability is not a Node binding.'),
  }
  const scopeReason = coreScopeReason(node)
  if (scopeReason) for (const suite of PUBLIC_SUITES) suites[suite] = cell('out-of-scope', scopeReason)
  const releaseSkip = releaseBenchmarkSkip(node)
  if (releaseSkip) for (const suite of PUBLIC_SUITES) if (!['project-unsupported', 'reference-only', 'out-of-scope'].includes(suites[suite].state)) suites[suite] = cell('disabled', releaseSkip.reason)
  return {
    project: node.id, relation: node.relation ?? 'unverified', parent: node.parent ?? null,
    categories: node.categories ?? [], runtime: node.runtime ?? 'not recorded', adapter: adapter ?? null,
    adapterReview: node.benchmarkEligibility?.adapterReview ?? 'not independently reviewed',
    comparisonScope: node.comparisonScope ?? null,
    releaseSkip: releaseSkip ?? null,
    declaredOutputs: declared, boundOutputs: bound, missingOutputBindings: scopeReason ? [] : declared.filter(value => !bound.includes(value)), suites,
    evidence: 'Configuration assessment only. No successful build, family support, correctness or timing is asserted.',
  }
}
export function supportInventory(nodes: CatalogMember[]) {
  if (new Set(nodes.map(node => node.id)).size !== nodes.length) throw Error('Catalog project IDs must be unique')
  const projects = nodes.map(projectSupport).sort((a, b) => a.project.localeCompare(b.project))
  const count = (values: string[]) => Object.fromEntries([...new Set(values)].sort().map(value => [value, values.filter(item => item === value).length]))
  return { catalogEntities: projects.length, configuredEntities: projects.filter(row => row.adapter).length,
    relations: count(projects.map(row => row.relation)), adapterReviews: count(projects.map(row => row.adapterReview)),
    projects, policy: 'Entities include forks, historical versions, bindings, integrations and independent implementations. They are not a count of independent engines or verified benchmarks.' }
}
const escape = (value: unknown) => String(value).replaceAll('|', '/').replaceAll('\n', ' ')
export function supportMarkdown(inventory: ReturnType<typeof supportInventory>) {
  return ['# Trident project support', '', `${inventory.catalogEntities} catalog entities; ${inventory.configuredEntities} have declared adapters. Configuration is not execution evidence.`, '',
    'Each suite cell names harness coverage. adapter-missing means Trident has no reviewed binding; project-unsupported means the requested output is not declared. conditional requires browser/artifact admission. reference-only is outside a candidate comparison. out-of-scope marks non-renderers, applications and explicit catalog-only entries; disabled marks a pinned release skipped by configuration.', '',
    '| Project | Relation / parent | Declared → bound outputs | Adapter / review | ' + PUBLIC_SUITES.join(' | ') + ' |',
    '|---|---|---|---|' + PUBLIC_SUITES.map(() => '---').join('|') + '|',
    ...inventory.projects.map(row => '| ' + [row.project, `${row.relation}${row.parent ? ' / ' + row.parent : ''}`, `${row.declaredOutputs.join(', ')} → ${row.boundOutputs.join(', ') || 'none'}`, `${row.adapter ?? 'none'} / ${row.adapterReview}`, ...PUBLIC_SUITES.map(suite => row.suites[suite].state)].map(escape).join(' | ') + ' |'), '',
    'JSON includes the reason for every cell. No adapter count or shared ancestry proves independent implementations. Identical source commits require artifact/runtime evidence before measurement reuse.', ''].join('\n')
}
export const readCatalog = (file: string): { nodes: CatalogMember[] } => JSON.parse(readFileSync(file, 'utf8'))
