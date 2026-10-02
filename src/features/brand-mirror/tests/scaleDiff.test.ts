import { describe, expect, it } from 'vitest'
import { diffScaleTiers, type ScaleDiff } from '../domain/scaleDiff'
import { INITIAL_TOKENS, type BrandTokens, type ScaleField } from '../models/brandMirrorModels'

function diffFor(before: BrandTokens, after: BrandTokens, field: ScaleField): ScaleDiff {
  const diff = diffScaleTiers(before, after).find((entry) => entry.field === field)
  if (!diff) throw new Error(`missing diff for ${field}`)
  return diff
}

describe('diffScaleTiers position alignment', () => {
  it('pairs tiers by position and marks added tail tiers', () => {
    const before: BrandTokens = { ...INITIAL_TOKENS, radiusScale: [8, 12, 18, 28] }
    const after: BrandTokens = { ...INITIAL_TOKENS, radiusScale: [8, 14, 18, 28, 36] }
    const radius = diffFor(before, after, 'radiusScale')

    expect(radius.tiers.map((tier) => tier.position)).toEqual([1, 2, 3, 4, 5])
    expect(radius.tiers.map((tier) => tier.status)).toEqual(['same', 'changed', 'same', 'same', 'added'])
    expect(radius.tiers[4]).toMatchObject({ before: null, after: 36, status: 'added' })
  })

  it('marks removed tail tiers when the new version has fewer levels', () => {
    const before: BrandTokens = { ...INITIAL_TOKENS, typeScale: [12, 14, 16, 20, 28, 40] }
    const after: BrandTokens = { ...INITIAL_TOKENS, typeScale: [12, 14, 16] }
    const type = diffFor(before, after, 'typeScale')

    expect(type.tiers).toHaveLength(6)
    expect(type.tiers.slice(3).map((tier) => tier.status)).toEqual(['removed', 'removed', 'removed'])
    expect(type.tiers[3]).toMatchObject({ before: 20, after: null })
  })

  it('does not shift rows: same-position values stay paired regardless of length difference', () => {
    const before: BrandTokens = { ...INITIAL_TOKENS, spacingScale: [4, 8, 12, 20, 32] }
    const after: BrandTokens = { ...INITIAL_TOKENS, spacingScale: [4, 10, 16] }
    const spacing = diffFor(before, after, 'spacingScale')

    expect(spacing.tiers[0]).toMatchObject({ before: 4, after: 4, status: 'same' })
    expect(spacing.tiers[1]).toMatchObject({ before: 8, after: 10, status: 'changed' })
    expect(spacing.tiers[2]).toMatchObject({ before: 12, after: 16, status: 'changed' })
    expect(spacing.tiers[3]).toMatchObject({ before: 20, after: null, status: 'removed' })
    expect(spacing.tiers[4]).toMatchObject({ before: 32, after: null, status: 'removed' })
  })
})
