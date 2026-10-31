import { FamilyCanvas, expectedFact, familyChecks, same, setFamilyCheck } from './terminal-family-canvas.ts'
import type { TerminalSourceContract } from './terminal-source.ts'
type Event = { operation: string; branch: string; id?: string; tag?: string; msg?: string; type?: string; from?: string; parents: number[] }
function expectedHistory(expected: any) {
  const events: Event[] = [], heads = new Map<string, number>(), initial = expected.mainBranch
  for (const op of expected.operations) {
    if (op.operation === 'branch') { const prior = expected.operations.slice(0, expected.operations.indexOf(op)).filter((p: any) => p.operation !== 'branch').at(-1), parent = heads.get(prior?.branch ?? initial); if (parent !== undefined) heads.set(op.namedBranch, parent); continue }
    if (op.operation === 'checkout') continue
    const parent = heads.get(op.branch), other = op.operation === 'merge' ? heads.get(op.namedBranch) : undefined, picked = op.operation === 'cherry-pick' ? events.findIndex(e => e.id === op.id) : -1
    const event: Event = { operation: op.operation, branch: op.branch, ...(op.id && op.operation !== 'cherry-pick' ? { id: op.id } : {}), ...(op.tag ? { tag: op.tag } : {}), ...(op.msg ? { msg: op.msg } : {}), ...(op.type ? { type: op.type } : {}), ...(op.operation === 'merge' ? { from: op.namedBranch } : op.operation === 'cherry-pick' ? { from: op.id } : {}), parents: [parent, other, picked >= 0 ? picked : undefined].filter((n): n is number => n !== undefined) }
    events.push(event); heads.set(op.branch, events.length - 1)
  }
  return events
}
export function inspectTerminalGit(output: string, contract: TerminalSourceContract) {
  const checks = familyChecks(contract), canvas = new FamilyCanvas(output); if (canvas.error) return checks
  const expected = expectedFact<any>(contract, 'git-operations'), required = expectedHistory(expected), events: Event[] = [], actualBranches = new Set<string>(), rows = canvas.grid.map((row, y) => ({ text: row.join('').trimEnd(), y })).filter(row => row.text.trim())
  if (!rows.length) return checks
  const horizontal = rows.filter(row => /^\s*\S+\s+─/.test(row.text) && /[＊*◎◆]─\[/.test(row.text))
  if (horizontal.length) {
    const tracks = horizontal.map(row => { const m = /^\s*(\S+)\s+─/.exec(row.text)!; return { ...row, name: m[1]!, start: m[0].length - 1 } }), markers: { x: number; track: typeof tracks[number]; symbol: string; text: string; end: number }[] = [], heads = new Map<string, number>()
    for (const track of tracks) { for (const match of track.text.matchAll(/([*◎◆])─\[([^\]]+)\]/g)) markers.push({ x: match.index!, track, symbol: match[1]!, text: match[2]!, end: match.index! + match[0].length - 1 }); canvas.claimRow(track.y) }
    if (new Set(tracks.map(t => t.name)).size !== tracks.length || tracks.some(track => !/^[─┘┐┼]+$/.test(track.text.slice(track.start).replace(/([*◎◆])─\[[^\]]+\]/g, '─')))) return checks
    tracks.forEach(track => actualBranches.add(track.name))
    markers.sort((a, b) => a.x - b.x)
    for (const marker of markers) {
      const { track, x } = marker, merge = /^merged branch (\S+) into (\S+)$/.exec(marker.text), pick = /^cherry-picked (.+) into (\S+)$/.exec(marker.text), previous = heads.get(track.name); let parent = previous
      if (previous === undefined && track.name !== expected.mainBranch) {
        const above = tracks.filter(t => t.y < track.y && t.start < x).sort((a, b) => b.y - a.y).find(t => Array.from({ length: track.y - t.y - 1 }, (_, i) => t.y + i + 1).every(y => canvas.cell(x, y) === '│'))
        if (!above || heads.get(above.name) === undefined) { setFamilyCheck(checks, 'git-operations', 'failed', 'A branch commit lacks a continuous parent-track stem'); return checks }
        parent = heads.get(above.name); for (let y = above.y + 1; y < track.y; y++) canvas.claim(x, y)
      }
      const from = merge?.[1] ?? pick?.[1], operation = merge ? 'merge' : pick ? 'cherry-pick' : 'commit'
      if ((operation === 'commit' && marker.symbol !== '*') || (operation === 'merge' && marker.symbol !== '◎') || (operation === 'cherry-pick' && marker.symbol !== '◆') || (merge?.[2] ?? pick?.[2] ?? track.name) !== track.name) { setFamilyCheck(checks, 'git-operations', 'failed', 'Commit symbol and owned operation caption disagree'); return checks }
      const secondary = operation === 'merge' ? heads.get(from!) : operation === 'cherry-pick' ? events.findIndex(e => e.id === from) : undefined
      if (operation !== 'commit') {
        const sourceEvent = secondary === undefined ? undefined : events[secondary], sourceTrack = sourceEvent && tracks.find(t => t.name === sourceEvent.branch)
        if (!sourceTrack || secondary! < 0 || !Array.from({ length: Math.abs(track.y - sourceTrack.y) - 1 }, (_, i) => Math.min(track.y, sourceTrack.y) + i + 1).every(y => canvas.cell(x, y) === '│') || !['┘', '┐', '┼'].includes(canvas.cell(x, sourceTrack.y))) { setFamilyCheck(checks, 'git-operations', 'failed', 'Merge or cherry-pick provenance lacks its continuous drawn source-track stem'); return checks }
        for (let y = Math.min(track.y, sourceTrack.y) + 1; y < Math.max(track.y, sourceTrack.y); y++) canvas.claim(x, y)
      }
      events.push({ operation, branch: track.name, ...(operation === 'commit' ? { id: marker.text } : { from }), parents: [parent, secondary].filter((n): n is number => n !== undefined) }); heads.set(track.name, events.length - 1)
    }
  } else {
    const heads = new Map<number, number>(), names = new Map<number, string>(), branchTargets = new Set<number>(); let qualified = false
    for (const row of rows) {
      if ([...heads.keys()].some(x => !/[│●◎├┼╯]/.test(row.text[x] ?? ''))) { setFamilyCheck(checks, 'git-operations', 'failed', 'An active branch track has a broken vertical stem'); return checks }
      const match = /^([│●◎├╭╮╯┼─ ]+?)\s{2,}(\S.*)$/.exec(row.text)
      if (match && /[●◎]/.test(match[1]!)) {
        const prefix = match[1]!, symbols = [...prefix].map((glyph, x) => ({ glyph, x })).filter(item => /[●◎]/.test(item.glyph)); if (symbols.length !== 1) return checks
        const node = symbols[0]!, text = match[2]!, tags = [...text.matchAll(/\[([^\]]+)\]/g)].map(m => m[1]!), branches = tags.filter(tag => expected.branches.includes(tag)), labels = text.replace(/\s*\[[^\]]+\]/g, '').trim()
        if (branches.length > 1) return checks
        if (branches[0]) { if (names.has(node.x) && names.get(node.x) !== branches[0]) return checks; names.set(node.x, branches[0]) }
        const parent = heads.get(node.x), right = prefix.indexOf('╯'), secondary = right > node.x ? heads.get(right) : undefined, operation = node.glyph === '◎' ? 'merge' : 'commit'
        if (operation === 'merge' && (secondary === undefined || !/^─+╯$/.test(prefix.slice(node.x + 1)))) { setFamilyCheck(checks, 'git-operations', 'failed', 'Merge marker is detached from its source column'); return checks }
        events.push({ operation, branch: String(node.x), id: labels, ...(tags.find(tag => !branches.includes(tag)) ? { tag: tags.find(tag => !branches.includes(tag)) } : {}), ...(secondary === undefined ? {} : { from: events[secondary]!.branch }), parents: [parent, secondary].filter((n): n is number => n !== undefined) }); heads.set(node.x, events.length - 1); if (operation === 'merge') heads.delete(right); canvas.claimRow(row.y); qualified = true
      } else if (/^[│ ]*├─+╮\s*$/.test(row.text)) {
        const source = row.text.indexOf('├'), target = row.text.indexOf('╮'); if (!heads.has(source) || heads.has(target)) return checks
        heads.set(target, heads.get(source)!); branchTargets.add(target); canvas.claimRow(row.y)
      } else return checks
    }
    if (!qualified) return checks
    const root = Number(events[0]?.branch); if (!names.has(root)) names.set(root, expected.mainBranch)
    if ([...branchTargets].some(x => !names.has(x))) return checks
    names.forEach(name => actualBranches.add(name))
    for (const event of events) { event.branch = names.get(Number(event.branch)) ?? 'unassigned'; if (event.from) event.from = names.get(Number(event.from)) ?? 'unassigned' }
  }
  // Generated merge commit IDs are display labels, not source identities. All
  // explicitly authored IDs, tags, messages, types and provenance stay required.
  if (events.some((event, i) => !required[i]?.id && event.id && !/^commit-?\d+$/.test(event.id))) { setFamilyCheck(checks, 'git-operations', 'failed', 'An anonymous source commit has an unqualified extra caption', events); return checks }
  const canonical = events.map((event, i) => ({ ...event, ...(!required[i]?.id ? { id: undefined } : {}) })), requiredCanonical = required.map(event => ({ ...event, id: event.id }))
  setFamilyCheck(checks, 'git-operations', same(canonical, requiredCanonical) && same([...actualBranches].sort(), [...expected.branches].sort()) && !canvas.leftovers() ? 'passed' : 'failed', 'Owned commit markers, track continuity, branch stems and merge/cherry-pick stems establish chronological parent history; checkout is projected through resulting branch heads', events)
  return checks
}
