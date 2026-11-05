// Registry of reviewed schema views kept in their own modules. Each module's default
// export is { schema: { [family]: { [project]: (raw, hooks) => view } }, ast: { [astType]:
// { [project]: (raw, hooks) => astValue } } }. A module only defines functions at its top
// level: it imports helpers from ../schema-views.mjs, which imports this registry.
import ports from './ports.mjs'
import frankenmermaid from './frankenmermaid.mjs'
import sequence from './sequence.mjs'
import state from './state.mjs'
import gitgraph from './gitgraph.mjs'
import misc from './misc.mjs'

const modules = () => [ports, frankenmermaid, sequence, state, gitgraph, misc]

/** The getters every registered module offers for this project and family, merged. */
export function extraSchemaView(project, family, raw, hooks) {
  let merged
  for (const module of modules()) {
    const view = module?.schema?.[family]?.[project]?.(raw, hooks)
    if (view) merged = { ...(merged ?? {}), ...view }
  }
  return merged
}

/** A registered Langium AST view for this project and AST type, if any. */
export function extraAstView(project, astType, raw, hooks) {
  for (const module of modules()) {
    const view = module?.ast?.[astType]?.[project]
    if (view) return view(raw, hooks)
  }
  return undefined
}
