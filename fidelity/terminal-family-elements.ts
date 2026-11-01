import { FamilyCanvas, contains, expectedFact, familyChecks, familyTitle, same, stable, setFamilyCheck, type FamilyBox } from './terminal-family-canvas.ts'
import { familyRoutes, type FamilyNode } from './terminal-family-routes.ts'
import type { TerminalSourceContract } from './terminal-source.ts'
const sorted = (rows: unknown[]) => rows.map(row => stable(row)).sort()
export function inspectTerminalElements(output: string, contract: TerminalSourceContract) {
  const checks = familyChecks(contract), canvas = new FamilyCanvas(output); if (canvas.error) { checks.forEach(c => c.detail = canvas.error!); return checks }
  familyTitle(canvas, checks)
  const groups = canvas.boxes.filter(box => canvas.boxes.some(child => contains(box, child))), leaves = canvas.boxes.filter(box => !groups.includes(box))
  if (!leaves.length) return checks
  const sourceNodes: any[] = contract.family === 'c4' ? expectedFact(contract, 'c4-elements') : expectedFact(contract, 'architecture-elements').services
  const sourceGroups: any[] = contract.family === 'c4' ? expectedFact(contract, 'groups') ?? [] : expectedFact(contract, 'architecture-elements').groups
  const groupRows: any[] = [], nodeRows: any[] = [], routeNodes: FamilyNode[] = []; let ambiguous = false, unknownRole = false
  const groupIds = new Map<FamilyBox, string>()
  for (const box of groups) {
    const firstChild = Math.min(...canvas.boxes.filter(child => contains(box, child)).map(child => child.y)), text = [box.header, ...box.lines.slice(0, firstChild - box.y - 1)].filter(Boolean).filter(line => !/^\[system\]$/i.test(line)).join(' ').trim()
    const icon = /^\(([^)]+)\)\s*(.+)$/.exec(text) ?? /^\[([^\]]+)\]\s*(.+)$/.exec(text), label = icon?.[2] ?? text
    const match = sourceGroups.filter(g => g.label === label); if (match.length !== 1) { ambiguous = true; continue }
    groupIds.set(box, match[0].id); groupRows.push({ id: match[0].id, label, ...(contract.family === 'architecture' ? { icon: icon?.[1] ?? null, parent: null } : {}) })
    canvas.claimBorder(box); for (let y = box.y + 1; y < firstChild; y++) for (let x = box.x + 1; x < box.right; x++) canvas.claim(x, y)
  }
  for (const box of leaves) {
    let lines = box.lines.filter(Boolean), kind: string | undefined, label = '', description = '', icon: string | undefined
    if (contract.family === 'c4') {
      const roleIndex = lines.findIndex(line => /^(?:«.+»|\[(?:Person|Software System|Container)\])$/.test(line))
      if (roleIndex < 0) { unknownRole = true; continue }
      const role = lines[roleIndex]!, database = box.rounded && lines.some(line => /^[─┬┴┼]+$/.test(line))
      kind = ({ '«Person»': 'Person', '[Person]': 'Person', '«System»': 'System', '[Software System]': box.dashed ? 'System_Ext' : database ? 'SystemDb' : 'System', '«System (external)»': 'System_Ext', '«System (DB)»': 'SystemDb', '«Container»': 'Container', '[Container]': 'Container' } as Record<string, string>)[role]
      label = lines.slice(0, roleIndex).filter(line => !['o', '/|\\', '/ \\'].includes(line) && !/^[─┬┴┼]+$/.test(line)).join(' ')
      description = lines.slice(roleIndex + 1).filter(line => !/^[─┬┴┼]+$/.test(line)).join(' ').replace(/^\[(.*)\]$/, '$1')
    } else {
      const body = lines.join(' '), tagged = /^\[([^\]]+)\]\s+(.+)$/.exec(body), symbols: Record<string, string> = { '☁': 'cloud', '◎': 'internet', '◉': 'database', '▰': 'disk', '🌐': 'internet', '🗄': 'database', '💾': 'disk', '☁️': 'cloud' }
      const glyph = Object.keys(symbols).find(g => body.startsWith(g + ' ')); icon = tagged?.[1] ?? (glyph ? symbols[glyph] : undefined); label = tagged?.[2] ?? (glyph ? body.slice(glyph.length).trim() : body)
    }
    const match = sourceNodes.filter(node => node.label === label); if (match.length !== 1) { ambiguous = true; continue }
    const parentBox = groups.filter(group => contains(group, box)).sort((a, b) => (a.right - a.x) * (a.bottom - a.y) - (b.right - b.x) * (b.bottom - b.y))[0], parent = parentBox ? groupIds.get(parentBox) ?? 'unassigned' : null
    nodeRows.push(contract.family === 'c4' ? { kind, id: match[0].id, label, description, boundary: parent } : { id: match[0].id, icon: icon ?? null, label, parent })
    routeNodes.push({ box, id: match[0].id, label }); canvas.claimBox(box)
  }
  const criterion = contract.family === 'c4' ? 'c4-elements' : 'architecture-elements'
  const observed = contract.family === 'c4' ? sorted(nodeRows) : { groups: sorted(groupRows), services: sorted(nodeRows) }, expected = contract.family === 'c4' ? sorted(sourceNodes) : { groups: sorted(sourceGroups), services: sorted(sourceNodes) }
  const missingIcon = contract.family === 'architecture' && [...groupRows, ...nodeRows].some(row => !row.icon)
  if (!ambiguous && !unknownRole && !missingIcon) setFamilyCheck(checks, criterion, same(observed, expected) ? 'passed' : 'failed', 'Closed containers independently expose role/icon, label, description and actual enclosing group', observed)
  else if (ambiguous) setFamilyCheck(checks, criterion, 'failed', 'Visible containers have a missing, repeated or changed element label', observed)
  else setFamilyCheck(checks, criterion, 'unknown', 'Container representation omits an independently inspectable role or icon', observed)
  if (contract.family === 'c4' && sourceGroups.length) setFamilyCheck(checks, 'groups', same(sorted(groupRows), sorted(sourceGroups)) ? 'passed' : 'failed', 'Closed group walls and the owned header establish boundary identity', groupRows)
  if (routeNodes.length !== leaves.length) return checks
  const route = familyRoutes(canvas, routeNodes), routeCriterion = contract.family === 'c4' ? 'relationships' : 'port-routes'
  if (route.status !== 'passed') setFamilyCheck(checks, routeCriterion, route.status, route.reason, route.routes)
  else {
    const actual = route.routes.map(({ source, target, caption, sourcePort, targetPort }) => ({ source, ...(contract.family === 'architecture' ? { sourcePort, caption, targetPort, target } : { target, caption }) })), required = expectedFact<any[]>(contract, routeCriterion)
    setFamilyCheck(checks, routeCriterion, same(sorted(actual), sorted(required)) ? 'passed' : 'failed', route.reason, actual)
  }
  if (canvas.leftovers()) for (const check of checks) if (check.status === 'passed') { check.status = 'unknown'; check.detail = 'Unassigned ink remains outside the owned element containers and routes' }
  return checks
}
