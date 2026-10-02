import type { BrandTheme, BrandTokens, ScaleField } from '../models/brandMirrorModels'
import { INITIAL_TOKENS, SCALE_LIMITS, SCALE_FIELDS, THEME_PRESETS } from '../models/brandMirrorModels'

const HEX_COLOR = /^#[0-9A-F]{6}$/i

const CLAMP_RANGE: Record<ScaleField, { min: number; max: number }> = {
  radiusScale: { min: 0, max: 40 },
  spacingScale: { min: 2, max: 64 },
  typeScale: { min: 10, max: 72 },
}

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

function clampScaleValue(field: ScaleField, value: number): number {
  const range = CLAMP_RANGE[field]
  return Math.min(range.max, Math.max(range.min, Math.round(value)))
}

export function clampTokenValues(tokens: BrandTokens): BrandTokens {
  return {
    ...cloneTokens(tokens),
    radiusScale: tokens.radiusScale.map((value) => clampScaleValue('radiusScale', value)),
    spacingScale: tokens.spacingScale.map((value) => clampScaleValue('spacingScale', value)),
    typeScale: tokens.typeScale.map((value) => clampScaleValue('typeScale', value)),
  }
}

/**
 * 保证每种尺度至少是一个由有限数字组成的数组。
 * 迁移旧数据时使用：层级数量与当前版本不同也不会整份报废，只修复真正不可用的值。
 */
export function sanitizeTokens(tokens: BrandTokens): BrandTokens {
  const sanitizeScale = (values: number[], fallback: number[]): number[] => {
    if (!Array.isArray(values) || values.length === 0) return [...fallback]
    // 个别档位损坏时沿用上一档（首档损坏用兜底值），尽量保留其余层级
    return values.map((value, index) => {
      if (Number.isFinite(value)) return value
      for (let previous = index - 1; previous >= 0; previous -= 1) {
        if (Number.isFinite(values[previous])) return values[previous]
      }
      return fallback[0]
    })
  }
  return {
    primary: typeof tokens.primary === 'string' ? tokens.primary : INITIAL_TOKENS.primary,
    secondary: typeof tokens.secondary === 'string' ? tokens.secondary : INITIAL_TOKENS.secondary,
    radiusScale: sanitizeScale(tokens.radiusScale, INITIAL_TOKENS.radiusScale),
    spacingScale: sanitizeScale(tokens.spacingScale, INITIAL_TOKENS.spacingScale),
    typeScale: sanitizeScale(tokens.typeScale, INITIAL_TOKENS.typeScale),
  }
}

export function validateTokens(tokens: BrandTokens): string | null {
  if (!isHexColor(tokens.primary) || !isHexColor(tokens.secondary)) return '请输入 6 位 HEX 颜色'
  for (const field of SCALE_FIELDS) {
    const values = tokens[field]
    const { min, max, label } = SCALE_LIMITS[field]
    if (values.length < min || values.length > max) return `${label}层级数量需在 ${min}–${max} 档之间`
  }
  if (tokens.typeScale.some((value) => value < 10 || value > 72)) return '字号范围应在 10–72px'
  return null
}

/**
 * 新增层级的默认值：在指定位置插入时沿用该位置原有的档位（后续档位整体后移，取值不变），
 * 追加时沿用上一档，空尺度则使用兜底值；最后收敛到合法范围。
 */
function nextTierValue(field: ScaleField, values: number[], at: number): number {
  const source = values[at] ?? values[values.length - 1] ?? INITIAL_TOKENS[field][0]
  return clampScaleValue(field, source)
}

/** 在 at 位置插入一档；省略 at 时追加到末尾。层级数量不能超过上限。 */
export function addScaleTier(tokens: BrandTokens, field: ScaleField, at?: number): BrandTokens {
  const values = [...tokens[field]]
  if (values.length >= SCALE_LIMITS[field].max) return cloneTokens(tokens)
  const index = at === undefined ? values.length : Math.min(Math.max(0, at), values.length)
  values.splice(index, 0, nextTierValue(field, values, index))
  return clampTokenValues({ ...tokens, [field]: values })
}

/** 删除 at 位置的一档。层级数量不能低于下限。 */
export function removeScaleTier(tokens: BrandTokens, field: ScaleField, at: number): BrandTokens {
  const values = [...tokens[field]]
  if (values.length <= SCALE_LIMITS[field].min) return cloneTokens(tokens)
  if (at < 0 || at >= values.length) return cloneTokens(tokens)
  values.splice(at, 1)
  return clampTokenValues({ ...tokens, [field]: values })
}

/**
 * 语义化尺度角色。预览与导出只引用角色（xs/sm/md/lg/xl…），
 * 不写死数组下标，因此品牌增删层级后所有使用处都能取到当前体系里对应位置的值。
 * 位置按比例映射：roleIndex = floor(fraction × 档位数)，档位越少角色自然靠拢，不会越界。
 */
export type ScaleRole = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const ROLE_FRACTIONS: Record<ScaleRole, number> = { xs: 0, sm: 0.34, md: 0.5, lg: 0.67, xl: 1 }

export function scaleValue(tokens: BrandTokens, field: ScaleField, role: ScaleRole): number {
  const values = tokens[field]
  if (!values || values.length === 0) return CLAMP_RANGE[field].min
  const index = Math.min(values.length - 1, Math.floor(ROLE_FRACTIONS[role] * values.length))
  return values[index]
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
