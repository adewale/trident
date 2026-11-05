// Original test bodies run once in Vitest. Only production imports are adapted.
import { readFileSync, appendFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve, dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import type TypeScript from 'typescript'
import { projectPublicDatabase } from '../upstream-fidelity-projection.mjs'
import { persistentBridge } from './bridge-client.mjs'
import { nativeAstView, mermaidConstants } from './schema-views.mjs'

const job = JSON.parse(readFileSync(process.env.TRIDENT_FIDELITY_JOB!, 'utf8'))
// Parallel test files run in separate worker processes; each appends to its own part.
const auditFile = (job.workers ?? 1) > 1 ? `${job.audit}.${process.pid}` : job.audit
const referenceRequire = createRequire(join(job.reference, 'package.json'))
// The TypeScript compiler is large and every test file loads this module afresh, so it
// is required only when a file actually imports a value Trident cannot bind.
let typescript: typeof TypeScript | undefined
const tsCompiler = () => (typescript ??= createRequire(join(job.runtime, 'package.json'))('typescript') as typeof TypeScript)
let bridgeClient: ReturnType<typeof persistentBridge> | undefined
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
let active: { protocol: string; expectedFailure: boolean; id: string; file: string; name: string; index: number; gaps: Set<string>; calls: number; rejections: number; unsupported: string[] } | undefined
const contexts = new Map<string, any>(),
  deferredValues = new WeakMap<object, string>(),
  ownDatabases = new WeakSet<object>()
/** An operation the candidate's real interface does not offer. The candidate's
 * interface is parse(source) -> its own model; Mermaid's mutable database API and
 * jison callback protocol are not part of it. Recorded as a known nonpass. */
function unsupportedOperation(reason: string): never {
  // The verdict comes from the candidate's own interface, so it counts as exercised.
  if (active) active.calls++
  active?.unsupported.push(reason)
  throw Error('Unsupported candidate operation: ' + reason)
}
// Mermaid database members that change or compute state rather than observe a parse.
const DATABASE_OPERATION = /^(?:add|set|update|define|make|insert|remove|push|pop|enter|exit|apply|toggle|commit|branch|merge|checkout|cherryPick|draw|lookUp|sanitize|edgeStrTo|emit[A-Z]|parse[A-Z])/
// Mermaid database API that observes Mermaid's own state rather than a parse result.
const DATABASE_API = new Set(['getConfig', 'getConfigField', 'exists', 'createModel', 'prettyPrint', 'bindFunctions'])
const mermaidDatabaseMember = (key: unknown) => typeof key === 'string' && (DATABASE_OPERATION.test(key) || DATABASE_API.has(key))
export class AdapterGap extends Error {}
function gap(reason: string): never {
  active?.gaps.add(reason)
  throw new AdapterGap('TRIDENT_ADAPTER_GAP: ' + reason)
}
function deferred(reason: string): any {
  active?.gaps.add(reason)
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
/** A deferred value that records its gap only when used: read, compared or inspected. */
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
    const manifest = referenceRequire.resolve
      .paths('@mermaid-js/parser')!
      .map(p => join(p, '@mermaid-js/parser/package.json'))
      .find(p => {
        try {
          readFileSync(p)
          return true
        } catch {
          return false
        }
      })!
    language = await import(/* @vite-ignore */ pathToFileURL(resolve(dirname(manifest), JSON.parse(readFileSync(manifest, 'utf8')).exports['.'].import)).href)
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
/** Source text without comments: a commented-out call does not use an import. */
function withoutComments(text: string) {
  const ts = tsCompiler()
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.Standard, text)
  let out = ''
  for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan())
    if (token !== ts.SyntaxKind.SingleLineCommentTrivia && token !== ts.SyntaxKind.MultiLineCommentTrivia) out += scanner.getTokenText()
  return out
}
/** End of a test file: stop its persistent bridge process. */
export function shutdown() {
  bridgeClient?.close()
  bridgeClient = undefined
}
export function begin(task: any) {
  const flatten = (node: any): any[] => (node.tasks ? node.tasks.flatMap(flatten) : node.type === 'test' ? [node] : [])
  const index = flatten(task.file).findIndex(t => t.id === task.id)
  const names = [task.name]
  for (let suite = task.suite; suite; suite = suite.suite) if (suite.name) names.unshift(suite.name)
  active = { protocol: 'native-operations-v2', expectedFailure: !!task.fails, id: task.id, file: task.file.filepath, index, name: names.join(' > '), gaps: new Set(), calls: 0, rejections: 0, unsupported: [] }
  if (job.target.tool === 'mermaid') configurations?.reset?.()
  hostConfig = undefined
  const c = contexts.get(task.file.filepath)
  if (c?.unavailableImports?.size) {
    const file = job.files.find((f: any) => f.absolute === task.file.filepath),
      lines = readFileSync(task.file.filepath, 'utf8').split('\n')
    const title = String(task.name)
    const selected = file.declarations.filter((d: any) => d.name === title || title.startsWith(d.name.split(/%[sdifjo#]|\$\w+/)[0]))
    const text = selected.length ? selected.map((d: any) => lines.slice(d.line - 1, d.endLine).join('\n')).join('\n') : lines.join('\n')
    const ts = tsCompiler()
    const ast = ts.createSourceFile('test.ts', lines.join('\n'), ts.ScriptTarget.Latest, true)
    const imports = ast.statements.filter(ts.isImportDeclaration).map(n => ({ start: ast.getLineAndCharacterOfPosition(n.getStart(ast)).line, end: ast.getLineAndCharacterOfPosition(n.end).line }))
    const helpers = lines.filter((_line, i) => !imports.some(r => i >= r.start && i <= r.end) && !file.declarations.some((d: any) => i >= d.line - 1 && i < d.endLine)).join('\n')
    const code = withoutComments(text + '\n' + helpers)
    for (const [name, reason] of c.unavailableImports) if (new RegExp('\\b' + name + '\\b').test(code)) active.gaps.add('Unavailable imported value used by original test: ' + name + ' (' + reason + ')')
  }
}
export function finish(task: any) {
  if (!active) return
  if (!active.calls && !active.unsupported.length) active.gaps.add('No candidate operation was exercised by this test')
  appendFileSync(auditFile, JSON.stringify({ ...active, gaps: [...active.gaps] }) + '\n')
  const reason = [...active.gaps].join('; ')
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
  if (reply.unsupported) {
    active?.unsupported.push(reply.unsupported)
    throw Error(reply.unsupported)
  }
  if (reply.error) {
    const e = reply.error
    if (/Unsupported|UnknownDiagram/.test(e.name) || /unsupported diagram|unknown diagram|unrecognized diagram type|unsupported .*diagram type/i.test(e.message)) {
      active?.unsupported.push(e.message)
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
    const result = api.parseRegisteredMermaid(source)
    if (result?.then) return gap('Asynchronous parser cannot supply the original synchronous parse interface')
    if (!result.ok) {
      const errors = Array.isArray(result.error) ? result.error : [result.error]
      if (!errors.every((e: any) => /PARSE_ERROR|PARSE_FAILED|SYNTAX_ERROR|INVALID_FRONTMATTER/.test(e.code ?? ''))) return gap('Unclassified native parser refusal: ' + JSON.stringify(result.error))
      active && active.rejections++
      throw Error(JSON.stringify(result.error))
    }
    if (['opaque', 'preserved'].includes(result.value.body.kind)) {
      active?.unsupported.push('Actual native parse returned ' + result.value.body.kind)
      throw Error('Native semantic support unavailable')
    }
    return { ...result.value.body, ...(result.value.meta?.title !== undefined ? { title: result.value.meta.title } : {}), ...(result.value.meta?.accessibility?.title !== undefined ? { accessibilityTitle: result.value.meta.accessibility.title } : {}), ...(result.value.meta?.accessibility?.descr !== undefined ? { accessibilityDescription: result.value.meta.accessibility.descr } : {}) }
  }
  if (job.target.tool === 'beautiful') {
    const names: Record<string, string> = { flowchart: 'parseMermaid', state: 'parseMermaid', sequence: 'parseSequenceDiagram', class: 'parseClassDiagram', er: 'parseErDiagram' }
    const parse = api[names[family]!]
    if (typeof parse !== 'function') return gap('Native parser/schema adapter is unavailable for ' + family)
    try {
      const value = parse(
        family === 'flowchart' || family === 'state'
          ? source
          : source
              .split(/\r?\n/)
              .map(line => line.trim())
              .filter(Boolean),
      )
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
      const child = spawnSync(job.target.bun, [join(import.meta.dirname, 'native-call.mjs')], { input: JSON.stringify({ entry, source, methods: [...(selectors[family] ?? []), 'parse', 'parseToIR'] }), encoding: 'utf8', timeout: 5000, maxBuffer: 16 * 1024 * 1024 })
      if (child.error || child.status !== 0) return gap('Native Bun parser bridge failed: ' + (child.error?.message ?? child.stderr.slice(0, 400)))
      return bridgeReply(child.stdout, family, 'Native Bun parser bridge')
    }
    const selected = (selectors[family] ?? []).find(name => typeof api[name] === 'function')
    // Generic parse is used only for an API whose own returned kind distinguishes
    // families; no source prefix detector is invented by this adapter.
    const parser = selected ? api[selected] : typeof api.parse === 'function' ? api.parse : undefined
    if (!parser) return gap('Installed public module has no synchronous ' + family + ' parser binding')
    try {
      const result = parser(source)
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
        active?.unsupported.push(message)
        throw error
      }
      if (!/^(?:ParseError|MermaidSyntaxError|MermaidParseError|SyntaxError)$/.test(name) && !/parse error|parsing failed|invalid (?:syntax|flowchart)|syntax error/i.test(message)) return gap('Unclassified native parser refusal: ' + message)
      active && active.rejections++
      throw error
    }
  }
  try {
    const value = api.parse(source)
    if (value?.then) return gap('Asynchronous native parser')
    return value
  } catch (error: any) {
    if (error instanceof AdapterGap) throw error
    if (error.code === 'unsupported-diagram') {
      active?.unsupported.push(error.message)
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
    const slices = raw.sections ?? raw.slices ?? raw.pie_slices ?? meta?.slices
    const sections =
      slices instanceof Map
        ? [...slices].map(([label, value]) => ({ $type: 'PieSection', label, value }))
        : Array.isArray(slices)
          ? slices.map((slice: any) => ({ $type: 'PieSection', label: slice.label, value: slice.value }))
          : slices && typeof slices === 'object'
            ? Object.entries(slices).map(([label, value]) => ({ $type: 'PieSection', label, value }))
            : undefined
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
          // clear() is setup, as it is for candidates: a test that only clears the
          // database exercises no operation and does not qualify.
          return typeof value === 'function'
            ? (...params: any[]) => {
                if (active && key !== 'clear') active.calls++
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
    let empty: { raw?: any; unsupported?: string } | null | undefined, parsed = false
    const emptyModel = () => {
      if (empty !== undefined) return empty
      const header = (examples[family] ?? '').split('\n')[0]
      const caseAudit = active
      const probe: any = { gaps: new Set(), unsupported: [], calls: 0, rejections: 0 }
      active = probe
      try {
        empty = header ? { raw: nativeParse(family, header) } : null
      } catch {
        empty = probe.unsupported.length ? { unsupported: String(probe.unsupported[0]) } : null
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
    const target: any = {
      clear,
      parse(source: string) {
        parsed = true
        raw = nativeParse(family, source)
        view = projectView(family, raw)
      },
    }
    const proxy: any = new Proxy(target, {
      get(t, key: string) {
        if (key in t) return t[key]
        if (key === 'then') return undefined
        // Mermaid's enum constants a test reads before parsing (requirementDb.RiskLevel),
        // where this target receives them at all.
        const constants = job.target.tool === 'mermaid' ? undefined : mermaidConstants(job.target.project, family, false)
        if (constants && key in constants && !(key in view)) return constants[key]
        if (!parsed && raw === undefined && !(key in view) && typeof key === 'string') {
          const model = emptyModel()
          if (model?.unsupported) return unsupportedOperation(model.unsupported)
          if (model && /^get[A-Z]/.test(key)) {
            raw = model.raw
            try {
              view = projectView(family, raw)
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
        // FlowDB's and AgentFlowDB's constructors already select gen-2; re-selecting it changes nothing.
        if (key === 'setGen') return (version?: string) => ((version || 'gen-2') === 'gen-2' ? undefined : gap('Native flowchart generation selector: ' + version))
        // Reading Mermaid's database API (to call it, spy on it or check that it exists) is
        // an operation the candidate does not offer.
        if (mermaidDatabaseMember(key)) return unsupportedOperation(`${family} database ${key} (the candidate exposes a parser, not Mermaid's database API)`)
        // A getter read but whose value no assertion uses (getVertices() before parsing)
        // is not an observation; it becomes a gap only when its value is used.
        return untilUsed(family + '.db.' + key)
      },
      // vi.spyOn looks a member up by descriptor (or `in`) before spying on it. A spy on a
      // Mermaid database member checks the parser -> database call protocol, which a
      // candidate parser never drives, even when its own model has a same-named method.
      getOwnPropertyDescriptor(t, key) {
        if (!(key in t) && key !== 'setGen' && mermaidDatabaseMember(key)) return unsupportedOperation(`${family} database ${String(key)} spied on or inspected (Mermaid's parser -> database protocol)`)
        return Reflect.getOwnPropertyDescriptor(t, key)
      },
      has(t, key) {
        if (!(key in t) && key !== 'setGen' && mermaidDatabaseMember(key)) return unsupportedOperation(`${family} database ${String(key)} spied on or inspected (Mermaid's parser -> database protocol)`)
        return key in t || (typeof key === 'string' && (view[key] !== undefined || raw?.[key] !== undefined))
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
        // A test that installs its own yy object checks Mermaid's jison callback
        // protocol; a candidate parser returns its model instead of driving that object.
        if (!ownDatabases.has(c.parser.yy)) return unsupportedOperation(family + ' parser driving a caller-supplied database (Mermaid jison yy callback protocol)')
        return c.parser.yy.parse(source)
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
function boundModule(value: any, c: any, locals: Record<string, string>) {
  return new Proxy(value, {
    get(target, key) {
      const result = target[key]
      const reason = (typeof result === 'object' && result) || typeof result === 'function' ? deferredValues.get(result) : undefined
      if (reason && locals[String(key)]) c.unavailableImports.set(locals[String(key)], reason)
      return result
    },
  })
}
export function moduleFor(family: string, source: string, file: string, locals: Record<string, string> = {}): any {
  let c = contexts.get(file)
  if (!c) {
    c = context(family)
    c.unavailableImports = new Map()
    contexts.set(file, c)
  }
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
  if (/config\.js$/.test(source)) return { ...config, default: config }
  if (/diagramAPI\.js$/.test(source)) return boundModule({ ...config, setLogLevel, log: deferred('Logger side effects are not bound to the candidate'), default: config }, c, locals)
  // The public package registers every diagram at import; candidates need no registry.
  if (/diagram-orchestration\.js$/.test(source)) return { addDiagrams: () => undefined }
  // A diagram module's `diagram` definition: the family's parser and database.
  if (/\w(?:Diagram|Diagram-v2)\.js$/.test(source) && locals.diagram) {
    if (job.target.tool === 'mermaid') {
      const definition = definitions.get(family)
      return { diagram: definition ? { ...definition, parser: c.parser, db: c.db } : deferred(family + ': reference diagram unavailable') }
    }
    return boundModule({ diagram: { parser: c.parser, db: c.db, renderer: deferred('Mermaid renderer module'), styles: deferred('Mermaid diagram styles') } }, c, locals)
  }
  if (/(?:^|\/)Diagram\.js$/.test(source)) {
    if (job.target.tool === 'mermaid')
      return {
        // Diagram is not exported publicly; getDiagramFromText is the public route to it.
        Diagram: {
          fromText(text: any, metadata?: any) {
            active && active.calls++
            return api.mermaidAPI.getDiagramFromText(typeof text === 'string' ? text : text.raw, metadata)
          },
        },
      }
    if (family === '<shared>') return boundModule({ Diagram: deferred('Diagram.fromText without a diagram family') }, c, locals)
    return {
      Diagram: {
        // The candidate's own parser for this file's family, observed through the same database view.
        async fromText(text: any) {
          const db = c.database()
          // Outside a test this is a loader warm-up whose result no assertion reads.
          if (!active)
            try {
              db.parse(typeof text === 'string' ? text : text.raw)
            } catch {}
          else db.parse(typeof text === 'string' ? text : text.raw)
          return { type: family, db, parser: c.parser }
        },
      },
    }
  }
  if (/logger/.test(source))
    return boundModule(
      {
        log: deferred('Logger side effects are not bound to the candidate'),
        setLogLevel,
      },
      c,
      locals,
    )
  if (/language\/index|language\/generated|language\/\w+\/module\.js$/.test(source)) {
    if (job.target.tool === 'mermaid')
      return new Proxy(language, {
        get(target, key: string) {
          const value = target[key]
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
        },
      })
    return new Proxy(
      {},
      {
        get(_t, key: string) {
          if (/^create\w+Services$/.test(key))
            return () => {
              const name = key.slice(6, -8)
              return { [name === 'EventModeling' ? 'EventModel' : name]: { parser: { LangiumParser: { parse: (text: string) => nativeAst(name, text) } } } }
            }
          // Generated AST type constants (Radar.$type === 'Radar'): grammar vocabulary, not behaviour.
          if (/^[A-Z][A-Za-z]*$/.test(key)) return { $type: key }
          return deferred('Native AST type: ' + key)
        },
      },
    )
  }
  if (/\.jison$|[Pp]arser\.[jt]s$|\/parser\.[jt]s$|\.chevrotain\.[jt]s$/.test(source)) {
    let parser = c.parser
    if (job.target.tool !== 'mermaid' && !source.endsWith('.jison') && ['architecture', 'packet', 'pie', 'radar', 'gitgraph', 'treemap', 'eventmodeling', 'info'].includes(family))
      parser = new Proxy(c.parser, {
        get(target, key) {
          return key === 'parse' ? async (text: string) => target.parse(text) : target[key]
        },
      })
    return { default: parser, parser }
  }
  if (/(?:[dD][bB]|[aA]st)\.js$|\/db\.js$/.test(source))
    return boundModule(
      new Proxy(
        {},
        {
          get(_t, key: string) {
            if (key === 'default' || key === 'db') return c.db
            if (/(?:DB|Db)$/.test(key))
              return class {
                constructor(...args: any[]) {
                  return c.database(...args)
                }
              }
            // A getter imported by name (getAccTitle from commonDb) reads whatever the
            // file's database holds when it is called, after the test has parsed.
            if (job.target.tool !== 'mermaid' && /^get[A-Z]\w*$/.test(key)) return (...args: any[]) => c.db[key](...args)
            return c.db[key]
          },
        },
      ),
      c,
      locals,
    )
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
      return boundModule({ ...candidateAPI, mermaidAPI: candidateAPI, default: candidateAPI }, c, locals)
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
    return { mermaidAPI: observed, default: observed }
  }
  return boundModule(
    new Proxy(
      {},
      {
        get(_t, key) {
          return deferred(source + '.' + String(key))
        },
      },
    ),
    c,
    locals,
  )
}
