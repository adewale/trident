export async function configureSeven(input: { kind: string }) {
  const host = globalThis as any
  if (input.kind === 'beautiful' || input.kind === 'zombie') {
    const api = host[input.kind === 'beautiful' ? 'beautifulMermaid' : 'zombieMermaid']
    if (typeof api?.renderMermaidSVG !== 'function') throw Error('Published renderMermaidSVG API unavailable')
    host.controlledRender = (source: string) => api.renderMermaidSVG(source, {
      font: 'Inter', fontSize: 14, bg: '#fff', fg: '#222', line: '#222',
      accent: '#222', muted: '#222', surface: '#fff', border: '#444',
    })
  } else if (input.kind === 'dart') {
    host.controlledRender = (svg: string) => svg
  } else throw Error('Unexpected additional browser participant')
  const canvas = document.createElement('canvas'), context = canvas.getContext('2d')!
  context.font = '14px Inter'
  return { kind: input.kind, fontProbeWidth: context.measureText('MMMM1111iiii').width, fontFamily: 'Inter', baseFontSize: 14 }
}
