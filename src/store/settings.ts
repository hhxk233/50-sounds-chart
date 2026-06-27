import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RomajiStyle } from '../types'

export type ThemePref = 'system' | 'light' | 'dark'

export interface SettingsState {
  optionCount: number // 4–6
  romajiStyle: RomajiStyle
  includeAudio: boolean // 是否出「读音」题型
  smartDistractors: boolean
  weightMistakes: boolean
  sound: boolean // 揭晓时自动发音
  theme: ThemePref
  // actions
  setOptionCount: (n: number) => void
  setRomajiStyle: (s: RomajiStyle) => void
  setIncludeAudio: (v: boolean) => void
  setSmart: (v: boolean) => void
  setWeightMistakes: (v: boolean) => void
  setSound: (v: boolean) => void
  setTheme: (t: ThemePref) => void
  reset: () => void
}

const DEFAULTS = {
  optionCount: 5,
  romajiStyle: 'hepburn' as RomajiStyle,
  includeAudio: true,
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
      setRomajiStyle: (romajiStyle) => set({ romajiStyle }),
      setIncludeAudio: (includeAudio) => set({ includeAudio }),
      setSmart: (smartDistractors) => set({ smartDistractors }),
      setWeightMistakes: (weightMistakes) => set({ weightMistakes }),
      setSound: (sound) => set({ sound }),
      setTheme: (theme) => set({ theme }),
      reset: () => set({ ...DEFAULTS }),
    }),
    {
      name: 'kana-trainer:settings',
      version: 2,
      // v1 → v2：去掉旧的 mode / enabledCategories / deckId，加入 romajiStyle / includeAudio。
      migrate: (persisted) => {
        const s = (persisted ?? {}) as Partial<SettingsState>
        return {
          ...DEFAULTS,
          optionCount: s.optionCount ?? DEFAULTS.optionCount,
          smartDistractors: s.smartDistractors ?? DEFAULTS.smartDistractors,
          weightMistakes: s.weightMistakes ?? DEFAULTS.weightMistakes,
          sound: s.sound ?? DEFAULTS.sound,
          theme: s.theme ?? DEFAULTS.theme,
        } as SettingsState
      },
      partialize: (s) => ({
        optionCount: s.optionCount,
        romajiStyle: s.romajiStyle,
        includeAudio: s.includeAudio,
        smartDistractors: s.smartDistractors,
        weightMistakes: s.weightMistakes,
        sound: s.sound,
        theme: s.theme,
      }),
    },
  ),
)
