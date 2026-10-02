import { describe, expect, it } from 'vitest'
import { LocalBrandRepository, type BrandRepository } from '../repositories/brandRepository'
import { DOCUMENT_VERSION, type BrandDocument } from '../models/brandMirrorModels'
import type { StorageService } from '../services/storageService'

class MemoryStorage implements StorageService {
  value: string | null = null
  read(): string | null { return this.value }
  write(input: string): void { this.value = input }
}

function repositoryWith(raw: string | null): BrandRepository {
  const storage = new MemoryStorage()
  storage.value = raw
  return new LocalBrandRepository(storage)
}

describe('LocalBrandRepository migration', () => {
  it('reads a legacy v1 document whose scale tier counts differ from the defaults', () => {
    const legacy = JSON.stringify({
      version: 1,
      theme: 'studio',
      tokens: { primary: '#F15A47', secondary: '#24324A', radiusScale: [10, 20], spacingScale: [4, 8, 12], typeScale: [13, 18, 26, 38] },
      versions: [],
    })
    const loaded = repositoryWith(legacy).load()
    expect(loaded).not.toBeNull()
    expect(loaded?.version).toBe(DOCUMENT_VERSION)
    expect(loaded?.tokens.radiusScale).toEqual([10, 20])
    expect(loaded?.tokens.spacingScale).toEqual([4, 8, 12])
    expect(loaded?.tokens.typeScale).toEqual([13, 18, 26, 38])
  })

  it('repairs a broken scale array instead of discarding the whole document', () => {
    const broken = JSON.stringify({
      version: 2,
      theme: 'night',
      tokens: { primary: '#A98BFF', secondary: '#191829', radiusScale: [], spacingScale: [8, 'oops'], typeScale: [14, 20] },
      versions: [],
    })
    const loaded = repositoryWith(broken).load()
    expect(loaded).not.toBeNull()
    expect(loaded?.tokens.radiusScale.length).toBeGreaterThan(0)
    expect(loaded?.tokens.spacingScale[1]).toBe(8)
  })

  it('drops malformed version entries but keeps the remaining history', () => {
    const withVersions = JSON.stringify({
      version: 1,
      theme: 'studio',
      tokens: { primary: '#F15A47', secondary: '#24324A', radiusScale: [8, 12], spacingScale: [4, 8], typeScale: [13, 18] },
      versions: [
        { id: 'a', label: 'Version A', createdAt: '2024-01-01', tokens: { primary: '#111111', secondary: '#222222', radiusScale: [8], spacingScale: [4], typeScale: [12] } },
        { id: 'broken' },
      ],
    })
    const loaded = repositoryWith(withVersions).load()
    expect(loaded?.versions).toHaveLength(1)
    expect(loaded?.versions[0].id).toBe('a')
  })

  it('returns null for an unknown envelope version', () => {
    expect(repositoryWith(JSON.stringify({ version: 99, theme: 'studio', tokens: {}, versions: [] })).load()).toBeNull()
  })

  it('persists documents stamped with the current version', () => {
    const storage = new MemoryStorage()
    const repository = new LocalBrandRepository(storage)
    const document: BrandDocument = { version: 1, theme: 'studio', tokens: { primary: '#F15A47', secondary: '#24324A', radiusScale: [8, 12], spacingScale: [4, 8], typeScale: [13, 18] }, versions: [] }
    repository.save(document)
    expect(JSON.parse(storage.value ?? '{}').version).toBe(DOCUMENT_VERSION)
  })
})
