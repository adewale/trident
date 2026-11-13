export type GlyphWitnessResult =
  | { status: 'proved' }
  | { status: 'unassessed'; stage: string; kind: 'proof-unavailable' | 'observer-error'; reason: string }

/** A positive raster witness for plain SVG text. Counterfactuals use the same
 * browser, loaded fonts, character positions and pixels as the returned SVG.
 * This never guesses text from paths/images or substitutes reference geometry. */
export function glyphWitnessOperation(input: { step: string; labels?: readonly string[] }): any {
  const host = globalThis as any, key = '__tridentGlyphWitness'
  const unavailable = (reason: string): never => { throw Error('GLYPH_PROOF_UNAVAILABLE: ' + reason) }
  if (input.step === 'prepare') {
    if (host[key]) throw Error('Unfinished glyph witness')
    const svg = document.querySelector('svg')
    if (!svg) return unavailable('No SVG root')
    if (devicePixelRatio !== 1) return unavailable('Device pixel ratio must be one')
    if (svg.querySelectorAll('*').length > 2048) return unavailable('Element work limit exceeded')
    if (svg.querySelector('animate,animateTransform,animateMotion,set,image,img,video') || document.getAnimations().length) return unavailable('Animated or image content is outside the glyph profile')
    const normalize = (value: string) => value.normalize('NFC').replace(/\s+/g, '')
    const candidates = [...svg.querySelectorAll('text'), ...svg.querySelectorAll('foreignObject *')]
    const matches = (label: string) => {
      const wanted = normalize(label), exact = candidates.filter(element => normalize(element.textContent ?? '') === wanted)
      // The label policy accepts a contiguous literal within a displayed text
      // run. Prove that entire original run when extra notation surrounds it.
      return exact.length ? exact : candidates.filter(element => normalize(element.textContent ?? '').includes(wanted))
    }
    const found = (input.labels ?? []).map(matches), selected = [...new Set(found.flatMap(elements => elements.map(element => element.closest('foreignObject') ?? element)))] as (SVGTextElement | SVGForeignObjectElement)[]
    if (!input.labels?.length) return unavailable('No required labels')
    if (input.labels.length > 256) return unavailable('Label work limit exceeded')
    if (found.some(elements => !elements.length)) return unavailable('A required label has no original SVG or HTML text match')
    const box = (element: Element) => { const b = element.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height } }
    const root = box(svg), rootStyle = getComputedStyle(svg)
    if ([rootStyle.transform, rootStyle.translate, rootStyle.rotate, rootStyle.scale].some(value => value !== 'none') || ['padding-top','padding-right','padding-bottom','padding-left','border-top-width','border-right-width','border-bottom-width','border-left-width'].some(property => Number.parseFloat(rootStyle.getPropertyValue(property)) !== 0)) return unavailable('SVG root transforms, padding or borders are outside the glyph profile')
    const stage = svg.cloneNode(true) as SVGSVGElement
    const originals = [svg, ...svg.querySelectorAll('*')], copies = [stage, ...stage.querySelectorAll('*')]
    const cloned = new Map<Element, Element>(originals.map((element, index) => [element, copies[index]!]))
    const styled = new Set<Element>()
    const fontProperties = ['font-family','font-size','font-style','font-weight','font-stretch','font-variant','font-feature-settings','font-variation-settings','font-kerning','font-optical-sizing','font-size-adjust','font-synthesis','font-palette','letter-spacing','word-spacing','text-transform','text-rendering','direction','writing-mode','text-orientation','-webkit-font-smoothing','-webkit-text-security']
    const fontSignature = (element: Element, pseudo?: string) => { const css = getComputedStyle(element, pseudo); return JSON.stringify(fontProperties.map(property => css.getPropertyValue(property))) }
    const glyphStyles: { copy: Element; font: string; html: boolean }[] = []
    const hidden: { element: Element; property: 'opacity' | '-webkit-text-fill-color'; style: string | null }[] = []
    const transparent = (color: string) => color === 'transparent' || /^rgba\([^)]*,\s*0(?:\.0*)?\)$/.test(color)
    const plainPseudo = (element: Element) => {
      const css = getComputedStyle(element)
      for (const pseudo of ['::before','::after']) if (!['none','normal'].includes(getComputedStyle(element, pseudo).content)) return false
      const font = fontSignature(element)
      for (const pseudo of ['::first-letter','::first-line']) {
        const style = getComputedStyle(element, pseudo)
        if (fontSignature(element, pseudo) !== font || !transparent(style.backgroundColor) || style.backgroundImage !== 'none' || style.display === 'none' || style.visibility !== 'visible' || Number(style.opacity) !== 1 || style.filter !== 'none' || style.transform !== 'none' || style.clipPath !== 'none' || style.maskImage !== 'none' || ['color','-webkit-text-fill-color','text-decoration-line','text-shadow','-webkit-text-stroke-width'].some(property => style.getPropertyValue(property) !== css.getPropertyValue(property))) return false
      }
      return true
    }
    const styleCopy = (element: Element) => {
      if (styled.has(element)) return
      styled.add(element)
      const copy = cloned.get(element)! as SVGElement, css = getComputedStyle(element)
      for (const property of css) copy.style.setProperty(property, css.getPropertyValue(property), 'important')
      for (const [property, value] of Object.entries({ animation: 'none', transition: 'none', filter: 'none', 'clip-path': 'none', clip: 'auto', mask: 'none', overflow: 'visible', 'text-overflow': 'clip', visibility: 'hidden' })) copy.style.setProperty(property, value, 'important')
    }
    for (const copy of copies) {
      (copy as SVGElement).style.setProperty('visibility', 'hidden', 'important')
      if (copy.localName === 'style') copy.textContent = ''
    }
    const targets: { original: SVGTextElement | SVGForeignObjectElement; clone: SVGTextElement | SVGForeignObjectElement; style: string | null; box: ReturnType<typeof box> }[] = []
    const glyphCanvas = document.createElement('canvas'), glyphContext = glyphCanvas.getContext('2d')!, glyphPresence = new Map<string, boolean>()
    let probePixels = 0
    let padding = 4
    for (const original of selected) {
      const html = original.localName === 'foreignObject'
      if ((!html && (original.querySelector(':not(tspan)') || !(original as SVGTextElement).getNumberOfChars())) || /[\p{Cn}\p{Cs}]/u.test(original.textContent ?? '') || (original.textContent?.length ?? 0) > 1024) return unavailable('Text has unsupported children, characters or length')
      if (html && ([...original.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) || [...original.querySelectorAll('*')].some(element => element.namespaceURI !== 'http://www.w3.org/1999/xhtml' || !['span','div','p','br','b','strong','i','em','code'].includes(element.localName)))) return unavailable('HTML label has unsupported elements or direct foreignObject text')
      for (let owner: Element | null = original; owner; owner = owner.parentElement) {
        const css = getComputedStyle(owner)
        if (css.display === 'none' || css.visibility !== 'visible' || Number(css.opacity) !== 1 || css.filter !== 'none' || css.mixBlendMode !== 'normal') return unavailable('Label ancestor has hidden, translucent, filtered or blended paint')
        styleCopy(owner)
        const copy = cloned.get(owner)! as SVGElement
        copy.style.setProperty('visibility', 'visible', 'important')
        copy.style.setProperty('background-color', 'transparent', 'important')
        copy.style.setProperty('background-image', 'none', 'important')
        copy.style.setProperty('box-shadow', 'none', 'important')
        if (owner === svg) break
      }
      const matrix = original.getScreenCTM()
      let bounds = box(original)
      if (html) {
        const walker = document.createTreeWalker(original, NodeFilter.SHOW_TEXT), rectangles: DOMRect[] = []; let node: Node | null
        while ((node = walker.nextNode())) if (node.textContent?.trim()) { const range = document.createRange(); range.selectNodeContents(node); rectangles.push(...range.getClientRects()) }
        if (!rectangles.length) return unavailable('HTML label has no text rectangles')
        const x = Math.min(...rectangles.map(rectangle => rectangle.x)), y = Math.min(...rectangles.map(rectangle => rectangle.y))
        bounds = { x, y, width: Math.max(...rectangles.map(rectangle => rectangle.right)) - x, height: Math.max(...rectangles.map(rectangle => rectangle.bottom)) - y }
      }
      if (!matrix || ![matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f, ...Object.values(bounds)].every(Number.isFinite) || bounds.width <= 0 || bounds.height <= 0) return unavailable('Label bounds or transform are unavailable')
      const clone = cloned.get(original)! as SVGTextElement | SVGForeignObjectElement
      const sources = [original, ...original.querySelectorAll('*')]
      for (let index = 0; index < sources.length; index++) {
        const source = sources[index]!, copy = cloned.get(source)! as SVGElement | HTMLElement, css = getComputedStyle(source), htmlInk = source.namespaceURI === 'http://www.w3.org/1999/xhtml'
        const glyphMatrix = htmlInk ? matrix : (source as SVGGraphicsElement).getScreenCTM()
        if (!glyphMatrix) return unavailable('Text transform is unavailable')
        const norm = glyphMatrix.a ** 2 + glyphMatrix.b ** 2 + glyphMatrix.c ** 2 + glyphMatrix.d ** 2, determinant = glyphMatrix.a * glyphMatrix.d - glyphMatrix.b * glyphMatrix.c
        const minimumScale = Math.sqrt(Math.max(0, (norm - Math.sqrt(Math.max(0, norm ** 2 - 4 * determinant ** 2))) / 2))
        if (Number.parseFloat(css.fontSize) * minimumScale < 7.5) return unavailable('Transformed glyph size is below the qualified minimum')
        // Opaque, flat source ink admits a direct raster comparison.
        // Paint servers, strokes and effects need another qualified profile.
        if (!/^rgb\([\d\s.,]+\)$/.test(htmlInk ? css.webkitTextFillColor : css.fill) || !htmlInk && Number(css.fillOpacity) !== 1 || Number(css.opacity) !== 1 || css.display === 'none' || css.visibility !== 'visible' || css.contentVisibility !== 'visible' || !(Number.parseFloat(css.fontSize) >= 1) || !htmlInk && css.stroke !== 'none' && Number(css.strokeOpacity) !== 0 && Number.parseFloat(css.strokeWidth) !== 0 || css.textShadow !== 'none' || css.textDecorationLine !== 'none' || css.textTransform !== 'none' || !['', 'none'].includes(css.getPropertyValue('-webkit-text-security'))) return unavailable('Text paint, visibility or typography is outside the glyph profile')
        if (html) {
          if (!transparent(css.backgroundColor) && !/^rgb\([\d\s.,]+\)$/.test(css.backgroundColor) || css.backgroundImage !== 'none' || css.boxShadow !== 'none' || css.filter !== 'none' || css.mixBlendMode !== 'normal' || !['normal','none'].includes(css.content) || css.display.includes('list-item') || htmlInk && [css.transform, css.translate, css.rotate, css.scale].some(value => value !== 'none') || Number.parseFloat(css.webkitTextStrokeWidth) > 0 || ['top','right','bottom','left'].some(side => Number.parseFloat(css.getPropertyValue('border-' + side + '-width')) > 0) || css.outlineStyle !== 'none' && Number.parseFloat(css.outlineWidth) > 0 || !['none','auto'].includes(css.webkitLineClamp)) return unavailable('HTML text has unsupported decoration, background, transform or generated content')
          if (!plainPseudo(source)) return unavailable('HTML pseudo-content or pseudo-typography is outside the glyph profile')
        }
        // A blank missing glyph must not borrow the other letters' pixels.
        // Whitespace has no ink obligation; unsupported zero-ink characters
        // conservatively withhold this witness.
        for (const character of [...new Set([...source.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent ?? '').join(''))].filter(character => !/\s/.test(character))) {
          const font = css.font || `${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`, key = font + '\0' + character
          if (!glyphPresence.has(key)) {
            const size = Math.ceil(Number.parseFloat(css.fontSize) * 4)
            if (!CSS.supports('font', font) || size > 2048 || (probePixels += size * size) > 4_000_000) return unavailable('Font probe is unsupported or exceeds the pixel work limit')
            glyphCanvas.width = glyphCanvas.height = size
            glyphContext.font = font; glyphContext.textBaseline = 'alphabetic'; glyphContext.fillStyle = 'black'
            glyphContext.fillText(character, size / 4, size / 2)
            glyphPresence.set(key, glyphContext.getImageData(0, 0, size, size).data.some((value, index) => index % 4 === 3 && value > 0))
          }
          if (!glyphPresence.get(key)) return unavailable('A non-whitespace character has no independently observed glyph ink')
        }
        const maximumScale = Math.sqrt(Math.max(0, (norm + Math.sqrt(Math.max(0, norm ** 2 - 4 * determinant ** 2))) / 2))
        padding = Math.max(padding, Number.parseFloat(css.fontSize) * maximumScale * 4 + 4)
        styleCopy(source)
        copy.style.setProperty('visibility', 'visible', 'important')
        if (htmlInk) copy.style.setProperty('background-color', 'transparent', 'important')
        glyphStyles.push({ copy, font: fontSignature(source), html })
      }
      // Hide HTML glyph fill without removing its background. Opacity would
      // erase the backdrop too, invalidating the contrast counterfactual.
      const hide = html ? sources.filter(source => source.namespaceURI === 'http://www.w3.org/1999/xhtml') : [original]
      for (const element of hide) hidden.push({ element, property: html ? '-webkit-text-fill-color' : 'opacity', style: element.getAttribute('style') })
      targets.push({ original, clone, style: original.getAttribute('style'), box: bounds })
    }
    // Separate text boxes prevent one word's pixels from certifying another.
    if (targets.some((target, index) => targets.slice(index + 1).some(other => Math.min(target.box.x + target.box.width, other.box.x + other.box.width) - Math.max(target.box.x, other.box.x) > .5 && Math.min(target.box.y + target.box.height, other.box.y + other.box.height) - Math.max(target.box.y, other.box.y) > .5))) return unavailable('Label text boxes overlap')
    const x = Math.floor(Math.min(...targets.map(target => target.box.x)) - padding), y = Math.floor(Math.min(...targets.map(target => target.box.y)) - padding)
    const documentWidth = Math.max(document.documentElement.scrollWidth, document.documentElement.clientWidth, innerWidth), documentHeight = Math.max(document.documentElement.scrollHeight, document.documentElement.clientHeight, innerHeight)
    const width = Math.ceil(Math.max(...targets.map(target => target.box.x + target.box.width)) + padding) - x, height = Math.ceil(Math.max(...targets.map(target => target.box.y + target.box.height)) + padding) - y
    if (![x, y, width, height, padding].every(Number.isFinite) || width <= 0 || height <= 0 || width * height > 4_000_000 || width > 8192 || height > 8192) return unavailable('Complete glyph capture exceeds the pixel or dimension work limit')
    const clip = { x, y, width, height }
    const vx = Math.max(0, x), vy = Math.max(0, y), visibleClip = { x: vx, y: vy, width: Math.min(documentWidth, x + width) - vx, height: Math.min(documentHeight, y + height) - vy }
    if (visibleClip.width <= 0 || visibleClip.height <= 0) return unavailable('Glyph capture is outside the document')
    const shift = { x: Math.max(0, -x), y: Math.max(0, -y) }, maskClip = { x: x + shift.x, y: y + shift.y, width, height }
    for (const [property, value] of Object.entries({ position: 'absolute', left: root.x + 'px', top: root.y + 'px', width: root.width + 'px', height: root.height + 'px', margin: '0', 'z-index': '2147483647', 'pointer-events': 'none', 'background-color': 'transparent' })) stage.style.setProperty(property, value, 'important')
    const backdrop = document.createElement('div')
    backdrop.style.cssText = `all:initial!important;position:absolute!important;left:${maskClip.x}px!important;top:${maskClip.y}px!important;width:${width}px!important;height:${height}px!important;background:white!important;z-index:2147483646!important;pointer-events:none!important;`
    const scene = [...svg.querySelectorAll('*'), svg, document.body, document.documentElement]
    const hiddenProperties = new Map(hidden.map(item => [item.element, item.property]))
    const fingerprint = () => scene.map(element => {
      const css = getComputedStyle(element)
      return JSON.stringify([box(element), [...css].filter(property => property !== hiddenProperties.get(element)).map(property => [property, css.getPropertyValue(property)])])
    }).join('\n')
    const verifyFonts = () => { for (const probe of glyphStyles) if (fontSignature(probe.copy) !== probe.font || probe.html && !plainPseudo(probe.copy)) unavailable('Staging changed glyph typography or pseudo-content') }
    host[key] = { phase: 'prepared', targets, hidden, stage, backdrop, fingerprint, verifyFonts, before: fingerprint(), clip, visibleClip, maskClip, shift, root }
    return { clip, visibleClip, maskClip }
  }
  const state = host[key]
  if (!state) throw Error('Glyph witness was not prepared')
  const cleanup = () => {
    state.stage.remove(); state.backdrop.remove()
    for (const item of state.hidden) if (item.style === null) item.element.removeAttribute('style'); else item.element.setAttribute('style', item.style)
    delete host[key]
  }
  if (input.step === 'cleanup') { cleanup(); return }
  if (input.step === 'hide' && state.phase === 'prepared') {
    for (const item of state.hidden) item.element.style.setProperty(item.property, item.property === 'opacity' ? '0' : 'transparent', 'important')
    if (state.before !== state.fingerprint()) unavailable('Hiding text changed the surrounding scene')
    state.phase = 'hidden'; return
  }
  if (input.step === 'ideal' && state.phase === 'hidden') {
    if (state.before !== state.fingerprint()) unavailable('Hiding text changed the surrounding scene')
    document.body.append(state.stage)
    state.verifyFonts()
    if (state.before !== state.fingerprint()) unavailable('Staging text changed the surrounding scene')
    for (const target of state.targets) {
      if (target.original.localName === 'foreignObject') {
        const nodes = (element: Element) => { const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT), result: Node[] = []; let node: Node | null; while ((node = walker.nextNode())) result.push(node); return result }
        const originals = nodes(target.original), copies = nodes(target.clone)
        if (originals.length !== copies.length) unavailable('HTML glyph inventory changed')
        for (let node = 0; node < originals.length; node++) {
          if (originals[node]!.textContent !== copies[node]!.textContent) unavailable('HTML glyph inventory changed')
          for (let index = 0; index < (originals[node]!.textContent?.length ?? 0); index++) {
            const bounds = (text: Node) => { const range = document.createRange(); range.setStart(text, index); range.setEnd(text, index + 1); return [...range.getClientRects()] }
            const a = bounds(originals[node]!), b = bounds(copies[node]!)
            if (originals[node]!.textContent?.[index]?.trim() && !a.some(box => box.height > 0)) unavailable('HTML character has no observed layout')
            if (a.length !== b.length || a.some((box, offset) => ['x','y','width','height'].some(key => Math.abs((box as any)[key] - (b[offset] as any)[key]) > .01))) unavailable('Staged HTML glyph positions differ')
            if (a.some(rectangle => rectangle.x < state.clip.x || rectangle.y < state.clip.y || rectangle.right > state.clip.x + state.clip.width || rectangle.bottom > state.clip.y + state.clip.height)) unavailable('HTML character is outside the complete capture')
          }
        }
        continue
      }
      const count = target.original.getNumberOfChars(), matrix = target.original.getScreenCTM()!, cloneMatrix = target.clone.getScreenCTM()!
      if (target.clone.getNumberOfChars() !== count) unavailable('Glyph inventory changed')
      for (let index = 0; index < count; index++) {
        const extent = target.original.getExtentOfChar(index)
        for (const [x, y] of [[extent.x, extent.y], [extent.x + extent.width, extent.y], [extent.x, extent.y + extent.height], [extent.x + extent.width, extent.y + extent.height]]) {
          const point = new DOMPoint(x, y).matrixTransform(matrix)
          if (point.x < state.clip.x || point.y < state.clip.y || point.x > state.clip.x + state.clip.width || point.y > state.clip.y + state.clip.height) unavailable('SVG character is outside the complete capture')
        }
      }
      for (let index = 0; index < count; index++) for (const method of ['getStartPositionOfChar', 'getEndPositionOfChar'] as const) {
        const a = target.original[method](index).matrixTransform(matrix), b = target.clone[method](index).matrixTransform(cloneMatrix)
        if (Math.abs(a.x - b.x) > .01 || Math.abs(a.y - b.y) > .01) unavailable('Staged glyph positions differ')
      }
    }
    state.phase = 'ideal'; return
  }
  if (input.step === 'mask' && state.phase === 'ideal') {
    if (state.before !== state.fingerprint()) unavailable('Staging text changed the surrounding scene')
    document.body.append(state.backdrop)
    state.stage.style.setProperty('left', state.root.x + state.shift.x + 'px', 'important')
    state.stage.style.setProperty('top', state.root.y + state.shift.y + 'px', 'important')
    for (const target of state.targets) for (const element of [target.clone, ...target.clone.querySelectorAll('*')]) for (const property of ['fill', 'color', '-webkit-text-fill-color']) element.style.setProperty(property, 'black', 'important')
    state.verifyFonts()
    for (const target of state.targets) {
      const a = target.original.getBoundingClientRect(), b = target.clone.getBoundingClientRect()
      if (Math.abs(a.x + state.shift.x - b.x) > .01 || Math.abs(a.y + state.shift.y - b.y) > .01 || Math.abs(a.width - b.width) > .01 || Math.abs(a.height - b.height) > .01) unavailable('Mask translation changed glyph geometry')
    }
    if (state.before !== state.fingerprint()) unavailable('Masking text changed the surrounding scene')
    state.phase = 'mask'; return { clip: state.clip, visibleClip: state.visibleClip, root: state.root, boxes: state.targets.map((target: any) => target.box) }
  }
  if (input.step === 'restore' && state.phase === 'mask') {
    if (state.before !== state.fingerprint()) unavailable('Masking text changed the surrounding scene')
    state.stage.remove(); state.backdrop.remove()
    for (const item of state.hidden) if (item.style === null) item.element.removeAttribute('style'); else item.element.setAttribute('style', item.style)
    state.phase = 'restored'; return
  }
  throw Error('Invalid glyph witness transition')
}

