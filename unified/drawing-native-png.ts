import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { JsonLineSession, SessionFailure } from './json-line-session.ts'
import { tridentDirectory } from './trident-paths.ts'

/** Verify the sealed Drawing output bundle (native-flutter/build-drawing.sh): every
 * file, its compiled sources including the drawing target, SDK pin and smoke receipt. */
export function verifiedDrawingBundle(bundle: string) {
  const script = 'import json,sys; from pathlib import Path; sys.path.insert(0,sys.argv[1]); from bundle import verify, DRAWING_TARGET; print(json.dumps(verify(Path(sys.argv[2]).resolve(), target=DRAWING_TARGET)))'
  return JSON.parse(execFileSync('python3', ['-B', '-c', script, join(tridentDirectory, 'native-flutter'), bundle], { encoding: 'utf8', timeout: 30_000, maxBuffer: 4 * 1024 * 1024 }))
}

export type NativePngResult = { outcome: 'completed'; png: Buffer } | { outcome: 'error' | 'invalid' | 'timeout' | 'stopped'; reason: string }

/** Mermaid Flutter's public renderToPng(source, pixelRatio: 1), the DaveBench
 * native PNG boundary, run by the release drawing target on a private Xvfb display.
 * Admission is the same in-app check as DaveBench's; admitted bytes come back. */
export class NativePngDrawingWorker {
  identity: any
  private session?: JsonLineSession
  private sequence = 0
  private readonly bundle: string
  private readonly manifest: any
  constructor(bundle: string, manifest: any) { this.bundle = bundle; this.manifest = manifest }
  private async open() {
    const session = new JsonLineSession(['env', 'LIBGL_ALWAYS_SOFTWARE=1', 'GDK_BACKEND=x11', 'xvfb-run', '-a', '-s', '-screen 0 1280x720x24', join(this.bundle, 'native_bench')], {
      ready: row => { if (row.type !== 'ready') return false; this.identity = row; return true },
      reply: row => row.type === 'result' && Number.isSafeInteger(row.id) && (row.outcome === 'completed' ? typeof row.png === 'string' : row.outcome === 'error' ? typeof row.error === 'string' : row.outcome === 'invalid' && typeof row.invalid === 'string'),
      maxFrameBytes: 96 * 1024 * 1024,
    })
    this.session = session
    await session.ready
    const id = this.identity
    if (id?.package !== 'mermaid_flutter' || id?.version !== this.manifest.packageVersion || id?.mode !== 'release' || id?.target !== 'drawing' || id?.pixelRatio !== 1 || id?.runtime?.platform !== 'linux' || String(id?.runtime?.dart).split(' ')[0] !== String(this.manifest.sdk.dartSdkVersion).split(' ')[0]) throw Error('Native drawing worker identity differs from the pinned release')
  }
  async call(source: string, timeoutMs = 15_000): Promise<NativePngResult> {
    if (!this.session) await this.open()
    try {
      const row = await this.session!.call({ source }, this.sequence++, timeoutMs)
      if (row.outcome === 'completed') return { outcome: 'completed', png: Buffer.from(row.png, 'base64') }
      return { outcome: row.outcome, reason: row.outcome === 'error' ? row.error : row.invalid }
    } catch (error) {
      if (!(error instanceof SessionFailure)) throw error
      if (['protocol', 'transport', 'closed'].includes(error.kind)) throw Error('Unqualified native drawing worker transport: ' + error.message)
      await this.close()
      return { outcome: error.kind === 'timeout' ? 'timeout' : 'stopped', reason: error.message }
    }
  }
  async close() { await this.session?.close(); this.session = undefined }
}
