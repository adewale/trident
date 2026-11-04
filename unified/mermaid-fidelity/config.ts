import { createRequire, isBuiltin } from 'node:module'
import { resolve, dirname } from 'node:path'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const job = JSON.parse(readFileSync(process.env.TRIDENT_FIDELITY_JOB!, 'utf8'))
const require = createRequire(resolve(job.runtime, 'package.json'))
const reference = createRequire(resolve(job.reference, 'package.json'))
const runtime = resolve(import.meta.dirname, 'runtime.ts')
const family = new Map(job.files.map((file: any) => [file.absolute, file.family]))
export default {
  resolve: { alias: { vitest: resolve(dirname(require.resolve('vitest/package.json')), 'dist/index.js') } },
  // Keep Vite's cache in the runner kit, never in the pinned upstream checkout.
  cacheDir: resolve(job.runtime, 'node_modules/.vite'),
  server: { fs: { allow: [job.upstream, job.reference, job.runtime, resolve(import.meta.dirname, '../..')] } },
  plugins: [
    {
      name: 'trident-original-imports',
      enforce: 'pre',
      resolveId(source: string) {
        if (isBuiltin(source) || source === 'vitest') return
        if (!source.startsWith('.') && !source.startsWith('/')) {
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
        const ast = ts.createSourceFile(path, code, ts.ScriptTarget.Latest, true),
          edits: { start: number; end: number; text: string }[] = []
        let index = 0
        for (const statement of ast.statements) {
          if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) || statement.importClause?.isTypeOnly) continue
          const source = statement.moduleSpecifier.text
          if (!source.startsWith('.') || /(?:^|\/)test-util\.js$|\/tests\/util\.js$|\/diagram-api\/comments\.js$|^\.\/comments\.js$/.test(source)) continue
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
        for (const edit of edits.reverse()) code = code.slice(0, edit.start) + edit.text + code.slice(edit.end)
        return { code, map: null }
      },
    },
  ],
  test: {
    root: job.upstream,
    include: job.files.map((file: any) => file.absolute),
    globals: true,
    environment: 'jsdom',
    setupFiles: [resolve(import.meta.dirname, 'setup.ts')],
    fileParallelism: false,
    maxWorkers: 1,
    maxConcurrency: 1,
    testTimeout: 5000,
    hookTimeout: 30000,
    restoreMocks: true,
    reporters: ['json'],
    outputFile: job.results,
    update: false,
  },
}
