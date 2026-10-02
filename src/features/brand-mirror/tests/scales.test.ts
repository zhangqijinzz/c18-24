import { describe, expect, it } from 'vitest'
import { addScaleTier, removeScaleTier, scaleValue, validateTokens } from '../domain/brandRules'
import { INITIAL_TOKENS } from '../models/brandMirrorModels'

describe('scale tier management', () => {
  it('appends and inserts tiers within the supported count range', () => {
    const appended = addScaleTier(INITIAL_TOKENS, 'radiusScale')
    expect(appended.radiusScale).toHaveLength(5)
    expect(appended.radiusScale[4]).toBe(28)

    const inserted = addScaleTier(INITIAL_TOKENS, 'spacingScale', 0)
    expect(inserted.spacingScale).toHaveLength(6)
    expect(inserted.spacingScale[0]).toBe(inserted.spacingScale[1])
  })

  it('refuses to grow beyond the maximum tier count', () => {
    let tokens = INITIAL_TOKENS
    for (let i = 0; i < 10; i += 1) tokens = addScaleTier(tokens, 'radiusScale')
    expect(tokens.radiusScale).toHaveLength(8)
  })

  it('removes a tier at a given position and keeps at least one', () => {
    const removed = removeScaleTier(INITIAL_TOKENS, 'radiusScale', 1)
    expect(removed.radiusScale).toEqual([8, 18, 28])

    let tokens = { ...INITIAL_TOKENS, radiusScale: [10] }
    tokens = removeScaleTier(tokens, 'radiusScale', 0)
    expect(tokens.radiusScale).toEqual([10])
  })

  it('accepts any tier count inside the configured bounds', () => {
    expect(validateTokens({ ...INITIAL_TOKENS, radiusScale: [8, 12, 18] })).toBeNull()
    expect(validateTokens({ ...INITIAL_TOKENS, typeScale: [14, 40] })).toBeNull()
    const tooFew = validateTokens({ ...INITIAL_TOKENS, spacingScale: [8] })
    expect(tooFew).toContain('层级')
  })
})

describe('semantic scale resolution', () => {
  it('maps semantic roles onto the current tier positions', () => {
    expect(scaleValue(INITIAL_TOKENS, 'radiusScale', 'xs')).toBe(8)
    expect(scaleValue(INITIAL_TOKENS, 'radiusScale', 'sm')).toBe(12)
    expect(scaleValue(INITIAL_TOKENS, 'radiusScale', 'xl')).toBe(28)
  })

  it('keeps resolving values after tiers are added or removed', () => {
    const grown = addScaleTier(INITIAL_TOKENS, 'radiusScale')
    expect(scaleValue(grown, 'radiusScale', 'xl')).toBe(28)
    const shrunk = removeScaleTier(INITIAL_TOKENS, 'radiusScale', 0)
    expect(() => scaleValue(shrunk, 'radiusScale', 'xl')).not.toThrow()
    expect(scaleValue(shrunk, 'radiusScale', 'xs')).toBe(12)
    expect(scaleValue(shrunk, 'radiusScale', 'xl')).toBe(28)
  })

  it('never returns undefined even for a single-tier legacy scale', () => {
    const tokens = { ...INITIAL_TOKENS, spacingScale: [16] }
    expect(scaleValue(tokens, 'spacingScale', 'xl')).toBe(16)
  })
})
