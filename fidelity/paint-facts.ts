import type { MeaningExpectation } from './meaning.ts'
import type { PaintCheck, PaintEvidence } from './paint.ts'

/** Every independently declared fact is an obligation. An unsupported fact must
 * remain in the plan; a successful labels/topology check cannot stand in for it. */
export const plannedSourceFactCriteria = (input: { expected: MeaningExpectation }) => Object.keys(input.expected.facts ?? {}).sort().map(key => 'source-fact:' + key)

/** A stronger, independently qualified projection may replace an unavailable
 * generic projection. It cannot discard a contrary observed result. */
export function mergePaintChecks(...groups: readonly PaintCheck[][]): PaintCheck[] {
  const indexed = new Map<string, PaintCheck>()
  for (const check of groups.flat()) {
    const previous = indexed.get(check.criterion)
    if (!previous) { indexed.set(check.criterion, check); continue }
    if (previous.status === 'unavailable' && check.status !== 'unavailable') { indexed.set(check.criterion, { ...check, scope: check.scope + ' Earlier unavailable projection: ' + previous.scope }); continue }
    if (previous.status !== 'unavailable' && check.status === 'unavailable') continue
    if (previous.status !== check.status) throw Error('Qualified SVG observers disagree on ' + check.criterion + ': ' + previous.status + ' versus ' + check.status)
    indexed.set(check.criterion, { ...previous, scope: previous.scope + ' Additional agreeing projection: ' + check.scope })
  }
  return [...indexed.values()]
}

/** Runs against retained, mounted SVG. These checks qualify only the named
 * source-fact profiles; unsupported semantics explicitly remain unavailable. */
