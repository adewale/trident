import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import ts from 'typescript'
import { tridentDirectory } from './trident-paths.ts'
import { harnessFile } from './harness-paths.ts'

/** Git already identifies our sources. Follow executable imports, and require
 * callers to supply roots for spawned workers and other non-imported producers.
 * Report files outside this closure do not invalidate retained measurements. */
export function protocolIdentity(root: string, entryPoints: readonly string[]): string[] {
  const git = (owner: string, ...args: string[]) => execFileSync('git', args, { cwd: owner, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  const owners = [...new Set([resolve(root), tridentDirectory])]
  const tracked = new Map(owners.map(owner => [owner, new Set(git(owner, 'ls-files').split('\n'))]))
  const paths = new Map<string, Set<string>>(owners.map(owner => [owner, new Set()]))
  const locate = (file: string): [string, string] => {
    for (const owner of owners) {
      const path = relative(owner, file)
      if (tracked.get(owner)!.has(path) && existsSync(file)) return [owner, path]
    }
    throw Error(`Uncommitted or external measurement producer: ${file}`)
  }
  const visit = (file: string) => {
    const [owner, path] = locate(file)
    if (paths.get(owner)!.has(path)) return
    paths.get(owner)!.add(path)
    if (!/\.(?:ts|mjs|js)$/.test(path)) return
    const source = ts.createSourceFile(path, readFileSync(resolve(owner, path), 'utf8'), ts.ScriptTarget.Latest, true)
    const follow = (specifier: string) => {
      if (!specifier.startsWith('.') && !specifier.startsWith('trident/')) return
      const base = specifier.startsWith('trident/') ? resolve(tridentDirectory, specifier.slice(8)) : resolve(dirname(resolve(owner, path)), specifier)
      const candidates = [base, base + '.ts', base + '.mjs', base + '.js', resolve(base, 'index.ts'), ...(base.endsWith('.js') ? [base.slice(0, -3) + '.ts'] : [])]
      const found = candidates.find(candidate => owners.some(directory => tracked.get(directory)!.has(relative(directory, candidate))) && existsSync(candidate))
      if (!found) throw Error(`Unresolved measurement dependency: ${path}: ${specifier}`)
      visit(found)
    }
    const walk = (node: ts.Node) => {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const clause = node.importClause
        const typeOnly = clause?.isTypeOnly || (!clause?.name && clause?.namedBindings && ts.isNamedImports(clause.namedBindings) && clause.namedBindings.elements.length > 0 && clause.namedBindings.elements.every(item => item.isTypeOnly))
        if (!typeOnly) follow(node.moduleSpecifier.text)
      } else if (ts.isExportDeclaration(node) && !node.isTypeOnly && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        if (!node.exportClause || !ts.isNamedExports(node.exportClause) || node.exportClause.elements.some(item => !item.isTypeOnly)) follow(node.moduleSpecifier.text)
      } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) follow(node.arguments[0].text)
      ts.forEachChild(node, walk)
    }
    walk(source)
  }
  if (!entryPoints.length) throw Error('Measurement producer roots are required')
  for (const entry of entryPoints) visit(harnessFile(root, entry))
  return owners.flatMap(owner => {
    const selected = [...paths.get(owner)!].sort()
    if (!selected.length) return []
    if (git(owner, 'status', '--porcelain', '--untracked-files=all', '--', ...selected)) throw Error('Commit measurement producers before collecting or reusing benchmark records')
    return git(owner, 'ls-tree', '-r', 'HEAD', '--', ...selected).split('\n').filter(Boolean).map(object => owner === resolve(root) ? object : object.replace('\t', '\ttrident/'))
  })
}
