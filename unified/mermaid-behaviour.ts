import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync, lstatSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'
import { SaxesParser } from 'saxes'
import corpus from '../corpus/mermaid-behaviour-tests.json' with { type: 'json' }
import type { BehaviourCase, BehaviourStep } from './mermaid-behaviour-corpus.ts'
import { readPublicTestEvidence } from './public-test-reporting.ts'

const hash = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex')
const read = (file: string): any => JSON.parse(readFileSync(file, 'utf8'))
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const aliases = corpus.familyAliases as Record<string, string>
export type BehaviourValue = { kind: 'family'; family: unknown } | { kind: 'svg'; svg: unknown } | { kind: 'unavailable'; reason: string }
export interface BehaviourCheck { criterion: string; status: 'passed' | 'failed' | 'unavailable'; expected: unknown; actual: unknown; detail: string }
interface XmlNode { name: string; uri: string; attrs: Record<string, string>; content: (string | XmlNode)[]; children: XmlNode[] }
const text = (node: XmlNode): string => node.content.map(item => typeof item === 'string' ? item : text(item)).join('')
const normalized = (value: string) => value.normalize('NFC').replace(/\s+/gu, ' ').trim()

/** Evaluate native observations, never upstream callback status or model data
 * inferred from the source. Callers retain their own actual-return evidence. */
