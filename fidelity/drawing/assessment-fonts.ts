import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'

/** The fonts of the machine that judged SVG labels. Clipping and glyph proofs
 * depend on which faces the browser can draw, so a result states them. */
export type AssessmentFonts =
  | { source: 'fc-list : family'; families: string[]; sha256: string }
  | { source: 'fc-list : family'; unavailable: string }

/** fontconfig family lines, sorted and deduplicated; sha256 is over the lines
 * joined by "\n". */
export function fontconfigFamilies(output: string) {
  const families = [...new Set(output.split('\n').map(line => line.trim()).filter(Boolean))].sort()
  return { families, sha256: createHash('sha256').update(families.join('\n')).digest('hex') }
}

export function assessmentFonts(): AssessmentFonts {
  try {
    return { source: 'fc-list : family', ...fontconfigFamilies(execFileSync('fc-list', [':', 'family'], { encoding: 'utf8', timeout: 10_000, maxBuffer: 16 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] })) }
  } catch (error) {
    return { source: 'fc-list : family', unavailable: 'fontconfig family list could not be read: ' + String(error).slice(0, 200) }
  }
}
