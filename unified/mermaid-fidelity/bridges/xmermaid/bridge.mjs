// evangwt/xmermaid: parse_dsl, its own WASM parser, returns the AST as JSON and throws
// "Parse error: ..." for input it rejects.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { familyMatches, serve } from '../common.mjs'

const copy = process.argv[2]
let xm
await serve(async (family, source) => {
  if (!xm)
    try {
      xm = await import(pathToFileURL(join(copy, 'xmermaid.mjs')).href)
      await xm.initWasm({ wasmUrl: readFileSync(join(copy, 'xmermaid_wasm_bg.wasm')) })
    } catch (error) {
      xm = undefined
      return { adapterGap: 'XMermaid WASM initialisation failed: ' + String(error) }
    }
  let ast
  try {
    ast = JSON.parse(xm.__tridentParseDsl(source))
  } catch (error) {
    const message = String(error?.message ?? error)
    return /^Parse error/i.test(message) ? { error: { name: 'ParseError', message } } : { adapterGap: 'XMermaid parse_dsl failed: ' + message.slice(0, 300) }
  }
  return familyMatches(ast.type, family) ? { value: ast } : { unsupported: `XMermaid parsed this source as ${ast.type}, not ${family}` }
})
