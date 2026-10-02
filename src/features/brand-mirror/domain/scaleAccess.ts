import type { BrandTokens, ScaleField } from '../models/brandMirrorModels'

export type SemanticLevel = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

const LEVEL_RANK: Record<SemanticLevel, number> = {
  xs: 0,
  sm: 1,
  md: 2,
  lg: 3,
  xl: 4,
  '2xl': 5,
}

export function scaleAtPosition(values: number[], position: SemanticLevel | number): number {
  if (values.length === 0) return 0
  const rank = typeof position === 'number' ? Math.min(values.length - 1, Math.max(0, Math.round(position * (values.length - 1)))) : Math.min(LEVEL_RANK[position], values.length - 1)
  return values[rank]
}

export function tokenScaleAt(tokens: BrandTokens, field: ScaleField, position: SemanticLevel | number): number {
  return scaleAtPosition(tokens[field], position)
}

function fromStart(values: number[], rank: SemanticLevel): number {
  return values[Math.min(LEVEL_RANK[rank], values.length - 1)]
}

function fromEnd(values: number[], offset: number): number {
  return values[Math.max(0, values.length - 1 - offset)]
}

function anchoredFromEnd(values: number[], rank: SemanticLevel, roleCount: number): number {
  if (values.length <= roleCount) return fromStart(values, rank)
  return fromEnd(values, roleCount - 1 - LEVEL_RANK[rank])
}

export function radiusAt(tokens: BrandTokens, level: Extract<SemanticLevel, 'xs' | 'sm' | 'md' | 'lg'>): number {
  const values = tokens.radiusScale
  if (level === 'lg') return anchoredFromEnd(values, 'lg', 4)
  return fromStart(values, level)
}

export function spacingAt(tokens: BrandTokens, level: Extract<SemanticLevel, 'xs' | 'sm' | 'md' | 'lg' | 'xl'>): number {
  const values = tokens.spacingScale
  if (level === 'lg' || level === 'xl') return anchoredFromEnd(values, level, 5)
  return fromStart(values, level)
}

export function typeAt(tokens: BrandTokens, level: SemanticLevel): number {
  const values = tokens.typeScale
  if (level === 'xl' || level === '2xl') return anchoredFromEnd(values, level, 6)
  return fromStart(values, level)
}

export type ScaleComparisonStatus = 'same' | 'changed' | 'added' | 'removed'

export interface AlignedScaleValue {
  index: number
  left?: number
  right?: number
  status: ScaleComparisonStatus
}

export function alignScalesByPosition(left: number[], right: number[]): AlignedScaleValue[] {
  return Array.from({ length: Math.max(left.length, right.length) }, (_, index) => {
    const leftValue = left[index]
    const rightValue = right[index]
    const status: ScaleComparisonStatus = leftValue === undefined
      ? 'added'
      : rightValue === undefined
        ? 'removed'
        : leftValue === rightValue
          ? 'same'
          : 'changed'
    return { index, left: leftValue, right: rightValue, status }
  })
}
