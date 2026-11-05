// Reviewed git graph views: Mermaid's gitGraph database getters and the Langium GitGraph
// AST, read from each project's own parser model; and, for the same non-port projects, the
// Radar, Treemap, Architecture and Railroad Langium ASTs (bottom of this file). See
// views/index.mjs for the module contract and schema-views.mjs for the doctrine; helpers
// are used only inside functions.
//
// Mermaid's database (gitGraphAst.ts at the pinned tag) keeps commits in a Map keyed by
// id, each { id, message, seq, type, tags, parents, branch } with customType and customId
// on merge commits; branches in a Map from name to head commit id (null before the
// branch's first commit); the checked-out branch and its head commit. getCommitsArray()
// sorts by seq; getBranchesAsObjArray() sorts the branches, in creation order, by their
// order, which the Langium parser sets to 0 when none is written (gitGraphParser.ts).
//
// A branch's head is not a separate fact: Mermaid moves it only when a commit, merge or
// cherry-pick is made on that branch, so where a model carries each commit's branch and
// sequence, the head is the newest commit on the branch, and before its first commit, the
// commit it was cut from. Only a model that carries that fork point (or has no commits at
// all) answers for a branch without commits.
import { astNode, directionOf, record } from '../schema-views.mjs'

/** A field this model does not carry for this record; reading it is unsupported. */
class Absent {
  constructor(reason) {
    this.reason = reason
  }
}
const no = reason => new Absent(reason)

// Mermaid's commitType codes (gitGraphTypes.ts), by native spelling folded to upper case.
const COMMIT_TYPE = { NORMAL: 0, REVERSE: 1, HIGHLIGHT: 2, MERGE: 3, CHERRYPICK: 4 }
const commitType = value => (typeof value === 'string' ? COMMIT_TYPE[value.toUpperCase().replace(/[_\s-]/g, '')] : undefined)
const COMMIT_FIELDS = ['id', 'message', 'seq', 'type', 'tags', 'parents', 'branch']
const MERGE_FIELDS = [...COMMIT_FIELDS, 'customType', 'customId']

/** A Mermaid commit record; `merge` adds the merge-only fields Mermaid sets. */
function commitRecord(fields, merge, hooks) {
  const present = {}, absent = {}
  for (const [key, value] of Object.entries(fields)) {
    if (value instanceof Absent) absent[key] = value.reason
    else present[key] = value
  }
  return record(present, 'commit', merge ? MERGE_FIELDS : COMMIT_FIELDS, absent, hooks)
}

/** Mermaid's branch -> head Map, where a head the model does not carry is unsupported. */
class BranchHeads extends Map {
  constructor(entries, hooks) {
    super(entries)
    this.hooks = hooks
  }
  read(value) {
    return value instanceof Absent ? this.hooks.unsupported(value.reason) : value
  }
  get(key) {
    return this.read(super.get(key))
  }
  *values() {
    for (const value of super.values()) yield this.read(value)
  }
  *entries() {
    for (const [key, value] of super.entries()) yield [key, this.read(value)]
  }
  [Symbol.iterator]() {
    return this.entries()
  }
  forEach(callback, thisArg) {
    for (const [key, value] of this.entries()) callback.call(thisArg, value, key, this)
  }
}

/** Mermaid's getBranchesAsObjArray over branches in creation order with Mermaid's order. */
const byMermaidOrder = branches => branches.map((branch, index) => ({ ...branch, index })).sort((a, b) => a.order - b.order || a.index - b.index).map(({ name }) => ({ name }))

/** The newest commit made on a branch, by sequence. */
function newestOn(commits, branch) {
  let newest
  for (const commit of commits) if (commit.branch === branch && (newest === undefined || commit.seq > newest.seq)) newest = commit
  return newest
}

/**
 * The gitGraph database getters from one model. Each entry is a value, a function
 * returning one, or an Absent reason:
 *   commits(): [{ fields, merge }] in the model's order
 *   branches(): [[name, head id | null | Absent]] | Absent
 *   branchOrder(): [{ name }] | Absent, and direction, currentBranch, head, accTitle, accDescr
 */
function gitView(model, hooks) {
  const value = (entry, read) => () => (entry instanceof Absent ? hooks.unsupported(entry.reason) : read(entry))
  const commits = model.commits instanceof Absent ? model.commits : () => model.commits().map(({ fields, merge }) => commitRecord(fields, merge, hooks))
  const view = {
    getCommits: value(commits, list => new Map(list().map(commit => [commit.id, commit]))),
    getCommitsArray: value(commits, list => list().sort((a, b) => a.seq - b.seq)),
    getBranches: value(model.branches, branches => new BranchHeads(branches(), hooks)),
    getBranchesAsObjArray: value(model.branchOrder, order => order()),
    getCurrentBranch: value(model.currentBranch, current => current),
    getDirection: value(model.direction, direction => direction),
  }
  if (model.head !== undefined) view.getHead = value(model.head, head => head)
  if (model.accTitle !== undefined) view.getAccTitle = value(model.accTitle, title => title)
  if (model.accDescr !== undefined) view.getAccDescription = value(model.accDescr, description => description)
  return view
}

