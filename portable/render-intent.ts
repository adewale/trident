import type { Json, PortableCase } from './cohorts.ts'

/** An authored cross-tool intent, separate from each tool's public option names. */
function mappedOptions(adapter: string, options: Record<string, Json> | undefined, intent: PortableCase['renderIntent']): Record<string, Json> | undefined {
  if (intent === undefined) return options
  if (intent === null || typeof intent !== 'object' || Array.isArray(intent)) throw Error('Invalid declared node-label font-size intent')
  if (Object.keys(intent).length !== 1 || !Object.hasOwn(intent, 'nodeLabelFontSize') || typeof intent.nodeLabelFontSize !== 'number' || !Number.isFinite(intent.nodeLabelFontSize) || intent.nodeLabelFontSize < 1 || intent.nodeLabelFontSize > 256) throw Error('Invalid declared node-label font-size intent')
  if (options !== undefined && (options === null || typeof options !== 'object' || Array.isArray(options))) throw Error('Intent mapping requires an actual public options object')
  const base = options === undefined ? {} : options, fontSize = intent.nodeLabelFontSize
  if (adapter === 'pele') return { ...base, fontSize }
  if (adapter === 'agentic') {
    const roleStyle = { roles: { node: { fontSize } } }
    return { ...base, style: base.style === undefined ? roleStyle : Array.isArray(base.style) ? [...base.style, roleStyle] : [base.style, roleStyle] }
  }
  throw Error('No reviewed node-label font-size option mapping for adapter ' + adapter)
}

/** Runs before clocks. Only the explicit intent is translated; arbitrary
 * renderOptions remain actual public options and retain the target's rejection. */
export function portableCaseForAdapter(adapter: string, testCase: PortableCase): PortableCase {
  if (testCase.renderIntent === undefined && testCase.edit?.renderIntent === undefined) return testCase
  return {
    ...testCase,
    renderOptions: mappedOptions(adapter, testCase.renderOptions, testCase.renderIntent),
    ...(testCase.edit ? { edit: {
      ...testCase.edit,
      renderOptions: mappedOptions(adapter, testCase.edit.renderOptions ?? testCase.renderOptions, testCase.edit.renderIntent === undefined ? testCase.renderIntent : testCase.edit.renderIntent),
    } } : {}),
  }
}
