import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import type { Page } from 'playwright'
import provenance from '../fixtures/graph-completion/fonts/provenance.json' with { type: 'json' }

// Own the fallback font bytes instead of silently substituting the host OS's
// similarly named typeface. Aliases preserve the unchanged SVG's CSS requests.
const fonts = provenance.fonts.map(record => {
  const bytes = gunzipSync(readFileSync(new URL('../fixtures/graph-completion/fonts/' + record.file, import.meta.url)))
  if (bytes.length !== record.bytes || createHash('sha256').update(bytes).digest('hex') !== record.sha256) throw Error('Retained graph font fixture changed')
  return { weight: record.weight, style: ('style' in record ? record.style : undefined) ?? 'normal', families: ('families' in record ? record.families : undefined) ?? provenance.aliases, source: 'url(data:font/ttf;base64,' + bytes.toString('base64') + ')' }
})
export async function retainedGraphFonts(page: Page) {
  return page.evaluate(async ({ fonts }) => {
    const faces = fonts.flatMap(font => font.families.map(family => new FontFace(family, font.source, { weight: String(font.weight), style: font.style })))
    await Promise.all(faces.map(async face => { await face.load(); document.fonts.add(face) }))
    await document.fonts.ready
    return { loaded: faces.map(face => ({ family: face.family, weight: face.weight, status: face.status })), runs: [...document.querySelectorAll('svg text,svg foreignObject *')].filter(element => element.textContent?.trim()).map(element => { const css = getComputedStyle(element), box = element.getBoundingClientRect();return { text: element.textContent, font: css.font, lineHeight: css.lineHeight, box: { x: box.x, y: box.y, width: box.width, height: box.height } } }) }
  }, { fonts })
}

/** Failure-only measurements for remote CI annotations; these never qualify
 * production paint or change the retained SVG. */
export async function retainedHtmlFontDiagnostics(page: Page) {
  return page.evaluate(() => {
    const canvas=document.createElement('canvas').getContext('2d')!,box=(b:DOMRect)=>({x:b.x,y:b.y,width:b.width,height:b.height})
    const style=(e:Element,pseudo?:string)=>{const s=getComputedStyle(e,pseudo);return{font:s.font,fontFamily:s.fontFamily,fontSize:s.fontSize,fontStyle:s.fontStyle,fontWeight:s.fontWeight,fontVariant:s.fontVariant,fontFeatureSettings:s.fontFeatureSettings,fontVariationSettings:s.fontVariationSettings,fontSizeAdjust:s.fontSizeAdjust,lineHeight:s.lineHeight,direction:s.direction,writingMode:s.writingMode,textTransform:s.textTransform,letterSpacing:s.letterSpacing,wordSpacing:s.wordSpacing,backgroundColor:s.backgroundColor,backgroundImage:s.backgroundImage,boxShadow:s.boxShadow,textShadow:s.textShadow,transform:s.transform,filter:s.filter,mixBlendMode:s.mixBlendMode,maskImage:s.maskImage,textDecorationLine:s.textDecorationLine,strokeWidth:s.webkitTextStrokeWidth,borders:[s.borderTopWidth,s.borderRightWidth,s.borderBottomWidth,s.borderLeftWidth],outlineStyle:s.outlineStyle,outlineWidth:s.outlineWidth,content:s.content}}
    return [...document.querySelectorAll('svg foreignObject')].map(owner=>{
      const walker=document.createTreeWalker(owner,NodeFilter.SHOW_TEXT),runs:unknown[]=[];let node:Node|null
      while((node=walker.nextNode())){
        if(!node.textContent?.trim())continue
        const css=getComputedStyle(node.parentElement!);canvas.font=css.font;canvas.fontKerning=css.fontKerning as CanvasFontKerning
        const m=canvas.measureText(node.textContent),range=document.createRange();range.selectNodeContents(node)
        const probe=document.createElement('div'),marker=document.createElement('span'),value=document.createTextNode(node.textContent)
        probe.style.cssText='all:initial!important;position:fixed!important;left:-100000px!important;top:0!important;display:block!important;white-space:pre!important;'
        for(const [key,value]of Object.entries({font:css.font,'line-height':css.lineHeight,'font-kerning':css.fontKerning,'letter-spacing':css.letterSpacing,'word-spacing':css.wordSpacing,direction:css.direction,'writing-mode':css.writingMode,'text-transform':'none'}))probe.style.setProperty(key,value,'important')
        marker.style.cssText='all:initial!important;display:inline-block!important;width:0!important;height:0!important;margin:0!important;padding:0!important;border:0!important;vertical-align:baseline!important;'
        probe.append(value,marker);document.body.append(probe)
        let baseline:unknown
        try{const r=document.createRange();r.selectNodeContents(value);const b=r.getBoundingClientRect();baseline={cell:box(b),offset:marker.getBoundingClientRect().y-b.y}}finally{probe.remove()}
        runs.push({text:node.textContent,style:style(node.parentElement!),canvas:{width:m.width,left:m.actualBoundingBoxLeft,right:m.actualBoundingBoxRight,ascent:m.actualBoundingBoxAscent,descent:m.actualBoundingBoxDescent,fontAscent:m.fontBoundingBoxAscent,fontDescent:m.fontBoundingBoxDescent},cells:[...range.getClientRects()].map(box),baseline})
      }
      return{text:owner.textContent,box:box(owner.getBoundingClientRect()),styles:[owner,...owner.querySelectorAll('*')].map(e=>({tag:e.localName,css:style(e),pseudos:['::before','::after','::first-letter','::first-line'].map(pseudo=>({pseudo,css:style(e,pseudo)}))})),runs}
    })
  })
}