// termaid 0.10.0 model/gitgraph.py: Commit { id, branch, type, tag, parents, seq } with one
// tag ("" when none), Branch { name, order (-1 when none written), start_commit ("" before
// any commit) }, direction. Its parser records a merge and a cherry-pick alike: a commit
// with two parents whose type is the merge's NORMAL/REVERSE/HIGHLIGHT override (or
// NORMAL), so neither Mermaid's MERGE nor CHERRY_PICK type can be read from it. It keeps
// no commit message, checked-out branch or accessibility text (accTitle is an
// "Unrecognized line" warning).
function termaid(raw, hooks) {
  const twoParents = "termaid records a merge and a cherry-pick alike, as a commit with two parents and no merge or cherry-pick type"
  const commits = raw.commits
  return gitView({
    commits: () =>
      commits.map(commit => {
        const two = commit.parents.length === 2
        return {
          merge: false,
          fields: {
            id: commit.id,
            message: no("termaid's commit model keeps no message"),
            seq: commit.seq,
            type: two ? no(twoParents) : commitType(commit.type),
            tags: commit.tag === '' ? [] : [commit.tag],
            parents: commit.parents,
            branch: commit.branch,
            ...(two ? { customType: no(twoParents), customId: no(twoParents) } : {}),
          },
        }
      }),
    branches: () => raw.branches.map(branch => [branch.name, newestOn(commits, branch.name)?.id ?? (branch.start_commit === '' ? null : branch.start_commit)]),
    // termaid's order -1 is an order not written, which Mermaid's parser stores as 0.
    branchOrder: () => byMermaidOrder(raw.branches.map(branch => ({ name: branch.name, order: branch.order === -1 ? 0 : branch.order }))),
    currentBranch: no("termaid's git graph model keeps no checked-out branch"),
    head: no("termaid's git graph model keeps no checked-out head commit"),
    direction: raw.direction,
    accTitle: no("termaid's git graph parser reads no accessibility title"),
    accDescr: no("termaid's git graph parser reads no accessibility description"),
  }, hooks)
}

// Loom (pi-loom-mermaid 0.10.0 diagrams/gitgraph.ts): branches by lane, commits in source
// order { lane, id, tag (the last tag: written), mergeFrom (the merged lane) }, and each
// lane's fork point as a commit index. A commit's parents are its lane's previous commit
// (or the lane's fork point) and, for a merge, the merged lane's newest commit then; a
// merge written without id: has id ''. A cherry-pick is a plain commit on the lane with
// no link to the picked commit. Loom keeps no commit type, message, branch order,
// direction, checked-out branch or accessibility text.
function loom(raw, hooks) {
  const { branches, commits, forkAt } = raw
  // The commit index a lane's next commit would follow at position `at`, if any.
  const before = (lane, at) => {
    for (let index = at - 1; index >= 0; index--) if (commits[index].lane === lane) return index
    return forkAt[lane] ?? undefined
  }
  const idAt = index => (index === undefined ? [] : [commits[index].id])
  return gitView({
    commits: () =>
      commits.map((commit, index) => {
        const merge = commit.mergeFrom !== null && commit.mergeFrom !== undefined
        return {
          merge,
          fields: {
            id: commit.id,
            message: no("Loom's commit model keeps no message"),
            seq: index,
            type: merge ? 3 : no("Loom keeps no commit type (NORMAL, REVERSE, HIGHLIGHT)"),
            tags: commit.tag === null || commit.tag === undefined ? [] : [commit.tag],
            parents: [...idAt(before(commit.lane, index)), ...(merge ? idAt(before(commit.mergeFrom, index)) : [])],
            branch: branches[commit.lane],
            ...(merge ? { customType: no("Loom keeps no merge commit type"), customId: commit.id !== '' } : {}),
          },
        }
      }),
    branches: () => branches.map((name, lane) => [name, idAt(before(lane, commits.length))[0] ?? null]),
    branchOrder: no("Loom keeps no branch order"),
    currentBranch: no("Loom's git graph model keeps no checked-out branch"),
    head: no("Loom's git graph model keeps no checked-out head commit"),
    direction: no("Loom's git graph model keeps no direction"),
    accTitle: no("Loom's git graph parser reads no accessibility title"),
    accDescr: no("Loom's git graph parser reads no accessibility description"),
  }, hooks)
}

