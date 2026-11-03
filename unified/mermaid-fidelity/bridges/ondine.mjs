// wevm/ondine exposes no parser or model: only render(). The bridge can report
// acceptance or rejection; an accepted source yields an empty observation, so
// assertions about the parsed model remain Trident gaps rather than failures.
import { pathToFileURL } from 'node:url'
import { emit, familyMatches, request } from './common.mjs'

const { family, source } = request()
let render
try { ({ render } = await import(pathToFileURL(process.argv[2]).href)) }
catch (error) { emit({ adapterGap: 'Ondine import failed: ' + String(error) }); process.exit(0) }
try {
  const result = await render(source)
  if (!familyMatches(result?.type, family)) emit({ unsupported: `Ondine rendered this source as ${result?.type}, not ${family}` })
  else emit({ value: {} })
} catch (error) {
  if (error?.code === 'unsupported-diagram') emit({ unsupported: String(error.message) })
  else if (error?.code === 'syntax' || error?.code === 'semantic') emit({ error: { name: 'ParseError', message: String(error.message) } })
  else emit({ adapterGap: 'Unclassified Ondine error: ' + String(error?.message ?? error) })
}
