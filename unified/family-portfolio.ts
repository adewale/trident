import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { BUILTIN_FAMILY_METADATA } from '../../../src/agent/families.ts'

export const FAMILY_QUOTA = 4

export interface PortfolioEntry {
  family: string
  source: string
  origin: string
  sourceClass: 'upstream-docs' | 'layout-fixture' | 'skill-fixture' | 'family-corpus' | 'registry-example' | 'authored-family-corpus'
  expectedLabels?: readonly string[]
}

/** Authored benchmark inputs, independent of renderer implementation. These
 * fill real feature gaps rather than making renamed copies of one diagram.
 * Their public parser/renderer admission must be checked before collecting.
 * Syntax references in pinned Mermaid 12.2.0 (1fb7869866dd619168d840291c9c54b4f129758b):
 * packages/parser/src/language/eventmodeling/event-modeling.langium:
 * EmFrame/EmDataEntity/EmNoteEntity/EmGwt; and
 * packages/mermaid/src/docs/syntax/zenuml.md: Annotators, Aliases, Messages,
 * Nesting, Loops and Alt. ZenUML's Node parse stub is not a DSL oracle;
 * actual published-addon browser rendering remains an independent admission. */
export const NATIVE_FAMILY_PORTFOLIO = [
  { family: 'eventmodeling', id: 'namespace-inference', source: 'eventmodeling\ntf 01 ui Shop.Cart\ntf 02 cmd Shop.AddItem\ntf 03 evt Shop.ItemAdded\ntf 04 rmo Shop.CartSummary' },
  { family: 'eventmodeling', id: 'reset-explicit-multiple-sources', source: 'eventmodeling\nrf 01 evt Inventory.Stocked\nrf 02 evt Catalog.PriceChanged\nrf 03 rmo Shop.Availability ->> 01 ->> 02' },
  { family: 'eventmodeling', id: 'typed-reference-and-note', source: 'eventmodeling\nrf 01 ui Checkout.Screen [[ScreenDetails]]\ndata ScreenDetails `json`{\n{ "step": "payment" }\n}\nnote 01 `md`{\nReview address\n}' },
  { family: 'eventmodeling', id: 'given-when-then', source: 'eventmodeling\nentity Order\nentity PlaceOrder\nentity OrderPlaced\nrf 01 cmd PlaceOrder\nrf 02 evt OrderPlaced ->> 01\ngwt 02\ngiven rmo Order\nwhen cmd PlaceOrder\nthen evt OrderPlaced' },
  { family: 'zenuml', id: 'aliases-and-async', source: 'zenuml\n@Actor Buyer as Customer\n@Database Store as Orders\nBuyer->Store: Find recent orders\nStore->Buyer: Orders ready' },
  { family: 'zenuml', id: 'nested-self-call-and-returns', source: 'zenuml\nClient->API.checkout() {\n Store.reserve() {\n  Store.confirm()\n  return ticket\n }\n return receipt\n}' },
  { family: 'zenuml', id: 'loop-and-conditional-branches', source: 'zenuml\nClient->API.ship() {\n while(pending) {\n  Queue.process()\n }\n if(ready) {\n  API->Client: done\n } else {\n  API->Client: waiting\n }\n}' },
  { family: 'zenuml', id: 'creation-and-typed-assignment', source: 'zenuml\nClient\nInventory\nClient->API.start() {\n new Worker()\n Result ticket = Inventory.reserve() { return reservation }\n return confirmation\n}' },
] as const

function compareCodePoints(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0 }

function readSource(repo: string, path: string): string {
  return readFileSync(join(repo, path), 'utf8').trim()
}

function addCandidate(target: Map<string, PortfolioEntry[]>, entry: PortfolioEntry): void {
  const family = target.get(entry.family) ?? []
  if (!family.some(candidate => candidate.source === entry.source)) family.push(entry)
  target.set(entry.family, family)
}

