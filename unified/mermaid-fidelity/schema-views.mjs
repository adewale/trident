// Public dispatch over pure base mappings and reviewed extension views.
import { reviewedSchemaView, reviewedAstView, unavailableAstView } from './view-core.mjs'
import { extraSchemaView, extraAstView } from './views/index.mjs'
export * from './view-core.mjs'

export function nativeSchemaView(project, family, raw, hooks) {
  // Frankenmermaid's IR names its own diagram type; this file's ER, class and flowchart
  // views read only the IR of that same type (views/frankenmermaid.mjs checks its own).
  const franken = project === 'Dicklesworthstone/frankenmermaid' && raw && typeof raw === 'object'
  const base = franken && String(raw.diagram_type).toLowerCase() !== family ? undefined : reviewedSchemaView(project, family, raw, hooks)
  if (base?.whole || raw == null || typeof raw !== 'object') return base
  const more = extraSchemaView(project, family, raw, { ...hooks, schemaView: nativeSchemaView })
  return more ? { ...(base ?? {}), ...more } : base
}
export function nativeAstView(project, family, raw, hooks) {
  return reviewedAstView(project, family, raw, hooks) ?? (raw && typeof raw === 'object' ? extraAstView(project, family, raw, hooks) : undefined) ?? unavailableAstView(project, family, hooks)
}
