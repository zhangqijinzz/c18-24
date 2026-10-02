import { DOCUMENT_VERSION, type BrandDocument } from '../models/brandMirrorModels'
import { validateTokens } from '../domain/brandRules'
import { migrateDocument } from '../domain/documentMigration'
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
      return migrateDocument(JSON.parse(raw))
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
