// Original test bodies run once in Vitest. Only production imports are adapted.
import { readFileSync, appendFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve, dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { projectPublicDatabase } from '../upstream-fidelity-projection.mjs'
import { persistentBridge } from './bridge-client.mjs'
import { nativeAstView, mermaidConstants } from './schema-views.mjs'
import { importFamily } from './namespace.mjs'
import { parseAgenticSource } from './agentic-parser.mjs'
import { unsupportedKind, type UnsupportedKind, type UnsupportedProvenance } from './outcome-kinds.ts'
import { unboundNativeCapability } from './native-capabilities.mjs'

const job = JSON.parse(readFileSync(process.env.TRIDENT_FIDELITY_JOB!, 'utf8'))
// Parallel test files run in separate worker processes; each appends to its own part.
const auditFile = (job.workers ?? 1) > 1 ? `${job.audit}.${process.pid}` : job.audit
const referenceRequire = createRequire(join(job.reference, 'package.json'))
let bridgeClient: ReturnType<typeof persistentBridge> | undefined, nativeClient: ReturnType<typeof persistentBridge> | undefined
// Non-default host configuration a test has set for the candidate. Cleared at each test
// start, as the control's Mermaid configuration is, so a setting made outside a test
// never reaches a later test.
let hostConfig: Record<string, any> | undefined
const configKeys = (value: any) => Object.keys(value ?? {}).filter(key => key !== 'securityLevel' || value[key] !== 'strict')
/** Candidate parse calls see the configuration in effect; one without a configuration interface is a gap. */
function configuredCall() {
  if (!hostConfig || !configKeys(hostConfig).length) return undefined
  if (job.target.configInterface) return hostConfig
  return gap(`Host configuration in effect for this parse (${configKeys(hostConfig).join(', ')}); the candidate's interface takes source text only`)
}
let nativeLoadGap: string | undefined,
  useBunParser = false
let api: any,
  definitions = new Map<string, any>(),
  configurations: any,
  language: any
let active: { protocol: string; expectedFailure: boolean; id: string; file: string; name: string; fullName: string; index: number; gaps: Set<string>; calls: number; rejections: number; unsupported: string[]; unsupportedKinds: UnsupportedKind[]; faults: string[] } | undefined
const contexts = new Map<string, any>(),
  deferredValues = new WeakMap<object, string>(),
  ownDatabases = new WeakSet<object>(),
  // Mermaid's database module of a family (`import * as timelineDB from './timelineDb.js'`),
  // bound to the candidate's own model like the module's getters, by its context.
  databaseModules = new WeakMap<object, any>()
/** Nesting of parser -> database calls being delivered to a test's database or spy. */
let forwarding = 0
/** The methods of a candidate's own database class along its prototype chain, each with
 * the prototype that defines it. */
function nativeMethods(nativeClass: any) {
  const methods = new Map<string, object>()
  for (let proto = typeof nativeClass === 'function' ? nativeClass.prototype : undefined; proto && proto !== Object.prototype; proto = Object.getPrototypeOf(proto))
    for (const name of Object.getOwnPropertyNames(proto)) if (name !== 'constructor' && !methods.has(name) && typeof Object.getOwnPropertyDescriptor(proto, name)?.value === 'function') methods.set(name, proto)
  return methods
}
/**
 * The parser -> database protocol of a candidate whose parse result is an instance of its
 * own database class (a port that keeps Mermaid's database records, such as Pele): its
 * parser builds the model by calling that class's methods. While `run` parses, every
 * outermost call the candidate's parser makes on a method that `receiver` accepts (a test's
 * own `yy` database, or a spy the test installed on the database) is delivered to it too,
 * with the candidate's own arguments, before the candidate's method runs. Nothing is
 * translated or invented: the receiver sees the calls the candidate's parser made, and the
 * candidate's own database still builds its model. Returns the delivered method names; with
 * none, `run` is not called.
 */
function forwardNativeCalls<T>(nativeClass: any, receiver: (name: string) => ((...args: any[]) => unknown) | undefined, run: () => T): { forwarded: string[]; value?: T } {
  const patched: [object, string, PropertyDescriptor][] = []
  for (const [name, proto] of nativeMethods(nativeClass)) if (receiver(name)) patched.push([proto, name, Object.getOwnPropertyDescriptor(proto, name)!])
  if (!patched.length) return { forwarded: [] }
  let depth = 0
  for (const [proto, name, descriptor] of patched) {
    const original = descriptor.value
    Object.defineProperty(proto, name, {
      ...descriptor,
      value: function (this: any, ...args: any[]) {
        depth++
        try {
          if (depth === 1) {
            forwarding++
            try { receiver(name)?.(...args) } finally { forwarding-- }
          }
          return original.apply(this, args)
        } finally {
          depth--
        }
      },
    })
  }
  try {
    return { forwarded: patched.map(([, name]) => name), value: run() }
  } finally {
    for (const [proto, name, descriptor] of patched) Object.defineProperty(proto, name, descriptor)
  }
}
const isMock = (value: any) => typeof value === 'function' && value._isMockFunction === true
/** Record one unsupported verdict with its provenance (outcome-kinds.ts): the
 * candidate's own refusal or result, a bridge's reply, or Trident's own assessment. */
function recordUnsupported(reason: string, provenance: UnsupportedProvenance, audit = active) {
  if (!audit) return
  audit.unsupported.push(reason)
  audit.unsupportedKinds.push(unsupportedKind(reason, provenance))
}
/** An operation the candidate's real interface does not offer. The candidate's
 * interface is parse(source) -> its own model; Mermaid's mutable database API and
 * jison callback protocol are not part of it. Recorded as the raw 'unsupported'
 * disposition; scoring counts it as unassessed (scoring.ts). Trident's judgement is a
 * capability assessment unless `provenance` says the candidate's own code reported it. */
function unsupportedOperation(reason: string, provenance: UnsupportedProvenance = 'trident'): never {
  // The verdict comes from the candidate's own interface, so it counts as exercised.
  if (active && !failureReport()) {
    active.calls++
    recordUnsupported(reason, provenance)
  }
  throw Error('Unsupported candidate operation: ' + reason)
}
/**
 * Whether a read happens while an assertion that has already failed formats its message
 * or diff (chai's inspect, pretty-format, Vitest's diff and error serialisation). Those
 * reads are not observations: a test that failed `toHaveLength(2)` stays failed, rather
 * than becoming unsupported because the message printed a declared-absent field. Snapshot
 * matchers serialise values to compare them, so reads under them still count.
 */
const REPORTING = /[\\/]@vitest[\\/](?:pretty-format|utils[\\/]dist[\\/](?:diff|error|chunk-_commonjsHelpers))[\\/.]|\bat (?:\S+\.)?(?:objDisplay|getMessage|inspect\w*|formatValue)\b.*[\\/]chai[\\/]index\.js/
function failureReport() {
  const limit = Error.stackTraceLimit
  Error.stackTraceLimit = 80
  const stack = new Error().stack ?? ''
  Error.stackTraceLimit = limit
  return REPORTING.test(stack) && !/[\\/]@vitest[\\/]snapshot[\\/]/.test(stack)
}
// Mermaid database members that change or compute state rather than observe a parse.
const DATABASE_OPERATION = /^(?:add|set|update|define|make|insert|remove|push|pop|enter|exit|apply|toggle|commit|branch|merge|checkout|cherryPick|draw|lookUp|sanitize|edgeStrTo|emit[A-Z]|parse[A-Z])/
// Mermaid database API that observes Mermaid's own state rather than a parse result.
// preserveCommentsWhenParsing is a DiagramDB flag that Mermaid's Diagram pipeline reads, not a parse result.
const DATABASE_API = new Set(['getConfig', 'getConfigField', 'exists', 'createModel', 'prettyPrint', 'bindFunctions', 'preserveCommentsWhenParsing'])
/** Database members that return Mermaid's renderer layout data. They are unsupported for
 * every candidate (4 November policy) whether or not a diagram has been parsed. */
const RENDERER_LAYOUT: Record<string, Record<string, string>> = {
  mindmap: { getData: "Mermaid's mindmap getData() is its renderer's layout data" },
  class: { getData: "Mermaid's class getData() is its renderer's layout data under the host configuration" },
  architecture: { getDataStructures: "Mermaid's architecture getDataStructures() is its renderer's layout computation" },
}
const CLEARS_ON_REJECTION = new Set(['usecase'])
const mermaidDatabaseMember = (key: unknown) => typeof key === 'string' && (DATABASE_OPERATION.test(key) || DATABASE_API.has(key))
/** Mermaid's database API (or, with no member, the jison callback protocol) is the
 * candidate's unsupported operation, unless the capability review found that its public
 * interface implements it natively: then it is a Trident gap until a binding calls it. */
function absentDatabaseCapability(family: string, member: string | undefined, reason: string): never {
  const native = job.target.tool === 'mermaid' ? undefined : unboundNativeCapability(job.target.project, job.target.version, family, member)
  if (native) return gap(native)
  return unsupportedOperation(reason)
}
export class AdapterGap extends Error {}
function gap(reason: string): never {
  if (!failureReport()) active?.gaps.add(reason)
  throw new AdapterGap('TRIDENT_ADAPTER_GAP: ' + reason)
}
function candidateFault(reason: string): never {
  active?.faults.push(reason)
  throw Error('Candidate parser fault: ' + reason)
}
function invokeParser(call: () => any) {
  try { return call() }
  catch (error) {
    if (error instanceof TypeError || error instanceof ReferenceError || error instanceof RangeError) return candidateFault(String(error))
    throw error
  }
}
function deferred(reason: string): any {
  if (active && !failureReport()) active.gaps.add(reason)
  const value = new Proxy(function () {}, {
    get(_t, key) {
      if (key === 'then' || key === 'asymmetricMatch' || key === 'toJSON') return undefined
      return deferred(reason + '.' + String(key))
    },
    apply() {
      return gap(reason)
    },
    construct() {
      return gap('new ' + reason)
    },
  })
  deferredValues.set(value, reason)
  return value
}
/** A deferred value that records its gap only when used: read, compared or inspected.
 * Only the unbound Mermaid Diagram renderer uses it; database and module namespace
 * reads are rejected outright. */
function untilUsed(reason: string): any {
  const use = (key: unknown) => deferred(reason + (key === undefined ? '' : '.' + String(key)))
  const value: any = new Proxy(function () {}, {
    get(_t, key) {
      if (key === 'then' || key === 'asymmetricMatch' || key === 'toJSON') return undefined
      return use(key)
    },
    apply: () => untilUsed(reason + '()'),
    construct: () => gap('new ' + reason),
    has: (_t, key) => use(key),
    ownKeys: () => use(undefined),
    getOwnPropertyDescriptor: (_t, key) => use(key),
  })
  deferredValues.set(value, reason)
  return value
}
const examples: Record<string, string> = {
  flowchart: 'flowchart TD\nA-->B',
  sequence: 'sequenceDiagram\nA->>B: hello',
  class: 'classDiagram\nclass A',
  state: 'stateDiagram-v2\n[*]-->A',
  er: 'erDiagram\nA ||--o{ B : owns',
  pie: 'pie\n"A":1',
  journey: 'journey\nsection A\nTask: 3: Me',
  gantt: 'gantt\ndateFormat YYYY-MM-DD\nA:2024-01-01,1d',
  gitgraph: 'gitGraph\ncommit',
  mindmap: 'mindmap\nroot\n child',
  timeline: 'timeline\n2024: A',
  quadrant: 'quadrantChart\nx-axis Low --> High\ny-axis Low --> High\nA: [0.2,0.3]',
  requirement: 'requirementDiagram\nrequirement A {\nid: 1\ntext: A\nrisk: low\nverifymethod: test\n}',
  sankey: 'sankey-beta\nA,B,1',
  xychart: 'xychart-beta\nx-axis [A,B]\ny-axis 0 --> 2\nbar [1,2]',
  block: 'block-beta\nA',
  packet: 'packet-beta\n0-7: "A"',
  kanban: 'kanban\nA[Todo]\n B[Task]',
  architecture: 'architecture-beta\nservice A(server)[A]',
  radar: 'radar-beta\naxis a["A"], b["B"]\ncurve c["C"]{1,2}',
  treemap: 'treemap-beta\n"A": 1',
  c4: 'C4Context\nPerson(a,"A")',
  eventmodeling: 'eventmodeling\n\ntf 01 ui CartUI\ntf 02 cmd AddItem\ntf 03 evt ItemAdded',
  ishikawa: 'ishikawa-beta\nA\n  B',
  // Families added to Mermaid after the original example list; headers follow each detector.
  agentflow: 'agentflow-beta TB\n  a["A"] --> b["B"]',
  railroad: 'railroad-beta\nexpression = terminal("a") ;',
  'railroad:ebnf': 'railroad-ebnf-beta\nsign = "+" | "-" ;',
  'railroad:abnf': 'railroad-abnf-beta\nsign = "+" / "-"',
  'railroad:peg': 'railroad-peg-beta\nsign <- "+" / "-"',
  usecase: 'usecase-beta\nactor User\nLogin\nUser --> Login',
  treeview: 'treeView-beta\n    "packages"\n        "mermaid"',
  cynefin: 'cynefin-beta\n  complex\n  clear',
  venn: 'venn-beta\n  set A["Alpha"]\n  set B["Beta"]',
  wardley: 'wardley-beta\ntitle A\nsize [800, 1000]',
  swimlanes: 'swimlane-beta\n  subgraph Sales\n    lead[Qualify lead]\n  end',
}
// One test family can hold several Mermaid diagram types, told apart by their header.
const variants: Record<string, [RegExp, string][]> = { railroad: [[/^\s*railroad-ebnf-beta/i, 'railroad:ebnf'], [/^\s*railroad-abnf-beta/i, 'railroad:abnf'], [/^\s*railroad-peg-beta/i, 'railroad:peg']] }
const definitionFor = (family: string, source: string) => definitions.get(variants[family]?.find(([header]) => header.test(source))?.[1] ?? family)
export async function initialize(file?: string) {
  if (api) return
  if (job.target.tool === 'mermaid') {
    const entry = referenceRequire.resolve('mermaid')
    api = (await import(/* @vite-ignore */ pathToFileURL(entry).href)).default
    api.initialize({ startOnLoad: false, securityLevel: 'strict', logLevel: 'fatal' })
    const text = readFileSync(entry, 'utf8'),
      chunk = [...text.matchAll(/import\s*\{([^}]+)\}\s*from\s*"([^"]+)"/g)].find(x => /\bsetConfig\b/.test(x[1]!))?.[2]
    if (chunk) configurations = await import(/* @vite-ignore */ new URL(chunk, pathToFileURL(entry)).href)
    let manifestText = ''
    const manifest = referenceRequire.resolve
      .paths('@mermaid-js/parser')!
      .map(p => join(p, '@mermaid-js/parser/package.json'))
      .find(p => {
        try {
          manifestText = readFileSync(p, 'utf8')
          return true
        } catch {
          return false
        }
      })!
    language = await import(/* @vite-ignore */ pathToFileURL(resolve(dirname(manifest), JSON.parse(manifestText).exports['.'].import)).href)
    for (const family of new Set(job.files.filter((f: any) => !file || f.absolute === file).map((f: any) => f.family)) as Set<string>)
      for (const key of [family, ...(variants[family] ?? []).map(([, key]) => key)])
        if (examples[key]) {
          try {
            definitions.set(key, await api.mermaidAPI.getDiagramFromText(examples[key]))
          } catch {}
        }
  } else if (job.target.tool === 'beautiful') {
    const family = job.files.find((f: any) => f.absolute === file)?.family
    const modules: Record<string, string> = { flowchart: 'src/parser.ts', state: 'src/parser.ts', sequence: 'src/sequence/parser.ts', class: 'src/class/parser.ts', er: 'src/er/parser.ts' }
    if (modules[family]) {
      const entry = resolve(job.target.root, modules[family]!)
      try {
        api = await import(/* @vite-ignore */ pathToFileURL(entry).href)
      } catch {
        api = await import(/* @vite-ignore */ pathToFileURL(job.target.entry).href)
      }
    } else api = {}
  } else if (job.target.tool === 'bridge') {
    api = {}
  } else {
    try {
      api = await import(/* @vite-ignore */ pathToFileURL(job.target.entry).href)
      if (job.target.peer?.artifact?.kind === 'franken') api.initSync({ module: readFileSync(job.target.peer.artifact.wasm) })
    } catch (error) {
      api = {}
      nativeLoadGap = 'Installed native module could not load: ' + String(error)
      useBunParser = /Bun/.test(job.target.peer?.artifact?.runtime ?? '')
    }
  }
}
/** The native model a candidate's parser returns for one source, as the views receive it
 * (scripts/fidelity-probe.ts). */
