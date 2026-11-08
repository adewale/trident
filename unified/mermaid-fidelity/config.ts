import { createRequire, isBuiltin } from 'node:module'
import { resolve, dirname } from 'node:path'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { sourcePlugins } from './source-plugins.ts'

const job = JSON.parse(readFileSync(process.env.TRIDENT_FIDELITY_JOB!, 'utf8'))
const require = createRequire(resolve(job.runtime, 'package.json'))
const reference = createRequire(resolve(job.reference, 'package.json'))
const runtime = resolve(import.meta.dirname, 'runtime.ts')
const family = new Map(job.files.map((file: any) => [file.absolute, file.family]))
export default {
  define: { 'injected.includeLargeFeatures': 'true', 'injected.profiling': 'false', 'import.meta.vitest': 'undefined', packageVersion: JSON.stringify(job.target.version) },
  resolve: { alias: { vitest: resolve(dirname(require.resolve('vitest/package.json')), 'dist/index.js') } },
  // Keep Vite's cache in the runner kit, never in the pinned upstream checkout.
  cacheDir: resolve(job.runtime, 'node_modules/.vite'),
  server: { fs: { allow: [job.upstream, job.reference, job.runtime, resolve(import.meta.dirname, '../..')] } },
  plugins: [
    ...await sourcePlugins(job.upstream, job.runtime),
    {
      name: 'trident-original-imports',
      enforce: 'pre',
      resolveId(source: string) {
        if (isBuiltin(source) || source === 'vitest') return
        if (!source.startsWith('.') && !source.startsWith('/')) {
          if (job.target.tool === 'mermaid') {
            try { return require.resolve(source) } catch {}
          }
          try {
            return reference.resolve(source)
          } catch {
            try {
              return require.resolve(source)
            } catch {}
          }
        }
      },
      transform(code: string, id: string) {
        const path = id.split('?')[0]!,
          helper = path === resolve(job.upstream, 'packages/parser/tests/test-util.ts')
        const selected = family.get(path)
        if (!selected && !helper) return
        // The control executes the original production imports without proxies
        // or rewritten values. Its source/compiler/dependency closure is sealed.
        if (job.target.tool === 'mermaid') return
        const ast = ts.createSourceFile(path, code, ts.ScriptTarget.Latest, true),
          edits: { start: number; end: number; text: string }[] = []
        const adapted = (source: string) => (source.startsWith('.') || source === 'mermaid' || source === '@mermaid-js/parser') && !/(?:^|\/)test-util\.js$|\/tests\/util\.js$|\/diagram-api\/comments\.js$|^\.\/comments\.js$/.test(source)
        let index = 0
        for (const statement of ast.statements) {
          if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) || statement.importClause?.isTypeOnly) continue
          const source = statement.moduleSpecifier.text
          if (!adapted(source)) continue
          const name = '__trident_module_' + index++,
            clause = statement.importClause,
            bindings: string[] = [],
            locals: Record<string, string> = {}
          if (clause?.name) {
            locals.default = clause.name.text
          }
          if (clause?.name) bindings.push(`const ${clause.name.text} = ${name}.default;`)
          if (clause?.namedBindings && ts.isNamespaceImport(clause.namedBindings)) bindings.push(`const ${clause.namedBindings.name.text} = ${name};`)
          else if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings))
            for (const entry of clause.namedBindings.elements)
              if (!entry.isTypeOnly) {
                locals[entry.propertyName?.text ?? entry.name.text] = entry.name.text
                bindings.push(`const ${entry.name.text} = ${name}[${JSON.stringify(entry.propertyName?.text ?? entry.name.text)}];`)
              }
          edits.push({ start: statement.getStart(ast), end: statement.end, text: `const ${name} = (await import(${JSON.stringify(runtime)})).moduleFor(${JSON.stringify(selected ?? 'parser-helper')},${JSON.stringify(source)},${JSON.stringify(path)},${JSON.stringify(locals)});\n${bindings.join('\n')}` })
        }
        const dynamic = (node: ts.Node) => {
          if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments.length === 1) {
            const argument = node.arguments[0]!, literal = ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument), source = literal ? argument.text : undefined, parent = node.parent
            // vi.mock(import('./module')) is a type-safe mock declaration;
            // Vitest erases that import rather than executing it.
            const declaration = literal && ts.isCallExpression(parent) && ts.isPropertyAccessExpression(parent.expression) && ['mock', 'doMock'].includes(parent.expression.name.text) && ts.isIdentifier(parent.expression.expression) && ['vi', 'vitest'].includes(parent.expression.expression.text)
            if ((!literal || adapted(source!)) && !declaration) edits.push({ start: node.getStart(ast), end: node.end, text: `import(${JSON.stringify(runtime)}).then(({ importFor }) => importFor(${JSON.stringify(selected ?? 'parser-helper')},${JSON.stringify(source)},${JSON.stringify(path)}))` })
          }
          ts.forEachChild(node, dynamic)
        }
        dynamic(ast)
        for (const edit of edits.sort((a, b) => b.start - a.start)) code = code.slice(0, edit.start) + edit.text + code.slice(edit.end)
        return { code, map: null }
      },
    },
  ],
  test: {
    root: job.upstream,
    // Vite merges array options when a project extends this config. Keeping
    // all files here would append them to both projects and run each twice.
    include: job.target.tool === 'mermaid' ? job.files.map((file: any) => file.absolute) : [],
    globals: true,
    environment: 'jsdom',
    // Vitest 4 removed environmentMatchGlobs. Inline projects select the real
    // environment; setup.ts independently attests its globals before imports.
    ...(job.target.tool !== 'mermaid' ? { projects: ['jsdom', 'node'].flatMap(environment => {
      const include = job.files.filter((file: any) => (file.environment ?? 'jsdom') === environment).map((file: any) => file.absolute)
      return include.length ? [{ extends: true, test: { name: environment, include, environment } }] : []
    }) } : {}),
    setupFiles: [resolve(import.meta.dirname, 'setup.ts')],
    // One process per test file. The vmForks pool (VM contexts in long-lived workers) was
    // measured on 5 November: no faster with two or more workers, and it changed outcomes,
    // because values built by host APIs such as structuredClone come from another realm.
    pool: 'forks',
    fileParallelism: (job.workers ?? 1) > 1,
    maxWorkers: job.workers ?? 1,
    maxConcurrency: 1,
    testTimeout: 5000,
    hookTimeout: 30000,
    restoreMocks: true,
    clearMocks: true,
    reporters: process.env.TRIDENT_FIDELITY_PROFILE ? ['json', 'default'] : ['json'],
    outputFile: job.results,
    update: false,
  },
}
