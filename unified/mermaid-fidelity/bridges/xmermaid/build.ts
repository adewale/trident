// evangwt/xmermaid: its WASM parser for every family, parse_dsl, sits in the package's
// wasm-bindgen glue inside dist/xmermaid.esm.js and is not re-exported. Copy that file
// and the WASM binary unchanged and append one export line; no parsing code is altered.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { nodeExecutable } from '../../bridges.ts'
import { byteDigest } from '../../../../portable/artifacts.ts'

export async function build(peer: any, outDir: string): Promise<string[]> {
  const root = peer?.artifact?.root
  const version = peer?.artifact?.version
  if (!root || !existsSync(join(root, 'dist/xmermaid.esm.js'))) throw Error('Prepared XMermaid artifact has no dist/xmermaid.esm.js')
  if (JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version !== version) throw Error('XMermaid package version differs from the prepared artifact ' + version)
  const copy = join(outDir, 'xmermaid-' + version)
  const text = readFileSync(join(root, 'dist/xmermaid.esm.js'), 'utf8')
  if (!/^function parse_dsl\(input\)/m.test(text)) throw Error('XMermaid glue no longer defines parse_dsl')
  const expected = text + "\nexport { parse_dsl as __tridentParseDsl } // appended by Trident's Fidelity bridge\n"
  const glue = join(copy, 'xmermaid.mjs'), wasm = join(copy, 'xmermaid_wasm_bg.wasm')
  if (!existsSync(join(copy, '.complete')) || !existsSync(glue) || readFileSync(glue, 'utf8') !== expected || !existsSync(wasm) || byteDigest(wasm) !== byteDigest(join(root, 'dist/xmermaid_wasm_bg.wasm'))) {
    mkdirSync(copy, { recursive: true })
    writeFileSync(glue, expected)
    copyFileSync(join(root, 'dist/xmermaid_wasm_bg.wasm'), join(copy, 'xmermaid_wasm_bg.wasm'))
    writeFileSync(join(copy, '.complete'), version)
  }
  return [nodeExecutable(), join(import.meta.dirname, 'bridge.mjs'), copy]
}
