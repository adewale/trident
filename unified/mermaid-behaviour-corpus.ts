import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'
import original from '../corpus/mermaid-public-tests-expanded.json' with { type: 'json' }

export const behaviourProtocol = 'mermaid-observable-behaviour-v1'
export const behaviourHash = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex')
export interface BehaviourStep { source: string; sourceSha256: string; expected: { family?: string; title?: string; description?: string } }
export interface BehaviourCase { id: string; operation: 'detect-family' | 'svg-accessibility'; steps: BehaviourStep[]; origin: { callbackId: string; callbackSha256: string; sourcePath: string; sourceSha256: string; line: number; parameter?: string }; adaptation: string }
export const familyAliases: Readonly<Record<string, string>> = { 'flowchart-v2': 'flowchart', 'flowchart-elk': 'flowchart', graph: 'flowchart', classDiagram: 'class', 'classDiagram-v2': 'class', erDiagram: 'er', gitGraph: 'gitgraph', stateDiagram: 'state', 'stateDiagram-v2': 'state', sequenceDiagram: 'sequence', requirementDiagram: 'requirement', 'swimlane-beta': 'swimlane', treeView: 'treeview', 'treeView-beta': 'treeview', 'packet-beta': 'packet', 'xychart-beta': 'xychart', 'radar-beta': 'radar', 'architecture-beta': 'architecture' }
export const portableFamily = (name: string) => Object.hasOwn(familyAliases, name) ? familyAliases[name]! : name

/** Literal AST transcription only. No upstream module, parser, detector or
 * renderer is imported or evaluated to construct an expected answer. */
