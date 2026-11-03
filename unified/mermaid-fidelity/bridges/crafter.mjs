// crafter-station/mermaid: the renderer's own parser package, @crafter/mermaid-parser.
// parse() never throws: it returns { ast, diagnostics }.
import { pathToFileURL } from 'node:url'
import { emit, familyMatches, request } from './common.mjs'

const { family, source } = request()
let parse
try { ({ parse } = await import(pathToFileURL(process.argv[2]).href)) }
catch (error) { emit({ adapterGap: 'Crafter parser import failed: ' + String(error) }); process.exit(0) }
let result
try { result = parse(source) } catch (error) { emit({ adapterGap: 'Crafter parser threw unexpectedly: ' + String(error) }); process.exit(0) }
const errors = (result.diagnostics ?? []).filter(d => d.severity === 'error')
if (!result.ast) {
  const message = errors.map(d => d.message).join('; ') || 'No AST returned'
  emit(/detect diagram type/i.test(message) ? { unsupported: message } : { error: { name: 'ParseError', message } })
} else if (!familyMatches(result.ast.type, family)) emit({ unsupported: `Crafter parsed this source as ${result.ast.type}, not ${family}` })
else if (errors.length) emit({ error: { name: 'ParseError', message: errors.map(d => d.message).join('; ') } })
else emit({ value: result.ast })