/** Runs in the browser. The actual pixels must preserve the entire isolated
 * glyph mask and its measured contrast against the unchanged background. */
export async function compareGlyphWitness(input: { images: string[]; clip: any; visibleClip?: any; root: any; boxes: any[] }) {
  const unavailable = (reason: string): never => { throw Error('GLYPH_PROOF_UNAVAILABLE: ' + reason) }
  const decode = async (url: string) => {
    const image = new Image(); image.src = url; await image.decode()
    const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight
    const context = canvas.getContext('2d')!; context.drawImage(image, 0, 0)
    return { width: canvas.width, height: canvas.height, data: context.getImageData(0, 0, canvas.width, canvas.height).data }
  }
  const images = await Promise.all(input.images.map(decode)), [actual, background, ideal, mask, restored] = images
  const visible = input.visibleClip ?? input.clip
  if (!actual || !background || !ideal || !mask || !restored || [actual, background, ideal, restored].some(image => image.width !== visible.width || image.height !== visible.height) || mask.width !== input.clip.width || mask.height !== input.clip.height) return unavailable('Capture dimensions differ')
  const sample = (image: typeof actual, x: number, y: number, channel: number) => x < visible.x || x >= visible.x + visible.width || y < visible.y || y >= visible.y + visible.height ? 255 : image.data[((y - visible.y) * visible.width + x - visible.x) * 4 + channel]!
  const ink = input.boxes.map(() => 0), contours = input.boxes.map(() => 0)
  for (let offset = 0; offset < mask.data.length; offset += 4) {
    const wx = input.clip.x + offset / 4 % mask.width, wy = input.clip.y + Math.floor(offset / 4 / mask.width)
    if ([0, 1, 2].some(channel => Math.abs(sample(actual, wx, wy, channel) - sample(restored, wx, wy, channel)) > 1) || sample(actual, wx, wy, 3) !== sample(restored, wx, wy, 3)) return unavailable('Surrounding scene changed after restoration')
    if (mask.data[offset] !== mask.data[offset + 1] || mask.data[offset] !== mask.data[offset + 2] || mask.data[offset + 3] !== 255 || [actual, background, ideal, restored].some(image => sample(image, wx, wy, 3) !== 255)) return unavailable('Mask is not opaque grayscale or scene alpha is unsupported')
    const alpha = (255 - mask.data[offset]!) / 255
    if (!alpha) {
      if ([0, 1, 2].some(channel => Math.abs(sample(ideal, wx, wy, channel) - sample(background, wx, wy, channel)) > 1)) return unavailable('Isolated label changes pixels outside its glyph mask')
      continue
    }
    const x = wx + .5, y = wy + .5
    if (offset / 4 % mask.width === 0 || offset / 4 % mask.width === mask.width - 1 || offset / 4 < mask.width || offset / 4 >= mask.width * (mask.height - 1)) return unavailable('Glyph ink reaches the complete capture boundary')
    if (x < input.root.x - 1.5 || x > input.root.x + input.root.width + 1.5 || y < input.root.y - 1.5 || y > input.root.y + input.root.height + 1.5) return unavailable('Glyph ink falls outside the SVG canvas')
    // Check the entire antialiased mask. Stronger ink must also have a
    // measurable contrast against the scene with this text removed.
    let contrast = 0
    for (let channel = 0; channel < 3; channel++) {
      if (Math.abs(sample(actual, wx, wy, channel) - sample(ideal, wx, wy, channel)) > 1) return unavailable('Actual glyph pixels differ from the complete unclipped glyphs')
      contrast = Math.max(contrast, Math.abs(sample(ideal, wx, wy, channel) - sample(background, wx, wy, channel)))
    }
    if (alpha >= .25) {
      if (contrast < 8) return unavailable('Glyph contrast against its backdrop is below the qualified minimum')
      input.boxes.forEach((box, index) => { if (x >= box.x - 1 && x <= box.x + box.width + 1 && y >= box.y - 1 && y <= box.y + box.height + 1) ink[index]!++ })
    }
    // A counterfactual alone is insufficient: white text erasing a black
    // glyph-shaped backdrop leaves a blank image. Require the observed glyph
    // contour itself to contrast with every nearby exterior sample.
    if (alpha >= .5) {
      const px = offset / 4 % mask.width, py = Math.floor(offset / 4 / mask.width)
      let boundary = false
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const nx = px + dx, ny = py + dy
        if (nx < 0 || nx >= mask.width || ny < 0 || ny >= mask.height) continue
        const other = (ny * mask.width + nx) * 4
        if (mask.data[other]! < 230) continue
        boundary = true
        if (Math.max(...[0, 1, 2].map(channel => Math.abs(sample(actual, wx, wy, channel) - sample(actual, input.clip.x + nx, input.clip.y + ny, channel)))) < 8) return unavailable('Observed glyph contour lacks independent exterior contrast')
      }
      if (boundary) input.boxes.forEach((box, index) => { if (x >= box.x - 1 && x <= box.x + box.width + 1 && y >= box.y - 1 && y <= box.y + box.height + 1) contours[index]!++ })
    }
  }
  if (!ink.every(count => count > 0) || !contours.every(count => count > 0)) return unavailable('Every label needs observed glyph ink and an independently contrasting contour')
  return true
}