export function inspectSourceFacts(input: { family: string; source: string; expected: MeaningExpectation; paint: PaintEvidence; quantitative: PaintCheck[] }): PaintCheck[] {
  const svg = document.querySelector('svg'), checks: PaintCheck[] = [], facts: any = input.expected.facts ?? {}
  const add = (key: string, actual: unknown, passed: boolean | null, scope: string) => checks.push({ criterion: 'source-fact:' + key, expected: facts[key], actual, status: passed === null ? 'unavailable' : passed ? 'passed' : 'failed', scope })
  const normalize = (value: string) => value.normalize('NFC').replace(/\s+/g, ' ').trim()
  let uncertainPaint = false
  const uncertainElements = new Set<Element>()
  const color = document.createElement('canvas').getContext('2d')!
  const alpha = (value: string) => { if (value === 'none' || value === 'transparent') return 0; if (/url\(|var\(|context-/.test(value)) { uncertainPaint = true; return null }; color.clearRect(0, 0, 1, 1); color.fillStyle = value; color.fillRect(0, 0, 1, 1); return color.getImageData(0, 0, 1, 1).data[3]! / 255 }
  const simpleClip = (element: Element, owner: Element, setting: string): boolean | null => {
    const id = /#([^\s)"']+)/.exec(setting)?.[1], clip = id ? document.getElementById(decodeURIComponent(id)) : null, children = clip ? [...clip.children] : [], shape = children.length === 1 && ['rect', 'circle', 'ellipse'].includes(children[0]!.localName) ? children[0] as SVGGeometryElement : null, matrix = (owner as SVGGraphicsElement).getScreenCTM?.()
    if (!shape || !matrix || clip?.getAttribute('clipPathUnits') === 'objectBoundingBox' || shape.hasAttribute('transform') || clip?.hasAttribute('transform')) return null
    const b = element.getBoundingClientRect()
    return [[b.x, b.y], [b.right, b.y], [b.x, b.bottom], [b.right, b.bottom]].every(([x, y]) => shape.isPointInFill(new DOMPoint(x, y).matrixTransform(matrix.inverse())))
  }
  const visible = (element: Element) => {
    for (let parent: Element | null = element; parent; parent = parent.parentElement) {
      const css = getComputedStyle(parent)
      if (['defs', 'marker', 'clipPath', 'mask', 'title', 'desc'].includes(parent.localName) || css.display === 'none' || ['hidden', 'collapse'].includes(css.visibility) || Number(css.opacity) === 0) return false
      const clipped = css.clipPath !== 'none' ? simpleClip(element, parent, css.clipPath) : true
      if (clipped === false) return false
      if (css.filter !== 'none' || css.maskImage !== 'none' || clipped === null) { uncertainPaint = true; uncertainElements.add(element); return false }
      if (parent === svg) break
    }
    const b = element.getBoundingClientRect(), css = getComputedStyle(element)
    const fill = alpha(element.namespaceURI === 'http://www.w3.org/2000/svg' ? css.fill : css.color), stroke = alpha(css.stroke)
    if (fill === null || stroke === null) uncertainElements.add(element)
    return b.width > 0 && b.height > 0 && (fill !== null && fill * Number(css.fillOpacity) > 0 || stroke !== null && stroke * Number(css.strokeOpacity) > 0 && Number.parseFloat(css.strokeWidth) > 0)
  }
  const allText = svg ? [...svg.querySelectorAll('text,foreignObject p,foreignObject span,foreignObject div')] : []
  const text = allText.filter(element => visible(element) && ![...element.children].some(child => allText.includes(child) && visible(child) && normalize(child.textContent ?? '') === normalize(element.textContent ?? '')))
  const label = (value: string) => text.filter(element => normalize(element.textContent ?? '') === normalize(value))
  const nodes = input.paint.nodes as { id: string; label: string; box: { x: number; y: number; width: number; height: number }; outline?: { tag: string; vertices?: { x: number; y: number }[] | null; rx: number; ry: number }; style?: { fill: string; fillOpacity: number; stroke: string; strokeOpacity: number; strokeWidth: number; dash: string; opacity: number } }[]
  const nodeById = new Map(nodes.map(node => [node.id, node]))
  const checkById = new Map([...input.paint.checks, ...input.quantitative].map(check => [check.criterion, check]))
  const inside = (outer: { x: number; y: number; width: number; height: number }, inner: DOMRect) => inner.x >= outer.x - 1.5 && inner.y >= outer.y - 1.5 && inner.right <= outer.x + outer.width + 1.5 && inner.bottom <= outer.y + outer.height + 1.5
  // Structural rows need their own paint proof, including fields that were not
  // chosen as the case's convenient display labels. Bounding boxes alone do
  // not prove that a member/type/key is visible through clipping or covers.
  const rowPaint = (elements: Element[]) => elements.every(element => {
    const box = element.getBoundingClientRect()
    if (!svg || !inside(svg.getBoundingClientRect(), box) || !Array.isArray(input.paint.camouflagedText)) return false
    if (input.paint.camouflagedText?.some(item => item.text === normalize(element.textContent ?? '') && Math.abs(item.box.x - box.x) <= 1.5 && Math.abs(item.box.y - box.y) <= 1.5)) return false
    const style = getComputedStyle(element), foreground = element.namespaceURI === 'http://www.w3.org/2000/svg' ? style.fill : style.color
    let opacity = Math.max((alpha(foreground) ?? 0) * Number(style.fillOpacity), (alpha(style.stroke) ?? 0) * Number(style.strokeOpacity))
    for (let parent: Element | null = element; parent; parent = parent.parentElement) {
      const css = getComputedStyle(parent), outer = parent.getBoundingClientRect()
      opacity *= Number(css.opacity)
      if (css.clipPath !== 'none' && simpleClip(element, parent, css.clipPath) !== true || css.maskImage !== 'none' || css.filter !== 'none' || css.clip !== 'auto' || css.mixBlendMode !== 'normal' || ['hidden', 'clip'].includes(css.overflowX) && !inside(outer, box) || ['hidden', 'clip'].includes(css.overflowY) && !inside(outer, box)) return false
      if (parent === svg) break
    }
    if (opacity < 1 / 255) return false
    for (const cover of svg.querySelectorAll('rect,circle,ellipse,polygon,path,image,use,foreignObject')) {
      if (cover.contains(element) || element.contains(cover) || !(element.compareDocumentPosition(cover) & Node.DOCUMENT_POSITION_FOLLOWING)) continue
      if (!visible(cover) && !uncertainElements.has(cover)) continue
      const other = cover.getBoundingClientRect(), css = getComputedStyle(cover)
      if (!['image', 'use', 'foreignObject'].includes(cover.localName) && (alpha(css.fill) === 0 || Number(css.fillOpacity) === 0)) continue
      if (Math.min(box.right, other.right) - Math.max(box.x, other.x) > .5 && Math.min(box.bottom, other.bottom) - Math.max(box.y, other.y) > .5) return false
    }
    return true
  })
  const ownedText = (id: string) => {
    const node = nodeById.get(id)
    return node ? text.filter(element => inside(node.box, element.getBoundingClientRect()) && !nodes.some(other => other.id !== id && other.box.width * other.box.height < node.box.width * node.box.height - 1 && inside(other.box, element.getBoundingClientRect()))) : null
  }
  const bodyText = (id: string, elements: Element[] | null) => {
    const node = nodeById.get(id)
    const header = elements?.filter(element => normalize(element.textContent ?? '') === normalize(node!.label)).sort((a, b) => a.getBoundingClientRect().y - b.getBoundingClientRect().y)[0]
    return elements?.filter(element => element !== header) ?? []
  }
  const ambiguousOwnedText = (id: string) => { const node = nodeById.get(id); return !node || allText.some(element => uncertainElements.has(element) && inside(node.box, element.getBoundingClientRect())) }
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
  const actualShape = (id: string) => {
    const node = nodeById.get(id), outline = node?.outline
    if (!node || !outline) return null
    if (outline.tag === 'rect') return 'rectangle'
    if (['ellipse', 'circle'].includes(outline.tag)) return Math.abs(node.box.width - node.box.height) <= Math.max(1, node.box.width * .01) ? 'circle' : 'ellipse'
    const points = outline.vertices, b = node.box
    if (points?.length === 4) {
      const near = (p: { x: number; y: number }, x: number, y: number) => Math.hypot(p.x - x, p.y - y) <= 1.5
      if ([[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].every(([x, y]) => points.some(point => near(point, x!, y!)))) return 'rectangle'
      if ([[b.x + b.width / 2, b.y], [b.x + b.width, b.y + b.height / 2], [b.x + b.width / 2, b.y + b.height], [b.x, b.y + b.height / 2]].every(([x, y]) => points.some(point => near(point, x!, y!)))) return 'diamond'
    }
    return null
  }
  const cornerRatio = (id: string) => { const node = nodeById.get(id), outline = node?.outline; if (!node || outline?.tag !== 'rect') return null; const values = [outline.rx / node.box.width, outline.ry / node.box.height].filter(Number.isFinite); return values.length === 2 ? Math.max(...values) : null }
  const declaredShapes = [...(Array.isArray(facts['node-shapes']) ? facts['node-shapes'] : []), ...(Array.isArray(facts['node-attributes']) ? facts['node-attributes'].flatMap((entry: any) => typeof entry.attributes?.shape === 'string' ? [{ id: entry.id, shape: ({ rect: 'rectangle', round: 'rounded' } as Record<string, string>)[entry.attributes.shape] ?? entry.attributes.shape }] : []) : [])]
  const shapeMatches = (id: string, wanted: string): boolean | null => {
    const actual = actualShape(id)
    if (!actual) return null
    if (!['rectangle', 'rounded'].includes(wanted)) return actual === wanted
    if (actual !== 'rectangle') return false
    const ratio = cornerRatio(id)
    if (ratio === null) return wanted === 'rectangle' ? true : null
    // A box skin may round ordinary corners. Preserve the authored contrast
    // when rounded and ordinary boxes coexist; a capsule is a different shape.
    if (ratio >= .49) return false
    const opposite = declaredShapes.filter((entry: any) => entry.shape === (wanted === 'rounded' ? 'rectangle' : 'rounded') && entry.id !== id).map((entry: any) => cornerRatio(entry.id))
    if (opposite.some((value: number | null) => value === null)) return null
    return wanted === 'rounded' ? ratio > .01 && opposite.every(value => value !== null && ratio > value + .01) : opposite.every(value => value !== null && ratio + .01 < value)
  }
  for (const key of Object.keys(facts).sort()) {
    if (!svg) { add(key, null, null, 'No mounted SVG is available for the required source fact'); continue }
    if (input.paint.labelRepresentation === 'uninspectable') { add(key, null, null, 'Missing DOM labels alongside path/image/use have no qualified source-owned glyph observer; every declared source fact remains required and unknown'); continue }
    if (key === 'text-line-breaks' && Array.isArray(facts[key])) {
      const ownerKey = (owner: any) => JSON.stringify([owner?.kind, owner?.id ?? null, owner?.index ?? null])
      const partition = (expected: string[], actual: string[]) => { const memo = new Map<string, boolean>(); const visit = (line: number, row: number): boolean => { if (line === expected.length) return row === actual.length; const key = line + ':' + row; if (memo.has(key)) return memo.get(key)!; const matches = actual.slice(row).some((_, offset) => normalize(actual.slice(row, row + offset + 1).join(' ')) === normalize(expected[line]!) && visit(line + 1, row + offset + 1)); memo.set(key, matches); return matches }; return visit(0, 0) }
      let available = true
      const observed = facts[key].map((entry: any) => { const blocks = (input.paint.textLineBlocks ?? []).filter(block => ownerKey(block.owner) === ownerKey(entry.owner)), lines = blocks.length === 1 ? blocks[0]!.lines : null; if (!lines || !Array.isArray(entry.lines) || entry.lines.some((line: any) => typeof line !== 'string' || !normalize(line))) { available = false; return { owner: entry.owner, lines, matches: null } }; return { owner: entry.owner, lines, matches: partition(entry.lines, lines) } })
      add(key, observed, available ? observed.every((entry: any) => entry.matches) : null, 'Source-owned explicit line breaks must partition actual glyph rows in source order; extra soft wrapping between words is allowed but two authored lines cannot collapse onto one row. Raw DOM newlines or matching text elsewhere provide no proof. Empty-line spacing, unsupported roles and ambiguous paint remain unknown')
      continue
    }
    if (['node-paint', 'edge-paint'].includes(key) && Array.isArray(facts[key])) {
      const rgba = (value: string): number[] | null => { if (value === 'none') return [0, 0, 0, 0]; if (/url\(/.test(value)) { const id = /#([^\s)"']+)/.exec(value)?.[1], gradient = id ? document.getElementById(decodeURIComponent(id)) : null, stops = gradient && ['linearGradient', 'radialGradient'].includes(gradient.localName) ? [...gradient.querySelectorAll('stop')] : []; if (!stops.length || !stops.every(stop => getComputedStyle(stop).stopColor === getComputedStyle(stops[0]!).stopColor && Number(getComputedStyle(stop).stopOpacity) === 1)) return null; value = getComputedStyle(stops[0]!).stopColor }; if (!CSS.supports('color', value)) return null; color.clearRect(0, 0, 1, 1); color.fillStyle = value; color.fillRect(0, 0, 1, 1); return [...color.getImageData(0, 0, 1, 1).data] }
      const dash = (value: string) => { const entries = value === 'none' ? [] : value.split(/[ ,]+/).map(Number.parseFloat); if (entries.every(value => value === 0)) return []; return entries.length % 2 ? [...entries, ...entries] : entries }
      // The same finite SVG shadow profile used by the generic paint observer:
      // one feDropShadow composites the untouched SourceGraphic over its shadow.
      const sourcePreservingShadow = (setting: string) => {
        const match = /^url\(["']?#([^\s"')]+)["']?\)$/.exec(setting)
        let filter: Element | null = null
        try { filter = match ? document.getElementById(decodeURIComponent(match[1]!)) : null } catch { return false }
        if (!filter || !svg.contains(filter) || filter.localName !== 'filter' || filter.children.length !== 1 || filter.hasAttribute('href') || filter.hasAttribute('filterRes')) return false
        const shadow = filter.children[0]!
        if (shadow.localName !== 'feDropShadow' || shadow.children.length || ['x','y','width','height'].some(name=>shadow.hasAttribute(name)) || !['','SourceGraphic'].includes(shadow.getAttribute('in')??'') || filter.hasAttribute('filterUnits') && filter.getAttribute('filterUnits') !== 'objectBoundingBox') return false
        const fraction=(name:string,fallback:number)=>{const value=filter!.getAttribute(name);return value===null?fallback:/^[-+]?(?:\d*\.)?\d+%$/.test(value)?Number.parseFloat(value)/100:NaN}
        const x=fraction('x',-.1),y=fraction('y',-.1),width=fraction('width',1.2),height=fraction('height',1.2)
        return x<0&&y<0&&x+width>1&&y+height>1&&getComputedStyle(shadow).display!=='none'
      }
      const carrier = (entry: any, property: 'fill' | 'stroke', style: any, absent: boolean, boundRoute?: any) => {
        if (!svg || checkById.get('paint-opacity-and-color')?.status !== 'passed') return false
        const target: any = key === 'node-paint' ? nodeById.get(entry.id) : boundRoute
        if (!target?.box) return false
        const near = (a: any, b: any) => ['x','y','width','height'].every(k => Math.abs(a[k]-b[k]) <= .25)
        const candidates = [...svg.querySelectorAll('rect,circle,ellipse,path,polygon,line,polyline')].filter(element => !element.closest('defs,marker,clipPath,mask') && near(element.getBoundingClientRect(), target.box) && (!target.outline || element.localName === target.outline.tag) && getComputedStyle(element)[property] === style[property]) as SVGGeometryElement[]
        return candidates.some(element => {
          const css = getComputedStyle(element), ink = rgba(css[property]), fill = rgba(css.fill), stroke = rgba(css.stroke), alpha = (ink?.[3] ?? 0) / 255 * style.opacity * (property === 'fill' ? Number(css.fillOpacity) : Number(css.strokeOpacity)), anyInk = Math.max((fill?.[3] ?? 0)/255*Number(css.fillOpacity), (stroke?.[3] ?? 0)/255*Number(css.strokeOpacity)*(Number.parseFloat(css.strokeWidth)>0?1:0))*style.opacity
          if (absent ? anyInk < 1/255 : alpha < 1/255 || property === 'stroke' && !(Number.parseFloat(css.strokeWidth)>0)) return false
          if (input.paint.camouflagedGeometry?.some(item => item.tag === element.localName && near(item.box, target.box))) return false
          let brightness=1
          for (let owner: Element | null = element; owner; owner = owner.parentElement) { const s=getComputedStyle(owner); if (s.display==='none'||['hidden','collapse'].includes(s.visibility)||Number(s.opacity)===0||s.maskImage!=='none'||s.clipPath!=='none') return false; if(s.filter!=='none'){const match=/^brightness\(([-+.\d]+)(%?)\)$/.exec(s.filter);if(match){const factor=Number(match[1])/(match[2]?100:1);if(!Number.isFinite(factor)||factor<=0)return false;brightness*=factor}else if(!/^drop-shadow\((?:rgba?\([^)]*\)|[^()])*\)$/.test(s.filter)&&!sourcePreservingShadow(s.filter))return false}; if(owner===svg)break }
          if(!absent&&ink&&[0,255].some(end=>ink.slice(0,3).every(channel=>Math.round(Math.min(255,channel*brightness))===end)&&!ink.slice(0,3).every(channel=>channel===end)))return false
          const matrix=element.getScreenCTM(),length=element.getTotalLength(),bounds=element.getBoundingClientRect();if(!matrix||!(length>0))return false
          const points:{x:number;y:number}[]=property==='stroke'||absent?Array.from({length:129},(_,i)=>element.getPointAtLength(length*i/128).matrixTransform(matrix)):[]
          if(property==='fill'&&!absent)for(const x of [.1,.3,.5,.7,.9])for(const y of [.1,.3,.5,.7,.9]){const p=new DOMPoint(bounds.x+bounds.width*x,bounds.y+bounds.height*y),local=p.matrixTransform(matrix.inverse());if(element.isPointInFill(local)&&!element.isPointInStroke(local)&&!allText.some(e=>{const b=e.getBoundingClientRect();return p.x>=b.x&&p.x<=b.right&&p.y>=b.y&&p.y<=b.bottom}))points.push(p)}
          if(!points.length)return false
          const contacts=new Map<Element,{point:{x:number;y:number};clearance:number}>()
          if(key==='edge-paint'&&property==='stroke'&&checkById.get('painted-node-ownership')?.status==='passed'&&checkById.get('painted-relationships')?.status==='passed'&&checkById.get('painted-relationship-markers')?.status==='passed')for(const side of ['start','end'] as const){
            const endpoint=boundRoute?.[side],owner=nodeById.get(side==='start'?boundRoute?.source:boundRoute?.target)
            if(!endpoint)continue
            for(const body of svg.querySelectorAll('rect,circle,ellipse,path,polygon')){const b=body.getBoundingClientRect(),s=getComputedStyle(body);if(owner?.outline&&body.localName===owner.outline.tag&&near(b,owner.box)&&s.fill===owner.style?.fill&&s.stroke===owner.style?.stroke)contacts.set(body,{point:endpoint,clearance:Math.min(8,Math.max(2,Number.parseFloat(s.strokeWidth)/2))})}
            if(!['arrow','triangle'].includes(boundRoute?.[side==='start'?'startMarker':'endMarker'])||getComputedStyle(element)[side==='start'?'markerStart':'markerEnd']!=='none')continue
            const markers=[...svg.querySelectorAll('polygon,path')].filter(shape=>shape!==element&&!shape.closest('defs,marker,clipPath,mask')).flatMap(shape=>{
              const s=getComputedStyle(shape),m=(shape as SVGGraphicsElement).getScreenCTM(),raw=shape.localName==='polygon'?shape.getAttribute('points')??'':/^\s*M\s*[-+.\deE, ]+L\s*[-+.\deE, ]+L\s*[-+.\deE, ]+Z\s*$/.test(shape.getAttribute('d')??'')?(shape.getAttribute('d')??'').replace(/[MLZ]/g,' '):'',numbers=raw.match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi)?.map(Number)??[]
              if(!m||numbers.length!==6||s.fill!==style.stroke||Number(s.fillOpacity)<.999||Number(s.opacity)<.999)return[]
              const vertices=Array.from({length:3},(_,i)=>new DOMPoint(numbers[i*2],numbers[i*2+1]).matrixTransform(m)),distances=vertices.map(p=>Math.hypot(p.x-endpoint.x,p.y-endpoint.y)),local=new DOMPoint(endpoint.x,endpoint.y).matrixTransform(m.inverse())
              return Math.max(...distances)<=16&&(shape as SVGGeometryElement).isPointInFill(local)?[{shape,clearance:Math.min(8,Math.max(2,Math.max(...distances)/2))}]:[]
            })
            if(markers.length===1)contacts.set(markers[0]!.shape,{point:endpoint,clearance:markers[0]!.clearance})
          }
          for(const cover of svg.querySelectorAll('rect,circle,ellipse,path,polygon,image,use,foreignObject')){
            if(cover===element||cover.contains(element)||element.contains(cover)||cover.closest('defs,marker,clipPath,mask')||!(element.compareDocumentPosition(cover)&Node.DOCUMENT_POSITION_FOLLOWING))continue
            const s=getComputedStyle(cover),b=cover.getBoundingClientRect(),f=rgba(s.fill),st=rgba(s.stroke);let opacity=1,shown=true;for(let p:Element|null=cover;p;p=p.parentElement){const c=getComputedStyle(p);opacity*=Number(c.opacity);if(c.display==='none'||['hidden','collapse'].includes(c.visibility))shown=false;if(p===svg)break}
            const fa=(f?.[3]??0)/255*Number(s.fillOpacity)*opacity,sa=Number.parseFloat(s.strokeWidth)>0?(st?.[3]??0)/255*Number(s.strokeOpacity)*opacity:0,complex=['image','use','foreignObject'].includes(cover.localName);if(!shown||opacity===0||!complex&&Math.max(fa,sa)<.999)continue
            const caption=allText.some(e=>{const t=e.getBoundingClientRect();return t.width>0&&t.height>0&&t.x>=b.x&&t.y>=b.y&&t.right<=b.right&&t.bottom<=b.bottom&&b.width*b.height<bounds.width*bounds.height*.98});if(caption)continue
            const m=(cover as SVGGraphicsElement).getScreenCTM?.(),padding=sa>=.999?Number.parseFloat(s.strokeWidth)/2*(m?Math.hypot(m.a,m.b,m.c,m.d):1):0
            const contact=contacts.get(cover)
            if(points.some(p=>(!contact||Math.hypot(p.x-contact.point.x,p.y-contact.point.y)>contact.clearance)&&p.x>=b.x-padding&&p.x<=b.right+padding&&p.y>=b.y-padding&&p.y<=b.bottom+padding&&(complex||!m||!(cover instanceof SVGGeometryElement)||(()=>{const q=new DOMPoint(p.x,p.y).matrixTransform(m.inverse());return fa>=.999&&cover.isPointInFill(q)||sa>=.999&&cover.isPointInStroke(q)})())))return false
          }
          return true
        })
      }
      let available = true, passed = true
      const observed = facts[key].map((entry: any) => {
        const canonicalEdge = (edge: any) => { let source = edge.source, target = edge.target; const arrow = (marker: any) => ['arrow', 'triangle'].includes(marker); if (edge.directed && arrow(edge.startMarker) && !arrow(edge.endMarker)) [source, target] = [target, source]; else if ((!edge.directed || arrow(edge.startMarker) && arrow(edge.endMarker)) && source > target) [source, target] = [target, source]; return JSON.stringify([source, target, edge.directed]) }
        const connections = input.paint.connections as any[], candidates = key === 'edge-paint' ? connections.filter(edge => canonicalEdge(edge) === canonicalEdge(entry.edge) && (!entry.edge.label || edge.labels?.includes(normalize(entry.edge.label)))) : []
        const style = key === 'node-paint' ? nodeById.get(entry.id)?.style : candidates.length === 1 ? candidates[0].style : undefined
        if (!style) { available = false; return { id: entry.id ?? entry.edge, actual: null } }
        const properties = Object.entries(entry.properties).map(([property, expected]: any) => {
          if (['fill', 'stroke'].includes(property)) { const actual = rgba(property === 'fill' ? style.fill : style.stroke), wanted = rgba(expected), multiplier = style.opacity * (property === 'fill' ? style.fillOpacity : style.strokeOpacity), explicitAlpha=/^(?:#[\da-f]{4}|#[\da-f]{8}|transparent|none)$/i.test(String(expected))||/^(?:rgba|hsla)\(/i.test(String(expected))||/\//.test(String(expected)); if (!actual || !wanted || !Number.isFinite(multiplier) || !carrier(entry, property, style, wanted[3]===0, candidates[0])) { available = false; return { property, expected, actual, visibleCarrier:false } }; const effective = [...actual.slice(0, 3), Math.round(actual[3]! * multiplier)]; if ((wanted[3]===0 ? effective[3]!==0 : actual.slice(0,3).some((value,index)=>Math.abs(value-wanted[index]!)>1)) || explicitAlpha&&Math.abs(effective[3]!-wanted[3]!)>1) passed = false; return { property, expected: wanted, actual: effective, comparedAlpha:explicitAlpha, visibleCarrier:true } }
          if (['opacity','fill-opacity','stroke-opacity'].includes(property)) { const wanted=Number(expected),actual=property==='opacity'?style.opacity:property==='fill-opacity'?style.fillOpacity:style.strokeOpacity;if(!Number.isFinite(wanted)||!Number.isFinite(actual))available=false;else if(Math.abs(actual-wanted)>1/255)passed=false;return{property,expected:wanted,actual} }
          if (property === 'stroke-width') { const wanted = Number.parseFloat(expected); if (!Number.isFinite(style.strokeWidth)) available = false; else if (Math.abs(style.strokeWidth - wanted) > .1) passed = false; return { property, expected: wanted, actual: style.strokeWidth } }
          if (property === 'stroke-dasharray') { const actual = dash(style.dash), wanted = dash(expected); if ([...actual, ...wanted].some(value => !Number.isFinite(value))) available = false; else if (!same(actual, wanted)) passed = false; return { property, expected: wanted, actual } }
          available = false; return { property, expected, actual: null }
        })
        return { id: entry.id ?? entry.edge, properties }
      })
      add(key, observed, !passed ? false : available ? true : null, 'Compiled source requests bind actual exposed owned body/route paint. A color-only token compares base RGB without imposing unrequested default alpha; explicitly written color alpha, opacity, source-unit width and dash remain exact. Hidden/covered paint, unsupported filters, unbound bodies and ambiguous parallel routes remain unknown; a separate decisive measured mismatch remains failed.')
      continue
    }
    if (key === 'node-shapes' && Array.isArray(facts[key])) {
      const supported = ['rectangle', 'circle', 'ellipse', 'diamond', 'rounded'], observed = facts[key].map((entry: any) => ({ id: entry.id, expected: entry.shape, actual: actualShape(entry.id), cornerRatio: cornerRatio(entry.id), matches: shapeMatches(entry.id, entry.shape) }))
      add(key, observed, observed.every((entry: any) => supported.includes(entry.expected) && entry.matches !== null) ? observed.every((entry: any) => entry.matches) : null, 'Each source node owns actual rectangle-family, circle/ellipse or four-vertex diamond geometry. Cosmetic rectangle corners are permitted; authored ordinary/rounded boxes must retain a distinct measured radius ratio (0.01 margin), and capsules do not count as rectangles. IDs, CSS class names and model shape strings supply no shape credit; other and compound profiles remain unknown')
      continue
    }
    if (key === 'node-attributes' && Array.isArray(facts[key])) {
      const aliases: Record<string, string> = { rect: 'rectangle', rectangle: 'rectangle', round: 'rounded', rounded: 'rounded', circle: 'circle', ellipse: 'ellipse', diam: 'diamond', diamond: 'diamond' }
      const observed = facts[key].map((entry: any) => ({ id: entry.id, attributes: entry.attributes, shape: actualShape(entry.id), label: nodeById.get(entry.id)?.label }))
      const available = observed.every((entry: any) => entry.label !== undefined && Object.entries(entry.attributes).every(([attribute, value]) => attribute === 'label' ? typeof value === 'string' : attribute === 'shape' && typeof value === 'string' && aliases[value] && shapeMatches(entry.id, aliases[value]!) !== null))
      add(key, observed, available ? observed.every((entry: any) => Object.entries(entry.attributes).every(([attribute, value]) => attribute === 'label' ? normalize(String(value)) === normalize(entry.label) : shapeMatches(entry.id, aliases[String(value)]!) === true)) : null, 'Literal label/primitive-shape attributes bind independently owned visible node bodies. Icons, images, wrapping, business roles, dimensions and other attributes remain required unknowns until their own full projection is qualified')
      continue
    }
    if (key === 'edge-appearance' && Array.isArray(facts[key])) {
      const connections = input.paint.connections as { source: string; target: string; startMarker: string; endMarker: string; strokeWidth?: number; dash?: string; strokePattern?: string }[]
      const observed = facts[key].map((entry: any) => {
        const from = entry.source ?? entry.from, to = entry.target ?? entry.to, candidates = connections.filter(edge => edge.source === from && edge.target === to || edge.source === to && edge.target === from)
        const edge = candidates.length === 1 ? candidates[0]! : null, reverse = edge?.source !== from
        return { ...entry, actual: edge && { width: edge.strokeWidth, stroke: edge.strokePattern === 'solid' || edge.strokePattern === 'dotted' ? edge.strokePattern : edge.strokePattern ? null : !edge.dash || edge.dash === 'none' || /^0(?:px)?(?:[ ,]+0(?:px)?)*$/.test(edge.dash) ? 'solid' : edge.dash.split(/[ ,]+/).every(value => Number.parseFloat(value) > 0) ? 'dotted' : null, markerStart: reverse ? edge.endMarker : edge.startMarker, markerEnd: reverse ? edge.startMarker : edge.endMarker } }
      })
      const ready = checkById.get('painted-relationships')?.status === 'passed' && observed.every((entry: any) => entry.actual && ['solid', 'dotted'].includes(entry.stroke) && entry.actual.stroke)
      add(key, observed, ready ? observed.every((entry: any) => entry.stroke === entry.actual.stroke && (entry.markerStart === undefined || entry.markerStart === entry.actual.markerStart) && (entry.markerEnd === undefined || entry.markerEnd === entry.actual.markerEnd)) : null, 'Every declared solid/dotted edge owns a unique measured route and its actual start/end marker geometry. Parallel endpoint pairs, thick-style relative baselines, animation and compound dash grammars need further evidence')
      continue
    }
    if (['accessibility-title', 'accessibility-description'].includes(key) && typeof facts[key] === 'string') {
      const attribute = key === 'accessibility-title' ? 'aria-labelledby' : 'aria-describedby', direct = key === 'accessibility-title' ? 'aria-label' : 'aria-description'
      const references = (svg.getAttribute(attribute) ?? '').trim().split(/\s+/).filter(Boolean), targets = references.map(id => document.getElementById(id))
      const resolved = references.length ? targets.every(target => target && svg.contains(target)) : svg.hasAttribute(direct)
      const actual = references.length && resolved ? targets.map(target => target!.textContent ?? '').join(' ') : !references.length ? svg.getAttribute(direct) : null
      add(key, { attribute: references.length ? attribute : direct, references, text: actual }, resolved ? normalize(actual ?? '') === normalize(facts[key]) : false, 'The actual standalone SVG accessibility name/description must resolve through its own ARIA references or direct attribute. Arbitrary generated IDs and unrelated metadata earn no credit; this is not a screen-reader compatibility certification')
      continue
    }
    if (key === 'title' && typeof facts.title === 'string') {
      const clipping = checkById.get('unclipped-authored-labels'), clippedTitle = Array.isArray(clipping?.actual) && clipping.actual.includes(facts.title)
      const found = label(facts.title), root = svg.getBoundingClientRect(), captionRoleUnknown = input.expected.edges?.some(edge => edge.label) && !Array.isArray(input.paint.captions)
      const outsideContent = found.filter(element => {
        const layout = element.getBoundingClientRect(), measured = input.paint.textInkBoxes?.filter(item => item.text === normalize(facts.title) && (['x', 'y', 'width', 'height'] as const).every(key => Math.abs(item.layoutBox[key] - layout[key]) <= .25)) ?? []
        // Reuse the generic observer's independently qualified glyph metrics.
        // Font line boxes may extend outside a fully visible title; unsupported
        // glyph representations retain their previous conservative bounds.
        const ink = measured.length === 1 ? measured[0]!.inkBox : null, b = ink ? { ...ink, right: ink.x + ink.width, bottom: ink.y + ink.height } : layout, p = { x: b.x + b.width / 2, y: b.y + b.height / 2 }
        return !input.paint.captions?.some(caption => caption.label === normalize(facts.title) && Math.abs(caption.box.x - layout.x) <= 1.5 && Math.abs(caption.box.y - layout.y) <= 1.5) && !input.paint.camouflagedText?.some(item => item.text === normalize(facts.title) && Math.abs(item.box.x - layout.x) <= 1.5 && Math.abs(item.box.y - layout.y) <= 1.5) && ![...nodes, ...(input.paint.groups ?? [])].some(owner => p.x >= owner.box.x - 1 && p.x <= owner.box.x + owner.box.width + 1 && p.y >= owner.box.y - 1 && p.y <= owner.box.y + owner.box.height + 1) && b.x >= root.x - 1.5 && b.y >= root.y - 1.5 && b.right <= root.right + 1.5 && b.bottom <= root.bottom + 1.5
      })
      add(key, { visibleOccurrences: found.length, unownedTitleOccurrences: outsideContent.length, clipped: clippedTitle }, clippedTitle ? false : clipping?.status !== 'passed' || captionRoleUnknown ? null : outsideContent.length === 1 ? true : uncertainPaint ? null : false, 'The literal title needs its own visible, unclipped occurrence inside the canvas and outside authored node/group bodies and separately owned route captions. SVG metadata, a borrowed node/caption label, hidden text and positive but clipped bounds supply no title credit')
      continue
    }
    if (key === 'members' && input.family === 'class' && Array.isArray(facts.members)) {
      if (facts.annotations?.length || facts.generics?.length) { add(key, null, null, 'Decorated and generic class rows need the complete graph-family ownership projection; the plain member-table profile does not apply'); continue }
      // The colon before a displayed return type is presentation punctuation;
      // visibility, names, argument/return types and access modifiers remain.
      const canonical = (value: string) => {
        const member = normalize(value).replace(/^([+\-#~])\s+/, '$1').replace(/\)\s*:\s*/g, ') ').replace(/\s*:\s*/g, ':')
        if (member.includes('(')) return member
        const access = /^([+\-#~])/.exec(member)?.[1] ?? '', body = member.slice(access.length), name = '[\\p{L}_$][\\p{L}\\p{N}_$]*', type = '[\\p{L}_$][\\p{L}\\p{N}_.$]*(?:<[\\p{L}\\p{N}_.$?,<>\\[\\] ]+>)?(?:\\[\\])*'
        const suffix = new RegExp('^(' + name + '):(' + type + ')$', 'u').exec(body), prefix = new RegExp('^(' + type + ')\\s+(' + name + ')$', 'u').exec(body)
        const compactType = (value: string) => value.replace(/\s*([<>,\[\]])\s*/g, '$1')
        return suffix ? access + suffix[1] + ':' + compactType(suffix[2]!) : prefix ? access + prefix[2] + ':' + compactType(prefix[1]!) : member
      }
      const actual = facts.members.map((entry: any) => {
        const elements = ownedText(entry.id)
        return { id: entry.id, elements, values: elements ? bodyText(entry.id, elements).map(element => normalize(element.textContent ?? '')).filter(Boolean).map(canonical).sort() : null }
      }).sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)))
      const expected = facts.members.map((entry: any) => ({ id: entry.id, values: Array.isArray(entry.values) ? entry.values.map((value: any) => canonical(String(value))).sort() : null })).sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)))
      const profile = expected.every((entry: any) => Array.isArray(entry.values) && entry.values.every((value: string) => !/[~$*]|<<|>>/.test(value))) && actual.every((entry: any) => entry.elements && !ambiguousOwnedText(entry.id) && rowPaint(entry.elements))
      add(key, actual.map(({ elements: _, ...entry }: any) => entry), profile ? same(expected, actual.map(({ elements: _, ...entry }: any) => entry)) : null, 'Exact visible member multiset within each independently owned class body, including access, arguments and return types. Standard UML Type name and name:Type field notation, visibility spacing and return-type colon punctuation are equivalent; names and types preserve case. Generic, abstract/static decorations, clipped/covered rows and unowned bodies need additional qualified projections')
      continue
    }
    if (key === 'attributes' && input.family === 'er' && Array.isArray(facts.attributes)) {
      const actual = facts.attributes.map((entry: any) => {
        const elements = ownedText(entry.id), content = bodyText(entry.id, elements)
        const rows: { y: number; height: number; cells: { x: number; text: string }[] }[] = []
        for (const element of [...content].sort((a, b) => a.getBoundingClientRect().y - b.getBoundingClientRect().y)) {
          const box = element.getBoundingClientRect(), y = box.y + box.height / 2
          const row = rows.find(row => Math.abs(row.y - y) <= Math.max(1.5, Math.min(row.height, box.height) * .35))
          const cell = { x: box.x, text: normalize(element.textContent ?? '') }
          if (row) row.cells.push(cell); else rows.push({ y, height: box.height, cells: [cell] })
        }
        const values = rows.map(row => {
          const cells = row.cells.sort((a, b) => a.x - b.x).map(cell => cell.text), keys = cells[2] && /^(?:PK|FK|UK)(?:\s*,\s*(?:PK|FK|UK))*$/.test(cells[2]) ? cells[2].split(/\s*,\s*/) : []
          return { type: cells[0], name: cells[1], keys, ...(cells.length > (keys.length ? 3 : 2) ? { comment: cells[keys.length ? 3 : 2] } : {}), ...(cells.length < 2 || cells.length > (keys.length ? 4 : 3) ? { unresolved: cells } : {}) }
        })
        return { id: entry.id, elements, values }
      }).sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)))
      const canonical = (entries: any[]) => entries.map(entry => ({ id: entry.id, values: entry.values.map((value: any) => ({ type: normalize(String(value.type)), name: normalize(String(value.name)), keys: [...value.keys].sort(), ...(value.comment !== undefined ? { comment: normalize(String(value.comment)) } : {}) })) })).sort((a, b) => String(a.id).localeCompare(String(b.id)))
      const profile = facts.attributes.every((entry: any) => Array.isArray(entry.values) && entry.values.every((value: any) => typeof value.type === 'string' && typeof value.name === 'string' && Array.isArray(value.keys))) && actual.every((entry: any) => entry.elements && !ambiguousOwnedText(entry.id) && rowPaint(entry.elements) && entry.values.every((value: any) => !value.unresolved))
      add(key, actual.map(({ elements: _, ...entry }: any) => entry), profile ? same(canonical(facts.attributes), canonical(actual)) : null, 'Complete entity-owned attribute rows are read geometrically in row/column order: type, name, key multiset and optional comment. Source identities never substitute for text/table evidence; combined, clipped or ambiguous cells need a separate projection')
      continue
    }
    if (['message-order', 'message-style'].includes(key) && input.family === 'sequence' && Array.isArray(facts[key])) {
      const relations = input.paint.connections as { source: string; target: string; startMarker: string; endMarker: string; startFilled?: boolean; endFilled?: boolean; box?: { y: number; height: number }; labels?: string[]; dash?: string; strokePattern?: string }[]
      const ordered = [...relations].sort((a, b) => (a.box?.y ?? Infinity) - (b.box?.y ?? Infinity))
      const bound = ['painted-relationships', 'painted-relationship-label-counts', 'painted-relationship-label-ownership'].every(criterion => checkById.get(criterion)?.status === 'passed') && ordered.every((edge, index) => edge.box && edge.labels?.length === 1 && (!index || edge.box.y - ordered[index - 1]!.box!.y > 1))
      const actual = ordered.map(edge => {
        const reverse = ['arrow', 'triangle', 'open-arrow'].includes(edge.startMarker) && edge.endMarker === 'none', unprinted = edge.startMarker === 'none' && edge.endMarker === 'none'
        const [from, to] = unprinted ? [edge.source, edge.target].sort() : reverse ? [edge.target, edge.source] : [edge.source, edge.target]
        return { from, to, text: edge.labels?.[0] ?? null, direction: unprinted ? 'unprinted' : 'printed', dash: edge.dash, strokePattern: edge.strokePattern, filled: reverse ? edge.startFilled : edge.endFilled }
      })
      if (key === 'message-order') {
        const project = (message: any, index: number) => ({ from: message.from, to: message.to, text: typeof message.text === 'string' ? normalize(message.text) : message.text ?? null, ...(facts[key][index]?.direction ? { direction: message.direction } : {}) })
        add(key, actual.map(project), bound ? same(facts[key].map(project), actual.map(project)) : null, 'Every message caption owns a measured route, then physical heights establish chronology. Visible arrowheads establish directed endpoints; unheaded lines establish only unordered endpoint pairs. SVG path-writing order and source metadata cannot invent an invisible sender')
      }
      else {
        const supported = facts[key].every((style: any) => ['->>', '-->>', '->', '-->'].includes(style))
        const actualStyle = actual.map(message => { const legacy = message.strokePattern === undefined, solid = message.strokePattern === 'solid' || legacy && (!message.dash || message.dash === 'none' || /^0(?:px)?(?:[ ,]+0(?:px)?)*$/.test(message.dash)), dashed = message.strokePattern === 'dotted' || legacy && message.dash?.split(/[ ,]+/).every(value => Number.parseFloat(value) > 0); return message.direction === 'unprinted' ? solid ? '->' : dashed ? '-->' : null : message.filled === true ? solid ? '->>' : dashed ? '-->>' : null : null })
        add(key, actualStyle, bound && supported && actualStyle.every(Boolean) ? same(facts[key], actualStyle) : null, 'The actual path-length/offset/cap-qualified visible stroke pattern and physical head absence or filled arrowhead are checked on every chronological route. A zero-gap mask is solid; unprojected masks remain unknown. Legacy observations admit only raw none/all-zero or strictly positive dash lists. Open, cross, asynchronous and compound markers remain separate glyph profiles')
      }
      continue
    }
    if (key === 'direction' && input.family === 'flowchart') {
      const direction = String(facts.direction), edges = input.expected.edges ?? [], indegree = new Map((input.expected.nodes ?? []).map(node => [node.id, 0]))
      for (const edge of edges) indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1)
      const remaining = new Map(indegree), ready = [...remaining].filter(([, degree]) => !degree).map(([id]) => id)
      let visited = 0
      for (let index = 0; index < ready.length; index++) { const id = ready[index]!; visited++; for (const edge of edges.filter(edge => edge.source === id)) { const degree = (remaining.get(edge.target) ?? 0) - 1; remaining.set(edge.target, degree); if (!degree) ready.push(edge.target) } }
      const supported = ['TB', 'TD', 'BT', 'LR', 'RL'].includes(direction) && edges.length === indegree.size - 1 && edges.length > 0 && visited === indegree.size && [...indegree.values()].every(degree => degree <= 1) && (input.expected.nodes ?? []).every(node => edges.filter(edge => edge.source === node.id).length <= 1) && !input.expected.groups?.length && !/^\s*(?:direction|subgraph)\s+/im.test(input.source) && edges.every(edge => nodeById.has(edge.source) && nodeById.has(edge.target))
      const actual = edges.map(edge => {
        const a = nodeById.get(edge.source)?.box, b = nodeById.get(edge.target)?.box
        return { source: edge.source, target: edge.target, dx: a && b ? b.x + b.width / 2 - a.x - a.width / 2 : null, dy: a && b ? b.y + b.height / 2 - a.y - a.height / 2 : null }
      })
      add(key, actual, supported ? actual.every(edge => direction === 'LR' ? edge.dx! > 1 : direction === 'RL' ? edge.dx! < -1 : direction === 'BT' ? edge.dy! < -1 : edge.dy! > 1) : null, 'Owned node centers preserve requested order on a connected simple flowchart chain without subgraphs/local overrides. Branches, cycles, isolated nodes and broader global direction hints impose no invented per-edge precedence and remain advisory/unavailable')
      continue
    }
    if (key === 'slices' && input.family === 'pie') {
      const weights = checkById.get('painted-slice-weights')
      add(key, weights?.actual ?? null, weights?.status === 'passed' ? true : weights?.status === 'failed' ? false : null, 'Authored slice labels bind actual arc weights under the qualified pie fraction profile. This proves displayed proportions, not recovery of unprinted absolute quantities')
      continue
    }
    if (key === 'show-data' && input.family === 'pie' && typeof facts[key] === 'boolean' && Array.isArray(facts.slices)) {
      const observed = facts.slices.map((slice: any) => {
        const escaped = String(slice.label).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const pattern = new RegExp('^' + escaped + '\\s*[\\[(]([-+\\d.e]+)(%?)[\\])]$')
        const matches = text.map(element => pattern.exec(normalize(element.textContent ?? ''))).filter(Boolean)
        return { label: slice.label, quantities: matches.map(match => ({ value: Number(match![1]), percent: match![2] === '%' })), expected: slice.value }
      })
      const supported = observed.every((item: any) => item.quantities.length <= 1)
      add(key, observed, supported ? facts[key] ? observed.every((item: any) => item.quantities.length === 1 && !item.quantities[0].percent && Math.abs(item.quantities[0].value - item.expected) < 1e-9) : observed.every((item: any) => item.quantities.every((quantity: any) => quantity.percent)) : null, 'Requested pie data values require exact visible absolute legend quantities. With showData disabled, optional percentages are distinct from absolute data; their values remain subject to the independent fraction observer.')
      continue
    }
    if (key === 'image-requests' && Array.isArray(facts[key])) {
      const imageCheck = checkById.get('embedded-images'), images = Array.isArray(imageCheck?.actual) ? imageCheck!.actual as { href: string; box: { x: number; y: number; width: number; height: number }; loaded: boolean; visible: boolean; clipUnknown: boolean }[] : []
      const actual = facts[key].map((request: any) => ({ ...request, node: nodeById.get(request.id), matches: images.filter(image => image.href === request.href) }))
      const available = imageCheck && actual.every((request: any) => request.node && request.matches.length === 1)
      add(key, actual, available ? imageCheck!.status === 'unavailable' ? null : imageCheck!.status === 'passed' && actual.every((request: any) => request.matches.every((image: any) => image.box.x >= request.node.box.x - 2 && image.box.y >= request.node.box.y - 2 && image.box.x + image.box.width <= request.node.box.x + request.node.box.width + 2 && image.box.y + image.box.height <= request.node.box.y + request.node.box.height + 2)) : null, 'Each exact source asset must decode and occupy its independently owned source node; a matching URL elsewhere or successful model parse supplies no image ownership credit')
      continue
    }
    if (key === 'links' && input.family === 'sankey' && Array.isArray(facts.links)) {
      const weights = checkById.get('painted-link-weights'), camouflage = input.paint.camouflagedGeometry?.some(item => ['path', 'line', 'polyline'].includes(item.tag))
      add(key, weights?.actual ?? null, weights?.status === 'failed' ? false : weights?.status === 'passed' && input.paint.camouflagedGeometry && !camouflage && checkById.get('paint-opacity-and-color')?.status === 'passed' ? true : null, 'Complete endpoint-owned ribbon inventory preserves independently projected relative flow widths with qualified visible paint. Camouflaged or unprojected ribbon paint earns no credit. Unprinted absolute totals are visually equivalent under common scaling; displayed node totals remain separate required facts')
      continue
    }
    if (key === 'values' && input.family === 'treemap' && Array.isArray(facts.values)) {
      const weights = checkById.get('painted-leaf-weights'), owned = facts.values.every((entry: any) => nodeById.has(entry.id))
      add(key, weights?.actual ?? null, owned && weights?.status === 'passed' ? true : weights?.status === 'failed' ? false : null, 'Independently projected sibling/subtree weight fractions bind actual owned areas. Printed values remain separate obligations; a native model total cannot substitute for either visible encoding')
      continue
    }
    if (key === 'hierarchy' && input.family === 'treemap' && Array.isArray(facts.hierarchy)) {
      const observed = facts.hierarchy.map((entry: any) => {
        const node = nodeById.get(entry.id), parents = node ? nodes.filter(other => other.id !== entry.id && other.box.width * other.box.height > node.box.width * node.box.height + 1 && node.box.x >= other.box.x - 1.5 && node.box.y >= other.box.y - 1.5 && node.box.x + node.box.width <= other.box.x + other.box.width + 1.5 && node.box.y + node.box.height <= other.box.y + other.box.height + 1.5).sort((a, b) => a.box.width * a.box.height - b.box.width * b.box.height) : []
        return { id: entry.id, expectedParent: entry.parent, actualParent: parents[0]?.id ?? '', owned: !!node }
      })
      add(key, observed, checkById.get('painted-node-ownership')?.status === 'passed' && observed.every((entry: any) => entry.owned) ? observed.every((entry: any) => entry.expectedParent === entry.actualParent) : null, 'Exact labelled treemap node inventory and smallest enclosing actual rectangle establish immediate parent containment. Logical native hierarchy edges do not require visible arrows; absent/ambiguous bodies remain unknown')
      continue
    }
    if (key === 'displayed-node-values' && input.family === 'sankey' && Array.isArray(facts[key])) {
      const observed = facts[key].map((entry: any) => {
        const node = nodeById.get(entry.id), name = node?.label ?? (input.expected.nodes ?? []).find(node => node.id === entry.id)?.label
        const named = text.filter(element => { const value = normalize(element.textContent ?? ''), b = element.getBoundingClientRect(), owner = node?.box; if (!owner || value !== normalize(String(name)) && !value.startsWith(normalize(String(name)) + ' ')) return false; const gap = Math.max(owner.x - b.right, b.x - owner.x - owner.width, 0), dy = Math.abs(owner.y + owner.height / 2 - b.y - b.height / 2); return gap <= Math.max(12, b.height * .75) && dy <= Math.max(3, b.height * .35) })
        const combined = named.filter(element => normalize(element.textContent ?? '') === normalize(String(name) + ' ' + entry.display))
        return { id: entry.id, display: entry.display, node: !!node, elements: named, namedOccurrences: named.length, occurrences: combined.length }
      })
      const available = observed.every((entry: any) => entry.node && entry.elements.every((element: Element) => rowPaint([element])))
      add(key, observed.map(({ elements: _, ...entry }: any) => entry), available ? observed.every((entry: any) => entry.occurrences === 1 && entry.namedOccurrences === 1) : null, 'Each independently owned Sankey node has one spatially attached label/value block printing source-derived max(incoming,outgoing), rounded to two decimals with the requested prefix/suffix. Free matching numeric text, duplicate labels, source data and ribbon proportions supply no displayed-value credit')
      continue
    }
    if (key === 'displayed-values' && input.family === 'treemap' && Array.isArray(facts[key])) {
      const observed = facts[key].map((entry: any) => {
        const elements = ownedText(entry.id), numeric = bodyText(entry.id, elements).filter(element => /^[-+\d,]+$/.test(normalize(element.textContent ?? '')))
        return { id: entry.id, expected: entry.value, format: entry.format, elements, numeric, actual: numeric.map(element => Number(normalize(element.textContent ?? '').replaceAll(',', ''))) }
      })
      const available = observed.every((entry: any) => entry.elements && rowPaint(entry.elements) && entry.format === ',' && Number.isSafeInteger(entry.expected))
      add(key, observed.map(({ elements: _, numeric: __, ...entry }: any) => entry), available ? observed.every((entry: any) => entry.actual.length === 1 && entry.actual[0] === entry.expected) : null, 'Each owned treemap node prints its independent source value or subtree aggregate. This profile qualifies the default comma-formatted safe integers; other D3/currency/percentage formats need exact formatting projections')
      continue
    }
    if (key === 'show-values' && ['sankey', 'treemap'].includes(input.family) && typeof facts[key] === 'boolean') {
      const displayKey = input.family === 'sankey' ? 'displayed-node-values' : 'displayed-values'
      if (facts[key]) {
        const printed = checks.find(check => check.criterion === 'source-fact:' + displayKey)
        add(key, printed?.actual ?? null, printed?.status === 'passed' ? true : printed?.status === 'failed' ? false : null, 'Requested value printing requires the complete owned displayed-value proof; geometry proportions alone cannot establish printed values')
      } else {
        const extra = text.filter(element => /^[-+\d,.]+$/.test(normalize(element.textContent ?? '')) && !(input.expected.labels ?? []).some(value => normalize(value) === normalize(element.textContent ?? '')))
        const combined = text.filter(element => (input.expected.nodes ?? []).some(node => normalize(element.textContent ?? '').startsWith(normalize(node.label) + ' ') && /^[-+\d,.]+$/.test(normalize(element.textContent ?? '').slice(normalize(node.label).length).trim())))
        add(key, [...extra, ...combined].map(element => normalize(element.textContent ?? '')), combined.length ? false : extra.length === 0 ? true : null, 'Value printing was disabled; an owned node name with an extra numeric value violates that request. Unowned numeric text needs separate role evidence; authored numeric names remain distinct source labels')
      }
      continue
    }
    add(key, null, null, 'No qualified SVG observer verifies this complete source fact: ' + input.family + '/' + key + '. Partial quantitative checks, labels and native models cannot silently satisfy it')
  }
  return checks
}
