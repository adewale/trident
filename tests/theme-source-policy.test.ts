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