// OpenCode merman src/gitgraph (types.ts, parser.ts): commits { id, message?, tags, type
// NORMAL|REVERSE|HIGHLIGHT, branch, parents } in source order, where only a merge has two
// parents and its type is the written override or NORMAL; branches { name, order?, head? }
// listed main first, then those without order: in creation order, then the ordered ones by
// order. It parses no cherry-pick and keeps no merge message (Mermaid composes one), no
// record of whether a merge id was written, no checked-out branch and no accessibility
// text (it skips those lines).
function opencode(raw, hooks) {
  const rest = raw.branches.slice(1)
  return gitView({
    commits: () =>
      raw.commits.map((commit, index) => {
        const merge = commit.parents.length === 2
        return {
          merge,
          fields: {
            id: commit.id,
            message: merge ? no("OpenCode's merge records carry no message (Mermaid composes one)") : (commit.message ?? ''),
            seq: index,
            type: merge ? 3 : commitType(commit.type),
            tags: commit.tags,
            parents: commit.parents,
            branch: commit.branch,
            ...(merge ? { customType: commit.type === 'NORMAL' ? no('OpenCode stores a merge without type: as NORMAL') : commitType(commit.type), customId: no("OpenCode does not record whether a merge's id was written") } : {}),
          },
        }
      }),
    branches: () => raw.branches.map(branch => [branch.name, branch.head ?? null]),
    // Mermaid sorts creation order by order (0 when none written): that is OpenCode's own
    // list, unless an explicit order 0 interleaves with branches written without one.
    branchOrder: rest.some(branch => branch.order === 0) ? no('OpenCode lists a branch with order: 0 after every branch without an order, so their creation order is not kept') : () => raw.branches.map(branch => ({ name: branch.name })),
    currentBranch: no("OpenCode's git graph model keeps no checked-out branch"),
    head: no("OpenCode's git graph model keeps no checked-out head commit"),
    direction: raw.direction,
    accTitle: no("OpenCode's git graph parser skips accessibility titles"),
    accDescr: no("OpenCode's git graph parser skips accessibility descriptions"),
  }, hooks)
}

// mermaid-rs-renderer 0.3.1 ir.rs GitGraphData: commits { id, message (None when none
// written; a merge's is composed by the parser), seq, commit_type Normal|Reverse|
// Highlight|Merge, custom_type, tags, parents, branch, custom_id }, branches { name, order
// (None when none written), insertion_index } and the graph direction. It parses no
// cherry-pick, keeps no fork point for a branch without commits, no checked-out branch and
// no accessibility text (preprocessing skips accTitle/accDescr).
function mmdr(raw, hooks) {
  const graph = raw.gitgraph
  const commits = graph.commits
  return gitView({
    commits: () =>
      commits.map(commit => {
        const merge = commit.commit_type === 'Merge'
        return {
          merge,
          fields: {
            id: commit.id,
            message: commit.message ?? '',
            seq: commit.seq,
            type: commitType(commit.commit_type),
            tags: commit.tags,
            parents: commit.parents,
            branch: commit.branch,
            ...(merge ? { customType: commit.custom_type === null || commit.custom_type === undefined ? undefined : commitType(commit.custom_type), customId: commit.custom_id } : {}),
          },
        }
      }),
    branches: () =>
      graph.branches.map(branch => {
        const newest = newestOn(commits, branch.name)
        if (newest) return [branch.name, newest.id]
        // The main branch moves only by its own commits; with no commits at all every head is null.
        if (!commits.length || branch.name === graph.main_branch) return [branch.name, null]
        return [branch.name, no('mermaid-rs-renderer keeps no fork point for a branch without commits')]
      }),
    branchOrder: () => byMermaidOrder([...graph.branches].sort((a, b) => a.insertion_index - b.insertion_index).map(branch => ({ name: branch.name, order: branch.order ?? 0 }))),
    currentBranch: no("mermaid-rs-renderer's git graph model keeps no checked-out branch"),
    head: no("mermaid-rs-renderer's git graph model keeps no checked-out head commit"),
    direction: directionOf(raw.direction),
    accTitle: no('mermaid-rs-renderer skips accessibility titles'),
    accDescr: no('mermaid-rs-renderer skips accessibility descriptions'),
  }, hooks)
}

// mermaid_core 0.3.2 lib/src/diagrams/git/git_graph.dart (Mermaid Dart and Flutter):
// GitCommit { id, seq, branch, parents, type normal|reverse|highlight, tags, customId,
// isMerge, isCherryPick }, where a merge's type is its written override (normal when none);
// branchOrder is mermaid_core's own sorting of the branches by order:; GitDirection. Its
// attribute pattern reads id, type and tag only, so no commit message; a cherry-pick keeps
// the picked id as its first tag and the current head as its only parent. It keeps no
// fork point for a branch without commits, no checked-out branch and no accessibility text.
const DART_DIRECTION = { leftRight: 'LR', rightLeft: 'RL', topBottom: 'TB', bottomTop: 'BT' }
function dart(raw, hooks) {
  const commits = raw.commits
  return gitView({
    commits: () =>
      commits.map(commit => ({
        merge: commit.isMerge,
        fields: {
          id: commit.id,
          message: no("mermaid_core's git graph parser reads no commit message"),
          seq: commit.seq,
          type: commit.isMerge ? 3 : commit.isCherryPick ? 4 : commitType(commit.type),
          tags: commit.tags,
          parents: commit.parents,
          branch: commit.branch,
          ...(commit.isMerge ? { customType: commit.type === 'normal' ? no('mermaid_core stores a merge without type: as normal') : commitType(commit.type), customId: commit.customId } : {}),
        },
      })),
    branches: () =>
      raw.branchOrder.map(name => {
        const newest = newestOn(commits, name)
        if (newest) return [name, newest.id]
        if (!commits.length) return [name, null]
        return [name, no('mermaid_core keeps no fork point for a branch without commits')]
      }),
    branchOrder: () => raw.branchOrder.map(name => ({ name })),
    currentBranch: no("mermaid_core's git graph model keeps no checked-out branch"),
    head: no("mermaid_core's git graph model keeps no checked-out head commit"),
    direction: DART_DIRECTION[raw.direction] ?? raw.direction,
    accTitle: no("mermaid_core's git graph model keeps no accessibility title"),
    accDescr: no("mermaid_core's git graph model keeps no accessibility description"),
  }, hooks)
}

