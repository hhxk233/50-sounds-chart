import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface MistakeRec {
  wrong: number
  total: number
  lastSeen: number // epoch ms
}

export interface ProgressState {
  mistakes: Record<string, MistakeRec>
  favorites: Record<string, number> // cardId -> 收藏时间戳
  totalAnswered: number
  totalCorrect: number
  record: (cardId: string, correct: boolean) => void
  toggleFavorite: (cardId: string) => void
  clearCard: (cardId: string) => void // 从复习里彻底移除（错题统计 + 收藏）
  resetAll: () => void
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      mistakes: {},
      favorites: {},
      totalAnswered: 0,
      totalCorrect: 0,
      record: (cardId, correct) =>
        set((s) => {
          const prev = s.mistakes[cardId] ?? { wrong: 0, total: 0, lastSeen: 0 }
          const rec: MistakeRec = {
            wrong: prev.wrong + (correct ? 0 : 1),
            total: prev.total + 1,
            lastSeen: Date.now(),
          }
          return {
            mistakes: { ...s.mistakes, [cardId]: rec },
            totalAnswered: s.totalAnswered + 1,
            totalCorrect: s.totalCorrect + (correct ? 1 : 0),
          }
        }),
      toggleFavorite: (cardId) =>
        set((s) => {
          const next = { ...s.favorites }
          if (next[cardId]) delete next[cardId]
          else next[cardId] = Date.now()
          return { favorites: next }
        }),
      clearCard: (cardId) =>
        set((s) => {
          const m = { ...s.mistakes }
          delete m[cardId]
          const f = { ...s.favorites }
          delete f[cardId]
          return { mistakes: m, favorites: f }
        }),
      resetAll: () => set({ mistakes: {}, favorites: {} }),
    }),
    {
      name: 'kana-trainer:progress',
      version: 2,
      // v1 → v2：新增 favorites
      migrate: (persisted) => {
        const s = (persisted ?? {}) as Partial<ProgressState>
        return {
          mistakes: s.mistakes ?? {},
          favorites: s.favorites ?? {},
          totalAnswered: s.totalAnswered ?? 0,
          totalCorrect: s.totalCorrect ?? 0,
        } as ProgressState
      },
      partialize: (s) => ({
        mistakes: s.mistakes,
        favorites: s.favorites,
        totalAnswered: s.totalAnswered,
        totalCorrect: s.totalCorrect,
      }),
    },
  ),
)

export interface ReviewItem {
  id: string
  wrong: number
  total: number
  lastSeen: number
  favorited: boolean
}

/** 复习列表：答错过(wrong>0) 或 已收藏的音，按错误次数→最近降序。 */
export function selectReviewList(s: ProgressState): ReviewItem[] {
  const ids = new Set<string>([
    ...Object.keys(s.mistakes).filter((id) => s.mistakes[id].wrong > 0),
    ...Object.keys(s.favorites),
  ])
  const recency = (id: string) => Math.max(s.mistakes[id]?.lastSeen ?? 0, s.favorites[id] ?? 0)
  return [...ids]
    .map((id) => ({
      id,
      wrong: s.mistakes[id]?.wrong ?? 0,
      total: s.mistakes[id]?.total ?? 0,
      lastSeen: s.mistakes[id]?.lastSeen ?? 0,
      favorited: id in s.favorites,
    }))
    .sort((a, b) => b.wrong - a.wrong || recency(b.id) - recency(a.id))
}

export function selectReviewCount(s: ProgressState): number {
  return new Set([
    ...Object.keys(s.mistakes).filter((id) => s.mistakes[id].wrong > 0),
    ...Object.keys(s.favorites),
  ]).size
}
