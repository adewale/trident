// crafter-station/mermaid: the renderer's own parser package, @crafter/mermaid-parser.
// parse() never throws: it returns { ast, diagnostics }.
import { pathToFileURL } from 'node:url'
import { familyMatches, serve } from './common.mjs'

let parse
await serve(async (family, source) => {
  if (!parse)
    try {
      ;({ parse } = await import(pathToFileURL(process.argv[2]).href))
    } catch (error) {
      return { adapterGap: 'Crafter parser import failed: ' + String(error) }
    }
  let result
  try {
    result = parse(source)
  } catch (error) {
    return { adapterGap: 'Crafter parser threw unexpectedly: ' + String(error) }
  }
  const errors = (result.diagnostics ?? []).filter(d => d.severity === 'error')
  if (!result.ast) {
    const message = errors.map(d => d.message).join('; ') || 'No AST returned'
    return /detect diagram type/i.test(message) ? { unsupported: message } : { error: { name: 'ParseError', message } }
  }
  if (!familyMatches(result.ast.type, family)) return { unsupported: `Crafter parsed this source as ${result.ast.type}, not ${family}` }
  if (errors.length) return { error: { name: 'ParseError', message: errors.map(d => d.message).join('; ') } }
  return { value: result.ast }
})
