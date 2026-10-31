/** Independent transcription of the pinned public theme constants/formulas.
 * No Mermaid module, renderer, model, SVG or retained output is imported.
 * HSL arithmetic below is a separate implementation of CSS color arithmetic.
 * See docs/source-theme-policy.md for exact source locations and role mapping. */
export type SourceThemeName = 'base' | 'default' | 'forest' | 'dark' | 'neutral'
type Hsl = { h: number; s: number; l: number }
const clamp = (value: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, value))
const hsl = (hex: string): Hsl => {
  const full = hex.length === 4 ? '#' + [...hex.slice(1)].map(c => c + c).join('') : hex
  const [r, g, b] = [1, 3, 5].map(at => Number.parseInt(full.slice(at, at + 2), 16) / 255) as [number, number, number]
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, l = (max + min) / 2
  return { h: !d ? 0 : 60 * (max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4), s: !d ? 0 : d / (1 - Math.abs(2 * l - 1)), l }
}
const adjust = (value: Hsl, hue = 0, lightness = 0): Hsl => ({ h: ((value.h + hue) % 360 + 360) % 360, s: value.s, l: clamp(value.l + lightness / 100) })
const rgb = ({ h, s, l }: Hsl): number[] => {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2
  const values = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return values.map(channel => (channel + m) * 255)
}
const hex = (value: Hsl) => '#' + rgb(value).map(channel => Math.round(channel).toString(16).padStart(2, '0')).join('')
export const sourceColorChannels = (hexValue: string) => rgb(hsl(hexValue))
export const sourceBrightness = (channels: number[], factor: number) => channels.map(channel => clamp(channel * factor, 0, 255))
export const sourceOverWhite = (channels: number[], opacity: number) => channels.map(channel => channel * opacity + 255 * (1 - opacity))

