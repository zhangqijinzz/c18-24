import { describe, expect, it } from 'vitest'
import { BrandMirrorViewModel } from '../viewmodels/brandMirrorViewModel'
import type { BrandDocument } from '../models/brandMirrorModels'
import type { BrandRepository } from '../repositories/brandRepository'
import { buildBrandGuidelinesMarkdown, type BrandGuidelinesExporter } from '../services/exportService'

class MemoryRepository implements BrandRepository {
  document: BrandDocument | null = null
  shouldFail = false
  load(): BrandDocument | null { return this.document }
  save(document: BrandDocument): void { if (this.shouldFail) throw new Error('offline'); this.document = document }
}

class MemoryExporter implements BrandGuidelinesExporter {
  received: string | null = null
  export(snapshot: Parameters<BrandGuidelinesExporter['export']>[0]): void { this.received = buildBrandGuidelinesMarkdown(snapshot) }
}

describe('BrandMirrorViewModel', () => {
  it('initializes, updates tokens and persists the latest state', () => {
    const repository = new MemoryRepository()
    const viewModel = new BrandMirrorViewModel(repository)
    viewModel.initialize()
    viewModel.updateColor('primary', '#123456')
    viewModel.updateScale('typeScale', 0, 18)
    expect(viewModel.getSnapshot().tokens.primary).toBe('#123456')
    expect(viewModel.getSnapshot().tokens.typeScale[0]).toBe(18)
    expect(repository.document?.tokens.primary).toBe('#123456')
  })

  it('saves two versions and enters comparison mode', () => {
    const repository = new MemoryRepository()
    const viewModel = new BrandMirrorViewModel(repository)
    viewModel.initialize()
    viewModel.saveVersion()
    viewModel.updateColor('primary', '#238B73')
    viewModel.saveVersion()
    viewModel.toggleCompare()
    expect(viewModel.getSnapshot().versions.map((version) => version.label)).toEqual(['Version A', 'Version B'])
    expect(viewModel.getSnapshot().compareMode).toBe(true)
  })

  it('keeps editing usable when persistence fails', () => {
    const repository = new MemoryRepository()
    const viewModel = new BrandMirrorViewModel(repository)
    viewModel.initialize()
    repository.shouldFail = true
    viewModel.updateColor('secondary', '#FFFFFF')
    expect(viewModel.getSnapshot().status).toBe('error')
    expect(viewModel.getSnapshot().tokens.secondary).toBe('#FFFFFF')
  })

  it('recovers a previously persisted document on initialization', () => {
    const repository = new MemoryRepository()
    repository.document = { version: 1, theme: 'night', tokens: { primary: '#A98BFF', secondary: '#191829', radiusScale: [6, 10, 14, 22], spacingScale: [4, 8, 12, 18, 28], typeScale: [12, 14, 16, 20, 28, 38] }, versions: [] }
    const viewModel = new BrandMirrorViewModel(repository)
    viewModel.initialize()
    expect(viewModel.getSnapshot().theme).toBe('night')
    expect(viewModel.getSnapshot().message).toContain('恢复')
  })

  it('exports the current token system as brand guidelines', () => {
    const repository = new MemoryRepository()
    const exporter = new MemoryExporter()
    const viewModel = new BrandMirrorViewModel(repository, exporter)
    viewModel.initialize()
    viewModel.exportBrandGuidelines()
    expect(exporter.received).toContain('# BrandMirror 品牌规范')
    expect(exporter.received).toContain('`primary`')
    expect(viewModel.getSnapshot().message).toContain('导出')
  })

  it('adds and removes scale tiers, persists them and reflects the new count in exports', () => {
    const repository = new MemoryRepository()
    const exporter = new MemoryExporter()
    const viewModel = new BrandMirrorViewModel(repository, exporter)
    viewModel.initialize()
    viewModel.addScaleTier('radiusScale')
    expect(viewModel.getSnapshot().tokens.radiusScale).toHaveLength(5)
    expect(repository.document?.tokens.radiusScale).toHaveLength(5)
    expect(repository.document?.version).toBe(2)

    viewModel.removeScaleTier('typeScale', 0)
    expect(viewModel.getSnapshot().tokens.typeScale).toEqual([14, 16, 20, 28, 40])

    viewModel.exportBrandGuidelines()
    expect(exporter.received).toContain('圆角尺度（5 档）')
    expect(exporter.received).toContain('`radius.5`')
    expect(exporter.received).toContain('字体比例（5 档）')
  })

  it('inserts a tier at a specific position so later tiers keep their values', () => {
    const repository = new MemoryRepository()
    const viewModel = new BrandMirrorViewModel(repository)
    viewModel.initialize()
    viewModel.addScaleTier('spacingScale', 2)
    expect(viewModel.getSnapshot().tokens.spacingScale).toEqual([4, 8, 12, 12, 20, 32])
  })

  it('guards tier count limits', () => {
    const repository = new MemoryRepository()
    const viewModel = new BrandMirrorViewModel(repository)
    viewModel.initialize()
    for (let i = 0; i < 10; i += 1) viewModel.addScaleTier('radiusScale')
    expect(viewModel.getSnapshot().tokens.radiusScale).toHaveLength(8)
    const single = { ...viewModel.getSnapshot().tokens, radiusScale: [10] }
    repository.document = { version: 2, theme: 'studio', tokens: single, versions: [] }
    viewModel.initialize()
    viewModel.removeScaleTier('radiusScale', 0)
    expect(viewModel.getSnapshot().tokens.radiusScale).toEqual([10])
  })

  it('compares saved versions position-by-position when tier counts differ', () => {
    const repository = new MemoryRepository()
    const viewModel = new BrandMirrorViewModel(repository)
    viewModel.initialize()
    viewModel.saveVersion()
    viewModel.addScaleTier('radiusScale')
    viewModel.updateScale('radiusScale', 1, 16)
    viewModel.saveVersion()
    const [versionA, versionB] = viewModel.getSnapshot().versions
    expect(versionA.tokens.radiusScale).toHaveLength(4)
    expect(versionB.tokens.radiusScale).toHaveLength(5)
    expect(versionB.tokens.radiusScale[1]).toBe(16)
  })
})
