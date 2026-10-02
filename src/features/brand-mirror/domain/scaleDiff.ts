import type { BrandTokens, ScaleField } from '../models/brandMirrorModels'
import { SCALE_FIELDS, SCALE_LIMITS } from '../models/brandMirrorModels'

export type ScaleTierStatus = 'same' | 'changed' | 'added' | 'removed'

export interface ScaleTierDiff {
  /** 从 1 开始的层级序号，始终代表“第 N 档”这一位置 */
  position: number
  before: number | null
  after: number | null
  status: ScaleTierStatus
}

export interface ScaleDiff {
  field: ScaleField
  label: string
  unit: string
  beforeCount: number
  afterCount: number
  tiers: ScaleTierDiff[]
}

/**
 * 按位置对齐两套层级：第 N 档对第 N 档，绝不做错位匹配。
 * 较长一侧多出来的尾部档位标记为 added / removed，旧版本层级数量不同也能正常对照。
 */
export function diffScaleTiers(before: BrandTokens, after: BrandTokens): ScaleDiff[] {
  return SCALE_FIELDS.map((field) => {
    const beforeValues = before[field]
    const afterValues = after[field]
    const rowCount = Math.max(beforeValues.length, afterValues.length)
    const tiers: ScaleTierDiff[] = Array.from({ length: rowCount }, (_, index) => {
      const left = beforeValues[index]
      const right = afterValues[index]
      const beforeValue = left === undefined ? null : left
      const afterValue = right === undefined ? null : right
      let status: ScaleTierStatus
      if (beforeValue === null) status = 'added'
      else if (afterValue === null) status = 'removed'
      else if (beforeValue !== afterValue) status = 'changed'
      else status = 'same'
      return { position: index + 1, before: beforeValue, after: afterValue, status }
    })
    return {
      field,
      label: SCALE_LIMITS[field].label,
      unit: SCALE_LIMITS[field].unit,
      beforeCount: beforeValues.length,
      afterCount: afterValues.length,
      tiers,
    }
  })
}
