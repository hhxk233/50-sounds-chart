import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 浏览器内置 Web Speech API（ja-JP）封装。免费、零音频文件。
 * 音色取决于系统/浏览器；找不到日语语音时仍尝试朗读（由系统兜底）。
 */
export function useSpeech() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const [hasJaVoice, setHasJaVoice] = useState(false)

  useEffect(() => {
    if (!supported) return
    const pick = () => {
      const voices = window.speechSynthesis.getVoices()
      const ja =
        voices.find((v) => v.lang === 'ja-JP') ?? voices.find((v) => v.lang.toLowerCase().startsWith('ja'))
      voiceRef.current = ja ?? null
      setHasJaVoice(Boolean(ja))
    }
    pick()
    window.speechSynthesis.addEventListener?.('voiceschanged', pick)
    return () => window.speechSynthesis.removeEventListener?.('voiceschanged', pick)
  }, [supported])

  const speak = useCallback(
    (text: string) => {
      if (!supported || !text) return
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'ja-JP'
      if (voiceRef.current) u.voice = voiceRef.current
      u.rate = 0.9
      window.speechSynthesis.speak(u)
    },
    [supported],
  )

  return { speak, supported, hasJaVoice }
}
