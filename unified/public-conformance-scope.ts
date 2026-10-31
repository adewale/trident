import ts from 'typescript'
import type { PublicTestDeclaration } from './public-conformance-inventory.ts'

export interface PublicScopeReview {
  disposition: 'eligible' | 'excluded' | 'review-required'
  category: 'qualified-public-parse' | 'upstream-disabled' | 'private-implementation' | 'public-render' | 'public-configuration' | 'public-model' | 'public-parser-or-detection' | 'public-registration' | 'public-dom-api' | 'unclassified-contract'
  publicOperations: string[]; privateOperands: string[]; reason: string
}
const publicObjects = new Set(['mermaid', 'mermaidAPI'])
const publicHelpers = new Set(['detectType', 'registerIconPacks', 'registerLayoutLoaders', 'registerExternalDiagrams'])
const rootName = (node: ts.Expression): string | undefined => ts.isIdentifier(node) ? node.text : ts.isPropertyAccessExpression(node) ? rootName(node.expression) : ts.isCallExpression(node) ? rootName(node.expression) : undefined
/** Conservative source review. A public call hidden behind an imported helper
 * cannot be excluded merely because no direct operation was found. */
export function classifyPublicScope(text: string, input: PublicTestDeclaration): PublicScopeReview {
  return classifyPublicScopes(text, [input])[0]!
}
export function classifyPublicScopes(text: string, inputs: readonly PublicTestDeclaration[]): PublicScopeReview[] {
  if (!inputs.length) return []
  const path = inputs[0]!.path
  const filename = '/source/' + path
  const tree = ts.createSourceFile(filename, text, ts.ScriptTarget.Latest, true), imports = new Map<string, string>(), functions = new Map<string, ts.Node>()
  const program = ts.createProgram({ rootNames: [filename], options: { noLib: true, noResolve: true }, host: { getSourceFile: file => file === filename ? tree : undefined, getDefaultLibFileName: () => '', writeFile: () => {}, getCurrentDirectory: () => '/source', getDirectories: () => [], fileExists: file => file === filename, readFile: file => file === filename ? text : undefined, getCanonicalFileName: file => file, useCaseSensitiveFileNames: () => true, getNewLine: () => '\n' } })
  const checker = program.getTypeChecker()
  const apiNames = new Set(publicObjects)
  const callbacks = new Map<string, ts.Node>()
  for (const statement of tree.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      const path = statement.moduleSpecifier.text, clause = statement.importClause
      if (clause?.name) { imports.set(clause.name.text, path); if (/\/(?:mermaid|mermaidAPI)\.js$/.test(path)) apiNames.add(clause.name.text) }
      if (clause?.namedBindings && ts.isNamespaceImport(clause.namedBindings)) imports.set(clause.namedBindings.name.text, path)
      if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) for (const specifier of clause.namedBindings.elements) { imports.set(specifier.name.text, path); if (['mermaid', 'mermaidAPI'].includes(specifier.propertyName?.text ?? specifier.name.text)) apiNames.add(specifier.name.text) }
    }
    if (ts.isFunctionDeclaration(statement) && statement.name) functions.set(statement.name.text, statement)
    if (ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations) if (ts.isIdentifier(declaration.name) && declaration.initializer && (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) functions.set(declaration.name.text, declaration.initializer)
  }
  const locate = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      const callback = node.arguments.find(argument => ts.isFunctionExpression(argument) || ts.isArrowFunction(argument))
      if (callback) callbacks.set((tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1) + ':' + (tree.getLineAndCharacterOfPosition(node.end).line + 1), callback)
    }
    ts.forEachChild(node, locate)
  }
  locate(tree)
  return inputs.map(input => {
    if (input.disposition === 'eligible') return { disposition: 'eligible', category: 'qualified-public-parse', publicOperations: ['parse'], privateOperands: [], reason: input.reason }
    if (input.disposition === 'upstream-disabled') return { disposition: 'excluded', category: 'upstream-disabled', publicOperations: [], privateOperands: [], reason: input.reason }
    const privateOperands = new Set<string>(), publicOperations = new Set<string>(), seenHelpers = new Set<string>()
    const callback = callbacks.get(input.line + ':' + input.endLine)
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      const owner = rootName(node.expression)
      if (ts.isPropertyAccessExpression(node.expression) && owner && apiNames.has(owner)) publicOperations.add(node.expression.name.text)
      else if (ts.isIdentifier(node.expression) && publicHelpers.has(node.expression.text) && imports.has(node.expression.text)) publicOperations.add(node.expression.text)
      if (owner && ts.isIdentifier(node.expression) && functions.has(owner) && !seenHelpers.has(owner)) {
        const helper = functions.get(owner)!, declaration = ts.isFunctionDeclaration(helper) ? helper : helper.parent
        if (checker.getSymbolAtLocation(node.expression)?.declarations?.includes(declaration as ts.Declaration)) { seenHelpers.add(owner); visit(helper) }
      }
    }
    if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
      let operand: ts.Expression = node.expression
      while (ts.isPropertyAccessExpression(operand) || ts.isElementAccessExpression(operand) || ts.isCallExpression(operand)) operand = operand.expression
      if (ts.isIdentifier(operand)) {
        const imported = imports.get(operand.text), symbol = checker.getSymbolAtLocation(operand)
        const importedReference = symbol?.declarations?.some(declaration => ts.isImportSpecifier(declaration) || ts.isImportClause(declaration) || ts.isNamespaceImport(declaration))
        if (importedReference && imported && !apiNames.has(operand.text) && !publicHelpers.has(operand.text) && imported.startsWith('.') && !/(?:tests?\/|testUtils|__mocks__|common)/i.test(imported)) privateOperands.add(operand.text + ' from ' + imported)
      }
    }
    ts.forEachChild(node, visit)
  }
  if (callback) visit(callback)
  const operations = [...publicOperations].sort(), operands = [...privateOperands].sort()
  const category = operations.some(name => ['render'].includes(name)) ? 'public-render' : operations.some(name => ['getDiagramFromText'].includes(name)) ? 'public-model' : operations.some(name => ['initialize', 'getConfig', 'setConfig', 'getSiteConfig', 'updateSiteConfig', 'reset', 'globalReset'].includes(name)) ? 'public-configuration' : operations.some(name => ['parse', 'detectType'].includes(name)) ? 'public-parser-or-detection' : operations.some(name => /^register/.test(name)) ? 'public-registration' : operations.some(name => ['run', 'init', 'contentLoaded', 'setParseErrorHandler'].includes(name)) ? 'public-dom-api' : 'unclassified-contract'
  if (operations.length) return { disposition: 'review-required', category, publicOperations: operations, privateOperands: operands, reason: 'Original public operation found; this callback requires its own equivalent public binding and reference qualification. Mixed/private assertions are retained for review, never silently translated.' }
  if (operands.length) return { disposition: 'review-required', category: 'private-implementation', publicOperations: [], privateOperands: operands, reason: 'The callback directly invokes lexically resolved private implementation imports. This identifies an internal-test candidate, not a complete contract proof: imported helpers and inherited setup still require review before exclusion. No candidate result is used.' }
  return { disposition: 'review-required', category: 'unclassified-contract', publicOperations: [], privateOperands: [], reason: 'No complete public/private contract proof was established; imported helpers and indirect setup require review. Absence of a detected call is not evidence of an internal-only test.' }
  })
}