// XMermaid 0.4.2 parse_dsl gitgraph (captured parser output; its WASM ships no source):
// commits only, in source order, { id, branch, tag (one), commit_type (null when none
// written), parents, display_label }. Merges and cherry-picks both have two parents and
// no type of their own; its parser rejects msg:. It keeps no branch list, direction,
// checked-out branch or accessibility text.
function xmermaid(raw, hooks) {
  const twoParents = 'XMermaid records a merge and a cherry-pick alike, as a commit with two parents and no merge or cherry-pick type'
  const noBranches = "XMermaid's git graph model lists commits only; it keeps no branch list"
  return gitView({
    commits: () =>
      raw.commits.map((commit, index) => {
        const two = commit.parents.length === 2
        return {
          merge: false,
          fields: {
            id: commit.id,
            message: no("XMermaid's git graph parser accepts no commit message"),
            seq: index,
            // An unwritten type is Mermaid's NORMAL.
            type: two ? no(twoParents) : commitType(commit.commit_type ?? 'NORMAL'),
            tags: commit.tag === null || commit.tag === undefined ? [] : [commit.tag],
            parents: commit.parents,
            branch: commit.branch,
            ...(two ? { customType: no(twoParents), customId: no(twoParents) } : {}),
          },
        }
      }),
    branches: no(noBranches),
    branchOrder: no(noBranches),
    currentBranch: no("XMermaid's git graph model keeps no checked-out branch"),
    head: no("XMermaid's git graph model keeps no checked-out head commit"),
    direction: no("XMermaid's git graph model keeps no direction"),
    accTitle: no("XMermaid's git graph model keeps no accessibility title"),
    accDescr: no("XMermaid's git graph model keeps no accessibility description"),
  }, hooks)
}

// figurehead plugins/gitgraph (database.rs, syntax_parser.rs): the parser's commit and
// branch syntax nodes, with their metadata dropped, become untyped nodes of one HashMap
// (a branch is a node with id "branch_<name>") and parent edges; only the direction
// survives as its own field. No commit list, order, branch, type, tag or message remains.
function figurehead(raw, hooks) {
  const graph = "figurehead's git graph model is an unordered node and edge graph: commit and branch nodes are not told apart and carry no branch, type, tags or message"
  return gitView({
    commits: no(graph),
    branches: no(graph),
    branchOrder: no(graph),
    currentBranch: no(graph),
    head: no(graph),
    direction: directionOf(raw.direction),
    accTitle: no("figurehead's git graph model keeps no accessibility title"),
    accDescr: no("figurehead's git graph model keeps no accessibility description"),
  }, hooks)
}

// merslim 0.2.3 parseGitGraph: { title, ops } -- the statements as written, never
// replayed into commits (no generated ids, sequence, parents or branch heads); see the
// GitGraph AST view below. Its header line is skipped, so no direction.
function merslim(_raw, hooks) {
  const ops = 'merslim keeps a git graph as its list of statements and builds no commit graph (generated ids, sequence, parents, branch heads) from them'
  return gitView({
    commits: no(ops),
    branches: no(ops),
    branchOrder: no(ops),
    currentBranch: no(ops),
    head: no(ops),
    direction: no("merslim's git graph parser reads no direction"),
    accTitle: no("merslim's git graph parser reads no accessibility title"),
    accDescr: no("merslim's git graph parser reads no accessibility description"),
  }, hooks)
}

// ---------------------------------------------------------------------------------------
// Langium GitGraph AST (packages/parser/src/language/gitGraph/gitGraph.langium): statements
// Commit { id?, message?, tags[], type? }, Branch { name, order? }, Merge { branch, id?,
// tags[], type? }, Checkout { branch }, CherryPicking { id?, tags[], parent? }, plus title,
// accTitle and accDescr. A `+=` list is [] when nothing was written; an unwritten optional
// is undefined.
const AST_FIELDS = {
  GitGraph: ['statements', 'title', 'accTitle', 'accDescr'],
  Commit: ['id', 'message', 'tags', 'type'],
  Branch: ['name', 'order'],
  Merge: ['branch', 'id', 'tags', 'type'],
  Checkout: ['branch'],
  CherryPicking: ['id', 'tags', 'parent'],
  // radar.langium, treemap.langium and architecture.langium at the pinned tag.
  Radar: ['title', 'accTitle', 'accDescr', 'axes', 'curves', 'options'],
  Axis: ['name', 'label'],
  Curve: ['name', 'label', 'entries'],
  Treemap: ['TreemapRows', 'title', 'accTitle', 'accDescr'],
  TreemapRow: ['item', 'indent'],
  Section: ['name', 'classSelector'],
  Leaf: ['name', 'value', 'classSelector'],
  Architecture: ['title', 'accTitle', 'accDescr', 'services', 'groups', 'junctions', 'edges'],
  Service: ['id', 'icon', 'iconText', 'title', 'in'],
  Group: ['id', 'icon', 'title', 'in'],
  Railroad: ['rules', 'title', 'accTitle', 'accDescr'],
  RailroadRule: ['name', 'definition'],
}
/** A Langium AST node whose Absent fields are unsupported. */
function gitAst(type, fields, hooks) {
  const present = {}, absent = {}
  for (const [key, value] of Object.entries(fields)) {
    if (value instanceof Absent) absent[key] = value.reason
    else present[key] = value
  }
  return record({ $type: type, ...present }, type, AST_FIELDS[type], absent, hooks)
}
/** A model with no statement list: only the document-level fields it carries. */
const graphOnlyAst = (statements, extra) => (raw, hooks) => gitAst('GitGraph', { statements: no(statements), ...extra(raw) }, hooks)

