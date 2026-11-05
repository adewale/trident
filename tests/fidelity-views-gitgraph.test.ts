import { expect, test } from 'bun:test'
import { nativeAstView, nativeSchemaView } from '../unified/mermaid-fidelity/schema-views.mjs'

// Native models below were captured from the parser bridges at their pinned versions
// (scripts/fidelity-probe.ts), trimmed to the fields the views read.
const verdicts = () => {
  const log: string[] = []
  return {
    log,
    hooks: {
      unavailable: (reason: string) => {
        log.push('gap: ' + reason)
        throw Error('gap')
      },
      unsupported: (reason: string) => {
        log.push('unsupported: ' + reason)
        throw Error('unsupported')
      },
    },
  }
}
const git = (project: string, raw: unknown) => {
  const { hooks, log } = verdicts()
  return { view: nativeSchemaView(project, 'gitgraph', raw, hooks), log }
}

// gitGraph TB: / commit id:"A" tag:"v1" type:HIGHLIGHT / commit / branch develop order: 2 /
// checkout develop / commit type: REVERSE / checkout main / merge develop id:"M" tag:"rel"
// type: REVERSE / branch feat / commit id:"F" / checkout main / cherry-pick id:"F"
const termaidRaw = {
  commits: [
    { id: 'A', branch: 'main', type: 'HIGHLIGHT', tag: 'v1', parents: [], seq: 0 },
    { id: '0', branch: 'main', type: 'NORMAL', tag: '', parents: ['A'], seq: 1 },
    { id: '1', branch: 'develop', type: 'REVERSE', tag: '', parents: ['0'], seq: 2 },
    { id: 'M', branch: 'main', type: 'REVERSE', tag: 'rel', parents: ['0', '1'], seq: 3 },
    { id: 'F', branch: 'feat', type: 'NORMAL', tag: '', parents: ['M'], seq: 4 },
    { id: 'F-cherry', branch: 'main', type: 'NORMAL', tag: '', parents: ['M', 'F'], seq: 5 },
  ],
  branches: [
    { name: 'main', order: -1, start_commit: '' },
    { name: 'develop', order: 2, start_commit: '0' },
    { name: 'feat', order: -1, start_commit: 'M' },
    { name: 'empty', order: -1, start_commit: 'F-cherry' },
  ],
  direction: 'TB',
  main_branch_name: 'main',
  warnings: [],
}

test('termaid: commits, derived branch heads and Mermaid order; merges and cherry-picks are not told apart', () => {
  const { view, log } = git('fasouto/termaid', termaidRaw)
  const commits = view.getCommits()
  expect([...commits.keys()]).toEqual(['A', '0', '1', 'M', 'F', 'F-cherry'])
  expect(commits.get('A').type).toBe(2)
  expect(commits.get('A').tags).toEqual(['v1'])
  expect(commits.get('0').tags).toEqual([])
  expect(commits.get('1').branch).toBe('develop')
  expect(commits.get('M').parents).toEqual(['0', '1'])
  expect(() => commits.get('M').type).toThrow('unsupported')
  expect(log.at(-1)).toContain('merge and a cherry-pick alike')
  expect(() => commits.get('A').message).toThrow('unsupported')
  // A normal commit has no customType in Mermaid either.
  expect(commits.get('A').customType).toBeUndefined()
  const branches = view.getBranches()
  expect(branches.size).toBe(4)
  expect(branches.get('main')).toBe('F-cherry')
  expect(branches.get('develop')).toBe('1')
  // A branch without commits points at the commit it was cut from.
  expect(branches.get('empty')).toBe('F-cherry')
  expect(view.getBranchesAsObjArray()).toEqual([{ name: 'main' }, { name: 'feat' }, { name: 'empty' }, { name: 'develop' }])
  expect(view.getDirection()).toBe('TB')
  expect(view.getCommitsArray().map((c: any) => c.seq)).toEqual([0, 1, 2, 3, 4, 5])
  expect(() => view.getCurrentBranch()).toThrow('unsupported')
  expect(() => view.getHead()).toThrow('unsupported')
  expect(() => view.getAccTitle()).toThrow('unsupported')
})

