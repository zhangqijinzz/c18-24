import { DOCUMENT_VERSION, type BrandDocument, type SavedVersion } from '../models/brandMirrorModels'
import { clampTokenValues, sanitizeTokens, validateTokens } from '../domain/brandRules'
import type { StorageService } from '../services/storageService'

export interface BrandRepository {
  load(): BrandDocument | null
  save(document: BrandDocument): void
}

export class LocalBrandRepository implements BrandRepository {
  constructor(private readonly storage: StorageService) {}

  load(): BrandDocument | null {
    const raw = this.storage.read()
    if (!raw) return null
    try {
      const candidate: unknown = JSON.parse(raw)
      const document = migrateDocument(candidate)
      if (!document) return null
      return {
        ...document,
        tokens: clampTokenValues(document.tokens),
        versions: document.versions.map((version) => ({
          ...version,
          tokens: clampTokenValues(version.tokens),
        })),
      }
    } catch {
      return null
    }
  }

  save(document: BrandDocument): void {
    const validationError = validateTokens(document.tokens)
    if (validationError) throw new Error(validationError)
    this.storage.write(JSON.stringify({ ...document, version: DOCUMENT_VERSION }))
  }
}

/**
 * 兼容 v1 / v2 文档：层级数量与当前版本不同也保留原值，
 * 只修复结构损坏的字段，避免“整份数据报废”。
 */
function migrateDocument(value: unknown): BrandDocument | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<BrandDocument>
  if ((candidate.version !== 1 && candidate.version !== 2) || !candidate.tokens || typeof candidate.theme !== 'string') return null
  const versions = Array.isArray(candidate.versions) ? candidate.versions.filter(isSavedVersion) : []
  return {
    version: DOCUMENT_VERSION,
    theme: candidate.theme,
    tokens: sanitizeTokens(candidate.tokens as BrandDocument['tokens']),
    versions,
  }
}

function isSavedVersion(value: unknown): value is SavedVersion {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<SavedVersion>
  return typeof candidate.id === 'string' &&
    typeof candidate.label === 'string' &&
    typeof candidate.createdAt === 'string' &&
    !!candidate.tokens && typeof candidate.tokens === 'object'
}
