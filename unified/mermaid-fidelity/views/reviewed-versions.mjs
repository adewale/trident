// The native versions each project's reviewed schema views have been checked against.
//
// A view reads a project's own model field by field, so it is tied to the model shape
// of the versions it was reviewed against. When a candidate's frozen version is not
// listed here, every one of its qualified callbacks is unassessed (a Trident gap, "view
// not reviewed for <project> <version>"), whatever the run observed: a renamed or
// re-encoded field would otherwise surface as a candidate failure or a pass.
//
// Add a version only after checking that the model fields the project's views read are
// unchanged in it (or after updating the views), and say what was checked. Projects
// with no entry have no reviewed view and are read by the generic field-name projection.
//
// An entry is either a note (any build of that version is reviewed) or
// { note, revisions: { <source revision>: note } }, for a project whose artifact records a
// source revision and can be rebuilt under the same version (a source distribution). A
// candidate whose artifact revision is not listed for such an entry is unreviewed.
//
// Versions of the 0.3.0 release (results/release/mermaid-fidelity.json) are the ones the
// views were written and audited against. Later versions record their review below.
export const REVIEWED_VIEW_VERSIONS = {
  'Dicklesworthstone/frankenmermaid': {
    '0.4.0': 'views written against the 0.4.0 IR',
    '0.5.0': {
      note: 'IR of 1,080 corpus sources (corpus/community-corpus.json) captured from 0.4.0 (pkg/ at d5ade10) and 0.5.0: 1,014 identical. New keys only in gantt (task end UntilTasks, edges, weekend_start, {Weekday} excludes) and xychart meta; the gantt view reads neither tasks[].end nor edges and reports an unknown excludes entry as a gap; no xychart view. One encoding the state view reads changed: a start/end inside a later concurrency region is its own node `__state_start__state_<c>___region_<n>`; the view now declares its Mermaid id absent instead of inventing one. Timeline node ids changed, but no view reads timeline. Gap reasons identical to the 0.3.0 run',
      revisions: {
        bf4fd10861bcc274a4558174c5228f1c3063bd2a: 'the build captured in the 0.5.0 review above',
        a5be33d9097af8b7c90fef7dd4a0c20a0bf55752: 'rebuild of the source distribution: every pkg/ file (frankenmermaid_bg.wasm, frankenmermaid.js, both .d.ts, package.json) has the same SHA-256 as at bf4fd108, and the IR of all 1,080 corpus sources is identical',
      },
    },
  },
  'Latias94/merman': {
    '0.9.3': 'views written against the 0.9.3 CLI parse --meta output',
    '0.10.0': 'not shape-diffed: neither the 0.9.3 release CLI nor a merman-cli 0.9.3 built from its crates.io source could be run in this review. Every gap reason and every per-file count matches the 0.3.0 run except passes replacing failures (flow-edges +16, classDiagram +6, flow-singlenode +3, packet +2), consistent with its Mermaid 12.1 to 12.3 parser update: no read produced a new gap or a new failure',
  },
  'crabtalk/bezel': {
    '0.2.24': 'views written against bezel-mermaid 0.2.24',
    '0.2.25': 'bezel-mermaid 0.2.25 crate source is byte-identical to 0.2.24 except the version in Cargo.toml and Cargo.lock; every per-file count and gap reason identical',
    '0.2.26': {
      note: 'bezel-mermaid 0.2.26 crate (.cargo_vcs_info 79a1913) differs from 0.2.25 only in the version and in three renderer files (c4/layout.rs, quadrant/render.rs, xychart/render.rs: loop rewrites over the same data); no parser or model file changed',
      revisions: { '79a1913fdc479ad5628f32c7f233675992347c21': 'the published crate reviewed above' },
    },
  },
  'dfadler/zombie-mermaid': {
    '5.14.4': 'views written against the 5.14 MermaidGraph, class, sequence and ER types',
    '5.16.0': 'shared/index.d.ts of @zombie-mermaid/core and mermaid-parser 5.14.4 and 5.16.0 compared, and 1,080 corpus sources captured from both: no field removed. Changes the views read: a left-of state note is joined note -> state (the state view no longer reads that edge as a transition), messages and notes record a written wrap (now translated), a dotted lollipop records dashed (still declared absent: conservative). 5.16.0 also exports gantt, gitgraph, journey, kanban, mindmap, packet, radar, requirement, sankey and timeline parsers with no reviewed binding: the bridge reports those families as Trident gaps',
    '5.17.0': 'shared/index.d.ts of @zombie-mermaid/core and mermaid-parser 5.16.0 and 5.17.0 compared: no field removed; a participant now records a written wrap:/nowrap: (and drops the prefix from its label), which the sequence view now translates; gantt gains config sizes and git graph gains positioned look fields, which no view reads. 1,080 corpus sources captured from both: 1,072 identical, the other 8 differ only in state note node ids, which no view reads (Mermaid note ids are declared absent)',
  },
  'anomalyco/opencode': {
    '2.2.5': 'views written against merman at 78e066c9 (opencode 2.2.5)',
    '2.3.0': 'packages/merman at source pin 83960f8a is identical to 78e066c9 except the package.json version; every per-file count and gap reason identical',
  },
  'wevm/ondine': { '0.0.3': '0.3.0 release' },
  'orestesgaolin/mermaid': { '0.3.2': '0.3.0 release (mermaid_core 0.3.2)' },
  'pub:mermaid_flutter': { '0.3.2': '0.3.0 release (calls mermaid_core 0.3.2 unchanged)' },
  'adewale/agentic-mermaid': { '0.5.6': '0.3.0 release' },
  '1jehuang/mermaid-rs-renderer': { '0.3.1': '0.3.0 release' },
  'AlexanderGrooff/mermaid-ascii': { '1.6.1': '0.3.0 release' },
  'crafter-station/mermaid': { '0.0.3': '0.3.0 release' },
  'emtyty/merslim': { '0.2.3': '0.3.0 release' },
  'evangwt/xmermaid': { '0.4.2': '0.3.0 release' },
  'fasouto/termaid': { '0.12.0': '0.3.0 release' },
  'kitlangton/merman': { '0.2.1': '0.3.0 release' },
  'KlangHaus/vitepress-plugin-diagram': { '0.3.2': '0.3.0 release' },
  'lukilabs/beautiful-mermaid': { '1.1.3': '0.3.0 release' },
  'Mootikins/figurehead-rs': { 'v0.4.3': '0.3.0 release' },
  'obsidianmd/pele': { '1.13.0': '0.3.0 release' },
  'sandyyst/dsh-plugin-mermaid-gb-svg': { '0.1.5': '0.3.0 release' },
  'xai-org/grok-build': { 'git-2bdd1d6a6369': '0.3.0 release' },
  'Yassimba/loom': { '0.10.0': '0.3.0 release' },
  'kais-radwan/ascii-mermaid': { '0.1.0': '0.3.0 release' },
  'spacedock-dev/mermaidtext': { 'git-a6b0c7657b94': '0.3.0 release' },
}

/** The gap reason when a project's views have not been reviewed for its version (and,
 * where the entry names revisions, for its artifact's source revision), else undefined.
 * @param {string} project
 * @param {string} version
 * @param {string | undefined} [revision]
 * @param {Record<string, Record<string, string | { note: string, revisions?: Record<string, string> }>>} [registry]
 * @returns {string | undefined} */
export function unreviewedViewGap(project, version, revision, registry = REVIEWED_VIEW_VERSIONS) {
  const reviewed = registry[project]
  if (!reviewed) return undefined
  if (!Object.hasOwn(reviewed, String(version))) return `view not reviewed for ${project} ${version}`
  const entry = reviewed[String(version)]
  if (typeof entry === 'string' || !entry.revisions || Object.hasOwn(entry.revisions, String(revision))) return undefined
  return `view not reviewed for ${project} ${version} at revision ${revision ?? '(none recorded)'}`
}
