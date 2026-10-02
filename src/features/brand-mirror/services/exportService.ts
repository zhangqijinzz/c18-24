import type { BrandMirrorSnapshot, BrandTokens, ScaleField } from '../models/brandMirrorModels'

export interface BrandGuidelinesExporter {
  export(snapshot: BrandMirrorSnapshot): void
}

const SCALE_SECTIONS: { field: ScaleField; label: string }[] = [
  { field: 'radiusScale', label: '圆角尺度' },
  { field: 'spacingScale', label: '间距体系' },
  { field: 'typeScale', label: '字体比例' },
]

const SCALE_TOKEN_PREFIX: Record<ScaleField, string> = {
  radiusScale: 'radius',
  spacingScale: 'spacing',
  typeScale: 'type',
}

function formatScaleRows(tokens: BrandTokens, field: ScaleField): string {
  return tokens[field].map((value, index) => `- \`${SCALE_TOKEN_PREFIX[field]}.${index + 1}\`: ${value}px`).join('\n')
}

function formatScaleSections(tokens: BrandTokens): string {
  return SCALE_SECTIONS.map((section) => `## ${section.label}（${tokens[section.field].length} 档）\n\n${formatScaleRows(tokens, section.field)}`).join('\n\n')
}

function formatVersionScales(tokens: BrandTokens): string {
  return SCALE_SECTIONS.map((section) => `${section.label}（${tokens[section.field].length} 档）：${tokens[section.field].map((value) => `${value}px`).join(' / ')}`).join('<br />')
}

export function buildBrandGuidelinesMarkdown(snapshot: BrandMirrorSnapshot): string {
  const { tokens } = snapshot
  const versions = snapshot.versions.length === 0
    ? '- 暂无保存版本'
    : snapshot.versions.map((version) => `### ${version.label} · ${version.createdAt.slice(0, 10)}\n\n- 主色：\`${version.tokens.primary}\`\n- 辅助色：\`${version.tokens.secondary}\`\n- ${formatVersionScales(version.tokens)}`).join('\n\n')
  return `# BrandMirror 品牌规范\n\n> 导出时间：${new Date().toISOString().slice(0, 10)}\n> 当前主题：${snapshot.theme}\n\n## 品牌色\n\n| 令牌 | 值 |\n| --- | --- |\n| 主色 \`primary\` | \`${tokens.primary}\` |\n| 辅助色 \`secondary\` | \`${tokens.secondary}\` |\n| 对比度 | ${snapshot.contrastRatio.toFixed(1)}:1 |\n\n${formatScaleSections(tokens)}\n\n## 保存版本\n\n${versions}\n\n---\n由 BrandMirror 品牌视觉实验室生成。\n`
}

export class BrowserBrandGuidelinesExporter implements BrandGuidelinesExporter {
  export(snapshot: BrandMirrorSnapshot): void {
    const content = buildBrandGuidelinesMarkdown(snapshot)
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `BrandMirror-Brand-Guidelines-${new Date().toISOString().slice(0, 10)}.md`
    link.click()
    URL.revokeObjectURL(url)
  }
}
