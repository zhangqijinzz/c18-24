import { scaleValue } from '../domain/brandRules'
import type { BrandTokens } from '../models/brandMirrorModels'

const componentNames = ['按钮', '输入框', '标签', '通知', '头像', '开关', '进度条', '选择器', '日期', '徽章', '卡片', '菜单', '分页', '工具提示', '筛选器', '上传', '骨架屏', '评价', '弹窗', '时间线']

export function ComponentGallery({ tokens }: { tokens: BrandTokens }) {
  return <section className="showcase-section"><div className="showcase-heading"><div><span className="eyebrow">02 / COMPONENTS</span><h2>组件样例</h2></div><span className="count-badge">{componentNames.length} 个响应中</span></div><div className="component-grid">{componentNames.map((name, index) => <ComponentCard key={name} name={name} index={index} tokens={tokens} />)}</div></section>
}

function ComponentCard({ name, index, tokens }: { name: string; index: number; tokens: BrandTokens }) {
  const variant = index % 4
  const radiusSm = scaleValue(tokens, 'radiusScale', 'sm')
  const radiusXs = scaleValue(tokens, 'radiusScale', 'xs')
  const radiusXl = scaleValue(tokens, 'radiusScale', 'xl')
  const gap = scaleValue(tokens, 'spacingScale', 'xs')
  return <article className="component-card"><div className="sample-meta"><span className="sample-index">{String(index + 1).padStart(2, '0')}</span><span>{name}</span></div><div className={`sample sample-${variant}`} style={{ gap }}>
    {variant === 0 && <><button style={{ background: tokens.primary, borderRadius: radiusSm }}>继续探索 <span>→</span></button><button className="ghost-button" style={{ borderRadius: radiusSm }}>次要操作</button></>}
    {variant === 1 && <><div className="fake-input" style={{ borderRadius: radiusXs }}>搜索品牌资产 <span>⌕</span></div><div className="tag-row" style={{ gap }}><span style={{ background: `${tokens.primary}18`, color: tokens.primary, borderRadius: radiusXl }}>进行中</span><span className="neutral-tag" style={{ borderRadius: radiusXl }}>设计系统</span></div></>}
    {variant === 2 && <><div className="avatar-row" style={{ gap }}><span className="avatar" style={{ background: tokens.secondary }}>BM</span><div><strong>BrandMirror</strong><small>刚刚更新视觉令牌</small></div><span className="more">•••</span></div><div className="mini-progress"><span style={{ background: tokens.primary, width: `${55 + index * 2}%` }} /></div></>}
    {variant === 3 && <><div className="toggle-row"><span>实时同步预览</span><span className="toggle" style={{ background: tokens.primary }}><i /></span></div><div className="metric-row"><strong style={{ color: tokens.secondary }}>{index + 8}.{index}</strong><span>一致性分</span></div></>}
  </div></article>
}