// agentic-mermaid 0.5.6 GitGraphDiagram: statements { commit|merge|cherry-pick ref, branch
// name order?, checkout branch } over commits { id (sourceId when an authored id repeats),
// message?, type (NORMAL when none written), customType (a merge's written type), tags,
// customId, syntheticCherryTag (set only when a cherry-pick has no written tag), ... },
// with accessibilityTitle/accessibilityDescription and a frontmatter title.
function agenticAst(raw, hooks) {
  const byId = new Map(raw.commits.map(commit => [commit.id, commit]))
  const written = commit => (commit.customId ? (commit.sourceId ?? commit.id) : undefined)
  const statement = item => {
    const commit = item.ref === undefined ? undefined : byId.get(item.ref)
    if (item.ref !== undefined && !commit) return hooks.unavailable('agentic-mermaid statement refers to an unknown commit')
    if (item.kind === 'commit')
      return gitAst('Commit', { id: written(commit), message: commit.message, tags: commit.tags, type: commit.type === 'NORMAL' ? no('agentic-mermaid stores a commit without type: as NORMAL') : commit.type }, hooks)
    if (item.kind === 'branch') return gitAst('Branch', { name: item.name, order: item.order }, hooks)
    if (item.kind === 'checkout') return gitAst('Checkout', { branch: item.branch }, hooks)
    if (item.kind === 'merge') return gitAst('Merge', { branch: item.branch, id: written(commit), tags: commit.tags, type: commit.customType }, hooks)
    if (item.kind === 'cherry-pick') return gitAst('CherryPicking', { id: item.source, tags: commit.syntheticCherryTag !== undefined ? [] : commit.tags, parent: item.parent }, hooks)
    return hooks.unavailable('agentic-mermaid git graph statement ' + item.kind)
  }
  return gitAst('GitGraph', { statements: raw.statements.map(statement), title: raw.title, accTitle: raw.accessibilityTitle, accDescr: raw.accessibilityDescription }, hooks)
}

// merslim parseGitGraph ops: commit { id?, tag? (the first tag: written), type (NORMAL
// when none written) }, branch { name }, checkout { name }, merge { from, tag? }, cherry-
// pick { commitId }. It keeps no commit message, branch order, merge id or type, cherry-
// pick tags or parent, and no accessibility text; title is kept.
function merslimAst(raw, hooks) {
  const tags = tag => (tag === undefined || tag === null ? [] : [tag])
  const statement = op => {
    if (op.kind === 'commit') return gitAst('Commit', { id: op.id, message: no("merslim's commit statement keeps no message"), tags: tags(op.tag), type: op.type === 'NORMAL' ? no('merslim stores a commit without type: as NORMAL') : op.type }, hooks)
    if (op.kind === 'branch') return gitAst('Branch', { name: op.name, order: no("merslim's branch statement keeps no order") }, hooks)
    if (op.kind === 'checkout') return gitAst('Checkout', { branch: op.name }, hooks)
    if (op.kind === 'merge') return gitAst('Merge', { branch: op.from, id: no("merslim's merge statement keeps no id"), tags: tags(op.tag), type: no("merslim's merge statement keeps no type") }, hooks)
    if (op.kind === 'cherry-pick') return gitAst('CherryPicking', { id: op.commitId, tags: no("merslim's cherry-pick statement keeps no tags"), parent: no("merslim's cherry-pick statement keeps no parent") }, hooks)
    return hooks.unavailable('merslim git graph statement ' + op.kind)
  }
  return gitAst('GitGraph', { statements: raw.ops.map(statement), title: raw.title, accTitle: no("merslim's git graph parser reads no accessibility title"), accDescr: no("merslim's git graph parser reads no accessibility description") }, hooks)
}

const noStatements = name => `${name} builds its commit graph directly and keeps no statement list (checkouts and statement order are not recorded)`
const dartAst = graphOnlyAst(noStatements('mermaid_core'), raw => ({ title: raw.title ?? undefined, accTitle: no("mermaid_core's git graph model keeps no accessibility title"), accDescr: no("mermaid_core's git graph model keeps no accessibility description") }))

