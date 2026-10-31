import { expect, test } from 'bun:test'
import { reduxUsecaseSourcePolicy, sourceBrightness, sourceColorChannels, sourceOverWhite, sourceThemePalette } from '../fidelity/theme-source-policy.ts'

test('independent CSS arithmetic preserves literal primaries and alpha composition', () => {
  expect(sourceColorChannels('#ff0000')).toEqual([255, 0, 0])
  expect(sourceColorChannels('#000')).toEqual([0, 0, 0])
  expect(sourceColorChannels('#fff')).toEqual([255, 255, 255])
  expect(sourceBrightness([255, 203.5, 93.5], 1.2)).toEqual([255, 244.2, 112.2])
  expect(sourceOverWhite([255, 0, 0], .3)).toEqual([255, 178.5, 178.5])
})
test('source palette formulae retain literal neutral/dark and algebraic forest constraints', () => {
  expect(sourceThemePalette('neutral').scale.map(item => item.hex)).toEqual(['#555555', '#f4f4f4', '#555555', '#bbbbbb', '#777777', '#999999', '#dddddd'])
  expect(sourceThemePalette('dark').scale[0]!.hex).toBe('#1f2020')
  // forest tertiary lightness +10 followed by palette -10 restores the literal primary.
  expect(sourceThemePalette('forest').scale[2]!.hex).toBe('#cde498')
  const base = sourceThemePalette('base').scale[0]!
  expect(base.channels[0]).toBe(255)
  expect(Math.abs(base.channels[1]! - 202.75)).toBeLessThan(1e-8)
  expect(Math.abs(base.channels[2]! - 93.5)).toBeLessThan(1e-8)
})
test('explicit source overrides win after derived theme arithmetic', () => {
  const value = sourceThemePalette('default', { cScale0: '#ff0000', cScaleLabel0: '#ffffff', git0: '#00ff00', gitBranchLabel0: '#000000' })
  expect(value.scale[0]).toMatchObject({ hex: '#ff0000', foreground: '#ffffff', channels: [255, 0, 0] })
  expect(value.git[0]).toMatchObject({ hex: '#00ff00', foreground: '#000000', channels: [0, 255, 0] })
})
test('redux role color semantics differ from the independent rotation cycle', () => {
  expect(reduxUsecaseSourcePolicy.role.actor).toMatchObject({ fill: '#F5F3FF', stroke: '#A78BFA' })
  expect(reduxUsecaseSourcePolicy.role.usecase).toMatchObject({ fill: '#F0FDFA', stroke: '#2DD4BF' })
  expect(reduxUsecaseSourcePolicy.rotation[0]).toEqual({ fill: '#FDF4FF', stroke: '#E879F9' })
  expect(reduxUsecaseSourcePolicy.rotation[2]).toEqual({ fill: '#FFF7ED', stroke: '#FB923C' })
})

test('git special glyph colors preserve source first-pass inverse initialization', () => {
  expect(sourceThemePalette('base').gitInverse[0]!.channels.map(Math.round)).toEqual([0, 52, 162])
  expect(sourceThemePalette('default').gitInverse[0]!.channels.map(Math.round)).toEqual([19, 19, 0])
  expect(sourceThemePalette('default').gitSpecial).toMatchObject({ innerFill: '#ececff', reverseStrokeWidth: 3, commitLabelOpacity: .5 })
  expect(sourceThemePalette('neutral').gitSpecial.innerFill).toBe('#eeeeee')
})

test('unqualified arithmetic color syntaxes never produce invented NaN palette colors', () => {
  for (const value of ['red', 'rgb(255, 0, 0)', '#abcd', '#gg0000']) {
    expect(() => sourceColorChannels(value)).toThrow(RangeError)
    expect(() => sourceThemePalette('base', { cScale0: value })).toThrow(RangeError)
  }
  expect(sourceThemePalette('base', { cScaleLabel0: 'black' }).scale[0]!.foreground).toBe('black')
})
