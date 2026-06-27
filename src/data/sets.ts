import type { KanaType } from '../types'
import { kanaItems } from './kana'
import { KANA_CATEGORIES } from './decks'

/* ============================================================
   练习「集合」：每一行单独练、各类综合练、全部综合。
   每个集合给几个合理的题量供选择。错题复习是动态集合，单独在 hook 里构建。
   ============================================================ */

export type SetKind = 'row' | 'category' | 'all'

export interface PracticeSet {
  id: string
  label: string
  sample: string // 该集合若干假名预览
  category: KanaType | 'all'
  kind: SetKind
  cardIds: string[]
  counts: number[]
}

function uniqSortCounts(arr: number[], cap: number): number[] {
  return Array.from(new Set(arr.map((n) => Math.min(n, cap))))
    .filter((n) => n > 0)
    .sort((a, b) => a - b)
}

function categoryCounts(m: number): number[] {
  if (m >= 40) return uniqSortCounts([20, 30, m], m)
  if (m >= 20) return uniqSortCounts([15, 20, m], m)
  if (m >= 10) return uniqSortCounts([10, m], m)
  return uniqSortCounts([m, 2 * m], 2 * m)
}

/** 行集合：按 (type, row) 顺序分组。 */
function buildRowSets(): PracticeSet[] {
  const order: string[] = []
  const groups = new Map<string, { type: KanaType; row: string; ids: string[]; kana: string[] }>()
  for (const k of kanaItems) {
    const key = `${k.type}@@${k.row}`
    if (!groups.has(key)) {
      groups.set(key, { type: k.type, row: k.row, ids: [], kana: [] })
      order.push(key)
    }
    const g = groups.get(key)!
    g.ids.push(k.id)
    g.kana.push(k.hiragana)
  }
  return order.map((key) => {
    const g = groups.get(key)!
    return {
      id: `row:${key}`,
      label: g.row,
      sample: g.kana.slice(0, 6).join(' '),
      category: g.type,
      kind: 'row' as const,
      cardIds: g.ids,
      counts: [10, 15, 20],
    }
  })
}

/** 各类综合集合。 */
function buildCategorySets(): PracticeSet[] {
  return KANA_CATEGORIES.map((cat) => {
    const ids = kanaItems.filter((k) => k.type === cat.key).map((k) => k.id)
    const kana = kanaItems.filter((k) => k.type === cat.key).map((k) => k.hiragana)
    return {
      id: `cat:${cat.key}`,
      label: `${cat.label}综合`,
      sample: kana.slice(0, 8).join(' '),
      category: cat.key as KanaType,
      kind: 'category' as const,
      cardIds: ids,
      counts: categoryCounts(ids.length),
    }
  }).filter((s) => s.cardIds.length > 0)
}

const allIds = kanaItems.map((k) => k.id)

export const allSet: PracticeSet = {
  id: 'all',
  label: '全部综合',
  sample: `${allIds.length} 个全部混合`,
  category: 'all',
  kind: 'all',
  cardIds: allIds,
  counts: uniqSortCounts([30, 50, 100], allIds.length).concat(
    allIds.length > 100 ? [allIds.length] : [],
  ),
}

export const rowSets: PracticeSet[] = buildRowSets()
export const categorySets: PracticeSet[] = buildCategorySets()

/** 行集合按大类分组，方便菜单渲染。 */
export function rowSetsByCategory(): { category: string; label: string; rows: PracticeSet[] }[] {
  return KANA_CATEGORIES.map((cat) => ({
    category: cat.key,
    label: cat.label,
    rows: rowSets.filter((s) => s.category === cat.key),
  })).filter((g) => g.rows.length > 0)
}

export function categorySetOf(cat: string): PracticeSet | undefined {
  return categorySets.find((s) => s.category === cat)
}