test('termaid: a branch cut before any commit has no head', () => {
  const { view } = git('fasouto/termaid', { commits: [], branches: [{ name: 'main', order: -1, start_commit: '' }, { name: 'new', order: -1, start_commit: '' }], direction: 'LR' })
  expect([...view.getBranches()]).toEqual([['main', null], ['new', null]])
  expect(view.getCommits().size).toBe(0)
})

test('Loom: parents and heads from lanes, fork points and merged lanes', () => {
  const raw = {
    branches: ['main', 'develop', 'feat'],
    commits: [
      { lane: 0, id: 'A', tag: 'v1', mergeFrom: null },
      { lane: 0, id: 'c0', tag: null, mergeFrom: null },
      { lane: 1, id: 'c1', tag: null, mergeFrom: null },
      { lane: 0, id: 'M', tag: 'rel', mergeFrom: 1 },
      { lane: 2, id: 'F', tag: null, mergeFrom: null },
      { lane: 0, id: '', tag: null, mergeFrom: 2 },
    ],
    forkAt: [null, 1, 3],
    warnings: [],
  }
  const { view, log } = git('Yassimba/loom', raw)
  const commits = view.getCommitsArray()
  expect(commits.map((c: any) => [c.id, c.branch, c.seq, c.parents])).toEqual([
    ['A', 'main', 0, []],
    ['c0', 'main', 1, ['A']],
    ['c1', 'develop', 2, ['c0']],
    ['M', 'main', 3, ['c0', 'c1']],
    ['F', 'feat', 4, ['M']],
    ['', 'main', 5, ['M', 'F']],
  ])
  expect(commits[3].type).toBe(3)
  expect(commits[3].customId).toBe(true)
  expect(commits[5].customId).toBe(false)
  expect(commits[3].tags).toEqual(['rel'])
  expect(() => commits[0].type).toThrow('unsupported')
  expect(log.at(-1)).toContain('Loom keeps no commit type')
  expect([...view.getBranches()]).toEqual([['main', ''], ['develop', 'c1'], ['feat', 'F']])
  expect(() => view.getBranchesAsObjArray()).toThrow('unsupported')
  expect(() => view.getDirection()).toThrow('unsupported')
})

test('OpenCode: merges by their two parents, heads as recorded, its own branch order', () => {
  const raw = {
    direction: 'TB',
    branches: [{ name: 'main', order: 0, head: 'commit-3' }, { name: 'feat', head: 'F' }, { name: 'idle' }, { name: 'develop', order: 2, head: 'commit-2' }],
    commits: [
      { id: 'A', message: 'first', tags: ['v1', 'v2'], type: 'HIGHLIGHT', branch: 'main', parents: [] },
      { id: 'commit-1', tags: [], type: 'NORMAL', branch: 'main', parents: ['A'] },
      { id: 'commit-2', tags: [], type: 'REVERSE', branch: 'develop', parents: ['commit-1'] },
      { id: 'M', tags: ['rel'], type: 'REVERSE', branch: 'main', parents: ['commit-1', 'commit-2'] },
      { id: 'F', tags: [], type: 'NORMAL', branch: 'feat', parents: ['M'] },
      { id: 'commit-3', tags: [], type: 'NORMAL', branch: 'main', parents: ['M', 'F'] },
    ],
  }
  const { view } = git('anomalyco/opencode', raw)
  const commits = view.getCommits()
  expect(commits.get('A').message).toBe('first')
  expect(commits.get('commit-1').message).toBe('')
  expect(commits.get('A').tags).toEqual(['v1', 'v2'])
  expect(commits.get('M').type).toBe(3)
  expect(commits.get('M').customType).toBe(1)
  expect(() => commits.get('commit-3').customType).toThrow('unsupported')
  expect(() => commits.get('M').customId).toThrow('unsupported')
  expect(() => commits.get('M').message).toThrow('unsupported')
  expect(commits.get('commit-2').seq).toBe(2)
  expect(view.getBranches().get('idle')).toBeNull()
  expect(view.getBranches().get('develop')).toBe('commit-2')
  expect(view.getBranchesAsObjArray()).toEqual([{ name: 'main' }, { name: 'feat' }, { name: 'idle' }, { name: 'develop' }])
  expect(view.getDirection()).toBe('TB')
  const zero = git('anomalyco/opencode', { ...raw, branches: [...raw.branches, { name: 'z', order: 0 }] })
  expect(() => zero.view.getBranchesAsObjArray()).toThrow('unsupported')
})