export function evaluateBehaviourStep(input: BehaviourCase, step: BehaviourStep, observed: BehaviourValue): BehaviourCheck[] {
  const check = (criterion: string, expected: unknown, actual: unknown, status: BehaviourCheck['status'], detail: string): BehaviourCheck => ({ criterion, expected, actual, status, detail })
  if (observed.kind === 'unavailable') return [check('observable-return', input.operation, null, 'unavailable', observed.reason)]
  if (input.operation === 'detect-family') {
    if (observed.kind !== 'family' || typeof observed.family !== 'string' || !observed.family.trim()) return [check('diagram-family', step.expected.family, null, 'unavailable', 'The native public return exposes no diagram-family string; output presence supplies no family credit')]
    const family = aliases[observed.family] ?? observed.family
    return [check('diagram-family', step.expected.family, { native: observed.family, family }, family === step.expected.family ? 'passed' : 'failed', 'Explicit family aliases only; source is never reparsed to manufacture a returned family')]
  }
  if (observed.kind !== 'svg' || typeof observed.svg !== 'string') return [check('svg-accessible-metadata', step.expected, null, 'unavailable', 'Structural SVG naming cannot be inferred from PNG, terminal text or an absent SVG public return')]
  let root: XmlNode | undefined, failure: string | undefined, hasDoctype = false
  const stack: XmlNode[] = [], ids = new Map<string, XmlNode[]>()
  const nodes: XmlNode[] = [], active: string[] = []
  const parser = new SaxesParser({ xmlns: true })
  parser.on('doctype', () => { hasDoctype = true })
  parser.on('error', error => { failure = String(error) })
  parser.on('opentag', tag => {
    const node: XmlNode = { name: tag.local, uri: tag.uri, attrs: Object.fromEntries(Object.values(tag.attributes).map(attr => [attr.name, attr.value])), content: [], children: [] }
    nodes.push(node)
    if (['script', 'set', 'animate', 'animateTransform', 'link'].includes(node.name) || Object.entries(node.attrs).some(([key, value]) => /^on/i.test(key) || /^(?:href|xlink:href)$/.test(key) && /^javascript:/i.test(value))) active.push('Active/dynamic SVG content')
    if (stack.length) { stack.at(-1)!.children.push(node); stack.at(-1)!.content.push(node) } else root = node
    if (node.attrs.id) ids.set(node.attrs.id, [...ids.get(node.attrs.id) ?? [], node])
    stack.push(node)
  })
  parser.on('text', value => { if (stack.length) stack.at(-1)!.content.push(value) })
  parser.on('cdata', value => { if (stack.length) stack.at(-1)!.content.push(value) })
  parser.on('closetag', () => { stack.pop() })
  parser.on('processinginstruction', instruction => { if (instruction.target !== 'xml') active.push('Unresolved XML processing instruction/stylesheet') })
  try { parser.write(observed.svg).close() } catch (error) { failure = String(error) }
  if (hasDoctype) return [check('static-svg-naming-profile', 'qualified standalone SVG naming without unresolved DTD/entity semantics', null, 'unavailable', 'DOCTYPE/entity semantics are outside this finite safe parser profile; an unfamiliar representation is not an incorrect naming result')]
  if (failure || !root || root.name !== 'svg' || root.uri !== 'http://www.w3.org/2000/svg') return [check('standalone-svg-xml', 'one well-formed namespaced SVG', failure ?? root?.name ?? null, 'failed', 'Actual returned bytes do not provide the required standalone SVG structure')]
  const actualRoot = root
  // This finite static profile does not execute scripts, resolve arbitrary
  // stylesheets or claim an actual browser/AT accessibility tree. Root hiding,
  // role suppression and unfamiliar root-affecting CSS withhold all naming
  // credit even when the requested strings remain readable in serialized XML.
  const roles = (actualRoot.attrs.role ?? '').trim().split(/\s+/).filter(Boolean)
  if (roles.some(role => !['img', 'graphics-document', 'document'].includes(role))) active.push('Unqualified/suppressing SVG root role')
  const ariaHidden = actualRoot.attrs['aria-hidden']?.trim().toLowerCase()
  if (ariaHidden !== undefined && ariaHidden !== 'false' || Object.hasOwn(actualRoot.attrs, 'hidden')) active.push('SVG root accessibility is explicitly hidden or unqualified')
  const declarations = (css: string) => css.split(';').filter(Boolean).map(item => { const colon = item.indexOf(':'); return [item.slice(0, colon).trim().toLowerCase(), item.slice(colon + 1).replace(/!important\s*$/i, '').trim().toLowerCase()] })
  const rootStyles = (css: string) => {
    for (const [property, value] of declarations(css)) {
      if (property === 'display' && !['block', 'inline', 'inline-block'].includes(value!) || property === 'visibility' && value !== 'visible' || property === 'opacity' && !(Number(value) > 0 && Number(value) <= 1) || ['all', 'content', 'content-visibility', 'animation', 'animation-name', 'transition', 'clip', 'clip-path', 'mask', 'mask-image', 'filter'].includes(property!)) active.push('Unresolved root-affecting CSS: ' + property)
    }
  }
  const inlineText = actualRoot.attrs.style ?? '', inlineDeclarations = declarations(inlineText)
  if (/[\\]|\/\*/.test(inlineText)) active.push('Unfamiliar inline stylesheet syntax')
  const rootProperties = /^(?:all|display|visibility|opacity|filter|clip(?:-path)?|mask(?:-image)?|content-visibility|animation(?:-name)?|transition)$/
  if (inlineDeclarations.some(([key], index) => rootProperties.test(key!) && inlineDeclarations.slice(0, index).some(([previous]) => previous === key))) active.push('Duplicate root-affecting inline declarations need a qualified cascade')
  const inline = Object.fromEntries(inlineDeclarations)
  const presentation = Object.fromEntries(['display', 'visibility', 'opacity', 'filter', 'clip-path', 'mask'].filter(key => actualRoot.attrs[key] !== undefined).map(key => [key, actualRoot.attrs[key]]))
  rootStyles(Object.entries({ ...presentation, ...inline }).map(([key, value]) => key + ':' + value).join(';'))
  const rootId = actualRoot.attrs.id
  for (const style of nodes.filter(node => node.name === 'style')) {
    const css = text(style).replace(/\/\*[\s\S]*?\*\//g, '')
    if (/[\\]|@import\b|@namespace\b/i.test(css)) { active.push('Unfamiliar stylesheet syntax/import'); continue }
    for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selector = rule[1]!, body = rule[2]!
      if (declarations(body).some(([property]) => property === 'content')) active.push('Generated stylesheet naming content is unqualified')
      if (!declarations(body).some(([property]) => /^(?:all|display|visibility|opacity|filter|clip(?:-path)?|mask(?:-image)?|content-visibility|animation(?:-name)?|transition)$/.test(property!))) continue
      for (const part of selector.split(',').map(item => item.trim())) {
        // A literal unique root-ID followed by an actual descendant combinator
        // cannot select that same standalone root. This covers scoped native
        // body/edge paint, including dormant keyframe effects, without a CSS
        // cascade or a general selector evaluator.
        if (rootId && new RegExp('^#' + rootId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s+').test(part)) continue
        if (['svg', '*', ':root', ...(rootId ? ['#' + rootId, 'svg#' + rootId] : [])].includes(part) || /^\.[\w-]+$/.test(part) && (actualRoot.attrs.class ?? '').split(/\s+/).includes(part.slice(1))) rootStyles(body)
        else active.push('Unresolved potentially root-affecting stylesheet selector')
      }
    }
  }
  if (active.length) return [check('static-svg-naming-profile', 'static standalone SVG with qualified root semantics', [...new Set(active)], 'unavailable', 'Serialized strings alone do not establish live accessible-tree correctness; active content, root hiding, roles and unfamiliar CSS need a separate qualified observer')]
  const plainContent = (node: XmlNode): boolean => !Object.keys(node.attrs).some(key => /^(?:aria-|role$|style$|hidden$|display$|visibility$|opacity$|filter$|clip|mask)/i.test(key)) && node.children.every(child => ['title', 'desc', 'text', 'tspan'].includes(child.name) && child.uri === actualRoot.uri && plainContent(child))
  const value = (kind: 'title' | 'description'): { value?: string; unknown?: string } => {
    const reference = actualRoot.attrs[kind === 'title' ? 'aria-labelledby' : 'aria-describedby']
    if (reference !== undefined && reference.trim()) {
      const names = reference.trim().split(/\s+/), targets = names.map(id => ids.get(id))
      if (targets.some(target => target?.length !== 1)) return { unknown: 'ARIA references do not resolve to unique actual descendants' }
      if (targets.some(target => target![0]!.uri !== actualRoot.uri || !['title', 'desc', 'text', 'tspan'].includes(target![0]!.name))) return { unknown: 'ARIA target content is outside the finite structural SVG naming profile' }
      if (targets.some(target => !plainContent(target![0]!) || ['text', 'tspan'].includes(target![0]!.name) && nodes.some(node => node.name === 'style'))) return { unknown: 'Referenced naming content has unresolved ARIA, role, hiding, styling or descendant semantics' }
      return { value: targets.map(target => text(target![0]!)).join(' ') }
    }
    const label = actualRoot.attrs[kind === 'title' ? 'aria-label' : 'aria-description']
    if (label?.trim()) return { value: label }
    const native = actualRoot.children.find(node => node.uri === actualRoot.uri && node.name === (kind === 'title' ? 'title' : 'desc'))
    if (native && !plainContent(native)) return { unknown: 'Native metadata has unresolved nested naming/style semantics' }
    return { value: native ? text(native) : '' }
  }
  return (['title', 'description'] as const).map(kind => {
    const actual = value(kind), expected = step.expected[kind]!
    return check('accessible-' + (kind === 'title' ? 'name' : 'description'), expected, actual.value ?? null, actual.unknown ? 'unavailable' : normalized(actual.value ?? '') === normalized(expected) ? 'passed' : 'failed', actual.unknown ?? 'Finite static SVG root title/desc or resolved ARIA naming, with XML entity decoding and whitespace normalization; no generated-ID or Mermaid role-description requirement and no browser/AT accessibility certification')
  })
}

export function assessBehaviourCase(input: BehaviourCase, observed?: readonly BehaviourValue[]) {
  if (!observed) return { id: input.id, origin: input.origin, status: 'unrun' as const, checks: [], reason: 'No retained actual invocation for this case/target' }
  if (observed.length !== input.steps.length) return { id: input.id, origin: input.origin, status: 'unavailable' as const, checks: [], reason: 'Retained invocation count differs from the ordered original source stimuli' }
  const checks = input.steps.flatMap((step, index) => evaluateBehaviourStep(input, step, observed[index]!).map(check => ({ ...check, step: index })))
  return { id: input.id, origin: input.origin, status: checks.some(check => check.status === 'failed') ? 'failed' as const : checks.some(check => check.status === 'unavailable') ? 'unavailable' as const : 'passed' as const, checks, reason: input.adaptation }
}

export const ownedBehaviourFile = (root: string, name: string) => { const file = realpathSync(join(root, name)), own = relative(root, file); if (isAbsolute(own) || own === '..' || own.startsWith('../')) throw Error('Retained evidence escaped its owning directory'); return file }
const owned = ownedBehaviourFile
function scopeDirectories(root: string): string[] {
  const context = read(owned(root, 'context.json'))
  return context.publicScopeUnion ? context.publicScopeUnion.parents.flatMap((parent: any) => scopeDirectories(owned(root, parent.directory))) : [root]
}
function retainedCase(events: any[], input: BehaviourCase): { values?: BehaviourValue[]; gap?: string; rawEventsSha256: string } {
  const own = events.filter(row => row.caseId === input.origin.callbackId), rawEventsSha256 = hash(JSON.stringify(own))
  if (!own.length) return { rawEventsSha256 }
  const starts = own.filter(row => row.type === 'case-start'), ends = own.filter(row => row.type === 'case-end')
  if (starts.length !== 1 || ends.length !== 1 || own[0].type !== 'case-start' || own.at(-1).type !== 'case-end') return { rawEventsSha256, gap: 'Actual callback does not contain one complete owned invocation envelope' }
  const calls = own.slice(1, -1)
  if (calls.length !== input.steps.length * 2) return { rawEventsSha256, gap: 'Actual call count differs from the source-derived ordered stimuli' }
  const values: BehaviourValue[] = []
  for (const [index, step] of input.steps.entries()) {
    const start = calls[index * 2], result = calls[index * 2 + 1]
    if (start.type !== 'call-start' || result.type !== 'call-result' || !Number.isInteger(start.invocation) || index > 0 && start.invocation <= calls[(index - 1) * 2].invocation || start.source !== step.source || result.source !== step.source || hash(start.source) !== step.sourceSha256) return { rawEventsSha256, gap: 'Raw public source/order/causal invocation identity differs from the original stimulus' }
    if (result.disposition !== 'observed' || result.thrown) values.push({ kind: 'unavailable', reason: 'The native public boundary did not return this observable value; generic exceptions and unsupported bindings earn no semantic credit' })
    else if (input.operation === 'detect-family') values.push({ kind: 'family', family: result.returned })
    else values.push({ kind: 'svg', svg: result.returned?.svg })
  }
  return { values, rawEventsSha256 }
}

/** Shared read-only path also qualifies reference raw values for new adapters. */
export function readPublicBehaviourTargets(directory: string, selected?: string[]) {
  const out = realpathSync(directory), evidence = readPublicTestEvidence(out), roots = scopeDirectories(out)
  if (!evidence.qualification.qualified || evidence.cases.length !== 154 || evidence.context.sourceCommit !== corpus.sourceCommit) throw Error('The complete qualified154-callback parent evidence is required; saved status summaries cannot supply raw observations')
  const identities = new Map<string, any>(evidence.context.targets.map((target: any) => [target.binding.project, target]))
  const projects = selected ?? [...identities.keys()]
  if (!projects.length || new Set(projects).size !== projects.length || projects.some(project => !project.trim())) throw Error('Choose unique nonempty project identities')
  return projects.map(project => {
    const identity = identities.get(project), files = roots.flatMap(root => {
      const file = join(root, project === 'mermaid-js/mermaid' ? 'reference-public-binding/calls.jsonl' : Buffer.from(project).toString('base64url') + '/calls.jsonl')
      if (!identity || !existsSync(file)) return []
      const path = owned(root, relative(root, file)), bytes = readFileSync(path), content = bytes.toString()
      if (content && !content.endsWith('\n')) throw Error('Raw invocation stream has a torn final frame')
      return [{ file: relative(out, path), sha256: hash(bytes), events: content.trim().split('\n').filter(Boolean).map(line => JSON.parse(line)) }]
    })
    const rows = (corpus.cases as BehaviourCase[]).map(input => {
      const containing = files.filter(file => file.events.some(row => row.caseId === input.origin.callbackId))
      if (containing.length > 1) throw Error('Duplicate owning callback evidence')
      const file = containing[0], retained = file ? retainedCase(file.events, input) : undefined
      const assessment = retained?.gap ? { ...assessBehaviourCase(input), status: 'unavailable', reason: retained.gap } : assessBehaviourCase(input, retained?.values)
      return { ...assessment, ...(file ? { evidence: { file: file.file, fileSha256: file.sha256, rawEventsSha256: retained!.rawEventsSha256, artifactSha256: identity.entrySha256, bindingSha256: hash(JSON.stringify(identity.binding)) } } : {}) }
    })
    const counts = Object.fromEntries(['passed', 'failed', 'unavailable', 'unrun'].map(status => [status, rows.filter(row => row.status === status).length]))
    return { project, version: identity?.version ?? null, artifact: identity ? { binding: identity.binding, entry: identity.entry, version: identity.version, entrySha256: identity.entrySha256, identitySha256: hash(JSON.stringify(identity)) } : null, planned: corpus.cases.length, counts, rows }
  })
}

export function requireBehaviourReference(directory: string) {
  const root = realpathSync(directory), report = read(owned(root, 'report.json'))
  if (report.protocol !== corpus.protocol || report.corpusSha256 !== hash(readFileSync(new URL('../corpus/mermaid-behaviour-tests.json', import.meta.url))) || report.parent?.directory !== 'parent-public-tests') throw Error('Reference needs an owning current behaviour replay, not a project name or saved qualified flag')
  const parent = owned(root, report.parent.directory), rows = readPublicBehaviourTargets(parent, ['mermaid-js/mermaid']), reference = rows[0]!
  if (reference.artifact?.binding?.kind !== 'mermaid-api' || reference.rows.length !== 49 || reference.rows.some(row => row.status !== 'passed')) throw Error('Actual retained Mermaid raw values do not qualify every adapted behaviour')
  return { schema: 'mermaid-behaviour-reference-v1', project: reference.project, artifactSha256: reference.artifact.entrySha256, corpusSha256: report.corpusSha256, parentReportSha256: hash(readFileSync(join(parent, 'public-conformance-report.json'))), cases: 49, qualified: true, method: 'All49 adapted behaviour cases (75criterion checks) independently passed on actual source/artifact-bound Mermaid returns; original154 native/reference controls also revalidated' }
}

/** Reassess actual retained values independently of original assertions. The
 * unchanged native diagnostic is a provenance prerequisite, not a score oracle. */
export function replayMermaidBehaviours(options: { evidence: string; out: string; projects?: string[] }) {
  const source = realpathSync(options.evidence), out = resolve(options.out)
  if (existsSync(out) || !relative(source, out).startsWith('..')) throw Error('Choose a fresh output outside the parent evidence')
  const parent = readPublicTestEvidence(source)
  if (!parent.qualification.qualified || parent.cases.length !== 154 || parent.context.sourceCommit !== corpus.sourceCommit) throw Error('The complete qualified154-callback parent evidence is required; saved status summaries cannot supply raw observations')
  mkdirSync(out, { recursive: true })
  cpSync(source, join(out, 'parent-public-tests'), { recursive: true, dereference: false, filter: file => { if (lstatSync(file).isSymbolicLink()) throw Error('Retained parent evidence contains an unadmitted symlink'); return true } })
  const copied = join(out, 'parent-public-tests'), evidence = readPublicTestEvidence(copied)
  if (!same(evidence.context, parent.context) || !same(evidence.saved, parent.saved)) throw Error('Owned parent copy differs from its validated evidence')
  const reference = readPublicBehaviourTargets(copied, ['mermaid-js/mermaid'])[0]!
  const qualified = reference.artifact?.binding?.kind === 'mermaid-api' && reference.rows.every(row => row.status === 'passed')
  const targets = readPublicBehaviourTargets(copied, options.projects).map(target => qualified || target.project === 'mermaid-js/mermaid' || !target.artifact ? target : { ...target, counts: { passed: 0, failed: 0, unavailable: 49, unrun: 0 }, rows: target.rows.map(row => ({ ...row, rawAssessment: { status: row.status, checks: row.checks }, status: 'unavailable', checks: [], reason: 'Actual Mermaid behaviour reference is unresolved; peer assertions are withheld' })) })
  const report = { schema: 'trident-mermaid-behaviour-report-v1', protocol: corpus.protocol, captureMode: 'retained-upstream-public-calls', scope: corpus.scope, sourceCommit: corpus.sourceCommit, assessedAt: new Date().toISOString(), parentMeasuredAt: evidence.saved.result.finishedAt, corpusSha256: hash(readFileSync(new URL('../corpus/mermaid-behaviour-tests.json', import.meta.url))), producerSha256: hash(readFileSync(import.meta.filename)), referenceQualification: { qualified, cases: 49, artifactSha256: reference.artifact.entrySha256, rawChecksPassed: reference.rows.filter(row => row.status === 'passed').length }, parent: { directory: 'parent-public-tests', contextSha256: hash(readFileSync(join(copied, 'context.json'))), inventorySha256: hash(readFileSync(join(copied, 'inventory.json'))), reportSha256: hash(readFileSync(join(copied, 'public-conformance-report.json'))), nativeCallbacks: 154 }, adaptations: { selected: 49, originalApiCompatibility: false, originalAssertionsReexecuted: false, acceptanceOnlyAssertions: 0, structuralSvgNaming: 19, orderedFamilySemantics: 30, excludesJsdomGeometry: true }, targets, projectInvocations: 0, timing: 'No new project calls or performance claim. Actual values retain their source/artifact-bound native parent evidence; observer assessment time is separate.', limits: ['Only detector-family and structural SVG naming behaviours are implemented; other154-callback surfaces are explicitly excluded in the corpus.', 'Missing API capabilities, absent raw values and incomplete parent invocations remain unavailable/unrun; original callback pass/fail is never substituted.', 'PNG/terminal output cannot prove SVG accessible naming. These results do not certify drawing content, full accessibility or whole Mermaid conformance.'] }
  writeFileSync(join(out, 'corpus.json'), JSON.stringify(corpus, null, 2) + '\n')
  writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n')
  return report
}

export const BEHAVIOUR_HELP = `Usage: bun commands.ts mermaid:behaviour --plan
  --replay-public QUALIFIED154_DIRECTORY --out FRESH_DIRECTORY [--projects OWNER/TOOL,...]
  --adapter ADAPTER_JSON --reference QUALIFIED_BEHAVIOUR_DIRECTORY --out FRESH_DIRECTORY
  --replay-capture NATIVE_CAPTURE_DIRECTORY --reference QUALIFIED_BEHAVIOUR_DIRECTORY --out FRESH_DIRECTORY
49 source-derived semantic adaptations (30family/precedence,19SVG accessible naming), not unchanged upstream tests, acceptance totals or exact API compatibility. Retained replay starts no renderer; unmeasured projects remain unrun.
Native manifest: {"schema":"mermaid-behaviour-stdio-adapter-v1","project":"owner/tool","version":"installed-version","executable":"/absolute/node","adapter":"/absolute/bridge.mjs","args":[],"artifactFiles":["/absolute/public-entry.js"],"capabilities":["detect-family","svg-accessibility"],"bindingDescription":"native public functions called by this bridge"}.
Bridge stdin: {protocol,operation:"detect-family"|"render-svg",source}. Return exactly one native JSON {family:string}, {svg:string}, or {unsupported:true}. Expected answers are never sent. Included unified/mermaid-behaviour-node-adapter.mjs reads one config-file argument {module:"/absolute/public-entry.js",detect:{export:"detect",familyPath:"family"},render:{export:"renderSvg",svgPath:"svg"}}; omit field paths for native string returns. No source checkout or Vitest is needed for new peers. Capture is one process per supported stimulus, raw-first, no warmups/retries/timing score. Declared files are hashed; undeclared dependency closure is not certified. --reference independently requalifies actual retained Mermaid raw behaviours; a saved qualified flag is insufficient.`
if (import.meta.main) {
  const args = process.argv.slice(2)
  if (args.length === 1 && args[0] === '--help') console.log(BEHAVIOUR_HELP)
  else if (args.length === 1 && args[0] === '--plan') console.log(JSON.stringify(corpus, null, 2))
  else {
    const options = new Map<string, string>()
    for (let index = 0; index < args.length; index += 2) { const flag = args[index]!, value = args[index + 1]; if (!['--replay-public', '--out', '--projects', '--adapter', '--reference', '--replay-capture'].includes(flag) || options.has(flag) || !value || value.startsWith('--')) throw Error(BEHAVIOUR_HELP); options.set(flag, value) }
    if (!options.has('--out')) throw Error(BEHAVIOUR_HELP)
    if (options.has('--adapter') || options.has('--replay-capture')) {
      if (options.has('--replay-public') || options.has('--projects') || !options.has('--reference') || options.has('--adapter') === options.has('--replay-capture')) throw Error(BEHAVIOUR_HELP)
      const { runNativeBehaviours } = await import('./mermaid-behaviour-capture.ts')
      const report = runNativeBehaviours({ out: options.get('--out')!, reference: options.get('--reference')!, ...(options.has('--adapter') ? { adapter: options.get('--adapter')! } : { capture: options.get('--replay-capture')! }) })
      console.log(JSON.stringify({ out: resolve(options.get('--out')!), captureMode: report.captureMode, targets: report.targets.map(({ project, counts }) => ({ project, counts })), projectInvocations: report.projectInvocations })); process.exit(0)
    }
    if (!options.has('--replay-public') || options.has('--reference')) throw Error(BEHAVIOUR_HELP)
    const report = replayMermaidBehaviours({ evidence: options.get('--replay-public')!, out: options.get('--out')!, ...(options.has('--projects') ? { projects: options.get('--projects')!.split(',') } : {}) })
    console.log(JSON.stringify({ out: resolve(options.get('--out')!), protocol: report.protocol, targets: report.targets.map(({ project, counts }) => ({ project, counts })), projectInvocations: 0 }))
  }
}