export function buildBehaviourCorpus(root: string) {
  const files = new Map<string, ts.SourceFile>()
  const source = (path: string) => {
    if (!files.has(path)) { const spec = original.sourceSpecs.find(row => row.path === path); if (!spec) throw Error('Missing original spec'); const text = readFileSync(join(root, spec.fixture), 'utf8'); if (behaviourHash(text) !== spec.sha256) throw Error('Original source fixture changed'); files.set(path, ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true)) }
    return files.get(path)!
  }
  const literal = (node: ts.Expression, env: Map<string, ts.Expression | unknown> = new Map()): any => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
    if (ts.isIdentifier(node) && env.has(node.text)) { const value = env.get(node.text); return value && typeof value === 'object' && 'kind' in value ? literal(value as ts.Expression, env) : value }
    if (ts.isTemplateExpression(node)) return node.head.text + node.templateSpans.map(span => String(literal(span.expression, env)) + span.literal.text).join('')
    if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(node.properties.map(item => { if (!ts.isPropertyAssignment(item) || !ts.isIdentifier(item.name) && !ts.isStringLiteral(item.name)) throw Error('Nonliteral property'); return [item.name.text, literal(item.initializer, env)] }))
    if (ts.isArrayLiteralExpression(node)) return node.elements.map(item => { if (!ts.isExpression(item)) throw Error('Nonliteral element'); return literal(item, env) })
    throw Error('Unreviewed literal expression: ' + node.getText().slice(0, 100))
  }
  const cases: BehaviourCase[] = [], origins: { callbackId: string; disposition: 'adapted' | 'excluded'; reason: string }[] = []
  for (const input of original.eligible) {
    const operation = input.publicOperation === 'detectType' ? 'detect-family' : input.publicOperation === 'render' && input.path.endsWith('/mermaidAPI.spec.ts') ? 'svg-accessibility' : null
    if (!operation) { origins.push({ callbackId: input.id, disposition: 'excluded', reason: input.publicOperation === 'parse' ? 'Acceptance/configuration snapshots are not portable observable semantic assertions; exact API diagnostic remains separate.' : 'Generic SVG-return callback overlaps the documentation drawing benchmark and supplies no additional semantic assertion here.' }); continue }
    const tree = source(input.path); let callback: ts.ArrowFunction | ts.FunctionExpression | undefined
    const visit = (node: ts.Node) => { if (ts.isCallExpression(node) && tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1 === input.line) { const fn = node.arguments.find(arg => ts.isArrowFunction(arg) || ts.isFunctionExpression(arg)); if (fn && (ts.isArrowFunction(fn) || ts.isFunctionExpression(fn))) callback = fn } ts.forEachChild(node, visit) }; visit(tree)
    if (!callback || behaviourHash(callback.getText(tree)) !== input.callbackSha256) throw Error('Original callback changed: ' + input.id)
    const steps: BehaviourStep[] = [], step = (text: string, expected: BehaviourStep['expected']) => steps.push({ source: text, sourceSha256: behaviourHash(text), expected })
    if (operation === 'detect-family') {
      if (input.id.includes(':17#parameter:')) {
        const matches: any[] = []; const scan = (node: ts.Node) => { if (ts.isObjectLiteralExpression(node)) { try { const value = literal(node); if (value.text === input.parameter && typeof value.expected === 'string') matches.push(value) } catch {} } ts.forEachChild(node, scan) }; scan(tree)
        if (matches.length !== 1) throw Error('Original detection parameter is ambiguous')
        step(matches[0].text, { family: portableFamily(matches[0].expected) })
      } else {
        const env = new Map<string, ts.Expression>()
        const declarations = (node: ts.Node) => { if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) env.set(node.name.text, node.initializer); ts.forEachChild(node, declarations) }; declarations(callback)
        const assertions = (node: ts.Node) => {
          if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'toBe' && node.arguments.length === 1 && ts.isCallExpression(node.expression.expression) && node.expression.expression.expression.getText(tree) === 'expect') {
            let actual = node.expression.expression.arguments[0]
            if (actual && ts.isIdentifier(actual)) actual = env.get(actual.text)
            if (actual && ts.isCallExpression(actual) && actual.expression.getText(tree) === 'detectType' && actual.arguments.length === 1) step(literal(actual.arguments[0]!, env), { family: portableFamily(literal(node.arguments[0]!, env)) })
          }
          ts.forEachChild(node, assertions)
        }; assertions(callback)
      }
      if (!steps.length) throw Error('Original detector assertion was not transcribed')
      if (steps.some(item => ['error', '---'].includes(item.expected.family!))) { origins.push({ callbackId: input.id, disposition: 'excluded', reason: 'Mermaid-native detector sentinel identity has no portable diagram-family obligation.' }); continue }
    } else {
      const env = new Map<string, unknown>(); let matrix: any[] | undefined, template: ts.Expression | undefined
      const scan = (node: ts.Node) => {
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
          if (node.name.text === 'diagramTypesAndExpectations') matrix = literal(node.initializer)
          if (['a11yTitle', 'a11yDescr'].includes(node.name.text)) env.set(node.name.text, literal(node.initializer))
          if (node.name.text === 'diagramText' && ts.isTemplateExpression(node.initializer) && node.initializer.getText(tree).includes('${a11yTitle}') && node.initializer.getText(tree).includes('${a11yDescr}')) { if (template) throw Error('Accessibility source template is ambiguous'); template = node.initializer }
        }; ts.forEachChild(node, scan)
      }; scan(tree)
      const item = matrix?.find(value => value.textDiagramType === input.parameter)
      if (!item || !template || typeof env.get('a11yTitle') !== 'string' || typeof env.get('a11yDescr') !== 'string') throw Error('Original accessibility matrix changed')
      env.set('diagramType', item.textDiagramType); env.set('content', item.content ?? '')
      step(literal(template, env), { title: env.get('a11yTitle') as string, description: env.get('a11yDescr') as string })
    }
    cases.push({ id: 'behaviour:' + input.id, operation, steps, origin: { callbackId: input.id, callbackSha256: input.callbackSha256, sourcePath: input.path, sourceSha256: input.sourceSha256, line: input.line, ...('parameter' in input && input.parameter ? { parameter: input.parameter } : {}) }, adaptation: operation === 'detect-family' ? 'Compare ordered source-derived diagram families using the explicit public family-alias table; renderer/backend implementation names are not required.' : 'Check source-authored SVG accessible name and description through native root title/desc or valid ARIA references. Caller-selected IDs, Mermaid-specific role-description strings and jsdom geometry mocks are not required. This is structural naming, not a visual or complete accessibility audit.' })
    origins.push({ callbackId: input.id, disposition: 'adapted', reason: cases.at(-1)!.adaptation })
  }
  if (cases.length !== 49 || origins.length !== 154 || cases.filter(row => row.operation === 'detect-family').length !== 30 || cases.filter(row => row.operation === 'svg-accessibility').length !== 19) throw Error('Reviewed behaviour scope changed')
  return { schema: 'trident-mermaid-behaviour-corpus-v1', protocol: behaviourProtocol, sourceCommit: original.sourceCommit, originalInventorySha256: behaviourHash(readFileSync(join(root, 'corpus/mermaid-public-tests-expanded.json'))), originalCallbacks: 154, scope: '49 adapted observable semantic behaviours from the154-callback upstream API diagnostic; not unchanged tests, exact API compatibility, whole Mermaid conformance, drawing quality or timing.', familyAliases, cases, origins }
}
