// A sync adapter waits for the actual parser in the existing Bun runtime.
// Transport and import errors are gaps; only a parser's own errors are refusals.
import { readFileSync } from 'node:fs'
const request = JSON.parse(readFileSync(0, 'utf8'))
const emit = result => console.log(JSON.stringify(result, function (key, item) {
  if (this[key] instanceof Date) return { __tridentNativeDate: this[key].toISOString() }
  return item instanceof Map ? { __tridentNativeMap: [...item] } : item instanceof Set ? { __tridentNativeSet: [...item] } : item
}))
let api, method, input
try {
  const imported = await import(request.entry)
  api = imported.default && typeof imported.default === 'object' ? { ...imported.default, ...imported } : imported
  method = request.methods.find(name => typeof api[name] === 'function')
  if (!method) { emit({ adapterGap: 'No native parser export among ' + request.methods.join(', ') }); process.exit(0) }
  const declaration = readFileSync(request.entry, 'utf8')
  const takesLines = declaration.split(/\r?\n/).some(line => line.includes('function ' + method + '(') && /\(\s*\w+\s*:\s*string\s*\[\]/.test(line))
  input = takesLines ? request.source.split(/\r?\n/).map(line => line.trim()).filter(Boolean) : request.source
} catch (error) { emit({ adapterGap: 'Native parser import/binding failed: ' + String(error) }); process.exit(0) }
let value
try { value = await api[method](input) }
catch (error) {
  emit({ error: { name: String(error?.name ?? 'Error'), code: error?.code, message: String(error?.message ?? error), stack: String(error?.stack ?? '').slice(0, 2000) } })
  process.exit(0)
}
try {
  if (method === 'parseToIR') {
    if (!value.ok) { emit({ error: { name: 'NativeParseRefusal', message: String(value.error) } }); process.exit(0) }
    value = value.ir
  }
  emit({ value })
} catch (error) { emit({ adapterGap: 'Native parser observation cannot be serialized: ' + String(error) }) }
