import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import ts from 'typescript'
import { tridentDirectory } from './trident-paths.ts'

// Spawned workers and generated browser imports are not all static imports.
// Keep these entry points explicit, then follow their runtime helper imports.
// Paths are relative to the Trident package, in its own checkout or as Agentic's eval/benchmark.
const entryPoints = [
  'unified/community.ts',
  'unified/community-cli.ts',
  'unified/community-browser.ts',
  'unified/browser-png-inspection.ts',
  'unified/community-worker.mjs',
  'unified/community-python-worker.py',
  'unified/qualification.ts',
  'unified/corpus.ts',
  'unified/process-tree.ts',
  'portable/artifact-dependencies.ts',
  'portable/project-records.ts',
  'portable/mermaid-oracle-worker.mjs',
  'unified/project-update.ts',
  'unified/community-protocol-identity.ts',
]
const git = (root: string, ...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()

/** The legacy community lane's executing producers, identified by committed Git
 * objects. Reports, tests and other benchmark lanes do not invalidate its clocks.
 * Literal corpus/expectation data, installed dependencies and target artifacts
 * are bound separately by project-update's protocol context.
 */
export function communityProtocolIdentity(directory = tridentDirectory): string[] {
  const root = realpathSync(git(directory, 'rev-parse', '--show-toplevel')),
    prefix = relative(root, realpathSync(directory))
  const tracked = new Set(git(root, 'ls-files').split('\n'))
  const paths = new Set<string>()
  const visit = (path: string) => {
    if (paths.has(path)) return
    paths.add(path)
    const absolute = resolve(root, path)
    if (!existsSync(absolute) || !/\.(?:ts|mjs|js)$/.test(path)) return
    const source = ts.createSourceFile(path, readFileSync(absolute, 'utf8'), ts.ScriptTarget.Latest, true)
    const follow = (specifier: string) => {
      if (!specifier.startsWith('.')) return // Installed dependency closure is bound separately.
      const base = resolve(dirname(absolute), specifier)
      const resolved = [base, base + '.ts', base + '.mjs', base + '.js', resolve(base, 'index.ts')].find(candidate => existsSync(candidate) || tracked.has(relative(root, candidate)))
      if (!resolved) throw Error(`Unresolved community protocol helper: ${path}: ${specifier}`)
      const next = relative(root, resolved)
      if (next.startsWith('..')) throw Error('Community protocol helper escapes harness: ' + specifier)
      // Product implementations are measured artifacts; this import supplies
      // family metadata and is already reflected in literal frozen inputs.
      if (next.startsWith('src/')) return
      visit(next)
    }
    const walk = (node: ts.Node) => {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const clause = node.importClause
        const onlyTypes = clause?.isTypeOnly || (!clause?.name && clause?.namedBindings && ts.isNamedImports(clause.namedBindings) && clause.namedBindings.elements.length > 0 && clause.namedBindings.elements.every(element => element.isTypeOnly))
        if (!onlyTypes) follow(node.moduleSpecifier.text)
      } else if (ts.isExportDeclaration(node) && !node.isTypeOnly && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        if (!node.exportClause || !ts.isNamedExports(node.exportClause) || node.exportClause.elements.some(element => !element.isTypeOnly)) follow(node.moduleSpecifier.text)
      } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
        follow(node.arguments[0].text)
      }
      ts.forEachChild(node, walk)
    }
    walk(source)
  }
  for (const entry of entryPoints) {
    const path = join(prefix, entry)
    if (tracked.has(path) || existsSync(resolve(root, path))) visit(path)
  }
  if (!paths.size) throw Error('No community measurement producers found')
  const selected = [...paths].sort()
  const dirty = git(root, 'status', '--porcelain', '--untracked-files=all', '--', ...selected)
  if (dirty) throw Error('Commit community measurement/protocol changes before measuring or reusing records; the Git protocol identity must describe the executing code')
  return git(root, 'ls-tree', '-r', 'HEAD', '--', ...selected)
    .split('\n')
    .filter(Boolean)
}
