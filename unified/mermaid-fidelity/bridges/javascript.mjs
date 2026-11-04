// Parser bridges for JavaScript/TypeScript projects whose public module exposes no
// synchronous parser per family that the original tests can import directly. Each
// entry names the project's own parser function for each family it parses, as its own
// detector, type list or package declares; every other family is unsupported. The
// bridge parses nothing itself and passes the native model through unchanged.
//
// argv: <project key> <project root or module path>
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { serve } from './common.mjs'

const load = path => import(pathToFileURL(path).href)

const PROJECTS = {
  // dfadler/zombie-mermaid 5.14.1: @zombie-mermaid/core DIAGRAM_TYPES lists flowchart,
  // sequence, class, er, xychart, architecture, c4, pie, quadrant. Its renderer splits the
  // source with core's splitStatements before the statement-based parsers, and renders
  // stateDiagram sources through parseMermaid (core's detector reports them as flowchart).
  zombie: async root => {
    const scope = join(dirname(root), '@zombie-mermaid')
    const core = await load(join(scope, 'core/dist/index.js')), p = await load(join(scope, 'mermaid-parser/dist/index.js'))
    const split = parse => source => parse(core.splitStatements(source))
    return {
      name: 'zombie-mermaid',
      families: {
        flowchart: p.parseMermaid, state: p.parseMermaid, sequence: split(p.parseSequenceDiagram), class: split(p.parseClassDiagram), er: split(p.parseErDiagram),
        c4: split(p.parseC4Diagram), xychart: split(p.parseXYChart), architecture: split(p.parseArchitecture), pie: p.parsePieChart, quadrant: p.parseQuadrantChart,
      },
    }
  },
  // lukilabs/beautiful-mermaid 1.1.3: its renderer's detectDiagramType recognizes xychart,
  // sequence, class and er headers and renders every other source through parseMermaid
  // (flowchart and stateDiagram). The statement parsers take the lines its renderer
  // builds: split, trimmed, without blank or %% comment lines. Run by Bun: these are
  // the package's TypeScript sources.
  beautiful: async root => {
    const src = join(root, 'src'), lines = text => text.split('\n').map(line => line.trim()).filter(line => line.length > 0 && !line.startsWith('%%'))
    const flow = await load(join(src, 'parser.ts')), seq = await load(join(src, 'sequence/parser.ts')), cls = await load(join(src, 'class/parser.ts')), er = await load(join(src, 'er/parser.ts')), xy = await load(join(src, 'xychart/parser.ts'))
    return {
      name: 'beautiful-mermaid',
      families: { flowchart: flow.parseMermaid, state: flow.parseMermaid, sequence: text => seq.parseSequenceDiagram(lines(text)), class: text => cls.parseClassDiagram(lines(text)), er: text => er.parseErDiagram(lines(text)), xychart: text => xy.parseXYChart(lines(text)) },
    }
  },
  // KlangHaus/vitepress-plugin-diagram 0.3.2: detectDiagramType accepts only flowchart,
  // sequence and classDiagram headers.
  vitepress: async module => {
    const m = await load(module)
    return { name: 'vitepress-plugin-mermaid-diagram', families: { flowchart: m.parseFlowchart, sequence: m.parseSequence, class: m.parseClassDiagram } }
  },
  // sandyyst/dsh-plugin-mermaid-gb-svg 0.1.5: a Mermaid flowchart to GB/T 1526 converter.
  dsh: async module => ({ name: 'dsh-plugin-mermaid-gb-svg', families: { flowchart: (await load(module)).parseMermaid } }),
  // tariqshams/mermaidtui 0.0.6: parseMermaid accepts `flowchart <direction>` only.
  mermaidtui: async module => ({ name: 'mermaidtui', families: { flowchart: (await load(module)).parseMermaid } }),
  // anomalyco/opencode packages/merman: detectMermaidDiagram names six families, each
  // with its own src/<family>/parser.ts.
  opencode: async root => {
    const files = { flowchart: ['flowchart', 'parseMermaidFlowchartDiagram'], gantt: ['gantt', 'parseMermaidGanttDiagram'], gitgraph: ['gitgraph', 'parseMermaidGitGraphDiagram'], sequence: ['sequence', 'parseMermaidSequenceDiagram'], state: ['state', 'parseMermaidStateDiagram'], timeline: ['timeline', 'parseMermaidTimelineDiagram'] }
    const families = {}
    for (const [family, [dir, fn]] of Object.entries(files)) {
      const path = join(root, 'src', dir, 'parser.ts')
      if (!existsSync(path)) throw Error('OpenCode merman has no ' + path)
      families[family] = source => loaded[family](source)
      lazy[family] = async () => (loaded[family] = (await load(path))[fn])
    }
    return { name: 'opencode merman', families }
  },
}
const loaded = {}, lazy = {}

const [key, location] = process.argv.slice(2)
let project
await serve(async (family, _source) => {
  if (!project)
    try {
      project = await PROJECTS[key](location)
    } catch (error) {
      return { adapterGap: `${key} parser import failed: ` + String(error) }
    }
  const parse = project.families[family]
  if (!parse) return { unsupported: `${project.name} has no ${family} parser (it parses ${Object.keys(project.families).join(', ')})` }
  if (typeof parse !== 'function') return { adapterGap: `${project.name} no longer exports its ${family} parser` }
  try {
    if (lazy[family] && !loaded[family]) await lazy[family]()
    const value = parse(_source)
    if (value && typeof value.then === 'function') return { adapterGap: `${project.name}'s ${family} parser is asynchronous` }
    return { value }
  } catch (error) {
    // A deliberate throw from the project's own parser is its syntax rejection; a
    // runtime fault inside it (TypeError and the like) is not a classified refusal.
    if (error instanceof TypeError || error instanceof ReferenceError || error instanceof RangeError) return { adapterGap: `${project.name} ${family} parser fault: ${String(error).slice(0, 300)}` }
    return { error: { name: !error?.name || error.name === 'Error' ? 'ParseError' : String(error.name), message: String(error?.message ?? error) } }
  }
})
