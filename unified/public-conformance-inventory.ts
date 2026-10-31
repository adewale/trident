import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'
import { currentReferencePin } from '../reference/source.ts'
import { classifyPublicScopes } from './public-conformance-scope.ts'

export const publicConformanceProtocol = 'original-public-parse-tests-v2'
export const publicParseScope = 'Unmodified original Mermaid parse callbacks at the public parse boundary. Original assertions, snapshots, diagnostic wording and return-value/config expectations remain unchanged. This is public-API compatibility, not drawing accuracy or whole Mermaid test-suite conformance.'
export const publicParseFile = 'packages/mermaid/src/mermaidAPI.spec.ts'
export const publicParseFiles = [publicParseFile, 'packages/mermaid/src/mermaid.spec.ts'] as const
const hash = (value: string) => createHash('sha256').update(value).digest('hex')
export interface PublicTestDeclaration {
  id: string; path: string; family: string; name: string; fullName: string; line: number; endLine: number
  registrar: string; modifiers: string[]; callbackSha256: string; sourceSha256: string
  disposition: 'eligible' | 'upstream-disabled' | 'outside-public-parse-scope'
  reason: string; requiredReturnFields: string[]
}
const testRegistrars = new Set(['it', 'test', 'jsdomIt'])
const modifiers = new Set(['only', 'skip', 'todo', 'each', 'fails', 'concurrent', 'sequential', 'runIf', 'skipIf', 'for'])
function callee(node: ts.Expression): string[] | undefined {
  if (ts.isIdentifier(node)) return [node.text]
  if (ts.isPropertyAccessExpression(node)) return callee(node.expression)?.concat(node.name.text)
  if (ts.isCallExpression(node)) return callee(node.expression)
  if (ts.isTaggedTemplateExpression(node)) return callee(node.tag)
}
const title = (node: ts.Node | undefined) => node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : node && ts.isTemplateExpression(node) ? node.getText() : undefined
/** Complete Git-tracked spec/test declaration census, including jsdomIt wrappers.
 * The scoring surface is fixed independently of the candidate's results. */
