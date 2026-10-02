import { alignScalesByPosition, radiusAt, scaleAtPosition, typeAt, type AlignedScaleValue } from '../domain/scaleAccess'
import type { BrandMirrorSnapshot, ScaleField, SavedVersion } from '../models/brandMirrorModels'

const SCALE_SECTIONS: { field: ScaleField; label: string }[] = [
  { field: 'radiusScale', label: '圆角' },
  { field: 'spacingScale', label: '间距' },
  { field: 'typeScale', label: '字号' },
]

export function VersionCompare({ snapshot, onSave, onToggle, onExport }: { snapshot: BrandMirrorSnapshot; onSave: () => void; onToggle: () => void; onExport: () => void }) {
  const versions = snapshot.versions.slice(-2)
  const hasCompare = versions.length === 2
  return <section className="version-section"><div className="showcase-heading"><div><span className="eyebrow">04 / VERSIONS</span><h2>版本对比</h2></div><div className="version-actions"><button className="export-button" type="button" onClick={onExport}>↓ 导出品牌规范</button><button className="secondary-button" type="button" onClick={onSave}>＋ 保存当前版本</button><button className="primary-button" type="button" disabled={!hasCompare} onClick={onToggle}>{snapshot.compareMode ? '退出对比' : '打开对比视图'} <span>↗</span></button></div></div>{hasCompare ? <><div className="version-cards">{versions.map((version) => <VersionCard key={version.id} label={version.label} tokens={version.tokens} active={snapshot.activeVersionId === version.id} />)}</div>{snapshot.compareMode && <ScaleComparison previous={versions[0]} current={versions[1]} />}</> : <div className="version-empty"><div className="empty-icon">A/B</div><div><strong>保存两个版本，开始对照</strong><p>先保存当前状态作为 Version A，再调整令牌并保存 Version B。</p></div><span className="empty-arrow">→</span></div>}</section>
}

function VersionCard({ label, tokens, active }: { label: string; tokens: BrandMirrorSnapshot['tokens']; active: boolean }) {
  return <div className={`version-card ${active ? 'active' : ''}`}><div className="version-card-head"><span>{label}</span><small>{active ? '当前版本' : '历史版本'}</small></div><div className="version-preview" style={{ background: tokens.secondary, borderRadius: radiusAt(tokens, 'md') }}><div className="version-preview-top" style={{ background: tokens.primary }} /><div className="version-preview-copy"><i /><i /><i /></div><span className="version-preview-button" style={{ background: tokens.primary, borderRadius: radiusAt(tokens, 'xs') }} /></div><div className="version-swatch-row"><span style={{ background: tokens.primary }} /><span style={{ background: tokens.secondary }} /><span>圆角 {scaleAtPosition(tokens.radiusScale, 'sm')}px</span><span>字号 {typeAt(tokens, 'md')}px</span></div></div>
}

function ScaleComparison({ previous, current }: { previous: SavedVersion; current: SavedVersion }) {
  return <div className="scale-comparison">
    <div className="comparison-heading"><strong>按位置对齐层级</strong><span>{previous.label} → {current.label}</span></div>
    <div className="comparison-grid">
      {SCALE_SECTIONS.map((section) => {
        const rows = alignScalesByPosition(previous.tokens[section.field], current.tokens[section.field])
        return <div className="comparison-column" key={section.field}>
          <div className="comparison-column-title"><b>{section.label}</b><span>{previous.tokens[section.field].length} / {current.tokens[section.field].length} 档</span></div>
          {rows.map((row) => <ComparisonRow key={`${section.field}-${row.index}`} row={row} label={`${section.label} ${row.index + 1}`} />)}
        </div>
      })}
    </div>
  </div>
}

function ComparisonRow({ row, label }: { row: AlignedScaleValue; label: string }) {
  return <div className={`comparison-row ${row.status}`}><span>{label}</span><code>{row.left === undefined ? '—' : `${row.left}px`}</code><i>{row.status === 'changed' ? '→' : row.status === 'added' ? '+' : row.status === 'removed' ? '−' : '='}</i><code>{row.right === undefined ? '—' : `${row.right}px`}</code></div>
}
