// These public APIs parse the source model consumed by Agentic's renderers.
// They perform no layout: an ELK, Native or TypeScript solver configuration
// shares this semantic evidence. Other families reach parseRegisteredMermaid
// through runtime.ts; no internal parser path is a substitute for a missing API.
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