test('mermaid-rs-renderer: Mermaid-shaped commits; a commitless branch head is known only without a fork', () => {
  const raw = {
    kind: 'GitGraph',
    direction: 'LeftRight',
    gitgraph: {
      main_branch: 'main',
      commits: [
        { id: 'A', message: 'first', seq: 0, commit_type: 'Highlight', custom_type: null, tags: ['v1'], parents: [], branch: 'main', custom_id: true },
        { id: '1-d08d550', message: null, seq: 1, commit_type: 'Normal', custom_type: null, tags: [], parents: ['A'], branch: 'main', custom_id: false },
        { id: '2-94b40d8', message: null, seq: 2, commit_type: 'Reverse', custom_type: null, tags: [], parents: ['1-d08d550'], branch: 'develop', custom_id: false },
        { id: 'M', message: 'merged branch develop into main', seq: 3, commit_type: 'Merge', custom_type: 'Reverse', tags: ['rel'], parents: ['1-d08d550', '2-94b40d8'], branch: 'main', custom_id: true },
      ],
      branches: [
        { name: 'main', order: 0, insertion_index: 0 },
        { name: 'develop', order: 2, insertion_index: 1 },
        { name: 'feat', order: null, insertion_index: 2 },
      ],
    },
  }
  const { view } = git('1jehuang/mermaid-rs-renderer', raw)
  const commits = view.getCommits()
  expect(commits.get('A').type).toBe(2)
  expect(commits.get('1-d08d550').message).toBe('')
  expect(commits.get('M').type).toBe(3)
  expect(commits.get('M').customType).toBe(1)
  expect(commits.get('M').customId).toBe(true)
  expect(commits.get('M').message).toBe('merged branch develop into main')
  expect(view.getBranches().get('main')).toBe('M')
  expect(() => view.getBranches().get('feat')).toThrow('unsupported')
  expect(view.getBranches().size).toBe(3)
  expect(view.getBranchesAsObjArray()).toEqual([{ name: 'main' }, { name: 'feat' }, { name: 'develop' }])
  expect(view.getDirection()).toBe('LR')
  expect(() => view.getCurrentBranch()).toThrow('unsupported')
})

