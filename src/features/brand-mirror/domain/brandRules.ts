import type { BrandTheme, BrandTokens, ScaleField } from '../models/brandMirrorModels'
import { INITIAL_TOKENS, MAX_SCALE_LEVELS, MIN_SCALE_LEVELS, SCALE_LIMITS, THEME_PRESETS } from '../models/brandMirrorModels'

const HEX_COLOR = /^#[0-9A-F]{6}$/i
export const SCALE_FIELDS: ScaleField[] = ['radiusScale', 'spacingScale', 'typeScale']

export function cloneTokens(tokens: BrandTokens): BrandTokens {
  return { ...tokens, radiusScale: [...tokens.radiusScale], spacingScale: [...tokens.spacingScale], typeScale: [...tokens.typeScale] }
}

export function isHexColor(value: string): boolean {
  return HEX_COLOR.test(value)
}

export function normalizeColor(value: string): string {
  const candidate = value.trim().toUpperCase()
  return isHexColor(candidate) ? candidate : INITIAL_TOKENS.primary
}

export function clampScaleValue(field: ScaleField, value: number): number {
  const limits = SCALE_LIMITS[field]
  return Math.min(limits.max, Math.max(limits.min, Math.round(value)))
}

export function clampTokenValues(tokens: BrandTokens): BrandTokens {
  return {
    ...cloneTokens(tokens),
    radiusScale: tokens.radiusScale.map((value) => clampScaleValue('radiusScale', value)),
    spacingScale: tokens.spacingScale.map((value) => clampScaleValue('spacingScale', value)),
    typeScale: tokens.typeScale.map((value) => clampScaleValue('typeScale', value)),
  }
}

export function validateTokens(tokens: BrandTokens): string | null {
  if (!isHexColor(tokens.primary) || !isHexColor(tokens.secondary)) return '请输入 6 位 HEX 颜色'
  const invalidField = SCALE_FIELDS.find((field) => {
    const values = tokens[field]
    return !Array.isArray(values) || values.length < MIN_SCALE_LEVELS || values.some((value) => !Number.isFinite(value))
  })
  if (invalidField) return `尺度层级需为 ${MIN_SCALE_LEVELS}–${MAX_SCALE_LEVELS} 档`
  return null
}

export function appendScaleLevel(tokens: BrandTokens, field: ScaleField): BrandTokens {
  const values = tokens[field]
  if (values.length >= MAX_SCALE_LEVELS) return cloneTokens(tokens)
  const last = values[values.length - 1] ?? SCALE_LIMITS[field].min
  const next = clampScaleValue(field, last + SCALE_LIMITS[field].appendStep)
  return clampTokenValues({ ...tokens, [field]: [...values, next] })
}

export function removeScaleLevel(tokens: BrandTokens, field: ScaleField, index: number): BrandTokens {
  const values = tokens[field]
  if (values.length <= MIN_SCALE_LEVELS) return cloneTokens(tokens)
  return clampTokenValues({ ...tokens, [field]: values.filter((_, currentIndex) => currentIndex !== index) })
}

function channel(value: number): number {
  const scaled = value / 255
  return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4
}

function luminance(color: string): number {
  const red = Number.parseInt(color.slice(1, 3), 16)
  const green = Number.parseInt(color.slice(3, 5), 16)
  const blue = Number.parseInt(color.slice(5, 7), 16)
  return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue)
}

export function contrastRatio(first: string, second: string): number {
  const one = luminance(first)
  const two = luminance(second)
  return (Math.max(one, two) + 0.05) / (Math.min(one, two) + 0.05)
}

export function themeTokens(theme: BrandTheme): BrandTokens {
  return cloneTokens(THEME_PRESETS[theme].tokens)
}
