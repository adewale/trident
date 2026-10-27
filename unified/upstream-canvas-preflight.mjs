/** A real native Canvas and jsdom integration witness; never a fake context. */
import { createHash } from 'node:crypto'
import { readFileSync, realpathSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative, resolve, sep } from 'node:path'

if (!process.argv[2]) throw Error('Canvas qualification requires the selected original runtime')
const runtime = realpathSync(resolve(process.argv[2]))
const require = createRequire(join(runtime, 'package.json'))
const jsdomRequire = createRequire(require.resolve('jsdom'))
const canvasRoot = dirname(jsdomRequire.resolve('canvas/package.json'))
const canvas = jsdomRequire('canvas'), { JSDOM } = require('jsdom')
const paint = target => {
  target.width = 2; target.height = 1
  const context = target.getContext('2d')
  if (!context) throw Error('Original runtime has no real Canvas 2D context')
  context.fillStyle = 'rgb(17, 34, 51)'; context.fillRect(0, 0, 1, 1)
  const pixels = [...context.getImageData(0, 0, 2, 1).data]
  if (JSON.stringify(pixels) !== '[17,34,51,255,0,0,0,0]') throw Error('Original Canvas 2D pixel readback failed')
  return pixels
}
const nativePixels = paint(canvas.createCanvas(2, 1))
const dom = new JSDOM('<!doctype html><canvas></canvas>')
let jsdomPixels
try { jsdomPixels = paint(dom.window.document.querySelector('canvas')) } finally { dom.window.close() }
const physicalCanvas = realpathSync(canvasRoot)
const nativeBindings = Object.keys(require.cache).filter(path => path.endsWith('.node') && realpathSync(path).startsWith(physicalCanvas + sep)).sort().map(path => ({ path: relative(runtime, realpathSync(path)), bytes: statSync(path).size, sha256: createHash('sha256').update(readFileSync(path)).digest('hex') }))
if (!nativeBindings.length) throw Error('Original Canvas did not load a physical native binding')
console.log(JSON.stringify({ canvasVersion: JSON.parse(readFileSync(join(canvasRoot, 'package.json'), 'utf8')).version, jsdomVersion: JSON.parse(readFileSync(require.resolve('jsdom/package.json'), 'utf8')).version, node: process.version, nodeExecutable: process.execPath, platform: process.platform, architecture: process.arch, napi: process.versions.napi, modules: process.versions.modules, nativePixels, jsdomPixels, nativeBindings, scope: 'Real Canvas pixel readback and actual jsdom Canvas integration in the selected Node executable. Native addon bytes are bound; external system library/font provenance is not a claim of stock pnpm/platform identity.' }))
