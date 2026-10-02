import { addScaleTier, clampTokenValues, cloneTokens, contrastRatio, normalizeColor, removeScaleTier, themeTokens, validateTokens } from '../domain/brandRules'
import type { BrandRepository } from '../repositories/brandRepository'
import type { BrandGuidelinesExporter } from '../services/exportService'
import { DOCUMENT_VERSION, INITIAL_TOKENS, SCALE_LIMITS, type BrandDocument, type BrandMirrorSnapshot, type BrandTheme, type ScaleField, type SavedVersion } from '../models/brandMirrorModels'

type Listener = () => void

export class BrandMirrorViewModel {
  private snapshot: BrandMirrorSnapshot = this.makeSnapshot({ tokens: INITIAL_TOKENS, theme: 'studio', versions: [] })
  private readonly listeners = new Set<Listener>()
  private readonly repository: BrandRepository
  private readonly exporter?: BrandGuidelinesExporter

  constructor(repository: BrandRepository, exporter?: BrandGuidelinesExporter) {
    this.repository = repository
    this.exporter = exporter
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot(): BrandMirrorSnapshot {
    return this.snapshot
  }

  initialize(): void {
    const stored = this.repository.load()
    if (stored) {
      this.snapshot = this.makeSnapshot(stored, '已恢复最近一次工作状态')
    } else {
      this.snapshot = this.makeSnapshot({ tokens: INITIAL_TOKENS, theme: 'studio', versions: [] }, '从 Studio warm 开始探索')
    }
    this.emit()
  }

  selectTheme(theme: BrandTheme): void {
    this.update({ tokens: themeTokens(theme), theme }, '已切换基础主题')
  }

  updateColor(field: 'primary' | 'secondary', value: string): void {
    const color = normalizeColor(value)
    this.update({ tokens: { ...this.snapshot.tokens, [field]: color } }, '令牌已更新')
  }

  updateScale(field: ScaleField, index: number, value: number): void {
    const values = [...this.snapshot.tokens[field]]
    values[index] = Number.isFinite(value) ? value : values[index]
    this.update({ tokens: clampTokenValues({ ...this.snapshot.tokens, [field]: values }) }, '令牌已更新')
  }

  addScaleTier(field: ScaleField, at?: number): void {
    if (this.snapshot.tokens[field].length >= SCALE_LIMITS[field].max) {
      this.snapshot = { ...this.snapshot, status: 'error', message: `${SCALE_LIMITS[field].label}最多支持 ${SCALE_LIMITS[field].max} 档` }
      this.emit()
      return
    }
    this.update({ tokens: addScaleTier(this.snapshot.tokens, field, at) }, '已新增一个层级，预览已同步')
  }

  removeScaleTier(field: ScaleField, at: number): void {
    if (this.snapshot.tokens[field].length <= SCALE_LIMITS[field].min) {
      this.snapshot = { ...this.snapshot, status: 'error', message: `${SCALE_LIMITS[field].label}至少保留 ${SCALE_LIMITS[field].min} 档` }
      this.emit()
      return
    }
    this.update({ tokens: removeScaleTier(this.snapshot.tokens, field, at) }, '已删除一个层级，预览按位置重新取值')
  }

  reset(): void {
    this.update({ tokens: cloneTokens(INITIAL_TOKENS), theme: 'studio' }, '已恢复默认令牌')
  }

  saveVersion(): void {
    const validationError = validateTokens(this.snapshot.tokens)
    if (validationError) {
      this.snapshot = { ...this.snapshot, status: 'error', message: validationError }
      this.emit()
      return
    }
    const nextVersion: SavedVersion = {
      id: `version-${Date.now()}`,
      label: this.snapshot.versions.length === 0 ? 'Version A' : `Version ${String.fromCharCode(65 + this.snapshot.versions.length)}`,
      tokens: cloneTokens(this.snapshot.tokens),
      createdAt: new Date().toISOString(),
    }
    const versions = [...this.snapshot.versions, nextVersion]
    this.persist({ tokens: this.snapshot.tokens, theme: this.snapshot.theme, versions }, '版本已保存')
  }

  toggleCompare(): void {
    this.snapshot = { ...this.snapshot, compareMode: !this.snapshot.compareMode, message: this.snapshot.compareMode ? '已退出对比模式' : '正在对比最近两个版本' }
    this.emit()
  }

  exportBrandGuidelines(): void {
    if (!this.exporter) return
    try {
      this.exporter.export(this.snapshot)
      this.snapshot = { ...this.snapshot, message: '品牌规范已导出' }
    } catch {
      this.snapshot = { ...this.snapshot, status: 'error', message: '导出失败，请稍后重试' }
    }
    this.emit()
  }

  private update(partial: Partial<Pick<BrandDocument, 'tokens' | 'theme'>>, message: string): void {
    const tokens = partial.tokens ?? this.snapshot.tokens
    this.snapshot = this.makeSnapshot({ tokens, theme: partial.theme ?? this.snapshot.theme, versions: this.snapshot.versions }, message, 'editing')
    this.persistCurrent()
  }

  private persistCurrent(): void {
    try {
      this.repository.save({ version: DOCUMENT_VERSION, tokens: this.snapshot.tokens, theme: this.snapshot.theme, versions: this.snapshot.versions })
    } catch {
      this.snapshot = { ...this.snapshot, status: 'error', message: '本地保存失败，但当前编辑仍保留在页面中' }
    }
    this.emit()
  }

  private persist(document: Omit<BrandDocument, 'version'>, message: string): void {
    try {
      this.repository.save({ version: DOCUMENT_VERSION, ...document })
      this.snapshot = this.makeSnapshot(document, message, 'ready')
    } catch {
      this.snapshot = { ...this.snapshot, status: 'error', message: '版本保存失败，请稍后重试' }
    }
    this.emit()
  }

  private makeSnapshot(document: Omit<BrandDocument, 'version'>, message = '', status: BrandMirrorSnapshot['status'] = 'ready'): BrandMirrorSnapshot {
    const ratio = contrastRatio(document.tokens.primary, document.tokens.secondary)
    const latestVersion = document.versions[document.versions.length - 1]
    return { status, tokens: cloneTokens(document.tokens), theme: document.theme, versions: document.versions, compareMode: false, activeVersionId: latestVersion?.id ?? null, contrastRatio: ratio, contrastWarning: ratio < 3, message }
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener())
  }
}