export function inventoryPublicTests(upstream: string) {
  const pin = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: upstream, encoding: 'utf8' }).trim()
  if (pin !== currentReferencePin.commit) throw Error('Public conformance requires the pinned upstream source ' + currentReferencePin.commit)
  if (execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: upstream, encoding: 'utf8' }).trim()) throw Error('Original upstream tracked sources changed')
  const paths = execFileSync('git', ['ls-files', '-z'], { cwd: upstream, encoding: 'utf8' }).split('\0').filter(path => /\.(?:spec|test)\.[cm]?[jt]sx?$/.test(path)).sort()
  const declarations: PublicTestDeclaration[] = [], files: { path: string; sha256: string; declarations: number }[] = []
  for (const path of paths) {
    const text = readFileSync(join(upstream, path), 'utf8'), sourceSha256 = hash(text), source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true)
    const family = /\/diagrams\/([^/]+)\//.exec(path)?.[1] ?? '<shared>', before = declarations.length
    const visit = (node: ts.Node, parents: string[]) => {
      if (ts.isCallExpression(node)) {
        const chain = callee(node.expression), label = title(node.arguments[0]), callback = node.arguments.find(argument => ts.isArrowFunction(argument) || ts.isFunctionExpression(argument))
        if (chain?.[0] === 'describe' && label && callback) { ts.forEachChild(callback, child => visit(child, [...parents, label])); return }
        if (chain && testRegistrars.has(chain[0]!) && chain.slice(1).every(item => modifiers.has(item)) && label && (callback || chain.includes('todo'))) {
          const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1
          const fullName = [...parents, label].join(' '), body = callback?.getText(source) ?? '', disabled = chain.includes('skip') || chain.includes('todo')
          const coreParse = path === publicParseFile && parents.length === 2 && parents[0] === 'mermaidAPI' && parents[1] === 'parse'
          const publicWrapperParse = path === publicParseFiles[1] && parents.length === 2 && parents[0] === 'when using mermaid and ' && parents[1] === 'checking validity of input ' && !body.includes('setParseErrorHandler')
          const eligible = (coreParse || publicWrapperParse) && !disabled
          // No snapshot is rewritten. These fields only prevent a missing binding
          // from being mislabeled as a renderer failure or accidental callback pass.
          const requiredReturnFields = eligible && /toMatchInlineSnapshot/.test(body) ? ['diagramType', 'config'] : []
          declarations.push({ id: path + ':' + line, path, family, name: label, fullName, line, endLine: source.getLineAndCharacterOfPosition(node.end).line + 1, registrar: chain[0]!, modifiers: chain.slice(1), callbackSha256: hash(body), sourceSha256, disposition: disabled ? 'upstream-disabled' : eligible ? 'eligible' : 'outside-public-parse-scope', reason: disabled ? 'Disabled by the original upstream declaration.' : eligible ? 'Original direct public parse callback; test body and assertions execute unchanged.' : 'Not a callback of the predeclared public parse API scope. It is not scored or claimed as covered by this benchmark.', requiredReturnFields })
        }
      }
      ts.forEachChild(node, child => visit(child, parents))
    }
    visit(source, [])
    files.push({ path, sha256: sourceSha256, declarations: declarations.length - before })
  }
  const scopeReview = files.flatMap(file => { const own = declarations.filter(input => input.path === file.path); return classifyPublicScopes(readFileSync(join(upstream, file.path), 'utf8'), own).map((review, index) => ({ id: own[index]!.id, ...review })) })
  const scopeCounts = Object.fromEntries([...new Set(scopeReview.map(row => row.category))].map(category => [category, scopeReview.filter(row => row.category === category).length]))
  const eligible = declarations.filter(row => row.disposition === 'eligible')
  if (eligible.length !== 16 || new Set(declarations.map(row => row.id)).size !== declarations.length) throw Error('Pinned public-parse test inventory changed or duplicate declaration IDs')
  return { schema: 'trident-original-public-test-inventory-v1', protocol: publicConformanceProtocol, sourceCommit: pin, scope: publicParseScope, files, declarations, scopeReview, scopeCounts, counts: { files: files.length, declarations: declarations.length, eligible: eligible.length, upstreamDisabled: declarations.filter(row => row.disposition === 'upstream-disabled').length, outsideScope: declarations.filter(row => row.disposition === 'outside-public-parse-scope').length }, wholeSuiteConformanceQualified: false, wholeSuiteBlocker: 'Public render, configuration, model and other original-test surfaces have not been qualified through peer-equivalent public bindings. Outside-scope declarations cannot receive inferred passes.' }
}
/** Replace exactly one public implementation boundary; never alter tests,
 * assertions, literals, snapshots or the surrounding original configuration. */
export function replacePublicParseBody(source: string, expectedSha256: string) {
  if (hash(source) !== expectedSha256) throw Error('Original public implementation hash changed')
  const tree = ts.createSourceFile('mermaidAPI.ts', source, ts.ScriptTarget.Latest, true)
  const declarations: ts.FunctionDeclaration[] = []
  const visit = (node: ts.Node) => { if (ts.isFunctionDeclaration(node) && node.name?.text === 'parse' && node.body) declarations.push(node); ts.forEachChild(node, visit) }
  visit(tree)
  if (declarations.length !== 1) throw Error('Expected exactly one original public parse implementation')
  const declaration = declarations[0]!
  if (declaration.parameters.length !== 2 || declaration.parameters[0]?.name.getText(tree) !== 'text' || declaration.parameters[1]?.name.getText(tree) !== 'parseOptions') throw Error('Original public parse signature changed')
  const body = declaration.body!
  return source.slice(0, body.getStart(tree)) + '{ return (globalThis as any).__tridentPublicParse(text, parseOptions) }' + source.slice(body.end)
}