export function sourceThemePalette(theme: SourceThemeName, overrides: Record<string, string> = {}) {
  const primary = hsl(({ base: '#fff4dd', default: '#ececff', forest: '#cde498', dark: '#1f2020', neutral: '#eee' } as const)[theme])
  const secondary = theme === 'default' ? hsl('#ffffde') : theme === 'forest' ? hsl('#cdffb2') : theme === 'dark' ? adjust(primary, 0, 16) : adjust(primary, -120)
  const tertiary = theme === 'base' ? adjust(primary, 180, 5) : theme === 'forest' ? adjust(primary, 0, 10) : adjust(primary, -160)
  const hueOffsets = [0, 0, 0, 30, 60, 90, 120]
  let scale: Hsl[]
  if (theme === 'dark') scale = ['#1f2020', '#0b0000', '#4d1037', '#3f5258', '#4f2f1b', '#6e0a0a', '#3b0048'].map(hsl)
  else if (theme === 'neutral') scale = ['#555', '#f4f4f4', '#555', '#bbb', '#777', '#999', '#ddd'].map(hsl)
  else scale = [primary, secondary, tertiary, ...hueOffsets.slice(3).map(hue => adjust(primary, hue))].map(color => adjust(color, 0, theme === 'base' ? -25 : theme === 'forest' ? -10 : -20))
  const labelColors = theme === 'dark' ? Array(7).fill('#d3d3d3') : theme === 'forest' ? Array(7).fill('#000000') : theme === 'neutral' ? ['#f4f4f4', '#333333', '#f4f4f4', '#333333', '#333333', '#333333', '#333333'] : theme === 'default' ? ['#ffffff', '#000000', '#000000', '#ffffff', '#000000', '#000000', '#000000'] : Array(7).fill('#333333')
  const darkScale = ['#1f2020', '#0b0000', '#4d1037', '#3f5258', '#4f2f1b', '#6e0a0a', '#3b0048', '#995a01', '#154706'].map(hsl)
  const neutralScale = ['#555', '#f4f4f4', '#555', '#bbb', '#777', '#999', '#ddd', '#fff', '#ddd'].map(hsl)
  const git = theme === 'dark' ? [adjust(secondary, 0, 20), ...darkScale.slice(2, 6).map(color => adjust(color, 0, 20)), adjust(darkScale[6]!, 0, 10), adjust(darkScale[7]!, 0, 10), adjust(darkScale[8]!, 0, 20)] : theme === 'neutral' ? [adjust(neutralScale[1]!, 0, -25), ...neutralScale.slice(2, 9)] : [primary, secondary, tertiary, ...[-30, -60, -90, 60, 120].map(hue => adjust(primary, hue))].map(color => adjust(color, 0, theme === 'default' ? -50 : -25))
  const gitLabels = theme === 'base' ? Array(8).fill('#333333') : theme === 'dark' ? ['#2c2c2c', '#d3d3d3', '#d3d3d3', '#2c2c2c', '#d3d3d3', '#d3d3d3', '#d3d3d3', '#d3d3d3'] : theme === 'neutral' ? ['#333333', '#ffffff', '#333333', '#ffffff', '#333333', '#333333', '#333333', '#333333'] : ['#ffffff', '#000000', '#000000', '#ffffff', '#000000', '#000000', '#000000', '#000000']
  const gitInverse = git.map((value, index) => {
    // Default's constructor initializes inverse tokens after its first -25
    // pass; `||` preserves them when calculate performs the second -25 pass.
    const initial = theme === 'default' ? adjust(value, 0, 25) : ['base', 'forest'].includes(theme) && overrides['git' + index] ? adjust(hsl(overrides['git' + index]!), 0, -25) : value
    const inverse = { h: (initial.h + 180) % 360, s: initial.s, l: 1 - initial.l }
    const final = theme === 'default' && index === 0 ? adjust(inverse, 0, -25) : inverse
    return { hex: overrides['gitInv' + index] ?? hex(final), channels: overrides['gitInv' + index] ? sourceColorChannels(overrides['gitInv' + index]!) : rgb(final) }
  })
  const peers = scale.map((value, index) => ['default', 'forest'].includes(theme) && index === 1 ? adjust(secondary, 0, -45) : ['default', 'forest'].includes(theme) && index === 2 ? adjust(tertiary, 0, -40) : adjust(value, 0, theme === 'dark' ? 10 : theme === 'base' || theme === 'neutral' ? -10 : theme === 'default' ? -15 : -25))
  return {
    theme,
    fontFamily: '"trebuchet ms", verdana, arial, sans-serif', fontSize: 16,
    scale: scale.map((value, index) => ({ css: overrides['cScale' + index] ?? `hsl(${value.h}, ${value.s * 100}%, ${value.l * 100}%)`, hex: overrides['cScale' + index] ?? hex(value), channels: overrides['cScale' + index] ? sourceColorChannels(overrides['cScale' + index]!) : rgb(value), foreground: overrides['cScaleLabel' + index] ?? labelColors[index], peer: overrides['cScalePeer' + index] ?? hex(peers[index]!), peerChannels: overrides['cScalePeer' + index] ? sourceColorChannels(overrides['cScalePeer' + index]!) : rgb(peers[index]!) })),
    git: git.map((value, index) => ({ hex: overrides['git' + index] ?? hex(value), channels: overrides['git' + index] ? sourceColorChannels(overrides['git' + index]!) : rgb(value), foreground: overrides['gitBranchLabel' + index] ?? gitLabels[index] })),
    gitInverse,
    gitSpecial: { innerFill: overrides.primaryColor ?? hex(primary), innerStroke: overrides.primaryColor ?? hex(primary), reverseStrokeWidth: 3, commitLabelBackground: overrides.commitLabelBackground ?? hex(secondary), commitLabelOpacity: .5, commitLabelForeground: overrides.commitLabelColor ?? hex({ h: (secondary.h + 180) % 360, s: secondary.s, l: 1 - secondary.l }), tagBackground: overrides.tagLabelBackground ?? hex(primary), tagForeground: overrides.tagLabelColor ?? (theme === 'base' ? '#333333' : hex({ h: (primary.h + 180) % 360, s: primary.s, l: 1 - primary.l })) },
    eventBrightness: 1.2,
    quantizationTolerancePerChannel: 1,
  }
}

/** Literal documented redux-color role/rotation palette, not cScale hues. */
export const reduxUsecaseSourcePolicy = {
  role: { actor: { fill: '#F5F3FF', stroke: '#A78BFA', width: 2 }, usecase: { fill: '#F0FDFA', stroke: '#2DD4BF', width: 2 }, include: '#38BDF8', extend: '#FB923C' },
  rotation: [
    { fill: '#FDF4FF', stroke: '#E879F9' }, { fill: '#F0FDFA', stroke: '#2DD4BF' }, { fill: '#FFF7ED', stroke: '#FB923C' }, { fill: '#ECFEFF', stroke: '#22D3EE' },
  ],
  foreground: '#28253D', boundaryTitle: '#000000', fontFamily: '"Recursive Variable", arial, sans-serif', actorFontSize: 14, usecaseFontSize: 12,
  order: 'Actors first in source declaration order, then use cases in their declaration order; boundaries use their own source-order palette cycle',
} as const