export function buildBalancedPortfolio(repo: string): PortfolioEntry[] {
  const candidates = new Map<string, PortfolioEntry[]>()
  for (const family of BUILTIN_FAMILY_METADATA.map(entry => entry.id)) candidates.set(family, [])

  const docs = JSON.parse(readFileSync(join(repo, 'eval/mermaid-docs-corpus/corpus.json'), 'utf8')) as Array<{ family: string; source: string; origin: string; index: number }>
  const docsByFamily = new Map<string, typeof docs>()
  for (const entry of docs) docsByFamily.set(entry.family, [...(docsByFamily.get(entry.family) ?? []), entry])
  for (const family of BUILTIN_FAMILY_METADATA.map(entry => entry.id)) {
    for (const entry of docsByFamily.get(family) ?? []) {
      addCandidate(candidates, { family, source: entry.source, origin: `eval/mermaid-docs-corpus/${entry.origin}#${entry.index}`, sourceClass: 'upstream-docs' })
      if (candidates.get(family)!.length === 2) break
    }
  }

  for (const family of BUILTIN_FAMILY_METADATA.map(entry => entry.id)) {
    const path = `eval/layout-compare/fixtures/${family}-basic.mmd`
    if (existsSync(join(repo, path))) addCandidate(candidates, { family, source: readSource(repo, path), origin: path, sourceClass: 'layout-fixture' })
  }

  const skillFixtureRoot = join(repo, 'skill-evals/fixtures')
  for (const family of BUILTIN_FAMILY_METADATA.map(entry => entry.id)) {
    const directory = readdirSync(skillFixtureRoot).sort(compareCodePoints).find(name => name.startsWith(`${family}-`))
    if (!directory) continue
    const path = `skill-evals/fixtures/${directory}/input.mmd`
    addCandidate(candidates, { family, source: readSource(repo, path), origin: path, sourceClass: 'skill-fixture' })
  }

  for (const family of BUILTIN_FAMILY_METADATA.map(entry => entry.id)) {
    const path = `eval/stable-families/fixtures/${family}.mmd`
    if (existsSync(join(repo, path))) addCandidate(candidates, { family, source: readSource(repo, path), origin: path, sourceClass: 'family-corpus' })
  }

  const familyManifestPath = join(repo, 'eval/mindmap-gitgraph-content-corpus/manifest.json')
  const familyManifest = JSON.parse(readFileSync(familyManifestPath, 'utf8')) as { cases: Array<{ family: string; file: string }> }
  for (const entry of familyManifest.cases) {
    const path = `eval/mindmap-gitgraph-content-corpus/${entry.file}`
    addCandidate(candidates, { family: entry.family, source: readSource(repo, path), origin: path, sourceClass: 'family-corpus' })
  }

  const radar = JSON.parse(readFileSync(join(repo, 'eval/mermaid-radar-bench/harvest.json'), 'utf8')) as { examples: Array<{ id: string; source: string }> }
  for (const entry of radar.examples) addCandidate(candidates, { family: 'radar', source: entry.source.trim(), origin: `eval/mermaid-radar-bench/harvest.json#${entry.id}`, sourceClass: 'family-corpus' })

  for (const family of BUILTIN_FAMILY_METADATA) {
    addCandidate(candidates, { family: family.id, source: family.example.trim(), origin: `src/agent/families.ts#${family.id}`, sourceClass: 'registry-example' })
    addCandidate(candidates, { family: family.id, source: family.editorExample.trim(), origin: `src/agent/families.ts#${family.editorExampleId}`, sourceClass: 'registry-example' })
  }

  const portfolio: PortfolioEntry[] = []
  for (const family of BUILTIN_FAMILY_METADATA.map(entry => entry.id).sort(compareCodePoints)) {
    const authored = NATIVE_FAMILY_PORTFOLIO.filter(entry => entry.family === family).map(entry => ({ family, source: entry.source, expectedLabels: NATIVE_FAMILY_LABELS[entry.id], origin: `eval/benchmark/unified/family-portfolio.ts#${entry.family}-${entry.id}`, sourceClass: 'authored-family-corpus' as const }))
    const available = authored.length ? authored : candidates.get(family) ?? []
    if (available.length < FAMILY_QUOTA) throw new Error(`${family} has only ${available.length} distinct candidates; quota is ${FAMILY_QUOTA}`)
    portfolio.push(...available.slice(0, FAMILY_QUOTA))
  }
  return portfolio
}

export function portfolioProvenance(portfolio: PortfolioEntry[]): object {
  const familyCounts: Record<string, number> = {}
  const sourceClassCounts: Record<string, number> = {}
  for (const entry of portfolio) {
    familyCounts[entry.family] = (familyCounts[entry.family] ?? 0) + 1
    sourceClassCounts[entry.sourceClass] = (sourceClassCounts[entry.sourceClass] ?? 0) + 1
  }
  return {
    schemaVersion: 1,
    policy: { familyQuota: FAMILY_QUOTA, selection: 'registry-exact; explicit feature-diverse authored native-family portfolio, otherwise deterministic historical source-class priority' },
    entries: portfolio.length,
    familyCounts: Object.fromEntries(Object.entries(familyCounts).sort(([a], [b]) => compareCodePoints(a, b))),
    sourceClassCounts: Object.fromEntries(Object.entries(sourceClassCounts).sort(([a], [b]) => compareCodePoints(a, b))),
    inputs: [
      'eval/benchmark/unified/family-portfolio.ts',
      'eval/mermaid-docs-corpus/corpus.json',
      'eval/layout-compare/fixtures',
      'skill-evals/fixtures',
      'eval/mindmap-gitgraph-content-corpus/manifest.json',
      'eval/mermaid-radar-bench/harvest.json',
      'eval/stable-families/fixtures',
      'src/agent/families.ts',
    ],
  }
}

const NATIVE_FAMILY_LABELS: Record<typeof NATIVE_FAMILY_PORTFOLIO[number]['id'], readonly string[]> = {
  'namespace-inference': ['Cart', 'AddItem', 'ItemAdded', 'CartSummary'],
  'reset-explicit-multiple-sources': ['Stocked', 'PriceChanged', 'Availability'],
  'typed-reference-and-note': ['Screen', 'payment', 'Review address'],
  'given-when-then': ['Order', 'PlaceOrder', 'OrderPlaced'],
  'aliases-and-async': ['Customer', 'Orders', 'Find recent orders', 'Orders ready'],
  'nested-self-call-and-returns': ['checkout()', 'reserve()', 'confirm()', 'ticket', 'receipt'],
  'loop-and-conditional-branches': ['pending', 'ready', 'process()', 'done', 'waiting'],
  'creation-and-typed-assignment': ['Worker', 'reserve()', 'reservation', 'confirmation'],
}