test('mermaid_core: merge and cherry-pick flags give Mermaid types; no messages', () => {
  const raw = {
    commits: [
      { id: 'A', seq: 0, branch: 'main', parents: [], type: 'highlight', tags: ['v1'], customId: true, isMerge: false, isCherryPick: false },
      { id: 'main_0', seq: 1, branch: 'main', parents: ['A'], type: 'normal', tags: [], customId: false, isMerge: false, isCherryPick: false },
      { id: 'develop_1', seq: 2, branch: 'develop', parents: ['main_0'], type: 'reverse', tags: [], customId: false, isMerge: false, isCherryPick: false },
      { id: 'M', seq: 3, branch: 'main', parents: ['main_0', 'develop_1'], type: 'reverse', tags: ['rel'], customId: true, isMerge: true, isCherryPick: false },
      { id: 'merge_2', seq: 4, branch: 'develop', parents: ['develop_1', 'M'], type: 'normal', tags: [], customId: false, isMerge: true, isCherryPick: false },
      { id: 'cherry_3', seq: 5, branch: 'main', parents: ['M'], type: 'normal', tags: ['F'], customId: false, isMerge: false, isCherryPick: true },
    ],
    branchOrder: ['main', 'develop', 'feat'],
    direction: 'topBottom',
    title: null,
  }
  for (const project of ['orestesgaolin/mermaid', 'pub:mermaid_flutter']) {
    const { view } = git(project, raw)
    const commits = view.getCommits()
    expect([...commits.values()].map((c: any) => c.type)).toEqual([2, 0, 1, 3, 3, 4])
    expect(commits.get('M').customType).toBe(1)
    expect(() => commits.get('merge_2').customType).toThrow('unsupported')
    expect(commits.get('merge_2').customId).toBe(false)
    expect(() => commits.get('A').message).toThrow('unsupported')
    expect(view.getBranches().get('main')).toBe('cherry_3')
    expect(view.getBranches().get('develop')).toBe('merge_2')
    expect(() => view.getBranches().get('feat')).toThrow('unsupported')
    expect(view.getBranchesAsObjArray()).toEqual([{ name: 'main' }, { name: 'develop' }, { name: 'feat' }])
    expect(view.getDirection()).toBe('TB')
  }
})

test('XMermaid: commits only; unwritten type is NORMAL, two-parent commits have no type', () => {
  const raw = {
    type: 'gitgraph',
    commits: [
      { id: 'commit-1', branch: 'main', tag: null, commit_type: 'NORMAL', parents: [], display_label: 'commit-1\nmain' },
      { id: 'commit-2', branch: 'main', tag: 'v1', commit_type: null, parents: ['commit-1'], display_label: 'commit-2\nmain\nv1' },
      { id: 'merge-3', branch: 'main', tag: null, commit_type: null, parents: ['commit-2', 'commit-1'], display_label: 'merge-3\nmain' },
    ],
  }
  const { view, log } = git('evangwt/xmermaid', raw)
  const commits = view.getCommits()
  expect(commits.get('commit-2').type).toBe(0)
  expect(commits.get('commit-2').tags).toEqual(['v1'])
  expect(commits.get('merge-3').seq).toBe(2)
  expect(() => commits.get('merge-3').type).toThrow('unsupported')
  expect(() => view.getBranches()).toThrow('unsupported')
  expect(log.at(-1)).toContain('keeps no branch list')
  expect(() => view.getDirection()).toThrow('unsupported')
})

test('figurehead and merslim keep no commit graph; figurehead keeps its direction', () => {
  const figurehead = git('Mootikins/figurehead-rs', { nodes: { A: { id: 'A', label: 'A', shape: 'Circle' } }, edges: [], direction: 'BottomUp' })
  expect(() => figurehead.view.getCommits()).toThrow('unsupported')
  expect(figurehead.log.at(-1)).toContain('unordered node and edge graph')
  expect(figurehead.view.getDirection()).toBe('BT')
  const merslim = git('emtyty/merslim', { type: 'gitgraph', ops: [{ kind: 'commit', type: 'NORMAL' }] })
  expect(() => merslim.view.getCommits()).toThrow('unsupported')
  expect(() => merslim.view.getBranches()).toThrow('unsupported')
  expect(merslim.log.at(-1)).toContain('list of statements')
})