// ---------------------------------------------------------------------------------------
// Other Langium ASTs these models answer (packages/parser/tests). An AST lists what was
// written: an axis or curve label, a service or group title only when given, a curve's
// entries as written, only the options written, treemap rows (classDef statements among
// them) in source order. Where a model fills a default (a label equal to its name, a
// value of 0, merged option defaults) the written form cannot be told apart, and only that
// reading is unsupported.
const written = (label, name, reason) => (label !== name ? label : no(reason))

// Radar. agentic-mermaid RadarBody: axes and curves { id, label (the id when no label was
// written) }, a curve's values resolved to one per axis in axis order, option defaults
// merged (min 0, ticks 5, graticule circle, showLegend true). mermaid_core RadarChart:
// axes and curve labels as one display string each (the label, else the name), values one
// per axis for keyed entries, defaults merged, title. mermaid-rs-renderer keeps each curve
// as a node whose label folds name and entries into one display string, and skips title,
// accessibility, axis and option lines.
function agenticRadar(raw, hooks) {
  const label = item => written(item.label, item.id, 'agentic-mermaid stores an unlabelled radar axis or curve with its name as label')
  return gitAst('Radar', {
    title: raw.title,
    accTitle: raw.accessibilityTitle,
    // RadarBody declares no accessibility fields; captured output keeps accTitle only.
    accDescr: no("agentic-mermaid's radar model keeps no accessibility description"),
    axes: raw.axes.map(axis => gitAst('Axis', { name: axis.id, label: label(axis) }, hooks)),
    curves: raw.curves.map(curve => gitAst('Curve', { name: curve.id, label: label(curve), entries: no("agentic-mermaid resolves a curve's entries to one value per axis in axis order; the written entries are not kept") }, hooks)),
    options: no('agentic-mermaid merges radar option defaults, so the written options are not kept'),
  }, hooks)
}
function dartRadar(raw, hooks) {
  const display = 'mermaid_core keeps one display string per radar axis or curve: its label, else its name'
  return gitAst('Radar', {
    title: raw.title ?? undefined,
    accTitle: no("mermaid_core's radar model keeps no accessibility title"),
    accDescr: no("mermaid_core's radar model keeps no accessibility description"),
    axes: raw.axes.map(() => gitAst('Axis', { name: no(display), label: no(display) }, hooks)),
    curves: raw.curves.map(() => gitAst('Curve', { name: no(display), label: no(display), entries: no("mermaid_core resolves keyed curve entries to one value per axis; the written entries are not kept") }, hooks)),
    options: no('mermaid_core merges radar option defaults, so the written options are not kept'),
  }, hooks)
}
function mmdrRadar(_raw, hooks) {
  const folded = "mermaid-rs-renderer keeps a radar curve only as a node whose display label folds its name and entries"
  return gitAst('Radar', {
    title: no('mermaid-rs-renderer skips radar titles'),
    accTitle: no('mermaid-rs-renderer skips radar accessibility titles'),
    accDescr: no('mermaid-rs-renderer skips radar accessibility descriptions'),
    axes: no('mermaid-rs-renderer keeps no radar axes (they only label curve entries)'),
    curves: no(folded),
    options: no('mermaid-rs-renderer skips radar options'),
  }, hooks)
}

// Treemap. agentic-mermaid TreemapBody: nodes in source order { label, value (only when
// written), className, parentId }, classDefs in a map (their row positions not kept).
// termaid keeps only node lines (classDef, title and accessibility lines dropped) with
// value 0 when none was written. mermaid-rs-renderer turns every line after the header,
// title and accessibility lines included, into a node whose display label folds name,
// value and class.
function agenticTreemap(raw, hooks) {
  const rows = Object.keys(raw.classDefs ?? {}).length
    ? no('agentic-mermaid keeps classDef statements in a map, so their position among the treemap rows is not kept')
    : raw.nodes.map(node =>
        gitAst('TreemapRow', {
          item: node.value !== undefined
            ? gitAst('Leaf', { name: node.label, value: node.value, classSelector: node.className }, hooks)
            : gitAst('Section', { name: node.label, classSelector: node.className }, hooks),
          indent: no("agentic-mermaid keeps a treemap row's parent, not its indentation"),
        }, hooks))
  return gitAst('Treemap', { TreemapRows: rows, title: raw.title, accTitle: raw.accessibilityTitle, accDescr: raw.accessibilityDescription }, hooks)
}
// XMermaid 0.4.2 (captured output): nodes in source order { label, value (null when none
// written), parent }; it rejects unquoted lines (classDef, title, accessibility) and
// ::: classes, so its rows are node rows only.
const xmermaidTreemap = (raw, hooks) =>
  gitAst('Treemap', {
    TreemapRows: raw.nodes.map(node =>
      gitAst('TreemapRow', {
        item: node.value !== null && node.value !== undefined
          ? gitAst('Leaf', { name: node.label, value: node.value, classSelector: no("XMermaid's treemap model keeps no class") }, hooks)
          : gitAst('Section', { name: node.label, classSelector: no("XMermaid's treemap model keeps no class") }, hooks),
        indent: no("XMermaid keeps a treemap row's parent, not its indentation"),
      }, hooks)),
    title: no("XMermaid's treemap model keeps no title"),
    accTitle: no("XMermaid's treemap model keeps no accessibility title"),
    accDescr: no("XMermaid's treemap model keeps no accessibility description"),
  }, hooks)
