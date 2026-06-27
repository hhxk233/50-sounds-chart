import { describe, it, expect } from 'vitest'
import { examples } from './examples'
import { kanaItems } from './kana'

describe('例词数据完整性', () => {
  const hiraToKata = new Map(kanaItems.map((k) => [k.hiragana, k.katakana]))

  it('每个键都是真实存在的假名', () => {
    for (const key of Object.keys(examples)) {
      expect(hiraToKata.has(key)).toBe(true)
    }
  })

  it('例词确实包含该假名（平或片），且有中文意思', () => {
    for (const [key, ex] of Object.entries(examples)) {
      const kata = hiraToKata.get(key)!
      const contains = ex.word.includes(key) || ex.word.includes(kata)
      expect(contains, `「${ex.word}」应包含 ${key}/${kata}`).toBe(true)
      expect(ex.meaning.length).toBeGreaterThan(0)
    }
  })
})
