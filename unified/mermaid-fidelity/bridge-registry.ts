// Concrete parser bridges. Each one calls the project's own parser; see bridges.ts.
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { nodeExecutable, registerBridge, type ParserBridge, type Resolver } from './bridges.ts'

const here = join(import.meta.dirname, 'bridges')
const script = (name: string) => join(here, name)

registerBridge('Latias94/merman', async peer => {
  // The measured Merman release is the 0.9.3 native CLI; its own `parse` command prints the model.
  const cli = peer.artifact?.additionalCli?.find((c: any) => c.outputs?.includes('svg'))?.artifact
  if (!cli?.executable) return undefined
  return { command: [nodeExecutable(), script('merman.mjs'), cli.executable], version: cli.version, description: 'merman-cli parse --meta' }
})

registerBridge('crafter-station/mermaid', async peer => {
  const parser = peer.artifact?.root && join(peer.artifact.root, 'node_modules/@crafter/mermaid-parser/dist/index.js')
  if (!parser || !existsSync(parser)) return undefined
  return { command: [nodeExecutable(), script('crafter.mjs'), parser], version: peer.artifact.version, description: "the renderer's own @crafter/mermaid-parser dependency: parse()" }
})

registerBridge('fasouto/termaid', async peer => {
  const python = peer.artifact?.python ?? peer.artifact?.executable
  if (!python) return undefined
  return { command: [python, '-I', script('termaid.py')], version: peer.artifact.version, description: 'termaid.parser.<family>.parse_<family>()' }
})

registerBridge('wevm/ondine', async peer => {
  const compiler = peer.artifact?.root && join(peer.artifact.root, 'dist/compiler/index.js')
  if (!compiler || !existsSync(compiler)) return undefined
  return { command: [nodeExecutable(), script('ondine.mjs'), compiler], version: peer.artifact.version, description: 'render() only: acceptance and rejection, no parsed model' }
})

// JavaScript projects whose public module has no synchronous parser per family the tests
// can import: bridges/javascript.mjs names each project's own parser per family.
const javascript = (key: string, location: (artifact: any) => string | undefined, runtime: () => string = nodeExecutable): Resolver => async peer => {
  const where = peer.artifact && location(peer.artifact)
  if (!where || !existsSync(where)) return undefined
  return { command: [runtime(), script('javascript.mjs'), key, where], version: peer.artifact.version, description: `${key}: the project's own per-family parsers` }
}
registerBridge('dfadler/zombie-mermaid', javascript('zombie', a => a.root))
registerBridge('KlangHaus/vitepress-plugin-diagram', javascript('vitepress', a => a.module))
registerBridge('sandyyst/dsh-plugin-mermaid-gb-svg', javascript('dsh', a => a.module))
registerBridge('tariqshams/mermaidtui', javascript('mermaidtui', a => a.module))
// OpenCode's merman package is TypeScript source run by Bun, as its prepared artifact is.
registerBridge('anomalyco/opencode', javascript('opencode', a => a.root, () => process.execPath))
registerBridge('lukilabs/beautiful-mermaid', javascript('beautiful', a => a.root, () => process.execPath))

/** Compiled or copied bridges keep their own build step in bridges/<name>/build.ts. */
const built = (name: string, description: string, version: (peer: any) => string | undefined = peer => peer.artifact?.version) => async (peer: any, outDir: string): Promise<ParserBridge | undefined> => {
  const file = join(here, name, 'build.ts')
  if (!existsSync(file)) return undefined
  const measured = version(peer)
  if (!measured) return undefined
  const { build } = await import(file)
  return { command: await build(peer, outDir), version: measured, description }
}

registerBridge('Yassimba/loom', built('loom', 'module-private per-family parsers, called from an unchanged copy of the source'))
registerBridge('Mootikins/figurehead-rs', built('figurehead', 'figurehead::parse and per-family core::Parser implementations'))
registerBridge('xai-org/grok-build', built('grok', 'private mermaid.rs parsers, compiled unchanged beside an export'))
registerBridge('1jehuang/mermaid-rs-renderer', built('mmdr', 'mermaid_rs_renderer parse_mermaid'))
registerBridge('crabtalk/bezel', built('bezel', 'bezel-mermaid mermaid::parse'))
registerBridge('AlexanderGrooff/mermaid-ascii', built('mermaid-ascii', 'pkg/graph, pkg/sequence and pkg/er Parse'))
registerBridge('spacedock-dev/mermaidtext', built('mermaidtext', 'unexported Go parsers, reached through an overlay-injected export'))
registerBridge('orestesgaolin/mermaid', built('dart', "mermaid_core 0.3.2 parseX functions, from its public library or its own src/ libraries where not re-exported"))
registerBridge('pub:mermaid_flutter', built('dart', "mermaid_core 0.3.2 parseX functions (mermaid_flutter uses core's parser unchanged)", () => '0.3.2'))
registerBridge('evangwt/xmermaid', built('xmermaid', 'parse_dsl, its WASM parser for every family, from an unchanged copy of the glue with one export appended'))
