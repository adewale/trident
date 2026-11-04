// wevm/ondine exposes no parser or model: only render(). The bridge reports acceptance
// or rejection; an accepted source yields an empty observation (see schema-views.mjs).
import { pathToFileURL } from 'node:url'
import { familyMatches, serve } from './common.mjs'

let render
await serve(async (family, source) => {
  if (!render)
    try {
      ;({ render } = await import(pathToFileURL(process.argv[2]).href))
    } catch (error) {
      return { adapterGap: 'Ondine import failed: ' + String(error) }
    }
  try {
    const result = await render(source)
    return familyMatches(result?.type, family) ? { value: {} } : { unsupported: `Ondine rendered this source as ${result?.type}, not ${family}` }
  } catch (error) {
    if (error?.code === 'unsupported-diagram') return { unsupported: String(error.message) }
    if (error?.code === 'syntax' || error?.code === 'semantic') return { error: { name: 'ParseError', message: String(error.message) } }
    return { adapterGap: 'Unclassified Ondine error: ' + String(error?.message ?? error) }
  }
})
