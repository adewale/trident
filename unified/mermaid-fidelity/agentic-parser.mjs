import { record } from './view-core.mjs'

// These public APIs parse the source model consumed by Agentic's renderers.
// Older packages expose only the source-preserving editing API; keep that
// binding when the reviewed source parser is absent, never after it rejects.
const SOURCE_PARSERS = { class: 'parseClassDiagram', sequence: 'parseSequenceDiagram', er: 'parseErDiagram', usecase: 'parseUsecaseModel', agentflow: 'parseAgentflowModel' }

export function parseAgenticSource(api, family, source) {
  const operation = SOURCE_PARSERS[family]
  if (!operation || typeof api[operation] !== 'function') return undefined
  const model = api[operation](source)
  // Class's render model expands namespaces but does not record which path
  // prefixes were explicitly declared. Its editing model retains that fact.
  const editable = ['class', 'sequence', 'er'].includes(family) && typeof api.parseRegisteredMermaid === 'function' ? api.parseRegisteredMermaid(source) : undefined
  return { operation, model, editingModel: editable?.ok && editable.value.body.kind === family ? editable.value.body : undefined }
}

/** AgentFlow's public syntax errors carry one-based source line/column fields.
 * Jison's loc uses a one-based line and zero-based column. Preserve the native
 * exception identity and message; supply only these observed location aliases.
 * A non-enumerable getter leaves the native diagnostic's own data unchanged. */
export function agenticDiagnostic(error, hooks) {
  if (!error || 'hash' in error || !Object.isExtensible(error) || !Number.isInteger(error.line) || error.line < 1) return error
  Object.defineProperty(error, 'hash', { configurable: true, get: () => ({ loc: record({
    first_line: error.line,
    ...(Number.isInteger(error.column) && error.column >= 1 ? { first_column: error.column - 1 } : {}),
  }, 'native diagnostic location', ['first_line', 'first_column', 'last_line', 'last_column'], {
    first_column: 'The native diagnostic keeps no source column',
    last_line: 'The native diagnostic keeps no end line',
    last_column: 'The native diagnostic keeps no end column',
  }, hooks, ['last_line', 'last_column']) }) })
  return error
}
