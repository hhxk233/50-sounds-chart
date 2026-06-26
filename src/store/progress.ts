import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface MistakeRec {
  wrong: number
  total: number
  lastSeen: number // epoch ms
}

export interface ProgressState {
  mistakes: Record<string, MistakeRec>
  totalAnswered: number
  totalCorrect: number
  /** 记录一次作答（按卡 id 累计 错误/总数）。 */
  record: (cardId: string, correct: boolean) => void
  /** 从错题本移除某卡（清零其错误统计）。 */
  clearCard: (cardId: string) => void
  resetAll: () => void
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      mistakes: {},
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
      clearCard: (cardId) =>
        set((s) => {
          if (!s.mistakes[cardId]) return s
          const next = { ...s.mistakes }
          delete next[cardId]
          return { mistakes: next }
        }),
      resetAll: () => set({ mistakes: {}, totalAnswered: 0, totalCorrect: 0 }),
    }),
    {
      name: 'kana-trainer:progress',
      version: 1,
      partialize: (s) => ({
        mistakes: s.mistakes,
        totalAnswered: s.totalAnswered,
        totalCorrect: s.totalCorrect,
      }),
    },
  ),
)

/** 选择器：错题（wrong>0）按错误次数降序。 */
export function selectMistakeList(s: ProgressState) {
  return Object.entries(s.mistakes)
    .filter(([, r]) => r.wrong > 0)
    .sort((a, b) => b[1].wrong - a[1].wrong || b[1].lastSeen - a[1].lastSeen)
    .map(([id, rec]) => ({ id, ...rec }))
}
