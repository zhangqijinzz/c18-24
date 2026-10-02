import { describe, expect, it } from 'vitest'
import { appendScaleLevel, clampTokenValues, contrastRatio, removeScaleLevel, validateTokens } from '../domain/brandRules'
import { migrateDocument } from '../domain/documentMigration'
import { alignScalesByPosition, radiusAt, scaleAtPosition, spacingAt, typeAt } from '../domain/scaleAccess'
import { INITIAL_TOKENS } from '../models/brandMirrorModels'

describe('brand token rules', () => {
  it('calculates a readable contrast ratio', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 1)
    expect(contrastRatio('#F15A47', '#24324A')).toBeGreaterThan(3)
  })

  it('clamps extreme values to the supported design scale', () => {
    const clamped = clampTokenValues({ ...INITIAL_TOKENS, typeScale: [1, 80, 14, 20, 28, 40], radiusScale: [-4, 12, 18, 50], spacingScale: [0, 8, 12, 20, 99] })
    expect(clamped.typeScale).toEqual([10, 72, 14, 20, 28, 40])
    expect(clamped.radiusScale).toEqual([0, 12, 18, 40])
    expect(clamped.spacingScale).toEqual([2, 8, 12, 20, 64])
  })

  it('rejects invalid colors and unsupported scale lengths', () => {
    expect(validateTokens({ ...INITIAL_TOKENS, primary: 'red' })).toContain('HEX')
    expect(validateTokens({ ...INITIAL_TOKENS, typeScale: [] })).toContain('层级')
    expect(appendScaleLevel({ ...INITIAL_TOKENS, typeScale: Array.from({ length: 10 }, (_, index) => 10 + index) }, 'typeScale').typeScale).toHaveLength(10)
  })

  it('adds and removes configurable scale levels', () => {
    const added = appendScaleLevel(INITIAL_TOKENS, 'radiusScale')
    expect(added.radiusScale).toEqual([8, 12, 18, 28, 32])

    const removed = removeScaleLevel(added, 'spacingScale', 0)
    expect(removed.spacingScale).toEqual([8, 12, 20, 32])
    expect(removeScaleLevel(INITIAL_TOKENS, 'typeScale', 0).typeScale).toHaveLength(5)
    expect(removeScaleLevel({ ...INITIAL_TOKENS, typeScale: [12] }, 'typeScale', 0).typeScale).toHaveLength(1)
  })
})

describe('scale access', () => {
  it('maps semantic positions to values after levels are added or removed', () => {
    expect(scaleAtPosition([8, 12, 18, 28], 'lg')).toBe(28)
    expect(scaleAtPosition([8, 12, 18, 28, 32], 'lg')).toBe(28)
    expect(scaleAtPosition([8, 28], 'lg')).toBe(28)
    expect(scaleAtPosition([8, 12, 18, 28], '2xl')).toBe(28)
    expect(scaleAtPosition([12], 'lg')).toBe(12)

    const withAddedLevel = { ...INITIAL_TOKENS, radiusScale: [8, 12, 18, 28, 32], spacingScale: [4, 8, 12, 20, 32, 48], typeScale: [12, 14, 16, 20, 28, 40, 44] }
    expect(radiusAt(withAddedLevel, 'sm')).toBe(12)
    expect(radiusAt(withAddedLevel, 'lg')).toBe(32)
    expect(spacingAt(withAddedLevel, 'md')).toBe(12)
    expect(spacingAt(withAddedLevel, 'xl')).toBe(48)
    expect(typeAt(withAddedLevel, 'md')).toBe(16)
    expect(typeAt(withAddedLevel, '2xl')).toBe(44)
  })

  it('aligns changed versions by position without shifting later levels', () => {
    expect(alignScalesByPosition([4, 8, 16], [4, 10, 16, 24])).toEqual([
      { index: 0, left: 4, right: 4, status: 'same' },
      { index: 1, left: 8, right: 10, status: 'changed' },
      { index: 2, left: 16, right: 16, status: 'same' },
      { index: 3, left: undefined, right: 24, status: 'added' },
    ])
  })
})

describe('document migration', () => {
  it('keeps non-standard legacy scale lengths and upgrades the document version', () => {
    const migrated = migrateDocument({
      version: 1,
      theme: 'studio',
      tokens: { ...INITIAL_TOKENS, typeScale: [12, 16, 24], spacingScale: [4, 8, 12, 20, 32, 48, 80] },
      versions: [],
    })
    expect(migrated?.version).toBe(2)
    expect(migrated?.tokens.typeScale).toEqual([12, 16, 24])
    expect(migrated?.tokens.spacingScale).toEqual([4, 8, 12, 20, 32, 48, 80])
  })
})