const termaidTreemap = (_raw, hooks) =>
  gitAst('Treemap', {
    TreemapRows: no('termaid keeps only treemap node lines (classDef rows are dropped) and stores a value not written as 0'),
    title: no("termaid's treemap model keeps no title"),
    accTitle: no("termaid's treemap model keeps no accessibility title"),
    accDescr: no("termaid's treemap model keeps no accessibility description"),
  }, hooks)
const mmdrTreemap = (_raw, hooks) =>
  gitAst('Treemap', {
    TreemapRows: no("mermaid-rs-renderer keeps every treemap line as a node whose display label folds name, value and class"),
    title: no('mermaid-rs-renderer keeps a treemap title line only as a node label'),
    accTitle: no('mermaid-rs-renderer keeps a treemap accessibility line only as a node label'),
    accDescr: no('mermaid-rs-renderer keeps a treemap accessibility line only as a node label'),
  }, hooks)

// Architecture. agentic-mermaid ArchitectureBody, zombie-mermaid { groups, services }
// and merslim { nodes: kind group|service } give each service and group its id, icon,
// parent and a label that is the id when no title was written (merslim keeps the
// bracket text as written, quotes included). mermaid-rs-renderer: services are nodes in
// node_order (a junction is a node with icon "junction" and no label; an edge to an
// undeclared id adds a bare node), groups are subgraphs with label (the id when none)
// and icon; a service's group is kept only when the group was declared first, a group's
// parent never; title and accessibility lines are skipped. termaid folds a service's
// icon into its display label and drops untitled services; a group keeps its bracket
// text, and nests under a parent declared before it.
const untitled = name => `${name} stores an untitled service or group with its id as label`
function agenticArchitecture(raw, hooks) {
  const node = (type, item) => gitAst(type, { id: item.id, icon: item.icon, ...(type === 'Service' ? { iconText: item.iconText } : {}), title: written(item.label, item.id, untitled('agentic-mermaid')), in: item.parentId }, hooks)
  return gitAst('Architecture', { title: raw.title, accTitle: raw.accessibilityTitle, accDescr: raw.accessibilityDescription, services: raw.services.map(item => node('Service', item)), groups: raw.groups.map(item => node('Group', item)) }, hooks)
}
function zombieArchitecture(raw, hooks) {
  const node = (type, item) => gitAst(type, { id: item.id, icon: item.icon, title: written(item.title, item.id, untitled('zombie-mermaid')), in: item.parent }, hooks)
  return gitAst('Architecture', {
    title: no("zombie-mermaid's architecture model keeps no title"),
    accTitle: no("zombie-mermaid's architecture model keeps no accessibility title"),
    accDescr: no("zombie-mermaid's architecture model keeps no accessibility description"),
    services: raw.services.map(item => node('Service', item)),
    groups: raw.groups.map(item => node('Group', item)),
  }, hooks)
}
function merslimArchitecture(raw, hooks) {
  const node = (type, item) => gitAst(type, { id: item.id, icon: item.icon, title: written(item.label, item.id, untitled('merslim')), in: item.parent }, hooks)
  return gitAst('Architecture', {
    title: no("merslim's architecture parser skips titles"),
    accTitle: no("merslim's architecture parser reads no accessibility title"),
    accDescr: no("merslim's architecture parser reads no accessibility description"),
    services: raw.nodes.filter(item => item.kind === 'service').map(item => node('Service', item)),
    groups: raw.nodes.filter(item => item.kind === 'group').map(item => node('Group', item)),
  }, hooks)
}
function mmdrArchitecture(raw, hooks) {
  const nodes = Object.entries(raw.nodes ?? {}).sort((a, b) => (raw.node_order?.[a[0]] ?? 0) - (raw.node_order?.[b[0]] ?? 0)).map(([, node]) => node)
  const junction = node => node.icon === 'junction' && node.label === ''
  // A bare node on an edge may be a service written without icon or title, or one the edge added.
  const bare = node => !node.icon && node.label === node.id && raw.edges.some(edge => edge.from === node.id || edge.to === node.id)
  const services = nodes.some(bare)
    ? no('mermaid-rs-renderer adds a bare node for an edge endpoint, which cannot be told from a service written without icon or title')
    : nodes.filter(node => !junction(node)).map(node => gitAst('Service', { id: node.id, icon: node.icon ?? undefined, title: written(node.label, node.id, untitled('mermaid-rs-renderer')), in: no("mermaid-rs-renderer keeps a service's group only when the group was declared before it") }, hooks))
  return gitAst('Architecture', {
    title: no('mermaid-rs-renderer skips architecture titles'),
    accTitle: no('mermaid-rs-renderer skips architecture accessibility titles'),
    accDescr: no('mermaid-rs-renderer skips architecture accessibility descriptions'),
    services,
    groups: raw.subgraphs.map(group => gitAst('Group', { id: group.id, icon: group.icon ?? undefined, title: written(group.label, group.id, untitled('mermaid-rs-renderer')), in: no("mermaid-rs-renderer keeps no group's parent group") }, hooks)),
  }, hooks)
}
function termaidArchitecture(raw, hooks) {
  const groups = raw.subgraphs ?? []
  return gitAst('Architecture', {
    title: no("termaid's architecture model keeps no title"),
    accTitle: no("termaid's architecture model keeps no accessibility title"),
    accDescr: no("termaid's architecture model keeps no accessibility description"),
    services: no("termaid folds a service's icon into its display label and drops untitled services"),
    groups: groups.some(group => group.children?.length)
      ? no('termaid nests groups under their parents, so the source order of a nested group is not kept')
      : groups.map(group => gitAst('Group', { id: group.id, icon: no("termaid's group model keeps no icon"), title: group.label, in: no("termaid keeps a group's parent only when the parent was declared first") }, hooks)),
  }, hooks)
}

