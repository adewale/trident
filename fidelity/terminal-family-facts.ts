import { expectedFact } from './terminal-family-canvas.ts'
import type { TerminalSourceContract } from './terminal-source.ts'
import { inspectTerminalElements } from './terminal-family-elements.ts'
import { inspectTerminalGit } from './terminal-family-git.ts'
import { inspectTerminalHierarchy, inspectTerminalQuadrant } from './terminal-family-hierarchy.ts'
import { inspectTerminalBlock, inspectTerminalPacket } from './terminal-family-layout.ts'
import { inspectTerminalGantt, inspectTerminalZenUml } from './terminal-family-schedule.ts'
import { inspectTerminalXY } from './terminal-family-xy.ts'
/** Family dispatch is finite and independent of renderer identity. Every decoder
 * observes terminal display cells; no source text, AST or reference output is a
 * candidate drawing. Undefined means another dispatcher owns the family. */
export function inspectTerminalFamilyFacts(output: string, contract: TerminalSourceContract) {
  switch (contract.family) {
    case 'c4': case 'architecture': return inspectTerminalElements(output, contract)
    case 'gitgraph': return inspectTerminalGit(output, contract)
    case 'mindmap': case 'treemap': return inspectTerminalHierarchy(output, contract)
    case 'quadrant': return inspectTerminalQuadrant(output, contract)
    case 'block': return inspectTerminalBlock(output, contract)
    case 'packet': return inspectTerminalPacket(output, contract)
    case 'gantt': return inspectTerminalGantt(output, contract)
    case 'zenuml': return inspectTerminalZenUml(output, contract)
    case 'xychart': return inspectTerminalXY(output, contract)
  }
}
export function terminalFamilySourceObservable(contract: TerminalSourceContract) {
  const criteria: Record<string, string[]> = { c4: ['title', 'c4-elements', 'relationships', 'groups'], architecture: ['title', 'architecture-elements', 'port-routes'], gitgraph: ['title', 'git-operations'], mindmap: ['mindmap-hierarchy'], treemap: ['treemap-hierarchy'], quadrant: ['title', 'quadrant-chart'], block: ['block-layout'], packet: ['packet-fields'], gantt: ['title', 'gantt-tasks'], zenuml: ['title', 'zenuml-actors', 'zenuml-calls'], xychart: ['title', 'xy-series'] }
  const supported = criteria[contract.family]; if (!supported || contract.sourceUncertainties.length || contract.facts.some(f => f.required !== false && !supported.includes(f.criterion))) return false
  // Bound source profiles independently of the candidate representation. This
  // records an implemented observer, never an available renderer positive.
  if (contract.family === 'xychart') { const chart = expectedFact<any>(contract, 'xy-series'); return chart.series.length === 1 && chart.series[0].kind === 'bar' && chart.series[0].values.length <= 32 && chart.series[0].values.every((value: number) => Number.isFinite(value) && value >= 0) }
  if (contract.family === 'gitgraph') return expectedFact<any>(contract, 'git-operations').operations.every((op: any) => ['commit', 'branch', 'checkout', 'merge', 'cherry-pick'].includes(op.operation) && !op.msg && !op.type && !op.order)
  if (contract.family === 'gantt') { const schedule = expectedFact<any>(contract, 'gantt-tasks'); return schedule.dateFormat === 'YYYY-MM-DD' && schedule.tasks.length <= 32 && schedule.tasks.every((task: any) => task.startDate && task.endDate && task.durationDays !== null && task.status.every((status: string) => ['done', 'active', 'milestone'].includes(status))) }
  if (contract.family === 'mindmap') { const hierarchy = expectedFact<any[]>(contract, 'mindmap-hierarchy'); return hierarchy.length <= 32 && hierarchy.filter(item => item.parent === null).length === 1 && hierarchy.every(item => item.parent === null ? item.shape === 'circle' : !item.shape) }
  if (contract.family === 'block') return expectedFact<any>(contract, 'block-layout').nodes.every((node: any) => ['rectangle', 'database'].includes(node.shape))
  return true
}
