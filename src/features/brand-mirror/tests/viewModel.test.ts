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

  it('adds and removes scale levels while persisting the new hierarchy', () => {
    const repository = new MemoryRepository()
    const viewModel = new BrandMirrorViewModel(repository)
    viewModel.initialize()
    viewModel.addScaleLevel('typeScale')
    expect(viewModel.getSnapshot().tokens.typeScale).toHaveLength(7)
    expect(repository.document?.version).toBe(2)
    viewModel.removeScaleLevel('radiusScale', 0)
    expect(viewModel.getSnapshot().tokens.radiusScale).toEqual([12, 18, 28])
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

  it('loads legacy data with a different number of scale levels', () => {
    const repository = new MemoryRepository()
    repository.document = { version: 1, theme: 'studio', tokens: { primary: '#F15A47', secondary: '#24324A', radiusScale: [8, 18], spacingScale: [4, 8, 12, 20, 32, 48], typeScale: [12, 16, 24] }, versions: [] }
    const viewModel = new BrandMirrorViewModel(repository)
    viewModel.initialize()
    expect(viewModel.getSnapshot().tokens.radiusScale).toEqual([8, 18])
    expect(viewModel.getSnapshot().tokens.typeScale).toEqual([12, 16, 24])
  })

  it('exports the current token system as brand guidelines', () => {
    const repository = new MemoryRepository()
    const exporter = new MemoryExporter()
    const viewModel = new BrandMirrorViewModel(repository, exporter)
    viewModel.initialize()
    viewModel.addScaleLevel('typeScale')
    viewModel.exportBrandGuidelines()
    expect(exporter.received).toContain('# BrandMirror 品牌规范')
    expect(exporter.received).toContain('`primary`')
    expect(exporter.received).toContain('字体比例（7 档）')
    expect(viewModel.getSnapshot().message).toContain('导出')
  })
})
