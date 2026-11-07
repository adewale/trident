import { interpretTerminal, type TerminalDisplay } from './terminal-display.ts'
import { terminalRectangles, TerminalRectangleBudgetExceeded, type ContainerProfile, type TerminalRectangle } from './terminal-rectangles.ts'

/** Facts belong to one exact output. Expectations never enter this cache.
 * Different display bounds and container profiles remain different observations. */
export function terminalObservation(output: string, workBudget = 10_000_000) {
  if (!Number.isFinite(workBudget) || workBudget <= 0) throw Error('Terminal work budget must be finite and positive')
  const displays = new Map<string, TerminalDisplay>()
  const rectangles = new WeakMap<TerminalDisplay, Map<string, TerminalRectangle[]>>()
  let remaining = workBudget
  const charge = (work: number) => { if ((remaining -= work) < 0) throw new TerminalRectangleBudgetExceeded('Terminal rectangle observation budget exceeded') }
  return {
    assertOutput(value: string) { if (value !== output) throw Error('Terminal observation belongs to another output') },
    display(bounds = { columns: 1024, rows: 512, inputBytes: 500_000 }) {
      const key = JSON.stringify(bounds)
      let display = displays.get(key)
      if (!display) {
        display = interpretTerminal(output, bounds)
        for (const row of display.cells) Object.freeze(row)
        Object.freeze(display.cells); Object.freeze(display)
        displays.set(key, display)
      }
      return display
    },
    rectangles(display: TerminalDisplay, profile: ContainerProfile) {
      if (![...displays.values()].includes(display)) throw Error('Foreign terminal display observation')
      const key = JSON.stringify([profile.horizontal.source, profile.horizontal.flags, profile.vertical.source, profile.vertical.flags, !!profile.primitives, !!profile.ports, !!profile.cornerPorts])
      const cache = rectangles.get(display) ?? new Map<string, TerminalRectangle[]>()
      let boxes = cache.get(key)
      if (!boxes) {
        boxes = terminalRectangles(display.cells, profile, charge)
        cache.set(key, boxes); rectangles.set(display, cache)
      }
      // Assessors may attach source identities. Those assignments cannot contaminate facts.
      return boxes.map(box => ({ ...box, lines: [...box.lines] }))
    },
  }
}
export type TerminalObservation = ReturnType<typeof terminalObservation>