test('GitGraph AST: agentic-mermaid statements resolve their commits; NORMAL alone is ambiguous', () => {
  const { hooks, log } = verdicts()
  const raw = {
    kind: 'gitgraph',
    commits: [
      { id: 'A', message: 'first', type: 'HIGHLIGHT', tags: ['v1'], branch: 'main', parents: [], sequence: 0, source: 'commit', customId: true },
      { id: 'c1', type: 'NORMAL', tags: [], branch: 'main', parents: ['A'], sequence: 1, source: 'commit', customId: false },
      { id: 'M', type: 'MERGE', tags: ['rel'], branch: 'main', parents: ['c1', 'c2'], sequence: 3, source: 'merge', customId: true, mergeBranch: 'develop', customType: 'REVERSE' },
      { id: 'c5', type: 'CHERRY_PICK', tags: ['cherry-pick:F'], branch: 'main', parents: ['M', 'F'], sequence: 5, source: 'cherry-pick', customId: false, cherrySource: 'F', syntheticCherryTag: 'cherry-pick:F' },
    ],
    statements: [
      { kind: 'commit', ref: 'A' },
      { kind: 'commit', ref: 'c1' },
      { kind: 'branch', name: 'develop', order: 2 },
      { kind: 'checkout', branch: 'develop', keyword: 'checkout' },
      { kind: 'merge', ref: 'M', branch: 'develop' },
      { kind: 'cherry-pick', ref: 'c5', source: 'F' },
    ],
    accessibilityTitle: 'My T',
  }
  const ast = nativeAstView('adewale/agentic-mermaid', 'GitGraph', raw, hooks)
  expect(ast.statements.map((s: any) => s.$type)).toEqual(['Commit', 'Commit', 'Branch', 'Checkout', 'Merge', 'CherryPicking'])
  expect([ast.statements[0].id, ast.statements[0].message, ast.statements[0].tags, ast.statements[0].type]).toEqual(['A', 'first', ['v1'], 'HIGHLIGHT'])
  expect(ast.statements[1].id).toBeUndefined()
  expect(() => ast.statements[1].type).toThrow('unsupported')
  expect(log.at(-1)).toContain('without type: as NORMAL')
  expect([ast.statements[2].name, ast.statements[2].order]).toEqual(['develop', 2])
  expect(ast.statements[3].branch).toBe('develop')
  expect([ast.statements[4].branch, ast.statements[4].id, ast.statements[4].tags, ast.statements[4].type]).toEqual(['develop', 'M', ['rel'], 'REVERSE'])
  expect([ast.statements[5].id, ast.statements[5].tags, ast.statements[5].parent]).toEqual(['F', [], undefined])
  expect(ast.accTitle).toBe('My T')
  expect(ast.accDescr).toBeUndefined()
  expect(ast.statements[0].hasOwnProperty('oops')).toBe(false)
})

test('GitGraph AST: merslim ops are statements; a model without one declares statements absent', () => {
  const { hooks, log } = verdicts()
  const raw = {
    type: 'gitgraph',
    ops: [
      { kind: 'commit', id: 'A', tag: 'v1', type: 'HIGHLIGHT' },
      { kind: 'branch', name: 'develop' },
      { kind: 'checkout', name: 'develop' },
      { kind: 'merge', from: 'develop' },
      { kind: 'cherry-pick', commitId: 'F' },
    ],
  }
  const ast = nativeAstView('emtyty/merslim', 'GitGraph', raw, hooks)
  expect(ast.statements.map((s: any) => s.$type)).toEqual(['Commit', 'Branch', 'Checkout', 'Merge', 'CherryPicking'])
  expect([ast.statements[0].id, ast.statements[0].tags, ast.statements[0].type]).toEqual(['A', ['v1'], 'HIGHLIGHT'])
  expect(ast.statements[3].tags).toEqual([])
  expect(() => ast.statements[1].order).toThrow('unsupported')
  expect(ast.statements[4].id).toBe('F')
  expect(() => ast.accTitle).toThrow('unsupported')
  const termaid = nativeAstView('fasouto/termaid', 'GitGraph', termaidRaw, hooks)
  expect(() => termaid.statements).toThrow('unsupported')
  expect(log.at(-1)).toContain('keeps no statement list')
})
