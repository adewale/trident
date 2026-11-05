// Reviewed schema views for XMermaid 0.4.2 (evangwt/xmermaid) parse_dsl: the cynefin and
// wardley families. Its WASM ships no source; every mapping below was checked against
// captured parser output (scripts/fidelity-probe.ts). See views/index.mjs for the module
// contract and schema-views.mjs for the doctrine.
import { record } from '../schema-views.mjs'

const PROJECT = 'evangwt/xmermaid'
const unsupportedGetters = (reasons, hooks) => Object.fromEntries(Object.entries(reasons).map(([key, reason]) => [key, () => hooks.unsupported(reason)]))

// ── Cynefin ──────────────────────────────────────────────────────────────────────
// XMermaid lists all five domains in a fixed order, each with its item labels, whether or
// not the source wrote a block for it: a domain with items was written, an empty one may
// or may not have been, and the written order of the blocks is not kept. Mermaid's
// cynefinDb.ts keeps a Map of the written blocks, in source order, of { name, items:
// [{ label }] }. Transitions keep from, to and a label ('' when none; Mermaid's undefined).
// The title is kept; accTitle and accDescr are not.
class CynefinDomains extends Map {
  constructor(domains, hooks) {
    super(domains.filter(domain => domain.items.length).map(domain => [domain.id, { name: domain.id, items: domain.items.map(label => ({ label })) }]))
    this.empty = new Set(domains.filter(domain => !domain.items.length).map(domain => domain.id))
    this.hooks = hooks
  }
  unknown(what) {
    return this.hooks.unsupported(`XMermaid lists every cynefin domain, so ${what}`)
  }
  get(key) {
    return this.empty.has(key) ? this.unknown('an empty domain written as a block and one not written cannot be told apart') : super.get(key)
  }
  has(key) {
    return this.empty.has(key) ? this.unknown('an empty domain written as a block and one not written cannot be told apart') : super.has(key)
  }
  get size() {
    return this.empty.size ? this.unknown('an empty domain written as a block and one not written cannot be told apart') : super.size
  }
  keys() { return this.unknown('the written order of the domain blocks is not kept') }
  values() { return this.unknown('the written order of the domain blocks is not kept') }
  entries() { return this.unknown('the written order of the domain blocks is not kept') }
  forEach() { return this.unknown('the written order of the domain blocks is not kept') }
  [Symbol.iterator]() { return this.unknown('the written order of the domain blocks is not kept') }
}
function cynefin(raw, hooks) {
  if (raw.type !== 'cynefin') return undefined
  return {
    getDomains: () => new CynefinDomains(raw.domains ?? [], hooks),
    getTransitions: () => (raw.transitions ?? []).map(item => ({ from: item.from, to: item.to, label: item.label || undefined })),
    getDiagramTitle: () => raw.title ?? '',
    ...unsupportedGetters({ getAccTitle: "XMermaid's cynefin model keeps no accessibility title", getAccDescription: "XMermaid's cynefin model keeps no accessibility description" }, hooks),
  }
}

// ── Wardley ──────────────────────────────────────────────────────────────────────
// XMermaid keeps components { id, label, x, y, anchor } and dependencies { from, to }; it
// rejects label offsets, decorators, notes, annotations, accelerators, evolve, pipeline,
// evolution, size and dashed or labelled links, so its model has none of those fields.
// Its x is its evolution and y its visibility, kept as written (Mermaid's toPercent turns
// a value <= 1 into a percentage); it reads the first coordinate as evolution, where
// Mermaid reads it as visibility. Mermaid's WardleyBuilder lists anchors before
// components (wardleyParser.ts) with className 'anchor' or 'component'.
const toPercent = value => (typeof value === 'number' && value <= 1 ? value * 100 : value)
function wardley(raw, hooks) {
  if (raw.type !== 'wardley') return undefined
  const rejects = what => `XMermaid's wardley parser rejects ${what}; its model has no such field`
  const nodeAbsent = { labelOffsetX: rejects('label offsets'), labelOffsetY: rejects('label offsets'), inertia: rejects('component decorators'), sourceStrategy: rejects('component decorators') }
  const data = () => {
    const components = raw.components ?? []
    const nodes = [...components.filter(item => item.anchor), ...components.filter(item => !item.anchor)].map(item => record({ id: item.id, label: item.label, x: toPercent(item.x), y: toPercent(item.y), className: item.anchor ? 'anchor' : 'component' }, 'wardley node', ['id', 'label', 'x', 'y', 'className', 'labelOffsetX', 'labelOffsetY', 'inertia', 'sourceStrategy', 'inPipeline', 'isPipelineParent'], nodeAbsent, hooks))
    const links = (raw.dependencies ?? []).map(item => record({ source: item.from, target: item.to }, 'wardley link', ['source', 'target', 'dashed', 'label', 'flow'], { dashed: rejects('dashed links'), label: rejects('link labels'), flow: rejects('flow ports') }, hooks))
    const absent = Object.fromEntries(['trends', 'pipelines', 'annotations', 'notes', 'accelerators', 'deaccelerators', 'annotationsBox', 'axes', 'size'].map(key => [key, rejects(key === 'axes' ? 'evolution lines' : key === 'trends' ? 'evolve statements' : `${key} statements`)]))
    return record({ nodes, links }, 'wardley data', ['nodes', 'links', ...Object.keys(absent)], absent, hooks)
  }
  return {
    getWardleyData: data,
    getDiagramTitle: () => raw.title ?? '',
    ...unsupportedGetters({ getAccTitle: "XMermaid's wardley model keeps no accessibility title", getAccDescription: "XMermaid's wardley model keeps no accessibility description" }, hooks),
  }
}

export default {
  schema: {
    cynefin: { [PROJECT]: cynefin },
    wardley: { [PROJECT]: wardley },
  },
}
