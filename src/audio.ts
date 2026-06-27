import type { QuizCard } from './types'

/* 打包音频播放：把每个音的发音做成 public/audio/<slug>.mp3，离线播放，
   桌面 WebView2 / 安卓 WebView 都稳；失败再回退系统 TTS（如果有）。 */

const MACRON: Record<string, string> = { ā: 'aa', ī: 'ii', ū: 'uu', ē: 'ee', ō: 'oo' }

/** 文件名 slug（长音双写）。必须与生成脚本一致。 */
export function audioSlug(hepburn: string): string {
  let out = ''
  for (const ch of hepburn) out += MACRON[ch] ?? ch
  return out
}

export function audioUrlFromHepburn(hepburn: string): string {
  return `${import.meta.env.BASE_URL}audio/${audioSlug(hepburn)}.mp3`
}

let el: HTMLAudioElement | null = null

function speechFallback(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'ja-JP'
    u.rate = 0.9
    window.speechSynthesis.speak(u)
  } catch {
    /* ignore */
  }
}

/** 播放某个音：优先打包音频，失败回退 TTS。 */
export function playSound(hepburn: string, fallbackText: string) {
  if (typeof window === 'undefined') return
  try {
    if (!el) el = new Audio()
    el.src = audioUrlFromHepburn(hepburn)
    el.currentTime = 0
    const p = el.play() as Promise<void> | undefined
    if (p && typeof p.catch === 'function') p.catch(() => speechFallback(fallbackText))
  } catch {
    speechFallback(fallbackText)
  }
}

export function playCard(card: QuizCard) {
  playSound(card.romaji.hepburn, card.audioText)
}