export async function observeGlyphWitness(page: any, labels: readonly string[]): Promise<GlyphWitnessResult> {
  let prepared = false, stage = 'prepare'
  let result: GlyphWitnessResult = { status: 'unassessed', stage, kind: 'observer-error', reason: 'Glyph witness did not finish' }
  const failure = (error: unknown): GlyphWitnessResult => {
    const message = String(error), marker = 'GLYPH_PROOF_UNAVAILABLE: ', index = message.indexOf(marker)
    return { status: 'unassessed', stage, kind: index >= 0 ? 'proof-unavailable' : 'observer-error', reason: (index >= 0 ? message.slice(index + marker.length) : message).split('\n')[0]!.slice(0, 500) }
  }
  try {
    const plan = await page.evaluate(glyphWitnessOperation, { step: stage, labels })
    if (!plan) throw Error('Glyph preparation returned no plan')
    prepared = true
    const images: string[] = [], capture = async (clip = plan.visibleClip) => images.push('data:image/png;base64,' + (await page.screenshot({ fullPage: true, clip, animations: 'disabled' })).toString('base64'))
    stage = 'capture-actual'; await capture()
    stage = 'hide'; await page.evaluate(glyphWitnessOperation, { step: stage }); await capture()
    stage = 'ideal'; await page.evaluate(glyphWitnessOperation, { step: stage }); await capture()
    stage = 'mask'; const geometry = await page.evaluate(glyphWitnessOperation, { step: stage }); await capture(plan.maskClip)
    stage = 'restore'; await page.evaluate(glyphWitnessOperation, { step: stage }); await capture()
    stage = 'compare'
    if (await page.evaluate(compareGlyphWitness, { images, ...geometry }) !== true) throw Error('Glyph comparison did not produce a positive proof')
    result = { status: 'proved' }
  } catch (error) { result = failure(error) }
  finally {
    if (prepared) {
      try { await page.evaluate(glyphWitnessOperation, { step: 'cleanup' }) }
      catch (error) { stage = 'cleanup'; result = failure(error) }
    }
  }
  return result
}
