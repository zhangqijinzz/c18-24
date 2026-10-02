export type BrandTheme = 'studio' | 'editorial' | 'night'
export type MirrorStatus = 'loading' | 'ready' | 'editing' | 'error'

export type ScaleField = 'radiusScale' | 'spacingScale' | 'typeScale'

export interface BrandTokens {
  primary: string
  secondary: string
  radiusScale: number[]
  spacingScale: number[]
  typeScale: number[]
}

export interface SavedVersion {
  id: string
  label: string
  tokens: BrandTokens
  createdAt: string
}

/** 文档结构版本：v2 允许每种尺度拥有可变的层级数量；v1 数据仍可被读取迁移 */
export const DOCUMENT_VERSION = 2

export interface BrandDocument {
  version: number
  tokens: BrandTokens
  theme: BrandTheme
  versions: SavedVersion[]
}

export interface BrandMirrorSnapshot {
  status: MirrorStatus
  tokens: BrandTokens
  theme: BrandTheme
  versions: SavedVersion[]
  compareMode: boolean
  activeVersionId: string | null
  contrastRatio: number
  contrastWarning: boolean
  message: string
}

/** 每种尺度允许的层级数量区间，品牌可在区间内自由增删 */
export const SCALE_LIMITS: Record<ScaleField, { min: number; max: number; unit: string; label: string }> = {
  radiusScale: { min: 1, max: 8, unit: 'px', label: '圆角尺度' },
  spacingScale: { min: 2, max: 10, unit: 'px', label: '间距体系' },
  typeScale: { min: 2, max: 10, unit: 'px', label: '字体比例' },
}

export const SCALE_FIELDS: ScaleField[] = ['radiusScale', 'spacingScale', 'typeScale']

export const INITIAL_TOKENS: BrandTokens = {
  primary: '#F15A47',
  secondary: '#24324A',
  radiusScale: [8, 12, 18, 28],
  spacingScale: [4, 8, 12, 20, 32],
  typeScale: [12, 14, 16, 20, 28, 40],
}

export const THEME_PRESETS: Record<BrandTheme, { label: string; tokens: BrandTokens }> = {
  studio: {
    label: 'Studio warm',
    tokens: INITIAL_TOKENS,
  },
  editorial: {
    label: 'Editorial green',
    tokens: {
      primary: '#238B73', secondary: '#173C35', radiusScale: [4, 8, 12, 18], spacingScale: [4, 8, 16, 24, 40], typeScale: [12, 14, 16, 22, 30, 44],
    },
  },
  night: {
    label: 'Night signal',
    tokens: {
      primary: '#A98BFF', secondary: '#191829', radiusScale: [6, 10, 14, 22], spacingScale: [4, 8, 12, 18, 28], typeScale: [12, 14, 16, 20, 28, 38],
    },
  },
}
