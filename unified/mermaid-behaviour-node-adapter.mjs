// Thin optional bridge for native Node public functions. This file never
// parses Mermaid, chooses expected families or manufactures SVG metadata.
// Config: {module:ABSOLUTE_PUBLIC_ENTRY,detect:{export,familyPath?},
//          render:{export,svgPath?,options?}}. Dot paths select native fields.
import { readFileSync } from 'node:fs'
import { isAbsolute } from 'node:path'
import { pathToFileURL } from 'node:url'
const config = JSON.parse(readFileSync(process.argv[2], 'utf8'))
if (!isAbsolute(config.module)) throw Error('Native public module path must be absolute')
const request = JSON.parse(readFileSync(0, 'utf8')), module = await import(pathToFileURL(config.module).href)
const at = (value, path) => path ? path.split('.').reduce((owner, key) => owner?.[key], value) : value
const spec = request.operation === 'detect-family' ? config.detect : request.operation === 'render-svg' ? config.render : null
let output
if (!spec) output = { unsupported: true }
else {
  const fn = at(module, spec.export), owner = spec.export.includes('.') ? at(module, spec.export.slice(0, spec.export.lastIndexOf('.'))) : module
  if (typeof fn !== 'function') throw Error('Declared native public function is unavailable')
  const value = await fn.call(owner, request.source, spec.options)
  output = request.operation === 'detect-family' ? { family: at(value, spec.familyPath) } : { svg: at(value, spec.svgPath) }
}
process.stdout.write(JSON.stringify(output) + '\n')
