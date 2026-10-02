import { cloneTokens, normalizeColor } from './brandRules'
import { DOCUMENT_VERSION, INITIAL_TOKENS, THEME_PRESETS, type BrandDocument, type BrandTheme, type BrandTokens, type SavedVersion } from '../models/brandMirrorModels'

export function migrateDocument(candidate: unknown): BrandDocument | null {
  if (!candidate || typeof candidate !== 'object') return null
  const value = candidate as Partial<BrandDocument>
  if ((value.version !== 1 && value.version !== 2) || !value.tokens || typeof value.theme !== 'string') return null

  const theme = migrateTheme(value.theme)
  return {
    version: DOCUMENT_VERSION,
    theme,
    tokens: migrateTokens(value.tokens),
    versions: Array.isArray(value.versions) ? value.versions.map(migrateVersion).filter((version): version is SavedVersion => Boolean(version)) : [],
  }
}

function migrateTheme(value: string): BrandTheme {
  return value in THEME_PRESETS ? (value as BrandTheme) : 'studio'
}

function migrateTokens(value: unknown): BrandTokens {
  if (!value || typeof value !== 'object') return cloneTokens(INITIAL_TOKENS)
  const candidate = value as Partial<BrandTokens>
  return {
    primary: typeof candidate.primary === 'string' ? normalizeColor(candidate.primary) : INITIAL_TOKENS.primary,
    secondary: typeof candidate.secondary === 'string' ? normalizeColor(candidate.secondary) : INITIAL_TOKENS.secondary,
    radiusScale: migrateScale(candidate.radiusScale, INITIAL_TOKENS.radiusScale),
    spacingScale: migrateScale(candidate.spacingScale, INITIAL_TOKENS.spacingScale),
    typeScale: migrateScale(candidate.typeScale, INITIAL_TOKENS.typeScale),
  }
}

function migrateScale(value: unknown, fallback: number[]): number[] {
  if (!Array.isArray(value)) return [...fallback]
  const values = value.filter((item): item is number => typeof item === 'number' && Number.isFinite(item))
  return values.length > 0 ? values : [...fallback]
}

function migrateVersion(value: unknown): SavedVersion | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<SavedVersion>
  if (typeof candidate.id !== 'string' || typeof candidate.label !== 'string' || !candidate.tokens || typeof candidate.createdAt !== 'string') return null
  return {
    id: candidate.id,
    label: candidate.label,
    createdAt: candidate.createdAt,
    tokens: migrateTokens(candidate.tokens),
  }
}
