import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { QuizMode } from '../types'
import { KANA_CATEGORIES, defaultDeck } from '../data/decks'

export type ThemePref = 'system' | 'light' | 'dark'

export interface SettingsState {
  deckId: string
  optionCount: number // 4–6
  mode: QuizMode // 'hiragana' | 'katakana' | 'romaji' | 'random'
  enabledCategories: string[]
  smartDistractors: boolean
  weightMistakes: boolean
  sound: boolean
  theme: ThemePref
  // actions
  setOptionCount: (n: number) => void
  setMode: (m: QuizMode) => void
  toggleCategory: (key: string) => void
  setSmart: (v: boolean) => void
  setWeightMistakes: (v: boolean) => void
  setSound: (v: boolean) => void
  setTheme: (t: ThemePref) => void
  reset: () => void
}

const DEFAULTS = {
  deckId: defaultDeck.id,
  optionCount: 5,
  mode: 'random' as QuizMode,
  enabledCategories: KANA_CATEGORIES.map((c) => c.key),
  smartDistractors: false,
  weightMistakes: true,
  sound: true,
  theme: 'system' as ThemePref,
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setOptionCount: (n) => set({ optionCount: Math.min(6, Math.max(4, Math.round(n))) }),
      setMode: (mode) => set({ mode }),
      toggleCategory: (key) =>
        set((s) => {
          const next = s.enabledCategories.includes(key)
            ? s.enabledCategories.filter((k) => k !== key)
            : [...s.enabledCategories, key]
          // 至少保留一类，避免空牌池
          return { enabledCategories: next.length ? next : s.enabledCategories }
        }),
      setSmart: (smartDistractors) => set({ smartDistractors }),
      setWeightMistakes: (weightMistakes) => set({ weightMistakes }),
      setSound: (sound) => set({ sound }),
      setTheme: (theme) => set({ theme }),
      reset: () => set({ ...DEFAULTS }),
    }),
    {
      name: 'kana-trainer:settings',
      version: 1,
      partialize: (s) => ({
        deckId: s.deckId,
        optionCount: s.optionCount,
        mode: s.mode,
        enabledCategories: s.enabledCategories,
        smartDistractors: s.smartDistractors,
        weightMistakes: s.weightMistakes,
        sound: s.sound,
        theme: s.theme,
      }),
    },
  ),
)
