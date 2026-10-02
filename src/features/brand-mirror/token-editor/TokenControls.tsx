import type { BrandMirrorSnapshot, BrandTheme, ScaleField } from '../models/brandMirrorModels'
import { SCALE_LIMITS } from '../models/brandMirrorModels'

interface TokenControlsProps {
  snapshot: BrandMirrorSnapshot
  onThemeChange: (theme: BrandTheme) => void
  onColorChange: (field: 'primary' | 'secondary', value: string) => void
  onScaleChange: (field: ScaleField, index: number, value: number) => void
  onAddTier: (field: ScaleField, at?: number) => void
  onRemoveTier: (field: ScaleField, at: number) => void
  onReset: () => void
}

const themes: { id: BrandTheme; label: string; note: string }[] = [
  { id: 'studio', label: 'Studio warm', note: '热烈 · 友好' },
  { id: 'editorial', label: 'Editorial green', note: '克制 · 自然' },
  { id: 'night', label: 'Night signal', note: '锐利 · 数字' },
]

const SCALE_ORDER: { field: ScaleField; label: string }[] = [
  { field: 'radiusScale', label: '圆角尺度' },
  { field: 'spacingScale', label: '间距体系' },
  { field: 'typeScale', label: '字体比例' },
]

export function TokenControls({ snapshot, onThemeChange, onColorChange, onScaleChange, onAddTier, onRemoveTier, onReset }: TokenControlsProps) {
  return (
    <aside className="control-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">01 / TOKENS</span>
          <h2>视觉令牌</h2>
        </div>
        <button className="text-button" type="button" onClick={onReset}>恢复默认</button>
      </div>

      <section className="control-section">
        <div className="section-label"><span>基础主题</span><span className="muted">快速起点</span></div>
        <div className="theme-list">
          {themes.map((theme) => (
            <button className={`theme-option ${snapshot.theme === theme.id ? 'selected' : ''}`} key={theme.id} onClick={() => onThemeChange(theme.id)} type="button">
              <span className={`theme-dot ${theme.id}`} />
              <span><strong>{theme.label}</strong><small>{theme.note}</small></span>
              {snapshot.theme === theme.id && <span className="check-mark">✓</span>}
            </button>
          ))}
        </div>
      </section>

      <section className="control-section">
        <div className="section-label"><span>品牌色</span><span className="muted">HEX / 6 位</span></div>
        <div className="color-fields">
          <ColorField label="主色" value={snapshot.tokens.primary} onChange={(value) => onColorChange('primary', value)} />
          <ColorField label="辅助色" value={snapshot.tokens.secondary} onChange={(value) => onColorChange('secondary', value)} />
        </div>
        <div className={`contrast-note ${snapshot.contrastWarning ? 'warning' : ''}`}>
          <span className="contrast-icon">◐</span>
          <span>对比度 <strong>{snapshot.contrastRatio.toFixed(1)}:1</strong> · {snapshot.contrastWarning ? '建议提高对比度' : '适合界面使用'}</span>
        </div>
      </section>

      {SCALE_ORDER.map(({ field, label }) => (
        <ScaleControl
          key={field}
          label={label}
          values={snapshot.tokens[field]}
          field={field}
          onChange={onScaleChange}
          onAddTier={onAddTier}
          onRemoveTier={onRemoveTier}
        />
      ))}

      <div className="panel-footer"><span className="live-dot" />所有调整实时同步到预览</div>
    </aside>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="color-field"><span>{label}</span><div className="color-input"><input aria-label={label} type="color" value={value} onChange={(event) => onChange(event.target.value)} /><input aria-label={`${label} HEX`} value={value} onChange={(event) => onChange(event.target.value)} /></div></label>
}

interface ScaleControlProps {
  label: string
  values: number[]
  field: ScaleField
  onChange: (field: ScaleField, index: number, value: number) => void
  onAddTier: (field: ScaleField, at?: number) => void
  onRemoveTier: (field: ScaleField, at: number) => void
}

function ScaleControl({ label, values, field, onChange, onAddTier, onRemoveTier }: ScaleControlProps) {
  const limits = SCALE_LIMITS[field]
  const valueBounds = { min: field === 'typeScale' ? 10 : 0, max: field === 'radiusScale' ? 40 : field === 'spacingScale' ? 64 : 72 }
  return (
    <section className="control-section scale-section">
      <div className="section-label"><span>{label}</span><span className="muted">{values.length} 档 · {limits.min}–{limits.max}</span></div>
      <div className="scale-rows">
        {values.map((value, index) => (
          <div className="scale-row" key={`${field}-${index}`}>
            <label className="scale-cell">
              <span>{index + 1}</span>
              <input
                aria-label={`${label}${index + 1}`}
                type="number"
                min={valueBounds.min}
                max={valueBounds.max}
                value={value}
                onChange={(event) => onChange(field, index, Number(event.target.value))}
              />
            </label>
            <div className="scale-row-actions">
              <button
                aria-label={`在第 ${index + 1} 档前插入层级`}
                className="scale-icon-button"
                type="button"
                disabled={values.length >= limits.max}
                onClick={() => onAddTier(field, index)}
              >＋</button>
              <button
                aria-label={`删除第 ${index + 1} 档`}
                className="scale-icon-button remove"
                type="button"
                disabled={values.length <= limits.min}
                onClick={() => onRemoveTier(field, index)}
              >−</button>
            </div>
          </div>
        ))}
      </div>
      <button
        className="add-tier-button"
        type="button"
        disabled={values.length >= limits.max}
        onClick={() => onAddTier(field)}
      >＋ 新增层级</button>
    </section>
  )
}
