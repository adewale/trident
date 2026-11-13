import { interpretTerminal } from './terminal-display.ts'
import type { TerminalFactCheck } from './terminal-facts.ts'
import type { TerminalSourceContract } from './terminal-source.ts'
export type FamilyBox = { x: number; y: number; right: number; bottom: number; header: string; lines: string[]; rounded: boolean; dashed: boolean }
export const coordinate = (x: number, y: number) => `${x},${y}`
export const contains = (a: FamilyBox, b: FamilyBox) => a.x < b.x && a.y < b.y && a.right > b.right && a.bottom > b.bottom
export const stable = (value: any): string => JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item)
export const same = (a: unknown, b: unknown) => stable(a) === stable(b)
export class FamilyCanvas {
  grid: string[][]; boxes: FamilyBox[] = []; owned = new Set<string>(); error?: string
  constructor(output: string) {
    const display = interpretTerminal(output); this.grid = display.status === 'available' ? display.cells : []
    if (display.status !== 'available') { this.error = display.reason ?? 'Terminal state cannot be inspected'; return }
    if (this.grid.length > 256 || this.grid.some(row => row.length > 512)) { this.error = 'Drawing exceeds the bounded 512 by 256 cell profile'; return }
    const forms = [['┌', '┐', '└', '┘'], ['╭', '╮', '╰', '╯'], ['+', '+', '+', '+']]
    for (let y = 0; y < this.grid.length; y++) for (let x = 0; x < this.grid[y]!.length; x++) {
      const form = forms.find(f => f[0] === this.cell(x, y)); if (!form) continue
      for (let right = x + 2; right < this.grid[y]!.length; right++) {
        if (this.cell(right, y) !== form[1]) continue
        const top = this.grid[y]!.slice(x + 1, right).join('')
        if (!top.trim() || !/^[─┄╌\-+┬┴┼▼▲v^↓↑\p{Letter}\p{Number}\p{Mark}\p{Symbol} ().,\[\]«»/_:]+$/u.test(top)) continue
        for (let bottom = y + 2; bottom < this.grid.length; bottom++) {
          if (this.cell(x, bottom) !== form[2] || this.cell(right, bottom) !== form[3] || !/^[─┄╌\-+┬┴┼▼▲v^↓↑]+$/.test(this.grid[bottom]!.slice(x + 1, right).join(''))) continue
          if (!Array.from({ length: bottom - y - 1 }, (_, i) => y + i + 1).every(row => /^[│|┆╎├┤┼+▶►>◀◄<]$/.test(this.cell(x, row)) && /^[│|┆╎├┤┼+▶►>◀◄<]$/.test(this.cell(right, row)))) continue
          this.boxes.push({ x, y, right, bottom, header: top.replace(/[─┄╌\-+┬┴┼]+/g, ' ').trim(), lines: this.grid.slice(y + 1, bottom).map(row => row.slice(x + 1, right).join('').trim()), rounded: form[0] === '╭', dashed: /[┄╌]/.test(top) }); break
        }
      }
    }
  }
  cell(x: number, y: number) { return this.grid[y]?.[x] ?? ' ' }
  row(y: number) { return (this.grid[y] ?? []).join('') }
  claim(x: number, y: number) { this.owned.add(coordinate(x, y)) }
  claimBox(box: FamilyBox) { for (let y = box.y; y <= box.bottom; y++) for (let x = box.x; x <= box.right; x++) this.claim(x, y) }
  claimBorder(box: FamilyBox) { for (let x = box.x; x <= box.right; x++) { this.claim(x, box.y); this.claim(x, box.bottom) }; for (let y = box.y; y <= box.bottom; y++) { this.claim(box.x, y); this.claim(box.right, y) } }
  claimRow(y: number) { for (let x = 0; x < (this.grid[y]?.length ?? 0); x++) this.claim(x, y) }
  leftovers() { return this.grid.some((row, y) => row.some((cell, x) => cell.trim() && !this.owned.has(coordinate(x, y)))) }
}
export function familyChecks(contract: TerminalSourceContract) { return contract.facts.filter(f => f.required !== false).map(f => ({ criterion: f.criterion, expected: f.expected, status: 'unknown', detail: 'No qualified geometry in this returned representation' } as TerminalFactCheck)) }
export function setFamilyCheck(checks: TerminalFactCheck[], criterion: string, status: TerminalFactCheck['status'], detail: string, actual?: unknown) { const check = checks.find(c => c.criterion === criterion); if (check) Object.assign(check, { status, detail, ...(actual === undefined ? {} : { actual }) }) }
export function familyTitle(canvas: FamilyCanvas, checks: TerminalFactCheck[]) {
  const check = checks.find(c => c.criterion === 'title'); if (!check) return
  const rows = canvas.grid.map((row, y) => ({ text: row.join('').trim(), y })).filter(row => row.text && !canvas.boxes.some(box => row.y >= box.y && row.y <= box.bottom))
  const hits = rows.filter(row => row.text.normalize('NFC') === String(check.expected).normalize('NFC'))
  if (hits.length === 1) { canvas.claimRow(hits[0]!.y); Object.assign(check, { status: 'passed', detail: 'One visible title row outside the drawing containers' }) }
  else if (canvas.boxes.length) Object.assign(check, { status: 'failed', detail: 'Drawing has no unique visible authored title row' })
}
export const expectedFact = <T = any>(contract: TerminalSourceContract, criterion: string) => contract.facts.find(f => f.criterion === criterion)?.expected as T
