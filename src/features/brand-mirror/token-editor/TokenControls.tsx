import { MAX_SCALE_LEVELS, MIN_SCALE_LEVELS, type BrandMirrorSnapshot, type BrandTheme, type ScaleField } from '../models/brandMirrorModels'

interface TokenControlsProps {
  snapshot: BrandMirrorSnapshot
  onThemeChange: (theme: BrandTheme) => void
  onColorChange: (field: 'primary' | 'secondary', value: string) => void
  onScaleChange: (field: ScaleField, index: number, value: number) => void
  onAddScaleLevel: (field: ScaleField) => void
  onRemoveScaleLevel: (field: ScaleField, index: number) => void
  onReset: () => void
}

const themes: { id: BrandTheme; label: string; note: string }[] = [
  { id: 'studio', label: 'Studio warm', note: '热烈 · 友好' },
  { id: 'editorial', label: 'Editorial green', note: '克制 · 自然' },
  { id: 'night', label: 'Night signal', note: '锐利 · 数字' },
]

export function TokenControls({ snapshot, onThemeChange, onColorChange, onScaleChange, onAddScaleLevel, onRemoveScaleLevel, onReset }: TokenControlsProps) {
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

      <ScaleControl label="圆角尺度" hint="px" values={snapshot.tokens.radiusScale} field="radiusScale" onChange={onScaleChange} onAdd={onAddScaleLevel} onRemove={onRemoveScaleLevel} />
      <ScaleControl label="间距体系" hint="px" values={snapshot.tokens.spacingScale} field="spacingScale" onChange={onScaleChange} onAdd={onAddScaleLevel} onRemove={onRemoveScaleLevel} />
      <ScaleControl label="字体比例" hint="px" values={snapshot.tokens.typeScale} field="typeScale" onChange={onScaleChange} onAdd={onAddScaleLevel} onRemove={onRemoveScaleLevel} />

      <div className="panel-footer"><span className="live-dot" />所有调整实时同步到预览</div>
    </aside>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="color-field"><span>{label}</span><div className="color-input"><input aria-label={label} type="color" value={value} onChange={(event) => onChange(event.target.value)} /><input aria-label={`${label} HEX`} value={value} onChange={(event) => onChange(event.target.value)} /></div></label>
}

interface ScaleControlProps {
  label: string
  hint: string
  values: number[]
  field: ScaleField
  onChange: (field: ScaleField, index: number, value: number) => void
  onAdd: (field: ScaleField) => void
  onRemove: (field: ScaleField, index: number) => void
}

function ScaleControl({ label, hint, values, field, onChange, onAdd, onRemove }: ScaleControlProps) {
  return (
    <section className="control-section scale-section">
      <div className="section-label">
        <span>{label}</span>
        <span className="muted">{values.length} 档 / {hint}</span>
      </div>
      <div className="scale-inputs">
        {values.map((value, index) => (
          <label key={`${field}-${index}`}>
            <span className="scale-label">
              {index + 1}
              {values.length > MIN_SCALE_LEVELS && <button aria-label={`删除${label}第 ${index + 1} 档`} type="button" onClick={() => onRemove(field, index)}>×</button>}
            </span>
            <input aria-label={`${label}${index + 1}`} type="number" min={field === 'typeScale' ? 10 : field === 'spacingScale' ? 2 : 0} max={field === 'typeScale' ? 72 : field === 'spacingScale' ? 64 : 40} value={value} onChange={(event) => onChange(field, index, Number(event.target.value))} />
          </label>
        ))}
      </div>
      <button className="add-scale-button" type="button" disabled={values.length >= MAX_SCALE_LEVELS} onClick={() => onAdd(field)}>＋ 增加一档</button>
    </section>
  )
}
