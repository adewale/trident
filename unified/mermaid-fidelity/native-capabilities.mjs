// Capabilities a candidate's public interface has natively that Trident does not yet bind.
//
// The runtime records Mermaid's database API, a spy on a database member and the jison
// `yy` callback protocol as the candidate's unsupported operation: a capability
// assessment (outcome-kinds.ts). The capability review
// (docs/evidence/fidelity-capability-review-2026-11-14.json) checked those assessments
// against the installed artifacts. Where the candidate's public interface does have the
// member, the assessment is withdrawn: a test that needs it is an adapter limitation
// (a Trident gap naming the native evidence) until a binding calls it.
//
// Entries are per reviewed version, with file:line evidence in the version's published
// source. Any candidate qualifies the same way; an entry only records what its source has.
//
// crabtalk/bezel: the bezel-mermaid crate's public API (src/lib.rs:20 `pub mod diagrams`)
// exposes most families' database types with the mutators their parsers call. Its bridge
// keeps a test's database and calls those methods (bridges/bezel/src/database.rs), so the
// members it binds are measured and are not listed here. What remains is public but not
// bound, each with its reason:
// - a member whose argument is a Mermaid value Bezel's parameter does not take as written
//   (a Text record where Bezel takes a string, Mermaid's Langium AST where Bezel takes its
//   own AST, an expression object where Bezel takes a node of its arena): calling it would
//   need Trident to translate the argument;
// - a parser's calls on its database, which a spy or a test's own `yy` database observes:
//   Bezel's parsers take a concrete database type (`pub fn parse_<family>(src, db: &mut
//   <Model>)`), so their calls happen inside the crate and cannot reach a JavaScript spy or
//   database (mindmap and kanban take `&mut dyn OutlineDb`, the one trait a relay could
//   implement; no test observes their calls).
// treeview addNode was listed here in error: TreeViewDb::add_node is in the private module
// treeview::model (src/diagrams/treeview/mod.rs:5 `mod model`; the module re-exports only
// NodeType, TreeNode and TreeViewModel), so it is not part of Bezel's public interface.
const BEZEL_0_2_26 = {
  source: 'bezel-mermaid 0.2.26 (crates.io, .cargo_vcs_info 79a1913)',
  database: {
    flowchart: {
      addVertex: "src/diagrams/flowchart/store.rs:87 pub fn add_vertex(id, Vertex { label, shape, styles, prop }); Mermaid's addVertex(id, textObj, type, style, classes, dir, props, metadata) would need Trident to build Bezel's Vertex",
    },
    agentflow: {
      addVertex: "src/diagrams/agentflow/db.rs:294 pub store: FlowStore; src/diagrams/flowchart/store.rs:87 pub fn add_vertex(id, Vertex { label, shape, styles, prop }), which Mermaid's addVertex arguments would need translating into",
    },
    gantt: {
      parseDuration: 'src/diagrams/gantt/db.rs:45 pub fn parse_duration, returning gantt::dates::Unit, which has no public name or serialization to report as Mermaid\'s unit string',
    },
    class: {
      addRelation: "src/diagrams/class/db.rs:124 pub fn add_relation(ClassRelation), a struct built from Mermaid's relation record only by translating it",
    },
    er: { addSubGraph: 'src/diagrams/er/db.rs:173 pub fn add_sub_graph(id_text: &str, list: &[DocItem], title_text: &str); Mermaid passes {text} records for the id and title' },
    xychart: { setXAxisBand: 'src/diagrams/xychart/db.rs:154 pub fn set_x_axis_band(categories: &[String]); Mermaid passes Text records' },
    cynefin: {
      setDomains: 'src/diagrams/cynefin/model.rs:84 pub fn set_domains(Vec<DomainBlockAst>), on CynefinDb rather than the parsed CynefinModel; Mermaid passes its Langium AST blocks',
      setTransitions: 'src/diagrams/cynefin/model.rs:101 pub fn set_transitions(Vec<TransitionAst>), on CynefinDb rather than the parsed CynefinModel; Mermaid passes its Langium AST transitions',
    },
    state: { setRootDoc: 'src/diagrams/state/db.rs:36 pub fn set_root_doc(doc: Vec<Stmt>), which takes parsed statements' },
    railroad: { addRule: "src/diagrams/railroad/db.rs:45 pub fn add_rule(RailroadRule { name, definition: NodeId }); Mermaid's rule carries an expression object, not a node of the database's arena" },
    sequence: { apply: 'src/diagrams/sequence/db.rs:427 pub fn apply(statements: impl Iterator<Item = SeqStatement>), which takes parsed statements' },
  },
  callback: {
    xychart: 'src/diagrams/xychart/parser.rs:11 pub fn parse_xy_chart(src, db: &mut XyChartModel), driving src/diagrams/xychart/db.rs set_* methods on that concrete type',
    quadrant: 'src/diagrams/quadrant/parser.rs:13 pub fn parse_quadrant(src, db: &mut QuadrantModel), driving src/diagrams/quadrant/db.rs set_* and add_* methods on that concrete type',
    flowchart: 'src/diagrams/flowchart/parser.rs:163 pub fn parse_flowchart(source, db: &mut FlowDb), driving src/diagrams/flowchart/store.rs set_* methods on that concrete type',
    class: 'src/diagrams/class/parser.rs:424 pub fn parse_class_diagram(src, db: &mut ClassModel), driving src/diagrams/class/db.rs set_* and add_* methods on that concrete type',
    gantt: 'src/diagrams/gantt/parser.rs:18 pub fn parse_gantt(src, db: &mut GanttDb), driving src/diagrams/gantt/db.rs set_* and add_* methods on that concrete type',
  },
}

/** project -> reviewed version -> what it implements natively but Trident does not bind. */
export const UNBOUND_NATIVE_CAPABILITIES = {
  'crabtalk/bezel': { '0.2.26': BEZEL_0_2_26 },
}

/** The Trident gap reason for a native capability that is not yet bound, or undefined.
 * `member` is a Mermaid database member, or undefined for the parser -> database callback
 * protocol (a test's own jison `yy`, or a spy on the database during a parse).
 * @param {string} project @param {string} version @param {string} family @param {string | undefined} member
 * @param {Record<string, Record<string, any>>} [registry] */
export function unboundNativeCapability(project, version, family, member, registry = UNBOUND_NATIVE_CAPABILITIES) {
  const entry = registry[project]?.[version]
  if (!entry) return undefined
  const evidence = member === undefined ? entry.callback?.[family] : entry.database?.[family]?.[member]
  if (!evidence) return undefined
  const what = member === undefined ? `a ${family} parser that drives a caller-supplied database` : `${family} database ${member}`
  return `${project} ${version} implements ${what} natively (${entry.source} ${evidence}); Trident does not bind it yet`
}
