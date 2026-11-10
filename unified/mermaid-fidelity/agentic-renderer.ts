import { svgTextValidity } from '../davebench-validity.ts'

interface RendererHooks {
  beforeCall(): void
  called(): void
  refused(): void
  fault(reason: string): never
  unavailable(reason: string): never
  missing(member: string): any
  hasInlineTarget(id: string): boolean
}

/** A renderer-completion observation uses the actual public SVG artefact.
 * Mermaid's mutable bounds and inline DOM protocol are separate capabilities;
 * neither is invented from successful standalone rendering. */
export function agenticRenderer(api: any, hooks: RendererHooks) {
  if (typeof api.renderMermaidSVG !== 'function') return undefined
  const renderer = {
    async draw(source: unknown, id?: string) {
      if (typeof source !== 'string') return hooks.unavailable('Native SVG rendering needs the original source string')
      if (id && hooks.hasInlineTarget(id)) return hooks.unavailable('Native SVG artefact is available; Mermaid inline DOM drawing is not bound')
      hooks.beforeCall()
      hooks.called()
      let svg: unknown
      try { svg = await api.renderMermaidSVG(source) }
      catch (error: any) {
        if (error instanceof TypeError || error instanceof ReferenceError || error instanceof RangeError) return hooks.fault(String(error))
        hooks.refused()
        throw error
      }
      const validity = svgTextValidity(svg as string, source)
      if (!validity.valid) return hooks.fault('Invalid native SVG: ' + validity.reason)
      return svg
    },
  }
  return new Proxy(renderer, { get(target, member) {
    if (member === 'then') return undefined
    return member in target ? Reflect.get(target, member) : hooks.missing(String(member))
  } })
}
