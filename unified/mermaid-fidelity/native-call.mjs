// A synchronous adapter for a JavaScript/TypeScript parser that needs Bun (TypeScript
// source) or is asynchronous: it runs the project's own parser in a Bun process. With
// TRIDENT_BRIDGE_SERVE=1 the process stays up and answers one request per stdin line, each
// module loaded once (the runtime calls it through bridge-client's persistentBridge);
// otherwise it answers the single request on stdin.
// Transport and import errors are gaps; only a parser's own errors are refusals.
import { readFileSync } from 'node:fs'
import { encode, REPLY_MARK } from './bridges/common.mjs'

const modules = new Map()
async function load(entry) {
  if (!modules.has(entry)) {
    const imported = await import(entry)
    modules.set(entry, { api: imported.default && typeof imported.default === 'object' ? { ...imported.default, ...imported } : imported, declaration: readFileSync(entry, 'utf8') })
  }
  return modules.get(entry)
}

async function answer(request) {
  let api, method, input
  try {
    const loaded = await load(request.entry)
    api = loaded.api
    method = request.methods.find(name => typeof api[name] === 'function')
    if (!method) return { adapterGap: 'No native parser export among ' + request.methods.join(', ') }
    const takesLines = loaded.declaration.split(/\r?\n/).some(line => line.includes('function ' + method + '(') && /\(\s*\w+\s*:\s*string\s*\[\]/.test(line))
    input = takesLines ? request.source.split(/\r?\n/).map(line => line.trim()).filter(Boolean) : request.source
  } catch (error) {
    return { adapterGap: 'Native parser import/binding failed: ' + String(error) }
  }
  let value
  try {
    value = await api[method](input)
  } catch (error) {
    return { error: { name: String(error?.name ?? 'Error'), code: error?.code, message: String(error?.message ?? error), stack: String(error?.stack ?? '').slice(0, 2000) } }
  }
  if (method === 'parseToIR') {
    if (!value?.ok) return { error: { name: 'NativeParseRefusal', message: String(value?.error) } }
    value = value.ir
  }
  return { value }
}

const line = reply => {
  try {
    return encode(reply)
  } catch (error) {
    return encode({ adapterGap: 'Native parser observation cannot be serialized: ' + String(error) })
  }
}
if (process.env.TRIDENT_BRIDGE_SERVE === '1') {
  const { createInterface } = await import('node:readline')
  for await (const text of createInterface({ input: process.stdin, crlfDelay: Infinity })) {
    if (!text.trim()) continue
    const job = JSON.parse(text)
    process.stdout.write(REPLY_MARK + line({ ...await answer(job), requestId: job.requestId }) + '\n')
  }
} else console.log(line(await answer(JSON.parse(readFileSync(0, 'utf8')))))