export function probeNative(family: string, source: string) {
  return nativeParse(family, source)
}
/** End of a test file: stop its persistent bridge process. */
export function shutdown() {
  bridgeClient?.close()
  nativeClient?.close()
  bridgeClient = nativeClient = undefined
}
const callbackIndices = new WeakMap<object, Map<string, number>>()
export function begin(task: any) {
  if (active) throw new AdapterGap('TRIDENT_ADAPTER_GAP: Overlapping test audit ownership')
  const flatten = (node: any): any[] => (node.tasks ? node.tasks.flatMap(flatten) : node.type === 'test' ? [node] : [])
  let indices = callbackIndices.get(task.file)
  if (!indices) { indices = new Map(flatten(task.file).map((test, index) => [test.id, index])); callbackIndices.set(task.file, indices) }
  const index = indices.get(task.id)
  if (index === undefined) throw new AdapterGap('TRIDENT_ADAPTER_GAP: Callback is absent from the collected file')
  const names = [task.name]
  for (let suite = task.suite; suite; suite = suite.suite) if (suite.name) names.unshift(suite.name)
  active = { protocol: job.target.tool === 'mermaid' ? 'pinned-source-control-v1' : 'native-operations-v2', expectedFailure: !!task.fails, id: task.id, file: task.file.filepath, index, name: names.join(' > '), fullName: names.join(' '), gaps: new Set(), calls: 0, rejections: 0, unsupported: [], unsupportedKinds: [], faults: [] }
  if (job.target.tool === 'mermaid') configurations?.reset?.()
  hostConfig = undefined
  const c = contexts.get(task.file.filepath)
  if (c?.unavailableImports?.size) {
    // The identifiers this test's code and its file's helpers use, precomputed once per run
    // by the census (upstream-fidelity-census.ts); no parsing per test.
    const file = job.files.find((f: any) => f.absolute === task.file.filepath)
    const title = String(task.name)
    const selected = file.declarations.filter((d: any) => d.name === title || title.startsWith(d.name.split(/%[sdifjo#]|\$\w+/)[0]))
    const used = new Set<string>(selected.length ? [...selected.flatMap((d: any) => d.identifiers ?? []), ...(file.helperIdentifiers ?? [])] : (file.fileIdentifiers ?? []))
    for (const [name, reason] of c.unavailableImports) if (used.has(name)) active.gaps.add('Unavailable imported value used by original test: ' + name + ' (' + reason + ')')
  }
}
export function finish(task: any) {
  if (!active || active.id !== task.id) throw new AdapterGap('TRIDENT_ADAPTER_GAP: Unbalanced test audit ownership')
  if (job.target.tool !== 'mermaid' && !active.calls && !active.unsupported.length) active.gaps.add('No candidate operation was exercised by this test')
  const gaps = [...active.gaps]
  appendFileSync(auditFile, JSON.stringify({ ...active, gaps }) + '\n')
  const reason = gaps.join('; ')
  active = undefined
  if (reason && task.result?.state !== 'skip') throw new AdapterGap('TRIDENT_ADAPTER_GAP: ' + reason)
}

/** One reply protocol for every out-of-process parser bridge: the last stdout
 * line is {value} | {error:{name,message}} | {unsupported} | {adapterGap}.
 * Only a parser's own syntax errors count as rejections; transport, import and
 * unclassified failures are Trident gaps. */
function bridgeReply(stdout: string, family: string, label: string) {
  let reply: any
  try {
    reply = JSON.parse(stdout.trim().split('\n').at(-1)!, (_key, v) => (v?.__tridentNativeMap ? new Map(v.__tridentNativeMap) : v?.__tridentNativeSet ? new Set(v.__tridentNativeSet) : v?.__tridentNativeDate ? new Date(v.__tridentNativeDate) : v))
  } catch {
    return gap(label + ' returned no structured observation')
  }
  if (reply.adapterGap) return gap(reply.adapterGap)
  if (reply.candidateFault) return candidateFault(reply.candidateFault)
  if (reply.unsupported) {
    recordUnsupported(reply.unsupported, reply.native ? 'native' : 'bridge')
    throw Error(reply.unsupported)
  }
  if (reply.error) {
    const e = reply.error
    if (/^(?:TypeError|ReferenceError|RangeError)$/.test(e.name)) return candidateFault(e.name + ': ' + e.message)
    if (/Unsupported|UnknownDiagram/.test(e.name) || /unsupported diagram|unknown diagram|unrecognized diagram type|unsupported .*diagram type/i.test(e.message)) {
      recordUnsupported(e.message, 'native')
      throw Error(e.message)
    }
    if (!/^(?:ParseError|MermaidSyntaxError|MermaidParseError|SyntaxError)$/.test(e.name) && !/parse error|parsing failed|invalid (?:syntax|flowchart)|syntax error/i.test(e.message)) return gap('Unclassified native parser refusal: ' + e.message)
    active && active.rejections++
    throw Error(e.message)
  }
  if (reply.value?.kind && reply.value.diagram && reply.value.kind !== family) return gap('Native generic parser returned ' + reply.value.kind + '; requested ' + family + ' parser operation is not available')
  return reply.value?.kind && reply.value.diagram ? reply.value.diagram : reply.value
}
function nativeParse(family: string, source: string) {
  active && active.calls++
  const config = configuredCall()
  if (job.target.tool === 'bridge' && job.target.bridge.persistent) {
    // The same bridge, loaded once per test file and answering one request per line.
    const [command, ...args] = job.target.bridge.command
    bridgeClient ??= persistentBridge(command, args, job.target.bridge.cwd, 10_000)
    const reply = bridgeClient.call({ family, source })
    if (reply.failure) return gap('Parser bridge failed: ' + reply.failure)
    return bridgeReply(reply.line, family, 'Parser bridge')
  }
  if (job.target.tool === 'bridge') {
    // The project's own parser, in its own language, behind a per-call process.
    const [command, ...args] = job.target.bridge.command
    const child = spawnSync(command, args, { input: JSON.stringify({ family, source }), cwd: job.target.bridge.cwd, encoding: 'utf8', timeout: 10_000, maxBuffer: 16 * 1024 * 1024 })
    if (child.error || child.status !== 0) return gap('Parser bridge failed: ' + (child.error?.message ?? child.stderr.slice(0, 400)))
    return bridgeReply(child.stdout, family, 'Parser bridge')
  }
  if (job.target.tool === 'agentic') {
    try {
      const parsed = invokeParser(() => parseAgenticSource(api, family, source))
      if (parsed) {
        if (parsed.model?.then) return gap('Asynchronous parser cannot supply the original synchronous parse interface')
        // Harness metadata selects the reviewed native model; it is not an
        // authored source field or a projection of Mermaid's parser result.
        return { ...parsed.model, nativeParser: parsed.operation, editingModel: parsed.editingModel }
      }
    } catch (error: any) {
      if (error instanceof AdapterGap) throw error
      if (/^Candidate parser fault:/.test(String(error?.message))) throw error
      if (!/^(?:MermaidSyntaxError|MermaidParseError|ParseError|SyntaxError)$/.test(String(error?.name))) return gap('Unclassified Agentic source parser refusal: ' + String(error?.message ?? error))
      active && active.rejections++
      throw error
    }
    if (typeof api.parseRegisteredMermaid !== 'function') return gap('Agentic no longer exports its editing parser and has no reviewed source parser for ' + family)
    const result = invokeParser(() => api.parseRegisteredMermaid(source))
    if (result?.then) return gap('Asynchronous parser cannot supply the original synchronous parse interface')
    if (!result.ok) {
      const errors = Array.isArray(result.error) ? result.error : [result.error]
      if (!errors.every((e: any) => /PARSE_ERROR|PARSE_FAILED|SYNTAX_ERROR|INVALID_FRONTMATTER/.test(e.code ?? ''))) return gap('Unclassified native parser refusal: ' + JSON.stringify(result.error))
      active && active.rejections++
      throw Error(JSON.stringify(result.error))
    }
    if (['opaque', 'preserved'].includes(result.value.body.kind)) {
      recordUnsupported('Actual native parse returned ' + result.value.body.kind, 'native')
      throw Error('Native semantic support unavailable')
    }
    return { ...result.value.body, ...(result.value.meta?.title !== undefined ? { title: result.value.meta.title } : {}), ...(result.value.meta?.accessibility?.title !== undefined ? { accessibilityTitle: result.value.meta.accessibility.title } : {}), ...(result.value.meta?.accessibility?.descr !== undefined ? { accessibilityDescription: result.value.meta.accessibility.descr } : {}) }
  }
  if (job.target.tool === 'beautiful') {
    const names: Record<string, string> = { flowchart: 'parseMermaid', state: 'parseMermaid', sequence: 'parseSequenceDiagram', class: 'parseClassDiagram', er: 'parseErDiagram' }
    const parse = api[names[family]!]
    if (typeof parse !== 'function') return gap('Native parser/schema adapter is unavailable for ' + family)
    try {
      const value = invokeParser(() => parse(
        family === 'flowchart' || family === 'state'
          ? source
          : source
              .split(/\r?\n/)
              .map(line => line.trim())
              .filter(Boolean),
      ))
      if (value?.then) return gap('Native parse is asynchronous; synchronous database view unavailable')
      return value
    } catch (error: any) {
      if (error?.name !== 'Error' || !String(error.stack).includes(job.target.root)) return gap('Unclassified native parser exception: ' + String(error))
      active && active.rejections++
      throw error
    }
  }
  if (job.target.tool === 'native' || job.target.tool === 'zombie') {
    if (nativeLoadGap && !useBunParser && !job.target.parserEntries?.[family]) return gap(nativeLoadGap)
    const selectors: Record<string, string[]> = {
      flowchart: ['parseFlowchart', 'parseFlowchartToGraph', 'parseMermaidFlowchartDiagram', 'parseMermaid'],
      class: ['parseClassDiagram'],
      sequence: ['parseSequenceDiagram', 'parseMermaidSequenceDiagram', 'parseSequence'],
      er: ['parseErDiagram'],
      state: ['parseStateDiagram', 'parseMermaidStateDiagram'],
      gantt: ['parseMermaidGanttDiagram'],
      timeline: ['parseMermaidTimelineDiagram'],
      gitgraph: ['parseMermaidGitGraphDiagram'],
    }
    if (useBunParser || job.target.parserEntries?.[family] || typeof api.parseToIR === 'function') {
      const entry = job.target.parserEntries?.[family] ?? job.target.entry
      // One long-lived Bun process per test file answers every parse (a process per parse
      // cost about 110 ms each).
      nativeClient ??= persistentBridge(job.target.bun, [join(import.meta.dirname, 'native-call.mjs')], undefined, 5000)
      const reply = nativeClient.call({ entry, source, methods: [...(selectors[family] ?? []), 'parse', 'parseToIR'] })
      if (reply.failure) return gap('Native Bun parser bridge failed: ' + reply.failure)
      return bridgeReply(reply.line, family, 'Native Bun parser bridge')
    }
    const selected = (selectors[family] ?? []).find(name => typeof api[name] === 'function')
    // Generic parse is used only for an API whose own returned kind distinguishes
    // families; no source prefix detector is invented by this adapter.
    const parser = selected ? api[selected] : typeof api.parse === 'function' ? api.parse : undefined
    if (!parser) return gap('Installed public module has no synchronous ' + family + ' parser binding')
    try {
      const result = invokeParser(() => parser(source))
      if (result?.then) {
        void result.catch(() => {})
        return gap('Native parser requires an asynchronous schema binding')
      }
      if (result?.ir?.diagram_type) {
        const ir = result.ir
        // Frankenmermaid's IR is read by its reviewed schema views (schema-views.mjs and
        // views/frankenmermaid.mjs); a family with no view stays a gap at projection.
        if (job.target.project === 'Dicklesworthstone/frankenmermaid') return ir
        if (family !== 'flowchart' || ir.diagram_type !== 'Flowchart') return gap('Native IR schema for ' + ir.diagram_type + ' is not mapped to the original ' + family + ' database')
        const shapes: Record<string, string> = { Rect: 'square', Rounded: 'round', Circle: 'circle', Diamond: 'diamond', Stadium: 'stadium', Hexagon: 'hexagon', Cylinder: 'cylinder', Subroutine: 'subroutine', DoubleCircle: 'doublecircle' }
        const nodes = ir.nodes.map((node: any) => {
          const label = node.label == null ? node.id : ir.labels[node.label]?.text
          if (typeof node.id !== 'string' || typeof label !== 'string') return gap('Native IR node/label index is unqualified')
          return { ...node, label, ...(shapes[node.shape] ? { type: shapes[node.shape] } : {}) }
        })
        const endpoint = (value: any) => (typeof value?.Node === 'number' && nodes[value.Node]?.id) || gap('Native IR endpoint is not an ordinary observed node')
        return {
          direction: ir.direction,
          nodes,
          edges: ir.edges.map((edge: any) => ({ source: endpoint(edge.from), target: endpoint(edge.to), ...(edge.label !== undefined ? { label: ir.labels[edge.label]?.text } : {}), ...(edge.arrow === 'Arrow' ? { type: 'arrow_point' } : edge.arrow === 'None' ? { type: 'arrow_open' } : {}) })),
          ...(ir.clusters?.length === 0 ? { subgraphs: [] } : {}),
        }
      }
      if (result?.kind && result.diagram) {
        if (result.kind !== family) return gap('Native generic parser returned ' + result.kind + '; requested ' + family + ' parser operation is not available')
        return result.diagram
      }
      return result
    } catch (error: any) {
      if (error instanceof AdapterGap) throw error
      const name = String(error?.name ?? ''),
        message = String(error?.message ?? error)
      if (/Unsupported|UnknownDiagram/.test(name) || /unsupported diagram|unknown diagram|unrecognized diagram type|unsupported .*diagram type/i.test(message)) {
        recordUnsupported(message, 'native')
        throw error
      }
      if (!/^(?:ParseError|MermaidSyntaxError|MermaidParseError|SyntaxError)$/.test(name) && !/parse error|parsing failed|invalid (?:syntax|flowchart)|syntax error/i.test(message)) return gap('Unclassified native parser refusal: ' + message)
      active && active.rejections++
      throw error
    }
  }
  try {
    const value = invokeParser(() => api.parse(source))
    if (value?.then) return gap('Asynchronous native parser')
    return value
  } catch (error: any) {
    if (error instanceof AdapterGap) throw error
    if (error.code === 'unsupported-diagram') {
      recordUnsupported(error.message, 'native')
      throw error
    }
    if (!['syntax', 'semantic'].includes(error.code)) return gap('Unclassified native exception: ' + String(error))
    active && active.rejections++
    throw error
  }
}
// Langium service names in the parser package, against the runner's family keys.
const astFamilies: Record<string, string> = { Architecture: 'architecture', GitGraph: 'gitgraph', Info: 'info', Packet: 'packet', Pie: 'pie', Radar: 'radar', Treemap: 'treemap', TreeView: 'treeview', EventModeling: 'eventmodeling', Railroad: 'railroad', Wardley: 'wardley', Venn: 'venn', Usecase: 'usecase', Cynefin: 'cynefin', Ishikawa: 'ishikawa' }
function nativeAst(family: string, source: string): any {
  if (family !== 'Pie') {
    // Ask the candidate's own parser first: a family it does not parse is its own
    // unsupported operation, and its syntax rejection is a real parser error. Only an
    // accepted parse that no AST schema view can express remains a Trident gap.
    const native = astFamilies[family]
    if (!native) return gap('Native Langium AST schema adapter: ' + family)
    const before = active?.rejections ?? 0
    let raw: any
    try {
      raw = nativeParse(native, source)
    } catch (error) {
      if (error instanceof AdapterGap || (active?.rejections ?? 0) === before) throw error
      return { value: undefined, lexerErrors: [], parserErrors: [error] }
    }
    if (job.target.project === 'wevm/ondine') return unsupportedOperation('Ondine exposes no parsed model; render() reports acceptance or rejection only')
    const value = nativeAstView(job.target.project, family, raw, { unavailable: (reason: string) => gap(reason), unsupported: (reason: string) => unsupportedOperation(reason) })
    return { value, lexerErrors: [], parserErrors: [] }
  }
  const before = active?.rejections ?? 0
  try {
    const raw = nativeParse('pie', source)
    if (job.target.project === 'wevm/ondine') return unsupportedOperation('Ondine exposes no parsed model; render() reports acceptance or rejection only')
    // A model that names its family must name pie; one that names none came from the pie parser.
    const kind = raw.kind ?? raw.type ?? raw.diagram_type
    if (kind !== undefined && String(kind).toLowerCase() !== 'pie') return gap('Returned native family differs from requested Pie AST')
    // Frankenmermaid keeps every written slice, title and showData in pie_meta.
    const meta = raw.pie_meta
    // Frankenmermaid keeps every written slice in pie_meta, so pie_meta without slices
    // (a title and accessibility text only) means none was written.
    const slices = raw.sections ?? raw.slices ?? raw.pie_slices ?? meta?.slices ?? (job.target.project === 'Dicklesworthstone/frankenmermaid' && meta ? [] : undefined)
    const sections =
      slices instanceof Map
        ? [...slices].map(([label, value]) => ({ $type: 'PieSection', label, value }))
        : Array.isArray(slices)
          ? slices.map((slice: any) => ({ $type: 'PieSection', label: slice.label, value: slice.value }))
          : slices && typeof slices === 'object'
            ? Object.entries(slices).map(([label, value]) => ({ $type: 'PieSection', label, value }))
            : undefined
    // Frankenmermaid drops pie_meta entirely when no slice is written (`pie showData` has
    // none): there are no sections, and whether showData was written is not carried.
    const metaless = job.target.project === 'Dicklesworthstone/frankenmermaid' && !meta
    if (metaless) {
      const value: any = { $type: 'Pie', title: raw.title, accTitle: raw.meta?.acc_title, accDescr: raw.meta?.acc_descr, sections: [] }
      Object.defineProperty(value, 'showData', { enumerable: true, get: () => unsupportedOperation('Frankenmermaid drops pie_meta, and with it showData, when no slice is written') })
      return { value, lexerErrors: [], parserErrors: [] }
    }
    if (!sections) return gap('Native pie sections are unavailable')
    return { value: { $type: 'Pie', title: raw.title ?? meta?.title, accTitle: raw.accTitle ?? raw.accessibilityTitle ?? raw.meta?.acc_title, accDescr: raw.accDescr ?? raw.accessibilityDescription ?? raw.meta?.acc_descr, showData: raw.showData ?? (meta ? meta.show_data === true : undefined), sections }, lexerErrors: [], parserErrors: [] }
  } catch (error) {
    if (error instanceof AdapterGap || (active?.rejections ?? 0) === before) throw error
    return { value: undefined, lexerErrors: [], parserErrors: [error] }
  }
}
function projectView(family: string, raw: any) {
  if (raw == null) return {}
  try {
    return projectPublicDatabase(job.target.tool, family, raw, (reason: string) => gap(reason), (reason: string) => unsupportedOperation(reason), job.target.project)
  } catch (error) {
    return gap('Native schema projection failed: ' + String(error))
  }
}
function context(family: string) {
  const c: any = { family, config: { securityLevel: 'strict' }, db: undefined }
  const database = (...args: any[]) => {
    if (job.target.tool === 'mermaid') {
      const db = definitions.get(family)?.db
      if (!db) return deferred(family + ': reference diagram unavailable')
      const instance = db.constructor?.name === 'Object' ? db : new db.constructor(...args)
      return new Proxy(instance, {
        get(target, key) {
          const value = target[key]
          // A test's own vi.spyOn mock must reach the test unchanged.
          if (typeof value === 'function' && (value as any)._isMockFunction) return value
          // clear() and re-selecting the default generation (setGen) are setup, as they are
          // for candidates: a test that only sets the database up exercises no operation
          // and does not qualify.
          return typeof value === 'function'
            ? (...params: any[]) => {
                if (active && key !== 'clear' && !(key === 'setGen' && (params[0] ?? 'gen-2') === 'gen-2')) active.calls++
                return value.apply(target, params)
              }
            : value
        },
      })
    }
    let raw: any,
      view: any = {},
      Constructor: any
    const caseAudit = active
    active = undefined
    try {
      const initial = ['native', 'zombie', 'bridge'].includes(job.target.tool) ? undefined : nativeParse(family, examples[family] ?? family)
      if (initial?.constructor?.name !== 'Object') Constructor = initial?.constructor
      // The candidate's own database class, whose methods its parser calls (forwardNativeCalls).
      if (Constructor && typeof Constructor === 'function') c.nativeClass ??= Constructor
    } catch {
    } finally {
      active = caseAudit
    }
    // Without a native database class, an empty database is the candidate's own parse of
    // a diagram with nothing but its header ("usecase-beta"), taken only when a test
    // reads the database before parsing (or after clear()). A candidate that rejects a
    // header-only diagram has no empty model, and such reads stay gaps.
    // A candidate that does not parse the family at all says so for the header-only
    // diagram too; reading that database is then its unsupported operation.
    let empty: { raw?: any; unsupported?: string; native?: boolean } | null | undefined, parsed = false
    const emptyModel = () => {
      if (empty !== undefined) return empty
      const header = (examples[family] ?? '').split('\n')[0]
      const caseAudit = active
      const probe: any = { gaps: new Set(), unsupported: [], unsupportedKinds: [], faults: [], calls: 0, rejections: 0 }
      active = probe
      try {
        empty = header ? { raw: nativeParse(family, header) } : null
      } catch {
        empty = probe.unsupported.length ? { unsupported: String(probe.unsupported[0]), native: probe.unsupportedKinds[0] === 'native' } : null
      } finally {
        active = caseAudit
      }
      return empty
    }
    const clear = () => {
      raw = Constructor ? new Constructor() : undefined
      view = raw ? projectView(family, raw) : {}
      parsed = Boolean(Constructor)
    }
    clear()
    const target: any = Object.assign(Object.create(null), {
      clear,
      parse(source: string) {
        parsed = true
        try {
          // A spy the test installed on this database (vi.spyOn(flowDb, 'setClickEvent'))
          // observes the calls the candidate's own parser makes on its database class.
          const spied = forwardNativeCalls(Constructor, name => (Object.hasOwn(target, name) && isMock(target[name]) ? target[name] : undefined), () => nativeParse(family, source))
          raw = spied.forwarded.length ? spied.value : nativeParse(family, source)
          view = projectView(family, raw)
        } catch (error) {
          // usecase.chevrotain.ts clears publication on rejection. Stateless
          // candidate source parsers likewise publish no failed model; do not
          // invent persistence of an earlier successful result in this binding.
          if (CLEARS_ON_REJECTION.has(family)) clear()
          throw error
        }
      },
    })
    const inspectDatabase = () => gap(family + ' native database namespace is not bound')
    // A Mermaid database member the candidate's own database class implements. A test may
    // spy on it: the spy then sees the calls the candidate's parser makes (target.parse), and
    // a direct call reaches the candidate's method on this database.
    const nativeMember = (key: unknown): boolean => typeof key === 'string' && mermaidDatabaseMember(key) && nativeMethods(Constructor).has(key)
    const memberOf = (key: string) => (...args: any[]) => {
      // While the candidate's parser drives its own database, the spy only observes the call.
      if (forwarding) return undefined
      const value = view[key] ?? raw?.[key]
      if (typeof value !== 'function') return unsupportedOperation(`${family} database ${key} (the candidate exposes a parser, not Mermaid's database API)`)
      active && active.calls++
      return value.apply(raw, args)
    }
    const proxy: any = new Proxy(target, {
      ownKeys: inspectDatabase, getPrototypeOf: inspectDatabase, setPrototypeOf: inspectDatabase,
      isExtensible: inspectDatabase, preventExtensions: inspectDatabase,
      set(_target, key, value) {
        // Jison tests install a logger before parsing. Native parsers own their
        // logging; accepting this setup neither exposes the stub nor earns credit.
        if (key === 'getLogger' && typeof value === 'function') return true
        return inspectDatabase()
      },
      defineProperty(t, key, descriptor) {
        // vi.spyOn installs its spy (and later restores the member) by defining it.
        if (nativeMember(key) && typeof descriptor.value === 'function') return Reflect.defineProperty(t, key, { configurable: true, enumerable: true, writable: true, value: descriptor.value })
        return inspectDatabase()
      },
      deleteProperty: inspectDatabase,
      get(t, key: string) {
        if (Object.hasOwn(t, key)) return t[key]
        if (Object.hasOwn(Object.prototype, key)) return gap(family + '.db.' + key)
        if (key === 'then') return undefined
        if (key === 'getLogger') return gap('Native logger observations are not bound')
        // Re-selecting FlowDB's default generation is configuration, not an observation, for
        // the control and candidates alike: counting it for the control alone qualified a
        // test that observes nothing (flow-style's matcher-less expect) and left it a gap
        // for every candidate.
        if (key === 'setGen') return (version?: string) => ((version || 'gen-2') === 'gen-2' ? undefined : job.target.tool === 'mermaid' ? raw?.setGen?.(version) : gap('Native flowchart generation selector: ' + version))
        // Mermaid's enum constants a test reads before parsing (requirementDb.RiskLevel),
        // where this target receives them at all.
        const constants = job.target.tool === 'mermaid' ? undefined : mermaidConstants(job.target.project, family, false)
        if (constants && key in constants && !(key in view)) return constants[key]
        const layout = job.target.tool === 'mermaid' ? undefined : RENDERER_LAYOUT[family]?.[key]
        if (layout) return unsupportedOperation(layout)
        if (!parsed && raw === undefined && !(key in view) && typeof key === 'string') {
          const model = emptyModel()
          if (model?.unsupported) return unsupportedOperation(model.unsupported, model.native ? 'native' : 'trident')
          if (model && /^get[A-Z]/.test(key)) {
            raw = model.raw
            try {
              // The header-only parse stands in for the empty database, which has published
              // no AST (Mermaid's usecaseDb.getAST() is undefined until a parse succeeds).
              view = projectView(family, raw)
              if ('getAST' in view) view = { ...view, getAST: () => undefined }
            } catch {
              raw = undefined
            }
          }
        }
        const value = view[key] ?? raw?.[key]
        if (typeof value === 'function')
          return (...a: any[]) => {
            active && active.calls++
            return value.apply(raw, a)
          }
        if (value !== undefined) {
          active && active.calls++
          return value
        }
        // Reading Mermaid's database API (to call it, spy on it or check that it exists) is
        // an operation the candidate does not offer.
        if (mermaidDatabaseMember(key)) return absentDatabaseCapability(family, key, `${family} database ${key} (the candidate exposes a parser, not Mermaid's database API)`)
        // typeof, truthiness and caught calls cannot prove a missing native member.
        // Reject the read itself, including during module setup.
        return gap(family + '.db.' + String(key))
      },
      // vi.spyOn looks a member up by descriptor (or `in`) before spying on it. A spy on a
      // Mermaid database member checks the parser -> database call protocol, which a
      // candidate parser never drives, even when its own model has a same-named method.
      getOwnPropertyDescriptor(t, key) {
        if (Object.hasOwn(t, key) && nativeMember(key)) return Reflect.getOwnPropertyDescriptor(t, key)
        if (!(key in t) && nativeMember(key)) return { configurable: true, enumerable: true, writable: true, value: memberOf(String(key)) }
        if (!(key in t) && key !== 'setGen' && mermaidDatabaseMember(key)) return absentDatabaseCapability(family, String(key), `${family} database ${String(key)} spied on or inspected (Mermaid's parser -> database protocol)`)
        return inspectDatabase()
      },
      has(t, key) {
        if (nativeMember(key)) return true
        if (!(key in t) && key !== 'setGen' && mermaidDatabaseMember(key)) return absentDatabaseCapability(family, String(key), `${family} database ${String(key)} spied on or inspected (Mermaid's parser -> database protocol)`)
        return inspectDatabase()
      },
    })
    ownDatabases.add(proxy)
    return proxy
  }
  c.database = database
  c.db = database()
  c.parser = {
    yy: c.db,
    parse(source: string) {
      if (job.target.tool !== 'mermaid') {
        const yy = c.parser.yy
        if (ownDatabases.has(yy)) return yy.parse(source)
        // Mermaid's own database module for this family (`timeline.yy = timelineDB`) is the
        // database the module's getters read: the candidate's model, as for its other exports.
        const bound = databaseModules.get(yy)
        if (bound) return bound.db.parse(source)
        if (yy && deferredValues.has(yy)) return gap(family + ' parser yy is an unbound value: ' + deferredValues.get(yy))
        // A test that installs its own yy object (a mockDB of vi.fn members) checks the
        // parser -> database calls. A candidate whose parser drives its own database class
        // makes those calls; they reach the test's database as the candidate made them.
        const delivered = forwardNativeCalls(c.nativeClass, name => (typeof yy?.[name] === 'function' ? (...args: any[]) => yy[name](...args) : undefined), () => nativeParse(family, source))
        if (delivered.forwarded.length) return undefined
        // Otherwise the candidate's own parser still decides whether it accepts the source:
        // its refusal of the diagram type or its syntax rejection is its own outcome. An
        // accepted parse returns the candidate's model and drives no database the test supplied.
        nativeParse(family, source)
        return absentDatabaseCapability(family, undefined, family + ' parser driving a caller-supplied database (Mermaid jison yy callback protocol)')
      }
      const definition = definitionFor(family, source)
      if (!definition) return gap(family + ': reference diagram unavailable')
      const p = definition.getParser()
      p.yy = c.parser.yy
      if (p.parser) p.parser.yy = c.parser.yy
      active && active.calls++
      try {
        return p.parse(source)
      } catch (error) {
        active && active.rejections++
        throw error
      }
    },
  }
  c.parser.parser = c.parser
  return c
}
const missingExport = Symbol('unbound native export')
function boundModule(read: (key: string | symbol) => any, c: any, locals: Record<string, string>, source: string, namespace = false) {
  const inspectUnbound = (): never => gap('Native module namespace is not bound: ' + source)
  // A virtual module is a partial binding, never evidence of the candidate's
  // complete export set. Its null prototype cannot leak Object's members.
  return new Proxy(Object.create(null), {
    ownKeys: inspectUnbound, has: inspectUnbound, getOwnPropertyDescriptor: inspectUnbound,
    getPrototypeOf: inspectUnbound, setPrototypeOf: inspectUnbound,
    isExtensible: inspectUnbound, preventExtensions: inspectUnbound,
    set: inspectUnbound, defineProperty: inspectUnbound, deleteProperty: inspectUnbound,
    get(_target, key) {
      if (namespace && key === 'then') return undefined
      const resolved = read(key), result = resolved === missingExport ? deferred(source + '.' + String(key)) : resolved
      const reason = (typeof result === 'object' && result) || typeof result === 'function' ? deferredValues.get(result) : undefined
      if (reason) {
        if (Object.hasOwn(locals, key)) c.unavailableImports.set(locals[String(key)], reason)
        else if (!active) return gap('Unavailable namespace export read during setup: ' + reason)
        if (!failureReport()) active?.gaps.add(reason)
      }
      return result
    },
  })
}
/** A dynamic import resolves a namespace, not an arbitrary thenable returned by
 * an unbound member proxy. Observations still go through the same adapters. */
export function importFor(family: string, source: string | undefined, file: string) {
  if (source === undefined) return gap('Nonliteral production import has no native binding: ' + file)
  return moduleFor(family, source, file, {}, true)
}
export function moduleFor(family: string, source: string, file: string, locals: Record<string, string> = {}, namespace = false): any {
  // All families imported by a file share its import-availability audit, while
  // their parsers and database state stay independent.
  if (!contexts.has(file)) {
    const primary = context(family)
    primary.unavailableImports = new Map()
    contexts.set(file, primary)
  }
  const importedFamily = importFamily(family, source)
  const key = importedFamily === family ? file : file + '\0' + importedFamily
  let c = contexts.get(key)
  if (!c) {
    c = context(importedFamily)
    c.unavailableImports = contexts.get(file).unavailableImports
    contexts.set(key, c)
  }
  family = importedFamily
  const bind = (exports: Record<PropertyKey, any>) => boundModule(key => Object.hasOwn(exports, key) ? exports[key] : missingExport, c, locals, source, namespace)
  const bindDynamic = (read: (key: string | symbol) => any) => boundModule(key => { const value = read(key); return value === undefined ? missingExport : value }, c, locals, source, namespace)
  const config = {
    setConfig(value: any) {
      if (job.target.tool !== 'mermaid' && configKeys(value).length) hostConfig = { ...hostConfig, ...value }
      c.config = { ...c.config, ...value }
      configurations?.setConfig?.(value)
    },
    setSiteConfig(value: any) {
      if (job.target.tool !== 'mermaid') hostConfig = configKeys(value).length ? { ...value } : undefined
      c.config = value
      configurations?.setSiteConfig?.(value)
    },
    getConfig() {
      if (job.target.tool !== 'mermaid' && active) return gap('Native host configuration getter is not bound')
      return configurations?.getConfig?.() ?? c.config
    },
    getSiteConfig() {
      if (job.target.tool !== 'mermaid' && active) return gap('Native site configuration getter is not bound')
      return configurations?.getSiteConfig?.() ?? c.config
    },
    reset() {
      hostConfig = undefined
      configurations?.reset?.()
    },
  }
  // Log verbosity changes no observable result.
  const setLogLevel = () => undefined
  if (/config\.js$/.test(source)) {
    const exports: Record<PropertyKey, any> = { ...config, default: config }
    return bindDynamic(key => Object.hasOwn(exports, key) ? exports[key] : deferred('Native host configuration export is not bound: ' + String(key)))
  }
  if (/diagramAPI\.js$/.test(source)) return bind({ ...config, setLogLevel, get log() { return deferred('Logger side effects are not bound to the candidate') }, default: config })
  // The public package registers every diagram at import; candidates need no registry.
  if (/diagram-orchestration\.js$/.test(source)) return bind({ addDiagrams: () => undefined })
  // A diagram module's `diagram` definition: the family's parser and database.
  if (/\w(?:Diagram|Diagram-v2)\.js$/.test(source) && locals.diagram) {
    if (job.target.tool === 'mermaid') {
      const definition = definitions.get(family)
      return bind({ diagram: definition ? { ...definition, parser: c.parser, db: c.db } : deferred(family + ': reference diagram unavailable') })
    }
    return bind({ diagram: { parser: c.parser, db: c.db, get renderer() { return gap('Mermaid renderer module') }, get styles() { return gap('Mermaid diagram styles') } } })
  }
  if (/(?:^|\/)Diagram\.js$/.test(source)) {
    if (job.target.tool === 'mermaid')
      return bind({
        // Diagram is not exported publicly; getDiagramFromText is the public route to it.
        Diagram: {
          fromText(text: any, metadata?: any) {
            active && active.calls++
            return api.mermaidAPI.getDiagramFromText(typeof text === 'string' ? text : text.raw, metadata)
          },
        },
      })
    // A shared test's Diagram.fromText drives Mermaid's own detection and registry: its
    // diagram type ids, external diagram registration and comment cleaning. A candidate
    // offers a parser per family, not that API.
    if (family === '<shared>')
      return bind({
        Diagram: {
          fromText: () => unsupportedOperation("Diagram.fromText in a shared test (Mermaid's diagram detection, type ids and registry)"),
        },
      })
    return bind({
      Diagram: {
        // The candidate's own parser for this file's family, observed through the same database view.
        async fromText(text: any) {
          // The file's own database, which a test may read through the module's db export
          // after Diagram.fromText (usecase's singleton db), as Mermaid's registered diagram does.
          const db = c.db
          // Outside a test this is a loader warm-up whose result no assertion reads.
          if (!active)
            try {
              db.parse(typeof text === 'string' ? text : text.raw)
            } catch {}
          else db.parse(typeof text === 'string' ? text : text.raw)
          // Fidelity compares parser models. No candidate's renderer is bound in Mermaid's
          // renderer protocol, so a test that draws is a Trident binding gap for everyone.
          return { type: family, db, parser: c.parser, renderer: untilUsed('Mermaid Diagram renderer is not bound to the candidate') }
        },
      },
    })
  }
  if (/logger/.test(source)) return bind({ get log() { return deferred('Logger side effects are not bound to the candidate') }, setLogLevel })
  if (/language\/index|language\/generated|language\/\w+\/module\.js$/.test(source)) {
    if (job.target.tool === 'mermaid')
      return bindDynamic(key => {
        const value = Object.hasOwn(language, key) ? language[key] : undefined
        if (typeof key !== 'string') return value
        if (!/^create\w+Services$/.test(key) || typeof value !== 'function') return value
        return (...args: any[]) => {
          const services = value(...args)
          for (const service of Object.values(services) as any[])
            if (service.parser?.LangiumParser) {
              const parser = service.parser.LangiumParser,
                actual = parser.parse.bind(parser)
              parser.parse = (...params: any[]) => {
                active && active.calls++
                return actual(...params)
              }
            }
          return services
        }
      })
    return bindDynamic(key => {
      if (typeof key !== 'string') return undefined
      if (/^create\w+Services$/.test(key))
        return () => {
          const name = key.slice(6, -8)
          return { [name === 'EventModeling' ? 'EventModel' : name]: { parser: { LangiumParser: { parse: (text: string) => nativeAst(name, text) } } } }
        }
      // Generated AST type constants (Radar.$type === 'Radar'): grammar vocabulary, not behaviour.
      if (/^[A-Z][A-Za-z]*$/.test(key)) return { $type: key }
      return deferred('Native AST type: ' + key)
    })
  }
  if (/\.jison$|[Pp]arser\.[jt]s$|\/parser\.[jt]s$|\.chevrotain\.[jt]s$/.test(source)) {
    let parser = c.parser
    if (job.target.tool !== 'mermaid' && !source.endsWith('.jison') && ['architecture', 'packet', 'pie', 'radar', 'gitgraph', 'treemap', 'eventmodeling', 'info', 'usecase'].includes(family))
      parser = new Proxy(c.parser, {
        get(target, key) {
          return key === 'parse' ? async (text: string) => target.parse(text) : target[key]
        },
      })
    // A jison parser's parse() returns true when it accepts the source: protocol, like the
    // generated constants, so an accepted candidate parse returns true as well.
    else if (job.target.tool !== 'mermaid' && source.endsWith('.jison')) {
      const jison: any = new Proxy(c.parser, {
        get(target, key) {
          if (key === 'parser') return jison
          return key === 'parse'
            ? (text: string) => {
                target.parse(text)
                return true
              }
            : target[key]
        },
      })
      parser = jison
    }
    return bind({ default: parser, parser })
  }
  if (/(?:[dD][bB]|[aA]st)\.js$|\/db\.js$/.test(source)) {
    const databaseModule = bindDynamic(key => {
      if (typeof key !== 'string' || Object.hasOwn(Object.prototype, key)) return undefined
      if (key === 'default' || key === 'db') return c.db
      if (/(?:DB|Db)$/.test(key))
        return class {
          constructor(...args: any[]) {
            return c.database(...args)
          }
        }
      try {
        const value = c.db[key]
        // Bind only an observed getter, while reading the current parse on each call.
        if (job.target.tool !== 'mermaid' && /^get[A-Z]\w*$/.test(key) && typeof value === 'function') return (...args: any[]) => c.db[key](...args)
        return value
      } catch (error) {
        // Missing named imports can remain unused; direct database reads cannot.
        if (error instanceof AdapterGap) return deferred(error.message.replace(/^TRIDENT_ADAPTER_GAP: /, ''))
        throw error
      }
    })
    databaseModules.set(databaseModule, c)
    return databaseModule
  }
  if (/mermaidAPI/.test(source)) {
    if (job.target.tool !== 'mermaid') {
      // Mermaid's public parse() for this file's family is the candidate's own parser;
      // initialize() and reset() are host configuration, recorded as setConfig() is.
      const candidateAPI = {
        async parse(text: string) {
          c.database().parse(text)
          return { diagramType: family }
        },
        initialize: (value: any) => config.setConfig(value ?? {}),
        reset: () => config.reset(),
        getConfig: () => config.getConfig(),
      }
      return bind({ ...candidateAPI, mermaidAPI: candidateAPI, default: candidateAPI })
    }
    const observed = new Proxy(api.mermaidAPI, {
      get(target, key) {
        const value = target[key]
        return typeof value === 'function'
          ? (...params: any[]) => {
              active && active.calls++
              return value.apply(target, params)
            }
          : value
      },
    })
    return bind({ mermaidAPI: observed, default: observed })
  }
  // Namespace imports can be observed with typeof or identity comparisons,
  // neither of which triggers a Proxy trap. Keep the lexical-use audit too.
  if (locals['*']) c.unavailableImports.set(locals['*'], 'Native module namespace is not bound: ' + source)
  // One proxy keeps unused imports deferred. Wrapping a proxy here causes
  // JavaScript's outer get-invariant check to invoke the inner descriptor trap,
  // aborting collection even when no callback uses the unavailable export.
  return bind({})
}