// Railroad. mermaid_core 0.3.2 RailroadDiagram { rules: RailroadRule { name, expr }, title }
// keeps no accessibility text. Its expression parser drops a group's parentheses and folds
// a one-item sequence or choice into its item (railroad.dart _parseSequence, _parseChoice),
// so no expression's written form can be told from it: a rule's definition is not kept.
const dartRailroad = (raw, hooks) =>
  gitAst('Railroad', {
    rules: raw.rules.map(rule => gitAst('RailroadRule', { name: rule.name, definition: no("mermaid_core folds a group, and a one-item sequence or choice, into its item, so a rule's written expression is not kept") }, hooks)),
    title: raw.title ?? undefined,
    accTitle: no("mermaid_core's railroad model keeps no accessibility title"),
    accDescr: no("mermaid_core's railroad model keeps no accessibility description"),
  }, hooks)

export default {
  schema: {
    gitgraph: {
      'fasouto/termaid': termaid,
      'Yassimba/loom': loom,
      'anomalyco/opencode': opencode,
      '1jehuang/mermaid-rs-renderer': mmdr,
      'orestesgaolin/mermaid': dart,
      'pub:mermaid_flutter': dart,
      'evangwt/xmermaid': xmermaid,
      'Mootikins/figurehead-rs': figurehead,
      'emtyty/merslim': merslim,
    },
  },
  ast: {
    GitGraph: {
      'adewale/agentic-mermaid': agenticAst,
      'emtyty/merslim': merslimAst,
      'fasouto/termaid': graphOnlyAst(noStatements('termaid'), () => ({ title: no("termaid's git graph model keeps no title"), accTitle: no("termaid's git graph parser reads no accessibility title"), accDescr: no("termaid's git graph parser reads no accessibility description") })),
      'Yassimba/loom': graphOnlyAst(noStatements('Loom'), () => ({ accTitle: no("Loom's git graph parser reads no accessibility title"), accDescr: no("Loom's git graph parser reads no accessibility description") })),
      'anomalyco/opencode': graphOnlyAst(noStatements('OpenCode'), () => ({ title: no("OpenCode's git graph parser skips titles"), accTitle: no("OpenCode's git graph parser skips accessibility titles"), accDescr: no("OpenCode's git graph parser skips accessibility descriptions") })),
      '1jehuang/mermaid-rs-renderer': graphOnlyAst(noStatements('mermaid-rs-renderer'), () => ({ accTitle: no('mermaid-rs-renderer skips accessibility titles'), accDescr: no('mermaid-rs-renderer skips accessibility descriptions') })),
      'orestesgaolin/mermaid': dartAst,
      'pub:mermaid_flutter': dartAst,
      'evangwt/xmermaid': graphOnlyAst(noStatements('XMermaid'), () => ({ accTitle: no("XMermaid's git graph model keeps no accessibility title"), accDescr: no("XMermaid's git graph model keeps no accessibility description") })),
      'Mootikins/figurehead-rs': graphOnlyAst("figurehead's git graph model is an unordered node and edge graph with no statement list", () => ({ accTitle: no("figurehead's git graph model keeps no accessibility title"), accDescr: no("figurehead's git graph model keeps no accessibility description") })),
    },
    Radar: {
      'adewale/agentic-mermaid': agenticRadar,
      'orestesgaolin/mermaid': dartRadar,
      'pub:mermaid_flutter': dartRadar,
      '1jehuang/mermaid-rs-renderer': mmdrRadar,
    },
    Treemap: {
      'adewale/agentic-mermaid': agenticTreemap,
      'evangwt/xmermaid': xmermaidTreemap,
      'fasouto/termaid': termaidTreemap,
      '1jehuang/mermaid-rs-renderer': mmdrTreemap,
    },
    Railroad: {
      'orestesgaolin/mermaid': dartRailroad,
      'pub:mermaid_flutter': dartRailroad,
    },
    Architecture: {
      'adewale/agentic-mermaid': agenticArchitecture,
      'dfadler/zombie-mermaid': zombieArchitecture,
      'emtyty/merslim': merslimArchitecture,
      '1jehuang/mermaid-rs-renderer': mmdrArchitecture,
      'fasouto/termaid': termaidArchitecture,
    },
  },
}
