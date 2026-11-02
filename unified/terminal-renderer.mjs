import fs from 'node:fs'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

/** The existing terminal bindings, without an output observer or retention. */
export async function terminalRenderer(peer) {
  const artifact = peer.artifact, config = peer.node.benchmark, cleanups = []
  if (!artifact?.module) throw Error('No in-process terminal module')
  const require = createRequire(resolve(artifact.root, 'package.json'))
  let invoke, afterCall, boundary
  if (config.package === 'mermaidtui') {
    const api = await import(pathToFileURL(artifact.module).href)
    for (const name of ['parseMermaid', 'computeLayout', 'renderGraph']) if (typeof api[name] !== 'function') throw Error('Published MermaidTUI pipeline is absent: ' + name)
    invoke = source => { const graph = api.parseMermaid(source); api.computeLayout(graph); return api.renderGraph(graph, { ascii: false }) }
    boundary = 'persistent Node public parseMermaid → computeLayout → renderGraph; errors propagate'
  } else if (['published-extra', 'extra-source'].includes(config.adapter)) {
    const { createExtraCommunityApi } = await import('./community-extra-adapters.mjs')
    const bound = await createExtraCommunityApi({ artifact, node: peer.node, config, output: 'terminal', require, cleanups })
    invoke = bound.invoke
    afterCall = bound.afterCall
  } else {
    let entry = artifact.module
    if (config.adapter === 'beautiful' && config.terminalSubpath) {
      const pkg = JSON.parse(fs.readFileSync(resolve(artifact.root, 'package.json'), 'utf8'))
      const select = value => typeof value === 'string' ? value : value && typeof value === 'object' ? Object.entries(value).filter(([key]) => ['node', 'import', 'default'].includes(key)).map(([, item]) => select(item)).find(Boolean) : undefined
      const exported = select(pkg.exports?.['./' + config.terminalSubpath])
      if (!exported) throw Error('Declared terminal subpath is absent')
      entry = resolve(artifact.root, exported)
    }
    const imported = await import(pathToFileURL(entry).href), api = imported.default && typeof imported.default === 'object' ? { ...imported.default, ...imported } : imported
    if (peer.node.id === 'dfadler/zombie-mermaid' && typeof api.registerElk === 'function') { const elk = require('elkjs/lib/elk.bundled.js'); api.registerElk(elk.default ?? elk) }
    const name = ['renderMermaidASCII', 'renderMermaidAscii'].find(key => typeof api[key] === 'function')
    if (name) invoke = source => api[name](source, { useAscii: false, colorMode: 'none' })
    else if (config.adapter === 'declared' && config.api?.terminal) {
      const { declaredRenderer } = await import('./declared-adapter.mjs')
      invoke = declaredRenderer(api, config.api.terminal, 'terminal')
    } else throw Error('No declared terminal API')
  }
  return { invoke, afterCall, boundary, async close() { for (const cleanup of cleanups.reverse()) await cleanup() } }
}
