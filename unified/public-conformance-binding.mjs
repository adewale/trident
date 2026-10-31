import fs from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
const valueAt = (value, path) => path ? path.split('.').reduce((current, key) => current?.[key], value) : value
/** Public return-envelope translation only. No reference parser, private DB,
 * source reparse, fabricated config or copied reference answer is permitted. */
export async function bindPublicParse(binding, observe) {
  const require = createRequire(join(binding.packageRoot, 'package.json'))
  const entry = require.resolve(binding.publicImport), module = await import(pathToFileURL(entry).href)
  if (binding.kind === 'mermaid-api') {
    const api = module.default ?? module
    if (typeof api?.parse !== 'function') throw Error('Frozen public mermaid.parse binding is unavailable')
    return { entry, reset: () => api.initialize({ startOnLoad: false, securityLevel: 'strict', logLevel: 'fatal' }), parse: async (source, options) => {
      try { const value = await api.parse(source, options); observe({ source, disposition: 'observed', missingFields: [], returned: value === false ? false : { diagramType: value?.diagramType, configPresent: Object.hasOwn(value ?? {}, 'config') } }); return value }
      catch (error) { observe({ source, disposition: 'observed', missingFields: [], thrown: { name: error?.name, message: error?.message } }); throw error }
    } }
  }
  if (binding.kind !== 'result-parser') throw Error('Unreviewed public parser binding kind')
  const target = valueAt(module, binding.export), owner = binding.export.includes('.') ? valueAt(module, binding.export.slice(0, binding.export.lastIndexOf('.'))) : module
  if (typeof target !== 'function') throw Error('Frozen public result-parser export is unavailable')
  return { entry, reset: () => {}, parse: async (source, options) => {
    const result = await target.call(owner, source)
    if (!result || typeof result.ok !== 'boolean') { observe({ source, disposition: 'binding-unavailable', missingFields: [], reason: 'Public parser did not return the reviewed typed Result.' }); throw Error('Unreviewed public parser result') }
    if (!result.ok) {
      const diagnostic = result.error
      const error = new Error(typeof diagnostic === 'string' ? diagnostic : diagnostic?.message ?? JSON.stringify(diagnostic))
      if (diagnostic?.name) error.name = diagnostic.name
      observe({ source, disposition: 'observed', missingFields: [], thrown: { name: error.name, message: error.message } })
      if (options?.suppressErrors === true) return false
      throw error
    }
    const raw = result.value, family = valueAt(raw, binding.familyPath)
    // Preserve acceptance/preservation distinctions made by the actual API.
    // Throwing to satisfy an original rejection assertion cannot manufacture a pass.
    if (typeof family !== 'string' || family.startsWith('family:') || valueAt(raw, 'body.kind') === 'preserved') {
      observe({ source, disposition: 'unsupported', missingFields: [], reason: 'Public result reports a preserved/unregistered family rather than native parser validation.' })
      throw Error('Public parser does not validate this family')
    }
    const diagramType = binding.familyAliases?.[family] ?? family, config = binding.configPath ? valueAt(raw, binding.configPath) : undefined
    const missingFields = config === undefined ? ['config'] : []
    observe({ source, disposition: 'observed', missingFields, returned: { diagramType, configPresent: config !== undefined } })
    return { diagramType, ...(config !== undefined ? { config } : {}) }
  } }
}
export const publicBindingManifest = binding => {
  const require = createRequire(join(binding.packageRoot, 'package.json'))
  return { package: JSON.parse(fs.readFileSync(join(binding.packageRoot, 'package.json'), 'utf8')), entry: require.resolve(binding.publicImport) }
}

/** Detector calls use the actual public detector, never the parser or a source
 * recognizer supplied by Trident. Family aliases translate declared vocabulary. */
export async function bindPublicDetect(binding, observe) {
  const require = createRequire(join(binding.packageRoot, 'package.json')), entry = require.resolve(binding.publicImport), module = await import(pathToFileURL(entry).href)
  if (binding.kind === 'mermaid-api') {
    const api = module.default ?? module
    return { detect: (source, config) => {
      if (typeof api.detectType !== 'function') { observe({ source, disposition: 'binding-unavailable', missingFields: [] }); throw Error('Public detector unavailable') }
      try { const family = api.detectType(source, config); observe({ source, disposition: 'observed', missingFields: [], returned: family }); return family }
      catch (error) { observe({ source, disposition: 'observed', missingFields: [], thrown: { name: error?.name, message: error?.message } }); throw error }
    } }
  }
  const description = binding.detection, target = description && valueAt(module, description.export)
  return { detect: (source, config) => {
    if (!description || typeof target !== 'function') { observe({ source, disposition: 'binding-unavailable', missingFields: [] }); throw Error('No reviewed public detector binding') }
    const owner = description.export.includes('.') ? valueAt(module, description.export.slice(0, description.export.lastIndexOf('.'))) : module
    let value
    try { value = target.call(owner, source, config) }
    catch (error) { observe({ source, disposition: 'observed', missingFields: [], thrown: { name: error?.name, message: error?.message } }); throw error }
    const family = valueAt(value, description.familyPath), kind = description.kindPath ? valueAt(value, description.kindPath) : undefined
    if (typeof family !== 'string' || description.kindPath && kind !== description.acceptedKind) { observe({ source, disposition: 'unsupported', missingFields: [], returned: value }); throw Error('Public detector does not recognize this input') }
    const canonical = binding.familyAliases?.[family] ?? family
    observe({ source, disposition: 'observed', missingFields: [], returned: canonical }); return canonical
  } }
}

/** Retain native SVG bytes. No title/description/IDs/roles are added, rewritten or
 * inferred from source. The returned envelope translates only public call shape. */
export async function bindPublicRender(binding, observe) {
  const require = createRequire(join(binding.packageRoot, 'package.json')), entry = require.resolve(binding.publicImport), module = await import(pathToFileURL(entry).href)
  const api = module.default ?? module, description = binding.render
  return { render: async (id, source, container) => {
    const target = binding.kind === 'mermaid-api' ? api.render : description && valueAt(module, description.export)
    if (typeof target !== 'function') { observe({ source, disposition: 'binding-unavailable', missingFields: [] }); throw Error('No reviewed public SVG render binding') }
    const owner = binding.kind === 'mermaid-api' ? api : description.export.includes('.') ? valueAt(module, description.export.slice(0, description.export.lastIndexOf('.'))) : module
    let result
    try { result = binding.kind === 'mermaid-api' ? await target.call(owner, id, source, container) : await target.call(owner, source, description.options) }
    catch (error) { observe({ source, disposition: 'observed', missingFields: [], thrown: { name: error?.name, message: error?.message } }); throw error }
    const svg = binding.kind === 'mermaid-api' ? result?.svg : result
    if (typeof svg !== 'string') { observe({ source, disposition: 'binding-unavailable', missingFields: ['svg'] }); throw Error('Public render did not return its reviewed SVG string contract') }
    observe({ source, disposition: 'observed', missingFields: [], returned: { svg }, inputMapping: binding.kind === 'mermaid-api' ? 'caller id, source, optional DOM container' : 'source and reviewed native options; public API has no caller diagram-ID/DOM-container parameter' })
    return binding.kind === 'mermaid-api' ? result : { svg }
  } }
}
