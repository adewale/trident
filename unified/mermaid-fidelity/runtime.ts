// Original test bodies run once in Vitest. Only production imports are adapted.
import { readFileSync, appendFileSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'
import { projectPublicDatabase } from '../upstream-fidelity-projection.mjs'

const job = JSON.parse(readFileSync(process.env.TRIDENT_FIDELITY_JOB!, 'utf8'))
const referenceRequire = createRequire(join(job.reference, 'package.json'))
let api: any,
  definitions = new Map<string, any>(),
  configurations: any,
  language: any
let active: { protocol: string; expectedFailure: boolean; id: string; file: string; name: string; index: number; gaps: Set<string>; calls: number; rejections: number; unsupported: string[] } | undefined
const contexts = new Map<string, any>(),
  deferredValues = new WeakMap<object, string>()
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
  eventmodeling: 'eventModeling\nswimlane A {\n event E["E"]\n}',
  ishikawa: 'ishikawa-beta\nA\n  B',
}
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
      if (examples[family]) {
        try {
          definitions.set(family, await api.mermaidAPI.getDiagramFromText(examples[family]))
        } catch {}
      }
  } else if (['beautiful', 'zombie'].includes(job.target.tool)) {
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
  } else api = await import(/* @vite-ignore */ pathToFileURL(job.target.entry).href)
}
export function begin(task: any) {
  const flatten = (node: any): any[] => (node.tasks ? node.tasks.flatMap(flatten) : node.type === 'test' ? [node] : [])
  const index = flatten(task.file).findIndex(t => t.id === task.id)
  const names = [task.name]
  for (let suite = task.suite; suite; suite = suite.suite) if (suite.name) names.unshift(suite.name)
  active = { protocol: 'native-operations-v2', expectedFailure: !!task.fails, id: task.id, file: task.file.filepath, index, name: names.join(' > '), gaps: new Set(), calls: 0, rejections: 0, unsupported: [] }
  if (job.target.tool === 'mermaid') configurations?.reset?.()
  const c = contexts.get(task.file.filepath)
  if (c?.initialConfigGap) active.gaps.add('Module requires native global configuration mapping that Trident has not implemented')
  if (c?.unavailableImports?.size) {
    const file = job.files.find((f: any) => f.absolute === task.file.filepath),
      lines = readFileSync(task.file.filepath, 'utf8').split('\n')
    const title = String(task.name)
    const selected = file.declarations.filter((d: any) => d.name === title || title.startsWith(d.name.split(/%[sdifjo#]|\$\w+/)[0]))
    const text = selected.length ? selected.map((d: any) => lines.slice(d.line - 1, d.endLine).join('\n')).join('\n') : lines.join('\n')
    const ast = ts.createSourceFile('test.ts', lines.join('\n'), ts.ScriptTarget.Latest, true)
    const imports = ast.statements.filter(ts.isImportDeclaration).map(n => ({ start: ast.getLineAndCharacterOfPosition(n.getStart(ast)).line, end: ast.getLineAndCharacterOfPosition(n.end).line }))
    const helpers = lines.filter((_line, i) => !imports.some(r => i >= r.start && i <= r.end) && !file.declarations.some((d: any) => i >= d.line - 1 && i < d.endLine)).join('\n')
    for (const [name, reason] of c.unavailableImports) if (new RegExp('\\b' + name + '\\b').test(text + '\n' + helpers)) active.gaps.add('Unavailable imported value used by original test: ' + name + ' (' + reason + ')')
  }
}
export function finish(task: any) {
  if (!active) return
  if (!active.calls && !active.unsupported.length) active.gaps.add('No candidate operation was exercised by this test')
  appendFileSync(job.audit, JSON.stringify({ ...active, gaps: [...active.gaps] }) + '\n')
  const reason = [...active.gaps].join('; ')
  active = undefined
  if (reason && task.result?.state !== 'skip') throw new AdapterGap('TRIDENT_ADAPTER_GAP: ' + reason)
}
function nativeParse(family: string, source: string) {
  active && active.calls++
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
    return { ...result.value.body, ...(result.value.meta?.title !== undefined ? { title: result.value.meta.title } : {}), ...(result.value.meta?.accessibility?.title !== undefined ? { accessibilityTitle: result.value.meta.accessibility.title } : {}) }
  }
  if (['beautiful', 'zombie'].includes(job.target.tool)) {
    const names: Record<string, string> = { flowchart: 'parseMermaid', state: 'parseMermaid', sequence: 'parseSequenceDiagram', class: 'parseClassDiagram', er: 'parseErDiagram' }
    const parse = api[names[family]!]
    if (typeof parse !== 'function') return gap('Native parser/schema adapter is unavailable for ' + family)
    try {
      const value = parse(source)
      if (value?.then) return gap('Native parse is asynchronous; synchronous database view unavailable')
      return value
    } catch (error: any) {
      if (error?.name !== 'Error' || !String(error.stack).includes(job.target.root)) return gap('Unclassified native parser exception: ' + String(error))
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
function nativeAst(family: string, source: string): any {
  if (family !== 'Pie') return gap('Native Langium AST schema adapter: ' + family)
  const before = active?.rejections ?? 0
  try {
    const raw = nativeParse('pie', source)
    if ((raw.kind ?? raw.type) !== 'pie') return gap('Returned native family differs from requested Pie AST')
    const sections = raw.sections instanceof Map ? [...raw.sections].map(([label, value]) => ({ $type: 'PieSection', label, value })) : raw.slices?.map((slice: any) => ({ $type: 'PieSection', label: slice.label, value: slice.value }))
    if (!sections) return gap('Native pie sections are unavailable')
    return { value: { $type: 'Pie', title: raw.title, accTitle: raw.accTitle ?? raw.accessibilityTitle, accDescr: raw.accDescr ?? raw.accessibilityDescription, showData: raw.showData, sections }, lexerErrors: [], parserErrors: [] }
  } catch (error) {
    if (error instanceof AdapterGap || (active?.rejections ?? 0) === before) throw error
    return { value: undefined, lexerErrors: [], parserErrors: [error] }
  }
}
function projectView(family: string, raw: any) {
  try {
    return projectPublicDatabase(job.target.tool, family, raw)
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
          return typeof value === 'function'
            ? (...params: any[]) => {
                active && active.calls++
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
      const initial = nativeParse(family, examples[family] ?? family)
      if (initial?.constructor?.name !== 'Object') Constructor = initial?.constructor
    } catch {
    } finally {
      active = caseAudit
    }
    const clear = () => {
      raw = Constructor ? new Constructor() : undefined
      view = raw ? projectView(family, raw) : {}
    }
    clear()
    const target: any = {
      clear,
      parse(source: string) {
        raw = nativeParse(family, source)
        view = projectView(family, raw)
      },
    }
    return new Proxy(target, {
      get(t, key: string) {
        if (key in t) return t[key]
        if (key === 'then') return undefined
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
        return deferred(family + '.db.' + key)
      },
    })
  }
  c.database = database
  c.db = database()
  c.parser = {
    yy: c.db,
    parse(source: string) {
      if (job.target.tool !== 'mermaid') return c.parser.yy.parse(source)
      const definition = definitions.get(family)
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
  const nondefault = (value: any) => Object.keys(value).some(key => key !== 'securityLevel' || value[key] !== 'strict')
  const changed = (value: any) => {
    if (job.target.tool !== 'mermaid' && nondefault(value)) {
      if (active) gap('Native host configuration setter is not bound')
      else c.initialConfigGap = true
    }
  }
  const config = {
    setConfig(value: any) {
      changed(value)
      c.config = { ...c.config, ...value }
      configurations?.setConfig?.(value)
    },
    setSiteConfig(value: any) {
      changed(value)
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
      if (job.target.tool !== 'mermaid' && active) return gap('Native host configuration reset is not bound')
      configurations?.reset?.()
    },
  }
  if (/config\.js$|diagramAPI\.js$/.test(source)) return { ...config, default: config }
  if (/logger/.test(source))
    return boundModule(
      {
        log: deferred('Logger side effects are not bound to the candidate'),
        setLogLevel() {
          if (active) return gap('Native log-level setter is not bound')
        },
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
          if (key === 'Pie') return { $type: 'Pie' }
          return deferred('Native AST type: ' + key)
        },
      },
    )
  }
  if (/\.jison$|[Pp]arser\.[jt]s$|\/parser\.[jt]s$/.test(source)) {
    let parser = c.parser
    if (job.target.tool !== 'mermaid' && !source.endsWith('.jison') && ['architecture', 'packet', 'pie', 'radar', 'gitgraph', 'treemap', 'eventmodeling'].includes(family))
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
            return c.db[key]
          },
        },
      ),
      c,
      locals,
    )
  if (/mermaidAPI/.test(source)) {
    if (job.target.tool !== 'mermaid') return deferred('Native public Mermaid API adapter')
    return { mermaidAPI: api.mermaidAPI, default: api.mermaidAPI }
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
