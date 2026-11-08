import { createHash } from 'node:crypto'

export interface CampaignLane { readonly project: string; readonly version: string; readonly format: string; readonly operand?: Readonly<Record<string, string>> }
export interface CampaignPlan {
  readonly protocol: 'campaign-plan-v1'
  readonly scope: 'full' | 'subset'
  readonly cases: readonly string[]
  readonly lanes: readonly CampaignLane[]
  readonly rounds: number
  readonly inputsSha256: string
  readonly identity: string
}
export const planDigest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const laneKey = (value: { project: string; format: string }) => JSON.stringify([value.project, value.format])
const validLane = (lane: CampaignLane) => lane && (['project', 'version', 'format'] as const).every(key => typeof lane[key] === 'string' && lane[key].length > 0) && (lane.operand === undefined || lane.operand !== null && typeof lane.operand === 'object' && !Array.isArray(lane.operand) && Object.values(lane.operand).every(value => typeof value === 'string' && value.length > 0))

/** Called before preparation, from the selected catalog and reviewed inputs. */
export function campaignPlan(lanes: readonly CampaignLane[], cases: readonly string[], rounds: number, inputs: unknown, scope: CampaignPlan['scope'] = 'full'): CampaignPlan {
  if (!lanes.length || lanes.some(lane => !validLane(lane)) || new Set(lanes.map(laneKey)).size !== lanes.length) throw Error('Campaign needs unique project/format lanes with frozen versions')
  if (!cases.length || cases.some(id => typeof id !== 'string' || !id) || new Set(cases).size !== cases.length) throw Error('Campaign needs unique case IDs')
  if (!Number.isSafeInteger(rounds) || rounds < 1) throw Error('Campaign needs positive rounds')
  const inputsSha256 = planDigest(inputs)
  return Object.freeze({ protocol: 'campaign-plan-v1', scope, cases: Object.freeze([...cases]), lanes: Object.freeze(lanes.map(lane => Object.freeze({ ...lane }))), rounds, inputsSha256, identity: planDigest({ lanes, cases, rounds, inputsSha256, scope }) })
}

/** Every intended lane must be fully accounted for or explicitly blocked.
 * A blocked lane may retain partial observations, but cannot claim a complete run. */
export function assertCampaignCoverage(plan: CampaignPlan, rows: readonly any[], blocked: readonly any[], kind: 'drawing' | 'timing') {
  if (plan.protocol !== 'campaign-plan-v1' || !Array.isArray(plan.lanes) || !plan.lanes.length || !Array.isArray(plan.cases) || !plan.cases.length || plan.cases.some(id => typeof id !== 'string' || !id) || new Set(plan.cases).size !== plan.cases.length || plan.rounds !== (kind === 'drawing' ? 1 : 3) || !/^[a-f0-9]{64}$/.test(plan.identity)) throw Error('Invalid campaign plan')
  if (!['full', 'subset'].includes(plan.scope) || !/^[a-f0-9]{64}$/.test(plan.inputsSha256) || plan.lanes.some(lane => !validLane(lane)) || plan.identity !== planDigest({ lanes: plan.lanes, cases: plan.cases, rounds: plan.rounds, inputsSha256: plan.inputsSha256, scope: plan.scope })) throw Error('Campaign plan identity mismatch')
  const lanes = new Map(plan.lanes.map(lane => [laneKey(lane), lane]))
  if (lanes.size !== plan.lanes.length) throw Error('Duplicate campaign lane')
  const groups = new Map<string, any[]>()
  for (const row of rows) {
    const key = laneKey(row), lane = lanes.get(key)
    if (!lane || row.version !== lane.version) throw Error('Observation differs from planned lane/version: ' + key)
    const group = groups.get(key) ?? []; group.push(row); groups.set(key, group)
  }
  for (const block of blocked) {
    const own = plan.lanes.filter(lane => lane.project === block.project)
    if (!own.length || block.format && String(block.format).split('/').some(format => !own.some(lane => lane.format === format)) || typeof block.reason !== 'string' || !block.reason.trim()) throw Error('Block differs from planned lane or has no reason')
  }
  for (const lane of plan.lanes) {
    const group = groups.get(laneKey(lane)) ?? []
    const ids = group.map(row => kind === 'drawing' ? row.caseId : row.run)
    const expected = kind === 'drawing' ? plan.cases : Array.from({ length: plan.rounds }, (_, i) => i + 1)
    if (new Set(ids).size !== ids.length || ids.some(id => !expected.includes(id))) throw Error('Duplicate or unplanned campaign observation: ' + laneKey(lane))
    if (blocked.some(block => block.project === lane.project && (!block.format || String(block.format).split('/').includes(lane.format)))) continue
    if (ids.length !== expected.length || expected.some(id => !ids.includes(id)) || kind === 'timing' && group.some(row => row.attempted !== plan.cases.length || row.completed + row.failed !== row.attempted)) throw Error('Campaign does not account for planned lane: ' + laneKey(lane))
  }
}

/** Legacy collections carry no plan. Keep their existing observations readable,
 * but never turn an empty envelope into a measured campaign. */
export function assertTimingCollection(collection: any) {
  if (collection.state !== 'complete') throw Error('Wait for rendering campaigns to complete')
  if (!Array.isArray(collection.runs) || !Array.isArray(collection.blocked)) throw Error('Missing campaign outcomes')
  if (/^davebench-(?:simple|terminal|native-png)-v2$/.test(collection.schema) && (!collection.plan || !collection.method?.admissionProfile)) throw Error('New collection requires its campaign plan and admission profile')
  if (collection.plan) {
    if (collection.plan.cases.length !== collection.corpus?.occurrences) throw Error('Campaign plan differs from corpus population')
    assertCampaignCoverage(collection.plan, collection.runs, collection.blocked, 'timing')
  } else if (!collection.runs.length && !collection.blocked.length) throw Error('Empty collection has no accounted-for campaign')
}
