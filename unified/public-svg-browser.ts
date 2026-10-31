/** Browser transport for already prepared public distributions. Each caller
 * declares its own qualification; no source/model facade is inferred. */
export async function publicSvgBrowserAction(input: any): Promise<any> {
  const host = globalThis as any
  if (input.type === 'initialize-module') {
    const api = await import(input.url)
    if (input.kind === 'franken') await api.default({ module_or_path: await (await fetch(input.wasm)).arrayBuffer() })
    else await api.initMerman()
    host.__fidelityCommunity = { kind: input.kind, render: (source: string) => api.renderSvg(source), fontOptions: false }
    return { fontOptions: false }
  }
  if (input.type === 'initialize-global') {
    const api = host[input.engine.global], kind = input.engine.kind
    if (!api) throw Error('Prepared public global is unavailable: ' + input.engine.global)
    const fontSizePath = Array.isArray(input.fontSizePath) && input.fontSizePath.length && input.fontSizePath.every((key: unknown) => typeof key === 'string' && !!key && !['__proto__', 'prototype', 'constructor'].includes(key)) ? input.fontSizePath : undefined
    let render: (source: string, id: string, options?: any) => any, fontOptions = !!fontSizePath
    if (kind === 'mermaid') {
      api.initialize({ startOnLoad: false, securityLevel: 'strict', logLevel: 'fatal' })
      if (input.addonUrl) {
        if (typeof api.registerExternalDiagrams !== 'function') throw Error('Prepared addon requires the public registerExternalDiagrams API')
        const plugin = await import(input.addonUrl)
        await api.registerExternalDiagrams([plugin.default])
      }
      const owner = typeof api.render === 'function' ? api : api.mermaidAPI
      if (!owner || typeof owner.render !== 'function') throw Error('Published Mermaid render API unavailable')
      fontOptions = !input.engine.legacyMermaid
      render = input.engine.legacyMermaid ? (source, id) => new Promise((resolve, reject) => {
        try {
          let callback = false
          const returned = owner.render(id, source, (svg: string) => { callback = true; resolve(svg) })
          if (typeof returned === 'string') resolve(returned)
          else if (returned && typeof returned.then === 'function') returned.then(resolve, reject)
          else if (input.engine.synchronousLegacyRender && !callback) reject(Error('Synchronous public Mermaid render returned no SVG and did not invoke its SVG callback'))
        } catch (error) { reject(error) }
      }) : (source, id) => owner.render(id, source)
    } else if (kind === 'extra') { const publicRender = await api.createRenderer(); fontOptions = false; render = (source, id) => publicRender(source, id, 'svg') }
    else if (kind === 'ondine') { const compiler = await api(); render = (source, _id, options) => compiler.render(source, options).svg }
    else if (kind === 'function') render = (source, _id, options) => api(source, options)
    else if (kind === 'pele') render = (source, _id, options) => api.render(source, options).svg
    else {
      const publicRender = api.renderMermaidSVG ?? api.renderMermaidSVGAsync ?? api.renderMermaidSync ?? api.renderMermaid
      if (typeof publicRender !== 'function') throw Error('Published Beautiful SVG API unavailable')
      render = (source, _id, options) => publicRender.call(api, source, options)
    }
    host.__fidelityCommunity = { kind, api, render, fontOptions, fontSizePath }
    return { fontOptions }
  }
  const state = host.__fidelityCommunity
  if (!state) throw Error('Community public API was not initialized')
  if (input.type === 'configure') { if (state.kind === 'mermaid') state.api.initialize({ startOnLoad: false, securityLevel: 'strict', logLevel: 'fatal' }); return { configured: true } }
  if (input.type === 'measure-docs') {
    let timer: ReturnType<typeof setTimeout> | undefined
    const deadline = new Promise((_, reject) => { timer = setTimeout(() => reject(Error('Public render exceeded15s')), 15_000) })
    try {
      const started = performance.now()
      const value = await Promise.race([Promise.resolve(state.render(input.source, input.id)), deadline])
      const durationMs = performance.now() - started
      const svg = typeof value === 'string' ? value : (value as any)?.svg
      return typeof svg === 'string' && /<svg(?:\s|>)/i.test(svg) ? { status: 'passed', durationMs, bytes: new TextEncoder().encode(svg).byteLength, ...(input.retainSvg ? { svg } : {}) } : { status: 'failed', error: 'Public call did not return SVG' }
    } catch (error) { return { status: 'failed', error: String(error) } }
    finally { if (timer) clearTimeout(timer); host.__communityAfterCall?.(); for (const node of document.querySelectorAll('body > div:not([data-community-host])')) node.remove() }
  }
  if (input.type === 'render') {
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      if (input.options && (!state.fontOptions || Object.keys(input.options).some(key => key !== 'fontSize') || !Number.isFinite(input.options.fontSize) || input.options.fontSize <= 0)) return { kind: 'unavailable', errorName: 'AdapterGap', error: 'No reviewed public configuration translation for this request; no render call executed' }
      let options = input.options
      if (input.options && state.kind !== 'mermaid') {
        options = {}; let target = options
        for (const key of state.fontSizePath.slice(0, -1)) target = target[key] = {}
        target[state.fontSizePath.at(-1)] = input.options.fontSize
      }
      if (state.kind === 'mermaid' && input.options && state.fontOptions) state.api.initialize({ startOnLoad: false, securityLevel: 'strict', logLevel: 'fatal', ...input.options, ...(input.options.fontSize !== undefined ? { themeVariables: { fontSize: String(input.options.fontSize) + 'px' } } : {}) })
      const value = await Promise.race([Promise.resolve().then(() => state.render(input.source, input.id, state.fontOptions ? options : undefined)), new Promise((_, reject) => { timer = setTimeout(() => { const error = Error('Public render did not settle within the declared15s collection deadline'); error.name = 'TimeoutError'; reject(error) }, 15_000) })])
      const svg = typeof value === 'string' ? value : (value as any)?.svg
      if (input.returnSvgString) { if (typeof svg !== 'string') throw Error('Actual public render did not return an SVG string'); return svg }
      return typeof svg === 'string' ? { kind: 'returned', svg } : { kind: 'invalid-return', error: 'Actual public render did not return an SVG string', actualType: typeof value }
    } catch (error: any) { if (input.returnSvgString) throw error; return { kind: 'exception', error: String(error), errorName: error?.name ?? 'Error', errorCode: error?.code ?? null } }
    finally { if (timer) clearTimeout(timer); host.__communityAfterCall?.(); for (const node of document.querySelectorAll('body > div:not([data-community-host])')) node.remove() }
  }
  throw Error('Unknown community fidelity browser action')
}
