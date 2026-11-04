// evangwt/xmermaid: parse_dsl, its own WASM parser, returns the AST as JSON and throws
// "Parse error: ..." for input it rejects.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { emit, familyMatches, request } from '../common.mjs'

const copy = process.argv[2]
const { family, source } = request()
let xm
try {
  xm = await import(pathToFileURL(join(copy, 'xmermaid.mjs')).href)
  await xm.initWasm({ wasmUrl: readFileSync(join(copy, 'xmermaid_wasm_bg.wasm')) })
} catch (error) {
  emit({ adapterGap: 'XMermaid WASM initialisation failed: ' + String(error) })
  process.exit(0)
}
let ast
try {
  ast = JSON.parse(xm.__tridentParseDsl(source))
} catch (error) {
  const message = String(error?.message ?? error)
  emit(/^Parse error/i.test(message) ? { error: { name: 'ParseError', message } } : { adapterGap: 'XMermaid parse_dsl failed: ' + message.slice(0, 300) })
  process.exit(0)
}
emit(familyMatches(ast.type, family) ? { value: ast } : { unsupported: `XMermaid parsed this source as ${ast.type}, not ${family}` })
