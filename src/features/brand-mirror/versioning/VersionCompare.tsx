import { diffScaleTiers, type ScaleDiff as ScaleDiffModel, type ScaleTierDiff } from '../domain/scaleDiff'
import { scaleValue } from '../domain/brandRules'
import type { BrandMirrorSnapshot, BrandTokens } from '../models/brandMirrorModels'

export function VersionCompare({ snapshot, onSave, onToggle, onExport }: { snapshot: BrandMirrorSnapshot; onSave: () => void; onToggle: () => void; onExport: () => void }) {
  const versions = snapshot.versions.slice(-2)
  const hasCompare = versions.length === 2
  return <section className="version-section"><div className="showcase-heading"><div><span className="eyebrow">04 / VERSIONS</span><h2>版本对比</h2></div><div className="version-actions"><button className="export-button" type="button" onClick={onExport}>↓ 导出品牌规范</button><button className="secondary-button" type="button" onClick={onSave}>＋ 保存当前版本</button><button className="primary-button" type="button" disabled={!hasCompare} onClick={onToggle}>{snapshot.compareMode ? '退出对比' : '打开对比视图'} <span>↗</span></button></div></div>{hasCompare ? <><div className="version-cards">{versions.map((version) => <VersionCard key={version.id} label={version.label} tokens={version.tokens} active={snapshot.activeVersionId === version.id} />)}</div>{snapshot.compareMode && <ScaleDiffTable before={versions[0].tokens} after={versions[1].tokens} />}</> : <div className="version-empty"><div className="empty-icon">A/B</div><div><strong>保存两个版本，开始对照</strong><p>先保存当前状态作为 Version A，再调整令牌并保存 Version B。</p></div><span className="empty-arrow">→</span></div>}</section>
}

function VersionCard({ label, tokens, active }: { label: string; tokens: BrandTokens; active: boolean }) {
  const radiusMd = scaleValue(tokens, 'radiusScale', 'md')
  const radiusXs = scaleValue(tokens, 'radiusScale', 'xs')
  const radiusSm = scaleValue(tokens, 'radiusScale', 'sm')
  const bodyType = scaleValue(tokens, 'typeScale', 'sm')
  const previewGap = scaleValue(tokens, 'spacingScale', 'xs')
  return <div className={`version-card ${active ? 'active' : ''}`}><div className="version-card-head"><span>{label}</span><small>{active ? '当前版本' : '历史版本'}</small></div><div className="version-preview" style={{ background: tokens.secondary, borderRadius: radiusMd }}><div className="version-preview-top" style={{ background: tokens.primary }} /><div className="version-preview-copy" style={{ gap: previewGap }}><i /><i /><i /></div><span className="version-preview-button" style={{ background: tokens.primary, borderRadius: radiusXs }} /></div><div className="version-swatch-row"><span style={{ background: tokens.primary }} /><span style={{ background: tokens.secondary }} /><span>圆角 {radiusSm}px</span><span>字号 {bodyType}px</span></div></div>
}

const STATUS_LABEL: Record<ScaleTierDiff['status'], string> = {
  same: '一致',
  changed: '已调整',
  added: '新增档',
  removed: '已删除',
}

function ScaleDiffTable({ before, after }: { before: BrandTokens; after: BrandTokens }) {
  const diffs = diffScaleTiers(before, after)
  return <div className="scale-diff-panel">
    <div className="scale-diff-heading">
      <strong>层级逐档对照</strong>
      <span>按位置对齐（第 N 档 ↔ 第 N 档），层级数量变化时尾部标记新增 / 删除，不错位</span>
    </div>
    <div className="scale-diff-grid">
      {diffs.map((diff) => <ScaleDiffGroup key={diff.field} diff={diff} />)}
    </div>
  </div>
}

function ScaleDiffGroup({ diff }: { diff: ScaleDiffModel }) {
  return <div className="scale-diff-group">
    <div className="scale-diff-group-head"><span>{diff.label}</span><small>{diff.beforeCount} 档 → {diff.afterCount} 档</small></div>
    <div className="scale-diff-rows">
      {diff.tiers.map((tier) => (
        <div className={`scale-diff-row ${tier.status}`} key={tier.position}>
          <span className="scale-diff-position">第 {tier.position} 档</span>
          <span className="scale-diff-value">{tier.before === null ? '—' : `${tier.before}${diff.unit}`}</span>
          <span className="scale-diff-arrow">→</span>
          <span className="scale-diff-value">{tier.after === null ? '—' : `${tier.after}${diff.unit}`}</span>
          <span className="scale-diff-status">{STATUS_LABEL[tier.status]}</span>
        </div>
      ))}
    </div>
  </div>
}
