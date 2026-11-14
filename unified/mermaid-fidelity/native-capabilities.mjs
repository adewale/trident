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
// crabtalk/bezel: the bezel-mermaid crate's public API (src/lib.rs:20 `pub mod diagrams`;
// every family module declares `pub mod db` and `pub mod parser`) exposes each family's
// database type with the mutators its parser calls, and a parser that takes a database
// argument (`pub fn parse_<family>(src, db: &mut <Model>)`). The bridge calls only
// `mermaid::parse`, which returns the finished model, so neither is bound yet. A Rust
// database is a concrete type (mindmap and kanban take `&mut dyn OutlineDb`), so a test's
// own JavaScript database would need a binding that relays each call.
const BEZEL_0_2_26 = {
  source: 'bezel-mermaid 0.2.26 (crates.io, .cargo_vcs_info 79a1913)',
  database: {
    flowchart: {
      addVertex: 'src/diagrams/flowchart/store.rs:87 pub fn add_vertex',
      setLink: 'src/diagrams/flowchart/store.rs:392 pub fn set_link',
      setClickEvent: 'src/diagrams/flowchart/store.rs:405 pub fn set_click_event',
      addClass: 'src/diagrams/flowchart/store.rs:354 pub fn add_class',
      updateLinkInterpolate: 'src/diagrams/flowchart/store.rs:310 pub fn update_link_interpolate',
      updateLink: 'src/diagrams/flowchart/store.rs:328 pub fn update_link',
    },
    agentflow: {
      emitWarning: 'src/diagrams/agentflow/db.rs:781 pub fn emit_warning',
      addVertex: 'src/diagrams/agentflow/db.rs:294 pub store: FlowStore; src/diagrams/flowchart/store.rs:87 pub fn add_vertex',
      updateLink: 'src/diagrams/agentflow/db.rs:294 pub store: FlowStore; src/diagrams/flowchart/store.rs:328 pub fn update_link',
      updateLinkInterpolate: 'src/diagrams/agentflow/db.rs:294 pub store: FlowStore; src/diagrams/flowchart/store.rs:310 pub fn update_link_interpolate',
    },
    gantt: {
      setDateFormat: 'src/diagrams/gantt/db.rs:237 pub fn set_date_format',
      parseDuration: 'src/diagrams/gantt/db.rs:45 pub fn parse_duration',
      setExcludes: 'src/diagrams/gantt/db.rs:267 pub fn set_excludes',
      setIncludes: 'src/diagrams/gantt/db.rs:263 pub fn set_includes',
      setTodayMarker: 'src/diagrams/gantt/db.rs:259 pub fn set_today_marker',
      setClickEvent: 'src/diagrams/gantt/db.rs:374 pub fn set_click_event',
      setAccTitle: 'src/diagrams/gantt/db.rs:95 pub titles: Titles; src/diagrams/common/db.rs:41 pub fn set_acc_title',
    },
    class: {
      setClickEvent: 'src/diagrams/class/db.rs:260 pub fn set_click_event',
      setLink: 'src/diagrams/class/db.rs:245 pub fn set_link',
      addClass: 'src/diagrams/class/db.rs:77 pub fn add_class',
      addNamespace: 'src/diagrams/class/db.rs:269 pub fn add_namespace',
      addRelation: 'src/diagrams/class/db.rs:124 pub fn add_relation',
    },
    er: { addSubGraph: 'src/diagrams/er/db.rs:173 pub fn add_sub_graph' },
    journey: {
      addSection: 'src/diagrams/journey/db.rs:51 pub fn add_section',
      setAccTitle: 'src/diagrams/journey/db.rs:28 pub titles: Titles; src/diagrams/common/db.rs:41 pub fn set_acc_title',
    },
    treeview: {
      addNode: 'src/diagrams/treeview/model.rs:87 pub fn add_node',
      setAccTitle: 'src/diagrams/treeview/model.rs:47 pub titles: Titles; src/diagrams/common/db.rs:41 pub fn set_acc_title',
      setAccDescription: 'src/diagrams/treeview/model.rs:47 pub titles: Titles; src/diagrams/common/db.rs:45 pub fn set_acc_descr',
      setDiagramTitle: 'src/diagrams/treeview/model.rs:47 pub titles: Titles; src/diagrams/common/db.rs:37 pub fn set_title',
    },
    mindmap: { addNode: 'src/diagrams/common/outline.rs:113 pub trait OutlineDb { fn add_node }, which the mindmap database implements' },
    xychart: { setXAxisBand: 'src/diagrams/xychart/db.rs:154 pub fn set_x_axis_band' },
    quadrant: { parseStyles: 'src/diagrams/quadrant/db.rs:116 pub fn parse (PointStyle::parse over the written styles)' },
    cynefin: {
      setDomains: 'src/diagrams/cynefin/model.rs:84 pub fn set_domains',
      setTransitions: 'src/diagrams/cynefin/model.rs:101 pub fn set_transitions',
    },
    requirement: {
      addRequirement: 'src/diagrams/requirement/db.rs:87 pub fn add_requirement',
      addElement: 'src/diagrams/requirement/db.rs:123 pub fn add_element',
      addRelationship: 'src/diagrams/requirement/db.rs:146 pub fn add_relationship',
      defineClass: 'src/diagrams/requirement/db.rs:205 pub fn define_class',
    },
    state: {
      addState: 'src/diagrams/state/db.rs:166 pub fn add_state',
      setRootDoc: 'src/diagrams/state/db.rs:36 pub fn set_root_doc',
      addStyleClass: 'src/diagrams/state/db.rs:267 pub fn add_style_class',
    },
    architecture: {
      addService: 'src/diagrams/architecture/db.rs:161 pub fn add_service',
      addJunction: 'src/diagrams/architecture/db.rs:172 pub fn add_junction',
      addGroup: 'src/diagrams/architecture/db.rs:188 pub fn add_group',
      addLayoutHint: 'src/diagrams/architecture/db.rs:234 pub fn add_layout_hint',
    },
    railroad: {
      addRule: 'src/diagrams/railroad/db.rs:45 pub fn add_rule',
      setTitle: 'src/diagrams/railroad/db.rs:21 pub titles: Titles; src/diagrams/common/db.rs:37 pub fn set_title',
      setDiagramTitle: 'src/diagrams/railroad/db.rs:21 pub titles: Titles; src/diagrams/common/db.rs:37 pub fn set_title',
      setAccTitle: 'src/diagrams/railroad/db.rs:21 pub titles: Titles; src/diagrams/common/db.rs:41 pub fn set_acc_title',
      setAccDescription: 'src/diagrams/railroad/db.rs:21 pub titles: Titles; src/diagrams/common/db.rs:45 pub fn set_acc_descr',
    },
    sequence: { apply: 'src/diagrams/sequence/db.rs:427 pub fn apply' },
  },
  callback: {
    xychart: 'src/diagrams/xychart/parser.rs:11 pub fn parse_xy_chart(src, db: &mut XyChartModel), driving src/diagrams/xychart/db.rs set_* methods',
    quadrant: 'src/diagrams/quadrant/parser.rs:13 pub fn parse_quadrant(src, db: &mut QuadrantModel), driving src/diagrams/quadrant/db.rs set_* and add_* methods',
  },
}

/** project -> reviewed version -> what it implements natively but Trident does not bind. */
export const UNBOUND_NATIVE_CAPABILITIES = {
  'crabtalk/bezel': { '0.2.26': BEZEL_0_2_26 },
}

/** The Trident gap reason for a native capability that is not yet bound, or undefined.
 * `member` is a Mermaid database member, or undefined for the parser -> database callback
 * protocol (a test's own jison `yy`).
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
